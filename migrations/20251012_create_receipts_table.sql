-- receipts 表 migration
CREATE TABLE IF NOT EXISTS receipts (
  id SERIAL PRIMARY KEY,
  account_number VARCHAR(64) NOT NULL,
  trn_date VARCHAR(32) NOT NULL,
  cheque_ref_no VARCHAR(64),
  debit_amount NUMERIC(18,2) DEFAULT 0,
  credit_amount NUMERIC(18,2) DEFAULT 0,
  reference1 VARCHAR(128),
  reference2 VARCHAR(128),
  reference3 VARCHAR(128),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (account_number, trn_date, cheque_ref_no, debit_amount, credit_amount)
);
