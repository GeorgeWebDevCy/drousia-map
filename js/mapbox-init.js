document.addEventListener('DOMContentLoaded', function () {
  if (!gnMapData || !gnMapData.accessToken) return;

  mapboxgl.accessToken = gnMapData.accessToken;

  const map = new mapboxgl.Map({
    container: 'gn-mapbox-map',
    style: 'mapbox://styles/mapbox/outdoors-v12',
    center: [33.4299, 35.1264], // Default: Cyprus
    zoom: 8,
  });

  const debug = gnMapData.debug === true;
  const log = (...args) => {
    if (debug) console.log('[GN MAPBOX DEBUG]:', ...args);
  };

  const directions = new MapboxDirections({
    accessToken: mapboxgl.accessToken,
    unit: 'metric',
    profile: 'mapbox/driving',
    controls: { instructions: true, inputs: false }
  });

  map.addControl(new mapboxgl.NavigationControl());
  map.addControl(directions, 'top-left');

  let userCoords = null;
  let destinationCoords = null;
  let elevationChart = null;

  function speak(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
      log('Voice:', text);
    }
  }

  function createNavigationUI() {
    const ui = document.createElement('div');
    ui.className = 'navigation-ui';
    ui.innerHTML = `
      <strong>Navigate to Destination</strong><br>
      <label for="nav-mode">Mode:</label>
      <select id="nav-mode">
        <option value="driving">Driving</option>
        <option value="walking">Walking</option>
        <option value="cycling">Cycling</option>
      </select><br>
      <button id="start-navigation" disabled>Start Navigation</button>
    `;
    map.getContainer().appendChild(ui);
  }

  function setupElevationContainer() {
    const container = document.createElement('div');
    container.innerHTML = `<canvas id="elevation-chart" style="width:100%;max-height:250px;margin-top:10px;"></canvas>`;
    document.getElementById('gn-mapbox-map').after(container);
  }

  createNavigationUI();
  setupElevationContainer();

  // Geolocation tracking
  navigator.geolocation.watchPosition(
    pos => {
      userCoords = [pos.coords.longitude, pos.coords.latitude];
      log('Geolocation update:', userCoords);

      if (!map.getSource('user-location')) {
        map.addSource('user-location', {
          type: 'geojson',
          data: {
            type: 'Point',
            coordinates: userCoords
          }
        });
        map.addLayer({
          id: 'user-location',
          type: 'circle',
          source: 'user-location',
          paint: {
            'circle-radius': 6,
            'circle-color': '#007cbf'
          }
        });
      } else {
        map.getSource('user-location').setData({
          type: 'Point',
          coordinates: userCoords
        });
      }
    },
    err => log('Geolocation error:', err),
    { enableHighAccuracy: true }
  );

  // Add CPT markers
  gnMapData.locations.forEach(loc => {
    log('Adding marker:', loc.title, [loc.lng, loc.lat]);
    const html = `
      <div class="popup-content">
        ${loc.image ? `<img src="${loc.image}" alt="${loc.title}">` : ''}
        <h3>${loc.title}</h3>
        <div>${loc.content}</div>
        <button class="select-destination" data-lng="${loc.lng}" data-lat="${loc.lat}">Navigate Here</button>
      </div>`;
    new mapboxgl.Marker()
      .setLngLat([loc.lng, loc.lat])
      .setPopup(new mapboxgl.Popup().setHTML(html))
      .addTo(map);
  });

  // Destination button logic
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('select-destination')) {
      const lng = parseFloat(e.target.dataset.lng);
      const lat = parseFloat(e.target.dataset.lat);
      destinationCoords = [lng, lat];
      document.getElementById('start-navigation').disabled = false;
      log('Destination selected:', destinationCoords);
    }
  });

  // Start navigation button
  document.addEventListener('click', function (e) {
    if (e.target.id === 'start-navigation') {
      if (!userCoords || !destinationCoords) return;
      const mode = document.getElementById('nav-mode').value;
      directions.setProfile(`mapbox/${mode}`);
      directions.setOrigin(userCoords);
      directions.setDestination(destinationCoords);
      log('Starting navigation', { mode, from: userCoords, to: destinationCoords });
    }
  });

  // Handle route instructions and elevation
  directions.on('route', async (e) => {
    const route = e.route?.[0];
    if (!route) return;

    const steps = route.legs[0].steps;
    speak(`Starting navigation. ${steps[0]?.maneuver?.instruction}`);
    log('Route steps:', steps);

    const coords = route.geometry.coordinates;
    const elevation = await fetchElevation(coords);
    renderElevationChart(elevation);
  });

  // Fetch elevation using Mapbox Terrain-RGB tiles
  async function fetchElevation(coords) {
    const samples = coords.filter((_, i) => i % Math.ceil(coords.length / 200) === 0);
    const results = [];

    const start = performance.now();
    for (let i = 0; i < samples.length; i++) {
      const [lng, lat] = samples[i];
      const z = 14;
      const tile = pointToTile(lng, lat, z);
      const px = longLatToPixelXY(lng, lat, z);
      const url = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${z}/${tile.x}/${tile.y}@2x.pngraw?access_token=${mapboxgl.accessToken}`;

      try {
        const img = await loadImage(url);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(px.x % 512, px.y % 512, 1, 1).data;
        const elevation = -10000 + ((data[0] * 256 * 256 + data[1] * 256 + data[2]) * 0.1);
        results.push({ distance: i, elevation });
      } catch (err) {
        log('Elevation image load error:', err);
        results.push({ distance: i, elevation: 0 });
      }
    }
    const end = performance.now();
    const min = Math.min(...results.map(e => e.elevation));
    const max = Math.max(...results.map(e => e.elevation));
    log(`Elevation fetch complete (${results.length} points) in ${Math.round(end - start)}ms`);
    log(`Elevation stats: min=${min.toFixed(1)}m, max=${max.toFixed(1)}m, gain=${(max - min).toFixed(1)}m`);
    return results;
  }

  function renderElevationChart(data) {
    const ctx = document.getElementById('elevation-chart').getContext('2d');
    const labels = data.map(d => d.distance);
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
          backgroundColor: 'rgba(62,149,205,0.2)',
          tension: 0.3,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: false }
        }
      }
    });
    log('Elevation chart rendered.');
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
