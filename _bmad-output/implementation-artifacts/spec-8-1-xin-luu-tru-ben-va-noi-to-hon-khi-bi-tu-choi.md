---
title: 'Story 8.1 — Xin lưu trữ bền, và nói to hơn khi bị từ chối'
type: 'feature'
created: '2026-09-25'
status: 'done'
route: 'dispatch'
baseline_commit: 'dfa87381f4ef0729040ddee7ec0ae12e68296b41'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-8-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** App chưa bao giờ xin `navigator.storage.persist()`, nên khi máy thiếu đĩa trình duyệt có quyền dọn sạch IndexedDB mà Nam không hay. Cờ `ghichu.persistDenied` và hằng `BACKUP_NUDGE_DAYS_PERSIST_DENIED = 3` đã có sẵn nhưng chưa ai dùng.

**Approach:** Mỗi lần khởi động, `main.js` gọi một action mới `xinLuuTruBen()`. Action này hỏi cổng `quota.persist()`: trả `false` thì ghi cờ `persistDenied`, đưa cờ vào state, và dòng nhắc chân trang dùng ngưỡng 3 ngày thay vì 7. Trả `true` thì im lặng.

## Boundaries & Constraints

**Always:** Gọi `persist()` ở MỌI lần khởi động, không nhớ "đã thử". Chỉ `adapters/quota.js` chạm `navigator.storage`, và chỉ `main.js` import nó. `xinLuuTruBen` không bao giờ reject, không bao giờ đặt dải băng; cổng ném/reject hay ghi cờ hỏng thì nuốt. Action vào `ACTION_GHI` và gác `chiDoc`. Ngưỡng chọn bằng hai hằng sẵn có trong `limits.js`, không có số rải rác. Cờ đổi thì `phatTin(TIN_PHIEN_DOI)`, và `napLaiPhien` đọc lại cờ. Bump `APP_VERSION` 0.7.5 → 0.7.6. Commit tiếng Việt, một commit.

**Never:** Không khóa `localStorage` thứ tư, không trường state nào nghĩa "đang/đã lưu". Không `estimate()`/cảnh báo ngưỡng (Story 8.2). Không nguồn dải băng mới. Không test tự động cho `adapters/quota.js` (kiểm bằng checklist README). Không gọi `persisted()` để bỏ qua lần xin.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Được cấp | `persist()` → `true`, cờ vắng | gọi `remove` (vô hại), không phát tin, state `persistDenied: false` | N/A |
| Bị từ chối | `persist()` → `false` | `sessionStore.write('persistDenied', '1')`, state `true`, phát `session-changed` | ghi ném → nuốt, state VẪN `true` (theo `persist()`, không theo kho — quyết định Q3A, ngoại lệ có chủ ý so với khuôn `xuatSaoLuu`), KHÔNG phát tin |
| Treo không resolve | `persist()` không bao giờ trả lời | state giữ giá trị của `khoiDong`, không lượt vẽ, không reject | N/A |
| Resolve sau khi vào chỉ đọc | tin lệch bản đến trong lúc `persist()` treo | không `write`/`remove`, không phát tin, state không đổi | N/A |
| `napLaiPhien` đọc ném | tin `session-changed`, đọc cờ ném | cờ GIỮ giá trị đang có; theme/mốc vẫn cập nhật | nuốt |
| Cờ rác | kho mang `'x'` | đọc là `false`; `persist()` → `false` thì ghi đè `'1'` | N/A |
| Đọc ném lúc khởi động rồi được cấp | `khoiDong` đọc ném (state `false`), `persist()` → `true` | vẫn gọi `remove`; không phát tin (state không đổi) | remove ném → nuốt |
| Được cấp sau khi từng bị từ chối (quyết định 1A) | cờ đã có, `persist()` → `true` | `sessionStore.remove('persistDenied')`, state `false`, phát `session-changed`; dòng nhắc về ngưỡng 7 ngày | remove ném → nuốt, state VẪN `false` (Q3A, đối xứng), KHÔNG phát tin |
| Từ chối lần nữa | cờ đã có, `false` | không ghi lại, không phát tin | N/A |
| API vắng | adapter trả `null` (không có `navigator.storage.persist`) | no-op | N/A |
| Cổng ném / reject | `persist` ném hoặc reject | no-op, không dải băng, lời hứa resolve | nuốt |
| Chỉ đọc | `readOnly: true` | no-op, không gọi cổng nào | N/A |
| Khởi động | kho có cờ | `khoiDong` đặt `persistDenied: true` đồng bộ | đọc ném → `false` |
| Dòng nhắc | `lastBackupAt` cách 5 ngày | cờ vắng: im lặng; cờ có: `Lần sao lưu gần nhất cách đây 5 ngày.` | N/A |
| Chưa từng sao lưu | cờ có, `lastBackupAt` `null` | im lặng — giữ quyết định Story 4.4 (Q2B), rủi ro đã chấp nhận | N/A |

