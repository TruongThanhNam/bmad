---
title: 'Story 4.2 — Xuất toàn bộ ra một file sao lưu'
type: 'feature'
created: '2026-09-15'
status: 'done'
route: 'dispatch'
baseline_commit: 'a3362565d4ca2d7782be3051d7d58e372d147eb2'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Chân trang đã có link `xuất sao lưu` từ Story 4.1 nhưng bấm vào không xảy ra gì:
cổng `fileIO` mới có chữ ký, chưa có adapter, chưa có lõi dựng file, chưa có action. Cho tới khi
story này xong, sản phẩm không có một đường nào đưa dữ liệu ra ngoài trình duyệt — đúng phanh an
toàn duy nhất của toàn bộ UJ-3 đang thiếu.

**Approach:** Dựng nội dung file trong lõi thuần `app/core/backup.js` (test được ở Node bằng một
chuỗi), viết adapter `fileIO.exportFile` bằng Blob + thẻ `<a download>`, thêm action
`xuatSaoLuu()` vào `core/state.js` nối hai thứ đó lại và ghi mốc `lastBackupAt` + phát
`session-changed`, rồi thêm module view `app/view/chan-trang.js` gắn handler cho link theo đúng
khuôn `noiNutTheme`. Story này chỉ làm chiều XUẤT; `readChosenFile` và toàn bộ phép nạp thuộc 4.3.

## Boundaries & Constraints

**Always:**
- File chứa **toàn bộ** ghi chú đang có trong tầng A, không bao giờ phụ thuộc `dieuKien` đang bật.
- Hình dạng đúng `{ schemaVersion: 1, exportedAt, notes: [{ id, createdAt, text }] }` — đúng ba
  trường mỗi ghi chú, `localDate` và `textFolded` **không** có mặt.
- `exportedAt` dựng bằng `nowIso()` (ISO-8601 có offset), và chính giá trị đó được ghi vào
  `lastBackupAt` — không gọi `nowIso()` lần thứ hai.
- Tên file `ghi-chu-hang-ngay-YYYY-MM-DD.json`, ngày lấy từ `localDate({ createdAt: exportedAt })`.
- Xuất thành công thì giao diện **im lặng tuyệt đối**: không dải băng, không toast, không đổi nhãn.
- Dữ liệu chỉ rời máy khi Nam bấm — không hẹn giờ, không gọi mạng, không tự xuất lúc tải trang.
- Số literal chỉ sống ở `core/limits.js` (`0` và `1` được miễn trừ ở mọi nơi).

**Never:**
- Không đọc `ports.noteStore.readAll()` trong đường xuất — nguồn là `noiBo.notes` đang trong RAM.
- Không đụng `readChosenFile`, phép gộp, `core/errors.js`, `core/banner.js`, hay dòng nhắc 4.4.
- Không sửa `.chan`, `.chan-link`, `.chan-nhac`, `.nut-theme` trong `app/style.css`.
- Không thêm handler nội tuyến vào `index.html`; wiring đi qua `app/view/` và `main.js`.
- Không dùng `showSaveFilePicker` (hộp thoại chọn chỗ lưu phá cam kết "im lặng tuyệt đối").

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Xuất bình thường | 3 ghi chú trong tầng A, đang lọc còn 1 | `exportFile('ghi-chu-hang-ngay-2026-09-15.json', text)` với `notes` đủ 3 | N/A |
| Kho rỗng | `notes: []` | Vẫn xuất, `notes: []`, file hợp lệ | N/A |
| Có bản nháp đang gõ | `draft.text` khác rỗng | Bản nháp **không** có trong file | N/A |
| Trường dẫn xuất | Bản ghi đủ 5 trường | Mỗi phần tử `notes` có đúng `id`, `createdAt`, `text` | N/A |
| `exportFile` từ chối | Cổng ném / lời hứa bị từ chối | **Im lặng hoàn toàn** — không dải băng, không đổi state | Nuốt lỗi; KHÔNG ghi `lastBackupAt`, KHÔNG phát tin |
| `lastBackupAt` ghi hỏng | `localStorage` bị chặn | File đã tải xuống rồi → im lặng, không dải băng | Nuốt lỗi, không phát `session-changed` |
| Bấm hai lần liên tiếp | Click thứ hai khi lần đầu chưa xong | Hai file, mỗi lần một `exportedAt` riêng | N/A |

