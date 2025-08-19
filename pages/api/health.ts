import type { NextApiRequest, NextApiResponse } from "next";
export default async function handler(req: NextApiRequest, res: NextApiResponse){
  const env = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "present" : "missing",
    REALTIME_MODEL: process.env.REALTIME_MODEL || "gpt-4o-realtime-preview",
    REALTIME_VOICE: process.env.REALTIME_VOICE || "shimmer",
    QA_MODEL: process.env.QA_MODEL || "gpt-4o-mini",
    TTS_MODEL: process.env.TTS_MODEL || "tts-1",
    EMBED_MODEL: process.env.EMBED_MODEL || "text-embedding-3-small",
  };
  res.status(200).json({ ok: true, env, build: "v3.8.3c-vercel-pages" });
}
