import _ from "lodash";
import crypto from "node:crypto";

export interface MagicLinkMessage {
  subject: string;
  body: string;
  token: string;
}

const DEFAULT_BODY = "Hi <%= ctx.name %>, sign in with this link: <%= ctx.link %>";

/** A plain JavaScript identifier, safe to use as `_.template`'s `variable` option. */
const PLAIN_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Validates a template string and its options before they reach `_.template`.
 * A `variable` that is a plain identifier is allowed. An `imports` option,
 * a `variable` that is not a plain identifier, and wrong input types are rejected.
 */
export function validateTemplateInput(
  template: unknown,
  options?: unknown,
): { template: string; variable?: string } {
  if (typeof template !== "string") {
    throw new TypeError("Invalid template");
  }
  if (options === undefined) {
    return { template };
  }
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Invalid template options");
  }

  if (Object.prototype.hasOwnProperty.call(options, "imports")) {
    throw new Error("Invalid `imports` option passed into template");
  }

  let variable: string | undefined;
  if (Object.prototype.hasOwnProperty.call(options, "variable")) {
    const candidate = (options as { variable?: unknown }).variable;
    if (typeof candidate !== "string" || !PLAIN_IDENTIFIER.test(candidate)) {
      throw new Error("Invalid `variable` option passed into `_.template`");
    }
    variable = candidate;
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
  const template = input.bodyTemplate === undefined ? DEFAULT_BODY : input.bodyTemplate;
  const variable = input.templateVariable === undefined ? "ctx" : input.templateVariable;
  const options: { variable: unknown; imports?: unknown } = { variable };
  if (Object.prototype.hasOwnProperty.call(input, "imports")) {
    options.imports = input.imports;
  }
  const checked = validateTemplateInput(template, options);
  const render = _.template(checked.template, { variable: checked.variable ?? "ctx" });
  return {
    subject: "Your Northwind sign-in link",
    body: render({ name: input.name, link: `https://app.northwind.example/login?token=${token}` }),
    token,
  };
}
