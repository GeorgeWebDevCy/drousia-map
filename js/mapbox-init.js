// Full JS for GN Mapbox Plugin with Routing + Elevation Chart + Canvas Injection

let elevationChart;

function getElevationFromRGB(r, g, b) {
  return -10000 + ((r * 256 * 256 + g * 256 + b) * 0.1);
}

async function getElevationAtPoint(lng, lat, zoom = 15) {
  const TILE_SIZE = 512;
  const accessToken = mapboxgl.accessToken;
  const lngRad = lng * Math.PI / 180;
  const n = Math.pow(2, zoom);
  const x = Math.floor(n * ((lng + 180) / 360));
  const y = Math.floor(n * (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2);
  const px = TILE_SIZE * (n * ((lng + 180) / 360) - x);
  const py = TILE_SIZE * (n * (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 - y);
  const url = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${zoom}/${x}/${y}@2x.pngraw?access_token=${accessToken}`;
  const img = new Image();
  img.crossOrigin = "Anonymous";

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = TILE_SIZE;
      canvas.height = TILE_SIZE;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(Math.floor(px), Math.floor(py), 1, 1).data;
      resolve(getElevationFromRGB(data[0], data[1], data[2]));
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function renderElevationProfile(coords) {
  const samples = coords.filter((_, i) => i % 10 === 0);
  const elevations = [];
  for (const coord of samples) {
    const [lng, lat] = coord;
    const elevation = await getElevationAtPoint(lng, lat);
    elevations.push(elevation);
  }

  let chartContainer = document.getElementById('gn-elevation-container');
  if (!chartContainer) {
    chartContainer = document.createElement('div');
    chartContainer.id = 'gn-elevation-container';
    chartContainer.innerHTML = '<canvas id="elevation-chart" style="width:100%;max-width:1000px;margin:30px auto;display:block;"></canvas>';
    document.body.appendChild(chartContainer);
  }

  const ctx = document.getElementById('elevation-chart').getContext('2d');
  if (elevationChart) elevationChart.destroy();

  elevationChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: elevations.map((_, i) => `${i * 10}m`),
      datasets: [{
        label: 'Elevation (m)',
        data: elevations,
        borderColor: '#28a745',
        fill: true,
        backgroundColor: 'rgba(40,167,69,0.2)',
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      scales: {
        x: { title: { display: true, text: 'Distance (approx)' } },
        y: { title: { display: true, text: 'Elevation (m)' } }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  mapboxgl.accessToken = gnMapData.accessToken;

  const map = new mapboxgl.Map({
    container: 'gn-mapbox-map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [32.3923713, 34.96211],
    zoom: 16
  });

  const routeCoords = gnMapData.locations.map(loc => [loc.lng, loc.lat]);

  map.on('load', () => {
    map.addSource('route', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: routeCoords } }
    });

    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#ff0000', 'line-width': 4 }
    });

    gnMapData.locations.forEach(loc => {
      const popupHTML = `
        <div class="popup-content">
          <h3>${loc.title}</h3>
          ${loc.image ? `<a href="${loc.image}" class="lightbox"><img src="${loc.image}" alt="${loc.title}"></a>` : ''}
          ${loc.content}
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupHTML);

      const marker = new mapboxgl.Marker()
        .setLngLat([loc.lng, loc.lat])
        .setPopup(popup)
        .addTo(map);

      marker.getElement().addEventListener('click', () => {
        map.flyTo({ center: [loc.lng, loc.lat], zoom: 17 });
      });
    });

    const finalPoint = gnMapData.locations[gnMapData.locations.length - 1];
    const finalLng = finalPoint.lng;
    const finalLat = finalPoint.lat;

    const navUI = document.createElement('div');
    navUI.id = 'gn-nav-ui';
    navUI.style.cssText = `
      position: absolute; bottom: 20px; left: 20px;
      background: white; padding: 15px; border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3); z-index: 999;
      font-family: Arial, sans-serif;
    `;
    navUI.innerHTML = `
      <strong>Navigate to Destination</strong><br>
      <label>Mode:
        <select id="gn-travel-mode">
          <option value="driving">Driving</option>
          <option value="walking">Walking</option>
          <option value="cycling">Cycling</option>
        </select>
      </label><br><br>
      <button id="gn-start-nav" style="padding:6px 12px;">Start Navigation</button>
      <div id="gn-nav-info" style="margin-top:10px;"></div>
    `;
    document.body.appendChild(navUI);

    map.addSource('live-route', {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
    });

    map.addLayer({
      id: 'live-route-layer',
      type: 'line',
      source: 'live-route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#0000ff', 'line-width': 5, 'line-opacity': 0.7 }
    });

    let userMarker = null;

    document.getElementById('gn-start-nav').addEventListener('click', () => {
      const mode = document.getElementById('gn-travel-mode').value;

      if (!navigator.geolocation) {
        alert("Geolocation not supported.");
        return;
      }

      navigator.geolocation.getCurrentPosition(pos => {
        const userLng = pos.coords.longitude;
        const userLat = pos.coords.latitude;

        if (!userMarker) {
          userMarker = new mapboxgl.Marker({ color: 'blue' })
            .setLngLat([userLng, userLat])
            .setPopup(new mapboxgl.Popup().setText('Your Location'))
            .addTo(map);
        } else {
          userMarker.setLngLat([userLng, userLat]);
        }

        const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${userLng},${userLat};${finalLng},${finalLat}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

        fetch(directionsUrl)
          .then(res => res.json())
          .then(data => {
            if (!data.routes || !data.routes.length) {
              document.getElementById('gn-nav-info').innerText = 'Route not found.';
              return;
            }

            const route = data.routes[0].geometry;
            const distKm = data.routes[0].distance / 1000;
            const durationMin = Math.round(data.routes[0].duration / 60);
            const eta = new Date(Date.now() + data.routes[0].duration * 1000);
            const etaStr = eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            map.getSource('live-route').setData({ type: 'Feature', geometry: route });

            document.getElementById('gn-nav-info').innerHTML = `
              <strong>Distance:</strong> ${distKm.toFixed(2)} km<br>
              <strong>Time Remaining:</strong> ${durationMin} min<br>
              <strong>ETA:</strong> ${etaStr}
            `;

            map.flyTo({ center: [userLng, userLat], zoom: 15 });
            renderElevationProfile(route.coordinates);
          });
      }, err => {
        console.error("Geolocation error:", err);
        document.getElementById('gn-nav-info').innerText = "Location error.";
      });
    });
  });
});

document.addEventListener('click', function (e) {
  if (e.target.closest('.lightbox')) {
    e.preventDefault();
    const imageUrl = e.target.closest('a').getAttribute('href');
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; z-index: 99999; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center;
    `;
    overlay.innerHTML = `<img src="${imageUrl}" style="max-width: 90vw; max-height: 90vh; border-radius: 6px; box-shadow: 0 0 20px black;">`;
    overlay.addEventListener('click', () => document.body.removeChild(overlay));
    document.body.appendChild(overlay);
  }
});