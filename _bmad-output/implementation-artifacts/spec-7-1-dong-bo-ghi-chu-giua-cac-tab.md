---
title: 'Story 7.1: Đồng bộ ghi chú giữa các tab'
type: 'feature'
created: '2026-09-25'
status: 'done'
baseline_commit: '4f834110e93f080131191093ad172a86f0773dc1'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-7-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Hai tab mở song song không biết nhau. Ghi chú tạo, sửa, xóa hay nạp ở tab này chỉ hiện ở tab kia sau F5. Theme và mốc sao lưu cũng vậy. Hôm nay không có chỗ nào phát `notes-changed`, cũng không ai nghe kênh. Tệ nhất: khi tab B xóa đúng mẩu tab A đang sửa, lưới của A lặng lẽ bỏ chữ đang gõ.

**Approach:**
- Mỗi lần ghi thành công vào store `notes` thì phát `notes-changed` qua kênh duy nhất `BroadcastChannel('ghichu')`.
- `main.js` nghe kênh. Tin lạ và tin của chính tab thì bỏ qua.
- `notes-changed`: đọc lại IndexedDB rồi vẽ lại, giữ tiêu điểm. `session-changed`: đọc lại theme và mốc sao lưu.
- Bản nháp không bao giờ bị đụng.
- Mẩu đang sửa bị tab khác xóa thì hiện dải băng.

## Boundaries & Constraints

**Always:**

- Bản tin đúng bốn trường `{ v: 1, type, from, appVersion }`. `type` chỉ là `notes-changed` hoặc `session-changed`. Bản tin không mang nội dung.
- Thứ tự luôn là: ghi kho → `datLai` → phát. Phát `notes-changed` sau các lần ghi thành công sau: chốt (`commitDraft`), tự lưu sửa (`put`), xóa (`remove`), nạp file (`replaceAll`). Ghi hỏng thì không phát.
- Phát tin không bao giờ làm action bị từ chối. Mọi chỗ phát đi qua một hàm có bọc `try`. Hàm đó tổng quát hóa `phatPhienDoi`.
- Tin nhận vào không đúng hình dạng thì bỏ qua im lặng. Tin có `from` bằng danh tính tab mình cũng bỏ qua. `appVersion` chưa được xét ở đây; đó là việc của 7.2.
- Đọc lại ghi chú là chỗ thứ hai và cuối cùng đọc IndexedDB. Nó thay toàn bộ `notes` bằng ảnh chụp đã sắp giảm dần. Nó dọn `expandedIds`, `seq` và `chuDangCho` của các id đã mất, trừ `editing` của mẩu đang sửa. Nó không đụng `draft`.
- Mỗi lúc có tối đa một lượt đọc lại đang bay. Tin đến trong lúc bay thì đọc thêm đúng một lượt sau đó.
- Đọc hỏng thì hiện dải băng theo mã lỗi của kho, giống `khoiDong`.
- Mọi chỗ thêm hoặc thay ghi chú trong RAM phải khóa theo `id`. Nếu `notes` đã có bản ghi cùng `id` (vì lượt đọc lại về trước), không được thêm lần hai.
- Lượt vẽ do tin đến đi qua `veGiuTieuDiem(document, veTatCa)`. Tiêu điểm đang ở nút `về hôm nay` mà nút bị vẽ lại thì về nút mới. Nút không còn thì về `#o-soan`. Không để tiêu điểm rơi về `<body>`.
- Mẩu đang sửa bị tab khác xóa (hoặc mẩu còn chữ chờ ghi trong `chuDangCho`) thì dùng mã mới `MAU_SUA_BI_XOA`, chỉ dành cho dải băng. Mã vào `MICROCOPY_BANG` và hàng 5 của `BANG_UU_TIEN`, đóng được. Không thêm nguồn thứ tám, không đổi `errors.js`.
- **Quyết định OQ1 (namtt, 2026-09-25): xóa thắng.** Ô sửa ở lại cho tới khi rời, không ghi gì xuống kho (không hồi sinh). Rời ô sửa thì mẩu biến mất, tiêu điểm về `#o-soan`. Microcopy nguyên văn: `Ghi chú này vừa bị xóa ở tab khác. Chép chữ ra trước khi rời ô sửa nếu còn cần.`
- **Quyết định độ dài (namtt):** giữ spec nguyên, không tách.
- `subscribe` trả về một hàm gỡ bộ nghe.
- Tên kênh là `'ghichu'`, không còn `'ghichu.tab-sync'`, theo AD-7 và AD-9.
- Bump `APP_VERSION` lên `0.7.3`.

