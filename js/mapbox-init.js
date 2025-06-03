document.addEventListener("DOMContentLoaded", function () {
  mapboxgl.accessToken = gnMapData.accessToken;
  const debugEnabled = gnMapData.debug === true;

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
    logContainer.style.maxHeight = "30vh";
    logContainer.style.overflowY = "auto";

    panel.appendChild(clearBtn);
    panel.appendChild(logContainer);
    document.body.appendChild(panel);
  }

  setupDebugPanel();

  const map = new mapboxgl.Map({
    container: "gn-mapbox-map",
    style: "mapbox://styles/mapbox/streets-v11",
    center: [33.366, 35.146],
    zoom: 12,
    pitch: 45,
    bearing: -17.6,
    antialias: true,
  });

  map.on("load", () => {
    map.addSource("mapbox-dem", {
      type: "raster-dem",
      url: "mapbox://mapbox.terrain-rgb",
      tileSize: 512,
      maxzoom: 14,
    });
    map.setTerrain({ source: "mapbox-dem", exaggeration: 1.5 });
  });

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
    log("Marker added:", loc.title, [loc.lng, loc.lat]);
  });

  if ("geolocation" in navigator) {
    navigator.geolocation.watchPosition(
      (position) => {
        const coords = [position.coords.longitude, position.coords.latitude];
        log("Geolocation updated:", coords);

        if (!map.getSource("user-location")) {
          map.addSource("user-location", {
            type: "geojson",
            data: { type: "Point", coordinates: coords },
          });
          map.addLayer({
            id: "user-location",
            type: "circle",
            source: "user-location",
            paint: {
              "circle-radius": 6,
              "circle-color": "#007cbf",
            },
          });
        } else {
          map.getSource("user-location").setData({ type: "Point", coordinates: coords });
        }
      },
      (error) => log("Geolocation error:", error.message),
      { enableHighAccuracy: true }
    );
  } else {
    log("Geolocation not supported");
  }

  const directions = new MapboxDirections({
    accessToken: mapboxgl.accessToken,
    unit: "metric",
    profile: "mapbox/walking",
    interactive: false,
    controls: { instructions: false },
  });
  map.addControl(directions, "top-left");

  const chartCanvas = document.createElement("canvas");
  chartCanvas.id = "elevationChart";
  chartCanvas.style.width = "100%";
  chartCanvas.style.height = "200px";
  document.getElementById("gn-mapbox-map").appendChild(chartCanvas);

  directions.on("route", async (e) => {
    if (!e.route[0]) return;

    const coords = e.route[0].geometry.coordinates;
    const elevations = await Promise.all(coords.map(async ([lng, lat]) => {
      const tileUrl = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${getTileCoords(lat, lng, 14)}.pngraw?access_token=${mapboxgl.accessToken}`;
      const elevation = await fetchElevationFromRGB(tileUrl, lng, lat);
      return elevation;
    }));

    renderElevationChart(elevations);
    log("Elevation profile generated.");
  });

  function getTileCoords(lat, lon, zoom) {
    const x = Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
    const y = Math.floor(
      ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * Math.pow(2, zoom)
    );
    return `${zoom}/${x}/${y}`;
  }

  async function fetchElevationFromRGB(tileUrl, lng, lat) {
    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = tileUrl;

      await new Promise((resolve) => (img.onload = resolve));
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const px = lngLatToPixel(lng, lat, 14);
      const data = ctx.getImageData(px.x, px.y, 1, 1).data;
      const elevation = -10000 + ((data[0] * 256 * 256 + data[1] * 256 + data[2]) * 0.1);
      return Math.round(elevation);
    } catch (err) {
      log("Elevation fetch error:", err);
      return null;
    }
  }

  function lngLatToPixel(lng, lat, zoom) {
    const scale = 256 * Math.pow(2, zoom);
    const worldCoordX = (lng + 180) / 360 * scale;
    const sinLat = Math.sin(lat * Math.PI / 180);
    const worldCoordY = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
    return { x: Math.floor(worldCoordX % 256), y: Math.floor(worldCoordY % 256) };
  }

  function renderElevationChart(data) {
    const ctx = document.getElementById("elevationChart").getContext("2d");
    new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((_, i) => `${i}m`),
        datasets: [{
          label: "Elevation (m)",
          data,
          borderColor: "#ee212b",
          backgroundColor: "rgba(238, 33, 43, 0.1)",
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { display: false },
          y: {
            beginAtZero: true,
            title: { display: true, text: "Elevation (m)" }
          }
        }
      }
    });
  }
});
