"use client";

export type FeedbackType = "inquiry" | "bug-report" | "suggestion";

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function buildSectionData() {
  return {
    url: window.location.href,
    path: window.location.pathname,
    referrer: document.referrer || null,
    userAgent: navigator.userAgent,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    timestampISO: new Date().toISOString(),
  };
}

export function mergeHeaders(a: Record<string, string>, b: Record<string, string>) {
  const out: Record<string, string> = {};
  for (const k in a) out[k] = a[k];
  for (const k2 in b) out[k2] = b[k2];
  return out;
}

export function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function normalizeFolderPath(p: string) {
  return (p || "").replace(/^\/+/, "").replace(/\/+$/, "");
}

export function normalizeKeyMaybe(k: string) {
  return (k || "").replace(/^\/+/, "");
}

export function normalizePublicUrlMaybe(url: string) {
  return String(url || "");
}

import { getUrbisConfig } from "../../../lib/config";

/**
 * =========================
 * CONFIG DINÂMICA (via lib/config)
 * =========================
 */

export function getApiBase() {
  return getUrbisConfig().apiUrl;
}

export function getApiKey() {
  // opcional: se você usa x-api-key no backend
  return "";
}

export function buildApiKeyHeaders(): Record<string, string> {
  const key = getApiKey();
  if (!key) return {};
  return { "x-api-key": key };
}

/**
 * =========================
 * reCAPTCHA v3 (script no index.html)
 * =========================
 * ✅ NÃO injeta script aqui
 * ✅ NÃO usa useEffect
 * ✅ apenas espera window.grecaptcha existir
 */
declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (
        siteKey: string,
        opts: { action: string },
      ) => {
        then: (cb: (token: string) => void) => any;
        catch?: (cb: (err: any) => void) => any;
      };
    };
  }
}

export function getRecaptchaSiteKey() {
  return getUrbisConfig().recaptchaSiteKey || "";
}

let recaptchaScriptLoading = false;

export function loadRecaptchaScript() {
  if (typeof window === "undefined") return;
  if (window.grecaptcha) return;
  if (recaptchaScriptLoading) return;
  if (document.getElementById("recaptcha-script")) return;

  recaptchaScriptLoading = true;
  const script = document.createElement("script");
  script.id = "recaptcha-script";
  script.src = `https://www.google.com/recaptcha/api.js?render=${getRecaptchaSiteKey()}&badge=bottomleft`;
  script.async = true;
  script.defer = true;
  script.onload = () => {
    recaptchaScriptLoading = false;
  };
  script.onerror = () => {
    recaptchaScriptLoading = false;
  };
  document.head.appendChild(script);
}

export type RecaptchaCallback = (err: Error | null, token?: string) => void;

export function waitForGrecaptcha(timeoutMs: number, cb: (err: Error | null) => void) {
  if (window.grecaptcha) {
    cb(null);
    return;
  }

  const start = Date.now();
  const timer = setInterval(function () {
    if (window.grecaptcha) {
      clearInterval(timer);
      cb(null);
      return;
    }

    if (Date.now() - start > timeoutMs) {
      clearInterval(timer);
      cb(
        new Error(
          "reCAPTCHA não carregou. Confirme que o script está no index.html do site e não foi bloqueado.",
        ),
      );
    }
  }, 50);
}

export function getRecaptchaToken(
  action: string,
  callback: RecaptchaCallback,
) {
  waitForGrecaptcha(6000, function (loadErr) {
    if (loadErr) {
      callback(loadErr);
      return;
    }

    if (!window.grecaptcha) {
      callback(new Error("reCAPTCHA não carregado (grecaptcha)."));
      return;
    }

    const siteKey = getRecaptchaSiteKey();
    if (!siteKey) {
      callback(new Error("Site key do reCAPTCHA não configurada."));
      return;
    }

    window.grecaptcha.ready(function () {
      try {
        const p = window.grecaptcha!.execute(siteKey, { action: action });

        p.then(function (token: string) {
          callback(null, token);
        });

        if (typeof p.catch === "function") {
          p.catch(function (err: any) {
            callback(
              new Error(
                err && err.message
                  ? String(err.message)
                  : "Falha no reCAPTCHA.",
              ),
            );
          });
        }
      } catch (err: any) {
        callback(
          new Error(
            err && err.message ? String(err.message) : "Falha no reCAPTCHA.",
          ),
        );
      }
    });
  });
}