**Never:**

- Không phát tin cho bản nháp. Không đọc hay ghi bản nháp của tab khác.
- Không khóa tab. Không có dải băng "đóng tab này". Đồng bộ thành công thì im lặng.
- Không có kênh thứ hai. Không dựng cơ chế subscribe cho view; chỉ `main.js` nối kênh.
- Không có chế độ chỉ đọc, không có `VERSION_SKEW` (thuộc 7.2).
- Không đổi `luoi.ve`: đang sửa thì lưới vẫn không vẽ lại.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior |
|---|---|---|
| Chốt ở A | B đang mở | B hiện mẩu mới, tab title của B đúng, không F5 |
| Tin của chính mình | `from` === tabId | bỏ qua, không đọc kho |
| Tin rác | `{ type: 'x' }`, `null`, thiếu trường | bỏ qua im lặng |
| B đang gõ ô soạn | A chốt | ô soạn và bản nháp của B nguyên vẹn |
| Sửa ở A | B đang nhìn mẩu đó | B hiện chữ mới sau khi `put` của A xong |
| A sửa X, B xóa X | A nhận `notes-changed` | dải băng `MAU_SUA_BI_XOA` ở A; chữ không mất trong im lặng |
| Tiêu điểm ở `xóa` của Y | tin đến, Y còn | tiêu điểm vẫn ở `xóa` của Y |
| Tiêu điểm ở `về hôm nay` | tin đến | tiêu điểm vẫn ở nút đó; nút không còn thì về `#o-soan` |
| Đổi theme ở A | — | B đổi theme và nhãn nút |
| Xuất hoặc nạp ở A | — | dòng nhắc sao lưu của B đổi |
| Ba tin dồn | đang đọc lại | tối đa hai lượt `readAll` |
| Đọc lại hỏng | `readAll` từ chối | dải băng mã kho, `notes` giữ nguyên |

</frozen-after-approval>

## Code Map

- `app/adapters/broadcast.js:23` -- `TEN_KENH = 'ghichu.tab-sync'` → `'ghichu'`. `subscribe` (`:73`) chưa trả về gì; `publish` (`:59`) đã tự nuốt lỗi.
- `app/ports/channel.js` -- typedef `ChannelSubscribe` phải nói rõ giá trị trả về là hàm gỡ.
- `app/core/state.js`:
  - `phatPhienDoi` (`:754-771`) -- tổng quát thành `phatTin(type)`. Hằng `TIN_PHIEN_DOI` / `HINH_DANG_BAN_TIN` ở đầu tệp; thêm hằng `notes-changed` cạnh chúng.
  - `ghiTruocDatSau` (`:607`) -- dùng chung cho chốt, xóa, nạp. Phát trong nhánh thành công của từng chỗ gọi, không phát trong helper, vì helper có thể có chỗ gọi không chạm `notes`: grep lại.
  - `henGhiDiSau` (`:648-663`) -- nhánh `put` thành công.
  - `themGhiChu` (`:1053`) -- `[banGhi, ...noiBo.notes]` phải lọc bỏ `id` trùng.
  - `khoiDong` (`:696-733`) -- tách phần `readAll` thành action `napLaiGhiChu()` để dùng lại. Sửa chú thích "đúng MỘT lần trong cả vòng đời tab" ở `:698-700`.
  - Action mới `nhanBanTin(tin)` -- kiểm hình dạng, lọc `from`, rẽ nhánh; trả về lời hứa không bao giờ bị từ chối.
  - Đọc lại phiên: `sessionStore.read(KHOA_THEME / KHOA_LAST_BACKUP)`, kiểm theme bằng `THEME_HOP_LE`.
  - Bookkeeping trong closure ở `:370-404` (`dangNap`, `chuDangCho`). Cờ đọc-lại-đang-bay đặt cùng khuôn đó, không đặt vào state.
