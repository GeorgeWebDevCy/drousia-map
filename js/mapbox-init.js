mapboxgl.accessToken = gnMapData.accessToken;
const map = new mapboxgl.Map({
  container: 'gn-mapbox-map',
  style: 'mapbox://styles/mapbox/streets-v11',
  center: [33.3736, 35.0364],
  zoom: 13
});

const debug = gnMapData.debug;
let userCoords = null;
let destinationCoords = null;
let debugPanel;

if (debug) {
  debugPanel = document.createElement('div');
  debugPanel.id = 'gn-debug-panel';
  debugPanel.style.cssText = `
    position: absolute; bottom: 10px; left: 10px;
    max-height: 30vh; max-width: 45vw;
    overflow-y: auto; background: rgba(0,0,0,0.85);
    color: #0f0; font-family: monospace; font-size: 11px;
    padding: 8px 8px 32px; border-radius: 6px;
    z-index: 9999; white-space: pre-wrap;
  `;
  const clearBtn = document.createElement('button');
  clearBtn.innerText = 'Clear';
  clearBtn.style.cssText = `
    position: absolute; bottom: 5px; right: 8px;
    font-size: 10px; padding: 2px 6px;
    background: #222; color: #0f0; border: 1px solid #444;
    border-radius: 4px; cursor: pointer;
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

// Navigation UI
const navUI = document.createElement('div');
navUI.className = 'navigation-ui';
navUI.innerHTML = `
  <label for="nav-mode">Mode:</label>
  <select id="nav-mode">
    <option value="walking">🚶 Walking</option>
    <option value="cycling">🚴 Cycling</option>
    <option value="driving">🚗 Driving</option>
  </select>
  <button id="start-navigation">Start Navigation</button>
  <div><canvas id="elevation-chart" width="300" height="150"></canvas></div>
`;
map.getContainer().appendChild(navUI);

const directions = new MapboxDirections({
  accessToken: mapboxgl.accessToken,
  unit: 'metric',
  profile: 'mapbox/walking',
  controls: { inputs: false, instructions: true }
});
map.addControl(directions, 'top-left');

if (navigator.geolocation) {
  navigator.geolocation.watchPosition(pos => {
    userCoords = [pos.coords.longitude, pos.coords.latitude];
    const userMarker = new mapboxgl.Marker({ color: '#007cbf' }).setLngLat(userCoords).addTo(map);
    log('Geolocation updated', userCoords);
  }, err => log('Geolocation error', err.message));
}

gnMapData.locations.forEach(loc => {
  const el = document.createElement('div');
  el.className = 'marker';
  const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
    <div class="popup-content">
      ${loc.image ? `<img src="${loc.image}" alt="">` : ''}
      <h3>${loc.title}</h3>
      ${loc.content}
      <button class="select-destination" data-lat="${loc.lat}" data-lng="${loc.lng}">Navigate Here</button>
    </div>
  `);
  new mapboxgl.Marker(el).setLngLat([loc.lng, loc.lat]).setPopup(popup).addTo(map);
});

document.addEventListener('click', function (e) {
  if (e.target.classList.contains('select-destination')) {
    const lat = parseFloat(e.target.dataset.lat);
    const lng = parseFloat(e.target.dataset.lng);
    destinationCoords = [lng, lat];
    log('Selected destination:', destinationCoords);
  }
  if (e.target.id === 'start-navigation') {
    if (!userCoords || !destinationCoords) return;
    const mode = document.getElementById('nav-mode').value;
    directions.removeRoutes(); // prevent route accumulation
    directions.setProfile(`mapbox/${mode}`);
    directions.setOrigin(userCoords);
    directions.setDestination(destinationCoords);
    log('Starting navigation', { mode, from: userCoords, to: destinationCoords });

    fetch(`https://api.mapbox.com/directions/v5/mapbox/${mode}/${userCoords[0]},${userCoords[1]};${destinationCoords[0]},${destinationCoords[1]}?geometries=geojson&steps=true&access_token=${mapboxgl.accessToken}`)
      .then(res => res.json())
      .then(data => {
        const steps = data.routes[0].legs[0].steps.map(s => s.maneuver.instruction);
        const synth = window.speechSynthesis;
        log('Voice navigation steps:', steps);
        steps.forEach((step, i) => setTimeout(() => {
          const utter = new SpeechSynthesisUtterance(step);
          synth.speak(utter);
        }, i * 3000));
        drawElevation(data.routes[0].geometry.coordinates);
      });
  }
});

function drawElevation(coords) {
  const elevationURL = `https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/${coords[0][0]},${coords[0][1]}.json?layers=contour&limit=50&access_token=${mapboxgl.accessToken}`;
  fetch(elevationURL)
    .then(res => res.json())
    .then(data => {
      const elevations = coords.map((c, i) => ({
        x: i,
        y: data.features[i % data.features.length]?.properties.ele || 0
      }));
      new Chart(document.getElementById('elevation-chart'), {
        type: 'line',
        data: {
          labels: elevations.map(p => p.x),
          datasets: [{
            label: 'Elevation (m)',
            data: elevations.map(p => p.y),
            borderColor: 'rgba(255,99,132,1)',
            backgroundColor: 'rgba(255,99,132,0.2)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: { title: { display: true, text: 'Elevation (m)' } }
          }
        }
      });
      log('Elevation data plotted.');
    })
    .catch(err => log('Elevation fetch error', err));
}
