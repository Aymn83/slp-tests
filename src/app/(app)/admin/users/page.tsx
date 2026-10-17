import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { approveUserAction, setUserStatusAction } from "@/lib/admin-actions";
import { formatDate, getDict } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { SubmitButton } from "@/components/ui";
import { UserStatusBadge } from "@/components/status-badge";
import { CreateUserForm, PackageSelect } from "../forms";

export default async function UsersPage() {
  await requireAdmin();
  const { lang, t } = await getDict();
  const [pending, users, packages] = await Promise.all([
    prisma.user.findMany({ where: { status: "pending" }, orderBy: { createdAt: "asc" } }),
    prisma.user.findMany({
      where: { status: { not: "pending" } },
      orderBy: { createdAt: "desc" },
      include: { package: true, _count: { select: { cases: true } } },
    }),
    prisma.package.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, nameEn: true } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="h1">{t.users}</h1>

      <section className="card space-y-4">
        <h2 className="h2">
          {t.pendingRequests} {pending.length > 0 && <span className="badge bg-amber-100 text-amber-800">{pending.length}</span>}
        </h2>
        {pending.length === 0 && <p className="muted">{t.noPending}</p>}
        {pending.map((u) => (
          <div key={u.id} className="rounded-xl border border-line p-4">
            <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="font-bold">{u.fullName}</span>
              <span className="muted" dir="ltr">@{u.username}</span>
              {u.jobTitle && <span className="muted">{u.jobTitle}</span>}
              {u.organization && <span className="muted">{u.organization}</span>}
              {u.phone && <span className="muted" dir="ltr">{u.phone}</span>}
              {u.email && <span className="muted" dir="ltr">{u.email}</span>}
              <span className="muted">
                {t.requestedAt}: {formatDate(lang, u.createdAt)}
              </span>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <form action={approveUserAction} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="id" value={u.id} />
                <div className="w-48">
                  <label className="label">{t.package}</label>
                  <PackageSelect t={t} lang={lang} packages={packages} value={packages[0]?.id} />
                </div>
                <div className="w-44">
                  <label className="label">{t.expiresAt}</label>
                  <input type="date" name="expiresAt" className="input" />
                </div>
                <SubmitButton>{t.approve}</SubmitButton>
              </form>
              <form action={setUserStatusAction}>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="status" value="rejected" />
                <SubmitButton className="btn btn-danger">{t.reject}</SubmitButton>
              </form>
            </div>
          </div>
        ))}
      </section>

      <details className="card">
        <summary className="h2 cursor-pointer">{t.createUser}</summary>
        <div className="mt-4 max-w-2xl">
          <CreateUserForm t={t} lang={lang} packages={packages} />
        </div>
      </details>

      <section className="card overflow-x-auto">
        <h2 className="h2 mb-3">{t.allUsers}</h2>
        <table className="table min-w-[760px]">
          <thead>
            <tr>
              <th>{t.fullName}</th>
              <th>{t.organization}</th>
              <th>{t.package}</th>
              <th>{t.status}</th>
              <th>{t.expiresAt}</th>
              <th>{t.casesCount}</th>
              <th>{t.lastLogin}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="font-semibold">
                    {u.fullName} {u.role === "admin" && <span className="badge bg-brand-soft text-brand-dark">{t.roleAdmin}</span>}
                  </div>
                  <div className="muted" dir="ltr">@{u.username}</div>
                </td>
                <td>{u.organization ?? "—"}</td>
                <td>{u.role === "admin" ? "—" : u.package ? (lang === "en" && u.package.nameEn) || u.package.name : t.noPackage}</td>
                <td>
                  <UserStatusBadge user={u} t={t} />
                </td>
                <td>{u.expiresAt ? formatDate(lang, u.expiresAt) : t.noExpiry}</td>
                <td>{u._count.cases}</td>
                <td>{u.lastLoginAt ? formatDate(lang, u.lastLoginAt) : t.never}</td>
                <td>
                  <Link href={`/admin/users/${u.id}`} className="btn btn-sm">
                    {t.manageUser}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
