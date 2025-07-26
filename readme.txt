=== GN Mapbox Locations with ACF ===
Contributors: georgewebdev
Tags: mapbox,acf,locations,map
Requires at least: 5.0
Tested up to: 6.5
Stable tag: 2.172.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Display custom map locations on a Mapbox-powered map complete with voice guided navigation, animated routes, offline caching and media galleries.

== Description ==
GN Mapbox Locations with ACF creates a **Map Location** post type for storing coordinates, descriptions and images. Place the `[gn_map]` shortcode anywhere to display an interactive map. A draggable navigation panel gives visitors driving, walking or cycling directions with spoken instructions that can be muted. Routes can be animated and paused or resumed, while a service worker caches tiles for offline use. A debug panel outputs verbose logs when enabled. Visitors can submit photos or videos from the front end which administrators approve before publishing. Example locations are automatically imported if none exist.

== Features ==
* "Map Location" custom post type storing coordinates, descriptions and galleries.
* `[gn_map]` shortcode embeds an interactive Mapbox map anywhere.
* `[gn_mapbox_drouseia]` shortcode displays a map of Drouseia with a marker and red boundary line around the village.
* `[gn_mapbox_drousia_paphos]`, `[gn_mapbox_drousia_polis]` and `[gn_mapbox_paphos_airport]` show driving directions between key locations.
* Responsive popups show images, descriptions and a media upload form.
* Gallery items open in a lightbox and scale to any screen.
* Draggable navigation panel for driving, walking or cycling directions with voice guidance.
* Voice instructions can be muted or unmuted and support multiple languages.
* Animated route line with optional elevation graph and statistics.
* Debug panel outputs verbose logs on screen and to the browser console.
* Offline map tile caching via service worker.
* Visitors may upload photos or videos on the front end; admins can approve or delete each submission before publishing.
* Upload forms automatically appear in map popups and inside each location post.
* Example locations from `data/locations.json` are imported when none exist.
* Automatic update checks from GitHub.
* Ready for translation and WPML compatible.

== Installation ==
1. Upload the plugin folder to `/wp-content/plugins/`.
2. Activate the plugin through the Plugins menu.
3. Enter your Mapbox access token under **Settings → GN Mapbox**.

== Debugging ==
Enable the Debug Panel option in **Settings → GN Mapbox** to output verbose logs to the browser console.
Markers are logged in the order they appear in `data/locations.json`.

== Changelog ==
= 2.172.0 =
* Fix tracker icon not showing in navigation mode by using Mapbox Maki icons for different navigation modes (car, bicycle and pedestrian)
* Bumped plugin version
= 2.171.0 =
* Ensure debug panel initializes if script loads after DOM ready
* Bumped plugin version
= 2.170.0 =
* Gated debug logs behind plugin setting
* Renamed Paphos airport shortcode function
* Bumped plugin version
= 2.169.0 =
* Added missing tracker layer check
* Bumped plugin version
= 2.168.0 =
* Bumped plugin version
= 2.167.0 =
* Added debug logs for tracker icon visibility
* Bumped plugin version
= 2.166.0 =
* Extremely verbose comments added for clarity
* Bumped plugin version
= 2.165.0 =
* Restore visible tracker emoji for navigation
* Bumped plugin version
= 2.164.0 =
* Fix toggle button labels for voice and navigation
* Bumped plugin version
= 2.163.0 =
* Replace emoji tracker with Mapbox icons
* Bumped plugin version
= 2.162.0 =
* Tracker line thicker and tracker emoji visible
* Bumped plugin version
= 2.161.0 =
* Larger navigation tracker icon
* Trail line color changed to blue
* Bump version
= 2.160.0 =
* Reverted navigation mode icon change
* Bump version
= 2.158.0 =
* Recalculate stats when changing navigation mode
* Bump version
= 2.157.0 =
* Use clamp for responsive popup width
* Bump version
= 2.156.0 =
* Removed voice consent prompt
* Bumped version
= 2.155.0 =
* Commented out voice alert popups
* Bumped version
= 2.153.0 =
* Display location photos in a carousel
* Bumped version
= 2.152.0 =
* Keep route line blue during navigation
* Bumped version
= 2.151.0 =
* Stats panel shows distance, time and elevation for selected routes
* Bumped version
= 2.150.0 =
* Fixed Directions API usage when starting navigation on driving routes
* Bumped version
= 2.73.1 =
* Change some route coordinates

= 2.73.0 =
* No code changes; version bump
= 2.72.0 =
* Nature path route uses only start, end and waypoint coordinates
* Nature Path selected by default
= 2.71.0 =
* Distance, time and elevation stats now adjust when moving away from the route
= 2.70.0 =
* Ignore invalid coordinates when fetching directions
= 2.69.0 =
* Stats panel updates continuously while navigating
= 2.68.0 =
* Version bump after rolling back to 2.65.0
= 2.65.0 =
* Navigation and debug panel widths consistent on mobile
= 2.64.0 =
* Clear leftover MapboxDirections layers when switching routes
= 2.63.0 =
* Navigation panel uses flag and mode icons and slimmer controls
= 2.62.0 =
* Navigation panel width reduced for better responsiveness
= 2.61.0 =
* Navigation panel can be closed and reopened
* Directions instructions panel hidden
* Route progress tracked with colored trail
* Stats panel now label distance, time and elevation
= 2.60.0 =
* Points A and B reversed on driving direction shortcodes
= 2.59.0 =
* Driving routes now draw a line using the Directions API
= 2.58.0 =
* Satellite streets style for all maps
= 2.57.0 =
* Terrain style enabled for all maps
= 2.56.0 =
* `[gn_mapbox_drouseia_100]` height set to 480px

