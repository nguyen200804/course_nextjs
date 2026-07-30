import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên đăng nhập và mật khẩu" },
        { status: 400 }
      );
    }

    const wpUrl = process.env.WORDPRESS_URL;
    if (!wpUrl) {
      return NextResponse.json(
        { error: "Hệ thống chưa được cấu hình URL WordPress." },
        { status: 500 }
      );
    }

    let userData: { id: number; username: string; email?: string; name?: string } | null = null;
    let authError = "Tên đăng nhập hoặc mật khẩu không chính xác.";

    // 1. Thử gọi API Đăng nhập tùy chỉnh
    try {
      const customRes = await fetch(`${wpUrl}/wp-json/custom/v1/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        cache: "no-store",
      });

      if (customRes.ok) {
        const data = await customRes.json();
        userData = {
          id: data.id,
          username: data.username || username,
          email: data.email,
          name: data.name || data.username || username,
        };
      } else {
        const data = await customRes.json().catch(() => ({}));
        if (data.message) authError = data.message;
      }
    } catch {
      // Bỏ qua lỗi để thử fallback
    }

    // 2. Nếu Custom API chưa cài đặt, fallback sang API chuẩn WordPress REST API
    if (!userData) {
      const credentials = Buffer.from(`${username}:${password}`).toString("base64");
      const meRes = await fetch(`${wpUrl}/wp-json/wp/v2/users/me?context=edit`, {
        method: "GET",
        headers: {
          "Authorization": `Basic ${credentials}`,
        },
        cache: "no-store",
      });

      if (meRes.ok) {
        const data = await meRes.json();
        userData = {
          id: data.id,
          username: data.slug || data.username || username,
          email: data.email,
          name: data.name || username,
        };
      } else {
        const data = await meRes.json().catch(() => ({}));
        if (data.message) authError = data.message;
      }
    }

    if (!userData) {
      return NextResponse.json(
        { error: authError },
        { status: 401 }
      );
    }

    const data = userData;

    // Đăng nhập thành công, thiết lập Cookie phiên
    const cookieStore = await cookies();
    
    // Cookie 1: Lưu thông tin cơ bản để hiển thị ở Client Components
    cookieStore.set("session_user", JSON.stringify({
      id: data.id,
      username: data.username,
      email: data.email,
      name: data.name,
    }), {
      path: "/",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 ngày
    });

    // Cookie 2: Lưu trạng thái đăng nhập bảo mật (HTTP-only)
    cookieStore.set("session_auth", "authenticated", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: data.id,
        username: data.username,
        email: data.email,
        name: data.name,
      }
    });

  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi hệ thống trong quá trình đăng nhập." },
      { status: 500 }
    );
  }
}
