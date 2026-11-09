-- ─── 1. Sequence table ───────────────────────────────────────────────────────
-- One row per calendar year. last_seq is the LAST number that was issued,
-- so the next call returns last_seq + 1.

CREATE TABLE IF NOT EXISTS order_number_seq (
  year     TEXT PRIMARY KEY,
  last_seq INT  NOT NULL
);

-- Lock public access — service role (used by the API) bypasses RLS anyway.
ALTER TABLE order_number_seq ENABLE ROW LEVEL SECURITY;

-- ─── 2. Seed from existing orders ────────────────────────────────────────────
-- Reads the current maximum sequence number for each year so the counter
-- continues from where it already is. Safe to run on a live database.

INSERT INTO order_number_seq (year, last_seq)
SELECT
  substring(order_number FROM 'Amal(\d+)#') AS year,
  MAX(CAST(substring(order_number FROM '#(\d+)$') AS int)) AS last_seq
FROM orders
WHERE order_number ~ '^Amal\d+#\d+$'
GROUP BY 1
ON CONFLICT (year) DO UPDATE
  SET last_seq = EXCLUDED.last_seq;

-- ─── 3. Atomic order number generator ────────────────────────────────────────
-- Uses an upsert on order_number_seq so the increment and read happen in one
-- atomic operation. Two concurrent calls can never produce the same number.
--
-- p_year  — two-digit year string, e.g. '26'
-- p_seed  — starting sequence for a brand-new year (matches YEAR_SEEDS in app)

CREATE OR REPLACE FUNCTION next_order_number(p_year text, p_seed int)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next int;
BEGIN
  INSERT INTO order_number_seq (year, last_seq)
  VALUES (p_year, p_seed)
  ON CONFLICT (year) DO UPDATE
    SET last_seq = order_number_seq.last_seq + 1
  RETURNING last_seq INTO v_next;

  RETURN 'Amal' || p_year || '#' || lpad(v_next::text, 4, '0');
END;
$$;

-- ─── 4. Unique constraint on order_number ────────────────────────────────────
-- Safety net: even if something goes wrong at the application layer the DB
-- will reject a duplicate order_number outright.
--
-- NOTE: this will fail if duplicate order_numbers already exist in the table.
-- Check first with:
--   SELECT order_number, COUNT(*) FROM orders
--   GROUP BY order_number HAVING COUNT(*) > 1;

ALTER TABLE orders
  ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);
