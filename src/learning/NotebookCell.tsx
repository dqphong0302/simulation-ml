// Render Python as escaped React text; never execute source or insert HTML.
export function PythonCode({ code }: { code: string }) {
  const pattern = /("""[\s\S]*?"""|'''[\s\S]*?'''|#[^\n]*|(?:f)?"(?:\\.|[^"\\])*"|(?:f)?'(?:\\.|[^'\\])*'|\b(?:def|return|if|elif|else|for|in|try|except|raise|import|from|as|or|and|not|True|False|None)\b|\b(?:print|input|int|float|str|type|len|range|sum|min|max|list|set|next|iter|any)\b|\b\d+(?:\.\d+)?\b)/g;
  const nodes = [];
  let start = 0;
  for (const m of code.matchAll(pattern)) {
    if (m.index! > start) nodes.push(code.slice(start, m.index));
    const token = m[0];
    const kind = token.startsWith('#') ? 'comment' : /^f?["']/.test(token) ? 'string' : /^\d/.test(token) ? 'number' : /^(print|input|int|float|str|type|len|range|sum|min|max|list|set|next|iter|any)$/.test(token) ? 'builtin' : 'keyword';
    nodes.push(<span key={m.index} className={`py-${kind}`}>{token}</span>);
    start = m.index! + token.length;
  }
  nodes.push(code.slice(start));
  return <code>{nodes}</code>;
}

export const PYTHON_OUTPUTS: Record<string, string> = {
  variables: "Sinh viên A 19 1.7 True\n<class 'str'> <class 'int'> <class 'float'> <class 'bool'>",
  input: 'Nhập tên giả: A\nNhập tuổi nguyên: 19\nNhập chiều cao (m), ví dụ 1.70: 1.70\nNhập cân nặng (kg): 65\nA: 19 tuổi, 1.70 m, 65.00 kg',
  conditions: 'Đạt quy tắc tuổi giả định',
  bmi: 'BMI minh họa: 22.49',
  loops: 'Lần đo đầu: 36.8\nTổng số lần đo: 7\nDưới mốc 38.0: 5\nTừ mốc 38.0: 2',
  functions: 'BMI minh họa: 22.49\nBMI minh họa: 22.22\nBMI minh họa: 27.34\nChiều cao và cân nặng phải dương',
  csv: "Các cột: ['Glucose', 'Outcome']\nSố dòng / cột: 5 2\n5 dòng đầu: [{'Glucose': '100', 'Outcome': '0'}, …]\n5 dòng cuối: [{'Glucose': '100', 'Outcome': '0'}, …]\n(Đã rút gọn hai dòng danh sách để dễ đọc)",
  statistics: 'Tổng dòng: 5 | Giá trị số bị bỏ: 2\nTrung bình: 123.33\nNhỏ nhất / lớn nhất: 100.0 150.0\nNhãn 0 / 1 / khác hoặc thiếu: 2 2 1\nTỷ lệ nhãn 1 trong nhãn hợp lệ: 50.00%',
};

export function NotebookCell({ id, index, code, copied, onCopy }: { id: string; index: number; code: string; copied: boolean; onCopy: () => void }) {
  return <div className="notebook-cell" id={`code-python-${id}`}>
    <div className="notebook-cell-bar"><span>Code cell <span className="notebook-language">Python 3</span></span><button id={`copy-python-${id}`} className="btn sm" aria-label={`Sao chép code phần ${index}`} onClick={onCopy}>{copied ? 'Đã sao chép' : 'Sao chép code'}</button></div>
    <div className="notebook-input"><div className="notebook-execution" title="Số thứ tự cell; code chưa chạy trên trang">[&nbsp;{index}&nbsp;]</div><div className="notebook-code-scroll"><pre className="notebook-line-numbers" aria-hidden="true">{code.split('\n').map((_,i) => i+1).join('\n')}</pre><pre className="notebook-source" tabIndex={0} aria-label={`Code Python phần ${index}`}><PythonCode code={code} /></pre></div></div>
    <div className="notebook-output"><div className="notebook-output-label">Kết quả minh họa · không phải chạy trực tiếp</div><pre>{PYTHON_OUTPUTS[id]}</pre></div>
  </div>;
}
