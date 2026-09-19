import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { createAudioPlayer } from 'expo-audio';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../utils/supabase';
import { colors, radius, spacing, typography, shadow } from '../theme';
import { AppButton, AppInput, Badge, EmptyState, AnimatedModal } from '../components/UI';
import { formatRupiah, formatRupiahShort } from '../utils/format';

const QUICK_DURATIONS = [30, 60, 120, 180];

// Sesi yang habis dalam rentang ini sejak waktu habisnya dianggap "baru saja habis"
// (masih layak alarm). Sesi yang sudah lewat lebih lama ditutup diam-diam.
const WINDOW_ALARM_MS = 120000;

const fmtDurasi = (menit) =>
  menit % 60 === 0 ? `${menit / 60} Jam` : `${menit} Menit`;

const formatCountdown = (ms) => {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const base64Encode = (u8) => {
  let out = '';
  for (let i = 0; i < u8.length; i += 3) {
    const b0 = u8[i];
    const b1 = i + 1 < u8.length ? u8[i + 1] : 0;
    const b2 = i + 2 < u8.length ? u8[i + 2] : 0;
    out += B64_CHARS[b0 >> 2];
    out += B64_CHARS[((b0 & 3) << 4) | (b1 >> 4)];
    out += i + 1 < u8.length ? B64_CHARS[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    out += i + 2 < u8.length ? B64_CHARS[b2 & 63] : '=';
  }
  return out;
};

const BEEP_SAMPLE_RATE = 22050;
const BEEP_FREQ = 1046;
const BEEP_DUR = 0.18;
const BEEP_GAP = 0.12;
const BEEP_COUNT = 3;
const BEEP_TOTAL_MS = Math.round((BEEP_DUR * BEEP_COUNT + BEEP_GAP * (BEEP_COUNT - 1)) * 1000) + 250;

const buildBeepWavUri = () => {
  const samples = [];
  const pushTone = (dur) => {
    const n = Math.floor(BEEP_SAMPLE_RATE * dur);
    for (let i = 0; i < n; i++) {
      const t = i / BEEP_SAMPLE_RATE;
      const env = Math.min(1, t * 80, (dur - t) * 80);
      samples.push(Math.round(Math.sin(2 * Math.PI * BEEP_FREQ * t) * env * 0.5 * 32767));
    }
  };
  const pushSilence = (dur) => {
    const n = Math.floor(BEEP_SAMPLE_RATE * dur);
    for (let i = 0; i < n; i++) samples.push(0);
  };
  for (let i = 0; i < BEEP_COUNT; i++) {
    pushTone(BEEP_DUR);
    if (i < BEEP_COUNT - 1) pushSilence(BEEP_GAP);
  }

  const dataSize = samples.length * 2;
  const block = new ArrayBuffer(44 + dataSize);
  const dv = new DataView(block);
  const w = (off, s) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i));
  };
  w(0, 'RIFF');
  dv.setUint32(4, 36 + dataSize, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, 1, true);
  dv.setUint32(24, BEEP_SAMPLE_RATE, true);
  dv.setUint32(28, BEEP_SAMPLE_RATE * 2, true);
  dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true);
  w(36, 'data');
  dv.setUint32(40, dataSize, true);
  samples.forEach((v, i) => dv.setInt16(44 + i * 2, v, true));
  return `data:audio/wav;base64,${base64Encode(new Uint8Array(block))}`;
};

let beepUriCache = null;
const getBeepUri = () => {
  if (!beepUriCache) beepUriCache = buildBeepWavUri();
  return beepUriCache;
};

