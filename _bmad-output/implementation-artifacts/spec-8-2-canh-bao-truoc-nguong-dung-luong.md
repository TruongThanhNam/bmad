---
title: 'Story 8.2 — Cảnh báo trước ngưỡng dung lượng'
type: 'feature'
created: '2026-09-28'
status: 'done'
route: 'dispatch'
baseline_commit: '22d2ea75f8491f5b11f0841558cbe7026a36cb1b'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-8-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Nam chỉ biết kho đầy khi phép ghi đã hỏng (`QUOTA`, hàng 2). Hàng 7 `DUNG_LUONG_SAP_HET` cùng câu chữ, hai hằng `QUOTA_WARN_*` và `quota.estimate` (adapter thật) đã có sẵn nhưng chưa ai phát.

**Approach:** Lần kiểm TÁCH khỏi lời hứa của action ghi (Q4). Bốn nhánh ghi THÀNH CÔNG (chốt, tự lưu sửa, nạp file, xóa — Q6) chỉ bật một cờ closure `canKiem`; action ghi resolve như hôm nay, không chờ gì thêm. Action công khai mới `kiemDungLuong()`: không có `canKiem` thì no-op; có thì tắt cờ, đọc `ports.quota.estimate()`, và `used/limit ≥ QUOTA_WARN_RATIO` **hoặc** `limit − used < QUOTA_WARN_FREE_BYTES` thì `datLai({ banner: LOAI_BANG.DUNG_LUONG_SAP_HET })` (phép gác ưu tiên sẵn có lo phần "không đè hàng cao hơn"). `main.js` nối `kiemDungLuong()` rồi một lượt vẽ giữ tiêu điểm SAU lượt vẽ sẵn có của các đường đó.

## Boundaries & Constraints

**Always:** Phép so là hàm THUẦN trong core (`vuotNguongDungLuong({used, limit})` trong `core/state.js`). `kiemDungLuong` không bao giờ reject: cổng ném đồng bộ/reject → nuốt; cổng treo thì lời hứa treo, vô hại vì không gì chờ nó ngoài một lượt vẽ. Chỉ đọc → không gọi `estimate`. Ghi hỏng → không bật `canKiem`. Mọi số ở `limits.js`. Bump `APP_VERSION` 0.7.6 → 0.7.7. Một commit tiếng Việt.

