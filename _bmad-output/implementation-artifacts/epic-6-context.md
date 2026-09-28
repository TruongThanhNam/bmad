# Epic 6 Context: Tra cứu — UJ-2

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Epic này dựng **con đường duy nhất tới mọi thứ cũ hơn hôm nay**: tìm bằng chữ (bỏ dấu, không phân
biệt hoa/thường) trên toàn bộ dữ liệu, lọc theo đúng một ngày, và luôn thấy rõ mình đang lọc theo gì
cùng một đường về hôm nay trong một thao tác. Hành trình đích là Nam tìm lại một ghi chú khi có người
đang đứng chờ — nên tra cứu phải chạy đồng bộ trong RAM, trả kết quả ngay, và không bao giờ biến
thành màn hình "xem tất cả" mà sản phẩm cố ý không có.

## Stories

- Story 6.1: Tìm bằng chữ trên toàn bộ dữ liệu
- Story 6.2: Lọc theo một ngày cụ thể
- Story 6.3: Khối điều kiện, hàng chip, và đường về
- Story 6.4: Trần kết quả và hiệu năng tra cứu

## Requirements & Constraints

- **Ô tìm kiếm và ô ngày luôn có mặt**, không phải mở ra mới dùng.
- **Tìm trên toàn bộ ghi chú**, không bị giới hạn bởi khung nhìn đang hiện; lọc dần theo từng ký tự,
  không cần `Enter`. Gõ `phan quyen` phải khớp `Phân quyền`.
- **Lọc ngày chọn đúng một ngày**, không khoảng ngày, **không mốc nhanh** kiểu "hôm nay / 7 ngày qua".
- **Kết hợp hai điều kiện là phép giao.** Có điều kiện thì "hôm nay" không tham gia phép giao.
- **Bảng mô hình trạng thái sáu dòng phải khớp:** mở app → hôm nay · gõ từ khóa → toàn bộ khớp ·
  chọn ngày → ngày đó · cả hai → giao · gõ vào ô soạn thảo → xóa hết điều kiện, về hôm nay · xóa hết
  điều kiện → hôm nay.
- **Gõ vào ô tìm kiếm không xóa bộ lọc ngày**; xóa hết chữ trong một ô = bỏ đúng điều kiện đó.
- **Tải lại trang xóa mọi điều kiện** — điều kiện là state tạm, không ghi xuống kho bền.
- **Trần kết quả:** tối đa `MAX_RESULTS` (50) mẩu; không khung nhìn nào trả danh sách dài vô hạn.
- **Hiệu năng:** với 2.000 ghi chú, kết quả trả về ≤ 200 ms.
- Kết quả xếp mới nhất trên cùng.

## Technical Decisions

- **Khối điều kiện là MỘT giá trị** trong state: `{ keyword: string | null, date: 'yyyy-MM-dd' | null }`.
  Khung nhìn mặc định là `{null, null}` — vắng mặt điều kiện, không phải điều kiện "hôm nay". Chỉ
  `datDieuKien(partial)` đổi khối này, chỉ `xoaHetDieuKien()` đưa về `{null, null}`. Không chỗ nào
  khác trong view giữ một nửa bộ điều kiện. `chotGhiChu` đã gọi `xoaHetDieuKien()` từ Epic 2.
- **`core/query.js`** lọc theo điều kiện, tự lọc `localDate` hôm nay khi và chỉ khi cả hai trường
  `null`, và trả `{ items, total }`: `items` đã cắt còn `MAX_RESULTS`, `total` là số khớp thật. View
  **luôn dùng `total`** cho hàng chip và dòng "còn nhiều hơn", cấm đếm `items.length`.
- **Tìm và lọc là quét mảng đồng bộ trong RAM** trên `textFolded` và `localDate` — không chạm
  IndexedDB, không truy vấn bất đồng bộ theo từng phím.
- **Bỏ dấu dùng đúng `fold()`** cho cả chuỗi tìm lẫn `textFolded` đã lưu. `fold` giữ nguyên độ dài
  và vị trí ký tự, nên vị trí khớp trên `textFolded` dùng thẳng được để tô trên `text`.