/**
 * =========================
 * API calls
 * =========================
 */
export function createSupportTicket(params: {
  endpoint?: string;
  payload: {
    name: string;
    email: string;
    message: string;
    files: string[];
    type: FeedbackType;
    recaptcha: string;
    includeSectionData?: boolean;
    sectionData?: ReturnType<typeof buildSectionData>;
  };
}) {
  const base = getApiBase().replace(/\/$/, "");
  const raw = params.endpoint || "/support/create-ticket";
  const ep =
    raw.indexOf("http://") === 0 || raw.indexOf("https://") === 0
      ? raw
      : base + raw;

  return fetch(ep, {
    method: "POST",
    headers: mergeHeaders(
      { "Content-Type": "application/json" },
      buildApiKeyHeaders(),
    ),
    body: JSON.stringify(params.payload),
  }).then(function (res) {
    if (res.ok) return;

    return res.text().then(function (text) {
      try {
        const data = text ? JSON.parse(text) : null;
        const msg =
          data && typeof data.message === "string"
            ? data.message
            : data && Array.isArray(data.message)
              ? data.message.join(", ")
              : "Erro ao criar o ticket.";
        throw new Error(msg);
      } catch {
        throw new Error("Erro ao criar o ticket.");
      }
    });
  });
}

export function requestPublicUploadUrl(params: {
  contentType: string;
  folderPath: string;
  recaptcha: string;
}) {
  const base = getApiBase().replace(/\/$/, "");
  const url = base + "/files/public/upload-url";

  return fetch(url, {
    method: "POST",
    headers: mergeHeaders(
      { "Content-Type": "application/json" },
      buildApiKeyHeaders(),
    ),
    body: JSON.stringify({
      contentType: params.contentType,
      folderPath: normalizeFolderPath(params.folderPath),
      recaptcha: params.recaptcha,
    }),
  }).then(function (res) {
    return res.text().then(function (t) {
      const data = t ? safeJsonParse(t) : null;

      if (!res.ok) {
        const msg =
          (data && typeof data.message === "string" && data.message) ||
          (data && Array.isArray(data.message)
            ? data.message.join(", ")
            : "") ||
          "Erro HTTP " + res.status;
        throw new Error(msg);
      }

      const uploadURL = data && (data.uploadURL || data.uploadUrl || data.url);
      const key = data && data.key;

      const rawFields = data && data.fields;
      const fields =
        rawFields &&
        typeof rawFields === "object" &&
        Object.keys(rawFields).length > 0
          ? rawFields
          : null;

      if (!uploadURL || !key)
        throw new Error("Resposta inválida da API pública de upload.");

      return {
        uploadURL: normalizePublicUrlMaybe(uploadURL),
        key: normalizeKeyMaybe(key),
        fields: fields,
      };
    });
  });
}

export function requestDownloadUrl(key: string, recaptcha: string) {
  const base = getApiBase().replace(/\/$/, "");
  const url = base + "/files/public/download-url?key=" + encodeURIComponent(key);

  return fetch(url, {
    method: "GET",
    headers: mergeHeaders(
      {
        Accept: "application/json",
        recaptcha: recaptcha,
      },
      buildApiKeyHeaders(),
    ),
  }).then(function (res) {
    return res.text().then(function (t) {
      const data = t ? safeJsonParse(t) : null;

      if (!res.ok) {
        const msg =
          (data && typeof data.message === "string" && data.message) ||
          "Erro HTTP " + res.status;
        throw new Error(msg);
      }

      const downloadURL =
        data && (data.downloadURL || data.downloadUrl || data.url);
      if (!downloadURL)
        throw new Error("Resposta inválida da API de download.");
      return downloadURL as string;
    });
  });
}

export function getQueryParam(url: string, name: string) {
  try {
    return new URL(url).searchParams.get(name);
  } catch {
    return null;
  }
}

