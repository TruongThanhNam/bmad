---
title: 'Story 8.3 — Khối kiểm dung lượng chạy thật trong thu-bo-cuc'
type: 'chore'
created: '2026-09-28'
status: 'done'
route: 'dispatch'
baseline_commit: '106911f14b54f4df87f8905b70e61c106a36b1d9'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-8-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Chỗ nối 8.1/8.2 trong `app/main.js` (`xinLuuTruBen().then(...)`, `kiemRoiVe`, neo Q5) chỉ được ghim bằng regex; một `.then` treo nhầm lời hứa vẫn xanh. 17 ca CDP của retro (`kiem-e8.mjs`) nằm trong thư mục tạm, không ai chạy lại.

**Approach:** Thêm khối "Story 8.1/8.2" vào cuối `tools/thu-bo-cuc.mjs`, chạy trong một tab RIÊNG có stub `navigator.storage.estimate`/`persist` cài bằng `Page.addScriptToEvaluateOnNewDocument` (ngoại lệ có tên đã duyệt, Q1 proposal 2026-09-28). Stub điều khiển được: trả ngay, trả giá trị cho trước, hoặc treo tới khi bộ đo nhả — đủ để lái persist muộn và lần kiểm gỡ hàng 7 dưới `✕` đang giữ tiêu điểm.

## Boundaries & Constraints

**Always:** Không đổi một dòng nào trong `app/`. Stub chỉ thay `estimate`/`persist`, không IndexedDB giả, không chạm `app/adapters/` hay `test/adapter-*.test.js`. Mọi thao tác người dùng đi qua DOM/phím thật (chốt = gõ + `Ctrl+Enter`, xóa = `.mau-xoa` → `.hop-thoai-xoa`, `Enter` trên `✕`); đọc state qua `m.store.state` chỉ để đo. Tab riêng đóng trong `finally`; bộ nghe `ws` của khối gỡ khi xong. Không bump `APP_VERSION`. Một commit `test:` tiếng Việt.

**Never:** Không `npm test` mới cho `main.js`. Không sửa khối cũ của `thu-bo-cuc`. Không giữ `kiem-e8.mjs` thành tệp riêng trong repo (khối mới là bản port). Không `DON_SACH` giữa chừng khi tab chính còn mở.

**Lệch AC có chủ ý (namtt duyệt cùng spec, 2026-09-28):** AC ghi dọn "(`DON_SACH`)"; spec dọn bằng ảnh chụp thay vì xóa cả DB — xem Design Notes.

