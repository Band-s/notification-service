import _ from "lodash";
import crypto from "node:crypto";

export interface MagicLinkMessage {
  subject: string;
  body: string;
  token: string;
}

const DEFAULT_BODY = "Hi <%= ctx.name %>, sign in with this link: <%= ctx.link %>";

/** A plain JavaScript identifier, such as "r", "data", or "ctx". */
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Checks a template string and caller options before they reach `_.template`.
 * Rejects a `variable` that is not a plain identifier, an `imports` option, and wrong input types.
 */
export function validateTemplateInput(
  template: unknown,
  options?: unknown,
): { template: string; variable?: string } {
  if (typeof template !== "string") {
    throw new TypeError("Invalid template passed into `_.template`");
  }
  if (options === undefined) {
    return { template };
  }
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Invalid options passed into `_.template`");
  }

  const opts = options as Record<string, unknown>;
  if (Object.hasOwn(opts, "imports")) {
    throw new Error("Invalid `imports` option passed into `_.template`");
  }

  if (!Object.hasOwn(opts, "variable")) {
    return { template };
  }
  const variable = opts.variable;
  if (typeof variable !== "string" || !IDENTIFIER.test(variable)) {
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
  const template = input.bodyTemplate === undefined ? DEFAULT_BODY : input.bodyTemplate;
  const variable = input.templateVariable === undefined ? "ctx" : input.templateVariable;
  const options: Record<string, unknown> = { variable };
  if (Object.hasOwn(input, "imports")) {
    options.imports = input.imports;
  }
  const checked = validateTemplateInput(template, options);
  if (checked.variable === undefined) {
    throw new Error("Invalid `variable` option passed into `_.template`");
  }

  const token = crypto.randomBytes(16).toString("hex");
  const render = _.template(checked.template, { variable: checked.variable });
  return {
    subject: "Your Northwind sign-in link",
    body: render({ name: input.name, link: `https://app.northwind.example/login?token=${token}` }),
    token,
  };
}
