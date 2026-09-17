export const formatRupiah = (value) => {
  const num = Number(value || 0);
  return 'Rp ' + num.toLocaleString('id-ID');
};

export const formatRupiahShort = (value) => {
  const num = Number(value || 0);
  if (num >= 1000000) return 'Rp ' + (num / 1000000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + 'jt';
  if (num >= 1000) return 'Rp ' + (num / 1000).toLocaleString('id-ID', { maximumFractionDigits: 0 }) + 'rb';
  return 'Rp ' + num;
};

export const formatDate = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatTime = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

export const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};