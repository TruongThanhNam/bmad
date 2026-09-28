---
title: 'Story 4.3 — Nạp lại: hai pha, gộp theo định danh, nguyên tử'
type: 'feature'
created: '2026-09-16'
status: 'done'
route: 'dispatch'
baseline_commit: 'a4116adbe5168e146dcc276e0642a2815dd62745'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 4.2 đã đưa dữ liệu ra ngoài trình duyệt, nhưng chiều về chưa có: `#chan-nap`
là một nút trơ, `fileIO.readChosenFile` còn ném "chưa làm", và không ai biết đọc lại hình dạng
file mà `core/backup.js` dựng ra. Cho tới khi story này xong, phanh an toàn UJ-3 mới có một
nửa — Nam xuất được file nhưng sau khi IT cài lại máy thì file đó là một tệp JSON không có
đường quay về.

**Approach:** Thêm vào `core/backup.js` hai hàm thuần — `docFileSaoLuu(text)` kiểm **toàn bộ**
file rồi trả danh sách bản ghi đã dựng lại đủ năm trường, và `gopTheoId(dangCo, tuFile)` trả
`{ ketQua, added, skipped }`. Thêm action `napSaoLuu()` vào `core/state.js` nối
`fileIO.readChosenFile` → pha 1 (kiểm) → pha 2 (`noteStore.replaceAll` — một transaction duy
nhất đã có sẵn ở cổng) → dải băng `NAP_FILE_XONG` mang hai con số, rồi cập nhật `lastBackupAt`
khi `exportedAt` trong file mới hơn. Viết adapter `fileIO.readChosenFile` bằng `<input
type="file">`, và gắn handler `#chan-nap` trong `view/chan-trang.js`.

## Boundaries & Constraints

**Always:**
- **Hai pha tách bạch.** Pha 1 kiểm xong **toàn bộ** file mới được chạm kho; một ghi chú sai ở
  cuối file phải chặn cả file. Pha 2 là đúng một lời gọi cổng ghi.
- **Gộp, không bao giờ mất.** Đối chiếu theo `id`: đã có → bỏ qua (giữ nguyên bản đang có),
  chưa có → thêm. Không xóa, không ghi đè. `createdAt` gốc giữ nguyên tuyệt đối.
- **`localDate` và `textFolded` tính lại** từ `createdAt` và `text` qua `core/time.js` và
  `core/fold.js`, không bao giờ đọc từ file (AD-11, AD-13).
- **Nguồn để gộp là `ports.noteStore.readAll()`**, không phải `noiBo.notes`: pha 2 dùng
  `replaceAll`, tức xóa sạch rồi ghi lại — gộp trên một bản RAM cũ hơn kho sẽ xóa mất ghi chú
  mà tab khác vừa thêm, đúng cái "không bao giờ mất" mà epic cấm.
- **Điều kiện từ chối ở pha 1** (tất cả → dải băng, không ghi một byte): JSON hỏng · thiếu
  trường bắt buộc · `id` trùng nhau trong file · `createdAt` sai dạng ISO có offset · `text`
  vượt `MAX_NOTE_CHARS` → `BAD_FILE`/`TOO_LONG`; `schemaVersion` khác `SCHEMA_VERSION` →
  `BAD_VERSION`.
- **Nạp thành công là ngoại lệ DUY NHẤT** của quy tắc im-lặng-khi-thành-công: dải băng
  `Đã nạp N ghi chú, bỏ qua M ghi chú đã có.` với hai con số thật viết bằng **chữ số**
  (nguyên văn `EXPERIENCE.md:113`), và hai số đó đến từ `gopTheoId`, không do view tự đếm.
- **`lastBackupAt` cập nhật bằng `exportedAt` của file, CHỈ KHI nó mới hơn** giá trị đang có,
  rồi phát `session-changed`. So sánh bằng `msBetweenIso` chứ không so chuỗi.
- Số literal chỉ sống ở `core/limits.js` (`0` và `1` miễn trừ ở mọi nơi).

**Never:**
- Không thêm mã lỗi mới — `core/errors.js` là tập ĐÓNG và đã có đủ ba mã cần dùng.
- Không thêm hàng mới vào `BANG_UU_TIEN` — cả bảy hàng đã có; story này chỉ **phát**.
- Không xóa `dieuKien` đang bật sau khi nạp (khác `chotGhiChu`): `EXPERIENCE.md:251` tả đúng
  cảnh lưới vẫn rỗng sau khi nạp và Nam tự gõ ngày — đó là hành vi đã chốt.
