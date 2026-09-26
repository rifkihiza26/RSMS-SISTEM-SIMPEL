CREATE OR REPLACE FUNCTION public.process_transaction(
  p_transaction_number text,
  p_subtotal numeric,
  p_discount numeric,
  p_total numeric,
  p_payment_method text,
  p_paid_amount numeric,
  p_change_amount numeric,
  p_cash_session_id uuid,
  p_notes text,
  p_created_by uuid,
  p_items jsonb
)
RETURNS uuid AS $$
DECLARE
  v_transaction_id uuid;
  v_item jsonb;
  v_stock numeric;
  v_shop_income numeric;
  v_service_total numeric := 0;
BEGIN
  -- Insert transaction
  INSERT INTO transactions (
    transaction_number, subtotal, discount, total, payment_method, 
    paid_amount, change_amount, cash_session_id, notes, created_by
  )
  VALUES (
    p_transaction_number, p_subtotal, p_discount, p_total, p_payment_method, 
    p_paid_amount, p_change_amount, p_cash_session_id, p_notes, p_created_by
  )
  RETURNING id INTO v_transaction_id;

  -- Process items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Hitung total uang jasa
    IF (v_item->>'is_service')::boolean = true THEN
      v_service_total := v_service_total + (v_item->>'subtotal')::numeric;
    END IF;

    -- Update stock jika produk (stock_tracked = true)
    IF (v_item->>'stock_tracked')::boolean = true AND v_item->>'product_id' IS NOT NULL THEN
      SELECT stock INTO v_stock FROM products WHERE id = (v_item->>'product_id')::uuid;
      
      IF v_stock < (v_item->>'quantity')::integer THEN
        RAISE EXCEPTION 'Stok tidak mencukupi untuk %', v_item->>'item_name';
      END IF;

      UPDATE products 
      SET stock = stock - (v_item->>'quantity')::integer
      WHERE id = (v_item->>'product_id')::uuid;
    END IF;

    -- Insert transaction item
    INSERT INTO transaction_items (
      transaction_id, item_type, product_id, service_id, item_name, 
      sku, quantity, unit_price, subtotal
    )
    VALUES (
      v_transaction_id,
      v_item->>'item_type',
      (v_item->>'product_id')::uuid,
      (v_item->>'service_id')::uuid,
      v_item->>'item_name',
      v_item->>'sku',
      (v_item->>'quantity')::integer,
      (v_item->>'unit_price')::numeric,
      (v_item->>'subtotal')::numeric
    );
  END LOOP;

  -- Calculate Income (Toko) = Total - Uang Jasa
  v_shop_income := GREATEST(0, p_total - v_service_total);

  -- Insert income record HANYA jika ada porsi uang untuk toko
  IF v_shop_income > 0 THEN
    INSERT INTO incomes (
      transaction_id, amount, source, created_by
    )
    VALUES (
      v_transaction_id, v_shop_income, 'TRANSACTION', p_created_by
    );
  END IF;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;
