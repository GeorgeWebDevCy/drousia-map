document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("gn-mapbox-map");
  if (!container) return;

  if (!gnMapData.accessToken) {
    container.innerHTML =
      '<p class="gn-mapbox-error">Mapbox access token missing. Set one under Settings → GN Mapbox.</p>';
    console.error("Mapbox access token missing.");
    return;
  }

  mapboxgl.accessToken = gnMapData.accessToken;
  const debugEnabled = gnMapData.debug === true;
  let coords = [];
  // driving mode provides the most direct route by default
  let navigationMode = "driving";
  let map;
  let languageControl;
  let markers = [];
  let directionsControl;
  let watchId;
  let trail = [];
  const defaultLang = localStorage.getItem("gn_voice_lang") || "el-GR";
  const routeSettings = {
    default: { center: [32.3923713, 34.96211], zoom: 16 },
    paphos: { center: [32.3975751, 34.9627965], zoom: 10 },
    polis: { center: [32.3975751, 34.9627965], zoom: 11 },
    airport: { center: [32.4297, 34.7753], zoom: 12 },
  };

  function mapLangPart(code) {
    return code.split("-")[0];
  }

  function getSelectedLanguage() {
    const sel = document.getElementById("gn-language-select");
    return sel ? sel.value : defaultLang;
  }

  function checkVoiceAvailability(lang) {
    if (!window.speechSynthesis) return false;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) {
      const onVoicesChanged = () => {
        const updatedVoices = window.speechSynthesis.getVoices();
        window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
        if (!updatedVoices.some(v => v.lang === lang)) {
          alert(`Voice for ${lang} not found. Please install it from your system's language or speech settings to enable spoken directions.`);
        }
      };
      window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
      window.speechSynthesis.getVoices();
      return true;
    }
    const hasVoice = voices.some(v => v.lang === lang);
    if (!hasVoice) {
      alert(`Voice for ${lang} not found. Please install it from your system's language or speech settings to enable spoken directions.`);
    }
    return hasVoice;
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
      <div style="cursor: move; background: #333; color: #fff; padding: 4px; font-size:13px;">
        ☰ Navigation
        <button id="gn-close-nav" style="float:right;background:none;border:none;color:#fff;font-size:16px;cursor:pointer">×</button>
      </div>
      <div style="padding: 6px; background: white;">
          <select id="gn-route-select" class="gn-nav-select">
            <option value="">Select Route</option>
            <option value="default">Nature Path</option>
            <option value="paphos">Drousia → Paphos</option>
            <option value="polis">Drousia → Polis</option>
            <option value="airport">Paphos → Airport</option>
          </select>
          <select id="gn-mode-select" class="gn-nav-select">
            <option value="driving" title="Driving">🚗</option>
            <option value="walking" title="Walking">🚶</option>
            <option value="cycling" title="Cycling">🚲</option>
          </select>
          <select id="gn-language-select" class="gn-nav-select">
            <option value="en-US" title="English">🇬🇧</option>
            <option value="el-GR" title="Ελληνικά">🇬🇷</option>
          </select>
          <div id="gn-distance-panel" style="font-size:12px;margin-bottom:4px;"></div>
          <button class="gn-nav-btn" id="gn-start-nav" title="Start Navigation">▶</button>
      </div>
    `;
    navPanel.style.cssText = `
      position: fixed;
      top: 100px;
      left: 10px;
      width: 110px;
      z-index: 9998;
      border: 1px solid #ccc;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      background: #fff;
      font-family: sans-serif;
    `;
    document.body.appendChild(navPanel);

    const openBtn = document.createElement('button');
    openBtn.id = 'gn-open-nav';
    openBtn.textContent = '☰';
    openBtn.className = 'gn-nav-btn';
    openBtn.style.cssText = 'position:fixed;top:100px;left:10px;z-index:9998;width:30px;display:none;padding:4px;';
    document.body.appendChild(openBtn);
    openBtn.onclick = () => {
      navPanel.style.display = 'block';
      openBtn.style.display = 'none';
    };
    const routeSel = navPanel.querySelector("#gn-route-select");
    if (routeSel) {
      routeSel.onchange = () => selectRoute(routeSel.value);
    }
    const modeSel = navPanel.querySelector("#gn-mode-select");
    if (modeSel) {
      modeSel.value = navigationMode;
      modeSel.onchange = () => setMode(modeSel.value);
    }

    const langSel = navPanel.querySelector("#gn-language-select");
    if (langSel) {
      langSel.value = defaultLang;
      langSel.onchange = () => {
        localStorage.setItem("gn_voice_lang", langSel.value);
        checkVoiceAvailability(langSel.value);
        if (languageControl && map) {
          const code = mapLangPart(langSel.value);
          map.setStyle(languageControl.setLanguage(map.getStyle(), code));
        }
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

    document.getElementById('gn-close-nav').onclick = () => {
      navPanel.style.display = 'none';
      openBtn.style.display = 'block';
    };

    document.getElementById("gn-start-nav").onclick = startNavigation;
    addVoiceToggleButton();
  }

  function addVoiceToggleButton() {
    const btn = document.createElement("button");
    btn.id = "gn-voice-toggle";
    btn.title = "Toggle Voice";
    btn.textContent = localStorage.getItem("gn_voice_muted") === "true" ? "🔇" : "🔊";
    btn.className = "gn-nav-btn";
    btn.style.marginTop = "10px";

    btn.onclick = () => {
      const isMuted = localStorage.getItem("gn_voice_muted") === "true";
      localStorage.setItem("gn_voice_muted", !isMuted);
      btn.textContent = !isMuted ? "🔇" : "🔊";
    };

    const panel = document.getElementById("gn-nav-panel");
    panel.querySelector("div:last-child").appendChild(btn);
  }

  function setupLightbox() {
    const overlay = document.createElement('div');
    overlay.id = 'gn-lightbox';
    overlay.innerHTML = '<span class="gn-lightbox-close">&times;</span><img>';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', e => {
      if (e.target === overlay || e.target.classList.contains('gn-lightbox-close')) {
        overlay.classList.remove('visible');
      }
    });

    document.addEventListener('click', e => {
      if (e.target.matches('#gn-mapbox-map .popup-content img')) {
        overlay.querySelector('img').src = e.target.src;
        overlay.classList.add('visible');
      }
  });
  }

  function clearMap() {
    log('Clearing map');
    markers.forEach(m => m.remove());
    markers = [];
    const sources = ['route', 'route-tracker', 'trail-line', 'nav-route'];
    const layers = ['route', 'route-tracker', 'trail-line', 'nav-route'];
    layers.forEach(l => { if (map.getLayer(l)) map.removeLayer(l); });
    sources.forEach(s => { if (map.getSource(s)) map.removeSource(s); });
    if (directionsControl) {
      map.removeControl(directionsControl);
      directionsControl = null;
    }
    const style = map.getStyle();
    if (style) {
      Object.keys(style.sources)
        .filter(id => id.startsWith('directions'))
        .forEach(id => {
          if (map.getLayer(id)) map.removeLayer(id);
          if (map.getSource(id)) map.removeSource(id);
        });
    }
    const panel = document.getElementById('gn-distance-panel');
    if (panel) panel.textContent = '';
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    trail = [];
  }

  function showDefaultRoute() {
    clearMap();
    log('Showing default route');
    coords = [];
    const lastIndex = gnMapData.locations.length - 1;
    gnMapData.locations.forEach((loc, idx) => {
      const galleryHTML = loc.gallery && loc.gallery.length
        ? '<div class="gallery">' +
          loc.gallery.map(item => item.type === 'video'
            ? `<video src="${item.url}" controls></video>`
            : `<img src="${item.url}" alt="${loc.title}">`).join('') +
          '</div>'
        : '';
      const uploadHTML = loc.upload_form ? `<div class="gn-upload-form">${loc.upload_form}</div>` : '';
      const popupHTML = `
        <div class="popup-content">
          ${loc.image ? `<img src="${loc.image}" alt="${loc.title}">` : ""}
          <h3>${loc.title}</h3>
          <div>${loc.content}</div>
          ${galleryHTML}
          ${uploadHTML}
        </div>`;
      if (idx === 0 || idx === lastIndex || loc.waypoint) {
        coords.push([loc.lng, loc.lat]);
      }
      if (!loc.waypoint) {
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupHTML);
        const marker = new mapboxgl.Marker().setLngLat([loc.lng, loc.lat]).setPopup(popup).addTo(map);
        markers.push(marker);
      }
    });
    if (coords.length > 1) {
      fetchDirections(coords, navigationMode).then(res => {
        if (!res.coordinates.length) {
          log('No coordinates returned for route');
          return;
        }
        const routeGeoJson = { type: 'Feature', geometry: { type: 'LineString', coordinates: res.coordinates } };
        map.addSource('route', { type: 'geojson', data: routeGeoJson });
        map.addLayer({ id: 'route', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#ff0000', 'line-width': 4 } });
        log('Route line drawn with', res.coordinates.length, 'points');
      });
    } else {
      log('Not enough coordinates for route line');
    }
  }

  async function showDrivingRoute(origin, dest) {
    clearMap();
    log('Showing driving route');
    coords = [origin, dest];
    log('Driving route from', origin, 'to', dest);
    directionsControl = new MapboxDirections({
      accessToken: mapboxgl.accessToken,
      unit: 'metric',
      profile: 'mapbox/driving',
      alternatives: false,
      controls: { instructions: false }
    });
    map.addControl(directionsControl, 'top-left');
    directionsControl.setOrigin(origin);
    directionsControl.setDestination(dest);
    log('Directions control added, waiting for route to render');

    const res = await fetchDirections(coords);
    if (res.coordinates.length) {
      const routeGeoJson = { type: 'Feature', geometry: { type: 'LineString', coordinates: res.coordinates } };
      map.addSource('route', { type: 'geojson', data: routeGeoJson });
      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#ff0000', 'line-width': 4 }
      });
      log('Route line drawn with', res.coordinates.length, 'points');
    } else {
      log('No coordinates returned for route');
    }
  }

  function applyRouteSettings(key) {
    const opts = routeSettings[key];
    if (!opts || !map) return;
    log('Applying route settings:', key, opts);
    map.flyTo({ center: opts.center, zoom: opts.zoom });
  }

  function selectRoute(val) {
    log('Route selected:', val);
    clearMap();
    if (!val) return;
    applyRouteSettings(val);
    if (val === 'default') {
      showDefaultRoute();
    } else if (val === 'paphos') {
      showDrivingRoute([32.3975751, 34.9627965], [32.4297, 34.7753]);
    } else if (val === 'polis') {
      showDrivingRoute([32.3975751, 34.9627965], [32.4147, 35.0360]);
    } else if (val === 'airport') {
      showDrivingRoute([32.4297, 34.7753], [32.4858, 34.7174]);
    }
    // Re-apply the center after controls adjust the map
    setTimeout(() => applyRouteSettings(val), 1000);
  }

  window.setMode = function (mode) {
    const sel = document.getElementById("gn-mode-select");
    if (sel) sel.value = mode;
    navigationMode = mode;
    log(
      "Navigation mode icon:",
      mode,
      "using actual mode:",
      navigationMode
    );
  };

  async function getElevationGain(points) {
    try {
      const step = Math.max(1, Math.floor(points.length / 50));
      const sampled = points.filter((_, i) => i % step === 0);
      const locs = sampled.map(p => `${p[1]},${p[0]}`).join("|");
      const res = await fetch(
        `https://api.open-elevation.com/api/v1/lookup?locations=${locs}`
      );
      const json = await res.json();
      if (!json.results) return 0;
      const elevs = json.results.map(r => r.elevation);
      let gain = 0;
      for (let i = 1; i < elevs.length; i++) {
        const diff = elevs[i] - elevs[i - 1];
        if (diff > 0) gain += diff;
      }
      return gain;
    } catch (e) {
      console.warn("Elevation fetch failed", e);
      return 0;
    }
  }

  function haversineDistance(a, b) {
    const toRad = d => (d * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(b[1] - a[1]);
    const dLon = toRad(b[0] - a[0]);
    const lat1 = toRad(a[1]);
    const lat2 = toRad(b[1]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function computeCumulativeDistances(coords) {
    const dists = [0];
    for (let i = 1; i < coords.length; i++) {
      dists[i] = dists[i - 1] + haversineDistance(coords[i - 1], coords[i]);
    }
    return dists;
  }

  async function fetchDirections(allCoords, mode = 'driving', includeSteps = false, lang = 'en') {
    const MAX = 25;
    let routeCoords = [];
    let steps = [];
    let distance = 0;
    let duration = 0;

    const validCoords = allCoords.filter(c => Array.isArray(c) && c.length >= 2 &&
      typeof c[0] === 'number' && typeof c[1] === 'number');
    if (!validCoords.length) {
      console.error('No valid coordinates supplied for directions');
      return { coordinates: [], steps: [], distance: 0, duration: 0 };
    }

    try {
      for (let i = 0; i < validCoords.length; i += MAX - 1) {
        let segment = validCoords.slice(i, i + MAX);
        if (i !== 0) segment.unshift(validCoords[i - 1]);
        const pairs = segment.map(p => p.join(',')).join(';');
        let url = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${pairs}?geometries=geojson&overview=full&alternatives=false`;
        if (includeSteps) {
          url += `&steps=true&annotations=duration,distance&language=${lang}`;
        }
        url += `&access_token=${mapboxgl.accessToken}`;
        log('Fetching directions:', url);

        const res = await fetch(url);
        if (!res.ok) {
          log('Directions request failed:', res.status, res.statusText);
          continue;
        }
        const data = await res.json();
        if (!data.routes || !data.routes[0]) continue;
        const segCoords = data.routes[0].geometry.coordinates;
        if (routeCoords.length) {
          routeCoords = routeCoords.concat(segCoords.slice(1));
        } else {
          routeCoords = segCoords;
        }
        distance += data.routes[0].distance;
        duration += data.routes[0].duration;
        if (includeSteps) steps = steps.concat(data.routes[0].legs[0].steps);
      }
    } catch (e) {
      console.error('Failed to fetch directions', e);
      return { coordinates: [], steps: [], distance: 0, duration: 0 };
    }

    return { coordinates: routeCoords, steps, distance, duration };
  }

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
      const waypoints = coords.slice(0, -1);
      const destination = coords[coords.length - 1];
      const ordered = [userLngLat, ...waypoints, destination];
      const {
        coordinates: routeCoords,
        steps,
        distance,
        duration,
      } = await fetchDirections(ordered, navigationMode, true, lang);
      if (!routeCoords.length) {
        log("No route found.");
        return;
      }

      const elevationGain = await getElevationGain(routeCoords);
      const cumulativeDistances = computeCumulativeDistances(routeCoords);

      const routeGeoJSON = {
        type: "Feature",
        geometry: { type: "LineString", coordinates: routeCoords },
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
      updateTracker(userLngLat);
      log("Navigation route displayed.");

      let voiceMuted = localStorage.getItem("gn_voice_muted") === "true";
      const totalDistance = distance;
      const totalDuration = duration;
      let remainingDistance = distance;
      let remainingDuration = duration;
      const panel = document.getElementById("gn-distance-panel");
      const updatePanel = () => {
        if (panel) {
          const km = (remainingDistance / 1000).toFixed(2);
          const mins = Math.ceil(remainingDuration / 60);
          panel.innerHTML = `Distance: ${km} km<br>Time: ${mins} min<br>Elevation: ${Math.round(
            elevationGain
          )} m`;
        }
      };
      updatePanel();

      let stepIndex = 0;
      const speakInstruction = step => {
        let instr = step.maneuver.instruction.replace(/^Drive/i,
          navigationMode === 'walking' ? 'Walk' : navigationMode === 'cycling' ? 'Cycle' : 'Drive');
        const msg = new SpeechSynthesisUtterance(instr);
        msg.lang = lang;
        msg.rate = 0.95;
        msg.pitch = 1;
        msg.volume = 1.0;
        if (!voiceMuted) window.speechSynthesis.speak(msg);
      };
      if (steps.length) speakInstruction(steps[0]);

      const calcRemaining = (cur) => {
        let nearestIdx = 0;
        let minDist = Infinity;
        for (let i = 0; i < routeCoords.length; i++) {
          const d = haversineDistance(cur, routeCoords[i]);
          if (d < minDist) { minDist = d; nearestIdx = i; }
        }
        return minDist + (totalDistance - cumulativeDistances[nearestIdx]);
      };

      watchId = navigator.geolocation.watchPosition(pos => {
        const cur = [pos.coords.longitude, pos.coords.latitude];
        updateTracker(cur);

        remainingDistance = calcRemaining(cur);
        remainingDuration = (remainingDistance / totalDistance) * totalDuration;

        if (stepIndex < steps.length) {
          const target = steps[stepIndex].maneuver.location;
          if (haversineDistance(cur, target) < 20) {
            stepIndex++;
            if (stepIndex < steps.length) speakInstruction(steps[stepIndex]);
          }
        }
        updatePanel();
      }, err => log('Geolocation watch error', err.message), { enableHighAccuracy: true });

      // store watchId globally if needed to stop later
    }, err => {
      log("Geolocation error:", err.message);
    });
  }

  setupDebugPanel();
  setupNavPanel();
  setupLightbox();
  function updateTracker(coord) {
    if (!map.getSource('route-tracker')) {
      map.addSource('route-tracker', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'Point', coordinates: coord } }
      });
      map.loadImage('https://cdn-icons-png.flaticon.com/512/535/535239.png', (error, image) => {
        if (error) throw error;
        if (!map.hasImage('hiker-icon')) map.addImage('hiker-icon', image);
        map.addLayer({
          id: 'route-tracker',
          type: 'symbol',
          source: 'route-tracker',
          layout: { 'icon-image': 'hiker-icon', 'icon-size': 0.1, 'icon-rotate': 0 }
        });
      });
    } else {
      map.getSource('route-tracker').setData({ type: 'Feature', geometry: { type: 'Point', coordinates: coord } });
    }

    if (!map.getSource('trail-line')) {
      map.addSource('trail-line', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
      });
      map.addLayer({
        id: 'trail-line',
        type: 'line',
        source: 'trail-line',
        paint: { 'line-color': '#ff0000', 'line-width': 3, 'line-opacity': 0.7 }
      });
    }
    trail.push(coord);
    map.getSource('trail-line').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: trail } });
  }

  map = new mapboxgl.Map({
    container: "gn-mapbox-map",
    style: "mapbox://styles/mapbox/satellite-streets-v11",
    center: routeSettings.default.center,
    zoom: routeSettings.default.zoom,
  });

  map.addControl(new mapboxgl.NavigationControl(), "top-left");
  languageControl = new MapboxLanguage({
    supportedLanguages: ["en", "el"],
    defaultLanguage: mapLangPart(defaultLang)
  });
  map.addControl(languageControl);

  map.on("load", () => {
    log("Map loaded");
    const routeSel = document.getElementById("gn-route-select");
    if (routeSel) routeSel.value = "default";
    selectRoute("default");
  });
  });
