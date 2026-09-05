-- product_categories
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL
);

-- products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category_id UUID REFERENCES product_categories(id),
    brand TEXT,
    unit TEXT,
    cost_price NUMERIC NOT NULL DEFAULT 0,
    selling_price NUMERIC NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    minimum_stock INTEGER NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- services
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    selling_price NUMERIC NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- mechanics
CREATE TABLE mechanics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- cash_sessions
CREATE TABLE cash_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opening_balance NUMERIC NOT NULL DEFAULT 0,
    cash_sales NUMERIC NOT NULL DEFAULT 0,
    cash_expenses NUMERIC NOT NULL DEFAULT 0,
    expected_cash NUMERIC NOT NULL DEFAULT 0,
    actual_cash NUMERIC NOT NULL DEFAULT 0,
    difference NUMERIC NOT NULL DEFAULT 0,
    opened_by UUID REFERENCES profiles(id),
    closed_by UUID REFERENCES profiles(id),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'OPEN'
);

-- transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_number TEXT UNIQUE NOT NULL,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    discount NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL,
    paid_amount NUMERIC NOT NULL DEFAULT 0,
    change_amount NUMERIC NOT NULL DEFAULT 0,
    cash_session_id UUID REFERENCES cash_sessions(id),
    status TEXT DEFAULT 'COMPLETED',
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- transaction_items
CREATE TABLE transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL, -- PRODUCT, SERVICE, MANUAL
    product_id UUID REFERENCES products(id),
    service_id UUID REFERENCES services(id),
    item_name TEXT NOT NULL,
    sku TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC NOT NULL DEFAULT 0,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    stock_tracked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- incomes
CREATE TABLE incomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'Penjualan Sparepart', 'Jasa Service', 'Lainnya'
    amount NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- expenses
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_number TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    mechanic_id UUID REFERENCES mechanics(id),
    amount NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- restocks
CREATE TABLE restocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restock_number TEXT UNIQUE NOT NULL,
    supplier_name TEXT,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- restock_items
CREATE TABLE restock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restock_id UUID REFERENCES restocks(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    cost_price NUMERIC NOT NULL,
    subtotal NUMERIC NOT NULL
);

-- stock_movements
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    movement_type TEXT NOT NULL, -- IN, OUT, ADJUSTMENT, RETURN
    quantity INTEGER NOT NULL,
    stock_before INTEGER NOT NULL,
    stock_after INTEGER NOT NULL,
    reference_type TEXT, -- TRANSACTION, RESTOCK, ADJUSTMENT
    reference_id UUID,
    reason TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- audit_logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