**Quyết định đã chốt (không hỏi lại):**
1. **Nguồn dữ liệu là `noiBo.notes`**, không phải `readAll()`: tầng A đã là toàn bộ ghi chú chưa
   lọc, và một phép đọc kho thêm vào đây chỉ đẻ ra một nhánh lỗi mới cho một đường phải im lặng.
2. **Thứ tự `notes` trong file giữ nguyên thứ tự RAM** (giảm dần theo khóa sắp xếp). 4.3 gộp theo
   `id` nên thứ tự không mang nghĩa, nhưng cố định nó thì test so được nguyên văn chuỗi.
3. **`JSON.stringify(…, null, 2)`** — file sao lưu là thứ Nam mở ra xem, dễ đọc thắng vài KB.
4. **Hai link chân trang nhận `id`** (`id="chan-xuat"`, `id="chan-nap"`) để view chọn được mà
   không phải dựa vào thứ tự hay `textContent`; hai test hiện có được cập nhật theo.
5. **`exportFile` thất bại thì im lặng hoàn toàn** (người dùng đã chọn): không dải băng, không mã
   lỗi mới, **tập mã lỗi đóng của `core/errors.js` không được đụng tới**. Chỉ cần không ghi
   `lastBackupAt` — dòng nhắc của Story 4.4 sẽ tự tố rằng chưa có bản sao lưu nào.

</frozen-after-approval>

## Code Map

- `app/core/limits.js` — `MAX_NOTE_CHARS`, `BACKUP_NUDGE_DAYS` **đã có**; story này không thêm hằng.
- `app/core/time.js` — `nowIso()` (ISO có offset, tự dựng, không `toISOString`), `localDate(note)`.
- `app/core/state.js` — `noiBo.notes` = tầng A đã sắp giảm dần. `datTheme` (~592) là **khuôn mẫu
  chính xác** cho action mới: `ghiTruocDatSau`, cờ `xuongKho` trong closure, rồi `phatPhienDoi()`
  (~556). `TIN_PHIEN_DOI` ở dòng 89.
- `app/adapters/localstorage.js` — `BANG_KHOA` đã có `lastBackupAt: 'ghichu.lastBackupAt'`; cổng
  **ĐỒNG BỘ và NÉM**, khóa lạ → `TypeError`.
- `app/ports/file-io.js` — `exportFile(name, text) → Promise<void>`, đã nằm trong `PORT_METHODS`.
- `app/adapters/broadcast.js` — khuôn adapter `export function taoX() { return {…} }`. **Adapter
  cố ý không có test tự động** (`npm run thu-tay`).
- `app/main.js` — composition root, file DUY NHẤT import `adapters/`; `fileIO` đang là stub
  `congTam()` ném lỗi. Thêm adapter thứ 4 và wiring view ở đây.
- `app/view/nut-theme.js` — khuôn `noiX(store, doc = document)` trả `{ ve() }`, trả sớm nếu
  `querySelector` không thấy; `veTatCa()` trong `main.js` gom mọi `ve`.
- `index.html:141-175` — chân trang: hai `<button class="chan-link">`, `.chan-cham`,
  `<span class="chan-nhac">`, `.nut-theme`. Hai link chưa có `id`, chưa có handler.
- `test/chan-trang-hai-link.test.js` — ca quét **mọi `app/view/*.js`** khẳng định "không module nào
  cầm tới hai nhãn này" **phải RENEGOTIATE có ghi chép** ở đây (chú thích ca đã báo trước); cũng
  có ca đếm đúng ba điểm dừng bàn phím.
- `test/bo-cuc-bon-tang.test.js` — khóa thứ tự tab chân trang; kiểm lại sau khi thêm `id`.
- `test/nguong-tap-trung.test.js` — quét số literal ngoài `limits.js` (`0`, `1` miễn trừ).
- `test/core-state.test.js:19-37` — `portsDay()` / `portsThieu()`: khuôn giả lập cổng.

## Tasks & Acceptance

**Execution:**
- [x] `app/core/backup.js` (mới) — xuất `SCHEMA_VERSION`, `tenFileSaoLuu(exportedAt)` và
  `dungFileSaoLuu(notes, exportedAt)` trả chuỗi JSON. Lõi thuần, không import adapter, không
  chạm global — đây là chỗ duy nhất biết hình dạng hợp đồng file, để 4.3 đọc lại cùng một nơi.
- [x] `test/core-backup.test.js` (mới) — phủ toàn bộ I/O Matrix ở tầng lõi: đủ ba trường, vắng
  `localDate`/`textFolded`, kho rỗng, thứ tự giữ nguyên, tên file theo ngày địa phương của
  `exportedAt` (gồm một ca offset âm để chứng minh không dùng UTC), `schemaVersion` bằng 1.
