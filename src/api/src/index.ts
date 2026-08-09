import cors from "cors";
import express from "express";
import { prisma } from "./db.js";
import { computeForecast } from "./forecast.js";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/vaults", async (_req, res) => {
  const vaults = await prisma.vault.findMany({ where: { archived: false }, orderBy: { sortOrder: "asc" } });
  res.json(vaults);
});

app.get("/api/forecast", async (req, res) => {
  const days = Number(req.query.days ?? 30);
  const forecast = await computeForecast(prisma, Number.isFinite(days) && days > 0 ? days : 30);
  res.json(forecast);
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