= 2.55.0 =
* Allow multiple file uploads when submitting media to locations
* `[gn_mapbox_drouseia_100]` map now fills the entire viewport
= 2.54.0 =
* Terrain map style for `[gn_mapbox_drouseia]` and new `[gn_mapbox_drouseia_100]`
* Added `[gn_mapbox_drouseia_100]` shortcode for a full-width map
= 2.53.0 =
* Added console log when the route line is drawn
* Map recenters when changing routes
= 2.51.0 =
* Fetch driving route when changing dropdown options
= 2.50.0 =
* Added error handling for Directions API requests
= 2.49.0 =
* Option label changed to "Nature Path" and added verbose console logs
= 2.48.0 =
* Map center and zoom now match the individual driving shortcodes
= 2.47.0 =
* Map loads empty and routes can be selected
= 2.46.1 =
* Set `alternatives=false` for Directions API requests
= 2.46.0 =
* Added Greek descriptions for locations
= 2.45.0 =
* Updated Greek location names
= 2.44.0 =
* Driving shortcodes now load the Mapbox Directions script
= 2.43.0 =
* Shortcodes now set `mapboxgl.accessToken` from the plugin API key

= 2.42.0 =
* Graceful message displayed when the Mapbox access token is missing
= 2.41.0 =
* Driving direction shortcodes `[gn_mapbox_drousia_paphos]`, `[gn_mapbox_drousia_polis]` and `[gn_mapbox_paphos_airport]`
= 2.40.0 =
* Map zooms in two levels and centers on Drouseia in `[gn_mapbox_drouseia]`
= 2.39.0 =
* Map zooms out four levels and centers on Drouseia in `[gn_mapbox_drouseia]`
= 2.38.0 =
* Google-like map style and improved polygon with closer zoom on `[gn_mapbox_drouseia]`
= 2.37.0 =
* Polygon boundary around the village with a closer zoom on `[gn_mapbox_drouseia]`
= 2.36.0 =
* Smoother boundary circle with updated coordinates and zoom on `[gn_mapbox_drouseia]`
= 2.35.0 =
* Wider circular boundary on `[gn_mapbox_drouseia]` map and adjusted zoom
= 2.34.0 =
* Boundary line on `[gn_mapbox_drouseia]` is now circular
= 2.33.0 =
* Version bump for release consistency
= 2.32.0 =
* Drouseia boundary line styled like Google Maps
= 2.31.0 =
* Drouseia map now draws an outline polygon around the village
= 2.30.0 =
* Added `[gn_mapbox_drouseia]` shortcode displaying a simple map of Drouseia
= 2.29.0 =
* Support more than 25 coordinates by chunking Directions API requests
= 2.28.0 =
* Default route now follows the road using Mapbox Directions API

= 2.27.0 =
* Removed `[gn_village_map]` shortcode and related assets
= 2.26.0 =
* `[gn_village_map]` shortcode now displays only the village boundary

= 2.25.0 =
* Added `[gn_village_map]` shortcode displaying Drouseia boundary and labelled markers
* Custom icons or Maki symbols show hotels, taverns and villas in Greek and English
* Zoom controls allow full interactivity
= 2.24.3 =
* No code changes; version bump
= 2.24.2 =
* Removed numbers from visible location names
= 2.24.1 =
* Updated default location dataset with invisible waypoints
= 2.24.0 =
* Position field can now be edited from Quick Edit
= 2.23.0 =
* Locations can be ordered using a Position field
* Position number displayed in the Map Location list
= 2.22.1 =
* Fix route guidance for nature walks and rides
= 2.22.0 =
* Invisible waypoints supported for road-following routes
= 2.21.0 =
* Directions API uses ordered coordinates and shows elevation gain
= 2.20.0 =
* Route drawn directly from provided coordinates
= 2.19.0 =
* Video uploads supported with approval and deletion
= 2.18.5 =
* Pending photo approval screen now allows deletion of images
= 2.18.4 =
* Points dataset now returns to the starting location
= 2.18.3 =
- No code changes; version bump and documentation on debug log order of points of interest
= 2.18.2 =
* Default route now returns to the starting point
= 2.18.1 =
* Removed Στρουμπί from the default locations dataset
= 2.18.0 =
* Map labels now switch language with the voice guidance
= 2.17.0 =
* Satellite map default, improved navigation controls
= 2.16.0 =
* Navigation panel more compact
= 2.15.0 =
* Images in popups now open in a responsive lightbox
* Expanded documentation of all features
= 2.14.0 =
* Added WPML compatibility and translations
= 2.13.1 =
* Fix upload URL when hidden `action` field overrides the form property
= 2.13.0 =
* Prevent default form submission to avoid redirect errors
= 2.12.0
* Expanded documentation with detailed feature descriptions

= 2.11.0 =
* Fixed pending uploads missing from Approvals screen
* Upload success message shows location name
* Added verbose console debugging option
= 2.10.2 =
* Fixed upload form submission URL handling
= 2.10.1 =
* Fix duplicate upload form in map popups
= 2.10.0 =
* Photo upload now uses a single button with AJAX
* Added admin page for approving uploaded photos
= 2.9.4 =
* Default locations from JSON now create posts if none exist and duplicates are prevented
= 2.9.3 =
* Ensure photo upload shortcode is appended to Map Location posts
= 2.9.2 =
* Upload form placed after gallery content in map popups
= 2.9.1 =
* Upload form shortcode now appears in map popups
= 2.9.0 =
* Front-end photo uploads require admin approval
= 2.8.0 =
* Default locations are imported as Map Location posts on activation
= 2.7.1 =
* Added fallback location dataset for sites without custom posts
= 2.7.0 =
* Added photo gallery support for locations

= 2.6.0 =
* Added offline map caching with a service worker
* Updated documentation
