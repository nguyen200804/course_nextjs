<?php
// Exit if accessed directly
if ( !defined( 'ABSPATH' ) ) exit;

// BEGIN ENQUEUE PARENT ACTION
// AUTO GENERATED - Do not modify or remove comment markers above or below:

if ( !function_exists( 'chld_thm_cfg_locale_css' ) ):
    function chld_thm_cfg_locale_css( $uri ){
        if ( empty( $uri ) && is_rtl() && file_exists( get_template_directory() . '/rtl.css' ) )
            $uri = get_template_directory_uri() . '/rtl.css';
        return $uri;
    }
endif;
add_filter( 'locale_stylesheet_uri', 'chld_thm_cfg_locale_css' );
         
if ( !function_exists( 'child_theme_configurator_css' ) ):
    function child_theme_configurator_css() {
        wp_enqueue_style( 'chld_thm_cfg_child', trailingslashit( get_stylesheet_directory_uri() ) . 'style.css', array( 'hello-elementor','hello-elementor-theme-style','hello-elementor-header-footer' ) );
    }
endif;
add_action( 'wp_enqueue_scripts', 'child_theme_configurator_css', 10 );

// END ENQUEUE PARENT ACTION

/**
 * Tự động đồng bộ lp_course (LearnPress Course) sang product (WooCommerce Product)
 * Bao gồm các thao tác: Tạo mới / Chỉnh sửa, Bỏ vào thùng rác, Khôi phục từ thùng rác, và Xóa vĩnh viễn.
 */

// Hàm đồng bộ thông tin chung (Title, Content, Status) từ lp_course sang product
function sync_lp_course_to_product( $post_id, $post, $update ) {
    // Tránh autosave, revision hoặc các post_type khác
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
    if ( wp_is_post_revision( $post_id ) ) return;
    if ( $post->post_type !== 'lp_course' ) return;

    // Tránh vòng lặp đệ quy khi cập nhật post
    unhook_sync_course_to_product();

    $linked_product_id = get_post_meta( $post_id, '_linked_product_id', true );

    // Kiểm tra xem sản phẩm liên kết có thực sự tồn tại trong DB không
    if ( $linked_product_id && ! get_post( $linked_product_id ) ) {
        $linked_product_id = false;
    }

    $product_data = array(
        'post_title'   => $post->post_title,
        'post_content' => $post->post_content,
        'post_excerpt' => $post->post_excerpt,
        'post_status'  => $post->post_status === 'trash' ? 'draft' : $post->post_status,
        'post_type'    => 'product',
    );

    if ( $linked_product_id ) {
        // Cập nhật Product WooCommerce đã có
        $product_data['ID'] = $linked_product_id;
        wp_update_post( $product_data );
        $product_id = $linked_product_id;
    } else {
        // Tạo Product WooCommerce mới
        $new_product_id = wp_insert_post( $product_data );
        if ( $new_product_id && ! is_wp_error( $new_product_id ) ) {
            // Thiết lập kiểu sản phẩm mặc định (simple product)
            wp_set_object_terms( $new_product_id, 'simple', 'product_type' );

            // Lưu liên kết ID giữa course và product
            update_post_meta( $post_id, '_linked_product_id', $new_product_id );
            update_post_meta( $new_product_id, '_linked_course_id', $post_id );
            $product_id = $new_product_id;
        } else {
            $product_id = false;
        }
    }

    // Lấy giá từ $_POST nếu có (khi người dùng vừa ấn Lưu/Publish trên giao diện Admin)
    if ( $product_id ) {
        sync_lp_course_prices( $post_id, $product_id );
    }

    // Đăng ký lại hooks sau khi cập nhật xong
    rehook_sync_course_to_product();
}
add_action( 'save_post_lp_course', 'sync_lp_course_to_product', 20, 3 );

/**
 * Hàm hỗ trợ tính toán và cập nhật giá từ lp_course sang WooCommerce Product
 */
function sync_lp_course_prices( $course_id, $product_id = null ) {
    if ( ! $product_id ) {
        $product_id = get_post_meta( $course_id, '_linked_product_id', true );
    }
    if ( ! $product_id || ! get_post( $product_id ) ) return;

    // 1. Lấy giá thường (Regular Price) từ POST hoặc Post Meta
    $regular_price = '';
    if ( isset( $_POST['_lp_price'] ) && $_POST['_lp_price'] !== '' ) {
        $regular_price = sanitize_text_field( $_POST['_lp_price'] );
    } elseif ( isset( $_POST['_lp_regular_price'] ) && $_POST['_lp_regular_price'] !== '' ) {
        $regular_price = sanitize_text_field( $_POST['_lp_regular_price'] );
    } elseif ( isset( $_POST['lp_course_price'] ) && $_POST['lp_course_price'] !== '' ) {
        $regular_price = sanitize_text_field( $_POST['lp_course_price'] );
    } else {
        $regular_price = get_post_meta( $course_id, '_lp_price', true );
        if ( $regular_price === '' ) {
            $regular_price = get_post_meta( $course_id, '_lp_regular_price', true );
        }
    }

    // 2. Lấy giá khuyến mãi (Sale Price) từ POST hoặc Post Meta
    $sale_price = '';
    if ( isset( $_POST['_lp_sale_price'] ) && $_POST['_lp_sale_price'] !== '' ) {
        $sale_price = sanitize_text_field( $_POST['_lp_sale_price'] );
    } else {
        $sale_price = get_post_meta( $course_id, '_lp_sale_price', true );
    }

    // Cập nhật giá WooCommerce Meta Keys
    update_post_meta( $product_id, '_regular_price', $regular_price !== '' ? $regular_price : '' );
    update_post_meta( $product_id, '_sale_price', $sale_price !== '' ? $sale_price : '' );

    // Xác định giá active (_price) cho WooCommerce
    if ( $sale_price !== '' && (float) $sale_price >= 0 && ( $regular_price === '' || (float) $sale_price < (float) $regular_price ) ) {
        update_post_meta( $product_id, '_price', $sale_price );
    } else {
        update_post_meta( $product_id, '_price', $regular_price !== '' ? $regular_price : '' );
    }

    // Xóa WooCommerce Product Price Lookup Cache nếu có
    if ( function_exists( 'wc_delete_product_transients' ) ) {
        wc_delete_product_transients( $product_id );
    }
}

// Bắt thêm hook updated_post_meta / added_post_meta khi LearnPress lưu Meta sau save_post
function sync_lp_price_on_meta_update( $meta_id, $object_id, $meta_key, $_meta_value ) {
    if ( in_array( $meta_key, array( '_lp_price', '_lp_regular_price', '_lp_sale_price' ), true ) ) {
        if ( get_post_type( $object_id ) === 'lp_course' ) {
            sync_lp_course_prices( $object_id );
        }
    }
}
add_action( 'updated_post_meta', 'sync_lp_price_on_meta_update', 10, 4 );
add_action( 'added_post_meta', 'sync_lp_price_on_meta_update', 10, 4 );

/**
 * Hiển thị chính xác giá và số học viên trên cột Admin Danh sách Khóa Học (lp_course)
 */
function fix_learnpress_admin_course_columns_display( $column_name, $post_id ) {
    // 1. Cột Học viên (Student)
    if ( $column_name === 'students' || $column_name === 'student' ) {
        $students_fake = get_post_meta( $post_id, '_lp_students', true );
        if ( ! $students_fake ) {
            $students_fake = get_post_meta( $post_id, '_lp_students_enrolled', true );
        }
        $count = $students_fake ? intval( $students_fake ) : 0;
        echo '<span class="lp-badge-student-count" style="display:inline-block; padding: 3px 8px; background: #007cba; color: #fff; border-radius: 12px; font-weight: bold;">' . $count . '</span>';
        echo '<br><small style="color: #666;">View List</small>';
    }

    // 2. Cột Giá (Price)
    if ( $column_name === 'price' || $column_name === 'course_price' ) {
        $regular_price = get_post_meta( $post_id, '_lp_price', true );
        if ( $regular_price === '' ) {
            $regular_price = get_post_meta( $post_id, '_lp_regular_price', true );
        }
        $sale_price = get_post_meta( $post_id, '_lp_sale_price', true );

        if ( (float) $regular_price > 0 ) {
            if ( (float) $sale_price > 0 && (float) $sale_price < (float) $regular_price ) {
                echo '<span style="text-decoration: line-through; color: #888;">$' . esc_html( $regular_price ) . '</span> <span style="color: #d9534f; font-weight: bold;">$' . esc_html( $sale_price ) . '</span>';
            } else {
                echo '<span style="font-weight: bold; color: #28a745;">$' . esc_html( $regular_price ) . '</span>';
            }
        } else {
            echo '<span style="color: #6c757d;">Free</span>';
        }
    }
}
// Chèn với ưu tiên cao nhất (priority 9999) và dùng output buffer nếu cần đè hiển thị mặc định
add_action( 'manage_lp_course_posts_custom_column', 'fix_learnpress_admin_course_columns_display', 9999, 2 );

