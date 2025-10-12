CREATE TABLE account_management (
    id SERIAL PRIMARY KEY,
    account_number VARCHAR(50) NOT NULL,
    transaction_date DATE NOT NULL,
    cheque_ref_no VARCHAR(100),
    debit_amount DECIMAL(15, 2),
    credit_amount DECIMAL(15, 2),
    reference_1 VARCHAR(255),
    reference_2 VARCHAR(255),
    reference_3 VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Ensure unique entries based on account number and transaction date
CREATE UNIQUE INDEX idx_account_transaction ON account_management (account_number, transaction_date);