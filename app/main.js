// Bootstrap — điểm vào duy nhất của ứng dụng.
//
// Đây là file DUY NHẤT trong repo được phép import từ `app/adapters/`.
// Mọi module khác dưới `app/` chỉ nói chuyện qua `app/ports/`; `core/` và
// `ports/` là thuần, không chạm `window` / `document` / `indexedDB` /
// `localStorage` / `BroadcastChannel`.
//
// Chưa nối gì ở Story 1.1: các module core, port và adapter thuộc Story 1.2–1.8.
