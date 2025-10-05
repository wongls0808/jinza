-- purchases_schema.sql
-- 采购记录表（由发票明细沉淀），按账套隔离
-- 字段：id, account_set_id, invoice_id, record_date, product_id, product_code, product_description, unit, quantity, unit_price, created_by, created_at

CREATE TABLE IF NOT EXISTS purchase_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_set_id INTEGER NOT NULL,
  invoice_id INTEGER NOT NULL,
  record_date DATE NOT NULL,
  product_id INTEGER,
  product_code TEXT,
  product_description TEXT NOT NULL,
  unit TEXT,
  quantity REAL NOT NULL DEFAULT 0,
  unit_price REAL NOT NULL DEFAULT 0,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(account_set_id) REFERENCES account_sets(id),
  FOREIGN KEY(invoice_id) REFERENCES invoices(id),
  FOREIGN KEY(product_id) REFERENCES products(id),
  FOREIGN KEY(created_by) REFERENCES users(id)
);

-- 加速查询：按账套 + 日期、商品
CREATE INDEX IF NOT EXISTS idx_purchase_records_account_set ON purchase_records(account_set_id);
CREATE INDEX IF NOT EXISTS idx_purchase_records_invoice ON purchase_records(invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchase_records_date ON purchase_records(record_date);
CREATE INDEX IF NOT EXISTS idx_purchase_records_product ON purchase_records(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_records_code ON purchase_records(product_code);
