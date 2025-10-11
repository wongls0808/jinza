-- 自动生成的唯一索引 migration，防止银行交易重复插入
CREATE UNIQUE INDEX IF NOT EXISTS uniq_bank_txn_all_fields
ON bank_transactions (
  statement_id,
  trn_date,
  cheque_ref,
  description,
  ref1,
  ref2,
  ref3,
  debit,
  credit
);
