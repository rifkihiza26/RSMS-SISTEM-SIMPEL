-- ============================================================
-- UPDATE: Simpan modal_price dari kasir ke transaction_items
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Update fungsi pay_open_bill agar menyimpan modal_price dari payload items
-- (sync_open_bill_v2 hanya menyimpan sementara ke draft, pay_open_bill yang finalize)

CREATE OR REPLACE FUNCTION public.pay_open_bill(
  p_tx_id uuid,
  p_subtotal numeric,
  p_discount numeric,
  p_total numeric,
  p_payment_method text,
  p_paid_amount numeric,
  p_change_amount numeric,
  p_notes text,
  p_items jsonb
)
RETURNS void AS $$
DECLARE
  v_item jsonb;
  v_modal_price numeric := 0;
BEGIN
  -- Update transactions
  UPDATE transactions
  SET
    subtotal = p_subtotal,
    discount = p_discount,
    total = p_total,
    payment_method = p_payment_method,
    paid_amount = p_paid_amount,
    change_amount = p_change_amount,
    payment_status = CASE WHEN p_paid_amount >= p_total THEN 'LUNAS' ELSE 'DP' END,
    notes = p_notes,
    status = 'COMPLETED'
  WHERE id = p_tx_id;

  -- Hapus items lama
  DELETE FROM transaction_items WHERE transaction_id = p_tx_id;

  -- Insert items baru dengan modal_price
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Tentukan modal_price
    v_modal_price := COALESCE((v_item->>'modal_price')::numeric, 0);
    -- Jika masih 0 dan ada product_id, ambil dari tabel products
    IF v_modal_price = 0 AND (v_item->>'product_id') IS NOT NULL AND (v_item->>'product_id') != '' THEN
      SELECT cost_price INTO v_modal_price FROM products WHERE id = (v_item->>'product_id')::uuid;
      v_modal_price := COALESCE(v_modal_price, 0);
    END IF;

    INSERT INTO transaction_items (
      transaction_id, item_type, product_id, service_id,
      item_name, sku, quantity, unit_price, subtotal, modal_price,
      stock_tracked, is_service
    )
    VALUES (
      p_tx_id,
      v_item->>'item_type',
      NULLIF(v_item->>'product_id', '')::uuid,
      NULLIF(v_item->>'service_id', '')::uuid,
      v_item->>'item_name',
      v_item->>'sku',
      (v_item->>'quantity')::integer,
      (v_item->>'unit_price')::numeric,
      (v_item->>'subtotal')::numeric,
      v_modal_price,
      COALESCE((v_item->>'stock_tracked')::boolean, false),
      COALESCE((v_item->>'is_service')::boolean, false)
    );

    -- Update stok jika product
    IF COALESCE((v_item->>'stock_tracked')::boolean, false) = true
       AND (v_item->>'product_id') IS NOT NULL
       AND (v_item->>'product_id') != '' THEN
      UPDATE products
      SET stock = stock - (v_item->>'quantity')::integer
      WHERE id = (v_item->>'product_id')::uuid
        AND stock >= (v_item->>'quantity')::integer;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
