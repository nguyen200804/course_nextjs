<?php
/**
 * TOOL 1: TOOL CÀO VÀ IMPORT KHÓA HỌC LEARNPRESS TỪ REST API EDULINK VÀO WORDPRESS
 * Truy cập trong WP Admin -> Tools (Công cụ) -> Import LearnPress Courses
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

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

// Giao diện Admin Tool trong WP Admin -> Tools
function edublink_importer_admin_page() {
    ?>
    <div class="wrap">
        <h1>Tool Copy Khóa Học LearnPress từ EduBlink</h1>
        <p>Tool sẽ lấy danh sách khóa học từ REST API Nguồn và tự động tạo bài viết <code>post_type=lp_course</code>, tải ảnh đại diện (Featured Image), thiết lập Giá (Regular Price, Sale Price), Danh mục (Categories), và Nội dung khóa học.</p>
        
        <?php
        // Xử lý khi nhấn nút Fix & Đồng bộ lại toàn bộ khóa học đã có trong DB
        if ( isset( $_POST['edublink_resync_all'] ) && check_admin_referer( 'edublink_import_nonce' ) ) {
            echo '<div class="notice notice-success"><p><strong>Đang tiến hành Fix & Cập nhật lại giá & học viên cho tất cả khóa học hiện tại...</strong></p></div>';
            echo '<div style="background: #000; color: #0f0; padding: 15px; font-family: monospace; max-height: 400px; overflow-y: auto; border-radius: 5px;">';
            
            // 1. Fetch dữ liệu gốc từ API EduBlink
            $api_url = 'https://demo.edublink.co/wp-json/learnpress/v1/courses';
            $response = wp_remote_get( $api_url, array( 'timeout' => 60, 'sslverify' => false ) );
            $api_courses = array();

            if ( ! is_wp_error( $response ) ) {
                $body = wp_remote_retrieve_body( $response );
                $decoded = json_decode( $body, true );
                if ( is_array( $decoded ) ) {
                    foreach ( $decoded as $item ) {
                        if ( isset( $item['slug'] ) ) {
                            $api_courses[ $item['slug'] ] = $item;
                        }
                    }
                }
            }

            // 2. Lấy danh sách khóa học hiện tại trong DB WordPress
            $existing_courses = get_posts( array(
                'post_type'      => 'lp_course',
                'posts_per_page' => -1,
                'post_status'    => 'any',
            ) );

            $count = 0;
            foreach ( $existing_courses as $post ) {
                $slug = $post->post_name;
                echo "=> Đang xử lý khóa học DB: {$post->post_title} (slug: {$slug})...<br>";

                if ( isset( $api_courses[ $slug ] ) ) {
                    $item = $api_courses[ $slug ];

                    // Đọc giá trị gốc từ API EduBlink
                    $reg_price  = isset( $item['regular_price'] ) ? $item['regular_price'] : ( isset( $item['price'] ) ? $item['price'] : '' );
                    $sale_price = isset( $item['sale_price'] ) ? $item['sale_price'] : '';
                    $students   = isset( $item['count_students'] ) ? $item['count_students'] : ( isset( $item['students'] ) ? $item['students'] : '' );
                    $price      = ( $sale_price !== '' && (float)$sale_price > 0 ) ? $sale_price : $reg_price;

                    // Cập nhật lại chuẩn định dạng Meta trong Database WordPress
                    update_post_meta( $post->ID, '_lp_regular_price', (string)$reg_price );
                    update_post_meta( $post->ID, '_lp_sale_price', (string)$sale_price );
                    update_post_meta( $post->ID, '_lp_price', (string)$price );

                    if ( $students !== '' ) {
                        update_post_meta( $post->ID, '_lp_students', (string)$students );
                    }

                    echo "-----> FIXED THÀNH CÔNG: Regular Price = '{$reg_price}', Sale Price = '{$sale_price}', Price = '{$price}', Students = '{$students}'<br>";
                    $count++;
                } else {
                    echo "-----> Không tìm thấy trên API gốc, bỏ qua.<br>";
                }
            }

            echo "<br><strong>=> ĐÃ ĐỒNG BỘ XONG CHO {$count} KHÓA HỌC!</strong></div>";
        }

        // Xử lý khi nhấn nút Submit Import Khóa học mới
        if ( isset( $_POST['edublink_start_import'] ) && check_admin_referer( 'edublink_import_nonce' ) ) {
            echo '<div class="notice notice-info"><p><strong>Đang tiến hành cào dữ liệu từ https://demo.edublink.co/wp-json/learnpress/v1/courses...</strong></p></div>';
            echo '<div style="background: #000; color: #0f0; padding: 15px; font-family: monospace; max-height: 500px; overflow-y: auto; border-radius: 5px;">';
            
            $api_url = 'https://demo.edublink.co/wp-json/learnpress/v1/courses';
            $response = wp_remote_get( $api_url, array( 'timeout' => 60, 'sslverify' => false ) );

            if ( is_wp_error( $response ) ) {
                echo '<span style="color: red;">Lỗi khi kết nối API: ' . $response->get_error_message() . '</span></div></div>';
                return;
            }

            $body = wp_remote_retrieve_body( $response );
            $courses = json_decode( $body, true );

            if ( empty( $courses ) || ! is_array( $courses ) ) {
                echo '<span style="color: red;">Không lấy được dữ liệu khóa học hoặc mảng rỗng!</span></div></div>';
                return;
            }

            echo 'Tìm thấy ' . count( $courses ) . ' khóa học từ API nguồn.<br><br>';

            $imported_count = 0;
            $updated_count = 0;

            foreach ( $courses as $index => $item ) {
                $num = $index + 1;
                $title = sanitize_text_field( $item['name'] );
                $slug = sanitize_title( $item['slug'] );
                $content = isset( $item['content'] ) ? wp_kses_post( $item['content'] ) : '';
                
                echo "{$num}. Đang xử lý: <strong>{$title}</strong> (slug: {$slug})...<br>";

                // Kiểm tra xem khóa học đã tồn tại trong WordPress chưa
                $existing_post = get_page_by_path( $slug, OBJECT, 'lp_course' );

                $post_data = array(
                    'post_title'   => $title,
                    'post_name'    => $slug,
                    'post_content' => $content,
                    'post_status'  => 'publish',
                    'post_type'    => 'lp_course',
                );

                if ( $existing_post ) {
                    $post_data['ID'] = $existing_post->ID;
                    $course_id = wp_update_post( $post_data );
                    echo "---> Cập nhật lại bài viết ID: {$course_id}<br>";
                    $updated_count++;
                } else {
                    $course_id = wp_insert_post( $post_data );
                    echo "---> Tạo mới bài viết ID: {$course_id}<br>";
                    $imported_count++;
                }

                if ( is_wp_error( $course_id ) ) {
                    echo "<span style='color: red;'>---> Lỗi tạo bài viết: " . $course_id->get_error_message() . "</span><br>";
                    continue;
                }

                // Cập nhật Meta Data LearnPress
                $duration = isset( $item['duration'] ) ? $item['duration'] : '15 weeks';
                $level = isset( $item['level'] ) ? $item['level'] : 'Beginner';
                $reg_price = isset( $item['regular_price'] ) ? $item['regular_price'] : ( isset( $item['price'] ) ? $item['price'] : '' );
                $sale_price = isset( $item['sale_price'] ) ? $item['sale_price'] : '';
                $students = isset( $item['count_students'] ) ? $item['count_students'] : ( isset( $item['students'] ) ? $item['students'] : '150' );
                $rating = isset( $item['rating'] ) ? $item['rating'] : '5.0';

                $price = ( $sale_price !== '' && (float)$sale_price > 0 ) ? $sale_price : $reg_price;

                update_post_meta( $course_id, '_lp_duration', $duration );
                update_post_meta( $course_id, '_lp_level', $level );
                update_post_meta( $course_id, '_lp_regular_price', (string)$reg_price );
                update_post_meta( $course_id, '_lp_sale_price', (string)$sale_price );
                update_post_meta( $course_id, '_lp_price', (string)$price );
                update_post_meta( $course_id, '_lp_students', (string)$students );
                update_post_meta( $course_id, '_lp_rating', (string)$rating );

                // Import Ảnh đại diện (Featured Image)
                if ( ! empty( $item['image'] ) ) {
                    $image_url = $item['image'];
                    $attachment_id = edublink_upload_image_from_url( $image_url, $course_id );
                    if ( $attachment_id ) {
                        set_post_thumbnail( $course_id, $attachment_id );
                        echo "---> Tải ảnh đại diện thành công (Attachment ID: {$attachment_id})<br>";
                    }
                }

                // Import Danh mục (Course Categories)
                if ( ! empty( $item['categories'] ) && is_array( $item['categories'] ) ) {
                    $cat_ids = array();
                    foreach ( $item['categories'] as $cat ) {
                        $cat_name = sanitize_text_field( $cat['name'] );
                        $cat_slug = sanitize_title( $cat['slug'] );
                        $term = term_exists( $cat_slug, 'course_category' );
                        if ( ! $term ) {
                            $term = wp_insert_term( $cat_name, 'course_category', array( 'slug' => $cat_slug ) );
                        }
                        if ( ! is_wp_error( $term ) && isset( $term['term_id'] ) ) {
                            $cat_ids[] = (int) $term['term_id'];
                        }
                    }
                    if ( ! empty( $cat_ids ) ) {
                        wp_set_object_terms( $course_id, $cat_ids, 'course_category' );
                        echo "---> Gán " . count($cat_ids) . " danh mục thành công.<br>";
                    }
                }

                // Tự động tạo mảng Sections & Curriculum (Lessons / Quizzes) nếu có
                if ( isset( $item['sections'] ) && is_array( $item['sections'] ) ) {
                    edublink_create_course_curriculum( $course_id, $item['sections'] );
                }

                echo "<br>";
                flush_rewrite_rules();
            }

            echo "<br><strong>===> HOÀN THÀNH! Đã nhập mới {$imported_count} khóa học, cập nhật {$updated_count} khóa học.</strong></div></div>";
        }
        ?>

        <form method="post" action="" style="margin-top: 20px;">
            <?php wp_nonce_field( 'edublink_import_nonce' ); ?>
            <p>
                <input type="submit" name="edublink_start_import" class="button button-primary button-hero" value="Bắt đầu Import / Cập nhật Khóa Học">
                <input type="submit" name="edublink_resync_all" class="button button-secondary button-hero" style="margin-left: 15px;" value="Fix & Đồng bộ lại Giá/Học viên toàn bộ DB" onclick="return confirm('Bạn có chắc muốn Fix & đồng bộ lại giá và số học viên cho toàn bộ khóa học trong DB không?');">
            </p>
        </form>
    </div>
    <?php
}

// Hàm hỗ trợ Tạo mảng Sections & Curriculum (Lessons / Quizzes) cho LearnPress trong DB
function edublink_create_course_curriculum( $course_id, $sections ) {
    global $wpdb;

    $sections_table = $wpdb->prefix . 'learnpress_sections';
    $items_table    = $wpdb->prefix . 'learnpress_section_items';

    if ( $wpdb->get_var( "SHOW TABLES LIKE '$sections_table'" ) != $sections_table ) {
        return;
    }

    $section_ids = $wpdb->get_col( $wpdb->prepare( "SELECT section_id FROM {$sections_table} WHERE section_course_id = %d", $course_id ) );
    if ( ! empty( $section_ids ) ) {
        $ids_format = implode( ',', array_map( 'intval', $section_ids ) );
        $wpdb->query( "DELETE FROM {$items_table} WHERE section_id IN ({$ids_format})" );
    }
    $wpdb->delete( $sections_table, array( 'section_course_id' => $course_id ), array( '%d' ) );

    $section_order = 1;
    foreach ( $sections as $sec_data ) {
        $section_name = isset( $sec_data['name'] ) ? sanitize_text_field( $sec_data['name'] ) : 'Section ' . $section_order;
        $section_desc = isset( $sec_data['description'] ) ? sanitize_text_field( $sec_data['description'] ) : '';

        $wpdb->insert(
            $sections_table,
            array(
                'section_name'      => $section_name,
                'section_course_id' => $course_id,
                'section_order'     => $section_order,
                'section_description' => $section_desc,
            ),
            array( '%s', '%d', '%d', '%s' )
        );

        $section_id = $wpdb->insert_id;

        if ( $section_id && isset( $sec_data['items'] ) && is_array( $sec_data['items'] ) ) {
            $item_order = 1;
            foreach ( $sec_data['items'] as $it ) {
                $item_title = isset( $it['title'] ) ? sanitize_text_field( $it['title'] ) : ( isset( $it['post_title'] ) ? sanitize_text_field( $it['post_title'] ) : 'Lesson Item' );
                $item_slug  = sanitize_title( $item_title );
                $item_type  = isset( $it['item_type'] ) ? sanitize_text_field( $it['item_type'] ) : 'lp_lesson';
                $item_content = isset( $it['content'] ) ? wp_kses_post( $it['content'] ) : '';

                $preview_val  = ( isset($it['preview']) && ( $it['preview'] === true || $it['preview'] === 'yes' || $it['preview'] === '1' ) ) ? 'yes' : 'no';
                $duration_val = isset($it['duration']) ? sanitize_text_field($it['duration']) : '';
                $grad_val     = isset($it['graduation']) ? sanitize_text_field($it['graduation']) : '';
                $status_val   = isset($it['status']) ? sanitize_text_field($it['status']) : '';
                $locked_val   = ( isset($it['locked']) && ( $it['locked'] === true || $it['locked'] === 'yes' || $it['locked'] === '1' ) ) ? 'yes' : 'no';

                $existing_item = get_page_by_path( $item_slug, OBJECT, $item_type );

                $item_post_data = array(
                    'post_title'   => $item_title,
                    'post_name'    => $item_slug,
                    'post_content' => $item_content,
                    'post_status'  => 'publish',
                    'post_type'    => $item_type,
                );

                if ( $existing_item ) {
                    $item_post_data['ID'] = $existing_item->ID;
                    $item_id = wp_update_post( $item_post_data );
                } else {
                    $item_id = wp_insert_post( $item_post_data );
                }

                if ( $item_id && ! is_wp_error( $item_id ) ) {
                    update_post_meta( $item_id, '_lp_preview', $preview_val );
                    update_post_meta( $item_id, '_lp_duration', $duration_val );
                    update_post_meta( $item_id, '_lp_graduation', $grad_val );
                    update_post_meta( $item_id, '_lp_status', $status_val );
                    update_post_meta( $item_id, '_lp_locked', $locked_val );

                    $wpdb->insert(
                        $items_table,
                        array(
                            'section_id' => $section_id,
                            'item_id'    => $item_id,
                            'item_order' => $item_order,
                            'item_type'  => $item_type,
                        ),
                        array( '%d', '%d', '%d', '%s' )
                    );
                    $item_order++;
                }
            }
        }
        $section_order++;
    }
}

if ( ! function_exists( 'edublink_upload_image_from_url' ) ) {
    function edublink_upload_image_from_url( $image_url, $post_id = 0 ) {
        if ( ! function_exists( 'media_sideload_image' ) ) {
            require_once ABSPATH . 'wp-admin/includes/media.php';
            require_once ABSPATH . 'wp-admin/includes/file.php';
            require_once ABSPATH . 'wp-admin/includes/image.php';
        }

        $attachment_id = media_sideload_image( $image_url, $post_id, null, 'id' );

        if ( is_wp_error( $attachment_id ) ) {
            return false;
        }

        return $attachment_id;
    }
}
