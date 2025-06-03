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
        <button onclick="setMode('driving')">Driving</button>
        <button onclick="setMode('walking')">Walking</button>
        <button onclick="setMode('cycling')">Cycling</button>
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
  }

  window.setMode = function (mode) {
    log("Navigation mode set to:", mode);
    // Add voice navigation logic if needed
  };

  setupDebugPanel();
  setupNavPanel();

  const map = new mapboxgl.Map({
    container: "gn-mapbox-map",
    style: "mapbox://styles/mapbox/streets-v11",
    center: [32.4000, 35.0400], // ✅ centered on Droushia

    zoom: 13,
  });

  map.addControl(new mapboxgl.NavigationControl(), "top-left");

  map.on("load", () => {
    log("Map loaded");

    // Add markers and collect coordinates
    const coords = [];
    gnMapData.locations.forEach((loc) => {
      const popupHTML = `
        <div class="popup-content">
          ${loc.image ? `<img src="${loc.image}" alt="${loc.title}">` : ""}
          <h3>${loc.title}</h3>
          <div>${loc.content}</div>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupHTML);
      new mapboxgl.Marker()
        .setLngLat([loc.lng, loc.lat])
        .setPopup(popup)
        .addTo(map);

      coords.push([loc.lng, loc.lat]);
      log("Marker added:", loc.title, [loc.lng, loc.lat]);
    });

    // Draw route as LineString
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
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#ff0000",
          "line-width": 4,
        },
      });

      log("Route LineString drawn with", coords.length, "points");
    }

    // Live tracking
    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition(
        (pos) => {
          const userCoords = [pos.coords.longitude, pos.coords.latitude];
          log("Geolocation updated:", userCoords);

          if (!map.getSource("user-location")) {
            map.addSource("user-location", {
              type: "geojson",
              data: {
                type: "Point",
                coordinates: userCoords,
              },
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
