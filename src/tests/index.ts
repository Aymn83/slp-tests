import type { RegisteredTest, TestDefinition } from "./types";
import { demoArticulation } from "./demo-articulation";
import { shamMeta } from "./sham/meta";
import { matrixMeta } from "./matrix/meta";

function generic(def: TestDefinition): RegisteredTest {
  return {
    kind: "generic",
    def,
    meta: {
      id: def.id,
      version: def.version,
      demo: def.demo,
      name: def.name,
      description: def.description,
      ageRange: def.ageRange,
      sectionsCount: def.sections.length,
      itemsCount: def.sections.reduce((a, s) => a + s.items.length, 0),
    },
  };
}

// سجل الاختبارات — أضف كل اختبار جديد هنا
export const allTests: RegisteredTest[] = [
  { kind: "sham", meta: shamMeta },
  { kind: "matrix", meta: matrixMeta },
  generic(demoArticulation),
];

export function getTest(id: string): RegisteredTest | undefined {
  return allTests.find((t) => t.meta.id === id);
}
