/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Modul Rekapitulasi Berita Acara & Laporan Kontingen Siap Cetak
 */

import React from 'react';
import { ArrowLeft, Printer, FileSpreadsheet, MapPin } from 'lucide-react';
import { Participant, UserSession } from '../../types/fasi';
import { KEMANTREN_LIST, CATEGORIES_LIST } from '../../data/fasiMasterData';

interface RecapPrintViewProps {
  participants: Participant[];
  session: UserSession;
  onBack: () => void;
}

export const RecapPrintView: React.FC<RecapPrintViewProps> = ({
  participants,
  session,
  onBack,
}) => {
  const getCategory = (catId: string) => CATEGORIES_LIST.find((c) => c.id === catId);
  const getKemantren = (kemId: string) => KEMANTREN_LIST.find((k) => k.id === kemId);

  const activeKemantren =
    session.role === 'kemantren_admin' && session.kemantrenId
      ? getKemantren(session.kemantrenId)
      : null;

  const filtered = activeKemantren
    ? participants.filter((p) => p.kemantrenId === activeKemantren.id)
    : participants;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Control Bar (Hidden on Print) */}
      <div className="no-print bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 mb-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Panel</span>
          </button>
          <h2 className="text-lg font-bold text-slate-900">
            Laporan Rekapitulasi Data Peserta Kontingen
          </h2>
          <p className="text-xs text-slate-500">
            Dokumen resmi daftar nominasi tetap santri FASI XIII Kota Yogyakarta 2026.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Cetak Berita Acara (Ctrl+P)</span>
          </button>
        </div>
      </div>

      {/* Official Printable Report Document */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-5xl mx-auto print:border-none print:shadow-none print:p-0">
        {/* Official Kop Surat */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center space-y-1">
          <h2 className="font-extrabold text-lg text-slate-900 uppercase tracking-wide">
            BADAN KOORDINASI TKA-TPA (BADKO TKA-TPA) KOTA YOGYAKARTA
          </h2>
          <h3 className="font-bold text-sm text-emerald-900 uppercase tracking-wider">
            PANITIA PELAKSANA FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII TAHUN 2026
          </h3>
          <p className="text-xs text-slate-600">
            Sekretariat: Kompleks Masjid Diponegoro, Balaikota Yogyakarta • Pelaksanaan: Ahad, 11 Oktober 2026 di SMPN 1 Yogyakarta
          </p>
        </div>

        {/* Title */}
        <div className="text-center my-4">
          <h4 className="font-bold text-base underline uppercase text-slate-900">
            REKAPITULASI NOMINASI TETAP PESERTA LOMBA
          </h4>
          <p className="text-xs font-semibold text-slate-700 mt-0.5">
            {activeKemantren ? `KONTINGEN KEMANTREN ${activeKemantren.name.toUpperCase()}` : 'SEMUA KONTINGEN 14 KEMANTREN KOTA YOGYAKARTA'}
          </p>
        </div>

        {/* Table */}
        <table className="w-full text-left text-xs border-collapse border border-slate-400 mt-4">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold">
              <th className="border border-slate-400 py-2 px-2.5 text-center w-10">No</th>
              <th className="border border-slate-400 py-2 px-2.5">No. Registrasi</th>
              <th className="border border-slate-400 py-2 px-2.5">Nama Lengkap Santri</th>
              <th className="border border-slate-400 py-2 px-2.5 text-center w-12">L/P</th>
              <th className="border border-slate-400 py-2 px-2.5">Tgl Lahir (Usia 1 Juli 2027)</th>
              <th className="border border-slate-400 py-2 px-2.5">Kemantren & Unit TPA</th>
              <th className="border border-slate-400 py-2 px-2.5">Cabang Lomba</th>
              <th className="border border-slate-400 py-2 px-2.5 text-center w-16">No. Undian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {filtered.map((p, idx) => {
              const cat = getCategory(p.categoryId);
              const kem = getKemantren(p.kemantrenId);

              return (
                <tr key={p.id}>
                  <td className="border border-slate-400 py-2 px-2 text-center">{idx + 1}</td>
                  <td className="border border-slate-400 py-2 px-2.5 font-mono font-bold">{p.registrationNumber}</td>
                  <td className="border border-slate-400 py-2 px-2.5 font-semibold text-slate-900">{p.fullName}</td>
                  <td className="border border-slate-400 py-2 px-2 text-center font-bold">{p.gender}</td>
                  <td className="border border-slate-400 py-2 px-2.5">
                    {p.birthDate} ({p.ageOnCutoff.years}th {p.ageOnCutoff.months}bln)
                  </td>
                  <td className="border border-slate-400 py-2 px-2.5">
                    Kem. {kem?.name} - {p.tpaUnitName}
                  </td>
                  <td className="border border-slate-400 py-2 px-2.5 font-medium">
                    [{cat?.level}] {cat?.name}
                  </td>
                  <td className="border border-slate-400 py-2 px-2 text-center font-mono font-bold">
                    {p.lotteryNumber ? String(p.lotteryNumber).padStart(2, '0') : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Tanda Tangan */}
        <div className="grid grid-cols-2 gap-8 mt-12 text-xs text-center text-slate-900">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Ketua Umum BADKO TKA-TPA Kota Yogyakarta</p>
            <div className="h-20"></div>
            <p className="font-bold underline">( H. Muhammad Anis, S.Pd.I )</p>
          </div>
          <div>
            <p>Yogyakarta, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="font-bold">
              {activeKemantren ? `Ketua Kontingen Kemantren ${activeKemantren.name}` : 'Ketua Panitia Pelaksana FASI XIII'}
            </p>
            <div className="h-20"></div>
            <p className="font-bold underline">
              ( {activeKemantren ? activeKemantren.adminName : 'Ust. H. Rahmat Hidayat, M.S.I'} )
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
