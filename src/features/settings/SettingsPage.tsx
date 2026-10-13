import { useApp } from '../../app/state';
import { clearKeys } from '../../core/security/keystore';

export function SettingsPage() {
  const { persist, setPersist } = useApp();
  return (
    <div className="page">
      <header className="lesson-head"><div className="lh-title"><p className="eyebrow">Cấu hình</p><h1>Cấu hình kết nối API</h1><p className="lead">Dùng cho bài GenAI Playground và RAG Lab.</p></div></header>
      <div className="box">
        <label className="check"><input type="checkbox" checked={persist} onChange={(e) => setPersist(e.target.checked)} /> Nhớ endpoint và model trên thiết bị này</label>
        <p className="muted">Mặc định tắt. Không bật trên máy dùng chung. Chỉ endpoint, model và tham số được nhớ; API key không bao giờ được lưu.</p>
      </div>
      <div className="box">
        <h3>API key</h3>
        <p className="muted">Nhập endpoint/model/key ở trang GenAI và RAG. API key chỉ giữ trong bộ nhớ phiên: tải lại trang là mất.</p>
        <button onClick={clearKeys}>Xóa mọi API key khỏi bộ nhớ</button>
      </div>
    </div>
  );
}
