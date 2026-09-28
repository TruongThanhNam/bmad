---
title: 'Story 7.0: Dọn action item retro Epic 4–6'
type: 'chore'
created: '2026-09-24'
status: 'done'
route: 'dispatch'
baseline_commit: '798a279585f9ce5c940dc9958904462da41cd975'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/sprint-change-proposal-2026-09-24-story-7-0.md'
---
<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates"></frozen>

## Intent

**Problem:** Còn 17 action item retro `open`. Hai trong số đó chặn 7.1. Thứ nhất, lượt vẽ lại kéo tiêu điểm về thân mẩu: Shift+Tab từ ô sửa sang nút `xóa` bị giật về thân mẩu, nên `Enter` vào lại chế độ sửa. Thứ hai, mỗi đường xóa điều kiện phải tự nhớ gọi `khayTim.xoaNhap()`.

**Approach:** Gộp ba hàm trả tiêu điểm thành một hàm export chạy được dưới test. Gom hai đường xóa điều kiện về một hàm. Lấp các khoảng trống test, chú thích và tài liệu. Làm theo bốn quyết định mặc định. Kéo luồng 5.2, 5.3 và 6.x vào `thu-bo-cuc`. Đóng toàn bộ action item.

## Boundaries & Constraints

**Always:**

- Có đúng một hàm export `veGiuTieuDiem(goc, veTatCa, neo)` trong `app/main.js`. Hàm chạy `veTatCa()` rồi trả tiêu điểm theo `neo`:
  - `undefined`: chụp từ `goc.activeElement` TRƯỚC khi vẽ. Phần tử nằm ngoài mọi `[data-mau]` thì không đụng tiêu điểm.
  - `null`: về `#o-soan`.
  - `{ id, vaiTro }`: tìm mẩu theo `id`, rồi focus phần tử đúng vai trò. `'than'` là chính mẩu. `'xoa'` là `CHON_XOA`. `'sua'` là `CHON_SUA`, không còn thì lấy thân. Mẩu đã mất thì về `#o-soan`.
- Tìm mẩu theo `THUOC_TINH_MAU` trong con của `CHON_LUOI`, không theo vị trí.
- Các chỗ gọi:
  - `dongRoiVe` và `veHomNay` gọi hàm với `null`.
  - Lượt vẽ HOÃN sau `roiCheDoSua` gọi với `undefined`.
  - `noiLuongXoa.huy` và `xoa` gọi với `{ id, vaiTro: 'xoa' }`. Hàm `traTieuDiem` riêng biến mất.
- Có đúng một hàm `xoaHetDieuKienVaNhap` gọi `store.xoaHetDieuKien()` và `khayTim.xoaNhap()`. `veHomNay` gọi nó; `veSauChot` gọi nó khi `daXoaDieuKien`. `main.js` không còn lời gọi trần nào khác tới hai hàm kia.
- Quyết định (mặc định theo khuyến nghị, namtt ghi đè tại đây):
  - **E4#2:** giữ chữ số `8 ngày`.
  - **E5#14:** `tuLuuNoiDung` gặp chữ chỉ có khoảng trắng thì vẫn cập nhật `chuDangCho` và `editing.text`, tăng `seq` để bỏ hẹn đang treo, không ghi kho, và chốt ngay. Kết quả là chữ rỗng không bao giờ xuống IndexedDB.
  - **E5#15:** hợp thức hóa `luoi.js → mau-giay.js` thành ngoại lệ cha–con có tên, và ghim bằng test.
  - **E4#9:** đóng có chủ đích retro Epic 1–3, không chạy bù.
- Các ca đỏ được phép của `thu-bo-cuc` chỉ là ca chập chờn AGENTS.md đang liệt kê.

**Never:**

- Không đổi hành vi nhìn thấy được nào khác. Cụ thể không đổi microcopy, cách xóa của 5.2, thứ tự nối view, hay `veTatCa`.
- Không thêm state, không subscribe, không `requestAnimationFrame`.
- Không làm F1 và F2 của retro Epic 4. Chúng thuộc 7.1.

## I/O & Edge-Case Matrix

