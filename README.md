# GN Mapbox Locations with ACF

This WordPress plugin displays custom post type locations on a Mapbox map. It allows visitors to view markers, follow routes and even get spoken navigation.

## Features
 - "Map Location" custom post type stores coordinates, descriptions and unlimited gallery media.
- `[gn_map]` shortcode embeds a fully interactive Mapbox map anywhere on your site.
- `[gn_mapbox_drouseia]` shortcode shows Drouseia with a marker and red boundary line around the village.
- `[gn_mapbox_drousia_paphos]`, `[gn_mapbox_drousia_polis]` and `[gn_mapbox_paphos_airport]` provide driving directions between popular destinations.
 - Responsive popups display images, descriptions and media upload forms.
 - Gallery items open in a lightbox that scales beautifully on all devices.
- Draggable navigation panel offers driving, walking and cycling directions with voice guidance.
- Map labels and voice guidance follow the selected language.
- Spoken instructions use the browser speech API and can be muted or unmuted at any time.
- Animated route line with optional elevation graph and real-time statistics.
- On-screen debug panel and console logs when debugging is enabled.
- Service worker caches Mapbox tiles so viewed maps continue working offline.
- Visitors can upload photos or videos from the front end; admins can approve or delete submissions before publishing.
- Upload forms automatically appear in map popups and inside each location post.
- Example locations from `data/locations.json` are imported if none exist.
- Built-in update checker fetches new versions directly from GitHub.
- Ready for translation and WPML compatible.

## Installation
1. Upload the plugin to your `/wp-content/plugins/` directory.
2. Activate it through the WordPress "Plugins" screen.
3. Enter your Mapbox access token in **Settings → GN Mapbox**.

## Usage
Create `Map Location` posts with latitude and longitude fields and place the `[gn_map]` shortcode on any page.
### 2.172.0
- Fix tracker icon not showing in navigation mode by using Mapbox Maki icons for different navigation modes (car, bicycle and pedestrian)
- Bumped plugin version
### 2.171.0
- Ensure debug panel initializes if script loads after DOM ready
- Bumped plugin version
### 2.170.0
- Gated debug logs behind plugin setting
- Renamed Paphos airport shortcode function
- Bumped plugin version
### 2.169.0
- Added missing tracker layer check and bumped plugin version
### 2.168.0
- Bumped plugin version
### 2.167.0
- Added debug logs for tracker icon visibility
- Bumped plugin version
### 2.166.0
- Extremely verbose comments added for clarity
- Bumped plugin version
### 2.165.0
- Restore visible tracker emoji for navigation
- Bumped plugin version
### 2.164.0
- Fix toggle button labels for voice and navigation
- Bumped plugin version
### 2.163.0
- Replace emoji tracker with Mapbox icons
- Bumped plugin version
### 2.162.0
- Thicker tracker line and visible tracker emoji
- Bumped plugin version
### 2.161.0
- Larger navigation tracker icon
- Trail line color changed to blue
- Bumped plugin version
### 2.160.0
- Reverted navigation mode icon change
- Bumped plugin version
### 2.158.0
- Recalculate stats when changing navigation mode
- Bumped plugin version
### 2.157.0
- Use clamp for responsive popup width
- Bumped plugin version
### 2.156.0
- Removed voice consent prompt
- Bumped plugin version
### 2.155.0
- Commented out voice alert popups
- Bumped plugin version
### 2.153.0
- Display location photos in a carousel
- Bumped plugin version
### 2.152.0
- Route line retains blue color during navigation
- Bumped plugin version
### 2.151.0
- Stats panel shows distance, time and elevation for selected routes
- Bumped plugin version
### 2.150.0
- Fixed Directions API request when starting navigation on driving routes
- Bumped plugin version
### 2.149.0
- All routes now use the Mapbox Directions API for navigation
- Covered segments of the route now display in green during navigation
- Bumped plugin version
### 2.148.0
- Reverted to v2.145.0 code base and bumped version
### 2.145.0
- Navigation UI improvements and bug fixes

### 2.143.0
- Updated route line color and navigation panel layout

