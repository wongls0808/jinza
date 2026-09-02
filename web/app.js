/* 判断是否为远程部署环境（非 localhost 即为远程） */
const isRemote = !["localhost", "127.0.0.1"].includes(window.location.hostname);

const state = {
  config: {
    baseUrl: "",
    proxyBaseUrl: "",
    connectMode: isRemote ? "proxy" : "direct",
    accountBookId: "",
    keyId: "",
    apiKey: ""
  },
  syncState: {},
  data: {},
  ui: {}
};

const logEl = document.getElementById("log");
const drawerEl = document.getElementById("drawer");
const drawerTitleEl = document.getElementById("drawerTitle");
const drawerContentEl = document.getElementById("drawerContent");
const drawerRawEl = document.getElementById("drawerRaw");
const drawerCloseEl = document.getElementById("drawerClose");
const drawerTabsEl = document.getElementById("drawerTabs");
const poModalEl = document.getElementById("poModal");
const poModalCloseEl = document.getElementById("poModalClose");
const poCancelEl = document.getElementById("poCancel");
const poSubmitEl = document.getElementById("poSubmit");
const poSupplierEl = document.getElementById("poSupplier");
const poSupplierNameEl = document.getElementById("poSupplierName");
const poSupplierAddressEl = document.getElementById("poSupplierAddress");
const poDateEl = document.getElementById("poDate");
const poLocationEl = document.getElementById("poLocation");
const poCreditTermEl = document.getElementById("poCreditTerm");

/* 批量创建PO弹窗 */
const batchPoModalEl = document.getElementById("batchPoModal");
const batchPoModalCloseEl = document.getElementById("batchPoModalClose");
const batchPoCancelEl = document.getElementById("batchPoCancel");
const batchPoSubmitEl = document.getElementById("batchPoSubmit");
const batchPoSupplierEl = document.getElementById("batchPoSupplier");
const batchPoSupplierNameEl = document.getElementById("batchPoSupplierName");
const batchPoSupplierAddressEl = document.getElementById("batchPoSupplierAddress");
const batchPoLocationEl = document.getElementById("batchPoLocation");
const batchPoCreditTermEl = document.getElementById("batchPoCreditTerm");
const batchPoInfoEl = document.getElementById("batchPoInfo");
const productImportModalEl = document.getElementById("productImportModal");
const productImportCloseEl = document.getElementById("productImportClose");
const productImportFileEl = document.getElementById("productImportFile");
const productImportTextEl = document.getElementById("productImportText");
const productImportTypeEl = document.getElementById("productImportType");
const productImportStatusEl = document.getElementById("productImportStatus");
const productImportCategoryEl = document.getElementById("productImportCategory");
const productImportPostingEl = document.getElementById("productImportPosting");
const productImportSupplierEl = document.getElementById("productImportSupplier");
const productImportClassEl = document.getElementById("productImportClass");
const productImportUnitTypeEl = document.getElementById("productImportUnitType");
const productImportPreviewEl = document.getElementById("productImportPreview");
const productImportParseEl = document.getElementById("productImportParse");
const productImportSubmitEl = document.getElementById("productImportSubmit");
let productImportImageFile = null;
const piModalEl = document.getElementById("piModal");
const piModalCloseEl = document.getElementById("piModalClose");
const piCancelEl = document.getElementById("piCancel");
const piSubmitEl = document.getElementById("piSubmit");
const piSupplierEl = document.getElementById("piSupplier");
const piConsigneeEl = document.getElementById("piConsignee");
const piNumberEl = document.getElementById("piNumber");
const piDateEl = document.getElementById("piDate");
const piValidityDateEl = document.getElementById("piValidityDate");
const piRefPoEl = document.getElementById("piRefPo");
let pendingPiPoItem = null;
const cpiModalEl = document.getElementById("createPiInvoiceModal");
const cpiCloseEl = document.getElementById("createPiInvoiceClose");
const cpiCancelEl = document.getElementById("cpiCancel");
const cpiSubmitEl = document.getElementById("cpiSubmit");
const cpiSupplierEl = document.getElementById("cpiSupplier");
const cpiSupplierNameEl = document.getElementById("cpiSupplierName");
const cpiSupplierAddressEl = document.getElementById("cpiSupplierAddress");
const cpiDateEl = document.getElementById("cpiDate");
const cpiLocationEl = document.getElementById("cpiLocation");
const cpiCreditTermEl = document.getElementById("cpiCreditTerm");
const cpiSupplierInvoiceNoEl = document.getElementById("cpiSupplierInvoiceNo");
const cpiRefPiEl = document.getElementById("cpiRefPi");
const cpiRemarkEl = document.getElementById("cpiRemark");
const cpiDetailsSummaryEl = document.getElementById("cpiDetailsSummary");
let pendingCpiPiItem = null;
const sectionSettingsModalEl = document.getElementById("sectionSettingsModal");
const sectionSettingsTitleEl = document.getElementById("sectionSettingsTitle");
const sectionSettingsCloseEl = document.getElementById("sectionSettingsClose");
const sectionSettingsCancelEl = document.getElementById("sectionSettingsCancel");
const sectionSettingsSaveEl = document.getElementById("sectionSettingsSave");
const sectionSettingsPageSizeEl = document.getElementById(
  "sectionSettingsPageSize"
);
const sectionSettingsSummaryEl = document.getElementById(
  "sectionSettingsSummary"
);
const supplierPrintProfilesWrapEl = document.getElementById(
  "supplierPrintProfilesWrap"
);
const supplierPrintProfilesJsonEl = document.getElementById(
  "supplierPrintProfilesJson"
);
const supplierPrintProfileSupplierSelectEl = document.getElementById(
  "supplierPrintProfileSupplierSelect"
);
const supplierPrintProfileStampFileEl = document.getElementById(
  "supplierPrintProfileStampFile"
);
const supplierPrintProfileStampClearEl = document.getElementById(
  "supplierPrintProfileStampClear"
);
const supplierPrintProfileStampPreviewEl = document.getElementById(
  "supplierPrintProfileStampPreview"
);
const supplierPrintProfileBanksListEl = document.getElementById(
  "supplierPrintProfileBanksList"
);
const supplierPrintProfileBankAddEl = document.getElementById(
  "supplierPrintProfileBankAdd"
);
const supplierPrintProfilePiNumberPatternEl = document.getElementById(
  "supplierPrintProfilePiNumberPattern"
);
const supplierPrintProfilePiNumberPreviewEl = document.getElementById(
  "supplierPrintProfilePiNumberPreview"
);
const supplierPrintProfilePackingFromEl = document.getElementById(
  "supplierPrintProfilePackingFrom"
);
const supplierPrintProfilePiSeg1El = document.getElementById(
  "supplierPrintProfilePiSeg1"
);
const supplierPrintProfilePiSeg2El = document.getElementById(
  "supplierPrintProfilePiSeg2"
);
const overlayEl = document.getElementById("sectionOverlay");
const overlayBodyEl = document.getElementById("overlayBody");
const overlayTitleEl = document.getElementById("overlayTitle");
const overlayCloseEl = document.getElementById("overlayClose");
const sectionsBucketEl = document.getElementById("sectionsBucket");
const overlaySections = Array.from(
  document.querySelectorAll(".overlay-section")
);
const sectionDataEl = document.getElementById("section-data");
const sectionDataTitleEl = sectionDataEl?.querySelector(".card-header h2");
const sectionSettingsSummaryWrap =
  sectionSettingsSummaryEl?.closest(".modal-field");
if (sectionSettingsSummaryWrap) {
  sectionSettingsSummaryWrap.style.display = "none";
}
let pendingSettingsSection = null;

/* ── 关联 IV 弹窗 ── */
const linkIvModalEl = document.getElementById("linkIvModal");
const linkIvCloseEl = document.getElementById("linkIvClose");
const linkIvCancelEl = document.getElementById("linkIvCancel");
const linkIvClearEl = document.getElementById("linkIvClear");
const linkIvSearchEl = document.getElementById("linkIvSearch");
const linkIvListEl = document.getElementById("linkIvList");
let pendingLinkIvPiItem = null; /* 正在关联的 PI 原始 item */
let pendingLinkIvPiIndex = -1; /* 在 state.data.purchasePI 中的下标 */

const dataSections = new Map();
document.querySelectorAll(".data-section").forEach((section) => {
  dataSections.set(section.dataset.section, {
    root: section,
    parent: section.parentElement,
    count: section.querySelector(".data-count"),
    table: section.querySelector(".data-table"),
    summary: section.querySelector(".summary-panel"),
    tools: section.querySelector(".section-tools"),
    searchInput: section.querySelector(".search-input"),
    filterSelect: section.querySelector(".filter-select"),
    footer: section.querySelector(".section-footer"),
    pageSizes: Array.from(section.querySelectorAll(".page-size")),
    pageInfo: section.querySelector(".page-info"),
    pagerButtons: Array.from(section.querySelectorAll(".pager-btn"))
  });
});

const entities = [
  {
    name: "supplier",
    label: "供应商",
    method: "GET",
    path: "/{accountBookId}/creditor/listing",
    paginate: true,
    query: {
      field: [
        "accNo",
        "parentAccNo",
        "companyName",
        "desc2",
        "registerNo",
        "isActive",
        "address",
        "postCode",
        "phone1",
        "phone2",
        "fax1",
        "fax2",
        "areaCode",
        "emailAddress",
        "webURL",
        "attention",
        "natureOfBusiness",
        "currencyCode",
        "creditTerm",
        "taxCode",
        "taxRegisterNo",
        "taxEntity",
        "taxExemptionNo",
        "taxExemptionExpiryDate",
        "deliverAddress",
        "deliverPostCode",
        "note",
        "salesAgent"
      ]
    }
  },
  {
    name: "customer",
    label: "客户",
    method: "GET",
    path: "/{accountBookId}/debtor/listing",
    paginate: true,
    query: {
      field: [
        "accNo",
        "parentAccNo",
        "companyName",
        "desc2",
        "registerNo",
        "isActive",
        "address",
        "postCode",
        "phone1",
        "phone2",
        "fax1",
        "fax2",
        "areaCode",
        "emailAddress",
        "webURL",
        "attention",
        "natureOfBusiness",
        "currencyCode",
        "creditTerm",
        "taxCode",
        "taxRegisterNo",
        "taxEntity",
        "taxExemptionNo",
        "taxExemptionExpiryDate",
        "deliverAddress",
        "deliverPostCode",
        "note",
        "salesAgent"
      ]
    }
  },
  {
    name: "product",
    label: "产品库",
    method: "POST",
    path: "/{accountBookId}/product/listing",
    paginate: true,
    pageInBody: true
  },
  {
    name: "invoice",
    label: "销售发票",
    method: "POST",
    path: "/{accountBookId}/invoice/listing",
    paginate: true,
    pageInBody: true,
    bodyBuilder: "dateFilter",
    fullSyncOnly: true,
    dateFilter: {
      startParam: "startDate",
      endParam: "endDate",
      defaultStart: "2000-01-01T00:00:00Z"
    }
  },
  {
    name: "quotation",
    label: "销售报价",
    method: "POST",
    path: "/{accountBookId}/quotation/listing",
    paginate: true,
    pageInBody: true,
    bodyBuilder: "dateFilter",
    fullSyncOnly: true,
    dateFilter: {
      startParam: "startDate",
      endParam: "endDate",
      defaultStart: "2000-01-01T00:00:00Z"
    }
  },
  {
    name: "creditNote",
    label: "销售贷项",
    method: "POST",
    path: "/{accountBookId}/creditnote/listing",
    paginate: true,
    pageInBody: true,
    bodyBuilder: "dateFilter",
    fullSyncOnly: true,
    dateFilter: {
      startParam: "startDate",
      endParam: "endDate",
      defaultStart: "2000-01-01T00:00:00Z"
    }
  },
  {
    name: "purchaseOrder",
    label: "采购订单",
    method: "POST",
    path: "/{accountBookId}/purchaseorder/listing",
    paginate: true,
    pageInBody: true,
    bodyBuilder: "dateFilter",
    fullSyncOnly: true,
    dateFilter: {
      startParam: "startDate",
      endParam: "endDate",
      defaultStart: "2000-01-01T00:00:00Z"
    }
  },
  {
    name: "purchaseInvoice",
    label: "采购发票",
    method: "POST",
    path: "/{accountBookId}/purchaseinvoice/listing",
    paginate: true,
    pageInBody: true,
    bodyBuilder: "dateFilter",
    fullSyncOnly: true,
    dateFilter: {
      startParam: "startDate",
      endParam: "endDate",
      defaultStart: "2000-01-01T00:00:00Z"
    }
  },
  {
    name: "purchaseReturn",
    label: "采购退货",
    method: "POST",
    path: "/{accountBookId}/purchasereturn/listing",
    paginate: true,
    pageInBody: true,
    bodyBuilder: "dateFilter",
    fullSyncOnly: true,
    dateFilter: {
      startParam: "startDate",
      endParam: "endDate",
      defaultStart: "2000-01-01T00:00:00Z"
    }
  }
];

const MAX_PAGES = 50;
const MAX_ITEMS_PER_SECTION = 20;

const selectableEntities = new Set([
  "invoice",
  "quotation",
  "creditNote",
  "purchaseOrder",
  "purchaseInvoice",
  "purchaseReturn",
  "purchasePI"
]);

const fieldMap = {
  supplier: [
    ["companyName", "公司"],
    ["accNo", "科目"],
    ["phone1", "电话"],
    ["emailAddress", "邮箱"],
    ["currencyCode", "币种"]
  ],
  customer: [
    ["companyName", "公司"],
    ["accNo", "科目"],
    ["phone1", "电话"],
    ["emailAddress", "邮箱"],
    ["currencyCode", "币种"]
  ],
  product: [
    ["code", "编码"],
    ["description", "名称"],
    ["uom", "单位"],
    ["price", "Price"],
    ["cost", "Cost"],
    ["itemType", "类型"]
  ],
  invoice: [
    ["docNo", "单号"],
    ["docDate", "日期"],
    ["debtorCode", "客户编码"],
    ["debtorName", "客户名称"],
    ["salesAgent", "代理"],
    ["currencyCode", "币种"],
    ["currencyRate", "汇率"],
    ["totalExTax", "小计(未税)"],
    ["tax", "税额"],
    ["localTax", "本地税额"],
    ["total", "合计"],
    ["localNetTotal", "本地合计"],
    ["status", "状态"],
    ["eInvoiceStatus", "电子发票状态"]
  ],
  quotation: [
    ["docNo", "单号"],
    ["docDate", "日期"],
    ["debtorCode", "客户编码"],
    ["debtorName", "客户名称"],
    ["salesAgent", "代理"],
    ["currencyCode", "币种"],
    ["currencyRate", "汇率"],
    ["totalExTax", "小计(未税)"],
    ["tax", "税额"],
    ["localTax", "本地税额"],
    ["total", "合计"],
    ["localNetTotal", "本地合计"],
    ["status", "状态"],
    ["email", "邮箱"],
    ["address", "地址"],
    ["paymentTerm", "付款条款"]
  ],
  creditNote: [
    ["docNo", "单号"],
    ["docDate", "日期"],
    ["debtorCode", "客户编码"],
    ["debtorName", "客户名称"],
    ["salesAgent", "代理"],
    ["currencyCode", "币种"],
    ["currencyRate", "汇率"],
    ["totalExTax", "小计(未税)"],
    ["tax", "税额"],
    ["localTax", "本地税额"],
    ["total", "合计"],
    ["localNetTotal", "本地合计"],
    ["status", "状态"],
    ["eInvoiceStatus", "电子发票状态"]
  ],
  purchaseOrder: [
    ["docNo", "单号"],
    ["docDate", "日期"],
    ["creditorCode", "供应商编码"],
    ["creditorName", "供应商名称"],
    ["currencyCode", "币种"],
    ["currencyRate", "汇率"],
    ["totalExTax", "小计(未税)"],
    ["tax", "税额"],
    ["localTax", "本地税额"],
    ["total", "合计"],
    ["localNetTotal", "本地合计"],
    ["status", "状态"]
  ],
  purchaseInvoice: [
    ["docNo", "单号"],
    ["supplierInvoiceNo", "供应商发票号"],
    ["docDate", "日期"],
    ["creditorCode", "供应商编码"],
    ["creditorName", "供应商名称"],
    ["currencyCode", "币种"],
    ["currencyRate", "汇率"],
    ["totalExTax", "小计(未税)"],
    ["tax", "税额"],
    ["localTax", "本地税额"],
    ["total", "合计"],
    ["localNetTotal", "本地合计"],
    ["status", "状态"]
  ],
  purchaseReturn: [
    ["docNo", "单号"],
    ["supplierCNNo", "供应商退货单"],
    ["docDate", "日期"],
    ["creditorCode", "供应商编码"],
    ["creditorName", "供应商名称"],
    ["currencyCode", "币种"],
    ["currencyRate", "汇率"],
    ["totalExTax", "小计(未税)"],
    ["tax", "税额"],
    ["localTax", "本地税额"],
    ["total", "合计"],
    ["localNetTotal", "本地合计"],
    ["status", "状态"]
  ]
};

const entityLabelMap = new Map(entities.map((entity) => [entity.name, entity.label]));
const sectionMap = new Map([
  ["log", document.getElementById("section-log")],
  ["data", document.getElementById("section-data")]
]);

function setActiveMenu(key) {
  document.querySelectorAll(".menu-btn").forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.getAttribute("data-overlay-target") === key
    );
  });
}

/* 需要过滤 Void 状态的实体列表 */
const voidFilterEntities = new Set([
  "invoice", "quotation", "creditNote",
  "purchaseOrder", "purchaseInvoice", "purchaseReturn"
]);

function getEntityData(entityName) {
  const raw = state.data[entityName] || [];
  /* 过滤掉 Status 为 Void 的记录 */
  if (voidFilterEntities.has(entityName)) {
    return raw.filter((item) => {
      const r = extractRecord(item);
      const status = String(getFieldValue(r, "status") || "").toLowerCase();
      return status !== "void";
    });
  }
  return raw;
}

function showSection(key) {
  overlaySections.forEach((section) => {
    section.style.display = "none";
  });
  if (dataSections.has(key) && sectionDataEl) {
    sectionDataEl.style.display = "block";
    dataSections.forEach((section, entityName) => {
      section.root.style.display = entityName === key ? "block" : "none";
    });
    if (sectionDataTitleEl) {
      sectionDataTitleEl.textContent =
        entityLabelMap.get(key) || sectionDataTitleEl.textContent;
    }
    /* 进入列表复位：回到第 1 页并清除勾选 */
    const ui = getSectionUi(key);
    ui.selected.clear();
    ui.page = 1;
    renderSection(key, getEntityData(key));
    setActiveMenu(key);
    return;
  }
  const targetSection = sectionMap.get(key);
  if (targetSection) {
    targetSection.style.display = "block";
    setActiveMenu(key);
  }
}

const listColumns = {
  supplier: [
    ["accNo", "Supplier Code"],
    ["companyName", "Company Name"],
    ["taxEntity", "Tax Entity"],
    ["currencyCode", "Currency"],
    ["phone1", "Phone"],
    ["areaCode", "Area"],
    ["salesAgent", "Agent"],
    ["isActive", "Active"]
  ],
  customer: [
    ["accNo", "Customer Code"],
    ["companyName", "Company Name"],
    ["taxEntity", "Tax Entity"],
    ["currencyCode", "Currency"],
    ["phone1", "Phone"],
    ["areaCode", "Area"],
    ["salesAgent", "Agent"],
    ["isActive", "Active"]
  ],
  product: [
    ["productCode", "Product Code"],
    ["productName", "Product Name"],
    ["productType", "Product Type"],
    ["unit", "Unit"],
    ["price", "Price"],
    ["cost", "Cost"],
    ["productCategoryName", "Product Category"],
    ["classificationCode", "Classification Code"],
    ["status", "Status"]
  ],
  invoice: [
    ["docNo", "Doc No"],
    ["docDate", "Doc Date"],
    ["debtorName", "Customer"],
    ["salesAgent", "Agent"],
    ["currencyCode", "Currency"],
    ["total", "Total"],
    ["_createdFlag", "PO"],
    ["status", "Status"]
  ],
  quotation: [
    ["docNo", "Doc No"],
    ["docDate", "Date"],
    ["debtorCode", "Customer Code"],
    ["debtorName", "Customer Name"],
    ["salesAgent", "Agent"],
    ["currencyCode", "Curr. Code"],
    ["currencyRate", "Curr. Rate"],
    ["totalExTax", "Subtotal (ex)"],
    ["tax", "Tax"],
    ["localTax", "Local Tax"],
    ["total", "Total"],
    ["localNetTotal", "Local Total"],
    ["status", "Status"]
  ],
  creditNote: [
    ["docNo", "Doc No"],
    ["docDate", "Doc Date"],
    ["debtorName", "Customer"],
    ["currencyCode", "Currency"],
    ["total", "Total"],
    ["status", "Status"]
  ],
  purchaseOrder: [
    ["docNo", "Doc No"],
    ["docDate", "Doc Date"],
    ["creditorName", "Supplier"],
    ["currencyCode", "Currency"],
    ["total", "Total"],
    ["_createdFlag", "PI"],
    ["status", "Status"]
  ],
  purchaseInvoice: [
    ["docNo", "Doc No"],
    ["docDate", "Doc Date"],
    ["creditorName", "Supplier"],
    ["currencyCode", "Currency"],
    ["total", "Total"],
    ["status", "Status"]
  ],
  purchaseReturn: [
    ["docNo", "Doc No"],
    ["docDate", "Doc Date"],
    ["creditorName", "Supplier"],
    ["currencyCode", "Currency"],
    ["total", "Total"],
    ["status", "Status"]
  ],
  purchasePI: [
    ["docNo", "PI No"],
    ["docDate", "Doc Date"],
    ["creditorName", "Supplier"],
    ["referencePoNo", "Ref PO No"],
    ["referenceIvNo", "Ref IV No"],
    ["ivCustomerName", "IV Customer"],
    ["ivTotal", "IV Total"],
    ["piTotal", "PI Total"],
    ["currencyCode", "Currency"],
    ["_createdFlag", "发票"]
  ],
};

/* ---------- 每种实体的列宽模板 ---------- */
/* checkbox 30px | 数据列按内容类型 | 操作列固定宽度(按按钮数) */
/* 操作列宽：2按钮=120px, 3按钮=180px */
const columnWidthMap = {
  supplier: {
    // Code | Name | TaxEntity | Currency | Phone | Area | Agent | Active | 操作(2btn)
    noSel: "100px 2fr 1.2fr 60px 120px 70px 60px 50px 120px"
  },
  customer: {
    noSel: "100px 2fr 1.2fr 60px 120px 70px 60px 50px 120px"
  },
  product: {
    // Code | Name | Type | Unit | Price | Cost | Category | ClassCode | Status | 操作(2btn)
    noSel: "120px 2fr 100px 50px 80px 80px 1.2fr 110px 60px 120px"
  },
  invoice: {
    // ☑ | DocNo | DocDate | Customer | Agent | Currency | Total | PO标识 | Status | 操作(3btn)
    sel: "30px 110px 90px 2fr 80px 55px 80px 40px 70px 180px"
  },
  quotation: {
    // ☑ | DocNo | Date | CustCode | CustName | Agent | Curr | Rate | Subtotal | Tax | LTax | Total | LTotal | Status | 操作(2btn)
    sel: "30px 100px 90px 90px 1.5fr 50px 55px 50px 80px 60px 70px 70px 80px 70px 120px"
  },
  creditNote: {
    // ☑ | DocNo | DocDate | Customer | Currency | Total | Status | 操作(2btn)
    sel: "30px 110px 100px 2fr 60px 80px 90px 120px"
  },
  purchaseOrder: {
    // ☑ | DocNo | DocDate | Supplier | Currency | Total | PI标识 | Status | 操作(3btn)
    sel: "30px 110px 100px 2fr 60px 80px 40px 70px 180px"
  },
  purchaseInvoice: {
    // ☑ | DocNo | DocDate | Supplier | Currency | Total | Status | 操作(2btn)
    sel: "30px 110px 100px 2fr 60px 80px 90px 120px"
  },
  purchaseReturn: {
    // ☑ | DocNo | DocDate | Supplier | Currency | Total | Status | 操作(2btn)
    sel: "30px 110px 100px 2fr 60px 80px 90px 120px"
  },
  purchasePI: {
    // ☑ | PINo | DocDate | Supplier | RefPONo | RefIVNo | IVCustomer | IVTotal | PITotal | Currency | 发票标识 | 操作(5btn)
    sel: "30px 100px 85px 1fr 100px 100px 1fr 75px 75px 55px 40px 290px"
  },
};

function getGridTemplate(entityName, useSelection) {
  const map = columnWidthMap[entityName];
  if (map) {
    if (useSelection && map.sel) return map.sel;
    if (!useSelection && map.noSel) return map.noSel;
    /* 实体有sel但被当noSel调用(或反过来)，取存在的那个 */
    return map.sel || map.noSel;
  }
  /* 回退：根据列数等宽 */
  const cols = (listColumns[entityName] || []).length + 1 + (useSelection ? 1 : 0);
  return `repeat(${cols}, minmax(80px, 1fr))`;
}

const drawerTabs = [
  {
    key: "account",
    label: "Account",
    fields: [
      ["isActive", "Active"],
      ["parentAccNo", "Control Account"],
      ["accNo", "Customer Code"],
      ["companyName", "Company Name"],
      ["desc2", "Alternate Company Name"],
      ["registerNo", "Registration No."],
      ["taxRegisterNo", "Tax Registration No. / TIN"],
      ["taxEntity", "Tax Entity"],
      ["taxExemptionNo", "Tax Exemption No."],
      ["taxExemptionExpiryDate", "Tax Exemption Expiry Date"]
    ]
  },
  {
    key: "general",
    label: "General",
    fields: [
      ["address", "Billing Address"],
      ["deliverAddress", "Delivery Address"],
      ["postCode", "Billing Post Code / Zip Code"],
      ["deliverPostCode", "Delivery Post Code / Zip Code"],
      ["areaCode", "Area"],
      ["phone1", "Phone"],
      ["phone2", "Phone 2"],
      ["fax1", "Fax"],
      ["fax2", "Fax 2"],
      ["emailAddress", "Email Address"],
      ["webURL", "Website"],
      ["attention", "Attention"],
      ["natureOfBusiness", "Business Nature"]
    ]
  },
  {
    key: "others",
    label: "Others",
    fields: [
      ["salesAgent", "Agent"],
      ["currencyCode", "Currency"],
      ["creditTerm", "Credit Term"],
      ["taxCode", "Tax Code"]
    ]
  },
  {
    key: "note",
    label: "Note",
    fields: [["note", "Note"]]
  }
];

const productDrawerTabs = [
  {
    key: "basic",
    label: "Basic",
    fields: [
      ["productCode", "Product Code"],
      ["productName", "Product Name"],
      ["productType", "Product Type"],
      ["unit", "Unit"],
      ["status", "Status"],
      ["productName2", "Alternate Product Name"],
      ["productCategoryName", "Product Category"],
      ["postingGroup", "Product Posting"],
      ["supplier", "Supplier"],
      ["supplyTaxCode", "Supply Tax Code"],
      ["purchaseTaxCode", "Purchase Tax Code"],
      ["tariffCode", "Tariff Code"],
      ["price", "Price"],
      ["minPrice", "Minimum Price"],
      ["cost", "Cost"],
      ["barCode", "Barcode"]
    ]
  },
  {
    key: "variants",
    label: "Product Variants",
    fields: [
      ["variant1Name", "Variant 1 Name"],
      ["variant2Name", "Variant 2 Name"]
    ]
  },
  {
    key: "einvoicing",
    label: "e-Invoicing",
    fields: [
      ["classificationCode", "Classification Code"],
      ["unitType", "Unit Type"],
      ["cannotConsolidateInvoice", "Must generate e-Invoice"]
    ]
  }
];

const quotationDrawerTabs = [
  {
    key: "basic",
    label: "Basic",
    fields: [
      ["debtorCode", "Customer"],
      ["debtorName", "Name"],
      ["email", "Email"],
      ["docNo", "Quotation No."],
      ["address", "Address"],
      ["salesAgent", "Sales Agent"],
      ["paymentTerm", "Payment Term"],
      ["docDate", "Date"]
    ]
  },
  {
    key: "items",
    label: "Items",
    columns: [
      { key: "productCode", label: "Product Code" },
      {
        label: "Product Variant",
        value: (row) =>
          [row.productVariant1Option, row.productVariant2Option]
            .filter(Boolean)
            .join(" / ")
      },
      { key: "description", label: "Description" },
      { key: "furtherDescription", label: "Furt." },
      { key: "deptNo", label: "Dept No." },
      { key: "qty", label: "Qty" },
      { key: "unitPrice", label: "Unit Price" },
      { key: "discount", label: "Discount" },
      { key: "taxCode", label: "Tax Code" },
      { key: "subTotal", label: "Total (inc)" }
    ],
    source: "details"
  },
  {
    key: "note",
    label: "Note",
    fields: [["note", "Note"]]
  }
];

const invoiceDrawerTabs = [
  {
    key: "basic",
    label: "Basic",
    fields: [
      ["debtorCode", "Customer"],
      ["debtorName", "Name"],
      ["email", "Email"],
      ["docNo", "Invoice No."],
      ["address", "Address"],
      ["salesAgent", "Sales Agent"],
      ["creditTerm", "Credit Term"],
      ["docDate", "Date"],
      ["taxDate", "Tax Date"]
    ]
  },
  {
    key: "items",
    label: "Items",
    columns: [
      { key: "productCode", label: "Product Code" },
      {
        label: "Product Variant",
        value: (row) =>
          [row.productVariant1Option, row.productVariant2Option]
            .filter(Boolean)
            .join(" / ")
      },
      { key: "description", label: "Description" },
      { key: "furtherDescription", label: "Furt." },
      { key: "deptNo", label: "Dept No." },
      { key: "qty", label: "Qty" },
      { key: "unitPrice", label: "Unit Price" },
      { key: "discount", label: "Discount" },
      { key: "unit", label: "Unit" },
      { key: "taxCode", label: "Tax Code" },
      { key: "subTotal", label: "Total (inc)" }
    ],
    source: "details"
  },
  {
    key: "note",
    label: "Note",
    fields: [["note", "Note"]]
  }
];

