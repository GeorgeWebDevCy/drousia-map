# GN Mapbox Locations with ACF

This WordPress plugin displays custom post type locations on a Mapbox map. It allows visitors to view markers, follow routes and even get spoken navigation.

## Features
- "Map Location" custom post type stores coordinates, descriptions and optional photo galleries.
- Embed a full Mapbox map anywhere with the `[gn_map]` shortcode.
- Draggable navigation panel provides driving, walking and cycling directions with voice guidance.
- Spoken instructions use the browser's speech synthesis API and can be muted or unmuted.
- Animated route line tracks progress and may be paused or resumed at any time.
- Optional elevation graph and route statistics.
- On-screen debug panel and console logs when debugging is enabled.
- Service worker caches Mapbox tiles so viewed maps continue working offline.
- Front-end photo uploads let visitors contribute images pending admin approval.
- Upload forms appear automatically in each map popup and within the location post.
- Example locations from `data/locations.json` are imported if none exist.
- Built-in update checker fetches new versions directly from GitHub.

## Installation
1. Upload the plugin to your `/wp-content/plugins/` directory.
2. Activate it through the WordPress "Plugins" screen.
3. Enter your Mapbox access token in **Settings → GN Mapbox**.

## Usage
Create `Map Location` posts with latitude and longitude fields and place the `[gn_map]` shortcode on any page.

## Approving Uploaded Photos
After visitors submit photos, they appear under **Media → Photo Approvals** in the WordPress admin. Review each image and click **Approve** to publish it to the corresponding location gallery.

## Debugging
Enable the **Debug Panel** setting under **Settings → GN Mapbox** to output detailed logs to the browser console and on-screen panel.

## Offline Caching
A service worker caches Mapbox tiles for offline use once a page has been loaded online. The map will then continue working with the cached tiles when the network is unavailable.

## Default Locations
If no `Map Location` posts exist, the plugin imports the coordinates from
`data/locations.json` into the custom post type. When the JSON fallback is used
at runtime, those locations are also created as posts so all features keep
working. Update this file to change the built-in locations.

## Changelog
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
