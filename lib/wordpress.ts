/**
 * Hàm lấy danh sách khóa học từ LearnDash sử dụng Basic Auth (Application Password)
 */
export async function getLearnDashCourses() {
  const wpUrl = process.env.WORDPRESS_URL;
  const username = process.env.WORDPRESS_API_USERNAME;
  const password = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

  if (!wpUrl || !username || !password) {
    throw new Error(
      "Vui lòng cấu hình đầy đủ WORDPRESS_URL, WORDPRESS_API_USERNAME, và WORDPRESS_API_APPLICATION_PASSWORD trong file .env.local"
    );
  }

  // Mã hóa thông tin đăng nhập thành chuỗi Base64
  const credentials = Buffer.from(`${username}:${password}`).toString("base64");

  // Endpoint LearnDash Courses V1 (bạn cũng có thể đổi thành v2 nếu cần)
  const apiUrl = `${wpUrl}/wp-json/ldlms/v1/sfwd-courses`;

  const res = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    // Sử dụng ISR (Incremental Static Regeneration) hoặc SSR tùy nhu cầu
    // revalidate: 3600 -> Cache 1 tiếng
    next: { revalidate: 60 }, 
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("Lỗi chi tiết từ WordPress API:", errorBody);
    throw new Error(`WordPress API trả về mã lỗi: ${res.status}`);
  }

  return res.json();
}

/**
 * Hàm lấy chi tiết một khóa học cụ thể
 */
export async function getLearnDashCourse(idOrSlug: string) {
  const wpUrl = process.env.WORDPRESS_URL;
  const username = process.env.WORDPRESS_API_USERNAME;
  const password = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

  if (!wpUrl || !username || !password) {
    throw new Error("Vui lòng cấu hình đầy đủ thông tin xác thực trong file .env.local");
  }

  const credentials = Buffer.from(`${username}:${password}`).toString("base64");
  const isId = /^\d+$/.test(idOrSlug);
  const apiUrl = isId 
    ? `${wpUrl}/wp-json/ldlms/v1/sfwd-courses/${idOrSlug}`
    : `${wpUrl}/wp-json/ldlms/v1/sfwd-courses?slug=${idOrSlug}`;

  const res = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    throw new Error(`Không thể lấy chi tiết khóa học. Mã lỗi: ${res.status}`);
  }

  const data = await res.json();
  if (isId) {
    return data;
  } else {
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    throw new Error(`Không tìm thấy khóa học với slug "${idOrSlug}".`);
  }
}

/**
 * Hàm lấy danh sách bài học (Lessons) thuộc về một khóa học cụ thể
 */
export async function getLearnDashLessons(courseId: string) {
  const wpUrl = process.env.WORDPRESS_URL;
  const username = process.env.WORDPRESS_API_USERNAME;
  const password = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

  if (!wpUrl || !username || !password) {
    throw new Error("Vui lòng cấu hình đầy đủ thông tin xác thực trong file .env.local");
  }

  const credentials = Buffer.from(`${username}:${password}`).toString("base64");
  
  // Lọc bài học theo Course ID thông qua tham số query "?course="
  const apiUrl = `${wpUrl}/wp-json/ldlms/v1/sfwd-lessons?course=${courseId}`;

  const res = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    throw new Error(`Không thể lấy danh sách bài học. Mã lỗi: ${res.status}`);
  }

  return res.json();
}

/**
 * Hàm lấy danh sách chủ đề (Topics) thuộc về một bài học (Lesson) cụ thể
 */
export async function getLearnDashTopics(courseId: string, lessonId: string) {
  const wpUrl = process.env.WORDPRESS_URL;
  const username = process.env.WORDPRESS_API_USERNAME;
  const password = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

  if (!wpUrl || !username || !password) {
    throw new Error("Vui lòng cấu hình đầy đủ thông tin xác thực trong file .env.local");
  }

  const credentials = Buffer.from(`${username}:${password}`).toString("base64");
  
  // Lưu ý: Endpoint LearnDash Topics là 'sfwd-topic' (số ít) theo cài đặt WordPress của bạn
  const apiUrl = `${wpUrl}/wp-json/ldlms/v1/sfwd-topic?course=${courseId}&lesson=${lessonId}`;

  const res = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    throw new Error(`Không thể lấy danh sách chủ đề. Mã lỗi: ${res.status}`);
  }

  return res.json();
}