- Không đụng bản nháp (`drafts`), `core/draft.js`, dòng nhắc 4.4, hay đường xuất của 4.2.
- Không thêm tombstone hay bất kỳ cơ chế nào chặn ghi chú đã xóa sống lại.
- Không handler nội tuyến trong `index.html`; không sửa `.chan-*` trong `app/style.css`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Nạp bình thường | Kho có 2 ghi chú, file có 3 (1 trùng `id`) | Kho còn 4 bản ghi; dải băng `Đã nạp 2 ghi chú, bỏ qua 1 ghi chú đã có.` | N/A |
| Giữ nguyên bản đang có | File có cùng `id` nhưng `text` khác | Bản trong kho **không đổi một chữ** | N/A |
| Tính lại trường dẫn xuất | File chỉ có 3 trường | Bản ghi vào kho đủ 5 trường, `localDate`/`textFolded` tính lại | N/A |
| Nam bấm Huỷ ở hộp chọn file | `readChosenFile()` → `null` | **Im lặng tuyệt đối**, không dải băng, không đổi state | N/A |
| `schemaVersion: 2` | File hợp lệ mọi mặt khác | Từ chối cả file, kho không đổi | `banner: BAD_VERSION` |
| JSON hỏng / thiếu `notes` / `id` trùng / `createdAt` rác | Bất kỳ một ghi chú nào sai | Từ chối cả file, kho không đổi | `banner: BAD_FILE` |
| Một ghi chú vượt `MAX_NOTE_CHARS` | Ghi chú thứ 400/468 vượt trần | Từ chối cả file, kho không đổi | `banner: TOO_LONG` |
| File 0 ghi chú | `notes: []`, hợp lệ | `Đã nạp 0 ghi chú, bỏ qua 0 ghi chú đã có.`; kho không đổi | N/A |
| `replaceAll` hỏng giữa chừng | Transaction abort / `QuotaExceededError` | Kho cuộn ngược, không nửa file; state không đổi | `banner: QUOTA` hoặc `DB` qua `ghiTruocDatSau` |
| `readAll()` hỏng | Cổng từ chối | Không ghi gì | `banner: DB` |
| `exportedAt` trong file cũ hơn mốc đang có | Nạp thành công | `lastBackupAt` **không đổi**, không phát tin | N/A |
| Ghi `lastBackupAt` hỏng | `localStorage` bị chặn | Dữ liệu đã vào kho rồi → giữ dải băng thành công | Nuốt lỗi, không phát tin, không đổi dải băng |
| Nạp hai lần liên tiếp cùng file | Lần 2 mọi `id` đều đã có | Dải băng đổi sang `Đã nạp 0 ghi chú, bỏ qua N ghi chú đã có.` — vẽ lại thật | N/A |
| `text` rỗng trong file | `{ id, createdAt, text: '' }` hợp lệ mọi mặt khác | Nạp bình thường như mọi ghi chú khác | N/A |

**Quyết định đã chốt (không hỏi lại):**
1. **Không có trần kích thước file nạp.** Pha 1 có đúng sáu điều kiện từ chối mà epic liệt kê,
   không thêm điều kiện thứ bảy về kích thước và **không thêm hằng nào vào `core/limits.js`**.
   Hệ quả đã biết và được chấp nhận: chọn nhầm một file khổng lồ thì tab treo cho tới khi tải
   lại trang. Một ngưỡng epic không yêu cầu sẽ từ chối một bản sao lưu thật rất lớn với câu
   "file hỏng" — một lời nói dối tệ hơn cái nó chặn.
2. **`text` rỗng hoặc chỉ khoảng trắng là HỢP LỆ**, nạp như mọi ghi chú khác. Trường có mặt
   và đúng kiểu thì không phải "thiếu trường bắt buộc". File do chính app xuất không bao giờ
   chứa ghi chú rỗng (`chotGhiChu` chặn từ cửa đầu), nên ca này chỉ đến từ file sửa tay — và
   từ chối cả 467 ghi chú còn lại vì một dòng rỗng là cái giá sai. Epic 5.2 sẽ tự dọn.

</frozen-after-approval>

## Code Map

