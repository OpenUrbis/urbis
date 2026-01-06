#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const DEFAULT_TRANSLATIONS_FILE = "apps/accounts/public/i18n/pt.json";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.replace(/^--/, "");
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        i += 1;
      }
    }
  }
  return args;
}

function exitWithError(message) {
  console.error(`[ERROR] ${message}`);
  process.exit(1);
}

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function stripTags(text) {
  return normalizeText(text.replace(/<[^>]+>/g, " "));
}

function hasTranslateSyntax(value) {
  return (
    /\|\s*translate/.test(value) ||
    /\[translate\]/.test(value) ||
    /i18n/.test(value) ||
    /{{/.test(value)
  );
}

function slugifyToCamel(text) {
  const normalized = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/);
  if (!normalized.length) return "";
  const [first, ...rest] = normalized;
  return (
    first.toLowerCase() +
    rest.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join("")
  );
}

function tabSlug(text) {
  const normalized = text.toLowerCase();
  if (normalized.includes("cargo")) return "roles";
  if (normalized.includes("org")) return "organizations";
  return slugifyToCamel(text);
}

function removeDiacritics(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function ensureTranslationKey(translations, key, value, state) {
  const parts = key.split(".");
  let current = translations;
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    const isLast = i === parts.length - 1;
    if (isLast) {
      if (Object.prototype.hasOwnProperty.call(current, part)) {
        return { status: "exists" };
      }
      current[part] = value;
      state.newKeys.add(key);
      return { status: "added" };
    }
    if (!Object.prototype.hasOwnProperty.call(current, part)) {
      current[part] = {};
    } else if (
      typeof current[part] !== "object" ||
      current[part] === null ||
      Array.isArray(current[part])
    ) {
      return {
        status: "conflict",
        conflictAt: parts.slice(0, i + 1).join("."),
      };
    }
    current = current[part];
  }
  return { status: "conflict", conflictAt: key };
}

function logAction(state, status, text, key, note) {
  const prefix =
    status === "warn" ? "[WARN]" : status === "skip" ? "[SKIP]" : "[OK]";
  const extra = note ? ` (${note})` : "";
  state.logs.push(`${prefix} "${text}" -> ${key}${extra}`);
}

function deriveKey(baseKey, text, context, cache) {
  if (cache.has(text)) return cache.get(text);
  let key;
  const slug = slugifyToCamel(text);

  switch (context.type) {
    case "tab":
      key = `${baseKey}.tabs.${tabSlug(text) || slug}`;
      break;

    case "label":
      key = context.controlName
        ? `${baseKey}.fields.${context.controlName}`
        : `${baseKey}.fields.${slug}`;
      break;

    case "placeholder":
      key = context.controlName
        ? `${baseKey}.placeholders.${context.controlName}`
        : `${baseKey}.placeholders.${slug}`;
      break;

    case "mat-error": {
      const lowered = removeDiacritics(text).toLowerCase();
      if (context.controlName === "email") {
        if (lowered.includes("valid")) key = `${baseKey}.errors.emailInvalid`;
        else if (lowered.includes("obrig"))
          key = `${baseKey}.errors.emailRequired`;
      }
      if (!key && lowered.includes("obrig")) {
        key = `${baseKey}.errors.${
          context.controlName
            ? `${context.controlName}Required`
            : `${slug}Required`
        }`;
      } else if (!key && (lowered.includes("valid") || lowered.includes("inval"))) {
        key = `${baseKey}.errors.${
          context.controlName
            ? `${context.controlName}Invalid`
            : `${slug}Invalid`
        }`;
      }
      if (!key) {
        key = `${baseKey}.errors.${context.controlName || slug}`;
      }
      break;
    }

    case "button": {
      const lowered = text.toLowerCase();
      if (lowered === "salvar") key = `${baseKey}.buttons.save`;
      else if (lowered === "adicionar") key = `${baseKey}.buttons.add`;
      else key = `${baseKey}.buttons.${slug}`;
      break;
    }

    case "heading": {
      // Primeiro heading da página vira baseKey.title
      if (!cache.get("__headingUsed__")) {
        cache.set("__headingUsed__" , true);
        key = `${baseKey}.title`;
      } else {
        key = `${baseKey}.titles.${slug || "title"}`;
      }
      break;
    }

    default:
      key = `${baseKey}.misc.${slug}`;
  }

  cache.set(text, key);
  return key;
}

function shouldSkipValue(value) {
  if (!value) return true;
  if (hasTranslateSyntax(value)) return true;
  return !normalizeText(value);
}

function processMatFormFields(html, baseKey, translations, state, cache) {
  const fieldRegex = /<mat-form-field[\s\S]*?<\/mat-form-field>/g;
  return html.replace(fieldRegex, (block) => {
    const controlMatch =
      block.match(/formControlName\s*=\s*"(.*?)"/) ||
      block.match(/formControlName\s*=\s*'(.*?)'/);
    const controlName = controlMatch ? controlMatch[1] : null;
    let updated = block;

    // <mat-label>
    updated = updated.replace(
      /<mat-label[^>]*>([\s\S]*?)<\/mat-label>/g,
      (match, inner) => {
        if (hasTranslateSyntax(inner)) return match;
        const text = stripTags(inner);
        if (!text) return match;
        state.totalTexts += 1;
        const key = deriveKey(
          baseKey,
          text,
          { type: "label", controlName },
          cache
        );
        const res = ensureTranslationKey(translations, key, text, state);
        if (res.status === "conflict") {
          logAction(
            state,
            "warn",
            text,
            key,
            `conflito em ${res.conflictAt}`
          );
          return match;
        }
        logAction(
          state,
          res.status === "added" ? "ok" : "skip",
          text,
          key,
          res.status === "added" ? "nova chave" : "já existia no pt.json"
        );
        const replacement = `{{ '${key}' | translate }}`;
        state.htmlChanges.push({
          before: match.trim(),
          after: match.replace(inner, replacement).trim(),
        });
        return match.replace(inner, replacement);
      }
    );

    // placeholder=""
    updated = updated.replace(
      /placeholder\s*=\s*("([^"]+)"|'([^']+)')/g,
      (match, _full, doubleVal, singleVal) => {
        const value = doubleVal || singleVal || "";
        if (shouldSkipValue(value)) return match;
        const text = normalizeText(value);
        state.totalTexts += 1;
        const key = deriveKey(
          baseKey,
          text,
          { type: "placeholder", controlName },
          cache
        );
        const res = ensureTranslationKey(translations, key, text, state);
        if (res.status === "conflict") {
          logAction(
            state,
            "warn",
            text,
            key,
            `conflito em ${res.conflictAt}`
          );
          return match;
        }
        logAction(
          state,
          res.status === "added" ? "ok" : "skip",
          text,
          key,
          res.status === "added" ? "nova chave" : "já existia no pt.json"
        );
        const replacement = `placeholder="{{ '${key}' | translate }}"`;
        state.htmlChanges.push({
          before: match.trim(),
          after: replacement.trim(),
        });
        return replacement;
      }
    );

    // <mat-error>
    updated = updated.replace(
      /<mat-error[^>]*>([\s\S]*?)<\/mat-error>/g,
      (match, inner) => {
        if (hasTranslateSyntax(inner)) return match;
        const text = stripTags(inner);
        if (!text) return match;
        state.totalTexts += 1;
        const key = deriveKey(
          baseKey,
          text,
          { type: "mat-error", controlName },
          cache
        );
        const res = ensureTranslationKey(translations, key, text, state);
        if (res.status === "conflict") {
          logAction(
            state,
            "warn",
            text,
            key,
            `conflito em ${res.conflictAt}`
          );
          return match;
        }
        logAction(
          state,
          res.status === "added" ? "ok" : "skip",
          text,
          key,
          res.status === "added" ? "nova chave" : "já existia no pt.json"
        );
        const replacement = `{{ '${key}' | translate }}`;
        const newTag = match.replace(inner, replacement);
        state.htmlChanges.push({
          before: match.trim(),
          after: newTag.trim(),
        });
        return newTag;
      }
    );

    return updated;
  });
}