/**
 * Hàm lấy chi tiết một bài học (Lesson) cụ thể
 */
export async function getLearnDashLesson(lessonId: string) {
  const wpUrl = process.env.WORDPRESS_URL;
  const username = process.env.WORDPRESS_API_USERNAME;
  const password = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

  if (!wpUrl || !username || !password) {
    throw new Error("Vui lòng cấu hình đầy đủ thông tin xác thực trong file .env.local");
  }

  const credentials = Buffer.from(`${username}:${password}`).toString("base64");
  const apiUrl = `${wpUrl}/wp-json/ldlms/v1/sfwd-lessons/${lessonId}`;

  const res = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Không thể lấy chi tiết bài học. Mã lỗi: ${res.status}`);
  }

  return res.json();
}

/**
 * Hàm lấy chi tiết một chủ đề (Topic) cụ thể
 */
export async function getLearnDashTopic(topicId: string) {
  const wpUrl = process.env.WORDPRESS_URL;
  const username = process.env.WORDPRESS_API_USERNAME;
  const password = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

  if (!wpUrl || !username || !password) {
    throw new Error("Vui lòng cấu hình đầy đủ thông tin xác thực trong file .env.local");
  }

  const credentials = Buffer.from(`${username}:${password}`).toString("base64");
  const apiUrl = `${wpUrl}/wp-json/ldlms/v1/sfwd-topic/${topicId}`;

  const res = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Không thể lấy chi tiết chủ đề. Mã lỗi: ${res.status}`);
  }

  return res.json();
}

/**
 * Kiểm tra xem học viên có thực sự được đăng ký khóa học này hay không
 */
export async function checkUserCourseEnrollment(userId: string, courseId: string): Promise<boolean> {
  const wpUrl = process.env.WORDPRESS_URL;
  const username = process.env.WORDPRESS_API_USERNAME;
  const password = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

  if (!wpUrl || !userId || !courseId) {
    return false;
  }

  const headers: Record<string, string> = {};
  if (username && password) {
    headers["Authorization"] = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  }

  // 1. Thử kiểm tra qua Custom REST API /custom/v1/user-courses?user_id=${userId}
  try {
    const customRes = await fetch(`${wpUrl}/wp-json/custom/v1/user-courses?user_id=${userId}`, {
      headers,
      cache: "no-store",
    });
    if (customRes.ok) {
      const data = await customRes.json();
      if (Array.isArray(data)) {
        const found = data.some((c: any) => String(c.id || c.course_id) === String(courseId));
        if (found) return true;
      }
    }
  } catch {}

  // 2. Thử kiểm tra qua LearnPress REST API /learnpress/v1/users/${userId}/courses
  try {
    const lpRes = await fetch(`${wpUrl}/wp-json/learnpress/v1/users/${userId}/courses`, {
      headers,
      cache: "no-store",
    });
    if (lpRes.ok) {
      const data = await lpRes.json();
      if (Array.isArray(data)) {
        const found = data.some((c: any) => String(c.id || c.course_id) === String(courseId));
        if (found) return true;
      }
    }
  } catch {}

  // 3. Thử kiểm tra qua LearnDash REST API /ldlms/v1/users/${userId}/courses
  try {
    const ldRes = await fetch(`${wpUrl}/wp-json/ldlms/v1/users/${userId}/courses`, {
      headers,
      cache: "no-store",
    });
    if (ldRes.ok) {
      const data = await ldRes.json();
      if (Array.isArray(data)) {
        return data.some((c: any) => {
          if (!c) return false;
          const currentId = typeof c === "object" ? c.id : c;
          return String(currentId) === String(courseId);
        });
      }
    }
  } catch {}

  return false;
}

/**
 * Hàm lấy thông tin chi tiết của khách hàng từ WooCommerce API
 */