- [x] `app/core/state.js` — thêm action `xuatSaoLuu()`: dựng `exportedAt = nowIso()` một lần,
  gọi `ports.fileIO.exportFile(tên, nội dung)`, rồi ghi `lastBackupAt` và `phatPhienDoi()`.
  Ghi `lastBackupAt` hỏng thì **nuốt** (file đã ra rồi). Không đổi state, không dải băng.
- [x] `test/core-state-xuat.test.js` (mới) — action gọi cổng đúng một lần với đúng đối số; lọc
  đang bật không ảnh hưởng; bản nháp không lọt; `lastBackupAt` nhận đúng `exportedAt` vừa dựng;
  `session-changed` phát đúng một lần; `localStorage` ném thì vẫn im lặng và không phát tin;
  `exportFile` từ chối thì lời hứa của action **không** bị từ chối, `banner` không đổi,
  `lastBackupAt` không được ghi và không tin nào được phát.
- [x] `app/adapters/file-io.js` (mới) — `taoFileIo()` với `exportFile(name, text)` dựng
  `Blob([text], { type: 'application/json' })`, `URL.createObjectURL`, thẻ `<a download>` bấm rồi
  `revokeObjectURL`. `readChosenFile` ném "chưa làm" — 4.3 điền vào.
- [x] `app/main.js` — import adapter thứ 4, gắn vào object `ports`, và gọi module view mới.
- [x] `index.html` — thêm `id="chan-xuat"` và `id="chan-nap"` cho hai link. Không đổi gì khác ở
  chân trang, không handler nội tuyến.
- [x] `app/view/chan-trang.js` (mới) — `noiChanTrang(store, doc = document)` gắn `click` cho
  `#chan-xuat` gọi `store.xuatSaoLuu()`; trả `{ ve() {} }`. `#chan-nap` **chưa gắn gì**.
- [x] `test/chan-trang-hai-link.test.js` + `test/bo-cuc-bon-tang.test.js` — RENEGOTIATE ca "chưa
  có hành vi" thành "chỉ `#chan-xuat` có hành vi, `#chan-nap` vẫn trơ", ghi lý do ngay trong chú
  thích ca; giữ nguyên ba điểm dừng bàn phím và thứ tự tab sau khi thêm `id`.

**Acceptance Criteria:**
- Given `dieuKien` đang lọc còn 1 kết quả và tầng A có 3 ghi chú, when Nam bấm `xuất sao lưu`,
  then nội dung file chứa đủ 3 ghi chú.
- Given xuất thành công, when nó xong, then `ghichu.lastBackupAt` bằng đúng `exportedAt` trong
  file và một bản tin `session-changed` được phát đúng một lần.
- Given xuất thành công, when nó xong, then `state.banner` không đổi và không module view nào
  hiện thông báo.
- Given `app/` sau story này, when chạy `test/nguong-tap-trung.test.js`, then không số literal
  mới nào sống ngoài `limits.js`.
- Given `app/main.js`, when kiểm bằng `test/trang-tinh.test.js`, then nó vẫn nạp được ở Node và
  `kiemTraPorts` chấp nhận bộ cổng có `fileIO` thật.

## Implementation Notes

- `app/core/backup.js` (mới) — `SCHEMA_VERSION`, `tenFileSaoLuu`, `dungFileSaoLuu`. Thụt lề là
  CHUỖI `'  '` chứ không số `2`: `test/nguong-tap-trung.test.js` chỉ miễn trừ `0` và `1`, nên một
  literal `2` ở đây làm đỏ AD-14. Dựng bản ghi mới ba trường chứ không trải-rồi-`delete`, để một
  trường mọc thêm ở Epic sau không âm thầm lọt ra file.
- `app/core/state.js` — `xuatSaoLuu()` KHÔNG đi qua `ghiTruocDatSau` (không có state nào đổi) và
  KHÔNG dựng dải băng ở bất kỳ nhánh nào. Một `nowIso()` duy nhất dùng cho tên file, nội dung và
  `lastBackupAt`. Cả phần dựng lẫn lời gọi cổng nằm trong cùng một `try`.
- `app/adapters/file-io.js` (mới) — Blob + `<a download>`. Gỡ thẻ và thu hồi URL đều ở `finally`,
  nhưng thu hồi LÙI một lượt qua `setTimeout`: thu hồi ngay trong cùng nhịp với `click()` đã từng
  làm trình duyệt hủy phép tải, và đường này im lặng ở cả hai nhánh nên hỏng kiểu đó không để lại
  dấu vết. `readChosenFile` ném cho tới Story 4.3.
