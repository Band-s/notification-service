import _ from "lodash";
import crypto from "node:crypto";

export interface MagicLinkMessage {
  subject: string;
  body: string;
  token: string;
}

const DEFAULT_BODY = "Hi <%= ctx.name %>, sign in with this link: <%= ctx.link %>";

/** Plain JavaScript identifier, e.g. "r", "data", or "ctx". */
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function templateError(message: string): never {
  const error = new Error(message);
  error.name = "TemplateValidationError";
  throw error;
}

/**
 * Checks a template string and its options before they reach `_.template`.
 * Allows a `variable` that is a plain identifier. Rejects anything else unsafe:
 * a non-identifier `variable`, an `imports` option, and wrong input types.
 */
export function validateTemplateInput(
  template: unknown,
  options: unknown,
): { template: string; options: { variable: string } } {
  if (template !== undefined && typeof template !== "string") {
    templateError("Invalid template");
  }
  if (options == null || typeof options !== "object" || Array.isArray(options)) {
    templateError("Invalid template options");
  }
  const record = options as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(record, "imports")) {
    templateError("Invalid template options");
  }
  const variable = Object.prototype.hasOwnProperty.call(record, "variable") ? record.variable : "ctx";
  if (typeof variable !== "string" || !IDENTIFIER.test(variable)) {
    templateError("Invalid `variable` option passed into `_.template`");
  }
  return {
    template: template ?? DEFAULT_BODY,
    options: { variable },
  };
}

/**
 * Builds a one-time sign-in ("magic link") message.
 * `templateVariable` lets white-label tenants name the data object their
 * templates reference (defaults to "ctx").
 * `callerOptions` is an optional lodash template options object; safe
 * identifier `variable` values are kept, and unsafe options are rejected.
 */
export function buildMagicLinkMessage(
  input: {
    name: string;
    bodyTemplate?: string;
    templateVariable?: string;
  },
  callerOptions: unknown = undefined,
): MagicLinkMessage {
  const variable = input.templateVariable ?? "ctx";
  let options: unknown = { variable };
  if (input != null && typeof input === "object" && Object.prototype.hasOwnProperty.call(input, "imports")) {
    options = { variable, imports: (input as { imports?: unknown }).imports };
  }
  if (callerOptions !== undefined) {
    if (callerOptions !== null && typeof callerOptions === "object" && !Array.isArray(callerOptions)) {
      options = { ...(options as Record<string, unknown>), ...(callerOptions as Record<string, unknown>) };
    } else {
      options = callerOptions;
    }
  }
  const validated = validateTemplateInput(input.bodyTemplate, options);
  const token = crypto.randomBytes(16).toString("hex");
  const render = _.template(validated.template, validated.options);
  return {
    subject: "Your Northwind sign-in link",
    body: render({ name: input.name, link: `https://app.northwind.example/login?token=${token}` }),
    token,
  };
}
