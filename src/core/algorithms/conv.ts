export type Grid = number[][];

export const outSize = (n: number, k: number, stride: number, pad: number): number => Math.floor((n + 2 * pad - k) / stride) + 1;

/** Tương quan chéo 2D (như các framework DL gọi là "convolution"): không lật kernel. */
export function conv2d(img: Grid, ker: Grid, stride: number, pad: number): Grid {
  const h = img.length, w = img[0].length, kh = ker.length, kw = ker[0].length;
  const oh = outSize(h, kh, stride, pad), ow = outSize(w, kw, stride, pad);
  if (oh < 1 || ow < 1 || stride < 1) throw new Error('Kích thước đầu ra không hợp lệ: kernel quá lớn so với ảnh.');
  const at = (y: number, x: number) => (y < 0 || x < 0 || y >= h || x >= w ? 0 : img[y][x]);
  return Array.from({ length: oh }, (_, i) => Array.from({ length: ow }, (_, j) => {
    let s = 0;
    for (let a = 0; a < kh; a++) for (let b = 0; b < kw; b++) s += at(i * stride - pad + a, j * stride - pad + b) * ker[a][b];
    return s;
  }));
}

export function pool(img: Grid, size: number, stride: number, mode: 'max' | 'avg'): Grid {
  const oh = outSize(img.length, size, stride, 0), ow = outSize(img[0].length, size, stride, 0);
  if (oh < 1 || ow < 1) throw new Error('Cửa sổ pooling quá lớn.');
  return Array.from({ length: oh }, (_, i) => Array.from({ length: ow }, (_, j) => {
    const v: number[] = [];
    for (let a = 0; a < size; a++) for (let b = 0; b < size; b++) v.push(img[i * stride + a][j * stride + b]);
    return mode === 'max' ? Math.max(...v) : v.reduce((s, x) => s + x, 0) / v.length;
  }));
}

export const relu = (g: Grid): Grid => g.map((r) => r.map((v) => Math.max(0, v)));

export const KERNELS: Record<string, Grid> = {
  'Cạnh dọc (Sobel x)': [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]],
  'Cạnh ngang (Sobel y)': [[-1, -2, -1], [0, 0, 0], [1, 2, 1]],
  'Làm mờ (trung bình)': [[1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9]],
  'Làm nét': [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
  'Đồng nhất': [[0, 0, 0], [0, 1, 0], [0, 0, 0]],
};

export const IMAGES: Record<string, Grid> = {
  'Chữ T': Array.from({ length: 8 }, (_, y) => Array.from({ length: 8 }, (_, x) => (y === 1 && x >= 1 && x <= 6) || (x >= 3 && x <= 4 && y >= 1 && y <= 6) ? 1 : 0)),
  'Ô vuông': Array.from({ length: 8 }, (_, y) => Array.from({ length: 8 }, (_, x) => (y >= 2 && y <= 5 && x >= 2 && x <= 5 ? 1 : 0))),
  'Đường chéo': Array.from({ length: 8 }, (_, y) => Array.from({ length: 8 }, (_, x) => (x === y ? 1 : 0))),
};
