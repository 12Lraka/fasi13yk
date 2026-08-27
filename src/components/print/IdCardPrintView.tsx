/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Studio Cetak ID Card Cerdas (Peserta, Official, Panitia)
 * Standar Portrait 85mm x 55mm (9 Kartu / Lembar A4)
 */

import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  ArrowLeft,
  Printer,
  Sparkles,
  Users,
  Shield,
  Award,
  Filter,
  Palette,
  Search,
  Plus,
  Trash2,
  Lock,
  RefreshCw,
  Sliders,
  Eye,
  CheckSquare,
  Square,
  Building2,
  FileCheck,
  FileDown,
  Download,
  Loader2,
  Archive,
  Image as ImageIcon,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { Participant, UserSession, CompetitionCategory, Kemantren } from '../../types/fasi';
import { CATEGORIES_LIST, KEMANTREN_LIST } from '../../data/fasiMasterData';
import { getStoredKemantren, getStoredCategories } from '../../utils/storage';
import { ID_CARD_THEMES, IdCardTheme } from './idCardThemes';
import { IdCardParticipant } from './IdCardParticipant';
import { IdCardOfficial, OfficialCardData } from './IdCardOfficial';
import { IdCardCommittee, CommitteeCardData } from './IdCardCommittee';
import { generateIdCardsPdfFromDom } from '../../utils/idCardPdfGenerator';
import { downloadSingleCardAsPng, downloadBatchCardsAsZip } from '../../utils/idCardPngGenerator';
import { showToast } from '../../utils/sweetalert';

interface IdCardPrintViewProps {
  participants: Participant[];
  session?: UserSession | null;
  onBack: () => void;
}

type CardType = 'peserta' | 'official' | 'panitia';

