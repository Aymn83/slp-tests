import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { photoMime } from "@/lib/specialists";

// الصورة الشخصية للمستخدم الحالي فقط (خاصة — لا تُعرض لغيره)
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return new Response(null, { status: 401 });
  const u = await prisma.user.findUnique({ where: { id: me.id }, select: { photo: true } });
  if (!u?.photo) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(u.photo), {
    headers: { "Content-Type": photoMime(u.photo), "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" },
  });
}
