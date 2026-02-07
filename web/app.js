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
const baseUrlEl = document.getElementById("baseUrl");
const connectModeEl = document.getElementById("connectMode");
const proxyBaseUrlEl = document.getElementById("proxyBaseUrl");
const accountBookIdEl = document.getElementById("accountBookId");
const keyIdEl = document.getElementById("keyId");
const apiKeyEl = document.getElementById("apiKey");
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
  "purchaseReturn"
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
    ["price", "单价"],
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
  ["config", document.getElementById("section-config")],
  ["modules", document.getElementById("section-modules")],
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

/* ========== Malaysia E-Invoice 模块 ==========
 * Self-Billed Document: 独立数据，AutoCount 提交采购发票到 LHDNM 后生成的记录
 * Consolidated E-Invoice: 合并电子发票
 * Document Inquiry: 所有已提交电子发票的综合查询
 *
 * 注意：AutoCount Cloud API 不提供独立的 Self-Billed 端点，
 * e-invoice 字段存在于各文档的 master 中（invoice 有完整字段，purchaseInvoice 仅有 submitSGEInvoice）。
 * 本模块通过逐条获取文档详情来读取 e-invoice 状态。
 */
const einvoiceSourceMap = {
  einvoiceSelfBilled: "purchaseInvoice",
  einvoiceConsolidated: "invoice",
  einvoiceInquiry: null  /* Document Inquiry 综合所有来源 */
};
const einvoiceLabelMap = {
  einvoiceSelfBilled: "Self-Billed Document",
  einvoiceConsolidated: "Consolidated E-Invoice",
  einvoiceInquiry: "Document Inquiry"
};

/* e-invoice 详情缓存: { "docType:docNo": { ...fields, _fetched: true } } */
const einvoiceDetailCache = {};

function getEInvoiceData(entityName) {
  if (entityName === "einvoiceInquiry") {
    /* Document Inquiry: 综合所有来源的 e-invoice 记录 */
    return getDocumentInquiryData();
  }
  const sourceKey = einvoiceSourceMap[entityName];
  if (!sourceKey) return [];
  const sourceData = state.data[sourceKey] || [];

  return sourceData.map((item) => {
    const origMaster = item.master || item;
    const docNo = origMaster.docNo || "";
    const cacheKey = sourceKey + ":" + docNo;
    const cached = einvoiceDetailCache[cacheKey];

    /* 基础字段 */
    const extra = {};
    if (entityName === "einvoiceSelfBilled") {
      extra._docType = "Self-Billed Invoice";
      extra.totalExTax = origMaster.totalExTax ?? "";
      extra.tax = origMaster.tax ?? "";
      extra.currencyRate = origMaster.currencyRate ?? 1;
    }

    /* e-invoice 状态: 优先用缓存中实际获取到的字段 */
    if (cached && cached._fetched) {
      extra._eInvoiceStatus = cached.eInvoiceStatus || cached._derivedStatus || "-";
      extra.eInvoiceUuid = cached.eInvoiceUuid || "";
      extra.eInvoiceIssueDateTime = cached.eInvoiceIssueDateTime || "";
      extra.eInvoiceValidatedDateTime = cached.eInvoiceValidatedDateTime || "";
      extra.submitEInvoice = cached.submitEInvoice ? "Yes" : "No";
    } else {
      /* 未获取详情时从 listing 数据推导 */
      const listStatus = origMaster.eInvoiceStatus || "";
      if (listStatus) {
        extra._eInvoiceStatus = listStatus;
      } else {
        extra._eInvoiceStatus = cached === undefined ? "..." : "-";
      }
      extra.submitEInvoice = origMaster.submitEInvoice ? "Yes" : "No";
    }

    const newMaster = { ...origMaster, ...extra };
    return { ...item, ...extra, master: newMaster };
  });
}

/* Document Inquiry: 综合 invoice + creditNote + purchaseInvoice 的 e-invoice 记录 */
function getDocumentInquiryData() {
  const result = [];
  const sources = [
    { key: "invoice", typeLabel: "Invoice" },
    { key: "creditNote", typeLabel: "Credit Note" },
    { key: "purchaseInvoice", typeLabel: "Purchase Invoice" }
  ];
  for (const { key, typeLabel } of sources) {
    const list = state.data[key] || [];
    for (const item of list) {
      const origMaster = item.master || item;
      const docNo = origMaster.docNo || "";
      const cacheKey = key + ":" + docNo;
      const cached = einvoiceDetailCache[cacheKey];

      const extra = { _docType: typeLabel };
      if (cached && cached._fetched) {
        extra._eInvoiceStatus = cached.eInvoiceStatus || cached._derivedStatus || "-";
        extra.eInvoiceUuid = cached.eInvoiceUuid || "";
      } else {
        const listStatus = origMaster.eInvoiceStatus || "";
        extra._eInvoiceStatus = listStatus || (cached === undefined ? "..." : "-");
      }
      const newMaster = { ...origMaster, ...extra };
      result.push({ ...item, ...extra, master: newMaster });
    }
  }
  return result;
}

