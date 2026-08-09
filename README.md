# Finance Forecaster

A personal finance forecasting web application. Early-stage — project scaffold only, no financial
logic implemented yet.

## Stack

- **Frontend:** Angular, TypeScript, Tailwind CSS, [spartan/ui](https://spartan.ng)
- **Backend:** Node.js, TypeScript, Express
- **Database:** SQL Server (via Prisma), local dev connects to a `finance_forecaster` database on
  a local SQL Server-compatible container shared across projects

## Project structure

```
src/
  web/   Angular frontend
  api/   Express + TypeScript API
```

## Getting started

Requires a running SQL Server-compatible instance on `localhost:1433` with a `finance_forecaster`
database created (e.g. `CREATE DATABASE finance_forecaster;`). Copy `src/api/.env.example` to
`src/api/.env` and fill in the connection details before running the API.

```bash
npm install

# apply the schema and seed generic example data (from src/api/)
npx prisma migrate dev
npx tsx --env-file=.env prisma/seed.ts

# in one terminal
npm run web   # Angular dev server — http://localhost:4300

# in another terminal
npm run api   # Express API — http://localhost:4000
```

## Privacy

This repository is public, but the author's real financial data is not and never will be.
Example/seed/test data in this repo is always fictional and generic (e.g. rent, utilities,
subscriptions) — never real balances, transactions, account details, or personal information.
