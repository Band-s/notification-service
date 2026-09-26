import _ from "lodash";
import crypto from "node:crypto";

export interface MagicLinkMessage {
  subject: string;
  body: string;
  token: string;
}

const DEFAULT_BODY = "Hi <%= ctx.name %>, sign in with this link: <%= ctx.link %>";

/**
 * Builds a one-time sign-in ("magic link") message.
 * `templateVariable` lets white-label tenants name the data object their
 * templates reference (defaults to "ctx").
 */
export function buildMagicLinkMessage(input: {
  name: string;
  bodyTemplate?: string;
  templateVariable?: string;
}): MagicLinkMessage {
  const token = crypto.randomBytes(16).toString("hex");
  const variable = input.templateVariable ?? "ctx";
  const render = _.template(input.bodyTemplate ?? DEFAULT_BODY, { variable });
  return {
    subject: "Your Northwind sign-in link",
    body: render({ name: input.name, link: `https://app.northwind.example/login?token=${token}` }),
    token,
  };
}
