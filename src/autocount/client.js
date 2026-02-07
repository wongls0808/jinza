const { getConfig } = require("../config");

function buildQuery(query) {
  if (!query) {
    return "";
  }
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, String(item)));
      return;
    }
    params.append(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function buildPath(pathTemplate, accountBookId) {
  return pathTemplate.replace("{accountBookId}", accountBookId);
}

async function request({ method, path, query, body }) {
  const config = getConfig();

  if (!config.baseUrl) {
    throw new Error("AUTOCOUNT_BASE_URL 未配置");
  }
  if (!config.accountBookId) {
    throw new Error("AUTOCOUNT_ACCOUNT_BOOK_ID 未配置");
  }
  if (!config.keyId || !config.apiKey) {
    throw new Error("AUTOCOUNT_KEY_ID/AUTOCOUNT_API_KEY 未配置");
  }

  const fullPath = buildPath(path, config.accountBookId) + buildQuery(query);
  const url = `${config.baseUrl.replace(/\/$/, "")}${fullPath}`;
  const headers = {
    "Key-ID": config.keyId,
    "API-Key": config.apiKey
  };
  const options = {
    method,
    headers
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AutoCount API 调用失败: ${response.status} ${text}`);
  }
  if (response.status === 204) {
    return null;
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`AutoCount API 响应解析失败: ${text}`);
  }
}

module.exports = { request };