- `app/core/backup.js:19,67-79` — `SCHEMA_VERSION`, `dungFileSaoLuu`. Chỗ DUY NHẤT biết hợp
  đồng file; hai hàm đọc/gộp mới thuộc về đây. Chỉ import `core/`, không chạm global.
- `app/core/time.js` — `localDate(note)` và `localStamp(note)` **ném `TypeError`** với
  `createdAt` sai dạng ISO-có-offset (`:38,49`) → đó chính là cửa kiểm định dạng, đừng viết
  regex thứ hai. `msBetweenIso(a, b)` (`:184`) cho phép so "mới hơn". `nowIso()` (`:109`).
- `app/core/fold.js:60` — `fold(text)` để tính lại `textFolded`.
- `app/core/limits.js:10` — `MAX_NOTE_CHARS = 20000`; chú thích đã nói cửa thứ ba là file nạp.
  Chỗ DUY NHẤT được giữ số literal.
- `app/core/errors.js:12-19,34-45` — `MA_LOI` đóng, đã có `BAD_FILE`, `BAD_VERSION`,
  `TOO_LONG`; `loiUngDung(code)` (`:62`) dựng `Error` có `.code`.
- `app/core/banner.js:37-43,57-68,83-87,153-157` — `LOAI_BANG.NAP_FILE_XONG` là hàng 6,
  `dongDuoc: true`; `MICROCOPY_BANG[NAP_FILE_XONG]` đang là `null` với chú thích "Epic 4 gắn
  phần tham số khi nó dựng người phát" — story này gắn. `microcopyBanner(loai)` cần nhận thêm
  tham số; `thayDuoc` (`:129`) giữ nguyên.
- `app/core/state.js` — `noiBo`/`stateRong()` (`:179-211`), `datLai` (`:349-360`, đã gác ưu
  tiên bằng `thayDuoc`), `ghiTruocDatSau` (`:467-476`, bắt lỗi ghi → `maBanner`),
  `banGhiMoi` (`:144-153`, khuôn năm trường), `sapGiamDan` (`:132-135`),
  `phatPhienDoi()` (`:561-574`), `KHOA_LAST_BACKUP` (`:90`), `xuatSaoLuu()` (`:654-684`) là
  **khuôn gần nhất** cho action mới, `dangChot` (`:327`) là khuôn cờ chống bấm hai lần, danh
  sách action đóng băng ở `:978-995`.
- `app/ports/note-store.js:49-57,132-140` — `replaceAll(notes)` **đã có**, đã trong
  `NOTE_STORE_METHODS`, JSDoc ghi thẳng "phép gộp file sao lưu cần". Không thêm phương thức
  cổng nào. `readAll()` (`:26-31`) trả không theo thứ tự.
- `app/adapters/indexeddb.js:226-271,356-368` — `trongGiaoDich` (thân hàm phải phát mọi request
  **đồng bộ**), `replaceAll` = `clear()` + vòng `put` trong một txn; `maCuaLoi` (`:49-51`) ánh
  xạ `QuotaExceededError` → `QUOTA`. `banGhiChuan` (`:53-64`) tự tính lại trường dẫn xuất.
  **Không sửa tệp này.**
- `app/ports/file-io.js:28-34` — `readChosenFile() → Promise<{name, text}|null>`, `null` là
  Nam huỷ chọn, KHÔNG phải lỗi. Đã trong `FILE_IO_METHODS`.
- `app/adapters/file-io.js:31-64` — khuôn `exportFile` (mọi việc trong executor của
  `new Promise` để throw đồng bộ thành reject); `readChosenFile` đang ném "chưa làm — Story
  4.3" → thay bằng bản thật. Adapter **cố ý không có test tự động**; không chạm global lúc
  import (`test/trang-tinh.test.js:82` nạp `main.js` ở Node).
- `app/ports/session-store.js:37-52` — `read`/`write` **đồng bộ và NÉM**; khóa `lastBackupAt`.
- `app/view/chan-trang.js:27-52` — `noiChanTrang(store, doc)`; `#chan-xuat` đã có handler,
  `#chan-nap` chưa gắn gì. Chân trang CỐ Ý đứng ngoài `veTatCa()` — story này cần vẽ lại sau
  khi nạp, xem Design Notes.
- `app/view/banner.js:87-129` — memo `daVe` so **chỉ** `state.banner`; hai lần nạp liên tiếp
  cùng ra `NAP_FILE_XONG` sẽ không vẽ lại nếu memo không biết hai con số.
