<?php
/*
Plugin Name: GN Mapbox Locations with ACF
Description: Display custom post type locations using Mapbox with ACF-based coordinates and rich popups.
Version: 1.3
Author: George Nicolaou
*/

defined('ABSPATH') || exit;

require 'plugin-update-checker/plugin-update-checker.php';
use YahnisElsts\PluginUpdateChecker\v5\PucFactory;

$myUpdateChecker = PucFactory::buildUpdateChecker(
	'https://github.com/GeorgeWebDevCy/drousia-map/',
	__FILE__,
	'gn-mapbox-plugin'
);

//Set the branch that contains the stable release.
$myUpdateChecker->setBranch('main');

//Optional: If you're using a private repository, specify the access token like this:
//$myUpdateChecker->setAuthentication('your-token-here');


// Register Custom Post Type
function gn_register_map_location_cpt() {
    register_post_type('map_location', [
        'label' => 'Map Locations',
        'public' => true,
        'menu_icon' => 'dashicons-location-alt',
        'supports' => ['title', 'editor', 'thumbnail'],
    ]);
}
add_action('init', 'gn_register_map_location_cpt');

// Enqueue Scripts and Styles
function gn_enqueue_mapbox_assets() {
    wp_enqueue_style('mapbox-gl', 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css');
    wp_enqueue_style('gn-mapbox-style', plugin_dir_url(__FILE__) . 'css/mapbox-style.css');

    wp_enqueue_script('mapbox-gl', 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js', [], null, true);
    wp_enqueue_script('chartjs', 'https://cdn.jsdelivr.net/npm/chart.js', [], null, true);
    wp_enqueue_script(
        'gn-mapbox-init',
        plugin_dir_url(__FILE__) . 'js/mapbox-init.js',
        ['jquery', 'chartjs'],
        null,
        true
    );

    wp_localize_script('gn-mapbox-init', 'gnMapData', [
        'accessToken' => get_option('gn_mapbox_token'),
        'locations' => gn_get_map_locations(),
    ]);
}
add_action('wp_enqueue_scripts', 'gn_enqueue_mapbox_assets');

// Get locations using ACF fields
function gn_get_map_locations() {
    $query = new WP_Query([
        'post_type' => 'map_location',
        'posts_per_page' => -1,
    ]);

    $locations = [];

    while ($query->have_posts()) {
        $query->the_post();
        $lat = get_field('latitude');
        $lng = get_field('longitude');

        if ($lat && $lng) {
            $locations[] = [
                'title' => get_the_title(),
                'content' => apply_filters('the_content', get_the_content()),
                'image' => get_the_post_thumbnail_url(get_the_ID(), 'medium'),
                'lat' => floatval($lat),
                'lng' => floatval($lng),
            ];
        }
    }
    wp_reset_postdata();
    return $locations;
}

// Shortcode to render map
function gn_map_shortcode() {
    return '<div id="gn-mapbox-map" style="width: 100%; height: 1080px;"></div>';
}
add_shortcode('gn_map', 'gn_map_shortcode');

// Admin Settings Page for API Key
function gn_mapbox_add_admin_menu() {
    add_options_page('GN Mapbox Settings', 'GN Mapbox', 'manage_options', 'gn-mapbox', 'gn_mapbox_settings_page');
}
add_action('admin_menu', 'gn_mapbox_add_admin_menu');

function gn_mapbox_settings_page() {
    ?>
    <div class="wrap">
        <h1>GN Mapbox Settings</h1>
        <form method="post" action="options.php">
            <?php
            settings_fields('gn_mapbox_settings');
            do_settings_sections('gn-mapbox');
            submit_button();
            ?>
        </form>
    </div>
    <?php
}

function gn_mapbox_settings_init() {
    register_setting('gn_mapbox_settings', 'gn_mapbox_token');

    add_settings_section(
        'gn_mapbox_section',
        'Mapbox API Key',
        null,
        'gn-mapbox'
    );

    add_settings_field(
        'gn_mapbox_token',
        'Access Token',
        'gn_mapbox_token_render',
        'gn-mapbox',
        'gn_mapbox_section'
    );
}
add_action('admin_init', 'gn_mapbox_settings_init');

function gn_mapbox_token_render() {
    $value = get_option('gn_mapbox_token');
    echo '<input type="password" name="gn_mapbox_token" value="' . esc_attr($value) . '" style="width: 400px;" autocomplete="off">';
}