function getEntityData(entityName) {
  if (einvoiceSourceMap[entityName] !== undefined) return getEInvoiceData(entityName);
  return state.data[entityName] || [];
}

/* 异步获取文档详情以读取 e-invoice 字段 */
let einvoiceEnrichRunning = false;

async function enrichEInvoiceDetails(entityName) {
  if (einvoiceEnrichRunning) return;
  einvoiceEnrichRunning = true;

  let sourceConfigs = [];
  if (entityName === "einvoiceSelfBilled") {
    sourceConfigs = [{ key: "purchaseInvoice", apiPath: "/{accountBookId}/purchaseinvoice" }];
  } else if (entityName === "einvoiceConsolidated") {
    sourceConfigs = [{ key: "invoice", apiPath: "/{accountBookId}/invoice" }];
  } else if (entityName === "einvoiceInquiry") {
    sourceConfigs = [
      { key: "invoice", apiPath: "/{accountBookId}/invoice" },
      { key: "creditNote", apiPath: "/{accountBookId}/creditnote" },
      { key: "purchaseInvoice", apiPath: "/{accountBookId}/purchaseinvoice" }
    ];
  }

  let enriched = 0;
  for (const { key, apiPath } of sourceConfigs) {
    const list = state.data[key] || [];
    for (const item of list) {
      const docNo = (item.master || item).docNo;
      if (!docNo) continue;
      const cacheKey = key + ":" + docNo;
      if (einvoiceDetailCache[cacheKey]) continue;

      try {
        const detail = await callWithMode({
          method: "GET",
          path: apiPath,
          query: { docNo }
        });
        if (detail && detail.master) {
          const m = detail.master;
          /* 判断是否有 e-invoice 字段 */
          const hasEInvoice = "eInvoiceStatus" in m || "eInvoiceUuid" in m;
          let derivedStatus = "";
          if (!hasEInvoice) {
            /* 采购发票可能没有独立 eInvoiceStatus 字段，根据 status 推导 */
            const s = (m.status || "").toLowerCase();
            if (s.includes("approved")) derivedStatus = "Approved";
          }
          einvoiceDetailCache[cacheKey] = {
            eInvoiceStatus: m.eInvoiceStatus || "",
            eInvoiceUuid: m.eInvoiceUuid || "",
            eInvoiceIssueDateTime: m.eInvoiceIssueDateTime || "",
            eInvoiceValidatedDateTime: m.eInvoiceValidatedDateTime || "",
            eInvoiceValidationLink: m.eInvoiceValidationLink || "",
            submitEInvoice: !!m.submitEInvoice,
            _fetched: true,
            _hasEInvoice: hasEInvoice,
            _derivedStatus: derivedStatus
          };
          enriched++;
        }
      } catch (e) {
        einvoiceDetailCache[cacheKey] = { _fetched: true, _error: true, _derivedStatus: "" };
      }
      /* 每 5 条刷新列表 */
      if (enriched > 0 && enriched % 5 === 0) {
        renderSection(entityName, getEntityData(entityName));
      }
    }
  }
  /* 最终刷新 */
  renderSection(entityName, getEntityData(entityName));
  einvoiceEnrichRunning = false;
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
        entityLabelMap.get(key) || einvoiceLabelMap[key] || sectionDataTitleEl.textContent;
    }
    renderSection(key, getEntityData(key));
    setActiveMenu(key);
    /* E-Invoice 模块: 异步获取文档详情以丰富 e-invoice 状态 */
    if (einvoiceSourceMap[key] !== undefined) {
      enrichEInvoiceDetails(key);
    }
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
    ["productCategoryName", "Product Category"],
    ["classificationCode", "Classification Code"],
    ["status", "Status"]
  ],
  invoice: [
    ["docNo", "Doc No"],
    ["docDate", "Doc Date"],
    ["debtorName", "Customer"],
    ["currencyCode", "Currency"],
    ["total", "Total"],
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
    ["currencyCode", "Currency"]
  ],
  einvoiceSelfBilled: [
    ["_docType", "Doc. Type"],
    ["docNo", "Doc. No."],
    ["supplierInvoiceNo", "Supplier Invoice"],
    ["docDate", "Date"],
    ["creditorName", "Supplier Name"],
    ["currencyCode", "Curr. Code"],
    ["currencyRate", "Curr. Rate"],
    ["totalExTax", "Subtotal (ex)"],
    ["tax", "Tax"],
    ["total", "Total"],
    ["status", "Status"],
    ["_eInvoiceStatus", "e-Invoice Status"]
  ],
  einvoiceConsolidated: [
    ["docNo", "Doc No"],
    ["docDate", "Date"],
    ["debtorName", "Customer"],
    ["currencyCode", "Currency"],
    ["total", "Total"],
    ["status", "Status"],
    ["_eInvoiceStatus", "e-Invoice Status"]
  ],
  einvoiceInquiry: [
    ["_docType", "Doc Type"],
    ["docNo", "Doc No"],
    ["docDate", "Date"],
    ["currencyCode", "Currency"],
    ["total", "Total"],
    ["status", "Status"],
    ["_eInvoiceStatus", "e-Invoice Status"],
    ["eInvoiceUuid", "UUID"]
  ]
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
    // Code | Name | Type | Unit | Category | ClassCode | Status | 操作(2btn)
    noSel: "120px 2fr 100px 50px 1.2fr 110px 60px 120px"
  },
  invoice: {
    // ☑ | DocNo | DocDate | Customer | Currency | Total | Status | 操作(3btn)
    sel: "30px 110px 100px 2fr 60px 80px 90px 180px"
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
    // ☑ | DocNo | DocDate | Supplier | Currency | Total | Status | 操作(3btn)
    sel: "30px 110px 100px 2fr 60px 80px 70px 180px"
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
    // PINo | DocDate | Supplier | RefPONo | RefIVNo | IVCustomer | IVTotal | PITotal | Currency | 操作(4btn)
    noSel: "100px 85px 1.2fr 100px 100px 1fr 75px 75px 55px 240px"
  },
  einvoiceSelfBilled: {
    // DocType | DocNo | SupplierInv | Date | SupplierName | CurrCode | CurrRate | Subtotal | Tax | Total | Status | eInvStatus | 操作
    noSel: "100px 100px 110px 85px 1.5fr 65px 60px 80px 60px 80px 75px 90px 80px"
  },
  einvoiceConsolidated: {
    noSel: "110px 95px 1.5fr 70px 80px 80px 90px 80px"
  },
  einvoiceInquiry: {
    // DocType | DocNo | Date | Currency | Total | Status | eInvStatus | UUID | 操作
    noSel: "110px 100px 85px 65px 80px 80px 90px 1fr 80px"
  }
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