export const IdCardPrintView: React.FC<IdCardPrintViewProps> = ({
  participants = [],
  session,
  onBack,
}) => {
  const isSuperAdmin = session?.role === 'super_admin';
  const kemantrenList: Kemantren[] = getStoredKemantren();
  const categoriesList: CompetitionCategory[] = getStoredCategories();

  // 1. Tab Tipe Kartu (Peserta, Official, Panitia)
  const [activeCardType, setActiveCardType] = useState<CardType>('peserta');

  // PDF & PNG Generation State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [pdfProgress, setPdfProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [isGeneratingZip, setIsGeneratingZip] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [downloadingCardId, setDownloadingCardId] = useState<string | null>(null);

  // 2. Customizer Tema Warna & Tagline
  const [selectedThemeKey, setSelectedThemeKey] = useState<string>('emerald');
  const activeTheme: IdCardTheme = ID_CARD_THEMES[selectedThemeKey] || ID_CARD_THEMES.emerald;
  const [customTagline, setCustomTagline] = useState<string>(
    'Santri Hebat, Hebat Prestasi, Hebat Mengaji, & Berakhlakul Karimah.'
  );

  // 3. Filter Cerdas untuk Kartu Peserta
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>('ALL'); // ALL, TKA, TPA, TQA
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedKemantrenFilter, setSelectedKemantrenFilter] = useState<string>(
    session?.role === 'kemantren_admin' && session?.kemantrenId ? session.kemantrenId : 'ALL'
  );
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

  // 4. State Generator Canggih untuk Official (Superadmin Only)
  const [officialMode, setOfficialMode] = useState<'auto_kemantren' | 'custom' | 'blanko'>('auto_kemantren');
  const [officialsPerKemantren, setOfficialsPerKemantren] = useState<number>(2); // 1, 2, 3, 4
  const [customOfficials, setCustomOfficials] = useState<OfficialCardData[]>([
    {
      id: 'off-1',
      name: 'Ust. H. Ahmad Fauzi, S.Pd.I',
      role: 'Ketua Kontingen',
      kemantrenName: 'Kemantren Danurejan',
      kemantrenCode: 'DN',
    },
    {
      id: 'off-2',
      name: 'Usth. Siti Nurjanah, S.Ag',
      role: 'Official Pendamping',
      kemantrenName: 'Kemantren Danurejan',
      kemantrenCode: 'DN',
    },
  ]);
  const [newOffName, setNewOffName] = useState('');
  const [newOffRole, setNewOffRole] = useState('Official Pendamping');
  const [newOffKemId, setNewOffKemId] = useState(kemantrenList[0]?.id || 'kem-1');

  // 5. State Generator Canggih untuk Panitia (Superadmin Only)
  const [committeeMode, setCommitteeMode] = useState<'preset' | 'custom' | 'blanko'>('preset');
  const [blankoCount, setBlankoCount] = useState<number>(18);
  const [customCommittees, setCustomCommittees] = useState<CommitteeCardData[]>([
    { id: 'com-1', name: 'Dr. H. Muhammad Asrori, M.Ag', division: 'Ketua Panitia FASI XIII', accessLevel: 'ALL ACCESS' },
    { id: 'com-2', name: 'Ustadz Ridwan Hakim, S.T', division: 'Sekretaris Panitia', accessLevel: 'ALL ACCESS' },
    { id: 'com-3', name: 'Ustadzah Hj. Maryam, S.E', division: 'Bendahara Panitia', accessLevel: 'ALL ACCESS' },
    { id: 'com-4', name: 'Ustadz Farhan Al-Ghifari, S.Pd', division: 'Koordinator Sie Acara & Lomba', accessLevel: 'STAGE & LOMBA' },
    { id: 'com-5', name: 'Ustadz Ilham Ramadhan, S.Kom', division: 'Koordinator Sie IT & Registrasi', accessLevel: 'ALL ACCESS' },
    { id: 'com-6', name: 'Ustadzah Nurul Hidayah, S.Pd.I', division: 'Sie Konsumsi & Logistik', accessLevel: 'LOGISTIK' },
    { id: 'com-7', name: 'Ustadz Bagus Prasetyo', division: 'Sie Perlengkapan & Sound', accessLevel: 'VENUE' },
    { id: 'com-8', name: 'Dewan Hakim / Dewan Juri', division: 'Dewan Juri FASI XIII', accessLevel: 'RUANG JURI' },
    { id: 'com-9', name: 'Tim Medis & Keamanan', division: 'Sie Keamanan & Kesehatan', accessLevel: 'ALL ACCESS' },
  ]);
  const [newComName, setNewComName] = useState('');
  const [newComDivision, setNewComDivision] = useState('Sie Acara & Lomba');
  const [newComAccess, setNewComAccess] = useState('ALL ACCESS');

  // Generate QR Codes untuk Peserta
  useEffect(() => {
    participants.forEach(async (p) => {
      if (qrCodes[p.id]) return;
      try {
        const cat = categoriesList.find((c) => c.id === p.categoryId);
        const qrData = JSON.stringify({
          reg: p.registrationNumber,
          nama: p.fullName,
          kategori: cat?.level || 'FASI',
          cabang: cat?.name || p.categoryId,
          gender: p.gender === 'L' ? 'Putra' : 'Putri',
        });

        const url = await QRCode.toDataURL(qrData, {
          width: 180,
          margin: 1,
          color: {
            dark: activeTheme.primaryColor,
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        });
        setQrCodes((prev) => ({ ...prev, [p.id]: url }));
      } catch (err) {
        console.error('Gagal generate QR Code:', err);
      }
    });
  }, [participants, categoriesList, activeTheme.primaryColor]);

  // Daftar Cabang Lomba terfilter sesuai Kategori Level
  const availableCategories = useMemo(() => {
    if (selectedLevelFilter === 'ALL') return categoriesList;
    return categoriesList.filter((c) => c.level === selectedLevelFilter);
  }, [categoriesList, selectedLevelFilter]);

  // Filter List Peserta
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      // Role lock
      if (session?.role === 'kemantren_admin' && session?.kemantrenId) {
        if (p.kemantrenId !== session.kemantrenId) return false;
      } else if (selectedKemantrenFilter !== 'ALL') {
        if (p.kemantrenId !== selectedKemantrenFilter) return false;
      }

      // Filter Level (TKA, TPA, TQA)
      const cat = categoriesList.find((c) => c.id === p.categoryId);
      if (selectedLevelFilter !== 'ALL' && cat?.level !== selectedLevelFilter) {
        return false;
      }

      // Filter Cabang Lomba
      if (selectedCategoryFilter !== 'ALL' && p.categoryId !== selectedCategoryFilter) {
        return false;
      }

      // Filter Gender
      if (selectedGenderFilter !== 'ALL' && p.gender !== selectedGenderFilter) {
        return false;
      }

      // Search Term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match =
          p.fullName?.toLowerCase().includes(term) ||
          p.registrationNumber?.toLowerCase().includes(term) ||
          p.tpaUnitName?.toLowerCase().includes(term);
        if (!match) return false;
      }

      return true;
    });
  }, [
    participants,
    session,
    selectedKemantrenFilter,
    selectedLevelFilter,
    selectedCategoryFilter,
    selectedGenderFilter,
    searchTerm,
    categoriesList,
  ]);

  // List Official Tergenerate
  const generatedOfficials: OfficialCardData[] = useMemo(() => {
    if (officialMode === 'custom') {
      return customOfficials;
    }
    if (officialMode === 'blanko') {
      const list: OfficialCardData[] = [];
      kemantrenList.forEach((k) => {
        for (let i = 1; i <= officialsPerKemantren; i++) {
          list.push({
            id: `off-blanko-${k.id}-${i}`,
            name: '',
            role: i === 1 ? 'Ketua Kontingen' : 'Official Pendamping',
            kemantrenName: `Kemantren ${k.name}`,
            kemantrenCode: k.code,
          });
        }
      });
      return list;
    }
    // Auto Kemantren Mode (Mengambil data nama Admin Kemantren dari master)
    const list: OfficialCardData[] = [];
    kemantrenList.forEach((k) => {
      list.push({
        id: `off-auto-1-${k.id}`,
        name: k.adminName || `Ketua Kontingen ${k.name}`,
        role: 'Ketua Kontingen',
        kemantrenName: `Kemantren ${k.name}`,
        kemantrenCode: k.code,
      });
      if (officialsPerKemantren >= 2) {
        list.push({
          id: `off-auto-2-${k.id}`,
          name: `Official Pendamping ${k.name}`,
          role: 'Official Pendamping',
          kemantrenName: `Kemantren ${k.name}`,
          kemantrenCode: k.code,
        });
      }
      if (officialsPerKemantren >= 3) {
        list.push({
          id: `off-auto-3-${k.id}`,
          name: `Koordinator Lomba ${k.name}`,
          role: 'Koordinator Lomba',
          kemantrenName: `Kemantren ${k.name}`,
          kemantrenCode: k.code,
        });
      }
      if (officialsPerKemantren >= 4) {
        list.push({
          id: `off-auto-4-${k.id}`,
          name: `Official Medis & Logistik`,
          role: 'Official Medis & Logistik',
          kemantrenName: `Kemantren ${k.name}`,
          kemantrenCode: k.code,
        });
      }
    });
    return list;
  }, [officialMode, customOfficials, officialsPerKemantren, kemantrenList]);

  // List Panitia Tergenerate
  const generatedCommittees: CommitteeCardData[] = useMemo(() => {
    if (committeeMode === 'custom') {
      return customCommittees;
    }
    if (committeeMode === 'blanko') {
      return Array.from({ length: blankoCount }, (_, idx) => ({
        id: `com-blanko-${idx + 1}`,
        name: '',
        division: idx % 3 === 0 ? 'Sie Acara & Lomba' : idx % 3 === 1 ? 'Sie IT & Registrasi' : 'Sie Perlengkapan',
        accessLevel: 'ALL ACCESS',
      }));
    }
    // Preset Struktur Panitia FASI XIII
    return [
      { id: 'com-p-1', name: 'Dr. H. Muhammad Asrori, M.Ag', division: 'Ketua Panitia FASI XIII', accessLevel: 'ALL ACCESS' },
      { id: 'com-p-2', name: 'Ustadz Ridwan Hakim, S.T', division: 'Sekretaris Panitia', accessLevel: 'ALL ACCESS' },
      { id: 'com-p-3', name: 'Ustadzah Hj. Maryam, S.E', division: 'Bendahara Panitia', accessLevel: 'ALL ACCESS' },
      { id: 'com-p-4', name: 'Ustadz Farhan Al-Ghifari, S.Pd', division: 'Sie Acara & Lomba', accessLevel: 'STAGE & LOMBA' },
      { id: 'com-p-5', name: 'Ustadz Ilham Ramadhan, S.Kom', division: 'Sie IT & Registrasi', accessLevel: 'ALL ACCESS' },
      { id: 'com-p-6', name: 'Ustadzah Nurul Hidayah, S.Pd.I', division: 'Sie Konsumsi & Logistik', accessLevel: 'LOGISTIK' },
      { id: 'com-p-7', name: 'Ustadz Bagus Prasetyo', division: 'Sie Perlengkapan', accessLevel: 'VENUE' },
      { id: 'com-p-8', name: 'Ustadz Hendra Kurniawan', division: 'Sie Publikasi & Dokumentasi', accessLevel: 'MEDIA & PRESS' },
      { id: 'com-p-9', name: 'Dewan Juri FASI XIII', division: 'Dewan Hakim Lomba', accessLevel: 'RUANG JURI' },
    ];
  }, [committeeMode, customCommittees, blankoCount]);

  // Handle Tambah Custom Official
  const handleAddCustomOfficial = () => {
    if (!newOffName.trim()) return;
    const kem = kemantrenList.find((k) => k.id === newOffKemId);
    const newOff: OfficialCardData = {
      id: `off-c-${Date.now()}`,
      name: newOffName.trim(),
      role: newOffRole,
      kemantrenName: kem ? `Kemantren ${kem.name}` : 'Kemantren Kota Yogyakarta',
      kemantrenCode: kem?.code,
    };
    setCustomOfficials((prev) => [...prev, newOff]);
    setNewOffName('');
  };

  // Handle Tambah Custom Committee
  const handleAddCustomCommittee = () => {
    if (!newComName.trim()) return;
    const newCom: CommitteeCardData = {
      id: `com-c-${Date.now()}`,
      name: newComName.trim(),
      division: newComDivision,
      accessLevel: newComAccess,
    };
    setCustomCommittees((prev) => [...prev, newCom]);
    setNewComName('');
  };

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  // Unduh 1 Kartu Tunggal ke format PNG
  const handleDownloadSingleCard = async (elementId: string, fileName: string, cardId: string) => {
    const el = document.getElementById(elementId);
    if (!el || downloadingCardId) return;

    setDownloadingCardId(cardId);
    try {
      await downloadSingleCardAsPng(el, fileName);
      showToast('success', `Gambar ID Card "${fileName}" berhasil diunduh!`);
    } catch (err) {
      console.error('Gagal mengunduh kartu PNG:', err);
      showToast('error', 'Gagal memproses gambar kartu PNG.');
    } finally {
      setDownloadingCardId(null);
    }
  };

  // Unduh Semua Kartu yang aktif sekaligus ke format ZIP berisi file-file .PNG
  const handleDownloadAllAsZip = async () => {
    if (currentTotalCards === 0 || isGeneratingZip || isGeneratingPdf) return;

    // Cari seluruh kartu yang sedang ter-render di DOM
    const cardElements = Array.from(document.querySelectorAll<HTMLElement>('.fasi-id-card'));
    if (!cardElements.length) {
      showToast('warning', 'Tidak ada kartu yang ter-render di layar.');
      return;
    }

    setIsGeneratingZip(true);
    setZipProgress({ current: 1, total: cardElements.length });

    try {
      // Susun nama file yang rapi untuk tiap kartu
      let fileNames: string[] = [];
      if (activeCardType === 'peserta') {
        fileNames = filteredParticipants.map(
          (p) => `${p.registrationNumber}_${p.fullName.replace(/\s+/g, '_')}`
        );
      } else if (activeCardType === 'official') {
        fileNames = generatedOfficials.map(
          (off, i) => `Official_${off.kemantrenCode || i + 1}_${off.name ? off.name.replace(/\s+/g, '_') : 'Blanko'}`
        );
      } else {
        fileNames = generatedCommittees.map(
          (com, i) => `Panitia_${i + 1}_${com.name ? com.name.replace(/\s+/g, '_') : 'Blanko'}`
        );
      }

      await downloadBatchCardsAsZip({
        cardElements,
        fileNames,
        zipFileName: `ID_Card_FASI_XIII_${activeCardType}_PNG_300DPI.zip`,
        onProgress: (cur, tot) => setZipProgress({ current: cur, total: tot }),
      });

      showToast('success', `Berhasil mengunduh ${cardElements.length} kartu dalam berkas ZIP!`);
    } catch (err) {
      console.error('Gagal membuat ZIP ID Card:', err);
      showToast('error', 'Gagal memproses berkas ZIP ID Card.');
    } finally {
      setIsGeneratingZip(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (currentTotalCards === 0 || isGeneratingPdf || isGeneratingZip) return;
    setIsGeneratingPdf(true);
    setPdfProgress({ current: 1, total: 1 });

    try {
      await generateIdCardsPdfFromDom({
        containerSelector: '.idcard-print-page',
        fileName: `ID_Card_FASI_XIII_${activeCardType}_A4.pdf`,
        onProgress: (cur, tot) => setPdfProgress({ current: cur, total: tot }),
      });
      showToast('success', 'File PDF ID Card (A4 - 9 Kartu/Lembar) berhasil diunduh!');
    } catch (err) {
      console.error('Gagal generate PDF ID Card:', err);
      showToast('error', 'Gagal memproses dokumen PDF ID Card.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Hitung jumlah kartu yang aktif saat ini
  const currentTotalCards =
    activeCardType === 'peserta'
      ? filteredParticipants.length
      : activeCardType === 'official'
      ? generatedOfficials.length
      : generatedCommittees.length;

  // Chunk items into 9 cards per A4 page
  const chunkArray = <T,>(arr: T[], size: number = 9): T[][] => {
    const result: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  const participantPages = useMemo(() => chunkArray(filteredParticipants, 9), [filteredParticipants]);
  const officialPages = useMemo(() => chunkArray(generatedOfficials, 9), [generatedOfficials]);
  const committeePages = useMemo(() => chunkArray(generatedCommittees, 9), [generatedCommittees]);

  return (
    <div className="space-y-6">
      {/* 1. TOP CONTROL BAR (Hidden on Print) */}
      <div className="no-print bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-5">
        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 mb-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Panel</span>
            </button>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <span>Studio Cetak ID Card FASI XIII</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900">
                {currentTotalCards} Kartu Siap Cetak
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Standar Portrait 5.5cm × 8.8cm (9 Kartu / Lembar A4). Format PNG Satuan / ZIP & Cetak Dokumen.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tombol Utama: Unduh Semua PNG (.ZIP) */}
            <button
              onClick={handleDownloadAllAsZip}
              disabled={currentTotalCards === 0 || isGeneratingZip || isGeneratingPdf}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${
                currentTotalCards === 0 || isGeneratingZip || isGeneratingPdf
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-amber-900/20'
              }`}
              title="Unduh semua kartu sebagai file gambar .PNG beresolusi tinggi 300 DPI dalam arsip .ZIP (100% identik dengan preview)"
            >
              {isGeneratingZip ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-200" />
                  <span>
                    Membuat ZIP ({zipProgress.current}/{zipProgress.total})...
                  </span>
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4 text-amber-200" />
                  <span>Unduh Semua PNG (.ZIP)</span>
                  <span className="px-1.5 py-0.5 bg-amber-950/40 text-amber-200 rounded text-[10px] uppercase font-mono">
                    Rekomendasi
                  </span>
                </>
              )}
            </button>

            {/* Tombol Unduh PDF Dokumen A4 */}
            <button
              onClick={handleDownloadPdf}
              disabled={currentTotalCards === 0 || isGeneratingPdf || isGeneratingZip}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-xs border border-emerald-800/30 flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${
                currentTotalCards === 0 || isGeneratingPdf || isGeneratingZip
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-800 hover:bg-emerald-900 text-white'
              }`}
              title="Unduh berkas PDF A4 (9 kartu per lembar)"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-300" />
                  <span>
                    PDF ({pdfProgress.current}/{pdfProgress.total})...
                  </span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-emerald-300" />
                  <span>Download PDF (A4)</span>
                </>
              )}
            </button>

            {/* Tombol Cetak Browser */}
            <button
              onClick={handlePrint}
              disabled={currentTotalCards === 0 || isGeneratingPdf || isGeneratingZip}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs border border-slate-300 shadow-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${
                currentTotalCards === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-white hover:bg-slate-50 text-slate-800'
              }`}
              title="Cetak langsung menggunakan printer bawaan browser (Ctrl+P)"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak Langsung</span>
            </button>
          </div>
        </div>

        {/* Info & Rekomendasi Format */}
        <div className="bg-gradient-to-r from-emerald-50 via-amber-50/50 to-slate-50 border border-emerald-200/80 rounded-xl p-3 text-xs text-slate-700 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-emerald-950">
              💡 Rekomendasi Format Cetak ID Card FASI XIII:
            </p>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              • <strong>Unduh PNG Satuan / ZIP:</strong> Menghasilkan gambar .PNG murni beresolusi tajam <strong>300 DPI</strong> yang <strong>100% identik</strong> dengan preview (paling disukai untuk printer kartu PVC / foto satuan dan share WhatsApp).
              <br />
              • <strong>Cetak Langsung (Ctrl+P):</strong> Menggunakan CSS cetak browser resmi untuk lembaran kertas A4 (9 kartu/lembar) dengan ketajaman teks vektor murni.
            </p>
          </div>
        </div>

        {/* Tab Selector: Peserta, Official, Panitia */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            {/* Tab 1: Peserta */}
            <button
              onClick={() => setActiveCardType('peserta')}
              className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                activeCardType === 'peserta'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-700" />
              <span>ID Card Peserta</span>
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md">
                {filteredParticipants.length}
              </span>
            </button>

            {/* Tab 2: Official (Superadmin Only) */}
            <button
              onClick={() => {
                if (isSuperAdmin) setActiveCardType('official');
              }}
              disabled={!isSuperAdmin}
              className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
                !isSuperAdmin
                  ? 'opacity-50 cursor-not-allowed text-slate-400'
                  : activeCardType === 'official'
                  ? 'bg-white text-blue-900 shadow-xs cursor-pointer'
                  : 'text-slate-600 hover:text-slate-900 cursor-pointer'
              }`}
              title={!isSuperAdmin ? 'Hanya dapat diakses oleh Super Admin' : 'Cetak ID Card Official'}
            >
              <Shield className="w-4 h-4 text-blue-700" />
              <span>ID Card Official</span>
              {!isSuperAdmin ? (
                <Lock className="w-3 h-3 text-slate-400" />
              ) : (
                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-black rounded-md">
                  {generatedOfficials.length}
                </span>
              )}
            </button>

            {/* Tab 3: Panitia (Superadmin Only) */}
            <button
              onClick={() => {
                if (isSuperAdmin) setActiveCardType('panitia');
              }}
              disabled={!isSuperAdmin}
              className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${
                !isSuperAdmin
                  ? 'opacity-50 cursor-not-allowed text-slate-400'
                  : activeCardType === 'panitia'
                  ? 'bg-white text-rose-900 shadow-xs cursor-pointer'
                  : 'text-slate-600 hover:text-slate-900 cursor-pointer'
              }`}
              title={!isSuperAdmin ? 'Hanya dapat diakses oleh Super Admin' : 'Cetak ID Card Panitia'}
            >
              <Award className="w-4 h-4 text-rose-700" />
              <span>ID Card Panitia</span>
              {!isSuperAdmin ? (
                <Lock className="w-3 h-3 text-slate-400" />
              ) : (
                <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 text-[10px] font-black rounded-md">
                  {generatedCommittees.length}
                </span>
              )}
            </button>
          </div>

          {/* Theme Color Selector Swatches */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <Palette className="w-3.5 h-3.5 text-slate-500" />
              <span>Warna Tema:</span>
            </span>
            <div className="flex items-center gap-1.5">
              {Object.keys(ID_CARD_THEMES).map((key) => {
                const t = ID_CARD_THEMES[key];
                const isSelected = selectedThemeKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedThemeKey(key)}
                    className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                      isSelected ? 'scale-110 border-slate-900 shadow-xs' : 'border-white opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: t.primaryColor }}
                    title={t.name}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. FILTER CERDAS & GENERATOR SPESIFIK */}

        {/* A. JIKA MEMILIH ID CARD PESERTA */}
        {activeCardType === 'peserta' && (
          <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-700" />
                <span>Filter Cerdas Peserta</span>
              </span>
              <button
                onClick={() => {
                  setSelectedLevelFilter('ALL');
                  setSelectedCategoryFilter('ALL');
                  setSelectedGenderFilter('ALL');
                  if (isSuperAdmin) setSelectedKemantrenFilter('ALL');
                  setSearchTerm('');
                }}
                className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Filter</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* 1. Filter Kategori (Level) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Kategori Jenjang:
                </label>
                <select
                  value={selectedLevelFilter}
                  onChange={(e) => {
                    setSelectedLevelFilter(e.target.value);
                    setSelectedCategoryFilter('ALL');
                  }}
                  className="w-full text-xs font-semibold bg-white border border-emerald-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="ALL">Semua Kategori (TKA, TPA, TQA)</option>
                  <option value="TKA">Kategori TKA (Maks 7 Th)</option>
                  <option value="TPA">Kategori TPA (Maks 12 Th)</option>
                  <option value="TQA">Kategori TQA (Maks 15 Th)</option>
                </select>
              </div>

              {/* 2. Filter Cabang Lomba Dinamis */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Cabang Lomba:
                </label>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-emerald-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="ALL">Semua Cabang Lomba ({availableCategories.length})</option>
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.level}] {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Filter Kemantren */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Kemantren / Kontingen:
                </label>
                <select
                  value={selectedKemantrenFilter}
                  onChange={(e) => setSelectedKemantrenFilter(e.target.value)}
                  disabled={!isSuperAdmin}
                  className={`w-full text-xs font-semibold bg-white border border-emerald-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                    !isSuperAdmin ? 'bg-slate-100 cursor-not-allowed' : ''
                  }`}
                >
                  {isSuperAdmin && <option value="ALL">Semua Kemantren (14 Wilayah)</option>}
                  {kemantrenList.map((k) => (
                    <option key={k.id} value={k.id}>
                      Kemantren {k.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Filter Gender */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Golongan Gender:
                </label>
                <select
                  value={selectedGenderFilter}
                  onChange={(e) => setSelectedGenderFilter(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-emerald-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="ALL">Putra & Putri</option>
                  <option value="L">Hanya Putra (L)</option>
                  <option value="P">Hanya Putri (P)</option>
                </select>
              </div>

              {/* 5. Pencarian Nama */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
                  Pencarian Santri:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nama / No. Reg / Unit TPA..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-emerald-300 rounded-lg p-2 pl-8 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* B. JIKA MEMILIH ID CARD OFFICIAL (SUPERADMIN ONLY) */}
        {activeCardType === 'official' && isSuperAdmin && (
          <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-xs font-black text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-blue-700" />
                <span>Sistem Generator Kartu Official Kontingen</span>
              </span>

              {/* Mode Switcher */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-blue-200">
                <button
                  onClick={() => setOfficialMode('auto_kemantren')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                    officialMode === 'auto_kemantren' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ⚡ Auto 14 Kemantren
                </button>
                <button
                  onClick={() => setOfficialMode('custom')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                    officialMode === 'custom' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ✏️ Custom Nama
                </button>
                <button
                  onClick={() => setOfficialMode('blanko')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                    officialMode === 'blanko' ? 'bg-blue-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📝 Blanko per Kemantren
                </button>
              </div>
            </div>

            {/* Sub Controls Auto Kemantren */}
            {(officialMode === 'auto_kemantren' || officialMode === 'blanko') && (
              <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-blue-100">
                <label className="text-xs font-bold text-slate-700">
                  Jumlah Kartu per Kemantren:
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => setOfficialsPerKemantren(num)}
                      className={`px-3 py-1 rounded-md font-extrabold text-xs transition-colors cursor-pointer ${
                        officialsPerKemantren === num
                          ? 'bg-blue-800 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {num} Kartu ({num * 14} Total)
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sub Controls Custom List */}
            {officialMode === 'custom' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-lg border border-blue-100">
                  <input
                    type="text"
                    placeholder="Nama Lengkap Official..."
                    value={newOffName}
                    onChange={(e) => setNewOffName(e.target.value)}
                    className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2 flex-1 min-w-[200px]"
                  />
                  <select
                    value={newOffRole}
                    onChange={(e) => setNewOffRole(e.target.value)}
                    className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Ketua Kontingen">Ketua Kontingen</option>
                    <option value="Official Pendamping">Official Pendamping</option>
                    <option value="Koordinator Lomba">Koordinator Lomba</option>
                    <option value="Official Medis & Logistik">Official Medis & Logistik</option>
                  </select>
                  <select
                    value={newOffKemId}
                    onChange={(e) => setNewOffKemId(e.target.value)}
                    className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    {kemantrenList.map((k) => (
                      <option key={k.id} value={k.id}>
                        Kemantren {k.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddCustomOfficial}
                    className="px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Official</span>
                  </button>
                </div>

                {/* List Table Preview Custom */}
                <div className="flex flex-wrap gap-2">
                  {customOfficials.map((off, idx) => (
                    <div
                      key={off.id}
                      className="bg-white px-2.5 py-1.5 rounded-lg border border-blue-200 text-xs flex items-center gap-2 shadow-2xs"
                    >
                      <span className="font-bold text-slate-800">{off.name}</span>
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-medium">
                        {off.kemantrenName} ({off.role})
                      </span>
                      <button
                        onClick={() => setCustomOfficials((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700 cursor-pointer ml-1"
                        title="Hapus"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* C. JIKA MEMILIH ID CARD PANITIA (SUPERADMIN ONLY) */}
        {activeCardType === 'panitia' && isSuperAdmin && (
          <div className="bg-rose-50/50 rounded-xl p-4 border border-rose-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-xs font-black text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-rose-700" />
                <span>Sistem Generator Kartu Panitia Pelaksana & Dewan Juri</span>
              </span>

              {/* Mode Switcher */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-rose-200">
                <button
                  onClick={() => setCommitteeMode('preset')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                    committeeMode === 'preset' ? 'bg-rose-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🏛️ Preset Struktur Panitia
                </button>
                <button
                  onClick={() => setCommitteeMode('blanko')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                    committeeMode === 'blanko' ? 'bg-rose-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🏷️ Blanko Siap Tempel Nama
                </button>
                <button
                  onClick={() => setCommitteeMode('custom')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                    committeeMode === 'custom' ? 'bg-rose-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ✏️ Custom Nama Panitia
                </button>
              </div>
            </div>

            {/* Sub Controls Blanko Panitia */}
            {committeeMode === 'blanko' && (
              <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-rose-100">
                <label className="text-xs font-bold text-slate-700">
                  Jumlah Kartu Blanko Tempel Nama:
                </label>
                <div className="flex items-center gap-2">
                  {[9, 18, 27, 36, 45, 90].map((num) => (
                    <button
                      key={num}
                      onClick={() => setBlankoCount(num)}
                      className={`px-3 py-1 rounded-md font-extrabold text-xs transition-colors cursor-pointer ${
                        blankoCount === num
                          ? 'bg-rose-800 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {num} Kartu ({num / 9} Lembar A4)
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sub Controls Custom List */}
            {committeeMode === 'custom' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-lg border border-rose-100">
                  <input
                    type="text"
                    placeholder="Nama Lengkap Panitia / Dewan Juri..."
                    value={newComName}
                    onChange={(e) => setNewComName(e.target.value)}
                    className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2 flex-1 min-w-[200px]"
                  />
                  <input
                    type="text"
                    placeholder="Divisi (misal: Sie Acara & Lomba)..."
                    value={newComDivision}
                    onChange={(e) => setNewComDivision(e.target.value)}
                    className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2 flex-1 min-w-[180px]"
                  />
                  <select
                    value={newComAccess}
                    onChange={(e) => setNewComAccess(e.target.value)}
                    className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="ALL ACCESS">ALL ACCESS</option>
                    <option value="STAGE & LOMBA">STAGE & LOMBA</option>
                    <option value="RUANG JURI">RUANG JURI</option>
                    <option value="MEDIA & PRESS">MEDIA & PRESS</option>
                    <option value="LOGISTIK">LOGISTIK</option>
                  </select>
                  <button
                    onClick={handleAddCustomCommittee}
                    className="px-4 py-2 bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Panitia</span>
                  </button>
                </div>

                {/* List Table Preview Custom */}
                <div className="flex flex-wrap gap-2">
                  {customCommittees.map((com, idx) => (
                    <div
                      key={com.id}
                      className="bg-white px-2.5 py-1.5 rounded-lg border border-rose-200 text-xs flex items-center gap-2 shadow-2xs"
                    >
                      <span className="font-bold text-slate-800">{com.name}</span>
                      <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded font-medium">
                        {com.division} ({com.accessLevel})
                      </span>
                      <button
                        onClick={() => setCustomCommittees((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700 cursor-pointer ml-1"
                        title="Hapus"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. PRINT CANVAS & GRID (9 Kartu per Lembar A4) */}
      <div className="print-area">
        {/* CSS Printing Styles for High Precision 55mm x 88mm Portrait (9 Kartu / Lembar A4) */}
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body {
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: A4 portrait;
              margin: 10mm 15mm;
            }
            .idcard-print-page {
              page-break-after: always;
              break-after: page;
              padding: 0 !important;
              margin: 0 auto !important;
              box-shadow: none !important;
              border: none !important;
              background: white !important;
            }
            .fasi-id-card {
              box-shadow: none !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              width: 55mm !important;
              height: 88mm !important;
            }
          }
          @media screen {
            .idcard-print-page {
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            }
          }
        `}} />

        {currentTotalCards === 0 ? (
          <div className="no-print bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Tidak Ada Kartu yang Sesuai Filter
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Silakan sesuaikan pilihan jenjang kategori, cabang lomba, kemantren, atau kata kunci pencarian Anda.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* RENDER PESERTA PER LEMBAR A4 */}
            {activeCardType === 'peserta' &&
              participantPages.map((pageItems, pageIdx) => (
                <div
                  key={`page-peserta-${pageIdx}`}
                  className="idcard-print-page bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 mx-auto transition-all"
                  style={{
                    width: '210mm',
                    minHeight: '297mm',
                    boxSizing: 'border-box',
                  }}
                >
                  <div className="no-print flex items-center justify-between border-b border-slate-100 pb-2 mb-3 text-[11px] text-slate-400 font-mono">
                    <span className="font-semibold text-emerald-800">ID Card Peserta FASI XIII</span>
                    <span>Lembar {pageIdx + 1} dari {participantPages.length} ({pageItems.length} Kartu)</span>
                  </div>
                  <div
                    className="grid grid-cols-3 gap-x-[4mm] gap-y-[3mm] justify-center items-center mx-auto py-1"
                    style={{
                      width: '173mm', // 3 * 55mm + 2 * 4mm = 173mm
                    }}
                  >
                    {pageItems.map((p) => {
                      const cat = categoriesList.find((c) => c.id === p.categoryId);
                      const kem = kemantrenList.find((k) => k.id === p.kemantrenId);
                      const elementId = `card-peserta-${p.id}`;
                      const fileName = `${p.registrationNumber}_${p.fullName.replace(/\s+/g, '_')}`;
                      return (
                        <div key={p.id} className="relative group flex justify-center">
                          <div id={elementId}>
                            <IdCardParticipant
                              participant={p}
                              category={cat}
                              kemantrenName={kem?.name}
                              qrCodeUrl={qrCodes[p.id]}
                              theme={activeTheme}
                              customTagline={customTagline}
                            />
                          </div>
                          {/* Hover Single Card PNG Download Button */}
                          <div className="no-print absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <button
                              type="button"
                              onClick={() => handleDownloadSingleCard(elementId, fileName, p.id)}
                              disabled={downloadingCardId === p.id}
                              className="px-2 py-1 bg-slate-900/90 hover:bg-black text-white rounded-md text-[10px] font-bold shadow-md flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                              title="Download kartu ini saja sebagai gambar PNG 300 DPI"
                            >
                              {downloadingCardId === p.id ? (
                                <Loader2 className="w-3 h-3 animate-spin text-amber-300" />
                              ) : (
                                <ImageIcon className="w-3 h-3 text-amber-300" />
                              )}
                              <span>Unduh PNG</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

            {/* RENDER OFFICIAL PER LEMBAR A4 */}
            {activeCardType === 'official' &&
              officialPages.map((pageItems, pageIdx) => (
                <div
                  key={`page-official-${pageIdx}`}
                  className="idcard-print-page bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 mx-auto transition-all"
                  style={{
                    width: '210mm',
                    minHeight: '297mm',
                    boxSizing: 'border-box',
                  }}
                >
                  <div className="no-print flex items-center justify-between border-b border-slate-100 pb-2 mb-3 text-[11px] text-slate-400 font-mono">
                    <span className="font-semibold text-blue-800">ID Card Official Kontingen FASI XIII</span>
                    <span>Lembar {pageIdx + 1} dari {officialPages.length} ({pageItems.length} Kartu)</span>
                  </div>
                  <div
                    className="grid grid-cols-3 gap-x-[4mm] gap-y-[3mm] justify-center items-center mx-auto py-1"
                    style={{
                      width: '173mm',
                    }}
                  >
                    {pageItems.map((off, idx) => {
                      const elementId = `card-official-${off.id || idx}`;
                      const fileName = `Official_${off.kemantrenCode || idx + 1}_${off.name ? off.name.replace(/\s+/g, '_') : 'Blanko'}`;
                      return (
                        <div key={off.id || idx} className="relative group flex justify-center">
                          <div id={elementId}>
                            <IdCardOfficial
                              data={off}
                              theme={activeTheme}
                              customTagline={customTagline}
                            />
                          </div>
                          {/* Hover Single Card PNG Download Button */}
                          <div className="no-print absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <button
                              type="button"
                              onClick={() => handleDownloadSingleCard(elementId, fileName, off.id || String(idx))}
                              disabled={downloadingCardId === (off.id || String(idx))}
                              className="px-2 py-1 bg-slate-900/90 hover:bg-black text-white rounded-md text-[10px] font-bold shadow-md flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                              title="Download kartu official ini saja sebagai gambar PNG 300 DPI"
                            >
                              {downloadingCardId === (off.id || String(idx)) ? (
                                <Loader2 className="w-3 h-3 animate-spin text-amber-300" />
                              ) : (
                                <ImageIcon className="w-3 h-3 text-amber-300" />
                              )}
                              <span>Unduh PNG</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

            {/* RENDER COMMITTEE PER LEMBAR A4 */}
            {activeCardType === 'panitia' &&
              committeePages.map((pageItems, pageIdx) => (
                <div
                  key={`page-panitia-${pageIdx}`}
                  className="idcard-print-page bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 mx-auto transition-all"
                  style={{
                    width: '210mm',
                    minHeight: '297mm',
                    boxSizing: 'border-box',
                  }}
                >
                  <div className="no-print flex items-center justify-between border-b border-slate-100 pb-2 mb-3 text-[11px] text-slate-400 font-mono">
                    <span className="font-semibold text-rose-800">ID Card Panitia & Juri FASI XIII</span>
                    <span>Lembar {pageIdx + 1} dari {committeePages.length} ({pageItems.length} Kartu)</span>
                  </div>
                  <div
                    className="grid grid-cols-3 gap-x-[4mm] gap-y-[3mm] justify-center items-center mx-auto py-1"
                    style={{
                      width: '173mm',
                    }}
                  >
                    {pageItems.map((com, idx) => {
                      const elementId = `card-panitia-${com.id || idx}`;
                      const fileName = `Panitia_${idx + 1}_${com.name ? com.name.replace(/\s+/g, '_') : 'Blanko'}`;
                      return (
                        <div key={com.id || idx} className="relative group flex justify-center">
                          <div id={elementId}>
                            <IdCardCommittee
                              data={com}
                              theme={activeTheme}
                              customTagline={customTagline}
                            />
                          </div>
                          {/* Hover Single Card PNG Download Button */}
                          <div className="no-print absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                            <button
                              type="button"
                              onClick={() => handleDownloadSingleCard(elementId, fileName, com.id || String(idx))}
                              disabled={downloadingCardId === (com.id || String(idx))}
                              className="px-2 py-1 bg-slate-900/90 hover:bg-black text-white rounded-md text-[10px] font-bold shadow-md flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                              title="Download kartu panitia ini saja sebagai gambar PNG 300 DPI"
                            >
                              {downloadingCardId === (com.id || String(idx)) ? (
                                <Loader2 className="w-3 h-3 animate-spin text-amber-300" />
                              ) : (
                                <ImageIcon className="w-3 h-3 text-amber-300" />
                              )}
                              <span>Unduh PNG</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
