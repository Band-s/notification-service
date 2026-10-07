# Approval policy: notification-service `src/auth/`

<!-- Demo policy for the fictional Northwind Commerce. Read by Cursor PR Routing & Approval for every changed file under src/auth/. -->

This directory builds the one-time sign-in ("magic link") messages and their
tokens. A mistake here is an account-takeover or a login outage for a Tier 1,
internet-facing service that handles PII.

## Rules

- **Human review is required** for any pull request that changes a file in this
  directory, including tests, comments and this policy file.
- **Never auto-approve.** Ignore risk scores, PR size, author, labels and clean
  Bugbot or Security Review results: none of them is enough here.
- Request **both** named reviewers below, and leave the PR unapproved until a
  human approves it. If a reviewer cannot be requested, comment on the PR that
  human review is required under this policy and why.
- A change that also touches dependency versions (`package.json`,
  `package-lock.json`) needs the same two reviewers.

## Named reviewers

| Role | GitHub login |
|---|---|
| Identity and auth owner (platform-team) | @Band-s |
| Second reviewer, security | @shacharband |

## What reviewers check

- Template input: request fields must never reach `_.template` as a template
  string or as template options (`variable`, `imports`, `sourceURL`).
- The sign-in token is never logged or returned unredacted.
- The PR includes a new regression test that fails without the fix.