function applyConfigToForm() {
  baseUrlEl.value = state.config.baseUrl || "";
  connectModeEl.value = state.config.connectMode || "direct";
  proxyBaseUrlEl.value = state.config.proxyBaseUrl || "";
  accountBookIdEl.value = state.config.accountBookId || "";
  keyIdEl.value = state.config.keyId || "";
  apiKeyEl.value = state.config.apiKey || "";
}

async function persistConfig() {
  localStorage.setItem("autocount-config", JSON.stringify(state.config));
  /* 同时写入后端数据库 */
  try {
    await apiPost("/api/config", state.config);
  } catch (e) { /* 静默失败 */ }
}

function updateConfigFromForm() {
  state.config = {
    baseUrl: baseUrlEl.value.trim(),
    proxyBaseUrl: proxyBaseUrlEl.value.trim(),
    connectMode: connectModeEl.value,
    accountBookId: accountBookIdEl.value.trim(),
    keyId: keyIdEl.value.trim(),
    apiKey: apiKeyEl.value.trim()
  };
}

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
  /* 代理地址: 优先用配置值，否则自动使用当前页面 origin（Railway 部署时同源） */
  const proxyBase = state.config.proxyBaseUrl || window.location.origin;
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
    const value = getFieldValue(record, key);
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
      pageSize: 25,
      search: "",
      filter: "all",
      selected: new Set(),
      showSummary: false
    };
  }
  return state.ui[entityName];
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
  /* e-invoice 实体用 _eInvoiceStatus 字段 */
  if (einvoiceSourceMap[entityName] !== undefined) {
    const eStatus = getFieldValue(record, "_eInvoiceStatus") || "";
    if (eStatus && eStatus !== "...") return String(eStatus);
    return "Pending";
  }
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

