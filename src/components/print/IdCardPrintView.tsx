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
} from 'lucide-react';
import { Participant, UserSession, CompetitionCategory, Kemantren } from '../../types/fasi';
import { CATEGORIES_LIST, KEMANTREN_LIST } from '../../data/fasiMasterData';
import { getStoredKemantren, getStoredCategories } from '../../utils/storage';
import { ID_CARD_THEMES, IdCardTheme } from './idCardThemes';
import { IdCardParticipant } from './IdCardParticipant';
import { IdCardOfficial, OfficialCardData } from './IdCardOfficial';
import { IdCardCommittee, CommitteeCardData } from './IdCardCommittee';

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
    window.print();
  };

  // Hitung jumlah kartu yang aktif saat ini
  const currentTotalCards =
    activeCardType === 'peserta'
      ? filteredParticipants.length
      : activeCardType === 'official'
      ? generatedOfficials.length
      : generatedCommittees.length;

  return (
    <div className="space-y-6">
      {/* 1. TOP CONTROL BAR (Hidden on Print) */}
      <div className="no-print bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-5">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
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
              Standar Portrait 85mm × 55mm (9 Kartu / Lembar A4). Dilengkapi Watermark Resmi, QR Code, dan Pilihan Tema Warna.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={currentTotalCards === 0}
              className={`px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${
                currentTotalCards === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-800 hover:bg-emerald-700 text-white'
              }`}
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Cetak Sekarang (Ctrl+P)</span>
            </button>
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
        {/* CSS Printing Styles for High Precision 85mm x 55mm Portrait */}
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
              margin: 8mm 6mm;
            }
            .print-page {
              page-break-after: always;
              display: grid !important;
              grid-template-columns: repeat(3, 1fr) !important;
              grid-template-rows: repeat(3, 1fr) !important;
              gap: 4mm !important;
              height: 275mm !important;
              width: 198mm !important;
              margin: 0 auto !important;
            }
            .fasi-id-card {
              box-shadow: none !important;
              page-break-inside: avoid !important;
              width: 55mm !important;
              height: 85mm !important;
            }
          }
          @media screen {
            .print-page {
              display: flex;
              flex-wrap: wrap;
              gap: 16px;
              justify-content: center;
              padding: 16px 0;
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
          <div className="print-page bg-transparent">
            {/* RENDER PESERTA */}
            {activeCardType === 'peserta' &&
              filteredParticipants.map((p) => {
                const cat = categoriesList.find((c) => c.id === p.categoryId);
                return (
                  <IdCardParticipant
                    key={p.id}
                    participant={p}
                    category={cat}
                    qrCodeUrl={qrCodes[p.id]}
                    theme={activeTheme}
                    customTagline={customTagline}
                  />
                );
              })}

            {/* RENDER OFFICIAL */}
            {activeCardType === 'official' &&
              generatedOfficials.map((off) => (
                <IdCardOfficial
                  key={off.id}
                  data={off}
                  theme={activeTheme}
                  customTagline={customTagline}
                />
              ))}

            {/* RENDER COMMITTEE */}
            {activeCardType === 'panitia' &&
              generatedCommittees.map((com) => (
                <IdCardCommittee
                  key={com.id}
                  data={com}
                  theme={activeTheme}
                  customTagline={customTagline}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
