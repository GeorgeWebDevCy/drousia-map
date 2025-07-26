<?php
/*
Plugin Name: GN Mapbox Locations with ACF
Description: Display custom post type locations using Mapbox with ACF-based coordinates, navigation, elevation, optional galleries and full debug panel.
Version: 2.172.0
Author: George Nicolaou
Text Domain: gn-mapbox
Domain Path: /languages
*/

/**
 * -----------------------------------------------------------------------------
 *  About This File
 * -----------------------------------------------------------------------------
 *  This is the main PHP file for the GN Mapbox plugin. WordPress loads it when
 *  the plugin is activated. Every function below is responsible for a small
 *  piece of the plugin's behaviour, such as registering custom posts or loading
 *  scripts for the interactive map. Extensive comments explain each step so
 *  that even readers with no coding background can follow along.
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

/**
 * Load any available translation files so that plugin text appears in the
 * visitor's language. WordPress triggers this function after all plugins are
 * loaded, ensuring translations are ready before any output.
 */
function gn_mapbox_load_textdomain() {
    load_plugin_textdomain('gn-mapbox', false, dirname(plugin_basename(__FILE__)) . '/languages');
}

add_action('plugins_loaded', 'gn_mapbox_load_textdomain');

/**
 * Register a custom post type called "Map Location". Each of these posts holds
 * information about a place on the map such as its coordinates and text
 * description. Making the type public means you could view these posts on their
 * own page, although the plugin mainly uses them as data.
 */
function gn_register_map_location_cpt() {
    register_post_type('map_location', [
        'label' => __('Map Locations', 'gn-mapbox'),
        'public' => true,
        'menu_icon' => 'dashicons-location-alt',
        'supports' => ['title', 'editor', 'thumbnail'],
    ]);
}
add_action('init', 'gn_register_map_location_cpt');

/**
 * Check if a location already exists in the database. It first looks for a post
 * with the same title. If coordinates are provided it also checks for posts with
 * matching latitude and longitude to avoid duplicates when importing data.
 */
function gn_location_exists($title, $lat = null, $lng = null) {
    $existing = get_page_by_title($title, OBJECT, 'map_location');
    if ($existing) {
        return true;
    }
    if ($lat !== null && $lng !== null) {
        $query = new WP_Query([
            'post_type'      => 'map_location',
            'posts_per_page' => 1,
            'fields'         => 'ids',
            'meta_query'     => [
                [
                    'key'   => 'latitude',
                    'value' => $lat,
                ],
                [
                    'key'   => 'longitude',
                    'value' => $lng,
                ],
            ],
        ]);
        $exists = $query->have_posts();
        wp_reset_postdata();
        if ($exists) {
            return true;
        }
    }
    return false;
}

/**
 * Load the fallback location data shipped with the plugin. It reads a JSON file
 * from the plugin's data folder and creates Map Location posts for each entry
 * that does not already exist. This ensures the map has example points when the
 * plugin is first installed.
 */
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

    foreach ($locations as $index => $location) {
        if (empty($location['title'])) {
            continue;
        }

        $lat = $location['lat'] ?? null;
        $lng = $location['lng'] ?? null;
        if (gn_location_exists($location['title'], $lat, $lng)) {
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
            if (isset($location['waypoint'])) {
                update_post_meta($post_id, '_gn_waypoint', $location['waypoint'] ? '1' : '');
            }
            update_post_meta($post_id, '_gn_location_order', $index);
        }
    }
}

/**
 * Ensure that each Map Location post contains the front-end photo upload
 * shortcode. When editing a location this function checks the content and adds
 * the shortcode if it is missing so visitors can submit media for that place.
 */
function gn_add_upload_shortcode_if_missing($post_id) {
    if (get_post_type($post_id) !== 'map_location') {
        return;
    }
    $post = get_post($post_id);
    if (!$post) return;
    if (strpos($post->post_content, '[gn_photo_upload') === false) {
        $shortcode = '[gn_photo_upload location="' . $post_id . '"]';
        $content = trim($post->post_content);
        if ($content !== '') {
            $content .= "\n\n";
        }
        $content .= $shortcode;
        remove_action('save_post_map_location', 'gn_add_upload_shortcode_on_save', 20);
        wp_update_post([
            'ID' => $post_id,
            'post_content' => $content,
        ]);
        add_action('save_post_map_location', 'gn_add_upload_shortcode_on_save', 20, 3);
    }
}

/**
 * Hooked into the save process for a Map Location. It simply calls the helper
 * above so the upload form is always present whenever a location is saved or
 * updated.
 */
function gn_add_upload_shortcode_on_save($post_id, $post, $update) {
    gn_add_upload_shortcode_if_missing($post_id);
}
add_action('save_post_map_location', 'gn_add_upload_shortcode_on_save', 20, 3);

/**
 * Go through all existing Map Location posts and make sure the upload shortcode
 * is present. Useful when the plugin is activated to update older posts that
 * may not yet include the form.
 */
function gn_ensure_shortcodes_for_all_locations() {
    $posts = get_posts([
        'post_type' => 'map_location',
        'posts_per_page' => -1,
    ]);
    foreach ($posts as $p) {
        gn_add_upload_shortcode_if_missing($p->ID);
    }
}

