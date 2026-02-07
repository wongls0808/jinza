const { entities, getEntity } = require("./sync/entities");
const { syncAll, syncEntity } = require("./sync/run");

async function main() {
  const [, , command, arg] = process.argv;

  if (!command || command === "help") {
    console.log("用法: node src/cli.js <command> [entity]");
    console.log("命令: list | sync | ping | help");
    return;
  }

  if (command === "list") {
    console.log("可同步实体:");
    entities.forEach((entity) => console.log(`- ${entity.name}`));
    return;
  }

  if (command === "ping") {
    const entity = getEntity("companyProfile");
    await syncEntity(entity);
    console.log("ping 成功");
    return;
  }

  if (command === "sync") {
    if (arg) {
      const entity = getEntity(arg);
      if (!entity) {
        console.error(`未知实体: ${arg}`);
        process.exitCode = 1;
        return;
      }
      await syncEntity(entity);
      console.log(`${arg} 同步完成`);
      return;
    }
    await syncAll(entities);
    console.log("全部同步完成");
    return;
  }

  console.error(`未知命令: ${command}`);
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