| Scenario                            | Input / State                                 | Expected Output / Behavior                                    |
| ----------------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| Shift+Tab sang`xóa`              | đang sửa X, Shift+Tab                       | tiêu điểm ở`xóa` của X; `Enter` mở hộp hỏi về X |
| Tab ra mẩu kế                     | đang sửa X, Tab tới thân Y                | tiêu điểm ở thân Y                                       |
| Mẩu mất sau vẽ                   | neo X, X không còn trên lưới             | `#o-soan`                                                   |
| Ngoài lưới                       | focus ở ô tìm                              | không đụng tiêu điểm                                    |
| Sửa kết quả tìm tới hết khớp | tìm`abc`, sửa X thành `xyz`, Shift+Tab | X biến mất;`#o-soan`                                      |
| Rời ô sửa rỗng                  | xóa hết chữ, Shift+Tab                     | X bị xóa;`#o-soan`, không `<body>`                     |
| Gõ rỗng                           | `tuLuuNoiDung(id, '  ')`                    | không`put`; hẹn cũ bị bỏ; lời hứa chốt              |

</frozen-after-approval>

## Code Map

- `app/main.js:109-178` -- `noiLuongXoa`, bỏ `traTieuDiem` nội bộ. `:208-220` -- `veGiuTieuDiem` cũ (focus thân mẩu, là gốc lỗi B2) đưa lên module. `:310-314` -- `dongRoiVe`. `:346-352` -- `veHomNay`. `:396-399` -- `veSauChot`.
- `app/view/mau-giay.js` -- `CHON_SUA='[data-sua]'`, `CHON_XOA='.mau-xoa'`, `THUOC_TINH_MAU='data-mau'`. Mẩu là `div.o-luoi[data-mau][tabindex=0]` chứa `button.mau-xoa`, rồi thân hoặc `textarea[data-sua]`.
- `app/core/state.js:1168-1207` -- `tuLuuNoiDung`. Nhánh trần `:1191` là mẫu để theo. `roiCheDoSua` dùng `.trim() === ''`.
- Test regex vào `main.js` phải viết lại:
  - `test/luoi.test.js:627-632` (thứ tự `veHomNay`, thân không có `}`) và `:678-681` (thân `veGiuTieuDiem`).
  - `test/banner.test.js:579-615` (`dongRoiVe` có `.focus()`).
  - `test/hop-thoai.test.js:694-712` (nối dây, giữ lại) và `:800-804` (`luong.traTieuDiem`).
  - Fake DOM `phanTuGia` và `gocLuoiGia` ở `test/hop-thoai.test.js:35-212` chưa có `activeElement` hay `closest`.
- E4#3: `test/banner.test.js:684-689` là khuôn "đúng một người phát". Người phát duy nhất là `app/core/state.js:975`.
- E4#4: khuôn `expect(nguon).not.toMatch(/adapters\//)` có trong từng test view. `test/chan-trang-hai-link.test.js` thiếu nó.
- E4#5: `app/core/backup.js:89-91,115,166,204` đổi tên `laObjectThuan` thành `laObjectThuong`, theo nghĩa của `state.js:110-119`.
- E4#6: `test/core-backup.test.js:388` phủ gián tiếp. Hành vi được ghi ở `backup.js:211-215`.
- E4#7: `app/adapters/file-io.js:16-18` và `test/core-backup.test.js:5`. Sự thật hiện nay: `test/adapter-file-io.test.js` phủ `readChosenFile`, còn `exportFile` vẫn kiểm tay.
- E4#2: đổi `tám ngày` thành `8 ngày` ở `epics.md:1171`, `EXPERIENCE.md:108,247`, `mockups/` và `.working/key-canh-bao.html:462,471`, `epic-4-context.md:78`, cùng tên test `core-backup.test.js:426`. Để nguyên văn xuôi ở PRD `:521` và spine `:137`.
- E5#15: bảng tầng ở `ARCHITECTURE-SPINE.md:34-40` và `AGENTS.md` ("không import lẫn nhau").
- E5#16: `spec-5-3-…md`, mục Always sau `:34-35`.
- `tools/thu-bo-cuc.mjs` -- khối `{}` đặt trước `} finally {` (`:2411`). Dùng lại `nhanTab(nguoc)` (`:1447`), Enter (`:1666`, `:2045`), đọc `activeElement` (`:896-913`), `Emulation.setFocusEmulationEnabled` (`:1444`). Hiện chưa có khối nào cho 5.2, 5.3 hay sửa kết quả tìm.
- `README.md` -- mục 36 đặt sau `:717`. `app/core/limits.js:82` -- `APP_VERSION` `0.7.1` → `0.7.2`.
- `_bmad-output/implementation-artifacts/sprint-status.yaml:97-242` -- action items (file bị gitignore).