**Thứ tự ca là ràng buộc:** mỗi ca chứng minh một đổi trạng thái phải khẳng định trạng thái TRƯỚC (cờ vắng, chân trang rỗng SAU lượt vẽ đầu của kho, tiêu điểm đúng ở `✕`, lần kiểm đang treo) — nếu không nó xanh rỗng. Q5 trước Q1; sau Q1 chỉ tải lại mới gỡ `daDongCanhBao`. Hàng 7 phải được dựng lại bằng một lần chốt `VUOT` trước Q5 và trước Q1. `__soLanUoc` về 0 mỗi lần tải — chỉ so trong cùng một tài liệu.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| 8.1 từ chối | cờ đã gỡ + khẳng định vắng; stub `persist` → `false`, tải lại | `ghichu.persistDenied === '1'`, `state.persistDenied === true`, `localStorage` chỉ khóa trong bộ ba | N/A |
| 8.1 ngưỡng 3 | cờ bật, `lastBackupAt` 4 ngày trước, tải lại | `.chan-nhac` chứa `cách đây 4 ngày` | N/A |
| 8.1 được cấp lại | stub `persist` → `true`, tải lại | cờ bị xóa; SAU lượt vẽ đầu của kho `.chan-nhac` rỗng (4 ≤ 7) | N/A |
| 8.1 persist muộn | cờ vắng, stub `persist` treo, tải lại | đợi lượt vẽ đầu của kho (`document.title` phản ánh `notes` đã nạp), khẳng định `.chan-nhac` rỗng + cờ vắng; nhả `false` → dòng nhắc hiện, cờ `'1'`, KHÔNG tải lại | N/A |
| 8.2 khởi động | tải lại | `estimate` được gọi 0 lần | N/A |
| 8.2 vượt vế byte | stub `{usage: 5 MB, quota: 40 MB}`, chốt | ô soạn trống ngay; hàng 7 đúng câu, có `.dai-bang-dong`, không chữ số/`%` | N/A |
| Q3 | hàng 7 hiện; stub `estimate` treo; chốt tiếp | trong lúc lần kiểm treo (`__soLanUoc` +1) hàng 7 VẪN hiện — tức phép ghi không tắt nó; nhả `VUOT` → còn | N/A |
| Q6 | stub dưới ngưỡng (quota 60 GB), xóa mẩu của khối qua hộp thoại | `banner === null` | N/A |
| Q5 | chốt `VUOT` dựng lại hàng 7; stub treo; chốt; focus `✕` và khẳng định `activeElement.matches('.dai-bang-dong')` + `__soLanUoc` +1; nhả dưới ngưỡng | hàng 7 tắt; `activeElement` là `#o-soan`, không `<body>` | N/A |
| Q1 | chốt `VUOT` dựng lại hàng 7, `Enter` trên `✕`, rồi chốt khi vẫn vượt | đóng; tiêu điểm `#o-soan`; số lần `estimate` không đổi; không hiện lại | N/A |
| Tải lại sau đóng | tải lại, chốt, vượt | hàng 7 hiện lại | N/A |
| Estimate thật | stub nhường hàm thật, chốt | `estimate` +1; `banner` khớp `vuotNguongDungLuong` của chính số thật (ghi `usage`/`quota` vào chi tiết) — không phụ thuộc đĩa máy | N/A |
| Sạch | suốt khối | 0 lỗi console/ngoại lệ; 0 request ngoài origin (trừ `about:`/`data:`) | N/A |
| Dọn | sau khối | `notes` (tập id), `drafts` (tập `tabId`), `localStorage` (khóa + giá trị) bằng ảnh chụp chụp từ tab chính TRƯỚC khi tab riêng tới origin; tab chính tải lại, chân trang khớp trước khối | `finally`, `.catch(() => {})` |

</frozen-after-approval>

## Code Map