export function crc32Table() {
  let c = 0;
  const table = new Array(256);
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

let __CRC32_TABLE: number[] | null = null;

export function crc32OfUint8(arr: Uint8Array) {
  if (!__CRC32_TABLE) __CRC32_TABLE = crc32Table();
  let crc = 0xffffffff;
  for (let i = 0; i < arr.length; i++) {
    crc = (__CRC32_TABLE![(crc ^ arr[i]) & 0xff] ^ (crc >>> 8)) >>> 0;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function crc32Base64FromFile(file: File) {
  return file.arrayBuffer().then(function (buf) {
    const u8 = new Uint8Array(buf);
    const crc = crc32OfUint8(u8);
    const b0 = (crc >>> 24) & 0xff;
    const b1 = (crc >>> 16) & 0xff;
    const b2 = (crc >>> 8) & 0xff;
    const b3 = crc & 0xff;
    return btoa(String.fromCharCode(b0, b1, b2, b3));
  });
}

export function uploadToS3(
  uploadInfo: { uploadURL: string; fields: any; key: string },
  file: File,
) {
  if (
    uploadInfo.fields &&
    typeof uploadInfo.fields === "object" &&
    Object.keys(uploadInfo.fields).length
  ) {
    const form = new FormData();
    Object.keys(uploadInfo.fields).forEach(function (k) {
      form.append(k, uploadInfo.fields[k]);
    });
    form.append("file", file);

    return fetch(uploadInfo.uploadURL, { method: "POST", body: form }).then(
      function (res) {
        if (res.ok) return;
        return res.text().then(function (t) {
          throw new Error(
            "Falha ao enviar o arquivo (POST). " + (t || "HTTP " + res.status),
          );
        });
      },
    );
  }

  const url = uploadInfo.uploadURL;
  const algo = getQueryParam(url, "x-amz-sdk-checksum-algorithm");
  const needsCrc32 = algo && algo.toUpperCase() === "CRC32";

  function doPut(headers: Record<string, string>) {
    return fetch(url, {
      method: "PUT",
      mode: "cors",
      headers: headers,
      body: file,
    }).then(function (res) {
      if (res.ok) return;
      return res.text().then(function (t) {
        throw new Error(
          "Falha ao enviar o arquivo (PUT). " + (t || "HTTP " + res.status),
        );
      });
    });
  }

  if (needsCrc32) {
    return crc32Base64FromFile(file).then(function (crcB64) {
      return doPut({
        "x-amz-checksum-crc32": crcB64,
        "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
      });
    });
  }

  return doPut({
    "x-amz-content-sha256": "UNSIGNED-PAYLOAD",
  });
}

/**
 * Upload sequencial COM reCAPTCHA v3
 */
export type UploadResult = {
  key: string;
  url: string;
  name: string;
};

export type UploadCb = (err: Error | null, results?: UploadResult[]) => void;

export function uploadFilesSequentiallyWithRecaptcha(
  params: { files: File[]; folderPath: string },
  cb: UploadCb,
) {
  const results: UploadResult[] = [];
  let idx = 0;

  function next() {
    if (idx >= params.files.length) {
      cb(null, results);
      return;
    }

    const f = params.files[idx];
    idx++;

    const contentType = (f && f.type) || "application/octet-stream";

    getRecaptchaToken("upload_file", function (err, uploadToken) {
      if (err || !uploadToken) {
        cb(err || new Error("Falha ao validar reCAPTCHA no upload."));
        return;
      }

      requestPublicUploadUrl({
        contentType: contentType,
        folderPath: params.folderPath,
        recaptcha: uploadToken,
      })
        .then(function (info: any) {
          return uploadToS3(
            { uploadURL: info.uploadURL, fields: info.fields, key: info.key },
            f,
          ).then(function () {
            getRecaptchaToken("download_url", function (err2, downloadToken) {
              if (err2 || !downloadToken) {
                cb(
                  err2 || new Error("Falha ao validar reCAPTCHA no download."),
                );
                return;
              }

              requestDownloadUrl(info.key, downloadToken)
                .then(function (downloadUrl) {
                  results.push({
                    key: info.key,
                    url: downloadUrl,
                    name: f.name,
                  });
                  next();
                })
                .catch(function (e) {
                  cb(new Error("Falha ao obter URL de download: " + e.message));
                });
            });
          });
        })
        .catch(function (e: any) {
          cb(
            new Error(
              e && e.message ? String(e.message) : "Falha ao enviar anexos.",
            ),
          );
        });
    });
  }

  next();
}
