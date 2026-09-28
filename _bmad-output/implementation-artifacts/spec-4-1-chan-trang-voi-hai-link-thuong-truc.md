---
title: 'Story 4.1 — Chân trang với hai link thường trực'
type: 'feature'
created: '2026-09-15'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Chân trang (tầng 4) đã có hai điều khiển dáng link `xuất sao lưu` · `nạp lại` và nút
theme từ Story 2.1, nhưng chưa có chỗ dành sẵn cho dòng nhắc sao lưu **cùng dòng** với hai link
(UX-DR-19), và chưa có bài test nào khóa lại ba cam kết của Story 4.1: hai link **không bao giờ
ẩn** ở mọi trạng thái — kể cả rỗng tuyệt đối trên máy mới — và **không phụ thuộc** dòng nhắc, thứ
mà trên máy mới chưa có gì để nói. Đúng lúc rủi ro mất dữ liệu cao nhất thì đây là đường thoát duy
nhất, nên nó phải là điểm chịu lực có test, không phải may mắn còn sót lại của một story khác.

**Approach:** Thêm vào `index.html` đúng một phần tử rỗng làm **chỗ đứng** cho dòng nhắc, đặt sau
`nạp lại` và trước `.nut-theme`, để Story 4.4 chỉ việc đổ chữ vào mà không phải sắp lại chân trang.
Nó phải giữ nguyên hai bất biến đang có: `.nut-theme` vẫn bị đẩy phải bằng `margin-inline-start:
auto` (không phần tử đệm), và tầng 4 vẫn **chưa có hành vi** — không script, không handler nội
tuyến, hai link bấm vào vẫn không xảy ra gì cho tới Story 4.2/4.3. Trong `app/style.css`, chỗ đứng
rỗng phải **không chiếm chỗ**: khi trống nó không được sinh thêm một khoảng `gap` nào; khi có chữ
nó dùng `{typography.foot}` và `{colors.ink-2}` y như hai link bên cạnh. Cuối cùng, bổ sung test
khóa ba cam kết của story: hai link luôn có mặt trong DOM tĩnh và không mang `hidden`/`display:
none`/điều kiện hiển thị nào; chỗ đứng dòng nhắc tồn tại và rỗng nguyên ở dạng tĩnh; thứ tự tab
theo đúng DOM là `xuất sao lưu` → `nạp lại` → nút theme.

**Quyết định đã chốt (không hỏi lại):** (1) Chỗ đứng là một `<span>` rỗng, không `aria-live` —
dòng nhắc là **thụ động**, không được cướp lời trình đọc màn hình; nếu 4.4 cần thông báo thì đó là
quyết định của 4.4. (2) Chỗ đứng **không** phải phần tử nhận focus, để không thêm điểm dừng bàn
phím nào giữa `nạp lại` và nút theme. (3) Không đụng tới hành vi xuất/nạp, port `fileIO`, hay
`lastBackupAt` — chúng thuộc Story 4.2/4.3/4.4.

</frozen-after-approval>

## Implementation Notes

- `index.html` — thêm `<span class="chan-nhac"></span>` giữa `nạp lại` và `.nut-theme`, kèm chú
  thích nêu ba lý do "không": không `aria-live`, không `tabindex`, không chiếm chỗ khi rỗng.
  Hai link và nút theme **không đụng tới**; tầng 4 vẫn không script, không handler nội tuyến.
- `app/style.css` — `.chan-nhac` (`--ink-2` + `--font-foot`) và `.chan-nhac:empty { display:
  none }`. Không đổi `.chan`, `.chan-link`, `.nut-theme`.
- `test/chan-trang-hai-link.test.js` (mới, 10 ca) — khóa: hai link có trong DOM tĩnh; không
  thuộc tính/luật CSS nào ẩn chúng; chỗ đứng tồn tại, rỗng, đúng vị trí giữa `nạp lại` và nút
  theme; ba điểm dừng bàn phím chứ không bốn; nút theme vẫn đẩy phải bằng lề.
- **Bất ngờ:** `test/theme.test.js` có cửa chặn "mọi luật có `color: var(--…)` phải được khai
  chỗ đứng trong `NEN_CUA`" — nó bắt `.chan-nhac` ngay lượt chạy đầu. Đã khai `.chan-nhac` trên
  nền `--bg` (đúng chỗ nó đứng: chân trang nằm trên nền bàn); `--ink-2` trên `--bg` vốn đã đạt
  ngưỡng ở cả hai bảng màu nên không phải đổi token nào.
