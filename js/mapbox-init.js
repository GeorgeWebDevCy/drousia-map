(() => {
    const init = () => {
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
    // default icon shows driving but we actually request walking directions
    let navigationMode = "walking";
    let map;
    let languageControl;
    let markers = [];
    let popups = [];
    let directionsControl;
    let watchId;
    let trail = [];
    let isNavigating = false;
    let currentRoute = 'default';
    let currentElevation = 0;
    const defaultLang = localStorage.getItem("gn_voice_lang") || "el-GR";
    const routeSettings = {
      default: { center: [32.3923713, 34.96211], zoom: 16 },
      paphos: { center: [32.42293021940422, 34.774631500416966], zoom: 10 },
      polis: { center: [32.425647063063586, 35.03373715925951], zoom: 11 },
      airport: { center: [32.490296426999045, 34.70974769197728], zoom: 12 },
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
            // alert(`Voice for ${lang} not found. Please install it from your system's language or speech settings to enable spoken directions.`);
          }
        };
        window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
        window.speechSynthesis.getVoices();
        return true;
      }
      const hasVoice = voices.some(v => v.lang === lang);
      if (!hasVoice) {
        // alert(`Voice for ${lang} not found. Please install it from your system's language or speech settings to enable spoken directions.`);
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
        <div style="cursor: move; background: #002d44; color: #fff; padding: 4px; font-size:13px; border-radius:8px 8px 0 0;">
          ☰ Navigation
          <button id="gn-close-nav" style="float:right;background:none;border:none;color:#fff;font-size:16px;cursor:pointer">×</button>
        </div>
        <div id="gn-nav-controls" style="padding: 6px; background: white;">
            <select id="gn-route-select" class="gn-nav-select">
              <option value="">Select Route</option>
              <option value="default">Nature Path</option>
              <option value="paphos">Paphos → Drouseia</option>
              <option value="polis">Polis → Drouseia</option>
              <option value="airport">Paphos Airport → Drouseia</option>
            </select>
            <select id="gn-mode-select" class="gn-nav-select">
              <option value="driving" title="Driving">🚗 Driving</option>
              <option value="walking" title="Walking">🚶 Walking</option>
              <option value="cycling" title="Cycling">🚲 Cycling</option>
            </select>
            <select id="gn-language-select" class="gn-nav-select">
              <option value="en-US" title="English">🇬🇧 English</option>
              <option value="el-GR" title="Ελληνικά">🇬🇷 Ελληνικά</option>
            </select>
            <div id="gn-distance-panel" style="font-size:12px;margin-bottom:4px;"></div>
            <button class="gn-nav-btn" id="gn-nav-toggle" title="Start Navigation">▶ Start Navigation</button>
        </div>
      `;
      navPanel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 300px;
        z-index: 9998;
        border: 1px solid #ccc;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        background: #fff;
        font-family: sans-serif;
        border-radius: 8px;
      `;
      document.body.appendChild(navPanel);
  
      const openBtn = document.createElement('button');
      openBtn.id = 'gn-open-nav';
      openBtn.textContent = '☰';
      openBtn.className = 'gn-nav-btn';
      openBtn.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9998;width:30px;display:none;padding:4px;';
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
        modeSel.value = 'driving';
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
  
      document.getElementById("gn-nav-toggle").onclick = toggleNavigation;
      addVoiceToggleButton();
    }
  
    function addVoiceToggleButton() {
      const btn = document.createElement("button");
      btn.id = "gn-voice-toggle";
      btn.title = "Toggle Voice";
      btn.textContent = localStorage.getItem("gn_voice_muted") === "true" ? "🔊 Unmute Directions" : "🔇 Mute Directions";
      btn.className = "gn-nav-btn";
  
      btn.onclick = () => {
        const wasMuted = localStorage.getItem("gn_voice_muted") === "true";
        const nowMuted = !wasMuted;
        localStorage.setItem("gn_voice_muted", nowMuted);
        btn.textContent = nowMuted ? "🔊 Unmute Directions" : "🔇 Mute Directions";
        if (wasMuted && window.speechSynthesis) {
          // voice was muted and is now unmuted
          // nothing to cancel
        } else if (!wasMuted && window.speechSynthesis) {
          // voice was playing and is now muted
          window.speechSynthesis.cancel();
        }
      };
  
      const controls = document.getElementById("gn-nav-controls");
      controls.appendChild(btn);
    }
  
    function toggleNavigation() {
      if (isNavigating) {
        stopNavigation();
      } else {
        startNavigation();
      }
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
        if (e.target.classList.contains('gn-desc-label')) {
          const content = e.target.nextElementSibling;
          if (content) {
            content.style.display = content.style.display === 'block' ? 'none' : 'block';
          }
        }
    });
    }
  
    function setupCarousel(rootEl = document) {
      rootEl.querySelectorAll('.gn-carousel').forEach(carousel => {
        const slides = carousel.querySelectorAll('.gn-slide');
        if (slides.length === 0) return;
        let index = 0;
        const show = i => {
          slides.forEach((s, idx) => {
            s.classList.toggle('active', idx === i);
          });
        };
        show(0);
        const prev = carousel.querySelector('.gn-carousel-prev');
        const next = carousel.querySelector('.gn-carousel-next');
        if (prev) {
          prev.addEventListener('click', e => {
            e.stopPropagation();
            index = (index - 1 + slides.length) % slides.length;
            show(index);
          });
        }
        if (next) {
          next.addEventListener('click', e => {
            e.stopPropagation();
            index = (index + 1) % slides.length;
            show(index);
          });
        }
      });
    }
  
    function clearMap() {
      log('Clearing map');
      markers.forEach(m => m.remove());
      markers = [];
      popups.forEach(p => p.remove());
      popups = [];
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
      isNavigating = false;
      const btn = document.getElementById('gn-nav-toggle');
      if (btn) btn.textContent = '▶ Start Navigation';
    }
  
    function stopNavigation() {
      clearMap();
      selectRoute(currentRoute);
    }
  
    async function showDefaultRoute() {
      clearMap();
      log('Showing default route');
      coords = gnMapData.locations.map(loc => [loc.lng, loc.lat]);
      if (coords.length !== 15) {
        log('Expected 15 coordinates but got', coords.length);
      }
      gnMapData.locations.forEach(loc => {
        const carouselHTML = loc.gallery && loc.gallery.length
          ? '<div class="gn-carousel">' +
            '<button class="gn-carousel-prev" aria-label="Prev">&#10094;</button>' +
            '<div class="gn-carousel-track">' +
            loc.gallery.map(item =>
              `<div class="gn-slide">${item.type === 'video'
                ? `<video src="${item.url}" controls></video>`
                : `<img src="${item.url}" alt="${loc.title}">`}</div>`
            ).join('') +
            '</div>' +
            '<button class="gn-carousel-next" aria-label="Next">&#10095;</button>' +
            '</div>'
          : '';
        const uploadHTML = loc.upload_form ? `<div class="gn-upload-form">${loc.upload_form}</div>` : '';
        const popupHTML = `
          <div class="popup-content">
            <h3>${loc.title}</h3>
            ${loc.image ? `<img src="${loc.image}" alt="${loc.title}">` : ''}
            <div class="gn-desc-label">Description &raquo;</div>
            <div class="gn-desc-content">${loc.content}</div>
            ${carouselHTML}
            ${uploadHTML}
          </div>`;
        if (!loc.waypoint) {
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupHTML);
          const marker = new mapboxgl.Marker()
            .setLngLat([loc.lng, loc.lat])
            .addTo(map);
          const el = marker.getElement();
          const showPopup = () => {
            popups.forEach(p => p.remove());
            popups = [];
            popup.setLngLat([loc.lng, loc.lat]).addTo(map);
            popups.push(popup);
            setupCarousel(popup.getElement());
          };
          el.addEventListener('mouseenter', showPopup);
          el.addEventListener('click', showPopup);
          el.addEventListener('touchstart', showPopup);
          markers.push(marker);
        }
      });
      if (coords.length > 1) {
        const stopIndexes = gnMapData.locations.reduce((arr, loc, i) => {
          if (!loc.waypoint) arr.push(i);
          return arr;
        }, []);
        const bearings = computeBearings(coords);
        const res = await fetchDirections(
          coords,
          navigationMode,
          false,
          getSelectedLanguage(),
          stopIndexes,
          bearings
        );
        if (res.coordinates.length) {
          const routeGeoJson = {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: res.coordinates }
          };
          map.addSource('route', { type: 'geojson', data: routeGeoJson });
          map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#1198B3', 'line-width': 4 }
          });
          const elevationGain = await getElevationGain(res.coordinates);
          const panel = document.getElementById('gn-distance-panel');
          if (panel) {
            const km = (res.distance / 1000).toFixed(2);
            const mins = Math.ceil(res.duration / 60);
            panel.innerHTML = `Distance: ${km} km<br>Time: ${mins} min<br>Elevation: ${Math.round(
              elevationGain
            )} m`;
          }
          log('Route line drawn with', res.coordinates.length, 'points');
        } else {
          log('No coordinates returned for default route');
        }
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
  
      const bearings = computeBearings(coords);
      const res = await fetchDirections(
        coords,
        'driving',
        false,
        getSelectedLanguage(),
        [0, 1],
        bearings
      );
      if (res.coordinates.length) {
        const routeGeoJson = { type: 'Feature', geometry: { type: 'LineString', coordinates: res.coordinates } };
        map.addSource('route', { type: 'geojson', data: routeGeoJson });
        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#1198B3', 'line-width': 4 }
        });
        const elevationGain = await getElevationGain(res.coordinates);
        const panel = document.getElementById('gn-distance-panel');
        if (panel) {
          const km = (res.distance / 1000).toFixed(2);
          const mins = Math.ceil(res.duration / 60);
          panel.innerHTML = `Distance: ${km} km<br>Time: ${mins} min<br>Elevation: ${Math.round(
            elevationGain
          )} m`;
        }
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
      currentRoute = val || 'default';
      clearMap();
      if (!val) return;
      applyRouteSettings(val);
      if (val === 'default') {
        showDefaultRoute();
      } else if (val === 'paphos') {
        showDrivingRoute([32.42293021940422, 34.774631500416966], [32.397643, 34.959782]);
      } else if (val === 'polis') {
        showDrivingRoute([32.425647063063586, 35.03373715925951], [32.397643, 34.959782]);
      } else if (val === 'airport') {
        showDrivingRoute([32.490296426999045, 34.70974769197728], [32.397643, 34.959782]);
      }
      // Re-apply the center after controls adjust the map
      setTimeout(() => applyRouteSettings(val), 1000);
    }
  
    window.setMode = function (mode) {
      const sel = document.getElementById("gn-mode-select");
      if (sel) sel.value = mode;
      const prev = navigationMode;
      navigationMode = mode;
      if (map && map.getLayer('route-tracker')) {
        // Update the tracker to use the correct icon when switching modes
        map.setLayoutProperty('route-tracker', 'icon-image', getTrackerIcon());
      }
      if (prev !== mode) {
        if (isNavigating) {
          stopNavigation();
          startNavigation();
        } else {
          selectRoute(currentRoute);
        }
      }
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
  
    async function fetchElevation(lat, lng) {
      try {
        const res = await fetch(
          `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`
        );
        const json = await res.json();
        if (json.results && json.results[0]) {
          return json.results[0].elevation;
        }
      } catch (e) {
        console.warn('Elevation fetch failed', e);
      }
      return null;
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
  
    function bearingBetween(a, b) {
      const toRad = d => (d * Math.PI) / 180;
      const toDeg = r => (r * 180) / Math.PI;
      const lat1 = toRad(a[1]);
      const lat2 = toRad(b[1]);
      const dLon = toRad(b[0] - a[0]);
      const y = Math.sin(dLon) * Math.cos(lat2);
      const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
      return (toDeg(Math.atan2(y, x)) + 360) % 360;
    }
  
    function computeBearings(points, tol = 45) {
      if (!Array.isArray(points) || points.length < 2) return null;
      const res = [];
      for (let i = 0; i < points.length; i++) {
        let ang;
        if (i === points.length - 1) {
          ang = bearingBetween(points[i - 1], points[i]);
        } else {
          ang = bearingBetween(points[i], points[i + 1]);
        }
        res.push([Math.round(ang), tol]);
      }
      return res;
    }
  
    async function fetchDirections(
      allCoords,
      mode = 'driving',
      includeSteps = false,
      lang = 'en',
      stopIndexes = null,
      bearings = null
    ) {
      const MAX = 25;
      let routeCoords = [];
      let steps = [];
      let distance = 0;
      let duration = 0;
  
      const validCoords = allCoords.filter(
        c => Array.isArray(c) && c.length >= 2 && typeof c[0] === 'number' && typeof c[1] === 'number'
      );
      if (!validCoords.length) {
        console.error('No valid coordinates supplied for directions');
        return { coordinates: [], steps: [], distance: 0, duration: 0 };
      }
      if (!stopIndexes) {
        stopIndexes = validCoords.map((_, i) => i);
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
          if (stopIndexes && validCoords.length <= MAX) {
            url += `&waypoints=${stopIndexes.join(';')}`;
          }
          if (bearings && Array.isArray(bearings) && bearings.length === validCoords.length) {
            let segBearings = bearings.slice(i, i + MAX);
            if (i !== 0) segBearings.unshift(bearings[i - 1]);
            const bStr = segBearings
              .map(b => (Array.isArray(b) ? b.join(',') : ''))
              .join(';');
            url += `&bearings=${bStr}`;
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
  
    const gnDebugPath = async (
      points = coords,
      mode = navigationMode,
      lang = getSelectedLanguage()
    ) => {
      console.log('[GN DEBUG]', 'Debugging path');
      console.log('[GN DEBUG]', 'Waypoints:', points);
      console.log('[GN DEBUG]', 'Mode:', mode, 'Lang:', lang);
      const bearings = computeBearings(points);
      const result = await fetchDirections(points, mode, true, lang, null, bearings);
      console.log('[GN DEBUG]', 'Total distance', result.distance, 'm');
      console.log('[GN DEBUG]', 'Total duration', result.duration, 'sec');
      result.steps.forEach((step, i) => {
        const m = step.maneuver;
        console.log(
          '[GN DEBUG]',
          `Step ${i + 1}: ${m.instruction} (type: ${m.type}, modifier: ${m.modifier || 'none'})`
        );
      });
      return result;
    };
    window.gnDebugPath = gnDebugPath;
  
    const gnDebugBearings = (points = coords, threshold = 15) => {
      if (!Array.isArray(points) || points.length < 2) {
        console.log('[GN DEBUG]', 'Need at least two points to compute bearings');
        return;
      }
      console.log('[GN DEBUG]', 'Bearings between waypoints:');
      let prev = null;
      for (let i = 0; i < points.length - 1; i++) {
        const start = points[i];
        const end = points[i + 1];
        const ang = Math.round(bearingBetween(start, end));
        let turn = '';
        if (prev !== null) {
          let diff = ((ang - prev + 540) % 360) - 180;
          if (Math.abs(diff) < threshold) {
            turn = 'STRAIGHT';
          } else if (diff > 0) {
            turn = 'RIGHT';
          } else {
            turn = 'LEFT';
          }
          turn = ` (${turn})`;
        }
        console.log('[GN DEBUG]', `Waypoint ${i} (${start.join(',')}) -> Waypoint ${i + 1} (${end.join(',')}); ${ang}\u00B0${turn}`);
        prev = ang;
      }
    };
    window.gnDebugBearings = gnDebugBearings;
  
    async function startNavigation() {
      if (!navigator.geolocation) {
        log("Geolocation not supported.");
        isNavigating = false;
        const btn = document.getElementById('gn-nav-toggle');
        if (btn) btn.textContent = '▶ Start Navigation';
        return;
      }
  
      isNavigating = true;
      const toggleBtn = document.getElementById('gn-nav-toggle');
      if (toggleBtn) toggleBtn.textContent = '■ Stop Navigation';
  
      navigator.geolocation.getCurrentPosition(async (pos) => {
          const lang = getSelectedLanguage();
          if (!window.speechSynthesis) {
            // alert("Voice guidance is not supported in your browser.");
          } else {
            checkVoiceAvailability(lang);
          }
        const userLngLat = [pos.coords.longitude, pos.coords.latitude];
        const waypoints = coords.slice(0, -1);
        const destination = coords[coords.length - 1];
        const ordered = [userLngLat, ...waypoints, destination];
        const stopIndexes = [0];
        if (currentRoute === 'default') {
          gnMapData.locations.forEach((loc, i) => {
            if (!loc.waypoint) stopIndexes.push(i + 1);
          });
        } else {
          for (let i = 1; i < ordered.length; i++) {
            stopIndexes.push(i);
          }
        }
        const bearings = computeBearings(ordered);
        const {
          coordinates: routeCoords,
          steps,
          distance,
          duration,
        } = await fetchDirections(
          ordered,
          navigationMode,
          true,
          lang,
          stopIndexes,
          bearings
        );
        if (!routeCoords.length) {
          log("No route found.");
          isNavigating = false;
          if (toggleBtn) toggleBtn.textContent = '▶ Start Navigation';
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
              "line-color": "#1198B3",
              "line-width": 8,
            },
          });
        }
  
        map.flyTo({ center: userLngLat, zoom: 15 });
        updateTracker(userLngLat);
        log("Navigation route displayed.");
  
        const isVoiceMuted = () => localStorage.getItem("gn_voice_muted") === "true";
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
              currentElevation
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
          if (!isVoiceMuted()) window.speechSynthesis.speak(msg);
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
  
        watchId = navigator.geolocation.watchPosition(async pos => {
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
  
          const elev = await fetchElevation(pos.coords.latitude, pos.coords.longitude);
          if (elev !== null) currentElevation = elev;
          updatePanel();
        }, err => log('Geolocation watch error', err.message), { enableHighAccuracy: true });
  
        // store watchId globally if needed to stop later
      }, err => {
        log("Geolocation error:", err.message);
        isNavigating = false;
        if (toggleBtn) toggleBtn.textContent = '▶ Start Navigation';
      });
    }
  
    setupDebugPanel();
    setupNavPanel();
    setupLightbox();
    setupCarousel();
    function getTrackerEmoji() {
      if (navigationMode === 'driving') return '🚗';
      if (navigationMode === 'cycling') return '🚲';
      return '🚶';
    }

    // Return Mapbox Maki icon name for the current navigation mode.  Using
    // icons instead of emojis ensures the tracker is visible on all systems.
    function getTrackerIcon() {
      if (navigationMode === 'driving') return 'car-15';
      if (navigationMode === 'cycling') return 'bicycle-15';
      return 'pedestrian-15';
    }
  
    function updateTracker(coord) {
      // Convert the provided coordinate into a GeoJSON point so Mapbox GL can
      // easily render it as a layer source. The tracker layer displays a moving
      // emoji that represents the user's position during navigation.
      const data = { type: 'Feature', geometry: { type: 'Point', coordinates: coord } };
  
      // Log whenever updateTracker runs so we know the function is executing and
      // which coordinate it's attempting to render.
      console.log('[GN DEBUG]', 'updateTracker called with', coord);
  
      if (!map.getSource('route-tracker')) {
        // When the source doesn't exist we create it and also add the layer that
        // displays the moving tracker icon. This ensures the layer gets added only
        // once during initial navigation start.
        console.log('[GN DEBUG]', 'Adding route-tracker source and layer');
        map.addSource('route-tracker', { type: 'geojson', data });
  
        // Add the tracker layer if it doesn't already exist. Without this check
        // Mapbox would throw an error when the layer ID is duplicated.
        if (!map.getLayer('route-tracker')) {
          map.addLayer({
            id: 'route-tracker',
            type: 'symbol',
            source: 'route-tracker',
            layout: {
              // Use a Maki icon instead of emoji for better cross-device support
              'icon-image': getTrackerIcon(),
              'icon-size': 1.5,
              'icon-allow-overlap': true
            },
            paint: {
              // Set the icon colour and halo for visibility
              'icon-color': '#ff4500',
              'icon-halo-color': '#ffffff',
              'icon-halo-width': 2
            }
          });
        }
      } else {
        // If the layer already exists, simply update the source data and ensure
        // the current emoji matches the navigation mode.
        console.log('[GN DEBUG]', 'Updating existing route-tracker layer');
        map.getSource('route-tracker').setData(data);
        map.setLayoutProperty('route-tracker', 'icon-image', getTrackerIcon());
      }
  
      // After updating, log the icon actually being used so we can verify it
      // appears on screen. If the layer failed to add, this will output "null".
      const icon = map.getLayer('route-tracker')
        ? map.getLayoutProperty('route-tracker', 'icon-image')
        : null;
      console.log('[GN DEBUG]', 'Current tracker icon:', icon);
  
      if (!map.getSource('trail-line')) {
        map.addSource('trail-line', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
        });
        map.addLayer({
          id: 'trail-line',
          type: 'line',
          source: 'trail-line',
          paint: {
            // show covered portion of the route in blue
            'line-color': '#007CBF',
            'line-width': 6,
            'line-opacity': 0.7
          }
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
    };
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
})();