function processMatTabs(html, baseKey, translations, state, cache) {
  const tabRegex =
    /<mat-tab([\s\S]*?)label\s*=\s*("([^"]+)"|'([^']+)')([\s\S]*?)>/g;
  return html.replace(
    tabRegex,
    (match, before, _valueWithQuotes, doubleVal, singleVal, after) => {
      const value = doubleVal || singleVal || "";
      if (shouldSkipValue(value)) return match;
      const text = normalizeText(value);
      state.totalTexts += 1;
      const key = deriveKey(baseKey, text, { type: "tab" }, cache);
      const res = ensureTranslationKey(translations, key, text, state);
      if (res.status === "conflict") {
        logAction(
          state,
          "warn",
          text,
          key,
          `conflito em ${res.conflictAt}`
        );
        return match;
      }
      logAction(
        state,
        res.status === "added" ? "ok" : "skip",
        text,
        key,
        res.status === "added" ? "nova chave" : "já existia no pt.json"
      );
      const updated = `<mat-tab${before}label="{{ '${key}' | translate }}"${after}>`;
      state.htmlChanges.push({ before: match.trim(), after: updated.trim() });
      return updated;
    }
  );
}

function processButtons(html, baseKey, translations, state, cache) {
  const buttonRegex =
    /<(button|lib-loading-button)([^>]*)>([\s\S]*?)<\/\1>/g;
  return html.replace(buttonRegex, (match, tag, attrs, inner) => {
    if (hasTranslateSyntax(inner)) return match;

    // Remove mat-icon pra pegar só o texto visível
    const withoutIcons = inner.replace(
      /<mat-icon[\s\S]*?<\/mat-icon>/g,
      " "
    );
    const text = stripTags(withoutIcons);
    if (!text) return match;

    state.totalTexts += 1;
    const key = deriveKey(
      baseKey,
      text,
      { type: "button", tag },
      cache
    );
    const res = ensureTranslationKey(translations, key, text, state);
    if (res.status === "conflict") {
      logAction(
        state,
        "warn",
        text,
        key,
        `conflito em ${res.conflictAt}`
      );
      return match;
    }
    logAction(
      state,
      res.status === "added" ? "ok" : "skip",
      text,
      key,
      res.status === "added" ? "nova chave" : "já existia no pt.json"
    );
    const replacement = `{{ '${key}' | translate }}`;
    const newTag = match.replace(inner, replacement);
    state.htmlChanges.push({
      before: match.trim(),
      after: newTag.trim(),
    });
    return newTag;
  });
}

