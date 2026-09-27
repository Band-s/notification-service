import _ from "lodash";
import crypto from "node:crypto";

export interface MagicLinkMessage {
  subject: string;
  body: string;
  token: string;
}

const DEFAULT_BODY = "Hi <%= ctx.name %>, sign in with this link: <%= ctx.link %>";

/** A plain JavaScript identifier: lodash interpolates `variable` into generated code. */
const PLAIN_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * Rejects template input that must not reach `_.template`.
 * Allows a `variable` that is a plain identifier. Rejects any other
 * `variable`, an `imports` option, and values of the wrong type.
 */
export function validateTemplateInput(template: unknown, options?: unknown): asserts template is string {
  if (typeof template !== "string") {
    throw new TypeError("Invalid template passed into `_.template`");
  }
  if (options === undefined) {
    return;
  }
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Invalid template options passed into `_.template`");
  }
  if (Object.prototype.hasOwnProperty.call(options, "imports")) {
    throw new Error("Invalid `imports` option passed into `_.template`");
  }
  if (Object.prototype.hasOwnProperty.call(options, "variable")) {
    const variable = (options as { variable?: unknown }).variable;
    if (typeof variable !== "string" || !PLAIN_IDENTIFIER.test(variable)) {
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
  const token = crypto.randomBytes(16).toString("hex");
  const template = input.bodyTemplate === undefined ? DEFAULT_BODY : input.bodyTemplate;
  const options: { variable: unknown; imports?: unknown } = {
    variable: input.templateVariable === undefined ? "ctx" : input.templateVariable,
  };
  if (Object.prototype.hasOwnProperty.call(input, "imports")) {
    options.imports = input.imports;
  }
  validateTemplateInput(template, options);
  const render = _.template(template, { variable: options.variable as string });
  return {
    subject: "Your Northwind sign-in link",
    body: render({ name: input.name, link: `https://app.northwind.example/login?token=${token}` }),
    token,
  };
}
