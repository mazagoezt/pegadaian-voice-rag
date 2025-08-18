"use client";
import { useState, useRef } from "react";

type OAIEvent = { type: string; [k: string]: any };

function timeoutFetch(input: RequestInfo, ms = 12000, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  const merged: RequestInit = { ...(init || {}), signal: controller.signal };
  return fetch(input, merged).finally(() => clearTimeout(id));
}

export default function VoiceAgent() {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Siap");
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);

  async function connect() {
    setStatus("Mengambil token sesi...");

    // fetch ephemeral token
    let sess: any = null;
    let raw = "";
    try {
      const resp = await timeoutFetch("/api/realtime/session", 12000, { cache: "no-store" });
      raw = await resp.text();
      try { sess = JSON.parse(raw); } catch { sess = null; }
    } catch (e: any) {
      setStatus("Gagal memanggil /api/realtime/session: " + (e?.message || String(e)));
      return;
    }
    const EPHEMERAL_KEY = sess?.client_secret?.value;
    if (!EPHEMERAL_KEY) {
      const msg = sess?.error || raw?.slice(0, 300) || "Tidak ada client_secret.value";
      setStatus("Gagal ambil token: " + msg);
      return;
    }

    // mic permission
    let ms: MediaStream;
    try { ms = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e: any) { setStatus("Izin mikrofon ditolak/tidak tersedia: " + (e?.message || String(e))); return; }

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
          instructions: "Kamu adalah asisten portofolio Pegadaian. Berbahasa Indonesia natural, ramah, dan ringkas. Jawab HANYA berdasarkan hasil fungsi search_company. Jika tidak ada data, katakan tidak tahu. Jangan menyebutkan sumber atau URL kecuali pengguna memintanya secara eksplisit. Jika ada angka tarif/biaya, sebutkan angkanya eksplisit dengan satuan rupiah atau persen.",
          modalities: ["audio","text"],
          voice: "shimmer",
          tools: [{
            type: "function",
            name: "search_company",
            description: "Kembalikan jawaban ringkas dari domain resmi perusahaan berdasarkan query pengguna (tanpa URL).",
            parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] }
          }]
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
          const res = await fetch("/api/rag/answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: q })
          }).then(r => r.json());
          const toolOut: OAIEvent = { type: "tool_output", tool_call_id: msg.id, output: res?.answer || res?.text || "" };
          dc.send(JSON.stringify(toolOut));
        }
      } catch {}
    };

    ms.getTracks().forEach((t) => pc.addTrack(t, ms));

    let offer: RTCSessionDescriptionInit;
    try {
      offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
    } catch (e: any) {
      setStatus("Gagal membuat offer WebRTC: " + (e?.message || String(e)));
      return;
    }

    let sdp = "";
    try {
      const model = "gpt-4o-realtime-preview";
      sdp = await timeoutFetch(`https://api.openai.com/v1/realtime?model=${model}`, 12000, {
        method: "POST",
        body: offer.sdp!,
        headers: { Authorization: `Bearer ${EPHEMERAL_KEY}`, "Content-Type": "application/sdp" }
      }).then(r => r.text());
    } catch (e: any) {
      setStatus("Gagal negosiasi Realtime API: " + (e?.message || String(e)));
      return;
    }

    try {
      await pc.setRemoteDescription({ type: "answer", sdp });
    } catch (e: any) {
      setStatus("Gagal set remote description: " + (e?.message || String(e)));
      return;
    }
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
      <p className="text-xs text-slate-500">Tips: Tanyakan "Berapa tarif sewa modal gadai emas dan biaya administrasinya?"</p>
    </div>
  );
}