- `tools/thu-bo-cuc.mjs` — khối mới, chèn SAU khối "Story 7.2" (dòng ~2952), TRƯỚC `} finally {` cuối (2953). Khuôn khối `{ … try { … } finally { dọn; dongTab } }` y khối 7.1 (2739–2886): `cdp.tabMoi('about:blank')`, `Page.enable`/`Runtime.enable`/`Network.enable`, `Page.addScriptToEvaluateOnNewDocument` (khuôn 1334), `Page.navigate` tới `server.diaChi`, `cdp.doiSan`. Tab headless cần `Emulation.setFocusEmulationEnabled` (khuôn 2763) để `focus()`/phím chạy. Bộ nghe `cdp.ws.addEventListener('message', …)` lọc `m.sessionId === s`, gom `Runtime.exceptionThrown`, `consoleAPICalled` type `error`, `Network.requestWillBeSent` — gỡ bằng `removeEventListener` trong `finally`. Dùng `ghi(ten, dat, chiTiet)` của tệp; tên ca bắt đầu `Story 8.1 —`/`Story 8.2 —`. Import thêm `DOC_NOTES`, `DOC_DRAFTS` từ `./cdp.mjs`.
- Stub: cấu hình trong `window.name` (sống qua `Page.reload` cùng origin, khuôn `kiem-e8.mjs:5-15`; KHÔNG chắc sống qua điều hướng `about:blank` → localhost — nên điều hướng, đặt `window.name`, rồi `cdp.taiLai` trước ca đầu), đọc LÚC GỌI. `estimate`: đếm `window.__soLanUoc`; chế độ trả giá trị / treo (`window.__nhaUoc(v)`) / nhường hàm thật. `persist`: `false` / `true` / treo (`window.__nhaPersist(v)`). Không gì khác của `navigator.storage` bị thay. Chế độ mặc định khi `window.name` rỗng/không đọc được: `persist` treo, `estimate` treo — tab trơ, không ghi cờ, không phát tin. `__nhaUoc(v)`/`__nhaPersist(v)` nhả MỌI lời hứa đang treo rồi xóa hàng đợi. Chế độ nhường hàm thật gói kết quả thật vào `window.__uocThat` trước khi trả.
- Nguồn ca: `%TEMP%\claude\c--Users-namtt-Desktop-bmad\c8f42966-…\scratchpad\kiem-e8.mjs` — port helper `chot` (focus `#o-soan`, `Input.insertText`, `Ctrl+Enter` qua `Input.dispatchKeyEvent` modifiers 2), `doc` (banner, `.dai-bang-chu`, `.dai-bang-dong`, `activeElement`), `Enter` trên `✕` (có `text: '\r'`). Thay `nghi(n)` cố định bằng thăm dò có trần (khuôn `doiTab`, 2745) ở chỗ đợi banner/dòng nhắc.
- Xóa qua hộp thoại: nhắm đúng mẩu của khối — `.luoi > [data-mau="<id>"] .mau-xoa` (nút là con của mẩu, `view/mau-giay.js:330,341-357`), rồi `.hop-thoai-xoa`.
- Ca "Estimate thật": so với `vuotNguongDungLuong({ used: __uocThat.usage, limit: __uocThat.quota })` (import `/app/core/state.js` trong trang) — đúng số app đã thấy, không gọi `estimate` lần hai. Ba nhánh: `true` → hàng 7, `false` → `null`, `null` → `banner` như trước lần chốt (chụp trước khi chốt).
- Khẳng định phủ định (Q1 "không đổi"/"không hiện lại") neo SAU lượt vẽ của chính lần chốt — ô soạn trống và `notes.length` +1 trong state — không sau `nghi(n)`. Q6 khẳng định hàng 7 đang hiện trước khi mở hộp thoại.
- Dọn: ảnh chụp `DOC_NOTES`/`DOC_DRAFTS` (`tools/cdp.mjs:211,228`) + `localStorage` đọc từ tab chính (`tab.sessionId`). Cuối khối: đóng tab riêng TRƯỚC; rồi từ tab chính, trong MỘT giao dịch `readwrite` trần trên `DOC_NOTES` + `DOC_DRAFTS` (không `deleteDatabase`, nên không `versionchange`), xóa mọi `id`/`tabId` không có trong ảnh chụp — không phụ thuộc tab riêng còn sống; trả `localStorage` y cũ CHỈ khi ảnh đã chụp xong (`anhChup !== null`) — chưa có ảnh thì bỏ bước trả và `ghi` ca "dọn sạch" FAIL kèm lý do, không bao giờ `clear()`; `cdp.taiLai` tab chính (ghi thô vào `localStorage` không phát tin, và app không nghe sự kiện `storage` — tab chính đang giữ `lastBackupAt`/cờ bị nhiễm qua `napLaiPhien`, `core/state.js:997-1015`); rồi đo lại và `ghi` ca "dọn sạch".
- Dòng nhắc: `.chan-nhac`, câu `Lần sao lưu gần nhất cách đây N ngày.` (`core/backup.js:286`); ngưỡng `soNgay <= nguong → null`.
- Hàng 7: `Dung lượng sắp hết. Xuất sao lưu trước khi nó hết.`
- Không đổi: `app/**`, `tools/cdp.mjs`, `test/**`.
- `README.md` mục "Bố cục bốn tầng" (~302) — thêm đoạn "Từ Story 8.3…"; mục 8.1 (159)/8.2 (175) — một câu trỏ rằng phần lõi đã chạy bằng máy trong khối này, các bước tay giữ nguyên.
- `_bmad-output/implementation-artifacts/deferred-work.md:216-219` và `:230` — gạch `~~…~~` + `resolved: 2026-09-28 — Story 8.3 (khối "Story 8.1/8.2" của tools/thu-bo-cuc.mjs, ca …)`, khuôn `:176`/`:181`.
- `AGENTS.md` — qua skill `bmad-project-context`: mục "Chạy và kiểm chứng" ghi stub `estimate`/`persist` trong tab riêng của `thu-bo-cuc` là ngoại lệ có tên (không phải giấy phép trình duyệt giả), và luật "mỗi chỗ nối mới trong `main.js` phải có một ca `thu-bo-cuc`, không chỉ regex".
- `sprint-status.yaml` — `epic-8-retro-item-32-…` → `done` khi story xong (qua `sprint_plan.py`, không sửa tay).