- `app/view/chan-trang.js` (mới) — chọn theo `id`, không theo thứ tự hay nhãn. `ve()` rỗng và
  chân trang CỐ Ý đứng ngoài `veTatCa()`: xuất sao lưu không đổi một trường state nào, nên một
  lượt vẽ lại ở đây chính là đường một nháy giao diện lọt vào thao tác đã hứa im lặng.
- **Bất ngờ:** ca "không module nào ở `app/view/` cầm tới hai link" của Story 4.1 phải RENEGOTIATE
  như chú thích của chính nó đã báo trước. Bất biến THẬT được giữ nguyên dưới ba mệnh đề: không ai
  cầm tới hai link bằng class hay nhãn, không ai cầm tới `#chan-nap`, không ai ẩn/gỡ chúng.
- **Lỗ do review tìm ra, đã vá:** không ca nào phủ wiring ở `app/main.js` — xóa dòng
  `noiChanTrang(store, document)` hoặc `fileIO: taoFileIo()` thì suite vẫn xanh trong khi nút chết
  hẳn, và vì cả thành công lẫn thất bại đều im lặng nên không có triệu chứng nào. Đã thêm ca quét
  nguồn theo khuôn `test/banner.test.js:462`, cộng một ca phân biệt stub với adapter thật bằng
  chính câu hai bên ném.
- Kiểm chứng cuối: `npx vitest run` → 27 file, 587 ca, xanh toàn bộ; `npm run thu-bo-cuc` → 72/72.
- **Chưa chạy:** bước thủ công của mục Verification (mở qua HTTPS, bấm thật, xem file rơi xuống).
  Adapter cố ý không có test tự động, nên đây là đường kiểm duy nhất cho phần trình duyệt.

## Spec Change Log

## Review Triage Log

Ba lớp: `blind-hunter` (9), `edge-case-hunter` (11), `verification-gap` (2 + 2 phụ). Không lớp nào bị bỏ qua.

- **medium — `revokeObjectURL` chạy cùng nhịp đồng bộ với `the.click()`** (`adapters/file-io.js`,
  cả hai lớp cùng nêu). Thật và đúng chỗ đau nhất: Firefox/Safari có tiền sử hủy phép tải khi URL
  blob bị thu hồi trước lúc đọc, và story này im lặng ở CẢ hai nhánh nên hỏng kiểu đó không để lại
  dấu vết nào. Adapter lại cố ý không có test. → **patch**: hoãn thu hồi qua `setTimeout(…, 0)`.
- **low — `the.remove()` nằm trong `try` chứ không `finally`** (cùng tệp). Thật nhưng chỉ nổ khi
  `click()` ném, thứ chưa ai chỉ ra đường tới. Gộp vào cùng bản vá trên vì cùng một gốc: cách bọc
  dọn dẹp trong `exportFile` sai. → **patch**.
- **medium — không test nào phủ wiring ở `app/main.js`** (verification-gap, đã tự kiểm chứng).
  Thật: xóa dòng `noiChanTrang(store, document)` hoặc dòng `fileIO: taoFileIo()` thì toàn bộ suite
  vẫn xanh và nút `xuất sao lưu` chết hẳn — vì test view tự dựng lấy view, còn test action tự dựng
  lấy cổng giả. Tôi đã chạy lại `grep` và đối chiếu: khuôn quét `main.js` đã có sẵn ở
  `test/banner.test.js:462`, nên đây là một lỗ thật chứ không phải quy ước repo. → **patch**.
- **low — `nowIso`/`tenFileSaoLuu`/`dungFileSaoLuu` gọi NGOÀI `try`** (`core/state.js`, hai lớp).
  Bad outcome không có đường tới thật: `nowIso()` không ném, và `noiBo.notes` luôn là bản ghi thuần
  nên `JSON.stringify` không ném. Nhưng JSDoc hứa "không bao giờ bị từ chối" và `chan-trang.js` cố
  ý không `.catch` dựa trên lời hứa đó — vá là dời ba dòng vào trong `try`, không thêm nhánh nào.
  → **patch**.
- **low — chú thích `chan-trang.js` nói `veTatCa` gọi `ve` của mọi view, `main.js` thì cố ý để
  chân trang ngoài `veTatCa`**. Thật, và là loại hại cho người đọc sau: Story 4.4 sẽ đọc hai luật
  ngược nhau. Vá là sửa một chú thích. → **patch**.
