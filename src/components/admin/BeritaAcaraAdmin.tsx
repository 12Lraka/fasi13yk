/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Modul Superadmin: Input & Pengesahan Berita Acara Kejuaraan Resmi
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Award,
  CheckCircle2,
  AlertCircle,
  Save,
  Printer,
  Trash2,
  Edit3,
  Search,
  Users,
  Trophy,
  Calendar,
  UserCheck,
  Building2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Star,
  Layers,
  User,
} from 'lucide-react';
import { Participant, BeritaAcaraKejuaraan, WinnerSlot, Jenjang, CompetitionCategory } from '../../types/fasi';
import { CATEGORIES_LIST, KEMANTREN_LIST } from '../../data/fasiMasterData';
import { getStoredBeritaAcara, saveBeritaAcaraList } from '../../utils/storage';
import {
  upsertBeritaAcaraToSupabase,
  deleteBeritaAcaraFromSupabase,
  fetchBeritaAcaraFromSupabase,
  isSupabaseConfigured,
} from '../../lib/supabase';
import { showToast, showConfirmDialog } from '../../utils/sweetalert';

const LOGO_BADKO_URL = 'https://gigluvvkswjaiwxpnqet.supabase.co/storage/v1/object/public/public-assets/logobadko.png';
const LOGO_FASI_URL = 'https://gigluvvkswjaiwxpnqet.supabase.co/storage/v1/object/public/public-assets/logofasi.png';

interface BeritaAcaraAdminProps {
  participants: Participant[];
  onDataChanged?: () => void;
}

export interface CategoryGroup {
  groupId: string;
  kemantrenId: string;
  kemantrenName: string;
  unitTpa: string;
  members: Participant[];
  memberNames: string[];
  formattedName: string;
  averageScore: number;
}

// Menentukan apakah suatu cabang lomba merupakan Cabang Utama (Bobot 7-5-3)
export function checkIsCabangUtama(categoryName: string, level: Jenjang): boolean {
  const normalized = categoryName.toLowerCase();
  if (level === 'TKA' && normalized.includes('tartil')) return true;
  if (level === 'TPA' && normalized.includes('tartil')) return true;
  if (level === 'TQA' && (normalized.includes('tilawah') || normalized.includes('tilawati'))) return true;
  return false;
}

