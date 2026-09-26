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

  -- Process items and calculate total service amount
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
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

    -- Calculate Service Total (SERVICE and MANUAL categorized as Jasa, but we assume all 'SERVICE' types and MANUAL where item_name indicates or just filter by item_type = 'SERVICE' and 'MANUAL' handled by UI)
    -- Wait, UI sends 'item_type' = 'MANUAL'. How do we know if it's Jasa or Barang?
    -- Currently UI doesn't send 'category' inside item. 
    -- Let's check how UI sends Manual items.
  END LOOP;
END;
$$ LANGUAGE plpgsql;