### 2.142.3
- Fixed coordinates for Paphos, Polis and airport driving routes

### 2.142.2
- Updated route labels to direct visitors toward Drouseia
- Reversed driving routes for Paphos, Polis and the airport
### 2.142.0
- Reverted plugin to version 2.134.0 state

### 2.134.0
- Removed waypoint WP20.3 between points 20 and 21

### 2.133.0
- Added waypoints WP20.1 to WP20.6 between points 20 and 21

### 2.132.0
- Inserted waypoints WP14.1, WP14.2 and WP14.3 for smoother navigation
### 2.131.0
- Inserted waypoint between points 11 and 12 for straighter routing
### 2.130.0
- Inserted additional waypoint between points 10 and 11
### 2.129.0
- `gnDebugBearings` now reports LEFT, RIGHT or STRAIGHT for each turn
### 2.128.0
- Added `gnDebugBearings` function to log segment bearings in the console
### 2.127.0
- Apply bearings to all coordinates for more accurate routing

### 2.126.0
- Added `bearings` parameter to directions helper

### 2.125.0
- Revert dataset to version 2.106.0

### 2.124.0
- Hide all waypoints

### 2.123.0
- Reintroduce waypoint WP14.1 for improved routing
### 2.122.0
- Pass waypoint indexes to Directions API for accurate routing
### 2.121.1
- Add `gnDebugPath` console function for inspecting route creation
### 2.121.0
- Fix duplicate straight route near Πιττοκόπος
### 2.120.0
- Keep popups open on hover until closed
- Restore location-style marker icons
### 2.119.0
- Show popups on marker hover and update icon styling
### 2.118.0
- Make WP2.1, WP2.2 and WP3.1 visible for debugging
### 2.116.0
- Add waypoints WP2.1, WP2.2 and WP3.1
### 2.115.0
- Revert dataset to version 2.106.0
### 2.106.0
- Add waypoints to ensure right turn from start
### 2.104.0
- Fixed coordinates for multiple Beloa locations in Drousia

### 2.102.0
- Repositioned Οικισμός Πιττοκόπος near the main road at 34.97415, 32.38285

### 2.101.0
- Moved Βολατζιές and Οικισμός Πιττοκόπος onto the main road

### 2.100.0
- Repositioned Βολατζιές closer to the main road

### 2.99.0
- Repositioned three locations along the main road near Drouseia

### 2.98.0
- Repositioned three locations along the main road near Drousia

### 2.97.0
- Repositioned three locations along the main road

### 2.96.0
- Adjusted coordinates for three locations on the main road

### 2.95.0
- No code changes; version bump
### 2.94.0
- Default route uses Mapbox Directions to follow roads
### 2.93.0
- Import all 15 default locations without skipping duplicates

### 2.92.0
- Default route expects 15 coordinates and loop closes properly


### 2.86.0
- Route drawn using LineString from 14 non-waypoint locations
### 2.85.0
- Route drawn using manual LineString with 31 coordinates
### 2.84.0
- Route line drawn using direct coordinates
### 2.83.0
- Driving icon remains selected but walking directions are used by default
### 2.82.0
- Driving mode selected by default
### 2.81.0
- Driving icon requests walking directions to avoid multi-route behavior
### 2.78.0
- Fix nature path route using only start, end and waypoint coordinates
### 2.77.0
- Nature path line uses all location posts in order
### 2.76.0
- No code changes; version bump
### 2.75.0
- Default route fetches directions using the selected navigation mode
### 2.74.0
- No code changes; version bump
### 2.73.0
- No code changes; version bump
### 2.72.0
- Fix nature path route using only start, end and waypoint coordinates
- Nature Path is selected by default
### 2.71.0
- Stats panel accounts for distance when deviating from the route
### 2.70.0
- Ignore invalid coordinates when fetching directions
### 2.69.0
- Stats panel updates continuously while navigating
### 2.68.0
- Version bump after rolling back to 2.65.0
### 2.65.0
- Navigation and debug panel widths consistent on mobile
### 2.64.0
- Clear leftover MapboxDirections layers when switching routes
### 2.63.0
- Navigation panel uses flag and mode icons and slimmer controls
### 2.62.0
- Navigation panel width reduced for better responsiveness
### 2.61.0
- Navigation panel can be closed and reopened
- Directions instructions panel hidden
- Route progress tracked with colored trail
- Stats panel now labels distance, time and elevation
### 2.60.0
- Points A and B reversed on driving direction shortcodes
### 2.59.0
- Driving routes now draw a line using the Directions API
### 2.58.0
- Satellite streets style for all maps
### 2.57.0
- Terrain style enabled for all maps
### 2.56.0
- `[gn_mapbox_drouseia_100]` height set to 480px
### 2.55.0
- Allow multiple file uploads when submitting media to locations

