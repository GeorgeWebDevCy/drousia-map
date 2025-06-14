=== GN Mapbox Locations with ACF ===
Contributors: georgewebdev
Tags: mapbox,acf,locations,map
Requires at least: 5.0
Tested up to: 6.5
Stable tag: 2.9.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Display custom map locations using Mapbox with navigation, voice directions and offline caching.

== Description ==
This plugin lets you add Map Location posts containing coordinates and display them with a shortcode. It includes a navigation panel with voice instructions, an optional debug mode and now offline map tile caching via service worker.

== Installation ==
1. Upload the plugin folder to `/wp-content/plugins/`.
2. Activate the plugin through the Plugins menu.
3. Enter your Mapbox access token under **Settings → GN Mapbox**.

== Changelog ==
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
