-- ============================================================
-- PlusNet Kasir — Schema Lengkap
-- Jalankan seluruh file ini di Supabase SQL Editor (Dashboard > SQL > New query)
-- ============================================================

-- 1. EXTENSIONS
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Profil pengguna (terhubung ke auth.users)
create table if not exists public.profiles (
  id uuid references auth.users (id) on delete cascade not null primary key,
  email text,
  full_name text default '',
  store_name text default 'PlusNet',
  phone text default '',
  role text default 'kasir',
  categories text[] default array['atk','print','fotokopi','warnet','jajan'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profil ketika user baru mendaftar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, store_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'store_name', 'PlusNet')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Kategori produk
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- Produk / barang
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null default 'ATK',
  price_per_unit numeric(12,2) not null default 0,
  price_per_pack numeric(12,2) not null default 0,
  cost_per_unit numeric(12,2) not null default 0,
  cost_per_pack numeric(12,2) not null default 0,
  stock_unit integer not null default 0,
  stock_pack integer not null default 0,
  low_stock_threshold integer not null default 5,
  image_url text default '',
  barcode text default '', -- EAN/UPC/Code128/QR value dari scan
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Transaksi
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  subtotal numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  profit numeric(12,2) not null default 0,
  tax_rate numeric(5,2) not null default 11,
  payment_method text not null default 'tunai',
  status text not null default 'lunas',
  created_at timestamptz not null default now()
);

-- Item detail transaksi
create table if not exists public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references public.transactions (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  category text default 'Lainnya',
  quantity integer not null default 1,
  unit_type text not null default 'unit',
  unit_label text not null default 'Biji',
  unit_price numeric(12,2) not null default 0,
  cost numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

-- Riwayat pergerakan stok
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id) on delete cascade,
  type text not null default 'in', -- 'in' | 'out'
  quantity integer not null default 1,
  unit_type text not null default 'unit',
  note text default '',
  created_at timestamptz not null default now()
);

-- ============================================================
-- AUTO NUMBERING transaksi (TRX-0001, dst)
-- ============================================================
create sequence if not exists public.transaction_seq;

create or replace function public.next_transaction_code()
returns text
language sql stable
as $$
  select 'TRX-' || to_char(now(), 'YY') || lpad(nextval('public.transaction_seq')::text, 4, '0');
$$;

alter table public.transactions
  alter column code set default public.next_transaction_code();

-- ============================================================
-- INDEX
-- ============================================================
create index if not exists idx_transactions_created on public.transactions (created_at desc);
create index if not exists idx_transaction_items_trx on public.transaction_items (transaction_id);
create index if not exists idx_products_category on public.products (category);
create index if not exists idx_products_name on public.products (name);
-- Barcode unik hanya untuk yang terisi ('' dibiarkan berulang agar tidak bertabrakan)
create unique index if not exists idx_products_barcode on public.products (barcode) where barcode <> '';

-- ============================================================
-- ROW LEVEL SECURITY
-- Jangan lupa pilih "Enable RLS" lewat Pemicu di bawah (otomatis)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_items enable row level security;
alter table public.stock_movements enable row level security;

-- Profiles: user hanya bisa lihat/edit profilnya sendiri
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Kategori: semua user ter-authentikasi
create policy "categories_select_auth" on public.categories
  for select using (auth.role() = 'authenticated');
create policy "categories_insert_auth" on public.categories
  for insert with check (auth.role() = 'authenticated');

-- Produk: semua user ter-authentikasi
create policy "products_select_auth" on public.products
  for select using (auth.role() = 'authenticated');
create policy "products_insert_auth" on public.products
  for insert with check (auth.role() = 'authenticated');
create policy "products_update_auth" on public.products
  for update using (auth.role() = 'authenticated');
create policy "products_delete_auth" on public.products
  for delete using (auth.role() = 'authenticated');

-- Transaksi
create policy "transactions_select_auth" on public.transactions
  for select using (auth.role() = 'authenticated');
create policy "transactions_insert_auth" on public.transactions
  for insert with check (auth.role() = 'authenticated');
create policy "transactions_update_auth" on public.transactions
  for update using (auth.role() = 'authenticated');

-- Transaction items
create policy "ti_select_auth" on public.transaction_items
  for select using (auth.role() = 'authenticated');