- `[gn_mapbox_drouseia_100]` map fills the entire viewport
### 2.54.0
- Terrain map style for `[gn_mapbox_drouseia]` and new `[gn_mapbox_drouseia_100]`
- Added `[gn_mapbox_drouseia_100]` shortcode for a full-width map
### 2.53.0
- Added console log when the route line is drawn
- Map recenters when changing routes
### 2.51.0
- Fetch driving route when changing dropdown options
### 2.50.0
- Added error handling for Directions API requests
### 2.49.0
- Navigation panel option renamed to "Nature Path" and additional console logs added
### 2.48.0
- Route settings from direction shortcodes applied to `[gn_map]`
### 2.47.0
- Route selection panel added to `[gn_map]`
### 2.46.1
- Set `alternatives=false` for Directions API requests
### 2.46.0
- Added Greek descriptions for locations
### 2.45.0
- Updated Greek location names
### 2.44.0
- Driving shortcodes load the Mapbox Directions script
### 2.43.0
- Shortcodes now set `mapboxgl.accessToken` from the plugin API key
### 2.42.0
- Graceful message shown when the Mapbox access token is missing
### 2.41.0
- Driving direction shortcodes `[gn_mapbox_drousia_paphos]`, `[gn_mapbox_drousia_polis]` and `[gn_mapbox_paphos_airport]`
### 2.40.0
- `[gn_mapbox_drouseia]` zooms in two levels and centers on Drouseia
### 2.38.0
- `[gn_mapbox_drouseia]` uses a Google-like map style, refined polygon boundary and a closer zoom
### 2.37.0
- `[gn_mapbox_drouseia]` now draws a polygon boundary around the village and zooms in closer
### 2.36.0
- `[gn_mapbox_drouseia]` uses updated coordinates and smoother circle
### 2.35.0
- Wider circular boundary and zoom level adjusted on `[gn_mapbox_drouseia]`
### 2.34.0
- `[gn_mapbox_drouseia]` boundary line is now drawn as a smooth circle
### 2.33.0
- Version bump for release consistency
Use the `[gn_mapbox_drouseia]` shortcode to show a standalone map with Drouseia's marker and red boundary line.

## Approving Uploaded Media
After visitors submit photos or videos, they appear under **Media → Photo Approvals** in the WordPress admin. Review each item and either **Approve** it to publish in the location gallery or **Delete** it permanently.

## Debugging
Enable the **Debug Panel** setting under **Settings → GN Mapbox** to output detailed logs to the browser console and on-screen panel.
Markers are logged in the order they appear in `data/locations.json`.

## Offline Caching
A service worker caches Mapbox tiles for offline use once a page has been loaded online. The map will then continue working with the cached tiles when the network is unavailable.

## Default Locations
If no `Map Location` posts exist, the plugin imports the coordinates from
`data/locations.json` into the custom post type. When the JSON fallback is used
at runtime, those locations are also created as posts so all features keep
working. Update this file to change the built-in locations.

## Changelog
### 2.118.0
- Make WP2.1, WP2.2 and WP3.1 visible for debugging
### 2.116.0
- Add waypoints WP2.1, WP2.2 and WP3.1
### 2.115.0
- Revert dataset to version 2.106.0
### 2.106.0
- Add waypoints to ensure right turn from start
### 2.104.0
- Fixed coordinates for multiple Beloa locations in Drousia
### 2.102.0
- Repositioned Οικισμός Πιττοκόπος near the main road at 34.97415, 32.38285
### 2.101.0
- Moved Βολατζιές and Οικισμός Πιττοκόπος onto the main road
### 2.100.0
- Repositioned Βολατζιές closer to the main road