**Never:** `estimate()` không bao giờ quyết định có ghi hay không. Action ghi không bao giờ chờ `estimate`. Không con số phần trăm trong câu. Không nguồn dải băng mới, không khóa `localStorage` mới, không trường state mới, không cơ chế subscribe. Không test tự động cho `adapters/quota.js`. Không kiểm sau ghi bản nháp, theme, nhịp tim, xuất sao lưu (xuất không giải phóng chỗ).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Vế tỉ lệ | chốt OK, `kiemDungLuong`, used 80, limit 100 | banner `DUNG_LUONG_SAP_HET` | N/A |
| Vế byte trống | sửa OK, limit 10 GB, trống 49 MB | banner `DUNG_LUONG_SAP_HET` | N/A |
| Dưới cả hai | trống 51 MB, tỉ lệ 0.5 | hàng 7 đang hiện (nếu có) → `null`; hàng khác không chạm | N/A |
| Biên | tỉ lệ đúng 0.80; trống đúng 50 MB | 0.80 → cảnh báo; đúng 50 MB → không | N/A |
| Số dị | `null`, `undefined`, thiếu trường, `NaN`/`Infinity`, âm, `limit 0` | không cảnh báo; `used > limit` hữu hạn → cảnh báo | N/A |
| Cổng hỏng | `estimate` ném / reject | banner không đổi, lời hứa resolve | nuốt |
| Không ghi gì | `kiemDungLuong` gọi khi `canKiem` tắt (ghi hỏng, `put` bị bỏ, `readAll` reject, file hỏng, bấm Hủy, chốt rỗng/quá trần) | `estimate` KHÔNG được gọi | N/A |
| Ghi hỏng thật | commit/put/replaceAll reject `QUOTA` | banner `QUOTA` (hàng 2, không đóng được) | đường AD-8 sẵn có |
| Chốt không chờ | chốt OK, `estimate` treo | lời hứa `chotGhiChu` resolve ngay sau ghi; ô soạn trống ngay; `Ctrl+Enter` lần hai chốt được | N/A |
| Sau nạp | nạp OK → hàng 6, vượt ngưỡng | `estimate` VẪN gọi; hàng 7 bị gác từ chối, hàng 6 ở lại | N/A |
| Chỉ đọc | `chiDoc` bật trước `kiemDungLuong` / trước khi `estimate` về | không gọi / không đổi banner | N/A |
| Đóng rồi ghi tiếp | Nam bấm `✕` trên hàng 7, rồi chốt/sửa khi vẫn vượt | không hiện lại tới hết phiên; `estimate` KHÔNG được gọi | N/A |
| Đóng giữa lúc `estimate` bay | hàng 7 hiện, chốt, `✕`, rồi `estimate` về vượt | không hiện lại | N/A |
| Đóng hàng khác | hàng 7 bị hàng cao hơn đè, Nam đóng hàng đó | cờ đóng KHÔNG bật; lần kiểm sau vẫn cảnh báo | N/A |
| Kết quả cũ | lần kiểm 1 về (vượt) SAU lần kiểm 2 (dưới) | lần 1 bị bỏ; banner theo lần 2 | N/A |
| Không tắt khi ghi (Q3) | hàng 7 hiện, ghi bản nháp/xóa/theme/sửa OK | hàng 7 VẪN hiện | N/A |
| Kiểm lỗi (Q3) | hàng 7 hiện, `estimate` ném/`null` | hàng 7 VẪN hiện (không biết ≠ dưới ngưỡng) | nuốt |
| Tải lại sau khi đóng | trang tải lại, lần chốt đầu vượt | hiện lại | N/A |
| Xóa giải phóng chỗ (Q6) | hàng 7 hiện, xóa qua hộp thoại OK, `estimate` dưới ngưỡng | banner `null` | N/A |
| Xóa vẫn vượt (Q6) | xóa OK, vẫn vượt | hàng 7 vẫn/lại hiện (trừ khi `daDongCanhBao`) | N/A |
| Xóa hỏng | `remove` reject | `canKiem` không bật; banner theo AD-8 | N/A |
| Xuất sao lưu | hàng 7 hiện, xuất OK | hàng 7 VẪN hiện (xuất không giải phóng chỗ) | N/A |
| Tiêu điểm trên `✕` (Q5) | tiêu điểm ở nút `✕` hàng 7, lần kiểm tắt hàng 7 | tiêu điểm về `#o-soan`, không rơi về `<body>` | N/A |

**Quyết định:** Q1 — B: đã bấm `✕` trên hàng 7 thì im tới hết phiên. Cờ closure `daDongCanhBao`, không trường state, không khóa `localStorage`; chỉ bật khi `dongDaiBang` đóng đúng `DUNG_LUONG_SAP_HET`. `QUOTA` thật vẫn luôn hiện. Q2 — vẫn kiểm sau nạp dù hàng 6 luôn thắng; không kiểm lại khi đóng hàng 6. Q3 (party-mode 2026-09-28) — hàng 7 MIỄN khỏi luật "ghi thành công thì tắt dải băng": cả ba chỗ đặt `banner: null` khi ghi OK (`ghiTruocDatSau`, nhánh put OK của `henGhiDiSau`, `ghiBanNhap`) giữ nguyên `DUNG_LUONG_SAP_HET`; nó chỉ tắt khi lần kiểm đo dưới ngưỡng, khi Nam bấm `✕`, hoặc khi một hàng cao hơn thay nó. Q4 (party-mode 2026-09-28) — TÁCH lần kiểm khỏi lời hứa action, chịu đổi `main.js`: chờ `estimate` trước khi ô soạn làm trống mở rộng khe sinh ghi chú trùng (gõ tiếp trong lúc chờ → bản nháp giữ chữ đã chốt). Q5 (review 2026-09-28) — lượt vẽ sau lần kiểm: tiêu điểm đang nằm trong dải băng thì neo `null` (về `#o-soan`), ngược lại neo `undefined`; qua `veGiuTieuDiem`, không tự `focus()`. Q6 (review 2026-09-28) — xóa thành công cũng bật `canKiem`, để xóa đủ thì cảnh báo tự tắt; xuất sao lưu không kích kiểm.