**Quyết định:** Q1 — Nam không dùng Firefox thường xuyên → phương án D (giữ AD-10 nguyên văn). Q2 — B. Q3 — A.

</frozen-after-approval>

## Code Map

- `app/ports/quota.js` -- `QUOTA_METHODS = ['estimate']`; thêm `persist` (typedef `Promise<boolean|null>`, `null` = không hỗ trợ). `kiemTraPorts`/`congTam` tự theo bảng này.
- `app/adapters/quota.js` -- MỚI. `taoQuota()` trả `{ estimate, persist }`, mở lười (không chạm global khi dựng, vì `test/trang-tinh.test.js` import `main.js` ở Node). `estimate` trả `{used, limit}` hoặc `null`s (8.2 dùng).
- `app/main.js` -- `congThat()` (73): thêm `quota: taoQuota()` SAU `...congTam()`. Docstring `congThat` (66–67) nói `quota` còn là stub — sửa (grep `quota` trong tệp). Sau `store.khoiDong(themeLucTai).then(veTatCa)` (456): `store.xinLuuTruBen().then(() => veGiuTieuDiem(document, veTatCa))` — trên Firefox lời hứa có thể resolve vài phút sau, lúc Nam đang gõ trong ô sửa, nên lượt vẽ phải giữ tiêu điểm (khuôn `nhanBanTin`, 462). Gọi SAU `khoiDong(`; ca quét `main.js` ghim thứ tự đó.
- `app/core/state.js` -- `ACTION_GHI` (120): thêm `'xinLuuTruBen'`. `stateRong` (219): thêm `persistDenied: false` cạnh `lastBackupAt`, tầng B′ (sửa docstring 207). `khoiDong` (765) và `napLaiPhien` (882): đọc cờ trong `try` RIÊNG (đọc cờ hỏng không được làm mất theme/mốc), dịch `persistDenied = read('persistDenied') === '1'` (giá trị rác = `false`). Đọc ném: `khoiDong` → `false`; `napLaiPhien` → GIỮ giá trị đang có. "Cờ đã có" nghĩa là `noiBo.persistDenied === true`, không phải "khóa tồn tại". Nhánh `true` LUÔN gọi `remove` (vô hại khi khóa vắng, dọn được cờ mà `khoiDong` đọc hỏng), chỉ `phatTin` khi state đổi. Gác `chiDoc` ở DÒNG ĐẦU action, trước `ports.quota.persist(` (ca (a) đòi nhật ký ghi rỗng); `sessionStore.write`/`remove` là ĐỒNG BỘ và ném — bọc `try`, không `.catch`. Kiểm lại `chiDoc` trong `.then` sau `persist()` là lớp thứ hai (khuôn 706, 1186): resolve muộn sau khi đã vào chỉ đọc → no-op. Hai tab ghi đè cờ nhau thì tab sau cùng thắng — chấp nhận. Action mới gần khuôn `xuatSaoLuu` (1071): không `ghiTruocDatSau`, `datLai` trần, nhưng state theo kết quả `persist()` dù ghi kho hỏng (Q3A); `phatTin(TIN_PHIEN_DOI)` chỉ khi ghi/xóa thành công và state đổi. Cổng đọc: `ports.quota.persist(`. Hằng khóa `KHOA_PERSIST_DENIED = 'persistDenied'` cạnh `KHOA_LAST_BACKUP` (96). Export ở `Object.freeze` cuối tệp.
- `app/core/backup.js` -- import thêm `BACKUP_NUDGE_DAYS_PERSIST_DENIED` (18). `cauNhacSaoLuu(lastBackupAt, bayGio, biTuChoi = false)` (271): ngưỡng `biTuChoi ? BACKUP_NUDGE_DAYS_PERSIST_DENIED : BACKUP_NUDGE_DAYS`, giữ `>`.
- `app/view/chan-trang.js` -- dòng 83: truyền `store.state.persistDenied` (bayGio `undefined`).
- `test/core-state-chi-doc.test.js` -- `CONG_GHI` (dòng 20, KHÔNG phải `CONG_DOC` ở 42): thêm `'quota.persist'` — nó xin quyền, có tác dụng phụ; ca 308–311 đòi hai bảng phủ đúng `PORT_METHODS`. Bảng `GOI` thêm `xinLuuTruBen: (t) => t.store.xinLuuTruBen()`; `thuc` trong `dungTab` (57–91) thêm `quota: { persist: () => Promise.resolve(false) }` và `sessionStore.remove`, nếu không cổng giả ném "thiếu". Quét (b) tự bắt nếu quên.
- `test/core-state.test.js` -- `KHOA_STATE` (58–70) liệt kê đúng mọi trường state: thêm `'persistDenied'` kèm chú thích lần nới. `portsDay()` phải có `quota.persist`; ca 126/151 dựng cổng `quota` bằng tay.
- `test/chan-trang-hai-link.test.js` -- ca dòng nhắc (411–425): thêm ca gọi `chanTrang.ve()` thật với cờ bật — ghim rằng chân trang truyền cờ đúng vị trí tham số (giữ thứ tự `(moc, bayGio, biTuChoi)` để khỏi sửa 17 lời gọi test sẵn có).
- `_bmad-output/planning-artifacts/architecture/architecture-ghi-chu-hang-ngay-2026-09-10/ARCHITECTURE-SPINE.md` -- mục Deferred (~569), cạnh "`persist()` bị từ chối vĩnh viễn": thêm dòng Firefox của quyết định D (xem Design Notes).
- `README.md` -- checklist thủ công: thêm mục kiểm `persist` trên trình duyệt thật.

