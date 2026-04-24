-- Supabase pricing schema for dynamic variant pricing
-- Products store only the base price per kg.
-- Variants store only the weight, and price is calculated dynamically.

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_price numeric(10,2) not null,
  description text,
  created_at timestamp with time zone default now()
);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  weight_kg numeric(10,2) not null,
  label text not null,
  created_at timestamp with time zone default now(),
  unique(product_id, weight_kg)
);

-- Convenience view to expose the calculated price for each variant.
create view product_variant_prices as
select
  pv.id as variant_id,
  p.id as product_id,
  p.name as product_name,
  p.base_price,
  pv.weight_kg,
  pv.label,
  round(p.base_price * pv.weight_kg, 2) as variant_price
from product_variants pv
join products p on p.id = pv.product_id;

-- Sample data
insert into products (id, name, base_price, description) values
  ('11111111-1111-1111-1111-111111111111', 'Apple', 100.00, 'Fresh apples priced per kilogram'),
  ('22222222-2222-2222-2222-222222222222', 'Banana', 80.00, 'Sweet bananas priced per kilogram');

insert into product_variants (product_id, weight_kg, label) values
  ('11111111-1111-1111-1111-111111111111', 3.00, '3kg'),
  ('11111111-1111-1111-1111-111111111111', 5.00, '5kg'),
  ('11111111-1111-1111-1111-111111111111', 10.00, '10kg'),
  ('22222222-2222-2222-2222-222222222222', 3.00, '3kg'),
  ('22222222-2222-2222-2222-222222222222', 5.00, '5kg');

-- Example query to fetch variant prices
-- select * from product_variant_prices;
