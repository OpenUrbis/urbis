import { apiClient } from "../integrations/api-client";

export interface S3UploadResult {
  key: string;
  url: string;
  name: string;
}

export interface RecentS3Upload {
  key: string;
  url: string;
  name: string;
  uploadedAt: string;
  size?: number;
}

const RECENT_UPLOADS_KEY = "legis_recent_s3_uploads";
const MAX_RECENT_UPLOADS = 20;

function safeLocalStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function getRecentS3Uploads(): RecentS3Upload[] {
  const storage = safeLocalStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(RECENT_UPLOADS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentS3Upload[];
  } catch {
    return [];
  }
}

export function saveRecentS3Upload(upload: {
  key: string;
  url: string;
  name: string;
  size?: number;
}): RecentS3Upload[] {
  const storage = safeLocalStorage();
  const current = getRecentS3Uploads();

  const filtered = current.filter(
    (item) => item.key !== upload.key && item.url !== upload.url,
  );

  const newItem: RecentS3Upload = {
    key: upload.key,
    url: upload.url,
    name: upload.name,
    size: upload.size,
    uploadedAt: new Date().toISOString(),
  };

  const updated = [newItem, ...filtered].slice(0, MAX_RECENT_UPLOADS);

  if (storage) {
    try {
      storage.setItem(RECENT_UPLOADS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage quota errors
    }
  }

  return updated;
}

export function removeRecentS3Upload(keyOrUrl: string): RecentS3Upload[] {
  const storage = safeLocalStorage();
  const current = getRecentS3Uploads();
  const updated = current.filter(
    (item) => item.key !== keyOrUrl && item.url !== keyOrUrl,
  );

  if (storage) {
    try {
      storage.setItem(RECENT_UPLOADS_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }

  return updated;
}

export function isImageUrl(urlOrName?: string): boolean {
  if (!urlOrName) return false;
  const clean = urlOrName.split("?")[0].toLowerCase();
  return /\.(png|jpe?g|webp|gif|svg|bmp|tiff)$/i.test(clean);
}

export async function uploadFileToS3(
  file: File,
  folderPath = "legis/files",
): Promise<S3UploadResult> {
  const contentType = file.type || "application/octet-stream";

  let uploadURL: string;
  let key: string;

  try {
    const res = await apiClient.post<{ uploadURL: string; key: string }>(
      "/files/upload-url",
      { contentType, folderPath },
      { auth: "required" },
    );
    uploadURL = res.uploadURL;
    key = res.key;
  } catch {
    const res = await apiClient.post<{ uploadURL: string; key: string }>(
      "/files/public/upload-url",
      { contentType, folderPath },
    );
    uploadURL = res.uploadURL;
    key = res.key;
  }

  const response = await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": contentType,
    },
  });

  if (!response.ok) {
    throw new Error(`Falha no envio do arquivo para o S3 (${response.status})`);
  }

  let downloadUrl = uploadURL.split("?")[0];
  try {
    const res = await apiClient.get<{ downloadURL: string }>(
      `/files/download-url?key=${encodeURIComponent(key)}`,
      { auth: "required" },
    );
    if (res?.downloadURL) {
      downloadUrl = res.downloadURL;
    }
  } catch {
    // Fallback para URL limpa do objeto
  }

  const result = {
    key,
    url: downloadUrl,
    name: file.name,
  };

  saveRecentS3Upload({ ...result, size: file.size });

  return result;
}
