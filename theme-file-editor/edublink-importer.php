<?php
/**
 * Plugin Name: EduBlink Courses Importer Tool
 * Description: Tool cào và import khóa học từ LearnPress REST API (edublink.co) về website WordPress hiện tại.
 * Version: 1.0.0
 * Author: Antigravity Assistant
 */

if ( ! defined( 'ABSPATH' ) ) exit;

// Đăng ký trang Menu Admin trong WordPress
function edublink_importer_admin_menu() {
    add_management_page(
        'EduBlink Course Importer',
        'Import LearnPress Courses',
        'manage_options',
        'edublink-course-importer',
        'edublink_importer_admin_page'
    );
}
add_action( 'admin_menu', 'edublink_importer_admin_menu' );

// Giao diện Admin Tool
function edublink_importer_admin_page() {
    ?>
    <div class="wrap">
        <h1>Tool Copy Khóa Học LearnPress từ EduBlink</h1>
        <p>Tool sẽ lấy danh sách khóa học từ REST API Nguồn và tự động tạo bài viết <code>post_type=lp_course</code>, tải ảnh đại nhật (Featured Image), thiết lập Giá (Regular Price, Sale Price), Danh mục (Categories), và Nội dung khóa học.</p>
        
        <?php
        if ( isset( $_POST['edublink_start_import'] ) && check_admin_referer( 'edublink_import_nonce' ) ) {
            echo '<div class="notice notice-info"><p>Đang bắt đầu quá trình Import...</p></div>';
            echo '<div style="background: #000; color: #0f0; padding: 15px; font-family: monospace; max-height: 500px; overflow-y: auto; border-radius: 5px;">';
            edublink_run_course_import();
            echo '</div>';
        }
        ?>

        <form method="post" style="margin-top: 20px;">
            <?php wp_nonce_field( 'edublink_import_nonce' ); ?>
            <p>
                <label for="api_url"><strong>URL REST API Nguồn:</strong></label><br>
                <input type="url" name="api_url" id="api_url" value="https://demo.edublink.co/wp-json/learnpress/v1/courses" class="regular-text" style="width: 500px;" required />
            </p>
            <p>
                <label for="limit_courses"><strong>Số lượng khóa học muốn cào (0 là cào tất cả):</strong></label><br>
                <input type="number" name="limit_courses" id="limit_courses" value="0" class="small-text" />
            </p>
            <p>
                <input type="submit" name="edublink_start_import" class="button button-primary button-hero" value="Bắt Đầu Import Khóa Học" />
            </p>
        </form>
    </div>
    <?php
}