// Hook can thiệp trực tiếp vào filter hiển thị giá của LearnPress Admin Table
function override_learnpress_admin_price_html( $price_html, $course_id ) {
    $regular_price = get_post_meta( $course_id, '_lp_price', true );
    if ( $regular_price === '' ) {
        $regular_price = get_post_meta( $course_id, '_lp_regular_price', true );
    }
    $sale_price = get_post_meta( $course_id, '_lp_sale_price', true );

    if ( (float) $regular_price > 0 ) {
        if ( (float) $sale_price > 0 && (float) $sale_price < (float) $regular_price ) {
            return '<span style="text-decoration: line-through; color: #888;">$' . esc_html( $regular_price ) . '</span> <span style="color: #d9534f; font-weight: bold;">$' . esc_html( $sale_price ) . '</span>';
        } else {
            return '<span style="font-weight: bold; color: #28a745;">$' . esc_html( $regular_price ) . '</span>';
        }
    }
    return $price_html;
}
add_filter( 'learn_press_course_price_html', 'override_learnpress_admin_price_html', 999, 2 );



// 2. Đồng bộ khi bỏ khóa học lp_course vào thùng rác (Trash)
function sync_trash_lp_course( $post_id ) {
    if ( get_post_type( $post_id ) !== 'lp_course' ) return;

    $linked_product_id = get_post_meta( $post_id, '_linked_product_id', true );
    if ( $linked_product_id && get_post( $linked_product_id ) ) {
        wp_trash_post( $linked_product_id );
    }
}
add_action( 'wp_trash_post', 'sync_trash_lp_course' );

// 3. Đồng bộ khi khôi phục khóa học lp_course từ thùng rác (Untrash / Restore)
function sync_untrash_lp_course( $post_id ) {
    if ( get_post_type( $post_id ) !== 'lp_course' ) return;

    $linked_product_id = get_post_meta( $post_id, '_linked_product_id', true );
    if ( $linked_product_id && get_post( $linked_product_id ) ) {
        wp_untrash_post( $linked_product_id );
    }
}
add_action( 'untrash_post', 'sync_untrash_lp_course' );

// 4. Đồng bộ khi xóa vĩnh viễn khóa học lp_course khỏi thùng rác (Delete Permanently)
function sync_delete_lp_course( $post_id ) {
    if ( get_post_type( $post_id ) !== 'lp_course' ) return;

    $linked_product_id = get_post_meta( $post_id, '_linked_product_id', true );
    if ( $linked_product_id && get_post( $linked_product_id ) ) {
        wp_delete_post( $linked_product_id, true );
    }
}
add_action( 'before_delete_post', 'sync_delete_lp_course' );

// Các hàm Helper để vô hiệu hóa/kích hoạt lại hook tránh vòng lặp đệ quy
function unhook_sync_course_to_product() {
    remove_action( 'save_post_lp_course', 'sync_lp_course_to_product', 20 );
}

function rehook_sync_course_to_product() {
    add_action( 'save_post_lp_course', 'sync_lp_course_to_product', 20, 3 );
}

/**
 * 5. Hiển thị nút "Add to Cart" (Thêm vào giỏ hàng) sản phẩm WooCommerce đồng bộ trên trang khóa học LearnPress
 */
function render_woocommerce_add_to_cart_button_html( $course_id ) {
    $product_id = get_post_meta( $course_id, '_linked_product_id', true );

    if ( $product_id && get_post( $product_id ) && function_exists( 'wc_get_product' ) ) {
        $product = wc_get_product( $product_id );
        if ( $product && $product->is_purchasable() && $product->is_in_stock() ) {
            $add_to_cart_url = esc_url( add_query_arg( 'add-to-cart', $product_id, wc_get_cart_url() ) );
            
            return sprintf(
                '<div class="lp-wc-add-to-cart-wrapper" style="margin-top: 10px; margin-bottom: 10px;">
                    <a href="%s" data-quantity="1" class="button alt add_to_cart_button ajax_add_to_cart product_type_simple lp-button button-purchase-course" data-product_id="%d" data-product_sku="%s" aria-label="%s" rel="nofollow" style="text-align:center; width: 100%%; box-sizing: border-box; padding: 12px 20px; background-color: #28a745; color: #fff; font-weight: bold; border-radius: 5px; text-decoration: none; display: block;">%s</a>
                </div>',
                $add_to_cart_url,
                esc_attr( $product->get_id() ),
                esc_attr( $product->get_sku() ),
                esc_attr( $product->get_title() ),
                __( 'Thêm vào giỏ hàng', 'woocommerce' )
            );
        }
    }
    return '';
}

function add_woocommerce_add_to_cart_button_to_course() {
    if ( ! is_singular( 'lp_course' ) ) return;
    echo render_woocommerce_add_to_cart_button_html( get_the_ID() );
}

// Đăng ký vào tất cả các hook LearnPress Course Sidebar / Purchase Buttons phổ biến
add_action( 'learn-press/course-buttons', 'add_woocommerce_add_to_cart_button_to_course', 20 );
add_action( 'learn_press_after_single_course_payment_button', 'add_woocommerce_add_to_cart_button_to_course', 20 );
add_action( 'learn-press/after-single-course-description', 'add_woocommerce_add_to_cart_button_to_course', 20 );
add_action( 'learn-press/single-button-enroll', 'add_woocommerce_add_to_cart_button_to_course', 20 );

// Thêm JS Client Fallback để đảm bảo nút chắc chắn xuất hiện dưới nút "Buy Now" trên bất kỳ Theme nào
function inject_wc_add_to_cart_button_via_js() {
    if ( ! is_singular( 'lp_course' ) ) return;
    
    $course_id = get_the_ID();
    $button_html = render_woocommerce_add_to_cart_button_html( $course_id );
    if ( empty( $button_html ) ) return;
    ?>
    <script type="text/javascript">
    document.addEventListener('DOMContentLoaded', function() {
        if (document.querySelector('.lp-wc-add-to-cart-wrapper')) return;
        
        var buyNowBtn = document.querySelector('.course-payment-button, .lp-button-purchase, button.purchase-course, form.purchase-course');
        var sidebar = document.querySelector('.course-summary-sidebar, .widget-course-info, .lp-course-buttons');
        
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = <?php echo json_encode( $button_html ); ?>;
        var btnNode = tempDiv.firstElementChild;

        if (buyNowBtn && buyNowBtn.parentNode) {
            buyNowBtn.parentNode.insertBefore(btnNode, buyNowBtn.nextSibling);
        } else if (sidebar) {
            sidebar.appendChild(btnNode);
        }
    });
    </script>
    <?php
}
add_action( 'wp_footer', 'inject_wc_add_to_cart_button_via_js', 99 );

/**
 * 6. Tự động kích hoạt (Enroll) khóa học LearnPress cho học sinh khi Đơn hàng WooCommerce ở trạng thái Completed
 */