// Ubah angka PC jadi kata Bahasa Indonesia supaya TTS membacanya natural ("nomor tiga")
const ID_SATUAN = [
  '',
  'satu',
  'dua',
  'tiga',
  'empat',
  'lima',
  'enam',
  'tujuh',
  'delapan',
  'sembilan',
  'sepuluh',
  'sebelas',
];
const toIdWords = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num) || num < 0) return '?';
  const abs = Math.round(num);
  if (abs === 0) return 'nol';
  if (abs < 12) return ID_SATUAN[abs];
  if (abs < 20) return `${ID_SATUAN[abs - 10]} belas`;
  if (abs < 100) {
    const puluh = Math.floor(abs / 10);
    const sisa = abs % 10;
    const puluhKata = `${ID_SATUAN[puluh]} puluh`;
    return sisa ? `${puluhKata} ${ID_SATUAN[sisa]}` : puluhKata;
  }
  if (abs < 1000) {
    const ratus = Math.floor(abs / 100);
    const sisa = abs % 100;
    const ratusKata = ratus === 1 ? 'seratus' : `${ID_SATUAN[ratus]} ratus`;
    return sisa ? `${ratusKata} ${toIdWords(sisa)}` : ratusKata;
  }
  return String(num);
};

const ambilNomorPC = (name) => {
  const m = String(name || '').match(/\d+/);
  return m ? Number(m[0]) : null;
};

const withTimeout = (promise, ms = 15000, label = 'Request') => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error(
            `${label} memakan waktu terlalu lama (${ms / 1000} detik). Periksa koneksi internet Anda.`
          )
        ),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const errMsg = (e, fallback = 'Terjadi kesalahan.') => {
  if (e instanceof Error) return e.message || fallback;
  if (e && typeof e === 'object') {
    const parts = [e.message, e.details, e.hint].filter(Boolean);
    if (parts.length) return parts.join('\n');
    try {
      return JSON.stringify(e);
    } catch (_) {
      return fallback;
    }
  }
  return String(e && e !== null ? e : fallback);
};

