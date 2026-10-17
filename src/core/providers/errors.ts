export class ProviderError extends Error {
  constructor(public kind: 'config' | 'http' | 'network' | 'abort' | 'format', message: string, public status?: number) { super(message); }
}

export function responseFailure(error: unknown): ProviderError {
  if (error instanceof ProviderError) return error;
  if (error instanceof Error && error.name === 'AbortError') return new ProviderError('abort', 'Đã dừng yêu cầu. Nhà cung cấp có thể vẫn tính phí phần đã xử lý.');
  return new ProviderError('format', 'Phản hồi bị ngắt hoặc sai định dạng.');
}