## Tasks & Acceptance

**Execution:**

- [X] `app/main.js` -- `veGiuTieuDiem` ở mức module, nối lại các chỗ gọi, `xoaHetDieuKienVaNhap`, sửa comment.
- [X] `test/giu-tieu-diem.test.js` (mới) -- chạy thật mọi hàng tiêu điểm của Matrix trên gốc giả có `activeElement` và `closest`.
- [X] `test/luoi.test.js`, `test/banner.test.js`, `test/hop-thoai.test.js` -- bỏ regex vào thân hàm tiêu điểm. Regex nối dây giữ lại, gồm cả `xoaNhap(` và `xoaHetDieuKien(` mỗi thứ chỉ xuất hiện một lần. Thêm test quét: import view-sang-view duy nhất là `luoi.js → mau-giay.js`.
- [X] `app/core/state.js` + `test/core-state.test.js` -- nhánh rỗng của `tuLuuNoiDung`.
- [X] E4#3–#7: `test/banner.test.js`, `test/chan-trang-hai-link.test.js`, `test/core-backup.test.js`, `app/core/backup.js`, `app/adapters/file-io.js`.
- [X] `tools/thu-bo-cuc.mjs` -- các khối:
  - hộp 5.3: mở / Esc / `hủy` / `xóa`, kiểm tiêu điểm ở nút hoặc `#o-soan`;
  - Shift+Tab sang `xóa` rồi `Enter`;
  - rời ô sửa rỗng;
  - sửa kết quả tìm tới hết khớp.
- [X] Tài liệu: `README.md` mục 36, `AGENTS.md` (trỏ bẫy về hàm mới, ngoại lệ view, checklist 1–36), spine, spec 5.3, các nguồn `8 ngày`.
- [X] `app/core/limits.js` bump. `sprint-status.yaml`: mọi item E4, E5 và E6 còn mở chuyển sang `done`; E4#9 có `note:` lý do.

**Acceptance Criteria:**

- Given `npm test`, when chạy, then xanh toàn bộ.
- Given `npm run thu-bo-cuc`, when chạy, then các khối mới xanh và chỉ ca chập chờn đã biết được phép đỏ.
- Given `sprint-status.yaml`, when đọc, then không còn item `epic-4/5/6-retro-*` nào `open`.

### Review Findings

Code review vòng 2 (2026-09-24), diff `798a279..0d5c5ad`, 4 lớp: blind, edge, vgap, acceptance.

