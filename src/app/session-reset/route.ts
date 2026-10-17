import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

// يحذف جلسة صالحة التوقيع لكن صاحبها لم يعد موجوداً (مثلاً بعد إعادة إنشاء القاعدة)،
// وإلا تدور الطلبات بين /login و /dashboard بلا نهاية.
export function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/login", req.url));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