- `app/main.js:43-55` — `congTam()` và composition root; `veTatCa()` gom mọi `ve`.
- `test/core-state-xuat.test.js:16-87` — khuôn `portsDay()`/`dungSan()` cho action dùng cổng.
- `test/core-state.test.js:330-400` — `khoGia()`: `Map` theo `id`, `nhatKy`, `tuChoi` để ép một
  phương thức từ chối. `replaceAll` của `khoGia` hiện **ghi log mà không sửa `Map`** — phải
  làm nó ghi thật thì mới test được phép gộp.
- `test/chan-trang-hai-link.test.js:196-201` — khẳng định `readChosenFile` ném `/chưa làm —
  Story 4\.3/` và mệnh đề "không ai cầm tới `#chan-nap`" → **cả hai phải RENEGOTIATE có ghi
  chép** ở story này, đúng như chú thích của chúng đã báo trước.
- `test/nguong-tap-trung.test.js` (số literal ngoài `limits.js`), `test/state-tap-trung.test.js`
  (chỉ `state.js` được ghi state; `app/ports/` cấm nhắc `IndexedDB`/`localStorage`; tên định
  danh cấm `dangLuu|daLuu|dangGhi|inFlight|…`), `test/trang-tinh.test.js` (main.js nạp được ở
  Node, không tài nguyên ngoài) — ba hàng rào phải còn xanh.

## Tasks & Acceptance

**Execution:**
- [x] `app/core/backup.js` — thêm `docFileSaoLuu(text)`: `JSON.parse`, kiểm `schemaVersion`
  (sai → ném `loiUngDung(BAD_VERSION)`), kiểm `notes` là mảng, duyệt **hết** rồi mới trả; mỗi
  phần tử kiểm đủ `id`/`createdAt`/`text` đúng kiểu, `id` chưa trùng trong file, `createdAt`
  qua `localDate` (bắt `TypeError` → `BAD_FILE`), `text.length > MAX_NOTE_CHARS` → ném
  `loiUngDung(TOO_LONG)`; trả mảng bản ghi đủ **năm** trường. Thêm `gopTheoId(dangCo, tuFile)`
  trả `{ ketQua, added, skipped }` — bản đang có luôn thắng.
- [x] `test/core-backup.test.js` — phủ toàn bộ hàng "pha 1" và "gộp" của I/O Matrix ở tầng lõi,
  gồm: mỗi điều kiện từ chối một ca với đúng `.code`, ca sai ở phần tử CUỐI vẫn từ chối cả
  file, trường dẫn xuất tính lại đúng (một ca dấu tiếng Việt, một ca offset âm), `id` đã có thì
  giữ nguyên bản cũ, và ca vòng tròn `dungFileSaoLuu` → `docFileSaoLuu` trả lại đúng dữ liệu.
- [x] `app/core/banner.js` — cho `microcopyBanner(loai, so)` nhận tham số tuỳ chọn và cho hàng
  6 dựng nguyên văn `Đã nạp ${added} ghi chú, bỏ qua ${skipped} ghi chú đã có.`; giữ `null` khi
  thiếu tham số. Không thêm hàng, không đổi `thayDuoc`/`dongDuoc`.
- [x] `test/banner.test.js` — ca cho hàng 6: có tham số → nguyên văn từng ký tự; thiếu tham số
  → `null`; các hàng khác không đổi hành vi.
- [x] `app/core/state.js` — thêm `bannerSo` vào `stateRong()` (mặc định `null`) và cho mọi
  đường đặt `banner` khác nhau xoá nó; thêm action `napSaoLuu()`: cờ chống bấm-hai-lần kiểu
  `dangChot`; `readChosenFile()` → `null` thì thoát im lặng; pha 1 qua `docFileSaoLuu` (lỗi có
  `.code` → `datLai({ banner: <code> })`, **không** chạm kho); `readAll()` → `gopTheoId` →
  `ghiTruocDatSau(() => ports.noteStore.replaceAll(ketQua), …)` đặt `notes: sapGiamDan(ketQua)`
  + `banner: NAP_FILE_XONG` + `bannerSo`; rồi `lastBackupAt` (chỉ khi mới hơn, `try/catch`
  nuốt) + `phatPhienDoi()`. Không bao giờ bị từ chối.
