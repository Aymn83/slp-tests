import type { User } from "@prisma/client";
import { isExpired } from "@/lib/auth";
import type { Dict } from "@/lib/i18n";

export function UserStatusBadge({ user, t }: { user: Pick<User, "status" | "role" | "expiresAt">; t: Dict }) {
  if (user.status === "active" && isExpired(user))
    return <span className="badge bg-gray-100 text-gray-700">{t.statusExpired}</span>;
  const map: Record<string, [string, string]> = {
    pending: [t.statusPending, "bg-amber-100 text-amber-800"],
    active: [t.statusActive, "bg-emerald-100 text-emerald-800"],
    suspended: [t.statusSuspended, "bg-red-100 text-red-700"],
    rejected: [t.statusRejected, "bg-gray-100 text-gray-600"],
  };
  const [label, cls] = map[user.status] ?? [user.status, "bg-gray-100"];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function AssessmentStatusBadge({ status, t }: { status: string; t: Dict }) {
  return status === "final" ? (
    <span className="badge bg-emerald-100 text-emerald-800">{t.final}</span>
  ) : (
    <span className="badge bg-amber-100 text-amber-800">{t.draft}</span>
  );
}
