const { getConfig } = require("../config");
const { request } = require("./client");

async function paginateListing({ method, path, query, body, pageInBody = false }) {
  const pages = [];
  let page = 1;
  let pageSize = null;
  let totalCount = null;

  const config = getConfig();

  while (page <= config.maxPages) {
    const queryWithPage = pageInBody ? query : { ...query, page };
    const bodyWithPage = pageInBody ? { ...(body || {}), page } : body;
    const response = await request({
      method,
      path,
      query: queryWithPage,
      body: bodyWithPage
    });

    if (!response || !Array.isArray(response.data)) {
      pages.push(response);
      break;
    }

    const data = response.data ?? [];
    totalCount = Number.isFinite(response.totalCount)
      ? response.totalCount
      : totalCount;
    pageSize = pageSize ?? data.length;

    pages.push(response);

    if (data.length === 0) {
      break;
    }
    if (totalCount !== null && pageSize > 0 && page * pageSize >= totalCount) {
      break;
    }
    page += 1;
  }

  return pages;
}

module.exports = { paginateListing };