export default function WarnetScreen() {
  const insets = useSafeAreaInsets();
  const [computers, setComputers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now());

  const alarmedRef = useRef(new Set());
  const dijagaRef = useRef(new Set());
  const speechQueueRef = useRef([]);
  const alarmBusyRef = useRef(false);
  const processAlarmQueueRef = useRef(null);
  const beepPlayerRef = useRef(null);
  const autoTutupRef = useRef(null);
  const tutupInFlightRef = useRef(new Set());
  const tutupDoneRef = useRef(new Set());
  const lastTutupRef = useRef({});

  const [durasiKomputer, setDurasiKomputer] = useState(null);
  const [durasiMenit, setDurasiMenit] = useState(null);
  const [customActive, setCustomActive] = useState(false);
  const [customMenit, setCustomMenit] = useState('');
  const [starting, setStarting] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [namaKomputer, setNamaKomputer] = useState('');
  const [tarifInput, setTarifInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [kom, ses] = await Promise.all([
        supabase.from('komputer').select('*').order('nama'),
        supabase
          .from('sesi_warnet')
          .select('id, komputer_id, waktu_mulai, durasi_menit')
          .is('waktu_selesai', null),
      ]);
      if (kom.error) throw kom.error;
      if (ses.error) throw ses.error;
      setComputers(kom.data || []);
      setSessions(ses.data || []);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(load, 50);
      return () => clearTimeout(t);
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const activeByKomputer = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      map[s.komputer_id] = s;
    });
    return map;
  }, [sessions]);

  const komputerNameById = useMemo(() => {
    const map = {};
    computers.forEach((c) => {
      map[c.id] = c.nama;
    });
    return map;
  }, [computers]);

  const sampaikanAlarm = useCallback((next, onDone) => {
    // 1) Bunyi beep 3x (satu file WAV berisi 3 beep berselang)
    try {
      if (!beepPlayerRef.current) {
        const player = createAudioPlayer({ uri: getBeepUri() });
        player.loop = false;
        beepPlayerRef.current = player;
      }
      const p = beepPlayerRef.current;
      if (p.currentTime > 0) p.seekTo(0);
      p.play();
    } catch (e) {
      // beep gagal; lanjut langsung ke ucapan
    }

    // 2) Tunggu beep selesai, lalu ucapkan kalimat lengkap
    setTimeout(() => {
      let pitch = 1.0;
      if (next.number != null && next.number > 0) {
        pitch = next.number % 2 === 1 ? 1.15 : 0.85; // ganjil lebih tinggi, genap lebih rendah
      }
      try {
        const ucapanNomor = next.number != null ? toIdWords(next.number) : next.name;
        Speech.speak(
          `Perhatian, waktu komputer nomor ${ucapanNomor} telah habis`,
          {
            language: 'id-ID',
            pitch,
            onDone,
            onStopped: onDone,
            onError: onDone,
          }
        );
      } catch (e) {
        onDone();
      }
    }, BEEP_TOTAL_MS);
  }, []);

  processAlarmQueueRef.current = () => {
    if (alarmBusyRef.current) return;
    const next = speechQueueRef.current.shift();
    if (!next) return;
    alarmBusyRef.current = true;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      alarmBusyRef.current = false;
      // Setelah alarm selesai dibunyikan, tutup sesi yang bersangkutan
      if (next.sesiId) autoTutupRef.current?.(next.sesiId);
      processAlarmQueueRef.current();
    };
    sampaikanAlarm(next, finish);
  };

  const autoTutupSesi = useCallback(
    async (sesiId) => {
      if (!sesiId) return;
      if (tutupInFlightRef.current.has(sesiId) || tutupDoneRef.current.has(sesiId)) return;
      const last = lastTutupRef.current[sesiId] || 0;
      if (Date.now() - last < 20000) return;
      lastTutupRef.current[sesiId] = Date.now();
      tutupInFlightRef.current.add(sesiId);
      try {
        const { error: rpcErr } = await withTimeout(
          supabase.rpc('tutup_sesi_warnet', {
            sesi_id: sesiId,
          }),
          15000,
          'Tutup sesi'
        );
        if (rpcErr) throw rpcErr;
        tutupDoneRef.current.add(sesiId);
      } catch (e) {
        console.error('[Auto Tutup Sesi] Gagal:', e);
      } finally {
        tutupInFlightRef.current.delete(sesiId);
        await load();
      }
    },
    [load]
  );
  autoTutupRef.current = autoTutupSesi;

  useEffect(() => {
    if (sessions.length === 0) return;
    const baruHabis = [];
    sessions.forEach((s) => {
      if (!s.waktu_mulai || !s.durasi_menit) return;
      const endMs = new Date(s.waktu_mulai).getTime() + s.durasi_menit * 60000;
      if (endMs > now) {
        dijagaRef.current.add(s.id);
        return;
      }
      const telatMs = now - endMs;
      // Skenario 1: sesi yang habis saat app dipantau real-time (countdown berjalan)
      // dan baru terlewati dalam rentang singkat -> bunyikan alarm, lalu tutup sesi
      // setelah alarm selesai.
      if (dijagaRef.current.has(s.id) && telatMs <= WINDOW_ALARM_MS) {
        if (alarmedRef.current.has(s.id)) return;
        alarmedRef.current.add(s.id);
        const nama = komputerNameById[s.komputer_id] || String(s.komputer_id);
        baruHabis.push({
          sesiId: s.id,
          name: nama,
          number: ambilNomorPC(nama),
        });
        return;
      }
      // Skenario 2: sesi sudah expired sebelum app dibuka/di-refresh (misal app
      // sempat tertutup) -> tutup diam-diam tanpa bunyi alarm.
      autoTutupSesi(s.id);
    });
    if (baruHabis.length === 0) return;
    baruHabis.forEach((x) => speechQueueRef.current.push(x));
    processAlarmQueueRef.current?.();
  }, [now, sessions, komputerNameById, autoTutupSesi]);

  const stats = useMemo(() => {
    const dipakai = computers.filter((c) => c.status === 'dipakai').length;
    return { total: computers.length, dipakai, kosong: computers.length - dipakai };
  }, [computers]);

  const terbukaDurasi = (komputer) => {
    setDurasiMenit(null);
    setCustomActive(false);
    setCustomMenit('');
    setStarting(false);
    setDurasiKomputer(komputer);
  };

  const tutupDurasi = () => setDurasiKomputer(null);

  const effectiveMenit = customActive ? Number(customMenit) : durasiMenit;

  const confirmMulai = async () => {
    const komputer = durasiKomputer;
    if (!komputer) return;
    const menit = effectiveMenit;
    if (!(menit > 0)) return;
    setStarting(true);
    try {
      const { data: insData, error: sErr } = await withTimeout(
        supabase
          .from('sesi_warnet')
          .insert({
            komputer_id: komputer.id,
            tarif_per_jam: Number(komputer.tarif_per_jam || 0),
            durasi_menit: menit,
          })
          .select('id, komputer_id, waktu_mulai, durasi_menit, tarif_per_jam'),
        15000,
        'Buat sesi'
      );
      if (sErr) throw sErr;

      const { data: updData, error: uErr } = await withTimeout(
        supabase
          .from('komputer')
          .update({ status: 'dipakai' })
          .eq('id', komputer.id)
          .select('id'),
        15000,
        'Update status komputer'
      );
      if (uErr) throw uErr;
      if (!updData || updData.length === 0) {
        throw new Error(
          'Sesi tersimpan tetapi status komputer tidak berubah (0 baris ter-update). Periksa RLS policy tabel komputer.'
        );
      }

      // Update state lokal seketika dari hasil insert, tanpa menunggu refetch
      const sesiBaru =
        insData && insData[0]
          ? insData[0]
          : {
              id: undefined,
              komputer_id: komputer.id,
              waktu_mulai: new Date().toISOString(),
              durasi_menit: menit,
              tarif_per_jam: Number(komputer.tarif_per_jam || 0),
            };
      setSessions((prev) => [
        ...prev.filter((s) => s.komputer_id !== komputer.id),
        sesiBaru,
      ]);
      setComputers((prev) =>
        prev.map((c) => (c.id === komputer.id ? { ...c, status: 'dipakai' } : c))
      );

      setDurasiKomputer(null);
      await load();
    } catch (e) {
      console.error('[Mulai Sesi] Gagal:', e);
      Alert.alert('Gagal', errMsg(e, 'Sesi tidak bisa dimulai.'));
    } finally {
      setStarting(false);
    }
  };

  const selesaiSesi = async (sesiId) => {
    setBusyId(sesiId);
    try {
      const { data, error: rpcErr } = await withTimeout(
        supabase.rpc('tutup_sesi_warnet', {
          sesi_id: sesiId,
        }),
        15000,
        'Tutup sesi'
      );
      if (rpcErr) throw rpcErr;
      const biaya =
        data != null && !Array.isArray(data)
          ? formatRupiah(data)
          : Array.isArray(data)
            ? formatRupiah(data[0]?.total_biaya)
            : null;
      await load();
      Alert.alert('Sesi Selesai', biaya ? `Total biaya: ${biaya}` : 'Komputer sudah kosong.');
    } catch (e) {
      console.error('[Tutup Sesi] Gagal:', e);
      Alert.alert('Gagal', errMsg(e, 'Sesi tidak bisa ditutup.'));
    } finally {
      setBusyId(null);
    }
  };

  const tutupAdd = () => {
    setShowAdd(false);
    setNamaKomputer('');
    setTarifInput('');
    setSaving(false);
  };

  const saveKomputer = async () => {
    const nama = namaKomputer.trim();
    if (!nama) {
      Alert.alert('Lengkapi Data', 'Nama komputer wajib diisi.');
      return;
    }
    const tarif = Number(String(tarifInput).replace(/\./g, '').replace(',', '.'));
    if (!(tarif > 0)) {
      Alert.alert('Lengkapi Data', 'Tarif per jam harus lebih dari 0.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await withTimeout(
        supabase
          .from('komputer')
          .insert({ nama, tarif_per_jam: tarif, status: 'kosong' }),
        15000,
        'Simpan komputer'
      );
      if (error) throw error;
      tutupAdd();
      await load();
    } catch (e) {
      console.error('[Simpan Komputer] Gagal:', e);
      Alert.alert('Gagal', errMsg(e, 'Komputer tidak bisa disimpan.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xs }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.topbar}>
        <View>
          <Text style={styles.title}>Warnet</Text>
          <Text style={styles.subtitle}>Kelola sesi komputer</Text>
        </View>
        <TouchableOpacity style={styles.addKomputerBtn} onPress={() => setShowAdd(true)} activeOpacity={0.85}>
          <Ionicons name="add" size={16} color={colors.onPrimary} />
          <Text style={styles.addKomputerText}>Tambah PC</Text>
        </TouchableOpacity>
      </View>

      {/* Ringkasan Unit */}
      <View style={styles.statBar}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statCap}>Total Unit</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{stats.dipakai}</Text>
          <Text style={styles.statCap}>Dipakai</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: colors.onSurfaceVariant }]}>{stats.kosong}</Text>
          <Text style={styles.statCap}>Kosong</Text>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {computers.length === 0 && !error ? (
        <View style={styles.emptyWrap}>
          <EmptyState title="Belum ada komputer" subtitle="Tekan tombol Tambah PC untuk menambah data" icon="desktop-outline" />
        </View>
      ) : (
        computers.map((komputer) => {
          const sesi = activeByKomputer[komputer.id];
          const dipakai = komputer.status === 'dipakai';
          return (
            <KomputerCard
              key={komputer.id}
              komputer={komputer}
              sesi={sesi}
              dipakai={dipakai}
              now={now}
              busy={busyId === komputer.id || (sesi && busyId === sesi.id)}
              onMulai={() => terbukaDurasi(komputer)}
              onSelesai={() => sesi && selesaiSesi(sesi.id)}
            />
          );
        })
      )}

      <AnimatedModal visible={durasiKomputer !== null} onClose={tutupDurasi} align="bottom">
        <View style={[styles.sheet, { paddingBottom: insets.bottom > 0 ? insets.bottom + spacing.md : spacing.lg }]}>
            <View style={styles.sheetGrabber} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Mulai Sesi</Text>
              <TouchableOpacity onPress={tutupDurasi} style={styles.sheetClose}>
                <Ionicons name="close" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <View style={styles.sheetPcRow}>
              <View style={styles.sheetPcIcon}>
                <Ionicons name="desktop-outline" size={16} color={colors.primary} />
              </View>
              <Text style={styles.sheetSub}>
                {durasiKomputer?.nama} &bull; {formatRupiahShort(Number(durasiKomputer?.tarif_per_jam || 0))} / jam
              </Text>
            </View>

            <Text style={styles.sheetLabel}>Pilih Durasi</Text>
            <View style={styles.durasiGrid}>
              {QUICK_DURATIONS.map((min) => (
                <TouchableOpacity
                  key={min}
                  style={[styles.durasiChip, !customActive && durasiMenit === min && styles.durasiChipActive]}
                  onPress={() => {
                    setCustomActive(false);
                    setDurasiMenit(min);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.durasiChipText, !customActive && durasiMenit === min && styles.durasiChipTextActive]}>
                    {fmtDurasi(min)}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.durasiChip, customActive && styles.durasiChipActive]}
                onPress={() => {
                  setCustomActive(true);
                  setDurasiMenit(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.durasiChipText, customActive && styles.durasiChipTextActive]}>Custom</Text>
              </TouchableOpacity>
            </View>

            {customActive && (
              <AppInput
                label="Durasi (menit)"
                icon="time-outline"
                keyboardType="number-pad"
                value={customMenit}
                onChangeText={setCustomMenit}
                placeholder="cth: 45"
              />
            )}

            {durasiKomputer && effectiveMenit > 0 && (
              <View style={styles.estimateBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.estimateLabel}>Estimasi Harga</Text>
                  <Text style={styles.estimateMeta}>
                    {fmtDurasi(effectiveMenit)} x {formatRupiahShort(Number(durasiKomputer.tarif_per_jam || 0))}/jam
                  </Text>
                </View>
                <Text style={styles.estimateValue}>
                  {formatRupiah(Math.round((effectiveMenit / 60) * Number(durasiKomputer.tarif_per_jam || 0)))}
                </Text>
              </View>
            )}

            <AppButton
              title="Konfirmasi & Mulai Sesi"
              icon="play-circle-outline"
              loading={starting}
              disabled={!(effectiveMenit > 0)}
              onPress={confirmMulai}
            />
        </View>
      </AnimatedModal>

      <AnimatedModal visible={showAdd} onClose={tutupAdd} align="bottom">
        <View style={[styles.sheet, { paddingBottom: insets.bottom > 0 ? insets.bottom + spacing.md : spacing.lg }]}>
            <View style={styles.sheetGrabber} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Tambah Komputer</Text>
              <TouchableOpacity onPress={tutupAdd} style={styles.sheetClose}>
                <Ionicons name="close" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <AppInput
              label="Nama Komputer"
              icon="desktop-outline"
              value={namaKomputer}
              onChangeText={setNamaKomputer}
              placeholder="cth: PC 06"
            />
            <AppInput
              label="Tarif per Jam (Rp)"
              icon="pricetag-outline"
              keyboardType="number-pad"
              value={tarifInput}
              onChangeText={setTarifInput}
              placeholder="cth: 5000"
            />

            <AppButton title="Simpan" icon="checkmark-circle-outline" loading={saving} onPress={saveKomputer} />
        </View>
      </AnimatedModal>
    </ScrollView>
  );
}

