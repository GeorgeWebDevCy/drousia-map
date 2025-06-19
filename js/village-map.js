document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('gn-village-map');
  if (!container || !window.mapboxgl || !window.gnVillageData) return;

  mapboxgl.accessToken = gnVillageData.accessToken;
  const map = new mapboxgl.Map({
    container: container,
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [32.394, 34.968],
    zoom: 15
  });

  map.addControl(new mapboxgl.NavigationControl(), 'top-left');

  map.on('load', () => {
    // boundary polygon with dashed line
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
      id: 'village-boundary-line',
      type: 'line',
      source: 'village-boundary',
      paint: {
        'line-color': '#ff0000',
        'line-width': 2,
        'line-dasharray': [2,2]
      }
    });

    // markers with labels
    gnVillageData.points.forEach(pt => {
      const el = document.createElement('img');
      el.src = gnVillageData.iconPath + pt.icon + '.svg';
      el.style.width = '24px';
      el.style.height = '24px';
      const popup = new mapboxgl.Popup({offset:25})
        .setHTML(`<strong>${pt.name_el}</strong><br>${pt.name_en}`);
      new mapboxgl.Marker({element: el})
        .setLngLat([pt.lng, pt.lat])
        .setPopup(popup)
        .addTo(map);
    });
  });
});
