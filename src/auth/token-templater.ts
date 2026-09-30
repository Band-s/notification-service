import _ from "lodash";
import crypto from "node:crypto";

export interface MagicLinkMessage {
  subject: string;
  body: string;
  token: string;
}

const DEFAULT_BODY = "Hi <%= ctx.name %>, sign in with this link: <%= ctx.link %>";

/** A plain JavaScript identifier, safe to splice into a compiled template. */
const PLAIN_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export interface ValidatedTemplate {
  template: string;
  variable: string;
}

/**
 * Rejects template input that must not reach `_.template`.
 * A `variable` option must be a plain identifier. An `imports` option and
 * any non-object options value are rejected.
 */
export function validateTemplateOptions(template: unknown, options?: unknown): ValidatedTemplate {
  if (typeof template !== "string") {
    throw new TypeError("Invalid template passed into `_.template`");
  }
  if (options == null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Invalid options passed into `_.template`");
  }
  const opts = options as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(opts, "imports")) {
    throw new TypeError("Invalid `imports` option passed into `_.template`");
  }
  const variable = opts.variable;
  if (typeof variable !== "string" || !PLAIN_IDENTIFIER.test(variable)) {
    throw new Error("Invalid `variable` option passed into `_.template`");
  }
  return { template, variable };
}

/**
 * Builds a one-time sign-in ("magic link") message.
 * `templateVariable` lets white-label tenants name the data object their
 * templates reference (defaults to "ctx").
 */
export function buildMagicLinkMessage(input: {
  name: string;
  bodyTemplate?: unknown;
  templateVariable?: unknown;
  imports?: unknown;
}): MagicLinkMessage {
  const token = crypto.randomBytes(16).toString("hex");
  const options: { variable: unknown; imports?: unknown } = {
    variable: input.templateVariable ?? "ctx",
  };
  if (Object.prototype.hasOwnProperty.call(input, "imports")) {
    options.imports = input.imports;
  }
  const safe = validateTemplateOptions(input.bodyTemplate ?? DEFAULT_BODY, options);
  const render = _.template(safe.template, { variable: safe.variable });
  return {
    subject: "Your Northwind sign-in link",
    body: render({ name: input.name, link: `https://app.northwind.example/login?token=${token}` }),
    token,
  };
}
