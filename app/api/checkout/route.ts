import { NextResponse } from "next/server";
import { getLearnDashCourse, getWooCommerceProductByCourseId } from "@/lib/wordpress";

export async function POST(request: Request) {
  try {
    const { courseId, userId, billing, paymentMethod, paymentMethodTitle, note, productId: clientProductId, attribution } = await request.json();

    const sourceType = attribution?.sourceType || "typein";
    const origin = attribution?.origin || "Direct";
    const referrer = attribution?.referrer || "";
    const utmSource = attribution?.utmSource || "(direct)";

    // Phân loại các trường động từ client gửi lên (bắt đầu bằng billing_, shipping_ hoặc tùy biến)
    const metaData: any[] = [
      { key: "_created_via", value: "checkout" },
      { key: "_wc_order_attribution_source_type", value: sourceType },
      { key: "_wc_order_attribution_origin", value: origin },
      { key: "_wc_order_attribution_referrer", value: referrer },
      { key: "_wc_order_attribution_utm_source", value: utmSource }
    ];
    const billingData: any = {};
    const shippingData: any = {};

    if (!courseId || !userId || !billing) {
      return NextResponse.json(
        { error: "Thiếu thông tin yêu cầu thanh toán." },
        { status: 400 }
      );
    }

    const wpUrl = process.env.WORDPRESS_URL;
    const username = process.env.WORDPRESS_API_USERNAME;
    const password = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

    if (!wpUrl || !username || !password) {
      return NextResponse.json(
        { error: "Hệ thống chưa cấu hình thông tin xác thực WordPress." },
        { status: 500 }
      );
    }

    const credentials = Buffer.from(`${username}:${password}`).toString("base64");

    // 1. Lấy thông tin khóa học
    const course = await getLearnDashCourse(courseId);
    if (!course) {
      return NextResponse.json(
        { error: "Không tìm thấy thông tin khóa học." },
        { status: 404 }
      );
    }

    // 2. Resolve Product ID từ client payload hoặc getWooCommerceProductByCourseId
    let productId = clientProductId ? parseInt(String(clientProductId)) : null;
    if (!productId) {
      const wcProduct = await getWooCommerceProductByCourseId(courseId);
      if (wcProduct) {
        productId = wcProduct.id;
      } else {
        const match = course?.custom_button_url?.match(/add-to-cart=(\d+)/);
        productId = match ? parseInt(match[1]) : parseInt(String(courseId));
      }
    }

    if (!productId) {
      productId = parseInt(String(courseId));
    }

    Object.keys(billing || {}).forEach(key => {
      const val = billing[key];
      if (key.startsWith("billing_")) {
        const cleanKey = key.replace("billing_", "");
        const standardKeys = ["first_name", "last_name", "company", "address_1", "address_2", "city", "state", "postcode", "country", "email", "phone"];
        if (standardKeys.includes(cleanKey)) {
          billingData[cleanKey] = val;
        } else {
          metaData.push({ key: key, value: val });
        }
      } else if (key.startsWith("shipping_")) {
        const cleanKey = key.replace("shipping_", "");
        const standardKeys = ["first_name", "last_name", "company", "address_1", "address_2", "city", "state", "postcode", "country", "phone"];
        if (standardKeys.includes(cleanKey)) {
          shippingData[cleanKey] = val;
        } else {
          metaData.push({ key: key, value: val });
        }
      } else {
        metaData.push({ key: key, value: val });
      }
    });

    // 2. Cập nhật thông tin thanh toán (billing/shipping) cho khách hàng trên WooCommerce
    const updateCustomerUrl = `${wpUrl}/wp-json/wc/v3/customers/${userId}`;
    const updateRes = await fetch(updateCustomerUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ billing: billingData, shipping: shippingData }),
    });

    if (!updateRes.ok) {
      console.error("Lỗi khi cập nhật thông tin khách hàng:", await updateRes.text());
    }

    // 3. Tạo đơn hàng (Order) trên WooCommerce
    const createOrderUrl = `${wpUrl}/wp-json/wc/v3/orders`;
    const orderData = {
      payment_method: paymentMethod,
      payment_method_title: paymentMethodTitle || paymentMethod,
      set_paid: false,
      created_via: "checkout",
      billing: billingData,
      shipping: shippingData,
      meta_data: metaData,
      line_items: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      customer_id: parseInt(userId),
      customer_note: note || "",
    };

    const orderRes = await fetch(createOrderUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    const orderJson = await orderRes.json();

    if (!orderRes.ok) {
      console.error("Lỗi khi tạo đơn hàng trên WooCommerce:", orderJson);
      return NextResponse.json(
        { error: orderJson.message || "Không thể khởi tạo đơn hàng trên WooCommerce." },
        { status: orderRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: orderJson.id,
      status: orderJson.status,
      total: orderJson.total,
    });

  } catch (error) {
    console.error("Lỗi hệ thống khi xử lý checkout:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi hệ thống trong quá trình thanh toán." },
      { status: 500 }
    );
  }
}
