import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "./generated/prisma/client.js";

const adapter = new PrismaMssql(process.env.DATABASE_URL!);

export const prisma = new PrismaClient({ adapter });