function auto_enroll_learnpress_course_on_wc_completed( $order_id, $from_status = '', $to_status = '', $wc_order = null ) {
    if ( ! function_exists( 'wc_get_order' ) ) return;

    if ( ! $wc_order ) {
        $wc_order = wc_get_order( $order_id );
    }
    if ( ! $wc_order ) return;

    // Chỉ thực hiện kích hoạt khi đơn hàng ở trạng thái 'completed'
    $status = $to_status ? $to_status : $wc_order->get_status();
    if ( $status !== 'completed' ) return;

    $user_id = $wc_order->get_user_id();
    if ( ! $user_id ) return;

    $items = $wc_order->get_items();
    if ( empty( $items ) ) return;

    foreach ( $items as $item ) {
        $product_id = $item->get_product_id();
        
        // Tìm ID khóa học LearnPress tương ứng với sản phẩm WooCommerce
        $course_id = get_post_meta( $product_id, '_linked_course_id', true );

        if ( ! $course_id ) {
            $courses = get_posts( array(
                'post_type'      => 'lp_course',
                'meta_key'       => '_linked_product_id',
                'meta_value'     => $product_id,
                'posts_per_page' => 1,
                'fields'         => 'ids',
            ) );
            if ( ! empty( $courses ) ) {
                $course_id = $courses[0];
            }
        }

        if ( ! $course_id || ! get_post( $course_id ) ) continue;

        // 1. Phương thức kích hoạt chuẩn của LearnPress API
        if ( class_exists( 'LP_User_Factory' ) ) {
            $user = learn_press_get_user( $user_id );
            if ( $user && method_exists( $user, 'enroll' ) ) {
                $user->enroll( $course_id, 0 );
            }
        }

        // 2. Kích hoạt trực tiếp trong Database (Bảng wp_learnpress_user_items)
        global $wpdb;
        $table = $wpdb->prefix . 'learnpress_user_items';
        
        if ( $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE %s", $table ) ) === $table ) {
            $exist = $wpdb->get_var( $wpdb->prepare(
                "SELECT user_item_id FROM {$table} WHERE user_id = %d AND item_id = %d AND item_type = %s",
                $user_id, $course_id, 'lp_course'
            ) );

            if ( ! $exist ) {
                $wpdb->insert(
                    $table,
                    array(
                        'user_id'    => $user_id,
                        'item_id'    => $course_id,
                        'start_time' => current_time( 'mysql' ),
                        'end_time'   => null,
                        'item_type'  => 'lp_course',
                        'status'     => 'enrolled',
                        'ref_id'     => $order_id,
                        'ref_type'   => 'woocommerce_order',
                        'parent_id'  => 0,
                    ),
                    array( '%d', '%d', '%s', '%s', '%s', '%s', '%d', '%s', '%d' )
                );
            }
        }
    }
}

// Bắt các sự kiện khi đơn hàng WooCommerce chuyển sang Completed
add_action( 'woocommerce_order_status_completed', 'auto_enroll_learnpress_course_on_wc_completed', 10, 1 );
add_action( 'woocommerce_order_status_changed', 'auto_enroll_learnpress_course_on_wc_completed', 10, 4 );

/**
 * 7. NHÚNG CÁC TOOL COPY DỮ LIỆU TỪ REST API EDUBINK VÀO WORDPRESS (AN TOÀN KIỂM TRA TỆP TỒN TẠI)
 */
if ( file_exists( __DIR__ . '/inc/importer-course.php' ) ) {
    require_once __DIR__ . '/inc/importer-course.php';
}
if ( file_exists( __DIR__ . '/inc/importer-posts.php' ) ) {
    require_once __DIR__ . '/inc/importer-posts.php';
}




// Hàm hỗ trợ Tải ảnh từ URL vào thư mục Media Uploads của WordPress
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

