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
    setLog((v) => [new Date().toLocaleTimeString() + ": " + m, ...v].slice(0, 25));

  function timeoutFetch(input: RequestInfo, ms = 12000, init?: RequestInit) {
    const ctl = new AbortController(); const id = setTimeout(() => ctl.abort(), ms);
    const merged: RequestInit = { ...(init || {}), signal: ctl.signal };
    return fetch(input, merged).finally(() => clearTimeout(id));
  }

  async function connect() {
    try { const el = remoteAudioRef.current; if (el) { (el as any).playsInline = true; el.autoplay = true; el.muted = false; await el.play().catch(()=>{});} } catch {}
    setStatus("Mengambil token sesi...");
    let sess: AnyObj | null = null; let raw = "";
    try { const resp = await timeoutFetch("/api/realtime/session", 12000, { cache: "no-store" }); raw = await resp.text(); try { sess = JSON.parse(raw); } catch {} }
    catch (e:any) { setStatus("Gagal panggil /api/realtime/session: " + (e?.message || String(e))); return; }
    const EPHEMERAL_KEY = (sess as AnyObj)?.client_secret?.value;
    const MODEL = (sess as AnyObj)?.session_model || (sess as AnyObj)?.model || "gpt-4o-realtime-preview";
    if (!EPHEMERAL_KEY) { setStatus("Gagal ambil token: " + ((sess as AnyObj)?.error || raw.slice(0, 300))); return; }

    // Mic
    let ms: MediaStream;
    try { ms = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch(e:any){ setStatus("Izin mikrofon ditolak/tidak tersedia: " + (e?.message || String(e))); return; }

    // WebRTC
    let audioSpoken = false;
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pcRef.current = pc;
    try { pc.addTransceiver("audio", { direction: "recvonly" }); } catch {}
    pc.onconnectionstatechange = () => pushLog("pc.state=" + pc.connectionState);
    pc.ontrack = (event) => {
      pushLog("Remote track received");
      const [stream] = event.streams;
      const el = remoteAudioRef.current;
      if (el) { (el as any).playsInline = true; el.autoplay = true; el.muted = false; el.srcObject = stream;
        el.play().then(() => { audioSpoken = true; pushLog("Audio playing"); }).catch(err => pushLog("Audio play blocked: " + (err?.message || String(err))));
      }
    };
    ms.getTracks().forEach((t)=>pc.addTrack(t, ms));

    // DataChannel
    const dc = pc.createDataChannel("oai-events"); dcRef.current = dc;
    dc.onopen = () => {
      const sessionUpdate: AnyObj = {
        type: "session.update",
        session: {
          instructions: "Kamu asisten Pegadaian. Bahasa Indonesia natural, ramah. Jawab hanya dari fungsi search_company (RAG), jangan sebutkan URL/sumber.",
          modalities: ["audio","text"],
          voice: "shimmer",
          turn_detection: { type: "server_vad", threshold: 0.5, prefix_padding_ms: 250, silence_duration_ms: 450 },
          tool_choice: { type: "function", name: "search_company" },
          tools: [{ type: "function", name: "search_company", description: "Ringkas jawaban produk Pegadaian dari domain resmi berdasarkan query (tanpa URL).", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } }]
        }
      };
      dc.send(JSON.stringify(sessionUpdate));
      setStatus("Silakan berbicara... (Model: " + MODEL + ")");
      setConnected(true);
    };

    let textBuf = "";
    dc.onmessage = async (e) => {
      try {
        const msg: AnyObj = JSON.parse(e.data);
        if (msg.type && typeof msg.type === "string" && msg.type.startsWith("response.")) pushLog("evt:" + msg.type);

        if (msg.type === "response.required_action" && msg.response?.required_action?.type === "submit_tool_outputs") {
          const calls = msg.response.required_action.submit_tool_outputs.tool_calls || [];
          for (const c of calls) if (c.type === "function" && c.name === "search_company") {
            let args: AnyObj = {}; try { args = typeof c.arguments === "string" ? JSON.parse(c.arguments) : (c.arguments || {}); } catch {}
            const q = args?.query || "";
            const res = await fetch("/api/rag/answer", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ query:q }) }).then(r=>r.json());
            const out: AnyObj = { type:"response.submit_tool_outputs", response_id: msg.response.id, tool_outputs:[{ tool_call_id: c.id, output: res?.answer || res?.text || "" }] };
            dc.send(JSON.stringify(out));

            if (speakAnswers) {
              const speak: AnyObj = { type:"response.create", response:{ modalities:["audio"], instructions:"Bacakan jawaban di atas secara ringkas." } };
              dc.send(JSON.stringify(speak));
            }
          }
        } else if (msg.type === "response.output_text.delta") {
          textBuf += msg.delta || "";
        } else if (msg.type === "response.completed") {
          if (textBuf) pushLog("asr/answer: " + textBuf.slice(0, 120));
          if (speakAnswers && textBuf && !audioSpoken) {
            const say = textBuf.slice(0, 800);
            const speak: AnyObj = { type:"response.create", response:{ modalities:["audio"], instructions: say } };
            dc.send(JSON.stringify(speak));
            pushLog("auto-speak: " + say.slice(0, 80));
          }
          textBuf = "";
        }
      } catch {}
    };

    // SDP negotiate
    let offer: RTCSessionDescriptionInit; try { offer = await pc.createOffer(); await pc.setLocalDescription(offer); }
    catch(e:any){ setStatus("Gagal membuat offer WebRTC: " + (e?.message || String(e))); return; }

    let sdp = "";
    try {
      const r = await fetch(`https://api.openai.com/v1/realtime?model=${MODEL}&protocol=webrtc`, {
        method: "POST",
        body: offer.sdp || "",
        headers: { Authorization: `Bearer ${EPHEMERAL_KEY}`, "Content-Type": "application/sdp", "OpenAI-Beta": "realtime=v1" },
      });
      const ct = (r.headers.get("content-type") || "").toLowerCase();
      sdp = await r.text();
      const looksLikeSDP = /^v=/.test((sdp || "").trim());
      if (!r.ok || (!ct.startsWith("application/sdp") && !looksLikeSDP)) { setStatus("Realtime error: " + sdp.slice(0, 280)); return; }
    } catch(e:any){ setStatus("Gagal negosiasi Realtime API: " + (e?.message || String(e))); return; }

    try { await pc.setRemoteDescription({ type: "answer", sdp }); }
    catch(e:any){ setStatus("Gagal set remote description: " + (e?.message || String(e))); return; }
  }

  function disconnect(){ try{ dcRef.current?.close(); pcRef.current?.close(); } catch{} dcRef.current=null; pcRef.current=null; setConnected(false); setStatus("Terputus"); }
  async function speakTest(){ const dc = dcRef.current; if(!dc || dc.readyState!=="open") return; dc.send(JSON.stringify({ type:"response.create", response:{ modalities:["audio"], instructions:"Katakan: Tes audio berhasil." } })); }
  async function restTest(){ try{ const el = remoteAudioRef.current; if(!el) return; (el as any).srcObject=null; const r=await fetch(`/api/tts/say?text=${encodeURIComponent("Tes audio berhasil.")}`); const ct=r.headers.get("Content-Type")||""; if(!r.ok||!ct.includes("audio")){ const t=await r.text(); setStatus("REST TTS error: "+t.slice(0,200)); return;} const b=await r.blob(); el.src=URL.createObjectURL(b); await el.play(); } catch(e:any){ setStatus("Gagal putar REST TTS: "+(e?.message||String(e))); } }
  function beep(){ try{ const Ctx:any=(window as any).AudioContext||(window as any).webkitAudioContext; const ctx=new Ctx(); const o=ctx.createOscillator(); const g=ctx.createGain(); o.type="sine"; o.frequency.value=880; g.gain.value=0.05; o.connect(g); g.connect(ctx.destination); o.start(); setTimeout(()=>{o.stop(); ctx.close();},600);} catch{} }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {!connected ? <button onClick={()=>connect()} className="px-4 py-2 rounded-2xl bg-emerald-600 text-white">Hubungkan &amp; Bicara</button>
          : <button onClick={disconnect} className="px-4 py-2 rounded-2xl bg-slate-700 text-white">Putuskan</button>}
        <span className="text-sm text-slate-600">{status}</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={speakTest} className="px-2 py-1 rounded bg-sky-600 text-white text-xs">Tes Audio</button>
        <button onClick={restTest} className="px-2 py-1 rounded bg-fuchsia-700 text-white text-xs">Tes Audio (REST)</button>
        <button onClick={beep} className="px-2 py-1 rounded bg-amber-600 text-white text-xs">Beep</button>
        <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={speakAnswers} onChange={e=>setSpeakAnswers(e.target.checked)} /> Ucapkan jawaban</label>
      </div>
      <audio ref={remoteAudioRef} controls />
      <div className="text-xs border rounded-lg p-2 mt-2 bg-white"><div className="font-semibold mb-1">Debug</div>{log.slice(0,10).map((l,i)=>(<div key={i}>{l}</div>))}</div>
    </div>
  );
}