</frozen-after-approval>

## Code Map

- `app/core/state.js`:
  - Closure mới cạnh `dangNap` (415): `canKiem = false`, `daDongCanhBao = false`, `soLanKiem = 0`.
  - Bật `canKiem = true` ở ba nhánh thành công: `themGhiChu` trong `if (daChot)` (1365); `henGhiDiSau` nhánh put OK (735–739, trước `xong()`); `napSaoLuu` sau `if (!daGop) return;` (1298), cạnh `baoGhiChuDoi()` (1303); `xoaGhiChu` trong `if (daXoa)` (1469, Q6). Không nơi nào khác. Xóa do rời sửa với chữ rỗng (`roiCheDoSua`) cũng đi qua `xoaGhiChu` nên bật cờ, nhưng KHÔNG nối `kiemRoiVe` ở đó (lượt vẽ hoãn `setTimeout` của `roiSuaRoiVe`, 315–330, không được đụng) — cờ chờ lần `kiemRoiVe` kế; chấp nhận. `go` resolve cả ở nhánh không ghi (quá trần, rỗng, chỉ đọc, seq cũ, mẩu mất) — ở đó cờ không bật nên `kiemDungLuong` no-op.
  - `kiemDungLuong()` — public, export trong `Object.freeze` cuối tệp, KHÔNG vào `ACTION_GHI` (chỉ gọi `quota.estimate`, đã ở `CONG_DOC` của `test/core-state-chi-doc.test.js:44`). Thứ tự: `if (chiDoc || !canKiem || daDongCanhBao) return Promise.resolve()` → `canKiem = false` → `const so = ++soLanKiem` → gọi cổng trong `try` (ném → resolve) → `Promise.resolve(kq).then(ok).catch(() => {})` (`.catch` SAU để nuốt cả lỗi ném trong `ok` — getter ném, `datLai` ném); viết dạng `  function kiemDungLuong(` bên trong `taoStore` (regex `test/core-state-chi-doc.test.js:348`); trong `ok`: nếu `chiDoc || daDongCanhBao || so !== soLanKiem` thì bỏ; `vuotNguongDungLuong(kq)` → `datLai({ banner: DUNG_LUONG_SAP_HET })`; ngược lại, CHỈ khi số liệu hợp lệ (xem hàm thuần) và `noiBo.banner === DUNG_LUONG_SAP_HET` → `datLai({ banner: null })`.
  - `export function vuotNguongDungLuong({used, limit})` ở CẤP MODULE cạnh `ACTION_GHI`, KHÔNG vào khối export của store (`test/core-state-chi-doc.test.js:372–374` đòi mọi tên trong đó là hàm bên trong `taoStore`) — cần phân biệt "không biết" với "dưới ngưỡng": trả `true`/`false`/`null` (`null` = số không hợp lệ: không phải số hữu hạn, `used < 0`, `limit ≤ 0`, đối số không phải object). `true` khi `used/limit ≥ QUOTA_WARN_RATIO || limit − used < QUOTA_WARN_FREE_BYTES`. Không literal số nào ngoài `0` (bộ quét `test/nguong-tap-trung.test.js`).
  - Q3: helper `tatSauKhiGhi()` → `{}` khi `noiBo.banner === LOAI_BANG.DUNG_LUONG_SAP_HET`, ngược lại `{ banner: null }`; thay `banner: null` ở `ghiTruocDatSau` (685: `datLai({ ...dungNhanh(), ...tatSauKhiGhi() })`, tính LÚC ghi xong), `henGhiDiSau` (737), `ghiBanNhap` (1629: `if (tatDaiBang) datLai(tatSauKhiGhi())`). Nhánh chữ rỗng của `tuLuuNoiDung` (1539) không đổi. Sửa các chú thích nói "ghi thành công tắt dải băng" cho đúng Q3: `state.js:588–590`, `679–680`, `734`, `core/banner.js:84–86`; thêm một dòng ngoại lệ hàng 7 cạnh AD-8 trong `ARCHITECTURE-SPINE.md`.
  - `dongDaiBang` (594): trước `datLai`, nếu `dangHien === DUNG_LUONG_SAP_HET` thì `daDongCanhBao = true`.
