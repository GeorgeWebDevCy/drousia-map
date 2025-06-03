document.addEventListener('DOMContentLoaded', function () {
  if (!gnMapData || !gnMapData.accessToken) return;

  mapboxgl.accessToken = gnMapData.accessToken;

  const debug = gnMapData.debug === true;
  const map = new mapboxgl.Map({
    container: 'gn-mapbox-map',
    style: 'mapbox://styles/mapbox/outdoors-v12',
    center: [33.4299, 35.1264],
    zoom: 13,
  });

  let userCoords = null;
  let destinationCoords = null;
  let elevationChart = null;

  // Debug Panel
  let debugPanel;
  if (debug) {
    debugPanel = document.createElement('div');
    debugPanel.id = 'gn-debug-panel';
    debugPanel.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      max-height: 35vh;
      max-width: 90vw;
      overflow-y: auto;
      background: rgba(0,0,0,0.85);
      color: #0f0;
      font-family: monospace;
      font-size: 11px;
      line-height: 1.4;
      padding: 8px 8px 32px;
      border-radius: 6px;
      z-index: 9999;
      white-space: pre-wrap;
    `;
    const clearBtn = document.createElement('button');
    clearBtn.innerText = 'Clear';
    clearBtn.style.cssText = `
      position: absolute;
      bottom: 5px;
      right: 8px;
      font-size: 10px;
      padding: 2px 6px;
      background: #222;
      color: #0f0;
      border: 1px solid #444;
      border-radius: 4px;
      cursor: pointer;
    `;
    clearBtn.onclick = () => debugPanel.textContent = '';
    debugPanel.appendChild(clearBtn);
    document.getElementById('gn-mapbox-map').appendChild(debugPanel);
  }

  const log = (...args) => {
    const msg = '[GN DEBUG] ' + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ');
    if (debugPanel) debugPanel.textContent += msg + '\n';
    console.log(...args);
  };

  const directions = new MapboxDirections({
    accessToken: mapboxgl.accessToken,
    unit: 'metric',
    profile: 'mapbox/driving',
    controls: { instructions: true, inputs: false }
  });

  map.addControl(new mapboxgl.NavigationControl());
  map.addControl(directions, 'top-left');

  // Navigation Panel (bottom-left)
  const ui = document.createElement('div');
  ui.className = 'navigation-ui';
  ui.style.cssText = `
    position: absolute;
    bottom: 10px;
    left: 10px;
    background: white;
    padding: 12px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 9998;
    font-size: 14px;
    max-width: 90vw;
  `;
  ui.innerHTML = `
    <strong>Navigate to Destination</strong><br>
    <label for="nav-mode">Mode:</label>
    <select id="nav-mode">
      <option value="driving">Driving</option>
      <option value="walking">Walking</option>
      <option value="cycling">Cycling</option>
    </select><br>
    <button id="start-navigation" disabled>Start Navigation</button>
    <div><canvas id="elevation-chart" style="margin-top:10px; max-height:200px;"></canvas></div>
  `;
  map.getContainer().appendChild(ui);

  // Markers
  gnMapData.locations.forEach(loc => {
    const popupHTML = `
      <div class="popup-content">
        ${loc.image ? `<img src="${loc.image}" alt="${loc.title}">` : ''}
        <h3>${loc.title}</h3>
        <div>${loc.content}</div>
        <button class="select-destination" data-lng="${loc.lng}" data-lat="${loc.lat}">Navigate Here</button>
      </div>
    `;
    const popup = new mapboxgl.Popup().setHTML(popupHTML);
    new mapboxgl.Marker().setLngLat([loc.lng, loc.lat]).setPopup(popup).addTo(map);
    log('Marker added:', loc.title, [loc.lng, loc.lat]);
  });

  // Set destination
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('select-destination')) {
      destinationCoords = [
        parseFloat(e.target.dataset.lng),
        parseFloat(e.target.dataset.lat)
      ];
      document.getElementById('start-navigation').disabled = false;
      log('Destination selected:', destinationCoords);
    }
  });

  // Start navigation
  document.addEventListener('click', function (e) {
    if (e.target.id === 'start-navigation') {
      if (!userCoords || !destinationCoords) return;
      const mode = document.getElementById('nav-mode').value;

      directions.removeRoutes();
      directions.setProfile(`mapbox/${mode}`);
      directions.setOrigin(userCoords);
      directions.setDestination(destinationCoords);

      log('Navigation started', { mode, from: userCoords, to: destinationCoords });
    }
  });

  // Load-safe geolocation + elevation
  map.on('load', () => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        pos => {
          userCoords = [pos.coords.longitude, pos.coords.latitude];
          log('Geolocation updated:', userCoords);

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
    }

    directions.on('route', async (e) => {
      const steps = e.route?.[0]?.legs?.[0]?.steps;
      if (steps?.length) {
        speak(steps[0].maneuver.instruction);
        log('First instruction:', steps[0].maneuver.instruction);
      }

      const coords = e.route?.[0]?.geometry?.coordinates || [];
      if (coords.length) {
        const elevation = await fetchElevation(coords);
        renderElevationChart(elevation);
      }
    });
  });

  function speak(text) {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.cancel();
      speechSynthesis.speak(utterance);
      log('Voice instruction:', text);
    }
  }

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
        log('Elevation error:', err);
        results.push({ distance: i, elevation: 0 });
      }
    }

    const end = performance.now();
    const min = Math.min(...results.map(r => r.elevation));
    const max = Math.max(...results.map(r => r.elevation));
    log(`Elevation: ${results.length} points in ${(end - start).toFixed(0)}ms`);
    log(`Min: ${min.toFixed(1)}m, Max: ${max.toFixed(1)}m, Gain: ${(max - min).toFixed(1)}m`);
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
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) +
      1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
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