/**
 * When the plugin is activated this function runs once. It imports example
 * locations from the bundled JSON file and then ensures every location has the
 * photo upload form shortcode.
 */
function gn_plugin_activate() {
    gn_import_default_locations();
    gn_ensure_shortcodes_for_all_locations();
}
register_activation_hook(__FILE__, 'gn_plugin_activate');

// Add photo gallery meta box

/**
 * Create a box in the WordPress editor where administrators can upload and
 * manage gallery photos for a location. This box appears on the main editing
 * screen when editing a Map Location post.
 */
function gn_add_photos_meta_box() {
    add_meta_box('gn_location_photos', 'Location Photos', 'gn_photos_meta_box_html', 'map_location', 'normal', 'default');
}
add_action('add_meta_boxes', 'gn_add_photos_meta_box');

function gn_add_waypoint_meta_box() {
    // This meta box allows admins to mark a location as a hidden waypoint. When
    // checked the marker will not appear on the map but can still be used when
    // calculating routes.
    add_meta_box('gn_waypoint', __('Invisible Waypoint', 'gn-mapbox'), 'gn_waypoint_meta_box_html', 'map_location', 'side', 'default');
}
add_action('add_meta_boxes', 'gn_add_waypoint_meta_box');

function gn_add_order_meta_box() {
    // This meta box lets admins choose the order in which locations appear on
    // the map and in route directions. Lower numbers come first.
    add_meta_box('gn_location_order', __('Position', 'gn-mapbox'), 'gn_order_meta_box_html', 'map_location', 'side', 'default');
}
add_action('add_meta_boxes', 'gn_add_order_meta_box');
/**
 * Output the user interface for managing a location's photo gallery. This
 * includes showing thumbnails of existing images and buttons to add or clear
 * photos using WordPress's media picker.
 */

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
    echo '<button type="button" class="button" id="gn_add_photos_button">' . esc_html__('Add Photos', 'gn-mapbox') . '</button> ';
    echo '<button type="button" class="button" id="gn_clear_photos_button">' . esc_html__('Clear', 'gn-mapbox') . '</button>';
    $select_photos = wp_json_encode(__('Select Photos', 'gn-mapbox'));
    $use_photos = wp_json_encode(__('Use these photos', 'gn-mapbox'));
    ?>
    <script>
    jQuery(function($){
        $('#gn_add_photos_button').on('click', function(e){
            e.preventDefault();
            var frame = wp.media({
                title: <?php echo $select_photos; ?>,
                button: { text: <?php echo $use_photos; ?> },
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

/**
 * Save the photo gallery data entered in the meta box. It verifies a security
 * nonce, skips auto-saves and stores the chosen attachment IDs in post meta.
 */
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
/**
 * Render a checkbox allowing a location to be marked as an invisible waypoint.
 * This option hides the marker from the map while still letting routing logic
 * use the coordinates as part of a path.
 */

function gn_waypoint_meta_box_html($post) {
    wp_nonce_field('gn_save_waypoint', 'gn_waypoint_nonce');
    $is_waypoint = get_post_meta($post->ID, '_gn_waypoint', true);
    $checked = $is_waypoint === '1' ? 'checked' : '';
    echo '<label><input type="checkbox" name="gn_waypoint" value="1" ' . $checked . '> ' . esc_html__('Invisible waypoint (no marker)', 'gn-mapbox') . '</label>';
}

function gn_order_meta_box_html($post) {
    wp_nonce_field('gn_save_order', 'gn_order_nonce');
/**
 * Provide an input field for setting the display order of this location.
 * WordPress saves the number so the plugin can sort markers consistently.
 */
    $order = get_post_meta($post->ID, '_gn_location_order', true);
    echo '<input type="number" name="gn_location_order" value="' . esc_attr($order) . '" style="width:100%;">';
}

/**
 * Save whether the location should be treated as a waypoint only.
 * Uses a nonce to ensure the request came from the editor screen.
 */
function gn_save_waypoint_meta_box($post_id) {
    if (!isset($_POST['gn_waypoint_nonce']) || !wp_verify_nonce($_POST['gn_waypoint_nonce'], 'gn_save_waypoint')) {
        return;
    }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    $value = isset($_POST['gn_waypoint']) ? '1' : '';
    update_post_meta($post_id, '_gn_waypoint', $value);
}
add_action('save_post_map_location', 'gn_save_waypoint_meta_box');

/**
 * Save the order number entered in the meta box so markers can be
 * sorted consistently.
 */
function gn_save_order_meta_box($post_id) {
    if (!isset($_POST['gn_order_nonce']) || !wp_verify_nonce($_POST['gn_order_nonce'], 'gn_save_order')) {
        return;
    }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (isset($_POST['gn_location_order'])) {
        update_post_meta($post_id, '_gn_location_order', intval($_POST['gn_location_order']));
    }
}
add_action('save_post_map_location', 'gn_save_order_meta_box');

function gn_location_columns($columns) {
    $columns['gn_order'] = __('Position', 'gn-mapbox');
    return $columns;
}
add_filter('manage_map_location_posts_columns', 'gn_location_columns');

function gn_location_column_content($column, $post_id) {
    if ($column === 'gn_order') {
        echo esc_html(get_post_meta($post_id, '_gn_location_order', true));
    }
}
add_action('manage_map_location_posts_custom_column', 'gn_location_column_content', 10, 2);

function gn_quick_edit_custom_box($column, $post_type) {
    if ($post_type !== 'map_location' || $column !== 'gn_order') return;
    ?>
    <fieldset class="inline-edit-col-right">
        <div class="inline-edit-col">
            <label>
                <span class="title"><?php echo esc_html__('Position', 'gn-mapbox'); ?></span>
                <span class="input-text-wrap"><input type="number" name="gn_location_order" class="gn-location-order" value=""></span>
            </label>
        </div>
    </fieldset>
    <?php
}
add_action('quick_edit_custom_box', 'gn_quick_edit_custom_box', 10, 2);

function gn_quick_edit_scripts() {
    global $current_screen;
    if ($current_screen->post_type !== 'map_location') return;
    ?>
    <script>
    jQuery(function($){
        var $edit = inlineEditPost.edit;
        inlineEditPost.edit = function(id) {
            var r = $edit.apply(this, arguments);
            if (typeof(id) === 'object') id = this.getId(id);
            var $postRow = $('#post-' + id);
            var val = $('.column-gn_order', $postRow).text();
            $('input.gn-location-order', '#edit-' + id).val(val.trim());
            return r;
        };
    });
    </script>
    <?php
}
add_action('admin_footer-edit.php', 'gn_quick_edit_scripts');

function gn_save_quick_edit_order($post_id) {
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!isset($_POST['_inline_edit']) || !wp_verify_nonce($_POST['_inline_edit'], 'inlineeditnonce')) {
        return;
    }
    if (isset($_POST['gn_location_order'])) {
        update_post_meta($post_id, '_gn_location_order', intval($_POST['gn_location_order']));
    }
}
add_action('save_post_map_location', 'gn_save_quick_edit_order');

function gn_enqueue_mapbox_assets() {
    wp_enqueue_style('mapbox-gl', 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css');
    wp_enqueue_style('mapbox-gl-directions', 'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-directions/v4.1.1/mapbox-gl-directions.css');
    wp_enqueue_style('gn-mapbox-style', plugin_dir_url(__FILE__) . 'css/mapbox-style.css');
    wp_enqueue_script('mapbox-gl', 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js', [], null, true);
    wp_enqueue_script('mapbox-gl-directions', 'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-directions/v4.1.1/mapbox-gl-directions.js', ['mapbox-gl'], null, true);
    wp_enqueue_script('chartjs', 'https://cdn.jsdelivr.net/npm/chart.js', [], null, true);
    wp_enqueue_script('mapbox-gl-language', plugin_dir_url(__FILE__) . 'js/mapbox-gl-language.js', ['mapbox-gl'], null, true);
    wp_enqueue_script('gn-mapbox-init', plugin_dir_url(__FILE__) . 'js/mapbox-init.js', ['jquery', 'mapbox-gl-language', 'mapbox-gl-directions'], null, true);
    wp_enqueue_script('gn-sw-register', plugin_dir_url(__FILE__) . 'js/sw-register.js', [], null, true);
    wp_enqueue_script('gn-photo-upload', plugin_dir_url(__FILE__) . 'js/gn-photo-upload.js', ['jquery'], null, true);
    wp_localize_script('gn-mapbox-init', 'gnMapData', [
        'accessToken' => get_option('gn_mapbox_token'),
        'locations'   => gn_get_map_locations(),
        'debug'       => get_option('gn_mapbox_debug') === '1',
        'swPath'      => home_url('/?gn_map_sw=1'),
    ]);
    wp_localize_script('gn-photo-upload', 'gnPhotoData', [
        'debug' => get_option('gn_mapbox_debug') === '1'
    ]);
    wp_localize_script('gn-mapbox-init', 'gnPhotoStrings', [
        'select_photos' => __('Select Photos', 'gn-mapbox'),
        'use_photos'    => __('Use these photos', 'gn-mapbox')
    ]);
}
add_action('wp_enqueue_scripts', 'gn_enqueue_mapbox_assets');

function gn_get_map_locations() {
    // Determine if verbose debug logging is enabled via plugin settings.
    $debug_enabled = get_option('gn_mapbox_debug') === '1';
    $query = new WP_Query([
        'post_type'      => 'map_location',
        'posts_per_page' => -1,
        'meta_key'       => '_gn_location_order',
        'orderby'        => 'meta_value_num',
        'order'          => 'ASC',
    ]);

    $locations = [];

    while ($query->have_posts()) {
        $query->the_post();
        $lat = get_field('latitude');
        $lng = get_field('longitude');

        // Debug output to error log if enabled
        if ($debug_enabled) {
            error_log('Checking post: ' . get_the_title());
            error_log('Latitude: ' . print_r($lat, true));
            error_log('Longitude: ' . print_r($lng, true));
        }

        if ($lat && $lng) {
            $gallery_ids = get_post_meta(get_the_ID(), '_gn_location_photos', true);
            $gallery = [];
            if ($gallery_ids) {
                foreach (explode(',', $gallery_ids) as $gid) {
                    $attachment = get_post($gid);
                    if (!$attachment) continue;
                    if (strpos($attachment->post_mime_type, 'video') === 0) {
                        $url = wp_get_attachment_url($gid);
                        if ($url) $gallery[] = ['url' => $url, 'type' => 'video'];
                    } else {
                        $url = wp_get_attachment_image_url($gid, 'medium');
                        if ($url) $gallery[] = ['url' => $url, 'type' => 'image'];
                    }
                }
            }

            $raw_content = get_the_content();
            $raw_content = preg_replace('/\[gn_photo_upload[^\]]*\]/', '', $raw_content);
            $locations[] = [
                'id'          => get_the_ID(),
                'title'       => get_the_title(),
                'content'     => apply_filters('the_content', $raw_content),
                'image'       => get_the_post_thumbnail_url(get_the_ID(), 'medium'),
                'gallery'     => $gallery,
                'upload_form' => do_shortcode('[gn_photo_upload location="' . get_the_ID() . '"]'),
                'lat'         => floatval($lat),
                'lng'         => floatval($lng),
                'waypoint'    => get_post_meta(get_the_ID(), '_gn_waypoint', true) === '1',
            ];
        }
    }
    wp_reset_postdata();

    if ($debug_enabled) {
        error_log('Total locations returned: ' . count($locations));
    }

    if (empty($locations)) {
        gn_import_default_locations();
        gn_ensure_shortcodes_for_all_locations();

        $query = new WP_Query([
            'post_type'      => 'map_location',
            'posts_per_page' => -1,
            'meta_key'       => '_gn_location_order',
            'orderby'        => 'meta_value_num',
            'order'          => 'ASC',
        ]);

        while ($query->have_posts()) {
            $query->the_post();
            $lat = get_field('latitude');
            $lng = get_field('longitude');

            if ($lat && $lng) {
                $gallery_ids = get_post_meta(get_the_ID(), '_gn_location_photos', true);
                $gallery = [];
                if ($gallery_ids) {
                    foreach (explode(',', $gallery_ids) as $gid) {
                        $attachment = get_post($gid);
                        if (!$attachment) continue;
                        if (strpos($attachment->post_mime_type, 'video') === 0) {
                            $url = wp_get_attachment_url($gid);
                            if ($url) $gallery[] = ['url' => $url, 'type' => 'video'];
                        } else {
                            $url = wp_get_attachment_image_url($gid, 'medium');
                            if ($url) $gallery[] = ['url' => $url, 'type' => 'image'];
                        }
                    }
                }

                $raw_content = get_the_content();
                $raw_content = preg_replace('/\[gn_photo_upload[^\]]*\]/', '', $raw_content);
                $locations[] = [
                    'id'          => get_the_ID(),
                    'title'       => get_the_title(),
                    'content'     => apply_filters('the_content', $raw_content),
                    'image'       => get_the_post_thumbnail_url(get_the_ID(), 'medium'),
                    'gallery'     => $gallery,
                    'upload_form' => do_shortcode('[gn_photo_upload location="' . get_the_ID() . '"]'),
                    'lat'         => floatval($lat),
                    'lng'         => floatval($lng),
                    'waypoint'    => get_post_meta(get_the_ID(), '_gn_waypoint', true) === '1',
                ];
            }
        }
        wp_reset_postdata();

        if (empty($locations)) {
            $json_file = plugin_dir_path(__FILE__) . 'data/locations.json';
            if (file_exists($json_file)) {
                $json = file_get_contents($json_file);
                $data = json_decode($json, true);
                if (is_array($data)) {
                    foreach ($data as &$loc) {
                        $loc['waypoint'] = !empty($loc['waypoint']);
                    }
                    $locations = $data;
                    if ($debug_enabled) {
                        error_log('Loaded ' . count($locations) . ' locations from JSON fallback');
                    }
                } else {
                    if ($debug_enabled) {
                        error_log('Failed to parse locations JSON');
                    }
                }
            } else {
                if ($debug_enabled) {
                    error_log('Fallback locations file not found');
                }
            }
        }
    }

    return $locations;
}

function gn_map_shortcode() {
    return '<div id="gn-mapbox-map" style="width: 100%; height: 1080px;"></div>';
}
add_shortcode('gn_map', 'gn_map_shortcode');

function gn_mapbox_add_admin_menu() {
    add_options_page(__('GN Mapbox Settings', 'gn-mapbox'), 'GN Mapbox', 'manage_options', 'gn-mapbox', 'gn_mapbox_settings_page');
}
add_action('admin_menu', 'gn_mapbox_add_admin_menu');

function gn_mapbox_settings_page() {
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(__('GN Mapbox Settings', 'gn-mapbox')); ?></h1>
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

    add_settings_section('gn_mapbox_section', __('Mapbox Settings', 'gn-mapbox'), null, 'gn-mapbox');

    add_settings_field('gn_mapbox_token', __('Access Token', 'gn-mapbox'), 'gn_mapbox_token_render', 'gn-mapbox', 'gn_mapbox_section');
    add_settings_field('gn_mapbox_debug', __('Enable Debug Panel', 'gn-mapbox'), 'gn_mapbox_debug_render', 'gn-mapbox', 'gn_mapbox_section');
}
add_action('admin_init', 'gn_mapbox_settings_init');

function gn_mapbox_token_render() {
    $value = get_option('gn_mapbox_token');
    echo '<input type="password" name="gn_mapbox_token" value="' . esc_attr($value) . '" style="width: 400px;" autocomplete="off">';
}

function gn_mapbox_debug_render() {
    $checked = get_option('gn_mapbox_debug') === '1' ? 'checked' : '';
    echo '<label><input type="checkbox" name="gn_mapbox_debug" value="1" ' . $checked . '> ' . esc_html__('Show Debug Panel', 'gn-mapbox') . '</label>';
}

function gn_mapbox_serve_sw() {
    if (isset($_GET['gn_map_sw'])) {
        header('Content-Type: application/javascript');
        readfile(__DIR__ . '/js/gn-mapbox-sw.js');
        exit;
    }
}
add_action('init', 'gn_mapbox_serve_sw');

/**
 * Render photo upload form for a map location.
 * Usage: [gn_photo_upload location="123"]
 */
function gn_photo_upload_shortcode($atts) {
    $atts = shortcode_atts(['location' => 0], $atts);
    $location_id = intval($atts['location']);
    if (!$location_id) {
        return __('Invalid location.', 'gn-mapbox');
    }
    $output = '';
    if (!empty($_GET['gn_upload'])) {
        if ($_GET['gn_upload'] === 'success') {
            $loc_title = get_the_title(intval($_GET['loc'] ?? 0));
            $msg = __('Upload received', 'gn-mapbox');
            if ($loc_title) $msg .= ' ' . sprintf(__('for %s', 'gn-mapbox'), esc_html($loc_title));
            $msg .= ' ' . __('and awaiting approval.', 'gn-mapbox');
            $output .= '<div class="gn-upload-msg">'.$msg.'</div>';
        } elseif ($_GET['gn_upload'] === 'error') {
            $output .= '<div class="gn-upload-msg">'.esc_html__('Error uploading file.', 'gn-mapbox').'</div>';
        }
    }
    $output .= '<form class="gn-photo-upload-form" method="post" enctype="multipart/form-data" action="'.esc_url(admin_url('admin-post.php')).'">';
    $output .= wp_nonce_field('gn_photo_upload','gn_photo_nonce',true,false);
    $output .= '<input type="hidden" name="action" value="gn_photo_upload">';
    $output .= '<input type="hidden" name="location_id" value="'.$location_id.'">';
    $output .= '<input type="file" name="gn_photo[]" accept="image/*,video/*" class="gn-photo-file" style="display:none;" multiple required>';
    $output .= '<button type="button" class="gn-photo-button">' . esc_html__('Upload Media', 'gn-mapbox') . '</button>';
    $output .= '<span class="gn-upload-status"></span>';
    $output .= '</form>';
    return $output;
}
add_shortcode('gn_photo_upload','gn_photo_upload_shortcode');

/**
 * Handle photo upload from front-end form.
 */
function gn_handle_photo_upload() {
    if (!isset($_POST['gn_photo_nonce']) || !wp_verify_nonce($_POST['gn_photo_nonce'],'gn_photo_upload')) {
        wp_die(__('Invalid nonce', 'gn-mapbox'));
    }
    $is_ajax = isset($_POST['ajax']);
    $location_id = intval($_POST['location_id'] ?? 0);
    $names = $_FILES['gn_photo']['name'] ?? '';
    $has_file = is_array($names) ? count(array_filter($names)) > 0 : !empty($names);
    if (!$location_id || !$has_file) {
        if ($is_ajax) {
            wp_send_json_error();
        }
        wp_redirect(add_query_arg('gn_upload','error',wp_get_referer()));
        exit;
    }
    $files = $_FILES['gn_photo'];
    $file_count = is_array($files['name']) ? count($files['name']) : 1;
    $success = false;
    $pending = get_post_meta($location_id, '_gn_pending_photos', true);
    $pending_ids = $pending ? explode(',', $pending) : [];

    for ($i = 0; $i < $file_count; $i++) {
        $file = [
            'name'     => is_array($files['name']) ? $files['name'][$i] : $files['name'],
            'type'     => is_array($files['type']) ? $files['type'][$i] : $files['type'],
            'tmp_name' => is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'],
            'error'    => is_array($files['error']) ? $files['error'][$i] : $files['error'],
            'size'     => is_array($files['size']) ? $files['size'][$i] : $files['size'],
        ];
        if (empty($file['name'])) continue;
        $uploaded = wp_handle_upload($file, ['test_form'=>false]);
        if (isset($uploaded['error'])) {
            continue;
        }
        $attachment_id = wp_insert_attachment([
            'post_mime_type' => $uploaded['type'],
            'post_title'     => sanitize_file_name($file['name']),
            'post_content'   => '',
            'post_status'    => 'pending',
            'post_parent'    => $location_id,
        ], $uploaded['file']);
        if (!is_wp_error($attachment_id)) {
            $pending_ids[] = $attachment_id;
            $success = true;
        }
    }

    if ($success) {
        update_post_meta($location_id, '_gn_pending_photos', implode(',', $pending_ids));
        if ($is_ajax) {
            wp_send_json_success([
                'location' => $location_id,
                'title'    => get_the_title($location_id)
            ]);
        }
        wp_redirect(add_query_arg([
            'gn_upload' => 'success',
            'loc'       => $location_id
        ], wp_get_referer()));
    } else {
        if ($is_ajax) {
            wp_send_json_error();
        }
        wp_redirect(add_query_arg('gn_upload','error',wp_get_referer()));
    }
    exit;
}
add_action('admin_post_nopriv_gn_photo_upload','gn_handle_photo_upload');
add_action('admin_post_gn_photo_upload','gn_handle_photo_upload');

function gn_photo_approval_menu() {
    add_submenu_page('upload.php', __('Photo Approvals', 'gn-mapbox'), __('Photo Approvals', 'gn-mapbox'), 'manage_options', 'gn-photo-approvals', 'gn_photo_approval_page');
}
add_action('admin_menu', 'gn_photo_approval_menu');

function gn_photo_approval_page() {
    if (!current_user_can('manage_options')) return;

    $location_posts = get_posts([
        'post_type'      => 'map_location',
        'posts_per_page' => -1,
        'meta_query'     => [
            [ 'key' => '_gn_pending_photos', 'compare' => 'EXISTS' ]
        ]
    ]);

    $pending_map = [];
    foreach ($location_posts as $loc) {
        $ids = get_post_meta($loc->ID, '_gn_pending_photos', true);
        if ($ids) {
            foreach (array_filter(explode(',', $ids)) as $id) {
                $pending_map[intval($id)] = $loc;
            }
        }
    }

    if (!$pending_map) {
        echo '<div class="wrap"><h1>' . esc_html__('Pending Photo Uploads', 'gn-mapbox') . '</h1><p>' . esc_html__('No pending photos.', 'gn-mapbox') . '</p></div>';
        return;
    }

    $pending = get_posts([
        'post_type'   => 'attachment',
        'post__in'    => array_keys($pending_map),
        'post_status' => array('pending','inherit','draft','private'),
        'numberposts' => -1,
    ]);

    echo '<div class="wrap"><h1>' . esc_html__('Pending Photo Uploads', 'gn-mapbox') . '</h1>';
    echo '<table class="widefat"><thead><tr><th>' . esc_html__('Preview', 'gn-mapbox') . '</th><th>' . esc_html__('Location', 'gn-mapbox') . '</th><th>' . esc_html__('Approve', 'gn-mapbox') . '</th><th>' . esc_html__('Delete', 'gn-mapbox') . '</th></tr></thead><tbody>';
    foreach ($pending as $p) {
        $loc = $pending_map[$p->ID];
        if (strpos($p->post_mime_type, 'video') === 0) {
            $url = wp_get_attachment_url($p->ID);
        } else {
            $url = wp_get_attachment_image_url($p->ID, 'thumbnail');
        }
        $approve_url = wp_nonce_url(admin_url('admin-post.php?action=gn_approve_photo&photo_id='.$p->ID), 'gn_approve_photo_'.$p->ID);
        $delete_url  = wp_nonce_url(admin_url('admin-post.php?action=gn_delete_photo&photo_id='.$p->ID), 'gn_delete_photo_'.$p->ID);
        echo '<tr>';
        if (strpos($p->post_mime_type, 'video') === 0) {
            $preview = '<video src="'.esc_url($url).'" style="max-width:80px" controls></video>';
        } else {
            $preview = '<img src="'.esc_url($url).'" style="max-width:80px">';
        }
        echo '<td>'.$preview.'</td>';
        echo '<td>'.esc_html($loc->post_title).'</td>';
        echo '<td><a class="button" href="'.$approve_url.'">'.esc_html__('Approve', 'gn-mapbox').'</a></td>';
        echo '<td><a class="button" href="'.$delete_url.'">'.esc_html__('Delete', 'gn-mapbox').'</a></td>';
        echo '</tr>';
    }
    echo '</tbody></table></div>';
}

function gn_process_photo_approval() {
    if (!current_user_can('manage_options')) wp_die(__('Unauthorized', 'gn-mapbox'));
    $photo_id = intval($_GET['photo_id'] ?? 0);
    if (!$photo_id || !wp_verify_nonce($_GET['_wpnonce'], 'gn_approve_photo_'.$photo_id)) wp_die(__('Invalid request', 'gn-mapbox'));
    $attachment = get_post($photo_id);
    if (!$attachment) wp_die(__('Photo not found', 'gn-mapbox'));
    $location_id = $attachment->post_parent;
    wp_update_post(['ID'=>$photo_id,'post_status'=>'publish']);
    $gallery = get_post_meta($location_id, '_gn_location_photos', true);
    $ids = $gallery ? explode(',', $gallery) : [];
    $ids[] = $photo_id;
    update_post_meta($location_id, '_gn_location_photos', implode(',', $ids));
    $pending = get_post_meta($location_id, '_gn_pending_photos', true);
    if ($pending) {
        $pend_ids = array_filter(explode(',', $pending), function($id) use ($photo_id){ return intval($id) !== $photo_id; });
        update_post_meta($location_id, '_gn_pending_photos', implode(',', $pend_ids));
    }
    wp_redirect(admin_url('upload.php?page=gn-photo-approvals'));
    exit;
}
add_action('admin_post_gn_approve_photo', 'gn_process_photo_approval');

function gn_process_photo_deletion() {
    if (!current_user_can('manage_options')) wp_die(__('Unauthorized', 'gn-mapbox'));
    $photo_id = intval($_GET['photo_id'] ?? 0);
    if (!$photo_id || !wp_verify_nonce($_GET['_wpnonce'], 'gn_delete_photo_'.$photo_id)) wp_die(__('Invalid request', 'gn-mapbox'));
    $attachment = get_post($photo_id);
    if (!$attachment) wp_die(__('Photo not found', 'gn-mapbox'));
    $location_id = $attachment->post_parent;
    $pending = get_post_meta($location_id, '_gn_pending_photos', true);
    if ($pending) {
        $pend_ids = array_filter(explode(',', $pending), function($id) use ($photo_id){ return intval($id) !== $photo_id; });
        update_post_meta($location_id, '_gn_pending_photos', implode(',', $pend_ids));
    }
    wp_delete_attachment($photo_id, true);
    wp_redirect(admin_url('upload.php?page=gn-photo-approvals'));
    exit;
}
add_action('admin_post_gn_delete_photo', 'gn_process_photo_deletion');

/**
 * Simple shortcode displaying a single marker on Drouseia using Mapbox GL JS.
 * The map also outlines the village with a polygonal red boundary line.
 * Usage: [gn_mapbox_drouseia]
*/
function gn_mapbox_drouseia_shortcode() {
    $token = get_option('gn_mapbox_token');
    if (!$token) {
        return '<p class="gn-mapbox-error">' . esc_html__('Mapbox access token missing. Set one under Settings → GN Mapbox.', 'gn-mapbox') . '</p>';
    }
    ob_start();
    ?>
    <div id="gn-mapbox-drouseia" style="width: 100%; height: 400px;"></div>
    <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>
    <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet" />
    <script>
      mapboxgl.accessToken = '<?php echo esc_js($token); ?>';
        const map = new mapboxgl.Map({
          container: 'gn-mapbox-drouseia',
          style: 'mapbox://styles/mapbox/satellite-streets-v11',
          center: [32.397643, 34.959782],
          zoom: 14
        });

      new mapboxgl.Marker()
        .setLngLat([32.397643, 34.959782])
        .setPopup(new mapboxgl.Popup().setText('Drouseia, Cyprus'))
        .addTo(map);

      map.on('load', () => {
        map.addSource('drouseia-area', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [32.3920, 34.9642],
                [32.3945, 34.9670],
                [32.3985, 34.9685],
                [32.4025, 34.9675],
                [32.4045, 34.9650],
                [32.4040, 34.9605],
                [32.4010, 34.9580],
                [32.3960, 34.9575],
                [32.3925, 34.9600],
                [32.3920, 34.9642]
              ]]
            }
          }
        });
        map.addLayer({
          id: 'drouseia-fill',
          type: 'fill',
          source: 'drouseia-area',
          paint: {
            'fill-color': '#DB8718',
            'fill-opacity': 0.1
          }
        });
        map.addLayer({
          id: 'drouseia-outline',
          type: 'line',
          source: 'drouseia-area',
          paint: {
            'line-color': '#DB8718',
            'line-width': 3
          }
        });
      });

    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('gn_mapbox_drouseia', 'gn_mapbox_drouseia_shortcode');

/**
 * Same as gn_mapbox_drouseia_shortcode but the container spans the full viewport width.
 * Usage: [gn_mapbox_drouseia_100]
 */
function gn_mapbox_drouseia_100_shortcode() {
    $token = get_option('gn_mapbox_token');
    if (!$token) {
        return '<p class="gn-mapbox-error">' . esc_html__('Mapbox access token missing. Set one under Settings → GN Mapbox.', 'gn-mapbox') . '</p>';
    }
    ob_start();
    ?>
    <div id="gn-mapbox-drouseia-100" style="width:100vw;height:480px;"></div>
    <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>
    <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet" />
    <script>
      mapboxgl.accessToken = '<?php echo esc_js($token); ?>';
        const map = new mapboxgl.Map({
          container: 'gn-mapbox-drouseia-100',
          style: 'mapbox://styles/mapbox/satellite-streets-v11',
          center: [32.397643, 34.959782],
          zoom: 14
        });

      new mapboxgl.Marker()
        .setLngLat([32.397643, 34.959782])
        .setPopup(new mapboxgl.Popup().setText('Drouseia, Cyprus'))
        .addTo(map);

      map.on('load', () => {
        map.addSource('drouseia-area', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [32.3920, 34.9642],
                [32.3945, 34.9670],
                [32.3985, 34.9685],
                [32.4025, 34.9675],
                [32.4045, 34.9650],
                [32.4040, 34.9605],
                [32.4010, 34.9580],
                [32.3960, 34.9575],
                [32.3925, 34.9600],
                [32.3920, 34.9642]
              ]]
            }
          }
        });
        map.addLayer({
          id: 'drouseia-fill',
          type: 'fill',
          source: 'drouseia-area',
          paint: {
            'fill-color': '#DB8718',
            'fill-opacity': 0.1
          }
        });
        map.addLayer({
          id: 'drouseia-outline',
          type: 'line',
          source: 'drouseia-area',
          paint: {
            'line-color': '#DB8718',
            'line-width': 3
          }
        });
      });

    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('gn_mapbox_drouseia_100', 'gn_mapbox_drouseia_100_shortcode');