const creditNoteDrawerTabs = [
  {
    key: "basic",
    label: "Basic",
    fields: [
      ["debtorCode", "Customer"],
      ["debtorName", "Name"],
      ["email", "Email"],
      ["docNo", "C/N No."],
      ["address", "Address"],
      ["salesAgent", "Sales Agent"],
      ["ourInvoiceNo", "Our Invoice No."],
      ["reason", "Reason"],
      ["docDate", "Date"],
      ["taxDate", "Tax Date"]
    ]
  },
  {
    key: "items",
    label: "Items",
    columns: [
      { key: "productCode", label: "Product Code" },
      {
        label: "Product Variant",
        value: (row) =>
          [row.productVariant1Option, row.productVariant2Option]
            .filter(Boolean)
            .join(" / ")
      },
      { key: "description", label: "Description" },
      { key: "furtherDescription", label: "Furt." },
      { key: "deptNo", label: "Dept No." },
      { key: "qty", label: "Qty" },
      { key: "unitPrice", label: "Unit Price" },
      { key: "discount", label: "Discount" },
      { key: "unit", label: "Unit" },
      { key: "taxCode", label: "Tax Code" },
      { key: "subTotal", label: "Total (inc)" }
    ],
    source: "details"
  },
  {
    key: "note",
    label: "Note",
    fields: [["note", "Note"]]
  }
];

const purchaseOrderDrawerTabs = [
  {
    key: "basic",
    label: "Basic",
    fields: [
      ["creditorCode", "Supplier"],
      ["creditorName", "Name"],
      ["email", "Email"],
      ["docNo", "P/O No."],
      ["address", "Address"],
      ["creditTerm", "Credit Term"],
      ["docDate", "Date"]
    ]
  },
  {
    key: "items",
    label: "Items",
    columns: [
      { key: "productCode", label: "Product Code" },
      {
        label: "Product Variant",
        value: (row) =>
          [row.productVariant1Option, row.productVariant2Option]
            .filter(Boolean)
            .join(" / ")
      },
      { key: "description", label: "Description" },
      { key: "furtherDescription", label: "Furt." },
      { key: "deptNo", label: "Dept No." },
      { key: "qty", label: "Qty" },
      { key: "unitPrice", label: "Unit Price" },
      { key: "discount", label: "Discount" },
      { key: "taxCode", label: "Tax Code" },
      { key: "subTotal", label: "Total (inc)" }
    ],
    source: "details"
  },
  {
    key: "note",
    label: "Note",
    fields: [["note", "Note"]]
  }
];

const purchaseInvoiceDrawerTabs = [
  {
    key: "basic",
    label: "Basic",
    fields: [
      ["creditorCode", "Supplier"],
      ["creditorName", "Name"],
      ["creditTerm", "Credit Term"],
      ["supplierInvoiceNo", "Supplier Invoice No."],
      ["docNo", "P/I No."],
      ["address", "Address"],
      ["docDate", "Date"],
      ["orgDocDate", "Orig. Doc. Date"],
      ["taxDate", "Tax Date"]
    ]
  },
  {
    key: "items",
    label: "Items",
    columns: [
      { key: "productCode", label: "Product Code" },
      {
        label: "Product Variant",
        value: (row) =>
          [row.productVariant1Option, row.productVariant2Option]
            .filter(Boolean)
            .join(" / ")
      },
      { key: "description", label: "Description" },
      { key: "furtherDescription", label: "Furt." },
      { key: "deptNo", label: "Dept No." },
      { key: "qty", label: "Qty" },
      { key: "unitPrice", label: "Unit Price" },
      { key: "discount", label: "Discount" },
      { key: "taxCode", label: "Tax Code" },
      { key: "subTotal", label: "Total (inc)" }
    ],
    source: "details"
  },
  {
    key: "note",
    label: "Note",
    fields: [["note", "Note"]]
  }
];

const purchaseReturnDrawerTabs = [
  {
    key: "basic",
    label: "Basic",
    fields: [
      ["creditorCode", "Supplier"],
      ["creditorName", "Name"],
      ["supplierCNNo", "Supplier C/N No."],
      ["supplierInvoiceNo", "Supplier Invoice No."],
      ["docNo", "P/R No."],
      ["address", "Address"],
      ["reason", "Reason"],
      ["creditTerm", "Credit Term"],
      ["docDate", "Date"],
      ["orgDocDate", "Orig. Doc. Date"],
      ["taxDate", "Tax Date"]
    ]
  },
  {
    key: "items",
    label: "Items",
    columns: [
      { key: "productCode", label: "Product Code" },
      {
        label: "Product Variant",
        value: (row) =>
          [row.productVariant1Option, row.productVariant2Option]
            .filter(Boolean)
            .join(" / ")
      },
      { key: "description", label: "Description" },
      { key: "furtherDescription", label: "Furt." },
      { key: "deptNo", label: "Dept No." },
      { key: "qty", label: "Qty" },
      { key: "unitPrice", label: "Unit Price" },
      { key: "discount", label: "Discount" },
      { key: "taxCode", label: "Tax Code" },
      { key: "subTotal", label: "Total (inc)" }
    ],
    source: "details"
  },
  {
    key: "note",
    label: "Note",
    fields: [["note", "Note"]]
  }
];

/* ────── 后端 API 基址（与当前页面同源） ────── */
function getApiBase() {
  return window.location.origin;
}

async function apiGet(path) {
  const resp = await fetch(getApiBase() + path);
  if (!resp.ok) throw new Error(`API GET ${path} 失败: ${resp.status}`);
  return resp.json();
}

async function apiPost(path, body) {
  const resp = await fetch(getApiBase() + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!resp.ok) throw new Error(`API POST ${path} 失败: ${resp.status}`);
  return resp.json();
}

async function apiDelete(path) {
  const resp = await fetch(getApiBase() + path, { method: "DELETE" });
  if (!resp.ok) throw new Error(`API DELETE ${path} 失败: ${resp.status}`);
  return resp.json();
}

/* ────── 从后端加载全部持久化数据 ────── */
async function loadAllFromBackend() {
  try {
    const result = await apiGet("/api/data/all");
    if (!result.ok) throw new Error("加载失败");
    /* 配置 */
    if (result.config) {
      state.config = { ...state.config, ...result.config };
    }
    /* 同步状态 */
    if (result.syncState) {
      state.syncState = result.syncState;
    }
    /* 同步数据 */
    if (result.data) {
      Object.keys(result.data).forEach((key) => {
        state.data[key] = result.data[key];
      });
    }
    /* 本地 PI 数据 */
    if (result.purchasePI && result.purchasePI.length) {
      state.data.purchasePI = result.purchasePI;
    }
    appendLog(`从数据库加载完成。`);
    return true;
  } catch (e) {
    appendLog("从数据库加载失败: " + e.message + "，尝试 localStorage 回退。");
    /* 回退到 localStorage */
    loadConfigFromLocal();
    loadSyncStateFromLocal();
    return false;
  }
}

/* localStorage 回退（保留兼容性） */
function loadConfigFromLocal() {
  const raw = localStorage.getItem("autocount-config");
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    state.config = { ...state.config, ...parsed };
  } catch (error) {
    appendLog("配置解析失败，已忽略。");
  }
}

function loadSyncStateFromLocal() {
  const raw = localStorage.getItem("autocount-sync-state");
  if (!raw) return;
  try {
    state.syncState = JSON.parse(raw);
  } catch (error) {
    state.syncState = {};
  }
}

/* 兼容旧调用 */
function loadConfig() { loadConfigFromLocal(); }
function loadSyncState() { loadSyncStateFromLocal(); }

async function persistSyncState() {
  localStorage.setItem("autocount-sync-state", JSON.stringify(state.syncState));
  /* 同时写入后端 */
  try {
    for (const [entity, val] of Object.entries(state.syncState)) {
      await apiPost("/api/syncstate", {
        entity,
        lastSync: val.lastSync || null,
        meta: val
      });
    }
  } catch (e) { /* 静默失败 */ }
}

/* 配置已改为后端环境变量驱动，前端不再需要表单 */
function applyConfigToForm() { /* noop */ }

async function persistConfig() {
  localStorage.setItem("autocount-config", JSON.stringify(state.config));
  try {
    await apiPost("/api/config", state.config);
  } catch (e) { /* 静默失败 */ }
}

function updateConfigFromForm() { /* noop — 配置从数据库/环境变量读取 */ }

function appendLog(message) {
  const timestamp = new Date().toLocaleTimeString("zh-CN", {
    hour12: false
  });
  logEl.textContent = `[${timestamp}] ${message}\n${logEl.textContent}`;
}

function buildAutoCountPath(template) {
  return template.replace("{accountBookId}", state.config.accountBookId);
}

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

async function callAutoCount({ method, path, query, body }) {
  if (!state.config.baseUrl) {
    throw new Error("请先配置 API 基础地址");
  }
  if (!state.config.accountBookId) {
    throw new Error("请填写账套 ID");
  }
  const url = `${state.config.baseUrl.replace(/\/$/, "")}${buildAutoCountPath(
    path
  )}${buildQuery(query)}`;
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Key-ID": state.config.keyId,
      "API-Key": state.config.apiKey
    },
    body: method === "GET" ? undefined : JSON.stringify(body || {})
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`请求失败 ${response.status}: ${text}`);
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`响应解析失败: ${text}`);
  }
}

async function callProxy(payload) {
  /* 远程环境始终使用当前 origin 作为代理地址（同源）；本地才允许自定义 */
  const proxyBase = isRemote
    ? window.location.origin
    : (state.config.proxyBaseUrl || window.location.origin);
  const url = `${proxyBase.replace(/\/$/, "")}/api/proxy`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`代理请求失败 ${response.status}: ${text}`);
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`代理响应解析失败: ${text}`);
  }
}

async function callWithMode({ method, path, query, body }) {
  if (state.config.connectMode === "proxy") {
    return callProxy({
      method,
      path,
      query,
      body,
      baseUrl: state.config.baseUrl,
      accountBookId: state.config.accountBookId,
      keyId: state.config.keyId,
      apiKey: state.config.apiKey
    });
  }
  return callAutoCount({ method, path, query, body });
}

async function testConnection() {
  appendLog("开始测试连接...");
  await callWithMode({
    method: "GET",
    path: "/{accountBookId}/companyprofile"
  });
  appendLog("连接成功。");
}

function getEntityConfig(name) {
  return entities.find((entity) => entity.name === name);
}

function buildDateQuery(entity) {
  if (!entity.dateFilter) {
    return {};
  }
  const range = buildDateRange(entity);
  return {
    [entity.dateFilter.startParam]: range.from,
    [entity.dateFilter.endParam]: range.to
  };
}

function buildDateRange(entity) {
  const lastSync = entity.fullSyncOnly
    ? undefined
    : state.syncState[entity.name]?.lastSync;
  const startDate = lastSync || entity.dateFilter?.defaultStart;
  const endDate = new Date().toISOString();
  return {
    from: startDate,
    to: endDate
  };
}

function formatItem(item) {
  const fields = [
    "docNo",
    "docKey",
    "code",
    "accNo",
    "companyName",
    "debtorCode",
    "debtorName",
    "description",
    "name"
  ];
  for (const field of fields) {
    if (item && item[field]) {
      return `${field}: ${item[field]}`;
    }
  }
  try {
    return JSON.stringify(item);
  } catch (error) {
    return String(item);
  }
}

function formatDisplayValue(value) {
  if (typeof value === "string") {
    return value.replace(/T00:00:00(?:\.000)?Z?/, "");
  }
  return value;
}

function extractRecord(item) {
  if (item && typeof item === "object" && item.master) {
    return { ...item.master };
  }
  if (item && typeof item === "object" && item.product) {
    return { ...item.product };
  }
  return item;
}

function getFieldDefinitions(entityName) {
  return fieldMap[entityName] || [["content", "内容"]];
}

function getFieldValue(record, key) {
  if (!record || typeof record !== "object") {
    return undefined;
  }
  if (record[key] !== undefined && record[key] !== null && record[key] !== "") {
    return record[key];
  }
  const target = key.toLowerCase();
  const match = Object.keys(record).find(
    (recordKey) => recordKey.toLowerCase() === target
  );
  if (match) {
    return record[match];
  }
  return undefined;
}

function buildTableRow(entityName, item, fields) {
  const record = extractRecord(item);
  return fields.map(([key]) => {
    if (key === "content") {
      return formatItem(item);
    }
    let value = getFieldValue(record, key);
    if (entityName === "product" && key === "price") {
      const price =
        Number(getFieldValue(record, "price")) ||
        Number(getFieldValue(record, "unitPrice")) ||
        Number(getFieldValue(record, "sellingPrice"));
      if (Number.isFinite(price)) {
        return formatNumberFixed(price);
      }
      return "-";
    }
    if (entityName === "product" && key === "cost") {
      const cost = pickCostValue(record);
      if (Number.isFinite(cost)) {
        return formatNumberFixed(cost);
      }
      return "-";
    }
    if (value === undefined || value === null || value === "") {
      return "-";
    }
    return String(value);
  });
}

function renderDrawerTab(tab, record, item) {
  const panel = document.createElement("div");
  panel.className = "drawer-panel-content";
  if (tab.columns) {
    const table = document.createElement("div");
    table.className = "drawer-table";
    const header = document.createElement("div");
    header.className = "drawer-table-row header";
    tab.columns.forEach((col) => {
      const cell = document.createElement("div");
      cell.className = "drawer-table-cell";
      cell.textContent = col.label;
      header.appendChild(cell);
    });
    table.appendChild(header);

    const rows = Array.isArray(item?.[tab.source]) ? item[tab.source] : [];
    rows.forEach((row) => {
      const rowEl = document.createElement("div");
      rowEl.className = "drawer-table-row";
      tab.columns.forEach((col) => {
        const cell = document.createElement("div");
        cell.className = "drawer-table-cell";
        const value =
          typeof col.value === "function"
            ? col.value(row)
            : getFieldValue(row, col.key);
        cell.textContent =
          value === undefined || value === null || value === "" ? "-" : value;
        rowEl.appendChild(cell);
      });
      table.appendChild(rowEl);
    });

    if (rows.length === 0) {
      const rowEl = document.createElement("div");
      rowEl.className = "drawer-table-row";
      const cell = document.createElement("div");
      cell.className = "drawer-table-cell";
      cell.textContent = "暂无明细";
      rowEl.appendChild(cell);
      table.appendChild(rowEl);
    }

    panel.appendChild(table);
    return panel;
  }
  tab.fields.forEach(([key, label]) => {
    const row = document.createElement("div");
    row.className = "data-detail-row";
    let value =
      key === "content" ? formatItem(item) : getFieldValue(record, key);
    if (tab.key === "allFields" && value && typeof value === "object") {
      try {
        value = JSON.stringify(value);
      } catch (error) {
        value = String(value);
      }
    }
    value = formatDisplayValue(value);
    row.innerHTML = `<span class="label">${label}</span><span class="value">${
      value === undefined || value === null || value === "" ? "-" : value
    }</span>`;
    panel.appendChild(row);
  });
  return panel;
}

function openDrawer(entityName, item, record) {
  const entity = getEntityConfig(entityName);
  const title = entity?.label || entityName;
  drawerEl.classList.remove("invoice-modal");
  drawerTitleEl.textContent = `${title} 详情`;
  drawerCloseEl.textContent = "关闭";
  const headerMeta = drawerEl.querySelector(".drawer-header-meta");
  if (headerMeta) {
    headerMeta.remove();
  }
  drawerTabsEl.innerHTML = "";
  drawerContentEl.innerHTML = "";

  if (entityName === "invoice") {
    const recordData = {
      ...(item && typeof item === "object" ? item : {}),
      ...(record && typeof record === "object" ? record : {})
    };
    renderInvoiceModal(item, recordData);
    drawerEl.classList.remove("hidden");
    return;
  }

  let tabsConfig = [
    {
      key: "detail",
      label: "Detail",
      fields: getFieldDefinitions(entityName)
    }
  ];

  if (entityName === "customer" || entityName === "supplier") {
    tabsConfig = drawerTabs;
  }

  if (entityName === "product") {
    tabsConfig = productDrawerTabs;
  }

  if (entityName === "quotation") {
    tabsConfig = quotationDrawerTabs;
  }

  if (entityName === "invoice") {
    tabsConfig = invoiceDrawerTabs;
  }

  if (entityName === "creditNote") {
    tabsConfig = creditNoteDrawerTabs;
  }

  if (entityName === "purchaseOrder") {
    tabsConfig = purchaseOrderDrawerTabs;
  }

  if (entityName === "purchaseInvoice") {
    tabsConfig = purchaseInvoiceDrawerTabs;
  }

  if (entityName === "purchaseReturn") {
    tabsConfig = purchaseReturnDrawerTabs;
  }

  tabsConfig.forEach((tab, index) => {
    const tabEl = document.createElement("div");
    tabEl.className = `drawer-tab ${index === 0 ? "active" : ""}`;
    tabEl.textContent = tab.label;
    tabEl.dataset.key = tab.key;
    drawerTabsEl.appendChild(tabEl);
  });

  const recordData = {
    ...(item && typeof item === "object" ? item : {}),
    ...(record && typeof record === "object" ? record : {})
  };
  tabsConfig = [
    ...tabsConfig,
    {
      key: "allFields",
      label: "全部字段",
      fields: buildAllFields(recordData)
    }
  ];
  const panels = tabsConfig.map((tab) => renderDrawerTab(tab, recordData, item));
  panels.forEach((panel, index) => {
    panel.style.display = index === 0 ? "grid" : "none";
    drawerContentEl.appendChild(panel);
  });

  drawerTabsEl.onclick = (event) => {
    const target = event.target;
    if (!target.classList.contains("drawer-tab")) {
      return;
    }
    drawerTabsEl.querySelectorAll(".drawer-tab").forEach((tabEl) => {
      tabEl.classList.toggle("active", tabEl === target);
    });
    const index = Array.from(drawerTabsEl.children).indexOf(target);
    Array.from(drawerContentEl.children).forEach((panel, panelIndex) => {
      panel.style.display = panelIndex === index ? "grid" : "none";
    });
  };

  try {
    drawerRawEl.textContent = JSON.stringify(item, null, 2);
  } catch (error) {
    drawerRawEl.textContent = String(item);
  }
  drawerEl.classList.remove("hidden");
}

function closeDrawer() {
  drawerEl.classList.add("hidden");
}

function getSectionUi(entityName) {
  if (!state.ui[entityName]) {
    state.ui[entityName] = {
      page: 1,
      pageSize: 10,
      search: "",
      filter: "all",
      selected: new Set(),
      showSummary: false,
      sortKey: "",
      sortDir: "desc"
    };
  }
  if (state.ui[entityName].sortKey === undefined) {
    state.ui[entityName].sortKey = "";
  }
  if (state.ui[entityName].sortDir === undefined) {
    state.ui[entityName].sortDir = "desc";
  }
  return state.ui[entityName];
}

function getSortFieldValue(entityName, item, key, createdLookup) {
  const record = extractRecord(item);
  if (key === "_createdFlag") {
    const docNo = getFieldValue(record, "docNo") || item.docNo || "";
    return docNo && createdLookup && createdLookup.has(String(docNo)) ? 1 : 0;
  }
  if (entityName === "product" && key === "price") {
    const price =
      Number(getFieldValue(record, "price")) ||
      Number(getFieldValue(record, "unitPrice")) ||
      Number(getFieldValue(record, "sellingPrice"));
    return Number.isFinite(price) ? price : null;
  }
  if (entityName === "product" && key === "cost") {
    const cost = pickCostValue(record);
    return Number.isFinite(cost) ? cost : null;
  }
  return getFieldValue(record, key);
}

function compareSortValues(a, b) {
  const emptyA = a === undefined || a === null || a === "";
  const emptyB = b === undefined || b === null || b === "";
  if (emptyA && emptyB) return 0;
  if (emptyA) return 1;
  if (emptyB) return -1;
  const numA = typeof a === "number" ? a : Number(a);
  const numB = typeof b === "number" ? b : Number(b);
  if (Number.isFinite(numA) && Number.isFinite(numB)) {
    return numA - numB;
  }
  const dateA = Date.parse(String(a));
  const dateB = Date.parse(String(b));
  const looksDateA = /^\d{4}-\d{2}-\d{2}/.test(String(a)) && Number.isFinite(dateA);
  const looksDateB = /^\d{4}-\d{2}-\d{2}/.test(String(b)) && Number.isFinite(dateB);
  if (looksDateA && looksDateB) {
    return dateA - dateB;
  }
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base"
  });
}

function sortSectionItems(entityName, items, sortKey, sortDir, createdLookup) {
  const dir = sortDir === "asc" ? 1 : -1;
  const list = [...items];
  list.sort((a, b) => {
    if (sortKey) {
      const va = getSortFieldValue(entityName, a, sortKey, createdLookup);
      const vb = getSortFieldValue(entityName, b, sortKey, createdLookup);
      const cmp = compareSortValues(va, vb);
      if (cmp !== 0) return cmp * dir;
    } else if (entityName === "purchasePI") {
      const ra = extractRecord(a);
      const rb = extractRecord(b);
      const da = String(getFieldValue(ra, "docDate") || "");
      const db = String(getFieldValue(rb, "docDate") || "");
      if (da && db && da !== db) return db.localeCompare(da);
      const na = String(getFieldValue(ra, "docNo") || "");
      const nb = String(getFieldValue(rb, "docNo") || "");
      if (na && nb && na !== nb) return nb.localeCompare(na);
      return 0;
    } else {
      const ra = extractRecord(a);
      const rb = extractRecord(b);
      const na = String(getFieldValue(ra, "docNo") || "");
      const nb = String(getFieldValue(rb, "docNo") || "");
      if (na && nb && na !== nb) return nb.localeCompare(na);
      const da = String(getFieldValue(ra, "docDate") || "");
      const db = String(getFieldValue(rb, "docDate") || "");
      return db.localeCompare(da);
    }
    /* 次要排序：docNo / productCode 保持稳定 */
    const ra = extractRecord(a);
    const rb = extractRecord(b);
    const ta =
      String(getFieldValue(ra, "docNo") || getFieldValue(ra, "productCode") || getFieldValue(ra, "accNo") || "");
    const tb =
      String(getFieldValue(rb, "docNo") || getFieldValue(rb, "productCode") || getFieldValue(rb, "accNo") || "");
    return tb.localeCompare(ta);
  });
  return list;
}

function getRecordKey(entityName, record, index) {
  const candidates = [
    "docNo",
    "supplierInvoiceNo",
    "supplierCNNo",
    "accNo",
    "productCode",
    "code",
    "companyName",
    "productName"
  ];
  for (const key of candidates) {
    const value = getFieldValue(record, key);
    if (value !== undefined && value !== null && value !== "") {
      return `${entityName}:${key}:${value}`;
    }
  }
  return `${entityName}:row:${index}`;
}

function getStatusValue(entityName, record) {
  const status = getFieldValue(record, "status");
  if (status !== undefined && status !== null && status !== "") {
    return String(status);
  }
  const isActive = getFieldValue(record, "isActive");
  if (typeof isActive === "boolean") {
    return isActive ? "Active" : "Inactive";
  }
  if (isActive !== undefined && isActive !== null && isActive !== "") {
    return String(isActive);
  }
  return "Unknown";
}

