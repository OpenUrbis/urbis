import { beforeEach, describe, expect, it } from "vitest";
import {
  MAX_STORED_PAGE_BACKUPS,
  PAGE_BACKUP_STORAGE_KEY,
  clearPageBackups,
  readPageBackups,
  storePageBackup,
  type PageBackupPayload,
} from "../page-backup";

class MemoryStorage implements Storage {
  private entries = new Map<string, string>();

  /** When set, `setItem` throws until the serialized value fits the budget. */
  quotaInBytes: number | null = null;

  get length() {
    return this.entries.size;
  }

  clear() {
    this.entries.clear();
  }

  getItem(key: string) {
    return this.entries.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.entries.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.entries.delete(key);
  }

  setItem(key: string, value: string) {
    if (this.quotaInBytes !== null && value.length > this.quotaInBytes) {
      throw new Error("QuotaExceededError");
    }

    this.entries.set(key, value);
  }
}

const buildPayload = (
  overrides?: Partial<PageBackupPayload>,
): PageBackupPayload => ({
  backupVersion: 1,
  generatedAt: "2026-01-01T10:00:00.000Z",
  origin: "legis:page-form",
  pageId: "page-1",
  document: { title: "Lei 1.234" },
  ...overrides,
});

describe("page-backup", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  it("stores a snapshot under the shared storage key", () => {
    const result = storePageBackup(buildPayload(), {
      storage,
      label: "Lei 1.234",
    });

    expect(result.status).toBe("stored");
    expect(result.status === "stored" && result.storedCount).toBe(1);
    expect(result.status === "stored" && result.entry.label).toBe("Lei 1.234");
    expect(storage.getItem(PAGE_BACKUP_STORAGE_KEY)).toBeTruthy();
  });

  it("returns snapshots newest first", () => {
    storePageBackup(buildPayload({ generatedAt: "2026-01-01T10:00:00.000Z" }), {
      storage,
    });
    storePageBackup(buildPayload({ generatedAt: "2026-01-03T10:00:00.000Z" }), {
      storage,
    });
    storePageBackup(buildPayload({ generatedAt: "2026-01-02T10:00:00.000Z" }), {
      storage,
    });

    expect(readPageBackups({ storage }).map((entry) => entry.savedAt)).toEqual([
      "2026-01-03T10:00:00.000Z",
      "2026-01-02T10:00:00.000Z",
      "2026-01-01T10:00:00.000Z",
    ]);
  });

  it("caps the history and reports how many snapshots were discarded", () => {
    for (let index = 0; index < MAX_STORED_PAGE_BACKUPS; index += 1) {
      storePageBackup(
        buildPayload({
          generatedAt: `2026-01-01T10:00:${String(index).padStart(2, "0")}.000Z`,
        }),
        { storage },
      );
    }

    const result = storePageBackup(
      buildPayload({ generatedAt: "2026-02-01T10:00:00.000Z" }),
      { storage },
    );

    expect(result.status === "stored" && result.storedCount).toBe(
      MAX_STORED_PAGE_BACKUPS,
    );
    expect(result.status === "stored" && result.discardedCount).toBe(1);
    expect(readPageBackups({ storage })[0].savedAt).toBe(
      "2026-02-01T10:00:00.000Z",
    );
  });

  it("drops older snapshots instead of losing the current one when the quota is exceeded", () => {
    storePageBackup(buildPayload({ generatedAt: "2026-01-01T10:00:00.000Z" }), {
      storage,
    });
    storePageBackup(buildPayload({ generatedAt: "2026-01-02T10:00:00.000Z" }), {
      storage,
    });

    const currentSize = storage.getItem(PAGE_BACKUP_STORAGE_KEY)?.length ?? 0;
    storage.quotaInBytes = currentSize;

    const result = storePageBackup(
      buildPayload({ generatedAt: "2026-01-03T10:00:00.000Z" }),
      { storage },
    );
    const stored = readPageBackups({ storage });

    expect(result.status).toBe("stored");
    expect(result.status === "stored" && result.discardedCount).toBeGreaterThan(
      0,
    );
    expect(stored[0].savedAt).toBe("2026-01-03T10:00:00.000Z");
    expect(stored.length).toBeLessThan(3);
  });

  it("reports unavailable storage instead of throwing", () => {
    const result = storePageBackup(buildPayload(), { storage: null });

    expect(result.status).toBe("unavailable");
    expect(readPageBackups({ storage: null })).toEqual([]);
  });

  it("ignores corrupted storage content", () => {
    storage.setItem(PAGE_BACKUP_STORAGE_KEY, "{not json");
    expect(readPageBackups({ storage })).toEqual([]);

    storage.setItem(
      PAGE_BACKUP_STORAGE_KEY,
      JSON.stringify([{ nope: true }, null, "x"]),
    );
    expect(readPageBackups({ storage })).toEqual([]);
  });

  it("clears the history", () => {
    storePageBackup(buildPayload(), { storage });
    clearPageBackups({ storage });

    expect(readPageBackups({ storage })).toEqual([]);
  });
});
