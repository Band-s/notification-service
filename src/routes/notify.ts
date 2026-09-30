import { Router } from "express";
import { buildMagicLinkMessage } from "../auth/token-templater.js";

export const notifyRouter = Router();

/**
 * POST /api/notify
 * Body: { name: string, email: string, bodyTemplate?: string, templateVariable?: string }
 * Called by the public sign-in page and by tenant integrations.
 */
notifyRouter.post("/", (req, res) => {
  const body = (req.body ?? {}) as {
    name?: unknown;
    email?: unknown;
    bodyTemplate?: unknown;
    templateVariable?: unknown;
    imports?: unknown;
  };
  const { name, email, bodyTemplate, templateVariable } = body;
  if (typeof name !== "string" || typeof email !== "string") {
    res.status(400).json({ error: "name and email are required" });
    return;
  }
  try {
    const message = buildMagicLinkMessage({
      name,
      bodyTemplate,
      templateVariable,
      ...(Object.hasOwn(body, "imports") ? { imports: body.imports } : {}),
    });
    // Delivery is out of scope for the demo; return what would be sent (minus the token).
    res.status(202).json({ to: email, subject: message.subject, body: message.body.replace(message.token, "<redacted>") });
  } catch {
    res.status(400).json({ error: "invalid template" });
  }
});
