// سجل الأنشطة التدريبية — يُستخدم في الخادم فقط لأنه يتضمن مفاتيح التصحيح
import { caseLabMeta } from "./case-lab/content";
import { caseLabDebrief, caseLabDiscussion, caseLabKey, caseLabMessage } from "./case-lab/key";

export const activities = {
  [caseLabMeta.id]: {
    meta: caseLabMeta,
    key: caseLabKey,
    debrief: caseLabDebrief,
    discussion: caseLabDiscussion,
    message: caseLabMessage,
  },
};

export type ActivityId = keyof typeof activities;

export function getActivity(id: string) {
  return (activities as Record<string, (typeof activities)[ActivityId]>)[id];
}

export const activityList = Object.values(activities);