- [x] [Review][Patch] (medium) Đường `mocSua.go` → `veGiuTieuDiem` với case rời TRƯỚC `AUTOSAVE_MS` chưa chạy trong trình duyệt thật. Ca "sửa kết quả tìm" của `thu-bo-cuc` đợi `put` xong rồi mới Shift+Tab, nên lượt vẽ của `roi` mới là lượt gỡ mẩu. Ca Vitest thì tự viết lại chỗ nối hook, nên nếu chỗ nối thật trong `main.js` trôi (thứ tự, neo) thì chỉ regex bắt được. Cần thêm ca Shift+Tab ngay, không đợi `notes`, rồi kiểm `#o-soan`. Kèm theo: ca `giu-tieu-diem.test.js:299` vẫn nối hook kiểu cũ `.then(c.veTatCa)` [tools/thu-bo-cuc.mjs:2621]
- [x] [Review][Patch] (low) Docstring nói `veGiuTieuDiem` là "hàm DUY NHẤT của ứng dụng vừa vẽ lại vừa đặt tiêu điểm", nhưng `vaoSuaRoiVe` vẫn tự `veTatCa()` rồi `oSua.focus()` [app/main.js:120]
- [x] [Review][Patch] (low) Chú thích nói lần `xoaHetDieuKien()` thứ hai "vô hại: điều kiện đã rỗng". Điều đó không đúng nếu Nam đặt điều kiện mới trong khe `commitDraft` đang bay, và Implementation Notes đã ghi đúng khe này [app/main.js:382]
- [x] [Review][Patch] (low) Khối 7.0 của `thu-bo-cuc` đọc `khoTruoc` và bắt đầu chốt ngay sau `taiLai`. `doiSan` chỉ đợi `store` tồn tại, không đợi `khoiDong` nạp `notes` xong. Các khối khác đều `nghi(400)` sau khi tải lại [tools/thu-bo-cuc.mjs:2422]
- [x] [Review][Patch] (low) Bảng tác động của bản đề xuất vẫn ghi "Chỉ đổi nếu namtt duyệt Q3/Q1", dù front-matter đã ghi "đã áp dụng" [_bmad-output/planning-artifacts/sprint-change-proposal-2026-09-24-story-7-0.md:33]
- [x] [Review][Patch] (low) Chú thích của `file-io.js` gọi quy ước repo là "xem `test/adapter-session-store.test.js`", trong khi quy ước nằm ở `AGENTS.md` [app/adapters/file-io.js:16]
- [X] [Review][Defer] (medium) `hang-chip.js` chạy `replaceChildren` ở MỌI lượt `ve()` khi có điều kiện. Tiêu điểm đang ở `về hôm nay` gặp một lượt vẽ bất đồng bộ (`roi` hoãn, `go`/`put`, và bản tin tab khác của 7.1) thì rơi về `<body>`. Nhánh neo `undefined` không đụng vì phần tử ở ngoài mẩu [app/view/hang-chip.js:76] — deferred: có từ trước (Story 6.3); 7.1 thêm nguồn vẽ lại từ tab khác thì lỗ thành thật. Nên xử lý trong spec 7.1
- [X] [Review][Defer] (low) Bẫy mới trong AGENTS.md ("phải đi qua `veGiuTieuDiem`, không tự `focus()`") trái với `vaoSuaRoiVe` còn nguyên, và liệt kê nguồn gỡ tiêu điểm mà thiếu hàng chip [AGENTS.md] — deferred: sửa file agent-context, làm qua `bmad-project-context`
- [X] [Review][Defer] (low) Retro Epic 4 F1 (phép ghi chen giữa `readAll`/`replaceAll`) chỉ được nhắc ở §4.4 bản đề xuất, chưa vào Story 7.1 của `epics.md` [_bmad-output/planning-artifacts/epics.md] — deferred: sửa tài liệu kế hoạch của story khác; người viết spec 7.1 phải đọc §4.4

**Rejected (15):**

