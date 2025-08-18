"use client";
import { useState, useRef } from "react";

type OAIEvent = { type: string; [k: string]: any };

export default function VoiceAgent() {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Siap");
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);

  async function connect() {
    setStatus("Mengambil token sesi...");
    const sess = await fetch("/api/realtime/session").then(r => r.json());
    const EPHEMERAL_KEY = sess?.client_secret?.value;
    if (!EPHEMERAL_KEY) {
      setStatus("Gagal ambil token.");
      return;
    }

    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch(() => {});
      }
    };

    const dc = pc.createDataChannel("oai-events");
    dcRef.current = dc;

    dc.onopen = () => {
      setStatus("Terhubung — mendaftar instruksi & tools...");

      const sessionUpdate: OAIEvent = {
        type: "session.update",
        session: {
          instructions:
            "Kamu adalah asisten portofolio Pegadaian. Berbahasa Indonesia natural, ramah, dan ringkas. Jawab HANYA berdasarkan hasil fungsi search_company. Jika tidak ada data, katakan tidak tahu. Jangan menyebutkan sumber atau URL kecuali pengguna memintanya secara ekspllisit.",
          modalities: ["audio","text"],
          voice: "nova",
          tools: [
            {
              type: "function",
              name: "search_company",
              description: "Kembalikan ringkasan singkat dari domain resmi perusahaan berdasarkan query pengguna (tanpa URL).",
              parameters: {
                type: "object",
                properties: { query: { type: "string" } },
                required: ["query"]
              }
            }
          ]
        }
      };
      dc.send(JSON.stringify(sessionUpdate));

      setStatus("Silakan berbicara...");
      setConnected(true);
    };

    dc.onmessage = async (e) => {
      try {
        const msg: OAIEvent = JSON.parse(e.data);
        if (msg.type === "tool_call" && msg.name === "search_company") {
          const q = msg?.arguments?.query || "";
          const res = await fetch("/api/rag/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: q })
          }).then(r => r.json());

          const toolOut: OAIEvent = {
            type: "tool_output",
            tool_call_id: msg.id,
            output: res?.text || ""
          };
          dc.send(JSON.stringify(toolOut));
        }
      } catch {
        // ignore
      }
    };

    const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
    ms.getTracks().forEach((t) => pc.addTrack(t, ms));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const model = "gpt-4o-realtime-preview-2024-12-17";
    const sdp = await fetch(`https://api.openai.com/v1/realtime?model=${model}`, {
      method: "POST",
      body: offer.sdp!,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp"
      }
    }).then(r => r.text());

    await pc.setRemoteDescription({ type: "answer", sdp });
  }

  async function disconnect() {
    dcRef.current?.close();
    pcRef.current?.close();
    dcRef.current = null;
    pcRef.current = null;
    setConnected(false);
    setStatus("Terputus");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {!connected ? (
          <button onClick={connect} className="px-4 py-2 rounded-2xl bg-emerald-600 text-white">Hubungkan & Bicara</button>
        ) : (
          <button onClick={disconnect} className="px-4 py-2 rounded-2xl bg-slate-700 text-white">Putuskan</button>
        )}
        <span className="text-sm text-slate-600">{status}</span>
      </div>
      <audio ref={remoteAudioRef} />
      <p className="text-xs text-slate-500">Tips: Tanyakan "Apa saja produk Tabungan Emas dan biayanya?"</p>
    </div>
  );
}