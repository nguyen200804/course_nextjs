import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserWishlist, toggleUserWishlist } from "@/lib/wordpress";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let userId = searchParams.get("user_id");

    if (!userId) {
      const cookieStore = await cookies();
      const userCookie = cookieStore.get("session_user");
      if (userCookie) {
        try {
          const user = JSON.parse(userCookie.value);
          userId = user.id;
        } catch (_) {}
      }
    }

    if (!userId) {
      return NextResponse.json({ wishlist: [] });
    }

    const wishlist = await getUserWishlist(userId);
    return NextResponse.json({ wishlist });
  } catch (error: any) {
    console.error("Lỗi API Wishlist GET:", error);
    return NextResponse.json({ wishlist: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { userId, courseId } = body;

    if (!userId) {
      const cookieStore = await cookies();
      const userCookie = cookieStore.get("session_user");
      if (userCookie) {
        try {
          const user = JSON.parse(userCookie.value);
          userId = user.id;
        } catch (_) {}
      }
    }

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: "Missing userId or courseId" },
        { status: 400 }
      );
    }

    const result = await toggleUserWishlist(userId, courseId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Lỗi API Wishlist POST:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
