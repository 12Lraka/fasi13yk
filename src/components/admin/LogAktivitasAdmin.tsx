/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Panel Log & Rekam Jejak Aktivitas (Audit Trail)
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  History,
  Search,
  Trash2,
  Download,
  Filter,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  User,
  RotateCcw,
  Printer
} from 'lucide-react';
import { AuditLog, UserSession } from '../../types/fasi';
import { getStoredAuditLogs, clearAuditLogs, logAuditEvent } from '../../utils/storage';
import { showConfirmDialog, showToast } from '../../utils/sweetalert';

interface LogAktivitasAdminProps {
  session: UserSession;
}

export const LogAktivitasAdmin: React.FC<LogAktivitasAdminProps> = ({ session }) => {
  const [logs, setLogs] = useState<AuditLog[]>(() => getStoredAuditLogs());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const refreshLogs = () => {
    setLogs(getStoredAuditLogs());
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const match =
          log.user.toLowerCase().includes(term) ||
          log.action.toLowerCase().includes(term) ||
          log.details.toLowerCase().includes(term) ||
          (log.ipMock && log.ipMock.toLowerCase().includes(term));
        if (!match) return false;
      }
      return true;
    });
  }, [logs, statusFilter, searchTerm]);

  const handleClearLogs = async () => {
    const confirm = await showConfirmDialog(
      'Bersihkan Riwayat Log?',
      'Apakah Anda yakin ingin mengosongkan seluruh riwayat audit log aktivitas?',
      'Ya, Bersihkan Log',
      '#dc2626'
    );
    if (!confirm) return;

    clearAuditLogs();
    refreshLogs();
    showToast('success', 'Riwayat log berhasil dibersihkan.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="no-print bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 font-extrabold text-[10px] uppercase tracking-wider rounded-md">
                Audit Trail & Security Log
              </span>
              <span className="text-xs text-slate-500 font-medium">Rekam Jejak Sistem</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1">
              Log Aktivitas & Riwayat Transaksi FASI XIII
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Semua pencatatan login, perubahan pendaftaran santri, pengundian nomor tampil, input nilai dewan hakim, dan pencegahan bot tercatat di sini.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak Log</span>
            </button>

            {session.role === 'super_admin' && (
              <button
                onClick={handleClearLogs}
                className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Bersihkan Log</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari pengguna, aksi, rincian aktivitas..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status Log</option>
              <option value="SUCCESS">Aksi Sukses (SUCCESS)</option>
              <option value="BLOCKED_BOT">Bot Dicegah (BLOCKED_BOT)</option>
              <option value="FLAGGED">Aktivitas Terindikasi (FLAGGED)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Daftar Rekam Jejak ({filteredLogs.length} Catatan)
          </h3>
          <button
            onClick={refreshLogs}
            className="no-print text-xs font-semibold text-emerald-800 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3 w-36">Waktu (WIB)</th>
                <th className="py-2.5 px-3 w-32">Pengguna</th>
                <th className="py-2.5 px-3 w-36">Aksi / Event</th>
                <th className="py-2.5 px-3">Rincian Aktivitas</th>
                <th className="py-2.5 px-3 text-center w-28">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                    Belum ada rekaman aktivitas yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {(() => {
                        if (!log.timestamp) return '-';
                        if (log.timestamp.includes('T')) {
                          const d = new Date(log.timestamp);
                          if (!isNaN(d.getTime())) {
                            return d.toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            });
                          }
                        }
                        return log.timestamp;
                      })()}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{log.user}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-[11px] text-emerald-950">
                      {log.action}
                    </td>
                    <td className="py-2 px-3 text-slate-700 text-[11.5px] leading-relaxed">
                      {log.details}
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      {log.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <ShieldCheck className="w-3 h-3" />
                          <span>SUKSES</span>
                        </span>
                      ) : log.status === 'BLOCKED_BOT' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <ShieldAlert className="w-3 h-3" />
                          <span>BOT BLOCKED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3" />
                          <span>FLAGGED</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
