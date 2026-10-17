// صورة الاختصاصي أو الحرف الأول من اسمه إن لم تكن له صورة
export function SpecialistAvatar({
  id,
  name,
  hasPhoto,
  version,
  className = "h-16 w-16 text-2xl",
}: {
  id: string;
  name: string;
  hasPhoto: boolean;
  version: Date;
  className?: string;
}) {
  if (hasPhoto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/specialists/${id}/photo?v=${version.getTime()}`}
        alt={name}
        className={`${className} shrink-0 rounded-full border border-line object-cover`}
      />
    );
  }
  return (
    <span className={`${className} flex shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand-dark`} aria-hidden="true">
      {name.trim().charAt(0)}
    </span>
  );
}