## Tasks & Acceptance

**Execution:**
- [x] `tools/thu-bo-cuc.mjs` -- khối "Story 8.1/8.2": tab riêng, stub điều khiển được, một ca mỗi dòng I/O Matrix, ảnh chụp + dọn + ca kiểm dọn -- lái thật chỗ nối `main.js`.
- [x] `README.md` -- đoạn mô tả khối mới; trỏ từ mục 8.1/8.2.
- [x] `deferred-work.md` -- gạch `:216` và `:230` kèm `resolved:`.
- [x] `AGENTS.md` -- qua `bmad-project-context`.
- [ ] `sprint-status.yaml` -- khóa story theo trạng thái build; `epic-8-retro-item-32` → `done`.

**Acceptance Criteria:**
- Given `npm run thu-bo-cuc` trên Edge/Chrome, when chạy, then mọi ca `Story 8.1 —`/`Story 8.2 —` PASS và chỉ ca chập chờn "tải lại: mọi mẩu về thu gọn" được phép đỏ.
- Given một chỗ nối bị đổi thử (bỏ `.then(() => veGiuTieuDiem(...))` sau `xinLuuTruBen`; neo `kiemRoiVe` đổi thành `undefined` trần; `tatSauKhiGhi()` đổi thành `{ banner: null }`), when chạy lại, then đúng ca tương ứng (persist muộn / Q5 / Q3) đỏ — thử từng cái rồi hoàn tác, `git diff -- app/` rỗng sau cùng, ghi kết quả vào Implementation Notes.
- Given `npm test`, when chạy, then xanh (không đổi gì).

## Implementation Notes

- Khối "Story 8.1/8.2" ở cuối `tools/thu-bo-cuc.mjs` (sau khối 7.2): 13 ca `Story 8.1 —`/`Story 8.2 —` + ca chuẩn bị (mẩu mồi hôm nay, để `document.title` phân biệt được lượt vẽ đầu của kho) + ca "khối chạy hết không ném" (chỉ ghi khi có ngoại lệ). `npm run thu-bo-cuc` xanh 118/118 (~30 s trên Edge headless); `estimate()` thật ra `usage≈2,3 MB · quota≈10 GiB` → `false` → `banner null`.
- Đột biến thử (từng cái rồi `git checkout -- app/`; `git diff -- app/` rỗng sau cùng):
  1. `store.xinLuuTruBen();` (bỏ `.then(() => veGiuTieuDiem(...))`) → đúng một ca đỏ: "persist() resolve muộn".
  2. neo `kiemRoiVe` → `veGiuTieuDiem(document, veTatCa)` trần → đúng một ca đỏ: "Q5".
  3. `tatSauKhiGhi()` → `return { banner: null }` → "Q3" đỏ (còn lúc treo = false); hàng 7 mất nên các ca sau cũng đỏ theo (Q6…), kèm ca chập chờn đã biết "tải lại: mọi mẩu về thu gọn". Ca "dọn sạch" vẫn xanh ở cả ba lượt.
- Lệch nhỏ ở ca "Dọn" (dòng Matrix): so `drafts` theo tập tabId **có chữ** + "không tabId nào ngoài ảnh chụp", thay vì bằng đúng tập tabId. Lý do: bản nháp RỖNG bị chính app xóa ở mọi `claimDraft` (`core/draft.js` bước 4, cả bản của tab khác) — tab riêng xóa bản rỗng của tab chính ngay lần tải đầu, và lần tải lại tab chính lúc dọn cũng tự xóa nó; so bằng tuyệt đối là đỏ vì hành vi đúng của app. Bản nháp có chữ bị tab riêng nhận thì được `put` trả lại trong cùng giao dịch dọn.
- `sprint-status.yaml`: khóa story → `review` qua `sprint_plan.py generate --set`. `epic-8-retro-item-32` CHƯA → `done`: `sprint_plan.py` không có lệnh đặt trạng thái `action_items` (`--set` chỉ nhận khóa `development_status`), mà spec cấm sửa tay — làm khi story chốt `done`.
- AGENTS.md: thêm hai dòng vào "Chạy và kiểm chứng" (luật chỗ nối mới → ca `thu-bo-cuc`; stub trong tab riêng là ngoại lệ có tên). Dòng provenance giữ nguyên (lượt này không re-verify toàn block).

