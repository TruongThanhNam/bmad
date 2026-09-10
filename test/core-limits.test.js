import { describe, expect, it } from 'vitest';
import * as limits from '../app/core/limits.js';

// Giá trị được viết lại bằng số literal ngay trong test: nếu ai đó sửa `limits.js`,
// test phải đỏ, chứ không phải "so một hằng với chính nó".
const MONG_DOI = {
  MAX_NOTE_CHARS: 20000,
  MAX_RESULTS: 50,
  COLLAPSED_LINES: 3,
  BACKUP_NUDGE_DAYS: 7,
  BACKUP_NUDGE_DAYS_PERSIST_DENIED: 3,
  AUTOSAVE_MS: 400,
  DRAFT_BEAT_MS: 10000,
  DRAFT_STALE_MS: 30000,
  QUOTA_WARN_RATIO: 0.8,
  QUOTA_WARN_FREE_BYTES: 52428800,
  LOCAL_STAMP_CHARS: 19,
  LOCAL_DATE_CHARS: 10,
  UTC_NOON_HOUR: 12,
  MS_PER_DAY: 86400000,
};

// `APP_VERSION` cố tình KHÔNG bị ghim giá trị: README bắt bump nó ở mọi lần deploy, nên
// ghim con số là biến mỗi lần deploy thành một lần suite đỏ — và một test đỏ theo lịch là
// một test sắp bị ai đó nới lỏng. Chỉ ghim tên và định dạng.
const TEN_KHONG_GHIM_GIA_TRI = ['APP_VERSION'];

describe('core/limits.js', () => {
  it('xuất ra ĐÚNG tập tên mong đợi — thừa một tên cũng đỏ', () => {
    expect(Object.keys(limits).sort()).toEqual(
      [...Object.keys(MONG_DOI), ...TEN_KHONG_GHIM_GIA_TRI].sort(),
    );
  });

  for (const [ten, giaTri] of Object.entries(MONG_DOI)) {
    it(`${ten} = ${String(giaTri)}`, () => {
      expect(limits[ten]).toBe(giaTri);
    });
  }

  it('QUOTA_WARN_FREE_BYTES đúng 50 MB', () => {
    expect(limits.QUOTA_WARN_FREE_BYTES).toBe(50 * 1024 * 1024);
  });

  it('APP_VERSION là chuỗi dạng x.y.z — AD-21 chỉ so bằng nhau', () => {
    expect(typeof limits.APP_VERSION).toBe('string');
    expect(limits.APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
