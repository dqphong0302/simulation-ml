import { DL_THEORY } from './dl';
import { ML_THEORY } from './ml';
import { OTHER_THEORY } from './other';

/**
 * Tài liệu lý thuyết cho từng bài, viết bằng markdown rút gọn:
 * "## " tiêu đề mục · "- " gạch đầu dòng · "1. " danh sách số · "$$ " dòng công thức · "> " ghi chú · **đậm** · dòng trống ngăn đoạn.
 */
export const THEORY: Record<string, string> = { ...OTHER_THEORY, ...ML_THEORY, ...DL_THEORY };

export type Block =
  | { t: 'p'; text: string } | { t: 'h'; text: string; id: string } | { t: 'ul' | 'ol'; items: string[] }
  | { t: 'f'; text: string } | { t: 'note'; text: string };

const slug = (s: string, i: number) => `muc-${i + 1}-${s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

export function parseTheory(src: string): Block[] {
  const out: Block[] = [];
  let hi = 0;
  for (const raw of src.trim().split('\n')) {
    const line = raw.trimEnd();
    const last = out[out.length - 1];
    if (!line.trim()) { out.push({ t: 'p', text: '' }); continue; }
    if (line.startsWith('## ')) { const text = line.slice(3).trim(); out.push({ t: 'h', text, id: slug(text, hi++) }); continue; }
    if (line.startsWith('$$ ')) { out.push({ t: 'f', text: line.slice(3).trim() }); continue; }
    if (line.startsWith('> ')) { out.push({ t: 'note', text: line.slice(2).trim() }); continue; }
    const ul = /^- (.*)$/.exec(line), ol = /^\d+\. (.*)$/.exec(line);
    if (ul || ol) {
      const t = ul ? 'ul' : 'ol', text = (ul ?? ol)![1];
      if (last && last.t === t) last.items.push(text); else out.push({ t, items: [text] });
      continue;
    }
    if (last && last.t === 'p' && last.text) last.text += ' ' + line.trim(); else out.push({ t: 'p', text: line.trim() });
  }
  return out.filter((b) => b.t !== 'p' || b.text);
}
