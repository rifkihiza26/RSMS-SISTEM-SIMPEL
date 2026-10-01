-- 1. Tambah kolom modal_price (Harga Modal) ke transaction_items
ALTER TABLE public.transaction_items
ADD COLUMN modal_price NUMERIC NOT NULL DEFAULT 0;

-- 2. Agar rekapan sebelumnya tidak rusak, jadikan modal_price sama dengan unit_price (opsional, boleh di skip kalau ingin dianggap modal 0 / full profit)
UPDATE public.transaction_items
SET modal_price = unit_price
WHERE item_type IN ('PRODUCT', 'MANUAL_BARANG', 'MANUAL');

-- 3. (Opsional) Buat tabel baru khusus untuk data tambahan penggajian / rekapan jika diperlukan ke depannya.
-- Namun untuk sekarang, kita menggunakan transaction_items.
