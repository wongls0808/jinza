CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    account_number VARCHAR(50) NOT NULL,
    transaction_date DATE NOT NULL,
    cheque_ref_no VARCHAR(100),
    description TEXT,
    debit_amount DECIMAL(15, 2) DEFAULT 0,
    credit_amount DECIMAL(15, 2) DEFAULT 0,
    balance DECIMAL(15, 2),
    category VARCHAR(100),
    reference_1 VARCHAR(255),
    reference_2 VARCHAR(255),
    reference_3 VARCHAR(255),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_number, transaction_date, cheque_ref_no)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_transactions_account_number ON transactions(account_number);
CREATE INDEX idx_transactions_transaction_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_category ON transactions(category);