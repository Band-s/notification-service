import _ from "lodash";
import crypto from "node:crypto";

export interface MagicLinkMessage {
  subject: string;
  body: string;
  token: string;
}

const DEFAULT_BODY = "Hi <%= ctx.name %>, sign in with this link: <%= ctx.link %>";

/** Plain ASCII JavaScript identifier, e.g. "ctx", "r", or "data". */
const PLAIN_IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

export class UnsafeTemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeTemplateError";
  }
}

/**
 * Checks a template string and options before they are passed to `_.template`.
 * Rejects a non-string template, options that are not a plain object, any
 * `imports` option, and a `variable` that is not a plain JavaScript identifier.
 */
export function validateTemplateInvocation(template: unknown, options?: unknown): asserts template is string {
  if (typeof template !== "string") {
    throw new UnsafeTemplateError("template must be a string");
  }
  if (options === undefined) {
    return;
  }
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new UnsafeTemplateError("template options must be a plain object");
  }

  const opts = options as Record<string, unknown>;
  if ("imports" in opts) {
    throw new UnsafeTemplateError("Invalid `imports` option passed into `_.template`");
  }
  if (!Object.prototype.hasOwnProperty.call(opts, "variable") || opts.variable === undefined) {
    return;
  }
  if (typeof opts.variable !== "string" || !PLAIN_IDENTIFIER.test(opts.variable)) {
    throw new UnsafeTemplateError("Invalid `variable` option passed into `_.template`");
  }
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
  const variable = input.templateVariable ?? "ctx";
  const source = input.bodyTemplate ?? DEFAULT_BODY;
  const options: { variable: unknown; imports?: unknown } = { variable };
  if (input.imports !== undefined) {
    options.imports = input.imports;
  }
  validateTemplateInvocation(source, options);

  const token = crypto.randomBytes(16).toString("hex");
  const render = _.template(source, { variable: variable as string });
  return {
    subject: "Your Northwind sign-in link",
    body: render({ name: input.name, link: `https://app.northwind.example/login?token=${token}` }),
    token,
  };
}
