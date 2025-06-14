# GN Mapbox Locations with ACF

This WordPress plugin displays custom post type locations on a Mapbox map. It allows visitors to view markers, follow routes and even get spoken navigation.

## Features
- Custom post type for locations
- Map display via shortcode `[gn_map]`
- Navigation panel with voice directions
- Route animation and elevation chart
- Optional debug panel
- **Offline map caching** (new in 2.6.0)
- Upload a photo gallery for each location
- Front-end photo uploads with admin approval
- Photo upload form available inside map popups

## Installation
1. Upload the plugin to your `/wp-content/plugins/` directory.
2. Activate it through the WordPress "Plugins" screen.
3. Enter your Mapbox access token in **Settings → GN Mapbox**.

## Usage
Create `Map Location` posts with latitude and longitude fields and place the `[gn_map]` shortcode on any page.

## Offline Caching
A service worker caches Mapbox tiles for offline use once a page has been loaded online. The map will then continue working with the cached tiles when the network is unavailable.

## Default Locations
If no `Map Location` posts exist, the plugin will import the coordinates from
`data/locations.json` into the custom post type on activation. Update this file
to change the built-in locations.

## Changelog
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