## Spec Change Log

- 2026-09-28 — Lệch có chủ ý ở dòng Matrix "Dọn", namtt duyệt (vùng đóng băng giữ nguyên chữ): `drafts` so theo tập tabId của bản nháp CÓ CHỮ + "không tabId nào ngoài ảnh chụp", thay vì bằng đúng tập tabId. Lý do: app tự xóa bản nháp rỗng ở mọi `claimDraft` (AD-3 bước 4), kể cả bản của tab chính khi nó tải lại lúc dọn — lần chạy thật cho `drafts [1 rỗng] → []`, đúng hành vi app.

## Review Triage Log

| # | Nguồn | Phát hiện | Verdict | Route | Bằng chứng |
|---|-------|-----------|---------|-------|------------|
| 1 | verification-gap + blind | Chỗ nối `napRoiVe` (nạp, `main.js:435-439`) và chuỗi tự lưu `mocSua.go` (`:356-358`) không có ca chạy thật; đổi `napRoiVe`→`latRoiVe` vẫn xanh | medium | defer | Lớp VG đã kiểm sẵn: chỉ regex ghim; AC/Matrix 8.3 chỉ đòi chốt + xóa; khoảng trống có từ 8.2 |
| 2 | blind | Nhánh `undefined` của neo `kiemRoiVe` (tiêu điểm trên mẩu khi lần kiểm vẽ lại) không có ca; đổi neo thành luôn `null` vẫn xanh | medium | defer | `main.js:419`; khối chỉ đo nhánh `null` (Q5); khoảng trống có từ 8.2, ngoài Matrix |
| 3 | blind | README mục 8.1 nói "ngưỡng 3/7 ngày" chạy bằng máy nhưng chỉ đo mốc 4 ngày | low | patch | Mọi ca dùng `4 * 86400000`; đổi hằng ngưỡng vẫn xanh; sửa chữ là sửa thẳng |
| 4 | blind + VG | README "mọi thao tác đi qua phím và DOM thật" trong khi Q6 dùng `.click()`, Q5/Q1 dùng `.focus()` | false | reject | Spec Always định nghĩa "DOM/phím thật" gồm `.mau-xoa` → `.hop-thoai-xoa`; Matrix Q5 ghi "focus `✕`"; `.click()` trên phần tử thật là DOM thật |
| 5 | blind + edge | `chot()` không xóa `#o-soan` trước khi gõ; tab riêng có thể nhận bản nháp bỏ rơi có chữ | low | reject | Hồ sơ tạm mới mỗi lượt (`cdp.mjs:87`), ảnh chụp lượt thật có 0 bản nháp có chữ; nếu xảy ra thì đỏ ầm, không xanh rỗng; sửa là thêm gác |
| 6 | blind | Stub nhả mọi lời hứa cùng lúc nên không lái được gác kết quả cũ (Q4) | low | reject | Ngoài Intent/Matrix; sửa là thêm tham số cho stub |
| 7 | blind | Q6 không khẳng định hộp thoại đóng / tiêu điểm | low | reject | Matrix Q6 chỉ đòi `banner === null`; sửa là thêm khẳng định, không hại người dùng |
| 8 | blind + edge | `truocNha` đọc `.chan-nhac` không `?.` | false | reject | `.chan-nhac` là phần tĩnh của chân trang, `doiVeDau` đã qua; nếu vắng thì ném ầm vào ca "chạy hết không ném" |
| 9 | blind | Thiếu `navigator.storage` thì stub im lặng | false | reject | Chỉ chạy trên Chrome/Edge qua localhost (secure context) — `navigator.storage` luôn có |
| 10 | blind | Chú thích lần tải lại đầu nêu sai lý do | false | reject | Chú thích giải thích vì sao không đặt `window.name` TRƯỚC khi điều hướng — đúng Code Map |
| 11 | blind | Ca "estimate thật" yếu hơn README nói | false | reject | README ghi đúng "khớp `vuotNguongDungLuong` của chính số thật" — đúng thiết kế Code Map |
| 12 | blind | Ngoại lệ stub ghi ở "Chạy và kiểm chứng", không cạnh hai ngoại lệ adapter ở "Nơi để tìm" | low | defer | Sửa chạm AGENTS.md (tệp ngữ cảnh agent) |
| 13 | blind | Luật "mỗi chỗ nối mới phải có ca thu-bo-cuc" không nói ai chạy, khi nào | low | defer | Sửa chạm AGENTS.md |
| 14 | edge | Chạy vắt qua nửa đêm làm `doiVeDau` đỏ | low | reject | Khối chạy ~30 s; đỏ ầm; sửa là thêm nhánh |
| 15 | edge | `persist()` thật của tab chính lúc tải lại có thể đổi cờ sau khi đọc `lsSau` | low | reject | Rủi ro đã ghi ở Design Notes; lượt thật khớp; sửa là thêm thăm dò |
| 16 | edge | `catch` chung giấu ca nào chưa chạy | low | reject | Hỏng thì đỏ ầm kèm stack; sửa thêm độ phức tạp |
| 17 | edge | `.catch(() => {})` ở bước dọn nuốt lỗi, dữ liệu thử kẹt trong hồ sơ thật | false | reject | Hồ sơ là thư mục tạm (`cdp.mjs:87`), không phải hồ sơ thật; ca "dọn sạch" vẫn đỏ khi lệch; Matrix ghi đúng `.catch(() => {})` |
| 18 | VG | AC trong `epics.md` ghi `DON_SACH`, mã dùng ảnh chụp | false | reject | Lệch AC có chủ ý đã được namtt duyệt, ghi trong Boundaries |
| 19 | VG | Bước trả chỉ `put` bản nháp có chữ khi khóa vắng; bản bị ghi đè cùng `tabId` không được trả | false | reject | Tab riêng có `tabId` riêng; bản của tab chính bị khóa sống giữ nên không bị nhận; bản bỏ rơi bị nhận thì khóa cũ bị xóa → vắng → được `put` lại |

