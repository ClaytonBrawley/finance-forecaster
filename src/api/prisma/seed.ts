// Generic, fictional seed data only — see docs/PRIVATE_PRODUCT_VISION.md for the
// real-content policy. Nothing here should ever be a real balance or expense.
import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaMssql(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.expenseRule.deleteMany();
  await prisma.vault.deleteMany();
  await prisma.dailyPlan.deleteMany();
  await prisma.earningsPlan.deleteMany();
  await prisma.setting.deleteMany();

  const [bills, savings, spending, emergency] = await Promise.all([
    prisma.vault.create({
      data: { name: "Bills", currentBalance: 300, priority: 1, minTransfer: 100, sortOrder: 0 },
    }),
    prisma.vault.create({
      data: { name: "Savings", currentBalance: 800, priority: 2, minTransfer: 25, sortOrder: 1 },
    }),
    prisma.vault.create({
      data: { name: "Spending", currentBalance: 150, priority: 3, minTransfer: 10, sortOrder: 2 },
    }),
    prisma.vault.create({
      data: {
        name: "Emergency Fund",
        currentBalance: 1000,
        priority: 4,
        minTransfer: 100,
        emergencyEligible: true,
        sortOrder: 3,
      },
    }),
  ]);

  // Sunday = 0 .. Saturday = 6. Simple generic weekday/weekend split.
  const weekendEarnings = { low: 50, default: 150, high: 250 };
  const weekdayEarnings = { low: 0, default: 80, high: 160 };
  await prisma.earningsPlan.createMany({
    data: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      ...(weekday === 0 || weekday === 6 ? weekendEarnings : weekdayEarnings),
    })),
  });

  await prisma.expenseRule.createMany({
    data: [
      { name: "Rent", amount: 1200, recurrenceType: "MONTHLY_DATE", dayOfMonth: 1, vaultId: bills.id },
      { name: "Utilities", amount: 150, recurrenceType: "MONTHLY_DATE", dayOfMonth: 15, vaultId: bills.id },
      { name: "Streaming Subscription", amount: 15, recurrenceType: "MONTHLY_DATE", dayOfMonth: 5, vaultId: spending.id },
      { name: "Groceries", amount: 100, recurrenceType: "WEEKLY", weekday: 6, vaultId: spending.id },
    ],
  });

  await prisma.setting.create({
    data: { id: "singleton", remainingCash: 500, preferredRemainingCash: 300 },
  });

  console.log("Seeded generic fictional data:", {
    vaults: [bills.name, savings.name, spending.name, emergency.name],
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
