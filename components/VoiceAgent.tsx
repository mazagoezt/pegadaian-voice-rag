// components/VoiceAgent.tsx
"use client";

import React, { useRef, useState } from "react";

type AnyObj = Record<string, any>;

export default function VoiceAgent() {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Siap");
  const [log, setLog] = useState<string[]>([]);
  const [speakAnswers, setSpeakAnswers] = useState(true);

  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);

  const pushLog = (m: string) =>
    setLog((v) => [new Date().toLocaleTimeString() + ": " + m, ...v].slice(0, 20));

  function timeoutFetch(input: RequestInfo, ms = 12000, init?: RequestInit) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    const merged: RequestInit = { ...(init || {}), signal: controller.signal };
    return fetch(input, merged).finally(() => clearTimeout(id));
  }

  async function connect() {
    console.log("[VoiceAgent] connect() clicked");
    try {
      if (remoteAudioRef.current) {
        const el = remoteAudioRef.current;
        (el as any).playsInline = true;
        el.autoplay = true;
        el.muted = false;
        await el.play().catch(() => {});
      }
    } catch {}

    setStatus("Mengambil token sesi...");
    let sess: AnyObj | null = null;
    let raw = "";
    try {
      const resp = await timeoutFetch("/api/realtime/session", 12000, { cache: "no-store" });
      raw = await resp.text();
      try { sess = JSON.parse(raw); } catch { sess = null; }
    } catch (e: any) {
      setStatus("Gagal panggil /api/realtime/session: " + (e?.message || String(e)));
      return;
    }
    const EPHEMERAL_KEY = (sess as AnyObj)?.client_secret?.value;
    if (!EPHEMERAL_KEY) {
      setStatus("Gagal ambil token: " + ((sess as AnyObj)?.error || raw.slice(0, 300)));
      return;
    }

    // Mikrofon
    let ms: MediaStream;
    try { ms = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e: any) { setStatus("Izin mikrofon ditolak/tidak tersedia: " + (e?.message || String(e))); return; }

    // RTCPeerConnection
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pcRef.current = pc;
    try { pc.addTransceiver("audio", { direction: "recvonly" }); } catch {}
    pc.onconnectionstatechange = () => pushLog("pc.state=" + pc.connectionState);
    pc.ontrack = (event) => {
      pushLog("Remote track received");
      const [stream] = event.streams;
      const el = remoteAudioRef.current;
      if (el) {
        (el as any).playsInline = true; el.autoplay = true; el.muted = false; el.srcObject = stream;
        el.play().then(() => pushLog("Audio playing")).catch((err) => pushLog("Audio play blocked: " + (err?.message || String(err))));
      }
    };

    ms.getTracks().forEach((t) => pc.addTrack(t, ms));

    // DataChannel
    const dc = pc.createDataChannel("oai-events"); dcRef.current = dc;
    dc.onopen = () => {
      setStatus("Terhubung — mendaftar tools...");
      const sessionUpdate: AnyObj = {
        type: "session.update",
        session: {
          instructions: "Kamu asisten Pegadaian. Bahasa Indonesia natural, ramah. Jawab HANYA berdasarkan fungsi search_company; jangan sebutkan sumber/URL.",
          modalities: ["audio","text"],
          voice: "shimmer",
          turn_detection: { type: "server_vad", threshold: 0.5, prefix_padding_ms: 250, silence_duration_ms: 400 },
          tool_choice: { type: "function", name: "search_company" },
          tools: [{
            type: "function", name: "search_company",
            description: "Ringkas jawaban dari domain resmi berdasarkan query (tanpa URL).",
            parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] }
          }]
        }
      };
      dc.send(JSON.stringify(sessionUpdate));
      setStatus("Silakan berbicara...");
      setConnected(true);
    };

    let textBuf = "";
    dc.onmessage = async (e) => {
      try {
        const msg: AnyObj = JSON.parse(e.data);
        if (msg.type && typeof msg.type === "string" && msg.type.startsWith("response.")) pushLog("evt:" + msg.type);

        if (msg.type === "response.required_action" && msg.response?.required_action?.type === "submit_tool_outputs") {
          const calls = msg.response.required_action.submit_tool_outputs.tool_calls || [];
          for (const c of calls) {
            if (c.type === "function" && c.name === "search_company") {
              let args: AnyObj = {};
              try { args = typeof c.arguments === "string" ? JSON.parse(c.arguments) : (c.arguments || {}); } catch {}
              const q = args?.query || "";
              const res = await fetch("/api/rag/answer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) }).then(r => r.json());
              const out: AnyObj = { type: "response.submit_tool_outputs", response_id: msg.response.id, tool_outputs: [{ tool_call_id: c.id, output: res?.answer || res?.text || "" }] };
              dc.send(JSON.stringify(out));
              if (speakAnswers) {
                const ev: AnyObj = { type: "response.create", response: { instructions: "Silakan bacakan jawaban di atas secara ringkas.", modalities: ["audio"] } };
                dc.send(JSON.stringify(ev));
              }
            }
          }
        } else if (msg.type === "response.output_text.delta") {
          textBuf += msg.delta || "";
        } else if (msg.type === "response.completed") {
          if (textBuf) pushLog("asr/answer: " + textBuf.slice(0, 120));
          textBuf = "";
        }
      } catch {}
    };

    // SDP
    let offer: RTCSessionDescriptionInit;
    try { offer = await pc.createOffer(); await pc.setLocalDescription(offer); }
    catch (e: any) { setStatus("Gagal membuat offer WebRTC: " + (e?.message || String(e))); return; }

    let sdp = "";
    try {
      const model = "gpt-4o-realtime-preview";
      const r = await fetch(`https://api.openai.com/v1/realtime?model=${model}`, {
        method: "POST",
        body: offer.sdp || "",
        headers: { Authorization: `Bearer ${EPHEMERAL_KEY}`, "Content-Type": "application/sdp" },
      });
      sdp = await r.text();
    } catch (e: any) {
      setStatus("Gagal negosiasi Realtime API: " + (e?.message || String(e)));
      return;
    }
    try { await pc.setRemoteDescription({ type: "answer", sdp }); }
    catch (e: any) { setStatus("Gagal set remote description: " + (e?.message || String(e))); return; }
  }

  function disconnect() {
    try { dcRef.current?.close(); pcRef.current?.close(); } catch {}
    dcRef.current = null; pcRef.current = null; setConnected(false); setStatus("Terputus");
  }

  function speakTest() {
    const dc = dcRef.current; if (!dc || dc.readyState !== "open") return;
    const ev: AnyObj = { type: "response.create", response: { instructions: "Katakan: Tes audio berhasil.", modalities: ["audio"] } };
    dc.send(JSON.stringify(ev));
  }
  function beepTest() {
    try {
      const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx(); const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 880; g.gain.value = 0.05; o.connect(g); g.connect(ctx.destination); o.start(); setTimeout(() => { o.stop(); ctx.close(); }, 600);
    } catch {}
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {!connected ? (
          <button onClick={() => { console.log("[VoiceAgent] connect() clicked"); connect(); }} className="px-4 py-2 rounded-2xl bg-emerald-600 text-white">Hubungkan &amp; Bicara</button>
        ) : (
          <button onClick={disconnect} className="px-4 py-2 rounded-2xl bg-slate-700 text-white">Putuskan</button>
        )}
        <span className="text-sm text-slate-600">{status}</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={speakTest} className="px-2 py-1 rounded bg-sky-600 text-white text-xs">Tes Audio</button>
        <button onClick={async()=>{ try{ const el = remoteAudioRef.current; if(!el) return; (el as any).srcObject = null; const res = await fetch(`/api/tts/say?text=${encodeURIComponent("Tes audio berhasil.")}`); const ctype = res.headers.get('Content-Type') || ''; if(!res.ok || !ctype.includes('audio')){ const txt = await res.text(); setStatus('REST TTS error: ' + txt.slice(0,200)); return; } const blob = await res.blob(); el.src = URL.createObjectURL(blob); await el.play(); } catch(e:any){ setStatus('Gagal putar REST TTS: ' + (e?.message || String(e))); } }} className="px-2 py-1 rounded bg-fuchsia-700 text-white text-xs">Tes Audio (REST)</button>
        <button onClick={beepTest} className="px-2 py-1 rounded bg-amber-600 text-white text-xs">Beep</button>
        <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={speakAnswers} onChange={e=>setSpeakAnswers(e.target.checked)} /> Ucapkan jawaban</label>
      </div>
      <audio ref={remoteAudioRef} controls />
      <div className="text-xs border rounded-lg p-2 mt-2 bg-white">
        <div className="font-semibold mb-1">Debug</div>
        {log.slice(0,8).map((l,i)=>(<div key={i}>{l}</div>))}
      </div>
    </div>
  );
}