- **Lọc ngày là so chuỗi trên `localDate`**, không dựng `Date`. Sắp xếp theo `localStamp`. Chuỗi
  `dd/MM/yyyy` được chuyển sang `yyyy-MM-dd` qua module thời gian.
- **Ngày gõ dở hoặc sai định dạng:** `date` trong state giữ giá trị cũ, lưới không đổi; lỗi là lỗi
  tại chỗ của view, **không đi qua dải băng**.
- Mọi ngưỡng ở `limits.js`; mọi màu lấy từ token; view chỉ đọc state và phát action.

## UX & Interaction Patterns

- **Khay tìm kiếm** (tầng 2) nền `{colors.chip-bg}` sẫm hơn nền bàn; nhãn chữ `tìm` + ô placeholder
  `từ khóa`; nhãn `ngày` + ô rộng 118px, monospace, placeholder `dd/MM/yyyy`. Vật liệu, nhãn và vị
  trí phải tách rõ khay tìm với ô soạn thảo.
- **Icon lịch** ở mép phải ô ngày: inline SVG 16px, stroke `{colors.ink-2}` — **icon duy nhất của sản
  phẩm**. Mở picker chọn một ngày, chọn xong đóng và điền vào ô. Gõ tay là đường chính.
- **Ngày sai:** viền `{colors.danger}` **cộng** chữ `Ngày phải viết dd/MM/yyyy, ví dụ 03/09/2026.`
  ngay dưới ô (không dùng màu làm tín hiệu duy nhất).
- **Kết quả:** phần khớp tô nền `{colors.hl}`, chữ giữ `{colors.ink}`; mốc thời gian hiện đầy đủ
  `dd/MM/yyyy HH:mm` (khung nhìn mặc định vẫn `HH:mm`).
- **Hàng chip (tầng 2b)** chỉ hiện khi có điều kiện: một chip mỗi điều kiện + số kết quả (`1 ghi chú`,
  `0 ghi chú`…) + link `về hôm nay`. Chip chỉ để nhìn, **không bấm được để xóa**.
- **Khi có điều kiện**, placeholder ô soạn thảo đổi thành `gõ vào đây sẽ bỏ mọi điều kiện lọc` —
  ngoại lệ duy nhất của quy tắc placeholder trống.
- **Không có kết quả:** ba dấu hiệu cùng lúc — chip ghi `0 ghi chú`, dòng `Không có ghi chú nào
  khớp.` trong lưới, link `về hôm nay` vẫn còn. Chỗ duy nhất lưới trống được nói chữ.
- **Vượt trần:** 50 mẩu + dòng dưới lưới `Hiện 50 ghi chú đầu, còn nhiều hơn. Thêm bộ lọc ngày hoặc
  gõ thêm chữ để thu hẹp.`
- **Thứ tự tab:** ô soạn thảo → ô tìm kiếm → ô ngày → icon lịch → link `về hôm nay` (nếu có) → các
  mẩu giấy. Không phím tắt nào vào ô tìm (không `/`, không `Ctrl+K`); không `aria-live` cho kết quả.
- Tĩnh tuyệt đối: không transition/animation/hover-only.

## Cross-Story Dependencies

- **Với Epic 1:** `fold`, `textFolded`, `localDate`/`localStamp`, `MAX_RESULTS`, `core/state.js` và
  mô hình bản ghi đã có; epic này dùng lại, không tính nhánh riêng.
- **Với Epic 2:** lưới, `query.js` khung nhìn mặc định và việc `chotGhiChu` xóa điều kiện đã dựng;
  6.3 chỉ làm hành vi đó quan sát được.
- **Với Epic 5:** sửa tại chỗ phải chạy y hệt trong khung nhìn kết quả tìm và lọc ngày — kiểm lại
  kịch bản này khi epic xong.
- **Trong epic:** 6.3 đứng trên 6.1 và 6.2 (giao hai điều kiện, chip); 6.4 định hình `{items, total}`
  mà chip của 6.3 dùng số.