create policy "ti_insert_auth" on public.transaction_items
  for insert with check (auth.role() = 'authenticated');

-- Stock movements
create policy "sm_select_auth" on public.stock_movements
  for select using (auth.role() = 'authenticated');
create policy "sm_insert_auth" on public.stock_movements
  for insert with check (auth.role() = 'authenticated');
create policy "sm_update_auth" on public.stock_movements
  for update using (auth.role() = 'authenticated');

-- ============================================================
-- SEED DATA
-- ============================================================
insert into public.categories (name) values
  ('ATK'),
  ('Buku & Kertas'),
  ('Aksesoris Komputer'),
  ('Print'),
  ('Fotokopi'),
  ('Warnet'),
  ('Jajan & Minuman'),
  ('Lainnya')
on conflict (name) do nothing;

insert into public.products (name, category, price_per_unit, price_per_pack, cost_per_unit, cost_per_pack, stock_unit, stock_pack, low_stock_threshold) values
  ('Buku Tulis Sinar Dunia', 'ATK', 4000, 45000, 2500, 36000, 12, 24, 5),
  ('Pulpen Gel Pilot', 'ATK', 5000, 55000, 3500, 44000, 5, 12, 5),
  ('Map Plastik L', 'ATK', 3000, 25000, 2000, 20000, 0, 0, 5),
  ('Kertas HVS A4 80gr', 'Buku & Kertas', 200, 55000, 150, 45000, 0, 5, 5),
  ('Spidol Boardmarker', 'ATK', 2000, 15000, 1400, 12000, 2, 8, 5),
  ('Flashdisk SanDisk 32GB', 'Aksesoris Komputer', 90000, 0, 75000, 0, 4, 0, 3),
  ('Tinta Epson Hitam 664', 'Aksesoris Komputer', 75000, 0, 62000, 0, 6, 0, 3)
on conflict (name) do nothing;

-- ============================================================
-- WARNET
-- ============================================================

-- Komputer warnet
create table if not exists public.komputer (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  tarif_per_jam numeric(12,2) not null default 0,
  status text not null default 'kosong', -- 'kosong' | 'dipakai'
  created_at timestamptz not null default now()
);