## Tasks & Acceptance

**Execution:**
- [x] `app/ports/quota.js` -- thêm `persist` vào chữ ký và `QUOTA_METHODS`.
- [x] `app/adapters/quota.js` -- tạo adapter hai phương thức, không ném khi API vắng.
- [x] `app/core/state.js` -- trường `persistDenied`, đọc ở `khoiDong`/`napLaiPhien`, action `xinLuuTruBen`, `ACTION_GHI`.
- [x] `app/core/backup.js` + `app/view/chan-trang.js` -- ngưỡng theo cờ.
- [x] `app/main.js` -- nối adapter, gọi action lúc khởi động, sửa chú thích stub.
- [x] `app/core/limits.js` -- `APP_VERSION` 0.7.6.
- [x] `test/` -- ca cho mọi dòng I/O Matrix (lõi bằng cổng giả), ca `cauNhacSaoLuu` ở ngày 3/4/5/8 cả hai cờ, cập nhật fake cổng `quota` hiện có; ca quét `main.js`: `xinLuuTruBen(` xuất hiện đúng một lần, SAU `khoiDong(`, treo `veGiuTieuDiem`; ca cổng giả resolve bằng tay: treo không resolve (state giữ giá trị `khoiDong`, không reject), resolve sau khi vào chỉ đọc (không `write`/`remove`), cờ rác, đọc ném ở `napLaiPhien` (giữ giá trị).
- [x] `README.md` -- mục checklist. Chromium: hai kết quả đều hợp lệ (localhost mới → `false` → `ghichu.persistDenied` = `1`; bookmark rồi tải lại → có thể `true` → khóa mất). Firefox: bỏ qua hộp hỏi → tải lại → hộp hiện lại; chọn Chặn hoặc Cho phép thì hộp không hiện nữa (câu hướng dẫn cho người dùng).
- [x] `ARCHITECTURE-SPINE.md` -- dòng Deferred Firefox.
- [x] `sprint-status.yaml` -- khóa `8-1-xin-lưu-trữ-bền-và-nói-to-hơn-khi-bị-từ-chối` theo trạng thái build.

