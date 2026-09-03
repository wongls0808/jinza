/* ─────────────────────────────────────────────
 * 主体公司信息模块：集中管理我方买方公司抬头，
 * 供所有单证(PI / CI / PL / Statement 等)统一引用。
 * 存于 app_config(key="company")，未配置时回退默认值。
 * ───────────────────────────────────────────── */
const db = require("./db");

const DEFAULT_COMPANY = {
  name: "JINZA TRADING SDN. BHD.",
  reg: "Reg. No.: 202501024394 (1625807-K) | TIN: C60122406100",
  address: "2nd Floor, No. 185\nJalan Datuk Abang Abdul Rahim,\n93450 Kuching, Sarawak, Malaysia",
  tel: "Tel / Mobile: 018-2556898",
  email: "E-mail: jinza.sb@gmail.com"
};

async function getCompany() {
  const stored = await db.getConfig("company");
  return { ...DEFAULT_COMPANY, ...(stored && typeof stored === "object" ? stored : {}) };
}

async function saveCompany(cfg) {
  const prev = await getCompany();
  const merged = {
    name: cfg && typeof cfg.name === "string" ? cfg.name : prev.name,
    reg: cfg && typeof cfg.reg === "string" ? cfg.reg : prev.reg,
    address: cfg && typeof cfg.address === "string" ? cfg.address : prev.address,
    tel: cfg && typeof cfg.tel === "string" ? cfg.tel : prev.tel,
    email: cfg && typeof cfg.email === "string" ? cfg.email : prev.email
  };
  await db.setConfig("company", merged);
  return merged;
}

module.exports = { DEFAULT_COMPANY, getCompany, saveCompany };