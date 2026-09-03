/**
 * Local safety net for Legis documents.
 *
 * Whenever a save cannot be persisted (permission errors, offline, API outage),
 * the form stores a full snapshot in `localStorage` so nothing is lost and a
 * technician can recover the document later from the same browser profile.
 */

export const PAGE_BACKUP_STORAGE_KEY = "legis:page-backups";
export const MAX_STORED_PAGE_BACKUPS = 10;

export type PageBackupPayload = {
  backupVersion: number;
  generatedAt: string;
  origin: string;
  pageId: string | null;
  [key: string]: unknown;
};

export type PageBackupEntry = {
  id: string;
  label: string;
  pageId: string | null;
  savedAt: string;
  payload: PageBackupPayload;
};

export type StorePageBackupResult =
  | {
      status: "stored";
      entry: PageBackupEntry;
      /** How many snapshots are currently kept for this browser profile. */
      storedCount: number;
      /** Older snapshots dropped to respect the cap or the storage quota. */
      discardedCount: number;
    }
  | { status: "unavailable"; reason: string };

type StorageOptions = {
  storage?: Storage | null;
};

const resolveStorage = (storage?: Storage | null): Storage | null => {
  if (storage !== undefined) return storage;

  try {
    // Accessing localStorage throws in some privacy modes and sandboxes.
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

const isPageBackupEntry = (value: unknown): value is PageBackupEntry => {
  if (!value || typeof value !== "object") return false;

  const entry = value as Partial<PageBackupEntry>;

  return (
    typeof entry.id === "string" &&
    typeof entry.savedAt === "string" &&
    Boolean(entry.payload) &&
    typeof entry.payload === "object"
  );
};

const createBackupId = () => {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch {
    // Fall through to the timestamp-based id.
  }

  return `backup-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

/** Newest snapshot first. Malformed entries are ignored instead of throwing. */
export const readPageBackups = (
  options?: StorageOptions,
): PageBackupEntry[] => {
  const storage = resolveStorage(options?.storage);
  if (!storage) return [];

  try {
    const raw = storage.getItem(PAGE_BACKUP_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isPageBackupEntry)
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  } catch {
    return [];
  }
};

export const storePageBackup = (
  payload: PageBackupPayload,
  options?: StorageOptions & { label?: string },
): StorePageBackupResult => {
  const storage = resolveStorage(options?.storage);

  if (!storage) {
    return {
      status: "unavailable",
      reason: "Armazenamento local indisponível neste navegador.",
    };
  }

  const entry: PageBackupEntry = {
    id: createBackupId(),
    label: options?.label?.trim() || "Documento sem título",
    pageId: payload.pageId ?? null,
    savedAt: payload.generatedAt ?? new Date().toISOString(),
    payload,
  };

  const existing = readPageBackups({ storage });
  let candidates = [entry, ...existing].slice(0, MAX_STORED_PAGE_BACKUPS);
  let discardedCount = Math.max(0, existing.length + 1 - candidates.length);
  let lastError = "Não foi possível gravar o backup no armazenamento local.";

  // Quota is shared across the whole origin, so drop the oldest snapshots
  // until the current one fits instead of losing it entirely.
  while (candidates.length > 0) {
    try {
      storage.setItem(PAGE_BACKUP_STORAGE_KEY, JSON.stringify(candidates));

      return {
        status: "stored",
        entry,
        storedCount: candidates.length,
        discardedCount,
      };
    } catch (error) {
      if (error instanceof Error && error.message) {
        lastError = error.message;
      }

      if (candidates.length === 1) break;

      candidates = candidates.slice(0, -1);
      discardedCount += 1;
    }
  }

  return { status: "unavailable", reason: lastError };
};

export const clearPageBackups = (options?: StorageOptions): void => {
  const storage = resolveStorage(options?.storage);
  if (!storage) return;

  try {
    storage.removeItem(PAGE_BACKUP_STORAGE_KEY);
  } catch {
    // Nothing else to do: the snapshot list is best-effort by design.
  }
};