- [x] `test/core-state-nap.test.js` (mới) — phủ các hàng còn lại của I/O Matrix ở tầng action:
  huỷ chọn file im lặng; mỗi loại file sai ra đúng dải băng và `replaceAll` **không được gọi
  lần nào**; gộp đúng và `notes` trong state khớp kho; `replaceAll` từ chối `QUOTA`/`DB` ra
  đúng dải băng và `notes` không đổi; `readAll` hỏng thì không ghi; `lastBackupAt` chỉ ghi khi
  `exportedAt` mới hơn và phát tin đúng một lần; ghi mốc hỏng vẫn giữ dải băng thành công;
  `dieuKien` đang bật không bị xoá.
- [x] `test/core-state.test.js` — làm `khoGia().replaceAll` ghi thật vào `Map` (thay sạch) để
  phép gộp kiểm được đầu-cuối; giữ nguyên `nhatKy`/`tuChoi`.
- [x] `app/adapters/file-io.js` — thay `readChosenFile` bằng bản thật: `<input type="file"
  accept="application/json,.json">` ngoài luồng, `click()`, đọc bằng `file.text()`, trả
  `{ name, text }`; không chọn gì → `null`; dọn input ở `finally`. Không chạm `document` lúc
  import hay lúc gọi `taoFileIo()`.
- [x] `app/view/chan-trang.js` — gắn `click` cho `#chan-nap` gọi `store.napSaoLuu()` rồi vẽ
  lại dải băng (xem Design Notes); giữ `#chan-xuat` nguyên trạng.
- [x] `app/view/banner.js` — memo `daVe` phải tính cả `state.bannerSo`, nếu không hai lần nạp
  liên tiếp cùng ra `NAP_FILE_XONG` sẽ đứng im với con số cũ; truyền `bannerSo` vào
  `microcopyBanner`.
- [x] `app/main.js` — nối `napSaoLuu` vào đường vẽ lại của chân trang; thêm ca quét nguồn
  `main.js` theo khuôn `test/banner.test.js:462` nếu wiring mới không có test nào phủ.
- [x] `test/chan-trang-hai-link.test.js`, `test/bo-cuc-bon-tang.test.js` — RENEGOTIATE hai ca
  "`#chan-nap` trơ" và "`readChosenFile` ném chưa-làm" thành khẳng định mới, ghi lý do ngay
  trong chú thích ca; giữ nguyên ba điểm dừng bàn phím và thứ tự tab.

**Acceptance Criteria:**
- Given file do chính app xuất ở máy cũ, when Nam nạp nó trên một máy trắng, then mọi ghi chú
  hiện lại với **đúng `createdAt` gốc**, và lọc theo ngày cũ tìm ra chúng bằng chữ không dấu.
- Given pha 1 từ chối, when nó từ chối, then `ports.noteStore.replaceAll` **không được gọi một
  lần nào** và `state.notes` giữ nguyên tham chiếu cũ.
- Given `app/` sau story này, when chạy `test/nguong-tap-trung.test.js` và
  `test/state-tap-trung.test.js`, then không số literal mới nào sống ngoài `limits.js` và
  không tên định danh nào phạm AD-16.
- Given `app/main.js`, when chạy `test/trang-tinh.test.js`, then nó vẫn nạp được ở Node.

## Implementation Notes

**Một hàm thuần thứ ba ở `core/backup.js`: `mocXuatSaoLuu(text)`.** Spec chốt `docFileSaoLuu`
trả về một MẢNG bản ghi, nhưng `state.js` cũng cần `exportedAt` của file để cập nhật
`lastBackupAt`. Ba lựa chọn đã cân: (a) đổi giá trị trả về thành `{ notes, exportedAt }` — trái
chữ của spec ở hai chỗ; (b) gắn `exportedAt` làm thuộc tính của mảng — mất trong im lặng ở lần
`.map` đầu tiên; (c) một hàm thuần thứ hai đọc đúng một trường. Chọn (c): chữ ký của
`docFileSaoLuu` không đổi một ký tự, `core/backup.js` vẫn là chỗ DUY NHẤT biết hợp đồng file, và
`exportedAt` — thứ không phải một ghi chú — không đi nhờ đường của chúng. Giá phải trả là một lần
`JSON.parse` thứ hai, tức chi phí gấp đôi trên một file khổng lồ; quyết định đã chốt #1 đã nhận
trước hệ quả đó ("tab treo cho tới khi tải lại trang") nên đây không phải một hành vi mới.

