import { requireUser } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { ProfilePageBody } from "@/components/profile-page";

export default async function ProfilePage() {
  const user = await requireUser();
  const { t } = await getDict();
  return <ProfilePageBody user={user} t={t} />;
}
