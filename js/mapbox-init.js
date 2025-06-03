document.addEventListener("DOMContentLoaded", function () {
  mapboxgl.accessToken = gnMapData.accessToken;
  const debugEnabled = gnMapData.debug === true;

  function log(...args) {
    const timestamp = new Date().toLocaleTimeString();
    const msg = `[${timestamp}] ${args.map(String).join(" ")}`;
    if (debugEnabled) {
      const logContainer = document.getElementById("gn-debug-log");
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
      position: fixed; bottom: 10px; right: 10px; z-index: 9999;
      background: rgba(0,0,0,0.85); color: #0f0; font-family: monospace;
      font-size: 12px; max-height: 40vh; width: 300px;
      overflow-y: auto; border: 1px solid #0f0; padding: 10px;
    `;

    const clearBtn = document.createElement("button");
    clearBtn.textContent = "Clear";
    clearBtn.style.cssText = `
      display: block; margin-bottom: 10px; background: #222;
      color: #0f0; border: 1px solid #0f0; cursor: pointer;
    `;
    clearBtn.onclick = () => {
      const logContainer = document.getElementById("gn-debug-log");
      if (logContainer) logContainer.innerHTML = "";
    };

    const logContainer = document.createElement("div");
    logContainer.id = "gn-debug-log";
    logContainer.style.cssText = `overflow-y: auto; max-height: 30vh;`;

    panel.appendChild(clearBtn);
    panel.appendChild(logContainer);
    document.body.appendChild(panel);
  }

  function setupNavigationPanel() {
    const panel = document.createElement("div");
    panel.id = "gn-nav-panel";
    panel.innerHTML = `
      <div style="cursor: move; background: #333; color: #fff; padding: 6px;">☰ Navigation</div>
      <div style="padding: 10px; background: white;">
        <button data-mode="driving">Driving</button>
        <button data-mode="walking">Walking</button>
        <button data-mode="cycling">Cycling</button>
      </div>
    `;
    panel.style.cssText = `
      position: fixed; top: 100px; left: 10px; width: 200px;
      z-index: 9998; border: 1px solid #ccc;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3); background: #fff;
    `;
    document.body.appendChild(panel);

    const header = panel.querySelector("div");
    header.onmousedown = function (e) {
      e.preventDefault();
      let shiftX = e.clientX - panel.getBoundingClientRect().left;
      let shiftY = e.clientY - panel.getBoundingClientRect().top;
      function moveAt(pageX, pageY) {
        panel.style.left = pageX - shiftX + "px";
        panel.style.top = pageY - shiftY + "px";
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

    panel.querySelectorAll("button").forEach((btn) =>
      btn.addEventListener("click", () => {
        setMode(btn.getAttribute("data-mode"));
      })
    );
  }

  function setMode(mode) {
    log("Navigation mode set to:", mode);
    speak(`Switched to ${mode} mode`);
  }

  function speak(text) {
    if ("speechSynthesis" in window) {
      const utter = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utter);
    }
  }

  setupDebugPanel();
  setupNavigationPanel();

  const map = new mapboxgl.Map({
    container: "gn-mapbox-map",
    style: "mapbox://styles/mapbox/streets-v11",
    center: [33.366, 35.146],
    zoom: 12,
  });

  map.on("load", () => {
    log("Map loaded");

    const coordinates = [];
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
      coordinates.push([loc.lng, loc.lat]);
    });

    if (coordinates.length > 1) {
      const pathGeoJSON = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: coordinates,
        },
      };

      map.addSource("route-line", {
        type: "geojson",
        data: pathGeoJSON,
      });

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route-line",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#ff0000",
          "line-width": 4,
        },
      });

      // Elevation (next step – handled separately in a function)
      decodeElevationProfile(coordinates);
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition(
        (position) => {
          const userCoords = [position.coords.longitude, position.coords.latitude];
          log("Geolocation updated:", userCoords);
          if (!map.getSource("user-location")) {
            map.addSource("user-location", {
              type: "geojson",
              data: { type: "Point", coordinates: userCoords },
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
            map.getSource("user-location").setData({ type: "Point", coordinates: userCoords });
          }
        },
        (error) => log("Geolocation error:", error.message),
        { enableHighAccuracy: true }
      );
    } else {
      log("Geolocation not supported");
    }
  });

  function decodeElevationProfile(coords) {
    log("Preparing elevation profile…");
    // We’ll insert Terrain-RGB decoding + Chart.js logic next
    // This step needs Mapbox Terrain Tiles + canvas decoding
  }
});
