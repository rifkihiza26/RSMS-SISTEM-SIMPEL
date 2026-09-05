-- RPC to process cashier transaction atomically
CREATE OR REPLACE FUNCTION process_transaction(
  p_transaction_number TEXT,
  p_subtotal NUMERIC,
  p_discount NUMERIC,
  p_total NUMERIC,
  p_payment_method TEXT,
  p_paid_amount NUMERIC,
  p_change_amount NUMERIC,
  p_cash_session_id UUID,
  p_notes TEXT,
  p_created_by UUID,
  p_items JSONB -- Array of items
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_transaction_id UUID;
  v_item JSONB;
  v_product_stock INTEGER;
BEGIN
  -- 1. Insert Transaction
  INSERT INTO transactions (
    transaction_number, subtotal, discount, total, 
    payment_method, paid_amount, change_amount, 
    cash_session_id, status, notes, created_by
  ) VALUES (
    p_transaction_number, p_subtotal, p_discount, p_total,
    p_payment_method, p_paid_amount, p_change_amount,
    p_cash_session_id, 'COMPLETED', p_notes, p_created_by
  ) RETURNING id INTO v_transaction_id;

  -- 2. Process Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Insert transaction item
    INSERT INTO transaction_items (
      transaction_id, item_type, product_id, service_id, 
      item_name, sku, quantity, unit_price, subtotal, stock_tracked
    ) VALUES (
      v_transaction_id,
      v_item->>'item_type',
      NULLIF(v_item->>'product_id', '')::UUID,
      NULLIF(v_item->>'service_id', '')::UUID,
      v_item->>'item_name',
      v_item->>'sku',
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price')::NUMERIC,
      (v_item->>'subtotal')::NUMERIC,
      (v_item->>'stock_tracked')::BOOLEAN
    );

    -- Stock Movement & Validation for PRODUCT
    IF v_item->>'item_type' = 'PRODUCT' THEN
      -- Get current stock and lock row
      SELECT stock INTO v_product_stock FROM products WHERE id = (v_item->>'product_id')::UUID FOR UPDATE;
      
      IF v_product_stock < (v_item->>'quantity')::INTEGER THEN
        RAISE EXCEPTION 'Stok tidak mencukupi untuk %', v_item->>'item_name';
      END IF;

      -- Update Stock
      UPDATE products 
      SET stock = stock - (v_item->>'quantity')::INTEGER 
      WHERE id = (v_item->>'product_id')::UUID;

      -- Record Stock Movement
      INSERT INTO stock_movements (
        product_id, movement_type, quantity, stock_before, stock_after, 
        reference_type, reference_id, reason, created_by
      ) VALUES (
        (v_item->>'product_id')::UUID,
        'OUT',
        (v_item->>'quantity')::INTEGER,
        v_product_stock,
        v_product_stock - (v_item->>'quantity')::INTEGER,
        'TRANSACTION',
        v_transaction_id,
        'Penjualan Kasir',
        p_created_by
      );
    END IF;
  END LOOP;

  -- 3. Record Income Automatically
  INSERT INTO incomes (
    transaction_id, category, amount, payment_method, description, date, created_by
  ) VALUES (
    v_transaction_id,
    'Penjualan Sparepart & Jasa',
    p_total,
    p_payment_method,
    'Pemasukan otomatis dari transaksi ' || p_transaction_number,
    CURRENT_DATE,
    p_created_by
  );

  RETURN v_transaction_id;
END;
$$;


-- RPC to process restock atomically
CREATE OR REPLACE FUNCTION process_restock(
  p_restock_number TEXT,
  p_supplier_name TEXT,
  p_total_amount NUMERIC,
  p_notes TEXT,
  p_created_by UUID,
  p_items JSONB -- Array of restock items
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_restock_id UUID;
  v_item JSONB;
  v_product_stock INTEGER;
BEGIN
  -- 1. Insert Restock
  INSERT INTO restocks (
    restock_number, supplier_name, total_amount, notes, created_by
  ) VALUES (
    p_restock_number, p_supplier_name, p_total_amount, p_notes, p_created_by
  ) RETURNING id INTO v_restock_id;

  -- 2. Process Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Insert Restock item
    INSERT INTO restock_items (
      restock_id, product_id, quantity, cost_price, subtotal
    ) VALUES (
      v_restock_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'cost_price')::NUMERIC,
      (v_item->>'subtotal')::NUMERIC
    );

    -- Get current stock and lock row
    SELECT stock INTO v_product_stock FROM products WHERE id = (v_item->>'product_id')::UUID FOR UPDATE;

    -- Update Stock & Cost Price (Average cost could be implemented, but sticking to simple update or leave cost price)
    -- As per instructions, "Sederhana". We just add stock.
    UPDATE products 
    SET stock = stock + (v_item->>'quantity')::INTEGER,
        cost_price = (v_item->>'cost_price')::NUMERIC -- update to latest cost price
    WHERE id = (v_item->>'product_id')::UUID;

    -- Record Stock Movement
    INSERT INTO stock_movements (
      product_id, movement_type, quantity, stock_before, stock_after, 
      reference_type, reference_id, reason, created_by
    ) VALUES (
      (v_item->>'product_id')::UUID,
      'IN',
      (v_item->>'quantity')::INTEGER,
      v_product_stock,
      v_product_stock + (v_item->>'quantity')::INTEGER,
      'RESTOCK',
      v_restock_id,
      'Restock dari ' || COALESCE(p_supplier_name, 'Supplier'),
      p_created_by
    );
  END LOOP;

  -- 3. Record Expense Automatically
  INSERT INTO expenses (
    expense_number, category, amount, payment_method, description, date, created_by
  ) VALUES (
    'EXP-' || p_restock_number, -- simple id
    'Belanja Sparepart',
    p_total_amount,
    'TRANSFER', -- Default to transfer or need param, let's assume CASH/TRANSFER, hardcode TRANSFER for simplicity or from param
    'Pengeluaran otomatis untuk restock ' || p_restock_number,
    CURRENT_DATE,
    p_created_by
  );

  RETURN v_restock_id;
END;
$$;
