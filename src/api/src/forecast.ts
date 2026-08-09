import type { PrismaClient } from "./generated/prisma/client.js";

export interface ForecastDay {
  date: string;
  expectedIn: number;
  expectedOut: number;
  total: number;
  vaults: Record<string, number>;
  allocations: Record<string, number>;
  remaining: number;
}

export interface ForecastVault {
  id: string;
  name: string;
}

export interface ForecastResult {
  vaults: ForecastVault[];
  days: ForecastDay[];
}

// Dates are treated as local calendar days end to end (matches how `today` and each
// forecast day below are constructed), never converted through UTC — otherwise a
// timezone ahead of UTC would shift stored dates to the previous day on read-back.
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export async function computeForecast(prisma: PrismaClient, days: number): Promise<ForecastResult> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(today);
  rangeEnd.setDate(rangeEnd.getDate() + days);

  const [vaults, earningsPlans, dailyPlans, expenseRules, allocations, setting] = await Promise.all([
    prisma.vault.findMany({ where: { archived: false }, orderBy: { sortOrder: "asc" } }),
    prisma.earningsPlan.findMany(),
    prisma.dailyPlan.findMany(),
    prisma.expenseRule.findMany({ where: { active: true } }),
    prisma.forecastAllocation.findMany({ where: { date: { gte: today, lt: rangeEnd } } }),
    prisma.setting.findUnique({ where: { id: "singleton" } }),
  ]);

  const earningsByWeekday = new Map(earningsPlans.map((plan) => [plan.weekday, plan]));
  const dailyPlanByDate = new Map(dailyPlans.map((plan) => [toDateKey(plan.date), plan]));
  const allocationsByDate = new Map<string, typeof allocations>();
  for (const allocation of allocations) {
    const key = toDateKey(allocation.date);
    const list = allocationsByDate.get(key) ?? [];
    list.push(allocation);
    allocationsByDate.set(key, list);
  }

  let remainingCash = setting?.remainingCash ?? 0;
  const vaultBalances = new Map(vaults.map((vault) => [vault.id, vault.currentBalance]));
  const vaultById = new Map(vaults.map((vault) => [vault.id, vault]));

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

    const allocationsRow: Record<string, number> = {};
    for (const allocation of allocationsByDate.get(dateKey) ?? []) {
      const vault = vaultById.get(allocation.vaultId);
      if (!vault) continue;
      vaultBalances.set(allocation.vaultId, vaultBalances.get(allocation.vaultId)! + allocation.amount);
      remainingCash -= allocation.amount;
      allocationsRow[vault.name] = allocation.amount;
    }

    const vaultsRow: Record<string, number> = {};
    for (const vault of vaults) {
      vaultsRow[vault.name] = vaultBalances.get(vault.id) ?? 0;
    }
    const total = remainingCash + [...vaultBalances.values()].reduce((sum, balance) => sum + balance, 0);

    rows.push({
      date: dateKey,
      expectedIn,
      expectedOut,
      total,
      vaults: vaultsRow,
      allocations: allocationsRow,
      remaining: remainingCash,
    });
  }

  return { vaults: vaults.map((v) => ({ id: v.id, name: v.name })), days: rows };
}
