document.addEventListener("DOMContentLoaded", function () {
  if (!document.getElementById("gn-mapbox-map")) return;

  mapboxgl.accessToken = gnMapData.accessToken;
  const debugEnabled = gnMapData.debug === true;
  let coords = [];
  const defaultLang = localStorage.getItem("gn_voice_lang") || "el-GR";

  function getSelectedLanguage() {
    const sel = document.getElementById("gn-language-select");
    return sel ? sel.value : defaultLang;
  }

  let voicesLoaded = false;

  function ensureVoicesLoaded(callback) {
    if (!window.speechSynthesis) return callback([]);
    const loaded = window.speechSynthesis.getVoices();
    if (loaded.length) {
      voicesLoaded = true;
      return callback(loaded);
    }
    const onVoicesChanged = () => {
      voicesLoaded = true;
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      callback(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
    window.speechSynthesis.getVoices();
  }

  function checkVoiceAvailability(lang) {
  if (!window.speechSynthesis) return false;

  const verify = (voices) => {
    const base = lang.toLowerCase().split("-")[0];
    const found = voices.some(v => {
      const vLang = String(v.lang).toLowerCase();
      const vBase = vLang.split("-")[0];
      return vLang === lang.toLowerCase() || vBase === base;
    });
    if (!found) {
      alert(`Voice for ${lang} not found. Please install it from your system's language or speech settings to enable spoken directions.`);
    }
    return found;
  };

  if (voicesLoaded) {
    return verify(window.speechSynthesis.getVoices());
  } else {
    ensureVoicesLoaded(verify);
    return true; // Assume true until voices load callback runs
  }
}


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
        <select id="gn-language-select" class="gn-nav-select">
          <option value="en-US">English</option>
          <option value="el-GR">Ελληνικά</option>
        </select>
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

    const langSel = navPanel.querySelector("#gn-language-select");
    if (langSel) {
      langSel.value = defaultLang;
      langSel.onchange = () => {
        localStorage.setItem("gn_voice_lang", langSel.value);
        checkVoiceAvailability(langSel.value);
      };
    }

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
    addVoiceToggleButton();
  }

  function addVoiceToggleButton() {
    const btn = document.createElement("button");
    btn.id = "gn-voice-toggle";
    btn.textContent = localStorage.getItem("gn_voice_muted") === "true" ? "Unmute Voice" : "Mute Voice";
    btn.className = "gn-nav-btn";
    btn.style.marginTop = "10px";

    btn.onclick = () => {
      const isMuted = localStorage.getItem("gn_voice_muted") === "true";
      localStorage.setItem("gn_voice_muted", !isMuted);
      btn.textContent = !isMuted ? "Unmute Voice" : "Mute Voice";
    };

    const panel = document.getElementById("gn-nav-panel");
    panel.querySelector("div:last-child").appendChild(btn);
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
        const lang = getSelectedLanguage();
        if (!window.speechSynthesis) {
          alert("Voice guidance is not supported in your browser.");
        } else {
          checkVoiceAvailability(lang);
          if (!localStorage.getItem("gn_voice_prompted")) {
            const consent = confirm(`Enable voice directions in ${lang}?`);
            if (!consent) localStorage.setItem("gn_voice_muted", true);
            localStorage.setItem("gn_voice_prompted", true);
          }
        }
      const userLngLat = [pos.coords.longitude, pos.coords.latitude];
      const allPoints = [userLngLat, ...coords];
      const coordPairs = allPoints.map(p => p.join(',')).join(';');
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordPairs}?geometries=geojson&overview=full&steps=true&annotations=duration,distance&language=${lang}&access_token=${mapboxgl.accessToken}`;

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

      let voiceMuted = localStorage.getItem("gn_voice_muted") === "true";
      const steps = data.routes[0].legs[0].steps;
      const totalDistance = data.routes[0].distance / 1000;
      const totalDuration = data.routes[0].duration / 60;
      log(`Total route distance: ${totalDistance.toFixed(2)} km`);
      log(`Total route duration: ${totalDuration.toFixed(1)} minutes`);
      for (const step of steps) {
        const msg = new SpeechSynthesisUtterance(step.maneuver.instruction);
        msg.lang = lang;
        msg.rate = 0.95;
        msg.pitch = 1;
        msg.volume = 1.0;
        if (!voiceMuted) window.speechSynthesis.speak(msg);
        await new Promise(res => setTimeout(res, step.duration * 1000));
        animateAlongRoute(data.routes[0].geometry.coordinates);
      }
    }, err => {
      log("Geolocation error:", err.message);
    });
  }

  setupDebugPanel();
  setupNavPanel();

  function animateAlongRoute(routeCoords) {
    if (!routeCoords || routeCoords.length < 2) return;

    if (!map.getSource('route-tracker')) {
      map.addSource('route-tracker', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: routeCoords[0]
          }
        }
      });

      map.loadImage('https://cdn-icons-png.flaticon.com/512/535/535239.png', (error, image) => {
        if (error) throw error;
        if (!map.hasImage('hiker-icon')) map.addImage('hiker-icon', image);

        map.addLayer({
          id: 'route-tracker',
          type: 'symbol',
          source: 'route-tracker',
          layout: {
            'icon-image': 'hiker-icon',
            'icon-size': 0.1,
            'icon-rotate': 0
          }
        });
      });
    }

    if (!map.getSource('trail-line')) {
      map.addSource('trail-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      });
      map.addLayer({
        id: 'trail-line',
        type: 'line',
        source: 'trail-line',
        paint: {
          'line-color': '#00f',
          'line-width': 3,
          'line-opacity': 0.5
        }
      });
    }

    let i = 0;
    let trail = [];
    let paused = false;

    window.pauseTracker = () => { paused = true; log("Tracking paused"); };
    window.resumeTracker = () => { paused = false; move(); log("Tracking resumed"); };
    function move() {
      if (i < routeCoords.length) {
        const point = routeCoords[i];
        map.getSource('route-tracker').setData({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: point }
        });
        i++;
        trail.push(point);
        map.getSource('trail-line').setData({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: trail }
        });
        setTimeout(() => {
          if (!paused) requestAnimationFrame(move);
        }, 100);
      } else {
        log("Animated marker reached end of route");
        log("Use pauseTracker() and resumeTracker() to control animation.");
      }
    }
    move();
  }

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
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#ff0000",
          "line-width": 4
        }
      });

      log("Route LineString drawn with", coords.length, "points");
    }
  });
  });