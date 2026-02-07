const fs = require("fs");
const path = require("path");

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }
  const content = fs.readFileSync(envPath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }
    const index = trimmed.indexOf("=");
    if (index === -1) {
      return;
    }
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

loadDotEnv();

function readEnv(key, fallback = undefined) {
  const value = process.env[key];
  if (value === undefined || value === "") {
    return fallback;
  }
  return value;
}

function readBoolean(key, fallback) {
  const raw = readEnv(key);
  if (raw === undefined) {
    return fallback;
  }
  return ["1", "true", "yes", "y"].includes(String(raw).toLowerCase());
}

function readNumber(key, fallback) {
  const raw = readEnv(key);
  if (raw === undefined) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const baseRuntime = {
  baseUrl: readEnv("AUTOCOUNT_BASE_URL"),
  accountBookId: readEnv("AUTOCOUNT_ACCOUNT_BOOK_ID"),
  keyId: readEnv("AUTOCOUNT_KEY_ID"),
  apiKey: readEnv("AUTOCOUNT_API_KEY"),
  outputDir: readEnv("SYNC_OUTPUT_DIR", "data"),
  maxPages: readNumber("SYNC_MAX_PAGES", 500),
  saveHistory: readBoolean("SYNC_SAVE_HISTORY", true)
};

let runtimeConfig = { ...baseRuntime };

function setRuntimeConfig(partial) {
  runtimeConfig = { ...runtimeConfig, ...partial };
}

function getConfig() {
  return {
    ...runtimeConfig,
    nowIso: () => new Date().toISOString(),
    resolveOutputPath: (relativePath) => path.resolve(process.cwd(), relativePath)
  };
}

module.exports = { getConfig, setRuntimeConfig };
