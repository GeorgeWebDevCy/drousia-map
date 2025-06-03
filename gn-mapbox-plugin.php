<?php
/*
Plugin Name: GN Mapbox Locations with Navigation
Description: Mapbox map with CPT locations, live tracking, elevation profiles, directions, voice navigation, and debug mode.
Version: 2.3
Author: George Nicolaou
*/

if (!defined('ABSPATH')) exit;

// GitHub Auto Update (optional)
require 'plugin-update-checker/plugin-update-checker.php';
use YahnisElsts\PluginUpdateChecker\v5\PucFactory;
$updateChecker = PucFactory::buildUpdateChecker(
    'https://github.com/GeorgeWebDevCy/drousia-map/',
    __FILE__,
    'gn-mapbox-plugin'
);
$updateChecker->setBranch('main');

// Register CPT
function gn_register_map_location_cpt() {
    register_post_type('map_location', [
        'label' => 'Map Locations',
        'public' => true,
        'menu_icon' => 'dashicons-location-alt',
        'supports' => ['title', 'editor', 'thumbnail'],
        'show_in_rest' => true,
    ]);
}
add_action('init', 'gn_register_map_location_cpt');

// Get ACF coordinates
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
                'image' => get_the_post_thumbnail_url(get_the_ID(), 'medium') ?: '',
                'lat' => floatval($lat),
                'lng' => floatval($lng),
            ];
        }
    }
    wp_reset_postdata();
    return $locations;
}

// Shortcode
function gn_map_shortcode($atts) {
    $atts = shortcode_atts(['height' => '100vh'], $atts);
    return '<div id="gn-mapbox-map" style="width:100%;height:' . esc_attr($atts['height']) . ';"></div>';
}
add_shortcode('gn_map', 'gn_map_shortcode');

// Enqueue assets
function gn_enqueue_mapbox_assets() {
    if (is_singular() && has_shortcode(get_post()->post_content, 'gn_map')) {
        wp_enqueue_style('mapbox-gl', 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css');
        wp_enqueue_style('mapbox-directions', 'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-directions/v4.1.1/mapbox-gl-directions.css');
        wp_enqueue_style('gn-mapbox-style', plugin_dir_url(__FILE__) . 'css/mapbox-style.css');

        wp_enqueue_script('mapbox-gl', 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js', [], null, true);
        wp_enqueue_script('mapbox-directions', 'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-directions/v4.1.1/mapbox-gl-directions.js', ['mapbox-gl'], null, true);
        wp_enqueue_script('chartjs', 'https://cdn.jsdelivr.net/npm/chart.js', [], null, true);
        wp_enqueue_script('gn-mapbox-init', plugin_dir_url(__FILE__) . 'js/mapbox-init.js', ['jquery', 'mapbox-directions', 'chartjs'], null, true);

        wp_localize_script('gn-mapbox-init', 'gnMapData', [
            'accessToken' => get_option('gn_mapbox_token'),
            'locations'   => gn_get_map_locations(),
            'debug'       => (bool) get_option('gn_mapbox_debug'),
        ]);
    }
}
add_action('wp_enqueue_scripts', 'gn_enqueue_mapbox_assets');

// Admin menu
function gn_mapbox_add_admin_menu() {
    add_options_page('GN Mapbox Settings', 'GN Mapbox', 'manage_options', 'gn-mapbox', 'gn_mapbox_settings_page');
}
add_action('admin_menu', 'gn_mapbox_add_admin_menu');

// Admin UI
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

// Register settings
function gn_mapbox_settings_init() {
    register_setting('gn_mapbox_settings', 'gn_mapbox_token');
    register_setting('gn_mapbox_settings', 'gn_mapbox_debug');

    add_settings_section('gn_mapbox_section', 'Mapbox Settings', null, 'gn-mapbox');

    add_settings_field('gn_mapbox_token', 'Mapbox Access Token', function () {
        $val = get_option('gn_mapbox_token');
        echo '<input type="password" name="gn_mapbox_token" value="' . esc_attr($val) . '" style="width: 400px;" />';
    }, 'gn-mapbox', 'gn_mapbox_section');

    add_settings_field('gn_mapbox_debug', 'Enable Debug Mode', function () {
        $checked = checked(1, get_option('gn_mapbox_debug'), false);
        echo '<label><input type="checkbox" name="gn_mapbox_debug" value="1" ' . $checked . '> Show console debug messages</label>';
    }, 'gn-mapbox', 'gn_mapbox_section');
}
add_action('admin_init', 'gn_mapbox_settings_init');