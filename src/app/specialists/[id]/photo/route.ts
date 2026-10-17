import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { photoMime } from "@/lib/specialists";

// صورة الاختصاصي: عامة للمعتمدين فقط، والمدير يرى صور الطلبات قيد المراجعة
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await prisma.specialist.findUnique({ where: { id }, select: { photo: true, status: true } });
  if (!s?.photo) return new Response(null, { status: 404 });
  const approved = s.status === "approved";
  if (!approved) {
    const user = await getCurrentUser();
    if (user?.role !== "admin") return new Response(null, { status: 404 });
  }
  return new Response(new Uint8Array(s.photo), {
    headers: {
      "Content-Type": photoMime(s.photo),
      "Cache-Control": approved ? "public, max-age=3600" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
