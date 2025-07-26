# Known Bugs

## Unconditional Debug Logging
In `gn-mapbox-plugin.php`, multiple `error_log()` calls are executed every time map locations are loaded. These logs run regardless of the debug setting and can flood the server log files.

Relevant lines:
```
462          // Debug output to error log
463          error_log('Checking post: ' . get_the_title());
464          error_log('Latitude: ' . print_r($lat, true));
465          error_log('Longitude: ' . print_r($lng, true));
...
501      error_log('Total locations returned: ' . count($locations));
...
564                      error_log('Loaded ' . count($locations) . ' locations from JSON fallback');
566                      error_log('Failed to parse locations JSON');
569                  error_log('Fallback locations file not found');
```

## Mismatched Route Function Name
The shortcode for Paphos airport directions registers `gn_mapbox_paphos_airport`, but the associated function name implies the opposite route.

Relevant snippet:
```
1070  // Paphos Airport to Drouseia
1071  function gn_mapbox_paphos_to_airport_shortcode() {
...
1105  add_shortcode('gn_mapbox_paphos_airport', 'gn_mapbox_paphos_to_airport_shortcode');
```
The function name suggests a route from Paphos to the airport, while the comment and logic actually plot a route **from the airport to Drouseia**.
