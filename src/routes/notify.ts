import { Router } from "express";
import { buildMagicLinkMessage } from "../auth/token-templater.js";

export const notifyRouter = Router();

/**
 * POST /api/notify
 * Body: { name: string, email: string, bodyTemplate?: string, templateVariable?: string }
 * Called by the public sign-in page and by tenant integrations.
 */
notifyRouter.post("/", (req, res) => {
  const payload = req.body;
  if (payload == null || typeof payload !== "object" || Array.isArray(payload)) {
    res.status(400).json({ error: "name and email are required" });
    return;
  }
  const record = payload as Record<string, unknown>;
  const { name, email } = record;
  if (typeof name !== "string" || typeof email !== "string") {
    res.status(400).json({ error: "name and email are required" });
    return;
  }
  const callerOptions = Object.prototype.hasOwnProperty.call(record, "imports")
    ? { imports: record.imports }
    : undefined;
  try {
    const message = buildMagicLinkMessage(
      {
        name,
        bodyTemplate: record.bodyTemplate as string | undefined,
        templateVariable: record.templateVariable as string | undefined,
      },
      callerOptions,
    );
    // Delivery is out of scope for the demo; return what would be sent (minus the token).
    res.status(202).json({ to: email, subject: message.subject, body: message.body.replace(message.token, "<redacted>") });
  } catch (err) {
    if (!(err instanceof Error) || err.name !== "TemplateValidationError") {
      throw err;
    }
    res.status(400).json({ error: "Invalid template options" });
  }
});
