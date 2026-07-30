import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json();

    // Kiểm tra dữ liệu đầu vào cơ bản
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ thông tin yêu cầu" },
        { status: 400 }
      );
    }

    const wpUrl = process.env.WORDPRESS_URL;
    const adminUsername = process.env.WORDPRESS_API_USERNAME;
    const adminPassword = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

    if (!wpUrl || !adminUsername || !adminPassword) {
      return NextResponse.json(
        { error: "Hệ thống chưa được cấu hình thông tin đăng ký. Vui lòng liên hệ Admin." },
        { status: 500 }
      );
    }

    // Mã hóa thông tin Admin Credentials để gọi API của WordPress với quyền hạn tạo User
    const credentials = Buffer.from(`${adminUsername}:${adminPassword}`).toString("base64");

    // Gọi API của WordPress để tạo người dùng mới
    const apiUrl = `${wpUrl}/wp-json/wp/v2/users`;
    
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        email: email,
        password: password,
        roles: ["subscriber"], // Phân quyền là Thành viên học viên mặc định
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Xử lý các lỗi trả về từ WordPress (Ví dụ: Email hoặc Username đã tồn tại)
      let errorMessage = "Đăng ký không thành công.";
      
      if (data.code === "existing_user_login") {
        errorMessage = "Tên đăng nhập này đã tồn tại trên hệ thống.";
      } else if (data.code === "existing_user_email") {
        errorMessage = "Địa chỉ Email này đã được đăng ký tài khoản.";
      } else if (data.message) {
        errorMessage = data.message;
      }

      return NextResponse.json({ error: errorMessage }, { status: res.status });
    }

    // Đăng ký thành công, trả về thông tin user (đã ẩn password)
    return NextResponse.json({
      success: true,
      user: {
        id: data.id,
        username: data.username,
        email: data.email,
        name: data.name,
      }
    });

  } catch (error: any) {
    console.error("Lỗi đăng ký:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi hệ thống trong quá trình đăng ký." },
      { status: 500 }
    );
  }
}