## Design Notes

Dọn bằng ảnh chụp chứ không `DON_SACH`: `deleteDatabase` khi tab chính còn cầm kết nối sẽ ép nó đóng qua `onversionchange` (`adapters/indexeddb.js:180`) và làm tab chính mất kho giữa lượt — đúng thứ "các khối sau không đổi kết quả" cấm. Ảnh chụp lấy từ tab chính trước khi tab riêng chạm origin, để lần ghi cờ đầu tiên của stub không lọt vào "trạng thái gốc".

Q5 cần lần kiểm chạy trong lúc tiêu điểm đã ở `✕`, mà mọi đường kích kiểm đều bắt đầu ở chỗ khác — nên `estimate` treo qua lượt chốt, bộ đo đưa tiêu điểm lên `✕`, rồi mới nhả.

Chế độ mặc định của stub là treo, không phải nhường hàm thật: lần tải đầu của tab riêng chạy trước khi `window.name` mang cấu hình, và một `persist()` thật ở đó sẽ ghi cờ rồi phát `session-changed` sang tab chính trước ca đầu. Dọn đi theo ảnh chụp chứ không theo store của tab riêng, vì ca hỏng giữa chừng chính là lúc bước dọn phải chạy được. Rủi ro thấp đã biết: tab chính tải lại lúc cuối gọi `persist()` thật lần nữa — nếu ca "dọn sạch" lệch ở `ghichu.persistDenied`, nhìn đó trước.

## Verification

**Commands:**
- `npm run thu-bo-cuc` -- expected: khối mới toàn PASS; thoát 0 hoặc chỉ đỏ ca chập chờn đã biết.
- `npm test` -- expected: toàn bộ xanh.
- `git diff --stat -- app/` -- expected: rỗng.
</content>
</invoke>
