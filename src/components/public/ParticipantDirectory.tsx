/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Direktori Peserta Publik Terverifikasi (Paginasi 10 Baris, Filter, Pencarian Real-time)
 */

import React, { useState, useMemo } from 'react';
import { Search, Users, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { Participant } from '../../types/fasi';
import { KEMANTREN_LIST, CATEGORIES_LIST } from '../../data/fasiMasterData';

interface ParticipantDirectoryProps {
  participants: Participant[];
  onViewIdCard?: (participant: Participant) => void;
}

export const ParticipantDirectory: React.FC<ParticipantDirectoryProps> = ({
  participants,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedKemantren, setSelectedKemantren] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Filter Data
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const matchSearch =
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tpaUnitName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchKemantren = selectedKemantren === 'ALL' || p.kemantrenId === selectedKemantren;

      const cat = CATEGORIES_LIST.find((c) => c.id === p.categoryId);
      const matchLevel = selectedLevel === 'ALL' || (cat && cat.level === selectedLevel);
      const matchCategory = selectedCategory === 'ALL' || p.categoryId === selectedCategory;

      return matchSearch && matchKemantren && matchLevel && matchCategory;
    });
  }, [participants, searchTerm, selectedKemantren, selectedLevel, selectedCategory]);

  // Pagination Math
  const totalPages = Math.max(1, Math.ceil(filteredParticipants.length / itemsPerPage));
  const displayedParticipants = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredParticipants.slice(start, start + itemsPerPage);
  }, [filteredParticipants, currentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getKemantrenName = (id: string) => {
    const k = KEMANTREN_LIST.find((item) => item.id === id);
    return k ? k.name : id;
  };

  const getCategoryDetails = (id: string) => {
    return CATEGORIES_LIST.find((c) => c.id === id);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Direktori Peserta FASI XIII</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Daftar resmi santri terverifikasi dari 14 Kemantren se-Kota Yogyakarta.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Total Terverifikasi: {participants.filter((p) => p.status === 'verified').length} Santri</span>
          </div>
        </div>

        {/* Filters & Search Control Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari Nama / No. Reg / Unit TPA..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Kemantren Filter */}
          <div>
            <select
              value={selectedKemantren}
              onChange={(e) => {
                setSelectedKemantren(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-medium"
            >
              <option value="ALL">Semua Kemantren (14 Wilayah)</option>
              {KEMANTREN_LIST.map((k) => (
                <option key={k.id} value={k.id}>
                  Kemantren {k.name} ({k.code})
                </option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-medium"
            >
              <option value="ALL">Semua Jenjang (TKA, TPA, TQA)</option>
              <option value="TKA">Jenjang TKA (4 - 7 Tahun)</option>
              <option value="TPA">Jenjang TPA (&gt;7 - 12 Tahun)</option>
              <option value="TQA">Jenjang TQA (&gt;12 - 15 Tahun)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-medium"
            >
              <option value="ALL">Semua Cabang Lomba (18 Cabang)</option>
              {CATEGORIES_LIST.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.level}] {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table & Result List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">No. Registrasi</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4 text-center">Jenis Kelamin</th>
                <th className="py-3 px-4">Kemantren & Unit TPA</th>
                <th className="py-3 px-4">Cabang Lomba</th>
                <th className="py-3 px-4 text-center">No. Undian</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayedParticipants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada santri yang sesuai dengan kriteria pencarian / filter.
                  </td>
                </tr>
              ) : (
                displayedParticipants.map((p, index) => {
                  const cat = getCategoryDetails(p.categoryId);
                  const rowNum = (currentPage - 1) * itemsPerPage + index + 1;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-medium text-slate-400">{rowNum}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                        {p.registrationNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{p.fullName}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                            p.gender === 'L'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-pink-50 text-pink-700 border border-pink-200'
                          }`}
                        >
                          {p.gender === 'L' ? 'Putra' : 'Putri'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          Kemantren {getKemantrenName(p.kemantrenId)}
                        </div>
                        <div className="text-[11px] text-slate-500">{p.tpaUnitName}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {cat && (
                          <div>
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                cat.level === 'TKA'
                                    ? 'bg-emerald-100 text-emerald-800'
                                  : cat.level === 'TPA'
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              {cat.level}
                            </span>
                            <span className="ml-1.5 font-medium text-slate-800">{cat.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {p.lotteryNumber ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold font-mono text-xs border border-amber-300">
                            {String(p.lotteryNumber).padStart(2, '0')}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Belum Diundi</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {p.status === 'verified' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Sah
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Menampilkan{' '}
            <strong className="text-slate-800">
              {filteredParticipants.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </strong>{' '}
            s.d.{' '}
            <strong className="text-slate-800">
              {Math.min(currentPage * itemsPerPage, filteredParticipants.length)}
            </strong>{' '}
            dari <strong className="text-slate-800">{filteredParticipants.length}</strong> peserta
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded bg-white border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 font-medium"
            >
              Sebelumnya
            </button>
            <div className="px-3 py-1.5 font-bold text-slate-800 bg-white border border-slate-300 rounded">
              {currentPage} / {totalPages}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded bg-white border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 font-medium"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
