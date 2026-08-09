import type { PrismaClient } from "./generated/prisma/client.js";

export interface ForecastDay {
  date: string;
  expectedIn: number;
  expectedOut: number;
  total: number;
  vaults: Record<string, number>;
  remaining: number;
}

export interface ForecastResult {
  vaultNames: string[];
  days: ForecastDay[];
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function computeForecast(prisma: PrismaClient, days: number): Promise<ForecastResult> {
  const [vaults, earningsPlans, dailyPlans, expenseRules, setting] = await Promise.all([
    prisma.vault.findMany({ where: { archived: false }, orderBy: { sortOrder: "asc" } }),
    prisma.earningsPlan.findMany(),
    prisma.dailyPlan.findMany(),
    prisma.expenseRule.findMany({ where: { active: true } }),
    prisma.setting.findUnique({ where: { id: "singleton" } }),
  ]);

  const earningsByWeekday = new Map(earningsPlans.map((plan) => [plan.weekday, plan]));
  const dailyPlanByDate = new Map(dailyPlans.map((plan) => [toDateKey(plan.date), plan]));

  let remainingCash = setting?.remainingCash ?? 0;
  const vaultBalances = new Map(vaults.map((vault) => [vault.id, vault.currentBalance]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows: ForecastDay[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateKey = toDateKey(date);
    const weekday = date.getDay();
    const dayOfMonth = date.getDate();

    const dailyPlan = dailyPlanByDate.get(dateKey);
    const mode = dailyPlan?.mode ?? "DEFAULT";
    const earningsPlan = earningsByWeekday.get(weekday);
    const expectedIn =
      mode === "CUSTOM"
        ? (dailyPlan?.customAmount ?? 0)
        : (earningsPlan?.[mode.toLowerCase() as "low" | "default" | "high"] ?? 0);

    const triggeredRules = expenseRules.filter((rule) => {
      if (rule.recurrenceType === "MONTHLY_DATE") return rule.dayOfMonth === dayOfMonth;
      if (rule.recurrenceType === "WEEKLY") return rule.weekday === weekday;
      return false;
    });
    const expectedOut = triggeredRules.reduce((sum, rule) => sum + rule.amount, 0);

    remainingCash += expectedIn;
    for (const rule of triggeredRules) {
      if (rule.vaultId && vaultBalances.has(rule.vaultId)) {
        vaultBalances.set(rule.vaultId, vaultBalances.get(rule.vaultId)! - rule.amount);
      } else {
        remainingCash -= rule.amount;
      }
    }

    const vaultsRow: Record<string, number> = {};
    for (const vault of vaults) {
      vaultsRow[vault.name] = vaultBalances.get(vault.id) ?? 0;
    }
    const total = remainingCash + [...vaultBalances.values()].reduce((sum, balance) => sum + balance, 0);

    rows.push({ date: dateKey, expectedIn, expectedOut, total, vaults: vaultsRow, remaining: remainingCash });
  }

  return { vaultNames: vaults.map((v) => v.name), days: rows };
}
