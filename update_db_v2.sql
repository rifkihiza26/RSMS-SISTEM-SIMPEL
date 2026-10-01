-- 1. Tambahkan kolom ke tabel transactions
ALTER TABLE transactions
ADD COLUMN customer_name VARCHAR(255),
ADD COLUMN payment_status VARCHAR(50) DEFAULT 'LUNAS',
ADD COLUMN amount_paid NUMERIC DEFAULT 0;

-- 2. Update data transaksi yang lama agar dianggap Lunas otomatis (agar tidak error / berstatus hutang)
UPDATE transactions
SET amount_paid = total, payment_status = 'LUNAS'
WHERE amount_paid = 0 OR amount_paid IS NULL;