- **low — ca "bấm hai lần" chỉ khẳng định `typeof exportedAt === 'string'`**. Thật: tên ca hứa
  "mỗi lần một `exportedAt` riêng" mà không kiểm gì về điều đó. Vá theo đúng nghĩa của dòng ma
  trận (mỗi lần gọi TỰ dựng mốc của nó, và chính mốc đó xuống kho), không sửa kỳ vọng cho khớp mã.
  → **patch**.
- **low — mệnh đề (c) quét `/\.remove\(\)|removeChild/` trên MỌI `app/view/*.js`**. Thật: một view
  bất kỳ ở Epic 5 gỡ một nút khỏi DOM sẽ làm đỏ một test về chân trang. → **patch**: thu hẹp về
  đúng hai link.
- **low — `phatPhienDoi()` không bọc `channel.publish`, nên một `publish` ném sẽ từ chối lời hứa**.
  Thật, nhưng `phatPhienDoi` có từ Story 3.3 và `datTheme` phơi y hệt — không phải story này gây
  ra. → **defer**.
- **low — `#chan-nap` là nút focus được, bật, và không làm gì**. Thật với người dùng bàn phím,
  nhưng nút đã ở đó từ Story 2.1/4.1; story này chỉ thêm `id`. → **defer**.
- **false — thiếu đường đọc và validator cho `lastBackupAt`**. Epic 4 giao việc ĐỌC mốc cho Story
  4.4; ý định loại nó ra khỏi đây, không phải spec tự vẽ ranh giới.
- **false — `lastBackupAt` lùi lại khi hai lần xuất chồng nhau**. Chênh lệch tính bằng mili giây,
  còn 4.4 đo bằng NGÀY qua `daysBetween`. Vá thì phải thêm một biến trạng thái cho một hại bằng 0.
- **false — `dungFileSaoLuu` không kiểm `notes` là mảng**. Chỗ gọi duy nhất là `noiBo.notes`, một
  bất biến của `stateRong()`/`sapGiamDan`; không ai chỉ ra đường đưa thứ khác vào.
- **false — cổng trả `undefined` vẫn được ghi nhận thành công**. Chữ ký cổng ở `ports/file-io.js`
  là `Promise<void>`; adapter thật trả đúng lời hứa. Một adapter phá hợp đồng là lỗi khác.
- **false — `lastBackupAt` đánh dấu một bản sao lưu không còn khớp `notes` hiện tại**. Cửa sổ là
  mili giây giữa lúc dựng chuỗi và lúc ghi mốc; 4.4 đo bằng ngày.
- **false — mệnh đề (b) cấm `chan-nap` sẽ đỏ theo thiết kế ở 4.3**. Đúng là sẽ đỏ, và đó là chủ ý
  đã ghi thẳng trong thân ca — một dây bẫy có ghi chép, không phải một khiếm khuyết.
- **false — task nêu `bo-cuc-bon-tang.test.js` nhưng tệp không đổi**. Task đòi bất biến CÒN ĐÚNG
  sau khi thêm `id`, không đòi sửa tệp. Tôi đã chạy `npm run thu-bo-cuc` (72/72) và toàn bộ suite.

## Design Notes

Hình dạng file, để 4.3 đọc lại đúng một hợp đồng:

```json
{
  "schemaVersion": 1,
  "exportedAt": "2026-09-15T14:05:00+07:00",
  "notes": [
    { "id": "…", "createdAt": "2026-09-15T09:12:00+07:00", "text": "…" }
  ]
}
```

Vì sao `exportedAt` dựng một lần rồi dùng lại cho `lastBackupAt`: hai lần gọi `nowIso()` cho hai
giá trị lệch nhau vài mili giây, và 4.4 đo khoảng cách ngày từ mốc đó — một mốc không khớp với
chính file mà nó nói tới là loại lệch không ai đi tìm.

## Verification

**Commands:**
- `npx vitest run` — expected: toàn bộ suite xanh, số ca tăng so với 559, không ca nào bị skip.
- `npm run thu-bo-cuc` — expected: thứ tự tab chân trang không đổi sau khi thêm `id`.

**Manual checks (if no CLI):**
- Adapter `file-io` không có test tự động (đúng quy ước repo): mở `index.html` qua HTTPS, bấm
  `xuất sao lưu`, xác nhận file rơi xuống với đúng tên `ghi-chu-hang-ngay-YYYY-MM-DD.json`, mở ra
  thấy đúng hình dạng trên, và **không** có thông báo nào trên màn hình.