**Dải băng thành công đặt ở một `datLai` THỨ HAI, không lồng vào `ghiTruocDatSau`.** Helper
chung trộn `banner: null` vào nhánh thành công (AD-8), và hàng 6 có ưu tiên THẤP hơn `QUOTA`/
`DB`. Nhét hàng 6 thẳng vào `dungNhanh()` thì phép gác ưu tiên của `datLai` từ chối nó và một
`QUOTA` đang hiện sẽ ở lại VĨNH VIỄN sau một phép ghi vừa thành công. Tắt trước rồi đặt sau giữ
đúng cả hai luật; có một ca riêng cho nó trong `test/core-state-nap.test.js`.

**Ba ca RENEGOTIATE có ghi chép** (lý do viết ngay trong chú thích của từng ca):
`chan-trang-hai-link.test.js` — (1) vế "`#chan-nap` vẫn trơ" thành "đúng một view cầm tới nó, và
đó là `chan-trang.js`"; (2) ca `readChosenFile` ném "chưa làm — Story 4.3" thành "trả một lời hứa,
và ở Node nó bị TỪ CHỐI" (adapter thật vs. stub `congTam()` vẫn phân biệt được, chỉ bằng hình
dạng thay vì bằng câu chữ); (3) ca quét `noiChanTrang(store, document)` nới cho tham số thứ ba và
bắt luôn thân của móc vẽ lại. `banner.test.js` — hàng 6 nay CÓ người phát, nên ngoại lệ được nới
đúng một ô (`core/state.js`) và đóng lại ngay bằng một ca hẹp hơn: hàng 6 có đúng MỘT người phát.

**Tập khóa state nới 8 → 9** (`bannerSo`) và **view dải băng đọc 2 giá trị state** thay vì 1 —
cả hai là cam kết được ghim bằng test, và cả hai đã cập nhật cùng lý do viết tại chỗ.

**Đã biết, không sửa:** `readChosenFile` dựa vào sự kiện `cancel` của `<input type="file">` để
biết Nam bấm Huỷ. Trình duyệt không phát `cancel` thì lời hứa không bao giờ hoàn tất và cờ chống
bấm-hai-lần không được nhả cho tới khi tải lại trang. Đó vẫn đúng hơn một `null` đoán bừa (nó sẽ
làm một phép nạp thật trông như đã bị huỷ), và `cancel` có ở mọi trình duyệt mục tiêu.

## Spec Change Log

## Review Triage Log

Ba lớp: `blind-hunter` (12), `edge-case-hunter` (10), `verification-gap` (1 + 3 phụ). Không lớp nào bị bỏ qua.

- **medium — `phatPhienDoi()` nằm NGOÀI phép nuốt lỗi của `ghiMocSaoLuuMoiHon`** (`core/state.js`,
  cả ba lớp cùng nêu). Đã tự kiểm chứng: `phatPhienDoi` (`state.js:594-607`) chỉ bọc
  `tabIdentity()`, còn `ports.channel.publish` để trần. Một `publish` ném sau khi nạp THÀNH CÔNG
  thoát khỏi `ghiMocSaoLuuMoiHon`, thoát khỏi nhánh `.then` thành công, rơi vào `.catch` cuối của
  `napSaoLuu` và đặt `banner: DB` — mã lỗi ưu tiên cao hơn hàng 6, nên nó XÓA mất dải băng thành
  công của một phép nạp đã vào kho trọn vẹn. Ngược hẳn chú thích "NUỐT mọi lỗi" viết ba dòng phía
  trên. Story 4.2 từng defer đúng chỗ lỗi này vì `datTheme` phơi y hệt, nhưng hệ quả ở đây là mới
  và nặng hơn hẳn. → **patch**.
- **medium — `readChosenFile` không bao giờ hoàn tất trên trình duyệt không phát `cancel`**
  (`adapters/file-io.js`, cả ba lớp). Thật, và chú thích của chính nó đã cân nhắc nửa vấn đề rồi
  bỏ sót nửa kia: nó chỉ cân "một `null` đoán bừa", không cân cái chốt `dangNap` ở `core/state.js`
  — cờ đó chỉ nhả trong `.then` cuối của một chuỗi đã hoàn tất, nên một lần Huỷ trên Safari cũ
  làm link `nạp lại` CHẾT HẲN tới hết phiên, trong im lặng. `sauKhiNap` cũng không bao giờ chạy.
  → **patch**.