- `app/main.js` — một helper DUY NHẤT gần `dongRoiVe` (381): `const kiemRoiVe = () => store.kiemDungLuong().then(() => veGiuTieuDiem(document, veTatCa, tieuDiemTrongDaiBang() ? null : undefined));` (Q5). `tieuDiemTrongDaiBang()` đọc `document.activeElement?.closest(<selector gốc dải băng>)` — lấy selector đúng từ `view/banner.js`/`index.html`, chuỗi trùng có ý thức kiểu `'o-soan'` (main.js:379). Gọi SAU lượt vẽ sẵn có ở BỐN chỗ (Q6), viết ĐÚNG dạng: `go` (340) → `store.tuLuuNoiDung(id, text).then(() => veGiuTieuDiem(document, veTatCa)).then(() => kiemRoiVe());` (giữ nguyên chuỗi mà `test/luoi.test.js:688–690` ghim; cấm dạng `.then(kiemRoiVe)`); `veSauChot` (484–487) → thêm `kiemRoiVe();` cuối thân (qua `luoi.test.js:613`, `736`); `napRoiVe` (398) → `() => { veTatCa(); kiemRoiVe(); }` và nới regex `test/chan-trang-hai-link.test.js:286–288` nhận dạng này. Xóa qua hộp thoại: `noiLuongXoa` (228, export, có test) nhận tham số thứ năm tùy chọn `sauKhiXoa = () => {}`, gọi sau `veGiuTieuDiem` ở 262 (`.then(() => veGiuTieuDiem(goc, veTatCa, neo)).then(() => sauKhiXoa())`); `main.js` truyền `() => kiemRoiVe()`. Không lỗi TDZ: mọi chỗ chỉ chạm `kiemRoiVe` lúc chạy. Không gọi ở `roiCheDoSua` (315): đường đó chỉ xóa. Không gọi lúc khởi động. Test quét mã nguồn (sau `boChuThichJs`): `kiemDungLuong(` xuất hiện đúng một lần trong `main.js`, `kiemRoiVe(` đúng bốn lần.
- `test/banner.test.js:686–707` ("các nguồn chưa tới KHÔNG có code phát") — gỡ `DUNG_LUONG_SAP_HET` khỏi danh sách cấm cho `core/state.js`; thay bằng ca ghim hẹp theo khuôn hàng 6: `banner: LOAI_BANG.DUNG_LUONG_SAP_HET` xuất hiện đúng một lần, trong `kiemDungLuong`.
- `app/core/banner.js`, `app/adapters/quota.js`, `app/ports/quota.js`, `app/view/*` — KHÔNG đổi.
- `app/core/limits.js` — chỉ `APP_VERSION` 0.7.7 (không hằng timeout).
- `test/core-state-dung-luong.test.js` — MỚI: một ca mỗi dòng I/O Matrix (cổng giả + nhật ký cổng, lời hứa nhả bằng tay), bảng giá trị cho `vuotNguongDungLuong`, ca quét `main.js`. Thêm: hai lần ghi OK trước một lần kiểm → `estimate` gọi đúng một lần; vượt ngưỡng khi hàng 2–5 đang hiện → bị gác, và hàng đó tắt sau thì hàng 7 không tự hiện (đợi lần ghi-rồi-kiểm kế); `estimate` trả object có getter ném → không reject. Dòng "Chốt không chờ" kiểm ở tầng store (lời hứa `chotGhiChu` resolve khi `estimate` còn treo) — ô soạn trống ngay thì kiểm bằng checklist README.
- Test hiện có: `KHOA_...`/danh sách export của store nếu có test ghim (grep `Object.keys(store` trong `test/`); `test/core-state-chi-doc.test.js` — nếu ca nào gọi mọi action công khai, `kiemDungLuong` phải no-op khi chỉ đọc.
- `README.md` — checklist thủ công, hai vế tách rời: (a) vế byte: "Simulate custom storage quota" 40 MB, chốt → cảnh báo; 60 MB, dữ liệu gần rỗng → không; (b) so con số `await navigator.storage.estimate()` trong Console với quyết định của app; (c) bỏ giả lập, đĩa thật, chốt → không cảnh báo; (d) `✕` rồi chốt tiếp → không hiện lại; tải lại → hiện lại. Không request mạng.