export async function getWooCommerceCustomer(userId: string) {
  const wpUrl = process.env.WORDPRESS_URL;
  const username = process.env.WORDPRESS_API_USERNAME;
  const password = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

  if (!wpUrl || !username || !password) {
    throw new Error("Vui lòng cấu hình đầy đủ thông tin xác thực trong file .env.local");
  }

  const credentials = Buffer.from(`${username}:${password}`).toString("base64");
  const apiUrl = `${wpUrl}/wp-json/wc/v3/customers/${userId}`;

  const res = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 10 },
  });

  if (!res.ok) {
    throw new Error(`Không thể lấy thông tin khách hàng từ WooCommerce. Mã lỗi: ${res.status}`);
  }

  return res.json();
}

/**
 * Hàm lấy cấu hình các trường thanh toán (checkout fields) động từ WordPress/WooCommerce HTML source hoặc API
 */
export async function getWooCommerceCheckoutFields(productId: string | number) {
  const wpUrl = process.env.WORDPRESS_URL;
  if (!wpUrl) return getWooCommerceDefaultFields();

  // 1. Thử gọi qua endpoint custom REST API (tối ưu nhất, lấy đủ billing, shipping, additional)
  try {
    const customApiUrl = `${wpUrl}/wp-json/custom/v1/checkout-fields`;
    const res = await fetch(customApiUrl, {
      method: "GET",
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && (data.billing || data.shipping || data.additional)) {
        return data;
      }
    }
  } catch (err) {
    console.warn("Không thể lấy checkout fields qua custom API, thử fallback HTML:", err);
  }

  // 2. Fallback: Parse từ HTML wcSettings (WooCommerce Blocks config)
  try {
    const url = `${wpUrl}/checkout/?add-to-cart=${productId}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 300 }, // Cache trong 5 phút
    });

    if (res.ok) {
      const html = await res.text();
      const match = html.match(/var wcSettings = JSON\.parse\(\s*decodeURIComponent\(\s*['"]([^'"]+)['"]\s*\)\s*\);/);
      if (match) {
        const decoded = decodeURIComponent(match[1]);
        const parsed = JSON.parse(decoded);
        
        const rawFields = parsed.defaultFields || {};
        const billing: Record<string, any> = {};
        const shipping: Record<string, any> = {};
        const additional: Record<string, any> = {};

        Object.keys(rawFields).forEach(key => {
          billing[`billing_${key}`] = {
            ...rawFields[key],
            name: `billing_${key}`,
          };
          
          if (parsed.shippingEnabled) {
            shipping[`shipping_${key}`] = {
              ...rawFields[key],
              name: `shipping_${key}`,
            };
          }
        });

        additional["order_comments"] = {
          type: "textarea",
          label: "Ghi chú đơn hàng",
          placeholder: "Ghi chú về đơn hàng, ví dụ: lưu ý đặc biệt khi giao hàng.",
          required: false,
          enabled: true,
        };

        return { billing, shipping, additional };
      }
    }
  } catch (error) {
    console.error("Lỗi khi giải mã cấu hình trường thanh toán WooCommerce:", error);
  }

  // 3. Fallback cuối cùng nếu cả hai cách trên đều lỗi
  return getWooCommerceDefaultFields();
}

// Cấu hình các trường mặc định chuẩn của WooCommerce
function getWooCommerceDefaultFields() {
  const standardBilling: Record<string, any> = {
    billing_first_name: { type: "text", label: "First name", required: true, class: ["form-row-first"] },
    billing_last_name: { type: "text", label: "Last name", required: true, class: ["form-row-last"] },
    billing_email: { type: "email", label: "Email address", required: true, class: ["form-row-wide"] },
    billing_phone: { type: "tel", label: "Phone", required: false, class: ["form-row-wide"] },
    billing_country: { type: "country", label: "Country / Region", required: true, class: ["form-row-wide"] },
    billing_address_1: { type: "text", label: "Street address", required: true, class: ["form-row-wide"] },
    billing_city: { type: "text", label: "Town / City", required: true, class: ["form-row-wide"] },
    billing_state: { type: "state", label: "State / County", required: true, class: ["form-row-wide"] },
  };

  const standardAdditional: Record<string, any> = {
    order_comments: { type: "textarea", label: "Ghi chú đơn hàng", placeholder: "Ghi chú về đơn hàng của bạn", required: false, class: ["form-row-wide"] }
  };

  return { billing: standardBilling, shipping: {}, additional: standardAdditional };
}

/**
 * Tìm sản phẩm WooCommerce liên kết với Course ID dựa trên metadata (_linked_course_id hoặc _related_course)
 */
export async function getWooCommerceProductByCourseId(courseId: string | number) {
  const wpUrl = process.env.WORDPRESS_URL;
  const username = process.env.WORDPRESS_API_USERNAME;
  const password = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

  if (!wpUrl || !username || !password) {
    return null;
  }

  try {
    const credentials = Buffer.from(`${username}:${password}`).toString("base64");
    // Lấy danh sách sản phẩm có type = course (được tạo để liên kết với LearnDash Course)
    const apiUrl = `${wpUrl}/wp-json/wc/v3/products?type=course&per_page=100`;

    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 1800 }, // Cache trong 30 phút vì thông tin sản phẩm liên kết rất ít khi đổi
    });

    if (!res.ok) {
      console.error("Không thể tải danh sách sản phẩm từ WooCommerce:", res.status);
      return null;
    }

    const products = await res.json();
    if (Array.isArray(products)) {
      const matchedProduct = products.find((product: any) => {
        if (!product.meta_data) return false;
        
        return product.meta_data.some((meta: any) => {
          if (meta.key === "_linked_course_id" && String(meta.value) === String(courseId)) {
            return true;
          }
          if (meta.key === "_related_course") {
            if (Array.isArray(meta.value)) {
              return meta.value.some((val: any) => String(val) === String(courseId));
            }
            return String(meta.value) === String(courseId);
          }
          return false;
        });
      });

      if (matchedProduct) {
        return matchedProduct;
      }
    }
  } catch (error) {
    console.error("Lỗi khi tìm sản phẩm WooCommerce theo Course ID:", error);
  }
  return null;
}

/**
 * Lấy danh sách cổng thanh toán đang hoạt động từ WooCommerce API
 */
export async function getWooCommercePaymentGateways() {
  const wpUrl = process.env.WORDPRESS_URL;
  const username = process.env.WORDPRESS_API_USERNAME;
  const password = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

  if (!wpUrl || !username || !password) {
    return [];
  }

  try {
    const credentials = Buffer.from(`${username}:${password}`).toString("base64");
    const apiUrl = `${wpUrl}/wp-json/wc/v3/payment_gateways`;

    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 }, // Cache trong 1 phút
    });

    if (!res.ok) {
      console.error("Không thể tải danh sách cổng thanh toán từ WooCommerce:", res.status);
      return [];
    }

    const gateways = await res.json();
    if (Array.isArray(gateways)) {
      // Chỉ lấy các cổng thanh toán đang hoạt động (enabled === true)
      return gateways.filter((gw: any) => gw.enabled);
    }
  } catch (error) {
    console.error("Lỗi khi lấy danh sách cổng thanh toán WooCommerce:", error);
  }
  return [];
}

/**
 * Lấy danh sách bài học và chủ đề đã hoàn thành (Mark Complete) của học viên
 */
export async function getLearnDashUserProgress(userId: string | number, courseId: string | number) {
  const wpUrl = process.env.WORDPRESS_URL;
  if (!wpUrl) return { completed_lessons: [], completed_topics: [], passing_grade: 80, user_course_status: "enrolled" };

  try {
    // Gọi Custom API lấy dữ liệu tiến trình học tập
    const apiUrl = `${wpUrl}/wp-json/custom/v1/course-progress?user_id=${userId}&course_id=${courseId}`;
    const res = await fetch(apiUrl, {
      method: "GET",
      cache: "no-store", // Luôn luôn lấy dữ liệu mới nhất không qua cache
    });

    if (res.ok) {
      const data = await res.json();
      return {
        completed_lessons: Array.isArray(data?.completed_lessons)
          ? data.completed_lessons.map((id: any) => Number(id))
          : [],
        completed_topics: Array.isArray(data?.completed_topics)
          ? data.completed_topics.map((id: any) => Number(id))
          : [],
        passing_grade: data?.passing_grade ? Number(data.passing_grade) : 80,
        user_course_status: data?.user_course_status || "enrolled",
      };
    }
  } catch (error) {
    console.error("Lỗi khi lấy tiến trình học tập của người dùng:", error);
  }

  return { completed_lessons: [], completed_topics: [], passing_grade: 80, user_course_status: "enrolled" };
}

/**
 * Lấy thông tin đơn vị tiền tệ và ký hiệu giá từ WooCommerce REST API
 */
export async function getWooCommerceCurrency() {
  const wpUrl = process.env.WORDPRESS_URL;
  if (!wpUrl) return { currency: "VND", symbol: "₫", position: "right_space" };

  try {
    const res = await fetch(`${wpUrl}/wp-json/custom/v1/currency`, {
      method: "GET",
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error("Lỗi khi lấy thông tin tiền tệ WooCommerce:", error);
  }

  return { currency: "VND", symbol: "₫", position: "right_space" };
}

function decodeHtmlEntities(str: string): string {
  if (!str) return str;
  return str
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

/**
 * Format giá tiền theo định dạng tiền tệ của WooCommerce (hook/setting)
 */
export function formatWooCommercePrice(price: number | string, currencyInfo?: { symbol?: string; position?: string }) {
  const num = Number(price);
  if (isNaN(num)) return String(price);

  const rawSymbol = currencyInfo?.symbol || "₫";
  const symbol = decodeHtmlEntities(rawSymbol);
  const position = currencyInfo?.position || "right_space";
  const formattedNum = num.toLocaleString("vi-VN");

  switch (position) {
    case "left":
      return `${symbol}${formattedNum}`;
    case "left_space":
      return `${symbol} ${formattedNum}`;
    case "right":
      return `${formattedNum}${symbol}`;
    case "right_space":
    default:
      return `${formattedNum} ${symbol}`;
  }
}

/**
 * Lấy danh sách Section Headings (Chương / Phần) của khóa học LearnDash
 */
export async function getLearnDashCourseSections(courseId: string | number) {
  const wpUrl = process.env.WORDPRESS_URL;
  if (!wpUrl) return [];

  try {
    const res = await fetch(`${wpUrl}/wp-json/custom/v1/course-sections?course_id=${courseId}`, {
      method: "GET",
      next: { revalidate: 600 },
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error("Lỗi khi lấy danh sách Section Headings:", error);
  }

  return [];
}

/**
 * Lấy Display and Content Options của LearnDash (Materials, Video Progression, Assignments, Timer...)
 */
export async function getLearnDashDisplayOptions(postId: string | number, userId?: string | number) {
  const wpUrl = process.env.WORDPRESS_URL;
  if (!wpUrl || !postId) return null;

  try {
    const url = userId
      ? `${wpUrl}/wp-json/custom/v1/display-options?post_id=${postId}&user_id=${userId}`
      : `${wpUrl}/wp-json/custom/v1/display-options?post_id=${postId}`;

    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error("Lỗi khi lấy Display and Content Options của LearnDash:", error);
  }

  return null;
}

/**
 * Lưu trạng thái đã xem hết video bài học lên WordPress Backend User Meta
 */
export async function recordVideoProgress(userId: string | number, postId: string | number) {
  const wpUrl = process.env.WORDPRESS_URL;
  if (!wpUrl || !userId || !postId) return { success: false };

  try {
    const res = await fetch(`${wpUrl}/wp-json/custom/v1/video-progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        post_id: postId,
      }),
      cache: "no-store",
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error("Lỗi khi lưu tiến trình xem video:", error);
  }

  return { success: false };
}

/**
 * Đánh dấu hoàn thành bài học / chủ đề LearnDash
 */
export async function markLearnDashComplete(userId: string | number, courseId: string | number, postId: string | number) {
  const wpUrl = process.env.WORDPRESS_URL;
  if (!wpUrl || !userId || !postId) return { success: false, message: "Thiếu thông tin người dùng hoặc bài học" };

  try {
    const res = await fetch(`${wpUrl}/wp-json/custom/v1/mark-complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        course_id: courseId,
        post_id: postId,
      }),
      cache: "no-store",
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (error: any) {
    console.error("Lỗi khi đánh dấu hoàn thành bài học:", error);
    return { success: false, message: error.message };
  }

  return { success: false, message: "Không thể gửi yêu cầu đánh dấu hoàn thành" };
}