### 2.99.0
- Repositioned three locations along the main road near Drouseia

### 2.98.0
- Repositioned three locations along the main road near Drousia

### 2.97.0
- Repositioned three locations for better road accuracy
### 2.96.0
- Adjusted coordinates for three locations on the main road

### 2.95.0
- No code changes; version bump
### 2.94.0
- Default route uses Mapbox Directions to follow roads
### 2.93.0
- Import all 15 default locations without skipping duplicates

### 2.92.0
- Default route expects 15 coordinates and loop closes properly

### 2.90.0
* Default dataset closes the loop by repeating the starting location

### 2.86.0
- Route drawn using LineString from 14 non-waypoint locations
### 2.85.0
- Route drawn using manual LineString with 31 coordinates
### 2.84.0
- Route line drawn using direct coordinates
### 2.83.0
- Driving icon remains selected but walking directions are used by default
### 2.82.0
- Driving mode selected by default
### 2.81.0
- Driving icon requests walking directions to avoid multi-route behavior
### 2.78.0
- Fix nature path route using only start, end and waypoint coordinates
### 2.77.0
- Nature path line uses all location posts in order
### 2.76.0
- No code changes; version bump
### 2.75.0
- Default route fetches directions using the selected navigation mode
### 2.74.0
- No code changes; version bump
### 2.73.0
- No code changes; version bump
### 2.72.0
- Fix nature path route using only start, end and waypoint coordinates
- Nature Path is selected by default
### 2.71.0
- Stats panel accounts for distance when deviating from the route
### 2.70.0
- Ignore invalid coordinates when fetching directions
### 2.69.0
- Stats panel updates continuously while navigating
### 2.68.0
- Version bump after rolling back to 2.65.0
### 2.65.0
- Navigation and debug panel widths consistent on mobile
### 2.64.0
- Clear leftover MapboxDirections layers when switching routes
### 2.63.0
- Navigation panel uses flag and mode icons and slimmer controls
### 2.62.0
- Navigation panel width reduced for better responsiveness
### 2.61.0
- Navigation panel can be closed and reopened
- Directions instructions panel hidden
- Route progress tracked with colored trail
- Stats panel now labels distance, time and elevation
### 2.60.0
- Points A and B reversed on driving direction shortcodes
### 2.59.0
- Driving routes now draw a line using the Directions API
### 2.58.0

- Satellite streets style for all maps
### 2.57.0

- Terrain style enabled for all maps
### 2.56.0

- `[gn_mapbox_drouseia_100]` height set to 480px
### 2.55.0

- Allow multiple file uploads when submitting media to locations
- `[gn_mapbox_drouseia_100]` map fills the entire viewport
### 2.54.0

