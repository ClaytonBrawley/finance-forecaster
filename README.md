# Finance Forecaster

A personal finance forecasting web application. Early-stage — project scaffold only, no financial
logic implemented yet.

## Stack

- **Frontend:** Angular, TypeScript, Tailwind CSS, [spartan/ui](https://spartan.ng)
- **Backend:** Node.js, TypeScript, Express
- **Database:** SQLite for local development, via Prisma (abstracted so a production database
  can be swapped in later)

## Project structure

```
src/
  web/   Angular frontend
  api/   Express + TypeScript API
```

## Getting started

```bash
npm install

# in one terminal
npm run web   # Angular dev server — http://localhost:4300

# in another terminal
npm run api   # Express API — http://localhost:4000
```

Copy `src/api/.env.example` to `src/api/.env` before running the API.

## Privacy

This repository is public, but the author's real financial data is not and never will be.
Example/seed/test data in this repo is always fictional and generic (e.g. rent, utilities,
subscriptions) — never real balances, transactions, account details, or personal information.
