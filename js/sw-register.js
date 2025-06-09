if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register(gnMapData.swPath)
      .catch(function(err) {
        console.error('Service worker registration failed:', err);
      });
  });
}
