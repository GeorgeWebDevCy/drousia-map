document.addEventListener('DOMContentLoaded', function () {
    if (!gnMapData || !gnMapData.accessToken) return;

    mapboxgl.accessToken = gnMapData.accessToken;
    const map = new mapboxgl.Map({
        container: 'gn-mapbox-map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [33.429859, 35.126413], // Cyprus
        zoom: 8
    });

    map.addControl(new mapboxgl.NavigationControl());

    // CPT markers
    gnMapData.locations.forEach(loc => {
        const popupHTML = `
            <div class="popup-content">
                <h3>${loc.title}</h3>
                ${loc.image ? `<img src="${loc.image}" alt="${loc.title}">` : ''}
                <div>${loc.content}</div>
            </div>
        `;
        new mapboxgl.Marker()
            .setLngLat([loc.lng, loc.lat])
            .setPopup(new mapboxgl.Popup().setHTML(popupHTML))
            .addTo(map);
    });

    // User tracking
    let userMarker;
    if ('geolocation' in navigator) {
        navigator.geolocation.watchPosition(
            pos => {
                const lng = pos.coords.longitude;
                const lat = pos.coords.latitude;

                if (userMarker) {
                    userMarker.setLngLat([lng, lat]);
                } else {
                    userMarker = new mapboxgl.Marker({ color: 'blue' })
                        .setLngLat([lng, lat])
                        .setPopup(new mapboxgl.Popup().setText("You are here"))
                        .addTo(map);
                }

                map.flyTo({ center: [lng, lat], zoom: 13 });
            },
            err => console.warn("Geolocation error:", err),
            { enableHighAccuracy: true }
        );
    } else {
        console.warn("Geolocation not supported in this browser.");
    }
});