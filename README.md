# GN Mapbox Locations with ACF

This WordPress plugin displays custom post type locations on a Mapbox map. It allows visitors to view markers, follow routes and even get spoken navigation.

## Features
- "Map Location" custom post type stores coordinates, descriptions and unlimited gallery images.
- `[gn_map]` shortcode embeds a fully interactive Mapbox map anywhere on your site.
- Responsive popups display images, descriptions and photo upload forms.
- Gallery and featured images open in a lightbox that scales beautifully on all devices.
- Draggable navigation panel offers driving, walking and cycling directions with voice guidance.
- Map labels and voice guidance follow the selected language.
- Spoken instructions use the browser speech API and can be muted or unmuted at any time.
- Animated route line with optional elevation graph and real-time statistics.
- On-screen debug panel and console logs when debugging is enabled.
- Service worker caches Mapbox tiles so viewed maps continue working offline.
- Visitors can upload photos from the front end; submissions require admin approval.
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
