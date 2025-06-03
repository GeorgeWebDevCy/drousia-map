document.addEventListener('DOMContentLoaded', function () {
    if (!gnMapData || !gnMapData.accessToken) return;

    mapboxgl.accessToken = gnMapData.accessToken;

    const map = new mapboxgl.Map({
        container: 'gn-mapbox-map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [33.429859, 35.126413],
        zoom: 8
    });

    map.addControl(new mapboxgl.NavigationControl());

    let destinationCoords = null;
    let userCoords = null;

    const directions = new MapboxDirections({
        accessToken: mapboxgl.accessToken,
        unit: 'metric',
        profile: 'mapbox/driving',
        controls: { instructions: true, inputs: false }
    });
    map.addControl(directions, 'top-left');

    function createNavigationUI() {
        const navBox = document.createElement('div');
        navBox.className = 'navigation-ui';
        navBox.innerHTML = `
            <strong>Navigate to Destination</strong><br>
            <label for="nav-mode">Mode:</label>
            <select id="nav-mode">
                <option value="driving">Driving</option>
                <option value="walking">Walking</option>
                <option value="cycling">Cycling</option>
            </select><br>
            <button id="start-navigation" disabled>Start Navigation</button>
        `;
        map.getContainer().appendChild(navBox);
    }

    createNavigationUI();

    navigator.geolocation.watchPosition(
        pos => {
            userCoords = [pos.coords.longitude, pos.coords.latitude];

            if (!map.getSource('user-location')) {
                map.addSource('user-location', {
                    type: 'geojson',
                    data: {
                        type: 'Point',
                        coordinates: userCoords
                    }
                });
                map.addLayer({
                    id: 'user-location',
                    type: 'circle',
                    source: 'user-location',
                    paint: {
                        'circle-radius': 6,
                        'circle-color': '#007cbf'
                    }
                });
            } else {
                map.getSource('user-location').setData({
                    type: 'Point',
                    coordinates: userCoords
                });
            }
        },
        err => console.warn('Geolocation error:', err),
        { enableHighAccuracy: true }
    );

    gnMapData.locations.forEach(loc => {
        const popupHTML = `
            <div class="popup-content">
                <h3>${loc.title}</h3>
                ${loc.image ? `<img src="${loc.image}" alt="${loc.title}">` : ''}
                <div>${loc.content}</div>
                <button class="select-destination" data-lng="${loc.lng}" data-lat="${loc.lat}">Navigate Here</button>
            </div>
        `;
        const popup = new mapboxgl.Popup().setHTML(popupHTML);
        new mapboxgl.Marker()
            .setLngLat([loc.lng, loc.lat])
            .setPopup(popup)
            .addTo(map);
    });

    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('select-destination')) {
            destinationCoords = [parseFloat(e.target.dataset.lng), parseFloat(e.target.dataset.lat)];
            document.getElementById('start-navigation').disabled = false;
        }
    });

    document.addEventListener('click', function (e) {
        if (e.target.id === 'start-navigation') {
            if (!userCoords || !destinationCoords) return;

            const mode = document.getElementById('nav-mode').value;
            directions.setProfile(`mapbox/${mode}`);
            directions.setOrigin(userCoords);
            directions.setDestination(destinationCoords);
        }
    });
});