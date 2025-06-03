document.addEventListener('DOMContentLoaded', () => {
  // Force debug mode ON for testing
  const debug = true;
  const mapContainer = document.getElementById('gn-mapbox-map');
  if (!mapContainer) return;

  // Debug panel
  const debugPanel = document.createElement('div');
  debugPanel.id = 'gn-debug-panel';
  debugPanel.style.cssText = `
    position: absolute;
    bottom: 10px;
    left: 10px;
    max-height: 30vh;
    max-width: 45vw;
    overflow-y: auto;
    background: rgba(0,0,0,0.85);
    color: #0f0;
    font-family: monospace;
    font-size: 11px;
    line-height: 1.4;
    padding: 8px 8px 32px;
    border-radius: 6px;
    z-index: 9999;
    white-space: pre-wrap;
  `;

  const clearBtn = document.createElement('button');
  clearBtn.innerText = 'Clear';
  clearBtn.style.cssText = `
    position: absolute;
    bottom: 5px;
    right: 8px;
    font-size: 10px;
    padding: 2px 6px;
    background: #222;
    color: #0f0;
    border: 1px solid #444;
    border-radius: 4px;
    cursor: pointer;
  `;
  clearBtn.onclick = () => debugPanel.textContent = '';
  debugPanel.appendChild(clearBtn);

  mapContainer.appendChild(debugPanel);

  // Logging function
  const log = (...args) => {
    const msg = '[GN DEBUG] ' + args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ');
    debugPanel.textContent += msg + '\n';
    console.log(...args);
  };

  // Initial test log
  log('✅ Debug panel loaded successfully.');
  log('🧪 This is a test message.');
});