- `app/core/banner.js` -- `LOAI_BANG` (`:45-65`), `BANG_UU_TIEN` hàng 5 (`:79-95`), `MICROCOPY_BANG` (`:139-147`).
- `app/main.js`:
  - `congThat` (`:73-86`) -- tạo `taoBroadcast()` một lần, để khối `document` gọi được `subscribe`. Adapter thật vẫn đứng sau `...congTam()`.
  - `neoTuTieuDiem` / `veGiuTieuDiem` (`:108-168`) -- thêm neo cho nút `về hôm nay` (selector lấy từ `app/view/hang-chip.js`).
  - Nối `subscribe` sau `store.khoiDong(...)` (`:427`).
- `app/view/hang-chip.js:43-78` -- `button.ve-hom-nay` bị `replaceChildren` dựng lại ở mọi lượt `ve()`. Export selector; không đổi cách vẽ.
- Test sẽ gãy và phải sửa:
  - `test/theme.test.js:609` (tên kênh).
  - `test/core-state-nap.test.js:418,436-519` và `test/core-state-xuat.test.js:179-221` (danh sách tin `toEqual`; nạp nay phát thêm `notes-changed` trước `session-changed`).
  - `test/core-state.test.js:581-593` (hình dạng tin).
  - `test/banner.test.js:128-189` (`THU_TU_AD_17`, số mã).
- Không test adapter bằng BroadcastChannel giả, ngoài những ca `theme.test.js:546-613` đã có. Kiểm thật bằng `tools/thu-bo-cuc.mjs` với `Cdp.tabMoi` (`tools/cdp.mjs:156`) và README.
- Tài liệu: `README.md` mục 37 sau `:744` (và danh sách tự động ở `:95`); `EXPERIENCE.md:81-87` microcopy; `AGENTS.md` (tên kênh đã đúng `ghichu`; thêm bẫy nếu có).

## Tasks & Acceptance

**Execution:**

- [x] `app/adapters/broadcast.js`, `app/ports/channel.js` -- đổi tên kênh, `subscribe` trả hàm gỡ.
- [x] `app/core/banner.js` -- mã `MAU_SUA_BI_XOA` ở hàng 5, kèm microcopy theo quyết định OQ1.
- [x] `app/core/state.js` -- `phatTin`, phát ở bốn chỗ ghi `notes`, `napLaiGhiChu`, đọc lại phiên, `nhanBanTin`, khóa theo `id`, dải băng mẩu đang sửa bị xóa, hành vi chữ theo OQ1.
- [x] `app/main.js`, `app/view/hang-chip.js` -- nối `subscribe` → `store.nhanBanTin(tin).then(() => veGiuTieuDiem(document, veTatCa))`; neo `về hôm nay`.
- [x] `test/` -- ca mới cho mọi hàng của Matrix chạy trên cổng giả (`core-state-dong-bo.test.js`), neo `về hôm nay` trong `giu-tieu-diem.test.js`, bản nháp không phát tin, và sửa các test gãy ở Code Map.
- [x] `tools/thu-bo-cuc.mjs` -- khối hai tab thật: chốt / sửa / xóa lan sang, theme lan sang, bản nháp tab kia nguyên vẹn, dải băng khi mẩu đang sửa bị xóa.
- [x] `README.md`, `EXPERIENCE.md`, `app/core/limits.js`, `_bmad-output/implementation-artifacts/deferred-work.md` (ghi hoãn F1) -- tài liệu và bump.

**Acceptance Criteria:**

- Given `app/`, when quét nguồn, then chỉ `broadcast.js` chứa `BroadcastChannel`, với đúng một tên kênh là `'ghichu'`.
- Given mọi action ghi bản nháp, when chạy, then cổng kênh không nhận tin nào.
- Given `npm test`, when chạy, then xanh toàn bộ.
- Given `npm run thu-bo-cuc`, when chạy, then khối hai tab xanh, và chỉ ca chập chờn đã biết được phép đỏ.

### Review Findings

