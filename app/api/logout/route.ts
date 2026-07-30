import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Xóa bỏ các cookie phiên đăng nhập
    cookieStore.delete("session_user");
    cookieStore.delete("session_auth");

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi đăng xuất" }, { status: 500 });
  }
}
