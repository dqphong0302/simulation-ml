import { Bx, C, Ln, Tx, type Scene } from './kit';

export const APPLICATION_SCENES: Record<string, Scene> = {
  BOOST: {
    steps: [['Điểm ban đầu', 'Khởi tạo từ tỷ lệ lớp trong train.'], ['Gradient âm', 'Với log-loss: y−sigmoid(F), không chỉ mẫu sai nhãn.'], ['Cộng cây nhỏ', 'F mới = F cũ + learning rate × cây.'], ['Kiểm tra validation', 'Giảm loss train chưa bảo đảm validation tốt hơn.']],
    param: { label: 'Learning rate minh họa', min: .05, max: 1, step: .05, value: .2 },
    predict: 'Learning rate nhân vào điểm hay cộng trực tiếp vào xác suất?',
    draw: ({ s, v }) => <>{[0, 1, 2, 3].map(i => <g key={i}><Bx x={15 + i * 88} y={65} w={72} h={65} c={i <= s ? C.soft : C.surf} stroke={i === s ? C.a : C.line} /><Tx x={51 + i * 88} y={92} s={10}>{['F₀ = 0', 'y−p = 0,5', '+ η × 0,4', 'p = sigmoid(F)'][i]}</Tx><Tx x={51 + i * 88} y={113} s={10}>{i === 2 ? `η = ${v.toFixed(2)}` : i === 3 ? (1 / (1 + Math.exp(-v * .4))).toFixed(3) : ''}</Tx></g>)}<Tx x={180} y={180} s={11}>Số giả một mẫu: y=1, F₀=0; lá cây giả=0,4</Tx></>,
  },
  TRANSFER: {
    steps: [['Đã học nguồn', 'Pretraining học trọng số từ một nhiệm vụ nguồn.'], ['Học đầu mới', 'Giữ backbone, chỉ cập nhật đầu phân loại.'], ['Mở khối cuối', 'Fine-tune phần được mở với learning rate nhỏ.'], ['Đánh giá đích', 'Giữ test độc lập; không bảo đảm chuyển giao tốt hơn.']],
    predict: 'Khối đóng băng có đổi trọng số khi cập nhật đầu mới không?',
    draw: ({ s }) => <>{['Khối đầu', 'Khối cuối', 'Đầu mới'].map((t, i) => <g key={t}><Bx x={20 + i * 115} y={60} w={90} h={80} c={C.soft} stroke={i === 2 || (i === 1 && s >= 2) ? C.b : C.a} /><Tx x={65 + i * 115} y={88}>{t}</Tx><Tx x={65 + i * 115} y={115}>{i === 2 || (i === 1 && s >= 2) ? 'Được mở' : 'Đóng băng'}</Tx>{i < 2 && <Ln x1={110 + i * 115} y1={100} x2={135 + i * 115} y2={100} />}</g>)}<Tx x={180} y={185}>Sơ đồ trạng thái, không phải phiên huấn luyện ảnh</Tx></>,
  },
  SEG: {
    steps: [['Ảnh đầu vào', 'Một nhãn ảnh chưa cho biết vùng ở đâu.'], ['Encoder / decoder', 'Giảm rồi tăng độ phân giải; nối đặc trưng skip.'], ['Mặt nạ', 'Chọn pixel có điểm đạt ngưỡng.'], ['Vùng giao và vùng sai', 'Dice/IoU so mặt nạ với tham chiếu, không chẩn đoán.']],
    predict: 'Ảnh chủ yếu là nền: pixel accuracy cao có thể bỏ sót cả vùng đích không?',
    draw: ({ s }) => <>{[0, 1].map(k => <g key={k}>{Array.from({ length: 64 }, (_, i) => <Bx key={i} x={30 + k * 200 + i % 8 * 12} y={45 + Math.floor(i / 8) * 12} w={11} h={11} r={0} c={(i % 8 - (k && s >= 3 ? 4.5 : 3.5)) ** 2 + (Math.floor(i / 8) - 3.5) ** 2 < 9 ? k ? C.b : C.a : C.soft} />)}<Tx x={78 + k * 200} y={170}>{k ? 'Mask minh họa' : 'Ảnh tổng hợp'}</Tx></g>)}<Ln x1={140} y1={90} x2={215} y2={90} /><Tx x={180} y={205}>Không có mạng đã học trong hoạt hình này</Tx></>,
  },
};
