/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Komponen ID Card Peserta Resmi (Portrait 5.5cm x 8.8cm)
 * Menggunakan Template Kartu Resmi Supabase
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
      className="fasi-id-card relative rounded-none border-0 p-2.5 flex flex-col justify-between overflow-hidden shadow-none select-none bg-cover bg-center bg-no-repeat"
      style={{
        width: '5.5cm',
        height: '8.8cm',
        boxSizing: 'border-box',
        backgroundImage: `url(${ID_CARD_ASSETS.templateKartu})`,
      }}
    >
      {/* 1. Header: Logo Badko & Logo FASI berdampingan + Text Panitia */}
      <div className="relative z-10 text-center pb-1">
        <div className="flex items-center justify-center gap-2 mb-0.5">
          <img
            src={ID_CARD_ASSETS.logoBadko}
            alt="Logo Badko"
            crossOrigin="anonymous"
            className="h-6 w-auto object-contain drop-shadow-xs"
          />
          <div className="h-4 w-[1px] bg-slate-400/60" />
          <img
            src={ID_CARD_ASSETS.logoFasi}
            alt="Logo FASI"
            crossOrigin="anonymous"
            className="h-6 w-auto object-contain drop-shadow-xs"
          />
        </div>
        <div className="leading-tight">
          <p className="font-extrabold text-[7.5px] tracking-wider uppercase text-slate-900 font-sans">
            PANITIA FASI XIII
          </p>
          <p className="font-bold text-[6.5px] tracking-wider uppercase text-slate-700">
            KOTA YOGYAKARTA
          </p>
        </div>
      </div>

      {/* 2. Middle Content: Kategori, Nama Lengkap, Cabang Lomba */}
      <div className="relative z-10 my-auto py-0.5 text-center flex flex-col items-center justify-center space-y-1">
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
          <span className="text-[6px] uppercase font-bold text-slate-500 block tracking-wider mb-0.5">
            Nama Peserta
          </span>
          <h4
            className="font-black text-[10px] leading-tight uppercase font-sans tracking-tight line-clamp-2"
            style={{ color: theme.textColor }}
          >
            {participant.fullName}
          </h4>
          <span className="text-[6.5px] font-medium text-slate-600 block truncate mt-0.5">
            {participant.tpaUnitName || 'TPA Kontingen'}
          </span>
        </div>

        {/* Cabang Lomba & Gender */}
        <div
          className="w-full rounded-md py-1 px-1.5 border bg-white/80 shadow-2xs backdrop-blur-xs"
          style={{
            borderColor: `${theme.borderColor}50`,
          }}
        >
          <span className="text-[6px] uppercase font-bold block text-slate-500">
            Cabang Lomba
          </span>
          <p className="font-bold text-[7.5px] leading-tight text-slate-900 truncate">
            {cleanCategoryName}
          </p>
          <span
            className="inline-block mt-0.5 font-extrabold text-[7px] px-1.5 py-0.2 rounded"
            style={{ color: theme.accentColor, backgroundColor: `${theme.accentColor}15` }}
          >
            {genderText}
          </span>
        </div>
      </div>

      {/* 3. Bottom Footer: QR Code di Bawah Tengah -> Tagline -> Badko TKA TPA Kota Yogyakarta */}
      <div className="relative z-10 pt-1 text-center flex flex-col items-center justify-end space-y-0.5">
        {/* QR Code di Tengah */}
        <div className="p-0.5 bg-white border border-slate-300 rounded shadow-2xs inline-block">
          {qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt={`QR ${participant.registrationNumber}`}
              className="w-9 h-9 object-contain rounded-xs"
            />
          ) : (
            <div className="w-9 h-9 bg-slate-100 flex items-center justify-center text-[6px] text-slate-400">
              QR
            </div>
          )}
        </div>
        <span
          className="font-mono font-bold text-[5.5px]"
          style={{ color: theme.primaryColor }}
        >
          {participant.registrationNumber}
        </span>

        {/* Tagline */}
        <p
          className="text-[5.5px] italic leading-tight line-clamp-2 font-serif px-1 max-w-[95%]"
          style={{ color: theme.taglineColor }}
        >
          “{customTagline}”
        </p>

        {/* Tulisan Badko TKA TPA Kota Yogyakarta (Font Kecil) */}
        <p className="text-[5px] font-extrabold text-slate-600 uppercase tracking-wider">
          Badko TKA TPA Kota Yogyakarta
        </p>
      </div>
    </div>
  );
};
