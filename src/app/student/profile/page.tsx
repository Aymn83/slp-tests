import { requireStudentArea } from "@/lib/auth";
import { getDict } from "@/lib/i18n";
import { ProfilePageBody } from "@/components/profile-page";

export default async function StudentProfilePage() {
  const user = await requireStudentArea();
  const { t } = await getDict();
  return <ProfilePageBody user={user} t={t} />;
}