- [x] [Review][Decision] (Nam quyết: loại bỏ) Hẹn tự lưu hồi sinh mẩu tab khác vừa xóa — `henGhiDiSau` chỉ gác theo `noiBo.notes` trong RAM. Nếu hẹn nổ (hoặc `put` đã bay) trước khi tin `notes-changed` của B tới A, `put` (upsert) ghi X lại vào IndexedDB; `baoGhiChuDoi` báo B, B đọc lại và X hiện lại, không dải băng nào ở cả hai tab. Trái OQ1 "xóa thắng". Không test nào lái thứ tự "hẹn trước, tin sau". Đóng hẳn cần `put`-chỉ-khi-còn-tồn-tại trong một giao dịch (phương thức cổng/adapter mới) — hoặc chấp nhận khe ms và ghi hoãn. [app/core/state.js:669]
- [x] [Review][Patch] README dòng tóm tắt nói mục 37 "chạy được bằng máy" trong khi mục 37 ghi ba phần chỉ làm tay — đổi thành "một phần chạy được bằng máy" [README.md:95]
- [x] [Review][Patch] Test quét kênh hẹp hơn AC1: chỉ bắt `new BroadcastChannel(` và `TEN_KENH = '…'` — nới thành quét mọi chữ `BroadcastChannel` ngoài `broadcast.js` [test/core-state-dong-bo.test.js:531]

**Rejected:**
- false — "`MAU_SUA_BI_XOA` bỏ qua bảng ưu tiên": `datLai` tự gác bằng `thayDuoc` (state.js:469).
- false — "F1 không ghi vào deferred-work.md": đã có ở mục "Deferred from: spec-7-1…" (deferred-work.md:197-201).
- false — "`napLaiPhien` đè `lastBackupAt` bằng null": khóa vắng nghĩa là chưa từng sao lưu; phản chiếu kho là đúng.
- false — "`daBaoMat` sai khi tách dòng sau": giả định mã tương lai, hiện không xảy ra.
- false — "tiêu điểm nhảy về `#o-soan` khi lưới bỏ mẩu mất": `luoi.ve` giữ nguyên ô sửa đang mở (luoi.js:97-100).
- false — "`.catch` bỏ `docThem`": `motLuot` đặt lại `docThem=false` ở lượt sau; chỉ xảy ra với adapter ném đồng bộ, không có ở mã thật.
- low — Đổi tên kênh tách tab 0.7.2/0.7.3 lúc deploy: spec buộc tên `ghichu`; chỉ mất đồng bộ theme tới khi tab cũ tải lại.
- low — Dải băng DB không tự tắt khi đọc lại thành công: tắt nó có thể che lỗi ghi; cần thêm nhánh.
- low — Câu chữ dải băng sau khi rời ô sửa: câu chữ do spec OQ1 quyết.
- low — Thiếu test nối `subscribe` trong `main.js`, hàm gỡ của `subscribe`, lỗi đọc `napLaiPhien`, thứ tự ghi→phát trong tên test, tiêu điểm sau rời ô sửa: hành vi đúng, thêm test không phải sửa trực tiếp.
- low — `thu-bo-cuc` chờ cố định `nghi(1500)`: chưa thấy đỏ; đổi sang chờ điều kiện là thêm mã.

## Implementation Notes

## Spec Change Log

## Review Triage Log

Vòng 1 (2026-09-25), diff `4f83411..` (cbd5169 + cây làm việc), 3 lớp: blind, edge, vgap.

