import { LESSONS } from '..';
import { ML_PYTHON } from './ml';
import { DL_PYTHON } from './dl';
import { FOUNDATION_PYTHON } from './foundation';
import { GENAI_PYTHON } from './genai';
import type { PythonLesson } from './types';
export const PYTHON_LESSONS: Record<string, PythonLesson> = { ...ML_PYTHON, ...DL_PYTHON, ...FOUNDATION_PYTHON, ...GENAI_PYTHON };
export const COLAB_URL = 'https://colab.research.google.com/';
export const setupCode = 'import numpy as np\nimport matplotlib.pyplot as plt\n';
export function makeNotebook(id: string) {
  const lesson = LESSONS.find(l => l.id === id);
  const sample = PYTHON_LESSONS[id];
  if (!lesson || !sample) throw new Error(`Không có notebook cho ${id}`);
  let seq = 0;
  const md = (source: string) => ({ cell_type: 'markdown' as const, id: `text-${++seq}`, metadata: {}, source: source.split(/(?<=\n)/) });
  const code = (source: string) => ({ cell_type: 'code' as const, id: `code-${++seq}`, metadata: {}, execution_count: null, outputs: [], source: source.split(/(?<=\n)/) });
  return {
    nbformat: 4, nbformat_minor: 5,
    metadata: { kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' }, language_info: { name: 'python' }, colab: { name: `${id.toLowerCase()}.ipynb`, provenance: [] } },
    cells: [
      md(`# ${lesson.title}\n\n${sample.summary}\n\n## Cách chạy trên Colab\nTải tệp .ipynb, mở https://colab.research.google.com/ → File → Upload notebook. Chọn runtime Python 3 / CPU, chạy lần lượt từ trên xuống. Không cần GPU.\n\nDữ liệu mẫu được tạo hoặc đi kèm thư viện; không cần tải dữ liệu cá nhân. Colab chạy trên đám mây, không phải xử lý cục bộ như lab web.\n\n**Giới hạn:** ${sample.limitation}`),
      md('## 1. Cài thư viện\nCell này cần kết nối mạng. Các thư viện không được khóa phiên bản; nếu môi trường thay đổi, hãy kiểm tra lại kết quả.'),
      code(`%pip -q install ${sample.packages.join(' ')}\n`),
      md('## 2. Khởi tạo\nNumPy dùng cho tính toán mảng; Matplotlib hiển thị biểu đồ.'), code(setupCode),
      ...sample.steps.flatMap((s, i) => [md(`## ${i + 3}. ${s.title}\n\n${s.explanation}`), code(s.code + '\n')]),
      md(`## Tự thử nghiệm\n${sample.exercises.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nGhi lại tham số đã đổi, kết quả quan sát và lời giải thích. Không chọn tham số bằng test.\n\n## Tài liệu\n- [Colab FAQ](https://research.google.com/colaboratory/faq.html)\n- [Tránh rò rỉ dữ liệu](https://scikit-learn.org/stable/common_pitfalls.html)\n- [PyTorch tutorials](https://pytorch.org/tutorials/)`),
    ],
  };
}
