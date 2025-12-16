import express, { Request, Response } from "express";
import axios from "axios";
import serverless from "serverless-http";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

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

const port = Number(process.env.PORT) || 3000;

console.log(`API listening on http://localhost:${port}`);

if (require.main === module) {
  app.listen(port);
}

// Exported for serverless platforms (e.g., Vercel/Netlify functions)
export const handler = serverless(app);
export default app;
