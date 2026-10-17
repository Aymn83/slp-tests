import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD غير مضبوط في .env");

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`المدير «${username}» موجود مسبقاً — لم يتغير شيء.`);
  } else {
    await prisma.user.create({
      data: {
        username,
        passwordHash: await bcrypt.hash(password, 10),
        fullName: "مدير الموقع",
        role: "admin",
        status: "active",
      },
    });
    console.log(`تم إنشاء المدير «${username}».`);
  }

  if ((await prisma.package.count()) === 0) {
    await prisma.package.create({
      data: {
        name: "الباقة الأساسية",
        nameEn: "Basic package",
        description: "بطارية الشام + مصفوفة التواصل + الاختبار التجريبي",
        testIds: JSON.stringify(["sham-cas-battery", "communication-matrix", "demo-articulation"]),
      },
    });
    console.log("تم إنشاء «الباقة الأساسية».");
  }
}

main().finally(() => prisma.$disconnect());
