/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Komponen ID Card Peserta Resmi (Portrait 85mm x 55mm)
 */

import React from 'react';
import { Participant, CompetitionCategory } from '../../types/fasi';
import { ID_CARD_ASSETS, ID_CARD_THEMES, IdCardTheme } from './idCardThemes';

interface IdCardParticipantProps {
  participant: Participant;
  category?: CompetitionCategory;
  qrCodeUrl?: string;
  theme?: IdCardTheme;
  customTagline?: string;
}

export const IdCardParticipant: React.FC<IdCardParticipantProps> = ({
  participant,
  category,
  qrCodeUrl,
  theme = ID_CARD_THEMES.emerald,
  customTagline = 'Santri Hebat, Hebat Prestasi, Hebat Mengaji, & Berakhlakul Karimah.',
}) => {
  const genderText = participant.gender === 'L' ? 'Putra' : 'Putri';
  const cleanCategoryName = category?.name
    ? category.name.replace(/\s*\(Putra\)|\s*\(Putri\)/gi, '').trim()
    : participant.categoryId;
  const levelText = category?.level || (participant.categoryId.includes('tka') ? 'TKA' : participant.categoryId.includes('tqa') ? 'TQA' : 'TPA');

  return (
    <div
      className={`fasi-id-card relative bg-gradient-to-b ${theme.bgGradient} rounded-xl border-[1.5px] p-2.5 flex flex-col justify-between overflow-hidden shadow-sm select-none`}
      style={{
        width: '55mm',
        height: '85mm',
        boxSizing: 'border-box',
        borderColor: theme.borderColor,
      }}
    >
      {/* 1. Background Watermark Logo Desain */}
      <div
        className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 overflow-hidden"
        style={{ opacity: theme.watermarkOpacity }}
      >
        <img
          src={ID_CARD_ASSETS.watermarkDesain}
          alt="Watermark FASI"
          className="w-[120px] h-[120px] object-contain rotate-[-12deg] scale-110"
        />
      </div>

      {/* Islamic Corner Accents */}
      <div
        className="absolute top-1 left-1 w-3 h-3 border-t border-l pointer-events-none opacity-40 rounded-tl-sm"
        style={{ borderColor: theme.accentColor }}
      />
      <div
        className="absolute top-1 right-1 w-3 h-3 border-t border-r pointer-events-none opacity-40 rounded-tr-sm"
        style={{ borderColor: theme.accentColor }}
      />
      <div
        className="absolute bottom-1 left-1 w-3 h-3 border-b border-l pointer-events-none opacity-40 rounded-bl-sm"
        style={{ borderColor: theme.accentColor }}
      />
      <div
        className="absolute bottom-1 right-1 w-3 h-3 border-b border-r pointer-events-none opacity-40 rounded-br-sm"
        style={{ borderColor: theme.accentColor }}
      />

      {/* 2. Header: Logo Badko & Logo FASI berdampingan + Text Panitia */}
      <div className="relative z-10 text-center pb-1 border-b" style={{ borderColor: `${theme.borderColor}40` }}>
        <div className="flex items-center justify-center gap-2.5 mb-1">
          <img
            src={ID_CARD_ASSETS.logoBadko}
            alt="Logo Badko"
            className="h-6 sm:h-7 w-auto object-contain drop-shadow-xs"
          />
          <div className="h-5 w-[1px] bg-slate-300/80" />
          <img
            src={ID_CARD_ASSETS.logoFasi}
            alt="Logo FASI"
            className="h-6 sm:h-7 w-auto object-contain drop-shadow-xs"
          />
        </div>
        <div className="leading-tight">
          <p className="font-extrabold text-[8px] tracking-wider uppercase text-slate-800 font-sans">
            PANITIA FASI XIII
          </p>
          <p className="font-bold text-[7px] tracking-wider uppercase text-slate-600">
            KOTA YOGYAKARTA
          </p>
        </div>
      </div>

      {/* 3. Middle Content: Kategori, Nama Lengkap, Cabang Lomba */}
      <div className="relative z-10 my-auto py-1 text-center flex flex-col items-center justify-center space-y-1.5">
        {/* Badge Kategori */}
        <div
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[7.5px] font-black uppercase tracking-wider shadow-2xs"
          style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
        >
          <span>KARTU PESERTA</span>
          <span>•</span>
          <span>{levelText}</span>
        </div>

        {/* Nama Lengkap Peserta */}
        <div className="w-full px-1">
          <span className="text-[6.5px] uppercase font-bold text-slate-400 block tracking-wider mb-0.5">
            Nama Peserta
          </span>
          <h4
            className="font-black text-[10.5px] leading-tight uppercase font-sans tracking-tight line-clamp-2"
            style={{ color: theme.textColor }}
          >
            {participant.fullName}
          </h4>
          <span className="text-[7px] font-medium text-slate-500 block truncate mt-0.5">
            {participant.tpaUnitName || 'TPA Kontingen'}
          </span>
        </div>

        {/* Cabang Lomba & Gender */}
        <div
          className="w-full rounded-lg py-1 px-1.5 border"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            borderColor: `${theme.borderColor}40`,
          }}
        >
          <span className="text-[6.5px] uppercase font-bold block text-slate-400">
            Cabang Lomba
          </span>
          <p className="font-bold text-[8px] leading-tight text-slate-900 truncate">
            {cleanCategoryName}
          </p>
          <span
            className="inline-block mt-0.5 font-extrabold text-[7.5px] px-1.5 py-0.2 rounded"
            style={{ color: theme.accentColor, backgroundColor: `${theme.accentColor}15` }}
          >
            {genderText}
          </span>
        </div>
      </div>

      {/* 4. Bottom Footer: Pojok Kiri Tagline, Pojok Kanan QR Code */}
      <div
        className="relative z-10 pt-1 border-t flex items-end justify-between gap-1.5"
        style={{ borderColor: `${theme.borderColor}40` }}
      >
        {/* Pojok Kiri: Tagline */}
        <div className="flex-1 pr-1 text-left flex flex-col justify-end">
          <p
            className="text-[6px] italic leading-tight line-clamp-3 font-serif"
            style={{ color: theme.taglineColor }}
          >
            “{customTagline}”
          </p>
          <p className="text-[5.5px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
            BADKO TKA-TPA JOGJA
          </p>
        </div>

        {/* Pojok Kanan: QR Code */}
        <div className="shrink-0 flex flex-col items-center">
          <div className="p-0.5 bg-white border border-slate-300 rounded shadow-2xs">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt={`QR ${participant.registrationNumber}`}
                className="w-10 h-10 object-contain rounded-xs"
              />
            ) : (
              <div className="w-10 h-10 bg-slate-100 flex items-center justify-center text-[6px] text-slate-400">
                QR
              </div>
            )}
          </div>
          <span
            className="font-mono font-bold text-[5.5px] mt-0.5"
            style={{ color: theme.primaryColor }}
          >
            {participant.registrationNumber}
          </span>
        </div>
      </div>
    </div>
  );
};
