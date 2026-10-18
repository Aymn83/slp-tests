import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { photoMime } from "@/lib/specialists";

// صورة الاختصاصي: عامة للمعتمدين فقط؛ صور الطلبات قيد المراجعة يراها المدير وصاحب الصفحة
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await prisma.specialist.findUnique({ where: { id }, select: { photo: true, status: true, userId: true } });
  if (!s?.photo) return new Response(null, { status: 404 });
  const approved = s.status === "approved";
  if (!approved) {
    const user = await getCurrentUser();
    if (user?.role !== "admin" && (!user || user.id !== s.userId)) return new Response(null, { status: 404 });
  }
  return new Response(new Uint8Array(s.photo), {
    headers: {
      "Content-Type": photoMime(s.photo),
      "Cache-Control": approved ? "public, max-age=3600" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
