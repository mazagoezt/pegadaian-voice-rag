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
  const [log, setLog] = useState<string[]>([]);
  const pushLog = (m: string) => setLog(v => [new Date().toLocaleTimeString()+": "+m, ...v].slice(0, 20));
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  async function connect() {
    setStatus("Mengambil token sesi...");
    let sess: any = null; let raw = "";
    try { const resp = await timeoutFetch("/api/realtime/session", 12000, { cache: "no-store" }); raw = await resp.text(); try { sess = JSON.parse(raw); } catch {} }
    catch (e: any) { setStatus("Gagal panggil /api/realtime/session: " + (e?.message || String(e))); return; }
    const EPHEMERAL_KEY = sess?.client_secret?.value;
    if (!EPHEMERAL_KEY) { setStatus("Gagal ambil token: " + (sess?.error || raw?.slice(0, 300))); return; }
    let ms: MediaStream; try { ms = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e: any) { setStatus("Izin mikrofon ditolak: " + (e?.message || String(e))); return; }
    const pc = new RTCPeerConnection(); pcRef.current = pc; pc.onconnectionstatechange = () => pushLog("pc.state="+pc.connectionState);
    pc.ontrack = (event) => {
      pushLog("Remote track received"); const [stream] = event.streams; if (remoteAudioRef.current) { const el = remoteAudioRef.current as HTMLAudioElement; el.autoplay = true; el.muted = false; (el as any).playsInline = true; el.srcObject = stream; el.play().then(()=>pushLog("Audio playing")).catch(err=>pushLog("Audio play blocked: "+(err?.message||String(err)))); } };
    const dc = pc.createDataChannel("oai-events"); dcRef.current = dc;
    dc.onopen = () => {
      setStatus("Terhubung — mendaftar tools...");
      const sessionUpdate: OAIEvent = {
        type: "session.update",
        session: {
          instructions: "Kamu asisten Pegadaian. Bahasa Indonesia natural, ramah. Jawab HANYA berdasarkan fungsi search_company; jangan sebutkan sumber/URL.",
          modalities: ["audio","text"], voice: "shimmer",
          turn_detection: { type: "server_vad", threshold: 0.5, prefix_padding_ms: 250, silence_duration_ms: 400 },
          tool_choice: { type: "function", name: "search_company" }, tools: [{
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
    dc.onmessage = async (e) => {
      let textBuf = "";
      try {
        const msg: OAIEvent = JSON.parse(e.data);
        if (msg.type && msg.type.startsWith("response.")) pushLog("evt:"+msg.type);
        // Realtime tool flow: respond to required_action -> submit_tool_outputs
        if (msg.type === "response.required_action" && msg.response?.required_action?.type === "submit_tool_outputs") {
          const calls = msg.response.required_action.submit_tool_outputs.tool_calls || [];
          for (const c of calls) {
            if (c.type === "function" && c.name === "search_company") {
              let args: any = {};
              try { args = typeof c.arguments === "string" ? JSON.parse(c.arguments) : (c.arguments || {}); } catch {}
              const q = args?.query || "";
              const res = await fetch("/api/rag/answer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) }).then(r => r.json());
              const out: OAIEvent = { type: "response.submit_tool_outputs", response_id: msg.response.id, tool_outputs: [{ tool_call_id: c.id, output: res?.answer || res?.text || "" }] };
              dc.send(JSON.stringify(out));
            }
          }
        } else if (msg.type === "response.output_text.delta") {
          textBuf += msg.delta || "";
        } else if (msg.type === "response.completed") {
          if (textBuf) pushLog("asr/answer: "+textBuf.slice(0,120));
          textBuf = "";
        } else if (msg.type === "tool_call" && msg.name === "search_company") {
          const q = msg?.arguments?.query || "";
          const res = await fetch("/api/rag/answer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q }) }).then(r => r.json());
          const toolOut: OAIEvent = { type: "tool_output", tool_call_id: msg.id, output: res?.answer || res?.text || "" };
          dc.send(JSON.stringify(toolOut));
        }
      } catch {}
    };
    ms.getTracks().forEach((t) => pc.addTrack(t, ms));
    let offer: RTCSessionDescriptionInit; try { offer = await pc.createOffer(); await pc.setLocalDescription(offer); } catch (e: any) { setStatus("Gagal membuat offer WebRTC: " + (e?.message || String(e))); return; }
    let sdp = ""; try {
      const model = "gpt-4o-realtime-preview";
      sdp = await timeoutFetch(`https://api.openai.com/v1/realtime?model=${model}`, 12000, {
        method: "POST", body: offer.sdp!, headers: { Authorization: `Bearer ${EPHEMERAL_KEY}`, "Content-Type": "application/sdp" }
      }).then(r => r.text());
    } catch (e: any) { setStatus("Gagal negosiasi Realtime API: " + (e?.message || String(e))); return; }
    try { await pc.setRemoteDescription({ type: "answer", sdp }); } catch (e: any) { setStatus("Gagal set remote description: " + (e?.message || String(e))); return; }
  }
  function disconnect() { dcRef.current?.close(); pcRef.current?.close(); dcRef.current = null; pcRef.current = null; setConnected(false); setStatus("Terputus"); }
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
      <audio ref={remoteAudioRef} controls />
      <div className="text-xs border rounded-lg p-2 mt-2 bg-white">
        <div className="font-semibold mb-1">Debug</div>
        {log.slice(0,8).map((l,i)=>(<div key={i}>{l}</div>))}
      </div>
    </div>
  );
}
