import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Package, User } from "@prisma/client";
import { prisma } from "./prisma";
import { SESSION_COOKIE, SESSION_MAX_AGE, signToken, verifyToken } from "./session";
import { allTests } from "@/tests";

export type CurrentUser = User & { package: Package | null };

export async function createSession(userId: string): Promise<void> {
  const token = await signToken({ userId });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// يُقرأ المستخدم من قاعدة البيانات في كل طلب — فإيقاف الحساب يسري فوراً
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId }, include: { package: true } });
});

export function isExpired(user: Pick<User, "expiresAt" | "role">): boolean {
  return user.role !== "admin" && !!user.expiresAt && user.expiresAt.getTime() < Date.now();
}

export function canUseSite(user: CurrentUser): boolean {
  return user.role === "admin" || (user.status === "active" && !isExpired(user));
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/session-reset"); // لا جلسة، أو جلسة لمستخدم لم يعد موجوداً
  if (!canUseSite(user)) redirect("/pending");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}

export function parseIds(json: string | null | undefined): string[] {
  try {
    const v = JSON.parse(json || "[]");
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

// الاختبارات المسموحة: المدير يرى الكل، والعضو حسب باقته
export function allowedTestIds(user: CurrentUser): string[] {
  const ids = allTests.map((t) => t.meta.id);
  if (user.role === "admin") return ids;
  const pkg = parseIds(user.package?.testIds);
  return ids.filter((id) => pkg.includes(id));
}
