import type { Doc } from './rag';

export const MAX_DOCS = 10;
export interface DocumentState { docs: Doc[]; message: string | null }
export type DocumentAction = { type: 'add'; doc: Doc; note?: string } | { type: 'remove'; id: string } | { type: 'message'; message: string | null };
/** Serializes concurrent file/OCR/paste completions without closing over an obsolete document list. */
export function documentReducer(state: DocumentState, action: DocumentAction): DocumentState {
  if (action.type === 'message') return { ...state, message: action.message };
  if (action.type === 'remove') return { ...state, docs: state.docs.filter(doc => doc.id !== action.id) };
  if (state.docs.length >= MAX_DOCS) return { ...state, message: `Tối đa ${MAX_DOCS} tài liệu.` };
  if (!action.doc.text.trim()) return { ...state, message: 'Văn bản rỗng.' };
  return { docs: [...state.docs, action.doc], message: action.note ?? null };
}
