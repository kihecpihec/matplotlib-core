import express, { Request, Response } from "express";
import axios from "axios";
import serverless from "serverless-http";
import dotenv from "dotenv";
import cors from "cors";
import { getDocPage, listDocPages, upsertDocPage } from "./docsStore";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "*",
  })
);

// NOTE: default is ~100kb which can be too small for large docs/notebook payloads
app.use(express.json({ limit: "5mb" }));

app.post("/api/message", async (req: Request, res: Response) => {
  const { message } = req.body ?? {};

  if (typeof message !== "string" || message.trim().length === 0) {
    return res
      .status(400)
      .json({ error: "message is required and must be non-empty" });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return res.status(500).json({ error: "Discord webhook is not configured" });
  }

  try {
    await axios.post(
      webhookUrl,
      { content: message.trim() },
      { headers: { "Content-Type": "application/json" } }
    );
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to forward message to Discord" });
  }
});

// Dynamic docs API
app.get("/api/docs/pages", async (_req: Request, res: Response) => {
  try {
    const pages = await listDocPages();
    return res.status(200).json({ pages });
  } catch (err) {
    return res.status(500).json({ error: "Failed to list pages." });
  }
});

app.get("/api/docs/pages/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ error: "id is required" });

    const page = await getDocPage(id);
    if (!page) return res.status(404).json({ error: "Page not found" });

    return res.status(200).json({ page });
  } catch (_err) {
    return res.status(500).json({ error: "Failed to fetch page." });
  }
});

app.put("/api/docs/pages/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ error: "id is required" });

    const page = await upsertDocPage(id, req.body);
    return res.status(200).json({ page });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update page.";
    return res.status(400).json({ error: message });
  }
});

const port = Number(process.env.PORT) || 3000;

if (require.main === module) {
  app.listen(port);
}

export const handler = serverless(app);
export default app;
