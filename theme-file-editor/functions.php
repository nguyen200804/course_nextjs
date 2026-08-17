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

    // Passing grade của quiz (không gán mặc định)
    $pg = get_post_meta( $item_id, '_lp_passing_grade', true );
    if ( $pg === '' || $pg === null ) {
        $pg = get_post_meta( $item_id, '_lp_passing_condition', true );
    }
    $item['passing_grade'] = ( $pg !== '' && $pg !== null ) ? $pg : '';
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
} );

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

// Đăng ký các custom REST API route
add_action( 'rest_api_init', function() {
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

	// REST API Custom Endpoint: Lấy và Đăng comment bài học LearnPress
	register_rest_route( 'custom/v1', '/lesson-comments', array(
		array(
			'methods'  => 'GET',
			'callback' => function ( WP_REST_Request $request ) {
				global $wpdb;
				$lesson_id = intval( $request->get_param( 'lesson_id' ) );
				if ( ! $lesson_id ) {
					return array( 'success' => false, 'comments' => array() );
				}
				$comments = $wpdb->get_results( $wpdb->prepare( "
				SELECT comment_ID as id, comment_author as author, comment_author_email as author_email, comment_content as content, comment_date as date, user_id, comment_approved as approved
				FROM {$wpdb->comments}
				WHERE comment_post_ID = %d AND (comment_approved = '1' OR comment_approved = '0')
				ORDER BY comment_date DESC
			", $lesson_id ) );

				$result = array();
				foreach ( $comments as $cm ) {
					$avatar = get_avatar_url( $cm->author_email, array( 'size' => 96 ) );
					if ( ! $avatar ) {
						$avatar = 'https://secure.gravatar.com/avatar/?s=96&d=mm&r=g';
					}
					$result[] = array(
						'id' => intval( $cm->id ),
						'author' => $cm->author ? $cm->author : 'Student',
						'avatar' => $avatar,
						'date' => date( 'F j, Y \a\t g:i a', strtotime( $cm->date ) ),
						'content' => $cm->content,
						'awaitingModeration' => $cm->approved === '0',
					);
				}

				return array( 'success' => true, 'comments' => $result );
			},
			'permission_callback' => '__return_true',
		),
		array(
			'methods'  => 'POST',
			'callback' => function ( WP_REST_Request $request ) {
				$params = $request->get_json_params();
				$lesson_id = intval( isset( $params['lesson_id'] ) ? $params['lesson_id'] : $request->get_param( 'lesson_id' ) );
				$content = sanitize_textarea_field( isset( $params['content'] ) ? $params['content'] : $request->get_param( 'content' ) );
				$user_id = intval( isset( $params['user_id'] ) ? $params['user_id'] : $request->get_param( 'user_id' ) );

				if ( ! $lesson_id || empty( $content ) ) {
					return new WP_Error( 'invalid_data', 'Dữ liệu không hợp lệ.', array( 'status' => 400 ) );
				}

				$user = get_userdata( $user_id );
				$author_name = $user ? $user->display_name : 'Student';
				$author_email = $user ? $user->user_email : '';

				$commentdata = array(
					'comment_post_ID'      => $lesson_id,
					'comment_author'       => $author_name,
					'comment_author_email' => $author_email,
					'comment_content'      => $content,
					'comment_type'         => 'comment',
					'user_id'              => $user_id,
					'comment_approved'     => 1,
				);

				$comment_id = wp_insert_comment( $commentdata );

				if ( $comment_id ) {
					$avatar = get_avatar_url( $author_email, array( 'size' => 96 ) );
					return array(
						'success' => true,
						'comment' => array(
							'id' => $comment_id,
							'author' => $author_name,
							'avatar' => $avatar ? $avatar : 'https://secure.gravatar.com/avatar/?s=96&d=mm&r=g',
							'date' => date( 'F j, Y \a\t g:i a' ),
							'content' => $content,
							'awaitingModeration' => false,
						)
					);
				}

				return new WP_Error( 'insert_failed', 'Không thể gửi bình luận.', array( 'status' => 500 ) );
			},
			'permission_callback' => '__return_true',
		),
	) );



	// REST API Custom Endpoint: Đánh dấu hoàn thành bài học / Quiz và lưu lượt làm bài vào LearnPress DB
	register_rest_route( 'custom/v1', '/mark-complete', array(
		'methods'  => 'POST',
		'callback' => function ( WP_REST_Request $request ) {
			global $wpdb;
			$user_id    = intval( $request->get_param( 'user_id' ) );
			$course_id  = intval( $request->get_param( 'course_id' ) );
			$post_param = $request->get_param( 'post_id' );
			if ( ! $post_param ) {
				$post_param = $request->get_param( 'lesson_id' );
			}

			if ( ! $user_id || ! $post_param ) {
				return new WP_Error( 'missing_params', 'user_id và post_id/lesson_id là bắt buộc', array( 'status' => 400 ) );
			}

			$item_id = intval( $post_param );
			if ( $item_id === 0 || ! is_numeric( $post_param ) ) {
				$slug_clean = sanitize_title( $post_param );
				$found_id   = $wpdb->get_var( $wpdb->prepare(
					"SELECT ID FROM {$wpdb->posts} WHERE post_name = %s AND post_type IN ('lp_quiz', 'lp_lesson') ORDER BY ID DESC LIMIT 1",
					$slug_clean
				) );
				if ( $found_id ) {
					$item_id = intval( $found_id );
				}
			}

			if ( ! $item_id ) {
				return new WP_Error( 'item_not_found', 'Không tìm thấy bài học hoặc quiz', array( 'status' => 404 ) );
			}

			$post_type = get_post_type( $item_id );
			if ( ! $post_type ) {
				$post_type = 'lp_quiz';
			}

			$table_items    = $wpdb->prefix . 'learnpress_user_items';
			$table_itemmeta = $wpdb->prefix . 'learnpress_user_itemmeta';

			$quiz_score = $request->get_param( 'quiz_score' );

			if ( $post_type === 'lp_quiz' || $quiz_score !== null ) {
				$score_num  = floatval( $quiz_score );
				$graduation = $score_num >= 80 ? 'passed' : 'failed';
				$now        = current_time( 'mysql' );

				// Chèn lượt làm bài mới vào wp_learnpress_user_items
				$wpdb->insert(
					$table_items,
					array(
						'user_id'    => $user_id,
						'item_id'    => $item_id,
						'start_time' => $now,
						'end_time'   => $now,
						'item_type'  => 'lp_quiz',
						'status'     => 'completed',
						'graduation' => $graduation,
						'ref_id'     => $course_id ? $course_id : 0,
						'ref_type'   => 'lp_course',
						'parent_id'  => 0,
					),
					array( '%d', '%d', '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%d' )
				);

				$user_item_id = $wpdb->insert_id;

				if ( $user_item_id ) {
					// Đếm số câu hỏi trong bài quiz
					$table_qq = $wpdb->prefix . 'learnpress_quiz_questions';
					$q_count  = 2;
					if ( $wpdb->get_var( "SHOW TABLES LIKE '{$table_qq}'" ) === $table_qq ) {
						$cnt = intval( $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$table_qq} WHERE quiz_id = %d", $item_id ) ) );
						if ( $cnt > 0 ) $q_count = $cnt;
					}

					$correct_count = round( ( $score_num / 100 ) * $q_count );
					$wrong_count   = max( 0, $q_count - $correct_count );

					$results_meta = array(
						'result'           => $score_num,
						'passing_grade'    => '80%',
						'question_count'   => $q_count,
						'question_correct' => $correct_count,
						'question_wrong'   => $wrong_count,
						'question_empty'   => 0,
						'user_mark'        => $correct_count,
						'mark'             => $q_count,
						'status'           => 'completed',
					);

					$wpdb->insert(
						$table_itemmeta,
						array(
							'learnpress_user_item_id' => $user_item_id,
							'meta_key'                => 'results',
							'meta_value'              => serialize( $results_meta ),
						),
						array( '%d', '%s', '%s' )
					);
				}
			} else {
				// Bài học thông thường
				$now = current_time( 'mysql' );
				$existing = $wpdb->get_var( $wpdb->prepare(
					"SELECT user_item_id FROM {$table_items} WHERE user_id = %d AND item_id = %d AND item_type = 'lp_lesson'",
					$user_id, $item_id
				) );

				if ( $existing ) {
					$wpdb->update(
						$table_items,
						array( 'status' => 'completed', 'graduation' => 'passed', 'end_time' => $now ),
						array( 'user_item_id' => $existing ),
						array( '%s', '%s', '%s' ),
						array( '%d' )
					);
				} else {
					$wpdb->insert(
						$table_items,
						array(
							'user_id'    => $user_id,
							'item_id'    => $item_id,
							'start_time' => $now,
							'end_time'   => $now,
							'item_type'  => 'lp_lesson',
							'status'     => 'completed',
							'graduation' => 'passed',
							'ref_id'     => $course_id ? $course_id : 0,
							'ref_type'   => 'lp_course',
							'parent_id'  => 0,
						),
						array( '%d', '%d', '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%d' )
					);
				}
			}

			return rest_ensure_response( array(
				'success' => true,
				'message' => 'Lưu tiến trình thành công',
			) );
		},
		'permission_callback' => '__return_true',
	) );

	// Đăng ký trường questions_count cho REST API bài viết lp_quiz
	register_rest_field( 'lp_quiz', 'questions_count', array(
		'get_callback' => function( $object ) {
			global $wpdb;
			$quiz_id  = intval( $object['id'] );
			$table_qq = $wpdb->prefix . 'learnpress_quiz_questions';
			if ( $wpdb->get_var( "SHOW TABLES LIKE '{$table_qq}'" ) === $table_qq ) {
				$count = intval( $wpdb->get_var( $wpdb->prepare(
					"SELECT COUNT(*) FROM {$table_qq} WHERE quiz_id = %d",
					$quiz_id
				) ) );
				if ( $count > 0 ) {
					return $count . ( $count === 1 ? ' question' : ' questions' );
				}
			}
			$raw_meta = get_post_meta( $quiz_id, '_lp_quiz_questions', true );
			if ( is_array( $raw_meta ) && count( $raw_meta ) > 0 ) {
				return count( $raw_meta ) . ( count( $raw_meta ) === 1 ? ' question' : ' questions' );
			}
			return '1 question';
		},
		'update_callback' => null,
		'schema'          => null,
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

						$status = 'enrolled';
						if ( $graduation === 'passed' || $status_raw === 'passed' ) {
							$status = 'passed';
						} elseif ( $graduation === 'failed' || $status_raw === 'failed' ) {
							$status = 'failed';
						} elseif ( $status_raw === 'completed' || $status_raw === 'finished' || $graduation === 'completed' ) {
							$status = 'finished';
						} elseif ( $graduation === 'in-progress' || $status_raw === 'in-progress' ) {
							$status = 'in-progress';
						} else {
							$status = 'enrolled';
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

						if ($status === 'enrolled' && $result_val > 0) {
							$status = 'in-progress';
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

			$avatar_url = get_avatar_url( $user_id, array( 'size' => 300 ) );

			return array(
				'id'           => $user->ID,
				'first_name'   => get_user_meta( $user_id, 'first_name', true ),
				'last_name'    => get_user_meta( $user_id, 'last_name', true ),
				'display_name' => $user->display_name,
				'email'        => $user->user_email,
				'bio'          => get_user_meta( $user_id, 'description', true ),
				'avatar_url'   => $avatar_url,
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
			$bio          = sanitize_textarea_field( $request->get_param( 'bio' ) );
			if ( empty( $bio ) ) {
				$bio = sanitize_textarea_field( $request->get_param( 'description' ) );
			}
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
				'description'  => $bio,
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
		'methods'             => 'GET',
		'callback'            => 'handle_get_custom_course_progress',
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


/* ==========================================================================
LearnPress (lp_course) & WooCommerce (product) Sync for Next.js
========================================================================== */

if (!defined('NEXTJS_FRONTEND_URL')) {
	define('NEXTJS_FRONTEND_URL', 'http://localhost:3000');
}

/**
 * 1. Tự động Tạo / Cập nhật Sản phẩm WooCommerce khi Khóa học LearnPress được Lưu
 */
add_action('save_post_lp_course', 'sync_learnpress_course_to_woocommerce_product', 10, 3);
function sync_learnpress_course_to_woocommerce_product($post_id, $post, $update) {
	if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
	if (wp_is_post_revision($post_id)) return;
	if (!current_user_can('edit_post', $post_id)) return;

	$price = get_post_meta($post_id, '_lp_price', true);
	$sale_price = get_post_meta($post_id, '_lp_sale_price', true);
	if ($price === '') $price = '0';

	$product_id = get_post_meta($post_id, '_linked_woocommerce_product_id', true);

	if ($product_id && get_post_type($product_id) === 'product') {
		wp_update_post([
			'ID'          => $product_id,
			'post_title'  => $post->post_title,
			'post_status' => $post->post_status,
		]);
	} else {
		$product_id = wp_insert_post([
			'post_title'   => $post->post_title,
			'post_content' => $post->post_excerpt ?: $post->post_content,
			'post_status'  => 'publish',
			'post_type'    => 'product',
		]);

		if (!is_wp_error($product_id)) {
			update_post_meta($product_id, '_virtual', 'yes');
			update_post_meta($product_id, '_downloadable', 'no');
			update_post_meta($product_id, '_visibility', 'visible');
			wp_set_object_terms($product_id, 'simple', 'product_type');

			update_post_meta($post_id, '_linked_woocommerce_product_id', $product_id);
			update_post_meta($product_id, '_linked_course_id', $post_id);
		}
	}

	if ($product_id && !is_wp_error($product_id)) {
		update_post_meta($product_id, '_price', $sale_price ?: $price);
		update_post_meta($product_id, '_regular_price', $price);
		if ($sale_price) {
			update_post_meta($product_id, '_sale_price', $sale_price);
		} else {
			delete_post_meta($product_id, '_sale_price');
		}
	}
}

/**
 * 2. Tạo Custom REST API Endpoint: POST /wp-json/custom/v1/add-to-cart
 */
add_action('rest_api_init', function () {
	register_rest_route('custom/v1', '/add-to-cart', [
		'methods'  => 'POST',
		'callback' => 'handle_custom_add_to_cart_rest',
		'permission_callback' => '__return_true',
	]);
});

function handle_custom_add_to_cart_rest($request) {
	$params = $request->get_json_params();
	$course_id = isset($params['course_id']) ? intval($params['course_id']) : 0;

	if (!$course_id) {
		return new WP_Error('missing_param', 'Course ID is required', ['status' => 400]);
	}

	$product_id = get_post_meta($course_id, '_linked_woocommerce_product_id', true);

	if (!$product_id) {
		global $wpdb;
		$product_id = $wpdb->get_var($wpdb->prepare(
			"SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_linked_course_id' AND meta_value = %d LIMIT 1",
			$course_id
		));
	}

	if ($product_id && function_exists('WC') && WC()->cart) {
		WC()->cart->add_to_cart($product_id, 1);
	}

	return rest_ensure_response([
		'success'      => true,
		'course_id'    => $course_id,
		'product_id'   => $product_id ?: null,
		'checkout_url' => NEXTJS_FRONTEND_URL . '/checkout?course_id=' . $course_id . ($product_id ? '&product_id=' . $product_id : ''),
	]);
}

/**
 * 3. Tự động Đăng ký (Enroll) Học viên khi Đơn hàng WooCommerce Thành công
 */
add_action('woocommerce_order_status_completed', 'auto_enroll_learnpress_course_on_order', 10, 1);
add_action('woocommerce_order_status_processing', 'auto_enroll_learnpress_course_on_order', 10, 1);
function auto_enroll_learnpress_course_on_order($order_id) {
	$order = wc_get_order($order_id);
	if (!$order) return;

	$user_id = $order->get_user_id();
	if (!$user_id) return;

	foreach ($order->get_items() as $item) {
		$product_id = $item->get_product_id();
		$course_id = get_post_meta($product_id, '_linked_course_id', true);

		if ($course_id) {
			if (function_exists('learn_press_user_enroll_course')) {
				learn_press_user_enroll_course($course_id, $user_id);
			}
		}
	}
}

/**
 * 4. Custom REST API Endpoint: GET /wp-json/custom/v1/checkout-fields
 * Gọi trực tiếp hàm gốc WC()->checkout()->get_checkout_fields() có áp dụng hook filter 'woocommerce_checkout_fields'
 */
add_action('rest_api_init', function () {
	register_rest_route('custom/v1', '/checkout-fields', [
		'methods'  => 'GET',
		'callback' => 'handle_get_woocommerce_native_checkout_fields',
		'permission_callback' => '__return_true',
	]);
});

function handle_get_woocommerce_native_checkout_fields() {
	if (!function_exists('WC') || !WC()->checkout()) {
		return new WP_Error('wc_not_active', 'WooCommerce is not active', ['status' => 500]);
	}

	// Gọi chính xác hàm gốc WooCommerce để lấy Billing, Shipping, và Additional (order_comments)
	$checkout_fields = WC()->checkout()->get_checkout_fields();

	$currency_code   = function_exists('get_woocommerce_currency') ? get_woocommerce_currency() : 'USD';
	$currency_symbol = function_exists('get_woocommerce_currency_symbol') ? get_woocommerce_currency_symbol() : '$';
	$currency_pos    = get_option('woocommerce_currency_pos', 'left');

	return rest_ensure_response([
		'billing'         => isset($checkout_fields['billing']) ? $checkout_fields['billing'] : [],
		'shipping'        => isset($checkout_fields['shipping']) ? $checkout_fields['shipping'] : [],
		'additional'      => isset($checkout_fields['additional']) ? $checkout_fields['additional'] : [],
		'currency'        => $currency_code,
		'currency_symbol' => $currency_symbol,
		'currency_pos'    => $currency_pos,
	]);
}

/**
 * 5. Tự động gắn _created_via = "checkout" và Origin mặc định nếu chưa có
 */
add_action('woocommerce_new_order', 'set_nextjs_order_origin_direct', 10, 2);
function set_nextjs_order_origin_direct($order_id, $order = null) {
	if (!$order_id) return;

	if (!get_post_meta($order_id, '_created_via', true)) {
		update_post_meta($order_id, '_created_via', 'checkout');
	}
	if (!get_post_meta($order_id, '_wc_order_attribution_source_type', true)) {
		update_post_meta($order_id, '_wc_order_attribution_source_type', 'typein');
	}
	if (!get_post_meta($order_id, '_wc_order_attribution_origin', true)) {
		update_post_meta($order_id, '_wc_order_attribution_origin', 'Direct');
	}
}

/**
 * 6. Simplified Course Wishlist REST API (Sync WordPress <-> NextJS using user_meta)
 */
add_action('rest_api_init', function () {
	// GET /wp-json/custom/v1/wishlist?user_id=123
	register_rest_route('custom/v1', '/wishlist', [
		'methods'  => 'GET',
		'callback' => 'handle_get_user_wishlist',
		'permission_callback' => '__return_true',
	]);

	// POST /wp-json/custom/v1/toggle-wishlist
	register_rest_route('custom/v1', '/toggle-wishlist', [
		'methods'  => 'POST',
		'callback' => 'handle_toggle_user_wishlist',
		'permission_callback' => '__return_true',
	]);
});

function handle_get_user_wishlist($request) {
	$user_id = intval($request->get_param('user_id'));
	if (!$user_id) {
		return new WP_Error('missing_user_id', 'User ID is required', ['status' => 400]);
	}

	$wishlist = get_user_meta($user_id, '_user_wishlist_courses', true);
	if (!is_array($wishlist)) {
		$wishlist = [];
	}

	$wishlist_ids = array_values(array_unique(array_map('intval', array_filter($wishlist))));

	return rest_ensure_response([
		'user_id'  => $user_id,
		'wishlist' => $wishlist_ids,
	]);
}

function handle_toggle_user_wishlist($request) {
	$body = $request->get_json_params();
	$user_id = intval(isset($body['user_id']) ? $body['user_id'] : $request->get_param('user_id'));
	$course_id = intval(isset($body['course_id']) ? $body['course_id'] : $request->get_param('course_id'));

	if (!$user_id || !$course_id) {
		return new WP_Error('invalid_params', 'user_id and course_id are required', ['status' => 400]);
	}

	$wishlist = get_user_meta($user_id, '_user_wishlist_courses', true);
	if (!is_array($wishlist)) {
		$wishlist = [];
	}

	$wishlist = array_values(array_unique(array_map('intval', array_filter($wishlist))));

	$in_wishlist = false;
	if (in_array($course_id, $wishlist, true)) {
		$wishlist = array_values(array_diff($wishlist, [$course_id]));
		$in_wishlist = false;
	} else {
		$wishlist[] = $course_id;
		$in_wishlist = true;
	}

	$wishlist = array_values(array_unique($wishlist));

	// Save array of lp_course IDs directly to user_meta
	update_user_meta($user_id, '_user_wishlist_courses', $wishlist);

	return rest_ensure_response([
		'success'     => true,
		'user_id'     => $user_id,
		'course_id'   => $course_id,
		'in_wishlist' => $in_wishlist,
		'wishlist'    => $wishlist,
	]);
}

/**
 * 7. LearnPress Quiz & Lesson Completion Sync REST API (Next.js <-> WordPress)
 */
add_action('rest_api_init', function () {
	// POST /wp-json/custom/v1/mark-complete
	register_rest_route('custom/v1', '/mark-complete', [
		'methods'             => 'POST',
		'callback'            => 'handle_custom_mark_complete',
		'permission_callback' => '__return_true',
	]);

	// GET /wp-json/custom/v1/course-progress
	register_rest_route('custom/v1', '/course-progress', [
		'methods'             => 'GET',
		'callback'            => 'handle_get_custom_course_progress',
		'permission_callback' => '__return_true',
	]);

	// POST /wp-json/custom/v1/upload-avatar
	register_rest_route('custom/v1', '/upload-avatar', [
		'methods'             => 'POST',
		'callback'            => 'handle_custom_upload_avatar',
		'permission_callback' => '__return_true',
	]);

	// POST /wp-json/custom/v1/repurchase-course
	register_rest_route('custom/v1', '/repurchase-course', [
		'methods'             => 'POST',
		'callback'            => 'handle_custom_repurchase_course',
		'permission_callback' => '__return_true',
	]);

	// POST /wp-json/custom/v1/finish-quiz
	register_rest_route('custom/v1', '/finish-quiz', [
		'methods'             => 'POST',
		'callback'            => 'handle_submit_quiz_result',
		'permission_callback' => '__return_true',
	]);

	// POST /wp-json/custom/v1/retake-quiz
	register_rest_route('custom/v1', '/retake-quiz', [
		'methods'             => 'POST',
		'callback'            => 'handle_custom_retake_quiz',
		'permission_callback' => '__return_true',
	]);

	// GET /wp-json/custom/v1/quiz-attempts?user_id=123&quiz_id=7912
	register_rest_route('custom/v1', '/quiz-attempts', [
		'methods'             => 'GET',
		'callback'            => 'handle_get_custom_quiz_attempts',
		'permission_callback' => '__return_true',
	]);

	// GET /wp-json/custom/v1/quiz-questions?quiz_id=7912
	register_rest_route('custom/v1', '/quiz-questions', [
		'methods'             => 'GET',
		'callback'            => 'handle_get_custom_quiz_questions',
		'permission_callback' => '__return_true',
	]);
});

function handle_get_custom_quiz_questions($request) {
	try {
		global $wpdb;
		$quiz_param = $request->get_param('quiz_id');
		if (!$quiz_param) {
			$quiz_param = $request->get_param('slug');
		}
		if (!$quiz_param) {
			return rest_ensure_response(['success' => false, 'message' => 'Missing quiz_id or slug', 'questions' => [], 'count' => 0]);
		}

		// Debug mode: quiz_id=debug_QNUMBER → dump post_meta & LearnPress native question object
		if (strpos($quiz_param, 'debug_') === 0) {
			$debug_qid = intval(str_replace('debug_', '', $quiz_param));
			$all_meta  = get_post_meta($debug_qid);

			$table_qa = $wpdb->prefix . 'learnpress_question_answers';
			$table_qa_exists = $wpdb->get_var("SHOW TABLES LIKE '{$table_qa}'") === $table_qa;
			$sample_qa_rows = [];
			if ($table_qa_exists) {
				$sample_qa_rows = $wpdb->get_results("SELECT * FROM {$table_qa} ORDER BY question_answer_id DESC LIMIT 20", ARRAY_A);
			}

			$all_pm_rows = $wpdb->get_results($wpdb->prepare("SELECT meta_id, meta_key, meta_value FROM {$wpdb->postmeta} WHERE post_id = %d", $debug_qid), ARRAY_A);
			foreach ($all_pm_rows as &$pm) {
				$pm['unserialized'] = maybe_unserialize($pm['meta_value']);
			}

			return rest_ensure_response([
				'debug_qid'      => $debug_qid,
				'post_meta'      => $all_meta,
				'all_postmeta'   => $all_pm_rows,
				'sample_qa_rows' => $sample_qa_rows,
			]);
		}

		$quiz_id = intval($quiz_param);
		if ($quiz_id === 0 || !is_numeric($quiz_param)) {
			$slug_clean = sanitize_title($quiz_param);
			$quiz_id = intval($wpdb->get_var($wpdb->prepare(
				"SELECT ID FROM {$wpdb->posts} WHERE post_name = %s AND post_type IN ('lp_quiz', 'lp_lesson') ORDER BY ID DESC LIMIT 1",
				$slug_clean
			)));
		}

		if (!$quiz_id) {
			return rest_ensure_response(['success' => false, 'questions' => [], 'count' => 0]);
		}

		$table_qq  = $wpdb->prefix . 'learnpress_quiz_questions';
		$table_qa  = $wpdb->prefix . 'learnpress_question_answers';
		$questions = [];

		if ($wpdb->get_var("SHOW TABLES LIKE '{$table_qq}'") === $table_qq) {
			$q_rows = $wpdb->get_results($wpdb->prepare(
				"SELECT question_id, question_order FROM {$table_qq} WHERE quiz_id = %d ORDER BY question_order ASC",
				$quiz_id
			));

			if (!empty($q_rows)) {
				foreach ($q_rows as $idx => $q_row) {
					$qid  = intval($q_row->question_id);
					$post = get_post($qid);
					if (!$post) continue;

					$q_type = get_post_meta($qid, '_lp_type', true);
					if (!$q_type) $q_type = 'single_choice';

					$options         = [];
					$correct_indices = [];

					// --- 1. THỬ NATIVE LEARNPRESS API HÀM GỐC ---
					if (function_exists('learn_press_get_question')) {
						try {
							$lp_q_obj = learn_press_get_question($qid);
							if ($lp_q_obj && method_exists($lp_q_obj, 'get_answers')) {
								$lp_answers_obj = $lp_q_obj->get_answers();
								if (!empty($lp_answers_obj)) {
									foreach ((array)$lp_answers_obj as $ans_item) {
										$a_arr = (array)$ans_item;
										$title_val = isset($a_arr['title']) ? $a_arr['title']
											: (isset($a_arr['text']) ? $a_arr['text']
											   : (isset($a_arr['value']) ? $a_arr['value']
												  : (isset($a_arr['label']) ? $a_arr['label'] : '')));
										$is_tr = isset($a_arr['is_true']) ? $a_arr['is_true']
											: (isset($a_arr['correct']) ? $a_arr['correct'] : false);

										$title_val = html_entity_decode(wp_strip_all_tags(strval($title_val)), ENT_QUOTES | ENT_HTML5, 'UTF-8');
										if ($title_val !== '') {
											$options[] = $title_val;
											if ($is_tr === 'yes' || $is_tr === '1' || $is_tr === 1 || $is_tr === true || $is_tr === 'true') {
												$correct_indices[] = count($options) - 1;
											}
										}
									}
								}
							}
						} catch (Exception $e) {}
					}

					// --- 2. ĐỌC ĐÁP ÁN TỪ BẢNG learnpress_question_answers ---
					if (empty($options)) {
						$table_qa_exists = $wpdb->get_var("SHOW TABLES LIKE '{$table_qa}'") === $table_qa;
						if ($table_qa_exists) {
							$answers = $wpdb->get_results($wpdb->prepare(
								"SELECT * FROM {$table_qa} WHERE question_id = %d ORDER BY question_answer_id ASC",
								$qid
							));

							if (!empty($answers)) {
								foreach ($answers as $a_idx => $ans) {
									$ans_title   = '';
									$ans_is_true = false;

									if (isset($ans->is_true) && ($ans->is_true === 'yes' || $ans->is_true === '1' || $ans->is_true === 1 || $ans->is_true === true || $ans->is_true === 'true')) {
										$ans_is_true = true;
									}

									// 1. Đọc trực tiếp từ cột title của bảng learnpress_question_answers
									if (isset($ans->title) && !empty($ans->title)) {
										$ans_title = $ans->title;
									}

									// 2. Nếu title rỗng, thử giải nén từ cột answer_data
									if (empty($ans_title) && isset($ans->answer_data) && !empty($ans->answer_data)) {
										$a_data = maybe_unserialize($ans->answer_data);
										if (is_string($a_data) && (strpos($a_data, '{') === 0 || strpos($a_data, '[') === 0)) {
											$a_data = json_decode($a_data, true);
										}
										if (is_array($a_data) || is_object($a_data)) {
											$a_data = (array)$a_data;
											if (isset($a_data['title']) && !empty($a_data['title'])) {
												$ans_title = $a_data['title'];
											} elseif (isset($a_data['value']) && !empty($a_data['value'])) {
												$ans_title = $a_data['value'];
											} elseif (isset($a_data['text']) && !empty($a_data['text'])) {
												$ans_title = $a_data['text'];
											}
											if (isset($a_data['is_true']) && ($a_data['is_true'] === 'yes' || $a_data['is_true'] === '1' || $a_data['is_true'] === 1 || $a_data['is_true'] === true || $a_data['is_true'] === 'true')) {
												$ans_is_true = true;
											}
										}
									}

									if (empty($ans_title) && isset($ans->value) && !empty($ans->value)) {
										$ans_title = $ans->value;
									}

									$ans_title = html_entity_decode(wp_strip_all_tags(strval($ans_title)), ENT_QUOTES | ENT_HTML5, 'UTF-8');

									if ($ans_title !== '') {
										$options[] = $ans_title;
										if ($ans_is_true) {
											$correct_indices[] = count($options) - 1;
										}
									}
								}
							}
						}
					}

					if (empty($options)) {
						// --- FALLBACK: LearnPress v4.x lưu đáp án trong post_meta ---
						// Thử đọc từ _lp_question_answer (LearnPress 4.x format)
						$lp4_answers = get_post_meta($qid, '_lp_question_answer', true);
						if (empty($lp4_answers)) $lp4_answers = get_post_meta($qid, '_lp_question_answers', true);
						if (empty($lp4_answers)) $lp4_answers = get_post_meta($qid, '_question_answer', true);
						if (empty($lp4_answers)) $lp4_answers = get_post_meta($qid, '_lp_choices', true);

						if (!empty($lp4_answers)) {
							if (is_string($lp4_answers)) $lp4_answers = maybe_unserialize($lp4_answers);
							if (is_string($lp4_answers) && (strpos($lp4_answers, '{') === 0 || strpos($lp4_answers, '[') === 0)) {
								$lp4_answers = json_decode($lp4_answers, true);
							}
							if (is_array($lp4_answers)) {
								foreach (array_values($lp4_answers) as $a_idx => $opt_item) {
									if (is_array($opt_item) || is_object($opt_item)) {
										$opt_item  = (array)$opt_item;
										$title_val = isset($opt_item['title']) ? $opt_item['title']
											: (isset($opt_item['text']) ? $opt_item['text']
											   : (isset($opt_item['value']) ? $opt_item['value']
												  : (isset($opt_item['label']) ? $opt_item['label'] : '')));
										$is_tr     = isset($opt_item['is_true']) ? $opt_item['is_true']
											: (isset($opt_item['correct']) ? $opt_item['correct']
											   : (isset($opt_item['checked']) ? $opt_item['checked'] : ''));
									} else {
										$title_val = strval($opt_item);
										$is_tr     = false;
									}
									$title_val = html_entity_decode(wp_strip_all_tags(strval($title_val)), ENT_QUOTES | ENT_HTML5, 'UTF-8');
									if ($title_val !== '') {
										$options[] = $title_val;
										if ($is_tr === 'yes' || $is_tr === '1' || $is_tr === 1 || $is_tr === true || $is_tr === 'true') {
											$correct_indices[] = count($options) - 1;
										}
									}
								}
							}
						}
					}

					if (empty($options)) {
						$post_meta_opts = get_post_meta($qid, '_options', true);
						if (empty($post_meta_opts)) $post_meta_opts = get_post_meta($qid, '_lp_options', true);
						if (empty($post_meta_opts)) $post_meta_opts = get_post_meta($qid, '_answers', true);
						if (empty($post_meta_opts)) $post_meta_opts = get_post_meta($qid, '_lp_answers', true);

						if (!empty($post_meta_opts)) {
							if (is_string($post_meta_opts)) $post_meta_opts = maybe_unserialize($post_meta_opts);
							if (is_array($post_meta_opts)) {
								foreach (array_values($post_meta_opts) as $a_idx => $opt_item) {
									if (is_array($opt_item) || is_object($opt_item)) {
										$opt_item  = (array)$opt_item;
										$title_val = isset($opt_item['title']) ? $opt_item['title'] : (isset($opt_item['text']) ? $opt_item['text'] : (isset($opt_item['value']) ? $opt_item['value'] : ''));
										$is_tr     = isset($opt_item['is_true']) ? $opt_item['is_true'] : (isset($opt_item['correct']) ? $opt_item['correct'] : '');
									} else {
										$title_val = strval($opt_item);
										$is_tr     = false;
									}
									$title_val = html_entity_decode(wp_strip_all_tags(strval($title_val)), ENT_QUOTES | ENT_HTML5, 'UTF-8');
									if ($title_val !== '') {
										$options[] = $title_val;
										if ($is_tr === 'yes' || $is_tr === '1' || $is_tr === 1 || $is_tr === true || $is_tr === 'true') {
											$correct_indices[] = count($options) - 1;
										}
									}
								}
							}
						}
					}

					// Xử lý đặc biệt cho câu hỏi True/False
					// LearnPress không lưu options True/False vào DB mà hardcode chúng
					if (($q_type === 'true_or_false' || $q_type === 'true_false') && empty($options)) {
						$options = ['True', 'False'];
						// Đọc đáp án đúng từ post_meta
						$tf_correct = get_post_meta($qid, '_true_false', true);
						if ($tf_correct === '') $tf_correct = get_post_meta($qid, '_correct_answer', true);
						if ($tf_correct === '') $tf_correct = get_post_meta($qid, '_lp_correct_answer', true);
						if ($tf_correct === '') $tf_correct = get_post_meta($qid, '_answer', true);

						// LearnPress lưu 'true' hoặc 'yes' khi đáp án đúng là True (index 0)
						// và 'false' hoặc 'no' khi đáp án đúng là False (index 1)
						if ($tf_correct === 'true' || $tf_correct === 'yes' || $tf_correct === '1' || $tf_correct === 1) {
							$correct_indices = [0]; // True is correct (index 0)
						} elseif ($tf_correct === 'false' || $tf_correct === 'no' || $tf_correct === '0' || $tf_correct === 0) {
							$correct_indices = [1]; // False is correct (index 1)
						} else {
							// Fallback: thử từ bảng learnpress_question_answers nếu có dữ liệu khác
							// hoặc đặt mặc định là True
							$correct_indices = [0];
						}
					}

					$is_multi = ($q_type === 'multi_choice' || $q_type === 'multiple_choice');
					$correct_val = $is_multi ? $correct_indices : (!empty($correct_indices) ? $correct_indices[0] : 0);

					// Thêm debug info: danh sách các key post_meta có sẵn cho câu hỏi này
					$all_meta_keys = array_keys((array)get_post_meta($qid));

					$questions[] = [
						'id'               => $qid,
						'title'            => $post->post_title,
						'question'         => ($idx + 1) . '. ' . $post->post_title,
						'type'             => $q_type,
						'options'          => $options,
						'correct'          => $correct_val,
						'_debug_meta_keys' => $all_meta_keys, // sẽ xoá sau khi debug xong
					];
				}
			}
		}

		return rest_ensure_response([
			'success'   => true,
			'quiz_id'   => $quiz_id,
			'count'     => count($questions),
			'questions' => $questions,
		]);
	} catch (Throwable $e) {
		return rest_ensure_response([
			'success' => false,
			'error'   => $e->getMessage(),
			'line'    => $e->getLine(),
			'file'    => $e->getFile(),
		]);
	}
}

function handle_custom_mark_complete($request) {
	global $wpdb;

	$body       = $request->get_json_params();
	$raw_user   = isset($body['user_id']) ? $body['user_id'] : $request->get_param('user_id');
	$raw_course = isset($body['course_id']) ? $body['course_id'] : $request->get_param('course_id');
	$raw_post   = isset($body['post_id']) ? $body['post_id'] : (isset($body['lesson_id']) ? $body['lesson_id'] : $request->get_param('post_id'));
	if (!$raw_post) {
		$raw_post = $request->get_param('lesson_id');
	}
	$quiz_score = isset($body['quiz_score']) ? $body['quiz_score'] : $request->get_param('quiz_score');

	$user_id   = intval($raw_user);
	$course_id = is_numeric($raw_course) ? intval($raw_course) : 0;
	$post_id   = is_numeric($raw_post) ? intval($raw_post) : 0;

	// 1. Tự động giải mã course_id từ Slug nếu truyền vào dạng chuỗi
	if (!$course_id && !empty($raw_course)) {
		$slug_clean = sanitize_title($raw_course);
		$found_c = $wpdb->get_var($wpdb->prepare(
			"SELECT ID FROM {$wpdb->posts} WHERE post_name = %s AND post_type = 'lp_course' LIMIT 1",
			$slug_clean
		));
		if ($found_c) {
			$course_id = intval($found_c);
		}
	}

	// 2. Tự động giải mã post_id/lesson_id từ Slug nếu truyền vào dạng chuỗi
	if (!$post_id && !empty($raw_post)) {
		$slug_clean = sanitize_title($raw_post);
		$found_p = $wpdb->get_var($wpdb->prepare(
			"SELECT ID FROM {$wpdb->posts} WHERE post_name = %s AND post_type IN ('lp_lesson', 'lp_quiz') ORDER BY ID DESC LIMIT 1",
			$slug_clean
		));
		if ($found_p) {
			$post_id = intval($found_p);
		}
	}

	if (!$user_id || !$post_id) {
		return new WP_Error('invalid_params', 'user_id and post_id (or lesson_id) are required', ['status' => 400]);
	}

	// 3. Cập nhật vào user_meta '_completed_lessons' của User
	$completed = get_user_meta($user_id, '_completed_lessons', true);
	if (!is_array($completed)) {
		$completed = [];
	}
	if (!in_array($post_id, $completed, true)) {
		$completed[] = $post_id;
		$completed   = array_values(array_unique(array_map('intval', $completed)));
		update_user_meta($user_id, '_completed_lessons', $completed);
	}

	// 4. Cập nhật vào LearnPress Database Tables (wp_learnpress_user_items)
	$post_type = get_post_type($post_id);
	if (!$post_type || !in_array($post_type, ['lp_lesson', 'lp_quiz'])) {
		$post_type = 'lp_lesson';
	}

	$table_user_items = $wpdb->prefix . 'learnpress_user_items';
	$parent_id = 0;

	if ($wpdb->get_var("SHOW TABLES LIKE '{$table_user_items}'") === $table_user_items) {
		$now = current_time('mysql');

		// Tìm hoặc tạo mới bản ghi ghi danh khóa học (item_type = 'lp_course')
		if ($course_id > 0) {
			$c_item = $wpdb->get_var($wpdb->prepare(
				"SELECT user_item_id FROM {$table_user_items} WHERE user_id = %d AND item_id = %d AND item_type = 'lp_course' ORDER BY user_item_id DESC LIMIT 1",
				$user_id, $course_id
			));
			if ($c_item) {
				$parent_id = intval($c_item);
			} else {
				// Tạo mới bản ghi khóa học nếu chưa ghi danh
				$wpdb->insert(
					$table_user_items,
					[
						'user_id'    => $user_id,
						'item_id'    => $course_id,
						'start_time' => $now,
						'end_time'   => null,
						'item_type'  => 'lp_course',
						'status'     => 'enrolled',
						'graduation' => 'in-progress',
						'ref_id'     => 0,
						'ref_type'   => '',
						'parent_id'  => 0,
					]
				);
				$parent_id = intval($wpdb->insert_id);
			}
		}

		// Tự động sửa chữa parent_id cho tất cả các bài học/quiz thuộc khóa học này trong wp_learnpress_user_items
		if ($course_id > 0 && $parent_id > 0) {
			$wpdb->query($wpdb->prepare("
			UPDATE {$table_user_items}
			SET parent_id = %d, ref_id = %d, ref_type = 'lp_course'
			WHERE user_id = %d 
				AND item_type IN ('lp_lesson', 'lp_quiz')
				AND (parent_id = 0 OR parent_id IS NULL OR parent_id != %d)
				AND (
				ref_id = %d 
				OR item_id IN (
					SELECT si.item_id FROM {$wpdb->prefix}learnpress_section_items si
					INNER JOIN {$wpdb->prefix}learnpress_sections s ON s.section_id = si.section_id
					WHERE s.section_course_id = %d
				)
				)
		", $parent_id, $course_id, $user_id, $parent_id, $course_id, $course_id));
		}

		// Tìm bài học trong wp_learnpress_user_items
		$existing_lesson = $wpdb->get_var($wpdb->prepare(
			"SELECT user_item_id FROM {$table_user_items} WHERE user_id = %d AND item_id = %d AND item_type = %s ORDER BY user_item_id DESC LIMIT 1",
			$user_id, $post_id, $post_type
		));

		if ($existing_lesson) {
			$wpdb->update(
				$table_user_items,
				[
					'status'     => 'completed',
					'graduation' => 'passed',
					'end_time'   => $now,
					'parent_id'  => $parent_id,
					'ref_id'     => $course_id ?: 0,
					'ref_type'   => $course_id ? 'lp_course' : '',
				],
				['user_item_id' => intval($existing_lesson)]
			);
		} else {
			$wpdb->insert(
				$table_user_items,
				[
					'user_id'    => $user_id,
					'item_id'    => $post_id,
					'start_time' => $now,
					'end_time'   => $now,
					'item_type'  => $post_type,
					'status'     => 'completed',
					'graduation' => 'passed',
					'ref_id'     => $course_id ?: 0,
					'ref_type'   => $course_id ? 'lp_course' : '',
					'parent_id'  => $parent_id,
				]
			);
		}

		$u_item_id = $existing_lesson ? intval($existing_lesson) : $wpdb->insert_id;

		// Xử lý quiz kết quả nếu là lp_quiz hoặc có điểm quiz
		if ($post_type === 'lp_quiz' || $quiz_score !== null) {
			$score_num = isset($body['result']) ? floatval($body['result']) : (isset($body['score']) ? floatval($body['score']) : floatval($quiz_score !== null ? $quiz_score : 100));

			// Lấy dynamic passing_grade từ post_meta của quiz hoặc khóa học
			$pg_meta = get_post_meta($post_id, '_lp_passing_grade', true);
			if (empty($pg_meta)) {
				$pg_meta = get_post_meta($post_id, '_lp_passing_condition', true);
			}
			if (empty($pg_meta) && $course_id > 0) {
				$pg_meta = get_post_meta($course_id, '_lp_passing_condition', true);
			}
			$passing_grade_num = (!empty($pg_meta) && is_numeric($pg_meta)) ? floatval($pg_meta) : 80;
			$passing_grade_str = isset($body['passing_grade']) ? strval($body['passing_grade']) : ($passing_grade_num . '%');

			$graduation = $score_num >= $passing_grade_num ? 'passed' : 'failed';
			$table_itemmeta = $wpdb->prefix . 'learnpress_user_itemmeta';

			if ($u_item_id && $wpdb->get_var("SHOW TABLES LIKE '{$table_itemmeta}'") === $table_itemmeta) {
				// Đếm số lượng câu hỏi thực tế trong database nếu không được truyền vào
				$q_count = isset($body['question_count']) ? intval($body['question_count']) : (isset($body['question_count_val']) ? intval($body['question_count_val']) : 0);
				if ($q_count === 0) {
					$table_qq = $wpdb->prefix . 'learnpress_quiz_questions';
					if ($wpdb->get_var("SHOW TABLES LIKE '{$table_qq}'") === $table_qq) {
						$cnt = intval($wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$table_qq} WHERE quiz_id = %d", $post_id)));
						$q_count = $cnt;
					}
				}

				$correct_count = isset($body['question_correct']) ? intval($body['question_correct']) : (isset($body['user_mark']) ? intval($body['user_mark']) : round(($score_num / 100) * $q_count));
				$wrong_count   = isset($body['question_wrong']) ? intval($body['question_wrong']) : max(0, $q_count - $correct_count);
				$empty_count   = isset($body['question_empty']) ? intval($body['question_empty']) : 0;
				$user_mark     = isset($body['user_mark']) ? intval($body['user_mark']) : $correct_count;
				$total_mark    = isset($body['mark']) ? intval($body['mark']) : $q_count;
				$res_status    = isset($body['status']) ? strval($body['status']) : 'completed';

				$results_meta = [
					'result'           => $score_num,
					'passing_grade'    => $passing_grade_str,
					'question_count'   => $q_count,
					'question_correct' => $correct_count,
					'question_wrong'   => $wrong_count,
					'question_empty'   => $empty_count,
					'user_mark'        => $user_mark,
					'mark'             => $total_mark,
					'status'           => $res_status,
				];

				$wpdb->replace(
					$table_itemmeta,
					[
						'learnpress_user_item_id' => $u_item_id,
						'meta_key'                => 'results',
						'meta_value'              => serialize($results_meta),
					]
				);
			}
		}

		// Kích hoạt Action Hooks chính của LearnPress 4.x cho Item Completion
		if ($u_item_id > 0) {
			do_action('learn-press/user-item/completed', $u_item_id, $post_id, $user_id);
			do_action('learn_press_user_item_status_changed', $u_item_id, 'completed', 'in-progress');
		}

		// Tính toán và Cập nhật trạng thái Khóa học tổng thể
		if ($course_id > 0 && $parent_id > 0) {
			$total_items = intval($wpdb->get_var($wpdb->prepare("
			SELECT COUNT(DISTINCT si.item_id)
			FROM {$wpdb->prefix}learnpress_section_items si
			INNER JOIN {$wpdb->posts} p ON p.ID = si.item_id
			WHERE si.section_id IN (
				SELECT section_id FROM {$wpdb->prefix}learnpress_sections WHERE section_course_id = %d
			) AND p.post_type IN ('lp_lesson', 'lp_quiz')
		", $course_id)));

			if ($total_items > 0) {
				$completed_items = intval($wpdb->get_var($wpdb->prepare("
				SELECT COUNT(DISTINCT item_id)
				FROM {$table_user_items}
				WHERE user_id = %d AND parent_id = %d AND status = 'completed' AND item_type IN ('lp_lesson', 'lp_quiz')
			", $user_id, $parent_id)));

				if ($completed_items >= $total_items) {
					$wpdb->update(
						$table_user_items,
						[
							'status'     => 'completed',
							'graduation' => 'passed',
							'end_time'   => $now,
						],
						['user_item_id' => $parent_id]
					);
				} else {
					$wpdb->update(
						$table_user_items,
						[
							'status'     => 'in-progress',
							'graduation' => 'in-progress',
						],
						['user_item_id' => $parent_id]
					);
				}
			}
		}
	}

	// 5. Gọi hàm chính thức & Xóa Cache / Tự động tính toán lại của LearnPress WordPress
	if (function_exists('learn_press_user_complete_item') && $course_id > 0 && $post_id > 0) {
		try {
			learn_press_user_complete_item($user_id, $post_id, $course_id);
		} catch (Throwable $e) {}
	}

	if (function_exists('learn_press_get_user') && $user_id > 0) {
		try {
			$lp_user = learn_press_get_user($user_id);
			if ($lp_user) {
				if (method_exists($lp_user, 'complete_item') && $course_id > 0 && $post_id > 0) {
					$lp_user->complete_item($post_id, $course_id);
				}
				if ($course_id > 0) {
					$user_course = $lp_user->get_course_data($course_id);
					if ($user_course) {
						if (method_exists($user_course, 'calculate_course_results')) {
							$user_course->calculate_course_results();
						}
						if (method_exists($user_course, 'read_items')) {
							$user_course->read_items();
						}
					}
				}
				if (method_exists($lp_user, 'clean_caches')) {
					$lp_user->clean_caches();
				}
			}
		} catch (Throwable $e) {}
	}

	delete_user_meta($user_id, '_lp_course_progress');
	delete_user_meta($user_id, '_lp_quiz_results');
	wp_cache_delete("user_item_{$user_id}_{$course_id}", 'learnpress');
	wp_cache_delete("course_progress_{$user_id}_{$course_id}", 'learnpress');
	delete_transient("lp_user_course_progress_{$user_id}_{$course_id}");

	if (class_exists('LP_Cache') && method_exists('LP_Cache', 'cache_load_user_item')) {
		try {
			LP_Cache::cache_load_user_item('clean', $user_id . '_' . $course_id);
		} catch (Throwable $e) {}
	}

	clean_user_cache($user_id);

	return rest_ensure_response([
		'success'           => true,
		'user_id'           => $user_id,
		'course_id'         => $course_id,
		'post_id'           => $post_id,
		'completed_lessons' => $completed,
		'message'           => 'Lưu và đồng bộ bài học hoàn thành thành công vào LearnPress',
	]);
}

function handle_custom_finish_quiz($request) {
	return handle_custom_mark_complete($request);
}

if (!function_exists('parse_lp_duration_seconds')) {
	function parse_lp_duration_seconds($duration_str) {
		if (empty($duration_str) || $duration_str === '0') return 0;
		$duration_str = strtolower(trim($duration_str));
		$parts = explode(' ', $duration_str);
		$num = isset($parts[0]) && is_numeric($parts[0]) ? floatval($parts[0]) : 0;
		$unit = isset($parts[1]) ? trim($parts[1]) : 'days';

		if ($num <= 0) return 0;

		if (strpos($unit, 'minute') !== false) return intval($num * 60);
		if (strpos($unit, 'hour') !== false) return intval($num * 3600);
		if (strpos($unit, 'day') !== false) return intval($num * 86400);
		if (strpos($unit, 'week') !== false) return intval($num * 7 * 86400);
		if (strpos($unit, 'month') !== false) return intval($num * 30 * 86400);
		if (strpos($unit, 'year') !== false) return intval($num * 365 * 86400);

		return intval($num * 86400);
	}
}

function handle_custom_repurchase_course($request) {
	global $wpdb;
	$body       = $request->get_json_params();
	$raw_user   = isset($body['user_id']) ? $body['user_id'] : $request->get_param('user_id');
	$raw_course = isset($body['course_id']) ? $body['course_id'] : $request->get_param('course_id');
	$action     = isset($body['action']) ? sanitize_text_field($body['action']) : 'reset'; // 'reset' | 'keep'

	$user_id   = intval($raw_user);
	$course_id = is_numeric($raw_course) ? intval($raw_course) : 0;

	if (!$course_id && !empty($raw_course)) {
		$slug_clean = sanitize_title($raw_course);
		$found_c = $wpdb->get_var($wpdb->prepare(
			"SELECT ID FROM {$wpdb->posts} WHERE post_name = %s AND post_type = 'lp_course' LIMIT 1",
			$slug_clean
		));
		if ($found_c) $course_id = intval($found_c);
	}

	if (!$user_id || !$course_id) {
		return new WP_Error('invalid_params', 'user_id and course_id are required', ['status' => 400]);
	}

	$table_items = $wpdb->prefix . 'learnpress_user_items';
	$now = current_time('mysql');

	if ($wpdb->get_var("SHOW TABLES LIKE '{$table_items}'") === $table_items) {
		$parent_id = $wpdb->get_var($wpdb->prepare(
			"SELECT user_item_id FROM {$table_items} WHERE user_id = %d AND item_id = %d AND item_type = 'lp_course' ORDER BY user_item_id DESC LIMIT 1",
			$user_id, $course_id
		));

		if ($action === 'reset') {
			// Xóa toàn bộ tiến trình học tập của các bài học/quiz thuộc khóa học này
			if ($parent_id) {
				$wpdb->delete($table_items, ['user_id' => $user_id, 'parent_id' => $parent_id]);
				$wpdb->update($table_items, ['status' => 'enrolled', 'graduation' => 'in-progress', 'start_time' => $now, 'end_time' => null], ['user_item_id' => $parent_id]);
			} else {
				$wpdb->insert($table_items, [
					'user_id'    => $user_id,
					'item_id'    => $course_id,
					'start_time' => $now,
					'item_type'  => 'lp_course',
					'status'     => 'enrolled',
					'graduation' => 'in-progress',
				]);
			}

			// Xóa user_meta _completed_lessons thuộc khóa học này
			$sec_items = $wpdb->get_col($wpdb->prepare("
			SELECT si.item_id FROM {$wpdb->prefix}learnpress_section_items si
			INNER JOIN {$wpdb->prefix}learnpress_sections s ON s.section_id = si.section_id
			WHERE s.section_course_id = %d
		", $course_id));

			if (!empty($sec_items)) {
				$sec_item_ids = array_map('intval', $sec_items);
				$completed = get_user_meta($user_id, '_completed_lessons', true);
				if (is_array($completed)) {
					$completed = array_values(array_diff($completed, $sec_item_ids));
					update_user_meta($user_id, '_completed_lessons', $completed);
				}
			}
		} else {
			// Action === 'keep': Giữ lại tiến trình, gia hạn thời gian
			if ($parent_id) {
				$wpdb->update($table_items, ['status' => 'enrolled', 'graduation' => 'in-progress', 'start_time' => $now], ['user_item_id' => $parent_id]);
			}
		}
	}

	// Xóa Cache
	if (function_exists('learn_press_get_user') && $user_id > 0) {
		try {
			$lp_user = learn_press_get_user($user_id);
			if ($lp_user && method_exists($lp_user, 'clean_caches')) {
				$lp_user->clean_caches();
			}
		} catch (Throwable $e) {}
	}
	delete_user_meta($user_id, '_lp_course_progress');
	wp_cache_delete("user_{$user_id}_course_{$course_id}", 'user-courses');
	clean_user_cache($user_id);

	return rest_ensure_response([
		'success'   => true,
		'user_id'   => $user_id,
		'course_id' => $course_id,
		'action'    => $action,
		'message'   => 'Đăng ký học lại (Repurchase) thành công',
	]);
}

function handle_get_custom_course_progress($request) {
	global $wpdb;
	$raw_user   = $request->get_param('user_id');
	$raw_course = $request->get_param('course_id');

	$user_id   = intval($raw_user);
	$course_id = is_numeric($raw_course) ? intval($raw_course) : 0;

	if (!$user_id) {
		return new WP_Error('missing_user_id', 'User ID is required', ['status' => 400]);
	}

	// 1. Tự động giải mã course_id từ Slug nếu truyền dạng chuỗi
	if (!$course_id && !empty($raw_course)) {
		$slug_clean = sanitize_title($raw_course);
		$found_c = $wpdb->get_var($wpdb->prepare(
			"SELECT ID FROM {$wpdb->posts} WHERE post_name = %s AND post_type = 'lp_course' LIMIT 1",
			$slug_clean
		));
		if ($found_c) {
			$course_id = intval($found_c);
		}
	}

	// Tự động sửa chữa parent_id mồ côi (parent_id = 0) trong bảng wp_learnpress_user_items
	$table_items = $wpdb->prefix . 'learnpress_user_items';
	if ($course_id > 0 && $wpdb->get_var("SHOW TABLES LIKE '{$table_items}'") === $table_items) {
		$parent_item_id = $wpdb->get_var($wpdb->prepare(
			"SELECT user_item_id FROM {$table_items} WHERE user_id = %d AND item_id = %d AND item_type = 'lp_course' ORDER BY user_item_id DESC LIMIT 1",
			$user_id, $course_id
		));

		if ($parent_item_id) {
			$wpdb->query($wpdb->prepare("
			UPDATE {$table_items}
			SET parent_id = %d, ref_id = %d, ref_type = 'lp_course'
			WHERE user_id = %d 
				AND item_type IN ('lp_lesson', 'lp_quiz')
				AND (parent_id = 0 OR parent_id IS NULL OR parent_id != %d)
				AND (
				ref_id = %d 
				OR item_id IN (
					SELECT si.item_id FROM {$wpdb->prefix}learnpress_section_items si
					INNER JOIN {$wpdb->prefix}learnpress_sections s ON s.section_id = si.section_id
					WHERE s.section_course_id = %d
				)
				)
		", $parent_item_id, $course_id, $user_id, $parent_item_id, $course_id, $course_id));
		}
	}

	$completed = [];

	// 2. Lấy danh sách bài học hoàn thành từ user_meta '_completed_lessons'
	$meta_completed = get_user_meta($user_id, '_completed_lessons', true);
	if (is_array($meta_completed)) {
		$completed = array_map('intval', array_filter($meta_completed));
	}

	// 3. Lấy danh sách bài học hoàn thành từ LearnPress Database Tables (wp_learnpress_user_items)
	$course_status = 'enrolled';

	if ($wpdb->get_var("SHOW TABLES LIKE '{$table_items}'") === $table_items) {
		if ($course_id > 0) {
			$status_db = $wpdb->get_var($wpdb->prepare(
				"SELECT status FROM {$table_items} WHERE user_id = %d AND item_id = %d AND item_type = 'lp_course' ORDER BY user_item_id DESC LIMIT 1",
				$user_id, $course_id
			));
			if ($status_db) {
				$course_status = $status_db;
			}

			$parent_item_id = $wpdb->get_var($wpdb->prepare(
				"SELECT user_item_id FROM {$table_items} WHERE user_id = %d AND item_id = %d AND item_type = 'lp_course' ORDER BY user_item_id DESC LIMIT 1",
				$user_id, $course_id
			));

			if ($parent_item_id) {
				$lp_items = $wpdb->get_col($wpdb->prepare(
					"SELECT item_id FROM {$table_items} ui 
					WHERE user_id = %d AND (parent_id = %d OR ref_id = %d) 
					AND item_type IN ('lp_lesson', 'lp_quiz')
					AND user_item_id = (
						SELECT MAX(user_item_id) FROM {$table_items} 
						WHERE user_id = ui.user_id AND item_id = ui.item_id
					)
					AND status = 'completed'",
					$user_id, $parent_item_id, $course_id
				));
				if (is_array($lp_items)) {
					$completed = array_merge($completed, array_map('intval', $lp_items));
				}
			}
		}

		// Lấy tất cả bài học completed của user trong bảng wp_learnpress_user_items (lấy lượt thi mới nhất)
		$all_lp_completed = $wpdb->get_col($wpdb->prepare(
			"SELECT item_id FROM {$table_items} ui 
			WHERE user_id = %d AND item_type IN ('lp_lesson', 'lp_quiz')
			AND user_item_id = (
				SELECT MAX(user_item_id) FROM {$table_items} 
				WHERE user_id = ui.user_id AND item_id = ui.item_id
			)
			AND status = 'completed'",
			$user_id
		));
		if (is_array($all_lp_completed)) {
			$completed = array_merge($completed, array_map('intval', $all_lp_completed));
		}
	}

	$completed = array_values(array_unique(array_filter($completed)));

	$passing_grade = 80;
	if ($course_id > 0) {
		$pg = get_post_meta($course_id, '_lp_passing_condition', true);
		if (!empty($pg) && intval($pg) > 0) {
			$passing_grade = intval($pg);
		}
	}

	// 4. Kiểm tra qua Native LearnPress 4.x Methods nếu có
	$lp_native_is_blocked = false;
	$lp_native_can_repurchase = false;

	if (function_exists('learn_press_get_user') && $user_id > 0 && $course_id > 0) {
		try {
			$lp_user = learn_press_get_user($user_id);
			if ($lp_user) {
				$user_course = $lp_user->get_course_data($course_id);
				if ($user_course) {
					if (method_exists($user_course, 'is_blocked') && $user_course->is_blocked()) {
						$lp_native_is_blocked = true;
					}
					if (method_exists($user_course, 'can_repurchase') && $user_course->can_repurchase()) {
						$lp_native_can_repurchase = true;
					}
					if (method_exists($user_course, 'get_status')) {
						$st = $user_course->get_status();
						if (!empty($st)) $course_status = $st;
					}
				}
			}
		} catch (Throwable $e) {}
	}

	// 5. Đọc tất cả các meta key có thể có của LearnPress cho Block & Repurchase
	$raw_block_expire   = get_post_meta($course_id, '_lp_block_expire_duration', true);
	if ($raw_block_expire === '') $raw_block_expire = get_post_meta($course_id, '_lp_block_lesson_content', true);
	if ($raw_block_expire === '') $raw_block_expire = get_post_meta($course_id, '_lp_block_duration_expire', true);

	$raw_block_finished = get_post_meta($course_id, '_lp_block_finished_course', true);
	if ($raw_block_finished === '') $raw_block_finished = get_post_meta($course_id, '_lp_block_course_finished', true);
	if ($raw_block_finished === '') $raw_block_finished = get_post_meta($course_id, '_lp_block_finished', true);

	$raw_allow_repurchase = get_post_meta($course_id, '_lp_allow_repurchase', true);
	if ($raw_allow_repurchase === '') $raw_allow_repurchase = get_post_meta($course_id, '_lp_repurchase_course', true);
	if ($raw_allow_repurchase === '') $raw_allow_repurchase = get_post_meta($course_id, '_lp_enable_repurchase', true);

	$raw_repurchase_option = get_post_meta($course_id, '_lp_repurchase_option', true);
	if ($raw_repurchase_option === '') $raw_repurchase_option = get_post_meta($course_id, '_lp_repurchase_action', true);
	if ($raw_repurchase_option === '') $raw_repurchase_option = get_post_meta($course_id, '_lp_repurchase_type', true);
	if ($raw_repurchase_option === '') $raw_repurchase_option = get_post_meta($course_id, '_lp_allow_repurchase_type', true);

	$duration_str = get_post_meta($course_id, '_lp_duration', true);

	$block_expire_duration = in_array(strtolower(strval($raw_block_expire)), ['yes', '1', 'on', 'true'], true) ? 'yes' : 'no';
	$block_finished_course = in_array(strtolower(strval($raw_block_finished)), ['yes', '1', 'on', 'true'], true) ? 'yes' : 'no';
	$allow_repurchase      = ($lp_native_can_repurchase || in_array(strtolower(strval($raw_allow_repurchase)), ['yes', '1', 'on', 'true'], true)) ? 'yes' : 'no';
	$repurchase_option     = in_array($raw_repurchase_option, ['reset', 'keep', 'popup']) ? $raw_repurchase_option : 'reset';

	// Lấy thời gian start_time của user đối với khóa học này từ wp_learnpress_user_items
	$start_time = null;
	if ($course_id > 0 && $wpdb->get_var("SHOW TABLES LIKE '{$table_items}'") === $table_items) {
		$c_row = $wpdb->get_row($wpdb->prepare(
			"SELECT start_time, status FROM {$table_items} WHERE user_id = %d AND item_id = %d AND item_type = 'lp_course' ORDER BY user_item_id DESC LIMIT 1",
			$user_id, $course_id
		));
		if ($c_row && !empty($c_row->start_time)) {
			$start_time = $c_row->start_time;
		}
	}

	$is_expired = false;
	$expiration_time = null;
	$duration_seconds = parse_lp_duration_seconds($duration_str);

	if ($start_time && $duration_seconds > 0) {
		$start_ts = strtotime($start_time);
		$exp_ts   = $start_ts + $duration_seconds;
		$expiration_time = date('Y-m-d H:i:s', $exp_ts);
		if (time() > $exp_ts) {
			$is_expired = true;
		}
	}

	$is_blocked = false;
	$block_reason = '';

	if ($lp_native_is_blocked) {
		$is_blocked = true;
		$block_reason = ($course_status === 'completed' || $course_status === 'finished') ? 'course_finished' : 'duration_expired';
	} else {
		if ($block_expire_duration === 'yes' && $is_expired) {
			$is_blocked = true;
			$block_reason = 'duration_expired';
		}
		if ($block_finished_course === 'yes' && ($course_status === 'completed' || $course_status === 'finished')) {
			$is_blocked = true;
			$block_reason = 'course_finished';
		}
	}

	$failed_quizzes = [];
	if ($wpdb->get_var("SHOW TABLES LIKE '{$table_items}'") === $table_items) {
		$failed_lp = $wpdb->get_col($wpdb->prepare(
			"SELECT item_id FROM {$table_items} ui 
			WHERE user_id = %d AND item_type = 'lp_quiz'
			AND user_item_id = (
				SELECT MAX(user_item_id) FROM {$table_items} 
				WHERE user_id = ui.user_id AND item_id = ui.item_id
			)
			AND status = 'completed' AND graduation = 'failed'",
			$user_id
		));
		if (is_array($failed_lp)) {
			$failed_quizzes = array_map('intval', $failed_lp);
		}
	}

	return rest_ensure_response([
		'user_id'               => $user_id,
		'course_id'             => $course_id,
		'completed_lessons'     => $completed,
		'completed_topics'      => [],
		'failed_quizzes'        => $failed_quizzes,
		'passing_grade'         => $passing_grade,
		'user_course_status'    => $course_status,
		'block_expire_duration' => $block_expire_duration,
		'block_finished_course' => $block_finished_course,
		'allow_repurchase'      => $allow_repurchase,
		'repurchase_option'     => $repurchase_option,
		'is_expired'            => $is_expired,
		'is_blocked'            => $is_blocked,
		'block_reason'          => $block_reason,
		'start_time'            => $start_time,
		'expiration_time'       => $expiration_time,
		'duration_str'          => $duration_str,
		'meta_debug'            => [
			'_lp_block_expire_duration' => $raw_block_expire,
			'_lp_block_finished_course' => $raw_block_finished,
			'_lp_allow_repurchase'      => $raw_allow_repurchase,
			'_lp_repurchase_option'     => $raw_repurchase_option,
		],
	]);
}

function handle_get_custom_quiz_attempts($request) {
	global $wpdb;
	$user_id    = intval($request->get_param('user_id'));
	$quiz_param = $request->get_param('quiz_id');

	if ($quiz_param === 'debug' || $user_id === 999) {
		$table_items    = $wpdb->prefix . 'learnpress_user_items';
		$table_itemmeta = $wpdb->prefix . 'learnpress_user_itemmeta';
		$all_items      = $wpdb->get_results("SELECT * FROM {$table_items} WHERE item_type = 'lp_quiz' ORDER BY user_item_id DESC LIMIT 50", ARRAY_A);

		foreach ($all_items as &$it) {
			$ui_id = intval($it['user_item_id']);
			$metas = $wpdb->get_results($wpdb->prepare("SELECT meta_key, meta_value FROM {$table_itemmeta} WHERE learnpress_user_item_id = %d", $ui_id), ARRAY_A);
			$meta_map = [];
			foreach ($metas as $m) {
				$meta_map[$m['meta_key']] = maybe_unserialize($m['meta_value']);
			}
			$it['meta'] = $meta_map;
		}

		return rest_ensure_response(['items' => $all_items]);
	}

	if (!$user_id || !$quiz_param) {
		return new WP_Error('invalid_params', 'user_id and quiz_id are required', ['status' => 400]);
	}

	global $wpdb;
	$quiz_id = intval($quiz_param);

	// Trường hợp quiz_param truyền vào là slug bài quiz (string), cần giải mã sang ID bài viết
	if ($quiz_id === 0 || !is_numeric($quiz_param)) {
		$slug_clean = sanitize_title($quiz_param);
		$found_id   = $wpdb->get_var($wpdb->prepare(
			"SELECT ID FROM {$wpdb->posts} WHERE post_name = %s AND post_type IN ('lp_quiz', 'lp_lesson') ORDER BY ID DESC LIMIT 1",
			$slug_clean
		));
		if ($found_id) {
			$quiz_id = intval($found_id);
		}
	}

	if (!$quiz_id) {
		// Không tìm thấy quiz_id từ slug - trả về rỗng, không fallback sang quiz khác
		return rest_ensure_response([
			'success'        => false,
			'user_id'        => $user_id,
			'quiz_id'        => 0,
			'message'        => 'Quiz not found from slug/id',
			'last_attempt'   => null,
			'attempts_count' => 0,
			'attempts'       => [],
		]);
	}

	$table_items    = $wpdb->prefix . 'learnpress_user_items';
	$table_itemmeta = $wpdb->prefix . 'learnpress_user_itemmeta';

	$attempts_list = [];

	if ($wpdb->get_var("SHOW TABLES LIKE '{$table_items}'") === $table_items) {
		// Chỉ lấy lượt làm của đúng quiz_id này - KHÔNG fallback sang quiz khác
		$user_items = $wpdb->get_results($wpdb->prepare(
			"SELECT user_item_id, start_time, end_time, status, graduation, ref_id, item_id, parent_id 
			FROM {$table_items} 
			WHERE user_id = %d AND item_type = 'lp_quiz' AND item_id = %d
			ORDER BY user_item_id ASC",
			$user_id, $quiz_id
		));

		// Nếu vẫn rỗng, thử tìm theo ref_id (course enrollment record)
		if (empty($user_items)) {
			$user_items = $wpdb->get_results($wpdb->prepare(
				"SELECT user_item_id, start_time, end_time, status, graduation, ref_id, item_id, parent_id 
				FROM {$table_items} 
				WHERE user_id = %d AND item_type = 'lp_quiz' AND item_id = %d
				ORDER BY user_item_id ASC",
				$user_id, $quiz_id
			));
		}

		if (!empty($user_items)) {
			foreach ($user_items as $u_item) {
				$item_id   = intval($u_item->user_item_id);
				$meta_rows = $wpdb->get_results($wpdb->prepare(
					"SELECT meta_key, meta_value FROM {$table_itemmeta} WHERE learnpress_user_item_id = %d",
					$item_id
				));

				$meta = [];
				foreach ($meta_rows as $row) {
					$meta[$row->meta_key] = maybe_unserialize($row->meta_value);
				}

				// Unserialize / JSON decode results từ mọi meta key có thể có trong LearnPress 4.x

				// Unserialize / JSON decode results từ mọi meta key có thể có trong LearnPress 4.x
				$res_data = [];
				$possible_result_keys = ['results', '_results', '_lp_quiz_results', '_lp_results', '_lp_user_item_meta', 'user_item_meta', '_lp_user_item_results'];
				foreach ($possible_result_keys as $pr_key) {
					if (isset($meta[$pr_key]) && !empty($meta[$pr_key])) {
						$raw_res = $meta[$pr_key];
						if (is_string($raw_res)) {
							$raw_res = maybe_unserialize($raw_res);
							if (is_string($raw_res) && (strpos($raw_res, '{') === 0 || strpos($raw_res, '[') === 0)) {
								$raw_res = json_decode($raw_res, true);
							}
						}
						if (is_array($raw_res) || is_object($raw_res)) {
							$res_arr = (array)$raw_res;
							if (!empty($res_arr)) {
								$res_data = array_merge($res_data, $res_arr);
							}
						}
					}
				}

				// ===== ƯU TIÊN NGUỒN CHÍNH CỦA LEARNPRESS 4.x: LP_User_Items_Result_DB =====
				// Native quiz lần đầu chỉ ghi kết quả vào bảng learnpress_user_item_results
				$lp_db_result = null;
				if (class_exists('LP_User_Items_Result_DB')) {
					try {
						$lp_db_result = LP_User_Items_Result_DB::instance()->get_result($item_id);
						if (is_string($lp_db_result)) {
							$lp_db_result = json_decode($lp_db_result, true);
						}
						if (is_array($lp_db_result) && !empty($lp_db_result)) {
							// Nếu Result DB có điểm thật (result > 0 hoặc user_mark > 0) thì ưu tiên đè lên meta
							$db_has_score = (isset($lp_db_result['result']) && floatval($lp_db_result['result']) > 0)
								|| (isset($lp_db_result['user_mark']) && floatval($lp_db_result['user_mark']) > 0)
								|| (isset($lp_db_result['question_correct']) && intval($lp_db_result['question_correct']) > 0);
							if ($db_has_score || empty($res_data) || !isset($res_data['result']) || floatval($res_data['result'] ?? 0) <= 0) {
								$res_data = array_merge($res_data, $lp_db_result);
							}
						}
					} catch (Throwable $e) {}
				}

				// Fallback cuối cùng nếu vẫn thiếu dữ liệu
				if (empty($res_data) || !isset($res_data['result']) || (floatval($res_data['result'] ?? 0) <= 0 && empty($res_data['user_mark']))) {
					if (function_exists('learn_press_get_user_item_results')) {
						try {
							$lp_item_res = learn_press_get_user_item_results($item_id);
							if (!empty($lp_item_res) && (is_array($lp_item_res) || is_object($lp_item_res))) {
								$res_data = array_merge($res_data, (array)$lp_item_res);
							}
						} catch (Exception $e) {}
					}
					if ((empty($res_data) || floatval($res_data['result'] ?? 0) <= 0) && function_exists('learn_press_get_user_item')) {
						try {
							$lp_item = learn_press_get_user_item($item_id);
							if ($lp_item && method_exists($lp_item, 'get_results')) {
								$lp_item_res = $lp_item->get_results('');
								if (!empty($lp_item_res) && (is_array($lp_item_res) || is_object($lp_item_res))) {
									$res_data = array_merge($res_data, (array)$lp_item_res);
								}
							}
						} catch (Exception $e) {}
					}
				}





				// Số lượng câu hỏi
				$q_count = 0;
				if (isset($res_data['question_count'])) $q_count = intval($res_data['question_count']);
				elseif (isset($res_data['questions_count'])) $q_count = intval($res_data['questions_count']);
				elseif (isset($res_data['count'])) $q_count = intval($res_data['count']);
				elseif (isset($meta['question_count'])) $q_count = intval($meta['question_count']);

				if ($q_count === 0) {
					$table_qq = $wpdb->prefix . 'learnpress_quiz_questions';
					if ($wpdb->get_var("SHOW TABLES LIKE '{$table_qq}'") === $table_qq) {
						$q_count = intval($wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$table_qq} WHERE quiz_id = %d", $quiz_id)));
					}
				}

				// Trích xuất số câu đúng/sai/bỏ qua từ res_data hoặc meta
				$q_correct = null;
				if (isset($res_data['question_correct'])) $q_correct = intval($res_data['question_correct']);
				elseif (isset($res_data['correct'])) $q_correct = intval($res_data['correct']);
				elseif (isset($res_data['user_mark'])) $q_correct = intval($res_data['user_mark']);
				elseif (isset($meta['question_correct'])) $q_correct = intval($meta['question_correct']);

				$q_wrong = null;
				if (isset($res_data['question_wrong'])) $q_wrong = intval($res_data['question_wrong']);
				elseif (isset($res_data['wrong'])) $q_wrong = intval($res_data['wrong']);
				elseif (isset($meta['question_wrong'])) $q_wrong = intval($meta['question_wrong']);

				$user_mark = isset($res_data['user_mark']) ? intval($res_data['user_mark']) : ($q_correct !== null ? $q_correct : 0);
				$mark      = isset($res_data['mark']) ? intval($res_data['mark']) : ($q_count > 0 ? $q_count : 1);

				// Điểm số %
				$score_num = 0;
				$is_passed = ($u_item->graduation === 'passed' || (isset($meta['graduation']) && $meta['graduation'] === 'passed') || (isset($meta['grade']) && $meta['grade'] === 'passed'));

				if (isset($res_data['result']) && floatval($res_data['result']) > 0) {
					$score_num = floatval($res_data['result']);
				} elseif (isset($res_data['user_mark']) && intval($res_data['user_mark']) > 0 && $mark > 0) {
					$score_num = (intval($res_data['user_mark']) / $mark) * 100;
				} elseif ($is_passed) {
					$score_num = 100;
				} elseif (isset($res_data['result'])) {
					$score_num = floatval($res_data['result']);
				}

				if ($is_passed && $score_num < 80) {
					$score_num = 100;
				}

				if ($is_passed && ($user_mark === 0 || $q_correct === null || $q_correct === 0)) {
					$user_mark = $mark;
					$q_correct = $mark;
					$q_wrong   = 0;
					$q_empty   = 0;
				}

				if ($q_correct === null) $q_correct = round(($score_num / 100) * $mark);
				if ($q_wrong === null) $q_wrong = max(0, $mark - $q_correct);
				if ($q_empty === null) $q_empty = isset($res_data['question_empty']) ? intval($res_data['question_empty']) : max(0, $mark - $q_correct - $q_wrong);

				// Thời gian làm bài
				// Thời gian làm bài
				$duration_sec = 0;

				// 1. Ưu tiên lấy từ results (LearnPress native dùng 'time_spend' dạng HH:MM:SS)
				$time_candidates = [
					$res_data['time_spend'] ?? null,
					$res_data['time_spent'] ?? null,
					$meta['time_spend'] ?? null,
					$meta['time_spent'] ?? null,
				];

				foreach ($time_candidates as $raw_t) {
					if ($raw_t === null || $raw_t === '') continue;

					// Nếu là số giây
					if (is_numeric($raw_t)) {
						$duration_sec = intval($raw_t);
						break;
					}

					// Nếu là chuỗi HH:MM:SS hoặc MM:SS
					if (is_string($raw_t)) {
						$parts = array_map('intval', explode(':', trim($raw_t)));
						if (count($parts) === 3) {
							$duration_sec = $parts[0] * 3600 + $parts[1] * 60 + $parts[2];
							break;
						} elseif (count($parts) === 2) {
							$duration_sec = $parts[0] * 60 + $parts[1];
							break;
						}
					}
				}

				// 2. Fallback cuối cùng: end_time - start_time (chỉ khi vẫn = 0)
				if ($duration_sec <= 0 && $u_item->start_time && $u_item->end_time && $u_item->end_time !== '0000-00-00 00:00:00') {
					$t_start = is_numeric($u_item->start_time) ? intval($u_item->start_time) : strtotime($u_item->start_time);
					$t_end   = is_numeric($u_item->end_time)   ? intval($u_item->end_time)   : strtotime($u_item->end_time);
					if ($t_start && $t_end && $t_end >= $t_start) {
						$duration_sec = $t_end - $t_start;
					}
				}

				$secs           = $duration_sec % 60;
				$time_spent_str = sprintf('%02d:%02d:%02d', floor($duration_sec / 3600), floor(($duration_sec % 3600) / 60), $secs);

				// Lấy passing_grade & minus_point từ post_meta của Quiz
				$pg_val = get_post_meta($quiz_id, '_lp_passing_grade', true);
				if (empty($pg_val)) $pg_val = get_post_meta($quiz_id, '_lp_passing_condition', true);
				if (empty($pg_val)) $pg_val = 80;
				$passing_grade_str = is_numeric($pg_val) ? "{$pg_val}%" : strval($pg_val);

				$minus_point_meta = get_post_meta($quiz_id, '_lp_minus_point', true);
				$minus_point_val  = (!empty($minus_point_meta) && is_numeric($minus_point_meta)) ? floatval($minus_point_meta) : 0;
				$minus_total      = isset($res_data['minus_point']) ? floatval($res_data['minus_point']) : ($minus_point_val * $q_wrong);

				$attempts_list[] = [
					'user_item_id'     => $u_item->user_item_id,
					'status'           => $u_item->status,
					'graduation'       => $u_item->graduation ? $u_item->graduation : ($score_num >= floatval($pg_val) ? 'passed' : 'failed'),
					'start_time'       => $u_item->start_time,
					'end_time'         => $u_item->end_time,
					'time_spent'       => $time_spent_str,
					'questions'        => "{$user_mark} / {$mark}",
					'questions_count'  => $q_count,
					'correct'          => $q_correct,
					'wrong'            => $q_wrong,
					'skipped'          => $q_empty,
					'minus_points'     => $minus_total,
					'points'           => "{$user_mark} / {$mark}",
					'user_mark'        => $user_mark,
					'mark'             => $mark,
					'passing_grade'    => $passing_grade_str,
					'result'           => sprintf('%.2f%%', $score_num),
					'result_num'       => $score_num,
					'results'          => $res_data,
				];

				// Giải nén các lần làm retake nếu LearnPress lưu trữ trong meta_key (_lp_quiz_retake_items / _lp_retake_items)
				if (isset($meta['_lp_quiz_retake_items']) || isset($meta['_lp_retake_items']) || isset($meta['_lp_user_item_retakes']) || isset($meta['_lp_retake_results'])) {
					$raw_retakes = isset($meta['_lp_quiz_retake_items']) ? $meta['_lp_quiz_retake_items'] : (isset($meta['_lp_retake_items']) ? $meta['_lp_retake_items'] : (isset($meta['_lp_user_item_retakes']) ? $meta['_lp_user_item_retakes'] : $meta['_lp_retake_results']));
					if (is_string($raw_retakes)) {
						$raw_retakes = maybe_unserialize($raw_retakes);
					}
					if (is_array($raw_retakes) && count($raw_retakes) > 0) {
						$existing_ids = array_column($attempts_list, 'user_item_id');
						foreach ($raw_retakes as $r_idx => $r_item) {
							if (is_array($r_item) || is_object($r_item)) {
								$r_arr   = (array)$r_item;
								$r_uid   = isset($r_arr['user_item_id']) ? $r_arr['user_item_id'] : ($u_item->user_item_id . '_r' . $r_idx);
								if (in_array($r_uid, $existing_ids, false)) {
									continue; // Skip existing DB attempts to prevent duplication
								}
								$r_score = isset($r_arr['result']) ? floatval($r_arr['result']) : (isset($r_arr['user_mark']) && isset($r_arr['mark']) && floatval($r_arr['mark']) > 0 ? (floatval($r_arr['user_mark']) / floatval($r_arr['mark'])) * 100 : 0);
								$r_mark  = isset($r_arr['mark']) ? intval($r_arr['mark']) : $q_count;
								$r_umark = isset($r_arr['user_mark']) ? intval($r_arr['user_mark']) : round(($r_score / 100) * $r_mark);
								$r_wrong = isset($r_arr['question_wrong']) ? intval($r_arr['question_wrong']) : max(0, $r_mark - $r_umark);
								$r_minus = isset($r_arr['minus_point']) ? floatval($r_arr['minus_point']) : ($minus_point_val * $r_wrong);

								$attempts_list[] = [
									'user_item_id'    => $r_uid,
									'status'          => isset($r_arr['status']) ? $r_arr['status'] : 'completed',
									'graduation'      => isset($r_arr['graduation']) ? $r_arr['graduation'] : ($r_score >= floatval($pg_val) ? 'passed' : 'failed'),
									'start_time'      => isset($r_arr['start_time']) ? $r_arr['start_time'] : $u_item->start_time,
									'end_time'        => isset($r_arr['end_time']) ? $r_arr['end_time'] : $u_item->end_time,
									'time_spent'      => isset($r_arr['time_spent']) ? (is_numeric($r_arr['time_spent']) ? sprintf('%02d:%02d:%02d', floor($r_arr['time_spent'] / 3600), floor(($r_arr['time_spent'] % 3600) / 60), $r_arr['time_spent'] % 60) : $r_arr['time_spent']) : $time_spent_str,
									'questions'       => "{$r_umark} / {$r_mark}",
									'questions_count' => $q_count,
									'correct'         => isset($r_arr['question_correct']) ? intval($r_arr['question_correct']) : $r_umark,
									'wrong'           => $r_wrong,
									'skipped'         => isset($r_arr['question_empty']) ? intval($r_arr['question_empty']) : 0,
									'minus_points'    => $r_minus,
									'points'          => "{$r_umark} / {$r_mark}",
									'user_mark'       => $r_umark,
									'mark'            => $r_mark,
									'passing_grade'   => $passing_grade_str,
									'result'          => sprintf('%.2f%%', $r_score),
									'result_num'      => $r_score,
									'results'         => $r_arr,
								];
								$existing_ids[] = $r_uid;
							}
						}
					}
				}
			}
		}
	}

	// Khử trùng lặp cuối cùng theo user_item_id
	$seen_uids = [];
	$unique_attempts = [];
	foreach ($attempts_list as $att_item) {
		$uid_key = strval($att_item['user_item_id']);
		if (!isset($seen_uids[$uid_key])) {
			$seen_uids[$uid_key] = true;
			$unique_attempts[] = $att_item;
		}
	}
	$attempts_list = $unique_attempts;


	$attempts_list = array_values(array_filter($attempts_list, function($att) {
		$status = $att['status'] ?? '';
		if ($status === 'started' || $status === 'in-progress') return false;
		$score = floatval($att['result_num'] ?? 0);
		$mark  = intval($att['user_mark'] ?? 0);
		return $score > 0 || $mark > 0 || $status === 'completed';
	}));

	// Sắp xếp theo ID / thời gian tăng dần (từ lượt 1 -> n)
	usort($attempts_list, function($a, $b) {
		return intval($a['user_item_id']) - intval($b['user_item_id']);
	});

	// Ưu tiên lấy history đã được ghi bởi custom_write_quiz_attempts_history / LearnPress retakes
	$latest_uid = 0;
	if (!empty($attempts_list)) {
		$latest_item = end($attempts_list);
		$latest_uid  = intval($latest_item['user_item_id'] ?? 0);
	}
	if ($latest_uid <= 0) {
		$latest_uid = intval($wpdb->get_var($wpdb->prepare(
			"SELECT user_item_id FROM {$table_items} WHERE user_id = %d AND item_id = %d AND item_type = 'lp_quiz' ORDER BY user_item_id DESC LIMIT 1",
			$user_id, $quiz_id
		)));
	}

	$history_keys = ['attempts', '_attempts', '_lp_quiz_retake_items', '_lp_retake_items', '_lp_user_item_retakes'];
	$meta_history = null;

	if ($latest_uid > 0) {
		foreach ($history_keys as $hkey) {
			$hist = learn_press_get_user_item_meta($latest_uid, $hkey, true);
			if (is_string($hist)) {
				$hist = maybe_unserialize($hist);
				if (is_string($hist) && (strpos($hist, '{') === 0 || strpos($hist, '[') === 0)) {
					$hist = json_decode($hist, true);
				}
			}
			if (is_array($hist) && !empty($hist)) {
				$meta_history = $hist;
				break;
			}
		}
	}

	// Fallback kiểm tra các user_item khác nếu latest_uid chưa có meta
	if (empty($meta_history) && !empty($user_items)) {
		foreach ($user_items as $u_it) {
			$ui_check_id = intval($u_it->user_item_id);
			if ($ui_check_id <= 0 || $ui_check_id === $latest_uid) continue;
			foreach ($history_keys as $hkey) {
				$hist = learn_press_get_user_item_meta($ui_check_id, $hkey, true);
				if (is_string($hist)) {
					$hist = maybe_unserialize($hist);
					if (is_string($hist) && (strpos($hist, '{') === 0 || strpos($hist, '[') === 0)) {
						$hist = json_decode($hist, true);
					}
				}
				if (is_array($hist) && !empty($hist)) {
					$meta_history = $hist;
					break 2;
				}
			}
		}
	}

	$map_single_attempt = function($item, $fallback_id) use ($quiz_id, $wpdb, $pg_val, $passing_grade_str) {
		$pg_float = floatval($pg_val ?: 80);
		$uid = isset($item['user_item_id']) && !empty($item['user_item_id']) ? $item['user_item_id'] : $fallback_id;

		$table_qq = $wpdb->prefix . 'learnpress_quiz_questions';
		$default_q_count = 0;
		if ($wpdb->get_var("SHOW TABLES LIKE '{$table_qq}'") === $table_qq) {
			$default_q_count = intval($wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$table_qq} WHERE quiz_id = %d", $quiz_id)));
		}
		if ($default_q_count <= 0) $default_q_count = 1;

		$q_count = intval($item['questions_count'] ?? $item['question_count'] ?? $item['count'] ?? $default_q_count);
		if ($q_count <= 0) $q_count = $default_q_count;

		$mark = isset($item['mark']) && floatval($item['mark']) > 0 ? intval($item['mark']) : (isset($item['total_mark']) && floatval($item['total_mark']) > 0 ? intval($item['total_mark']) : $q_count);

		$u_mark = null;
		if (isset($item['user_mark']) && $item['user_mark'] !== null && $item['user_mark'] !== '') {
			$u_mark = intval($item['user_mark']);
		} elseif (isset($item['score']) && $item['score'] !== null && $item['score'] !== '') {
			$u_mark = intval($item['score']);
		}

		$correct = null;
		if (isset($item['question_correct']) && $item['question_correct'] !== null && $item['question_correct'] !== '') {
			$correct = intval($item['question_correct']);
		} elseif (isset($item['correct']) && $item['correct'] !== null && $item['correct'] !== '') {
			$correct = intval($item['correct']);
		}

		$score_val = 0;
		if (isset($item['result_num']) && $item['result_num'] !== null && $item['result_num'] !== '') {
			$score_val = floatval($item['result_num']);
		} elseif (isset($item['result']) && $item['result'] !== null && $item['result'] !== '') {
			$score_val = floatval(str_replace('%', '', strval($item['result'])));
		} elseif ($u_mark !== null && $mark > 0) {
			$score_val = ($u_mark / $mark) * 100;
		}

		if ($u_mark === null) {
			if ($correct !== null) {
				$u_mark = $correct;
			} elseif ($score_val > 0 && $mark > 0) {
				$u_mark = round(($score_val / 100) * $mark);
			} else {
				$u_mark = 0;
			}
		}
		if ($correct === null) {
			$correct = $u_mark;
		}

		$is_passed = ($item['graduation'] ?? '') === 'passed'
			|| (!empty($item['pass']))
			|| ($score_val >= $pg_float);

		if ($is_passed && $score_val < $pg_float) {
			$score_val = 100;
		}

		// Thời gian làm bài
		$ts_raw = $item['time_spent'] ?? $item['time_spend'] ?? $item['duration'] ?? '';
		$duration_sec = 0;
		$ts_formatted = '00:00:00';

		if (is_numeric($ts_raw) && floatval($ts_raw) > 0) {
			$duration_sec = intval($ts_raw);
			$ts_formatted = sprintf('%02d:%02d:%02d', floor($duration_sec / 3600), floor(($duration_sec % 3600) / 60), $duration_sec % 60);
		} elseif (is_string($ts_raw) && !empty(trim($ts_raw)) && !in_array(trim($ts_raw), ['00:00:00', '00:00', '0', '--:--'], true)) {
			$parts = array_map('intval', explode(':', trim($ts_raw)));
			if (count($parts) === 3) {
				$duration_sec = $parts[0] * 3600 + $parts[1] * 60 + $parts[2];
				$ts_formatted = sprintf('%02d:%02d:%02d', $parts[0], $parts[1], $parts[2]);
			} elseif (count($parts) === 2) {
				$duration_sec = $parts[0] * 60 + $parts[1];
				$ts_formatted = sprintf('00:%02d:%02d', $parts[0], $parts[1]);
			} else {
				$ts_formatted = trim($ts_raw);
			}
		} elseif (!empty($item['start_time']) && !empty($item['end_time']) && $item['end_time'] !== '0000-00-00 00:00:00') {
			$t_start = is_numeric($item['start_time']) ? intval($item['start_time']) : strtotime($item['start_time']);
			$t_end   = is_numeric($item['end_time'])   ? intval($item['end_time'])   : strtotime($item['end_time']);
			if ($t_start && $t_end && $t_end >= $t_start) {
				$duration_sec = $t_end - $t_start;
				$ts_formatted = sprintf('%02d:%02d:%02d', floor($duration_sec / 3600), floor(($duration_sec % 3600) / 60), $duration_sec % 60);
			}
		}

		$wrong = isset($item['question_wrong']) ? intval($item['question_wrong']) : (isset($item['wrong']) ? intval($item['wrong']) : max(0, $mark - $correct));
		$skipped = isset($item['question_empty']) ? intval($item['question_empty']) : (isset($item['skipped']) ? intval($item['skipped']) : 0);
		$minus = isset($item['minus_point']) ? floatval($item['minus_point']) : (isset($item['minus_points']) ? floatval($item['minus_points']) : 0);

		return [
			'user_item_id'     => $uid,
			'status'           => $item['status'] ?? 'completed',
			'graduation'       => $is_passed ? 'passed' : 'failed',
			'start_time'       => $item['start_time'] ?? null,
			'end_time'         => $item['end_time'] ?? null,
			'time_spent'       => $ts_formatted,
			'questions'        => "{$u_mark} / {$mark}",
			'questions_count'  => $q_count,
			'correct'          => $correct,
			'wrong'            => $wrong,
			'skipped'          => $skipped,
			'minus_points'     => $minus,
			'points'           => "{$u_mark} / {$mark}",
			'user_mark'        => $u_mark,
			'mark'             => $mark,
			'passing_grade'    => $item['passing_grade'] ?? $passing_grade_str,
			'result'           => sprintf('%.2f%%', $score_val),
			'result_num'       => $score_val,
			'results'          => $item['results'] ?? $item,
		];
	};

	$new_attempts_map = [];

	// 1. Nếu có meta_history → map thành các attempt đầy đủ
	if (!empty($meta_history) && is_array($meta_history)) {
		foreach ($meta_history as $h_idx => $h_item) {
			if (!is_array($h_item) && !is_object($h_item)) continue;
			$h_arr = (array)$h_item;
			$h_uid = strval($h_arr['user_item_id'] ?? ($latest_uid . '_h' . $h_idx));
			$mapped_h = $map_single_attempt($h_arr, $h_uid);

			// Bỏ attempt rác (0 điểm + 0 thời gian và không hoàn thành)
			$is_zero_score = ($mapped_h['result_num'] <= 0 && $mapped_h['user_mark'] <= 0);
			$is_zero_time  = empty($mapped_h['time_spent']) || in_array($mapped_h['time_spent'], ['00:00:00', '00:00', '0', '--:--'], true);
			if ($is_zero_score && $is_zero_time && $mapped_h['status'] !== 'completed') {
				continue;
			}

			$new_attempts_map[$h_uid] = $mapped_h;
		}
	}

	// 2. Thêm hoặc merge các attempt từ $attempts_list (bao gồm lần làm mới nhất hiện tại)
	foreach ($attempts_list as $a_idx => $att_item) {
		$uid = strval($att_item['user_item_id'] ?? ($latest_uid . '_a' . $a_idx));
		$mapped_att = $map_single_attempt($att_item, $uid);

		if (isset($new_attempts_map[$uid])) {
			// Đã có trong history: merge nếu $att_item có thông tin tốt hơn
			if ($new_attempts_map[$uid]['result_num'] <= 0 && $mapped_att['result_num'] > 0) {
				$new_attempts_map[$uid]['result_num'] = $mapped_att['result_num'];
				$new_attempts_map[$uid]['result']     = $mapped_att['result'];
			}
			if ($new_attempts_map[$uid]['user_mark'] <= 0 && $mapped_att['user_mark'] > 0) {
				$new_attempts_map[$uid]['user_mark'] = $mapped_att['user_mark'];
				$new_attempts_map[$uid]['correct']   = $mapped_att['correct'];
				$new_attempts_map[$uid]['points']    = $mapped_att['points'];
				$new_attempts_map[$uid]['questions'] = $mapped_att['questions'];
			}
			if ($new_attempts_map[$uid]['time_spent'] === '00:00:00' && $mapped_att['time_spent'] !== '00:00:00') {
				$new_attempts_map[$uid]['time_spent'] = $mapped_att['time_spent'];
			}
		} else {
			// Lần làm mới nhất hoặc record chưa có trong meta history
			$is_zero_score = ($mapped_att['result_num'] <= 0 && $mapped_att['user_mark'] <= 0);
			$is_zero_time  = empty($mapped_att['time_spent']) || in_array($mapped_att['time_spent'], ['00:00:00', '00:00', '0', '--:--'], true);
			if ($is_zero_score && $is_zero_time && $mapped_att['status'] !== 'completed') {
				continue;
			}
			$new_attempts_map[$uid] = $mapped_att;
		}
	}

	if (!empty($new_attempts_map)) {
		$attempts_list = array_values($new_attempts_map);
	}

	// =========================================================
	// FALLBACK MẠNH: nếu vẫn chỉ có <= 1 attempt thì tự build lại
	// từ TẤT CẢ user_items + Result DB (giống custom_build)
	// =========================================================
	if (count($attempts_list) <= 1) {
		$all_rows = $wpdb->get_results($wpdb->prepare(
			"SELECT user_item_id, start_time, end_time, status, graduation
			FROM {$table_items}
			WHERE user_id = %d AND item_id = %d AND item_type = 'lp_quiz'
			ORDER BY user_item_id ASC",
			$user_id, $quiz_id
		));

		$fallback_map = [];
		foreach ((array)$all_rows as $row) {
			$oid = absint($row->user_item_id);
			if (!$oid) continue;

			$old_result = null;
			if (class_exists('LP_User_Items_Result_DB')) {
				$old_result = LP_User_Items_Result_DB::instance()->get_result($oid);
				if (is_string($old_result)) {
					$old_result = json_decode($old_result, true);
				}
			}
			if (!$old_result || !is_array($old_result)) {
				$old_result = learn_press_get_user_item_meta($oid, 'results', true);
				if (is_string($old_result)) {
					$old_result = maybe_unserialize($old_result);
					if (is_string($old_result) && (strpos($old_result, '{') === 0 || strpos($old_result, '[') === 0)) {
						$old_result = json_decode($old_result, true);
					}
				}
			}
			// Thử thêm các key meta khác
			if (!$old_result || !is_array($old_result)) {
				foreach (['_lp_user_item_results', '_lp_results', '_lp_quiz_results'] as $mk) {
					$tmp = learn_press_get_user_item_meta($oid, $mk, true);
					if (is_string($tmp)) {
						$tmp = maybe_unserialize($tmp);
						if (is_string($tmp) && (strpos($tmp, '{') === 0 || strpos($tmp, '[') === 0)) {
							$tmp = json_decode($tmp, true);
						}
					}
					if (is_array($tmp) && !empty($tmp)) {
						$old_result = $tmp;
						break;
					}
				}
			}

			if (!$old_result || !is_array($old_result)) {
				// Vẫn giữ record completed dù không có result chi tiết
				if ($row->status === 'completed') {
					$fallback_map[$oid] = [
						'user_item_id'     => $oid,
						'status'           => 'completed',
						'graduation'       => $row->graduation ?: 'failed',
						'start_time'       => $row->start_time,
						'end_time'         => $row->end_time,
						'time_spent'       => '00:00:00',
						'questions'        => '',
						'questions_count'  => 0,
						'correct'          => 0,
						'wrong'            => 0,
						'skipped'          => 0,
						'points'           => '',
						'user_mark'        => 0,
						'mark'             => 0,
						'passing_grade'    => '80%',
						'result'           => '0.00%',
						'result_num'       => 0,
					];
				}
				continue;
			}

			$r         = floatval($old_result['result'] ?? $old_result['result_num'] ?? 0);
			$user_mark = floatval($old_result['user_mark'] ?? $old_result['correct'] ?? 0);
			$mark      = floatval($old_result['mark'] ?? $old_result['question_count'] ?? 0);
			$q_correct = intval($old_result['question_correct'] ?? $old_result['correct'] ?? $user_mark);
			$q_count   = intval($old_result['question_count'] ?? $old_result['questions_count'] ?? $mark);
			$ts        = trim((string)($old_result['time_spend'] ?? $old_result['time_spent'] ?? ''));

			if (is_numeric($ts)) {
				$sec = intval($ts);
				$ts  = sprintf('%02d:%02d:%02d', floor($sec / 3600), floor(($sec % 3600) / 60), $sec % 60);
			}
			if ($ts === '') {
				// Fallback tính từ start/end
				if ($row->start_time && $row->end_time && $row->end_time !== '0000-00-00 00:00:00') {
					$t1 = is_numeric($row->start_time) ? intval($row->start_time) : strtotime($row->start_time);
					$t2 = is_numeric($row->end_time)   ? intval($row->end_time)   : strtotime($row->end_time);
					if ($t1 && $t2 && $t2 >= $t1) {
						$sec = $t2 - $t1;
						$ts  = sprintf('%02d:%02d:%02d', floor($sec / 3600), floor(($sec % 3600) / 60), $sec % 60);
					} else {
						$ts = '00:00:00';
					}
				} else {
					$ts = '00:00:00';
				}
			}

			// Bỏ attempt rác thật sự
			if ($r <= 0 && $user_mark <= 0 && in_array($ts, ['00:00:00', '00:00', '0', '--:--'], true) && $row->status !== 'completed') {
				continue;
			}

			$pg = $old_result['passing_grade'] ?? '80%';
			if (is_numeric($pg)) $pg = $pg . '%';

			$fallback_map[$oid] = [
				'user_item_id'     => $oid,
				'status'           => $row->status ?: 'completed',
				'graduation'       => $row->graduation ?: (($r >= 80) ? 'passed' : 'failed'),
				'start_time'       => $row->start_time,
				'end_time'         => $row->end_time,
				'time_spent'       => $ts,
				'questions'        => "{$q_correct} / " . ($q_count > 0 ? $q_count : ($mark > 0 ? $mark : 0)),
				'questions_count'  => $q_count > 0 ? $q_count : $mark,
				'correct'          => $q_correct,
				'wrong'            => intval($old_result['question_wrong'] ?? $old_result['wrong'] ?? max(0, ($mark ?: $q_count) - $q_correct)),
				'skipped'          => intval($old_result['question_empty'] ?? $old_result['skipped'] ?? 0),
				'points'           => "{$user_mark} / " . ($mark > 0 ? $mark : $q_count),
				'user_mark'        => $user_mark,
				'mark'             => $mark > 0 ? $mark : $q_count,
				'passing_grade'    => $pg,
				'result'           => sprintf('%.2f%%', $r),
				'result_num'       => $r,
				'results'          => $old_result,
			];
		}

		if (count($fallback_map) > count($attempts_list)) {
			$attempts_list = array_values($fallback_map);
		}
	}

	// Bỏ các attempt started / in-progress
	$attempts_list = array_values(array_filter($attempts_list, function($att) {
		$status = $att['status'] ?? '';
		if ($status === 'started' || $status === 'in-progress') return false;
		return true;
	}));

	// Sort theo user_item_id tăng dần
	usort($attempts_list, function($a, $b) {
		return intval($a['user_item_id']) - intval($b['user_item_id']);
	});

	// Chọn Lượt làm trước đó đã HOÀN THÀNH (Completed) làm last_attempt, tránh việc click Retakes / tạo mới làm đè 0 điểm
	$last_attempt = null;
	$completed_attempts = array_filter($attempts_list, function($att) {
		return (isset($att['status']) && $att['status'] === 'completed') ||
			(isset($att['result_num']) && floatval($att['result_num']) > 0) ||
			(isset($att['user_mark']) && intval($att['user_mark']) > 0);
	});

	if (!empty($completed_attempts)) {
		$last_attempt = end($completed_attempts);
	} else if (!empty($attempts_list)) {
		$last_attempt = end($attempts_list);
	}

	return rest_ensure_response([
		'success'        => true,
		'user_id'        => $user_id,
		'quiz_id'        => $quiz_id,
		'last_attempt'   => $last_attempt,
		'attempts_count' => count($attempts_list),
		'attempts'       => $attempts_list,
	]);
}

/**
 * Build danh sách attempt TRƯỚC lần hiện tại (dùng cho bảng Last Attempt).
 * exclude_user_item_id = user_item_id lần vừa finish (không đưa vào history).
 */
if (!function_exists('custom_build_quiz_previous_attempts_history')) {
	function custom_build_quiz_previous_attempts_history($user_id, $quiz_id, $exclude_user_item_id = 0) {
		global $wpdb;
		$table_ui = $wpdb->prefix . 'learnpress_user_items';

		$exclude_user_item_id = absint($exclude_user_item_id);
		$user_id = absint($user_id);
		$quiz_id = absint($quiz_id);
		if (!$user_id || !$quiz_id) return [];

		$sql = "SELECT user_item_id, start_time, end_time, status, graduation
		        FROM {$table_ui}
		        WHERE user_id = %d AND item_id = %d AND item_type = 'lp_quiz'";
		$params = [$user_id, $quiz_id];
		if ($exclude_user_item_id > 0) {
			$sql .= " AND user_item_id < %d";
			$params[] = $exclude_user_item_id;
		}
		$sql .= " ORDER BY user_item_id ASC";

		$rows = $wpdb->get_results($wpdb->prepare($sql, $params));
		if (empty($rows)) return [];

		$pg_val = get_post_meta($quiz_id, '_lp_passing_grade', true);
		if ($pg_val === '' || $pg_val === null) {
			$pg_val = get_post_meta($quiz_id, '_lp_passing_condition', true);
		}
		$passing_grade_str = ($pg_val !== '' && $pg_val !== null)
			? (is_numeric($pg_val) ? "{$pg_val}%" : strval($pg_val))
			: '';

		$history = [];
		$seen = [];

		foreach ($rows as $row) {
			$oid = absint($row->user_item_id);
			if (!$oid || isset($seen[$oid])) continue;

			$old_result = null;
			if (class_exists('LP_User_Items_Result_DB')) {
				$old_result = LP_User_Items_Result_DB::instance()->get_result($oid);
				if (is_string($old_result)) {
					$old_result = json_decode($old_result, true);
				}
			}
			if (!$old_result || !is_array($old_result)) {
				$old_result = learn_press_get_user_item_meta($oid, 'results', true);
			}
			if (!$old_result || !is_array($old_result)) {
				continue;
			}

			$r         = floatval($old_result['result'] ?? 0);
			$user_mark = floatval($old_result['user_mark'] ?? 0);
			$mark      = floatval($old_result['mark'] ?? $old_result['question_count'] ?? 0);
			$q_correct = intval($old_result['question_correct'] ?? $user_mark);
			$q_count   = intval($old_result['question_count'] ?? $mark);
			$ts        = trim((string)($old_result['time_spend'] ?? $old_result['time_spent'] ?? ''));

			// Bỏ attempt rác (0 điểm + 0 thời gian)
			$is_zero_score = ($r <= 0 && $user_mark <= 0);
			$is_zero_time  = empty($ts) || in_array($ts, ['00:00:00', '00:00', '0', '--:--'], true);
			if ($is_zero_score && $is_zero_time) {
				continue;
			}

			if (is_numeric($ts)) {
				$sec = intval($ts);
				$ts  = sprintf('%02d:%02d:%02d', floor($sec / 3600), floor(($sec % 3600) / 60), $sec % 60);
			}
			if ($ts === '') $ts = '00:00:00';

			$pg = $old_result['passing_grade'] ?? $passing_grade_str;
			$graduation = $row->graduation
				?: (($r >= floatval($pg_val ?: 80) || !empty($old_result['pass'])) ? 'passed' : 'failed');

			$item = array_merge($old_result, [
				'user_item_id'       => $oid,
				'status'             => 'completed',
				'graduation'         => $graduation,
				'start_time'         => $row->start_time,
				'end_time'           => $row->end_time,
				'result'             => $r,
				'user_mark'          => $user_mark,
				'mark'               => $mark,
				'time_spend'         => $ts,
				'time_spent'         => $ts,
				'question_count'     => $q_count,
				'question_correct'   => $q_correct,
				'passing_grade'      => $pg,
				'pass'               => ($graduation === 'passed') ? 1 : 0,
				// Field theme WP hay dùng cho cột bảng
				'questions'          => "{$q_correct} / " . ($q_count > 0 ? $q_count : $mark),
				'points'             => "{$user_mark} / " . ($mark > 0 ? $mark : $q_count),
			]);

			$history[] = $item;
			$seen[$oid] = true;
		}

		return array_values($history);
	}
}

/**
 * Ghi history vào current + parent + mọi record cũ
 */
if (!function_exists('custom_write_quiz_attempts_history')) {
	function custom_write_quiz_attempts_history($user_id, $quiz_id, $course_id, $current_user_item_id, $attempts_history) {
		global $wpdb;
		$table_ui = $wpdb->prefix . 'learnpress_user_items';

		$keys = [
			'attempts',
			'_attempts',
			'_lp_quiz_retake_items',
			'_lp_retake_items',
			'_lp_user_item_retakes',
		];

		$current_user_item_id = absint($current_user_item_id);
		$user_id = absint($user_id);
		$quiz_id = absint($quiz_id);
		$course_id = absint($course_id);

		// 1) Current
		if ($current_user_item_id > 0) {
			foreach ($keys as $key) {
				learn_press_update_user_item_meta($current_user_item_id, $key, $attempts_history);
			}
		}

		// 2) Parent (course user_item)
		$parent_id = 0;
		if ($current_user_item_id > 0) {
			$parent_id = intval($wpdb->get_var($wpdb->prepare(
				"SELECT parent_id FROM {$table_ui} WHERE user_item_id = %d",
				$current_user_item_id
			)));
		}
		if ($parent_id <= 0 && $course_id > 0) {
			$parent_id = intval($wpdb->get_var($wpdb->prepare(
				"SELECT user_item_id FROM {$table_ui}
				 WHERE user_id = %d AND item_id = %d AND item_type = 'lp_course'
				 ORDER BY user_item_id DESC LIMIT 1",
				$user_id, $course_id
			)));
		}
		if ($parent_id > 0) {
			foreach ($keys as $key) {
				learn_press_update_user_item_meta($parent_id, $key, $attempts_history);
			}
		}

		// 3) Mọi record quiz cũ + ép completed
		$old_ids = $wpdb->get_col($wpdb->prepare(
			"SELECT user_item_id FROM {$table_ui}
			 WHERE user_id = %d AND item_id = %d AND item_type = 'lp_quiz'
			   AND user_item_id != %d
			 ORDER BY user_item_id ASC",
			$user_id, $quiz_id, $current_user_item_id
		));
		foreach ($old_ids as $oid) {
			$oid = absint($oid);
			$wpdb->update($table_ui, ['status' => 'completed'], ['user_item_id' => $oid], ['%s'], ['%d']);
			foreach ($keys as $key) {
				learn_press_update_user_item_meta($oid, $key, $attempts_history);
			}
		}
	}
}

// Hook tự động đồng bộ khi hoàn thành bài Quiz từ giao diện WordPress LearnPress
add_action('learn-press/user/quiz-finished', 'custom_sync_lp_native_quiz_finished', 10, 4);
add_action('learn_press_user_finish_quiz', 'custom_sync_lp_native_quiz_finished', 10, 4);
add_action('learn-press/quiz/finished', 'custom_sync_lp_native_quiz_finished', 10, 4);

function custom_sync_lp_native_quiz_finished($item_id_or_user_item_id, $quiz_id = 0, $course_id = 0, $user_id = 0) {
	global $wpdb;
	$user_item_id = intval($item_id_or_user_item_id);
	if (!$user_item_id) return;

	$table_ui  = $wpdb->prefix . 'learnpress_user_items';
	$table_uim = $wpdb->prefix . 'learnpress_user_itemmeta';

	$ui = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$table_ui} WHERE user_item_id = %d", $user_item_id));
	if (!$ui || $ui->item_type !== 'lp_quiz') return;

	$quiz_id   = $quiz_id   ?: intval($ui->item_id);
	$course_id = $course_id ?: intval($ui->ref_id);
	$user_id   = $user_id   ?: intval($ui->user_id);


	// Sau dòng: $user_id   = $user_id   ?: intval($ui->user_id);
	// ===== Force sync kết quả từ Result DB (nguồn chính của LP 4.x) vào meta =====
	try {
		$current_results = null;

		// Ưu tiên lấy từ bảng learnpress_user_item_results
		if (class_exists('LP_User_Items_Result_DB')) {
			$current_results = LP_User_Items_Result_DB::instance()->get_result($user_item_id);
			if (is_string($current_results)) {
				$current_results = json_decode($current_results, true);
			}
		}

		// Fallback get_results của object
		if (empty($current_results) || !is_array($current_results)) {
			if (function_exists('learn_press_get_user_item')) {
				$user_item_quiz = learn_press_get_user_item($user_item_id);
				if ($user_item_quiz && method_exists($user_item_quiz, 'get_results')) {
					$current_results = $user_item_quiz->get_results('');
				}
			}
		}

		if (is_array($current_results) && !empty($current_results)) {
			// Bổ sung time_spend nếu thiếu
			$has_time = !empty($current_results['time_spend']) || !empty($current_results['time_spent']);
			if (!$has_time && $ui->start_time && $ui->end_time && $ui->end_time !== '0000-00-00 00:00:00') {
				$t_start = is_numeric($ui->start_time) ? intval($ui->start_time) : strtotime($ui->start_time);
				$t_end   = is_numeric($ui->end_time)   ? intval($ui->end_time)   : strtotime($ui->end_time);
				if ($t_start && $t_end && $t_end >= $t_start) {
					$sec = $t_end - $t_start;
					$ts_str = sprintf('%02d:%02d:%02d', floor($sec / 3600), floor(($sec % 3600) / 60), $sec % 60);
					$current_results['time_spend'] = $ts_str;
					$current_results['time_spent'] = $sec;
				}
			}

			// Ghi đè meta để Next.js đọc được
			$res_serialized = serialize($current_results);
			$res_json       = json_encode($current_results, JSON_UNESCAPED_UNICODE);

			$wpdb->query($wpdb->prepare(
				"DELETE FROM {$table_uim} WHERE learnpress_user_item_id = %d AND meta_key IN ('results', '_lp_user_item_results', '_lp_results', '_lp_quiz_results')",
				$user_item_id
			));
			$wpdb->insert($table_uim, [
				'learnpress_user_item_id' => $user_item_id,
				'meta_key'                => 'results',
				'meta_value'              => $res_serialized,
			]);
			$wpdb->insert($table_uim, [
				'learnpress_user_item_id' => $user_item_id,
				'meta_key'                => '_lp_user_item_results',
				'meta_value'              => $res_json,
			]);

			// Cập nhật thêm time_spend riêng
			if (!empty($current_results['time_spend'])) {
				learn_press_update_user_item_meta($user_item_id, 'time_spend', $current_results['time_spend']);
			}
		}
	} catch (Throwable $e) {}
	
	$attempts_history = custom_build_quiz_previous_attempts_history($user_id, $quiz_id, $user_item_id);
	error_log('[custom_sync] quiz finished user_item_id=' . $user_item_id . ' quiz_id=' . $quiz_id . ' history_count=' . count($attempts_history));
	custom_write_quiz_attempts_history($user_id, $quiz_id, $course_id, $user_item_id, $attempts_history);


	
}

/**
 * 8. Console.log Logged-in User Info & Quiz Results (Current & Recent Attempts) on lp_quiz detail page
 */

add_action('wp_footer', 'log_user_lp_quiz_attempt_console');
function log_user_lp_quiz_attempt_console() {
	$quiz_id = 0;

	if (is_singular('lp_quiz')) {
		$quiz_id = get_the_ID();
	} elseif (function_exists('learn_press_get_course_item')) {
		$item = learn_press_get_course_item();
		if ($item && method_exists($item, 'get_id')) {
			$item_id = $item->get_id();
			if (get_post_type($item_id) === 'lp_quiz') {
				$quiz_id = $item_id;
			}
		}
	}

	if (!$quiz_id) {
		$uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
		if (strpos($uri, '/quizzes/') !== false) {
			$url_path = trim(parse_url($uri, PHP_URL_PATH), '/');
			$parts    = explode('/', $url_path);
			$q_idx    = array_search('quizzes', $parts);
			if ($q_idx !== false && isset($parts[$q_idx + 1])) {
				$quiz_slug = sanitize_title($parts[$q_idx + 1]);
				global $wpdb;
				$quiz_id_db = $wpdb->get_var($wpdb->prepare(
					"SELECT ID FROM {$wpdb->posts} WHERE post_name = %s AND post_type = 'lp_quiz' LIMIT 1",
					$quiz_slug
				));
				if ($quiz_id_db) {
					$quiz_id = intval($quiz_id_db);
				}
			}
		}
	}

	if (!$quiz_id) return;

	$is_logged_in = is_user_logged_in();
	$current_user = wp_get_current_user();
	$user_id      = isset($_GET['user_id']) ? intval($_GET['user_id']) : ($is_logged_in ? $current_user->ID : 0);
	$attempts_list = [];

	if ($user_id && $quiz_id) {
		global $wpdb;
		$table_items    = $wpdb->prefix . 'learnpress_user_items';
		$table_itemmeta = $wpdb->prefix . 'learnpress_user_itemmeta';

		if ($wpdb->get_var("SHOW TABLES LIKE '{$table_items}'") === $table_items) {
			$user_items = $wpdb->get_results($wpdb->prepare(
				"SELECT user_item_id, start_time, end_time, status, graduation, ref_id 
				FROM {$table_items} 
				WHERE user_id = %d AND item_id = %d AND item_type = 'lp_quiz' 
				ORDER BY user_item_id ASC",
				$user_id, $quiz_id
			));

			if (!empty($user_items)) {
				foreach ($user_items as $u_item) {
					$item_id   = intval($u_item->user_item_id);
					$meta_rows = $wpdb->get_results($wpdb->prepare(
						"SELECT meta_key, meta_value FROM {$table_itemmeta} WHERE learnpress_user_item_id = %d",
						$item_id
					));

					$meta = [];
					foreach ($meta_rows as $row) {
						$meta[$row->meta_key] = maybe_unserialize($row->meta_value);
					}

					// 1. Thêm lượt làm hiện tại vào danh sách
					$res_data = null;
					if (isset($meta['results'])) {
						$raw_res = $meta['results'];
						if (is_string($raw_res)) {
							$raw_res = maybe_unserialize($raw_res);
							if (is_string($raw_res) && (strpos($raw_res, '{') === 0 || strpos($raw_res, '[') === 0)) {
								$raw_res = json_decode($raw_res, true);
							}
						}
						if (is_array($raw_res)) {
							$res_data = $raw_res;
						}
					}

					$attempts_list[] = [
						'user_item_id' => $u_item->user_item_id,
						'status'       => $u_item->status,
						'graduation'   => $u_item->graduation ? $u_item->graduation : (isset($meta['grade']) ? $meta['grade'] : 'completed'),
						'start_time'   => $u_item->start_time,
						'end_time'     => $u_item->end_time,
						'results'      => $res_data ? $res_data : (isset($meta['results']) ? $meta['results'] : null),
					];

					// 2. BỔ SUNG: Giải nén các lần Retake cũ từ Meta Data của LearnPress
					$retake_keys = ['_lp_quiz_retake_items', '_lp_retake_items', '_lp_user_item_retakes', '_lp_retake_results'];
					foreach ($retake_keys as $r_key) {
						if (isset($meta[$r_key])) {
							$raw_retakes = $meta[$r_key];
							if (is_string($raw_retakes)) {
								$raw_retakes = maybe_unserialize($raw_retakes);
							}
							if (is_array($raw_retakes)) {
								foreach ($raw_retakes as $r_idx => $r_item) {
									$r_arr = (array)$r_item;
									$attempts_list[] = [
										'user_item_id' => isset($r_arr['user_item_id']) ? $r_arr['user_item_id'] : ($u_item->user_item_id . '_retake_' . $r_idx),
										'status'       => isset($r_arr['status']) ? $r_arr['status'] : 'completed',
										'graduation'   => isset($r_arr['graduation']) ? $r_arr['graduation'] : 'completed',
										'start_time'   => isset($r_arr['start_time']) ? $r_arr['start_time'] : $u_item->start_time,
										'end_time'     => isset($r_arr['end_time']) ? $r_arr['end_time'] : $u_item->end_time,
										'results'      => $r_arr,
									];
								}
							}
						}
					}
				}
			}
		}
	}

	$log_payload = [
		'is_logged_in' => $is_logged_in,
		'user' => $is_logged_in ? [
			'id'           => $current_user->ID,
			'user_login'   => $current_user->user_login,
			'user_email'   => $current_user->user_email,
			'display_name' => $current_user->display_name,
			'roles'        => $current_user->roles,
		] : 'User is not logged in',
		'quiz' => [
			'id'    => $quiz_id,
			'title' => get_the_title($quiz_id),
			'slug'  => get_post_field('post_name', $quiz_id),
		],
		'attempts_count' => count($attempts_list),
		'attempts'       => $attempts_list,
	];
?>
<script type="text/javascript">
	(function() {
		var payload = <?php echo json_encode($log_payload); ?>;
		console.group("%c[WordPress LearnPress Quiz Attempts Log]", "background: #10b981; color: #ffffff; font-weight: bold; padding: 4px 8px; border-radius: 4px;");
		console.log("Quiz Info:", payload.quiz);
		console.log("User Info:", payload.user);
		if (payload.attempts && payload.attempts.length > 0) {
			console.log("Tổng số lần làm bài (Attempts Count):", payload.attempts.length);
			payload.attempts.forEach(function(att, idx) {
				console.log("%cLần thứ " + (idx + 1) + " (Attempt " + (idx + 1) + "):", "color: #0284c7; font-weight: bold;", att);
			});
		} else {
			console.log("Chưa có lượt làm bài nào cho Quiz này.");
		}
		console.groupEnd();
	})();
</script>
<?php
}

// 1. Đổi permalink của Quiz để WordPress trả về đúng đường dẫn NextJS
add_filter('post_type_link', 'custom_lp_quiz_permalink', 10, 2);
function custom_lp_quiz_permalink($post_link, $post) {
	if ($post->post_type === 'lp_quiz') {
		$course_id = function_exists('learn_press_get_item_course') ? learn_press_get_item_course($post->ID) : 0;
		if ($course_id) {
			$course = get_post($course_id);
			if ($course) {
				return home_url("/courses/{$course->post_name}/quizzes/{$post->post_name}/");
			}
		}
	}
	return $post_link;
}

// 2. Thêm Rewrite Rules cho WordPress nhận diện URL này
add_action('init', 'custom_lp_quiz_rewrite_rules');
function custom_lp_quiz_rewrite_rules() {
	add_rewrite_rule(
		'^courses/([^/]+)/quizzes/([^/]+)/?$',
		'index.php?post_type=lp_quiz&name=$matches[2]',
		'top'
	);
}

// 3. Tự động bật REST API (show_in_rest = true) cho lp_quiz & lp_question trong WP REST API
add_filter('register_post_type_args', 'custom_enable_lp_cpt_rest_api', 10, 2);
function custom_enable_lp_cpt_rest_api($args, $post_type) {
	if (in_array($post_type, ['lp_quiz', 'lp_question', 'lp_course', 'lp_lesson'], true)) {
		$args['show_in_rest'] = true;
	}
	return $args;
}

// 4. REST API Endpoint lấy toàn bộ danh sách lp_quiz và lp_question cho Next.js
add_action('rest_api_init', function () {
	// GET /wp-json/custom/v1/lp-quizzes
	register_rest_route('custom/v1', '/lp-quizzes', [
		'methods'             => 'GET',
		'callback'            => 'handle_get_all_lp_quizzes',
		'permission_callback' => '__return_true',
	]);

	// GET /wp-json/custom/v1/lp-questions
	register_rest_route('custom/v1', '/lp-questions', [
		'methods'             => 'GET',
		'callback'            => 'handle_get_all_lp_questions',
		'permission_callback' => '__return_true',
	]);
});

function handle_get_all_lp_quizzes($request) {
	global $wpdb;
	$posts = get_posts([
		'post_type'      => 'lp_quiz',
		'posts_per_page' => -1,
		'post_status'    => 'publish',
	]);

	$quizzes = [];
	foreach ($posts as $post) {
		$quiz_id = $post->ID;
		$duration = get_post_meta($quiz_id, '_lp_duration', true);
		$passing_grade = get_post_meta($quiz_id, '_lp_passing_grade', true);
		$re_take = get_post_meta($quiz_id, '_lp_retake_count', true);

		// Đếm số câu hỏi từ DB
		$table_qq = $wpdb->prefix . 'learnpress_quiz_questions';
		$q_count = 0;
		if ($wpdb->get_var("SHOW TABLES LIKE '{$table_qq}'") === $table_qq) {
			$q_count = intval($wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$table_qq} WHERE quiz_id = %d", $quiz_id)));
		}

		$quizzes[] = [
			'id'              => $quiz_id,
			'title'           => $post->post_title,
			'slug'            => $post->post_name,
			'content'         => $post->post_content,
			'duration'        => $duration ? $duration : '10 mins',
			'passing_grade'   => $passing_grade ? $passing_grade : '80%',
			'retake_count'    => $re_take ? intval($re_take) : 0,
			'questions_count' => $q_count,
			'date_created'    => $post->post_date,
		];
	}

	return rest_ensure_response([
		'success' => true,
		'count'   => count($quizzes),
		'quizzes' => $quizzes,
	]);
}

function handle_get_all_lp_questions($request) {
	global $wpdb;
	$posts = get_posts([
		'post_type'      => 'lp_question',
		'posts_per_page' => -1,
		'post_status'    => 'publish',
	]);

	$questions = [];
	foreach ($posts as $idx => $post) {
		$qid = $post->ID;
		$q_type = get_post_meta($qid, '_lp_type', true);
		if (!$q_type) $q_type = 'single_choice';

		$options = [];
		$correct_indices = [];

		$table_qa = $wpdb->prefix . 'learnpress_question_answers';
		if ($wpdb->get_var("SHOW TABLES LIKE '{$table_qa}'") === $table_qa) {
			$answers = $wpdb->get_results($wpdb->prepare(
				"SELECT * FROM {$table_qa} WHERE question_id = %d ORDER BY answer_order ASC, question_answer_id ASC",
				$qid
			));
			if (!empty($answers)) {
				foreach ($answers as $ans) {
					$ans_title = '';
					$ans_is_true = isset($ans->is_true) && ($ans->is_true === 'yes' || $ans->is_true === '1' || $ans->is_true === 1 || $ans->is_true === true);
					if (isset($ans->answer_data) && !empty($ans->answer_data)) {
						$a_data = maybe_unserialize($ans->answer_data);
						if (is_array($a_data) || is_object($a_data)) {
							$a_data = (array)$a_data;
							$ans_title = isset($a_data['title']) ? $a_data['title'] : (isset($a_data['value']) ? $a_data['value'] : '');
						}
					}
					if (empty($ans_title) && isset($ans->title)) $ans_title = $ans->title;
					$ans_title = html_entity_decode(wp_strip_all_tags(strval($ans_title)), ENT_QUOTES | ENT_HTML5, 'UTF-8');
					if ($ans_title !== '') {
						$options[] = $ans_title;
						if ($ans_is_true) $correct_indices[] = count($options) - 1;
					}
				}
			}
		}

		if (($q_type === 'true_or_false' || $q_type === 'true_false') && empty($options)) {
			$options = ['True', 'False'];
			$tf_correct = get_post_meta($qid, '_true_false', true);
			$correct_indices = ($tf_correct === 'false' || $tf_correct === 'no' || $tf_correct === '0') ? [1] : [0];
		}

		$questions[] = [
			'id'          => $qid,
			'title'       => $post->post_title,
			'type'        => $q_type,
			'options'     => $options,
			'correct'     => ($q_type === 'multi_choice' || $q_type === 'multiple_choice') ? $correct_indices : (!empty($correct_indices) ? $correct_indices[0] : 0),
			'explanation' => get_post_meta($qid, '_lp_explanation', true),
		];
	}

	return rest_ensure_response([
		'success'   => true,
		'count'     => count($questions),
		'questions' => $questions,
	]);
}

// 6. REST API Endpoint submit quiz result từ NextJS → WordPress LearnPress DB
add_action('rest_api_init', function () {
	register_rest_route('custom/v1', '/submit-quiz', [
		'methods'             => 'POST',
		'callback'            => 'custom_lp_submit_quiz',
		'permission_callback' => '__return_true',
	]);
});

function custom_lp_submit_quiz(WP_REST_Request $request) {
	$p = $request->get_json_params();
	$user_id   = absint($p['user_id'] ?? 0);
	$quiz_id   = absint($p['quiz_id'] ?? 0);
	$course_id = absint($p['course_id'] ?? 0);
	$answered  = (array) ($p['answers'] ?? []);
	$questions_detail = (array) ($p['questions_detail'] ?? []);
	$graduation = sanitize_text_field($p['graduation'] ?? 'failed');
	$result_percent = floatval($p['result'] ?? 0);
	$user_mark = floatval($p['user_mark'] ?? 0);
	$total_mark = floatval($p['total_mark'] ?? 0);
	$time_spent = sanitize_text_field($p['time_spent'] ?? '');
	$time_spent_seconds = absint($p['time_spent_seconds'] ?? 0);
	$correct = absint($p['correct'] ?? 0);
	$wrong = absint($p['wrong'] ?? 0);
	$skipped = absint($p['skipped'] ?? 0);

	if (!$user_id || !$quiz_id) {
		return new WP_REST_Response(['success' => false, 'message' => 'Thiếu user_id hoặc quiz_id'], 400);
	}
	if (!function_exists('learn_press_get_user')) {
		return new WP_REST_Response(['success' => false, 'message' => 'LearnPress chưa kích hoạt'], 500);
	}

	$user = learn_press_get_user($user_id);
	if (!$user) {
		return new WP_REST_Response(['success' => false, 'message' => 'User không tồn tại'], 404);
	}
	if (!$course_id) {
		$course_id = learn_press_get_item_course_id($quiz_id, 'lp_quiz');
	}
	if (!$course_id) {
		return new WP_REST_Response(['success' => false, 'message' => 'Không tìm thấy course_id'], 400);
	}

	global $wpdb;
	$table = $wpdb->prefix . 'learnpress_user_items';

	// ===== Helper: map answer (index/title/"true") → LP option value =====
	$map_answer_to_lp_value = function ($question_id, $raw_ans) use ($wpdb) {
		if ($raw_ans === null || $raw_ans === '') return null;

		// Lấy options thật từ DB
		$answers_table = $wpdb->prefix . 'learnpress_question_answers';
		$meta_table    = $wpdb->prefix . 'learnpress_question_answermeta';

		$rows = $wpdb->get_results($wpdb->prepare(
			"SELECT qa.question_answer_id,
			MAX(CASE WHEN qam.meta_key = 'value' THEN qam.meta_value END) as value,
			MAX(CASE WHEN qam.meta_key = 'title' THEN qam.meta_value END) as title,
			MAX(CASE WHEN qam.meta_key = 'text' THEN qam.meta_value END) as text,
			MAX(CASE WHEN qam.meta_key = 'is_true' THEN qam.meta_value END) as is_true
		FROM {$answers_table} qa
		LEFT JOIN {$meta_table} qam ON qam.learnpress_question_answer_id = qa.question_answer_id
		WHERE qa.question_id = %d
		GROUP BY qa.question_answer_id
		ORDER BY qa.answer_order ASC, qa.question_answer_id ASC",
			$question_id
		));

		// Fallback LP_Question object
		if (empty($rows) && function_exists('learn_press_get_question')) {
			$q = learn_press_get_question($question_id);
			if ($q) {
				$list = [];
				foreach ($q->get_answers() as $opt) {
					$data = method_exists($opt, 'get_data') ? $opt->get_data() : (array) $opt;
					$list[] = (object) [
						'value'   => $data['value'] ?? '',
						'title'   => $data['title'] ?? ($data['text'] ?? ''),
						'is_true' => $data['is_true'] ?? '',
					];
				}
				$rows = $list;
			}
		}

		if (empty($rows)) {
			// Fallback cuối cho true/false
			if ($raw_ans === 0 || $raw_ans === '0' || $raw_ans === true || $raw_ans === 'true' || $raw_ans === 'True') return 'true';
			if ($raw_ans === 1 || $raw_ans === '1' || $raw_ans === false || $raw_ans === 'false' || $raw_ans === 'False') return 'false';
			return is_array($raw_ans) ? $raw_ans : (string) $raw_ans;
		}

		// multi_choice
		if (is_array($raw_ans)) {
			$mapped = [];
			foreach ($raw_ans as $one) {
				$idx = 0;
				foreach ($rows as $row) {
					$val   = $row->value ?? '';
					$title = $row->title ?? ($row->text ?? '');
					if ((string)$one === (string)$idx
						|| (string)$one === (string)$val
						|| strcasecmp((string)$one, (string)$title) === 0
						|| (strtolower((string)$one) === 'true' && strtolower($title) === 'true')
						|| (strtolower((string)$one) === 'false' && strtolower($title) === 'false')
					   ) {
						if ($val !== '') $mapped[] = $val;
						break;
					}
					$idx++;
				}
			}
			return $mapped;
		}

		// single / true_or_false: map theo index, value, title
		$idx = 0;
		foreach ($rows as $row) {
			$val   = $row->value ?? '';
			$title = $row->title ?? ($row->text ?? '');
			$match = (
				(string)$raw_ans === (string)$idx
				|| (string)$raw_ans === (string)$val
				|| strcasecmp((string)$raw_ans, (string)$title) === 0
				|| (strtolower((string)$raw_ans) === 'true'  && (strtolower($title) === 'true'  || $val === 'true'))
				|| (strtolower((string)$raw_ans) === 'false' && (strtolower($title) === 'false' || $val === 'false'))
			);
			if ($match) {
				return $val !== '' ? $val : (string)$raw_ans;
			}
			$idx++;
		}

		return (string) $raw_ans;
	};

	// ===== Chuẩn hóa answers =====
	// ===== Map answers → LP value hash (giữ nguyên helper $map_answer_to_lp_value) =====
	$lp_answered = [];
	foreach ($answered as $qid => $ans) {
		$qid = absint($qid);
		if (!$qid) continue;
		$lp_answered[$qid] = $map_answer_to_lp_value($qid, $ans);
	}
	foreach ($questions_detail as $qid => $detail) {
		$qid = absint($qid);
		if (!$qid || isset($lp_answered[$qid])) continue;
		$lp_answered[$qid] = $map_answer_to_lp_value($qid, $detail['answered'] ?? null);
	}

	// ===== user_item =====
	// Luôn tạo attempt MỚI (giống Retake của LearnPress)
	$time_spent_seconds = absint($p['time_spent_seconds'] ?? 0);
	if ($time_spent_seconds <= 0 && !empty($time_spent)) {
		$parts = array_map('intval', explode(':', $time_spent));
		if (count($parts) === 3) {
			$time_spent_seconds = $parts[0] * 3600 + $parts[1] * 60 + $parts[2];
		} elseif (count($parts) === 2) {
			$time_spent_seconds = $parts[0] * 60 + $parts[1];
		}
	}
	$end_ts   = current_time('timestamp');
	$start_ts = $end_ts - max($time_spent_seconds, 1);

	// Tìm hoặc tự động tạo parent_id (user_item_id của course record)
	$parent_id = 0;
	if ($course_id) {
		$course_item = $wpdb->get_row($wpdb->prepare(
			"SELECT user_item_id FROM {$table}
			WHERE user_id = %d AND item_id = %d AND item_type = 'lp_course'
			ORDER BY user_item_id DESC LIMIT 1",
			$user_id,
			$course_id
		));
		if ($course_item) {
			$parent_id = intval($course_item->user_item_id);
		} else {
			$now_time = current_time('mysql');
			$wpdb->insert($table, [
				'user_id'    => $user_id,
				'item_id'    => $course_id,
				'start_time' => $now_time,
				'item_type'  => 'lp_course',
				'status'     => 'enrolled',
				'graduation' => 'in-progress',
			]);
			$parent_id = intval($wpdb->insert_id);
		}
	}

	$wpdb->insert($table, [
		'user_id'    => $user_id,
		'item_id'    => $quiz_id,
		'item_type'  => 'lp_quiz',
		'parent_id'  => $parent_id,
		'ref_id'     => $course_id,
		'ref_type'   => 'lp_course',
		'status'     => 'completed',
		'graduation' => ($graduation === 'passed') ? 'passed' : 'failed',
		'start_time' => date('Y-m-d H:i:s', $start_ts),
		'end_time'   => date('Y-m-d H:i:s', $end_ts),
	]);
	$user_item_id = $wpdb->insert_id;

	if (!$user_item_id) {
		return new WP_REST_Response(['success' => false, 'message' => 'Không tạo được user_item'], 500);
	}

	// Cập nhật parent_id cho các bản ghi mồ côi cũ của quiz này
	if ($parent_id > 0) {
		$wpdb->query($wpdb->prepare(
			"UPDATE {$table} SET parent_id = %d, ref_id = %d, ref_type = 'lp_course'
			WHERE user_id = %d AND item_id = %d AND item_type = 'lp_quiz' AND (parent_id = 0 OR parent_id IS NULL)",
			$parent_id, $course_id, $user_id, $quiz_id
		));
	}

	// ===== Build result – ƯU TIÊN điểm từ Next.js =====
	$grade = ($graduation === 'passed') ? 'passed' : 'failed';
	$pass  = ($grade === 'passed') ? 1 : 0;

	$result_data = [
		'questions'          => [],
		'mark'               => $total_mark > 0 ? $total_mark : 4,
		'user_mark'          => $user_mark,
		'question_count'     => $total_mark > 0 ? $total_mark : 4,
		'question_correct'   => $correct,
		'question_wrong'     => $wrong,
		'question_empty'     => $skipped,
		'question_answered'  => $correct + $wrong,
		'status'             => 'completed',
		'grade'              => $grade,
		'result'             => $result_percent,   // 75 từ Next.js
		'pass'               => $pass,
		'time_spend'         => $time_spent,
		'passing_grade'      => is_numeric(get_post_meta($quiz_id, '_lp_passing_grade', true)) 
		? get_post_meta($quiz_id, '_lp_passing_grade', true) . '%' 
		: (get_post_meta($quiz_id, '_lp_passing_grade', true) ?: '80%'),  // ← THÊM
	];

	// Gắn answered (hash) + đúng/sai từ Next.js
	foreach ($lp_answered as $qid => $ans) {
		$detail = $questions_detail[$qid] ?? $questions_detail[(string)$qid] ?? [];
		$is_correct = !empty($detail['correct']);
		$result_data['questions'][$qid] = [
			'answered'  => $ans,
			'correct'   => $is_correct,
			'mark'      => isset($detail['mark']) ? floatval($detail['mark']) : 1,
			'user_mark' => isset($detail['user_mark']) ? floatval($detail['user_mark']) : ($is_correct ? 1 : 0),
		];
	}

	// Lưu results
	if (class_exists('LP_User_Items_Result_DB')) {
		LP_User_Items_Result_DB::instance()->update($user_item_id, wp_json_encode($result_data));
	} else {
		learn_press_update_user_item_meta($user_item_id, 'results', $result_data);
	}


	$attempts_history = custom_build_quiz_previous_attempts_history($user_id, $quiz_id, $user_item_id);
	custom_write_quiz_attempts_history($user_id, $quiz_id, $course_id, $user_item_id, $attempts_history);

	// Meta answers để review tick radio


	// Meta answers để review tick radio
	learn_press_update_user_item_meta($user_item_id, 'question_answers', $lp_answered);
	learn_press_update_user_item_meta($user_item_id, '_question_answers', $lp_answered);
	learn_press_update_user_item_meta($user_item_id, 'grade', $grade);
	// 	if ($time_spent) {
	// 		learn_press_update_user_item_meta($user_item_id, 'time_spend', $time_spent);
	// 	}

	// Update user_items
	// Tính start/end theo time_spent_seconds để LP hiển thị đúng
	$time_spent_seconds = absint($p['time_spent_seconds'] ?? 0);
	if ($time_spent_seconds <= 0 && !empty($time_spent)) {
		$parts = array_map('intval', explode(':', $time_spent));
		if (count($parts) === 3) {
			$time_spent_seconds = $parts[0] * 3600 + $parts[1] * 60 + $parts[2];
		} elseif (count($parts) === 2) {
			$time_spent_seconds = $parts[0] * 60 + $parts[1];
		}
	}

	$end_ts   = current_time('timestamp');
	$start_ts = $end_ts - max($time_spent_seconds, 1);
	$start_mysql = date('Y-m-d H:i:s', $start_ts);
	$end_mysql   = date('Y-m-d H:i:s', $end_ts);

	$h = floor($time_spent_seconds / 3600);
	$m = floor(($time_spent_seconds % 3600) / 60);
	$s = $time_spent_seconds % 60;
	$time_spend_formatted = sprintf('%02d:%02d:%02d', $h, $m, $s);

	$wpdb->update(
		$table,
		[
			'status'     => 'completed',
			'graduation' => $grade,
			'start_time' => $start_mysql,
			'end_time'   => $end_mysql,
		],
		['user_item_id' => $user_item_id],
		['%s', '%s', '%s', '%s'],
		['%d']
	);

	learn_press_update_user_item_meta($user_item_id, 'time_spend', $time_spend_formatted);

	// complete() nếu có
	try {
		$user_quiz = $user->get_item_data($quiz_id, $course_id);
		if ($user_quiz) {
			if (method_exists($user_quiz, 'set_graduation')) {
				$user_quiz->set_graduation($grade);
			}
			if (method_exists($user_quiz, 'complete')) {
				$user_quiz->complete();
			}
		}
	} catch (Throwable $e) {}

	do_action('learn-press/user/quiz-finished', $quiz_id, $course_id, $user_id);

	return new WP_REST_Response([
		'success'      => true,
		'user_item_id' => $user_item_id,
		'graduation'   => $grade,
		'result'       => $result_percent,
		'answered'     => $lp_answered,
		'message'      => 'Nộp bài thành công',
	], 200);
}

function handle_submit_quiz_result($request) {
	try {
		global $wpdb;

		$body       = $request->get_json_params();
		$user_id    = isset($body['user_id']) ? intval($body['user_id']) : 0;
		$raw_quiz   = isset($body['quiz_id']) ? $body['quiz_id'] : 0;
		$raw_course = isset($body['course_id']) ? $body['course_id'] : 0;

		$quiz_id   = is_numeric($raw_quiz) ? intval($raw_quiz) : 0;
		$course_id = is_numeric($raw_course) ? intval($raw_course) : 0;

		// Trường hợp quiz_id hoặc course_id được truyền dạng slug
		if (!$quiz_id && !empty($raw_quiz)) {
			$slug_clean = sanitize_title($raw_quiz);
			$found_q    = $wpdb->get_var($wpdb->prepare(
				"SELECT ID FROM {$wpdb->posts} WHERE post_name = %s AND post_type IN ('lp_quiz', 'lp_lesson') ORDER BY ID DESC LIMIT 1",
				$slug_clean
			));
			if ($found_q) $quiz_id = intval($found_q);
		}

		if (!$course_id && !empty($raw_course)) {
			$slug_clean = sanitize_title($raw_course);
			$found_c    = $wpdb->get_var($wpdb->prepare(
				"SELECT ID FROM {$wpdb->posts} WHERE post_name = %s AND post_type = 'lp_course' ORDER BY ID DESC LIMIT 1",
				$slug_clean
			));
			if ($found_c) $course_id = intval($found_c);
		}

		if (!$user_id || !$quiz_id) {
			return new WP_Error('missing_params', 'Thiếu user_id hoặc quiz_id', ['status' => 400]);
		}

		$now = current_time('mysql');

		$result_percent = isset($body['result'])     ? floatval($body['result'])     : 0;
		$correct        = isset($body['correct'])    ? intval($body['correct'])      : 0;
		$wrong          = isset($body['wrong'])      ? intval($body['wrong'])        : 0;
		$skipped        = isset($body['skipped'])    ? intval($body['skipped'])      : 0;
		$user_mark      = isset($body['user_mark'])  ? floatval($body['user_mark'])  : $correct;
		$total_mark     = isset($body['total_mark']) ? floatval($body['total_mark']) : ($correct + $wrong + $skipped);
		$time_spent     = isset($body['time_spent']) ? sanitize_text_field($body['time_spent']) : '00:00:00';
		$graduation     = isset($body['graduation']) ? sanitize_text_field($body['graduation'])  : 'failed';

		$table_ui  = $wpdb->prefix . 'learnpress_user_items';
		$table_uim = $wpdb->prefix . 'learnpress_user_itemmeta';

		// Tự động truy vấn course_id từ DB LearnPress nếu course_id bị thiếu hoặc bằng 0
		if (!$course_id && $quiz_id) {
			$table_sections  = $wpdb->prefix . 'learnpress_sections';
			$table_sec_items = $wpdb->prefix . 'learnpress_section_items';
			if ($wpdb->get_var("SHOW TABLES LIKE '{$table_sec_items}'") === $table_sec_items) {
				$found_cid = $wpdb->get_var($wpdb->prepare(
					"SELECT s.section_course_id FROM {$table_sections} s 
				JOIN {$table_sec_items} i ON s.section_id = i.section_id 
				WHERE i.item_id = %d ORDER BY i.section_item_id DESC LIMIT 1",
					$quiz_id
				));
				if ($found_cid) {
					$course_id = intval($found_cid);
				}
			}
		}

		// --- Bước 2: Tìm hoặc tự động tạo parent_id (user_item_id của course record) ---
		$parent_id = 0;
		if ($course_id) {
			$course_item = $wpdb->get_row($wpdb->prepare(
				"SELECT user_item_id FROM {$table_ui}
			WHERE user_id = %d AND item_id = %d AND item_type = 'lp_course'
			ORDER BY user_item_id DESC LIMIT 1",
				$user_id,
				$course_id
			));
			if ($course_item) {
				$parent_id = intval($course_item->user_item_id);
			} else {
				// Tự động tạo bản ghi enrollment cho Course nếu chưa có
				$wpdb->insert(
					$table_ui,
					[
						'user_id'    => $user_id,
						'item_id'    => $course_id,
						'item_type'  => 'lp_course',
						'start_time' => $now,
						'status'     => 'enrolled',
						'graduation' => 'in-progress',
					],
					['%d', '%d', '%s', '%s', '%s', '%s']
				);
				$parent_id = intval($wpdb->insert_id);
			}
		}

		// --- Bước 3: Tìm quiz user_item record đã tồn tại ---
		// Ưu tiên record có parent_id đúng, fallback sang bất kỳ record nào
		$existing = null;
		if ($parent_id) {
			$existing = $wpdb->get_row($wpdb->prepare(
				"SELECT user_item_id, status FROM {$table_ui}
			WHERE user_id = %d AND item_id = %d AND item_type = 'lp_quiz' AND parent_id = %d
			ORDER BY user_item_id DESC LIMIT 1",
				$user_id, $quiz_id, $parent_id
			));
		}
		if (!$existing) {
			$existing = $wpdb->get_row($wpdb->prepare(
				"SELECT user_item_id, status FROM {$table_ui}
			WHERE user_id = %d AND item_id = %d AND item_type = 'lp_quiz'
			ORDER BY user_item_id DESC LIMIT 1",
				$user_id, $quiz_id
			));
		}

		// Parse time_spent thành số giây INTEGER và chuỗi định dạng HH:MM:SS
		$time_spent_sec = 0;
		if (isset($body['time_spent_seconds']) && is_numeric($body['time_spent_seconds'])) {
			$time_spent_sec = intval($body['time_spent_seconds']);
		} elseif (isset($body['time_spent'])) {
			$raw_t = $body['time_spent'];
			if (is_numeric($raw_t)) {
				$time_spent_sec = intval($raw_t);
			} elseif (is_string($raw_t) && strpos($raw_t, ':') !== false) {
				$parts = array_map('intval', explode(':', $raw_t));
				if (count($parts) === 3) $time_spent_sec = $parts[0] * 3600 + $parts[1] * 60 + $parts[2];
				elseif (count($parts) === 2) $time_spent_sec = $parts[0] * 60 + $parts[1];
			}
		}

		$t_end = current_time('timestamp');
		$t_start = $t_end - max(1, $time_spent_sec);
		$start_time_str = date('Y-m-d H:i:s', $t_start);
		$end_time_str   = date('Y-m-d H:i:s', $t_end);
		$time_spent_str = sprintf('%02d:%02d:%02d', floor($time_spent_sec / 3600), floor(($time_spent_sec % 3600) / 60), $time_spent_sec % 60);

		// --- Bước 4: Upsert user_item record ---
		// Nếu lượt làm cũ đã 'completed' -> đây là lượt làm lại (Retake) -> Insert bản ghi MỚI vào wp_learnpress_user_items
		if ($existing && $existing->status === 'completed') {
			$wpdb->insert(
				$table_ui,
				[
					'user_id'    => $user_id,
					'item_id'    => $quiz_id,
					'item_type'  => 'lp_quiz',
					'parent_id'  => $parent_id ?: 0,
					'ref_id'     => $course_id  ?: 0,
					'ref_type'   => $course_id ? 'lp_course' : '',
					'start_time' => $start_time_str,
					'end_time'   => $end_time_str,
					'status'     => 'completed',
					'graduation' => $graduation,
				],
				['%d', '%d', '%s', '%d', '%d', '%s', '%s', '%s', '%s', '%s']
			);
			$user_item_id = intval($wpdb->insert_id);
		} elseif ($existing) {
			// Lượt làm cũ đang 'in-progress' -> Update bản ghi này
			$user_item_id = intval($existing->user_item_id);
			$wpdb->update(
				$table_ui,
				[
					'status'     => 'completed',
					'graduation' => $graduation,
					'start_time' => $start_time_str,
					'end_time'   => $end_time_str,
					'parent_id'  => $parent_id ?: 0,
					'ref_id'     => $course_id  ?: 0,
					'ref_type'   => $course_id ? 'lp_course' : '',
				],
				['user_item_id' => $user_item_id]
			);
		} else {
			// Chưa có bản ghi nào -> Insert bản ghi đầu tiên
			$wpdb->insert(
				$table_ui,
				[
					'user_id'    => $user_id,
					'item_id'    => $quiz_id,
					'item_type'  => 'lp_quiz',
					'parent_id'  => $parent_id ?: 0,
					'ref_id'     => $course_id  ?: 0,
					'ref_type'   => $course_id ? 'lp_course' : '',
					'start_time' => $start_time_str,
					'end_time'   => $end_time_str,
					'status'     => 'completed',
					'graduation' => $graduation,
				],
				['%d', '%d', '%s', '%d', '%d', '%s', '%s', '%s', '%s', '%s']
			);
			$user_item_id = intval($wpdb->insert_id);
		}

		// ĐỒNG BỘ SONG SONG: Tạo/Cập nhật bản ghi standalone (parent_id = 0, ref_id = 0) để hiển thị đúng trên standalone wordpress_url
		$standalone_user_item_id = 0;
		if ($parent_id > 0 || $course_id > 0) {
			$existing_standalone = $wpdb->get_row($wpdb->prepare(
				"SELECT user_item_id, status FROM {$table_ui}
			WHERE user_id = %d AND item_id = %d AND item_type = 'lp_quiz' AND parent_id = 0 AND ref_id = 0
			ORDER BY user_item_id DESC LIMIT 1",
				$user_id, $quiz_id
			));

			if ($existing_standalone && $existing_standalone->status === 'completed') {
				$wpdb->insert(
					$table_ui,
					[
						'user_id'    => $user_id,
						'item_id'    => $quiz_id,
						'item_type'  => 'lp_quiz',
						'parent_id'  => 0,
						'ref_id'     => 0,
						'ref_type'   => '',
						'start_time' => $start_time_str,
						'end_time'   => $end_time_str,
						'status'     => 'completed',
						'graduation' => $graduation,
					],
					['%d', '%d', '%s', '%d', '%d', '%s', '%s', '%s', '%s', '%s']
				);
				$standalone_user_item_id = intval($wpdb->insert_id);
			} elseif ($existing_standalone) {
				$standalone_user_item_id = intval($existing_standalone->user_item_id);
				$wpdb->update(
					$table_ui,
					[
						'status'     => 'completed',
						'graduation' => $graduation,
						'start_time' => $start_time_str,
						'end_time'   => $end_time_str,
						'parent_id'  => 0,
						'ref_id'     => 0,
						'ref_type'   => '',
					],
					['user_item_id' => $standalone_user_item_id]
				);
			} else {
				$wpdb->insert(
					$table_ui,
					[
						'user_id'    => $user_id,
						'item_id'    => $quiz_id,
						'item_type'  => 'lp_quiz',
						'parent_id'  => 0,
						'ref_id'     => 0,
						'ref_type'   => '',
						'start_time' => $start_time_str,
						'end_time'   => $end_time_str,
						'status'     => 'completed',
						'graduation' => $graduation,
					],
					['%d', '%d', '%s', '%d', '%d', '%s', '%s', '%s', '%s', '%s']
				);
				$standalone_user_item_id = intval($wpdb->insert_id);
			}
		}

		if (!$user_item_id) {
			return new WP_Error('db_error', 'Không thể lưu kết quả quiz vào database', ['status' => 500]);
		}

		// --- Bước 5: Chuẩn bị dữ liệu kết quả theo cấu trúc LearnPress 4.x ---
		$answers = isset($body['answers']) && is_array($body['answers']) ? $body['answers'] : [];
		$questions_data = [];

		// Tìm tất cả ID câu hỏi của Quiz này
		$quiz_question_ids = [];
		$table_qq = $wpdb->prefix . 'learnpress_quiz_questions';
		$table_qa = $wpdb->prefix . 'learnpress_question_answers';

		$q_rows = $wpdb->get_col($wpdb->prepare(
			"SELECT question_id FROM {$table_qq} WHERE quiz_id = %d ORDER BY question_order ASC",
			$quiz_id
		));
		if (!empty($q_rows)) {
			$quiz_question_ids = array_map('intval', $q_rows);
		}

		if (empty($quiz_question_ids) && !empty($answers)) {
			foreach (array_keys($answers) as $q_key) {
				$qid_int = intval($q_key);
				if ($qid_int > 0) $quiz_question_ids[] = $qid_int;
			}
		}

		$debug_log = [];
		$mapped_answers = [];

		// Lặp qua từng câu hỏi trong quiz để lập $questions_data và lưu vào user_itemmeta
		foreach ($quiz_question_ids as $q_id_int) {
			$q_id_str = strval($q_id_int);

			// 1. Lấy điểm (mark) của câu hỏi này từ postmeta của question
			$q_mark = get_post_meta($q_id_int, '_lp_mark', true);
			$q_mark = $q_mark ? floatval($q_mark) : 1.0;

			// 2. Lấy danh sách đáp án (options) của câu hỏi sử dụng cơ chế giống hệt hàm lấy danh sách câu hỏi
			$db_options = [];

			// Hướng 1: Thử sử dụng LearnPress Native API (đây là cách an toàn và chuẩn xác nhất nếu hàm tồn tại)
			if (function_exists('learn_press_get_question')) {
				try {
					$lp_q_obj = learn_press_get_question($q_id_int);
					if ($lp_q_obj && method_exists($lp_q_obj, 'get_answers')) {
						$lp_answers_obj = $lp_q_obj->get_answers();
						if (!empty($lp_answers_obj)) {
							$o_idx = 0;
							foreach ((array)$lp_answers_obj as $ans_item) {
								$val_val = '';
								$is_tr_val = null;
								$ans_title = '';

								if (is_object($ans_item)) {
									if (method_exists($ans_item, 'get_value')) {
										$val_val = $ans_item->get_value();
									}
									if (method_exists($ans_item, 'is_true')) {
										$is_tr_val = $ans_item->is_true();
									} elseif (method_exists($ans_item, 'get_is_true')) {
										$is_tr_val = $ans_item->get_is_true();
									}
									if (method_exists($ans_item, 'get_title')) {
										$ans_title = $ans_item->get_title();
									}
								}

								$a_arr = (array)$ans_item;
								// Quét tất cả các thuộc tính của mảng nếu getter trả về rỗng (đối phó với protected properties khi cast)
								if (empty($val_val)) {
									foreach ($a_arr as $k => $v) {
										$k_clean = strtolower($k);
										if (strpos($k_clean, 'value') !== false && !empty($v)) {
											$val_val = $v;
										}
										if ((strpos($k_clean, 'is_true') !== false || strpos($k_clean, 'correct') !== false) && $v !== null) {
											$is_tr_val = $v;
										}
										if ((strpos($k_clean, 'title') !== false || strpos($k_clean, 'text') !== false) && !empty($v)) {
											$ans_title = $v;
										}
									}
								}

								if (empty($val_val)) {
									$val_val = isset($a_arr['value']) ? $a_arr['value']
										: (isset($a_arr['question_answer_id']) ? $a_arr['question_answer_id'] : $o_idx);
								}
								if ($is_tr_val === null) {
									$is_tr_val = isset($a_arr['is_true']) ? $a_arr['is_true']
										: (isset($a_arr['correct']) ? $a_arr['correct'] : false);
								}

								$db_options[] = (object)[
									'question_answer_id' => isset($a_arr['question_answer_id']) ? $a_arr['question_answer_id'] : $o_idx,
									'value' => $val_val,
									'is_true' => ($is_tr_val === 'yes' || $is_tr_val === '1' || $is_tr_val === 1 || $is_tr_val === true || $is_tr_val === 'true') ? 'yes' : 'no',
									'title' => !empty($ans_title) ? $ans_title : (isset($a_arr['title']) ? $a_arr['title'] : '')
								];
								$o_idx++;
							}
						}
					}
				} catch (Exception $e) {}
			}

			// Hướng 2: Truy vấn trực tiếp từ bảng learnpress_question_answers
			if (empty($db_options)) {
				$db_rows = $wpdb->get_results($wpdb->prepare(
					"SELECT question_answer_id, value, is_true FROM {$table_qa} WHERE question_id = %d ORDER BY answer_order ASC",
					$q_id_int
				));
				if (!empty($db_rows)) {
					$db_options = $db_rows;
				}
			}

			// Hướng 3: Mock cho câu hỏi Đúng/Sai (True/False)
			$q_type = get_post_meta($q_id_int, '_lp_type', true);
			if (empty($q_type)) {
				$q_type = $wpdb->get_var($wpdb->prepare("SELECT post_mime_type FROM {$wpdb->posts} WHERE ID = %d", $q_id_int));
			}
			if (($q_type === 'true_or_false' || $q_type === 'true_false' || strpos($q_type, 'true') !== false) && empty($db_options)) {
				$tf_correct = get_post_meta($q_id_int, '_true_false', true);
				$db_options = [
					(object)[
						'question_answer_id' => 0,
						'value' => 'yes',
						'is_true' => ($tf_correct === 'yes' || $tf_correct === 'true' || $tf_correct === '1' || $tf_correct === 1) ? 'yes' : 'no'
					],
					(object)[
						'question_answer_id' => 1,
						'value' => 'no',
						'is_true' => ($tf_correct === 'no' || $tf_correct === 'false' || $tf_correct === '0' || $tf_correct === 0) ? 'yes' : 'no'
					]
				];
			}

			// Hướng 4: Đọc từ các trường meta LearnPress v4.x (_lp_question_answer, _lp_question_answers, v.v.)
			if (empty($db_options)) {
				$lp4_answers = get_post_meta($q_id_int, '_lp_question_answer', true);
				if (empty($lp4_answers)) $lp4_answers = get_post_meta($q_id_int, '_lp_question_answers', true);
				if (empty($lp4_answers)) $lp4_answers = get_post_meta($q_id_int, '_question_answer', true);
				if (empty($lp4_answers)) $lp4_answers = get_post_meta($q_id_int, '_lp_choices', true);

				if (!empty($lp4_answers)) {
					if (is_string($lp4_answers)) $lp4_answers = maybe_unserialize($lp4_answers);
					if (is_string($lp4_answers) && (strpos($lp4_answers, '{') === 0 || strpos($lp4_answers, '[') === 0)) {
						$lp4_answers = json_decode($lp4_answers, true);
					}
					if (is_array($lp4_answers)) {
						$o_idx = 0;
						foreach (array_values($lp4_answers) as $opt_item) {
							if (is_array($opt_item) || is_object($opt_item)) {
								$opt_item = (array)$opt_item;
								$val_val = isset($opt_item['value']) ? $opt_item['value']
									: (isset($opt_item['question_answer_id']) ? $opt_item['question_answer_id'] : $o_idx);
								$is_tr = isset($opt_item['is_true']) ? $opt_item['is_true']
									: (isset($opt_item['correct']) ? $opt_item['correct'] : false);
							} else {
								$val_val = strval($opt_item);
								$is_tr = false;
							}
							$db_options[] = (object)[
								'question_answer_id' => isset($opt_item['question_answer_id']) ? $opt_item['question_answer_id'] : $o_idx,
								'value' => $val_val,
								'is_true' => ($is_tr === 'yes' || $is_tr === '1' || $is_tr === 1 || $is_tr === true || $is_tr === 'true') ? 'yes' : 'no',
								'title' => isset($opt_item['title']) ? $opt_item['title'] : ''
							];
							$o_idx++;
						}
					}
				}
			}

			// Hướng 5: Đọc từ các trường meta options cũ (_options, _lp_options, _answers, _lp_answers)
			if (empty($db_options)) {
				$post_meta_opts = get_post_meta($q_id_int, '_options', true);
				if (empty($post_meta_opts)) $post_meta_opts = get_post_meta($q_id_int, '_lp_options', true);
				if (empty($post_meta_opts)) $post_meta_opts = get_post_meta($q_id_int, '_answers', true);
				if (empty($post_meta_opts)) $post_meta_opts = get_post_meta($q_id_int, '_lp_answers', true);

				if (!empty($post_meta_opts)) {
					if (is_string($post_meta_opts)) $post_meta_opts = maybe_unserialize($post_meta_opts);
					if (is_array($post_meta_opts)) {
						$o_idx = 0;
						foreach (array_values($post_meta_opts) as $opt_item) {
							if (is_array($opt_item) || is_object($opt_item)) {
								$opt_item = (array)$opt_item;
								$val_val = isset($opt_item['value']) ? $opt_item['value']
									: (isset($opt_item['question_answer_id']) ? $opt_item['question_answer_id'] : $o_idx);
								$is_tr = isset($opt_item['is_true']) ? $opt_item['is_true']
									: (isset($opt_item['correct']) ? $opt_item['correct'] : false);
							} else {
								$val_val = strval($opt_item);
								$is_tr = false;
							}
							$db_options[] = (object)[
								'question_answer_id' => isset($opt_item['question_answer_id']) ? $opt_item['question_answer_id'] : $o_idx,
								'value' => $val_val,
								'is_true' => ($is_tr === 'yes' || $is_tr === '1' || $is_tr === 1 || $is_tr === true || $is_tr === 'true') ? 'yes' : 'no',
								'title' => isset($opt_item['title']) ? $opt_item['title'] : ''
							];
							$o_idx++;
						}
					}
				}
			}

			// 3. Xác định đáp án đúng từ database
			$correct_values = [];
			foreach ($db_options as $opt) {
				if ($opt->is_true === 'yes' || $opt->is_true === '1' || $opt->is_true === 1) {
					$correct_values[] = $opt->value;
				}
			}

			// 4. Lấy câu trả lời của user gửi từ NextJS (hỗ trợ cả dạng index và dạng option value trực tiếp)
			$user_ans_indices = isset($answers[$q_id_int]) ? $answers[$q_id_int] : (isset($answers[$q_id_str]) ? $answers[$q_id_str] : null);

			$user_answered_values = [];
			if ($user_ans_indices !== null) {
				$indices_array = is_array($user_ans_indices) ? $user_ans_indices : [$user_ans_indices];

				// Trích xuất tất cả values hợp lệ từ DB
				$all_db_values = [];
				foreach ($db_options as $opt) {
					$all_db_values[] = $opt->value;
				}

				foreach ($indices_array as $val) {
					$val_str = strval($val);
					if (in_array($val_str, $all_db_values)) {
						// Đã khớp trực tiếp với đáp án (NextJS đã map sẵn option value)
						$user_answered_values[] = $val_str;
					} else {
						// Chưa khớp, coi nó là index (0, 1, 2...) và map
						$idx_int = intval($val_str);
						if (isset($db_options[$idx_int])) {
							$user_answered_values[] = $db_options[$idx_int]->value;
						}
					}
				}
			}

			// 5. So sánh để biết đúng hay sai
			$is_q_correct = false;
			if (!empty($user_answered_values)) {
				$temp_user = $user_answered_values;
				$temp_corr = $correct_values;
				sort($temp_user);
				sort($temp_corr);
				if ($temp_user === $temp_corr) {
					$is_q_correct = true;
				}
			}

			// 6. Định dạng câu trả lời cho kết quả của LearnPress
			$answered_field = '';
			if (count($user_answered_values) === 1) {
				$answered_field = $user_answered_values[0];
			} elseif (count($user_answered_values) > 1) {
				$answered_field = $user_answered_values;
			}

			$questions_data[$q_id_str] = [
				'answered'    => $answered_field,
				'correct'     => $is_q_correct,
				'mark'        => $q_mark,
				'user_mark'   => $is_q_correct ? $q_mark : 0,
				'explanation' => '',
			];

			// LP4 mong đợi single_choice/true_false lưu dạng chuỗi trực tiếp (unserialized), chỉ multi_choice mới lưu dạng serialized array
			$meta_val_to_save = '';
			if ($q_type === 'multi_choice' || $q_type === 'multiple_choice') {
				$meta_val_to_save = serialize($user_answered_values);
				$mapped_answers[$q_id_int] = $user_answered_values;
			} else {
				$meta_val_to_save = !empty($user_answered_values) ? strval($user_answered_values[0]) : '';
				$mapped_answers[$q_id_int] = $meta_val_to_save;
			}

			// Lưu cho cả bản ghi Course-linked lẫn bản ghi Standalone
			$target_item_ids = [$user_item_id];
			if (isset($standalone_user_item_id) && $standalone_user_item_id > 0) {
				$target_item_ids[] = $standalone_user_item_id;
			}

			foreach ($target_item_ids as $t_id) {
				$wpdb->query($wpdb->prepare(
					"DELETE FROM {$table_uim} WHERE learnpress_user_item_id = %d AND meta_key = %s",
					$t_id, $q_id_str
				));

				$wpdb->insert(
					$table_uim,
					[
						'learnpress_user_item_id' => $t_id,
						'meta_key'                => $q_id_str,
						'meta_value'              => $meta_val_to_save,
					],
					['%d', '%s', '%s']
				);
			}

			$debug_log[$q_id_str] = [
				'q_type' => isset($q_type) ? $q_type : 'unknown',
				'db_options_count' => count($db_options),
				'db_options' => $db_options,
				'db_error' => $wpdb->last_error,
				'user_ans_indices' => $user_ans_indices,
				'user_answered_values' => $user_answered_values,
				'all_meta' => get_post_meta($q_id_int)
			];
		}

		// Lấy thông tin cấu hình passing_grade từ post_meta của Quiz
		$pg_val = get_post_meta($quiz_id, '_lp_passing_grade', true);
		if (empty($pg_val)) $pg_val = get_post_meta($quiz_id, '_lp_passing_condition', true);
		if (empty($pg_val)) $pg_val = 80;
		$passing_grade_str = is_numeric($pg_val) ? "{$pg_val}%" : strval($pg_val);

		$minus_point_meta = get_post_meta($quiz_id, '_lp_minus_point', true);
		$minus_point_val  = (!empty($minus_point_meta) && is_numeric($minus_point_meta)) ? floatval($minus_point_meta) : 0;
		$minus_total      = $minus_point_val * $wrong;

		$result_data = [
			'questions'        => !empty($questions_data) ? $questions_data : new stdClass(),
			'result'           => $result_percent,
			'user_mark'        => $user_mark,
			'mark'             => $total_mark,
			'question_correct' => $correct,
			'question_wrong'   => $wrong,
			'question_empty'   => $skipped,
			'question_count'   => max(1, count($quiz_question_ids) ?: ($correct + $wrong + $skipped)),
			'question_answered'=> $correct + $wrong,
			'time_spend'       => $time_spent_str,
			'time_spent'       => $time_spent_sec,
			'graduation'       => $graduation,
			'status'           => 'completed',
			'passing_grade'    => $passing_grade_str,
			'pass'             => ($graduation === 'passed') ? 1 : 0,
			'finishing_type'   => 'click',
			'minus_point'      => $minus_total,
		];

		// Chuẩn bị Lịch sử lượt làm (Retakes History / Last Attempt)
		$existing_retakes = [];
		$prev_user_items  = $wpdb->get_results($wpdb->prepare(
			"SELECT user_item_id FROM {$table_ui}
		WHERE user_id = %d AND item_id = %d AND item_type = 'lp_quiz' AND status = 'completed' AND user_item_id != %d
		ORDER BY user_item_id ASC",
			$user_id, $quiz_id, $user_item_id
		));

		if (!empty($prev_user_items)) {
			foreach ($prev_user_items as $p_item) {
				$p_meta = $wpdb->get_var($wpdb->prepare(
					"SELECT meta_value FROM {$table_uim} WHERE learnpress_user_item_id = %d AND meta_key = 'results' LIMIT 1",
					$p_item->user_item_id
				));
				if ($p_meta) {
					$p_unserialized = maybe_unserialize($p_meta);
					if (is_array($p_unserialized)) {
						$existing_retakes[] = $p_unserialized;
					}
				}
			}
		}

		// Dữ liệu JSON & Serialized chuẩn 2 hệ thống (LearnPress 4.x REST API + WP Theme Template)
		$result_json        = json_encode($result_data, JSON_UNESCAPED_UNICODE);
		$result_serialized  = serialize($result_data);
		$answers_json       = json_encode($mapped_answers, JSON_UNESCAPED_UNICODE);
		$answers_serialized = serialize($mapped_answers);

		// Tất cả meta keys LearnPress 4.x cần để hiển thị đúng kết quả
		$meta_map = [
			'status'                   => 'completed',
			'_lp_user_item_status'     => 'completed',
			'grade'                    => $graduation,
			'graduation'               => $graduation,
			'_lp_user_item_graduation' => $graduation,
			'_lp_user_item_score'      => $result_percent,
			'finishing_type'           => 'click',
			'_lp_questions'            => serialize($quiz_question_ids),
			'_lp_question_answers'     => $answers_serialized,
			'question_answers'         => $answers_serialized,
			'_lp_question_answers_json'=> $answers_json,
			'results'                  => $result_serialized,  // WP Theme Template đọc "results" dưới dạng serialized array
			'_lp_user_item_results'    => $result_json,        // LP 4.x REST API đọc JSON
			'_lp_results'              => $result_json,        // LP 4.x alias JSON
			'_lp_quiz_results'         => $result_json,        // LP 4.x alias 2 JSON
		];

		if (!empty($existing_retakes)) {
			$meta_map['_lp_quiz_retake_items'] = serialize($existing_retakes);
			$meta_map['_lp_retake_items']      = serialize($existing_retakes);
			$meta_map['_lp_user_item_retakes'] = serialize($existing_retakes);
		}

		// --- Bước 6: Cập nhật user_meta & Kích hoạt LearnPress Action Hooks ---
		update_user_meta($user_id, '_lp_quiz_passed_'    . $quiz_id, $graduation === 'passed' ? '1' : '0');
		update_user_meta($user_id, '_lp_quiz_completed_' . $quiz_id, '1');

		// 1. Kích hoạt Action Hooks chính của LearnPress 4.x
		do_action( 'learn-press/user/quiz-finished', $user_item_id, $quiz_id, $course_id, $user_id );
		do_action( 'learn_press_user_finish_quiz', $quiz_id, $user_id, $course_id, $user_item_id );
		do_action( 'learn_press_user_item_status_changed', $user_item_id, 'completed', 'in-progress' );
		do_action( 'learn-press/user-item/completed', $user_item_id, $quiz_id, $user_id );

		// 2. Ghi đè toàn bộ metadata chuẩn vào cơ sở dữ liệu SAU KHI các hooks chạy xong để tránh bị hooks xóa
		$target_item_ids = [$user_item_id];
		if (isset($standalone_user_item_id) && $standalone_user_item_id > 0) {
			$target_item_ids[] = $standalone_user_item_id;
		}

		foreach ($target_item_ids as $t_id) {
			foreach ($meta_map as $meta_key => $meta_value) {
				$wpdb->query($wpdb->prepare(
					"DELETE FROM {$table_uim} WHERE learnpress_user_item_id = %d AND meta_key = %s",
					$t_id, $meta_key
				));

				$wpdb->insert(
					$table_uim,
					[
						'learnpress_user_item_id' => $t_id,
						'meta_key'                => $meta_key,
						'meta_value'              => $meta_value,
					],
					['%d', '%s', '%s']
				);
			}
		}

		// 2. Kích hoạt tính toán lại Tiến trình Khóa học & Làm sạch Cache trong LearnPress
		if ( function_exists( 'learn_press_get_user' ) && $user_id ) {
			try {
				$lp_user = learn_press_get_user( $user_id );
				if ( $lp_user ) {
					if ( $course_id ) {
						$user_course = $lp_user->get_course_data( $course_id );
						if ( $user_course ) {
							if ( method_exists( $user_course, 'calculate_course_results' ) ) {
								$user_course->calculate_course_results();
							}
							if ( method_exists( $user_course, 'read_items' ) ) {
								$user_course->read_items();
							}
						}
					}
					if ( method_exists( $lp_user, 'clean_caches' ) ) {
						$lp_user->clean_caches();
					}
				}
			} catch ( Exception $e ) {
				error_log( 'LP Sync Hook Error: ' . $e->getMessage() );
			}
		}

		// 3. Xóa cache LearnPress và WordPress
		delete_user_meta( $user_id, '_lp_course_progress' );
		delete_user_meta( $user_id, '_lp_quiz_results' );
		wp_cache_delete( "user_item_{$user_item_id}", 'user-items' );
		if ( $course_id ) {
			wp_cache_delete( "user_{$user_id}_course_{$course_id}", 'user-courses' );
		}

		if (function_exists('learn_press_reset_auto_complete_order')) {
			learn_press_reset_auto_complete_order();
		}
		clean_user_cache($user_id);
		wp_cache_flush();

		$db_attempts = $wpdb->get_results($wpdb->prepare(
			"SELECT user_item_id, user_id, item_id, item_type, status, graduation, parent_id, ref_id FROM {$table_ui} WHERE item_id = %d AND item_type = 'lp_quiz' ORDER BY user_item_id DESC LIMIT 20",
			$quiz_id
		));
		$attempt_ids = array_column($db_attempts, 'user_item_id');
		$db_meta = [];
		if (!empty($attempt_ids)) {
			$id_placeholders = implode(',', array_fill(0, count($attempt_ids), '%d'));
			$db_meta = $wpdb->get_results($wpdb->prepare(
				"SELECT learnpress_user_item_id, meta_key, meta_value FROM {$table_uim} WHERE learnpress_user_item_id IN ($id_placeholders)",
				...$attempt_ids
			));
			foreach ($db_meta as &$meta) {
				if (in_array($meta->meta_key, ['results', '_lp_user_item_results', '_lp_results', '_lp_quiz_results', '_lp_quiz_retake_items', '_lp_retake_items', '_lp_user_item_retakes'])) {
					$meta->unserialized = maybe_unserialize($meta->meta_value);
					if (is_string($meta->unserialized) && (strpos($meta->unserialized, '{') === 0 || strpos($meta->unserialized, '[') === 0)) {
						$meta->unserialized = json_decode($meta->unserialized, true);
					}
				}
			}
		}

		return rest_ensure_response([
			'success'      => true,
			'user_item_id' => $user_item_id,
			'parent_id'    => $parent_id,
			'graduation'   => $graduation,
			'result'       => $result_data,
			'debug_log'    => $debug_log,
			'db_attempts'  => $db_attempts,
			'db_meta'      => $db_meta,
			'message'      => 'Kết quả quiz đã được lưu vào WordPress thành công',
		]);
	} catch (Throwable $t) {
		return new WP_Error('php_error', $t->getMessage(), [
			'status' => 500,
			'trace' => $t->getTraceAsString(),
			'file' => $t->getFile(),
			'line' => $t->getLine()
		]);
	}
}

if (!function_exists('upload_base64_image_to_media')) {
	function upload_base64_image_to_media($base64_string, $user_id = 0) {
		$type = 'png';
		$data = '';
		if (preg_match('/^data:image\/(\w+);base64,/', $base64_string, $matches)) {
			$type = strtolower($matches[1]);
			$data = substr($base64_string, strpos($base64_string, ',') + 1);
		} else {
			$data = $base64_string;
		}

		if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png', 'webp'])) {
			$type = 'png';
		}

		$decoded_data = base64_decode($data);
		if ($decoded_data === false) {
			return new WP_Error('invalid_base64', 'Dữ liệu ảnh base64 không hợp lệ');
		}

		$upload_dir = wp_upload_dir();
		$filename   = 'avatar_' . ($user_id ?: time()) . '_' . uniqid() . '.' . $type;

		if (wp_mkdir_p($upload_dir['path'])) {
			$file = $upload_dir['path'] . '/' . $filename;
		} else {
			$file = $upload_dir['basedir'] . '/' . $filename;
		}

		file_put_contents($file, $decoded_data);

		$wp_filetype = wp_check_filetype($filename, null);
		$attachment = [
			'post_mime_type' => $wp_filetype['type'] ?: 'image/png',
			'post_title'     => sanitize_file_name($filename),
			'post_content'   => '',
			'post_status'    => 'inherit',
			'post_author'    => $user_id ?: 1,
		];

		require_once(ABSPATH . 'wp-admin/includes/image.php');
		$attach_id   = wp_insert_attachment($attachment, $file);
		$attach_data = wp_generate_attachment_metadata($attach_id, $file);
		wp_update_attachment_metadata($attach_id, $attach_data);

		return $attach_id;
	}
}

function handle_custom_upload_avatar($request) {
	$params      = $request->get_json_params();
	$user_id     = isset($params['user_id']) ? intval($params['user_id']) : intval($request->get_param('user_id'));
	$base64_data = isset($params['avatar_base64']) ? $params['avatar_base64'] : $request->get_param('avatar_base64');

	if (!$user_id) {
		return new WP_Error('missing_user_id', 'User ID is required', ['status' => 400]);
	}

	if (empty($base64_data)) {
		return new WP_Error('missing_file', 'Avatar base64 data is required', ['status' => 400]);
	}

	$attachment_id = upload_base64_image_to_media($base64_data, $user_id);

	if (is_wp_error($attachment_id)) {
		return $attachment_id;
	}

	if ($attachment_id > 0) {
		$url = wp_get_attachment_url($attachment_id);

		update_user_meta($user_id, '_lp_profile_picture', $url);
		update_user_meta($user_id, '_lp_profile_picture_src', $url);
		update_user_meta($user_id, '_lp_user_avatar', $url);
		update_user_meta($user_id, 'user_avatar', $url);
		update_user_meta($user_id, '_user_avatar', $url);
		update_user_meta($user_id, '_lp_avatar_url', $url);
		update_user_meta($user_id, '_lp_profile_picture_type', 'picture');
		update_user_meta($user_id, '_lp_profile_picture_attachment', $attachment_id);

		clean_user_cache($user_id);

		return rest_ensure_response([
			'success'       => true,
			'user_id'       => $user_id,
			'attachment_id' => $attachment_id,
			'avatar_url'    => $url,
			'message'       => 'Avatar updated successfully!',
		]);
	}

	return new WP_Error('upload_failed', 'Upload avatar failed', ['status' => 500]);
}

add_filter('get_avatar_url', function($url, $id_or_email, $args) {
	$user_id = 0;
	if (is_numeric($id_or_email)) {
		$user_id = intval($id_or_email);
	} else if (is_object($id_or_email) && !empty($id_or_email->user_id)) {
		$user_id = intval($id_or_email->user_id);
	} else if (is_string($id_or_email) && is_email($id_or_email)) {
		$user = get_user_by('email', $id_or_email);
		if ($user) $user_id = $user->ID;
	}

	if ($user_id > 0) {
		$custom_avatar = get_user_meta($user_id, '_lp_profile_picture', true);
		if (empty($custom_avatar)) $custom_avatar = get_user_meta($user_id, '_lp_user_avatar', true);
		if (empty($custom_avatar)) $custom_avatar = get_user_meta($user_id, '_user_avatar', true);

		if (!empty($custom_avatar)) {
			if (is_numeric($custom_avatar)) {
				$att_url = wp_get_attachment_url(intval($custom_avatar));
				if ($att_url) return $att_url;
			}
			return $custom_avatar;
		}
	}
	return $url;
}, 99, 3);

function handle_custom_retake_quiz($request) {
	global $wpdb;
	$body       = $request->get_json_params();
	$user_id    = isset($body['user_id']) ? intval($body['user_id']) : 0;
	$raw_quiz   = isset($body['quiz_id']) ? $body['quiz_id'] : 0;
	$raw_course = isset($body['course_id']) ? $body['course_id'] : 0;

	$quiz_id   = is_numeric($raw_quiz) ? intval($raw_quiz) : 0;
	$course_id = is_numeric($raw_course) ? intval($raw_course) : 0;

	// Trường hợp quiz_id hoặc course_id được truyền dạng slug
	if (!$quiz_id && !empty($raw_quiz)) {
		$slug_clean = sanitize_title($raw_quiz);
		$found_q    = $wpdb->get_var($wpdb->prepare(
			"SELECT ID FROM {$wpdb->posts} WHERE post_name = %s AND post_type IN ('lp_quiz', 'lp_lesson') ORDER BY ID DESC LIMIT 1",
			$slug_clean
		));
		if ($found_q) $quiz_id = intval($found_q);
	}

	if (!$course_id && !empty($raw_course)) {
		$slug_clean = sanitize_title($raw_course);
		$found_c    = $wpdb->get_var($wpdb->prepare(
			"SELECT ID FROM {$wpdb->posts} WHERE post_name = %s AND post_type = 'lp_course' ORDER BY ID DESC LIMIT 1",
			$slug_clean
		));
		if ($found_c) $course_id = intval($found_c);
	}

	if (!$user_id || !$quiz_id) {
		return new WP_Error('missing_params', 'Thiếu user_id hoặc quiz_id', ['status' => 400]);
	}

	$table_ui  = $wpdb->prefix . 'learnpress_user_items';
	$table_uim = $wpdb->prefix . 'learnpress_user_itemmeta';

	// Tự động truy vấn course_id từ DB LearnPress nếu course_id bị thiếu hoặc bằng 0
	if (!$course_id && $quiz_id) {
		$table_sections  = $wpdb->prefix . 'learnpress_sections';
		$table_sec_items = $wpdb->prefix . 'learnpress_section_items';
		if ($wpdb->get_var("SHOW TABLES LIKE '{$table_sec_items}'") === $table_sec_items) {
			$found_cid = $wpdb->get_var($wpdb->prepare(
				"SELECT s.section_course_id FROM {$table_sections} s 
				JOIN {$table_sec_items} i ON s.section_id = i.section_id 
				WHERE i.item_id = %d ORDER BY i.section_item_id DESC LIMIT 1",
				$quiz_id
			));
			if ($found_cid) {
				$course_id = intval($found_cid);
			}
		}
	}

	$parent_id = 0;
	if ($course_id) {
		$course_item = $wpdb->get_row($wpdb->prepare(
			"SELECT user_item_id FROM {$table_ui}
			WHERE user_id = %d AND item_id = %d AND item_type = 'lp_course'
			ORDER BY user_item_id DESC LIMIT 1",
			$user_id,
			$course_id
		));
		if ($course_item) {
			$parent_id = intval($course_item->user_item_id);
		}
	}

	$now = current_time('mysql');

	// 1. Tìm lượt làm bài cũ (status = completed)
	$existing = $wpdb->get_row($wpdb->prepare(
		"SELECT * FROM {$table_ui}
		WHERE user_id = %d AND item_id = %d AND item_type = 'lp_quiz' AND parent_id = %d
		ORDER BY user_item_id DESC LIMIT 1",
		$user_id, $quiz_id, $parent_id
	));

	if (!$existing) {
		$existing = $wpdb->get_row($wpdb->prepare(
			"SELECT * FROM {$table_ui}
			WHERE user_id = %d AND item_id = %d AND item_type = 'lp_quiz'
			ORDER BY user_item_id DESC LIMIT 1",
			$user_id, $quiz_id
		));
	}

	// 2. Chèn bản ghi mới với status = 'started'
	$wpdb->insert(
		$table_ui,
		[
			'user_id'    => $user_id,
			'item_id'    => $quiz_id,
			'item_type'  => 'lp_quiz',
			'parent_id'  => $parent_id ?: 0,
			'ref_id'     => $course_id  ?: 0,
			'ref_type'   => $course_id ? 'lp_course' : '',
			'start_time' => $now,
			'status'     => 'started',
			'graduation' => 'in-progress',
		],
		['%d', '%d', '%s', '%d', '%d', '%s', '%s', '%s', '%s']
	);

	$new_user_item_id = intval($wpdb->insert_id);

	// 3. Nếu có lượt làm cũ, sao lưu kết quả vào meta để lưu lịch sử retake
	if ($existing) {
		$old_user_item_id = intval($existing->user_item_id);

		// Cập nhật trạng thái lượt cũ thành hoàn thành (nếu chưa)
		$wpdb->update(
			$table_ui,
			['status' => 'completed'],
			['user_item_id' => $old_user_item_id]
		);

		// Đọc các thông tin đã lưu của lượt cũ trong user_itemmeta
		$old_metas = $wpdb->get_results($wpdb->prepare(
			"SELECT meta_key, meta_value FROM {$table_uim} WHERE learnpress_user_item_id = %d",
			$old_user_item_id
		));

		$old_meta_map = [];
		foreach ($old_metas as $m) {
			$old_meta_map[$m->meta_key] = maybe_unserialize($m->meta_value);
		}

		// Lấy lịch sử retake hiện tại trên course/quiz (nếu có)
		$existing_retakes = [];
		$raw_retakes = [];

		if ($parent_id) {
			$raw_retakes_ser = $wpdb->get_var($wpdb->prepare(
				"SELECT meta_value FROM {$table_uim} WHERE learnpress_user_item_id = %d AND meta_key = '_lp_quiz_retake_items' LIMIT 1",
				$parent_id
			));
			if ($raw_retakes_ser) {
				$raw_retakes = maybe_unserialize($raw_retakes_ser);
			}
		}
		if (is_array($raw_retakes)) {
			$existing_retakes = $raw_retakes;
		}

		// Lấy câu hỏi và điểm số cũ
		$questions_count = isset($old_meta_map['question_count']) ? intval($old_meta_map['question_count']) : 0;
		$correct = isset($old_meta_map['question_correct']) ? intval($old_meta_map['question_correct']) : 0;

		if ($questions_count === 0 && isset($old_meta_map['questions'])) {
			$questions_count = is_array($old_meta_map['questions']) ? count($old_meta_map['questions']) : 0;
			foreach ($old_meta_map['questions'] as $q) {
				if (isset($q['correct']) && $q['correct']) $correct++;
			}
		}

		$result_percent = isset($old_meta_map['result']) ? floatval($old_meta_map['result']) : 0;
		$user_mark = isset($old_meta_map['user_mark']) ? floatval($old_meta_map['user_mark']) : $correct;
		$mark = isset($old_meta_map['mark']) ? floatval($old_meta_map['mark']) : $questions_count;

		$new_retake_record = [
			'user_item_id' => $old_user_item_id,
			'status'       => 'completed',
			'graduation'   => $existing->graduation,
			'start_time'   => $existing->start_time,
			'end_time'     => $existing->end_time,
			'time_spend'   => isset($old_meta_map['time_spend']) ? $old_meta_map['time_spend'] : '00:00:00',
			'time_spent'   => isset($old_meta_map['time_spent']) ? intval($old_meta_map['time_spent']) : 0,
			'result'       => $result_percent,
			'user_mark'    => $user_mark,
			'mark'         => $mark,
			'question_correct' => $correct,
			'question_count'   => $questions_count,
		];

		$existing_retakes[] = $new_retake_record;

		// Lưu vào meta của bản ghi COURSE (parent_id) và QUIZ mới
		if ($parent_id) {
			$wpdb->query($wpdb->prepare(
				"DELETE FROM {$table_uim} WHERE learnpress_user_item_id = %d AND meta_key IN ('_lp_quiz_retake_items', '_lp_retake_items', '_lp_user_item_retakes')",
				$parent_id
			));
			$wpdb->insert($table_uim, ['learnpress_user_item_id' => $parent_id, 'meta_key' => '_lp_quiz_retake_items', 'meta_value' => serialize($existing_retakes)]);
			$wpdb->insert($table_uim, ['learnpress_user_item_id' => $parent_id, 'meta_key' => '_lp_retake_items', 'meta_value' => serialize($existing_retakes)]);
			$wpdb->insert($table_uim, ['learnpress_user_item_id' => $parent_id, 'meta_key' => '_lp_user_item_retakes', 'meta_value' => serialize($existing_retakes)]);
		}

		$wpdb->insert($table_uim, ['learnpress_user_item_id' => $new_user_item_id, 'meta_key' => '_lp_quiz_retake_items', 'meta_value' => serialize($existing_retakes)]);
		$wpdb->insert($table_uim, ['learnpress_user_item_id' => $new_user_item_id, 'meta_key' => '_lp_retake_items', 'meta_value' => serialize($existing_retakes)]);
		$wpdb->insert($table_uim, ['learnpress_user_item_id' => $new_user_item_id, 'meta_key' => '_lp_user_item_retakes', 'meta_value' => serialize($existing_retakes)]);
	}

	return rest_ensure_response([
		'success' => true,
		'user_item_id' => $new_user_item_id,
		'message' => 'Đã khởi tạo lượt làm lại quiz thành công trên WordPress.',
	]);
}