- README mục 36 nói "đã lái bốn đường": `false`. "Tab ra mẩu kế" có ca sẵn ở `thu-bo-cuc` ~909 (triage #15), còn `Esc` về `xóa` đã có ca hộp 5.3.
- Spine `:143`, PRD `:521` còn "tám ngày": `low`. Spec đã chốt để nguyên văn xuôi (triage #13).
- epics 7.0 không liệt kê các đổi hành vi khác (mẩu mất → `#o-soan`, `go` đặt tiêu điểm, rỗng không ghi): `low`. Đó là chính các hàng của Matrix, đã ghi trong spec.
- Ca "rời TRƯỚC" đếm 10 microtask: `low`. Chỉ ở test; nếu gãy thì đỏ to, không xanh giả.
- Quét import view-sang-view bỏ lọt thư mục con, template literal, đường tuyệt đối: `low`. `app/view/` phẳng, các dạng đó là giả định; triage #3 đã nới.
- Test `TOO_LONG_TU_FILE` đếm lần nhắc chứ không đếm chỗ phát: `low`. Dương tính giả thì đỏ to, còn đường alias là giả định; `readdirSync` recursive đã dùng ở ca 6.4.
- Khẳng định khoảng trắng mỏng (`.not.toBe('  ')`): `false`. `kho.nhatKy` `toEqual([])` ngay trên đã ghim "không `put`".
- `noiLuongXoa.xoa` neo tường minh kéo tiêu điểm về: `low`. Có từ `traTieuDiem` (5.3), triage #12.
- Hai ca `banner.test.js` lấy tên hàm vẽ từ hai nguồn: `false`. Không có tác hại cụ thể nào.
- `veSauChot` xóa điều kiện lần hai trong khe `commitDraft`: `low`. Khe dài vài ms, và sửa phải đổi mục đã đóng băng (triage #16); chú thích được sửa ở Patch #3.
- Story 7.0 tách thành hai commit: `low`. Sửa thì phải viết lại lịch sử `main` đã push.
- Triage Log hàng 7 ghi `defer` nhưng AGENTS.md đã sửa: sửa là đổi chính spec đang review.
- Nhánh rỗng chỉ tắt `TOO_LONG_KHI_SUA`, `QUOTA` ở lại: `low`. Dải băng tắt ở phép ghi thành công kế tiếp (kể cả lần xóa khi rời), đúng AD-8, và có ca ghim.
- Spec `done` trong khi sprint-status là `review`: không cần sửa riêng, bước đồng bộ trạng thái của review này tự lo.
- Không test nào đếm lời gọi `.focus(` trong `main.js`: `low`. Thêm bộ quét là thêm một luật mới; Patch #2 sửa lời khẳng định.

## Implementation Notes

- `veGiuTieuDiem` tách ba helper nội bộ (`neoTuTieuDiem`, `mauTheoId`, `phanTuTheoVai`); vai trò đọc bằng `closest(CHON_XOA)` / `closest(CHON_SUA)`, còn lại là thân. Neo `'xoa'` mà nút không còn thì lấy thân (spec chỉ nói rõ đường lui cho `'sua'`).
- `tuLuuNoiDung` nhánh rỗng: `datLai` chung với nhánh thường (seq tăng), rồi `return Promise.resolve()` trước `henGhiDiSau`. Đặt SAU nhánh trần để chữ toàn khoảng trắng vượt trần vẫn ra dải băng như cũ. Ca cũ "gõ tới rỗng … autosave vẫn ghi bình thường" trong `core-state.test.js` được đàm phán lại có ghi chép (giờ ghim "không ghi gì").
- `veSauChot` gọi `xoaHetDieuKienVaNhap()` → `store.xoaHetDieuKien()` chạy lần hai sau `chotBanNhap`; vô hại khi điều kiện đã rỗng. Khe đua lý thuyết: gõ từ khóa mới vào ô tìm trong đúng khe `commitDraft` đang bay sẽ bị xóa lần hai.
- Đường vẽ lại của `mocSua.go` (`tuLuuNoiDung(...).then(...)`) ban đầu không đi qua `veGiuTieuDiem`: rời ô sửa của một kết quả tìm TRƯỚC khi hẹn `AUTOSAVE_MS` nổ thì lượt vẽ của `put` gỡ mẩu và tiêu điểm rơi về `<body>` — trái hàng "Sửa kết quả tìm tới hết khớp" của Matrix. Audit bước 3 sửa: `go` treo `() => veGiuTieuDiem(document, veTatCa)` (neo `undefined`; lúc đang gõ, lưới gác nên tiêu điểm ở lại ô sửa); `test/luoi.test.js` ghim chỗ cắm, hành vi neo `undefined` + mẩu mất đã chạy thật ở `giu-tieu-diem.test.js`.
- `thu-bo-cuc`: khối mới đặt cuối file, chốt 4 mẩu thật và dọn theo `id`; 91/92, ca đỏ duy nhất là "tải lại: mọi mẩu về thu gọn" (128 → 106) đã biết.

## Spec Change Log

## Review Triage Log

| #  | Nguồn            | Phát hiện                                                                                                                                          | Verdict     | Bằng chứng                                                                                                                                                                                      | Route  |
| -- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1  | vgap, blind, edge | Đường`go` → `veGiuTieuDiem` (rời ô sửa trước `AUTOSAVE_MS`) không có ca chạy thật, chỉ regex                                     | medium      | Ca "Sửa kết quả tìm" của`giu-tieu-diem.test.js` nối `go` là `.then(c.veTatCa)` và đợi autosave trước Shift+Tab; `thu-bo-cuc` cũng đợi `put`                              | patch  |
| 2  | blind, edge       | Dán quá trần rồi xóa sạch: dải`TOO_LONG_KHI_SUA` đứng trên ô rỗng                                                                      | medium      | Nhánh rỗng trả về trước`henGhiDiSau`, nên không `put` thành công nào tắt dải; trước đây `put('')` tắt nó — trái mục Never "không đổi hành vi nhìn thấy được" | patch  |
| 3  | blind, edge       | Quét import view-sang-view bỏ lọt nháy kép,`import()` động, `'../view/'`                                                                  | low         | Regex chỉ bắt`from './x.js'` nháy đơn; sửa là nới một regex                                                                                                                            | patch  |
| 4  | edge              | `finally` của khối 7.0 trong `thu-bo-cuc` gọi `xoaGhiChu(null)` khi throw sau lượt tra id                                                 | low         | `id[khoa]` được gán `null` rồi mới throw; `Object.values(id)` mang `null` vào `xoaGhiChu`, ném trong `finally`, bỏ qua tắt focus-emulation                                  | patch  |
| 5  | blind             | epics.md và bản đề xuất nói "hai ca đỏ đã biết", AGENTS.md chỉ có một                                                                  | low         | AGENTS.md chỉ liệt kê "tải lại: mọi mẩu về thu gọn"; sửa là đổi chữ                                                                                                                 | patch  |
| 6  | blind             | Front-matter bản đề xuất còn "chờ xác nhận ba quyết định"                                                                                 | low         | §4.3 có bốn, và cả bốn đã làm theo spec 7.0 đã duyệt; sửa là đổi chữ                                                                                                             | patch  |
| 7  | blind             | AGENTS.md còn ghi "`app/adapters/` không có test tự động"                                                                                    | low         | Có thật:`test/adapter-file-io.test.js`, `test/adapter-session-store.test.js` tồn tại; sửa chạm file agent-context                                                                       | defer  |
| 8  | edge              | `luoi.js` `khiClick` (Enter trên mẩu bị cắt) `batTatMoRong` + `ve()` cục bộ có thể gỡ thân đang focus, trái luật AGENTS.md mới | maybe-false | Có từ Story 2.5, không do story này; cần chạy trình duyệt xem`Enter` mở rộng có rơi tiêu điểm về `<body>` không. Nếu thật: medium                                          | defer  |
| 9  | blind             | Chuỗi rỗng + xóa hỏng:`chuDangCho` giữ `''` trong khi lưới hiện chữ cũ                                                                 | low         | Chỉ ở đường`remove` hỏng (đã có dải băng lỗi); lưới hiện đúng chữ đang nằm trong kho, mở lại thấy chữ mới nhất, rời lần nữa thử xóa lại                         | reject |
| 10 | blind             | Diff thêm regex mới vào`main.js` dù AC nói thay regex                                                                                         | false       | Task spec ghi rõ "Regex nối dây giữ lại"; chỉ regex vào THÂN hàm tiêu điểm bị thay bằng test chạy thật                                                                            | reject |
| 11 | blind             | AC B4 của 7.1 kéo theo việc UX chưa ghi                                                                                                          | false       | AC ghi rõ "Chọn cách xử lý và microcopy trong spec 7.1"; không thuộc mã 7.0                                                                                                              | reject |
| 12 | blind             | `noiLuongXoa.xoa` kéo tiêu điểm về khi người dùng đã Tab đi trong lúc xóa đang bay                                                   | low         | Hành vi có từ`traTieuDiem` cũ (Story 5.3); khe là một phép `remove` IndexedDB                                                                                                          | reject |
| 13 | blind             | Spine`:143` và PRD `:521` còn "tám ngày"                                                                                                     | low         | Spec đã chốt để nguyên văn xuôi: spine nói lý do cần phép trừ ngày, PRD là hành trình người dùng, không phải nguồn microcopy                                               | reject |
| 14 | blind             | Loại commit`chore:` giấu một sửa lỗi hành vi                                                                                                 | low         | Loại do bản đề xuất ấn định; thân commit sẽ nêu lỗi Shift+Tab và nhánh chữ rỗng                                                                                                   | reject |
| 15 | blind             | README mục 36 nói`thu-bo-cuc` lái cả "Tab ra mẩu kế"                                                                                         | false       | Ca có sẵn "`Tab` ra khỏi ô sửa: tiêu điểm KHÔNG rơi về " (`thu-bo-cuc.mjs` ~909) lái đúng đường đó                                                                         | reject |
| 16 | vgap (other)      | `veSauChot` xóa điều kiện lần hai sau `commitDraft`, từ khóa gõ trong khe ghi bị xóa                                                   | low         | Khe là một transaction IndexedDB (vài ms); sửa đòi đổi mục đã đóng băng (veSauChot gọi hàm chung)                                                                                 | reject |

## Verification

**Commands:**

- `npm test` -- expected: xanh.
- `npm run thu-bo-cuc` -- expected: khối mới xanh; đỏ nếu có chỉ ở ca AGENTS.md đã biết.