- **Cố ý để lại cho story sau:** hai link vẫn chưa có hành vi, không adapter `fileIO`, không
  `lastBackupAt`. Ca test "chưa có hành vi" sẽ phải RENEGOTIATE có ghi chép ở Story 4.2/4.3 —
  đã ghi điều đó ngay trong chú thích của ca.
- **Sự cố trong lúc làm, đã sửa:** một lệnh kiểm thử đột biến tôi chạy để thử bộ dò ẩn link bị
  hỏng đường dẫn `/tmp` trên Windows và làm mất phần CSS vừa thêm. Đã phát hiện qua `git status`
  và khôi phục nguyên văn; suite xanh lại sau đó. Bài học: không thử đột biến bằng cách ghi đè
  file nguồn.
- Kiểm chứng cuối: `npx vitest run` → 25 file, 559 ca, xanh toàn bộ.

## Review Triage Log

Một lớp review: `blind-hunter` (9 phát hiện). Không lớp nào bị bỏ qua.

- **medium — tên ca test hứa một đằng, kiểm một nẻo** (`chan-trang-hai-link.test.js`). Đúng: ca
  tên "không module nào ở `app/view/` cầm tới hai nhãn này" chỉ quét handler nội tuyến trong
  HTML, không đọc một file `app/view/` nào. → **patch**: ca giờ quét thật mọi `app/view/*.js`.
- **medium — bộ dò ẩn link chỉ nhìn luật có chữ `.chan-link`** (cùng gốc với: từ vựng ẩn quá
  hẹp). Đúng: `.chan { display: none }` hay `.tang-chan { display: none }` lọt sạch, và
  `opacity: 0` / `clip-path` / `width: 0` cũng lọt. → **patch**: dò cả ba vật chứa bọc ngoài và
  tám cách ẩn. Bản vá đầu tiên đỏ thật vì `\b` khớp nhầm `.chan-nhac` khi tìm `.chan` — đã đổi
  sang `(?![\w-])`, và chính lần đỏ đó là bằng chứng bộ dò có nổ.
- **medium — chỗ đứng dòng nhắc được kiểm lỏng hơn hai link**. Đúng: không ca nào chặn một
  `.chan-nhac { display: none }` về sau, thứ sẽ giết Story 4.4 trong im lặng. → **patch**: thêm
  ca "`:empty` là luật DUY NHẤT tắt chỗ đứng", và kiểm `hidden`/`aria-hidden`/`style` trên thẻ.
- **medium — `:empty` nhạy với khoảng trắng, không chỗ nào cảnh báo 4.4**. Đúng: `innerHTML =
  '\n  '` làm sống lại khoảng `gap` ma mà không ca nào đỏ. → **patch**: ghi hợp đồng
  `textContent = ''` thẳng vào chú thích của luật CSS.
- **low — đếm điểm dừng bàn phím bỏ lọt `tabindex`/`contenteditable`**. Đúng, và nó bỏ lọt
  đúng thứ Quyết định (2) của spec cấm. Vá là một dòng. → **patch**.
- **low — `expect()` ở tầng module chạy sau khi giá trị đã được dùng**. Đúng: cắt hỏng thì cả
  TỆP thành lỗi thu thập không tên. Vá là một lần đảo thứ tự. → **patch**: phép cắt trả `''`,
  cửa chặn thành một ca có tên.
- **low — `npm run thu-bo-cuc` không đo khoảng `gap` ma**. Đúng một nửa: bộ thu ĐÃ khóa hai
  link trong thứ tự tab thật và kiểm chúng sống sót ở các bề rộng, nhưng không đọc `.chan-nhac`.
  → **defer**: phép đo thật chỉ dựng được khi 4.4 có chữ để so hai cảnh; đã sửa lại chú thích
  đầu tệp test cho khớp sự thật.
- **low — hai phép khẳng định trùng byte với `bo-cuc-bon-tang.test.js`**. Đúng, nhưng vá đúng
  cách là dựng helper dùng chung — không phải một sửa đơn giản, và rủi ro chỉ hiện ở lần
  RENEGOTIATE của Story 4.2/4.3. → **defer**.
