## Table `orders`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `customer_name` | `text` |  |
| `phone_number` | `text` |  |
| `email` | `text` |  Nullable |
| `branch` | `text` |  |
| `items` | `jsonb` |  |
| `total` | `numeric` |  |
| `status` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `payment_method` | `text` |  Nullable |
| `address` | `text` |  Nullable |
| `payment_status` | `text` |  Nullable |
| `region` | `text` |  Nullable |
| `cell_number` | `text` |  Nullable |
| `order_number` | `text` |  Nullable |

## Table `products`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  |
| `price` | `numeric` |  |
| `unit` | `text` |  Nullable |
| `image_url` | `text` |  Nullable |
| `available` | `bool` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `branches`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  |
| `address` | `text` |  Nullable |
| `phone` | `text` |  Nullable |
| `region` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `role` | `text` |  Nullable |
| `branch` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `name` | `text` |  Nullable |
| `email` | `text` |  Nullable |
| `password` | `text` |  Nullable |

## Table `managers`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `created_at` | `timestamptz` |  Nullable |
| `name` | `text` |  |
| `email` | `text` |  |
| `password` | `text` |  |
| `branch` | `text` |  |
| `role` | `text` |  Nullable |

## Table `customers`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `email` | `text` |  Nullable Unique |
| `name` | `text` |  Nullable |
| `surname` | `text` |  Nullable |
| `phone` | `text` |  Nullable |
| `street` | `text` |  Nullable |
| `city` | `text` |  Nullable |
| `avatar_url` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## RLS Policies

### `products`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Allow public read access` | SELECT | public | PERMISSIVE | `true` | — |

### `branches`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Allow public read access` | SELECT | public | PERMISSIVE | `true` | — |

### `orders`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Allow inserting new orders` | INSERT | public | PERMISSIVE | — | `true` |
| `Managers view/update branch orders` | ALL | public | PERMISSIVE | `(EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.branch = orders.branch) AND (profiles.role = 'manager'::text))))` | — |
| `Owners full access to orders` | ALL | public | PERMISSIVE | `(EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'owner'::text))))` | — |
| `Customers can view their own orders` | SELECT | public | PERMISSIVE | `(email = (auth.jwt() ->> 'email'::text))` | — |
| `Allow managers to read all orders` | SELECT | authenticated | PERMISSIVE | `true` | — |
| `Managers can read their own branch orders` | SELECT | authenticated | PERMISSIVE | `(EXISTS ( SELECT 1    FROM managers   WHERE ((managers.email = auth.email()) AND (lower(managers.branch) = lower(orders.branch)))))` | — |
| `Allow managers to update visible orders` | UPDATE | authenticated | PERMISSIVE | `true` | `true` |

### `profiles`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Allow public read of profiles` | SELECT | public | PERMISSIVE | `true` | — |
| `Users can insert own profile` | INSERT | public | PERMISSIVE | — | `(auth.uid() = id)` |
| `Owner can update profiles` | UPDATE | public | PERMISSIVE | `((auth.jwt() ->> 'role'::text) = 'owner'::text)` | — |
| `Profiles are viewable by owner` | SELECT | public | PERMISSIVE | `(auth.uid() = id)` | — |
| `Profiles are updatable by owner` | UPDATE | public | PERMISSIVE | `(auth.uid() = id)` | — |
| `Profiles are insertable by owner` | INSERT | public | PERMISSIVE | — | `(auth.uid() = id)` |
| `Allow users to read own profile` | SELECT | public | PERMISSIVE | `(auth.uid() = id)` | — |
| `Allow users to update own profile` | UPDATE | public | PERMISSIVE | `(auth.uid() = id)` | `(auth.uid() = id)` |
| `Allow users to insert own profile` | INSERT | public | PERMISSIVE | — | `(auth.uid() = id)` |
| `Users can view own profile` | SELECT | public | PERMISSIVE | `(auth.uid() = id)` | — |
| `Users can insert their own profile` | INSERT | public | PERMISSIVE | — | `(auth.uid() = id)` |
| `Users can update own profile` | UPDATE | public | PERMISSIVE | `(auth.uid() = id)` | `(auth.uid() = id)` |

### `managers`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Allow all` | ALL | public | PERMISSIVE | `true` | — |
| `Allow admin access` | ALL | public | PERMISSIVE | `true` | `true` |

### `customers`

| Policy | Command | Roles | Action | USING | WITH CHECK |
|--------|---------|-------|--------|-------|------------|
| `Customers can view their own record` | SELECT | public | PERMISSIVE | `(auth.uid() = id)` | — |
| `Customers can update their own record` | UPDATE | public | PERMISSIVE | `(auth.uid() = id)` | — |
| `Customers can insert their own record` | INSERT | public | PERMISSIVE | — | `(auth.uid() = id)` |
| `Customers can view own record` | SELECT | public | PERMISSIVE | `(auth.uid() = id)` | — |
| `Customers can insert own record` | INSERT | public | PERMISSIVE | — | `(auth.uid() = id)` |
| `Customers can update own record` | UPDATE | public | PERMISSIVE | `(auth.uid() = id)` | `(auth.uid() = id)` |