| # | Nguồn | Phát hiện | Verdict | Bằng chứng | Route |
|---|---|---|---|---|---|
| 1 | blind, edge | Đóng `MAU_SUA_BI_XOA` bằng ✕ rồi có tin mới → dải băng hiện lại | medium | `apAnhChup` tính `mauSuaMat` theo `editing.id` còn trỏ id đã mất ở mọi lượt | patch |
| 2 | vgap | Nhánh `docThem = true` của `baoGhiChuDoi` không có test | medium | Xóa dòng đó thì suite vẫn xanh; `hoanDoc` chỉ dùng ở ca "Ba tin dồn" | patch |
| 3 | blind | EXPERIENCE ghi "ngang dòng 4", mơ hồ so với hàng 5 của `BANG_UU_TIEN` | low | Sửa chữ trực tiếp | patch |
| 4 | blind | README mục 37 nói `thu-bo-cuc` tự động hóa cả mốc sao lưu, tiêu điểm, ✕ | low | Khối hai tab không có ba bước đó; sửa chữ | patch |
| 5 | blind, vgap | Nối `subscribe` trong `main.js` (cùng `kenh`, TDZ) không có test trong `npm test` | medium | Luật AGENTS.md cấm test phần trình duyệt; chỉ `thu-bo-cuc` + mục 37 bắt | defer |
| 6 | edge | `put` đang bay khi tab khác xóa → mẩu hồi sinh | low | Đúng khe đã ghi ở Design Notes; sửa là đổi thiết kế đã duyệt | reject |
| 7 | edge | Phép ghi thành công khác tắt `MAU_SUA_BI_XOA` | low | Đang ở ô sửa mồ côi thì tab này không có phép ghi nào; rời ô là chữ đã đi | reject |
| 8 | blind, edge | Dải băng `DB` của lượt đọc hỏng ở lại sau lượt đọc thành công | low | Cùng hành vi `khoiDong` có sẵn; AD-8 chỉ tắt dải băng khi GHI thành công | reject |
| 9 | blind | Dải băng đặt thẳng bằng `datLai`, bỏ qua `thayDuoc` | false | `datLai` tự gác bằng `thayDuoc` (state.js `:447-463`) | reject |
| 10 | blind | Hai tab cùng sửa một mẩu: lần ghi sau thắng, im lặng | low | Đã nhận trong Design Notes; sửa là đổi spec | reject |
| 11 | blind | Đổi tên kênh làm tab 0.7.2 lệch với tab 0.7.3 | low | Một lần duy nhất, tới lần tải lại; tab 0.7.2 vốn không nghe kênh | reject |
| 12 | blind | Không test ghim rằng `appVersion` lạ vẫn được nhận | low | Không phải lỗi; 7.2 sẽ viết ca của mình | reject |
| 13 | blind | Chip điều kiện và ô khay tìm cũng mất tiêu điểm | false | Chip không focus được (`hang-chip.js:12`); ô khay tìm không bị thay khi vẽ | reject |
| 14 | blind | Hai test phụ thuộc số nhịp microtask | low | Gãy thì đỏ to, không xanh giả | reject |
| 15 | blind | Cờ `daXoa` trong `.catch` mong manh | false | Cùng khuôn `daChot`/`daGop` có sẵn; `ghiTruocDatSau` không nuốt lỗi trước `.catch` trong | reject |

## Design Notes

- **Hoãn F1 (nạp file bị phép ghi chen giữa `readAll` và `replaceAll`).** Cửa sổ chỉ là khe giữa hai giao dịch IndexedDB kề nhau. Nam phải ghi ở tab khác đúng khe đó trong lúc đang nạp file. Đóng hẳn cần thêm một phương thức cổng mới (`mergeAll` trong một giao dịch) lên adapter, mà adapter lại không có test tự động. Ghi vào `deferred-work.md`.
- **Hai tab cùng sửa một mẩu thì lần ghi sau thắng.** Lưới của A đang gác ô sửa nên A không thấy chữ B vừa ghi. Lần tự lưu kế tiếp của A đè lên chữ đó. Chấp nhận vì n = 1 và cảnh hiếm; không dải băng.
- **Khe hồi sinh.** Hẹn tự lưu của A có thể nổ sau lúc B `remove` nhưng trước lúc A nhận tin (vài ms). Khi đó `put` dựng lại mẩu và B thấy nó hiện lại. Không mất dữ liệu; ghi là giới hạn đã biết, không sửa.
- **Chuỗi tin mẫu:**

  ```js
  // main.js
  kenh.subscribe((tin) => {
    store.nhanBanTin(tin).then(() => veGiuTieuDiem(document, veTatCa));
  });
  ```

## Verification

**Commands:**

- `npm test` -- expected: xanh.
- `npm run thu-bo-cuc` -- expected: khối hai tab xanh; đỏ nếu có chỉ ở ca chập chờn AGENTS.md đã biết.
