document.addEventListener('DOMContentLoaded', function() {
  if (!document.getElementById('gn-village-map')) return;

  mapboxgl.accessToken = gnVillageData.accessToken;
  const map = new mapboxgl.Map({
    container: 'gn-village-map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [32.398, 34.964],
    zoom: 15
  });

  map.addControl(new mapboxgl.NavigationControl(), 'top-right');

  map.on('load', () => {
    map.addSource('village-boundary', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [gnVillageData.boundary]
        }
      }
    });

    map.addLayer({
      id: 'village-boundary',
      type: 'line',
      source: 'village-boundary',
      paint: {
        'line-color': '#000',
        'line-width': 2,
        'line-dasharray': [2, 2]
      }
    });

    gnVillageData.places.forEach(place => {
      const el = document.createElement('img');
      el.src = gnVillageData.icons[place.type];
      el.className = 'drouseia-marker';
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`<strong>${place.title_el}</strong><br>${place.title_en}`);
      new mapboxgl.Marker(el).setLngLat([place.lng, place.lat]).setPopup(popup).addTo(map);
    });
  });
});