// Đăng ký các trường meta của LearnPress vào REST API cho lp_course, lp_lesson và lp_quiz
add_action( 'rest_api_init', function() {
    $meta_keys = array(
        '_lp_duration',
        '_lp_level',
        '_lp_price',
        '_lp_regular_price',
        '_lp_sale_price',
        '_lp_students',
        '_lp_rating',
    );

    foreach ( $meta_keys as $meta_key ) {
        register_rest_field( 'lp_course', $meta_key, array(
            'get_callback' => function( $object ) use ( $meta_key ) {
                return get_post_meta( $object['id'], $meta_key, true );
            },
            'update_callback' => null,
            'schema'          => null,
        ) );
    }

    // Đăng ký trường sections (lộ trình khóa học Curriculum) cho lp_course
    register_rest_field( 'lp_course', 'sections', array(
        'get_callback' => function( $object ) {
            global $wpdb;
            $course_id      = $object['id'];
            $sections_table = $wpdb->prefix . 'learnpress_sections';
            $items_table    = $wpdb->prefix . 'learnpress_section_items';

            if ( $wpdb->get_var( "SHOW TABLES LIKE '{$sections_table}'" ) !== $sections_table ) {
                return array();
            }

            $sections = $wpdb->get_results( $wpdb->prepare(
                "SELECT section_id, section_name, section_order FROM {$sections_table} WHERE section_course_id = %d ORDER BY section_order ASC",
                $course_id
            ), ARRAY_A );

            if ( empty( $sections ) ) {
                return array();
            }

            foreach ( $sections as &$sec ) {
                $items = $wpdb->get_results( $wpdb->prepare(
                    "SELECT si.item_id, si.item_order, si.item_type, p.post_title, p.post_content 
                     FROM {$items_table} si
                     LEFT JOIN {$wpdb->posts} p ON si.item_id = p.ID
                     WHERE si.section_id = %d
                     ORDER BY si.item_order ASC",
                    $sec['section_id']
                ), ARRAY_A );

                if ( ! empty( $items ) ) {
                    foreach ( $items as &$item ) {
                        $item_id = $item['item_id'];
                        $item['preview']  = get_post_meta( $item_id, '_lp_preview', true ) === 'yes';
                        $item['duration'] = get_post_meta( $item_id, '_lp_duration', true );
                        $item['title']    = $item['post_title'];
                        $item['content']  = $item['post_content'];
                    }
                } else {
                    $items = array();
                }

                $sec['items'] = $items;
            }

            return $sections;
        },
        'update_callback' => null,
        'schema'          => null,
    ) );

    // Helper: Lấy chi tiết đánh giá số sao (5,4,3,2,1 sao) và danh sách nhận xét của khóa học
    if ( ! function_exists( 'get_lp_course_rating_details' ) ) {
        function get_lp_course_rating_details( $course_id ) {
            global $wpdb;
            $course_id = intval( $course_id );
            if ( ! $course_id ) {
                return array(
                    'average'  => 0,
                    'total'    => 0,
                    'stars'    => array( '5' => 0, '4' => 0, '3' => 0, '2' => 0, '1' => 0 ),
                    'percents' => array( '5' => 0, '4' => 0, '3' => 0, '2' => 0, '1' => 0 ),
                    'reviews'  => array(),
                );
            }

            // 1. Lấy điểm trung bình từ postmeta nếu có
            $average_meta = get_post_meta( $course_id, '_lp_course_rating_average', true );
            if ( ! $average_meta ) {
                $average_meta = get_post_meta( $course_id, '_lp_rating', true );
            }

            // 2. Truy vấn tất cả đánh giá (reviews / comments) từ WordPress Database
            $comments = $wpdb->get_results( $wpdb->prepare( "
                SELECT comment_ID, comment_author, comment_author_email, comment_content, comment_date, user_id
                FROM {$wpdb->comments}
                WHERE comment_post_ID = %d AND comment_approved = '1'
                ORDER BY comment_date DESC
            ", $course_id ) );

            $stars_count = array( '5' => 0, '4' => 0, '3' => 0, '2' => 0, '1' => 0 );
            $reviews = array();
            $total_stars_sum = 0;

            foreach ( $comments as $cm ) {
                $cm_id = intval( $cm->comment_ID );

                // Lấy số sao đánh giá (1..5) từ commentmeta (_rating hoặc _review_rating)
                $rating = $wpdb->get_var( $wpdb->prepare( "
                    SELECT meta_value FROM {$wpdb->commentmeta}
                    WHERE comment_id = %d AND (meta_key = '_rating' OR meta_key = '_review_rating' OR meta_key = '_rating_val')
                    LIMIT 1
                ", $cm_id ) );

                $rating = intval( $rating );
                if ( $rating < 1 || $rating > 5 ) {
                    $rating = 5;
                }

                $stars_key = strval( $rating );
                if ( isset( $stars_count[ $stars_key ] ) ) {
                    $stars_count[ $stars_key ]++;
                }

                $total_stars_sum += $rating;

                // Lấy tiêu đề đánh giá nếu có
                $title = $wpdb->get_var( $wpdb->prepare( "
                    SELECT meta_value FROM {$wpdb->commentmeta}
                    WHERE comment_id = %d AND (meta_key = '_rating_title' OR meta_key = '_review_title' OR meta_key = '_title')
                    LIMIT 1
                ", $cm_id ) );

                $avatar_url = get_avatar_url( $cm->comment_author_email, array( 'size' => 96 ) );

                $reviews[] = array(
                    'id'            => $cm_id,
                    'author_name'   => esc_html( $cm->comment_author ),
                    'author_avatar' => $avatar_url ? $avatar_url : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200',
                    'rating'        => $rating,
                    'title'         => $title ? esc_html( $title ) : '',
                    'content'       => wp_strip_all_tags( $cm->comment_content ),
                    'date'          => $cm->comment_date,
                );
            }

            $total_reviews = count( $reviews );
            $calculated_avg = $total_reviews > 0 ? round( $total_stars_sum / $total_reviews, 1 ) : 0;
            $final_avg = $average_meta ? floatval( $average_meta ) : $calculated_avg;

            $percents = array( '5' => 0, '4' => 0, '3' => 0, '2' => 0, '1' => 0 );
            if ( $total_reviews > 0 ) {
                foreach ( $stars_count as $star => $count ) {
                    $percents[ $star ] = round( ( $count / $total_reviews ) * 100, 1 );
                }
            }

            return array(
                'average'  => $final_avg,
                'total'    => $total_reviews,
                'stars'    => $stars_count,
                'percents' => $percents,
                'reviews'  => $reviews,
            );
        }
    }

    // Đăng ký trường rating_details cho REST API bài viết lp_course
    register_rest_field( 'lp_course', 'rating_details', array(
        'get_callback' => function( $object ) {
            return get_lp_course_rating_details( $object['id'] );
        },
        'update_callback' => null,
        'schema'          => null,
    ) );

    // REST API Custom Endpoint: Lấy thông tin đánh giá khóa học theo ID
    register_rest_route( 'custom/v1', '/course-reviews', array(
        'methods'  => 'GET',
        'callback' => function ( WP_REST_Request $request ) {
            $course_id = intval( $request->get_param( 'course_id' ) );
            if ( ! $course_id ) {
                return new WP_Error( 'missing_course_id', 'Thiếu tham số course_id.', array( 'status' => 400 ) );
            }
            return get_lp_course_rating_details( $course_id );
        },
        'permission_callback' => '__return_true',
    ) );

    // Đăng ký thêm các thuộc tính bài học preview, duration, graduation, status, locked cho lp_lesson và lp_quiz
    $item_fields = array(
        'preview'    => '_lp_preview',
        'duration'   => '_lp_duration',
        'graduation' => '_lp_graduation',
        'status'     => '_lp_status',
        'locked'     => '_lp_locked',
    );

    foreach ( array( 'lp_lesson', 'lp_quiz' ) as $post_type ) {
        foreach ( $item_fields as $field_name => $meta_key ) {
            register_rest_field( $post_type, $field_name, array(
                'get_callback' => function( $object ) use ( $meta_key, $field_name ) {
                    $val = get_post_meta( $object['id'], $meta_key, true );
                    if ( $field_name === 'preview' || $field_name === 'locked' ) {
                        return $val === 'yes' || $val === '1' || $val === true;
                    }
                    return $val ? $val : '';
                },
                'update_callback' => null,
                'schema'          => null,
            ) );
        }
    }

    /**
     * REST API Custom Endpoint cho Đăng nhập
     * Route: POST /wp-json/custom/v1/login
     */
    register_rest_route( 'custom/v1', '/login', array(
        'methods'  => 'POST',
        'callback' => function ( WP_REST_Request $request ) {
            $username = sanitize_text_field( $request->get_param( 'username' ) );
            $password = $request->get_param( 'password' );

            if ( empty( $username ) || empty( $password ) ) {
                return new WP_Error( 'empty_fields', 'Vui lòng nhập tên đăng nhập và mật khẩu.', array( 'status' => 400 ) );
            }

            if ( is_email( $username ) ) {
                $user_obj = get_user_by( 'email', $username );
                if ( $user_obj ) {
                    $username = $user_obj->user_login;
                }
            }

            $user = wp_authenticate( $username, $password );

            if ( is_wp_error( $user ) ) {
                return new WP_Error( 'invalid_credentials', 'Tên đăng nhập hoặc mật khẩu không chính xác.', array( 'status' => 401 ) );
            }

            return array(
                'id'       => $user->ID,
                'username' => $user->user_login,
                'email'    => $user->user_email,
                'name'     => $user->display_name,
            );
        },
        'permission_callback' => '__return_true',
    ) );

    /**
     * REST API Custom Endpoint cho My Courses (LearnPress / LearnDash / User Enrolled Courses)
     * Route: GET /wp-json/custom/v1/user-courses?user_id={id}
     */
    register_rest_route( 'custom/v1', '/user-courses', array(
        'methods'  => 'GET',
        'callback' => function ( WP_REST_Request $request ) {
            $user_id = intval( $request->get_param( 'user_id' ) );
            if ( ! $user_id ) {
                return new WP_Error( 'missing_user_id', 'Vui lòng cung cấp user_id.', array( 'status' => 400 ) );
            }

            global $wpdb;
            $courses = array();

            // 1. Kiểm tra bảng learnpress_user_items nếu hệ thống cài đặt LearnPress
            $table_name = $wpdb->prefix . 'learnpress_user_items';
            if ( $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE %s", $table_name ) ) === $table_name ) {
                $user_items = $wpdb->get_results( $wpdb->prepare( "
                    SELECT user_item_id, item_id as course_id, user_id, start_time, end_time, item_type, status, graduation
                    FROM {$table_name}
                    WHERE user_id = %d AND item_type = 'lp_course'
                    ORDER BY start_time DESC
                ", $user_id ) );

                if ( ! empty( $user_items ) ) {
                    $lp_user = function_exists( 'learnpress_get_user' ) ? learnpress_get_user( $user_id ) : null;

                    foreach ( $user_items as $item ) {
                        $course_post = get_post( $item->course_id );
                        if ( ! $course_post || $course_post->post_type !== 'lp_course' ) {
                            continue;
                        }

                        $user_item_id = $item->user_item_id;
                        $status_raw   = strtolower( $item->status );
                        $graduation   = strtolower( $item->graduation );

                        $status = 'in-progress';
                        if ( $graduation === 'passed' || $status_raw === 'passed' ) {
                            $status = 'passed';
                        } elseif ( $graduation === 'failed' || $status_raw === 'failed' ) {
                            $status = 'failed';
                        } elseif ( $status_raw === 'completed' || $status_raw === 'finished' ) {
                            $status = 'finished';
                        }

                        $result_val = 0;
                        $expiration_time = '-';
                        $end_time = '-';

                        // 1. Thử dùng official LearnPress User Course API
                        if ( $lp_user && method_exists( $lp_user, 'get_course_data' ) ) {
                            $user_course = $lp_user->get_course_data( $item->course_id );
                            if ( $user_course ) {
                                if ( method_exists( $user_course, 'get_percent_result' ) ) {
                                    $result_val = round( floatval( $user_course->get_percent_result() ), 2 );
                                }
                                if ( method_exists( $user_course, 'get_expiration_time' ) ) {
                                    $exp_time_lp = $user_course->get_expiration_time();
                                    if ( $exp_time_lp ) {
                                        $exp_timestamp = is_numeric( $exp_time_lp ) ? $exp_time_lp : strtotime( (string) $exp_time_lp );
                                        if ( $exp_timestamp && $exp_timestamp > 0 ) {
                                            $expiration_time = date_i18n( 'F j, Y g:i a', $exp_timestamp );
                                        }
                                    }
                                }
                            }
                        }

                        // 2. Fallback SQL meta lookup cho Result % (Giải nén data serialized/json)
                        if ( $result_val <= 0 ) {
                            $meta_val = $wpdb->get_var( $wpdb->prepare( "
                                SELECT meta_value FROM {$wpdb->prefix}learnpress_user_itemmeta
                                WHERE learnpress_user_item_id = %d AND meta_key IN ('_porcentage_result', 'result', 'grade', '_result', 'evaluate_final_quiz')
                                ORDER BY meta_id DESC LIMIT 1
                            ", $user_item_id ) );

                            if ( ! empty( $meta_val ) ) {
                                if ( is_serialized( $meta_val ) ) {
                                    $unserialized = @unserialize( $meta_val );
                                    if ( is_array( $unserialized ) && isset( $unserialized['result'] ) ) {
                                        $result_val = round( floatval( $unserialized['result'] ), 2 );
                                    } elseif ( is_numeric( $unserialized ) ) {
                                        $result_val = round( floatval( $unserialized ), 2 );
                                    }
                                } elseif ( strpos( $meta_val, '{' ) !== false ) {
                                    $json_data = json_decode( $meta_val, true );
                                    if ( is_array( $json_data ) && isset( $json_data['result'] ) ) {
                                        $result_val = round( floatval( $json_data['result'] ), 2 );
                                    }
                                } elseif ( is_numeric( $meta_val ) ) {
                                    $result_val = round( floatval( $meta_val ), 2 );
                                }
                            }
                        }

                        // 3. Tính toán tỷ lệ hoàn thành bài học (chỉ tính lp_lesson, loại trừ lp_quiz)
                        $total_lessons = $wpdb->get_var( $wpdb->prepare( "
                            SELECT COUNT( DISTINCT si.item_id )
                            FROM {$wpdb->prefix}learnpress_section_items si
                            INNER JOIN {$wpdb->posts} p ON p.ID = si.item_id
                            WHERE si.section_id IN (
                                SELECT section_id FROM {$wpdb->prefix}learnpress_sections WHERE section_course_id = %d
                            ) AND p.post_type = 'lp_lesson'
                        ", $item->course_id ) );

                        if ( $total_lessons > 0 ) {
                            $completed_lessons = $wpdb->get_var( $wpdb->prepare( "
                                SELECT COUNT( DISTINCT item_id )
                                FROM {$wpdb->prefix}learnpress_user_items
                                WHERE user_id = %d AND parent_id = %d AND status = 'completed' AND item_type = 'lp_lesson'
                            ", $user_id, $user_item_id ) );

                            $result_val = round( ( $completed_lessons / $total_lessons ) * 100, 2 );
                        } elseif ( $status === 'passed' || $status === 'finished' ) {
                            $result_val = 100;
                        }

                        // 3. Fallback cho Expiration time
                        if ( $expiration_time === '-' ) {
                            // Kiểm tra meta _expiration_time trong user_itemmeta
                            $exp_meta = $wpdb->get_var( $wpdb->prepare( "
                                SELECT meta_value FROM {$wpdb->prefix}learnpress_user_itemmeta
                                WHERE learnpress_user_item_id = %d AND meta_key = '_expiration_time'
                                LIMIT 1
                            ", $user_item_id ) );

                            if ( ! empty( $exp_meta ) && $exp_meta !== '0000-00-00 00:00:00' ) {
                                $exp_timestamp = is_numeric( $exp_meta ) ? intval( $exp_meta ) : strtotime( $exp_meta );
                                if ( $exp_timestamp > 0 ) {
                                    $expiration_time = date_i18n( 'F j, Y g:i a', $exp_timestamp );
                                }
                            }

                            // Nếu chưa có meta, tính toán theo _lp_duration post_meta
                            if ( $expiration_time === '-' && ! empty( $item->start_time ) && $item->start_time !== '0000-00-00 00:00:00' ) {
                                $duration_meta = get_post_meta( $item->course_id, '_lp_duration', true );
                                if ( ! empty( $duration_meta ) && $duration_meta !== '0' && strtolower( $duration_meta ) !== 'no' ) {
                                    $start_ts = strtotime( $item->start_time );
                                    if ( $start_ts > 0 ) {
                                        $exp_ts = strtotime( '+' . $duration_meta, $start_ts );
                                        if ( $exp_ts && $exp_ts > $start_ts ) {
                                            $expiration_time = date_i18n( 'F j, Y g:i a', $exp_ts );
                                        }
                                    }
                                }
                            }
                        }

                        // 4. End time
                        if ( ! empty( $item->end_time ) && $item->end_time !== '0000-00-00 00:00:00' ) {
                            $end_ts = strtotime( $item->end_time );
                            if ( $end_ts > 0 ) {
                                $end_time = date_i18n( 'F j, Y g:i a', $end_ts );
                            }
                        }

                        $image_url = get_the_post_thumbnail_url( $item->course_id, 'full' );

                        $passing_condition = get_post_meta( $item->course_id, '_lp_passing_condition', true );
                        $clean_num = ( floatval( $result_val ) == intval( $result_val ) ) ? intval( $result_val ) : floatval( $result_val );
                        $result_label = $clean_num . '%';
                        $passing_grade_val = ( ! empty( $passing_condition ) && intval( $passing_condition ) > 0 ) ? intval( $passing_condition ) . '%' : 'N/A';

                        $courses[] = array(
                            'id'                   => $item->course_id,
                            'title'                => html_entity_decode( get_the_title( $item->course_id ) ),
                            'slug'                 => $course_post->post_name,
                            'description'          => wp_strip_all_tags( get_the_excerpt( $item->course_id ) ),
                            'image'                => $image_url ? $image_url : 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=600&auto=format&fit=crop',
                            'progress'             => $result_val,
                            'courseProgress'       => $result_label,
                            'passingGradeProgress' => $passing_grade_val,
                            'passingGrade'         => ! empty( $passing_condition ) ? intval( $passing_condition ) : null,
                            'status'               => $status,
                            'result'               => $result_label,
                            'expirationTime'       => $expiration_time,
                            'endTime'              => $end_time,
                        );
                    }

                    return $courses;
                }
            }

            // 2. Fallback: Nếu chưa có LearnPress table, trả về danh sách post_type lp_course của hệ thống
            $all_posts = get_posts( array(
                'post_type'      => array( 'lp_course', 'sfwd-courses' ),
                'posts_per_page' => 10,
                'post_status'    => 'publish',
            ) );

            foreach ( $all_posts as $idx => $p ) {
                $image_url = get_the_post_thumbnail_url( $p->ID, 'full' );
                $statuses  = array( 'in-progress', 'passed', 'finished', 'failed' );
                $st        = $statuses[ $idx % count( $statuses ) ];

                $courses[] = array(
                    'id'             => $p->ID,
                    'title'          => html_entity_decode( get_the_title( $p->ID ) ),
                    'slug'           => $p->post_name,
                    'description'    => wp_strip_all_tags( get_the_excerpt( $p->ID ) ),
                    'image'          => $image_url ? $image_url : 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=600&auto=format&fit=crop',
                    'progress'       => $st === 'passed' || $st === 'finished' ? 100 : 14.29,
                    'status'         => $st,
                    'result'         => ( $st === 'passed' || $st === 'finished' ? '100%' : '14.29%' ),
                    'expirationTime' => 'August 6, 2026 3:32 am',
                    'endTime'        => $st === 'finished' || $st === 'passed' ? 'July 30, 2026 10:00 am' : '-',
                );
            }

            return $courses;
        },
        'permission_callback' => '__return_true',
    ) );

    /**
     * REST API Custom Endpoint cho Account Details & Change Password
     * Route: GET /wp-json/custom/v1/account-details?user_id={id}
     * Route: POST /wp-json/custom/v1/save-account-details
     */
    register_rest_route( 'custom/v1', '/account-details', array(
        'methods'  => 'GET',
        'callback' => function ( WP_REST_Request $request ) {
            $user_id = intval( $request->get_param( 'user_id' ) );
            if ( ! $user_id ) {
                return new WP_Error( 'missing_user_id', 'Vui lòng cung cấp user_id.', array( 'status' => 400 ) );
            }

            $user = get_userdata( $user_id );
            if ( ! $user ) {
                return new WP_Error( 'user_not_found', 'Không tìm thấy người dùng.', array( 'status' => 404 ) );
            }

            return array(
                'id'           => $user->ID,
                'first_name'   => get_user_meta( $user_id, 'first_name', true ),
                'last_name'    => get_user_meta( $user_id, 'last_name', true ),
                'display_name' => $user->display_name,
                'email'        => $user->user_email,
            );
        },
        'permission_callback' => '__return_true',
    ) );

    register_rest_route( 'custom/v1', '/save-account-details', array(
        'methods'  => 'POST',
        'callback' => function ( WP_REST_Request $request ) {
            $user_id      = intval( $request->get_param( 'user_id' ) );
            $first_name   = sanitize_text_field( $request->get_param( 'first_name' ) );
            $last_name    = sanitize_text_field( $request->get_param( 'last_name' ) );
            $display_name = sanitize_text_field( $request->get_param( 'display_name' ) );
            $email        = sanitize_email( $request->get_param( 'email' ) );
            $current_pass = $request->get_param( 'current_password' );
            $new_pass     = $request->get_param( 'new_password' );

            if ( ! $user_id ) {
                return new WP_Error( 'missing_user_id', 'Vui lòng cung cấp user_id.', array( 'status' => 400 ) );
            }

            $user_data = array(
                'ID'           => $user_id,
                'first_name'   => $first_name,
                'last_name'    => $last_name,
                'display_name' => $display_name,
                'user_email'   => $email,
            );

            if ( ! empty( $new_pass ) ) {
                $user = get_userdata( $user_id );
                if ( ! $user || ! wp_check_password( $current_pass, $user->user_pass, $user_id ) ) {
                    return new WP_Error( 'wrong_password', 'Mật khẩu hiện tại không chính xác.', array( 'status' => 400 ) );
                }
                $user_data['user_pass'] = $new_pass;
            }

            $updated = wp_update_user( $user_data );
            if ( is_wp_error( $updated ) ) {
                return $updated;
            }

            return array( 'success' => true, 'message' => 'Cập nhật thông tin tài khoản thành công.' );
        },
        'permission_callback' => '__return_true',
    ) );

    // REST API: Lấy danh sách bài học đã hoàn thành của học viên (LearnPress)
    register_rest_route( 'custom/v1', '/course-progress', array(
        'methods'  => 'GET',
        'callback' => function ( WP_REST_Request $request ) {
            global $wpdb;
            $raw_user   = $request->get_param( 'user_id' );
            $raw_course = $request->get_param( 'course_id' );

            $user_id   = intval( $raw_user );
            $course_id = intval( $raw_course );

            if ( ! $course_id && ! empty( $raw_course ) ) {
                $course_id = intval( $wpdb->get_var( $wpdb->prepare( "
                    SELECT ID FROM {$wpdb->posts}
                    WHERE post_name = %s AND post_type = 'lp_course'
                    LIMIT 1
                ", $raw_course ) ) );
            }

            $passing_condition = $course_id > 0 ? get_post_meta( $course_id, '_lp_passing_condition', true ) : 80;
            $passing_grade     = ( ! empty( $passing_condition ) && intval( $passing_condition ) > 0 ) ? intval( $passing_condition ) : 80;

            $course_status = 'enrolled';
            if ( $course_id > 0 ) {
                $status_db = $wpdb->get_var( $wpdb->prepare( "
                    SELECT status FROM {$wpdb->prefix}learnpress_user_items
                    WHERE user_id = %d AND item_id = %d AND item_type = 'lp_course'
                    ORDER BY user_item_id DESC LIMIT 1
                ", $user_id, $course_id ) );
                if ( $status_db ) {
                    $course_status = $status_db;
                }
            }

            if ( $course_id > 0 ) {
                $parent_item_id = $wpdb->get_var( $wpdb->prepare( "
                    SELECT user_item_id FROM {$wpdb->prefix}learnpress_user_items
                    WHERE user_id = %d AND item_id = %d AND item_type = 'lp_course'
                    ORDER BY user_item_id DESC LIMIT 1
                ", $user_id, $course_id ) );

                if ( $parent_item_id ) {
                    $completed = $wpdb->get_col( $wpdb->prepare( "
                        SELECT item_id FROM {$wpdb->prefix}learnpress_user_items
                        WHERE user_id = %d AND parent_id = %d AND status = 'completed' AND item_type IN ('lp_lesson', 'lp_quiz')
                    ", $user_id, $parent_item_id ) );

                    return array(
                        'completed_lessons'  => array_map( 'intval', $completed ),
                        'completed_topics'   => array(),
                        'passing_grade'      => $passing_grade,
                        'user_course_status' => $course_status,
                    );
                }
            }

            $completed = $wpdb->get_col( $wpdb->prepare( "
                SELECT item_id FROM {$wpdb->prefix}learnpress_user_items
                WHERE user_id = %d AND status = 'completed' AND item_type IN ('lp_lesson', 'lp_quiz')
            ", $user_id ) );

            return array(
                'completed_lessons'  => array_map( 'intval', $completed ),
                'completed_topics'   => array(),
                'passing_grade'      => $passing_grade,
                'user_course_status' => $course_status,
            );
        },
        'permission_callback' => '__return_true',
    ) );

    // REST API: Đánh dấu hoàn thành bài học (LearnPress)
    register_rest_route( 'custom/v1', '/mark-complete', array(
        'methods'  => 'POST',
        'callback' => function ( WP_REST_Request $request ) {
            global $wpdb;
            $raw_user   = $request->get_param( 'user_id' );
            $raw_course = $request->get_param( 'course_id' );
            $raw_lesson = $request->get_param( 'post_id' ) ? $request->get_param( 'post_id' ) : $request->get_param( 'lesson_id' );

            $user_id   = intval( $raw_user );
            $course_id = intval( $raw_course );
            $lesson_id = intval( $raw_lesson );

            // Resolving course_id slug -> ID
            if ( ! $course_id && ! empty( $raw_course ) ) {
                $course_id = intval( $wpdb->get_var( $wpdb->prepare( "
                    SELECT ID FROM {$wpdb->posts}
                    WHERE post_name = %s AND post_type = 'lp_course'
                    LIMIT 1
                ", $raw_course ) ) );
            }

            // Resolving lesson_id slug -> ID
            if ( ! $lesson_id && ! empty( $raw_lesson ) ) {
                $lesson_id = intval( $wpdb->get_var( $wpdb->prepare( "
                    SELECT ID FROM {$wpdb->posts}
                    WHERE post_name = %s AND post_type IN ('lp_lesson', 'lp_quiz')
                    LIMIT 1
                ", $raw_lesson ) ) );
            }

            if ( ! $user_id || ! $lesson_id ) {
                return new WP_Error( 'missing_params', 'Thiếu user_id hoặc lesson_id hợp lệ.', array( 'status' => 400 ) );
            }

            // Lấy item_type (lp_lesson hoặc lp_quiz)
            $item_type = get_post_type( $lesson_id );
            if ( ! in_array( $item_type, array( 'lp_lesson', 'lp_quiz' ) ) ) {
                $item_type = 'lp_lesson';
            }

            // Gọi hàm ghi nhận hoàn thành chính thức của LearnPress nếu plugin active
            if ( function_exists( 'learn_press_user_complete_item' ) && $course_id > 0 ) {
                try {
                    learn_press_user_complete_item( $user_id, $lesson_id, $course_id );
                } catch ( Exception $e ) {}
            }

            // Lấy parent_id (user_item_id của khóa học trong wp_learnpress_user_items)
            $parent_item_id = 0;
            if ( $course_id > 0 ) {
                $parent_item_id = intval( $wpdb->get_var( $wpdb->prepare( "
                    SELECT user_item_id FROM {$wpdb->prefix}learnpress_user_items
                    WHERE user_id = %d AND item_id = %d AND item_type = 'lp_course'
                    ORDER BY user_item_id DESC LIMIT 1
                ", $user_id, $course_id ) ) );
            }

            // Kiểm tra dòng bài học hiện tại trong wp_learnpress_user_items
            $existing_id = $wpdb->get_var( $wpdb->prepare( "
                SELECT user_item_id FROM {$wpdb->prefix}learnpress_user_items
                WHERE user_id = %d AND item_id = %d AND item_type = %s
                ORDER BY user_item_id DESC LIMIT 1
            ", $user_id, $lesson_id, $item_type ) );

            $now = current_time( 'mysql' );

            if ( $existing_id ) {
                $wpdb->update(
                    $wpdb->prefix . 'learnpress_user_items',
                    array(
                        'status'     => 'completed',
                        'graduation' => 'passed',
                        'end_time'   => $now,
                        'parent_id'  => $parent_item_id ? $parent_item_id : 0,
                    ),
                    array( 'user_item_id' => $existing_id )
                );
            } else {
                $wpdb->insert(
                    $wpdb->prefix . 'learnpress_user_items',
                    array(
                        'user_id'     => $user_id,
                        'item_id'     => $lesson_id,
                        'start_time'  => $now,
                        'end_time'    => $now,
                        'item_type'   => $item_type,
                        'status'      => 'completed',
                        'graduation'  => 'passed',
                        'parent_id'   => $parent_item_id ? $parent_item_id : 0,
                    )
                );
            }

            return array(
                'success' => true,
                'message' => 'Đã đồng bộ bài học hoàn thành vào WordPress LearnPress.',
            );
        },
        'permission_callback' => '__return_true',
    ) );

    // REST API: Đăng ký / Ghi danh khóa học LearnPress (Đồng bộ vào wp_learnpress_user_items)
    register_rest_route( 'custom/v1', '/enroll', array(
        'methods'  => 'POST',
        'callback' => function ( WP_REST_Request $request ) {
            global $wpdb;
            $user_id   = intval( $request->get_param( 'user_id' ) );
            $course_id = intval( $request->get_param( 'course_id' ) );

            if ( ! $user_id || ! $course_id ) {
                return new WP_Error( 'missing_params', 'Thiếu user_id hoặc course_id.', array( 'status' => 400 ) );
            }

            // Gọi hàm ghi danh chính thức của LearnPress nếu plugin active
            if ( function_exists( 'learn_press_user_enroll_course' ) ) {
                try {
                    $res = learn_press_user_enroll_course( $course_id, $user_id );
                    if ( $res ) {
                        return array( 'success' => true, 'isEnrolled' => true, 'message' => 'Đã đăng ký khóa học thành công.' );
                    }
                } catch ( Exception $e ) {
                    // Tiếp tục fallback bên dưới nếu hàm báo lỗi
                }
            }

            // Kiểm tra xem người dùng đã có ghi danh trong bảng wp_learnpress_user_items chưa
            $existing_id = $wpdb->get_var( $wpdb->prepare( "
                SELECT user_item_id FROM {$wpdb->prefix}learnpress_user_items
                WHERE user_id = %d AND item_id = %d AND item_type = 'lp_course'
                ORDER BY user_item_id DESC LIMIT 1
            ", $user_id, $course_id ) );

            $now = current_time( 'mysql' );

            if ( ! $existing_id ) {
                $wpdb->insert(
                    $wpdb->prefix . 'learnpress_user_items',
                    array(
                        'user_id'     => $user_id,
                        'item_id'     => $course_id,
                        'start_time'  => $now,
                        'end_time'    => '0000-00-00 00:00:00',
                        'item_type'   => 'lp_course',
                        'status'      => 'enrolled',
                        'graduation'  => 'in-progress',
                        'parent_id'   => 0,
                    )
                );
            } else {
                $wpdb->update(
                    $wpdb->prefix . 'learnpress_user_items',
                    array(
                        'status'     => 'enrolled',
                        'graduation' => 'in-progress',
                    ),
                    array( 'user_item_id' => $existing_id )
                );
            }

            return array(
                'success'    => true,
                'isEnrolled' => true,
                'message'    => 'Đã đồng bộ ghi danh khóa học vào WordPress LearnPress.',
            );
        },
        'permission_callback' => '__return_true',
    ) );

    // REST API: Xác nhận hoàn thành toàn bộ khóa học (Finish Course - LearnPress)
    register_rest_route( 'custom/v1', '/finish-course', array(
        'methods'  => 'POST',
        'callback' => function ( WP_REST_Request $request ) {
            global $wpdb;
            $raw_user   = $request->get_param( 'user_id' );
            $raw_course = $request->get_param( 'course_id' );

            $user_id   = intval( $raw_user );
            $course_id = intval( $raw_course );

            if ( ! $course_id && ! empty( $raw_course ) ) {
                $course_id = intval( $wpdb->get_var( $wpdb->prepare( "
                    SELECT ID FROM {$wpdb->posts}
                    WHERE post_name = %s AND post_type = 'lp_course'
                    LIMIT 1
                ", $raw_course ) ) );
            }

            if ( ! $user_id || ! $course_id ) {
                return new WP_Error( 'missing_params', 'Thiếu user_id hoặc course_id hợp lệ.', array( 'status' => 400 ) );
            }

            // Lấy điểm passing condition từ post_meta (_lp_passing_condition)
            $passing_condition = get_post_meta( $course_id, '_lp_passing_condition', true );
            $passing_grade     = ( ! empty( $passing_condition ) && intval( $passing_condition ) > 0 ) ? intval( $passing_condition ) : 80;

            // Đếm tổng số bài học và số bài đã hoàn thành
            $total_lessons = $wpdb->get_var( $wpdb->prepare( "
                SELECT COUNT( DISTINCT si.item_id )
                FROM {$wpdb->prefix}learnpress_section_items si
                INNER JOIN {$wpdb->posts} p ON p.ID = si.item_id
                WHERE si.section_id IN (
                    SELECT section_id FROM {$wpdb->prefix}learnpress_sections WHERE section_course_id = %d
                ) AND p.post_type IN ('lp_lesson', 'lp_quiz')
            ", $course_id ) );

            $user_item_id = $wpdb->get_var( $wpdb->prepare( "
                SELECT user_item_id FROM {$wpdb->prefix}learnpress_user_items
                WHERE user_id = %d AND item_id = %d AND item_type = 'lp_course'
                ORDER BY user_item_id DESC LIMIT 1
            ", $user_id, $course_id ) );

            $completed_lessons = 0;
            if ( $user_item_id ) {
                $completed_lessons = $wpdb->get_var( $wpdb->prepare( "
                    SELECT COUNT( DISTINCT item_id )
                    FROM {$wpdb->prefix}learnpress_user_items
                    WHERE user_id = %d AND parent_id = %d AND status = 'completed' AND item_type IN ('lp_lesson', 'lp_quiz')
                ", $user_id, $user_item_id ) );
            }

            $current_percent = ( $total_lessons > 0 ) ? round( ( $completed_lessons / $total_lessons ) * 100, 2 ) : 100;

            if ( $current_percent < $passing_grade ) {
                return new WP_Error( 'not_passed', sprintf( 'Bạn cần đạt tối thiểu %d%% để hoàn thành khóa học. Tiến trình hiện tại: %s%%.', $passing_grade, $current_percent ), array( 'status' => 400 ) );
            }

            // Gọi hàm chính thức của LearnPress nếu active
            if ( function_exists( 'learn_press_user_finish_course' ) ) {
                try {
                    learn_press_user_finish_course( $course_id, $user_id );
                } catch ( Exception $e ) {}
            }

            $now = current_time( 'mysql' );

            if ( $user_item_id ) {
                $wpdb->update(
                    $wpdb->prefix . 'learnpress_user_items',
                    array(
                        'status'     => 'finished',
                        'graduation' => 'passed',
                        'end_time'   => $now,
                    ),
                    array( 'user_item_id' => $user_item_id )
                );
            } else {
                $wpdb->insert(
                    $wpdb->prefix . 'learnpress_user_items',
                    array(
                        'user_id'     => $user_id,
                        'item_id'     => $course_id,
                        'start_time'  => $now,
                        'end_time'    => $now,
                        'item_type'   => 'lp_course',
                        'status'      => 'finished',
                        'graduation'  => 'passed',
                        'parent_id'   => 0,
                    )
                );
            }

            return array(
                'success'         => true,
                'status'          => 'finished',
                'graduation'      => 'passed',
                'progressPercent' => $current_percent,
                'message'         => 'Chúc mừng! Bạn đã hoàn thành xuất sắc khóa học.',
            );
        },
        'permission_callback' => '__return_true',
    ) );
} );

// Shortcode kiểm tra tất cả Meta Keys của Bài viết / Post Type: [inspect_post_meta]
add_shortcode( 'inspect_post_meta', function( $atts ) {
    if ( ! current_user_can( 'manage_options' ) && ! is_admin() ) {
        return '<div style="padding: 12px 16px; background: #fff3cd; color: #856404; border: 1px solid #ffeeba; border-radius: 6px; font-family: sans-serif;">⚠️ Bạn cần đăng nhập tài khoản Quản trị (Admin) để sử dụng công cụ này.</div>';
    }

    $atts = shortcode_atts( array(
        'post_id' => 0,
    ), $atts );

    $selected_post_id = intval( $atts['post_id'] );
    if ( isset( $_GET['inspect_post_id'] ) && intval( $_GET['inspect_post_id'] ) > 0 ) {
        $selected_post_id = intval( $_GET['inspect_post_id'] );
    }

    $selected_post_type = isset( $_GET['inspect_post_type'] ) ? sanitize_text_field( $_GET['inspect_post_type'] ) : 'lp_course';

    // Lấy danh sách tất cả Post Types công khai và Custom Post Types
    $post_types = get_post_types( array( 'public' => true ), 'objects' );

    // Lấy danh sách bài viết theo post_type được chọn
    $posts = get_posts( array(
        'post_type'      => $selected_post_type,
        'posts_per_page' => 150,
        'post_status'    => array( 'publish', 'draft', 'pending', 'private' ),
        'orderby'        => 'title',
        'order'          => 'ASC',
    ) );

    ob_start();
    ?>
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0f172a; font-size: 20px; font-weight: 700; border-bottom: 2px solid #2563eb; padding-bottom: 10px; display: flex; align-items: center; gap: 8px;">
            🔍 Công cụ kiểm tra Meta Key bài viết (Post Meta Inspector)
        </h3>

        <!-- Form Chọn Post Type và Bài viết -->
        <form method="GET" action="" style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; background: #f8fafc; padding: 16px; border-radius: 8px; align-items: flex-end;">
            <?php foreach ( $_GET as $k => $v ) : ?>
                <?php if ( ! in_array( $k, array( 'inspect_post_type', 'inspect_post_id' ), true ) && is_string( $v ) ) : ?>
                    <input type="hidden" name="<?php echo esc_attr( $k ); ?>" value="<?php echo esc_attr( $v ); ?>" />
                <?php endif; ?>
            <?php endforeach; ?>

            <div style="flex: 1; min-width: 200px;">
                <label style="display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px;">1. Chọn Loại bài viết (Post Type):</label>
                <select name="inspect_post_type" onchange="this.form.submit()" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; font-size: 14px; color: #0f172a;">
                    <?php foreach ( $post_types as $pt_slug => $pt_obj ) : ?>
                        <option value="<?php echo esc_attr( $pt_slug ); ?>" <?php selected( $selected_post_type, $pt_slug ); ?>>
                            <?php echo esc_html( $pt_obj->labels->singular_name . ' (' . $pt_slug . ')' ); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div style="flex: 2; min-width: 280px;">
                <label style="display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px;">2. Chọn Bài viết cụ thể:</label>
                <select name="inspect_post_id" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; font-size: 14px; color: #0f172a;">
                    <option value="">-- Chọn bài viết --</option>
                    <?php foreach ( $posts as $p ) : ?>
                        <option value="<?php echo intval( $p->ID ); ?>" <?php selected( $selected_post_id, $p->ID ); ?>>
                            [ID: <?php echo $p->ID; ?>] <?php echo esc_html( $p->post_title ); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div>
                <button type="submit" style="background: #2563eb; color: #ffffff; padding: 9px 20px; border: none; border-radius: 6px; font-weight: 600; font-size: 14px; cursor: pointer; transition: background 0.2s;">
                    🚀 Xem Meta Keys
                </button>
            </div>
        </form>

        <!-- Kết quả hiển thị Meta Keys -->
        <?php if ( $selected_post_id > 0 ) : ?>
            <?php
            $target_post = get_post( $selected_post_id );
            $meta_data   = get_post_meta( $selected_post_id );
            ?>
            <?php if ( $target_post ) : ?>
                <div style="margin-bottom: 16px; padding: 14px 18px; background: #eff6ff; border-left: 4px solid #2563eb; border-radius: 6px;">
                    <h4 style="margin: 0 0 6px 0; color: #1e3a8a; font-size: 16px; font-weight: 700;">
                        📌 Bài viết: <?php echo esc_html( $target_post->post_title ); ?>
                    </h4>
                    <span style="font-size: 13px; color: #1d4ed8;">
                        ID: <strong><?php echo $target_post->ID; ?></strong> | Slug: <code><?php echo esc_html( $target_post->post_name ); ?></code> | Post Type: <code><?php echo esc_html( $target_post->post_type ); ?></code> | Tổng số Meta Keys: <strong><?php echo count( $meta_data ); ?></strong>
                    </span>
                </div>

                <?php if ( ! empty( $meta_data ) ) : ?>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                            <thead>
                                <tr style="background: #f1f5f9; color: #334155; border-bottom: 2px solid #cbd5e1;">
                                    <th style="padding: 10px; width: 50px;">STT</th>
                                    <th style="padding: 10px; width: 280px;">Meta Key (Tên trường)</th>
                                    <th style="padding: 10px;">Meta Value (Giá trị)</th>
                                    <th style="padding: 10px; width: 110px;">Kiểu dữ liệu</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php $idx = 1; foreach ( $meta_data as $key => $values ) : ?>
                                    <?php
                                    $raw_value = count( $values ) === 1 ? $values[0] : $values;
                                    $unserialized = @maybe_unserialize( $raw_value );
                                    $type_label = gettype( $unserialized );

                                    if ( is_array( $unserialized ) ) {
                                        $display_value = '<pre style="margin: 0; padding: 10px; background: #0f172a; color: #38bdf8; border-radius: 6px; max-height: 220px; overflow: auto; font-size: 12px;">' . esc_html( print_r( $unserialized, true ) ) . '</pre>';
                                        $type_label = 'Array (' . count( $unserialized ) . ')';
                                    } elseif ( is_object( $unserialized ) ) {
                                        $display_value = '<pre style="margin: 0; padding: 10px; background: #0f172a; color: #38bdf8; border-radius: 6px; max-height: 220px; overflow: auto; font-size: 12px;">' . esc_html( print_r( $unserialized, true ) ) . '</pre>';
                                        $type_label = 'Object';
                                    } else {
                                        $display_value = '<code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; color: #0f172a; word-break: break-all;">' . esc_html( strval( $raw_value ) ) . '</code>';
                                    }
                                    ?>
                                    <tr style="border-bottom: 1px solid #e2e8f0; background: <?php echo $idx % 2 === 0 ? '#fafafa' : '#ffffff'; ?>;">
                                        <td style="padding: 10px; color: #94a3b8; font-weight: bold;"><?php echo $idx++; ?></td>
                                        <td style="padding: 10px; font-weight: 600; color: #0f172a;">
                                            <span style="color: <?php echo strpos( $key, '_' ) === 0 ? '#475569' : '#0284c7'; ?>;">
                                                <?php echo esc_html( $key ); ?>
                                            </span>
                                        </td>
                                        <td style="padding: 10px;"><?php echo $display_value; ?></td>
                                        <td style="padding: 10px;"><span style="background: #e0f2fe; color: #0369a1; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-block;"><?php echo esc_html( $type_label ); ?></span></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php else : ?>
                    <p style="color: #64748b;">Bài viết này chưa có dữ liệu Meta key nào.</p>
                <?php endif; ?>
            <?php else : ?>
                <p style="color: #ef4444;">Không tìm thấy bài viết ID: <?php echo $selected_post_id; ?></p>
            <?php endif; ?>
        <?php else : ?>
            <p style="color: #64748b; font-style: italic; margin: 0;">Vui lòng chọn <strong>Loại bài viết</strong> và <strong>Bài viết cụ thể</strong> ở danh sách trên, sau đó bấm <strong>Xem Meta Keys</strong>.</p>
        <?php endif; ?>
    </div>
    <?php
    return ob_get_clean();
} );


