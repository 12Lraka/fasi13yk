/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Modal Audit Log & Riwayat Keamanan
 */

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, History, Search, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { AuditLog } from '../../types/fasi';
import { getStoredAuditLogs } from '../../utils/storage';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterText, setFilterText] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setLogs(getStoredAuditLogs());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(
    (log) =>
      log.user.toLowerCase().includes(filterText.toLowerCase()) ||
      log.action.toLowerCase().includes(filterText.toLowerCase()) ||
      log.details.toLowerCase().includes(filterText.toLowerCase()) ||
      log.status.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Audit Trail & Rekam Jejak Keamanan</h3>
              <p className="text-xs text-emerald-300">Log Aktivitas Pendaftaran, Undian & Penjurian</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors"
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
              placeholder="Filter riwayat aktivitas / pengguna / status..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Logs List Table */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-36">Waktu (WIB)</th>
                  <th className="py-2.5 px-3 w-36">Pengguna</th>
                  <th className="py-2.5 px-3 w-32">Aksi</th>
                  <th className="py-2.5 px-3">Rincian Perubahan</th>
                  <th className="py-2.5 px-3 text-center w-24">Status</th>
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
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
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
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{log.user}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-emerald-800 font-bold">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px]">{log.details}</td>
                      <td className="py-2.5 px-3 text-center">
                        {log.status === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            <ShieldAlert className="w-3 h-3" />
                            BLOCKED
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

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filteredLogs.length} entri audit</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
