---
title: 'Story 4.4 — Dòng nhắc thụ động về lần sao lưu gần nhất'
type: 'feature'
created: '2026-09-16'
status: 'done'
route: 'dispatch'
baseline_commit: '0ac7834099938ccf7d8f2dae324637f08bd3d733'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `ghichu.lastBackupAt` đã được ghi ở **cả hai** đường (4.2 lúc xuất, 4.3 lúc nạp) nhưng
**không ai đọc nó**: `stateRong()` không có trường này và `<span class="chan-nhac">` ở chân trang
đứng rỗng từ Story 4.1. Sao lưu là thủ công, nên phanh an toàn UJ-3 chỉ hoạt động nếu Nam nhớ kéo
nó — và hiện không có gì nhắc anh ta.

**Approach:** Đưa `lastBackupAt` vào state như một trường tầng B′ (cùng khuôn `theme`): đọc đồng bộ
trong `khoiDong`, cập nhật ở cuối đường xuất và đường nạp. Thêm vào `core/backup.js` một hàm thuần
dựng câu nhắc từ mốc đó, cho `noiChanTrang().ve()` đổ chữ vào `.chan-nhac`, và treo chân trang vào
`veTatCa()` của `main.js`.

## Boundaries & Constraints

**Always:**
- **Số ngày tính bằng `daysBetween()` của `core/time.js`** (AD-4) — không tự trừ mili-giây, không
  `slice` chuỗi ISO ở đâu ngoài `core/time.js`.
- **Ngưỡng chỉ ở `core/limits.js`**: `BACKUP_NUDGE_DAYS` đã có; không thêm hằng, không số literal.
- **Dòng nhắc KHÔNG đi qua dải băng** (AD-17): không đụng `state.banner`, không thêm hàng vào
  `BANG_UU_TIEN`, không thêm mã lỗi.
- **Chỉ hiện khi đã quá ngưỡng** (`> BACKUP_NUDGE_DAYS`). Không hiện thì dọn bằng `textContent = ''`
  — một node chỉ chứa khoảng trắng cũng phá `.chan-nhac:empty` (hợp đồng ở `app/style.css:602-622`).
- **Câu chữ sống ở `core/`, không ở view**: `chan-trang.js` chỉ đổ một chuỗi đã dựng sẵn vào DOM.
- **Mốc đọc một lần lúc khởi động, sau đó chỉ đổi qua state.** Mọi đường ghi `lastBackupAt` xuống
  kho (`xuatSaoLuu`, `ghiMocSaoLuuMoiHon`) phải đặt cùng giá trị đó vào state trong cùng nhánh thành
  công — để dòng nhắc biến mất ngay sau khi Nam vừa xuất, không cần tải lại trang.

**Never:**
- Không `aria-live`, `role`, `tabindex`, nút tắt, nền, viền, hộp thoại — `index.html:155-164` đã ghi
  lý do từng thứ.