// Paphos to Drouseia
function gn_mapbox_drousia_to_paphos_shortcode() {
    if (!get_option('gn_mapbox_token')) {
        return '<p class="gn-mapbox-error">' . esc_html__('Mapbox access token missing. Set one under Settings → GN Mapbox.', 'gn-mapbox') . '</p>';
    }
    ob_start();
    ?>
    <div id="gn-mapbox-drousia-paphos" style="width:100%;height:600px;"></div>
    <script>
    jQuery(function(){
        mapboxgl.accessToken = gnMapData.accessToken;
        const mapDP = new mapboxgl.Map({
            container: 'gn-mapbox-drousia-paphos',
            style: 'mapbox://styles/mapbox/satellite-streets-v11',
            center: [32.42293021940422, 34.774631500416966],
            zoom: 10
        });

        const directionsDP = new MapboxDirections({
            accessToken: gnMapData.accessToken,
            unit: 'metric',
            profile: 'mapbox/driving',
            alternatives: false
        });

        mapDP.addControl(directionsDP, 'top-left');
        mapDP.on('load', function() {
            directionsDP.setOrigin([32.42293021940422,34.774631500416966]);
            directionsDP.setDestination([32.397643,34.959782]);
        });
    });
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('gn_mapbox_drousia_paphos', 'gn_mapbox_drousia_to_paphos_shortcode');

// Polis to Drouseia
function gn_mapbox_drousia_to_polis_shortcode() {
    if (!get_option('gn_mapbox_token')) {
        return '<p class="gn-mapbox-error">' . esc_html__('Mapbox access token missing. Set one under Settings → GN Mapbox.', 'gn-mapbox') . '</p>';
    }
    ob_start();
    ?>
    <div id="gn-mapbox-drousia-polis" style="width:100%;height:600px;"></div>
    <script>
    jQuery(function(){
        mapboxgl.accessToken = gnMapData.accessToken;
        const mapDPo = new mapboxgl.Map({
            container: 'gn-mapbox-drousia-polis',
            style: 'mapbox://styles/mapbox/satellite-streets-v11',
            center: [32.425647063063586, 35.03373715925951],
            zoom: 11
        });

        const directionsDPo = new MapboxDirections({
            accessToken: gnMapData.accessToken,
            unit: 'metric',
            profile: 'mapbox/driving',
            alternatives: false
        });

        mapDPo.addControl(directionsDPo, 'top-left');
        mapDPo.on('load', function() {
            directionsDPo.setOrigin([32.425647063063586,35.03373715925951]);
            directionsDPo.setDestination([32.397643,34.959782]);
        });
    });
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('gn_mapbox_drousia_polis', 'gn_mapbox_drousia_to_polis_shortcode');

// Paphos Airport to Drouseia
// Function name previously suggested opposite direction. Renamed for clarity.
function gn_mapbox_airport_to_drousia_shortcode() {
    if (!get_option('gn_mapbox_token')) {
        return '<p class="gn-mapbox-error">' . esc_html__('Mapbox access token missing. Set one under Settings → GN Mapbox.', 'gn-mapbox') . '</p>';
    }
    ob_start();
    ?>
    <div id="gn-mapbox-paphos-airport" style="width:100%;height:600px;"></div>
    <script>
    jQuery(function(){
        mapboxgl.accessToken = gnMapData.accessToken;
        const mapPA = new mapboxgl.Map({
            container: 'gn-mapbox-paphos-airport',
            style: 'mapbox://styles/mapbox/satellite-streets-v11',
            center: [32.490296426999045, 34.70974769197728],
            zoom: 12
        });

        const directionsPA = new MapboxDirections({
            accessToken: gnMapData.accessToken,
            unit: 'metric',
            profile: 'mapbox/driving',
            alternatives: false
        });

        mapPA.addControl(directionsPA, 'top-left');
        mapPA.on('load', function() {
            directionsPA.setOrigin([32.490296426999045,34.70974769197728]);
            directionsPA.setDestination([32.397643,34.959782]);
        });
    });
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('gn_mapbox_paphos_airport', 'gn_mapbox_airport_to_drousia_shortcode');