- Terrain map style for `[gn_mapbox_drouseia]` and new `[gn_mapbox_drouseia_100]`
- Added `[gn_mapbox_drouseia_100]` shortcode for a full-width map
### 2.53.0
- Added console log when the route line is drawn
- Map recenters when changing routes
### 2.51.0
- Fetch driving route when changing dropdown options
### 2.50.0
- Added error handling for Directions API requests
### 2.49.0
- Navigation panel option renamed to "Nature Path" and additional console logs added
### 2.48.0
- Map centers and zooms using the driving shortcode settings
### 2.47.0
- Map loads without markers until a route is selected
### 2.46.1
- Set `alternatives=false` for Directions API requests
### 2.46.0
- Added Greek descriptions for locations
### 2.45.0
- Updated Greek location names
### 2.44.0
- Driving shortcodes load the Mapbox Directions script
### 2.43.0
- Shortcodes now set `mapboxgl.accessToken` from the plugin API key
### 2.42.0
- Graceful message shown when the Mapbox access token is missing
### 2.41.0
- Driving direction shortcodes `[gn_mapbox_drousia_paphos]`, `[gn_mapbox_drousia_polis]` and `[gn_mapbox_paphos_airport]`
### 2.40.0
- Map zooms in two levels and centers on Drouseia for `[gn_mapbox_drouseia]`
### 2.39.0
- Map zooms out four levels and centers on Drouseia for `[gn_mapbox_drouseia]`
### 2.38.0
- Navigation-day map style and improved polygon on `[gn_mapbox_drouseia]`
### 2.37.0
- Polygon boundary around Drouseia with closer zoom on `[gn_mapbox_drouseia]`
### 2.36.0
- Smoother circular boundary with corrected center and zoom on `[gn_mapbox_drouseia]`
### 2.35.0
- Wider boundary circle and adjusted zoom on `[gn_mapbox_drouseia]`
### 2.34.0
- More circular boundary line on `[gn_mapbox_drouseia]` map
### 2.32.0
- Drouseia map boundary styled like Google Maps
### 2.31.0
- Drouseia map now draws an outline polygon around the village
### 2.30.0
- Added `[gn_mapbox_drouseia]` shortcode for a simple map of Drouseia
### 2.29.0
- Support more than 25 coordinates by chunking Directions API requests
### 2.28.0
- Default route now follows the road using Mapbox Directions API
### 2.27.0
- Removed `[gn_village_map]` shortcode and related assets
### 2.26.0
- `[gn_village_map]` shortcode now displays only the village boundary

### 2.25.0
- Added `[gn_village_map]` shortcode for viewing the village boundary and points of interest
- Custom icons show hotels, taverns and villas with names in Greek and English
- Zoom controls enabled for full interactivity

### 2.24.3
- No code changes; version bump
### 2.24.1
- Updated default location dataset with invisible waypoints
### 2.24.0
- Position can now be edited from Quick Edit
### 2.23.0
- Locations can be ordered using a Position field and displayed in the admin list
### 2.22.1
- Fix route guidance for nature walks and rides
### 2.22.0
- Invisible waypoints supported for road-following routes
### 2.21.0
- Directions API uses ordered coordinates and displays elevation gain
### 2.20.0
- Route drawn directly from provided coordinates
### 2.19.0
- Video uploads now supported with approval and deletion
### 2.18.5
- Pending photo approval screen now includes a Delete option
### 2.18.4
- Points dataset now closes the loop at the starting location
### 2.18.3
- Document debug log order for points of interest
### 2.18.2
- Default route now returns to the starting point
### 2.18.1
- Removed Στρουμπί from the default locations dataset
### 2.18.0
- Map labels switch languages along with voice instructions
### 2.17.0
- Satellite view by default
- Navigation mode dropdown and icon buttons
- Distance/time panel and improved voice instructions
### 2.16.0
- Navigation panel more compact
### 2.15.0
- Images in popups now open in a responsive lightbox
- Documentation expanded with full feature list
### 2.14.0
- Added WPML compatibility and translations
### 2.13.1
- Fix upload URL when a hidden `action` field overrides the form property

### 2.13.0
- Prevent default form submission to avoid redirect errors

### 2.12.0
- Expanded documentation with detailed feature descriptions

### 2.11.0
- Fix pending photo approval listing
- Include location in upload success message
- Verbose debugging available in browser console

### 2.10.2
- Fixed upload form submission URL handling

### 2.10.1
- Fix duplicate upload form in popups
### 2.10.0
- Photo upload uses a single AJAX button and admin approval page
### 2.9.4
- Fallback locations now create posts if none exist and duplicate locations are avoided
### 2.9.3
- Photo upload shortcode automatically appended to Map Location posts
### 2.9.2
- Upload form placed after gallery content in map popups
### 2.9.1
- Upload form shortcode now appears in map popups
### 2.9.0
- Added front-end photo uploads pending approval
### 2.8.0
- Default locations are now imported as custom posts on activation if missing
### 2.7.1
- Added fallback location dataset loaded from `data/locations.json`
### 2.7.0
- Added photo gallery support for locations

### 2.6.0
- Added offline map caching using a service worker
- Updated documentation