**Acceptance Criteria:**
- Given `npm test`, when chạy, then xanh toàn bộ, gồm quét `ACTION_GHI` và ca chỉ đọc của `xinLuuTruBen`.
- Given trang tải trên Chromium localhost, when mở DevTools, then không lỗi console và không request mạng mới; `localStorage` chỉ có các khóa trong bộ ba.

### Review Findings

- [x] [Review][Defer] Thân AD-10 trong spine chưa ghi các chốt của story (giá trị `'1'`, ngưỡng 3 ngày, không dải băng, Q3A, xin mỗi lần khởi động) [ARCHITECTURE-SPINE.md] — deferred: sửa tài liệu kiến trúc/ngữ cảnh agent, ngoài phạm vi vá mã.
- [x] [Review][Defer] Lượt vẽ sau `xinLuuTruBen` và việc nối `taoQuota()` thật chỉ ghim bằng quét chuỗi nguồn [app/main.js:462] — deferred: đã có trong deferred-work.md từ lượt build; cần chủ repo duyệt ngoại lệ hoặc thêm ca `thu-tay`.

**Rejected:**
- false — `napLaiPhien` đè state khi ghi/xóa cờ hỏng: đúng quyết định Q3A của spec (Triage Log #8); sửa là sửa spec.
- false — tab khác không nhận tin khi ghi hỏng: hệ quả chủ đích của Q3A.
- low — `main.js` vẽ lại cả khi no-op: một lần lúc khởi động, qua `veGiuTieuDiem` nên giữ tiêu điểm; sửa cần thêm nhánh.
- false — thứ tự tham số `cauNhacSaoLuu`: Code Map chốt (Triage Log #12).
- low — README thiếu bước hai tab / Safari / chỉ đọc: hành vi đã có test đơn vị; bổ sung checklist tùy chọn.
- low — hai ca test không `await` `khoiDong`: `khoiDong` không bao giờ reject; rủi ro rejection lạc không xảy ra.
- false — `CONG_GHI` thiếu `estimate`: `estimate` thuộc `CONG_DOC`, ca 308–311 ép hai bảng phủ đúng `PORT_METHODS`; suite xanh.
- false — `xinLuuTruBen` đua với `khoiDong`: `khoiDong` đặt `persistDenied` ĐỒNG BỘ trước `await` đầu, có ca test ghim.
- low — cờ vắng khi state `true` (đọc ném) thì không ghi lại: cần đọc ném rồi `persist()` false; hiếm, sửa thêm nhánh.
- low — `datLai`/`phatTin` ném trong `.then`: không có đường chứng minh chúng ném; thêm gác không chứng minh.
- low — vẽ thừa khi ghi chú còn đang nạp: vô hại, lượt `veTatCa` của `khoiDong` vẽ lại sau.
- false — `portsDay()` trong core-state.test.js thiếu `quota.persist`: dựng từ `PORT_METHODS`, 970/970 test xanh.
- false — sprint-status chưa cập nhật: khóa đang `review`, đúng trạng thái trước review; bước review đồng bộ.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| # | Nguồn | Phát hiện | Verdict | Bằng chứng / Định tuyến |
|---|-------|-----------|---------|--------------------------|
| 1 | blind, edge | `adapters/quota.js` `estimate()`/`persist()` reject khi API ném, trái hợp đồng cổng | low | `await` trần không `try`; vá (patch). |
| 2 | edge | `persist()` ép kết quả không phải boolean thành `false` → tính là bị từ chối | low | `=== true`; vá: không phải boolean → `null` (patch). |
| 3 | blind, verif | Tên ca "Được cấp sau khi từng bị từ chối … ngưỡng 7" không kiểm dòng nhắc | low | Ca không gọi `cauNhacSaoLuu`; vá thêm khẳng định (patch). |
| 4 | blind | Import động `APP_VERSION` lẻ trong test | low | Vá thành import tĩnh (patch). |
| 5 | verif | Lượt vẽ sau `xinLuuTruBen` ở `main.js` chỉ ghim bằng quét chuỗi | medium | Bootstrap `main.js` ngoài test tự động theo luật; hoãn (defer), checklist README phủ. |
| 6 | blind | Thứ tự `khoiDong`/`xinLuuTruBen` chỉ kiểm bằng vị trí chữ | false | `khoiDong` đọc cờ ĐỒNG BỘ trước khi trả; `.then` của `persist()` luôn chạy sau. |
| 7 | blind, edge | Luôn vẽ lại kể cả khi state không đổi | false | Spec đòi; `veGiuTieuDiem` giữ tiêu điểm, nội dung sửa nằm trong `editing` — cùng khuôn `nhanBanTin`. |
| 8 | blind, edge | Ghi/xóa cờ hỏng làm lệch kho và state; `napLaiPhien` có thể đè | false | Quyết định Q3A trong intent; ghi kho hỏng hiếm, sửa cần state thêm. |
| 9 | blind, edge | Hai tab đua ghi cờ | false | Spec chấp nhận "tab sau cùng thắng". |
| 10 | blind | Hướng dẫn Firefox chỉ ở README | false | Spec đặt nó ở README; không nguồn dải băng mới (Never). |
| 11 | blind | `BACKUP_NUDGE_DAYS_PERSIST_DENIED` không có trong diff | false | Hằng có sẵn từ trước (Problem). |
| 12 | blind | `cauNhacSaoLuu(x, undefined, co)` khó đọc | false | Thứ tự tham số do Code Map chốt để giữ 17 lời gọi. |
| 13 | blind | Spine chưa ghi `persist`/`persistDenied`/`ACTION_GHI` | low | Không có hại cụ thể; spec chỉ đòi dòng Deferred — bác. |

## Design Notes

"Mọi lần khởi động" khớp AD-10 "cho tới khi trả `true`": khi đã được cấp, `persist()` trả `true` ngay, không hỏi, nên gọi lại là vô hại và không cần khóa nhớ thứ tư. Hệ quả chấp nhận: trên Firefox, bỏ qua (không trả lời) hộp hỏi quyền thì lần tải sau nó hiện lại — đó là cách "thử lại" của AD-10; chọn chặn thì Firefox nhớ và không hỏi nữa.

Quyết định #4 = (D), qua party-mode: giữ spec và AD-10 nguyên văn, rủi ro Firefox đã chấp nhận vì người dùng chính dùng Chrome/Edge. Không chọn C: làm yếu thử lại trên Chromium (bị từ chối sớm phải chờ N ngày) và cho một khóa hai nghĩa. Không chọn B: vẫn hỏi mỗi phiên, thêm điểm gọi/trường state, không giúp Chromium. Mở lại khi Firefox thành trình duyệt dùng thật; hướng ưu tiên khi đó là B. Dòng Deferred cho spine: "Firefox: bỏ qua hộp hỏi quyền thì nó hiện lại mỗi lần mở (AD-10 thử lại mỗi lần khởi động). Mở lại khi Firefox thành trình duyệt dùng thật; hướng ưu tiên là xin sau lần chốt ghi chú đầu tiên của phiên (B), không phải giãn nhịp (C)."

Lần tải đầu sau deploy: nếu cờ đổi, tin `session-changed` mang 0.7.6 đẩy tab 0.7.5 còn mở vào chỉ đọc — đúng thiết kế Story 7.2, không phải hồi quy.

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ xanh.

**Manual checks (if no CLI):**
- Mục checklist README mới, trên trình duyệt thật.