const STAMP_RELATIVE_PATH = "stamp.png";
let cachedStampDataUrl = "";
let cachedStampProcessed = "";

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
      return {
        code,
        name,
        creditTerm,
        address,
        taxEntity,
        email,
        attention,
        phone1,
        fax1
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
  const defaultDate = String(getFieldValue(record, "docDate") || "")
    .replace("T00:00:00", "")
    .slice(0, 10);
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
      inclusiveTax: false
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
  const piPrefix = `PI-${String(piYear).padStart(4, "0")}-`;
  const defaultPiNumber = buildPiNumberFromYear(piYear);
  piNumberEl.value = defaultPiNumber;
  piNumberEl.dataset.defaultPi = defaultPiNumber;
  piNumberEl.dataset.piPrefix = piPrefix;
  piNumberEl.readOnly = false;
  piNumberEl.disabled = false;
  piNumberEl.dataset.piYear = String(piYear);
  if (!piNumberEl.dataset.piListener) {
    piNumberEl.addEventListener("focus", () => {
      const val = piNumberEl.value || piNumberEl.dataset.defaultPi || "";
      piNumberEl.value = val;
      piNumberEl.setSelectionRange(val.length, val.length);
    });
    piNumberEl.addEventListener("input", () => {
      const prefix = piNumberEl.dataset.piPrefix || "PI-";
      const raw = String(piNumberEl.value || "").toUpperCase();
      let suffix = raw.startsWith(prefix.toUpperCase())
        ? raw.slice(prefix.length)
        : raw.replace(/\D/g, "");
      suffix = suffix.replace(/\D/g, "").slice(0, 4);
      piNumberEl.value = `${prefix}${suffix}`;
    });
    piNumberEl.addEventListener("blur", () => {
      const year = piNumberEl.dataset.piYear || new Date().getFullYear();
      const fallback = piNumberEl.dataset.defaultPi || "";
      piNumberEl.value = normalizePiNumber(piNumberEl.value, year, fallback);
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
      renderSection("purchaseInvoice", state.data.purchaseInvoice);
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

function buildPiPrintHtml(pi, stampSrc, baseHref) {
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
  const ciNumber = String(piNumber).replace(/^PI/i, "IV");
  const piBaseDate = new Date(record.docDate || pi.docDate || new Date());
  const ciDate = randomWorkdayAfter(
    Number.isNaN(piBaseDate.getTime()) ? new Date() : piBaseDate,
    7,
    10
  );
  const plNumber = String(piNumber).replace(/^PI/i, "PL");
  const deliveryCity = resolveCustomerCity(record, shipTo);
  const origin = { country: "China", state: "Fujian" };
  const plDate = randomWorkdayAfter(ciDate, 7, 10);
  const validity = pi.validityDate
    ? formatDateShort(pi.validityDate)
    : "-";
  const referencePo = pi.referencePoNo || record.ref || "-";
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
          <div>Delivery arrangements shall be subject to the Buyer’s instructions,</div>
          <div>including delivery to locations designated by the Buyer.</div>
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
          <div class="ci-payment-block">
            <div class="ci-payment-label">Bank Account 1:</div>
            <div>Account Number : 88800021380472790</div>
            <div>Account Name : PUTIAN GUSHU TRADING CO.,LTD.</div>
            <div>Bank Name : OCBC BANK (MALAYSIA) BERHAD</div>
            <div>Country/Region : Malaysia</div>
          </div>
          <div class="ci-payment-block">
            <div class="ci-payment-label">Bank Account 2:</div>
            <div>Account Number : 00181100000015449</div>
            <div>Account Name : Alipay Malaysia</div>
            <div>Bank Name : HSBC BANK MALAYSIA BERHAD</div>
            <div>Country/Region : Malaysia</div>
          </div>
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
              <div class="pl-row"><span>From:</span><span>${origin.state}, ${origin.country}</span></div>
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
          <div>Bank Account 1:</div>
          <div>Account Number: 88800021380472790</div>
          <div>Account Name: PUTIAN GUSHU TRADING CO.,LTD.</div>
          <div>Bank Name: OCBC Bank (Malaysia) Berhad</div>
          <div>Bank Account 2:</div>
          <div>Account Number: 00181100000015449</div>
          <div>Account Name: Alipay Malaysia</div>
          <div>Bank Name: HSBC Bank Malaysia Berhad</div>
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
  const stampSrc = await getStampSrc();
  printWindow.document.open();
  printWindow.document.write(buildPiPrintHtml(pi, stampSrc, baseHref));
  printWindow.document.close();
  printWindow.focus();
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / ui.pageSize));
  ui.page = Math.min(ui.page, totalPages);
  const startIndex = (ui.page - 1) * ui.pageSize;
  const endIndex = Math.min(filtered.length, startIndex + ui.pageSize);
  const pageItems = filtered.slice(startIndex, endIndex);

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
  columns.forEach(([, label]) => {
    const cell = document.createElement("div");
    cell.className = "table-cell";
    cell.textContent = label;
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
    const numericColumns = new Set(["totalExTax", "tax", "total", "netTotal", "localTax", "localExTax", "localNetTotal", "taxableAmt", "localTaxableAmt", "roundAdj", "finalTotal", "currencyRate"]);
    columns.forEach(([key]) => {
      const cell = document.createElement("div");
      cell.className = "table-cell";
      let value = formatDisplayValue(getFieldValue(record, key));
      if (typeof value === "boolean") {
        cell.textContent = value ? "✓" : "-";
      } else if (numericColumns.has(key) && typeof value === "number") {
        cell.textContent = value.toFixed(2);
      } else {
        cell.textContent =
          value === undefined || value === null || value === "" ? "-" : value;
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
        ? `<button class="btn ghost" data-action="print-pi">打印PI</button><button class="btn ghost" data-action="create-purchase-invoice">创建发票</button>`
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
    if (filtered.length === 0) {
      section.pageInfo.textContent = "暂无数据";
    } else {
      section.pageInfo.textContent = `显示 ${startIndex + 1}-${endIndex} / ${
        filtered.length
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
  sectionSettingsPageSizeEl.value = String(ui.pageSize || 25);
  sectionSettingsSummaryEl.checked = false;
  sectionSettingsSummaryEl.disabled = true;
  sectionSettingsModalEl.classList.remove("hidden");
}

function closeSectionSettings() {
  sectionSettingsModalEl.classList.add("hidden");
  pendingSettingsSection = null;
}

function initSectionInteractions() {
  dataSections.forEach((section, entityName) => {
    const ui = getSectionUi(entityName);
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
}

async function syncAll() {
  appendLog("开始全部同步...");
  for (const entity of entities) {
    await syncEntity(entity.name);
  }
  appendLog("全部同步完成。");
}

document.getElementById("saveConfig").addEventListener("click", () => {
  updateConfigFromForm();
  persistConfig();
  appendLog("配置已保存。");
});

document.getElementById("testConnection").addEventListener("click", async () => {
  updateConfigFromForm();
  persistConfig();
  try {
    await testConnection();
  } catch (error) {
    appendLog(error.message || "连接失败");
    if (state.config.connectMode === "direct") {
      appendLog("若出现 Failed to fetch，请切换为本地代理模式。");
    }
  }
});

document.getElementById("syncAll").addEventListener("click", async () => {
  updateConfigFromForm();
  persistConfig();
  try {
    await syncAll();
  } catch (error) {
    appendLog(error.message || "同步失败");
  }
});

document.getElementById("clearLog").addEventListener("click", () => {
  logEl.textContent = "";
});

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
      piNumber: normalizePiNumber(
        piNumberEl.value,
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
      renderSection("purchaseOrder", state.data.purchaseOrder);
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

document.querySelectorAll("[data-entity]").forEach((button) => {
  button.addEventListener("click", async () => {
    updateConfigFromForm();
    persistConfig();
    const entity = button.getAttribute("data-entity");
    try {
      await syncEntity(entity);
    } catch (error) {
      appendLog(error.message || "同步失败");
      if (state.config.connectMode === "direct") {
        appendLog("若出现 Failed to fetch，请切换为本地代理模式。");
      }
    }
  });
});

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
  /* 渲染已加载的各实体数据 */
  for (const entity of entities) {
    const items = state.data[entity.name];
    if (items && items.length) {
      renderSection(entity.name, items);
    }
  }
  /* 渲染本地 PI */
  if (state.data.purchasePI && state.data.purchasePI.length) {
    renderSection("purchasePI", state.data.purchasePI);
  }
  appendLog("前端已就绪。" + (loaded ? " 数据已从数据库恢复。" : " 请先配置 AutoCount API 地址。"));
  showSection("modules");
})();
