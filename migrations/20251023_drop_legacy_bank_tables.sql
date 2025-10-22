-- Drop legacy tables no longer referenced by application code
-- Date: 2025-10-23

DROP TABLE IF EXISTS bank_statements;
DROP TABLE IF EXISTS bank_transactions;
DROP TABLE IF EXISTS account_management;
