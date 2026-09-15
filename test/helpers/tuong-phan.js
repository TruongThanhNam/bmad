// Tỉ lệ tương phản WCAG 2.x, viết ĐÚNG MỘT LẦN cho phía Node.
//
// Vì sao là một helper chứ không phải vài dòng trong `theme.test.js`: ngưỡng 4.5:1 của AD-20
// mục 4 được đo ở hai tầng (Vitest trên bảng token, `npm run thu-bo-cuc` trên trình duyệt
// thật), và hai công thức khác nhau là hai câu trả lời khác nhau cho cùng một câu hỏi. Bản
// chạy trong trình duyệt sống trong `tools/thu-bo-cuc.mjs` (`tuongPhan` trong `HAM_TEN`) vì nó
// phải đi qua CDP dưới dạng chuỗi và không import được; nó không được viết lại ở đâu khác nữa,
// và bản này không được lệch khỏi nó một dòng nào.
//
// Nguồn: WCAG 2.2, *Contrast (Minimum)* — luminance tương đối cộng `(L1 + 0.05) / (L2 + 0.05)`.

/** Ba kênh 0–255 từ một hex `#RRGGBB` hoặc `#RGB`. */
export function kenhRgb(hex) {
  const cat = String(hex).trim().replace(/^#/, '');
  // Kiểm CHỮ SỐ, không chỉ kiểm độ dài: `#zzzzzz` dài đúng sáu ký tự, và `parseInt` trả `NaN`
  // cho nó. `NaN` đi tới cuối thành một tỉ lệ `NaN`, và `NaN < 4.5` là `false` — tức một màu
  // không đọc được sẽ ĐẠT mọi ngưỡng trong im lặng, đúng thứ cả bộ đo này sinh ra để chặn.
  if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(cat)) {
    throw new TypeError(`không đọc được màu ${JSON.stringify(hex)}`);
  }
  const day = cat.length === 3 ? [...cat].map((c) => c + c) : cat.match(/../g);
  return day.map((doi) => Number.parseInt(doi, 16));
}

/** Luminance tương đối của một màu hex. */
export function doSang(hex) {
  const [r, g, b] = kenhRgb(hex).map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Tỉ lệ tương phản giữa hai màu hex, luôn ≥ 1 bất kể thứ tự tham số. */
export function tuongPhan(a, b) {
  const [x, y] = [doSang(a), doSang(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

/** Tỉ lệ làm tròn hai chữ số — dạng con người đọc được, và dạng AC ghim (`4.55`). */
export function tuongPhanLamTron(a, b) {
  return Math.round(tuongPhan(a, b) * 100) / 100;
}
