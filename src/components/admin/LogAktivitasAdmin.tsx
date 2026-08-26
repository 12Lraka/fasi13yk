/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Panel Log & Rekam Jejak Aktivitas Canggih (Audit Trail & Error Diagnostics)
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
  Printer,
  Bug,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileJson,
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
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
          (log.stack && log.stack.toLowerCase().includes(term)) ||
          (log.ipMock && log.ipMock.toLowerCase().includes(term));
        if (!match) return false;
      }
      return true;
    });
  }, [logs, statusFilter, searchTerm]);

  // Statistik Log
  const logStats = useMemo(() => {
    let success = 0;
    let errors = 0;
    let bots = 0;
    let flagged = 0;

    logs.forEach((l) => {
      if (l.status === 'SUCCESS') success += 1;
      else if (l.status === 'ERROR') errors += 1;
      else if (l.status === 'BLOCKED_BOT') bots += 1;
      else if (l.status === 'FLAGGED') flagged += 1;
    });

    return { total: logs.length, success, errors, bots, flagged };
  }, [logs]);

  const handleClearLogs = async () => {
    const confirm = await showConfirmDialog(
      'Bersihkan Riwayat Log?',
      'Apakah Anda yakin ingin mengosongkan seluruh riwayat audit log aktivitas & diagnostik error?',
      'Ya, Bersihkan Log',
      '#dc2626'
    );
    if (!confirm) return;

    clearAuditLogs();
    refreshLogs();
    showToast('success', 'Riwayat log berhasil dibersihkan.');
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Audit_Error_Log_FASI_XIII_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('success', 'File log berhasil diekspor ke JSON!');
  };

  const handleCopyStack = (log: AuditLog) => {
    const textToCopy = `[${log.timestamp}] [${log.status}] ${log.action}\nPengguna: ${log.user}\nRincian: ${log.details}\n${log.stack ? `Stack Trace:\n${log.stack}` : ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(log.id);
    showToast('success', 'Rincian error berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handlePrint = () => {
    window.focus();
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
                Audit Trail & Error Diagnostics
              </span>
              <span className="text-xs text-slate-500 font-medium">Rekam Jejak & Diagnostik Sistem</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1">
              Log Aktivitas & Diagnostik Error FASI XIII
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Pencatatan login, perubahan santri, pengundian, presensi QR, cetak ID card, pencegahan bot, dan pelacak error sistem otomatis.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={handleExportJson}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Unduh data log format JSON"
            >
              <FileJson className="w-4 h-4 text-emerald-700" />
              <span>Ekspor JSON</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak Log</span>
            </button>

            {session.role === 'super_admin' && (
              <button
                onClick={handleClearLogs}
                className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Bersihkan Log</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stat Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semua ({logStats.total})
          </button>
          <button
            onClick={() => setStatusFilter('ERROR')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'ERROR'
                ? 'bg-rose-600 text-white shadow-xs'
                : logStats.errors > 0
                ? 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Error Sistem ({logStats.errors})</span>
          </button>
          <button
            onClick={() => setStatusFilter('SUCCESS')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'SUCCESS'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sukses ({logStats.success})</span>
          </button>
          <button
            onClick={() => setStatusFilter('BLOCKED_BOT')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'BLOCKED_BOT'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Bot Dicegah ({logStats.bots})</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari pengguna, aksi, error, stack trace, rincian aktivitas..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-mono"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none cursor-pointer font-semibold"
            >
              <option value="ALL">Semua Status Log</option>
              <option value="ERROR">❌ Error Sistem (ERROR)</option>
              <option value="SUCCESS">✅ Aksi Sukses (SUCCESS)</option>
              <option value="BLOCKED_BOT">🛡️ Bot Dicegah (BLOCKED_BOT)</option>
              <option value="FLAGGED">⚠️ Terindikasi (FLAGGED)</option>
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
                <th className="py-2.5 px-3 w-40">Aksi / Event</th>
                <th className="py-2.5 px-3">Rincian Aktivitas & Diagnostik</th>
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
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const isError = log.status === 'ERROR';

                  return (
                    <React.Fragment key={log.id}>
                      <tr className={`transition-colors ${isError ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50'}`}>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap align-top">
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
                        <td className="py-2 px-3 font-bold text-slate-900 align-top">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{log.user}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-[11px] align-top">
                          <span className={isError ? 'text-rose-700' : 'text-emerald-950'}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-700 text-[11.5px] leading-relaxed align-top">
                          <div className="space-y-1">
                            <p className={isError ? 'font-semibold text-rose-900' : ''}>
                              {log.details}
                            </p>
                            {log.stack && (
                              <button
                                type="button"
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer"
                              >
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                <span>{isExpanded ? 'Sembunyikan Stack Trace' : 'Lihat Stack Trace Error'}</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap align-top">
                          {log.status === 'SUCCESS' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <ShieldCheck className="w-3 h-3" />
                              <span>SUKSES</span>
                            </span>
                          ) : log.status === 'ERROR' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                              <Bug className="w-3 h-3" />
                              <span>ERROR</span>
                            </span>
                          ) : log.status === 'BLOCKED_BOT' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <ShieldAlert className="w-3 h-3" />
                              <span>BOT BLOCKED</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800">
                              <AlertTriangle className="w-3 h-3" />
                              <span>FLAGGED</span>
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Stack Trace Viewer */}
                      {isExpanded && log.stack && (
                        <tr className="bg-slate-900 text-slate-100 font-mono text-[10.5px]">
                          <td colSpan={5} className="p-4 space-y-2">
                            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                              <div className="flex items-center gap-2 text-amber-400 font-bold">
                                <Bug className="w-4 h-4" />
                                <span>Stack Trace Error Diagnostik</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyStack(log)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                {copiedId === log.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400 font-bold">Tersalin!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Salin Rincian Error</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="whitespace-pre-wrap overflow-x-auto text-rose-300 leading-relaxed max-h-48 overflow-y-auto p-2 bg-slate-950 rounded-lg">
                              {log.stack}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
