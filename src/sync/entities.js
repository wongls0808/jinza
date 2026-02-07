const entities = [
  {
    name: "companyProfile",
    method: "GET",
    path: "/{accountBookId}/companyprofile",
    paginate: false
  },
  {
    name: "account",
    method: "POST",
    path: "/{accountBookId}/account/listing",
    paginate: true,
    body: {}
  },
  {
    name: "area",
    method: "GET",
    path: "/{accountBookId}/area/listing",
    paginate: true
  },
  {
    name: "creditNote",
    method: "GET",
    path: "/{accountBookId}/creditnote/listing",
    paginate: true,
    dateFilter: {
      startParam: "startDate",
      endParam: "endDate"
    }
  },
  {
    name: "supplier",
    method: "GET",
    path: "/{accountBookId}/creditor/listing",
    paginate: true
  },
  {
    name: "customer",
    method: "GET",
    path: "/{accountBookId}/debtor/listing",
    paginate: true
  },
  {
    name: "product",
    method: "POST",
    path: "/{accountBookId}/product/listing",
    paginate: true,
    pageInBody: true,
    body: {}
  },
  {
    name: "invoice",
    method: "GET",
    path: "/{accountBookId}/invoice/listing",
    paginate: true,
    dateFilter: {
      startParam: "startDate",
      endParam: "endDate"
    }
  },
  {
    name: "quotation",
    method: "GET",
    path: "/{accountBookId}/quotation/listing",
    paginate: true,
    dateFilter: {
      startParam: "startDate",
      endParam: "endDate"
    }
  },
  {
    name: "purchaseInvoice",
    method: "GET",
    path: "/{accountBookId}/purchaseinvoice/listing",
    paginate: true,
    dateFilter: {
      startParam: "startDate",
      endParam: "endDate"
    }
  },
  {
    name: "purchaseOrder",
    method: "GET",
    path: "/{accountBookId}/purchaseorder/listing",
    paginate: true,
    dateFilter: {
      startParam: "startDate",
      endParam: "endDate"
    }
  },
  {
    name: "purchaseReturn",
    method: "GET",
    path: "/{accountBookId}/purchasereturn/listing",
    paginate: true,
    dateFilter: {
      startParam: "startDate",
      endParam: "endDate"
    }
  }
];

function getEntity(name) {
  return entities.find((entity) => entity.name === name);
}

module.exports = { entities, getEntity };
