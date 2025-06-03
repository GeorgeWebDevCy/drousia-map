document.addEventListener('DOMContentLoaded', function () {
  if (!gnMapData || !gnMapData.accessToken) return;

  mapboxgl.accessToken = gnMapData.accessToken;

  const map = new mapboxgl.Map({
    container: 'gn-mapbox-map',
    style: 'mapbox://styles/mapbox/outdoors-v12',
    center: [33.429859, 35.126413],
    zoom: 8,
  });

  map.addControl(new mapboxgl.NavigationControl());

  let destinationCoords = null;
  let userCoords = null;
  let elevationChart = null;

  const directions = new MapboxDirections({
    accessToken: mapboxgl.accessToken,
    unit: 'metric',
    profile: 'mapbox/driving',
    controls: { instructions: true, inputs: false },
  });
  map.addControl(directions, 'top-left');

  function speak(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
    }
  }

  function createUI() {
    const navBox = document.createElement('div');
    navBox.className = 'navigation-ui';
    navBox.innerHTML = `
      <strong>Navigate to Destination</strong><br>
      <label for="nav-mode">Mode:</label>
      <select id="nav-mode">
        <option value="driving">Driving</option>
        <option value="walking">Walking</option>
        <option value="cycling">Cycling</option>
      </select><br>
      <button id="start-navigation" disabled>Start Navigation</button>
    `;
    map.getContainer().appendChild(navBox);

    const chartContainer = document.createElement('div');
    chartContainer.innerHTML = `<canvas id="elevation-chart" style="width:100%;max-height:250px;margin-top:10px;"></canvas>`;
    document.getElementById('gn-mapbox-map').after(chartContainer);
  }

  createUI();

  navigator.geolocation.watchPosition(
    pos => {
      userCoords = [pos.coords.longitude, pos.coords.latitude];
      if (!map.getSource('user-location')) {
        map.addSource('user-location', {
          type: 'geojson',
          data: {
            type: 'Point',
            coordinates: userCoords,
          },
        });
        map.addLayer({
          id: 'user-location',
          type: 'circle',
          source: 'user-location',
          paint: {
            'circle-radius': 6,
            'circle-color': '#007cbf',
          },
        });
      } else {
        map.getSource('user-location').setData({
          type: 'Point',
          coordinates: userCoords,
        });
      }
    },
    err => console.warn('Geolocation error:', err),
    { enableHighAccuracy: true }
  );

  gnMapData.locations.forEach(loc => {
    const popupHTML = `
      <div class="popup-content">
        <h3>${loc.title}</h3>
        ${loc.image ? `<img src="${loc.image}" alt="${loc.title}">` : ''}
        <div>${loc.content}</div>
        <button class="select-destination" data-lng="${loc.lng}" data-lat="${loc.lat}">Navigate Here</button>
      </div>
    `;
    const popup = new mapboxgl.Popup().setHTML(popupHTML);
    new mapboxgl.Marker().setLngLat([loc.lng, loc.lat]).setPopup(popup).addTo(map);
  });

  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('select-destination')) {
      destinationCoords = [parseFloat(e.target.dataset.lng), parseFloat(e.target.dataset.lat)];
      document.getElementById('start-navigation').disabled = false;
    }
  });

  document.addEventListener('click', function (e) {
    if (e.target.id === 'start-navigation') {
      if (!userCoords || !destinationCoords) return;
      const mode = document.getElementById('nav-mode').value;
      directions.setProfile(`mapbox/${mode}`);
      directions.setOrigin(userCoords);
      directions.setDestination(destinationCoords);
    }
  });

  directions.on('route', async (e) => {
    const steps = e.route?.[0]?.legs?.[0]?.steps;
    if (steps?.length) {
      speak(`Starting route. First: ${steps[0].maneuver.instruction}`);
    }

    const coords = e.route?.[0]?.geometry?.coordinates || [];
    if (coords.length > 0) {
      const elevation = await fetchElevation(coords);
      renderElevationChart(elevation);
    }
  });

  // Fetch elevation using Mapbox Terrain-RGB tiles
  async function fetchElevation(coords) {
    const samples = coords.filter((_, i) => i % Math.ceil(coords.length / 200) === 0); // 200 max points
    const results = [];

    for (let i = 0; i < samples.length; i++) {
      const [lng, lat] = samples[i];
      const z = 14;
      const tileSize = 512;
      const tile = pointToTile(lng, lat, z);
      const px = longLatToPixelXY(lng, lat, z);

      const url = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${z}/${tile.x}/${tile.y}@2x.pngraw?access_token=${mapboxgl.accessToken}`;
      const img = await loadImage(url);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = tileSize;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(px.x % tileSize, px.y % tileSize, 1, 1).data;
      const elevation = -10000 + ((data[0] * 256 * 256 + data[1] * 256 + data[2]) * 0.1);
      results.push({ dist: i, elevation });
    }

    return results;
  }

  function renderElevationChart(data) {
    const ctx = document.getElementById('elevation-chart').getContext('2d');
    const labels = data.map((d, i) => `${i} km`);
    const values = data.map(d => d.elevation.toFixed(1));

    if (elevationChart) elevationChart.destroy();

    elevationChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Elevation (m)',
          data: values,
          borderColor: '#3e95cd',
          fill: true,
          tension: 0.3,
          backgroundColor: 'rgba(62, 149, 205, 0.2)',
          pointRadius: 0,
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: false },
        }
      }
    });
  }

  function pointToTile(lon, lat, z) {
    const x = Math.floor(((lon + 180) / 360) * Math.pow(2, z));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
    return { x, y };
  }

  function longLatToPixelXY(lon, lat, zoom) {
    const sinLat = Math.sin(lat * Math.PI / 180);
    const pixelX = ((lon + 180) / 360) * 512 * Math.pow(2, zoom);
    const pixelY = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * 512 * Math.pow(2, zoom);
    return { x: Math.floor(pixelX), y: Math.floor(pixelY) };
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
});