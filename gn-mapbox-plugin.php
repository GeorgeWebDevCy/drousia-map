<?php
/*
Plugin Name: GN Mapbox Locations with ACF
Description: Display custom post type locations using Mapbox with ACF-based coordinates, navigation, elevation, optional galleries and full debug panel.
Version: 2.8.0
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
$myUpdateChecker->setBranch('main');

function gn_register_map_location_cpt() {
    register_post_type('map_location', [
        'label' => 'Map Locations',
        'public' => true,
        'menu_icon' => 'dashicons-location-alt',
        'supports' => ['title', 'editor', 'thumbnail'],
    ]);
}
add_action('init', 'gn_register_map_location_cpt');

function gn_import_default_locations() {
    $json_file = plugin_dir_path(__FILE__) . 'data/locations.json';
    if (!file_exists($json_file)) {
        return;
    }

    $json = file_get_contents($json_file);
    $locations = json_decode($json, true);
    if (!is_array($locations)) {
        return;
    }

    foreach ($locations as $location) {
        if (empty($location['title'])) {
            continue;
        }

        $existing = get_page_by_title($location['title'], OBJECT, 'map_location');
        if ($existing) {
            continue;
        }

        $post_id = wp_insert_post([
            'post_title'   => wp_strip_all_tags($location['title']),
            'post_content' => $location['content'] ?? '',
            'post_status'  => 'publish',
            'post_type'    => 'map_location',
        ]);

        if (!is_wp_error($post_id)) {
            if (isset($location['lat'])) {
                update_post_meta($post_id, 'latitude', $location['lat']);
            }
            if (isset($location['lng'])) {
                update_post_meta($post_id, 'longitude', $location['lng']);
            }
        }
    }
}
register_activation_hook(__FILE__, 'gn_import_default_locations');

// Add photo gallery meta box
function gn_add_photos_meta_box() {
    add_meta_box('gn_location_photos', 'Location Photos', 'gn_photos_meta_box_html', 'map_location', 'normal', 'default');
}
add_action('add_meta_boxes', 'gn_add_photos_meta_box');

function gn_photos_meta_box_html($post) {
    wp_enqueue_media();
    wp_nonce_field('gn_save_photos', 'gn_photos_nonce');
    $image_ids = get_post_meta($post->ID, '_gn_location_photos', true);
    echo '<div id="gn-location-photos" style="margin-bottom:10px;">';
    if ($image_ids) {
        foreach (explode(',', $image_ids) as $id) {
            $url = wp_get_attachment_image_url($id, 'thumbnail');
            if ($url) {
                echo '<img src="' . esc_url($url) . '" style="max-width:100px;margin-right:10px;margin-bottom:10px;" />';
            }
        }
    }
    echo '</div>';
    echo '<input type="hidden" id="gn_location_photos_input" name="gn_location_photos" value="' . esc_attr($image_ids) . '" />';
    echo '<button type="button" class="button" id="gn_add_photos_button">Add Photos</button> ';
    echo '<button type="button" class="button" id="gn_clear_photos_button">Clear</button>';
    ?>
    <script>
    jQuery(function($){
        $('#gn_add_photos_button').on('click', function(e){
            e.preventDefault();
            var frame = wp.media({
                title: 'Select Photos',
                button: { text: 'Use these photos' },
                multiple: true
            });
            frame.on('select', function(){
                var ids = [];
                var container = $('#gn-location-photos').empty();
                frame.state().get('selection').map(function(att){
                    att = att.toJSON();
                    ids.push(att.id);
                    container.append('<img src="'+att.sizes.thumbnail.url+'" style="max-width:100px;margin-right:10px;margin-bottom:10px;" />');
                });
                $('#gn_location_photos_input').val(ids.join(','));
            });
            frame.open();
        });
        $('#gn_clear_photos_button').on('click', function(e){
            e.preventDefault();
            $('#gn_location_photos_input').val('');
            $('#gn-location-photos').empty();
        });
    });
    </script>
    <?php
}

function gn_save_photos_meta_box($post_id) {
    if (!isset($_POST['gn_photos_nonce']) || !wp_verify_nonce($_POST['gn_photos_nonce'], 'gn_save_photos')) {
        return;
    }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (isset($_POST['gn_location_photos'])) {
        update_post_meta($post_id, '_gn_location_photos', sanitize_text_field($_POST['gn_location_photos']));
    }
}
add_action('save_post_map_location', 'gn_save_photos_meta_box');

function gn_enqueue_mapbox_assets() {
    wp_enqueue_style('mapbox-gl', 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css');
    wp_enqueue_style('gn-mapbox-style', plugin_dir_url(__FILE__) . 'css/mapbox-style.css');
    wp_enqueue_script('mapbox-gl', 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js', [], null, true);
    wp_enqueue_script('chartjs', 'https://cdn.jsdelivr.net/npm/chart.js', [], null, true);
    wp_enqueue_script('gn-mapbox-init', plugin_dir_url(__FILE__) . 'js/mapbox-init.js', ['jquery'], null, true);
    wp_enqueue_script('gn-sw-register', plugin_dir_url(__FILE__) . 'js/sw-register.js', [], null, true);

    wp_localize_script('gn-mapbox-init', 'gnMapData', [
        'accessToken' => get_option('gn_mapbox_token'),
        'locations'   => gn_get_map_locations(),
        'debug'       => get_option('gn_mapbox_debug') === '1',
        'swPath'      => home_url('/?gn_map_sw=1'),
    ]);
}
add_action('wp_enqueue_scripts', 'gn_enqueue_mapbox_assets');

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

        // Debug output to error log
        error_log('Checking post: ' . get_the_title());
        error_log('Latitude: ' . print_r($lat, true));
        error_log('Longitude: ' . print_r($lng, true));

        if ($lat && $lng) {
            $gallery_ids = get_post_meta(get_the_ID(), '_gn_location_photos', true);
            $gallery = [];
            if ($gallery_ids) {
                foreach (explode(',', $gallery_ids) as $gid) {
                    $url = wp_get_attachment_image_url($gid, 'medium');
                    if ($url) $gallery[] = $url;
                }
            }

            $locations[] = [
                'title'   => get_the_title(),
                'content' => apply_filters('the_content', get_the_content()),
                'image'   => get_the_post_thumbnail_url(get_the_ID(), 'medium'),
                'gallery' => $gallery,
                'lat'     => floatval($lat),
                'lng'     => floatval($lng),
            ];
        }
    }
    wp_reset_postdata();

    error_log('Total locations returned: ' . count($locations));

    if (empty($locations)) {
        $json_file = plugin_dir_path(__FILE__) . 'data/locations.json';
        if (file_exists($json_file)) {
            $json = file_get_contents($json_file);
            $data = json_decode($json, true);
            if (is_array($data)) {
                $locations = $data;
                error_log('Loaded ' . count($locations) . ' locations from JSON fallback');
            } else {
                error_log('Failed to parse locations JSON');
            }
        } else {
            error_log('Fallback locations file not found');
        }
    }

    return $locations;
}

function gn_map_shortcode() {
    return '<div id="gn-mapbox-map" style="width: 100%; height: 1080px;"></div>';
}
add_shortcode('gn_map', 'gn_map_shortcode');

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
    register_setting('gn_mapbox_settings', 'gn_mapbox_debug');

    add_settings_section('gn_mapbox_section', 'Mapbox Settings', null, 'gn-mapbox');

    add_settings_field('gn_mapbox_token', 'Access Token', 'gn_mapbox_token_render', 'gn-mapbox', 'gn_mapbox_section');
    add_settings_field('gn_mapbox_debug', 'Enable Debug Panel', 'gn_mapbox_debug_render', 'gn-mapbox', 'gn_mapbox_section');
}
add_action('admin_init', 'gn_mapbox_settings_init');

function gn_mapbox_token_render() {
    $value = get_option('gn_mapbox_token');
    echo '<input type="password" name="gn_mapbox_token" value="' . esc_attr($value) . '" style="width: 400px;" autocomplete="off">';
}

function gn_mapbox_debug_render() {
    $checked = get_option('gn_mapbox_debug') === '1' ? 'checked' : '';
    echo '<label><input type="checkbox" name="gn_mapbox_debug" value="1" ' . $checked . '> Show Debug Panel</label>';
}

function gn_mapbox_serve_sw() {
    if (isset($_GET['gn_map_sw'])) {
        header('Content-Type: application/javascript');
        readfile(__DIR__ . '/js/gn-mapbox-sw.js');
        exit;
    }
}
add_action('init', 'gn_mapbox_serve_sw');
