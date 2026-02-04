export interface UrbisConfig {
  apiUrl: string;
  recaptchaSiteKey?: string;
}

let config: UrbisConfig = {
  apiUrl: "http://localhost:3000",
  recaptchaSiteKey: "6LfwDx4sAAAAABrm5sINZvaY9Fq3pFttsX-wikjG",
};

export function setUrbisConfig(newConfig: Partial<UrbisConfig>) {
  config = { ...config, ...newConfig };
}

export function getUrbisConfig() {
  return config;
}
