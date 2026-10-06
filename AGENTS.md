# notification-service

> Demo code written for the VulnFleet / Cursor exercise. Northwind Commerce is
> fictional. The lodash pin (4.17.20, historical CVE-2021-23337) is deliberate.

## What this is

The Northwind Commerce notification service: it builds and sends the one-time
sign-in ("magic link") messages shoppers and merchant staff use to log in.
White-label tenants can brand the message body. It is on the login path, so a
bug here is either a lockout (nobody can sign in) or an account-takeover risk.

## CMDB

| Field | Value |
|---|---|
| Tier | 1 |
| Exposure | internet-facing |
| Data class | PII |
| Owner | platform-team |

## Install, build, test

```bash
npm ci         # install exactly what package-lock.json records
npm test       # node --import tsx --test "test/**/*.test.ts"
npm start      # tsx src/server.ts, port 3000 (PORT overrides)
npx tsc --noEmit  # typecheck (no build step: TypeScript runs through tsx)
```

## Conventions

- `POST /api/notify` lives in `src/routes/notify.ts`; message building lives in
  `src/auth/token-templater.ts`.
- `src/auth/**` is a protected path: any change needs a named human approval
  (see `src/auth/APPROVAL_POLICY.md`). Agents may read it and propose a change,
  but stop for approval before editing it.
- Never log or return the sign-in token; responses redact it.
- Tests live in `test/*.test.ts` and start the real app on port 0.
- Remediation conventions: `.cursor/rules/northwind-remediation.mdc`.
  Fix procedure: the `northwind-safe-fix` skill.

## Cursor Cloud specific instructions

Verify command:

```bash
npm ci && npm test
```

Before editing, run the verify command. If it fails, stop and report the failing command and output.

- The environment's install step (`.cursor/environment.json`) already runs `npm ci`.
- No secrets are needed: delivery is out of scope and the service only returns
  the message it would send.