- **low (gộp cùng gốc) — thẻ `<input>` không được dọn trên đường không hoàn tất** (cùng tệp, hai
  lớp). Cùng một khiếm khuyết sinh ra: `don()` chỉ nằm trong hai handler, không có đường dọn nào
  cho nhánh không sự kiện nào nổ. Task của spec viết "dọn input ở `finally`" và mã thì không.
  Gộp vào cùng bản vá trên. → **patch**.
- **medium — thân thật của `readChosenFile` KHÔNG có một ca nào phủ** (verification-gap, đến đã
  tự kiểm chứng). Ca duy nhất chạm tới nó (`chan-trang-hai-link.test.js`) chỉ khẳng định "trả về
  một Promise và bị từ chối ở Node" — nó từ chối vì `document` vắng mặt, TRƯỚC khi một dòng logic
  nào chạy. Đổi `xong({name, text})` thành `xong(file)` thì toàn bộ suite vẫn xanh và mọi file
  hợp lệ đều ra dải băng "file hỏng". Quy ước "adapter không có test tự động" KHÔNG tuyệt đối —
  `test/adapter-session-store.test.js` đã có sẵn một khuôn tài liệu giả. → **patch**.
- **medium — ca `bannerSo` KHÔNG sống sót qua một lần nạp hỏng" không chạy đường nó đặt tên**
  (`core-state-nap.test.js`, blind-hunter). Thật, và chú thích của chính ca đã thú nhận: nó thay
  bằng `datBanNhap` vượt trần vì "cổng đã cố định". Bất biến được đặt tên (nạp xong → nạp hỏng →
  không còn hai con số cũ) chưa từng được chạy. → **patch**: cho `dungSan` đổi được nội dung file
  giữa hai lần gọi. Kèm một ca cho nhánh `publish` ném — đúng ca đáng lẽ đã bắt được lỗi đầu bảng.
- **low — nguồn gộp đọc ở `readAll` rồi ghi ở `replaceAll` là HAI lời gọi cổng**
  (edge-case-hunter). Thật: bất kỳ phép ghi nào chen vào giữa hai lời gọi đó vẫn bị `replaceAll`
  xóa, nên JSDoc "không bao giờ mất" đúng hẹp hơn nó nghe. Nhưng cửa sổ là khoảng cách giữa hai
  thao tác IndexedDB kề nhau, hộp chọn file là modal nên chính Nam không chen vào được, và đóng
  nó hẳn đòi một phương thức cổng đọc-và-ghi trong CÙNG giao dịch — tức một mặt công khai mới,
  quá khổ cho một bản vá. Epic 7 mới là chỗ đồng bộ liên tab. → **defer**.
- **low — bấm lần hai trong lúc lần đầu còn bay vẫn kéo theo một lượt `veTatCa`**
  (`view/chan-trang.js`). Thật nhưng vô hại: mọi view đều memo theo state, và state không đổi.
  Vá thì phải thêm một nhánh. → reject.
- **low — hai lần `JSON.parse` cùng một chuỗi** (`docFileSaoLuu` + `mocXuatSaoLuu`). Thật, và là
  cái giá đã ghi chép của quyết định tách `mocXuatSaoLuu` ra. Vá thì phải đổi hình dạng trả về
  của pha 1 hoặc thêm một hàm thứ ba — quá khổ cho một phép đo không ai thấy. → reject.
- **low — phép kiểm `id` trùng chạy SAU khi đã `fold` cả bản ghi**. Thật, và đúng là ngược với
  lý lẽ "kiểm trần trước khi `fold`" của chính tệp. Nhưng nó chỉ tốn một lần `fold` trên một file
  đã sai và sắp bị vứt. → reject.
- **false — `id` chỉ bị chặn khi bằng đúng `''`, `'   '` thì lọt**. Một `id` toàn khoảng trắng
  vẫn là một khóa hợp lệ và duy nhất: phép gộp chạy đúng, bản ghi tra được bằng chính nó. Không
  ai chỉ ra một kết cục xấu, "un-addressable" là sai.
