import type { ChatProfile } from '../providers/chat';
import type { EmbedProfile } from '../providers/embed';

export interface Profiles { chatA: ChatProfile; chatB: ChatProfile; embed: EmbedProfile }
export const PERSIST_KEY = 'sml.persist';
export const PROFILES_KEY = 'sml.profiles';
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown, fallback: string) => typeof value === 'string' ? value : fallback;
const number = (value: unknown, fallback: number, min: number, max: number, integer = false) =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max && (!integer || Number.isInteger(value)) ? value : fallback;

/** Storage is untrusted: allowlist every field; keys/unknown properties never survive a restore. */
export function restoreProfiles(raw: string, defaults: Profiles): Profiles {
  const value = record(JSON.parse(raw));
  const connection = (input: unknown, fallback: EmbedProfile): EmbedProfile => {
    const v = record(input);
    return { baseUrl: text(v.baseUrl, fallback.baseUrl), model: text(v.model, fallback.model), apiKey: '' };
  };
  const chat = (input: unknown, fallback: ChatProfile): ChatProfile => {
    const v = record(input);
    return { ...connection(input, fallback), label: text(v.label, fallback.label),
      temperature: number(v.temperature, fallback.temperature, 0, 2), topP: number(v.topP, fallback.topP, 0.1, 1),
      maxTokens: number(v.maxTokens, fallback.maxTokens, 16, 8192, true), stream: typeof v.stream === 'boolean' ? v.stream : fallback.stream };
  };
  return { chatA: chat(value.chatA, defaults.chatA), chatB: chat(value.chatB, defaults.chatB), embed: connection(value.embed, defaults.embed) };
}

/** Explicit serialization prevents accidental persistence of future secret fields. */
export function profilesWithoutKeys(profiles: Profiles) {
  const connection = ({ baseUrl, model }: EmbedProfile) => ({ baseUrl, model });
  const chat = (p: ChatProfile) => ({ ...connection(p), label: p.label, temperature: p.temperature, topP: p.topP, maxTokens: p.maxTokens, stream: p.stream });
  return { chatA: chat(profiles.chatA), chatB: chat(profiles.chatB), embed: connection(profiles.embed) };
}
