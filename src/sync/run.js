const { request } = require("../autocount/client");
const { paginateListing } = require("../autocount/paginate");
const { getConfig } = require("../config");
const { readState, writeState, writeEntitySnapshot } = require("../storage/state");

function buildDateQuery(entity, state) {
  if (!entity.dateFilter) {
    return {};
  }
  const lastSync = state[entity.name]?.lastSync;
  const startDate = lastSync ?? entity.dateFilter.defaultStart;
  const endDate = getConfig().nowIso();
  return {
    [entity.dateFilter.startParam]: startDate,
    [entity.dateFilter.endParam]: endDate
  };
}

async function syncEntity(entity) {
  const state = readState();
  const query = {
    ...buildDateQuery(entity, state),
    ...(entity.query || {})
  };
  const body = entity.body;

  let payload;
  if (entity.paginate) {
    payload = await paginateListing({
      method: entity.method,
      path: entity.path,
      query,
      body,
      pageInBody: entity.pageInBody
    });
  } else {
    payload = await request({
      method: entity.method,
      path: entity.path,
      query,
      body
    });
  }

  const config = getConfig();

  writeEntitySnapshot(entity.name, {
    syncedAt: config.nowIso(),
    entity: entity.name,
    payload
  });

  state[entity.name] = {
    lastSync: config.nowIso()
  };
  writeState(state);
}

async function syncAll(entities) {
  for (const entity of entities) {
    await syncEntity(entity);
  }
}

module.exports = { syncEntity, syncAll };