function matchesSearch(record, item, term) {
  if (!term) {
    return true;
  }
  const needle = term.toLowerCase();
  const values = Object.values(record || {});
  for (const value of values) {
    if (value === undefined || value === null) {
      continue;
    }
    if (typeof value === "string" || typeof value === "number") {
      if (String(value).toLowerCase().includes(needle)) {
        return true;
      }
    }
  }
  const content = formatItem(item);
  return content ? content.toLowerCase().includes(needle) : false;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatNumberFixed(value) {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatDateShort(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).replace("T00:00:00", "");
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = String(date.getFullYear()).padStart(4, "0");
  return `${day}-${month}-${year}`;
}

function getNextPiSequence(year) {
  const list = state.data.purchasePI || [];
  let maxSeq = 0;
  list.forEach((item) => {
    const record = extractRecord(item);
    const docNo = record.docNo || item.docNo || "";
    const match = /^PI-(\d{4})-(\d{4})$/i.exec(String(docNo));
    if (match && match[1] === String(year)) {
      const seq = Number(match[2]) || 0;
      maxSeq = Math.max(maxSeq, seq);
    }
  });
  return String(maxSeq + 1).padStart(4, "0");
}

function buildPiNumberFromYear(year) {
  const safeYear = String(year).padStart(4, "0");
  return `PI-${safeYear}-${getNextPiSequence(safeYear)}`;
}

function normalizePiNumber(input, year, fallback) {
  const trimmed = String(input || "").trim();
  if (!trimmed) {
    return fallback;
  }
  const fullMatch = /^PI-(\d{4})-(\d{4})$/i.exec(trimmed);
  if (fullMatch) {
    return `PI-${fullMatch[1]}-${fullMatch[2]}`;
  }
  const yearSeqMatch = /^(\d{4})-(\d{4})$/.exec(trimmed);
  if (yearSeqMatch) {
    return `PI-${yearSeqMatch[1]}-${yearSeqMatch[2]}`;
  }
  const seqMatch = /^(\d{4})$/.exec(trimmed);
  if (seqMatch) {
    return `PI-${String(year).padStart(4, "0")}-${seqMatch[1]}`;
  }
  if (/^PI-/i.test(trimmed)) {
    return trimmed;
  }
  return `PI-${trimmed}`;
}

function formatAddressThreeLines(value) {
  const parts = String(value || "-")
    .split(",")
    .map((line) => line.trim())
    .filter(Boolean);
  if (parts.length <= 3) {
    return parts.join("\n");
  }
  const groups = [[], [], []];
  const perLine = Math.ceil(parts.length / 3);
  for (let i = 0; i < parts.length; i += 1) {
    const groupIndex = Math.min(2, Math.floor(i / perLine));
    groups[groupIndex].push(parts[i]);
  }
  return groups
    .map((group) => group.join(", "))
    .filter((line) => line.length > 0)
    .join("\n");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeRegExp(value) {
  return String(value ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* PI 单号分段：不允许含 “-”，避免与三段分隔符冲突 */
function sanitizePiSegment(value, fallback) {
  const raw = String(value ?? "").trim().toUpperCase();
  const cleaned = raw.replace(/-/g, "").replace(/\s+/g, "");
  if (cleaned) {
    return cleaned;
  }
  const fb = String(fallback ?? "")
    .trim()
    .toUpperCase()
    .replace(/-/g, "")
    .replace(/\s+/g, "");
  return fb || "X";
}

function deriveRelatedDocNoFromPi(piNo, kind) {
  const s = String(piNo || "-");
  const parts = s.split("-").filter((p) => p.length > 0);
  if (parts.length >= 3 && /^\d{4}$/.test(parts[parts.length - 1])) {
    const next = [...parts];
    next[0] = kind;
    return next.join("-");
  }
  if (/^PI/i.test(s)) {
    return kind === "IV" ? s.replace(/^PI/i, "IV") : s.replace(/^PI/i, "PL");
  }
  return `${kind}-${s}`;
}

const STAMP_RELATIVE_PATH = "stamp.png";
let cachedStampDataUrl = "";
let cachedStampProcessed = "";
const stampProcessedCache = new Map();

/*
  供应商打印档案（最简单的按供应商出不同模板方式）：
  - key 建议用供应商 accNo（即 creditorCode）
  - stamp: 支持两种
    - stampPath: 放在 web/ 下的静态文件路径（推荐，例如 "stamps/SUP001.png"）
    - stampDataUrl: data:image/png;base64,...（不推荐直接塞很长字符串，但可用）
  - banks: 用于替换 CI/Statement 里的银行信息
*/
const DEFAULT_SUPPLIER_PRINT_PROFILES = {
  /*
  示例：
  "S0001": {
    stampPath: "stamps/S0001.png",
    banks: [
      {
        label: "Bank Account 1",
        accountNumber: "88800000000000000",
        accountName: "XXXX CO., LTD.",
        bankName: "OCBC BANK (MALAYSIA) BERHAD",
        country: "Malaysia"
      }
    ]
  }
  */
};

let activeSupplierPrintProfileKey = "";

const PI_NUMBER_PATTERNS = [
  {
    id: "PI-YYYY-SEQ4",
    label: "PI-YYYY-####",
    yearly: true,
    build: ({ year, seq }) => `PI-${String(year).padStart(4, "0")}-${seq}`
  },
  {
    id: "PI-SUP-YYYY-SEQ4",
    label: "PI-SUP-YYYY-####",
    yearly: true,
    build: ({ supplierCode, year, seq }) =>
      `PI-${String(supplierCode)}-${String(year).padStart(4, "0")}-${seq}`
  },
  {
    id: "PI-SUP-SEQ4",
    label: "PI-SUP-####",
    yearly: false,
    build: ({ supplierCode, seq }) => `PI-${String(supplierCode)}-${seq}`
  }
];

function getPiNumberPatternById(id) {
  return PI_NUMBER_PATTERNS.find((p) => p.id === id) || PI_NUMBER_PATTERNS[0];
}

function resolveSupplierPrintProfileKey(input) {
  if (!input) return "";
  const raw = typeof input === "string" ? input : "";
  return raw.trim();
}

function getSupplierPrintProfilesConfig() {
  state.config = state.config || {};
  const cur = state.config.supplierPrintProfiles;
  if (!cur || typeof cur !== "object" || Array.isArray(cur)) {
    state.config.supplierPrintProfiles = {};
  }
  return state.config.supplierPrintProfiles;
}

function getOrCreateSupplierPrintProfile(key) {
  const profiles = getSupplierPrintProfilesConfig();
  if (!profiles[key] || typeof profiles[key] !== "object") {
    profiles[key] = {};
  }
  if (!Array.isArray(profiles[key].banks)) {
    profiles[key].banks = [];
  }
  if (!profiles[key].piNumberPatternId) {
    profiles[key].piNumberPatternId = "SEG3";
  }
  if (profiles[key].packingListFrom === undefined) {
    profiles[key].packingListFrom = "Fujian, China";
  }
  if (profiles[key].piNumberPatternId === "SEG3") {
    if (profiles[key].piNumberSegment1 === undefined) {
      profiles[key].piNumberSegment1 = "PI";
    }
    if (profiles[key].piNumberSegment2 === undefined) {
      profiles[key].piNumberSegment2 = key;
    }
  }
  return profiles[key];
}

function resolvePrintProfileByCreditor(creditorCode, creditorName) {
  const configured =
    (state.config && state.config.supplierPrintProfiles) || {};
  const key = resolveSupplierPrintProfileKey(creditorCode);
  if (key && configured[key]) {
    return { key, ...configured[key] };
  }
  if (key && DEFAULT_SUPPLIER_PRINT_PROFILES[key]) {
    return { key, ...DEFAULT_SUPPLIER_PRINT_PROFILES[key] };
  }
  /* 允许用供应商名称兜底（不建议，易重名） */
  const nameKey = resolveSupplierPrintProfileKey(creditorName);
  if (nameKey && configured[nameKey]) {
    return { key: nameKey, ...configured[nameKey] };
  }
  if (nameKey && DEFAULT_SUPPLIER_PRINT_PROFILES[nameKey]) {
    return { key: nameKey, ...DEFAULT_SUPPLIER_PRINT_PROFILES[nameKey] };
  }
  return null;
}

function getPiSupplierCode(pi) {
  const r = extractRecord(pi);
  return (
    pi?.printProfileKey ||
    getFieldValue(r, "creditorCode") ||
    pi?.creditorCode ||
    ""
  );
}

function getNextPiSequenceForSupplier({ supplierCode, year, patternId }) {
  const pattern = getPiNumberPatternById(patternId);
  const list = state.data.purchasePI || [];
  let maxSeq = 0;
  const safeYear = String(year).padStart(4, "0");
  const sup = String(supplierCode || "");

  const regex = (() => {
    if (patternId === "PI-YYYY-SEQ4") {
      return new RegExp(`^PI-${escapeRegExp(safeYear)}-(\\d{4})$`, "i");
    }
    if (patternId === "PI-SUP-YYYY-SEQ4") {
      return new RegExp(
        `^PI-${escapeRegExp(sup)}-${escapeRegExp(safeYear)}-(\\d{4})$`,
        "i"
      );
    }
    if (patternId === "PI-SUP-SEQ4") {
      return new RegExp(`^PI-${escapeRegExp(sup)}-(\\d{4})$`, "i");
    }
    return new RegExp(`^PI-${escapeRegExp(safeYear)}-(\\d{4})$`, "i");
  })();

  list.forEach((item) => {
    const itemSupplier = getPiSupplierCode(item);
    if (String(itemSupplier || "") !== String(supplierCode || "")) {
      return;
    }
    const record = extractRecord(item);
    const docNo = record.docNo || item.docNo || "";
    const match = regex.exec(String(docNo));
    if (match) {
      const seq = Number(match[1]) || 0;
      maxSeq = Math.max(maxSeq, seq);
    }
  });

  return String(maxSeq + 1).padStart(4, "0");
}

function getNextPiSequenceSeg3({ supplierCode, seg1, seg2 }) {
  const list = state.data.purchasePI || [];
  let maxSeq = 0;
  const s1 = sanitizePiSegment(seg1, "PI");
  const s2 = sanitizePiSegment(seg2, supplierCode);
  const regex = new RegExp(
    `^${escapeRegExp(s1)}-${escapeRegExp(s2)}-(\\d{4})$`,
    "i"
  );
  list.forEach((item) => {
    const itemSupplier = getPiSupplierCode(item);
    if (String(itemSupplier || "") !== String(supplierCode || "")) {
      return;
    }
    const record = extractRecord(item);
    const docNo = record.docNo || item.docNo || "";
    const match = regex.exec(String(docNo));
    if (match) {
      const seq = Number(match[1]) || 0;
      maxSeq = Math.max(maxSeq, seq);
    }
  });
  return String(maxSeq + 1).padStart(4, "0");
}

function buildPiNumberForSupplier({ supplierCode, year }) {
  const profile = supplierCode ? getOrCreateSupplierPrintProfile(supplierCode) : null;
  const patternId = profile?.piNumberPatternId || "SEG3";
  if (patternId === "SEG3") {
    const s1 = sanitizePiSegment(profile?.piNumberSegment1, "PI");
    const s2 = sanitizePiSegment(profile?.piNumberSegment2, supplierCode);
    const seq = getNextPiSequenceSeg3({
      supplierCode,
      seg1: s1,
      seg2: s2
    });
    return `${s1}-${s2}-${seq}`;
  }
  const pattern = getPiNumberPatternById(patternId);
  const seq = getNextPiSequenceForSupplier({ supplierCode, year, patternId });
  return pattern.build({ supplierCode, year, seq });
}

function normalizePiNumberFlexible(input, supplierCode, year, fallback) {
  const profile = supplierCode ? getOrCreateSupplierPrintProfile(supplierCode) : null;
  const patternId = profile?.piNumberPatternId || "SEG3";
  const trimmed = String(input || "").trim();
  if (!trimmed) {
    return fallback;
  }
  if (patternId === "SEG3") {
    return trimmed.toUpperCase();
  }
  return normalizePiNumber(input, year, fallback);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("读取图片失败"));
    reader.readAsDataURL(file);
  });
}

function renderSupplierPrintBanksEditor(key) {
  if (!supplierPrintProfileBanksListEl) return;
  const profile = key ? getOrCreateSupplierPrintProfile(key) : null;
  const banks = profile ? profile.banks || [] : [];
  supplierPrintProfileBanksListEl.innerHTML = "";
  if (!key) {
    const hint = document.createElement("div");
    hint.style.fontSize = "12px";
    hint.style.color = "#94a3b8";
    hint.textContent = "请先选择供应商";
    supplierPrintProfileBanksListEl.appendChild(hint);
    return;
  }

  banks.forEach((bank, index) => {
    const row = document.createElement("div");
    row.style.border = "1px solid #e2e8f0";
    row.style.borderRadius = "12px";
    row.style.padding = "10px";
    row.style.display = "grid";
    row.style.gap = "8px";
    row.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;">
        <div style="font-weight:600;font-size:12px;color:#334155;">银行账户 ${index + 1}</div>
        <button class="btn ghost" type="button" data-action="remove-bank" data-index="${index}" style="color:#e11d48;">删除</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <label style="display:grid;gap:4px;font-size:12px;color:#64748b;">
          <span>标题</span>
          <input data-field="label" data-index="${index}" value="${escapeHtml(bank.label || "")}" style="padding:10px 12px;border-radius:10px;border:1px solid #d9e2ec;background:#f8fafc;" />
        </label>
        <label style="display:grid;gap:4px;font-size:12px;color:#64748b;">
          <span>国家/地区</span>
          <input data-field="country" data-index="${index}" value="${escapeHtml(bank.country || "")}" style="padding:10px 12px;border-radius:10px;border:1px solid #d9e2ec;background:#f8fafc;" />
        </label>
        <label style="display:grid;gap:4px;font-size:12px;color:#64748b;">
          <span>账户号码</span>
          <input data-field="accountNumber" data-index="${index}" value="${escapeHtml(bank.accountNumber || "")}" style="padding:10px 12px;border-radius:10px;border:1px solid #d9e2ec;background:#f8fafc;" />
        </label>
        <label style="display:grid;gap:4px;font-size:12px;color:#64748b;">
          <span>账户名称</span>
          <input data-field="accountName" data-index="${index}" value="${escapeHtml(bank.accountName || "")}" style="padding:10px 12px;border-radius:10px;border:1px solid #d9e2ec;background:#f8fafc;" />
        </label>
      </div>
      <label style="display:grid;gap:4px;font-size:12px;color:#64748b;">
        <span>银行名称</span>
        <input data-field="bankName" data-index="${index}" value="${escapeHtml(bank.bankName || "")}" style="padding:10px 12px;border-radius:10px;border:1px solid #d9e2ec;background:#f8fafc;" />
      </label>
    `;
    supplierPrintProfileBanksListEl.appendChild(row);
  });
}

function syncSupplierPrintProfilesJsonTextarea() {
  if (!supplierPrintProfilesJsonEl) return;
  try {
    supplierPrintProfilesJsonEl.value = JSON.stringify(
      getSupplierPrintProfilesConfig(),
      null,
      2
    );
  } catch (e) {
    supplierPrintProfilesJsonEl.value = "{}";
  }
}

function renderSupplierPrintProfileEditor(key) {
  activeSupplierPrintProfileKey = key || "";
  if (!supplierPrintProfileStampPreviewEl) return;
  if (!key) {
    supplierPrintProfileStampPreviewEl.style.display = "none";
    renderSupplierPrintBanksEditor("");
    syncSupplierPrintProfilesJsonTextarea();
    return;
  }
  const profile = getOrCreateSupplierPrintProfile(key);
  const stamp = profile.stampDataUrl || profile.stampPath || "";
  if (stamp) {
    supplierPrintProfileStampPreviewEl.src = stamp;
    supplierPrintProfileStampPreviewEl.style.display = "block";
  } else {
    supplierPrintProfileStampPreviewEl.removeAttribute("src");
    supplierPrintProfileStampPreviewEl.style.display = "none";
  }
  renderSupplierPrintBanksEditor(key);
  if (supplierPrintProfilePackingFromEl) {
    supplierPrintProfilePackingFromEl.value = profile.packingListFrom || "Fujian, China";
  }
  if (supplierPrintProfilePiSeg1El) {
    supplierPrintProfilePiSeg1El.value = profile.piNumberSegment1 ?? "PI";
  }
  if (supplierPrintProfilePiSeg2El) {
    supplierPrintProfilePiSeg2El.value = profile.piNumberSegment2 ?? key;
  }
  if (supplierPrintProfilePiNumberPatternEl) {
    supplierPrintProfilePiNumberPatternEl.value =
      profile.piNumberPatternId || "SEG3";
  }
  if (supplierPrintProfilePiNumberPreviewEl) {
    const preview = buildPiNumberForSupplier({
      supplierCode: key,
      year: new Date().getFullYear()
    });
    supplierPrintProfilePiNumberPreviewEl.textContent = preview || "-";
  }
  syncSupplierPrintProfilesJsonTextarea();
}

function getPrintBaseHref() {
  return window.location.href.replace(/index\.html.*$/i, "");
}

function processStampDataUrl(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (r < 40 && g < 40 && b < 40) {
            data[i + 3] = 0;
          }
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (err) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function getStampSrc() {
  if (cachedStampProcessed) {
    return cachedStampProcessed;
  }
  if (cachedStampDataUrl) {
    cachedStampProcessed = await processStampDataUrl(cachedStampDataUrl);
    return cachedStampProcessed;
  }
  if (window.STAMP_DATA_URL) {
    cachedStampDataUrl = window.STAMP_DATA_URL;
    cachedStampProcessed = await processStampDataUrl(cachedStampDataUrl);
    return cachedStampProcessed;
  }
  return STAMP_RELATIVE_PATH;
}

async function getStampSrcWithOverride(overrideSrc) {
  if (!overrideSrc) {
    return await getStampSrc();
  }
  const src = String(overrideSrc);
  if (/^data:image\//i.test(src)) {
    if (stampProcessedCache.has(src)) {
      return stampProcessedCache.get(src);
    }
    const processed = await processStampDataUrl(src);
    stampProcessedCache.set(src, processed);
    return processed;
  }
  return src;
}

function extractCityFromAddress(address) {
  const lines = String(address || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return "-";
  }
  const lastLine = lines[lines.length - 1];
  const commaParts = lastLine.split(",").map((part) => part.trim());
  if (commaParts.length > 1) {
    return commaParts[0] || lastLine;
  }
  const tokens = lastLine.split(/\s+/).filter(Boolean);
  if (tokens.length >= 3 && /^\d+$/.test(tokens[0])) {
    return tokens.slice(1, -1).join(" ") || lastLine;
  }
  if (tokens.length === 2 && /^\d+$/.test(tokens[0])) {
    return tokens[1];
  }
  return tokens[0] || lastLine;
}

function extractCountryState(address) {
  const lines = String(address || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return { country: "-", state: "-" };
  }
  const lastLine = lines[lines.length - 1];
  const parts = lastLine.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return {
      state: parts[parts.length - 2],
      country: parts[parts.length - 1]
    };
  }
  return { state: "-", country: lastLine };
}

function extractPostcode(value) {
  const match = String(value || "").match(/\b\d{5}\b/);
  return match ? match[0] : "";
}

function lookupCityByPostcode(postcode) {
  const db = window?.malaysiaPostcodes;
  if (!db || !postcode) {
    return "";
  }
  const result = db.findPostcode(String(postcode));
  if (result && result.found) {
    return result.city || "";
  }
  return "";
}

function buildPostcodeCityMap(customers) {
  const map = new Map();
  customers.forEach((item) => {
    const record = extractRecord(item);
    const address =
      getFieldValue(record, "deliverAddress") ||
      getFieldValue(record, "address") ||
      "";
    const postCode =
      getFieldValue(record, "postCode") || extractPostcode(address);
    const city = extractCityFromAddress(address);
    if (postCode && city && city !== "-") {
      map.set(String(postCode), city);
    }
  });
  return map;
}

function resolveCustomerCity(record, shipTo) {
  const customers = state.data.customer || [];
  const postCodeMap = buildPostcodeCityMap(customers);
  const recordPostCode =
    getFieldValue(record, "deliverPostCode") ||
    getFieldValue(record, "postCode") ||
    extractPostcode(shipTo?.address || "");
  const lookupCity = lookupCityByPostcode(recordPostCode);
  if (lookupCity) {
    return lookupCity;
  }
  if (recordPostCode && postCodeMap.has(String(recordPostCode))) {
    return postCodeMap.get(String(recordPostCode));
  }
  const targetAccNo =
    getFieldValue(record, "debtorCode") ||
    getFieldValue(record, "debtorAccNo") ||
    getFieldValue(record, "deliverAccNo") ||
    getFieldValue(record, "customerCode") ||
    "";
  const targetName =
    getFieldValue(record, "debtorName") ||
    getFieldValue(record, "customerName") ||
    shipTo?.name ||
    "";
  const match = customers.find((item) => {
    const itemRecord = extractRecord(item);
    const accNo = getFieldValue(itemRecord, "accNo") || "";
    const name = getFieldValue(itemRecord, "companyName") || "";
    if (targetAccNo && accNo === targetAccNo) {
      return true;
    }
    if (targetName && name) {
      return name.toLowerCase() === String(targetName).toLowerCase();
    }
    return false;
  });
  if (match) {
    const matchRecord = extractRecord(match);
    const address =
      getFieldValue(matchRecord, "deliverAddress") ||
      getFieldValue(matchRecord, "address") ||
      "";
    const city = extractCityFromAddress(address);
    if (city && city !== "-") {
      return city;
    }
  }
  return extractCityFromAddress(shipTo?.address || "");
}

function numberToWords(num) {
  const belowTwenty = [
    "Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten",
    "Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const thousands = ["", "Thousand", "Million", "Billion"];
  function chunkToWords(n) {
    let words = [];
    if (n >= 100) {
      words.push(belowTwenty[Math.floor(n / 100)]);
      words.push("Hundred");
      n = n % 100;
    }
    if (n >= 20) {
      words.push(tens[Math.floor(n / 10)]);
      n = n % 10;
    }
    if (n > 0) {
      words.push(belowTwenty[n]);
    }
    return words.join(" ");
  }
  if (num === 0) {
    return "Zero";
  }
  let i = 0;
  let words = [];
  while (num > 0 && i < thousands.length) {
    const chunk = num % 1000;
    if (chunk) {
      const chunkWords = chunkToWords(chunk);
      words.unshift([chunkWords, thousands[i]].filter(Boolean).join(" "));
    }
    num = Math.floor(num / 1000);
    i += 1;
  }
  return words.join(" ");
}

function formatAmountWords(value) {
  if (!Number.isFinite(value)) {
    return "";
  }
  const whole = Math.floor(value);
  const cents = Math.round((value - whole) * 100);
  const wholeWords = numberToWords(whole);
  const centsWords = cents > 0 ? `${numberToWords(cents)} CENTS` : "ONLY";
  return `RINGGIT MALAYSIA ${wholeWords.toUpperCase()} AND ${centsWords.toUpperCase()}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function normalizeSupplierCode(value) {
  return String(value || "").trim().toUpperCase();
}

function toInputDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

function adjustToNextWorkday(date) {
  const next = new Date(date);
  const day = next.getDay();
  if (day === 6) {
    next.setDate(next.getDate() + 2);
  } else if (day === 0) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

function getLatestDocDateForSupplier(entityName, supplierCode) {
  const list = state.data[entityName] || [];
  let latest = null;
  const targetCode = normalizeSupplierCode(supplierCode);
  list.forEach((item) => {
    const r = extractRecord(item);
    const code =
      getFieldValue(r, "creditorCode") ||
      getFieldValue(r, "creditorAccNo") ||
      getFieldValue(r, "accNo") ||
      "";
    if (normalizeSupplierCode(code) !== targetCode) {
      return;
    }
    const rawDate =
      getFieldValue(r, "docDate") ||
      getFieldValue(r, "docTime") ||
      getFieldValue(item, "docDate") ||
      "";
    if (!rawDate) return;
    const d = new Date(rawDate);
    if (Number.isNaN(d.getTime())) return;
    if (!latest || d.getTime() > latest.getTime()) {
      latest = d;
    }
  });
  return latest;
}

async function fetchLatestPoDateForSupplierFromApi(supplierCode) {
  const code = normalizeSupplierCode(supplierCode);
  if (!code) return null;
  try {
    const listing = await callWithMode({
      method: "POST",
      path: "/{accountBookId}/purchaseorder/listing",
      body: {
        page: 1,
        filter: {
          creditorCode: { value: code }
        }
      }
    });
    const rows = Array.isArray(listing?.data) ? listing.data : [];
    let latest = null;
    rows.forEach((item) => {
      const r = extractRecord(item);
      const d =
        getFieldValue(r, "docDate") ||
        getFieldValue(r, "docTime") ||
        getFieldValue(item, "docDate") ||
        "";
      if (!d) return;
      const date = new Date(d);
      if (Number.isNaN(date.getTime())) return;
      if (!latest || date.getTime() > latest.getTime()) {
        latest = date;
      }
    });
    return latest;
  } catch (e) {
    return null;
  }
}

function randomWorkdayAfter(baseDate, minDays, maxDays) {
  const range = Math.max(0, maxDays - minDays);
  const offset = Math.floor(Math.random() * (range + 1)) + minDays;
  const candidate = addDays(baseDate, offset);
  return adjustToNextWorkday(candidate);
}

function randomValidityDate(baseDate) {
  const offset = Math.floor(Math.random() * 10) + 1;
  const candidate = addDays(baseDate, offset);
  return adjustToNextWorkday(candidate);
}

/* PO日期 = IV日期往前推 35~40 天随机，遇周末往后推到工作日。
   为避免单号序号与日期倒挂：不得早于该供应商已有 PO 的最新日期（或外部传入下限）。 */
function calcPoDateFromIvDate(ivDate, supplierCode, minDate) {
  const base = new Date(ivDate);
  if (Number.isNaN(base.getTime())) return new Date();
  const offset = Math.floor(Math.random() * 6) + 35; /* 35~40 */
  const candidate = addDays(base, -offset);
  let next = adjustToNextWorkday(candidate);
  const latestExisting = supplierCode
    ? getLatestDocDateForSupplier("purchaseOrder", supplierCode)
    : null;
  const floor = (() => {
    const arr = [latestExisting, minDate].filter(
      (d) => d instanceof Date && !Number.isNaN(d.getTime())
    );
    if (arr.length === 0) return null;
    return arr.reduce((a, b) => (a.getTime() >= b.getTime() ? a : b));
  })();
  if (floor && next.getTime() < floor.getTime()) {
    next = adjustToNextWorkday(floor);
  }
  return next;
}

function pickCostValue(record) {
  const keys = [
    "costPrice",
    "cost",
    "unitCost",
    "avgCost",
    "averageCost",
    "lastCost",
    "lastPurchasePrice",
    "purchasePrice"
  ];
  for (const key of keys) {
    const value = Number(getFieldValue(record, key));
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }
  return undefined;
}

function getProductCostMap() {
  const map = new Map();
  const products = state.data.product || [];
  products.forEach((item) => {
    const record = extractRecord(item);
    const code =
      getFieldValue(record, "productCode") || getFieldValue(record, "code");
    if (!code) {
      return;
    }
    const cost = pickCostValue(record);
    if (Number.isFinite(cost)) {
      map.set(String(code), cost);
    }
  });
  return map;
}

function resolveLineCost(line, productCostMap) {
  const directCost = pickCostValue(line);
  if (Number.isFinite(directCost)) {
    return directCost;
  }
  const code =
    getFieldValue(line, "productCode") || getFieldValue(line, "code");
  if (code && productCostMap.has(String(code))) {
    return productCostMap.get(String(code));
  }
  const unitPrice = Number(getFieldValue(line, "unitPrice"));
  if (Number.isFinite(unitPrice)) {
    return unitPrice;
  }
  return 0;
}

let pendingPoContext = null;

function buildSupplierOptions() {
  const suppliers = state.data.supplier || [];
  return suppliers
    .map((item) => {
      const record = extractRecord(item);
      const code = getFieldValue(record, "accNo") || "";
      const name = getFieldValue(record, "companyName") || "";
      const creditTerm = getFieldValue(record, "creditTerm") || "";
      const address =
        getFieldValue(record, "address") ||
        getFieldValue(record, "deliverAddress") ||
        "";
      const taxEntity = getFieldValue(record, "taxEntity") || "";
      const email =
        getFieldValue(record, "emailAddress") ||
        getFieldValue(record, "email") ||
        "";
      const attention = getFieldValue(record, "attention") || "";
      const phone1 = getFieldValue(record, "phone1") || "";
      const fax1 = getFieldValue(record, "fax1") || "";
      const printProfile = resolvePrintProfileByCreditor(code, name);
      return {
        code,
        name,
        creditTerm,
        address,
        taxEntity,
        email,
        attention,
        phone1,
        fax1,
        /* 把模板/公章信息挂到供应商对象上（便于创建 PI 时带过去） */
        printProfileKey: printProfile?.key || "",
        printProfile: printProfile || null
      };
    })
    .filter((item) => item.code || item.name);
}

async function loadLocationOptions() {
  if (state.data.locationList) {
    return state.data.locationList;
  }
  try {
    const response = await callWithMode({
      method: "GET",
      path: "/{accountBookId}/location/listing",
      query: { page: 1, activeOnly: true }
    });
    const list = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
      ? response
      : [];
    state.data.locationList = list
      .map((item) => {
        const record = extractRecord(item);
        const code =
          getFieldValue(record, "locationCode") ||
          getFieldValue(record, "code") ||
          getFieldValue(record, "location") ||
          "";
        const name =
          getFieldValue(record, "locationName") ||
          getFieldValue(record, "name") ||
          getFieldValue(record, "description") ||
          "";
        return { code: String(code), name: String(name) };
      })
      .filter((item) => item.code || item.name);
  } catch (error) {
    appendLog(error.message || "Location 列表获取失败");
    state.data.locationList = [];
  }
  return state.data.locationList;
}

async function openPoModal(record, invoiceItem) {
  const ivDateRaw = getFieldValue(record, "docDate") || "";
  const supplierCode = String(getSelectedSupplier()?.code || "");
  const poDate = calcPoDateFromIvDate(ivDateRaw, supplierCode);
  const defaultDate = toInputDate(poDate);
  const supplierOptions = buildSupplierOptions();
  if (supplierOptions.length === 0) {
    appendLog("供应商列表为空，请先同步供应商数据");
  }
  poSupplierEl.innerHTML = supplierOptions
    .map(
      (supplier) =>
        `<option value="${supplier.code}">${supplier.code} - ${supplier.name}</option>`
    )
    .join("");
  const locations = await loadLocationOptions();
  if (locations.length === 0) {
    appendLog("Location 列表为空，无法创建PO");
  }
  poLocationEl.innerHTML = locations
    .map(
      (location) =>
        `<option value="${location.code}">${location.code} - ${location.name}</option>`
    )
    .join("");
  poDateEl.value = defaultDate || new Date().toISOString().slice(0, 10);
  poCreditTermEl.value = getFieldValue(record, "creditTerm") || "Net 30 days";
  poModalEl.classList.remove("hidden");
  pendingPoContext = { record, invoiceItem, supplierOptions, locations };
  updatePoSupplierMeta();
}

function closePoModal() {
  poModalEl.classList.add("hidden");
  pendingPoContext = null;
}

function getSelectedSupplier() {
  if (!pendingPoContext) {
    return null;
  }
  const code = poSupplierEl.value;
  const supplier = pendingPoContext.supplierOptions.find(
    (item) => item.code === code
  );
  return supplier || null;
}

function updatePoSupplierMeta() {
  if (!pendingPoContext) {
    return;
  }
  const supplier = getSelectedSupplier();
  if (!supplier) {
    return;
  }
  if (supplier.creditTerm) {
    poCreditTermEl.value = supplier.creditTerm;
  }
  poSupplierNameEl.value = supplier.name || "";
  poSupplierAddressEl.value = supplier.address || "";
}

function buildPurchaseOrderInput(item, record, meta) {
  const details = Array.isArray(item?.details) ? item.details : [];
  const productCostMap = getProductCostMap();
  const poDetails = details.map((line) => {
    const qty = Number(getFieldValue(line, "qty")) || 0;
    const unitPrice = resolveLineCost(line, productCostMap);
    const variant = [line.productVariant1Option, line.productVariant2Option]
      .filter(Boolean)
      .join(" / ");
    return {
      productCode: getFieldValue(line, "productCode") || "",
      productVariant: variant || null,
      description: getFieldValue(line, "description") || "",
      furtherDescription: getFieldValue(line, "furtherDescription") || null,
      qty,
      unit: getFieldValue(line, "unit") || null,
      unitPrice,
      discount: getFieldValue(line, "discount") || null,
      taxCode: getFieldValue(line, "taxCode") || null,
      deptNo: getFieldValue(line, "deptNo") || null,
      unitType:
        getFieldValue(line, "unitType") || getFieldValue(line, "unit") || null,
      taxAdjustment: 0,
      localTaxAdjustment: 0
    };
  });

  /* 用 ref 字段保存原始发票号，方便追踪 PO 来源 */
  const invoiceDocNo = getFieldValue(record, "docNo") || "";

  return {
    master: {
      docNo: null,
      docDate: `${meta.docDate}T00:00:00`,
      creditorCode: meta.creditorCode,
      creditorName: meta.creditorName,
      address: meta.address,
      taxEntity: meta.taxEntity,
      email: meta.email,
      attention: meta.attention,
      phone1: meta.phone1,
      fax1: meta.fax1,
      creditTerm: meta.creditTerm,
      purchaseLocation: meta.purchaseLocation,
      currencyRate: Number(getFieldValue(record, "currencyRate")) || 1,
      inclusiveTax: false,
      ref: invoiceDocNo || null
    },
    details: poDetails,
    saveApprove: false
  };
}

function buildPurchaseInvoiceInput(
  poMaster,
  poDetails,
  accNo,
  consigneeRecord,
  piMeta
) {
  const master = {
    docNo: piMeta?.piNumber || null,
    docDate: poMaster.docDate || new Date().toISOString(),
    taxDate: poMaster.taxDate || poMaster.docDate || new Date().toISOString(),
    creditorCode: poMaster.creditorCode,
    creditorName: poMaster.creditorName,
    taxEntity: poMaster.taxEntity || null,
    email: poMaster.email || null,
    address: poMaster.address || null,
    attention: poMaster.attention || null,
    phone1: poMaster.phone1 || null,
    fax1: poMaster.fax1 || null,
    ref: piMeta?.referencePoNo || poMaster.docNo || null,
    creditTerm: poMaster.creditTerm,
    purchaseLocation: poMaster.purchaseLocation,
    currencyRate: poMaster.currencyRate || 1,
    inclusiveTax: Boolean(poMaster.inclusiveTax)
  };
  if (piMeta?.validityDate) {
    master.orgDocDate = piMeta.validityDate;
  }
  if (consigneeRecord) {
    master.deliverContact = getFieldValue(consigneeRecord, "companyName") || null;
    master.deliverAddress =
      getFieldValue(consigneeRecord, "deliverAddress") ||
      getFieldValue(consigneeRecord, "address") ||
      null;
    master.deliverPhone1 = getFieldValue(consigneeRecord, "phone1") || null;
    master.deliverFax1 = getFieldValue(consigneeRecord, "fax1") || null;
  }

  const details = (poDetails || []).map((detail) => {
    const productCode = getFieldValue(detail, "productCode") || "";
    const variant = [detail.productVariant1Option, detail.productVariant2Option]
      .filter(Boolean)
      .join(" / ");
    const rawAccNo = getFieldValue(detail, "accNo") || "";
    const accNoValue =
      accNo ||
      (rawAccNo && !String(rawAccNo).includes(" ") && String(rawAccNo).length <= 20
        ? rawAccNo
        : "") ||
      poMaster.creditorCode ||
      "PURCHASE";
    return {
      accNo: accNoValue,
      productCode,
      productVariant: variant || null,
      description: getFieldValue(detail, "description") || "",
      furtherDescription: getFieldValue(detail, "furtherDescription") || null,
      qty: Number(getFieldValue(detail, "qty")) || 0,
      unit: getFieldValue(detail, "unit") || null,
      unitPrice: Number(getFieldValue(detail, "unitPrice")) || 0,
      discount: getFieldValue(detail, "discount") || null,
      taxCode: getFieldValue(detail, "taxCode") || null,
      deptNo: getFieldValue(detail, "deptNo") || null,
      unitType:
        getFieldValue(detail, "unitType") || getFieldValue(detail, "unit") || null,
      taxAdjustment: 0,
      localTaxAdjustment: 0,
      ourPONo: poMaster.docNo || null,
      ourPODate: poMaster.docDate || null
    };
  });

  return {
    master,
    details,
    saveApprove: false
  };
}

async function loadAccountOptions() {
  if (state.data.accountList) {
    return state.data.accountList;
  }
  try {
    const response = await callWithMode({
      method: "POST",
      path: "/{accountBookId}/account/listing",
      query: {
        page: 1,
        leafOnly: true,
        field: ["accNo", "name", "desc2"]
      },
      body: {}
    });
    const list = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
      ? response
      : [];
    state.data.accountList = list
      .map((item) => {
        const record = extractRecord(item);
        const accNo = getFieldValue(record, "accNo") || "";
        const name =
          getFieldValue(record, "name") ||
          getFieldValue(record, "desc2") ||
          getFieldValue(record, "description") ||
          "";
        return { accNo: String(accNo), name: String(name) };
      })
      .filter((item) => item.accNo);
  } catch (error) {
    appendLog(error.message || "科目列表获取失败");
    state.data.accountList = [];
  }
  return state.data.accountList;
}

async function openPiModal(poItem) {
  pendingPiPoItem = poItem;
  const poRecord = extractRecord(poItem);
  const suppliers = buildSupplierOptions().map((supplier) => ({
    ...supplier,
    creditorCode: supplier.code,
    creditorName: supplier.name
  }));
  if (suppliers.length === 0) {
    appendLog("供应商列表为空，请先同步供应商数据");
  }
  piSupplierEl.innerHTML = suppliers
    .map(
      (item) =>
        `<option value="${item.code}">${item.code} - ${item.name}</option>`
    )
    .join("");
  const customers = (state.data.customer || []).map((item) => {
    const record = extractRecord(item);
    return {
      accNo: getFieldValue(record, "accNo") || "",
      companyName: getFieldValue(record, "companyName") || "",
      record
    };
  });
  let matchedInvoiceCustomer = null;
  let matchedInvoiceNo = "";
  let matchedInvoiceCustomerName = "";
  let matchedInvoiceTotal = "";
  try {
    const poDocNo = getFieldValue(poRecord, "docNo") || "";
    const poDetail = poDocNo ? await fetchPurchaseOrderDetail(poDocNo) : null;
    const poDetails = poDetail?.details || poDetail?.detail || [];
    const poQty = sumDetailQty(poDetails);
    const poAmount = poDetails.reduce((sum, detail) => {
      const qty = Number(getFieldValue(detail, "qty")) || 0;
      const unitPrice = Number(getFieldValue(detail, "unitPrice")) || 0;
      return sum + qty * unitPrice;
    }, 0);
    const poLineCount = poDetails.length;
    const poDescSig = buildDescriptionSignature(poDetails);
    const invoiceList = state.data.invoice || [];
    const refInvoiceNo =
      getFieldValue(poRecord, "ref") ||
      getFieldValue(poRecord, "sourceDocNo") ||
      getFieldValue(poRecord, "refDocNo") ||
      "";
    if (refInvoiceNo) {
      const matchedInvoice = invoiceList.find((item) => {
        const record = extractRecord(item);
        const docNo =
          getFieldValue(record, "docNo") || getFieldValue(item, "docNo");
        return String(docNo) === String(refInvoiceNo);
      });
      if (matchedInvoice) {
        const record = extractRecord(matchedInvoice);
        matchedInvoiceNo =
          getFieldValue(record, "docNo") || getFieldValue(matchedInvoice, "docNo") || "";
        matchedInvoiceCustomerName =
          getFieldValue(record, "debtorName") || getFieldValue(record, "companyName") || "";
        matchedInvoiceTotal =
          getFieldValue(record, "total") ?? getFieldValue(record, "netTotal") ?? "";
        const invoiceDebtor =
          getFieldValue(record, "debtorCode") ||
          getFieldValue(record, "debtorAccNo") ||
          "";
        matchedInvoiceCustomer = customers.find(
          (customer) => customer.accNo === invoiceDebtor
        );
        if (!matchedInvoiceCustomerName && matchedInvoiceCustomer) {
          matchedInvoiceCustomerName = matchedInvoiceCustomer.companyName || "";
        }
      }
    }
    if (!matchedInvoiceCustomer && poQty > 0) {
      let candidates = invoiceList
        .map((item) => {
          const record = extractRecord(item);
          const invoiceDetails =
            record.details || record.detail || item.details || [];
          const invoiceQty =
            Number(getFieldValue(record, "totalQty")) ||
            Number(getFieldValue(record, "totalQuantity")) ||
            Number(getFieldValue(record, "qty")) ||
            sumDetailQty(invoiceDetails);
          return {
            record,
            item,
            invoiceQty,
            lineCount: invoiceDetails.length,
            descSig: buildDescriptionSignature(invoiceDetails)
          };
        })
        .filter((item) => item.invoiceQty && item.invoiceQty === poQty);
      if (poLineCount > 0) {
        candidates = candidates.filter(
          (item) => item.lineCount === poLineCount || item.lineCount === 0
        );
      }
      const pickCandidate = (candidate) => {
        matchedInvoiceNo =
          getFieldValue(candidate.record, "docNo") ||
          getFieldValue(candidate.item, "docNo") || "";
        matchedInvoiceCustomerName =
          getFieldValue(candidate.record, "debtorName") ||
          getFieldValue(candidate.record, "companyName") || "";
        matchedInvoiceTotal =
          getFieldValue(candidate.record, "total") ??
          getFieldValue(candidate.record, "netTotal") ?? "";
        const invoiceDebtor =
          getFieldValue(candidate.record, "debtorCode") ||
          getFieldValue(candidate.record, "debtorAccNo") ||
          "";
        matchedInvoiceCustomer = customers.find(
          (customer) => customer.accNo === invoiceDebtor
        );
        if (!matchedInvoiceCustomerName && matchedInvoiceCustomer) {
          matchedInvoiceCustomerName = matchedInvoiceCustomer.companyName || "";
        }
      };
      if (candidates.length === 1) {
        pickCandidate(candidates[0]);
      } else if (candidates.length > 1) {
        const exactDescMatches = poDescSig
          ? candidates.filter((item) => item.descSig === poDescSig)
          : [];
        if (exactDescMatches.length === 1) {
          pickCandidate(exactDescMatches[0]);
        } else {
          const scored = (exactDescMatches.length > 1 ? exactDescMatches : candidates).map((item) => {
            const docDate =
              getFieldValue(item.record, "docDate") ||
              getFieldValue(item.record, "docTime") ||
              "";
            const dateValue = new Date(docDate).getTime() || 0;
            return { ...item, dateValue };
          });
          scored.sort((a, b) => b.dateValue - a.dateValue);
          pickCandidate(scored[0]);
        }
      }
    }
  } catch (error) {
    // ignore matching failures
  }
  piConsigneeEl.innerHTML = customers
    .filter((item) => item.accNo || item.companyName)
    .map(
      (item) =>
        `<option value="${item.accNo}">${item.accNo} - ${item.companyName}</option>`
    )
    .join("");
  const defaultSupplier = suppliers.find(
    (item) => item.code === getFieldValue(poRecord, "creditorCode")
  );
  if (defaultSupplier) {
    piSupplierEl.value = defaultSupplier.code;
  }
  /* 供应商改变时：重新生成默认 PI 单号（按供应商独立序号） */
  if (!piSupplierEl.dataset.piSupplierListener) {
    piSupplierEl.addEventListener("change", () => {
      try {
        const year = Number(piNumberEl.dataset.piYear || new Date().getFullYear());
        const supplierCode = String(piSupplierEl.value || "");
        const next = buildPiNumberForSupplier({ supplierCode, year });
        piNumberEl.value = next;
        piNumberEl.dataset.defaultPi = next;
        piNumberEl.dataset.piSupplierCode = supplierCode;
      } catch (e) {
        // ignore
      }
    });
    piSupplierEl.dataset.piSupplierListener = "1";
  }
  if (matchedInvoiceCustomer) {
    piConsigneeEl.value = matchedInvoiceCustomer.accNo;
  } else {
    const defaultCustomer = customers.find(
      (item) => item.accNo === getFieldValue(poRecord, "debtorCode")
    );
    if (defaultCustomer) {
      piConsigneeEl.value = defaultCustomer.accNo;
    }
  }
  const invoiceList = state.data.invoice || [];
  const refInvoiceNo =
    getFieldValue(poRecord, "ref") ||
    getFieldValue(poRecord, "sourceDocNo") ||
    getFieldValue(poRecord, "refDocNo") ||
    "";
  if (refInvoiceNo) {
    const matchedInvoice = invoiceList.find((item) => {
      const record = extractRecord(item);
      const docNo = getFieldValue(record, "docNo") || getFieldValue(item, "docNo");
      return String(docNo) === String(refInvoiceNo);
    });
    if (matchedInvoice) {
      const invoiceRecord = extractRecord(matchedInvoice);
      const invoiceDebtor =
        getFieldValue(invoiceRecord, "debtorCode") ||
        getFieldValue(invoiceRecord, "debtorAccNo") ||
        "";
      const invoiceCustomer = customers.find(
        (item) => item.accNo === invoiceDebtor
      );
      if (invoiceCustomer) {
        piConsigneeEl.value = invoiceCustomer.accNo;
      }
    }
  }
  const rawPoDate = getFieldValue(poRecord, "docDate") || new Date().toISOString();
  const basePoDate = new Date(rawPoDate);
  const minPiDate = Number.isNaN(basePoDate.getTime())
    ? adjustToNextWorkday(addDays(new Date(), 7))
    : adjustToNextWorkday(addDays(basePoDate, 7));
  const dateValue = toInputDate(minPiDate);
  piDateEl.value = dateValue;
  piDateEl.min = dateValue;
  const validity = randomValidityDate(minPiDate);
  piValidityDateEl.value = toInputDate(validity);
  piRefPoEl.value = getFieldValue(poRecord, "docNo") || "";
  const piYear = Number.isNaN(basePoDate.getTime())
    ? new Date().getFullYear()
    : basePoDate.getFullYear();
  const selectedSupplierCode = String(piSupplierEl.value || "");
  const defaultPiNumber = buildPiNumberForSupplier({
    supplierCode: selectedSupplierCode,
    year: piYear
  });
  piNumberEl.value = defaultPiNumber;
  piNumberEl.dataset.defaultPi = defaultPiNumber;
  piNumberEl.readOnly = false;
  piNumberEl.disabled = false;
  piNumberEl.dataset.piYear = String(piYear);
  piNumberEl.dataset.piSupplierCode = selectedSupplierCode;
  if (!piNumberEl.dataset.piListener) {
    piNumberEl.addEventListener("focus", () => {
      const val = piNumberEl.value || piNumberEl.dataset.defaultPi || "";
      piNumberEl.value = val;
      piNumberEl.setSelectionRange(val.length, val.length);
    });
    piNumberEl.addEventListener("input", () => {
      /* 不强制格式，只做大写（避免破坏供应商自定义编码格式） */
      piNumberEl.value = String(piNumberEl.value || "").toUpperCase();
    });
    piNumberEl.addEventListener("blur", () => {
      const fallback = piNumberEl.dataset.defaultPi || "";
      const trimmed = String(piNumberEl.value || "").trim();
      piNumberEl.value = trimmed ? trimmed : fallback;
    });
    piNumberEl.dataset.piListener = "1";
  }
  piModalEl.dataset.matchedInvoiceNo = matchedInvoiceNo || "";
  piModalEl.dataset.matchedInvoiceCustomerName = matchedInvoiceCustomerName || "";
  piModalEl.dataset.matchedInvoiceTotal = matchedInvoiceTotal !== "" && matchedInvoiceTotal !== undefined ? String(matchedInvoiceTotal) : "";
  piModalEl.classList.remove("hidden");
}

function closePiModal() {
  piModalEl.classList.add("hidden");
  piModalEl.dataset.matchedInvoiceNo = "";
  piModalEl.dataset.matchedInvoiceCustomerName = "";
  piModalEl.dataset.matchedInvoiceTotal = "";
  pendingPiPoItem = null;
}

/* ---- 手动关联 IV 弹窗 ---- */
function openLinkIvModal(piItem, piIndex) {
  pendingLinkIvPiItem = piItem;
  pendingLinkIvPiIndex = piIndex;
  linkIvSearchEl.value = "";
  renderLinkIvList("");
  linkIvModalEl.classList.remove("hidden");
  linkIvSearchEl.focus();
}

function closeLinkIvModal() {
  linkIvModalEl.classList.add("hidden");
  pendingLinkIvPiItem = null;
  pendingLinkIvPiIndex = -1;
}

function renderLinkIvList(keyword) {
  const invoiceList = state.data.invoice || [];
  const kw = (keyword || "").toLowerCase().trim();
  const filtered = invoiceList
    .map((item) => {
      const record = extractRecord(item);
      const docNo = getFieldValue(record, "docNo") || getFieldValue(item, "docNo") || "";
      const customerName =
        getFieldValue(record, "debtorName") ||
        getFieldValue(record, "companyName") ||
        "";
      const total = getFieldValue(record, "total") ?? getFieldValue(record, "netTotal") ?? "";
      const docDate = formatDisplayValue(getFieldValue(record, "docDate") || "");
      return { item, record, docNo, customerName, total, docDate };
    })
    .filter((entry) => {
      if (!kw) return true;
      return (
        String(entry.docNo).toLowerCase().includes(kw) ||
        String(entry.customerName).toLowerCase().includes(kw) ||
        String(entry.total).includes(kw)
      );
    })
    .slice(0, 100);

  if (filtered.length === 0) {
    linkIvListEl.innerHTML =
      '<div style="padding:20px;text-align:center;color:#888;">未找到匹配的发票</div>';
    return;
  }

  const html = `
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#16213e;position:sticky;top:0;">
          <th style="padding:6px 10px;text-align:left;white-space:nowrap;">IV No</th>
          <th style="padding:6px 10px;text-align:left;white-space:nowrap;">Date</th>
          <th style="padding:6px 10px;text-align:left;">Customer</th>
          <th style="padding:6px 10px;text-align:right;white-space:nowrap;">Total</th>
          <th style="padding:6px 10px;text-align:center;white-space:nowrap;">操作</th>
        </tr>
      </thead>
      <tbody>
        ${filtered
          .map(
            (entry, idx) => `
          <tr data-link-iv-idx="${idx}" style="border-bottom:1px solid #2a2a3e;cursor:pointer;" onmouseover="this.style.background='#1a1a3e'" onmouseout="this.style.background=''">
            <td style="padding:6px 10px;white-space:nowrap;">${entry.docNo}</td>
            <td style="padding:6px 10px;white-space:nowrap;">${entry.docDate}</td>
            <td style="padding:6px 10px;">${entry.customerName}</td>
            <td style="padding:6px 10px;text-align:right;">${
              typeof entry.total === "number" ? entry.total.toFixed(2) : entry.total
            }</td>
            <td style="padding:6px 10px;text-align:center;">
              <button class="btn ghost" data-link-select="${idx}" style="font-size:12px;padding:2px 8px;">选择</button>
            </td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;
  linkIvListEl.innerHTML = html;

  /* 绑定选择事件 */
  linkIvListEl.querySelectorAll("[data-link-select]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.linkSelect);
      const entry = filtered[idx];
      if (entry) {
        applyLinkIv(entry.docNo, entry.customerName, entry.total);
      }
    });
  });

  /* 整行双击也能选择 */
  linkIvListEl.querySelectorAll("[data-link-iv-idx]").forEach((tr) => {
    tr.addEventListener("dblclick", () => {
      const idx = Number(tr.dataset.linkIvIdx);
      const entry = filtered[idx];
      if (entry) {
        applyLinkIv(entry.docNo, entry.customerName, entry.total);
      }
    });
  });
}

async function applyLinkIv(ivNo, customerName, ivTotal) {
  if (pendingLinkIvPiIndex < 0 || !state.data.purchasePI) {
    closeLinkIvModal();
    return;
  }
  const pi = state.data.purchasePI[pendingLinkIvPiIndex];
  if (!pi) {
    closeLinkIvModal();
    return;
  }
  /* 更新 PI 数据中的关联字段 */
  pi.referenceIvNo = ivNo || "";
  pi.ivCustomerName = customerName || "";
  pi.ivTotal = ivTotal !== undefined && ivTotal !== null ? ivTotal : "";
  if (pi.master) {
    pi.master.referenceIvNo = pi.referenceIvNo;
    pi.master.ivCustomerName = pi.ivCustomerName;
    pi.master.ivTotal = pi.ivTotal;
  }
  /* 重新渲染列表 */
  renderSection("purchasePI", state.data.purchasePI);
  /* 持久化到后端 */
  try {
    await apiPost("/api/pi", pi);
    appendLog(`PI ${pi.docNo || ""} 关联IV已更新: ${ivNo || "(已清除)"}`);
  } catch (e) {
    appendLog("PI 关联更新持久化失败: " + e.message);
  }
  closeLinkIvModal();
}

async function clearLinkIv() {
  await applyLinkIv("", "", "");
}

/* ---- 创建采购发票（推送AutoCount） ---- */
async function openCreatePurchaseInvoiceModal(piItem) {
  pendingCpiPiItem = piItem;
  const piRecord = extractRecord(piItem);
  const piDocNo = getFieldValue(piRecord, "docNo") || piItem.docNo || "";
  const piDate = getFieldValue(piRecord, "docDate") || piItem.docDate || "";

  /* 供应商下拉 */
  const suppliers = buildSupplierOptions().map((s) => ({
    ...s,
    creditorCode: s.code,
    creditorName: s.name
  }));
  cpiSupplierEl.innerHTML = suppliers
    .map((s) => `<option value="${s.code}">${s.code} - ${s.name}</option>`)
    .join("");

  /* 默认选中PI的供应商 */
  const piCreditorCode =
    getFieldValue(piRecord, "creditorCode") || piItem.creditorCode || "";
  const defaultSupplier = suppliers.find((s) => s.code === piCreditorCode);
  if (defaultSupplier) {
    cpiSupplierEl.value = defaultSupplier.code;
    cpiSupplierNameEl.value = defaultSupplier.name || "";
    cpiSupplierAddressEl.value = defaultSupplier.address || "";
    cpiCreditTermEl.value = defaultSupplier.creditTerm || "Net 30 days";
  }

  /* Location */
  const locations = await loadLocationOptions();
  cpiLocationEl.innerHTML = locations
    .map((l) => `<option value="${l.code}">${l.code} - ${l.name}</option>`)
    .join("");
  const piLocation =
    getFieldValue(piRecord, "purchaseLocation") ||
    (piItem.master && piItem.master.purchaseLocation) ||
    "";
  if (piLocation) {
    cpiLocationEl.value = piLocation;
  }

  /* 日期 — 优先使用关联IV的日期 */
  let cpiDefaultDate = "";
  const refIvNo =
    getFieldValue(piRecord, "referenceIvNo") || piItem.referenceIvNo || "";
  if (refIvNo) {
    const invoiceList = state.data.invoice || [];
    const matchedIv = invoiceList.find((inv) => {
      const r = extractRecord(inv);
      return (
        String(getFieldValue(r, "docNo") || getFieldValue(inv, "docNo")) ===
        String(refIvNo)
      );
    });
    if (matchedIv) {
      const ivRecord = extractRecord(matchedIv);
      const ivDate = getFieldValue(ivRecord, "docDate") || "";
      cpiDefaultDate = String(ivDate).replace(/T.*/, "").slice(0, 10);
    }
  }
  if (!cpiDefaultDate) {
    cpiDefaultDate = String(piDate).replace(/T.*/, "").slice(0, 10);
  }
  cpiDateEl.value = cpiDefaultDate || new Date().toISOString().slice(0, 10);

  /* Supplier Invoice No. 自动填入PI号，Reference默认为空 */
  cpiSupplierInvoiceNoEl.value = piDocNo;
  cpiRefPiEl.value = "";
  cpiRemarkEl.value = "";

  /* 商品摘要 */
  const details = piItem.details || (piItem.master && piItem.master.details) || [];
  const lineCount = details.length;
  const totalQty = details.reduce(
    (sum, d) => sum + (Number(getFieldValue(d, "qty")) || 0),
    0
  );
  const totalAmt = details.reduce((sum, d) => {
    const qty = Number(getFieldValue(d, "qty")) || 0;
    const price = Number(getFieldValue(d, "unitPrice")) || 0;
    return sum + qty * price;
  }, 0);
  cpiDetailsSummaryEl.textContent = lineCount > 0
    ? `共 ${lineCount} 项商品，总数量 ${totalQty}，总金额 ${totalAmt.toFixed(2)}`
    : "无商品明细";

  cpiModalEl.classList.remove("hidden");
}

function closeCpiModal() {
  cpiModalEl.classList.add("hidden");
  pendingCpiPiItem = null;
}

function updateCpiSupplierMeta() {
  if (!pendingCpiPiItem) return;
  const code = cpiSupplierEl.value;
  const suppliers = buildSupplierOptions();
  const supplier = suppliers.find((s) => s.code === code);
  if (!supplier) return;
  cpiSupplierNameEl.value = supplier.name || "";
  cpiSupplierAddressEl.value = supplier.address || "";
  cpiCreditTermEl.value = supplier.creditTerm || "Net 30 days";
}

async function submitCreatePurchaseInvoice() {
  if (!pendingCpiPiItem) return;
  const piItem = pendingCpiPiItem;
  const piRecord = extractRecord(piItem);

  const supplierCode = cpiSupplierEl.value;
  const suppliers = buildSupplierOptions();
  const supplier = suppliers.find((s) => s.code === supplierCode);
  if (!supplier) {
    appendLog("请选择供应商");
    return;
  }
  const location = cpiLocationEl.value;
  if (!location) {
    appendLog("请选择 Purchase Location");
    return;
  }
  const docDate = cpiDateEl.value;
  if (!docDate) {
    appendLog("请选择发票日期");
    return;
  }

  const piDetails = piItem.details || (piItem.master && piItem.master.details) || [];
  if (piDetails.length === 0) {
    appendLog("PI 无商品明细，无法创建采购发票");
    return;
  }

  /* 从关联PO获取真实的accNo（GL会计科目） */
  const refPoNo =
    piItem.referencePoNo || getFieldValue(piRecord, "referencePoNo") || "";
  let poAccNoMap = {};
  if (refPoNo) {
    try {
      const poDetail = await fetchPurchaseOrderDetail(refPoNo);
      const poLines = poDetail?.details || poDetail?.detail || [];
      poLines.forEach((line) => {
        const pc = getFieldValue(line, "productCode") || "";
        const acc = getFieldValue(line, "accNo") || "";
        if (pc && acc) {
          poAccNoMap[pc] = acc;
        }
      });
    } catch (e) {
      /* PO获取失败，继续用备选方案 */
    }
  }

  /* 从已同步的采购发票中获取一个有效的默认accNo作为兜底 */
  let fallbackAccNo = "";
  const existingPiList = state.data.purchaseInvoice || [];
  for (const inv of existingPiList) {
    const invDetails = inv.details || inv.detail || [];
    for (const line of invDetails) {
      const acc = getFieldValue(line, "accNo") || "";
      if (acc && String(acc).includes("-")) {
        fallbackAccNo = acc;
        break;
      }
    }
    if (fallbackAccNo) break;
  }

  /* 构建采购发票 payload */
  const master = {
    docNo: null,
    docDate: `${docDate}T00:00:00`,
    taxDate: `${docDate}T00:00:00`,
    creditorCode: supplier.code,
    creditorName: supplier.name,
    address: supplier.address || null,
    taxEntity: supplier.taxEntity || null,
    email: supplier.email || null,
    attention: supplier.attention || null,
    phone1: supplier.phone1 || null,
    fax1: supplier.fax1 || null,
    creditTerm: cpiCreditTermEl.value || "Net 30 days",
    purchaseLocation: location,
    currencyRate:
      Number(getFieldValue(piRecord, "currencyRate")) ||
      (piItem.master && Number(piItem.master.currencyRate)) ||
      1,
    inclusiveTax: false,
    ref: cpiRefPiEl.value || null,
    supplierInvoiceNo: cpiSupplierInvoiceNoEl.value || null,
    remark1: cpiRemarkEl.value || null
  };

  const invoiceDetails = piDetails.map((d) => {
    const productCode = getFieldValue(d, "productCode") || "";
    const variant = [d.productVariant1Option, d.productVariant2Option]
      .filter(Boolean)
      .join(" / ");
    /* accNo 优先级：PO原始accNo > PI明细中有效的GL科目 > 兜底accNo */
    const poAccNo = productCode ? (poAccNoMap[productCode] || "") : "";
    const rawAccNo = getFieldValue(d, "accNo") || "";
    const isValidGl = rawAccNo && String(rawAccNo).includes("-");
    const accNo = poAccNo || (isValidGl ? rawAccNo : "") || fallbackAccNo || supplier.code;
    return {
      accNo,
      productCode,
      productVariant: variant || null,
      description: getFieldValue(d, "description") || "",
      furtherDescription: getFieldValue(d, "furtherDescription") || null,
      qty: Number(getFieldValue(d, "qty")) || 0,
      unit: getFieldValue(d, "unit") || null,
      unitPrice: Number(getFieldValue(d, "unitPrice")) || 0,
      discount: getFieldValue(d, "discount") || null,
      taxCode: getFieldValue(d, "taxCode") || null,
      deptNo: getFieldValue(d, "deptNo") || null,
      unitType:
        getFieldValue(d, "unitType") || getFieldValue(d, "unit") || null,
      taxAdjustment: 0,
      localTaxAdjustment: 0,
      ourPONo: refPoNo || null,
      ourPODate: piItem.docDate || getFieldValue(piRecord, "docDate") || null
    };
  });

  const payload = { master, details: invoiceDetails, saveApprove: false };

  try {
    cpiSubmitEl.disabled = true;
    cpiSubmitEl.textContent = "推送中…";

    /* POST 到 AutoCount */
    await callWithMode({
      method: "POST",
      path: "/{accountBookId}/purchaseinvoice",
      body: payload
    });

    /* 查询最新创建的采购发票以获取自动生成的单号 */
    const listing = await callWithMode({
      method: "POST",
      path: "/{accountBookId}/purchaseinvoice/listing",
      body: {
        page: 1,
        filter: {
          date: {
            from: `${docDate}T00:00:00`,
            to: `${docDate}T23:59:59`
          },
          creditorCode: { value: supplier.code }
        }
      }
    });

    const latest =
      Array.isArray(listing?.data) && listing.data.length > 0
        ? listing.data[0]
        : null;

    if (latest) {
      state.data.purchaseInvoice = state.data.purchaseInvoice || [];
      state.data.purchaseInvoice.unshift(latest);
      renderSection("purchaseInvoice", getEntityData("purchaseInvoice"));
      const latestDocNo =
        getFieldValue(extractRecord(latest), "docNo") || "(自动生成)";
      appendLog(`采购发票创建成功: ${latestDocNo}，已推送AutoCount`);
      /* 持久化更新后的采购发票列表 */
      try {
        await apiPost("/api/data/sync", {
          entity: "purchaseInvoice",
          items: state.data.purchaseInvoice
        });
      } catch (e) { /* 静默 */ }
    } else {
      appendLog("采购发票已推送AutoCount，但未能获取回传单号");
    }

    closeCpiModal();
  } catch (error) {
    appendLog(error.message || "采购发票创建失败");
  } finally {
    cpiSubmitEl.disabled = false;
    cpiSubmitEl.textContent = "创建并推送";
  }
}

async function fetchPurchaseOrderDetail(docNo) {
  const response = await callWithMode({
    method: "GET",
    path: "/{accountBookId}/purchaseorder",
    query: { docNo }
  });
  return response;
}

function calculatePiTotal(details) {
  return details.reduce((sum, detail) => {
    const qty = Number(getFieldValue(detail, "qty")) || 0;
    const unitPrice = Number(getFieldValue(detail, "unitPrice")) || 0;
    return sum + qty * unitPrice;
  }, 0);
}

function sumDetailQty(details) {
  return (details || []).reduce((sum, detail) => {
    return sum + (Number(getFieldValue(detail, "qty")) || 0);
  }, 0);
}

function normalizeDescription(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function buildDescriptionSignature(details) {
  return (details || [])
    .map((detail) => normalizeDescription(getFieldValue(detail, "description")))
    .filter((text) => text)
    .sort()
    .join("|");
}

function buildPiPrintHtml(pi, stampSrc, baseHref, printProfile) {
  const record = extractRecord(pi);
  const details = pi.details || [];
  const currency = record.currencyCode || "MYR";
  const totalAmount = Number(pi.total) || calculatePiTotal(details);
  const total = formatNumberFixed(totalAmount);
  const amountWords = formatAmountWords(totalAmount);
  const buyerInfo = {
    name: "JINZA TRADING SDN. BHD.",
    reg: "Reg. No.: 202501024394 (1625807-K) | TIN: C60122406100",
    address:
      "2nd Floor, No. 185\n" +
      "Jalan Datuk Abang Abdul Rahim,\n" +
      "93450 Kuching, Sarawak, Malaysia",
    tel: "Tel / Mobile: 018-2556898",
    email: "E-mail: jinza.sb@gmail.com"
  };
  const supplier = {
    name: record.creditorName || "-",
    address: formatAddressThreeLines(record.address || "-"),
    tel: record.phone1 || "-",
    fax: record.fax1 || "-",
    attn: record.attention || "-"
  };
  const shipTo = {
    name: record.deliverContact || pi.consigneeName || "-",
    address: formatAddressThreeLines(record.deliverAddress || "-"),
    tel: record.deliverPhone1 || "-",
    fax: record.deliverFax1 || "-"
  };
  const piNumber = pi.docNo || record.docNo || "-";
  const ciNumber = deriveRelatedDocNoFromPi(piNumber, "IV");
  const piBaseDate = new Date(record.docDate || pi.docDate || new Date());
  const ciDate = randomWorkdayAfter(
    Number.isNaN(piBaseDate.getTime()) ? new Date() : piBaseDate,
    7,
    10
  );
  const plNumber = deriveRelatedDocNoFromPi(piNumber, "PL");
  const deliveryCity = resolveCustomerCity(record, shipTo);
  const packingFrom = printProfile?.packingListFrom || "Fujian, China";
  const plDate = randomWorkdayAfter(ciDate, 7, 10);
  const validity = pi.validityDate
    ? formatDateShort(pi.validityDate)
    : "-";
  const referencePo = pi.referencePoNo || record.ref || "-";
  const banks =
    Array.isArray(printProfile?.banks) && printProfile.banks.length > 0
      ? printProfile.banks
      : [
          {
            label: "Bank Account 1",
            accountNumber: "88800021380472790",
            accountName: "PUTIAN GUSHU TRADING CO.,LTD.",
            bankName: "OCBC BANK (MALAYSIA) BERHAD",
            country: "Malaysia"
          },
          {
            label: "Bank Account 2",
            accountNumber: "00181100000015449",
            accountName: "Alipay Malaysia",
            bankName: "HSBC BANK MALAYSIA BERHAD",
            country: "Malaysia"
          }
        ];
  const buildFooterHtml = (docLabel) => `
      <div class="amount-words">${amountWords}</div>
      <div class="total-line">
        <span class="label">TOTAL (${currency}):</span>
        <span class="amount">${total}</span>
      </div>

      <div class="footer">
        <div class="remarks">
          <strong>Remarks:</strong>
          <div>This ${docLabel} is issued for order confirmation</div>
          <div>and payment arrangement purposes only.</div>
          <div>It does not constitute a tax invoice or final commercial invoice.</div>
          <div>Delivery shall be arranged by Seller under DDP terms based on Buyer’s designated delivery location.</div>
        </div>
        <div class="total-box">
          <div>(All amounts are in ${currency})</div>
        </div>
      </div>

      <div class="chop">
        <img class="stamp-img" src="${stampSrc}" alt="Company Chop" />
        <div class="chop-line"></div>
        <div class="chop-label">Company Chop:</div>
      </div>
      `;
  const buildCiFooterHtml = () => `
      <div class="ci-footer-top">
        <div class="ci-total">
          <span class="label">TOTAL:</span>
          <span class="amount">${total}</span>
        </div>
        <div class="ci-total-note">(All amounts are in ${currency})</div>
      </div>
      <div class="ci-footer-center">
        This Commercial Invoice is issued pursuant to Proforma Invoice No.: ${piNumber}
      </div>
      <div class="ci-footer-body">
        <div class="ci-payment">
          <div class="ci-payment-title">Payment Details:</div>
          ${banks
            .map(
              (b) => `
          <div class="ci-payment-block">
            <div class="ci-payment-label">${escapeHtml(b.label || "Bank Account")}:</div>
            <div>Account Number : ${escapeHtml(b.accountNumber || "-")}</div>
            <div>Account Name : ${escapeHtml(b.accountName || "-")}</div>
            <div>Bank Name : ${escapeHtml(b.bankName || "-")}</div>
            <div>Country/Region : ${escapeHtml(b.country || "-")}</div>
          </div>
          `
            )
            .join("")}
        </div>
        <div class="ci-chop">
          <img class="stamp-img" src="${stampSrc}" alt="Company Chop" />
          <div class="ci-chop-line"></div>
          <div class="ci-chop-label">Company Chop:</div>
        </div>
      </div>
      `;
  const getPageSizes = (count) => {
    if (count <= 15) {
      return [15];
    }
    const remaining = Math.max(0, count - 15);
    const fullPages = Math.ceil(remaining / 24);
    return [...Array.from({ length: fullPages }).map(() => 24), 15];
  };
  const pageSizes = getPageSizes(details.length);
  const buildRows = (chunk, startIndex) =>
    chunk
      .map((item, index) => {
        const rowIndex = startIndex + index + 1;
        const qty = Number(getFieldValue(item, "qty")) || 0;
        const unit = getFieldValue(item, "unit") || "-";
        const unitPrice = Number(getFieldValue(item, "unitPrice")) || 0;
        const lineTotal = qty * unitPrice;
        return `
        <tr>
          <td class="num">${rowIndex}.</td>
          <td class="desc">${getFieldValue(item, "description") || "-"}</td>
          <td class="qty">${qty}</td>
          <td class="unit">${unit}</td>
          <td class="price">${formatNumberFixed(unitPrice)}</td>
          <td class="amount">${formatNumberFixed(lineTotal)}</td>
        </tr>
      `;
      })
      .join("");
  let cursor = 0;
  const pagesHtml = pageSizes
    .map((pageSize, pageIndex) => {
      const chunk = details.slice(cursor, cursor + pageSize);
      const rowsHtml = buildRows(chunk, cursor);
      const isLast = pageIndex === pageSizes.length - 1;
      const footerReserve = 0;
      const blankCount = Math.max(0, pageSize - chunk.length - footerReserve);
      const blankRows = Array.from({ length: blankCount })
        .map(
          () => `
        <tr class="blank-row">
          <td class="num">&nbsp;</td>
          <td class="desc">&nbsp;</td>
          <td class="qty">&nbsp;</td>
          <td class="unit">&nbsp;</td>
          <td class="price">&nbsp;</td>
          <td class="amount">&nbsp;</td>
        </tr>
      `
        )
        .join("");
      const footerHtml = isLast ? buildFooterHtml("Proforma Invoice") : "";
      cursor += pageSize;
      return `
      <div class="page">
        <div class="header">
          <div class="header-top">
            <div class="title">Proforma Invoice</div>
          </div>
          <div class="seller-block">
            <div class="seller-left">
              <div class="seller-title">Seller:</div>
              <p><strong>${supplier.name}</strong></p>
              <p class="addr">${supplier.address}</p>
              <p>Tel: ${supplier.tel}</p>
              <p>Attn: ${supplier.attn}</p>
              <p>E-mail: ${record.email || "-"}</p>
            </div>
            <div class="info-right">
              <div class="info-spacer"><span></span><span></span></div>
              <div><span>PI Number:</span><span>${piNumber}</span></div>
              <div><span>Date:</span><span>${formatDateShort(record.docDate || pi.docDate)}</span></div>
              <div><span>Validity Date:</span><span>${validity}</span></div>
              <div><span>Reference PO No.:</span><span>${referencePo}</span></div>
              <div><span>Currency:</span><span>${currency}</span></div>
            </div>
          </div>
        </div>

        <div class="billship">
          <div class="billship-header">
            <div>Bill To:</div>
            <div>Ship To:</div>
          </div>
          <div class="billship-body">
            <div class="col">
              <div>${buyerInfo.name}</div>
              <div class="addr">${buyerInfo.address}</div>
              <div>${buyerInfo.tel}</div>
              <div>${buyerInfo.email}</div>
            </div>
            <div class="col">
              <div>${shipTo.name}</div>
              <div class="addr">${shipTo.address}</div>
              <div>Tel: ${shipTo.tel}</div>
            </div>
          </div>
        </div>

        <table class="pi-table">
          <thead>
            <tr>
              <th></th>
              <th>Description</th>
              <th class="qty">Quantity</th>
              <th class="unit">Unit</th>
              <th class="price">Unit Price</th>
              <th class="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            ${blankRows}
          </tbody>
        </table>
        ${footerHtml}
      </div>
      `;
    })
    .join("");

  let ciCursor = 0;
  const commercialPagesHtml = pageSizes
    .map((pageSize, pageIndex) => {
      const chunk = details.slice(ciCursor, ciCursor + pageSize);
      const rowsHtml = buildRows(chunk, ciCursor);
      const blankCount = Math.max(0, pageSize - chunk.length);
      const blankRows = Array.from({ length: blankCount })
        .map(
          () => `
        <tr class="blank-row">
          <td class="num">&nbsp;</td>
          <td class="desc">&nbsp;</td>
          <td class="qty">&nbsp;</td>
          <td class="unit">&nbsp;</td>
          <td class="price">&nbsp;</td>
          <td class="amount">&nbsp;</td>
        </tr>
      `
        )
        .join("");
      const isLast = pageIndex === pageSizes.length - 1;
      const footerHtml = isLast ? buildCiFooterHtml() : "";
      ciCursor += pageSize;
      return `
      <div class="page">
        <div class="ci-header">
          <div class="ci-company-name">${supplier.name}</div>
          <div class="ci-company-addr addr">${supplier.address}</div>
          <div class="ci-company-contact">Tel: ${supplier.tel} &nbsp; E-mail: ${record.email || "-"}</div>
          <div class="ci-divider"></div>
        </div>
        <div class="ci-title">Commercial Invoice</div>
        <div class="ci-info">
          <div class="ci-left">
            <div class="ci-to">TO:</div>
            <div class="ci-to-name">${buyerInfo.name}</div>
            <div class="ci-to-addr addr">${buyerInfo.address}</div>
            <div>${buyerInfo.tel}</div>
            <div>${buyerInfo.email}</div>
          </div>
          <div class="ci-right">
            <div><span>Invoice No.:</span><span>${ciNumber}</span></div>
            <div><span>Reference PI No.:</span><span>${piNumber}</span></div>
            <div><span>Date:</span><span>${formatDateShort(ciDate)}</span></div>
            <div><span>Currency:</span><span>${currency}</span></div>
            <div><span>Delivery Term:</span><span>DDP-${resolveCustomerCity(record, shipTo)}</span></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th></th>
              <th>Description</th>
              <th class="qty">Quantity</th>
              <th class="unit">Unit</th>
              <th class="price">Unit Price</th>
              <th class="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            ${blankRows}
          </tbody>
        </table>
        ${footerHtml}
      </div>
      `;
    })
    .join("");

  let plCursor = 0;
  const packingPagesHtml = pageSizes
    .map((pageSize, pageIndex) => {
      const chunk = details.slice(plCursor, plCursor + pageSize);
      const rowsHtml = chunk
        .map((item, index) => {
          const rowIndex = plCursor + index + 1;
          const qty = Number(getFieldValue(item, "qty")) || 0;
          const unit = getFieldValue(item, "unit") || "-";
          const desc = getFieldValue(item, "description") || "-";
          return `
        <tr>
          <td class="product">${rowIndex}</td>
          <td class="desc">${desc}</td>
          <td class="unit">${unit}</td>
          <td class="qty">${qty}</td>
        </tr>
      `;
        })
        .join("");
      const blankCount = Math.max(0, pageSize - chunk.length);
      const blankRows = Array.from({ length: blankCount })
        .map(
          () => `
        <tr class="blank-row">
          <td class="product">&nbsp;</td>
          <td class="desc">&nbsp;</td>
          <td class="unit">&nbsp;</td>
          <td class="qty">&nbsp;</td>
        </tr>
      `
        )
        .join("");
      const isLast = pageIndex === pageSizes.length - 1;
      const totalQty = isLast
        ? details.reduce(
            (sum, item) => sum + (Number(getFieldValue(item, "qty")) || 0),
            0
          )
        : 0;
      const footerHtml = isLast
        ? `
      <div class="pl-total-line">
        <span class="label">TOTAL:</span>
        <span class="amount">${totalQty}</span>
      </div>
      <div class="pl-footer">
        <div class="pl-remarks">
          <strong>Remarks:</strong>
          <div>This Packing List is issued for logistics purposes only</div>
          <div>and does not contain any commercial value.</div>
        </div>
        <div class="pl-chop">
          <img class="stamp-img" src="${stampSrc}" alt="Company Chop" />
          <div class="pl-chop-line"></div>
          <div class="pl-chop-label">Company Chop:</div>
        </div>
      </div>
      `
        : "";
      plCursor += pageSize;
      return `
      <div class="page">
        <div class="pl-header">
          <div class="pl-shipper">
            <div class="pl-label">Shipper:</div>
            <div class="pl-name">${supplier.name}</div>
            <div class="addr">${supplier.address}</div>
            <div>Tel: ${supplier.tel}</div>
          </div>
          <div class="pl-title">PACKING LIST</div>
        </div>
        <div class="pl-info">
          <div class="pl-to">
            <div class="pl-label">TO:</div>
            <div class="pl-name">${shipTo.name}</div>
            <div class="addr">${shipTo.address}</div>
            <div>Tel: ${shipTo.tel}</div>
          </div>
          <div class="pl-right">
            <div class="pl-row"><span>Packing List No.:</span><span>${plNumber}</span></div>
            <div class="pl-row"><span>Invoice No.:</span><span>${ciNumber}</span></div>
            <div class="pl-row"><span>Date:</span><span>${formatDateShort(plDate)}</span></div>
            <div class="pl-transport">
              <div class="pl-transport-title">TRANSPORT DETAILS:</div>
              <div class="pl-row"><span>From:</span><span>${escapeHtml(packingFrom)}</span></div>
              <div class="pl-row"><span>To:</span><span>Malaysia</span></div>
              <div class="pl-row"><span>Delivery Term:</span><span>DDP ${deliveryCity}</span></div>
            </div>
          </div>
        </div>

        <table class="pl-table">
          <thead>
            <tr>
              <th class="product">Product</th>
              <th class="desc">Description</th>
              <th class="unit">Unit</th>
              <th class="qty">Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            ${blankRows}
          </tbody>
        </table>
        ${footerHtml}
      </div>
      `;
    })
    .join("");

  const statementPagesHtml = `
      <div class="page statement-page">
        <div class="statement-title">STATEMENT COVER</div>
        <div class="statement-meta">
          <div><span>Reference PO No.:</span><span>${referencePo}</span></div>
          <div><span>PI Number:</span><span>${piNumber}</span></div>
          <div><span>Date:</span><span>${formatDateShort(record.docDate || pi.docDate)}</span></div>
        </div>
        <div class="statement-section">
          <div class="statement-heading">1. Parties Information</div>
          <div class="statement-subheading">Seller / Exporter</div>
          <div>Company Name: ${supplier.name}</div>
          <div>Registered Address: ${supplier.address.replace(/\n/g, ", ")}</div>
          <div>Contact Tel.: ${supplier.tel}</div>
          <div>Email: ${record.email || "-"}</div>
        </div>
        <div class="statement-section">
          <div class="statement-subheading">Buyer / Importer</div>
          <div>Company Name: ${buyerInfo.name}</div>
          <div>Business Address: ${buyerInfo.address.replace(/\n/g, ", ")}</div>
          <div>Contact Person: ${buyerInfo.attn || "-"}</div>
          <div>Contact Tel.: ${buyerInfo.tel}</div>
          <div>Email: ${buyerInfo.email}</div>
        </div>
        <div class="statement-section">
          <div class="statement-heading">2. DDP Delivery Terms (INCOTERMS® 2020)</div>
          <div>This declaration applies to all transactions designated "DDP Malaysia". Under Delivered Duty Paid (DDP) terms:</div>
          <div>- Seller bears all import duties, SST, VAT, and related taxes.</div>
          <div>- Seller is fully responsible for customs clearance.</div>
          <div>- Buyer has no obligation to provide import permits (K1/K2) or import tax documentation.</div>
          <div>- Buyer assumes no liability for import-related matters.</div>
        </div>
        <div class="statement-section">
          <div class="statement-heading">3. Transfer of Risk and Responsibility</div>
          <div>Risk remains with the Seller until the goods are delivered to the Buyer's designated place. Seller bears full liability for loss, damage, customs detention, delay, or misdelivery prior to final delivery.</div>
        </div>
        <div class="statement-section">
          <div class="statement-heading">4. Customs Compliance and Tax Treatment</div>
          <div>Seller ensures all customs declarations are truthful and accurate. Any fines or penalties arising from documentation errors are borne solely by the Seller.</div>
          <div>Buyer may treat DDP shipments as Out-of-Scope (OOS) and issue self-billed e-invoices as required.</div>
        </div>
        <div class="statement-section">
          <div class="statement-heading">5. Payment Terms</div>
          <div class="statement-subheading">5.1 Payment Schedule</div>
          <div>Buyer shall make full payment by:</div>
          <div>- Within 30 days after successful delivery, OR</div>
          <div>- Within 90 days from the Purchase Order date</div>
          <div class="statement-subheading">5.2 Designated Bank Accounts</div>
          ${banks
            .map(
              (b) => `
          <div>${escapeHtml(b.label || "Bank Account")}:</div>
          <div>Account Number: ${escapeHtml(b.accountNumber || "-")}</div>
          <div>Account Name: ${escapeHtml(b.accountName || "-")}</div>
          <div>Bank Name: ${escapeHtml(b.bankName || "-")}</div>
          `
            )
            .join("")}
        </div>
        <div class="statement-page-number">Page 1 / 2</div>
      </div>
      <div class="page statement-page">
        <div class="statement-section">
          <div class="statement-heading">6. Documentation Requirements</div>
          <div>Seller shall provide PI, CI, PL, and delivery confirmation/tracking as applicable.</div>
        </div>
        <div class="statement-section">
          <div class="statement-heading">7. Warranty of Quality</div>
          <div>Seller warrants goods conform to specifications and are fit for intended commercial purpose.</div>
        </div>
        <div class="statement-section">
          <div class="statement-heading">8. Fundamental Breach and Remedies</div>
          <div>Buyer may dispose of non-conforming goods at Seller's expense and withhold/refund payments for fundamental breach.</div>
        </div>
        <div class="statement-section">
          <div class="statement-heading">9. Governing Law and Precedence</div>
          <div>This declaration remains valid indefinitely. If discrepancies occur, the specific PO/PI/CI shall prevail.</div>
        </div>
        <div class="statement-section">
          <div class="statement-heading">10. Non-Binding Variables</div>
          <div>This declaration excludes variable details such as item lists, quantities, prices, freight, and HS Codes.</div>
        </div>
        <div class="statement-signature">
          <img class="stamp-img" src="${stampSrc}" alt="Company Chop" />
          <div class="statement-sign-line"></div>
          <div class="statement-sign-label">Company Chop:</div>
          <div class="statement-sign-name">${supplier.name}</div>
          <div class="statement-sign-date">Date: ${formatDateShort(record.docDate || pi.docDate)}</div>
        </div>
        <div class="statement-page-number statement-page-number-bottom">Page 2 / 2</div>
      </div>
  `;

  return `
  <html>
    <head>
      <meta charset="UTF-8" />
      <base href="${baseHref}" />
      <title>Proforma Invoice</title>
      <style>
        body { font-family: "Times New Roman", serif; color: #111; margin: 24px; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .header { display: grid; grid-template-columns: 1fr; gap: 8px; }
        .header-top { display: flex; justify-content: flex-end; }
        .title { text-align: right; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: 0.6px; }
        .ci-header { text-align: center; margin-bottom: 6px; }
        .ci-company-name { font-size: 20px; font-weight: 700; }
        .ci-company-addr { font-size: 13px; }
        .ci-company-contact { font-size: 13px; margin-top: 2px; }
        .ci-divider { border-top: 1px solid #111; margin: 6px 0 4px; }
        .ci-title { text-align: center; font-size: 18px; font-weight: 700; margin: 6px 0; }
        .ci-info { display: grid; grid-template-columns: 1fr 260px; gap: 16px; }
        .ci-left { font-size: 12px; }
        .ci-right { font-size: 12px; }
        .ci-right div { display: grid; grid-template-columns: 120px 1fr; gap: 6px; margin-bottom: 4px; }
        .ci-to { font-weight: 700; margin-bottom: 4px; }
        .ci-footer-top { border-top: 2px solid #111; padding-top: 6px; display: grid; grid-template-columns: 1fr; justify-items: end; font-size: 14px; gap: 2px; }
        .ci-total { display: grid; grid-template-columns: auto auto; gap: 10px; font-weight: 700; }
        .ci-total-note { font-size: 13px; }
        .ci-footer-center { text-align: center; font-size: 13px; margin: 8px 0 6px; }
        .ci-footer-body { display: grid; grid-template-columns: 1fr 220px; gap: 16px; font-size: 13px; }
        .ci-payment-title { font-weight: 700; margin-bottom: 6px; }
        .ci-payment-block { margin-bottom: 8px; }
        .ci-payment-label { font-weight: 700; margin-bottom: 2px; }
        .ci-chop { display: flex; flex-direction: column; align-items: center; justify-content: center; break-inside: avoid; page-break-inside: avoid; isolation: isolate; }
        .ci-chop-line { border-bottom: 2px solid #111; width: 180px; margin: 8px 0 6px; }
        .ci-chop-label { font-weight: 700; text-align: center; }
        .pl-header { display: grid; grid-template-columns: 1fr; gap: 6px; align-items: start; }
        .pl-shipper { font-size: 14px; line-height: 1.45; }
        .pl-label { font-weight: 700; margin-bottom: 4px; }
        .pl-name { font-weight: 700; }
        .pl-title { text-align: center; font-size: 20px; font-weight: 700; padding: 6px 0; border-top: 2px solid #111; border-bottom: 2px solid #111; letter-spacing: 0.4px; }
        .pl-info { display: grid; grid-template-columns: 1fr 260px; gap: 16px; margin-top: 8px; font-size: 14px; }
        .pl-row { display: grid; grid-template-columns: 120px 1fr; gap: 6px; margin-bottom: 4px; }
        .pl-transport { margin-top: 6px; }
        .pl-transport-title { font-weight: 700; margin-bottom: 4px; }
        .pl-table thead tr { background: #111 !important; color: #fff !important; }
        .pl-table th, .pl-table td { padding: 6px 4px; }
        .pl-table .product { text-align: center; width: 60px; }
        .pl-table .desc { padding-left: 2ch; padding-right: 2ch; }
        .pl-table .qty { text-align: right; }
        .pi-table .blank-row td { height: 18px; }
        .pl-total-line { border-top: 2px solid #111; margin-top: 12px; padding-top: 6px; display: grid; grid-template-columns: auto auto; justify-content: end; gap: 12px; font-weight: 700; font-size: 14px; }
        .pl-footer { margin-top: 8px; display: grid; grid-template-columns: 1fr 220px; gap: 16px; align-items: start; }
        .pl-remarks { font-size: 15px; }
        .pl-remarks strong { display: block; margin-bottom: 6px; }
        .pl-chop { display: flex; flex-direction: column; align-items: center; font-size: 13px; padding-top: 12px; break-inside: avoid; page-break-inside: avoid; isolation: isolate; }
        .pl-chop-line { border-bottom: 2px solid #111; width: 180px; margin-bottom: 6px; }
        .pl-chop-label { font-weight: 700; text-align: center; }
        .stamp-img { width: 140px; height: auto; display: block; margin: 0 0 6px auto; mix-blend-mode: screen; }
        .statement-page { font-size: 14.5px; line-height: 1.35; display: flex; flex-direction: column; min-height: 100vh; }
        .statement-title { text-align: center; font-size: 18.5px; font-weight: 700; margin: 6px 0 10px; }
        .statement-meta { display: grid; grid-template-columns: 1fr; justify-items: end; gap: 4px; margin-bottom: 10px; }
        .statement-meta div { display: grid; grid-template-columns: 140px 1fr; gap: 6px; width: fit-content; }
        .statement-meta div span:first-child { text-align: right; }
        .statement-section { margin-bottom: 10px; }
        .statement-heading { font-weight: 700; margin-bottom: 4px; }
        .statement-subheading { font-weight: 700; margin: 6px 0 4px; }
        .statement-signature { margin-top: calc(40px + 20ch); display: flex; flex-direction: column; align-items: flex-end; isolation: isolate; width: 100%; }
        .statement-sign-line { border-bottom: 2px solid #111; width: 180px; margin-bottom: 6px; }
        .statement-sign-label { font-weight: 700; text-align: center; margin-bottom: 6px; }
        .statement-sign-name { font-weight: 700; }
        .statement-signature > * { text-align: right; }
        .statement-signature .stamp-img { margin: 0 0 6px auto; }
        .statement-page-number { text-align: center; margin-top: 16px; font-size: 13.5px; }
        .statement-page-number-bottom { margin-top: auto; padding-top: 0; }
        .seller-block { display: grid; grid-template-columns: 1fr 260px; gap: 16px; align-items: start; }
        .seller-title { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
        .seller-left p { margin: 3px 0; font-size: 12px; font-weight: 400; }
        .info-right { font-size: 12px; }
        .info-right div { display: grid; grid-template-columns: 120px 1fr; gap: 6px; margin-bottom: 4px; }
        .info-spacer { height: 12px; }
        .billship { margin-top: 10px; }
        .billship-header { background: #111 !important; color: #fff !important; padding: 4px 8px; font-size: 14px; display: grid; grid-template-columns: 1fr 1fr; font-weight: 700; }
        .billship-body { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #111; }
        .billship-body .col { padding: 6px 8px; font-size: 12px; font-weight: 400; }
        .addr { white-space: pre-line; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; border-top: 1px solid #111; border-bottom: 1px solid #111; page-break-inside: auto; }
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        tr { page-break-inside: avoid; page-break-after: auto; }
        thead tr { background: #111 !important; color: #fff !important; }
        th, td { padding: 6px 4px; }
        th { text-align: left; font-weight: 700; }
        .num { width: 30px; }
        .qty { width: 60px; text-align: right; padding-left: 0; padding-right: 0; }
        .unit { width: 60px; text-align: center; padding-left: 0; padding-right: 0; }
        .price, .amount { width: 90px; text-align: right; }
        .desc { width: auto; }
        .total-row { text-align: right; font-weight: 700; }
        .blank-row td { height: 18px; }
        .total-line { margin-top: 8px; display: flex; justify-content: flex-end; gap: 12px; font-size: 12px; }
        .total-line .label { font-weight: 700; white-space: nowrap; }
        .total-line .amount { white-space: nowrap; }
        .amount-words { font-size: 11px; text-align: left; white-space: normal; word-break: break-word; }
        .footer { margin-top: 4px; display: grid; grid-template-columns: 1fr 220px; gap: 16px; }
        .remarks { font-size: 12px; }
        .remarks strong { display: block; margin-bottom: 6px; }
        .total-box { text-align: right; font-size: 12px; }
        .chop { margin-top: calc(-6px - 12ch); display: flex; flex-direction: column; align-items: flex-end; font-size: 12px; break-inside: avoid; page-break-inside: avoid; isolation: isolate; }
        .chop-line { border-bottom: 2px solid #111; width: 180px; display: inline-block; margin-top: 6px; }
        .chop-label { font-weight: 700; text-align: center; width: 180px; }
        .page { page-break-after: always; }
        .page:last-child { page-break-after: auto; }
        @media print {
          body { margin: 24px; }
          thead { display: table-header-group; }
        }
      </style>
    </head>
    <body>
      ${pagesHtml}
      ${commercialPagesHtml}
      ${packingPagesHtml}
      ${statementPagesHtml}
    </body>
  </html>
  `;
}

async function printPurchasePi(pi) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    appendLog("无法打开打印窗口，请检查浏览器弹窗设置");
    return;
  }
  const baseHref = getPrintBaseHref();
  const record = extractRecord(pi);
  const creditorCode =
    pi?.printProfileKey ||
    record?.creditorCode ||
    pi?.creditorCode ||
    record?.accNo ||
    "";
  const creditorName = record?.creditorName || pi?.creditorName || "";
  const profile =
    resolvePrintProfileByCreditor(creditorCode, creditorName) || null;
  const stampOverride = profile?.stampDataUrl || profile?.stampPath || "";
  const stampSrc = await getStampSrcWithOverride(stampOverride);
  printWindow.document.open();
  printWindow.document.write(buildPiPrintHtml(pi, stampSrc, baseHref, profile));
  printWindow.document.close();
  printWindow.focus();
  /* 以 PI 单号命名：另存为 PDF 时浏览器默认文件名取 document.title */
  const rawNo =
    (pi && pi.master && pi.master.docNo) ||
    (pi && pi.docNo) ||
    (record && (record.docNo || pi.docNo)) ||
    "";
  const safeName = String(rawNo || "PI-print")
    .replace(/[\\/:*?"<>|\s]+/g, "_")
    .slice(0, 80);
  printWindow.document.title = safeName;
  setTimeout(() => {
    try {
      printWindow.print();
    } catch (error) {
      // ignore
    }
  }, 100);
}

async function createPurchaseInvoiceFromPo(
  poItem,
  supplierRecord,
  consigneeRecord,
  piMeta
) {
  const record = extractRecord(poItem);
  const docNo = getFieldValue(record, "docNo") || getFieldValue(poItem, "docNo");
  if (!docNo) {
    throw new Error("缺少 PO 单号");
  }
  const detail = await fetchPurchaseOrderDetail(docNo);
  const poMaster = detail?.master || detail || {};
  const poDetails = detail?.details || detail?.detail || [];
  const selectedSupplier = supplierRecord || poMaster;
  if (!poMaster.creditorCode || !poMaster.creditorName) {
    throw new Error("PO 缺少供应商信息");
  }
  if (!poMaster.purchaseLocation) {
    throw new Error("PO 缺少 Location");
  }
  const payload = buildPurchaseInvoiceInput(
    {
      ...poMaster,
      creditorCode: selectedSupplier.creditorCode || poMaster.creditorCode,
      creditorName: selectedSupplier.creditorName || poMaster.creditorName,
      taxEntity: selectedSupplier.taxEntity || poMaster.taxEntity,
      email: selectedSupplier.email || poMaster.email,
      address: selectedSupplier.address || poMaster.address,
      attention: selectedSupplier.attention || poMaster.attention,
      phone1: selectedSupplier.phone1 || poMaster.phone1,
      fax1: selectedSupplier.fax1 || poMaster.fax1,
      creditTerm: selectedSupplier.creditTerm || poMaster.creditTerm
    },
    poDetails,
    selectedSupplier.creditorCode || poMaster.creditorCode,
    consigneeRecord,
    piMeta
  );
  const total = calculatePiTotal(payload.details);
  const referenceIvNo = piMeta?.referenceIvNo || "";
  const referencePoNo = piMeta?.referencePoNo || docNo;
  const ivCustomerName = piMeta?.ivCustomerName || "";
  const ivTotal = piMeta?.ivTotal !== undefined && piMeta?.ivTotal !== "" ? piMeta.ivTotal : "";
  payload.master.referenceIvNo = referenceIvNo;
  payload.master.referencePoNo = referencePoNo;
  payload.master.ivCustomerName = ivCustomerName;
  payload.master.ivTotal = ivTotal;
  payload.master.piTotal = total;
  return {
    docNo: piMeta?.piNumber || `PI-${docNo}`,
    docDate: payload.master.docDate,
    validityDate: piMeta?.validityDate || null,
    referencePoNo: piMeta?.referencePoNo || docNo,
    referenceIvNo,
    ivCustomerName,
    ivTotal,
    piTotal: total,
    creditorName: payload.master.creditorName,
    creditorCode: payload.master.creditorCode,
    currencyCode: poMaster.currencyCode || "MYR",
    total,
    status: "Local",
    sourcePONo: docNo,
    consigneeName: payload.master.deliverContact || "",
    billToName: "JINZA TRADING SDN. BHD.",
    /* 关键：把“供应商模板/公章档案”固化进 PI，确保后续打印不会受列表刷新影响 */
    printProfileKey: supplierRecord?.printProfileKey || supplierRecord?.code || payload.master.creditorCode || "",
    master: payload.master,
    details: payload.details
  };
}

async function createPurchaseOrderFromInvoice(item, record) {
  const supplier = getSelectedSupplier();
  if (!supplier) {
    appendLog("请选择供应商");
    return null;
  }
  const meta = {
    creditorCode: supplier.code,
    creditorName: supplier.name,
    creditTerm: poCreditTermEl.value || "Net 30 days",
    purchaseLocation: poLocationEl.value,
    docDate: poDateEl.value || new Date().toISOString().slice(0, 10),
    address: supplier.address || null,
    taxEntity: supplier.taxEntity || null,
    email: supplier.email || null,
    attention: supplier.attention || null,
    phone1: supplier.phone1 || null,
    fax1: supplier.fax1 || null
  };
  if (!meta.creditorCode || !meta.creditorName || !meta.docDate) {
    appendLog("供应商或日期不能为空");
    return null;
  }
  if (!meta.purchaseLocation) {
    appendLog("请选择 Location");
    return null;
  }
  const payload = buildPurchaseOrderInput(item, record, meta);
  await callWithMode({
    method: "POST",
    path: "/{accountBookId}/purchaseorder",
    body: payload
  });

  const listing = await callWithMode({
    method: "POST",
    path: "/{accountBookId}/purchaseorder/listing",
    body: {
      page: 1,
      filter: {
        date: {
          from: `${meta.docDate}T00:00:00`,
          to: `${meta.docDate}T23:59:59`
        },
        creditorCode: { value: meta.creditorCode }
      }
    }
  });

  const latest =
    Array.isArray(listing?.data) && listing.data.length > 0
      ? listing.data[0]
      : null;
  return latest;
}

function buildAllFields(record) {
  if (!record || typeof record !== "object") {
    return [];
  }
  return Object.keys(record)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => [key, key]);
}

function uniqueValues(items, key) {
  const set = new Set();
  items.forEach((item) => {
    const record = extractRecord(item);
    const value = getFieldValue(record, key);
    if (value !== undefined && value !== null && value !== "") {
      set.add(String(value));
    }
  });
  return Array.from(set);
}

function populateSelect(selectEl, values, fallbackOptions = []) {
  const options = values.length > 0 ? values : fallbackOptions;
  selectEl.innerHTML = options
    .map((value) => `<option value="${value}">${value}</option>`)
    .join("");
}

function getMultiSelectValue(selectEl) {
  const values = Array.from(selectEl.selectedOptions)
    .map((option) => option.value)
    .filter(Boolean);
  return values.length > 0 ? values : [];
}

function parseDelimited(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) {
    return [];
  }
  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const rows = lines.map((line) =>
    line.split(delimiter).map((cell) => cell.trim())
  );
  const headerMap = {
    productcode: "productCode",
    code: "productCode",
    productname: "productName",
    name: "productName",
    unit: "unit",
    price: "price",
    cost: "cost"
  };
  const header = rows[0].map((cell) =>
    cell.toLowerCase().replace(/\s+/g, "")
  );
  const hasHeader = header.some((cell) => headerMap[cell]);
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const indices = {};
  if (hasHeader) {
    header.forEach((cell, index) => {
      const key = headerMap[cell];
      if (key) {
        indices[key] = index;
      }
    });
  }
  return dataRows.map((cols) => {
    if (hasHeader) {
      return {
        productCode: cols[indices.productCode] || "",
        productName: cols[indices.productName] || "",
        unit: cols[indices.unit] || "",
        price: cols[indices.price] || "",
        cost: cols[indices.cost] || ""
      };
    }
    return {
      productCode: cols[0] || "",
      productName: cols[1] || "",
      unit: cols[2] || "",
      price: cols[3] || "",
      cost: cols[4] || ""
    };
  });
}

function parseFreeText(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  return lines.map((line) => {
    const tokens = line.trim().split(/\s+/);
    if (tokens.length < 2) {
      return null;
    }
    const nums = tokens.filter((token) => !Number.isNaN(Number(token)));
    const price = nums.length > 0 ? nums[nums.length - 2] : "";
    const cost = nums.length > 0 ? nums[nums.length - 1] : "";
    const code = tokens[0];
    const unit = tokens.length > 2 ? tokens[tokens.length - 3] : "";
    const name = tokens.slice(1, tokens.length - 3).join(" ");
    return {
      productCode: code || "",
      productName: name || "",
      unit,
      price,
      cost
    };
  }).filter(Boolean);
}

function renderImportPreview(items) {
  if (!items || items.length === 0) {
    productImportPreviewEl.textContent = "暂无可导入内容";
    return;
  }
  const rows = items.slice(0, 20);
  const table = `
    <table>
      <thead>
        <tr>
          <th>Product Code</th>
          <th>Product Name</th>
          <th>Unit</th>
          <th>Price</th>
          <th>Cost</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
          <tr>
            <td>${row.productCode || "-"}</td>
            <td>${row.productName || "-"}</td>
            <td>${row.unit || "-"}</td>
            <td>${row.price || "-"}</td>
            <td>${row.cost || "-"}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
  productImportPreviewEl.innerHTML = table;
}

async function openProductImportModal() {
  const products = state.data.product || [];
  populateSelect(productImportTypeEl, uniqueValues(products, "productType"), [
    "I",
    "N",
    "S"
  ]);
  populateSelect(productImportStatusEl, uniqueValues(products, "status"), [
    "A",
    "I",
    "D"
  ]);
  populateSelect(
    productImportCategoryEl,
    uniqueValues(products, "productCategoryName"),
    [""]
  );
  populateSelect(
    productImportPostingEl,
    uniqueValues(products, "postingGroup"),
    [""]
  );
  populateSelect(
    productImportSupplierEl,
    (state.data.supplier || []).map((item) => {
      const record = extractRecord(item);
      return getFieldValue(record, "accNo") || "";
    }).filter(Boolean),
    [""]
  );
  populateSelect(
    productImportClassEl,
    uniqueValues(products, "classificationCode"),
    [""]
  );
  populateSelect(
    productImportUnitTypeEl,
    uniqueValues(products, "unitType"),
    [""]
  );
  productImportTextEl.value = "";
  productImportPreviewEl.textContent = "等待导入数据";
  productImportModalEl.classList.remove("hidden");
}

function closeProductImportModal() {
  productImportModalEl.classList.add("hidden");
  productImportImageFile = null;
}

async function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.readAsText(file);
  });
}

async function runOcr(file) {
  if (!window.Tesseract) {
    throw new Error("OCR 组件未加载");
  }
  const result = await window.Tesseract.recognize(file, "eng");
  return result?.data?.text || "";
}

async function parseImportText() {
  const text = productImportTextEl.value.trim();
  if (!text) {
    renderImportPreview([]);
    return [];
  }
  const items = text.includes(",") || text.includes("\t")
    ? parseDelimited(text)
    : parseFreeText(text);
  renderImportPreview(items);
  return items;
}

async function createProducts(items) {
  const defaults = {
    productType: getMultiSelectValue(productImportTypeEl)[0] || "",
    status: getMultiSelectValue(productImportStatusEl)[0] || "",
    productCategoryName: getMultiSelectValue(productImportCategoryEl)[0] || null,
    postingGroup: getMultiSelectValue(productImportPostingEl)[0] || null,
    supplier: getMultiSelectValue(productImportSupplierEl)[0] || null,
    classificationCode: getMultiSelectValue(productImportClassEl)[0] || null,
    unitType: getMultiSelectValue(productImportUnitTypeEl)[0] || null
  };
  for (const item of items) {
    if (!item.productCode || !item.productName) {
      continue;
    }
    const payload = {
      product: {
        productCode: item.productCode,
        productName: item.productName,
        productType: defaults.productType,
        status: defaults.status,
        unit: item.unit || null,
        price: Number(item.price) || 0,
        cost: Number(item.cost) || 0,
        productCategoryName: defaults.productCategoryName,
        postingGroup: defaults.postingGroup,
        supplier: defaults.supplier,
        classificationCode: defaults.classificationCode,
        unitType: defaults.unitType
      }
    };
    await callWithMode({
      method: "POST",
      path: "/{accountBookId}/product",
      body: payload
    });
  }
}

function renderInvoiceModal(item, record) {
  drawerTabsEl.innerHTML = "";
  drawerContentEl.innerHTML = "";
  drawerRawEl.textContent = "";
  drawerEl.classList.add("invoice-modal");
  drawerCloseEl.textContent = "×";

  const docNo = getFieldValue(record, "docNo") || "-";
  const totalRaw =
    Number(getFieldValue(record, "total")) ||
    Number(getFieldValue(record, "localNetTotal")) ||
    Number(getFieldValue(record, "totalExTax"));
  const totalDisplay = formatNumber(totalRaw);
  const statusValue =
    getFieldValue(record, "eInvoiceStatus") ||
    getFieldValue(record, "status") ||
    "-";
  const submitTime =
    getFieldValue(record, "eInvoiceSubmitDate") ||
    getFieldValue(record, "eInvoiceSubmitTime") ||
    "";

  drawerTitleEl.textContent = `View Invoice [${docNo}]`;
  const headerMeta =
    drawerEl.querySelector(".drawer-header-meta") ||
    document.createElement("div");
  headerMeta.className = "drawer-header-meta";
  headerMeta.innerHTML = `
    <div class="invoice-total">
      <span class="label">Total</span>
      <span class="value">${totalDisplay}</span>
    </div>
  `;
  if (!drawerEl.querySelector(".drawer-header-meta")) {
    drawerTitleEl.parentElement.appendChild(headerMeta);
  }

  const banner = document.createElement("div");
  banner.className = "invoice-banner";
  banner.innerHTML = `e-Invoice status: ${statusValue}${
    submitTime ? `, submitted on ${submitTime}` : ""
  } <span class="info-link">View Details</span>`;

  const infoGrid = document.createElement("div");
  infoGrid.className = "invoice-info-grid";
  const infoItems = [
    {
      key: "debtorCode",
      label: "Customer",
      link: "Customer Info"
    },
    {
      key: "debtorName",
      label: "Name",
      subLabel: "Tax Entity",
      subValue: getFieldValue(record, "taxEntity")
    },
    {
      key: "email",
      label: "Email",
      link: "CC / BCC"
    },
    {
      key: "docNo",
      label: "Invoice No.",
      link: "Document Info"
    },
    {
      key: "address",
      label: "Address",
      link: "Annexure"
    },
    {
      key: "salesAgent",
      label: "Sales Agent"
    },
    {
      key: "creditTerm",
      label: "Credit Term"
    },
    {
      key: "docDate",
      label: "Date",
      link: "Tax Date",
      linkValue: getFieldValue(record, "taxDate")
    }
  ];
  infoItems.forEach((info) => {
    let value = getFieldValue(record, info.key);
    if (info.key === "docDate" || info.key === "taxDate") {
      if (typeof value === "string") {
        value = value.replace("T00:00:00", "");
      }
    }
    let linkValue = info.linkValue;
    if (info.key === "docDate" && typeof linkValue === "string") {
      linkValue = linkValue.replace("T00:00:00", "");
    }
    const itemEl = document.createElement("div");
    itemEl.className = "invoice-info-item";
    itemEl.dataset.key = info.key;
    itemEl.innerHTML = `
      <div class="label-row">
        <span class="label">${info.label}</span>
        ${info.link ? `<span class="info-link">${info.link}</span>` : ""}
      </div>
      <span class="value">${
        value === undefined || value === null || value === "" ? "-" : value
      }</span>
      ${
        info.subLabel
          ? `<span class="subline">${info.subLabel}: ${
              info.subValue === undefined ||
              info.subValue === null ||
              info.subValue === ""
                ? "-"
                : info.subValue
            }</span>`
          : ""
      }
      ${
        linkValue
          ? `<span class="subline">${linkValue}</span>`
          : ""
      }
    `;
    infoGrid.appendChild(itemEl);
  });

  const tableActions = document.createElement("div");
  tableActions.className = "invoice-table-actions";
  tableActions.innerHTML = `
    <button class="icon-btn" title="Info">i</button>
    <div class="spacer"></div>
    <button class="icon-btn" title="Print">⎙</button>
    <button class="icon-btn" title="Copy">⧉</button>
    <button class="icon-btn" title="Settings">⚙</button>
  `;

  const items = Array.isArray(item?.details) ? item.details : [];
  const table = document.createElement("div");
  table.className = "drawer-table invoice-table";
  const tableHeader = document.createElement("div");
  tableHeader.className = "drawer-table-row header";
  const itemColumns = [
    { key: "productCode", label: "Product Code" },
    {
      label: "Product Variant",
      value: (row) =>
        [row.productVariant1Option, row.productVariant2Option]
          .filter(Boolean)
          .join(" / ")
    },
    { key: "description", label: "Description" },
    { key: "furtherDescription", label: "Furt." },
    { key: "deptNo", label: "Dept No." },
    { key: "qty", label: "Qty" },
    { key: "unitPrice", label: "Unit Price" },
    { key: "discount", label: "Discount" },
    { key: "unit", label: "Unit Type" },
    { key: "classificationCode", label: "Classification" },
    { key: "taxCode", label: "Tax Code" },
    { key: "subTotal", label: "Total (inc)" }
  ];
  itemColumns.forEach((col) => {
    const cell = document.createElement("div");
    cell.className = "drawer-table-cell";
    cell.textContent = col.label;
    tableHeader.appendChild(cell);
  });
  table.appendChild(tableHeader);
  if (items.length === 0) {
    const rowEl = document.createElement("div");
    rowEl.className = "drawer-table-row";
    const cell = document.createElement("div");
    cell.className = "drawer-table-cell";
    cell.textContent = "暂无明细";
    rowEl.appendChild(cell);
    table.appendChild(rowEl);
  } else {
    items.forEach((row) => {
      const rowEl = document.createElement("div");
      rowEl.className = "drawer-table-row";
      itemColumns.forEach((col) => {
        const cell = document.createElement("div");
        cell.className = "drawer-table-cell";
        const value =
          typeof col.value === "function"
            ? col.value(row)
            : getFieldValue(row, col.key);
        cell.textContent =
          value === undefined || value === null || value === "" ? "-" : value;
        rowEl.appendChild(cell);
      });
      table.appendChild(rowEl);
    });
  }

  const summary = document.createElement("div");
  summary.className = "invoice-summary";
  const currency = getFieldValue(record, "currencyCode") || "-";
  const rate = getFieldValue(record, "currencyRate") || "-";
  const subtotal = formatNumber(Number(getFieldValue(record, "totalExTax")));
  const tax = formatNumber(
    Number(getFieldValue(record, "tax")) ||
      Number(getFieldValue(record, "localTax"))
  );
  const total = formatNumber(
    Number(getFieldValue(record, "total")) ||
      Number(getFieldValue(record, "localNetTotal"))
  );
  const localTotal = formatNumber(
    Number(getFieldValue(record, "localNetTotal")) ||
      Number(getFieldValue(record, "total"))
  );
  const deposit = formatNumber(Number(getFieldValue(record, "depositAmount")));
  const outstanding = formatNumber(
    Number(getFieldValue(record, "outstandingAmount")) ||
      Number(getFieldValue(record, "total"))
  );
  summary.innerHTML = `
    <div class="invoice-summary-left">
      <div class="invoice-box-row">
        <span class="label">Currency</span>
        <span class="invoice-box">${currency}</span>
      </div>
      <div class="invoice-box-row">
        <span class="label">Rate</span>
        <span class="invoice-box">${rate}</span>
      </div>
      <div class="invoice-box-row">
        <span class="label">Local Total</span>
        <span class="invoice-box">${localTotal}</span>
      </div>
      <div class="invoice-box-row">
        <span class="label">Deposit Payment Amount</span>
        <span class="invoice-box">${deposit}</span>
      </div>
      <div class="invoice-checkbox">
        <span class="checkbox"></span>
        <span>Inclusive?</span>
      </div>
    </div>
    <div class="invoice-summary-right">
      <div class="invoice-summary-row"><span class="label">Subtotal (ex)</span><span class="value">${subtotal}</span></div>
      <div class="invoice-summary-row"><span class="label">Tax</span><span class="value">${tax}</span></div>
      <div class="invoice-summary-row total"><span class="label">Total</span><span class="value">${total}</span></div>
      <div class="invoice-summary-row"><span class="label">Outstanding</span><span class="value">${outstanding}</span></div>
    </div>
  `;

  const attachments = document.createElement("div");
  attachments.className = "invoice-attachments";
  attachments.innerHTML = `<span class="label">Attachments</span><span class="value">No file attached</span>`;

  const content = document.createElement("div");
  content.className = "invoice-modal-content";
  content.appendChild(banner);
  content.appendChild(infoGrid);
  content.appendChild(tableActions);
  content.appendChild(table);
  content.appendChild(summary);
  content.appendChild(attachments);
  drawerContentEl.appendChild(content);
}

function buildSummaryPanel(section, entityName, items) {
  if (!section?.summary) {
    return;
  }
  section.summary.classList.remove("visible");
  section.summary.innerHTML = "";
  return;
  const ui = getSectionUi(entityName);
  if (!ui.showSummary) {
    section.summary.classList.remove("visible");
    section.summary.innerHTML = "";
    return;
  }
  if (!items || items.length === 0) {
    section.summary.classList.remove("visible");
    section.summary.innerHTML = "";
    return;
  }
  section.summary.classList.add("visible");
  const statusCounts = new Map();
  let totalAmount = 0;
  items.forEach((item) => {
    const record = extractRecord(item);
    const status = getStatusValue(entityName, record);
    statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    const amount =
      Number(getFieldValue(record, "total")) ||
      Number(getFieldValue(record, "localNetTotal")) ||
      Number(getFieldValue(record, "totalExTax"));
    if (Number.isFinite(amount)) {
      totalAmount += amount;
    }
  });

  const total = items.length;
  const colors = ["#4f46e5", "#06b6d4", "#f97316", "#22c55e", "#e11d48"];
  const statusEntries = Array.from(statusCounts.entries()).sort(
    (a, b) => b[1] - a[1]
  );
  let start = 0;
  const segments = statusEntries.map(([key, count], index) => {
    const pct = total ? (count / total) * 100 : 0;
    const end = start + pct;
    const color = colors[index % colors.length];
    const segment = `${color} ${start}% ${end}%`;
    start = end;
    return segment;
  });
  const donutSegments = segments.length
    ? segments.join(", ")
    : "#e2e8f0 0% 100%";

  const listItems = [
    { label: "总数", value: total },
    { label: "金额", value: formatNumber(totalAmount) }
  ];
  statusEntries.slice(0, 3).forEach(([key, count]) => {
    listItems.push({ label: key, value: count });
  });

  section.summary.innerHTML = `
    <div class="summary-header">
      <span>概览</span>
      <button class="link-btn" data-action="summary-reset">View all</button>
    </div>
    <div class="summary-body">
      <div class="donut" style="--segments: ${donutSegments}"></div>
      <div class="summary-list">
        ${listItems
          .map(
            (item) =>
              `<div class="summary-item"><span>${item.label}</span><span>${item.value}</span></div>`
          )
          .join("")}
      </div>
    </div>
  `;
}

function updateFilterOptions(section, entityName, items) {
  if (!section?.filterSelect) {
    return;
  }
  const ui = getSectionUi(entityName);
  const statusSet = new Set();
  items.forEach((item) => {
    const record = extractRecord(item);
    statusSet.add(getStatusValue(entityName, record));
  });
  const options = ["all", ...Array.from(statusSet).filter(Boolean)];
  if (!options.includes(ui.filter)) {
    ui.filter = "all";
  }
  section.filterSelect.innerHTML = options
    .map((opt) => {
      const label = opt === "all" ? "All" : opt;
      return `<option value="${opt}">${label}</option>`;
    })
    .join("");
  section.filterSelect.value = ui.filter;
}

function renderSection(entityName, items) {
  const section = dataSections.get(entityName);
  if (!section) {
    return;
  }
  const ui = getSectionUi(entityName);
  const safeItems = Array.isArray(items) ? items : [];
  section.count.textContent = String(safeItems.length);
  updateFilterOptions(section, entityName, safeItems);
  buildSummaryPanel(section, entityName, safeItems);

  const filtered = safeItems.filter((item) => {
    const record = extractRecord(item);
    if (!matchesSearch(record, item, ui.search)) {
      return false;
    }
    if (ui.filter && ui.filter !== "all") {
      const status = getStatusValue(entityName, record);
      return String(status) === String(ui.filter);
    }
    return true;
  });

  /* 构建"已创建"标识 lookup（排序前计算，支持按标识列排序） */
  let createdLookup = null;
  if (entityName === "invoice") {
    const poList = state.data.purchaseOrder || [];
    createdLookup = new Set();
    poList.forEach((po) => {
      const r = extractRecord(po);
      const ref = getFieldValue(r, "ref") || getFieldValue(r, "sourceDocNo") || getFieldValue(r, "refDocNo") || "";
      if (ref) createdLookup.add(String(ref));
    });
  } else if (entityName === "purchaseOrder") {
    const piList = state.data.purchasePI || [];
    createdLookup = new Set();
    piList.forEach((pi) => {
      const r = extractRecord(pi);
      const ref = getFieldValue(r, "referencePoNo") || pi.referencePoNo || (pi.master && pi.master.referencePoNo) || "";
      if (ref) createdLookup.add(String(ref));
    });
  } else if (entityName === "purchasePI") {
    const purchInvList = state.data.purchaseInvoice || [];
    createdLookup = new Set();
    purchInvList.forEach((inv) => {
      const r = extractRecord(inv);
      const sn = getFieldValue(r, "supplierInvoiceNo") || "";
      if (sn) createdLookup.add(String(sn));
    });
  }

  const sorted = sortSectionItems(
    entityName,
    filtered,
    ui.sortKey,
    ui.sortDir,
    createdLookup
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / ui.pageSize));
  ui.page = Math.min(ui.page, totalPages);
  const startIndex = (ui.page - 1) * ui.pageSize;
  const endIndex = Math.min(sorted.length, startIndex + ui.pageSize);
  const pageItems = sorted.slice(startIndex, endIndex);

  section.table.innerHTML = "";
  const columns = listColumns[entityName] || getFieldDefinitions(entityName);
  const useSelection = selectableEntities.has(entityName);
  const gridTpl = getGridTemplate(entityName, useSelection);

  const header = document.createElement("div");
  header.className = "table-row header";
  header.style.gridTemplateColumns = gridTpl;
  let headerCheckbox = null;
  if (useSelection) {
    const cell = document.createElement("div");
    cell.className = "table-cell";
    headerCheckbox = document.createElement("input");
    headerCheckbox.type = "checkbox";
    headerCheckbox.addEventListener("change", (event) => {
      event.stopPropagation();
      pageItems.forEach((item, index) => {
        const record = extractRecord(item);
        const key = getRecordKey(entityName, record, startIndex + index);
        if (event.target.checked) {
          ui.selected.add(key);
        } else {
          ui.selected.delete(key);
        }
      });
      renderSection(entityName, safeItems);
    });
    cell.appendChild(headerCheckbox);
    header.appendChild(cell);
  }
  columns.forEach(([key, label]) => {
    const cell = document.createElement("div");
    cell.className = "table-cell sortable-header";
    const isActive = ui.sortKey === key;
    const arrow = isActive ? (ui.sortDir === "asc" ? " ▲" : " ▼") : "";
    cell.textContent = `${label}${arrow}`;
    cell.title = isActive
      ? `按 ${label} ${ui.sortDir === "asc" ? "升序" : "降序"}（点击切换）`
      : `点击按 ${label} 排序`;
    if (isActive) {
      cell.classList.add("sorted");
    }
    cell.addEventListener("click", (event) => {
      event.stopPropagation();
      if (ui.sortKey === key) {
        ui.sortDir = ui.sortDir === "asc" ? "desc" : "asc";
      } else {
        ui.sortKey = key;
        ui.sortDir = "desc";
      }
      ui.page = 1;
      renderSection(entityName, getEntityData(entityName));
    });
    header.appendChild(cell);
  });
  const actionCell = document.createElement("div");
  actionCell.className = "table-cell";
  actionCell.textContent = "操作";
  header.appendChild(actionCell);
  section.table.appendChild(header);

  pageItems.forEach((item, index) => {
    const record = extractRecord(item);
    const row = document.createElement("div");
    row.className = "table-row data-row";
    row.style.gridTemplateColumns = gridTpl;
    if (useSelection) {
      const cell = document.createElement("div");
      cell.className = "table-cell";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      const key = getRecordKey(entityName, record, startIndex + index);
      checkbox.checked = ui.selected.has(key);
      checkbox.addEventListener("change", (event) => {
        event.stopPropagation();
        if (event.target.checked) {
          ui.selected.add(key);
        } else {
          ui.selected.delete(key);
        }
        if (headerCheckbox) {
          const selectedCount = pageItems.filter((pageItem, pageIndex) => {
            const pageRecord = extractRecord(pageItem);
            const pageKey = getRecordKey(
              entityName,
              pageRecord,
              startIndex + pageIndex
            );
            return ui.selected.has(pageKey);
          }).length;
          headerCheckbox.checked =
            selectedCount === pageItems.length && pageItems.length > 0;
          headerCheckbox.indeterminate =
            selectedCount > 0 && selectedCount < pageItems.length;
        }
      });
      cell.appendChild(checkbox);
      row.appendChild(cell);
    }
    const numericColumns = new Set(["totalExTax", "tax", "total", "netTotal", "localTax", "localExTax", "localNetTotal", "taxableAmt", "localTaxableAmt", "roundAdj", "finalTotal", "currencyRate", "piTotal", "ivTotal", "price", "cost"]);
    /* PI 列表中可双击关联IV的字段 */
    const linkIvFields = new Set(["referenceIvNo", "ivCustomerName", "ivTotal"]);
    columns.forEach(([key]) => {
      const cell = document.createElement("div");
      cell.className = "table-cell";
      /* 特殊列: _createdFlag 已创建标识 */
      if (key === "_createdFlag" && createdLookup) {
        const docNo = getFieldValue(record, "docNo") || (item.docNo) || "";
        const isCreated = docNo && createdLookup.has(String(docNo));
        if (isCreated) {
          cell.textContent = "✓";
          cell.style.color = "#4caf50";
          cell.style.fontWeight = "bold";
          cell.title = "已创建";
        } else {
          cell.textContent = "-";
          cell.style.color = "#666";
        }
        row.appendChild(cell);
        return;
      }
      if (entityName === "product" && (key === "price" || key === "cost")) {
        const sortedVal = getSortFieldValue(entityName, item, key, createdLookup);
        cell.textContent = Number.isFinite(sortedVal) ? formatNumberFixed(sortedVal) : "-";
        row.appendChild(cell);
        return;
      }
      let value = formatDisplayValue(getFieldValue(record, key));
      if (typeof value === "boolean") {
        cell.textContent = value ? "✓" : "-";
      } else if (numericColumns.has(key)) {
        const num = typeof value === "number" ? value : Number(value);
        cell.textContent = Number.isFinite(num) ? formatNumberFixed(num) : (value === undefined || value === null || value === "" ? "-" : value);
      } else {
        cell.textContent =
          value === undefined || value === null || value === "" ? "-" : value;
      }
      /* purchasePI 的 IV 相关字段：双击可手动关联 */
      if (entityName === "purchasePI" && linkIvFields.has(key)) {
        cell.style.cursor = "pointer";
        cell.title = "双击关联/更换发票";
        cell.addEventListener("dblclick", (event) => {
          event.stopPropagation();
          const piArr = state.data.purchasePI || [];
          const piIdx = piArr.indexOf(item);
          if (piIdx >= 0) {
            openLinkIvModal(item, piIdx);
          }
        });
      }
      row.appendChild(cell);
    });

    const actions = document.createElement("div");
    actions.className = "table-cell table-actions";
    const extraActions = [
      entityName === "invoice"
        ? `<button class="btn ghost" data-action="create-po">创建PO</button>`
        : "",
      entityName === "purchaseOrder"
        ? `<button class="btn ghost" data-action="create-pi">创建PI</button>`
        : "",
      entityName === "purchasePI"
        ? `<button class="btn ghost" data-action="print-pi">打印PI</button><button class="btn ghost" data-action="send-mail-pi">📧 发送</button><button class="btn ghost" data-action="create-purchase-invoice">创建发票</button><button class="btn ghost" data-action="delete-pi" style="color:#e74c3c">删除</button>`
        : ""
    ]
      .filter(Boolean)
      .join("");
    actions.innerHTML = `
      <button class="btn ghost" data-action="expand">展开</button>
      <button class="btn ghost" data-action="drawer">详情</button>
      ${extraActions}
    `;
    row.appendChild(actions);
    section.table.appendChild(row);

    const expand = document.createElement("div");
    expand.className = "expand-row";
    const detailFields = getFieldDefinitions(entityName);
    detailFields.forEach(([key, label]) => {
      const value = formatDisplayValue(
        key === "content" ? formatItem(item) : getFieldValue(record, key)
      );
      const detail = document.createElement("div");
      detail.className = "data-detail-row";
      detail.innerHTML = `<span class="label">${label}</span><span class="value">${
        value === undefined || value === null || value === "" ? "-" : value
      }</span>`;
      expand.appendChild(detail);
    });
    section.table.appendChild(expand);

    row.addEventListener("click", async (event) => {
      const action = event.target?.getAttribute?.("data-action");
      if (action === "expand") {
        expand.classList.toggle("open");
        event.target.textContent = expand.classList.contains("open")
          ? "收起"
          : "展开";
      }
      if (action === "drawer") {
        openDrawer(entityName, item, record);
      }
      if (action === "create-po" && entityName === "invoice") {
        try {
          openPoModal(record, item);
        } catch (error) {
          appendLog(error.message || "采购PO创建失败");
        }
      }
      if (action === "create-pi" && entityName === "purchaseOrder") {
        try {
          await openPiModal(item);
        } catch (error) {
          appendLog(error.message || "采购PI创建失败");
        }
      }
      if (action === "print-pi" && entityName === "purchasePI") {
        printPurchasePi(item);
      }
      if (action === "create-purchase-invoice" && entityName === "purchasePI") {
        try {
          await openCreatePurchaseInvoiceModal(item);
        } catch (error) {
          appendLog(error.message || "打开创建采购发票弹窗失败");
        }
      }
      if (action === "send-mail-pi" && entityName === "purchasePI") {
        sendPiMail([item]);
      }
      if (action === "delete-pi" && entityName === "purchasePI") {
        const piDocNo = (item.master?.docNo || item.docNo || "").trim();
        if (!piDocNo) { appendLog("无法获取 PI 单号"); return; }
        if (!confirm(`确定要删除 ${piDocNo} 吗？此操作不可恢复。`)) return;
        try {
          await apiDelete(`/api/pi/${encodeURIComponent(piDocNo)}`);
          state.data.purchasePI = (state.data.purchasePI || []).filter(
            (p) => (p.master?.docNo || p.docNo || "") !== piDocNo
          );
          renderSection("purchasePI", state.data.purchasePI);
          appendLog(`已删除 PI: ${piDocNo}`);
        } catch (e) {
          appendLog(`删除 PI 失败: ${e.message}`);
        }
      }
    });
    row.addEventListener("dblclick", (event) => {
      const tag = event.target?.tagName?.toLowerCase?.();
      if (tag === "button" || tag === "input") {
        return;
      }
      openDrawer(entityName, item, record);
    });
  });

  if (pageItems.length === 0) {
    const row = document.createElement("div");
    row.className = "table-row";
    row.style.gridTemplateColumns = gridTpl;
    const cell = document.createElement("div");
    cell.className = "table-cell";
    cell.style.gridColumn = "1 / -1";
    cell.textContent = "暂无数据";
    row.appendChild(cell);
    section.table.appendChild(row);
  }

  if (headerCheckbox) {
    const selectedCount = pageItems.filter((pageItem, pageIndex) => {
      const pageRecord = extractRecord(pageItem);
      const pageKey = getRecordKey(
        entityName,
        pageRecord,
        startIndex + pageIndex
      );
      return ui.selected.has(pageKey);
    }).length;
    headerCheckbox.checked =
      selectedCount === pageItems.length && pageItems.length > 0;
    headerCheckbox.indeterminate =
      selectedCount > 0 && selectedCount < pageItems.length;
  }

  if (section.pageInfo) {
    if (sorted.length === 0) {
      section.pageInfo.textContent = "暂无数据";
    } else {
      section.pageInfo.textContent = `显示 ${startIndex + 1}-${endIndex} / ${
        sorted.length
      }`;
    }
  }
  if (section.pageSizes && section.pageSizes.length > 0) {
    section.pageSizes.forEach((btn) => {
      btn.classList.toggle(
        "active",
        Number(btn.dataset.size) === ui.pageSize
      );
    });
  }
  if (section.pagerButtons && section.pagerButtons.length > 0) {
    section.pagerButtons.forEach((btn) => {
      const dir = btn.dataset.dir;
      btn.disabled =
        (dir === "prev" && ui.page <= 1) ||
        (dir === "next" && ui.page >= totalPages);
    });
  }
}

function openSectionSettings(entityName) {
  const ui = getSectionUi(entityName);
  pendingSettingsSection = entityName;
  const entity = getEntityConfig(entityName);
  sectionSettingsTitleEl.textContent = `${entity?.label || entityName} 页面设置`;
  sectionSettingsPageSizeEl.value = String(ui.pageSize || 10);
  sectionSettingsSummaryEl.checked = false;
  sectionSettingsSummaryEl.disabled = true;
  if (supplierPrintProfilesWrapEl) {
    supplierPrintProfilesWrapEl.style.display =
      entityName === "supplier" ? "block" : "none";
  }
  if (supplierPrintProfilesJsonEl && entityName === "supplier") {
    syncSupplierPrintProfilesJsonTextarea();
  }
  if (entityName === "supplier") {
    const options = buildSupplierOptions();
    if (supplierPrintProfileSupplierSelectEl) {
      supplierPrintProfileSupplierSelectEl.innerHTML = options
        .map(
          (s) => `<option value="${escapeHtml(s.code)}">${escapeHtml(s.code)} - ${escapeHtml(s.name)}</option>`
        )
        .join("");
      const firstKey = options[0]?.code || "";
      supplierPrintProfileSupplierSelectEl.value = firstKey;
      renderSupplierPrintProfileEditor(firstKey);
    }
  }
  sectionSettingsModalEl.classList.remove("hidden");
}

function closeSectionSettings() {
  sectionSettingsModalEl.classList.add("hidden");
  pendingSettingsSection = null;
  if (supplierPrintProfilesWrapEl) {
    supplierPrintProfilesWrapEl.style.display = "none";
  }
  activeSupplierPrintProfileKey = "";
}

/* AutoCount 同步实体列表（排除本地 purchasePI） */
const syncableEntities = new Set(entities.map((e) => e.name));

function initSectionInteractions() {
  dataSections.forEach((section, entityName) => {
    const ui = getSectionUi(entityName);
    /* 动态注入工具栏按钮 */
    if (section.tools) {
      const toolsRight = section.tools.querySelector(".tools-right");
      if (toolsRight) {
        /* 所有 AutoCount 同步实体：注入刷新同步按钮 */
        if (syncableEntities.has(entityName)) {
          const syncBtn = document.createElement("button");
          syncBtn.className = "icon-btn";
          syncBtn.title = "刷新同步";
          syncBtn.textContent = "⟳";
          syncBtn.style.fontSize = "16px";
          syncBtn.addEventListener("click", async () => {
            syncBtn.disabled = true;
            syncBtn.textContent = "…";
            try {
              await syncEntity(entityName);
              appendLog(`${entityName} 同步刷新完成`);
            } catch (e) {
              appendLog(`${entityName} 同步失败: ${e.message}`);
            } finally {
              syncBtn.disabled = false;
              syncBtn.textContent = "⟳";
            }
          });
          toolsRight.insertBefore(syncBtn, toolsRight.firstChild);
        }
      }
      const toolsLeft = section.tools.querySelector(".tools-left");
      if (toolsLeft && selectableEntities.has(entityName)) {
        /* 通用：一键清除全部勾选 */
        const clearBtn = document.createElement("button");
        clearBtn.className = "btn ghost";
        clearBtn.textContent = "取消选择";
        clearBtn.style.color = "#607d8b";
        clearBtn.addEventListener("click", () => clearSelectionAndGoFirstPage(entityName));
        toolsLeft.insertBefore(clearBtn, toolsLeft.firstChild);
      }
      if (toolsLeft && entityName === "purchasePI") {
        /* PI 列表：注入删除选中按钮 */
        const delBtn = document.createElement("button");
        delBtn.className = "btn ghost";
        delBtn.setAttribute("data-action", "batch-delete-pi");
        delBtn.textContent = "删除选中";
        delBtn.style.color = "#e74c3c";
        toolsLeft.appendChild(delBtn);
        /* PI 列表：发送选中邮件按钮 */
        const mailSendBtn = document.createElement("button");
        mailSendBtn.className = "btn ghost";
        mailSendBtn.setAttribute("data-action", "send-mails");
        mailSendBtn.textContent = "📧 发送选中";
        toolsLeft.appendChild(mailSendBtn);
      }
    }
    if (section.searchInput) {
      section.searchInput.value = ui.search;
      section.searchInput.addEventListener("input", (event) => {
        ui.search = event.target.value.trim();
        ui.page = 1;
        renderSection(entityName, getEntityData(entityName));
      });
    }
    if (section.filterSelect) {
      section.filterSelect.addEventListener("change", (event) => {
        ui.filter = event.target.value;
        ui.page = 1;
        renderSection(entityName, getEntityData(entityName));
      });
    }
    if (section.pageSizes) {
      section.pageSizes.forEach((btn) => {
        btn.addEventListener("click", () => {
          const size = Number(btn.dataset.size);
          if (Number.isFinite(size)) {
            ui.pageSize = size;
            ui.page = 1;
            renderSection(entityName, getEntityData(entityName));
          }
        });
      });
    }
    if (section.pagerButtons) {
      section.pagerButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          const dir = btn.dataset.dir;
          if (dir === "prev" && ui.page > 1) {
            ui.page -= 1;
          }
          if (dir === "next") {
            ui.page += 1;
          }
          renderSection(entityName, getEntityData(entityName));
        });
      });
    }
    if (section.tools) {
      section.tools.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) {
          return;
        }
        const action = button.getAttribute("data-action");
        if (action === "import-products" && entityName === "product") {
          openProductImportModal();
          return;
        }
        /* 批量创建 PO（发票列表） */
        if (action === "batch-create-po" && entityName === "invoice") {
          batchCreatePO();
          return;
        }
        /* 批量创建 PI（PO列表） */
        if (action === "batch-create-pi" && entityName === "purchaseOrder") {
          batchCreatePI();
          return;
        }
        /* 批量创建发票（PI列表） */
        if (action === "batch-create-invoice" && entityName === "purchasePI") {
          batchCreatePurchaseInvoice();
          return;
        }
        /* 删除选中 PI */
        if (action === "batch-delete-pi" && entityName === "purchasePI") {
          batchDeletePI();
          return;
        }
        /* 发送选中 PI 邮件 */
        if (action === "send-mails" && entityName === "purchasePI") {
          const sel = getSelectedItems("purchasePI");
          if (sel.length === 0) { appendLog("请先勾选要发送邮件的 PI"); return; }
          sendPiMail(sel.map((s) => s.item));
          return;
        }
        if (action === "batch") {
          appendLog(`${entityName}: 批量操作`);
        } else if (action === "print") {
          appendLog(`${entityName}: 打印列表`);
        } else if (button.classList.contains("icon-btn")) {
          if (button.title === "Settings") {
            openSectionSettings(entityName);
            return;
          }
          appendLog(`${entityName}: ${button.title || "操作"}`);
        }
      });
    }
    if (section.summary) {
      section.summary.addEventListener("click", (event) => {
        const action = event.target?.getAttribute?.("data-action");
        if (action === "summary-reset") {
          ui.search = "";
          ui.filter = "all";
          ui.page = 1;
          if (section.searchInput) {
            section.searchInput.value = "";
          }
          if (section.filterSelect) {
            section.filterSelect.value = "all";
          }
          renderSection(entityName, getEntityData(entityName));
        }
      });
    }
  });
}

async function fetchListing(entity) {
  const collected = [];
  let page = 1;
  const queryBase = { ...(entity.query || {}) };

  while (page <= MAX_PAGES) {
    const query = entity.pageInBody
      ? queryBase
      : { ...buildDateQuery(entity), ...queryBase, page };
    let body;
    if (entity.pageInBody && entity.bodyBuilder === "dateFilter") {
      const range = buildDateRange(entity);
      body = {
        page,
        filter: {
          date: {
            from: range.from,
            to: range.to
          }
        }
      };
    } else if (entity.pageInBody) {
      body = { page };
    } else {
      body = undefined;
    }
    const response = await callWithMode({
      method: entity.method,
      path: entity.path,
      query,
      body
    });

    if (!response || !Array.isArray(response.data)) {
      break;
    }
    const data = response.data || [];
    collected.push(...data);
    if (data.length === 0) {
      break;
    }
    const totalCount = response.totalCount;
    if (Number.isFinite(totalCount) && collected.length >= totalCount) {
      break;
    }
    page += 1;
  }

  return collected;
}

/* ── 批量创建（全自动：按时间顺序逐条创建，无需弹窗确认） ── */

/* 不再使用的弹窗回调 */
function batchOnModalClose() { /* noop */ }

function getSelectedItems(entityName) {
  const ui = getSectionUi(entityName);
  const items = getEntityData(entityName);
  const result = [];
  items.forEach((item, index) => {
    const record = extractRecord(item);
    const key = getRecordKey(entityName, record, index);
    if (ui.selected.has(key)) {
      result.push({ item, record, index });
    }
  });
  return result;
}

/* 按 docDate 升序（时间从旧到新），同日按 docNo 排序确保稳定 */
/* UI 复位：清空勾选并回到第一页（进入列表 / 批量操作完成 / 同步完成后调用） */
function clearSelectionAndGoFirstPage(entityName) {
  const ui = getSectionUi(entityName);
  ui.selected.clear();
  ui.page = 1;
  renderSection(entityName, getEntityData(entityName));
}

function sortByDateAsc(list) {
  return [...list].sort((a, b) => {
    const da = String(getFieldValue(a.record, "docDate") || "");
    const db = String(getFieldValue(b.record, "docDate") || "");
    const cmp = da.localeCompare(db);
    if (cmp !== 0) return cmp;
    const na = String(getFieldValue(a.record, "docNo") || "");
    const nb = String(getFieldValue(b.record, "docNo") || "");
    return na.localeCompare(nb);
  });
}

/* ─── 批量创建 PO 暂存数据 ─── */
let pendingBatchPoList = [];

/* ─── 批量创建 PO（发票 → PO，弹窗选择供应商后按时间顺序逐个创建） ─── */
async function batchCreatePO() {
  const selected = getSelectedItems("invoice");
  if (selected.length === 0) {
    appendLog("请先勾选要创建PO的发票");
    return;
  }
  /* 过滤已创建（使用未过滤的原始 PO 列表） */
  const rawPoList = state.data.purchaseOrder || [];
  const existingRefs = new Set();
  rawPoList.forEach((po) => {
    const r = extractRecord(po);
    const ref = getFieldValue(r, "ref") || getFieldValue(r, "sourceDocNo") || getFieldValue(r, "refDocNo") || "";
    if (ref) existingRefs.add(String(ref));
  });
  const toCreate = sortByDateAsc(
    selected.filter((s) => {
      const docNo = getFieldValue(s.record, "docNo") || "";
      return !existingRefs.has(String(docNo));
    })
  );
  if (toCreate.length === 0) {
    appendLog("所选发票均已创建PO，无需重复创建");
    return;
  }
  /* 准备供应商和 location */
  const supplierOptions = buildSupplierOptions();
  if (supplierOptions.length === 0) {
    appendLog("供应商列表为空，请先同步供应商数据");
    return;
  }
  const locations = await loadLocationOptions();
  if (locations.length === 0) {
    appendLog("Location 列表为空，无法创建PO");
    return;
  }

  /* 弹出选择供应商弹窗 */
  pendingBatchPoList = toCreate;
  batchPoSupplierEl.innerHTML = supplierOptions
    .map((s) => `<option value="${s.code}">${s.code} - ${s.name}</option>`)
    .join("");
  const first = supplierOptions[0];
  batchPoSupplierNameEl.value = first?.name || "";
  batchPoSupplierAddressEl.value = first?.address || "";
  batchPoCreditTermEl.value = first?.creditTerm || "Net 30 days";
  batchPoLocationEl.innerHTML = locations
    .map((l) => `<option value="${l.code}">${l.code}</option>`)
    .join("");
  batchPoInfoEl.textContent = `共 ${toCreate.length} 张发票待创建PO，将按日期从旧到新顺序创建`;
  batchPoModalEl.classList.remove("hidden");

  /* 供应商切换时自动填充 */
  batchPoSupplierEl.onchange = () => {
    const s = supplierOptions.find((x) => x.code === batchPoSupplierEl.value);
    if (s) {
      batchPoSupplierNameEl.value = s.name || "";
      batchPoSupplierAddressEl.value = s.address || "";
      batchPoCreditTermEl.value = s.creditTerm || "Net 30 days";
    }
  };
}

/* 批量PO弹窗确认 → 执行创建 */
async function executeBatchCreatePO() {
  const supplierOptions = buildSupplierOptions();
  const selectedSupplier = supplierOptions.find((s) => s.code === batchPoSupplierEl.value);
  if (!selectedSupplier) {
    appendLog("请选择供应商");
    return;
  }
  const location = batchPoLocationEl.value;
  if (!location) {
    appendLog("请选择 Location");
    return;
  }
  const creditTerm = batchPoCreditTermEl.value || "Net 30 days";
  batchPoModalEl.classList.add("hidden");

  /* 批量模式：先确定供应商日期硬下限（本地+远端），避免绕过保护 */
  const localFloor = getLatestDocDateForSupplier("purchaseOrder", selectedSupplier.code);
  const remoteFloor = await fetchLatestPoDateForSupplierFromApi(selectedSupplier.code);
  let supplierDateFloor = (() => {
    const arr = [localFloor, remoteFloor].filter(
      (d) => d instanceof Date && !Number.isNaN(d.getTime())
    );
    if (arr.length === 0) return null;
    return arr.reduce((a, b) => (a.getTime() >= b.getTime() ? a : b));
  })();

  /* 预计算所有 PO 日期，然后按 PO 日期排序，确保推送顺序不跳号 */
  const toCreateWithDate = pendingBatchPoList.map((entry) => {
    const ivDateRaw = getFieldValue(entry.record, "docDate") || "";
    const poDate = calcPoDateFromIvDate(
      ivDateRaw,
      selectedSupplier.code,
      supplierDateFloor
    );
    if (!supplierDateFloor || poDate.getTime() > supplierDateFloor.getTime()) {
      supplierDateFloor = poDate;
    }
    const docDate = toInputDate(poDate) || new Date().toISOString().slice(0, 10);
    return { ...entry, _poDate: docDate, _ivDate: String(ivDateRaw).slice(0, 10) };
  });
  /* 按 PO 日期从旧到新排序 */
  toCreateWithDate.sort((a, b) => a._poDate.localeCompare(b._poDate));

  appendLog(`批量创建PO: 共 ${toCreateWithDate.length} 项，供应商 ${selectedSupplier.code}，按PO日期顺序推送...`);
  let success = 0;
  let fail = 0;
  for (let i = 0; i < toCreateWithDate.length; i++) {
    const entry = toCreateWithDate[i];
    const ivDocNo = getFieldValue(entry.record, "docNo") || "";
    const docDate = entry._poDate;
    appendLog(`[${i + 1}/${toCreateWithDate.length}] 正在创建PO: ${ivDocNo} (IV:${entry._ivDate} → PO:${docDate})`);
    try {
      const meta = {
        creditorCode: selectedSupplier.code,
        creditorName: selectedSupplier.name,
        creditTerm,
        purchaseLocation: location,
        docDate,
        address: selectedSupplier.address || null,
        taxEntity: selectedSupplier.taxEntity || null,
        email: selectedSupplier.email || null,
        attention: selectedSupplier.attention || null,
        phone1: selectedSupplier.phone1 || null,
        fax1: selectedSupplier.fax1 || null
      };
      const payload = buildPurchaseOrderInput(entry.item, entry.record, meta);
      /* 推送到 AutoCount */
      await callWithMode({
        method: "POST",
        path: "/{accountBookId}/purchaseorder",
        body: payload
      });
      /* 等待短暂延时确保 AutoCount 处理完毕，避免查询时还未生成 */
      await new Promise((r) => setTimeout(r, 500));
      /* 查询回传单号 — 通过 creditorCode + date + ref 匹配最新一条 */
      const listing = await callWithMode({
        method: "POST",
        path: "/{accountBookId}/purchaseorder/listing",
        body: {
          page: 1,
          filter: {
            date: { from: `${docDate}T00:00:00`, to: `${docDate}T23:59:59` },
            creditorCode: { value: selectedSupplier.code }
          }
        }
      });
      /* 从返回列表中找到 ref 匹配当前发票号的最新 PO */
      let latest = null;
      if (Array.isArray(listing?.data)) {
        latest = listing.data.find((po) => {
          const r = extractRecord(po);
          return String(getFieldValue(r, "ref") || "") === String(ivDocNo);
        });
        if (!latest && listing.data.length > 0) {
          latest = listing.data[0];
        }
      }
      if (latest) {
        state.data.purchaseOrder = state.data.purchaseOrder || [];
        state.data.purchaseOrder.unshift(latest);
        appendLog(`  ✓ PO 创建成功: ${extractRecord(latest).docNo || getFieldValue(latest, "docNo") || "(自动编号)"}`);
        success++;
      } else {
        appendLog(`  ✓ PO 已推送，但未获取回传单号`);
        success++;
      }
    } catch (error) {
      appendLog(`  ✗ PO 创建失败 (${ivDocNo}): ${error.message}`);
      fail++;
    }
  }
  pendingBatchPoList = [];
  /* 刷新列表 + 持久化 */
  renderSection("purchaseOrder", getEntityData("purchaseOrder"));
  renderSection("invoice", getEntityData("invoice"));
  try {
    await apiPost("/api/data/sync", { entity: "purchaseOrder", items: state.data.purchaseOrder });
  } catch (e) { /* 静默 */ }
  appendLog(`批量创建PO完成: 成功 ${success}，失败 ${fail}，共 ${toCreateWithDate.length}`);
  clearSelectionAndGoFirstPage("invoice");
}

/* ─── 批量创建 PI（PO → 本地PI，全自动匹配IV并生成连续PI号） ─── */
async function batchCreatePI() {
  const selected = getSelectedItems("purchaseOrder");
  if (selected.length === 0) {
    appendLog("请先勾选要创建PI的采购订单");
    return;
  }
  /* 过滤已创建 */
  const piList = state.data.purchasePI || [];
  const existingRefs = new Set();
  piList.forEach((pi) => {
    const r = extractRecord(pi);
    const ref = getFieldValue(r, "referencePoNo") || pi.referencePoNo || (pi.master && pi.master.referencePoNo) || "";
    if (ref) existingRefs.add(String(ref));
  });
  const toCreate = sortByDateAsc(
    selected.filter((s) => {
      const docNo = getFieldValue(s.record, "docNo") || "";
      return !existingRefs.has(String(docNo));
    })
  );
  if (toCreate.length === 0) {
    appendLog("所选PO均已创建PI，无需重复创建");
    return;
  }

  /* 准备供应商和客户列表 */
  const suppliers = buildSupplierOptions().map((s) => ({
    ...s, creditorCode: s.code, creditorName: s.name
  }));
  const customers = (state.data.customer || []).map((item) => {
    const record = extractRecord(item);
    return { accNo: getFieldValue(record, "accNo") || "", companyName: getFieldValue(record, "companyName") || "", record };
  });
  const invoiceList = state.data.invoice || [];

  appendLog(`批量创建PI: 共 ${toCreate.length} 项，按时间顺序生成...`);
  let success = 0;
  let fail = 0;

  for (let i = 0; i < toCreate.length; i++) {
    const entry = toCreate[i];
    const poDocNo = getFieldValue(entry.record, "docNo") || "";
    appendLog(`[${i + 1}/${toCreate.length}] 正在创建PI: ${poDocNo}`);
    try {
      /* 获取PO详情用于匹配IV */
      const poDetail = poDocNo ? await fetchPurchaseOrderDetail(poDocNo) : null;
      const poDetails = poDetail?.details || poDetail?.detail || [];
      const poQty = sumDetailQty(poDetails);
      const poLineCount = poDetails.length;
      const poDescSig = buildDescriptionSignature(poDetails);

      /* 匹配 IV */
      let matchedIvNo = "";
      let matchedIvCustomerName = "";
      let matchedIvTotal = "";
      let matchedCustomer = null;

      const refInvoiceNo = getFieldValue(entry.record, "ref") || getFieldValue(entry.record, "sourceDocNo") || getFieldValue(entry.record, "refDocNo") || "";
      if (refInvoiceNo) {
        const matchedInvoice = invoiceList.find((inv) => {
          const r = extractRecord(inv);
          return String(getFieldValue(r, "docNo") || getFieldValue(inv, "docNo")) === String(refInvoiceNo);
        });
        if (matchedInvoice) {
          const r = extractRecord(matchedInvoice);
          matchedIvNo = getFieldValue(r, "docNo") || "";
          matchedIvCustomerName = getFieldValue(r, "debtorName") || getFieldValue(r, "companyName") || "";
          matchedIvTotal = getFieldValue(r, "total") ?? getFieldValue(r, "netTotal") ?? "";
          const debtorCode = getFieldValue(r, "debtorCode") || getFieldValue(r, "debtorAccNo") || "";
          matchedCustomer = customers.find((c) => c.accNo === debtorCode);
          if (!matchedIvCustomerName && matchedCustomer) matchedIvCustomerName = matchedCustomer.companyName || "";
        }
      }
      if (!matchedCustomer && poQty > 0) {
        let candidates = invoiceList.map((inv) => {
          const r = extractRecord(inv);
          const invDetails = r.details || r.detail || inv.details || [];
          const invQty = Number(getFieldValue(r, "totalQty")) || Number(getFieldValue(r, "totalQuantity")) || sumDetailQty(invDetails);
          return { inv, r, invQty, lineCount: invDetails.length, descSig: buildDescriptionSignature(invDetails) };
        }).filter((c) => c.invQty && c.invQty === poQty);
        if (poLineCount > 0) candidates = candidates.filter((c) => c.lineCount === poLineCount || c.lineCount === 0);
        const pickCandidate = (c) => {
          matchedIvNo = getFieldValue(c.r, "docNo") || "";
          matchedIvCustomerName = getFieldValue(c.r, "debtorName") || getFieldValue(c.r, "companyName") || "";
          matchedIvTotal = getFieldValue(c.r, "total") ?? getFieldValue(c.r, "netTotal") ?? "";
          const debtorCode = getFieldValue(c.r, "debtorCode") || getFieldValue(c.r, "debtorAccNo") || "";
          matchedCustomer = customers.find((cu) => cu.accNo === debtorCode);
        };
        if (candidates.length === 1) { pickCandidate(candidates[0]); }
        else if (candidates.length > 1) {
          const exact = poDescSig ? candidates.filter((c) => c.descSig === poDescSig) : [];
          if (exact.length === 1) { pickCandidate(exact[0]); }
          else {
            const scored = (exact.length > 1 ? exact : candidates).map((c) => ({
              ...c, dateValue: new Date(getFieldValue(c.r, "docDate") || "").getTime() || 0
            }));
            scored.sort((a, b) => b.dateValue - a.dateValue);
            pickCandidate(scored[0]);
          }
        }
      }

      /* 构建PI参数（连续编号：每条创建前重新计算序列号） */
      const rawPoDate = getFieldValue(entry.record, "docDate") || new Date().toISOString();
      const basePoDate = new Date(rawPoDate);
      const piYear = Number.isNaN(basePoDate.getTime()) ? new Date().getFullYear() : basePoDate.getFullYear();
      const minPiDate = Number.isNaN(basePoDate.getTime())
        ? adjustToNextWorkday(addDays(new Date(), 7))
        : adjustToNextWorkday(addDays(basePoDate, 7));
      const validity = randomValidityDate(minPiDate);

      const supplierMatch = suppliers.find((s) => s.code === getFieldValue(entry.record, "creditorCode"));
      const supplier = supplierMatch || suppliers[0];
      const consignee = matchedCustomer || null;

      const piNumber = buildPiNumberForSupplier({
        supplierCode: supplier?.code || "",
        year: piYear
      });

      const piMeta = {
        piNumber,
        referencePoNo: poDocNo,
        referenceIvNo: matchedIvNo,
        ivCustomerName: matchedIvCustomerName,
        ivTotal: matchedIvTotal,
        validityDate: `${toInputDate(validity)}T00:00:00`
      };

      const pi = await createPurchaseInvoiceFromPo(entry.item, supplier, consignee?.record, piMeta);
      if (pi) {
        pi.referenceIvNo = matchedIvNo;
        state.data.purchasePI = state.data.purchasePI || [];
        state.data.purchasePI.unshift(pi);
        try { await apiPost("/api/pi", pi); } catch (e) { /* 静默 */ }
        appendLog(`  ✓ PI 创建成功: ${pi.docNo}${matchedIvNo ? " 关联IV: " + matchedIvNo : ""}`);
        success++;
      }
    } catch (error) {
      appendLog(`  ✗ PI 创建失败 (${poDocNo}): ${error.message}`);
      fail++;
    }
  }
  renderSection("purchasePI", getEntityData("purchasePI"));
  renderSection("purchaseOrder", getEntityData("purchaseOrder"));
  appendLog(`批量创建PI完成: 成功 ${success}，失败 ${fail}，共 ${toCreate.length}`);
  clearSelectionAndGoFirstPage("purchaseOrder");
}

/* ─── 批量创建采购发票（PI → AutoCount采购发票，全自动推送） ─── */
async function batchCreatePurchaseInvoice() {
  const selected = getSelectedItems("purchasePI");
  if (selected.length === 0) {
    appendLog("请先勾选要创建采购发票的PI");
    return;
  }
  /* 过滤已创建 */
  const purchInvList = state.data.purchaseInvoice || [];
  const existingRefs = new Set();
  purchInvList.forEach((inv) => {
    const r = extractRecord(inv);
    const sn = getFieldValue(r, "supplierInvoiceNo") || "";
    if (sn) existingRefs.add(String(sn));
  });
  const toCreate = sortByDateAsc(
    selected.filter((s) => {
      const docNo = getFieldValue(s.record, "docNo") || s.item.docNo || "";
      return !existingRefs.has(String(docNo));
    })
  );
  if (toCreate.length === 0) {
    appendLog("所选PI均已创建采购发票，无需重复创建");
    return;
  }

  const suppliers = buildSupplierOptions();
  const locations = await loadLocationOptions();
  if (locations.length === 0) {
    appendLog("Location 列表为空，无法创建采购发票");
    return;
  }
  const invoiceList = state.data.invoice || [];

  /* 从已同步的采购发票中获取一个有效的默认accNo */
  let fallbackAccNo = "";
  for (const inv of purchInvList) {
    const invDetails = inv.details || inv.detail || [];
    for (const line of invDetails) {
      const acc = getFieldValue(line, "accNo") || "";
      if (acc && String(acc).includes("-")) { fallbackAccNo = acc; break; }
    }
    if (fallbackAccNo) break;
  }

  appendLog(`批量创建采购发票: 共 ${toCreate.length} 项，按时间顺序推送...`);
  let success = 0;
  let fail = 0;

  for (let i = 0; i < toCreate.length; i++) {
    const entry = toCreate[i];
    const piItem = entry.item;
    const piRecord = entry.record;
    const piDocNo = getFieldValue(piRecord, "docNo") || piItem.docNo || "";
    appendLog(`[${i + 1}/${toCreate.length}] 正在推送采购发票: ${piDocNo}`);
    try {
      /* 确定供应商 */
      const piCreditorCode = getFieldValue(piRecord, "creditorCode") || piItem.creditorCode || "";
      const supplier = suppliers.find((s) => s.code === piCreditorCode) || suppliers[0];
      if (!supplier) throw new Error("无可用供应商");

      /* 确定 Location */
      const piLocation = getFieldValue(piRecord, "purchaseLocation") || (piItem.master && piItem.master.purchaseLocation) || "";
      const location = piLocation || (locations[0] && locations[0].code) || "";
      if (!location) throw new Error("无可用 Location");

      /* 确定日期：优先使用关联IV日期 */
      let docDate = "";
      const refIvNo = getFieldValue(piRecord, "referenceIvNo") || piItem.referenceIvNo || "";
      if (refIvNo) {
        const matchedIv = invoiceList.find((inv) => {
          const r = extractRecord(inv);
          return String(getFieldValue(r, "docNo") || getFieldValue(inv, "docNo")) === String(refIvNo);
        });
        if (matchedIv) {
          docDate = String(getFieldValue(extractRecord(matchedIv), "docDate") || "").replace(/T.*/, "").slice(0, 10);
        }
      }
      if (!docDate) {
        docDate = String(getFieldValue(piRecord, "docDate") || piItem.docDate || "").replace(/T.*/, "").slice(0, 10);
      }
      if (!docDate) docDate = new Date().toISOString().slice(0, 10);

      /* 获取PO的accNo映射 */
      const refPoNo = piItem.referencePoNo || getFieldValue(piRecord, "referencePoNo") || "";
      let poAccNoMap = {};
      if (refPoNo) {
        try {
          const poDetail = await fetchPurchaseOrderDetail(refPoNo);
          const poLines = poDetail?.details || poDetail?.detail || [];
          poLines.forEach((line) => {
            const pc = getFieldValue(line, "productCode") || "";
            const acc = getFieldValue(line, "accNo") || "";
            if (pc && acc) poAccNoMap[pc] = acc;
          });
        } catch (e) { /* 继续 */ }
      }

      /* 构建 payload */
      const piDetails = piItem.details || (piItem.master && piItem.master.details) || [];
      if (piDetails.length === 0) throw new Error("PI 无商品明细");

      const master = {
        docNo: null,
        docDate: `${docDate}T00:00:00`,
        taxDate: `${docDate}T00:00:00`,
        creditorCode: supplier.code,
        creditorName: supplier.name,
        address: supplier.address || null,
        taxEntity: supplier.taxEntity || null,
        email: supplier.email || null,
        attention: supplier.attention || null,
        phone1: supplier.phone1 || null,
        fax1: supplier.fax1 || null,
        creditTerm: supplier.creditTerm || "Net 30 days",
        purchaseLocation: location,
        currencyRate: Number(getFieldValue(piRecord, "currencyRate")) || (piItem.master && Number(piItem.master.currencyRate)) || 1,
        inclusiveTax: false,
        ref: null,
        supplierInvoiceNo: piDocNo,
        remark1: null
      };
      const invoiceDetails = piDetails.map((d) => {
        const productCode = getFieldValue(d, "productCode") || "";
        const variant = [d.productVariant1Option, d.productVariant2Option].filter(Boolean).join(" / ");
        const poAccNo = productCode ? (poAccNoMap[productCode] || "") : "";
        const rawAccNo = getFieldValue(d, "accNo") || "";
        const isValidGl = rawAccNo && String(rawAccNo).includes("-");
        const accNo = poAccNo || (isValidGl ? rawAccNo : "") || fallbackAccNo || supplier.code;
        return {
          accNo, productCode, productVariant: variant || null,
          description: getFieldValue(d, "description") || "",
          furtherDescription: getFieldValue(d, "furtherDescription") || null,
          qty: Number(getFieldValue(d, "qty")) || 0,
          unit: getFieldValue(d, "unit") || null,
          unitPrice: Number(getFieldValue(d, "unitPrice")) || 0,
          discount: getFieldValue(d, "discount") || null,
          taxCode: getFieldValue(d, "taxCode") || null,
          deptNo: getFieldValue(d, "deptNo") || null,
          unitType: getFieldValue(d, "unitType") || getFieldValue(d, "unit") || null,
          taxAdjustment: 0, localTaxAdjustment: 0,
          ourPONo: refPoNo || null,
          ourPODate: piItem.docDate || getFieldValue(piRecord, "docDate") || null
        };
      });

      await callWithMode({ method: "POST", path: "/{accountBookId}/purchaseinvoice", body: { master, details: invoiceDetails, saveApprove: false } });

      /* 等待 AutoCount 处理完毕，避免跳号 */
      await new Promise((r) => setTimeout(r, 500));

      /* 查询回传单号 */
      const listing = await callWithMode({
        method: "POST", path: "/{accountBookId}/purchaseinvoice/listing",
        body: { page: 1, filter: { date: { from: `${docDate}T00:00:00`, to: `${docDate}T23:59:59` }, creditorCode: { value: supplier.code } } }
      });
      /* 找到 supplierInvoiceNo 匹配当前 PI 单号的最新记录 */
      let latest = null;
      if (Array.isArray(listing?.data)) {
        latest = listing.data.find((inv) => {
          const r = extractRecord(inv);
          return String(getFieldValue(r, "supplierInvoiceNo") || "") === String(piDocNo);
        });
        if (!latest && listing.data.length > 0) latest = listing.data[0];
      }
      if (latest) {
        state.data.purchaseInvoice = state.data.purchaseInvoice || [];
        state.data.purchaseInvoice.unshift(latest);
        appendLog(`  ✓ 采购发票创建成功: ${getFieldValue(extractRecord(latest), "docNo") || "(自动编号)"}`);
      } else {
        appendLog(`  ✓ 采购发票已推送，但未获取回传单号`);
      }
      success++;
    } catch (error) {
      appendLog(`  ✗ 采购发票创建失败 (${piDocNo}): ${error.message}`);
      fail++;
    }
  }
  renderSection("purchaseInvoice", getEntityData("purchaseInvoice"));
  renderSection("purchasePI", getEntityData("purchasePI"));
  try {
    await apiPost("/api/data/sync", { entity: "purchaseInvoice", items: state.data.purchaseInvoice });
  } catch (e) { /* 静默 */ }
  appendLog(`批量创建采购发票完成: 成功 ${success}，失败 ${fail}，共 ${toCreate.length}`);
  clearSelectionAndGoFirstPage("purchasePI");
}

/* ─── 批量删除本地 PI ─── */
async function batchDeletePI() {
  const selected = getSelectedItems("purchasePI");
  if (selected.length === 0) {
    appendLog("请先勾选要删除的PI");
    return;
  }
  const docNos = selected.map((s) => {
    const r = s.record;
    return (getFieldValue(r, "docNo") || s.item.docNo || s.item.master?.docNo || "").trim();
  }).filter(Boolean);
  if (docNos.length === 0) {
    appendLog("未找到可删除的PI单号");
    return;
  }
  if (!confirm(`确定要删除选中的 ${docNos.length} 条PI吗？此操作不可恢复。`)) return;
  let success = 0;
  let fail = 0;
  for (const docNo of docNos) {
    try {
      await apiDelete(`/api/pi/${encodeURIComponent(docNo)}`);
      success++;
    } catch (e) {
      appendLog(`删除 ${docNo} 失败: ${e.message}`);
      fail++;
    }
  }
  /* 从 state 中移除 */
  const deletedSet = new Set(docNos);
  state.data.purchasePI = (state.data.purchasePI || []).filter((p) => {
    const d = (p.master?.docNo || p.docNo || "").trim();
    return !deletedSet.has(d);
  });
  /* 清除已选 */
  const piUi = getSectionUi("purchasePI");
  piUi.selected.clear();
  renderSection("purchasePI", state.data.purchasePI);
  appendLog(`批量删除PI完成: 成功 ${success}，失败 ${fail}`);
}

async function syncEntity(entityName) {
  const entity = getEntityConfig(entityName);
  if (!entity) {
    throw new Error(`未知实体: ${entityName}`);
  }
  appendLog(`开始同步: ${entity.label}`);
  const data = await fetchListing(entity);
  state.data[entity.name] = data;
  renderSection(entity.name, data);
  const lastSync = data.length > 0 ? new Date().toISOString() : null;
  if (data.length > 0) {
    state.syncState[entity.name] = { lastSync };
  } else {
    const prev = state.syncState[entity.name];
    if (prev && prev.lastSync) {
      delete prev.lastSync;
      state.syncState[entity.name] = prev;
    }
  }
  persistSyncState();
  /* 持久化同步数据到后端数据库 */
  try {
    await apiPost("/api/data/sync", {
      entity: entity.name,
      items: data,
      lastSync
    });
  } catch (e) {
    appendLog(`数据持久化失败(${entity.name}): ${e.message}`);
  }
  appendLog(`同步完成: ${entity.label} (${data.length} 条)`);

  /* 同步后，刷新依赖该实体的列表的已创建标识/派生视图 */
  const affectedMap = {
    purchaseInvoice: ["purchasePI"],
    purchaseOrder: ["invoice"],
  };
  const affected = affectedMap[entity.name] || [];
  for (const affName of affected) {
    const affData = getEntityData(affName);
    if (affData && affData.length) {
      renderSection(affName, affData);
    }
  }
  /* 同步完成：回到第一页并清除勾选 */
  clearSelectionAndGoFirstPage(entity.name);
}

async function syncAll() {
  appendLog("开始全部同步...");
  for (const entity of entities) {
    await syncEntity(entity.name);
  }
  appendLog("全部同步完成。");
}

drawerCloseEl.addEventListener("click", closeDrawer);
drawerEl.addEventListener("click", (event) => {
  if (event.target === drawerEl) {
    closeDrawer();
  }
});

poModalCloseEl.addEventListener("click", closePoModal);
poCancelEl.addEventListener("click", closePoModal);
poModalEl.addEventListener("click", (event) => {
  if (event.target === poModalEl) {
    closePoModal();
  }
});
poSupplierEl.addEventListener("change", updatePoSupplierMeta);
cpiCloseEl.addEventListener("click", closeCpiModal);
cpiCancelEl.addEventListener("click", closeCpiModal);
cpiModalEl.addEventListener("click", (event) => {
  if (event.target === cpiModalEl) {
    closeCpiModal();
  }
});
cpiSupplierEl.addEventListener("change", updateCpiSupplierMeta);
cpiSubmitEl.addEventListener("click", submitCreatePurchaseInvoice);
productImportCloseEl.addEventListener("click", closeProductImportModal);
productImportModalEl.addEventListener("click", (event) => {
  if (event.target === productImportModalEl) {
    closeProductImportModal();
  }
});
productImportFileEl.addEventListener("change", async () => {
  const file = productImportFileEl.files?.[0];
  if (!file) {
    return;
  }
  productImportImageFile = null;
  if (file.type.startsWith("image/")) {
    try {
      productImportPreviewEl.textContent = "图片识别中...";
      productImportImageFile = file;
      const text = await runOcr(file);
      productImportTextEl.value = text;
      await parseImportText();
    } catch (error) {
      appendLog(error.message || "图片识别失败");
    }
    return;
  }
  try {
    const text = await readFileAsText(file);
    productImportTextEl.value = text;
    await parseImportText();
  } catch (error) {
    appendLog(error.message || "读取文件失败");
  }
});
productImportParseEl.addEventListener("click", async () => {
  if (productImportImageFile) {
    try {
      productImportPreviewEl.textContent = "图片识别中...";
      const text = await runOcr(productImportImageFile);
      productImportTextEl.value = text;
    } catch (error) {
      appendLog(error.message || "图片识别失败");
      return;
    }
  }
  await parseImportText();
});
productImportSubmitEl.addEventListener("click", async () => {
  const items = await parseImportText();
  if (!items || items.length === 0) {
    appendLog("没有可导入的产品");
    return;
  }
  try {
    appendLog(`开始创建产品 (${items.length} 条)...`);
    await createProducts(items);
    appendLog("产品创建完成");
    closeProductImportModal();
  } catch (error) {
    appendLog(error.message || "产品创建失败");
  }
});

/* ── 关联 IV 弹窗事件 ── */
linkIvCloseEl.addEventListener("click", closeLinkIvModal);
linkIvCancelEl.addEventListener("click", closeLinkIvModal);
linkIvModalEl.addEventListener("click", (event) => {
  if (event.target === linkIvModalEl) {
    closeLinkIvModal();
  }
});
linkIvClearEl.addEventListener("click", () => clearLinkIv());
linkIvSearchEl.addEventListener("input", () => {
  renderLinkIvList(linkIvSearchEl.value);
});

piModalCloseEl.addEventListener("click", closePiModal);
piCancelEl.addEventListener("click", closePiModal);
piModalEl.addEventListener("click", (event) => {
  if (event.target === piModalEl) {
    closePiModal();
  }
});
piSubmitEl.addEventListener("click", async () => {
  if (!pendingPiPoItem) {
    return;
  }
  try {
    const suppliers = buildSupplierOptions().map((supplier) => ({
      ...supplier,
      creditorCode: supplier.code,
      creditorName: supplier.name
    }));
    const supplier = suppliers.find(
      (item) => item.code === piSupplierEl.value
    );
    if (!supplier) {
      appendLog("请选择采购商");
      return;
    }
    const customers = (state.data.customer || []).map((item) => {
      const record = extractRecord(item);
      return {
        accNo: getFieldValue(record, "accNo") || "",
        record
      };
    });
    const consignee = customers.find((item) => item.accNo === piConsigneeEl.value);
    const poRecord = extractRecord(pendingPiPoItem);
    const matchedIvNo = piModalEl.dataset.matchedInvoiceNo || "";
    const matchedIvCustomerName = piModalEl.dataset.matchedInvoiceCustomerName || "";
    const matchedIvTotal = piModalEl.dataset.matchedInvoiceTotal || "";
    const piMeta = {
      piNumber: normalizePiNumberFlexible(
        piNumberEl.value,
        supplier.code,
        piNumberEl.dataset.piYear || new Date().getFullYear(),
        piNumberEl.dataset.defaultPi || null
      ),
      referencePoNo: getFieldValue(poRecord, "docNo") || null,
      referenceIvNo: matchedIvNo,
      ivCustomerName: matchedIvCustomerName,
      ivTotal: matchedIvTotal,
      validityDate: piValidityDateEl.value
        ? `${piValidityDateEl.value}T00:00:00`
        : null
    };
    const pi = await createPurchaseInvoiceFromPo(
      pendingPiPoItem,
      supplier,
      consignee?.record,
      piMeta
    );
    if (pi) {
      pi.referenceIvNo = matchedIvNo;
      state.data.purchasePI = state.data.purchasePI || [];
      state.data.purchasePI.unshift(pi);
      renderSection("purchasePI", state.data.purchasePI);
      /* 持久化 PI 到后端数据库 */
      try {
        await apiPost("/api/pi", pi);
      } catch (e) {
        appendLog("PI 持久化失败: " + e.message);
      }
      appendLog(`采购PI创建成功(本地): ${pi.docNo || "(未生成单号)"}${matchedIvNo ? " 关联IV: " + matchedIvNo : ""}`);
    }
    closePiModal();
  } catch (error) {
    appendLog(error.message || "采购PI创建失败");
  }
});

sectionSettingsCloseEl.addEventListener("click", closeSectionSettings);
sectionSettingsCancelEl.addEventListener("click", closeSectionSettings);
sectionSettingsModalEl.addEventListener("click", (event) => {
  if (event.target === sectionSettingsModalEl) {
    closeSectionSettings();
  }
});
sectionSettingsSaveEl.addEventListener("click", () => {
  if (!pendingSettingsSection) {
    return;
  }
  /* 供应商：保存打印模板档案配置 */
  if (pendingSettingsSection === "supplier" && supplierPrintProfilesJsonEl) {
    const raw = supplierPrintProfilesJsonEl.value || "{}";
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("必须是 JSON 对象（key 为供应商 accNo）");
      }
      state.config = state.config || {};
      state.config.supplierPrintProfiles = parsed;
      persistConfig();
      appendLog("供应商打印模板配置已保存（将用于新建/打印 PI）");
    } catch (e) {
      appendLog("供应商打印模板 JSON 无效: " + (e.message || String(e)));
      return;
    }
  }
  const ui = getSectionUi(pendingSettingsSection);
  const pageSize = Number(sectionSettingsPageSizeEl.value);
  if (Number.isFinite(pageSize) && pageSize > 0) {
    ui.pageSize = pageSize;
    ui.page = 1;
  }
  ui.showSummary = false;
  renderSection(pendingSettingsSection, state.data[pendingSettingsSection] || []);
  closeSectionSettings();
});

/* ── 供应商打印模板：可视化编辑事件 ── */
if (supplierPrintProfileSupplierSelectEl) {
  supplierPrintProfileSupplierSelectEl.addEventListener("change", (event) => {
    const key = String(event.target.value || "");
    renderSupplierPrintProfileEditor(key);
  });
}

if (supplierPrintProfileStampFileEl) {
  supplierPrintProfileStampFileEl.addEventListener("change", async () => {
    const file = supplierPrintProfileStampFileEl.files?.[0];
    if (!file) return;
    if (!activeSupplierPrintProfileKey) {
      appendLog("请先选择供应商");
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const profile = getOrCreateSupplierPrintProfile(activeSupplierPrintProfileKey);
      profile.stampDataUrl = dataUrl;
      delete profile.stampPath;
      persistConfig();
      renderSupplierPrintProfileEditor(activeSupplierPrintProfileKey);
      appendLog(`已更新公章: ${activeSupplierPrintProfileKey}`);
    } catch (e) {
      appendLog(e.message || "公章上传失败");
    } finally {
      supplierPrintProfileStampFileEl.value = "";
    }
  });
}

if (supplierPrintProfileStampClearEl) {
  supplierPrintProfileStampClearEl.addEventListener("click", () => {
    if (!activeSupplierPrintProfileKey) {
      appendLog("请先选择供应商");
      return;
    }
    const profile = getOrCreateSupplierPrintProfile(activeSupplierPrintProfileKey);
    delete profile.stampDataUrl;
    delete profile.stampPath;
    persistConfig();
    renderSupplierPrintProfileEditor(activeSupplierPrintProfileKey);
    appendLog(`已清除公章: ${activeSupplierPrintProfileKey}`);
  });
}

if (supplierPrintProfileBankAddEl) {
  supplierPrintProfileBankAddEl.addEventListener("click", () => {
    if (!activeSupplierPrintProfileKey) {
      appendLog("请先选择供应商");
      return;
    }
    const profile = getOrCreateSupplierPrintProfile(activeSupplierPrintProfileKey);
    profile.banks = profile.banks || [];
    profile.banks.push({
      label: `Bank Account ${profile.banks.length + 1}`,
      accountNumber: "",
      accountName: "",
      bankName: "",
      country: "Malaysia"
    });
    persistConfig();
    renderSupplierPrintProfileEditor(activeSupplierPrintProfileKey);
  });
}

if (supplierPrintProfilePiNumberPatternEl) {
  supplierPrintProfilePiNumberPatternEl.addEventListener("change", (event) => {
    if (!activeSupplierPrintProfileKey) {
      appendLog("请先选择供应商");
      return;
    }
    const val = String(event.target.value || "SEG3");
    const profile = getOrCreateSupplierPrintProfile(activeSupplierPrintProfileKey);
    profile.piNumberPatternId = val;
    persistConfig();
    renderSupplierPrintProfileEditor(activeSupplierPrintProfileKey);
    appendLog(`已更新 PI 单号格式: ${activeSupplierPrintProfileKey}`);
  });
}

if (supplierPrintProfilePackingFromEl) {
  supplierPrintProfilePackingFromEl.addEventListener("input", () => {
    if (!activeSupplierPrintProfileKey) return;
    const profile = getOrCreateSupplierPrintProfile(activeSupplierPrintProfileKey);
    profile.packingListFrom = supplierPrintProfilePackingFromEl.value;
    persistConfig();
    syncSupplierPrintProfilesJsonTextarea();
  });
}

if (supplierPrintProfilePiSeg1El) {
  supplierPrintProfilePiSeg1El.addEventListener("input", () => {
    if (!activeSupplierPrintProfileKey) return;
    const profile = getOrCreateSupplierPrintProfile(activeSupplierPrintProfileKey);
    profile.piNumberSegment1 = supplierPrintProfilePiSeg1El.value;
    persistConfig();
    if (supplierPrintProfilePiNumberPreviewEl) {
      supplierPrintProfilePiNumberPreviewEl.textContent = buildPiNumberForSupplier({
        supplierCode: activeSupplierPrintProfileKey,
        year: new Date().getFullYear()
      });
    }
    syncSupplierPrintProfilesJsonTextarea();
  });
}

if (supplierPrintProfilePiSeg2El) {
  supplierPrintProfilePiSeg2El.addEventListener("input", () => {
    if (!activeSupplierPrintProfileKey) return;
    const profile = getOrCreateSupplierPrintProfile(activeSupplierPrintProfileKey);
    profile.piNumberSegment2 = supplierPrintProfilePiSeg2El.value;
    persistConfig();
    if (supplierPrintProfilePiNumberPreviewEl) {
      supplierPrintProfilePiNumberPreviewEl.textContent = buildPiNumberForSupplier({
        supplierCode: activeSupplierPrintProfileKey,
        year: new Date().getFullYear()
      });
    }
    syncSupplierPrintProfilesJsonTextarea();
  });
}

if (supplierPrintProfileBanksListEl) {
  supplierPrintProfileBanksListEl.addEventListener("click", (event) => {
    const btn = event.target.closest("button");
    if (!btn) return;
    if (btn.getAttribute("data-action") !== "remove-bank") return;
    if (!activeSupplierPrintProfileKey) return;
    const idx = Number(btn.getAttribute("data-index"));
    const profile = getOrCreateSupplierPrintProfile(activeSupplierPrintProfileKey);
    if (!Array.isArray(profile.banks)) profile.banks = [];
    if (!Number.isFinite(idx) || idx < 0 || idx >= profile.banks.length) return;
    profile.banks.splice(idx, 1);
    persistConfig();
    renderSupplierPrintProfileEditor(activeSupplierPrintProfileKey);
  });

  supplierPrintProfileBanksListEl.addEventListener("input", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const idx = Number(input.getAttribute("data-index"));
    const field = input.getAttribute("data-field") || "";
    if (!activeSupplierPrintProfileKey) return;
    const profile = getOrCreateSupplierPrintProfile(activeSupplierPrintProfileKey);
    if (!Array.isArray(profile.banks)) profile.banks = [];
    if (!Number.isFinite(idx) || idx < 0 || idx >= profile.banks.length) return;
    if (!field) return;
    profile.banks[idx][field] = input.value;
    persistConfig();
    syncSupplierPrintProfilesJsonTextarea();
  });
}
poSubmitEl.addEventListener("click", async () => {
  if (!pendingPoContext) {
    return;
  }
  let created = false;
  try {
    const po = await createPurchaseOrderFromInvoice(
      pendingPoContext.invoiceItem,
      pendingPoContext.record
    );
    if (po) {
      state.data.purchaseOrder = state.data.purchaseOrder || [];
      state.data.purchaseOrder.unshift(po);
      renderSection("purchaseOrder", getEntityData("purchaseOrder"));
      renderSection("invoice", getEntityData("invoice"));
      appendLog(`采购PO创建成功: ${po.docNo || "(未返回单号)"}`);
      created = true;
      /* 持久化更新后的 PO 列表 */
      try {
        await apiPost("/api/data/sync", {
          entity: "purchaseOrder",
          items: state.data.purchaseOrder
        });
      } catch (e) { /* 静默 */ }
    }
  } catch (error) {
    appendLog(error.message || "采购PO创建失败");
  } finally {
    if (created) {
    closePoModal();
    }
  }
});

/* 批量创建PO弹窗事件 */
batchPoModalCloseEl.addEventListener("click", () => { batchPoModalEl.classList.add("hidden"); pendingBatchPoList = []; });
batchPoCancelEl.addEventListener("click", () => { batchPoModalEl.classList.add("hidden"); pendingBatchPoList = []; });
batchPoSubmitEl.addEventListener("click", () => { executeBatchCreatePO(); });

document.querySelectorAll(".menu-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.getAttribute("data-overlay-target");
    if (target) {
      showSection(target);
    }
  });
});

initSectionInteractions();

/* 启动: 优先从后端数据库加载，失败则回退 localStorage */
(async function bootstrap() {
  /* 优化：先渲染界面(列表壳+加载提示)，后端数据到达后再填充，避免等待期白屏 */
  showSection("supplier");
  appendLog("正在从数据库加载数据...");
  const loaded = await loadAllFromBackend();
  if (!loaded) {
    loadConfig();
    loadSyncState();
  }
  /* 远程环境强制使用代理模式（避免 CORS 问题） */
  if (isRemote && state.config.connectMode !== "proxy") {
    state.config.connectMode = "proxy";
  }
  applyConfigToForm();
  /* 渲染已加载的各实体数据（自动过滤 Void 状态） */
  for (const entity of entities) {
    const items = getEntityData(entity.name);
    if (items && items.length) {
      renderSection(entity.name, items);
    }
  }
  /* 渲染本地 PI */
  const piItems = getEntityData("purchasePI");
  if (piItems && piItems.length) {
    renderSection("purchasePI", piItems);
  }
  appendLog("前端已就绪。" + (loaded ? " 数据已从数据库恢复。" : ""));

  /* 每 5 分钟自动同步所有 AutoCount 数据 */
  setInterval(async () => {
    try {
      appendLog("自动同步: 开始...");
      await syncAll();
      /* 同步完成后重新渲染本地 PI（已创建标识可能变化） */
      const piData = getEntityData("purchasePI");
      if (piData && piData.length) {
        renderSection("purchasePI", piData);
      }
      appendLog("自动同步: 完成");
    } catch (e) {
      appendLog(`自动同步失败: ${e.message}`);
    }
  }, 5 * 60 * 1000);
})();


/* ════════════════════════════════════════════════════════════
 * 邮件发送 PI（配置化）：设置面板 + 单张/批量发送
 * ════════════════════════════════════════════════════════════ */
const MAIL_PRESETS = {
  hotmail: { host: "smtp-mail.outlook.com", port: 587, secure: false },
  gmail: { host: "smtp.gmail.com", port: 465, secure: true },
  yeahnet: { host: "smtp.yeah.net", port: 465, secure: true },
  qq: { host: "smtp.qq.com", port: 465, secure: true },
  mail163: { host: "smtp.163.com", port: 465, secure: true }
};

async function mailApi(pathname, opts) {
  const opt = opts || {};
  const resp = await fetch(pathname, {
    method: opt.method || "GET",
    headers: opt.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: opt.body !== undefined ? JSON.stringify(opt.body) : undefined
  });
  let json = {};
  try { json = await resp.json(); } catch (e) { /* ignore */ }
  if (!resp.ok || json.ok === false) {
    throw new Error(json.error || ("HTTP " + resp.status));
  }
  return json;
}

function $(id) { return document.getElementById(id); }

async function populateMailSettings() {
  try {
    const r = await mailApi("/api/mail/config");
    const c = r.config || {};
    const s = c.smtp || {};
    const set = (id, v) => { const el = $(id); if (el) el.value = v === undefined || v === null ? "" : String(v); };
    set("mailPreset", s.preset || "");
    set("mailHost", s.host || "");
    set("mailPort", s.port || "465");
    set("mailUser", s.user || "");
    set("mailFromName", s.fromName || "");
    set("mailTo", c.to || "");
    set("mailCc", c.cc || "");
    set("mailBcc", c.bcc || "");
    set("mailReplyMode", c.replyMode || "pi");
    set("mailReplyToFixed", c.replyToFixed || "");
    set("mailBodyTemplate", c.bodyTemplate || "");
    const sec = $("mailSecure"); if (sec) sec.checked = !!(s.secure || Number(s.port) === 465);
    const pass = $("mailPass"); if (pass) pass.value = "";
  } catch (e) {
    appendLog("读取邮件设置失败: " + e.message);
  }
}

function openMailSettingsModal() {
  try {
    console.log("[mail] openMailSettingsModal invoked");
    const m = $("mailSettingsModal");
    if (!m) {
      alert("未找到设置面板元素 mailSettingsModal——页面可能仍是旧缓存，请按 Ctrl+Shift+R 强制刷新后再点。");
      return;
    }
    m.classList.remove("hidden");
    console.log("[mail] modal opened, hidden class removed");
    populateMailSettings();
  } catch (e) {
    console.error("[mail] open error:", e);
    alert("打开邮件设置出错: " + e.message);
  }
}
function closeMailSettingsModal() {
  const m = $("mailSettingsModal");
  if (m) m.classList.add("hidden");
}

function collectMailSettingsForm() {
  const v = (id) => { const el = $(id); return el ? el.value.trim() : ""; };
  return {
    smtp: {
      preset: v("mailPreset"),
      host: v("mailHost"),
      port: Number(v("mailPort")) || 587,
      secure: !!(($("mailSecure") || {}).checked),
      user: v("mailUser"),
      pass: v("mailPass"),
      fromName: v("mailFromName") || "AutoCount PI"
    },
    to: v("mailTo"),
    cc: v("mailCc"),
    bcc: v("mailBcc"),
    replyMode: v("mailReplyMode") || "pi",
    replyToFixed: v("mailReplyToFixed"),
    bodyTemplate: v("mailBodyTemplate")
  };
}

async function saveMailSettings() {
  try {
    await mailApi("/api/mail/config", { method: "POST", body: { config: collectMailSettingsForm() } });
    appendLog("邮件设置已保存。");
  } catch (e) {
    appendLog("保存邮件设置失败: " + e.message);
  }
}

async function testMailSettings() {
  try {
    const config = collectMailSettingsForm();
    if (!config.smtp.host || !config.smtp.user || !config.smtp.pass) {
      appendLog("测试前请填写 SMTP 服务器 / 账号 / 授权码");
      return;
    }
    appendLog("正在发送测试邮件...");
    const r = await mailApi("/api/mail/test", { method: "POST", body: { config } });
    appendLog("测试邮件已发送: " + (r.info && r.info.messageId ? r.info.messageId : "成功"));
  } catch (e) {
    appendLog("测试邮件发送失败: " + e.message);
  }
}

/* 发送 PI 邮件：list 为 PI 原始项（state.data.purchasePI 元素） */
async function sendPiMail(list) {
  const items = Array.isArray(list) ? list : [];
  if (items.length === 0) return;
  if (!confirm(`确认发送 ${items.length} 封 PI 邮件？
收件人取系统设置中的默认地址，每封按各自供应商抬头发送。`)) return;
  appendLog("正在发送 PI 邮件...");
  try {
    const r = await mailApi("/api/mail/send-pi", { method: "POST", body: { pis: items } });
    const rs = r.results || [];
    rs.forEach((it) => appendLog((it.ok ? "📧 已发送 PI " : "📧 发送失败 PI ") + (it.docNo || "?") + (it.ok ? "" : ": " + it.error)));
    appendLog("邮件发送完成: 成功 " + (r.sent || 0) + "，失败 " + (r.failed || 0));
    if (r.sent > 0) clearSelectionAndGoFirstPage("purchasePI");
  } catch (e) {
    appendLog("邮件发送失败: " + e.message);
  }
}

/* 预设联动（HTML onchange 调用） */
function applyMailPreset(presetKey) {
  const p = MAIL_PRESETS[presetKey];
  if (!p) return;
  const h = $("mailHost"); if (h) h.value = p.host;
  const pt = $("mailPort"); if (pt) pt.value = String(p.port);
  const sec = $("mailSecure"); if (sec) sec.checked = !!p.secure;
}
