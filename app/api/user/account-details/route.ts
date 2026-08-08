import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// GET: Lấy thông tin tài khoản (Account Details) từ WordPress / WooCommerce
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionUserCookie = cookieStore.get("session_user")?.value;

    if (!sessionUserCookie) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }

    let sessionUser: { id: number; username: string; email?: string; name?: string } | null = null;
    try {
      sessionUser = JSON.parse(sessionUserCookie);
    } catch {
      return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ." }, { status: 401 });
    }

    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Thông tin người dùng không hợp lệ." }, { status: 401 });
    }

    const wpUrl = process.env.WORDPRESS_URL;
    const username = process.env.WORDPRESS_API_USERNAME;
    const password = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

    let accountDetails = {
      id: sessionUser.id,
      firstName: "",
      lastName: "",
      displayName: sessionUser.name || sessionUser.username || "",
      email: sessionUser.email || "",
    };

    if (wpUrl) {
      // 1. Thử gọi qua Custom REST API endpoint `/custom/v1/account-details`
      try {
        const customRes = await fetch(
          `${wpUrl}/wp-json/custom/v1/account-details?user_id=${sessionUser.id}`,
          { cache: "no-store" }
        );
        if (customRes.ok) {
          const customData = await customRes.json();
          return NextResponse.json({
            id: sessionUser.id,
            firstName: customData.first_name || "",
            lastName: customData.last_name || "",
            displayName: customData.display_name || customData.name || accountDetails.displayName,
            email: customData.email || accountDetails.email,
            bio: customData.bio || customData.description || "",
            avatarUrl: customData.avatar_url || (sessionUser as any).avatarUrl || (sessionUser as any).avatar || "",
          });
        }
      } catch {
        // Fallback
      }

      // 2. Fallback: Lấy qua WordPress REST API /wp/v2/users/{id}
      if (username && password) {
        const credentials = Buffer.from(`${username}:${password}`).toString("base64");
        try {
          const res = await fetch(`${wpUrl}/wp-json/wp/v2/users/${sessionUser.id}?context=edit`, {
            headers: { Authorization: `Basic ${credentials}` },
            cache: "no-store",
          });
          if (res.ok) {
            const data = await res.json();
            accountDetails.firstName = data.first_name || "";
            accountDetails.lastName = data.last_name || "";
            accountDetails.displayName = data.name || data.slug || accountDetails.displayName;
            accountDetails.email = data.email || accountDetails.email;
            (accountDetails as any).avatarUrl = data.avatar_urls?.['96'] || data.avatar_urls?.['48'] || (sessionUser as any).avatarUrl || "";
          }
        } catch (err) {
          console.error("Lỗi tải account details WP:", err);
        }
      }
    }

    return NextResponse.json(accountDetails);
  } catch (error) {
    console.error("Lỗi GET account details:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi tải thông tin tài khoản." }, { status: 500 });
  }
}

// POST: Lưu thông tin tài khoản & đổi mật khẩu lên WordPress / WooCommerce
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserCookie = cookieStore.get("session_user")?.value;

    if (!sessionUserCookie) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }

    let sessionUser: { id: number; username: string; email?: string; name?: string } | null = null;
    try {
      sessionUser = JSON.parse(sessionUserCookie);
    } catch {
      return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ." }, { status: 401 });
    }

    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Thông tin người dùng không hợp lệ." }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      displayName,
      email,
      bio,
      currentPassword,
      newPassword,
      confirmPassword,
    } = body;

    // Kiểm tra dữ liệu bắt buộc
    if (!firstName?.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập First name." }, { status: 400 });
    }
    if (!lastName?.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập Last name." }, { status: 400 });
    }
    if (!displayName?.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập Display name." }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập Email address." }, { status: 400 });
    }

    // Kiểm tra mật khẩu nếu người dùng nhập đổi mật khẩu
    if (newPassword || confirmPassword || currentPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Vui lòng nhập mật khẩu hiện tại." }, { status: 400 });
      }
      if (!newPassword) {
        return NextResponse.json({ error: "Vui lòng nhập mật khẩu mới." }, { status: 400 });
      }
      if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: "Mật khẩu mới và mật khẩu xác nhận không trùng khớp." }, { status: 400 });
      }
    }

    const wpUrl = process.env.WORDPRESS_URL;
    const username = process.env.WORDPRESS_API_USERNAME;
    const password = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

    if (!wpUrl) {
      return NextResponse.json({ error: "Chưa cấu hình WORDPRESS_URL." }, { status: 500 });
    }

    let success = false;
    let errorMessage = "";

    // 1. Thử gửi lên Custom Rest API `/custom/v1/save-account-details`
    try {
      const customRes = await fetch(`${wpUrl}/wp-json/custom/v1/save-account-details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: sessionUser.id,
          first_name: firstName,
          last_name: lastName,
          display_name: displayName,
          email: email,
          bio: bio || "",
          current_password: currentPassword || "",
          new_password: newPassword || "",
        }),
        cache: "no-store",
      });

      if (customRes.ok) {
        success = true;
      } else {
        const errData = await customRes.json().catch(() => ({}));
        if (errData.message) errorMessage = errData.message;
      }
    } catch {
      // Fallback
    }

    // 2. Fallback: Cập nhật qua WordPress REST API `/wp/v2/users/{id}`
    if (!success && username && password) {
      const credentials = Buffer.from(`${username}:${password}`).toString("base64");

      const updatePayload: Record<string, any> = {
        first_name: firstName,
        last_name: lastName,
        name: displayName,
        nickname: displayName,
        email: email,
      };

      if (newPassword) {
        updatePayload.password = newPassword;
      }

      try {
        const wpRes = await fetch(`${wpUrl}/wp-json/wp/v2/users/${sessionUser.id}`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatePayload),
          cache: "no-store",
        });

        if (wpRes.ok) {
          success = true;
        } else {
          const errData = await wpRes.json().catch(() => ({}));
          if (errData.message) errorMessage = errData.message;
        }
      } catch (err) {
        console.error("Lỗi cập nhật WP user account details:", err);
      }

      // Cập nhật WooCommerce Customer
      try {
        await fetch(`${wpUrl}/wp-json/wc/v3/customers/${sessionUser.id}`, {
          method: "PUT",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email: email,
          }),
          cache: "no-store",
        });
      } catch (err) {
        console.warn("Lỗi cập nhật WC Customer details:", err);
      }
    }

    if (!success) {
      return NextResponse.json(
        { error: errorMessage || "Không thể cập nhật thông tin tài khoản. Vui lòng kiểm tra lại." },
        { status: 400 }
      );
    }

    // Cập nhật cookie session_user
    const updatedUser = {
      ...sessionUser,
      name: displayName,
      email: email,
    };

    cookieStore.set("session_user", JSON.stringify(updatedUser), {
      path: "/",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      success: true,
      message: "Account details changed successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Lỗi POST account details:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi cập nhật tài khoản." }, { status: 500 });
  }
}
