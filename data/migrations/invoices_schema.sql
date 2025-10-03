-- 发票表
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL,
    account_set_id INTEGER NOT NULL,
    salesperson_id INTEGER,
    invoice_date DATE NOT NULL,
    due_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, issued, paid, cancelled, overdue
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid', -- unpaid, partial, paid
    payment_method VARCHAR(50),
    payment_date DATE,
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (account_set_id) REFERENCES account_sets(id),
    FOREIGN KEY (salesperson_id) REFERENCES salespeople(id)
);

-- 发票明细项表
CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    product_id INTEGER,
    description TEXT NOT NULL,
    quantity DECIMAL(12, 2) NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    unit VARCHAR(20),
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    discount_rate DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    subtotal DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 发票编号规则关联表
CREATE TABLE IF NOT EXISTS invoice_code_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_set_id INTEGER NOT NULL,
    code_rule_id INTEGER NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT 0,
    UNIQUE(account_set_id, code_rule_id),
    FOREIGN KEY (account_set_id) REFERENCES account_sets(id),
    FOREIGN KEY (code_rule_id) REFERENCES code_rules(id)
);

-- 发票模板关联表
CREATE TABLE IF NOT EXISTS invoice_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_set_id INTEGER NOT NULL,
    template_id INTEGER NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT 0,
    UNIQUE(account_set_id, template_id),
    FOREIGN KEY (account_set_id) REFERENCES account_sets(id),
    FOREIGN KEY (template_id) REFERENCES templates(id)
);

-- 发票付款记录表
CREATE TABLE IF NOT EXISTS invoice_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_reference VARCHAR(100),
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);