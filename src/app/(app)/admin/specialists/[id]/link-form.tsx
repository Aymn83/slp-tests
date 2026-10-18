"use client";

import { useActionState } from "react";
import { linkSpecialistAccountAction } from "@/lib/specialist-actions";
import type { Dict } from "@/lib/i18n";
import { FormMessage, SubmitButton } from "@/components/ui";

type Member = { id: string; fullName: string; username: string };

// ربط صفحة الاختصاصي بحساب عضو ليعدّلها بنفسه
export function LinkAccountForm({ t, id, userId, members }: { t: Dict; id: string; userId: string | null; members: Member[] }) {
  const [state, action] = useActionState(linkSpecialistAccountAction, null);
  return (
    <form action={action} className="card space-y-3">
      <input type="hidden" name="id" value={id} />
      <div>
        <label className="label" htmlFor="link-user">
          {t.linkedAccount}
        </label>
        <p className="muted mb-2 text-xs">{t.linkedAccountHint}</p>
        <div className="flex flex-wrap gap-2">
          <select id="link-user" name="userId" defaultValue={userId ?? ""} className="input max-w-sm">
            <option value="">{t.noLinkedAccount}</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName} (@{m.username})
              </option>
            ))}
          </select>
          <SubmitButton className="btn">{t.save}</SubmitButton>
        </div>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