function processHeadings(html, baseKey, translations, state, cache) {
  const headingRegex = /<(h[1-6])([^>]*)>([\s\S]*?)<\/\1>/g;
  return html.replace(headingRegex, (match, tag, attrs, inner) => {
    if (hasTranslateSyntax(inner)) return match;
    const text = stripTags(inner);
    if (!text) return match;

    state.totalTexts += 1;
    const key = deriveKey(
      baseKey,
      text,
      { type: "heading" },
      cache
    );
    const res = ensureTranslationKey(translations, key, text, state);
    if (res.status === "conflict") {
      logAction(
        state,
        "warn",
        text,
        key,
        `conflito em ${res.conflictAt}`
      );
      return match;
    }
    logAction(
      state,
      res.status === "added" ? "ok" : "skip",
      text,
      key,
      res.status === "added" ? "nova chave" : "já existia no pt.json"
    );
    const replacement = `{{ '${key}' | translate }}`;
    const newTag = match.replace(inner, replacement);
    state.htmlChanges.push({
      before: match.trim(),
      after: newTag.trim(),
    });
    return newTag;
  });
}

function processGenericTexts(html, baseKey, translations, state, cache) {
  // Genérico extra se precisarmos no futuro.
  const errorRegex = /<mat-error[^>]*>([\s\S]*?)<\/mat-error>/g;
  return html.replace(errorRegex, (match, inner) => {
    if (hasTranslateSyntax(inner)) return match;
    const text = stripTags(inner);
    if (!text) return match;
    state.totalTexts += 1;
    const key = deriveKey(baseKey, text, { type: "misc" }, cache);
    const res = ensureTranslationKey(translations, key, text, state);
    if (res.status === "conflict") {
      logAction(
        state,
        "warn",
        text,
        key,
        `conflito em ${res.conflictAt}`
      );
      return match;
    }
    logAction(
      state,
      res.status === "added" ? "ok" : "skip",
      text,
      key,
      res.status === "added" ? "nova chave" : "já existia no pt.json"
    );
    const replacement = `{{ '${key}' | translate }}`;
    const newTag = match.replace(inner, replacement);
    state.htmlChanges.push({
      before: match.trim(),
      after: newTag.trim(),
    });
    return newTag;
  });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseKey = args.baseKey;
  const filePath = args.file;
  const translationsFile =
    args.translationsFile || DEFAULT_TRANSLATIONS_FILE;
  const dryRun = Boolean(args["dry-run"] || args.dryRun);

  if (!filePath) exitWithError("Parâmetro --file é obrigatório.");
  if (!baseKey) exitWithError("Parâmetro --baseKey é obrigatório.");

  const htmlPath = path.resolve(process.cwd(), filePath);
  const translationsPath = path.resolve(process.cwd(), translationsFile);

  if (!fs.existsSync(htmlPath))
    exitWithError(`Arquivo não encontrado: ${filePath}`);
  if (!fs.existsSync(translationsPath))
    exitWithError(
      `Arquivo de traduções não encontrado: ${translationsFile}`
    );

  let htmlContent;
  let translationsContent;
  try {
    htmlContent = fs.readFileSync(htmlPath, "utf8");
  } catch (err) {
    exitWithError(`Não foi possível ler o arquivo HTML: ${err.message}`);
  }

  try {
    translationsContent = JSON.parse(
      fs.readFileSync(translationsPath, "utf8")
    );
  } catch (err) {
    exitWithError(
      `Não foi possível ler o JSON de traduções: ${err.message}`
    );
  }

  const state = {
    logs: [],
    htmlChanges: [],
    newKeys: new Set(),
    totalTexts: 0,
  };
  const cache = new Map();

  let updatedHtml = htmlContent;
  updatedHtml = processMatFormFields(
    updatedHtml,
    baseKey,
    translationsContent,
    state,
    cache
  );
  updatedHtml = processMatTabs(
    updatedHtml,
    baseKey,
    translationsContent,
    state,
    cache
  );
  updatedHtml = processButtons(
    updatedHtml,
    baseKey,
    translationsContent,
    state,
    cache
  );
  updatedHtml = processHeadings(
    updatedHtml,
    baseKey,
    translationsContent,
    state,
    cache
  );
  updatedHtml = processGenericTexts(
    updatedHtml,
    baseKey,
    translationsContent,
    state,
    cache
  );

  console.log(`Arquivo processado: ${filePath}`);
  console.log(`BaseKey: ${baseKey}\n`);
  state.logs.forEach((log) => console.log(log));

  console.log("\nResumo:");
  console.log(`Total de textos analisados: ${state.totalTexts}`);
  console.log(
    `Novas chaves adicionadas em pt.json: ${state.newKeys.size}`
  );
  if (dryRun) {
    console.log("Dry-run ativado: nenhum arquivo foi gravado.");
  } else {
    try {
      fs.writeFileSync(
        translationsPath,
        `${JSON.stringify(translationsContent, null, 2)}\n`
      );
      fs.writeFileSync(htmlPath, updatedHtml);
      console.log(`Arquivo HTML atualizado: ${filePath}`);
      console.log(
        `Arquivo de traduções atualizado: ${translationsFile}`
      );
    } catch (err) {
      exitWithError(`Erro ao gravar arquivos: ${err.message}`);
    }
  }

  if (state.newKeys.size && dryRun) {
    console.log("\nChaves que seriam adicionadas:");
    state.newKeys.forEach((key) => console.log(`- ${key}`));
  }

  if (state.htmlChanges.length && dryRun) {
    console.log("\nAlterações HTML previstas:");
    state.htmlChanges.forEach((change) => {
      console.log("-----");
      console.log(`De: ${change.before}`);
      console.log(`Para: ${change.after}`);
    });
  }
}

main();