- Không đụng `BACKUP_NUDGE_DAYS_PERSIST_DENIED`, không đọc khóa `persistDenied` (quyết định #3).
- Không sửa `index.html` (chỗ đứng đã có sẵn), không sửa các lớp `.chan-*` trong `app/style.css`.
- Không thêm bộ nghe `session-changed` / `storage` — chiều NHẬN liên tab là Epic 7.
- Không thêm action mới vào danh sách đóng băng của `state.js`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Quá ngưỡng | mốc cách đây 8 ngày | `.chan-nhac` mang `Lần sao lưu gần nhất cách đây 8 ngày.` | N/A |
| Đúng bằng ngưỡng | cách đây đúng 7 ngày | **Không hiện** — "quá" là lớn hơn hẳn | N/A |
| Chưa quá ngưỡng | cách đây 2 ngày | `textContent === ''` | N/A |
| Chưa từng sao lưu | `read('lastBackupAt')` → `null` | Rỗng tuyệt đối, ở mọi lượt vẽ | N/A |
| Kho cấu hình bị chặn | `read` NÉM lúc khởi động | State giữ `null`, không dải băng, app vẫn chạy | Nuốt lỗi |
| Mốc rác trong kho | `lastBackupAt` = `'hôm qua'` | Rỗng tuyệt đối, không ném ra ngoài | Nuốt `TypeError` |
| Mốc ở tương lai | mốc sau `nowIso()` | Số ngày âm → không hiện | N/A |
| Vừa xuất xong | đang hiện, bấm `xuất sao lưu` thành công | Dòng nhắc **biến mất ngay**, và **không** dải băng nào | N/A |
| Xuất hỏng | cổng `fileIO` từ chối | Dòng nhắc **giữ nguyên** — mốc không được ghi | N/A |
| Vừa nạp file mới hơn | `exportedAt` hôm qua | Biến mất cùng lượt vẽ của dải băng `NAP_FILE_XONG` | N/A |
| Nạp file cũ hơn mốc đang có | `exportedAt` cũ hơn | Dòng nhắc **không đổi** | N/A |
| Ghi mốc hỏng sau khi nạp | `write` NÉM | State **không** đổi mốc (state và kho không nói hai câu khác nhau) | Nuốt lỗi |
| Tài liệu không có `.chan-nhac` | test tối giản | `ve()` không ném | N/A |

**Quyết định đã chốt (không hỏi lại):**
1. **Số ngày viết bằng CHỮ SỐ** — `Lần sao lưu gần nhất cách đây 8 ngày.` Ví dụ "tám ngày" trong
   `EXPERIENCE.md:108` nhường chỗ cho sự nhất quán với mọi microcopy khác của sản phẩm, và tránh
   một bảng đọc số tiếng Việt làm mặt công khai mới của `core/`.
2. **Chưa từng sao lưu thì KHÔNG hiện gì** — không có câu "Chưa có bản sao lưu nào." Một câu thường
   trực cho tới lần xuất đầu tiên đúng là thứ A-9 gọi là rác trên màn hình; hai link chân trang đã
   thường trực sẵn. Chú thích ngược chiều ở `app/core/state.js:678` phải được sửa theo.
3. **Ngưỡng `persistDenied` để Story 8.1** — 8.1 là chỗ ghi cờ đó nên nó chốt luôn quy ước giá trị.

</frozen-after-approval>

## Code Map

- `app/core/limits.js:20` — `BACKUP_NUDGE_DAYS = 7`. Chỗ DUY NHẤT được giữ số literal; `:24`
  `BACKUP_NUDGE_DAYS_PERSIST_DENIED` **không đụng**.
- `app/core/time.js:206` `daysBetween(a, b)` nhận **`yyyy-MM-dd`**, KHÔNG phải ISO; ném `TypeError`
  với ngày không có thật. `:140` `localDate(note)` cắt 10 ký tự đầu của `note.createdAt` và ném
  `TypeError` với ISO sai dạng — cửa duy nhất đổi ISO sang `yyyy-MM-dd`, đừng viết `slice` thứ hai.
  `:109` `nowIso()` không ném.
- `app/core/backup.js` — nhà của mọi chuyện sao lưu (`dungFileSaoLuu`, `docFileSaoLuu`, `gopTheoId`,
  `mocXuatSaoLuu`); hàm dựng câu nhắc thuộc về đây. Chỉ import `core/`.
- `app/core/state.js:96` `KHOA_LAST_BACKUP`; `:185-225` `stateRong()` (8 trường — thêm trường thứ 9
  cạnh `theme`); `:564-580` `khoiDong` đặt `theme` **đồng bộ** trước lời hứa đọc kho (chỗ đọc mốc
  thuộc về đây); `:698-728` `xuatSaoLuu` ghi mốc ở `:716`, nhánh `catch` `:717-721` return sớm;
  `:746-759` `ghiMocSaoLuuMoiHon`, `write` ở `:752`; `:372-393` `datLai` (trường mới không đi qua
  khóa `banner`); `:1137` danh sách action đóng băng.
- `app/view/chan-trang.js:54-87` — `noiChanTrang(store, doc, sauKhiNap)` trả `{ ve() {} }` **rỗng**;
  `:9-10,30-31,52` là chú thích viết sẵn cho story này; `:64-71` handler `#chan-xuat` cố ý **không**
  vẽ lại (story này đổi — xem Design Notes); `tim()` `:57` null-safe.
- `app/main.js:125-134` chân trang nối nhưng giá trị trả về **bị vứt đi**; `:138-143` `veTatCa()`
  gồm đúng 4 view; `:152-153` `khoiDong(...).then(veTatCa)`.
- `index.html:165` `<span class="chan-nhac"></span>` (không `id`) và `app/style.css:617-622`
  (`--ink-2`, `--font-foot`, `:empty{display:none}`) — **không sửa cả hai**.
- `app/ports/session-store.js:34` — `read` đồng bộ, trả `null` khi chưa ghi, **NÉM** khi kho từ chối.
- `test/chan-trang-hai-link.test.js:295-341` gác chỗ đứng `.chan-nhac`; `:128,134` cấm view khác
  nhắc `chan-nhac`/nhãn chữ. Ca nào khẳng định `.chan-nhac` luôn rỗng → RENEGOTIATE có ghi chép.
- `test/core-state-xuat.test.js:16-87` khuôn `portsDay()`/`dungSan()`, `:201` "xuất hỏng thì KHÔNG
  ghi mốc"; `test/core-state-nap.test.js` khuôn đường nạp; `test/core-limits.test.js:10-11` ghim hai
  hằng ngưỡng.
- Hàng rào phải còn xanh: `nguong-tap-trung`, `state-tap-trung`, `date-tap-trung`, `trang-tinh`.

## Tasks & Acceptance

**Execution:**
- [x] `app/core/backup.js` — thêm hàm thuần `cauNhacSaoLuu(lastBackupAt, bayGio = nowIso())`: `null`
  khi không phải string; đổi hai mốc sang `yyyy-MM-dd` qua `localDate({ createdAt })`, đo bằng
  `daysBetween`, `null` khi số ngày `<= BACKUP_NUDGE_DAYS`, ngược lại trả nguyên văn
  `Lần sao lưu gần nhất cách đây ${soNgay} ngày.`; bắt `TypeError` của mốc rác → `null`.
- [x] `test/core-backup.test.js` — phủ các hàng ngưỡng của I/O Matrix ở tầng lõi: dưới/đúng/trên
  ngưỡng, `null`, mốc rác, mốc tương lai, và nguyên văn từng ký tự của câu nhắc (gồm dấu chấm).
- [x] `app/core/state.js` — thêm `lastBackupAt: null` vào `stateRong()` (tầng B′, kèm lý do tại
  chỗ); `khoiDong` đọc `ports.sessionStore.read(KHOA_LAST_BACKUP)` **đồng bộ** trong `try/catch`
  nuốt lỗi rồi `datLai`; `xuatSaoLuu` đặt `datLai({ lastBackupAt: exportedAt })` ngay sau `write`
  thành công; `ghiMocSaoLuuMoiHon` đặt cùng giá trị vừa `write` được, **chỉ** khi `write` không ném.
  Sửa chú thích `:678` cho khớp quyết định #2.
- [x] `test/core-state-xuat.test.js`, `test/core-state-nap.test.js`, `test/core-state.test.js` — ca
  cho: khởi động đọc mốc vào state; `read` ném → state `null`, không dải băng; xuất thành công đẩy
  mốc, xuất hỏng không; nạp file mới hơn đẩy mốc, file cũ hơn không; `write` ném → state không đổi.
- [x] `app/view/chan-trang.js` — `ve()` đọc `store.state.lastBackupAt`, gọi `cauNhacSaoLuu`, đổ
  `textContent` vào `.chan-nhac` (không có gì → `''`), null-safe khi thiếu phần tử; cho handler
  `#chan-xuat` chạy lượt vẽ sau khi lời hứa hoàn tất; cập nhật khối chú thích đầu tệp.
- [x] `app/main.js` — gán `const chanTrang = noiChanTrang(...)`, thêm `chanTrang.ve()` vào
  `veTatCa()`, cập nhật chú thích `:125-132`.
- [x] `test/chan-trang-hai-link.test.js` — RENEGOTIATE có ghi chép mọi ca khẳng định `.chan-nhac`
  luôn rỗng; thêm ca: quá ngưỡng thì có chữ, chưa quá thì `textContent === ''`, và `main.js` treo
  chân trang vào lượt vẽ chung. Giữ nguyên ba điểm dừng bàn phím và thứ tự tab.

**Acceptance Criteria:**
- Given một máy đã có ghi chú nhưng chưa từng sao lưu, when Nam mở app, then chân trang chỉ có hai
  link và nút theme — không một khoảng `gap` ma nào từ `.chan-nhac`.
- Given dòng nhắc đang hiện, when Nam đi bàn phím qua chân trang, then thứ tự tab vẫn là
  `xuất sao lưu` → `nạp lại` → nút theme, không có điểm dừng thứ tư.
- Given `app/` sau story này, when chạy `nguong-tap-trung`, `state-tap-trung`, `date-tap-trung`,
  then cả ba còn xanh.

## Implementation Notes

- `cauNhacSaoLuu(lastBackupAt, bayGio = nowIso())` ở `app/core/backup.js`: `null` với mọi thứ
  không phải string, đổi hai mốc qua `localDate({ createdAt })`, đo bằng `daysBetween`, `null`
  khi `<= BACKUP_NUDGE_DAYS`, bắt `TypeError` của mốc rác. Không một số literal nào mới.
- `state.lastBackupAt` là trường thứ 10, cạnh `theme`. `khoiDong` đọc ĐỒNG BỘ trong `try/catch`
  nuốt lỗi (`?? null` để "chưa ghi" luôn ra `null`); `xuatSaoLuu` và `ghiMocSaoLuuMoiHon` đặt
  cùng giá trị vừa `write` được, chỉ trong nhánh `write` không ném.
- `chan-trang.js` giữ chỗ đứng bằng CLASS (`.chan-nhac`), đổ `textContent` hoặc `''`, null-safe
  khi tài liệu thiếu phần tử. Handler `#chan-xuat` bây giờ vẽ lại CHÍNH chân trang sau lời hứa
  — không gọi `veTatCa`, nên lưới/tiêu đề/dải băng vẫn đứng im.
- `app/main.js` giữ giá trị trả về của `noiChanTrang` và thêm `chanTrang.ve()` vào `veTatCa()`
  (lượt vẽ chung giờ gồm năm view).

**RENEGOTIATE có ghi chép (3 chỗ, lý do ghi ngay tại chỗ trong test):**
1. `test/chan-trang-hai-link.test.js` vế (a) — `chan-nhac` không còn cấm ở `chan-trang.js`
   (vẫn cấm ở mọi view khác); hai link vẫn cấm tuyệt đối theo CLASS/NHÃN ở mọi view.
2. `test/core-state-xuat.test.js` — ca "không đổi một trường state nào ở CẢ HAI nhánh" tách
   làm hai: nhánh hỏng giữ nguyên bất biến cũ, nhánh thành công đổi ĐÚNG `lastBackupAt`.
3. `test/luoi.test.js` — tập lượt vẽ trong `veTatCa` nới 4 → 5 (`chanTrang`).
   (`test/core-state.test.js`: `KHOA_STATE` nới 9 → 10, cùng khuôn hai lần nới trước.)

**Xác minh của người điều phối (không phải báo cáo của agent triển khai):**
- `npx vitest run` → 29 tệp, 687 ca xanh, không ca nào bị skip. Khớp báo cáo.
- `npm run thu-bo-cuc` KHÔNG phải lúc nào cũng 72/72 như báo cáo. Đo 15 lượt trên nhánh này:
  khoảng 3 lượt đỏ, luôn luôn ở ĐÚNG một ca (`tải lại trang: MỌI mẩu về thu gọn…`) và đúng một
  vế của nó — chiều cao mẩu cuối `128 → 106`; ba vế kia (mọi mẩu thu gọn, `expandedIds` rỗng,
  không khóa nào trong `localStorage`) luôn đúng.
- **Không phải hồi quy của story này.** Đo 18 lượt trên commit nền `0ac7834`: 2 lượt đỏ ở đúng
  ca đó, cùng tỉ lệ. Chú thích tại chỗ trong `tools/thu-bo-cuc.mjs` đã mô tả chính hiện tượng
  này từ Story 3.3 và gọi đúng tên nó: phép đo trúng một khung hình chưa xong phông.
- Đã thử một bản vá cho phép chờ của harness (dừng sớm chỉ khi dãy đã yên VÀ đã khớp `thuGon`)
  và **hoàn nguyên**: sáu lượt sau khi vá cho 3 lượt đỏ, tức không khá hơn. Nguyên nhân nằm ở
  chỗ khác, và đuổi theo nó không thuộc phạm vi story này.

**Ba bản vá sau review (do lớp review tìm ra, agent triển khai sửa):**
- `test/chan-trang-hai-link.test.js` — `mocCachDay` bị XOÁ HẲN thay vì sửa số học: bốn ca của
  khối dòng nhắc nay dùng hai mốc cố định (`MOC_RAT_CU` 2020, `MOC_TUONG_LAI` 2999), nên không ca
  nào đổi màu theo ngày chạy máy. Chỗ ghim NGƯỠNG vẫn là `test/core-backup.test.js`, nơi `bayGio`
  đi vào qua tham số.
- `app/core/state.js` — `try` ở `khoiDong` thu hẹp còn đúng phép đọc cổng; `datLai` chạy sau
  khối, đúng khuôn `ghiMocSaoLuuMoiHon`.
- `app/core/state.js` — câu "dùng chung cho mọi tab" sửa thành "dùng chung qua mọi lần TẢI
  TRANG", và lỗ liên tab được gọi đúng tên ngay tại chỗ, trỏ về Epic 7.

**Xác minh lại sau vá:** `npx vitest run` → 687 ca xanh (29 tệp). `npm run thu-bo-cuc` → ba lượt
liên tiếp 72/72.

## Spec Change Log

## Review Triage Log

Ba lớp: `blind-hunter` (9), `edge-case-hunter` (6), `verification-gap` (1 + 3 phụ). Không lớp nào bị bỏ qua.

- **high — `mocCachDay` dựng mốc TƯƠNG LAI vào mùng 1–9, và `2026-13-xx` trong tháng 12**
  (`test/chan-trang-hai-link.test.js:410-420`, cả ba lớp cùng nêu). Đã tự kiểm chứng: nhánh tràn
  viết `{ thang: thang + 1, mong: truoc + 30 }` — cộng một tháng thay vì trừ. Hôm nay là ngày 16
  nên bốn ca xanh; chạy vào mùng 3 thì `mocCachDay(8)` ra `2026-10-25`, `cauNhacSaoLuu` trả `null`,
  và ba ca đỏ trong khi ca thứ tư xanh vì lý do sai. `vitest.config.js` ghim múi giờ nhưng không
  ghim ngày, và không ca nào dùng fake timer. → **patch**.
- **low — `try` ở `khoiDong` bọc cả `datLai`, rộng hơn lý do nó tự nêu** (`app/core/state.js`,
  blind-hunter). Thật: chú thích nói nó nuốt một kho cấu hình bị chặn, nhưng một cái ném từ
  `datLai` cũng rơi vào đó trong im lặng. `ghiMocSaoLuuMoiHon` ngay dưới cố ý để `datLai` NGOÀI
  `try` — hai chỗ cùng một chuyện phải đọc giống nhau. Vá là đọc vào một biến rồi `datLai` sau,
  không thêm nhánh nào. → **patch**.
- **low — chú thích `stateRong` hứa "dùng chung cho mọi tab" mạnh hơn thứ có thật**
  (`app/core/state.js`, blind-hunter). Thật: mốc đọc đúng một lần lúc khởi động và `app/` chưa có
  chiều NHẬN `session-changed` nào, nên "dùng chung" chỉ đúng qua các lần TẢI TRANG. Vá là sửa
  một câu chữ. → **patch**.
- **medium — mốc trong state lệch khỏi kho khi tab khác vừa sao lưu** (gộp ba phát hiện cùng một
  gốc: blind-hunter "cross-tab claim", edge-case "chiều NHẬN", edge-case "`ghiMocSaoLuuMoiHon`
  trả sớm"). Thật, và gốc chung là `app/` chưa nối chiều nhận liên tab — `phatPhienDoi()` gõ một
  cái chuông chưa ai nghe, đúng như `app/main.js` tự ghi. Không phải do story này sinh ra: nó có
  từ 4.2. Đóng nó lại đòi một bộ nghe `session-changed`, tức Epic 7. → **defer**.
- **low/medium — không gì tính lại dòng nhắc khi thời gian trôi** (blind-hunter, edge-case). Thật:
  ngưỡng đo bằng NGÀY còn `ve()` chỉ chạy theo đổi state, nên một tab mở qua nửa đêm giữ con số
  cũ. Vá đòi một cái hẹn ở ranh giới ngày — một cơ chế mới, quá khổ cho một bản vá, và cùng họ với
  khoảng trống liên tab trên. → **defer**.
- **false — `BACKUP_NUDGE_DAYS_PERSIST_DENIED` bị bỏ quên** (blind-hunter, edge-case). Nó không bị
  bỏ quên: quyết định #3 trong khối frozen chốt để Story 8.1 nối, vì 8.1 mới là chỗ ghi cờ đó và
  chốt quy ước giá trị của nó. Chính lớp `verification-gap` đã tự bác điều này khi truy.
- **false — `localDate({ createdAt })` là "dựng một bản ghi giả"**. Đây là cách spec đã chốt, và
  bản sửa được đề xuất (thêm `localDateFromIso` vào `core/time.js`) là một mặt công khai mới của
  lõi. Một finding mà bản vá của nó là sửa spec thì không đi tiếp.
- **false — `store.xuatSaoLuu().then(...)` giả định một thenable**. Cùng khuôn `napSaoLuu().then(
  sauKhiNap)` mà Story 4.3 đã dựng ngay trong tệp đó, và JSDoc của cả hai action đều hứa một lời
  hứa không bao giờ bị từ chối. Không ai chỉ ra một chỗ gọi thật trả `undefined`.
- **low → reject — chỉ handler `#chan-xuat` vẽ lại sau khi xuất, nên một chỗ gọi khác sẽ để lại
  dòng nhắc cũ**. `xuatSaoLuu` hiện có đúng một chỗ gọi. Vá là dời lượt vẽ hoặc thêm một bất biến
  cho một chỗ gọi chưa tồn tại.
- **low → reject — `expect(Object.keys(cho)).toEqual(['textContent'])` chứng minh yếu hơn câu chú
  thích của nó**. Thật, nhưng ca không SAI, và markup thật đã có một ca quét riêng cấm `hidden`/
  `aria-live` trên chính thẻ đó (`:313-328`).

## Design Notes

**Vì sao `lastBackupAt` vào state chứ không đọc thẳng kho trong `ve()`:** `read` là đồng bộ nên một
phép đọc trong view *chạy được* — nhưng nó dựng đường đọc kho bền thứ hai ngoài `core/state.js`,
đúng cái AD-1 cấm, và mỗi lượt vẽ chung sẽ chạm `localStorage` một lần. Trường state đi cùng khuôn
`theme`, vốn đã có cùng lý do viết sẵn ở `stateRong()`.

**Vì sao `#chan-xuat` bây giờ PHẢI vẽ lại, ngược chú thích của 4.2:** tới story này xuất sao lưu *có*
đổi một trường state, nên "im lặng tuyệt đối" không còn đồng nghĩa với "không vẽ lại". Dòng nhắc còn
nằm đó sau một lần xuất vừa thành công là một lời nói dối; lượt vẽ đó không sinh thông báo nào — nó
chỉ **gỡ** một dòng chữ đi, vẫn đúng AD-16. Ghi lý do tại chỗ.

**Vì sao ngưỡng là `>` chứ không `>=`:** epic viết "đã **quá** 7 ngày", và ví dụ chuẩn là ngày thứ
tám — tức ngày thứ tám là lần đầu tiên dòng nhắc lên tiếng.

## Verification

**Commands:**
- `npm test` — expected: toàn bộ suite xanh, số ca tăng, không ca nào bị skip.
- `npm run thu-bo-cuc` — expected: 72/72, thứ tự tab chân trang không đổi.

**Manual checks (if no CLI):**
- Mở `index.html` qua HTTPS trên hồ sơ chưa từng sao lưu → không có dòng nhắc nào. Đặt tay
  `ghichu.lastBackupAt` về mốc cách đây 8 ngày trong DevTools rồi tải lại → dòng nhắc hiện đúng
  nguyên văn, cùng dòng với hai link, màu nhạt hơn chữ thường. Bấm `xuất sao lưu` → dòng nhắc biến
  mất ngay, không có thông báo nào khác.
</content>
