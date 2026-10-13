import { checkEndpoint } from '../../core/security/url';
import { setSession } from '../../core/security/keystore';
import type { ChatProfile } from '../../core/providers/chat';
import type { EmbedProfile } from '../../core/providers/embed';
import { Field } from '../../app/ui';

export function ChatProfileForm({ slot, p }: { slot: 'chatA' | 'chatB'; p: ChatProfile }) {
  const set = (patch: Partial<ChatProfile>) => setSession(slot, { ...p, ...patch });
  const chk = p.baseUrl ? checkEndpoint(p.baseUrl) : null;
  return (
    <div className="box">
      <strong>{p.label}</strong>
      <Field label="Base URL (HTTPS, ví dụ …/v1)"><input value={p.baseUrl} onChange={(e) => set({ baseUrl: e.target.value })} placeholder="https://api.example.com/v1" autoComplete="off" /></Field>
      {chk && !chk.ok && <p role="alert" className="warn">{chk.reason}</p>}
      <Field label="Model (nhập tay)"><input value={p.model} onChange={(e) => set({ model: e.target.value })} autoComplete="off" /></Field>
      <Field label="API key (chỉ giữ trong bộ nhớ phiên)"><input type="password" value={p.apiKey} onChange={(e) => set({ apiKey: e.target.value })} autoComplete="off" /></Field>
      <Field label={`Temperature = ${p.temperature}`}><input type="range" min={0} max={2} step={0.1} value={p.temperature} onChange={(e) => set({ temperature: Number(e.target.value) })} /></Field>
      <Field label={`Top-p = ${p.topP}`}><input type="range" min={0.1} max={1} step={0.05} value={p.topP} onChange={(e) => set({ topP: Number(e.target.value) })} /></Field>
      <Field label="Giới hạn token đầu ra"><input type="number" min={16} max={8192} value={p.maxTokens} onChange={(e) => set({ maxTokens: Math.max(16, Number(e.target.value) || 16) })} /></Field>
      <label className="check"><input type="checkbox" checked={p.stream} onChange={(e) => set({ stream: e.target.checked })} /> Streaming (nếu model hỗ trợ)</label>
      <p className="muted">Gửi yêu cầu có thể phát sinh phí. Nên dùng key cá nhân có hạn mức thấp và thu hồi được.</p>
    </div>
  );
}

export function EmbedProfileForm({ p }: { p: EmbedProfile }) {
  const set = (patch: Partial<EmbedProfile>) => setSession('embed', { ...p, ...patch });
  const chk = p.baseUrl ? checkEndpoint(p.baseUrl) : null;
  return (
    <div className="box">
      <strong>API embedding (cấu hình và key riêng)</strong>
      <Field label="Base URL"><input value={p.baseUrl} onChange={(e) => set({ baseUrl: e.target.value })} placeholder="https://api.example.com/v1" autoComplete="off" /></Field>
      {chk && !chk.ok && <p role="alert" className="warn">{chk.reason}</p>}
      <Field label="Model embedding"><input value={p.model} onChange={(e) => set({ model: e.target.value })} autoComplete="off" /></Field>
      <Field label="API key (chỉ bộ nhớ phiên)"><input type="password" value={p.apiKey} onChange={(e) => set({ apiKey: e.target.value })} autoComplete="off" /></Field>
    </div>
  );
}