export const BeritaAcaraAdmin: React.FC<BeritaAcaraAdminProps> = ({ participants, onDataChanged }) => {
  const [beritaAcaraList, setBeritaAcaraList] = useState<BeritaAcaraKejuaraan[]>(() => getStoredBeritaAcara());
  const [selectedCabangId, setSelectedCabangId] = useState<string>(CATEGORIES_LIST[0]?.id || '');
  const [filterJenjang, setFilterJenjang] = useState<'ALL' | Jenjang>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form State untuk Cabang terpilih
  const [tanggalPenetapan, setTanggalPenetapan] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [juriSatu, setJuriSatu] = useState<string>('');
  const [juriDua, setJuriDua] = useState<string>('');
  const [catatanJuri, setCatatanJuri] = useState<string>('');
  const [status, setStatus] = useState<'Draft' | 'Disahkan'>('Draft');

  // Winner slots
  const [juara1, setJuara1] = useState<WinnerSlot>({ nama: '', kemantren: '', unitTpa: '', totalNilai: 0 });
  const [juara2, setJuara2] = useState<WinnerSlot>({ nama: '', kemantren: '', unitTpa: '', totalNilai: 0 });
  const [juara3, setJuara3] = useState<WinnerSlot>({ nama: '', kemantren: '', unitTpa: '', totalNilai: 0 });
  const [harapan1, setHarapan1] = useState<WinnerSlot>({ nama: '', kemantren: '', unitTpa: '', totalNilai: 0 });
  const [harapan2, setHarapan2] = useState<WinnerSlot>({ nama: '', kemantren: '', unitTpa: '', totalNilai: 0 });

  // Cabang Lomba yang sedang aktif
  const currentCategory = useMemo(() => {
    return CATEGORIES_LIST.find((c) => c.id === selectedCabangId) || CATEGORIES_LIST[0];
  }, [selectedCabangId]);

  const isCabangUtama = useMemo(() => {
    if (!currentCategory) return false;
    return checkIsCabangUtama(currentCategory.name, currentCategory.level as Jenjang);
  }, [currentCategory]);

  const isGroupCategory = Boolean(currentCategory?.isGroup);
  const groupMemberCount = currentCategory?.groupMemberCount || 3;

  // Peserta yang terdaftar di cabang lomba aktif
  const categoryParticipants = useMemo(() => {
    return participants.filter((p) => p.categoryId === currentCategory.id);
  }, [participants, currentCategory]);

  // Kelompokkan regu jika cabang lomba adalah kategori grup / beregu (3 santri per regu)
  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    if (!currentCategory || !currentCategory.isGroup) return [];

    const byKemantren: Record<string, Participant[]> = {};
    categoryParticipants.forEach((p) => {
      if (!byKemantren[p.kemantrenId]) {
        byKemantren[p.kemantrenId] = [];
      }
      byKemantren[p.kemantrenId].push(p);
    });

    const groups: CategoryGroup[] = [];
    const memberCount = currentCategory.groupMemberCount || 3;

    Object.keys(byKemantren).forEach((kemId) => {
      const parts = byKemantren[kemId];
      const kem = KEMANTREN_LIST.find((k) => k.id === kemId);
      const kemName = kem ? kem.name : kemId;

      for (let i = 0; i < parts.length; i += memberCount) {
        const chunk = parts.slice(i, i + memberCount);
        const groupIndex = Math.floor(i / memberCount) + 1;
        const memberNames = chunk.map((m) => m.fullName);
        const unitTpa = chunk[0]?.tpaUnitName || '';
        const avgScore = chunk.length > 0
          ? chunk.reduce((sum, m) => sum + (m.totalScore || 0), 0) / chunk.length
          : 0;

        const groupLabel = parts.length > memberCount
          ? `Regu ${groupIndex} Rayon ${kemName}`
          : `Regu Rayon ${kemName}`;

        groups.push({
          groupId: `${kemId}-grp-${groupIndex}`,
          kemantrenId: kemId,
          kemantrenName: kemName,
          unitTpa: unitTpa,
          members: chunk,
          memberNames: memberNames,
          formattedName: `${groupLabel} (${memberNames.join(', ')})`,
          averageScore: parseFloat(avgScore.toFixed(1)),
        });
      }
    });

    return groups;
  }, [categoryParticipants, currentCategory]);

  // Sinkronisasi data Berita Acara dari Supabase secara langsung saat mount
  const handleSyncFromSupabase = async (showSuccessToast = false) => {
    if (!isSupabaseConfigured()) {
      if (showSuccessToast) {
        showToast('info', 'Supabase belum dikonfigurasi. Menggunakan penyimpanan lokal.');
      }
      return;
    }

    setIsSyncing(true);
    try {
      const remoteList = await fetchBeritaAcaraFromSupabase();
      if (remoteList && remoteList.length > 0) {
        setBeritaAcaraList(remoteList);
        saveBeritaAcaraList(remoteList);
        if (showSuccessToast) {
          showToast('success', `Berhasil memuat ${remoteList.length} Berita Acara dari database Supabase.`);
        }
      } else if (showSuccessToast) {
        showToast('info', 'Database Supabase aktif. Belum ada data berita acara tersimpan.');
      }
    } catch (err) {
      console.warn('Gagal memuat berita acara dari Supabase:', err);
      if (showSuccessToast) {
        showToast('error', 'Gagal menyinkronkan data dengan Supabase.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    handleSyncFromSupabase(false);
  }, []);

  // Load existing Berita Acara when selectedCabangId changes
  useEffect(() => {
    const existing = beritaAcaraList.find((b) => b.cabangId === selectedCabangId);
    if (existing) {
      setTanggalPenetapan(existing.tanggalPenetapan || new Date().toISOString().split('T')[0]);
      setJuriSatu(existing.juriSatu || existing.namaKetuaJuri || '');
      setJuriDua(existing.juriDua || existing.namaAnggotaJuri || (existing as any).namaSekretarisJuri || '');
      setCatatanJuri(existing.catatanJuri || existing.catatan || '');
      setStatus(existing.status);
      setJuara1(existing.pemenang.juara1 || { nama: '', kemantren: '', unitTpa: '', totalNilai: 0 });
      setJuara2(existing.pemenang.juara2 || { nama: '', kemantren: '', unitTpa: '', totalNilai: 0 });
      setJuara3(existing.pemenang.juara3 || { nama: '', kemantren: '', unitTpa: '', totalNilai: 0 });
      setHarapan1(existing.pemenang.harapan1 || { nama: '', kemantren: '', unitTpa: '', totalNilai: 0 });
      setHarapan2(existing.pemenang.harapan2 || { nama: '', kemantren: '', unitTpa: '', totalNilai: 0 });
    } else {
      // Reset form default
      setTanggalPenetapan(new Date().toISOString().split('T')[0]);
      setJuriSatu('');
      setJuriDua('');
      setCatatanJuri('');
      setStatus('Draft');
      setJuara1({ nama: '', kemantren: '', unitTpa: '', totalNilai: 0 });
      setJuara2({ nama: '', kemantren: '', unitTpa: '', totalNilai: 0 });
      setJuara3({ nama: '', kemantren: '', unitTpa: '', totalNilai: 0 });
      setHarapan1({ nama: '', kemantren: '', unitTpa: '', totalNilai: 0 });
      setHarapan2({ nama: '', kemantren: '', unitTpa: '', totalNilai: 0 });
    }
  }, [selectedCabangId, beritaAcaraList]);

  // Helper autofill from individual participant select
  const handleSelectIndividual = (
    slotKey: 'juara1' | 'juara2' | 'juara3' | 'harapan1' | 'harapan2',
    participantId: string
  ) => {
    if (!participantId) return;
    const p = participants.find((item) => item.id === participantId);
    if (!p) return;

    const kem = KEMANTREN_LIST.find((k) => k.id === p.kemantrenId);
    const kemName = kem ? kem.name : p.kemantrenId;

    const updatedSlot: WinnerSlot = {
      participantId: p.id,
      nama: p.fullName,
      kemantren: kemName,
      unitTpa: p.tpaUnitName,
      totalNilai: p.totalScore || 0,
    };

    if (slotKey === 'juara1') setJuara1(updatedSlot);
    if (slotKey === 'juara2') setJuara2(updatedSlot);
    if (slotKey === 'juara3') setJuara3(updatedSlot);
    if (slotKey === 'harapan1') setHarapan1(updatedSlot);
    if (slotKey === 'harapan2') setHarapan2(updatedSlot);
  };

  // Helper autofill from group/regu select (3 santri per regu)
  const handleSelectGroup = (
    slotKey: 'juara1' | 'juara2' | 'juara3' | 'harapan1' | 'harapan2',
    groupId: string
  ) => {
    if (!groupId) return;
    const g = categoryGroups.find((item) => item.groupId === groupId);
    if (!g) return;

    const updatedSlot: WinnerSlot = {
      nama: g.formattedName,
      kemantren: g.kemantrenName,
      unitTpa: g.unitTpa,
      totalNilai: g.averageScore,
      anggota: g.memberNames,
    };

    if (slotKey === 'juara1') setJuara1(updatedSlot);
    if (slotKey === 'juara2') setJuara2(updatedSlot);
    if (slotKey === 'juara3') setJuara3(updatedSlot);
    if (slotKey === 'harapan1') setHarapan1(updatedSlot);
    if (slotKey === 'harapan2') setHarapan2(updatedSlot);
  };

  // Simpan Berita Acara
  const handleSave = async (targetStatus: 'Draft' | 'Disahkan') => {
    if (targetStatus === 'Disahkan') {
      if (!juriSatu.trim()) {
        showToast('warning', 'Mohon isi nama Juri I sebelum mengesahkan berita acara.');
        return;
      }
      if (!juara1.nama || !juara1.kemantren) {
        showToast('warning', 'Minimal Juara I harus diisi nama dan asal kemantren sebelum disahkan.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const existingId = beritaAcaraList.find((b) => b.cabangId === currentCategory.id)?.id;
      const baId = existingId || `ba_${currentCategory.id}_${Date.now()}`;

      const newBa: BeritaAcaraKejuaraan = {
        id: baId,
        cabangId: currentCategory.id,
        cabangNama: currentCategory.name,
        namaCabang: currentCategory.name,
        jenjang: currentCategory.level as Jenjang,
        golongan: currentCategory.genderRequirement === 'L' ? 'Putra' : currentCategory.genderRequirement === 'P' ? 'Putri' : 'Campuran / Beregu',
        isCabangUtama: isCabangUtama,
        status: targetStatus,
        tanggalPenetapan: tanggalPenetapan,
        juriSatu: juriSatu.trim(),
        juriDua: juriDua.trim(),
        namaKetuaJuri: juriSatu.trim(),
        namaAnggotaJuri: juriDua.trim(),
        catatanJuri: catatanJuri.trim(),
        catatan: catatanJuri.trim(),
        pemenang: {
          juara1: juara1.nama.trim() ? juara1 : undefined,
          juara2: juara2.nama.trim() ? juara2 : undefined,
          juara3: juara3.nama.trim() ? juara3 : undefined,
          harapan1: harapan1.nama.trim() ? harapan1 : undefined,
          harapan2: harapan2.nama.trim() ? harapan2 : undefined,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedList = beritaAcaraList.filter((b) => b.cabangId !== currentCategory.id);
      updatedList.push(newBa);

      setBeritaAcaraList(updatedList);
      saveBeritaAcaraList(updatedList);
      setStatus(targetStatus);

      // Sinkronkan ke Supabase jika aktif
      let supabaseSuccess = true;
      let supabaseErrorMsg = '';
      if (isSupabaseConfigured()) {
        const syncRes = await upsertBeritaAcaraToSupabase(newBa);
        if (!syncRes.success) {
          supabaseSuccess = false;
          supabaseErrorMsg = syncRes.error || '';
        }
      }

      if (onDataChanged) {
        onDataChanged();
      }

      if (supabaseSuccess) {
        showToast(
          'success',
          targetStatus === 'Disahkan'
            ? `Berita Acara ${currentCategory.name} berhasil disahkan & disinkronkan ke Supabase!`
            : `Draft Berita Acara ${currentCategory.name} berhasil disimpan & disinkronkan ke Supabase.`
        );
      } else {
        showToast(
          'warning',
          `Data berhasil disimpan di perangkat lokal, namun Supabase belum tersimpan: ${supabaseErrorMsg}. Silakan cek kolom tabel Supabase.`
        );
      }
    } catch (err) {
      console.error('Gagal menyimpan berita acara:', err);
      showToast('error', 'Gagal menyimpan berita acara ke sistem.');
    } finally {
      setIsSaving(false);
    }
  };

  // Hapus Berita Acara
  const handleDelete = async () => {
    const existing = beritaAcaraList.find((b) => b.cabangId === currentCategory.id);
    if (!existing) {
      showToast('info', 'Belum ada data berita acara tersimpan untuk cabang ini.');
      return;
    }

    const confirmed = await showConfirmDialog(
      'Hapus Berita Acara?',
      `Apakah Anda yakin ingin menghapus Berita Acara cabang ${currentCategory.name}? Poin kejuaraan cabang ini akan ditarik dari Live Scoreboard.`
    );

    if (!confirmed) return;

    try {
      const updatedList = beritaAcaraList.filter((b) => b.cabangId !== currentCategory.id);
      setBeritaAcaraList(updatedList);
      saveBeritaAcaraList(updatedList);

      if (isSupabaseConfigured()) {
        await deleteBeritaAcaraFromSupabase(existing.id);
      }

      // Reset form
      setStatus('Draft');
      setJuara1({ nama: '', kemantren: '', unitTpa: '', totalNilai: 0 });
      setJuara2({ nama: '', kemantren: '', unitTpa: '', totalNilai: 0 });
      setJuara3({ nama: '', kemantren: '', unitTpa: '', totalNilai: 0 });
      setHarapan1({ nama: '', kemantren: '', unitTpa: '', totalNilai: 0 });
      setHarapan2({ nama: '', kemantren: '', unitTpa: '', totalNilai: 0 });

      if (onDataChanged) onDataChanged();
      showToast('success', 'Berita acara berhasil dihapus.');
    } catch (err) {
      showToast('error', 'Gagal menghapus berita acara.');
    }
  };

  // Filter Cabang Lomba untuk Sidebar / Navigasi Cepat
  const filteredCategories = useMemo(() => {
    return CATEGORIES_LIST.filter((cat) => {
      const matchJenjang = filterJenjang === 'ALL' || cat.level === filterJenjang;
      const matchQuery =
        !searchQuery.trim() ||
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchJenjang && matchQuery;
    });
  }, [filterJenjang, searchQuery]);

  // Statistik Berita Acara
  const stats = useMemo(() => {
    const totalCabang = CATEGORIES_LIST.length;
    const disahkan = beritaAcaraList.filter((b) => b.status === 'Disahkan').length;
    const draft = beritaAcaraList.filter((b) => b.status === 'Draft').length;
    const belum = totalCabang - disahkan - draft;
    return { totalCabang, disahkan, draft, belum };
  }, [beritaAcaraList]);

  // Handle Print Berita Acara
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Printable Sheet (Hanya Muncul Saat Print Berita Acara A4) */}
      <div className="hidden print:block font-serif text-black p-8 max-w-4xl mx-auto bg-white">
        {/* Kop Surat Resmi FASI XIII */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
          <img src={LOGO_BADKO_URL} alt="BADKO LPPTKA" className="h-16 w-auto object-contain" />
          <div className="text-center flex-1 px-4">
            <h3 className="text-xs font-bold font-sans tracking-wide uppercase">
              BADAN KOORDINASI LEMBAGA PENDIDIKAN DAN PENGEMBANGAN AL-QUR'AN
            </h3>
            <h3 className="text-xs font-bold font-sans tracking-wide uppercase">
              BADKO TKA-TPA KOTA YOGYAKARTA
            </h3>
            <h2 className="text-base font-black font-sans tracking-wider uppercase mt-0.5">
              FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII
            </h2>
            <p className="text-[10px] font-sans text-slate-700">
              Sekretariat: Kompleks Masjid Pangeran Diponegoro Balaikota Yogyakarta, Jl. Kenari No. 56
            </p>
          </div>
          <img src={LOGO_FASI_URL} alt="FASI XIII" className="h-16 w-auto object-contain" />
        </div>

        {/* Judul Berita Acara */}
        <div className="text-center mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider underline font-sans">
            BERITA ACARA PENETAPAN HASIL KEJUARAAN
          </h2>
          <div className="text-xs font-sans mt-0.5 font-medium">
            Cabang Lomba: {currentCategory.name} ({currentCategory.level}) &bull; Nomor: BA-FASI-XIII/{currentCategory.code}/{new Date(tanggalPenetapan).getFullYear()}
          </div>
        </div>

        {/* Narasi Pembuka */}
        <p className="text-xs leading-relaxed text-justify mb-4 font-sans">
          Pada hari ini, tanggal <strong>{tanggalPenetapan}</strong>, bertempat di lokasi pelaksanaan FASI XIII Kota Yogyakarta, Dewan Juri Cabang Lomba <strong>{currentCategory.name} (Jenjang {currentCategory.level})</strong> telah melaksanakan penilaian dan menetapkan para pemenang kejuaraan sebagai berikut:
        </p>

        {/* Tabel Pemenang */}
        <table className="w-full border-collapse border border-black text-xs font-sans mb-6">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-black px-2 py-1.5 text-center w-24">Peringkat</th>
              <th className="border border-black px-2 py-1.5 text-left">Nama Santri / Regu</th>
              <th className="border border-black px-2 py-1.5 text-left w-40">Rayon / Kemantren</th>
              <th className="border border-black px-2 py-1.5 text-left w-40">Unit TPA</th>
              <th className="border border-black px-2 py-1.5 text-center w-20">Total Nilai</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black px-2 py-1.5 font-bold text-center">Juara I</td>
              <td className="border border-black px-2 py-1.5 font-bold">{juara1.nama || '-'}</td>
              <td className="border border-black px-2 py-1.5">{juara1.kemantren || '-'}</td>
              <td className="border border-black px-2 py-1.5">{juara1.unitTpa || '-'}</td>
              <td className="border border-black px-2 py-1.5 font-mono font-bold text-center">{juara1.totalNilai || '-'}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1.5 font-bold text-center">Juara II</td>
              <td className="border border-black px-2 py-1.5 font-bold">{juara2.nama || '-'}</td>
              <td className="border border-black px-2 py-1.5">{juara2.kemantren || '-'}</td>
              <td className="border border-black px-2 py-1.5">{juara2.unitTpa || '-'}</td>
              <td className="border border-black px-2 py-1.5 font-mono font-bold text-center">{juara2.totalNilai || '-'}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1.5 font-bold text-center">Juara III</td>
              <td className="border border-black px-2 py-1.5 font-bold">{juara3.nama || '-'}</td>
              <td className="border border-black px-2 py-1.5">{juara3.kemantren || '-'}</td>
              <td className="border border-black px-2 py-1.5">{juara3.unitTpa || '-'}</td>
              <td className="border border-black px-2 py-1.5 font-mono font-bold text-center">{juara3.totalNilai || '-'}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1.5 text-center">Harapan I</td>
              <td className="border border-black px-2 py-1.5">{harapan1.nama || '-'}</td>
              <td className="border border-black px-2 py-1.5">{harapan1.kemantren || '-'}</td>
              <td className="border border-black px-2 py-1.5">{harapan1.unitTpa || '-'}</td>
              <td className="border border-black px-2 py-1.5 font-mono text-center">{harapan1.totalNilai || '-'}</td>
            </tr>
            <tr>
              <td className="border border-black px-2 py-1.5 text-center">Harapan II</td>
              <td className="border border-black px-2 py-1.5">{harapan2.nama || '-'}</td>
              <td className="border border-black px-2 py-1.5">{harapan2.kemantren || '-'}</td>
              <td className="border border-black px-2 py-1.5">{harapan2.unitTpa || '-'}</td>
              <td className="border border-black px-2 py-1.5 font-mono text-center">{harapan2.totalNilai || '-'}</td>
            </tr>
          </tbody>
        </table>

        {/* Catatan */}
        {catatanJuri && (
          <div className="text-xs font-sans mb-6 p-2 border border-slate-300 rounded">
            <strong>Catatan Dewan Juri:</strong> {catatanJuri}
          </div>
        )}

        {/* Narasi Penutup */}
        <p className="text-xs leading-relaxed text-justify mb-8 font-sans">
          Demikian Berita Acara ini dibuat dengan sebenarnya dan ditandatangani oleh Dewan Juri untuk dipergunakan sebagaimana mestinya. Keputusan Dewan Juri bersifat mutlak dan tidak dapat diganggu gugat.
        </p>

        {/* Tanda Tangan Juri I & Juri II */}
        <div className="grid grid-cols-2 gap-8 text-center text-xs font-sans mt-8">
          <div>
            <div className="font-bold text-slate-800">Dewan Juri I,</div>
            <div className="h-20 flex items-end justify-center">
              <span className="text-[10px] text-slate-400 italic">( Tanda Tangan )</span>
            </div>
            <div className="font-bold underline uppercase tracking-wide mt-2">
              {juriSatu || '( ........................................ )'}
            </div>
          </div>

          <div>
            <div className="font-bold text-slate-800">Dewan Juri II,</div>
            <div className="h-20 flex items-end justify-center">
              <span className="text-[10px] text-slate-400 italic">( Tanda Tangan )</span>
            </div>
            <div className="font-bold underline uppercase tracking-wide mt-2">
              {juriDua || '( ........................................ )'}
            </div>
          </div>
        </div>
      </div>

      {/* 1. Header Banner Superadmin (Screen Only) */}
      <div className="print:hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 rounded-2xl p-6 text-white shadow-sm border border-emerald-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-emerald-950 uppercase tracking-wider">
                Superadmin Official
              </span>
              <span className="text-xs text-emerald-300">Penetapan Pemenang FASI XIII</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 flex items-center gap-2">
              <FileText className="w-6 h-6 text-amber-400 shrink-0" />
              <span>Input Berita Acara Kejuaraan</span>
            </h2>
            <p className="text-xs text-emerald-200 mt-1 max-w-2xl">
              Input penetapan Juara I s.d Harapan II berdasarkan formulir Berita Acara resmi dari Dewan Juri.
              Status <strong>Disahkan</strong> secara otomatis mengkalkulasi poin juara umum dan klasemen live.
            </p>
          </div>

          {/* Quick Stats Grid & Sync Button */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSyncFromSupabase(true)}
              disabled={isSyncing}
              title="Sinkronkan data dari Supabase"
              className="px-3 py-2 bg-emerald-900/80 hover:bg-emerald-800 rounded-xl border border-emerald-700 text-xs font-bold text-emerald-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sinkron...' : 'Sinkron Supabase'}</span>
            </button>

            <div className="flex items-center gap-2 bg-emerald-900/60 p-2.5 rounded-xl border border-emerald-700/60 text-center">
              <div className="px-3 py-1 bg-emerald-800/80 rounded-lg">
                <div className="text-lg font-black text-white">{stats.disahkan}</div>
                <div className="text-[10px] text-emerald-300 font-semibold uppercase">Disahkan</div>
              </div>
              <div className="px-3 py-1 bg-amber-950/60 rounded-lg border border-amber-500/30">
                <div className="text-lg font-black text-amber-300">{stats.draft}</div>
                <div className="text-[10px] text-amber-300/80 font-semibold uppercase">Draft</div>
              </div>
              <div className="px-3 py-1 bg-slate-800/60 rounded-lg">
                <div className="text-lg font-black text-slate-300">{stats.belum}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Belum Diisi</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Layout (Screen Only) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
        {/* Left Column: Category Selector List (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-700" />
                <span>Pilih Cabang Lomba</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {filteredCategories.length} / {CATEGORIES_LIST.length}
              </span>
            </div>

            {/* Filter Jenjang Pills */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              {(['ALL', 'TKA', 'TPA', 'TQA'] as const).map((jenjang) => (
                <button
                  key={jenjang}
                  onClick={() => setFilterJenjang(jenjang)}
                  className={`py-1.5 rounded-lg transition-colors cursor-pointer text-center ${
                    filterJenjang === jenjang
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {jenjang === 'ALL' ? 'Semua' : jenjang}
                </button>
              ))}
            </div>

            {/* Search Cabang */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari cabang lomba..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-slate-50"
              />
            </div>

            {/* Cabang List */}
            <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredCategories.map((cat) => {
                const ba = beritaAcaraList.find((b) => b.cabangId === cat.id);
                const isSelected = selectedCabangId === cat.id;
                const isUtama = checkIsCabangUtama(cat.name, cat.level as Jenjang);

                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCabangId(cat.id)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-emerald-50/90 border-emerald-700 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-slate-200 text-slate-700 font-mono">
                          {cat.code}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {cat.level}
                        </span>
                        {cat.isGroup && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            Beregu ({cat.groupMemberCount || 3})
                          </span>
                        )}
                        {isUtama && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                            Utama (7-5-3)
                          </span>
                        )}
                      </div>
                      <div className={`text-xs font-bold mt-1 truncate ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                        {cat.name}
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {ba?.status === 'Disahkan' ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Disahkan</span>
                        </span>
                      ) : ba?.status === 'Draft' ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <span>Draft</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Belum diisi</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Form Berita Acara (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header Form */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-800 text-white rounded text-[11px] font-bold">
                    {currentCategory.code}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[11px] font-bold">
                    Jenjang {currentCategory.level}
                  </span>
                  {currentCategory.isGroup ? (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 rounded text-[11px] font-bold flex items-center gap-1">
                      <Users className="w-3 h-3 text-purple-700" />
                      <span>Cabang Beregu ({currentCategory.groupMemberCount || 3} Santri / Regu)</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-sky-100 text-sky-900 border border-sky-300 rounded text-[11px] font-bold flex items-center gap-1">
                      <User className="w-3 h-3 text-sky-700" />
                      <span>Cabang Individu (Perorangan)</span>
                    </span>
                  )}
                  {isCabangUtama && (
                    <span className="px-2 py-0.5 bg-amber-400 text-emerald-950 rounded text-[11px] font-extrabold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-emerald-950" />
                      <span>Cabang Utama (Poin 7 - 5 - 3)</span>
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {currentCategory.name}
                </h3>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    status === 'Disahkan'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}
                >
                  Status: {status}
                </span>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="p-5 space-y-6">
              {/* Header Details (Dewan Juri I, Juri II & Tanggal) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50/80 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tanggal Penetapan
                  </label>
                  <input
                    type="date"
                    value={tanggalPenetapan}
                    onChange={(e) => setTanggalPenetapan(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Juri I <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nama lengkap Juri I (Contoh: Ust. H. Ahmad Fauzi, S.Pd.I)"
                    value={juriSatu}
                    onChange={(e) => setJuriSatu(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Juri II (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Nama lengkap Juri II (Contoh: Ustz. Siti Maryam, M.Pd)"
                    value={juriDua}
                    onChange={(e) => setJuriDua(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Quick Guidance for Group vs Individual */}
              {isGroupCategory ? (
                <div className="p-3 bg-purple-50/80 rounded-xl border border-purple-200 text-xs">
                  <div className="flex items-center gap-1.5 text-purple-950 font-bold mb-1">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Lomba Kategori Beregu (3 Orang per Regu):</span>
                  </div>
                  <p className="text-[11px] text-purple-800 leading-relaxed">
                    Setiap rayon mengirimkan 1 atau beberapa regu (masing-masing 3 santri). Anda dapat memilih langsung nama Regu dari menu dropdown di bawah, yang akan otomatis mengisi nama regu beserta nama ke-3 santri anggotanya, asal rayon, dan unit TPA.
                  </p>
                </div>
              ) : (
                categoryParticipants.length > 0 && (
                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/60 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-bold mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Autofill dari Peserta Terdaftar ({categoryParticipants.length} Santri):</span>
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      Gunakan pemilih di bawah masing-masing baris juara untuk mengisi otomatis nama santri, rayon, dan unit TPA.
                    </p>
                  </div>
                )
              )}

              {/* 5 Winner Slots Form */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Daftar Pemenang Kejuaraan (Juara I s.d Harapan II)</span>
                </h4>

                {/* SLOT 1: JUARA 1 */}
                <WinnerRow
                  label="Juara I"
                  badgeColor="bg-amber-400 text-emerald-950 border-amber-500"
                  points={isCabangUtama ? 7 : 5}
                  slot={juara1}
                  onChange={setJuara1}
                  isGroupCategory={isGroupCategory}
                  availableParticipants={categoryParticipants}
                  availableGroups={categoryGroups}
                  onAutofillIndividual={(pid) => handleSelectIndividual('juara1', pid)}
                  onAutofillGroup={(gid) => handleSelectGroup('juara1', gid)}
                />

                {/* SLOT 2: JUARA 2 */}
                <WinnerRow
                  label="Juara II"
                  badgeColor="bg-slate-300 text-slate-900 border-slate-400"
                  points={isCabangUtama ? 5 : 3}
                  slot={juara2}
                  onChange={setJuara2}
                  isGroupCategory={isGroupCategory}
                  availableParticipants={categoryParticipants}
                  availableGroups={categoryGroups}
                  onAutofillIndividual={(pid) => handleSelectIndividual('juara2', pid)}
                  onAutofillGroup={(gid) => handleSelectGroup('juara2', gid)}
                />

                {/* SLOT 3: JUARA 3 */}
                <WinnerRow
                  label="Juara III"
                  badgeColor="bg-amber-700 text-white border-amber-800"
                  points={isCabangUtama ? 3 : 1}
                  slot={juara3}
                  onChange={setJuara3}
                  isGroupCategory={isGroupCategory}
                  availableParticipants={categoryParticipants}
                  availableGroups={categoryGroups}
                  onAutofillIndividual={(pid) => handleSelectIndividual('juara3', pid)}
                  onAutofillGroup={(gid) => handleSelectGroup('juara3', gid)}
                />

                {/* SLOT 4: HARAPAN 1 */}
                <WinnerRow
                  label="Juara Harapan I"
                  badgeColor="bg-slate-100 text-slate-700 border-slate-300"
                  points={0}
                  slot={harapan1}
                  onChange={setHarapan1}
                  isGroupCategory={isGroupCategory}
                  availableParticipants={categoryParticipants}
                  availableGroups={categoryGroups}
                  onAutofillIndividual={(pid) => handleSelectIndividual('harapan1', pid)}
                  onAutofillGroup={(gid) => handleSelectGroup('harapan1', gid)}
                />

                {/* SLOT 5: HARAPAN 2 */}
                <WinnerRow
                  label="Juara Harapan II"
                  badgeColor="bg-slate-100 text-slate-700 border-slate-300"
                  points={0}
                  slot={harapan2}
                  onChange={setHarapan2}
                  isGroupCategory={isGroupCategory}
                  availableParticipants={categoryParticipants}
                  availableGroups={categoryGroups}
                  onAutofillIndividual={(pid) => handleSelectIndividual('harapan2', pid)}
                  onAutofillGroup={(gid) => handleSelectGroup('harapan2', gid)}
                />
              </div>

              {/* Catatan Juri */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan Dewan Juri (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan khusus dewan juri terkait pelaksanaan lomba atau evaluasi maqra..."
                  value={catatanJuri}
                  onChange={(e) => setCatatanJuri(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Berita Acara</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Berita Acara A4</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSave('Draft')}
                    className="px-4 py-2 text-xs font-bold text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    Simpan Draft
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSave('Disahkan')}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Sahkan & Masuk Klasemen</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface WinnerRowProps {
  label: string;
  badgeColor: string;
  points: number;
  slot: WinnerSlot;
  onChange: (updated: WinnerSlot) => void;
  isGroupCategory: boolean;
  availableParticipants: Participant[];
  availableGroups: CategoryGroup[];
  onAutofillIndividual: (participantId: string) => void;
  onAutofillGroup: (groupId: string) => void;
}

const WinnerRow: React.FC<WinnerRowProps> = ({
  label,
  badgeColor,
  points,
  slot,
  onChange,
  isGroupCategory,
  availableParticipants,
  availableGroups,
  onAutofillIndividual,
  onAutofillGroup,
}) => {
  return (
    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${badgeColor}`}>
            {label}
          </span>
          <span className="text-[11px] font-bold text-slate-500">
            {points > 0 ? `+${points} Poin Klasemen` : '0 Poin (Tidak dihitung)'}
          </span>
        </div>

        {/* Quick Autofill Dropdown (Regu 3 Santri vs Individu) */}
        {isGroupCategory ? (
          availableGroups.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-purple-700 font-bold">Pilih Regu (3 Santri):</span>
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    onAutofillGroup(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="text-[11px] py-1 px-2 rounded-lg border border-purple-200 bg-white text-purple-900 max-w-[280px]"
              >
                <option value="">-- Pilih Regu Terdaftar --</option>
                {availableGroups.map((g) => (
                  <option key={g.groupId} value={g.groupId}>
                    Rayon {g.kemantrenName} ({g.memberNames.join(', ')})
                  </option>
                ))}
              </select>
            </div>
          )
        ) : (
          availableParticipants.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-500 font-bold">Pilih Santri:</span>
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    onAutofillIndividual(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="text-[11px] py-1 px-2 rounded-lg border border-slate-200 bg-white text-slate-700 max-w-[220px]"
              >
                <option value="">-- Pilih dari pendaftar --</option>
                {availableParticipants.map((p) => {
                  const kem = KEMANTREN_LIST.find((k) => k.id === p.kemantrenId);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.fullName} (Rayon {kem ? kem.name : p.kemantrenId})
                    </option>
                  );
                })}
              </select>
            </div>
          )
        )}
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
        {/* Nama Santri / Regu */}
        <div className="sm:col-span-4">
          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
            {isGroupCategory ? 'Nama Regu & Anggota (3 Santri)' : 'Nama Santri Lengkap'}
          </label>
          <input
            type="text"
            placeholder={isGroupCategory ? 'Contoh: Regu Rayon Danurejan (Ahmad, Budi, Citra)' : 'Nama lengkap santri'}
            value={slot.nama}
            onChange={(e) => onChange({ ...slot, nama: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
          />
        </div>

        {/* Asal Kemantren / Rayon */}
        <div className="sm:col-span-3">
          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Rayon</label>
          <select
            value={slot.kemantren}
            onChange={(e) => onChange({ ...slot, kemantren: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
          >
            <option value="">-- Pilih Rayon --</option>
            {KEMANTREN_LIST.map((k) => (
              <option key={k.id} value={k.name}>
                {k.name}
              </option>
            ))}
          </select>
        </div>

        {/* Asal Unit TPA */}
        <div className="sm:col-span-3">
          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Asal Unit TPA</label>
          <input
            type="text"
            placeholder="Contoh: TPA Al-Ikhlas"
            value={slot.unitTpa}
            onChange={(e) => onChange({ ...slot, unitTpa: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
          />
        </div>

        {/* Total Nilai */}
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Total Nilai</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="300"
            placeholder="0"
            value={slot.totalNilai || ''}
            onChange={(e) => onChange({ ...slot, totalNilai: parseFloat(e.target.value) || 0 })}
            className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white rounded-lg border border-slate-200 focus:ring-1 focus:ring-emerald-700 focus:outline-none text-right"
          />
        </div>
      </div>

      {/* Helper Anggota Regu (Jika ada anggota yang terpilih) */}
      {isGroupCategory && slot.anggota && slot.anggota.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-purple-900">
          <span className="font-bold text-slate-500">Anggota Regu ({slot.anggota.length} Orang):</span>
          {slot.anggota.map((m, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-purple-100 border border-purple-200 rounded-md font-medium">
              {idx + 1}. {m}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