- **false — `cauNapFileXong` nhận `NaN`, `Infinity`, số âm**. Chỗ gọi duy nhất là `gopTheoId`, nơi
  hai biến đếm bắt đầu từ `0` và chỉ `+= 1`. Không ai chỉ ra đường đưa giá trị khác vào.
- **false — `gopTheoId` không chặn `id` trùng trong tập ĐANG CÓ**. Kho `notes` có `keyPath: 'id'`
  (`adapters/indexeddb.js:145-155`) — trùng `id` không tồn tại được ở đó.
- **false — `sapGiamDan` ném sau khi `replaceAll` đã chốt, vì một `createdAt` rác trong kho**.
  Mọi bản ghi vào kho đi qua `banGhiChuan` (`indexeddb.js:53-64`), và tập từ file đã qua pha 1.
  Đây là mã kêu to với một cảnh chưa ai chỉ ra đường tới.
- **false — `document.body` vắng mặt cho một mã dải băng rỗng**. `maBanner` (`state.js:126-129`)
  mặc định về `MA_LOI.DB` với mọi lỗi không mang `.code` — người dùng nhận đúng một câu thật.
- **false/low — `o.hidden = true` có thể làm trình duyệt từ chối mở hộp thoại**. Một phỏng đoán
  không kèm đường tới; thẻ vẫn nằm trong tài liệu và `click()` vẫn đi thẳng từ cử chỉ của người
  dùng. Kiểm thủ công của mục Verification là chỗ trả lời câu này.
- **low — `datLai` không chặn một chỗ gọi đưa `bannerSo` mà không đưa `banner`**. Không chỗ gọi
  nào làm thế, và vá là thêm một nhánh ném cho một bất biến chưa ai phá. → reject.
- **ghi nhận, không phải phát hiện — wiring ở `main.js` chỉ được khẳng định bằng phép quét nguồn**
  (verification-gap tự xếp nó ngoài danh sách). Đúng quy ước sẵn có của repo (`banner.test.js`),
  và ca quét ở đây còn bắt cả THÂN của móc vẽ lại chứ không chỉ tên nó.

## Design Notes

**Vì sao `replaceAll` mà không thêm phương thức cổng mới:** `note-store.js:49-57` đã khai
`replaceAll` là "một transaction, hoặc tất cả hoặc không gì", và JSDoc của nó ghi thẳng đây là
phép mà phép gộp file sao lưu cần. Gộp là hàm thuần ở `core/`, nên kho chỉ cần nhận kết quả
cuối. Đổi lại: kết quả gộp **phải** dựng từ `readAll()` chứ không từ RAM — `replaceAll` xoá
sạch trước khi ghi, nên một tập thiếu là một phép xoá thật.

**Hai con số đi cùng dải băng mà `state.banner` vẫn là chuỗi:** thêm `state.bannerSo` cạnh nó
thay vì đổi `banner` thành object — `banner.js:30-35` đã cân và từ chối phép đổi đó (14 chỗ đặt
trong `state.js` phải viết lại). `bannerSo` chỉ có nghĩa với hàng 6 và bị xoá cùng mọi lần đặt
dải băng khác, nên không có đường để nó lệch khỏi loại đang hiện.

**Vẽ lại sau khi nạp:** chân trang cố ý ngoài `veTatCa()` (`chan-trang.js`, Story 4.2) vì xuất
không đổi state. Nạp thì đổi `notes` **và** dải băng, nên `#chan-nap` phải gọi đường vẽ lại đầy
đủ của `main.js` — đây là khác biệt thật giữa hai link, hãy ghi vào chú thích để Story 4.4
không đọc nhầm thành một luật chung.

## Verification

**Commands:**
- `npm test` — expected: toàn bộ suite xanh, số ca tăng so với 587, không ca nào bị skip.
- `npm run thu-bo-cuc` — expected: 72/72, thứ tự tab chân trang không đổi.

**Manual checks (if no CLI):**
- Adapter `file-io` không có test tự động: mở `index.html` qua HTTPS, bấm `xuất sao lưu` lấy
  file, xoá một ghi chú, bấm `nạp lại` chọn lại chính file đó → ghi chú sống lại đúng giờ gốc,
  dải băng hiện đúng hai con số. Chọn Huỷ ở hộp chọn file → không có gì xảy ra. Nạp một file
  `.txt` bất kỳ → dải băng báo file hỏng, dữ liệu không đổi.
</content>
