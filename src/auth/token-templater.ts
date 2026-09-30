import _ from "lodash";
import crypto from "node:crypto";

export interface MagicLinkMessage {
  subject: string;
  body: string;
  token: string;
}

const DEFAULT_BODY = "Hi <%= ctx.name %>, sign in with this link: <%= ctx.link %>";

/** A plain JavaScript identifier, such as "r", "data", or "ctx". */
const JS_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Rejects template source and options that must not reach `_.template`.
 * `variable` is allowed only when it is a plain identifier. `imports` is never allowed.
 */
export function validateTemplateInput(template: unknown, options?: unknown): void {
  if (typeof template !== "string") {
    throw new TypeError("Invalid template");
  }
  if (options === undefined) {
    return;
  }
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Invalid template options");
  }

  const opts = options as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(opts, "imports")) {
    throw new Error("Invalid template options");
  }
  if (Object.prototype.hasOwnProperty.call(opts, "variable")) {
    const variable = opts.variable;
    if (typeof variable !== "string" || !JS_IDENTIFIER.test(variable)) {
      throw new Error("Invalid `variable` option passed into `_.template`");
    }
  }
}

/**
 * Builds a one-time sign-in ("magic link") message.
 * `templateVariable` lets white-label tenants name the data object their
 * templates reference (defaults to "ctx").
 */
export function buildMagicLinkMessage(input: {
  name: string;
  bodyTemplate?: string;
  templateVariable?: string;
  imports?: unknown;
}): MagicLinkMessage {
  const template = input.bodyTemplate ?? DEFAULT_BODY;
  const options: Record<string, unknown> = {
    variable: input.templateVariable ?? "ctx",
  };
  if (Object.prototype.hasOwnProperty.call(input, "imports")) {
    options.imports = input.imports;
  }
  validateTemplateInput(template, options);

  const token = crypto.randomBytes(16).toString("hex");
  const render = _.template(template, { variable: options.variable as string });
  return {
    subject: "Your Northwind sign-in link",
    body: render({ name: input.name, link: `https://app.northwind.example/login?token=${token}` }),
    token,
  };
}
