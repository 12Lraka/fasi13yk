/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Modal Audit Log & Riwayat Keamanan Canggih
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  History,
  Search,
  ShieldAlert,
  CheckCircle2,
  Bug,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';
import { AuditLog } from '../../types/fasi';
import { getStoredAuditLogs } from '../../utils/storage';
import { showToast } from '../../utils/sweetalert';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterText, setFilterText] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLogs(getStoredAuditLogs());
    }
  }, [isOpen]);

  const filteredLogs = useMemo(() => {
    return logs.filter(
      (log) =>
        log.user.toLowerCase().includes(filterText.toLowerCase()) ||
        log.action.toLowerCase().includes(filterText.toLowerCase()) ||
        log.details.toLowerCase().includes(filterText.toLowerCase()) ||
        (log.stack && log.stack.toLowerCase().includes(filterText.toLowerCase())) ||
        log.status.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [logs, filterText]);

  const handleCopyStack = (log: AuditLog) => {
    const textToCopy = `[${log.timestamp}] [${log.status}] ${log.action}\nPengguna: ${log.user}\nRincian: ${log.details}\n${log.stack ? `Stack Trace:\n${log.stack}` : ''}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(log.id);
    showToast('success', 'Rincian error disalin!');
    setTimeout(() => setCopiedId(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Audit Trail & Diagnostik Keamanan</h3>
              <p className="text-xs text-emerald-300">Log Aktivitas Pendaftaran, Undian, Presensi & Error</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter riwayat aktivitas, error, pengguna, atau aksi..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none font-mono"
            />
          </div>

          {/* Logs List Table */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-36">Waktu (WIB)</th>
                  <th className="py-2.5 px-3 w-32">Pengguna</th>
                  <th className="py-2.5 px-3 w-36">Aksi</th>
                  <th className="py-2.5 px-3">Rincian Perubahan / Error</th>
                  <th className="py-2.5 px-3 text-center w-28">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Tidak ada catatan riwayat audit.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    const isError = log.status === 'ERROR';

                    return (
                      <React.Fragment key={log.id}>
                        <tr className={`transition-colors ${isError ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-white'}`}>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap align-top">
                            {log.timestamp && log.timestamp.includes('T')
                              ? new Date(log.timestamp).toLocaleString('id-ID', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })
                              : log.timestamp}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900 align-top">{log.user}</td>
                          <td className="py-2 px-3 font-mono text-[11px] font-bold align-top">
                            <span className={isError ? 'text-rose-700' : 'text-emerald-800'}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-600 text-[11px] align-top">
                            <div>{log.details}</div>
                            {log.stack && (
                              <button
                                type="button"
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 hover:text-rose-900 underline mt-1 cursor-pointer"
                              >
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                <span>{isExpanded ? 'Tutup Stack Trace' : 'Lihat Stack Trace'}</span>
                              </button>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center align-top">
                            {log.status === 'SUCCESS' ? (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                OK
                              </span>
                            ) : log.status === 'ERROR' ? (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                                <Bug className="w-3 h-3" />
                                ERROR
                              </span>
                            ) : log.status === 'BLOCKED_BOT' ? (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                <ShieldAlert className="w-3 h-3" />
                                BOT
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-800">
                                <AlertTriangle className="w-3 h-3" />
                                FLAG
                              </span>
                            )}
                          </td>
                        </tr>

                        {isExpanded && log.stack && (
                          <tr className="bg-slate-900 text-slate-100 font-mono text-[10.5px]">
                            <td colSpan={5} className="p-3 space-y-2">
                              <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                                  <Bug className="w-3.5 h-3.5" />
                                  <span>Stack Trace Error</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopyStack(log)}
                                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedId === log.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400 font-bold">Tersalin!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Salin Error</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="whitespace-pre-wrap overflow-x-auto text-rose-300 max-h-36 overflow-y-auto p-2 bg-slate-950 rounded">
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

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filteredLogs.length} entri audit</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
