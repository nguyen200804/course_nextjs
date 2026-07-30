<?php
/**
 * TOOL 2: TOOL CÀO VÀ IMPORT BÀI VIẾT TIN TỨC (POSTS) TỪ REST API EDUBINK VÀO WORDPRESS
 * Target URL: https://demo.edublink.co/wp-json/wp/v2/posts?per_page=100
 * Truy cập trong WP Admin -> Tools (Công cụ) -> Import Blog Posts
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly
}

function edublink_posts_importer_admin_menu() {
    add_management_page(
        'EduBlink Posts Importer',
        'Import Blog Posts',
        'manage_options',
        'edublink-posts-importer',
        'edublink_posts_importer_admin_page'
    );
}
add_action( 'admin_menu', 'edublink_posts_importer_admin_menu' );

// Giao diện Admin Tool trong WP Admin -> Tools -> Import Blog Posts
function edublink_posts_importer_admin_page() {
    ?>
    <div class="wrap">
        <h1>Tool Copy Bài Viết Tin Tức (Blog Posts) từ EduBlink</h1>
        <p>Tool sẽ lấy toàn bộ danh sách bài viết tin tức <code>post_type=post</code> từ <code>https://demo.edublink.co/wp-json/wp/v2/posts?per_page=100</code>, tự động tải ảnh đại diện (Featured Image), danh mục (Categories), thẻ (Tags) và nội dung bài viết vào WordPress local/host của bạn.</p>
        
        <?php
        if ( isset( $_POST['edublink_start_posts_import'] ) && check_admin_referer( 'edublink_posts_import_nonce' ) ) {
            echo '<div class="notice notice-info"><p><strong>Đang tiến hành cào danh sách bài viết từ https://demo.edublink.co/wp-json/wp/v2/posts?per_page=100&_embed=1...</strong></p></div>';
            echo '<div style="background: #000; color: #0f0; padding: 15px; font-family: monospace; max-height: 500px; overflow-y: auto; border-radius: 5px;">';
            
            $api_url = 'https://demo.edublink.co/wp-json/wp/v2/posts?per_page=100&_embed=1';
            $response = wp_remote_get( $api_url, array( 'timeout' => 60, 'sslverify' => false ) );

            if ( is_wp_error( $response ) ) {
                echo '<span style="color: red;">Lỗi khi kết nối REST API WordPress Nguồn: ' . $response->get_error_message() . '</span></div></div>';
                return;
            }

            $body = wp_remote_retrieve_body( $response );
            $posts = json_decode( $body, true );

            if ( empty( $posts ) || ! is_array( $posts ) ) {
                echo '<span style="color: red;">Không lấy được danh sách bài viết hoặc dữ liệu rỗng!</span></div></div>';
                return;
            }

            echo 'Tìm thấy ' . count( $posts ) . ' bài viết từ API nguồn.<br><br>';

            $imported_count = 0;
            $updated_count = 0;

            foreach ( $posts as $index => $item ) {
                $num = $index + 1;
                $title = isset( $item['title']['rendered'] ) ? sanitize_text_field( $item['title']['rendered'] ) : 'Untitled Post';
                $slug = isset( $item['slug'] ) ? sanitize_title( $item['slug'] ) : '';
                $content = isset( $item['content']['rendered'] ) ? wp_kses_post( $item['content']['rendered'] ) : '';
                $excerpt = isset( $item['excerpt']['rendered'] ) ? wp_kses_post( $item['excerpt']['rendered'] ) : '';
                $post_date = isset( $item['date'] ) ? sanitize_text_field( $item['date'] ) : current_time( 'mysql' );

                echo "{$num}. Đang xử lý bài viết: <strong>{$title}</strong> (slug: {$slug})...<br>";

                // Kiểm tra xem bài viết đã tồn tại trong WordPress chưa theo slug
                $existing_post = get_page_by_path( $slug, OBJECT, 'post' );

                $post_data = array(
                    'post_title'   => $title,
                    'post_name'    => $slug,
                    'post_content' => $content,
                    'post_excerpt' => $excerpt,
                    'post_date'    => $post_date,
                    'post_status'  => 'publish',
                    'post_type'    => 'post',
                );

                if ( $existing_post ) {
                    $post_data['ID'] = $existing_post->ID;
                    $post_id = wp_update_post( $post_data );
                    echo "---> Cập nhật bài viết ID: {$post_id}<br>";
                    $updated_count++;
                } else {
                    $post_id = wp_insert_post( $post_data );
                    echo "---> Tạo mới bài viết ID: {$post_id}<br>";
                    $imported_count++;
                }

                if ( is_wp_error( $post_id ) ) {
                    echo "<span style='color: red;'>---> Lỗi tạo bài viết: " . $post_id->get_error_message() . "</span><br>";
                    continue;
                }

                // Import Ảnh đại diện (Featured Image) từ _embedded
                $featured_image_url = '';
                if ( isset( $item['_embedded']['wp:featuredmedia'][0]['source_url'] ) ) {
                    $featured_image_url = $item['_embedded']['wp:featuredmedia'][0]['source_url'];
                } elseif ( isset( $item['featured_media_src_url'] ) ) {
                    $featured_image_url = $item['featured_media_src_url'];
                }

                if ( ! empty( $featured_image_url ) ) {
                    $attachment_id = edublink_upload_image_from_url( $featured_image_url, $post_id );
                    if ( $attachment_id ) {
                        set_post_thumbnail( $post_id, $attachment_id );
                        echo "---> Tải ảnh đại diện bài viết thành công (Attachment ID: {$attachment_id})<br>";
                    }
                }

                // Import Danh mục bài viết (Categories) & Thẻ (Tags) từ _embedded['wp:term']
                if ( isset( $item['_embedded']['wp:term'] ) && is_array( $item['_embedded']['wp:term'] ) ) {
                    foreach ( $item['_embedded']['wp:term'] as $taxonomy_terms ) {
                        if ( empty( $taxonomy_terms ) || ! is_array( $taxonomy_terms ) ) {
                            continue;
                        }

                        $taxonomy_name = isset( $taxonomy_terms[0]['taxonomy'] ) ? $taxonomy_terms[0]['taxonomy'] : 'category';
                        $term_ids = array();

                        foreach ( $taxonomy_terms as $term_data ) {
                            $t_name = sanitize_text_field( $term_data['name'] );
                            $t_slug = sanitize_title( $term_data['slug'] );
                            $t_tax  = isset( $term_data['taxonomy'] ) ? $term_data['taxonomy'] : 'category';

                            $term_obj = term_exists( $t_slug, $t_tax );
                            if ( ! $term_obj ) {
                                $term_obj = wp_insert_term( $t_name, $t_tax, array( 'slug' => $t_slug ) );
                            }

                            if ( ! is_wp_error( $term_obj ) && isset( $term_obj['term_id'] ) ) {
                                $term_ids[] = (int) $term_obj['term_id'];
                            }
                        }

                        if ( ! empty( $term_ids ) ) {
                            wp_set_object_terms( $post_id, $term_ids, $taxonomy_name );
                            echo "---> Gán " . count( $term_ids ) . " thẻ/danh mục taxonomy '{$taxonomy_name}' thành công.<br>";
                        }
                    }
                }

                echo "<br>";
            }

            echo "<br><strong>===> HOÀN THÀNH IMPORT BÀI VIẾT TIN TỨC! Đã thêm mới {$imported_count} bài viết, cập nhật {$updated_count} bài viết.</strong></div></div>";
        }
        ?>

        <form method="post" action="" style="margin-top: 20px;">
            <?php wp_nonce_field( 'edublink_posts_import_nonce' ); ?>
            <p>
                <input type="submit" name="edublink_start_posts_import" class="button button-primary button-hero" value="Bắt đầu Import Bài Viết (post_type=post)">
            </p>
        </form>
    </div>
    <?php
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
