import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Plus,
  Upload,
  FileSpreadsheet,
  Search,
  Edit2,
  Trash2,
  Phone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Filter,
  X,
  Database,
  ArrowUpDown,
  Check,
  Info
} from 'lucide-react';
import { MasterTpa, UserSession, Kemantren } from '../../types/fasi';
import { KEMANTREN_LIST, normalizeRayonToKemantren } from '../../data/fasiMasterData';
import {
  getStoredMasterTpa,
  persistMasterTpa,
  removeMasterTpa,
  bulkPersistMasterTpa,
  syncMasterTpaFromCloud,
  formatTpaName,
} from '../../utils/storage';
import { isSupabaseConfigured } from '../../lib/supabase';
import { showToast, showConfirmDialog, showSuccessAlert, showErrorAlert } from '../../utils/sweetalert';
import { exportMasterTpaToExcel } from '../../utils/excelExport';

interface MasterTpaAdminProps {
  session: UserSession;
}

export const MasterTpaAdmin: React.FC<MasterTpaAdminProps> = ({ session }) => {
  const isSuperAdmin = session.role === 'super_admin';
  const currentKemantrenId = session.role === 'kemantren_admin' ? session.kemantrenId : undefined;

  const [tpaList, setTpaList] = useState<MasterTpa[]>(() => getStoredMasterTpa());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRayonFilter, setSelectedRayonFilter] = useState<string>(currentKemantrenId || 'ALL');
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal State Tambah / Edit Single
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTpa, setEditingTpa] = useState<MasterTpa | null>(null);
  const [formNamaTpa, setFormNamaTpa] = useState('');
  const [formNamaDirektur, setFormNamaDirektur] = useState('');
  const [formKemantrenId, setFormKemantrenId] = useState(currentKemantrenId || 'kem-6');
  const [formKontakDirektur, setFormKontakDirektur] = useState('');
  const [formAlamat, setFormAlamat] = useState('');

  // Modal State Impor Massal / Copy-Paste
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [pasteRawText, setPasteRawText] = useState('');
  const [parsedImportData, setParsedImportData] = useState<Array<{
    namaTpa: string;
    rawNamaTpa: string;
    isAutoPrefixed: boolean;
    namaDirektur: string;
    rawRayon: string;
    matchedKemantren?: Kemantren;
    kontakDirektur?: string;
    isValid: boolean;
  }>>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Listen to live update event
  useEffect(() => {
    const handleUpdate = () => {
      setTpaList(getStoredMasterTpa());
    };
    window.addEventListener('fasi_master_tpa_updated', handleUpdate);
    return () => window.removeEventListener('fasi_master_tpa_updated', handleUpdate);
  }, []);

  // Sync dari Supabase saat awal mount (murni membaca dari tabel master_tpa Supabase)
  useEffect(() => {
    if (isSupabaseConfigured()) {
      setIsSyncing(true);
      syncMasterTpaFromCloud()
        .then((cloudData) => {
          setTpaList(cloudData);
        })
        .catch((err) => {
          console.warn('Gagal sinkronisasi data master TPA saat inisialisasi:', err);
        })
        .finally(() => {
          setIsSyncing(false);
        });
    }
  }, []);

  // Filter Data TPA
  const filteredTpaList = useMemo(() => {
    return tpaList.filter((t) => {
      // Filter Rayon
      if (selectedRayonFilter !== 'ALL' && t.kemantrenId !== selectedRayonFilter) {
        return false;
      }
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = t.namaTpa.toLowerCase().includes(q);
        const matchDir = t.namaDirektur.toLowerCase().includes(q);
        const matchRayon = (t.rayonName || '').toLowerCase().includes(q);
        if (!matchName && !matchDir && !matchRayon) return false;
      }
      return true;
    });
  }, [tpaList, selectedRayonFilter, searchTerm]);

  // Statistik
  const stats = useMemo(() => {
    const total = tpaList.length;
    const rayonWithTpa = new Set(tpaList.map((t) => t.kemantrenId).filter(Boolean)).size;
    const currentRayonCount = currentKemantrenId
      ? tpaList.filter((t) => t.kemantrenId === currentKemantrenId).length
      : 0;
    return { total, rayonWithTpa, currentRayonCount };
  }, [tpaList, currentKemantrenId]);

  // Buka Modal Tambah
  const handleOpenAddModal = () => {
    setEditingTpa(null);
    setFormNamaTpa('');
    setFormNamaDirektur('');
    setFormKemantrenId(currentKemantrenId || 'kem-6');
    setFormKontakDirektur('');
    setFormAlamat('');
    setIsModalOpen(true);
  };

  // Buka Modal Edit
  const handleOpenEditModal = (tpa: MasterTpa) => {
    setEditingTpa(tpa);
    setFormNamaTpa(tpa.namaTpa);
    setFormNamaDirektur(tpa.namaDirektur);
    setFormKemantrenId(tpa.kemantrenId || currentKemantrenId || 'kem-6');
    setFormKontakDirektur(tpa.kontakDirektur || '');
    setFormAlamat(tpa.alamat || '');
    setIsModalOpen(true);
  };

  // Simpan Single TPA (Langsung masuk ke server Supabase)
  const handleSaveTpa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNamaTpa.trim()) {
      showErrorAlert('Gagal', 'Nama Unit TPA wajib diisi.');
      return;
    }

    const matchedKemantren = KEMANTREN_LIST.find((k) => k.id === formKemantrenId);
    const targetRayonName = matchedKemantren?.name || 'Yogyakarta';
    const formattedNamaTpa = formatTpaName(formNamaTpa);

    const tpaData: MasterTpa = {
      id: editingTpa ? editingTpa.id : `tpa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      namaTpa: formattedNamaTpa,
      namaDirektur: formNamaDirektur.trim(),
      kemantrenId: formKemantrenId,
      rayonName: targetRayonName,
      kontakDirektur: formKontakDirektur.trim() || undefined,
      alamat: formAlamat.trim() || undefined,
    };

    setIsSaving(true);
    try {
      await persistMasterTpa(tpaData);
      setIsModalOpen(false);
      showToast('success', `Data ${tpaData.namaTpa} berhasil disimpan ke server Supabase!`);
    } catch (err: any) {
      showErrorAlert('Gagal Menyimpan ke Supabase', err?.message || 'Terjadi kendala saat menyimpan ke database.');
    } finally {
      setIsSaving(false);
    }
  };

  // Hapus TPA (Langsung hapus dari server Supabase)
  const handleDeleteTpa = async (tpa: MasterTpa) => {
    const confirmed = await showConfirmDialog(
      'Hapus Unit TPA?',
      `Yakin ingin menghapus data "${tpa.namaTpa}" dari database server Supabase?`,
      'Ya, Hapus TPA',
      '#dc2626'
    );

    if (confirmed) {
      try {
        await removeMasterTpa(tpa.id);
        showToast('success', `Unit TPA ${tpa.namaTpa} telah dihapus dari Supabase.`);
      } catch (err: any) {
        showErrorAlert('Gagal Menghapus dari Supabase', err?.message || 'Terjadi kendala saat menghapus data.');
      }
    }
  };

  // Sync Manual dari Supabase
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const data = await syncMasterTpaFromCloud();
      setTpaList(data);
      showToast('success', `Sinkronisasi berhasil! ${data.length} unit TPA tersinkron.`);
    } catch (err: any) {
      showErrorAlert('Gagal Sinkronisasi', err?.message || 'Periksa koneksi database.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Parsing Text Copy-Paste untuk Impor Massal
  // Format yang didukung:
  // Kolom: Nama TPA [TAB / KOMA / SEMIKOLON] Nama Direktur [TAB / KOMA] Kemantren/Rayon (Bisa Uppercase!)
  const handleParsePasteText = (text: string) => {
    setPasteRawText(text);
    if (!text.trim()) {
      setParsedImportData([]);
      return;
    }

    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsed = lines.map((line) => {
      // Split dengan tab atau pemisah koma/pipe jika tidak ada tab
      let cols: string[] = [];
      if (line.includes('\t')) {
        cols = line.split('\t').map((c) => c.trim());
      } else if (line.includes(';')) {
        cols = line.split(';').map((c) => c.trim());
      } else if (line.includes('|')) {
        cols = line.split('|').map((c) => c.trim());
      } else if (line.includes(',')) {
        cols = line.split(',').map((c) => c.trim());
      } else {
        cols = [line];
      }

      // Kolom 1: Nama TPA (Auto-format: jika tidak ada awalan, ditambahkan "TPA ")
      const rawNamaTpa = (cols[0] || '').trim();
      const namaTpa = formatTpaName(rawNamaTpa);
      const isAutoPrefixed = Boolean(rawNamaTpa && !rawNamaTpa.match(/^(tpa|tka|tpq|tqa)\b[\s\-\.]*/i));

      // Kolom 2: Nama Direktur
      const namaDirektur = (cols[1] || '').trim();
      // Kolom 3: Kemantren / Rayon (bisa Uppercase seperti "KOTAGEDE", "DANUREJAN", dll.)
      const rawRayon = cols[2] || (currentKemantrenId ? (KEMANTREN_LIST.find((k) => k.id === currentKemantrenId)?.name || '') : '');
      // Kolom 4 (opsional): Kontak Direktur
      const kontakDirektur = (cols[3] || '').trim();

      // Cocokkan rayon secara cerdas & case-insensitive
      const matchedKem = normalizeRayonToKemantren(rawRayon) || (currentKemantrenId ? KEMANTREN_LIST.find((k) => k.id === currentKemantrenId) : undefined);

      const isValid = Boolean(namaTpa.trim() && matchedKem);

      return {
        namaTpa,
        rawNamaTpa,
        isAutoPrefixed,
        namaDirektur,
        rawRayon,
        matchedKemantren: matchedKem,
        kontakDirektur,
        isValid,
      };
    });

    setParsedImportData(parsed);
  };

  // Eksekusi Impor Massal
  const handleExecuteImport = async () => {
    const validItems = parsedImportData.filter((i) => i.isValid);
    if (validItems.length === 0) {
      showErrorAlert('Tidak Ada Data Valid', 'Pastikan nama TPA terisi dan nama Rayon cocok dengan 14 Rayon di Kota Yogyakarta.');
      return;
    }

    setIsImporting(true);
    try {
      const newTpaList: MasterTpa[] = validItems.map((item, index) => ({
        id: `tpa-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
        namaTpa: formatTpaName(item.namaTpa),
        namaDirektur: item.namaDirektur.trim(),
        kemantrenId: item.matchedKemantren!.id,
        rayonName: item.matchedKemantren!.name,
        kontakDirektur: item.kontakDirektur?.trim() || undefined,
      }));

      await bulkPersistMasterTpa(newTpaList);
      setIsImportModalOpen(false);
      setPasteRawText('');
      setParsedImportData([]);

      showSuccessAlert(
        'Impor Berhasil!',
        `Sebanyak ${newTpaList.length} unit TPA telah berhasil dimasukkan ke Master Data & disinkronkan ke Supabase!`
      );
    } catch (err: any) {
      showErrorAlert('Gagal Impor', err?.message || 'Terjadi kendala saat menyimpan data.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportCsv = () => {
    const filename = isSuperAdmin
      ? 'Master_Data_TPA_Kota_Yogyakarta'
      : `Master_Data_TPA_Rayon_${KEMANTREN_LIST.find((k) => k.id === currentKemantrenId)?.name || 'Rayon'}`;
    exportMasterTpaToExcel(filteredTpaList, filename);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 rounded-3xl p-6 sm:p-7 text-white shadow-lg border border-emerald-800 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-emerald-950 uppercase tracking-wider shadow-xs">
                MASTER DATA LEMBAGA
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-800/80 text-emerald-200 border border-emerald-700/60">
                14 Rayon se-Kota Yogyakarta
              </span>
              {isSupabaseConfigured() && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-600/40">
                  <Database className="w-3 h-3 text-emerald-400" />
                  Supabase Cloud Aktif
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-amber-400" />
              Master Data Unit TKA / TPA
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200 leading-relaxed">
              Standardisasi nama lembaga TKA/TPA se-Kota Yogyakarta. Data ini otomatis muncul sebagai rekomendasi saat input pendaftaran santri agar nama unit dan pembentukan regu selalu seragam.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 font-bold text-xs rounded-xl shadow-xs border border-emerald-600/50 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Sinkronisasi ulang dengan Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isSyncing ? 'Sinkron...' : 'Sync Supabase'}</span>
            </button>

            {isSuperAdmin && (
              <button
                onClick={() => {
                  setPasteRawText('');
                  setParsedImportData([]);
                  setIsImportModalOpen(true);
                }}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Salin-tempel daftar TPA dari Excel atau teks"
              >
                <Upload className="w-4 h-4 text-teal-200" />
                <span>Impor / Tempel Data</span>
              </button>
            )}

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Unit TPA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Unit TPA</div>
            <div className="text-xl font-black text-slate-900">{stats.total} Lembaga</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cakupan Wilayah</div>
            <div className="text-xl font-black text-emerald-800">{stats.rayonWithTpa} dari 14 Rayon</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {currentKemantrenId ? 'TPA di Rayon Anda' : 'Tercakup Dalam Pencarian'}
            </div>
            <div className="text-xl font-black text-slate-900">
              {currentKemantrenId ? stats.currentRayonCount : filteredTpaList.length} Unit
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama TPA, direktur, atau rayon..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Filter Rayon */}
            {isSuperAdmin ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
                <select
                  value={selectedRayonFilter}
                  onChange={(e) => setSelectedRayonFilter(e.target.value)}
                  className="w-full sm:w-60 py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Rayon (14 Wilayah)</option>
                  {KEMANTREN_LIST.map((k) => (
                    <option key={k.id} value={k.id}>
                      Rayon {k.name} ({k.code})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="px-3 py-2 text-xs bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl font-medium">
                Wilayah: Rayon {KEMANTREN_LIST.find((k) => k.id === currentKemantrenId)?.name}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCsv}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Unduh data TPA ke format CSV / Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabel Data TPA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-3.5 text-center w-12">No</th>
                <th className="py-3 px-3.5">Nama Unit TKA / TPA</th>
                <th className="py-3 px-3.5">Nama Direktur / Kepala TPA</th>
                <th className="py-3 px-3.5">Rayon / Kemantren</th>
                <th className="py-3 px-3.5">No. Kontak / WA</th>
                <th className="py-3 px-3.5 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTpaList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Belum ada data TPA yang cocok</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Klik "+ Tambah Unit TPA" atau "Impor / Tempel Data" untuk mengisi data master.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTpaList.map((tpa, idx) => {
                  const kem = KEMANTREN_LIST.find((k) => k.id === tpa.kemantrenId);
                  const canEdit = isSuperAdmin || tpa.kemantrenId === currentKemantrenId;

                  return (
                    <tr key={tpa.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{tpa.namaTpa}</span>
                        </div>
                        {tpa.alamat && (
                          <div className="text-[10px] text-slate-400 font-normal pl-5 truncate max-w-xs">
                            {tpa.alamat}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 font-medium text-slate-800">
                        {tpa.namaDirektur || <span className="text-slate-400 italic">Belum dicatat</span>}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Rayon {kem?.name || tpa.rayonName || 'Yogyakarta'} ({kem?.code || '-'})
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-600">
                        {tpa.kontakDirektur ? (
                          <a
                            href={`https://wa.me/${tpa.kontakDirektur.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 hover:underline"
                            title="Hubungi via WhatsApp"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{tpa.kontakDirektur}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {canEdit ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(tpa)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit data TPA"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTpa(tpa)}
                              className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus data TPA"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Hanya Lihat</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Tambah / Edit TPA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {editingTpa ? 'Edit Data Unit TPA' : 'Tambah Unit TPA Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Standardisasi data lembaga se-Kota Yogyakarta</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTpa} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Unit TKA / TPA <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formNamaTpa}
                  onChange={(e) => setFormNamaTpa(e.target.value)}
                  placeholder="Contoh: Baitul Makmur atau TPA Baitul Makmur"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
                <p className="text-[10px] text-emerald-700 mt-1">
                  💡 <em>Auto-Format Aktif:</em> Cukup ketik nama lembaga (misal <strong>Baitul Makmur</strong>), sistem otomatis menyimpannya dengan awalan <strong>TPA</strong>.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Direktur / Kepala TPA
                </label>
                <input
                  type="text"
                  value={formNamaDirektur}
                  onChange={(e) => setFormNamaDirektur(e.target.value)}
                  placeholder="Contoh: Ust. Danu Suryo"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Wilayah Rayon / Kemantren <span className="text-rose-500">*</span>
                </label>
                {isSuperAdmin ? (
                  <select
                    value={formKemantrenId}
                    onChange={(e) => setFormKemantrenId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    {KEMANTREN_LIST.map((k) => (
                      <option key={k.id} value={k.id}>
                        Rayon {k.name} ({k.code})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-semibold">
                    Rayon {KEMANTREN_LIST.find((k) => k.id === currentKemantrenId)?.name}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  No. Telepon / WhatsApp Direktur (Opsional)
                </label>
                <input
                  type="text"
                  value={formKontakDirektur}
                  onChange={(e) => setFormKontakDirektur(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alamat / Keterangan Lembaga (Opsional)
                </label>
                <input
                  type="text"
                  value={formAlamat}
                  onChange={(e) => setFormAlamat(e.target.value)}
                  placeholder="Contoh: Jl. Gambiran No. 12, Pandean"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke Supabase...</span>
                    </>
                  ) : (
                    <span>Simpan Data TPA</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Salin-Tempel / Impor Massal dari Teks/Excel */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Salin-Tempel / Impor Data Master TPA
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Mendukung nama Rayon huruf besar (UPPERCASE) otomatis terbaca.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 text-xs pr-1">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl text-teal-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <Info className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>Petunjuk Format Salin Data:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Anda bisa menyalin baris kolom langsung dari <strong>Excel / Google Sheets</strong> atau teks:
                </p>
                <div className="font-mono text-[10px] bg-white p-2 rounded-xl border border-teal-200 text-slate-800 overflow-x-auto">
                  Baitul Makmur [Tab] Ust. Hasan Basri [Tab] KOTAGEDE<br />
                  Al-Ikhlas [Tab] Ustz. Siti Maryam [Tab] DANUREJAN<br />
                  TKA Mutiara [Tab] Ust. Budi [Tab] UMBULHARJO
                </div>
                <div className="space-y-0.5 text-[10px] text-teal-900">
                  <p>✨ <strong>Auto-Format TPA:</strong> Nama tanpa awalan (misal: <em>Baitul Makmur</em>) otomatis diubah menjadi <strong>TPA Baitul Makmur</strong>. Jika sudah ada awalan TPA/TKA/TPQ, tidak akan didobelkan.</p>
                  <p>✨ <strong>Auto-Rayon:</strong> Nama Rayon UPPERCASE (misal: <em>KOTAGEDE</em>, <em>DANUREJAN</em>) otomatis dikenali.</p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tempelkan Baris Data Di Sini:
                </label>
                <textarea
                  rows={6}
                  value={pasteRawText}
                  onChange={(e) => handleParsePasteText(e.target.value)}
                  placeholder="Tempelkan data di sini (Ctrl+V)..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:bg-white focus:outline-none font-mono"
                />
              </div>

              {/* Preview Hasil Parsing */}
              {parsedImportData.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Pratinjau Hasil Parsing ({parsedImportData.filter((p) => p.isValid).length} Valid dari {parsedImportData.length} baris)
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                        <tr>
                          <th className="py-2 px-2.5">Nama TPA</th>
                          <th className="py-2 px-2.5">Nama Direktur</th>
                          <th className="py-2 px-2.5">Rayon Asli</th>
                          <th className="py-2 px-2.5">Hasil Pemetaan Rayon</th>
                          <th className="py-2 px-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedImportData.map((item, idx) => (
                          <tr key={idx} className={item.isValid ? 'bg-white' : 'bg-rose-50/50'}>
                            <td className="py-1.5 px-2.5 font-bold text-slate-800">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{item.namaTpa || <span className="text-rose-500 italic">Kosong</span>}</span>
                                {item.isAutoPrefixed && (
                                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-md">
                                    + Auto TPA
                                  </span>
                                )}
                              </div>
                              {item.isAutoPrefixed && (
                                <span className="text-[9px] text-slate-400 font-normal block">
                                  Teks Asli: {item.rawNamaTpa}
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-2.5 text-slate-600">
                              {item.namaDirektur || '-'}
                            </td>
                            <td className="py-1.5 px-2.5 font-mono text-slate-500">
                              {item.rawRayon || '-'}
                            </td>
                            <td className="py-1.5 px-2.5">
                              {item.matchedKemantren ? (
                                <span className="text-emerald-700 font-bold">
                                  Rayon {item.matchedKemantren.name}
                                </span>
                              ) : (
                                <span className="text-rose-600 font-semibold">
                                  Tidak Cocok
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-2.5 text-center">
                              {item.isValid ? (
                                <span className="inline-flex items-center text-emerald-600 font-bold text-[10px]">
                                  <Check className="w-3 h-3 mr-0.5" /> Siap
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-rose-600 font-bold text-[10px]">
                                  <AlertCircle className="w-3 h-3 mr-0.5" /> Cek
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={isImporting || parsedImportData.filter((i) => i.isValid).length === 0}
                onClick={handleExecuteImport}
                className="px-5 py-2 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke Supabase...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Simpan {parsedImportData.filter((i) => i.isValid).length} Unit ke Master</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
