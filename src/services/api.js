import { supabase } from '../utils/supabase';

// === PRODUCTS ===

export async function fetchProducts({ query = '', category = '', limit = 100 } = {}) {
  let builder = supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (category) builder = builder.eq('category', category);
  if (query) builder = builder.ilike('name', `%${query}%`);

  const { data, error } = await builder;
  if (error) throw error;
  return data;
}

// Alias agar kompatibel jika layar memanggil getProducts()
export const getProducts = fetchProducts;

export async function fetchProductByBarcode(barcode) {
  const code = String(barcode || '').trim();
  if (!code) return null;
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode', code)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

export async function fetchCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return data;
}

export async function addProduct(payload) {
  const { data, error } = await supabase.from('products').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id, payload) {
  const { data, error } = await supabase.from('products').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// === TRANSACTIONS ===

export async function fetchTransactions({ query = '', limit = 50 } = {}) {
  let builder = supabase
    .from('transactions')
    .select('*, transaction_items(*)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (query) builder = builder.ilike('code', `%${query}%`);
  const { data, error } = await builder;
  if (error) throw error;
  return data;
}

export async function fetchTransaction(id) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, transaction_items(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createTransaction({ subtotal, tax, total, paymentMethod, items }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const next = await nextTransactionCode();
  const cost = items.reduce((s, it) => s + Number(it.cost || 0), 0);

  const { data: trx, error: trxError } = await supabase
    .from('transactions')
    .insert({
      code: next,
      user_id: user?.id,
      subtotal,
      tax,
      total,
      profit: Math.max(0, subtotal - cost),
      payment_method: paymentMethod,
      status: 'lunas',
    })
    .select()
    .single();

  if (trxError) throw trxError;

  const { error: itemsError } = await supabase
    .from('transaction_items')
    .insert(
      items.map((it) => ({
        transaction_id: trx.id,
        product_id: it.product_id,
        product_name: it.product_name,
        category: it.category,
        quantity: it.quantity,
        unit_type: it.unit_type,
        unit_label: it.unit_label,
        unit_price: it.unit_price,
        cost: it.cost,
        subtotal: it.subtotal,
      }))
    );

  if (itemsError) throw itemsError;

  // Paralel supaya checkout terasa cepat (sebelumnya sequential: 3 query x N item).
  await Promise.all(
    items.map((it) => adjustStock(it.product_id, it.quantity, it.unit_type, 'out', `Penjualan ${next}`))
  );

  return trx;
}

async function nextTransactionCode() {
  const { count, error } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true });
  if (error) throw error;
  const n = (count ?? 0) + 1;
  return `TRX-${String(n).padStart(4, '0')}`;
}

// === STOK & DASHBOARD ===

export async function adjustStock(productId, quantity, unitType, direction = 'out', note = '') {
  const { data: product, error: pErr } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();
  if (pErr) throw pErr;

  const delta = direction === 'out' ? -quantity : quantity;
  const update =
    unitType === 'pack'
      ? { stock_pack: Math.max(0, (product.stock_pack || 0) + delta) }
      : { stock_unit: Math.max(0, (product.stock_unit || 0) + delta) };

  const { error: uErr } = await supabase.from('products').update(update).eq('id', productId);
  if (uErr) throw uErr;

  const { error: mErr } = await supabase.from('stock_movements').insert({
    product_id: productId,
    type: direction === 'out' ? 'out' : 'in',
    quantity,
    unit_type: unitType,
    note,
  });
  if (mErr) throw mErr;
}

export async function fetchStockMovements(productId) {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return data;
}

export async function fetchDashboard() {
  const { data: todayTx, error: txErr } = await supabase
    .from('transactions')
    .select('*')
    .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
  if (txErr) throw txErr;

  const { data: products, error: pErr } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (pErr) throw pErr;

  const { data: topRes, error: topErr } = await supabase
    .from('transactions')
    .select('transaction_items(product_name, quantity, unit_price)')
    .limit(200);
  if (topErr) throw topErr;

  const totals = {};
  topRes?.forEach((trx) => {
    (trx.transaction_items || []).forEach((it) => {
      totals[it.product_name] = (totals[it.product_name] || 0) + (it.quantity || 0);
    });
  });
  const top = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    omzet: (todayTx || []).reduce((s, t) => s + Number(t.total || 0), 0),
    transaksi: todayTx?.length || 0,
    stokMenipis: (products || []).filter((p) => (p.stock_unit || 0) + (p.stock_pack || 0) <= (p.low_stock_threshold ?? 5)).length,
    keuntungan: (todayTx || []).reduce((s, t) => s + Number(t.profit || 0), 0),
    topProducts: top,
  };
}

export async function fetchReport(range = 'harian') {
  let since = new Date();
  if (range === 'harian') since.setHours(0, 0, 0, 0);
  if (range === 'bulanan') since.setDate(1);
  if (range === 'tahunan') since.setMonth(0, 1);

  const { data: tx, error: txErr } = await supabase
    .from('transactions')
    .select('*, transaction_items(*)')
    .gte('created_at', since.toISOString());
  if (txErr) throw txErr;

  const omzet = (tx || []).reduce((s, t) => s + Number(t.total || 0), 0);
  const byCategory = {};
  (tx || []).forEach((t) => {
    (t.transaction_items || []).forEach((it) => {
      const cat = it.category || 'Lainnya';
      byCategory[cat] = (byCategory[cat] || 0) + Number(it.subtotal || 0);
    });
  });

  return { omzet, transaksi: tx?.length || 0, byCategory };
}