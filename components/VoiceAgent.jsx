"use client";
import { useState, useRef } from "react";
export default function VoiceAgent() {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Siap");
  const [log, setLog] = useState([]);
  const [speakAnswers, setSpeakAnswers] = useState(true);
  const remoteAudioRef = useRef(null);
  const pcRef = useRef(null);
  const dcRef = useRef(null);
  const pushLog = (m) => setLog(v => [new Date().toLocaleTimeString()+": "+m, ...v].slice(0, 20));

  function speakTest(){
    const dc = dcRef.current; if(!dc || dc.readyState!=="open") return;
    const ev = { type: "response.create", response: { instructions: "Katakan: Tes audio berhasil.", modalities: ["audio"] } };
    dc.send(JSON.stringify(ev));
  }
  function beepTest(){
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = 880; g.gain.value = 0.05; o.connect(g); g.connect(ctx.destination); o.start(); setTimeout(()=>{o.stop(); ctx.close();}, 600);
    } catch {}
  }
  function timeoutFetch(input, ms = 12000, init) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    const merged = { ...(init || {}), signal: controller.signal };
    return fetch(input, merged).finally(() => clearTimeout(id));
  }

  async function connect() {
    try { if (remoteAudioRef.current) { const el = remoteAudioRef.current; el.autoplay = true; el.muted = false; el.playsInline = true; await el.play().catch(()=>{}); } } catch {}
    setStatus("Mengambil token sesi...");
    let sess = null; let raw = "";
    try { const resp = await timeoutFetch("/api/realtime/session", 12000, { cache: "no-store" }); raw = await resp.text(); try { sess = JSON.parse(raw); } catch {} }
    catch (e) { setStatus("Gagal panggil /api/realtime/session: " + (e?.message || String(e))); return; }
    const EPHEMERAL_KEY = sess?.client_secret?.value;
    if (!EPHEMERAL_KEY) { setStatus("Gagal ambil token: " + (sess?.error || raw?.slice(0, 300))); return; }

    let ms;
    try { ms = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e) { setStatus("Izin mikrofon ditolak/tidak tersedia: " + (e?.message || String(e))); return; }

    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }); pcRef.current = pc;
    try { pc.addTransceiver("audio", { direction: "recvonly" }); } catch {}
    pc.onconnectionstatechange = () => pushLog("pc.state="+pc.connectionState);
    pc.ontrack = (event) => {
      pushLog("Remote track received");
      const [stream] = event.streams;
      if (remoteAudioRef.current) {
        const el = remoteAudioRef.current;
        el.autoplay = true; el.muted = false; el.playsInline = true; el.srcObject = stream;
        el.play().then(()=>pushLog("Audio playing")).catch(err=>pushLog("Audio play blocked: "+(err?.message||String(err))));
      }
    };
    ms.getTracks().forEach((t) => pc.addTrack(t, ms));

    const dc = pc.createDataChannel("oai-events"); dcRef.current = dc;
    dc.onopen = () => {
      setStatus("Terhubung — mendaftar tools...");
      const sessionUpdate = {
        type: "session.update",
        session: {
          instructions: "Kamu asisten Pegadaian. Bahasa Indonesia natural, ramah. Jawab HANYA berdasarkan fungsi search_company; jangan sebutkan sumber/URL.",
          modalities: ["audio","text"], voice: "shimmer",
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
        const msg = JSON.parse(e.data);
        if (msg.type && msg.type.startsWith("response.")) pushLog("evt:"+msg.type);
        if (msg.type === "response.required_action" && msg.response?.required_action?.type === "submit_tool_outputs") {
          const calls = msg.response.required_action.submit_tool_outputs.tool_calls || [];
          for (const c of calls) {
            if (c.type === "function" && c.name === "search_company") {
              let args = {}; try { args = typeof c.arguments === "string" ? JSON.parse(c.arguments) : (c.arguments || {}); } catch {}
              const q = args?.query || "";
              const res = await fetch("/api/rag/answer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) }).then(r => r.json());
              const out = { type: "response.submit_tool_outputs", response_id: msg.response.id, tool_outputs: [{ tool_call_id: c.id, output: res?.answer || res?.text || "" }] };
              dc.send(JSON.stringify(out));
              if (speakAnswers) {
                const ev = { type: "response.create", response: { instructions: "Silakan bacakan jawaban di atas secara ringkas.", modalities: ["audio"] } };
                dc.send(JSON.stringify(ev));
              }
            }
          }
        } else if (msg.type === "response.output_text.delta") {
          textBuf += msg.delta || "";
        } else if (msg.type === "response.completed") {
          if (textBuf) pushLog("asr/answer: "+textBuf.slice(0,120));
          textBuf = "";
        }
      } catch {}
    };

    let offer;
    try { offer = await pc.createOffer(); await pc.setLocalDescription(offer); }
    catch (e) { setStatus("Gagal membuat offer WebRTC: " + (e?.message || String(e))); return; }
    let sdp = "";
    try {
      const model = "gpt-4o-realtime-preview";
      const r = await fetch(`https://api.openai.com/v1/realtime?model=${model}`, { method: "POST", body: offer.sdp, headers: { Authorization: `Bearer ${sess.client_secret.value}`, "Content-Type": "application/sdp" } });
      sdp = await r.text();
    } catch (e) { setStatus("Gagal negosiasi Realtime API: " + (e?.message || String(e))); return; }
    try { await pc.setRemoteDescription({ type: "answer", sdp }); }
    catch (e) { setStatus("Gagal set remote description: " + (e?.message || String(e))); return; }
  }

  function disconnect() {
    dcRef.current?.close(); pcRef.current?.close(); dcRef.current = null; pcRef.current = null; setConnected(false); setStatus("Terputus");
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
      <div className="flex items-center gap-3">
        <button onClick={speakTest} className="px-2 py-1 rounded bg-sky-600 text-white text-xs">Tes Audio</button>
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