function KomputerCard({ komputer, sesi, dipakai, now, busy, onMulai, onSelesai }) {
  const tarif = Number(komputer.tarif_per_jam || 0);
  const startMs = sesi ? new Date(sesi.waktu_mulai).getTime() : null;
  const elapsed = startMs ? Math.max(0, now - startMs) : 0;
  const remaining = startMs && sesi?.durasi_menit ? startMs + sesi.durasi_menit * 60000 - now : null;
  const habis = remaining !== null && remaining <= 0;
  const estimasi = dipakai ? (elapsed / 3600000) * tarif : 0;

  const status = !dipakai
    ? { label: 'Kosong', tone: 'pending', dot: colors.outlineVariant }
    : habis
      ? { label: 'Waktu Habis', tone: 'danger', dot: colors.error }
      : { label: 'Dipakai', tone: 'primary', dot: colors.primary };

  return (
    // Border merah (cardHabis) hanya untuk PC yang sedang dipakai dan waktunya habis.
    // PC kosong tidak pernah dapat border merah, walau ada sisa sesi basi di cache/state.
    <View style={[styles.card, dipakai && styles.cardActive, dipakai && habis && styles.cardHabis]}>
      {/* Header Unit */}
      <View style={styles.cardHeader}>
        <View style={styles.pcIcon}>
          <Ionicons
            name="desktop-outline"
            size={19}
            color={!dipakai ? colors.onSurfaceVariant : habis ? colors.error : colors.primary}
          />
        </View>
        <View style={styles.pcInfo}>
          <View style={styles.pcNameRow}>
            <Text style={styles.pcName} numberOfLines={1}>{komputer.nama}</Text>
            <Text style={styles.pcRate}>{formatRupiahShort(tarif)}/jam</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
            <Text style={[styles.statusText, { color: !dipakai ? colors.onSurfaceVariant : status.dot }]}>
              {!dipakai ? 'Siap digunakan' : habis ? 'Perlu ditutup' : 'Sedang berjalan'}
            </Text>
          </View>
        </View>
        <Badge label={status.label} tone={status.tone} />
      </View>

      {dipakai ? (
        <>
          <View style={styles.divider} />
          {/* Timer & Biaya */}
          <View style={styles.timerRow}>
            <View style={styles.timerMain}>
              <Ionicons
                name={habis ? 'alarm-outline' : 'hourglass-outline'}
                size={16}
                color={habis ? colors.error : colors.onSurfaceVariant}
              />
              <Text style={styles.timerLabel}>{habis ? 'Waktu Habis' : 'Sisa Waktu'}</Text>
            </View>
            <Text style={[styles.timerValue, habis && styles.timerValueHabis]}>
              {remaining !== null ? formatCountdown(remaining) : '-'}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Berjalan</Text>
              <Text style={styles.breakdownValue}>{formatCountdown(elapsed)}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Estimasi Biaya</Text>
              <Text style={[styles.breakdownValue, styles.breakdownValueAccent]}>
                {formatRupiah(Math.round(estimasi))}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <AppButton
              title="Selesai Sesi"
              icon="stop-circle-outline"
              variant="danger"
              loading={busy}
              onPress={onSelesai}
              style={busy ? { opacity: 0.6 } : null}
            />
          </View>
        </>
      ) : (
        <View style={styles.actions}>
          <AppButton title="Mulai Sesi" icon="play-circle-outline" onPress={onMulai} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceDim },
  content: { padding: spacing.lg, paddingBottom: 40 },
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headlineLg,
    color: colors.onSurface,
    fontFamily: 'Manrope_800ExtraBold',
    letterSpacing: -0.5,
  },
  subtitle: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  addKomputerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  addKomputerText: { ...typography.bodyMd, color: colors.onPrimary, fontFamily: 'Manrope_700Bold', fontSize: 13 },
  statBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 3 },
  statDivider: { width: 1, height: 26, backgroundColor: colors.hairline },
  statNum: {
    ...typography.headlineMd,
    color: colors.onSurface,
    fontFamily: 'Manrope_800ExtraBold',
  },
  statCap: { ...typography.bodySm, color: colors.onSurfaceVariant, fontSize: 11 },
  error: {
    color: colors.error,
    ...typography.bodySm,
    marginBottom: spacing.md,
    backgroundColor: colors.errorContainer,
    padding: spacing.sm,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  emptyWrap: { marginTop: spacing.md },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    marginBottom: spacing.md,
  },
  cardActive: {
    borderColor: colors.outlineVariant,
  },
  cardHabis: { borderColor: colors.error },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pcIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pcInfo: { flex: 1 },
  pcNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  pcName: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontFamily: 'Manrope_700Bold',
    fontSize: 15,
    flexShrink: 1,
  },
  pcRate: { ...typography.labelMd, color: colors.onSurfaceVariant, fontSize: 11, fontFamily: 'Manrope_600SemiBold' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { ...typography.bodySm, fontSize: 11, fontFamily: 'Manrope_600SemiBold' },
  divider: { height: 1, backgroundColor: colors.hairline, marginTop: spacing.md, marginBottom: spacing.md },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timerMain: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timerLabel: { ...typography.bodySm, color: colors.onSurfaceVariant, fontFamily: 'Manrope_600SemiBold', fontSize: 12 },
  timerValue: {
    fontSize: 18,
    color: colors.onSurface,
    fontFamily: 'Manrope_800ExtraBold',
  },
  timerValueHabis: { color: colors.error },
  breakdownRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    gap: spacing.lg,
  },
  breakdownItem: { flex: 1, gap: 2 },
  breakdownLabel: { ...typography.labelMd, color: colors.onSurfaceVariant, fontSize: 10, fontFamily: 'Manrope_600SemiBold' },
  breakdownValue: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
  },
  breakdownValueAccent: { color: colors.primary },
  actions: { marginTop: spacing.md },
  sheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
  },
  sheetGrabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontFamily: 'Manrope_700Bold',
  },
  sheetClose: { padding: 6 },
  sheetPcRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  sheetPcIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSub: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  sheetLabel: { ...typography.labelMd, color: colors.onSurfaceVariant, marginBottom: spacing.sm, fontFamily: 'Manrope_600SemiBold' },
  durasiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  durasiChip: {
    flexGrow: 1,
    flexBasis: '46%',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  durasiChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  durasiChipText: { ...typography.bodyMd, color: colors.onSurfaceVariant, fontFamily: 'Manrope_600SemiBold' },
  durasiChipTextActive: { color: colors.onPrimary, fontFamily: 'Manrope_700Bold' },
  estimateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  estimateLabel: { ...typography.bodySm, color: colors.onSurfaceVariant },
  estimateMeta: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2, fontSize: 11 },
  estimateValue: {
    ...typography.headlineSm,
    color: colors.onSurface,
    fontFamily: 'Manrope_800ExtraBold',
  },
});