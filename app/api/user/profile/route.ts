import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getWooCommerceCustomer } from "@/lib/wordpress";

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

    let profileData = {
      id: sessionUser.id,
      legalFullName: sessionUser.name || sessionUser.username || "",
      displayName: sessionUser.name || sessionUser.username || "",
      primaryEmail: sessionUser.email || "",
      phoneNumber: "",
      currentRole: "General Dentist",
      clinicName: "",
      officeAddress: "",
      avatarUrl: "",
      stats: {
        enrolledCourses: 0,
        certificates: 0,
        invested: "$0",
      },
    };

    if (wpUrl) {
      // 1. Thử gọi Custom Rest API /custom/v1/user-profile
      try {
        const customRes = await fetch(
          `${wpUrl}/wp-json/custom/v1/user-profile?user_id=${sessionUser.id}`,
          { cache: "no-store" }
        );
        if (customRes.ok) {
          const customData = await customRes.json();
          profileData = {
            ...profileData,
            ...customData,
            legalFullName: customData.legal_full_name || customData.name || profileData.legalFullName,
            displayName: customData.display_name || customData.name || profileData.displayName,
            primaryEmail: customData.email || profileData.primaryEmail,
            phoneNumber: customData.phone_number || profileData.phoneNumber,
            currentRole: customData.current_role || profileData.currentRole,
            clinicName: customData.clinic_name || profileData.clinicName,
            officeAddress: customData.office_address || profileData.officeAddress,
            avatarUrl: customData.avatar_url || profileData.avatarUrl,
            stats: customData.stats || profileData.stats,
          };
          return NextResponse.json(profileData);
        }
      } catch {
        // Fallback sang API tiêu chuẩn
      }

      // 2. Fallback sang WP REST API & WooCommerce Customer API
      if (username && password) {
        const credentials = Buffer.from(`${username}:${password}`).toString("base64");
        
        // WP User details
        try {
          const wpUserRes = await fetch(`${wpUrl}/wp-json/wp/v2/users/${sessionUser.id}?context=edit`, {
            headers: { Authorization: `Basic ${credentials}` },
            cache: "no-store",
          });
          if (wpUserRes.ok) {
            const wpUserData = await wpUserRes.json();
            const fullName = `${wpUserData.first_name || ""} ${wpUserData.last_name || ""}`.trim() || wpUserData.name;
            profileData.legalFullName = fullName || profileData.legalFullName;
            profileData.displayName = wpUserData.name || wpUserData.nickname || profileData.displayName;
            profileData.primaryEmail = wpUserData.email || profileData.primaryEmail;
            profileData.avatarUrl = wpUserData.avatar_urls?.["96"] || profileData.avatarUrl;
            
            if (wpUserData.meta) {
              if (wpUserData.meta.phone_number) profileData.phoneNumber = wpUserData.meta.phone_number;
              if (wpUserData.meta.current_role) profileData.currentRole = wpUserData.meta.current_role;
              if (wpUserData.meta.clinic_name) profileData.clinicName = wpUserData.meta.clinic_name;
              if (wpUserData.meta.office_address) profileData.officeAddress = wpUserData.meta.office_address;
            }
          }
        } catch (err) {
          console.error("Lỗi khi tải thông tin user WordPress:", err);
        }

        // WooCommerce customer details (phone, address, orders count)
        try {
          const customer = await getWooCommerceCustomer(String(sessionUser.id));
          if (customer) {
            if (!profileData.phoneNumber && customer.billing?.phone) {
              profileData.phoneNumber = customer.billing.phone;
            }
            if (!profileData.officeAddress && customer.billing?.address_1) {
              const addrParts = [
                customer.billing.address_1,
                customer.billing.address_2,
                customer.billing.city,
                customer.billing.state,
                customer.billing.country,
              ].filter(Boolean);
              profileData.officeAddress = addrParts.join(", ");
            }
            if (customer.total_spent) {
              profileData.stats.invested = `$${customer.total_spent}`;
            }
          }
        } catch (err) {
          console.warn("Không lấy được dữ liệu WooCommerce customer:", err);
        }

        // LearnDash enrolled courses count
        try {
          const ldRes = await fetch(`${wpUrl}/wp-json/ldlms/v1/users/${sessionUser.id}/courses`, {
            headers: { Authorization: `Basic ${credentials}` },
            cache: "no-store",
          });
          if (ldRes.ok) {
            const courses = await ldRes.json();
            if (Array.isArray(courses)) {
              profileData.stats.enrolledCourses = courses.length;
            }
          }
        } catch (err) {
          console.warn("Không lấy được khóa học LearnDash của user:", err);
        }
      }
    }

    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Lỗi GET user profile:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi tải thông tin hồ sơ." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserCookie = cookieStore.get("session_user")?.value;

    if (!sessionUserCookie) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }

    let sessionUser: { id: number; username: string; email?: string; name?: string } | null = null;
    try {
      sessionUser = JSON.parse(decodeURIComponent(sessionUserCookie));
    } catch {
      try {
        sessionUser = JSON.parse(sessionUserCookie);
      } catch {
        return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ." }, { status: 401 });
      }
    }

    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Thông tin người dùng không hợp lệ." }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";

    // Xử lý Upload Avatar (multipart/form-data)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const avatarFile = formData.get("avatar") as File | null;

      if (!avatarFile) {
        return NextResponse.json({ error: "Vui lòng chọn ảnh đại diện để tải lên." }, { status: 400 });
      }

      const arrayBuffer = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Str = `data:${avatarFile.type || "image/png"};base64,${buffer.toString("base64")}`;

      const wpUrl = process.env.WORDPRESS_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://test4.questx.com.vn";
      const username = process.env.WORDPRESS_API_USERNAME;
      const password = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (username && password) {
        headers["Authorization"] = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
      }

      const uploadRes = await fetch(`${wpUrl}/wp-json/custom/v1/upload-avatar`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id: sessionUser.id,
          avatar_base64: base64Str,
        }),
      });

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        const avatarUrl = uploadData.avatar_url;

        const updatedSession = { ...sessionUser, avatarUrl: avatarUrl, avatar: avatarUrl };
        const response = NextResponse.json({
          success: true,
          message: "Avatar updated successfully!",
          avatarUrl: avatarUrl,
        });

        response.cookies.set("session_user", JSON.stringify(updatedSession), {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 30,
        });

        return response;
      } else {
        const errData = await uploadRes.json().catch(() => ({}));
        return NextResponse.json({ error: errData.message || "Không thể tải ảnh đại diện lên máy chủ." }, { status: 500 });
      }
    }

    const body = await request.json();
    const {
      legalFullName,
      displayName,
      phoneNumber,
      currentRole,
      clinicName,
      officeAddress,
    } = body;

    const wpUrl = process.env.WORDPRESS_URL;
    const username = process.env.WORDPRESS_API_USERNAME;
    const password = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

    if (!wpUrl) {
      return NextResponse.json({ error: "Hệ thống chưa cấu hình WORDPRESS_URL." }, { status: 500 });
    }

    let updatedSuccess = false;
    let errorMessage = "";

    // 1. Thử gửi lên Custom API endpoint `/custom/v1/update-profile`
    try {
      const customRes = await fetch(`${wpUrl}/wp-json/custom/v1/update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: sessionUser.id,
          legal_full_name: legalFullName,
          display_name: displayName,
          phone_number: phoneNumber,
          current_role: currentRole,
          clinic_name: clinicName,
          office_address: officeAddress,
        }),
        cache: "no-store",
      });

      if (customRes.ok) {
        updatedSuccess = true;
      } else {
        const errData = await customRes.json().catch(() => ({}));
        if (errData.message) errorMessage = errData.message;
      }
    } catch {
      // Fallback
    }

    // 2. Fallback: Cập nhật trực tiếp qua WordPress REST API & WooCommerce Customer API
    if (!updatedSuccess && username && password) {
      const credentials = Buffer.from(`${username}:${password}`).toString("base64");
      
      const nameParts = (legalFullName || "").trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      try {
        const wpUpdateRes = await fetch(`${wpUrl}/wp-json/wp/v2/users/${sessionUser.id}`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: displayName || legalFullName,
            first_name: firstName,
            last_name: lastName,
            nickname: displayName,
            meta: {
              phone_number: phoneNumber,
              current_role: currentRole,
              clinic_name: clinicName,
              office_address: officeAddress,
            },
          }),
          cache: "no-store",
        });

        if (wpUpdateRes.ok) {
          updatedSuccess = true;
        } else {
          const errData = await wpUpdateRes.json().catch(() => ({}));
          if (errData.message) errorMessage = errData.message;
        }
      } catch (err) {
        console.error("Lỗi cập nhật WP User API:", err);
      }

      // Cập nhật thông tin WooCommerce Customer billing nếu có
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
            billing: {
              first_name: firstName,
              last_name: lastName,
              phone: phoneNumber,
              address_1: officeAddress,
            },
          }),
          cache: "no-store",
        });
      } catch (err) {
        console.warn("Lỗi cập nhật thông tin WooCommerce customer:", err);
      }
    }

    if (!updatedSuccess) {
      return NextResponse.json(
        { error: errorMessage || "Không thể cập nhật hồ sơ WordPress. Vui lòng thử lại." },
        { status: 400 }
      );
    }

    // Cập nhật lại cookie session_user với thông tin name mới
    const newSessionUser = {
      ...sessionUser,
      name: displayName || legalFullName || sessionUser.name,
    };

    cookieStore.set("session_user", JSON.stringify(newSessionUser), {
      path: "/",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật thông tin cá nhân thành công!",
      user: newSessionUser,
    });
  } catch (error) {
    console.error("Lỗi POST update profile:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi hệ thống trong quá trình cập nhật." },
      { status: 500 }
    );
  }
}
