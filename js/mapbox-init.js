document.addEventListener("DOMContentLoaded", function () {
  if (!document.getElementById("gn-mapbox-map")) return;
  mapboxgl.accessToken = gnMapData.accessToken;
  const debugEnabled = gnMapData.debug === true;

  let coords = [];

  function log(...args) {
    if (debugEnabled) {
      const logContainer = document.getElementById("gn-debug-log");
      const timestamp = new Date().toLocaleTimeString();
      const msg = `[${timestamp}] ${args.map(String).join(" ")}`;
      if (logContainer) {
        const div = document.createElement("div");
        div.textContent = msg;
        logContainer.appendChild(div);
        logContainer.scrollTop = logContainer.scrollHeight;
      }
    }
    console.log(...args);
  }

  function setupDebugPanel() {
    if (!debugEnabled || document.getElementById("gn-debug-panel")) return;
    const panel = document.createElement("div");
    panel.id = "gn-debug-panel";
    panel.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      z-index: 9999;
      background: rgba(0,0,0,0.85);
      color: #0f0;
      font-family: monospace;
      font-size: 12px;
      max-height: 40vh;
      width: 300px;
      overflow-y: auto;
      border: 1px solid #0f0;
      padding: 10px;
    `;

    const clearBtn = document.createElement("button");
    clearBtn.textContent = "Clear";
    clearBtn.style.cssText = `
      display: block;
      margin-bottom: 10px;
      background: #222;
      color: #0f0;
      border: 1px solid #0f0;
      cursor: pointer;
    `;
    clearBtn.onclick = () => {
      const logContainer = document.getElementById("gn-debug-log");
      if (logContainer) logContainer.innerHTML = "";
    };

    const logContainer = document.createElement("div");
    logContainer.id = "gn-debug-log";
    logContainer.style.overflowY = "auto";
    logContainer.style.maxHeight = "30vh";

    panel.appendChild(clearBtn);
    panel.appendChild(logContainer);
    document.body.appendChild(panel);
  }

  function setupNavPanel() {
    const navPanel = document.createElement("div");
    navPanel.id = "gn-nav-panel";
    navPanel.innerHTML = `
      <div style="cursor: move; background: #333; color: #fff; padding: 6px;">☰ Navigation Panel</div>
      <div style="padding: 10px; background: white;">
        <button class="gn-nav-btn" onclick="setMode('driving')">Driving</button>
        <button class="gn-nav-btn" onclick="setMode('walking')">Walking</button>
        <button class="gn-nav-btn" onclick="setMode('cycling')">Cycling</button>
        <button class="gn-nav-btn" id="gn-start-nav">Start Navigation</button>
      </div>
    `;
    navPanel.style.cssText = `
      position: fixed;
      top: 100px;
      left: 10px;
      width: 200px;
      z-index: 9998;
      border: 1px solid #ccc;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      background: #fff;
      font-family: sans-serif;
    `;
    document.body.appendChild(navPanel);

    const header = navPanel.querySelector("div");
    header.onmousedown = function (e) {
      e.preventDefault();
      let shiftX = e.clientX - navPanel.getBoundingClientRect().left;
      let shiftY = e.clientY - navPanel.getBoundingClientRect().top;

      function moveAt(pageX, pageY) {
        navPanel.style.left = pageX - shiftX + "px";
        navPanel.style.top = pageY - shiftY + "px";
      }

      function onMouseMove(e) {
        moveAt(e.pageX, e.pageY);
      }

      document.addEventListener("mousemove", onMouseMove);
      document.onmouseup = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.onmouseup = null;
      };
    };
    header.ondragstart = () => false;

    document.getElementById("gn-start-nav").onclick = startNavigation;
  }

  window.setMode = function (mode) {
    log("Navigation mode set to:", mode);
  };

  async function startNavigation() {
    if (!navigator.geolocation) {
      log("Geolocation not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const userLngLat = [pos.coords.longitude, pos.coords.latitude];
      const destination = coords[coords.length - 1];
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLngLat.join(',')};${destination.join(',')}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!data.routes || !data.routes[0]) {
        log("No route found.");
        return;
      }

      const routeGeoJSON = {
        type: "Feature",
        geometry: data.routes[0].geometry,
      };

      if (map.getSource("nav-route")) {
        map.getSource("nav-route").setData(routeGeoJSON);
      } else {
        map.addSource("nav-route", { type: "geojson", data: routeGeoJSON });
        map.addLayer({
          id: "nav-route",
          type: "line",
          source: "nav-route",
          paint: {
            "line-color": "#007cbf",
            "line-width": 6,
            "line-dasharray": [2, 2],
          },
        });
      }

      map.flyTo({ center: userLngLat, zoom: 15 });
      log("Navigation route displayed.");

      const steps = data.routes[0].legs[0].steps;
      for (const step of steps) {
        const msg = new SpeechSynthesisUtterance(step.maneuver.instruction);
        window.speechSynthesis.speak(msg);
        await new Promise(res => setTimeout(res, step.duration * 1000));
      }
    }, err => {
      log("Geolocation error:", err.message);
    });
  }

  setupDebugPanel();
  setupNavPanel();

  const map = new mapboxgl.Map({
    container: "gn-mapbox-map",
    style: "mapbox://styles/mapbox/streets-v11",
    center: [32.3923713, 34.96211],
    zoom: 16,
  });

  map.addControl(new mapboxgl.NavigationControl(), "top-left");

  map.on("load", () => {
    log("Map loaded");

    coords = [];
    gnMapData.locations.forEach((loc) => {
      const popupHTML = `
        <div class="popup-content">
          ${loc.image ? `<img src="${loc.image}" alt="${loc.title}">` : ""}
          <h3>${loc.title}</h3>
          <div>${loc.content}</div>
        </div>
      `;
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupHTML);
      new mapboxgl.Marker().setLngLat([loc.lng, loc.lat]).setPopup(popup).addTo(map);
      coords.push([loc.lng, loc.lat]);
      log("Marker added:", loc.title, [loc.lng, loc.lat]);
    });

    if (coords.length > 1) {
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: coords,
          },
        },
      });

      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#ff0000", "line-width": 4 },
      });

      log("Route LineString drawn with", coords.length, "points");
    }

    // Elevation profile
    const DEM_TILE_URL = 'https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.pngraw?access_token=' + mapboxgl.accessToken;
    const elevationCanvas = document.createElement('canvas');
    const ctx = elevationCanvas.getContext('2d');
    const elevationData = [];

    async function getElevationAt(lng, lat) {
      const zoom = 15;
      const worldCoord = [
        (lng + 180) / 360 * Math.pow(2, zoom),
        (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)
      ];
      const xTile = Math.floor(worldCoord[0]);
      const yTile = Math.floor(worldCoord[1]);
      const url = DEM_TILE_URL.replace('{z}', zoom).replace('{x}', xTile).replace('{y}', yTile);

      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          elevationCanvas.width = img.width;
          elevationCanvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const x = Math.floor((worldCoord[0] - xTile) * img.width);
          const y = Math.floor((worldCoord[1] - yTile) * img.height);
          const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
          const elevation = -10000 + ((r * 256 * 256 + g * 256 + b) * 0.1);
          resolve(Math.round(elevation));
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
    }

    const chartContainer = document.createElement('div');
    chartContainer.innerHTML = `<canvas id="elevation-profile" style="max-width:100%;max-height:200px;"></canvas>`;
    chartContainer.style.margin = '20px auto';
    document.getElementById('gn-mapbox-map').after(chartContainer);

    (async () => {
      for (const [lng, lat] of coords) {
        const elev = await getElevationAt(lng, lat);
        elevationData.push(elev);
        log(`Elevation at ${lat}, ${lng}: ${elev}m`);
      }

      new Chart(document.getElementById("elevation-profile"), {
        type: 'line',
        data: {
          labels: elevationData.map((_, i) => `${i + 1}`),
          datasets: [{
            label: 'Elevation (m)',
            data: elevationData,
            fill: true,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.3,
            pointRadius: 0,
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { title: { display: true, text: 'Point Index' }},
            y: { title: { display: true, text: 'Elevation (m)' }}
          }
        }
      });
    })();

    // Live location
    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition(
        (pos) => {
          const userCoords = [pos.coords.longitude, pos.coords.latitude];
          log("Geolocation updated:", userCoords);
          if (!map.getSource("user-location")) {
            map.addSource("user-location", {
              type: "geojson",
              data: { type: "Point", coordinates: userCoords }
            });
            map.addLayer({
              id: "user-location",
              type: "circle",
              source: "user-location",
              paint: { "circle-radius": 6, "circle-color": "#007cbf" },
            });
          } else {
            map.getSource("user-location").setData({
              type: "Point",
              coordinates: userCoords,
            });
          }
        },
        (err) => log("Geolocation error:", err.message),
        { enableHighAccuracy: true }
      );
    } else {
      log("Geolocation not supported");
    }
  });
});