## Tasks & Acceptance

**Execution:**
- [x] `app/core/state.js` -- cờ closure, `vuotNguongDungLuong`, `kiemDungLuong`, `tatSauKhiGhi`, bật cờ đóng trong `dongDaiBang`.
- [x] `app/main.js` -- `kiemRoiVe` (neo theo Q5), bốn điểm nối, tham số `sauKhiXoa` của `noiLuongXoa`.
- [x] `app/core/limits.js` -- `APP_VERSION` 0.7.7.
- [x] `test/core-state-dung-luong.test.js` -- ca cho mọi dòng I/O Matrix + quét `main.js`.
- [x] `test/` hiện có -- sửa chỗ bị ảnh hưởng (Q3 đổi hành vi tắt dải băng chỉ với hàng 7).
- [x] `README.md` -- mục checklist.
- [x] `sprint-status.yaml` -- khóa `8-2-cảnh-báo-trước-ngưỡng-dung-lượng` theo trạng thái build.

**Acceptance Criteria:**
- Given `npm test`, when chạy, then xanh toàn bộ, gồm quét số tập trung, `ACTION_GHI`, và ca chỉ đọc.
- Given Chromium localhost với quota giả lập 40 MB, when chốt một ghi chú, then ô soạn trống ngay và dải băng hiện đúng `Dung lượng sắp hết. Xuất sao lưu trước khi nó hết.` có nút `✕`, không lỗi console, không request mạng.

### Review Findings

Code review 2026-09-28 (vòng 2, trên `22d2ea7..5cf4de9`; bốn lớp: blind, edge, verification-gap, acceptance).

- [x] [Review][Patch] Ca store "Vế tỉ lệ" không cô lập vế tỉ lệ: `VUOT = { used: 80, limit: 100 }` chỉ trống 20 byte nên vế byte cũng bật — xóa vế tỉ lệ khỏi `vuotNguongDungLuong` thì ca này vẫn xanh. Đổi `VUOT` sang `{ used: 80 * GB, limit: 100 * GB }` (mọi ca dùng `VUOT` vẫn vượt) [test/core-state-dung-luong.test.js:34]
- [x] [Review][Patch] Ba chú thích trong `state.js` vẫn nói ghi thành công trộn `banner: null` vô điều kiện, trái Q3: khối doc `datLai` (ví dụ `{ ...dungNhanh(), banner: null }`), doc `napSaoLuu` ("helper chung trộn `banner: null`… AD-8"), chú thích `themGhiChu` ("`ghiTruocDatSau` trộn `banner: null` vào đúng một lần") — agent sau đọc dễ "sửa" `tatSauKhiGhi` về `banner: null` [app/core/state.js:537, 1345, 1451]
- [x] [Review][Defer] Q5 (neo tiêu điểm của `kiemRoiVe`/`tieuDiemTrongDaiBang`) chỉ ghim bằng regex quét mã nguồn, không ca nào chạy thật; README (d) thử bấm `✕`, không thử lần kiểm gỡ hàng 7 dưới `✕` đang giữ tiêu điểm [app/main.js:414-419] — deferred: đóng cần export một wrapper kiểu `noiLuongXoa` (bề mặt mới, spec không đòi); triage vòng 1 #12 đã reject phần test, verification-gap nộp `defer`
- [x] [Review][Defer] AGENTS.md chưa ghi hai ngoại lệ có tên mới: selector `CHON_DAI_BANG` khai trong `main.js` (có ngoại lệ trong quét tầng view của `banner.test.js`) và hàng 7 miễn khỏi "ghi thành công tắt dải băng" (Q3) [AGENTS.md] — deferred: sửa file ngữ cảnh agent; nối tiếp triage vòng 1 #14, để cho lần refresh `bmad-project-context`

**Rejected (vòng 2):**

