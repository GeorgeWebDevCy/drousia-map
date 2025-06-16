=== GN Mapbox Locations with ACF ===
Contributors: georgewebdev
Tags: mapbox,acf,locations,map
Requires at least: 5.0
Tested up to: 6.5
Stable tag: 2.19.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Display custom map locations on a Mapbox-powered map complete with voice guided navigation, animated routes, offline caching and media galleries.

== Description ==
GN Mapbox Locations with ACF creates a **Map Location** post type for storing coordinates, descriptions and images. Place the `[gn_map]` shortcode anywhere to display an interactive map. A draggable navigation panel gives visitors driving, walking or cycling directions with spoken instructions that can be muted. Routes can be animated and paused or resumed, while a service worker caches tiles for offline use. A debug panel outputs verbose logs when enabled. Visitors can submit photos or videos from the front end which administrators approve before publishing. Example locations are automatically imported if none exist.
== Features ==
* "Map Location" custom post type storing coordinates, descriptions and galleries.
* `[gn_map]` shortcode embeds an interactive Mapbox map anywhere.
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
