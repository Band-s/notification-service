# notification-service

> **Security demo fixture.** This repository is pinned to a known-affected dependency
> version (`lodash@4.17.20`, CVE-2021-23337) for fix-verification testing in the
> VulnFleet demo. Not for production use. Northwind Commerce is fictional.

Northwind Commerce notification service. Tier 1, internet-facing, PII.

- `POST /api/notify`: sends a one-time sign-in ("magic link") message.
  Message building lives in `src/auth/`.

```bash
npm install
npm test
```
