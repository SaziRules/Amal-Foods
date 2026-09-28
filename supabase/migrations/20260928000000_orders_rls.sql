-- Enable Row Level Security on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Customers can INSERT orders (works for both logged-in and anonymous users)
CREATE POLICY "public_insert_orders"
ON orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only authenticated users (admins / managers) can READ orders
CREATE POLICY "authenticated_select_orders"
ON orders FOR SELECT
TO authenticated
USING (true);

-- Only authenticated users can UPDATE orders (status changes, edits)
CREATE POLICY "authenticated_update_orders"
ON orders FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Only authenticated users can DELETE orders
CREATE POLICY "authenticated_delete_orders"
ON orders FOR DELETE
TO authenticated
USING (true);
