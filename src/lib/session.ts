import { SignJWT, jwtVerify } from "jose";

// وحدة آمنة للحافة — تُستخدم في proxy ولا تعتمد على next/headers.
export const SESSION_COOKIE = "slp_session";
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 ساعة

export type SessionPayload = { userId: string };

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET غير مضبوط في البيئة");
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return { userId: String(payload.userId) };
  } catch {
    return null;
  }
}