// Logic thực thi cào dữ liệu và tạo post
function edublink_run_course_import() {
    // Tăng thời gian thực thi script tránh timeout khi tải ảnh
    @set_time_limit( 0 );
    @ini_set( 'memory_limit', '512M' );

    $api_url = ! empty( $_POST['api_url'] ) ? esc_url_raw( $_POST['api_url'] ) : 'https://demo.edublink.co/wp-json/learnpress/v1/courses';
    $limit   = isset( $_POST['limit_courses'] ) ? intval( $_POST['limit_courses'] ) : 0;

    echo "> Đang kết nối tới API: {$api_url} ...<br>";
    flush();

    // Fetch dữ liệu từ API
    $response = wp_remote_get( $api_url, array(
        'timeout'   => 60,
        'sslverify' => false,
    ) );

    if ( is_wp_error( $response ) ) {
        echo "<span style='color: red;'>Lỗi kết nối API: " . $response->get_error_message() . "</span><br>";
        return;
    }

    $body = wp_remote_retrieve_body( $response );
    $courses = json_decode( $body, true );

    if ( empty( $courses ) || ! is_array( $courses ) ) {
        echo "<span style='color: red;'>Không tìm thấy khóa học nào hoặc định dạng dữ liệu không hợp lệ.</span><br>";
        return;
    }

    echo "> Tìm thấy " . count( $courses ) . " khóa học từ nguồn API.<br>";
    
    $imported_count = 0;

    foreach ( $courses as $course_data ) {
        if ( $limit > 0 && $imported_count >= $limit ) {
            break;
        }

        $title   = sanitize_text_field( $course_data['name'] ?? '' );
        $slug    = sanitize_title( $course_data['slug'] ?? '' );
        $content = wp_kses_post( $course_data['content'] ?? '' );
        $excerpt = wp_kses_post( $course_data['excerpt'] ?? '' );

        if ( empty( $title ) ) continue;

        echo "<br>--------------------------------------------------<br>";
        echo "> Đang xử lý: <strong>{$title}</strong><br>";

        // Kiểm tra xem khóa học đã tồn tại theo slug chưa để tránh trùng lặp
        $existing_course = get_page_by_path( $slug, OBJECT, 'lp_course' );
        if ( $existing_course ) {
            echo "> Khóa học đã tồn tại (ID: {$existing_course->ID}). Đang tiến hành cập nhật...<br>";
            $course_id = $existing_course->ID;
            wp_update_post( array(
                'ID'           => $course_id,
                'post_title'   => $title,
                'post_content' => $content,
                'post_excerpt' => $excerpt,
            ) );
        } else {
            // Tạo mới post_type lp_course
            $course_id = wp_insert_post( array(
                'post_title'   => $title,
                'post_name'    => $slug,
                'post_content' => $content,
                'post_excerpt' => $excerpt,
                'post_status'  => 'publish',
                'post_type'    => 'lp_course',
            ) );

            if ( is_wp_error( $course_id ) ) {
                echo "<span style='color: red;'>Tạo khóa học thất bại: " . $course_id->get_error_message() . "</span><br>";
                continue;
            }
            echo "> Đã tạo khóa học thành công (ID mới: {$course_id})<br>";
        }

        // 1. Lưu Giá Khóa Học (LearnPress Metadata)
        $origin_price = isset( $course_data['origin_price'] ) ? $course_data['origin_price'] : ( $course_data['price'] ?? 0 );
        $sale_price   = isset( $course_data['sale_price'] ) ? $course_data['sale_price'] : '';

        update_post_meta( $course_id, '_lp_price', $origin_price );
        update_post_meta( $course_id, '_lp_regular_price', $origin_price );
        if ( ! empty( $sale_price ) && (float)$sale_price < (float)$origin_price ) {
            update_post_meta( $course_id, '_lp_sale_price', $sale_price );
        } else {
            delete_post_meta( $course_id, '_lp_sale_price' );
        }

        // 2. Lưu Metadata bổ sung của LearnPress
        if ( isset( $course_data['duration'] ) ) {
            update_post_meta( $course_id, '_lp_duration', sanitize_text_field( $course_data['duration'] ) );
        }
        if ( isset( $course_data['count_students'] ) ) {
            update_post_meta( $course_id, '_lp_students', intval( $course_data['count_students'] ) );
        }

        echo "> Đã lưu giá: Regular={$origin_price}, Sale={$sale_price}<br>";

        // 3. Xử lý Danh mục khóa học (Categories - course_category)
        if ( ! empty( $course_data['categories'] ) && is_array( $course_data['categories'] ) ) {
            $cat_ids = array();
            foreach ( $course_data['categories'] as $cat ) {
                $cat_name = sanitize_text_field( $cat['name'] );
                $cat_slug = sanitize_title( $cat['slug'] );
                
                $term = term_exists( $cat_slug, 'course_category' );
                if ( ! $term ) {
                    $term = wp_insert_term( $cat_name, 'course_category', array( 'slug' => $cat_slug ) );
                }
                if ( ! is_wp_error( $term ) && isset( $term['term_id'] ) ) {
                    $cat_ids[] = intval( $term['term_id'] );
                }
            }
            if ( ! empty( $cat_ids ) ) {
                wp_set_object_terms( $course_id, $cat_ids, 'course_category' );
                echo "> Đã gán danh mục: " . implode( ', ', $cat_ids ) . "<br>";
            }
        }

        // 4. Download và gán Ảnh đại diện (Featured Image)
        if ( ! empty( $course_data['image'] ) ) {
            $image_url = esc_url_raw( $course_data['image'] );
            $attach_id = edublink_upload_image_from_url( $image_url, $course_id );
            if ( $attach_id ) {
                set_post_thumbnail( $course_id, $attach_id );
                echo "> Đã tải và thiết lập Featured Image thành công.<br>";
            }
        }

        // Trigger save_post để kích hoạt tính năng đồng bộ sang WooCommerce Product nếu có
        do_action( 'save_post_lp_course', $course_id, get_post( $course_id ), true );

        $imported_count++;
    }

    echo "<br><h3 style='color: #0f0;'>===> HOÀN THÀNH! Đã import thành công {$imported_count} khóa học.</h3>";
}

// Hàm hỗ trợ Tải ảnh từ URL bên ngoài vào thư mục Media Uploads của WordPress
function edublink_upload_image_from_url( $image_url, $post_id = 0 ) {
    if ( ! function_exists( 'media_sideload_image' ) ) {
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';
    }

    // Tải ảnh về
    $attachment_id = media_sideload_image( $image_url, $post_id, null, 'id' );

    if ( is_wp_error( $attachment_id ) ) {
        return false;
    }

    return $attachment_id;
}