-- Sesi penggunaan komputer
create table if not exists public.sesi_warnet (
  id uuid primary key default gen_random_uuid(),
  komputer_id uuid references public.komputer (id) on delete cascade,
  waktu_mulai timestamptz not null default now(),
  durasi_menit integer, -- durasi countdown yang dipilih kasir (null untuk sesi lama)
  waktu_selesai timestamptz, -- null selama sesi masih berjalan
  tarif_per_jam numeric(12,2) not null default 0,
  total_biaya numeric(12,2), -- null sampai sesi ditutup
  transaksi_id uuid references public.transactions (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Closing session: isi waktu_selesai, hitung total_biaya (tarif x durasi),
-- kembalikan kembali status komputer ke 'kosong', lalu return total_biaya
create or replace function public.tutup_sesi_warnet(sesi_id uuid)
returns numeric
language plpgsql
security definer set search_path = public
as $$
declare
  v_sesi public.sesi_warnet%rowtype;
  v_durasi interval;
  v_total numeric;
begin
  select * into v_sesi
  from public.sesi_warnet
  where id = sesi_id
    and waktu_selesai is null
  for update;

  if not found then
    raise exception 'Sesi tidak ditemukan atau sudah ditutup';
  end if;

  v_durasi := now() - v_sesi.waktu_mulai;
  v_total := round(
    (extract(epoch from v_durasi) / 3600)::numeric * v_sesi.tarif_per_jam,
    2
  );

  update public.sesi_warnet
    set waktu_selesai = now(),
        total_biaya = v_total
    where id = sesi_id;

  update public.komputer
    set status = 'kosong'
    where id = v_sesi.komputer_id;

  return v_total;
end;
$$;

-- ============================================================
-- INDEX
-- ============================================================
create index if not exists idx_komputer_status on public.komputer (status);
create index if not exists idx_sesi_warnet_komputer on public.sesi_warnet (komputer_id);
create index if not exists idx_sesi_warnet_aktif on public.sesi_warnet (waktu_selesai);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.komputer enable row level security;
alter table public.sesi_warnet enable row level security;

-- Komputer: semua user (anon & authenticated) boleh SELECT
create policy "komputer_select_all" on public.komputer
  for select using (true);
create policy "komputer_insert_auth" on public.komputer
  for insert with check (auth.role() = 'authenticated');
create policy "komputer_update_auth" on public.komputer
  for update using (auth.role() = 'authenticated');
create policy "komputer_delete_auth" on public.komputer
  for delete using (auth.role() = 'authenticated');

-- Sesi warnet: semua user (anon & authenticated) boleh SELECT,
-- client hanya insert via app, close via function security definer
create policy "sesi_warnet_select_all" on public.sesi_warnet
  for select using (true);
create policy "sesi_warnet_insert_auth" on public.sesi_warnet
  for insert with check (auth.role() = 'authenticated');

-- ============================================================
-- SEED DATA
-- ============================================================
insert into public.komputer (nama, tarif_per_jam, status) values
  ('PC 01', 4000, 'kosong'),
  ('PC 02', 4000, 'kosong'),
  ('PC 03', 4000, 'kosong'),
  ('PC 04', 5000, 'kosong'),
  ('PC 05', 5000, 'kosong')
on conflict (nama) do nothing;

-- ============================================================
-- LAPORAN KEUANGAN HARIAN
-- Diisi manual oleh pemilik toko (5 kategori di Excel: KAS, FOTOCOPY, PULSA, WARNET, OMSET).
-- OMSET tidak disimpan di tabel ini karena dihitung otomatis dari data lain:
--   fotocopy = fc + lain2_masuk + aneka + pm_dll
--   pulsa    = tsel + lain2 + xl_tronik + tsel_linkaja + isat + m_bukalapak + gopay
--   warnet   = total_biaya sesi_warnet yang selesai pada tanggal tsb
-- Semua kolom angka numeric default 0; kolom keterangan berisi teks bebas.
-- ============================================================
create table if not exists public.laporan_harian (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  kategori text not null check (kategori in ('kas', 'fotocopy', 'pulsa', 'warnet')),
  shift integer not null default 0, -- 0 = kas (harian), 1 / 2 = shift fotocopy/pulsa/warnet
  -- KAS
  uang_masuk_warnet numeric(12,2) not null default 0,
  uang_masuk_fotocopy numeric(12,2) not null default 0,
  uang_masuk_pulsa numeric(12,2) not null default 0,
  uang_keluar_warnet numeric(12,2) not null default 0,
  uang_keluar_fc numeric(12,2) not null default 0,
  uang_keluar_pulsa numeric(12,2) not null default 0,
  -- FOTOCOPY
  fc numeric(12,2) not null default 0,
  lain2_masuk numeric(12,2) not null default 0,
  aneka numeric(12,2) not null default 0,
  pm_dll numeric(12,2) not null default 0,
  toner numeric(12,2) not null default 0,
  servis numeric(12,2) not null default 0,
  lain2_keluar numeric(12,2) not null default 0,
  -- PULSA
  tsel numeric(12,2) not null default 0,
  lain2 numeric(12,2) not null default 0,
  minus numeric(12,2) not null default 0,
  xl_tronik numeric(12,2) not null default 0,
  tsel_linkaja numeric(12,2) not null default 0,
  isat numeric(12,2) not null default 0,
  m_bukalapak numeric(12,2) not null default 0,
  gopay numeric(12,2) not null default 0,
  -- WARNET
  internet numeric(12,2) not null default 0,
  snack numeric(12,2) not null default 0,
  print numeric(12,2) not null default 0,
  error numeric(12,2) not null default 0,
  -- KETERANGAN
  keterangan text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tanggal, kategori, shift)
);

create index if not exists idx_laporan_harian_tanggal on public.laporan_harian (tanggal desc);
create index if not exists idx_laporan_harian_kategori on public.laporan_harian (kategori);

alter table public.laporan_harian enable row level security;

create policy "laporan_harian_select_auth" on public.laporan_harian
  for select using (auth.role() = 'authenticated');
create policy "laporan_harian_insert_auth" on public.laporan_harian
  for insert with check (auth.role() = 'authenticated');
create policy "laporan_harian_update_auth" on public.laporan_harian
  for update using (auth.role() = 'authenticated');
create policy "laporan_harian_delete_auth" on public.laporan_harian
  for delete using (auth.role() = 'authenticated');