- `false`/đã xử — `kiemRoiVe` kéo tiêu điểm khỏi `✕` của dải băng không đổi (blind, edge, verification-gap): trùng #8 vòng 1; sửa cần đổi luật vô điều kiện của Q5 đóng băng.
- `low` — `kiemRoiVe` vẽ lại cả khi `kiemDungLuong` no-op (blind): trùng #7 vòng 1.
- `low` — xóa do rời sửa chữ rỗng không kiểm; commit message "sau mỗi lần… xóa" nói hơi quá (blind, edge ×2, verification-gap): trùng #4 vòng 1, Code Map chấp nhận có chủ ý.
- `false` — hàng 7 mất tới hết phiên khi hàng cao hơn thay nó / nạp tiêu `canKiem` vô ích (blind, edge): Q2 + Q3, trùng #5/#6 vòng 1.
- `low` — lần kiểm 2 ném/reject làm kết quả lần kiểm 1 bị bỏ theo `soLanKiem` (edge): thật, nhưng cần `estimate` hỏng xen giữa hai lần gọi; banner giữ nguyên ("không biết ≠ dưới ngưỡng"); sửa thêm nhánh.
- `false` — `veGiuTieuDiem` ném trong chuỗi `kiemRoiVe` → rejection không bắt (edge): trùng #9 vòng 1.
- `false` — ca "Chỉ đọc trước khi estimate về" không bắt được thiếu gác `chiDoc` trong `.then` (acceptance): `datLai` tự bỏ khóa `banner` khi `chiDoc` (state.js:559–565), nên bỏ gác đó không sinh hậu quả nào — không có lỗi để ca này bắt.
- `false` — ghi từ tab khác không kích kiểm (blind): Code Map "Không nơi nào khác"; sửa là sửa spec.
- `low` — không hãm tần suất `estimate` khi tự lưu sửa liên tục (blind): `AUTOSAVE_MS` đã giãn nhịp, `estimate` rẻ; sửa thêm hằng + nhánh.
- `low` — test quét mã nguồn giòn theo định dạng; regex `chan-trang-hai-link` bị nới (blind): hình dạng do spec quy định; không có sai hành vi.
- `false` — README nêu kết quả không có bước (blind): dòng `{used: null}` là ghi chú mô tả, các bước (a)–(d) đều có hành động + điều quan sát.
- `low` — Matrix "Đóng rồi ghi tiếp" chỉ thử chốt không thử sửa; "Vế byte" không đếm `soLanUoc` (acceptance): gác `daDongCanhBao` nằm đầu `kiemDungLuong`, chung mọi đường; thêm ca là thêm test ngoài lỗi thật.
- `false` — `sprint-status.yaml` không có trong diff (acceptance): trùng #16 vòng 1.
- `maybe-false` → reject — số "14 chỗ đặt `banner`" trong doc `datLai` có thể lệch (acceptance): số đếm xấp xỉ có từ trước, vô hại.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| # | Nguồn | Phát hiện | Phán quyết | Bằng chứng | Đường |
|---|-------|-----------|-----------|-----------|-------|
| 1 | verification-gap | `CHON_DAI_BANG` trong `main.js` không bị test nào buộc vào `CHON_BANNER` của `view/banner.js` | medium | Quét ở `banner.test.js` gỡ đúng dòng khai trước khi quét; đổi tên class là Q5 vỡ trong im lặng | patch |
| 2 | blind | Ca "Xóa vẫn vượt (Q6)" dựa ngầm vào `t.uoc = VUOT` còn sót từ `hienHang7` | low | Đúng hiện giờ nhưng dễ vỡ khi sửa helper; sửa một dòng | patch |
| 3 | blind | Checklist README thiếu bước cho sửa/xóa/nạp và trình duyệt không có `estimate` | low | Mục (a)–(d) chỉ thử chốt và `✕`; thêm một gạch là sửa trực tiếp | patch |
| 4 | blind, edge | Xóa do rời sửa với chữ rỗng bật `canKiem` mà không kiểm; lần `kiemRoiVe` kế (kể cả chốt rỗng) mới tiêu cờ | low | Code Map đã chấp nhận có chủ ý; cái giá là một lần `estimate` thừa vô hại; sửa cần nối vào `roiSuaRoiVe` mà spec cấm | reject |
| 5 | blind | Nạp bị hàng 6 gác thì mất cảnh báo tới lần ghi kế | false | Đúng quyết định Q2 (không kiểm lại khi đóng hàng 6) | reject |
| 6 | blind, edge | Ghi bản nháp OK sau khi `QUOTA` thay hàng 7 thì về `null`, không kiểm lại | false | Q3: hàng cao hơn thay hàng 7 là một đường tắt hợp lệ; dòng Matrix "hàng đó tắt sau thì hàng 7 không tự hiện" | reject |
| 7 | blind | Mỗi lần `go` resolve giờ vẽ lại hai lần | low | Thật, nhưng `banner.ve` bỏ qua khi không đổi và lưới đã vẽ mỗi lần sẵn; sửa cần đổi giá trị trả về (bề mặt công khai) | reject |
| 8 | edge | Tiêu điểm ở `✕` của một dải băng KHÔNG đổi vẫn bị kéo về `#o-soan` khi hẹn tự lưu sửa nổ | low | Thật (`banner.ve` không chạm DOM khi không đổi), nhưng cần Nam Tab ngược tới đầu trang trong khe `AUTOSAVE_MS` sau khi rời sửa; về `#o-soan` chứ không về `<body>`; Q5 đóng băng ghi luật vô điều kiện | reject |
| 9 | edge | `veGiuTieuDiem` ném trong chuỗi `.then` → rejection không ai bắt | false | Khuôn sẵn có của `go` trước story; không chỉ ra được đường nào làm nó ném | reject |
| 10 | blind | `xoa` của `noiLuongXoa` giờ chờ `estimate`; JSDoc chưa nói | low | Đúng dạng spec quy định; không gì trong app chờ lời hứa đó; `@returns` vẫn đúng kiểu | reject |
| 11 | blind, edge | Chú thích lệch nhau về "xóa nào kích kiểm" | false | `canKiem` nói mọi lần xóa bật cờ (đúng), `kiemRoiVe` nói xóa qua hộp thoại gọi kiểm (đúng) | reject |
| 12 | blind | Hành vi Q5 chỉ ghim bằng regex, không có test chạy thật đường tự lưu sửa qua `main.js` | low | Muốn chạy thật phải tách helper export khỏi khối `document` — bề mặt mới, spec không đòi | reject |
| 13 | blind | "Chốt không chờ" không chứng minh gì | false | Ca để lần kiểm treo rồi chốt lần hai và thấy resolve — đúng thuộc tính cần ghim | reject |
| 14 | blind | Spine/`solution-design.md` chỉ ghi một dòng; AGENTS.md không nhắc ngoại lệ `CHON_DAI_BANG` | low | Dòng AD-8 đủ cho spine; phần AGENTS.md là file ngữ cảnh agent | defer |
| 15 | blind | `vuotNguongDungLuong` đặt sai module | false | Spec quy định đặt ở cấp module `core/state.js`; sửa là sửa spec | reject |
| 16 | edge | Diff không có hunk `sprint-status.yaml` | false | File nằm ngoài git; khóa đã sang `review` trên đĩa | reject |

## Design Notes

Tách bằng cờ `canKiem` thay vì truyền kết quả ghi ra `main.js`: `main.js` không biết lần ghi thành công hay hỏng, và không cần biết — `kiemDungLuong` tự no-op. Cờ gộp nhiều lần ghi thành một lần kiểm; mất một lần kiểm giữa hai lần ghi là vô hại vì mẩu vài KB không đổi kết quả phép so. `soLanKiem` chặn kết quả `estimate` cũ về sau kết quả mới.

Trên Chromium quota bám theo đĩa trống, nên thực tế vế byte mới là vế bật; giả lập quota nhỏ cũng thử vế byte, không phải vế tỉ lệ. Vế tỉ lệ chỉ ghim bằng test đơn vị.

## Verification

**Commands:**
- `npm test` -- expected: toàn bộ xanh.

**Manual checks (if no CLI):**
- Mục checklist README mới trên Chrome/Edge thật.
