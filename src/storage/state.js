const fs = require("fs");
const path = require("path");
const { getConfig } = require("../config");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function resolveDataPath(...parts) {
  const config = getConfig();
  return path.join(config.resolveOutputPath(config.outputDir), ...parts);
}

function readState() {
  const statePath = resolveDataPath("state.json");
  if (!fs.existsSync(statePath)) {
    return {};
  }
  const raw = fs.readFileSync(statePath, "utf8");
  return raw ? JSON.parse(raw) : {};
}

function writeState(state) {
  const config = getConfig();
  ensureDir(config.resolveOutputPath(config.outputDir));
  const statePath = resolveDataPath("state.json");
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), "utf8");
}

function writeEntitySnapshot(entityName, payload) {
  const config = getConfig();
  const entityDir = resolveDataPath(entityName);
  ensureDir(entityDir);

  const latestPath = path.join(entityDir, "latest.json");
  fs.writeFileSync(latestPath, JSON.stringify(payload, null, 2), "utf8");

  if (!config.saveHistory) {
    return;
  }
  const historyDir = path.join(entityDir, "history");
  ensureDir(historyDir);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const historyPath = path.join(historyDir, `${timestamp}.json`);
  fs.writeFileSync(historyPath, JSON.stringify(payload, null, 2), "utf8");
}

module.exports = { readState, writeState, writeEntitySnapshot };
