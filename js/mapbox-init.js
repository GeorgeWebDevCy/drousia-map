document.addEventListener("DOMContentLoaded", function () {
  mapboxgl.accessToken = gnMapData.accessToken;
  const debugEnabled = gnMapData.debug === true;
  let currentMode = "driving";

  function log(...args) {
    const timestamp = new Date().toLocaleTimeString();
    const message = `[${timestamp}] ${args.join(" ")}`;
    if (debugEnabled) {
      const logContainer = document.getElementById("gn-debug-log");
      if (logContainer) {
        const div = document.createElement("div");
        div.textContent = message;
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
      background: rgba(0,0,0,0.85); color: #0f0;
      font-family: monospace; font-size: 12px;
      max-height: 40vh; width: 300px; overflow-y: auto;
      border: 1px solid #0f0; padding: 10px;
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
  });

  const nav = new mapboxgl.NavigationControl();
  map.addControl(nav, "top-left");

  const navigationPanel = document.createElement("div");
  navigationPanel.id = "gn-nav-panel";
  navigationPanel.innerHTML = `
    <div style="cursor: move; background: #333; color: #fff; padding: 6px;">☰ Navigation Panel</div>
    <div style="padding: 10px; background: white;">
      <button id="gn-mode-driving">Driving</button>
      <button id="gn-mode-walking">Walking</button>
      <button id="gn-mode-cycling">Cycling</button>
    </div>
  `;
  navigationPanel.style.cssText = `
    position: fixed; top: 100px; left: 10px; width: 200px;
    z-index: 9998; border: 1px solid #ccc;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3); background: #fff;
  `;
  document.body.appendChild(navigationPanel);

  const header = navigationPanel.querySelector("div");
  header.onmousedown = function (e) {
    e.preventDefault();
    let shiftX = e.clientX - navigationPanel.getBoundingClientRect().left;
    let shiftY = e.clientY - navigationPanel.getBoundingClientRect().top;
    function moveAt(x, y) {
      navigationPanel.style.left = x - shiftX + "px";
      navigationPanel.style.top = y - shiftY + "px";
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

  function setMode(mode) {
    currentMode = mode;
    log("Navigation mode set to:", mode);
  }

  document.getElementById("gn-mode-driving").addEventListener("click", () => setMode("driving"));
  document.getElementById("gn-mode-walking").addEventListener("click", () => setMode("walking"));
  document.getElementById("gn-mode-cycling").addEventListener("click", () => setMode("cycling"));

  function speak(text) {
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    window.speechSynthesis.speak(utter);
  }

  async function getRoute(start, end) {
    const profile = currentMode;
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${start.join(",")};${end.join(",")}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`;
    const res = await fetch(url);
    const data = await res.json();
    const route = data.routes[0].geometry;

    if (map.getSource("route")) {
      map.getSource("route").setData({
        type: "Feature",
        geometry: route,
      });
    } else {
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: route,
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
    }

    const steps = data.routes[0].legs[0].steps;
    steps.forEach((step, i) => {
      setTimeout(() => {
        log("🗣️ " + step.maneuver.instruction);
        speak(step.maneuver.instruction);
      }, i * 5000); // stagger speech
    });
  }

  map.on("load", () => {
    log("Map loaded");

    gnMapData.locations.forEach((loc) => {
      const popupHTML = `
        <div class="popup-content">
          ${loc.image ? `<img src="${loc.image}" alt="${loc.title}">` : ""}
          <h3>${loc.title}</h3>
          <div>${loc.content}</div>
        </div>
      `;
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupHTML);
      const marker = new mapboxgl.Marker()
        .setLngLat([loc.lng, loc.lat])
        .setPopup(popup)
        .addTo(map);
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

          // For demo: navigate to the first location
          if (gnMapData.locations.length) {
            const first = gnMapData.locations[0];
            getRoute(coords, [first.lng, first.lat]);
          }
        },
        (error) => log("Geolocation error:", error.message),
        { enableHighAccuracy: true }
      );
    } else {
      log("Geolocation not supported");
    }
  });
});