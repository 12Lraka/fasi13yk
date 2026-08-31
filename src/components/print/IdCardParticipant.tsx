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
  kemantrenName?: string;
  qrCodeUrl?: string;
  theme?: IdCardTheme;
  customTagline?: string;
}

export const IdCardParticipant: React.FC<IdCardParticipantProps> = ({
  participant,
  category,
  kemantrenName,
  qrCodeUrl,
  theme = ID_CARD_THEMES.emerald,
  customTagline = 'Santri Hebat, Hebat Prestasi, Hebat Mengaji, & Berakhlakul Karimah.',
}) => {
  const cleanCategoryName = category?.name
    ? category.name.replace(/\s*\(Putra\)|\s*\(Putri\)/gi, '').trim()
    : participant.categoryId;
  
  // Format level text: e.g. TKA, TPA, TQA
  const rawLevel = category?.level || (participant.categoryId.includes('tka') ? 'TKA' : participant.categoryId.includes('tqa') ? 'TQA' : 'TPA');
  const levelText = rawLevel.toUpperCase().trim();

  // Format Asal TPA & Rayon
  const rawKemantren = kemantrenName || (participant as any).kemantren || (participant as any).kemantrenName || '';
  const kemantrenClean = rawKemantren ? rawKemantren.replace(/^Kemantren\s*/i, '').replace(/^Rayon\s*/i, '').trim() : '';
  let displayTpaKemantren = participant.tpaUnitName || 'TPA Kontingen';
  if (participant.tpaUnitName && kemantrenClean) {
    displayTpaKemantren = `${participant.tpaUnitName}, Rayon ${kemantrenClean}`;
  } else if (kemantrenClean) {
    displayTpaKemantren = `Rayon ${kemantrenClean}`;
  }

  // Format Gender / Grup
  const isGroup = category?.isGroup || (category?.name && /cerdas cermat|nasyid|ikrar|peragaan/i.test(category.name));
  let genderDisplay = '';
  if (isGroup) {
    genderDisplay = 'Grup';
  } else if (participant.gender === 'L') {
    genderDisplay = 'Putra';
  } else if (participant.gender === 'P') {
    genderDisplay = 'Putri';
  }

  // Dynamic Font Size for participant full name
  const nameLength = (participant.fullName || '').trim().length;
  let nameFontSizeClass = 'text-[11px] leading-[1.2]';
  if (nameLength > 30) {
    nameFontSizeClass = 'text-[8.5px] leading-[1.12]';
  } else if (nameLength > 22) {
    nameFontSizeClass = 'text-[9.5px] leading-[1.15]';
  }

  // Dynamic Font Size for Cabang Lomba (Diperbesar secara tegas & adaptif terhadap panjang nama lomba)
  const catLength = cleanCategoryName.length;
  let catFontSizeClass = 'text-[11px] leading-[1.18]';
  if (catLength > 35) {
    catFontSizeClass = 'text-[8.5px] leading-[1.12]';
  } else if (catLength > 24) {
    catFontSizeClass = 'text-[9.5px] leading-[1.15]';
  } else if (catLength > 16) {
    catFontSizeClass = 'text-[10px] leading-[1.16]';
  }

  return (
    <div
      className="fasi-id-card relative flex flex-col justify-between overflow-hidden select-none bg-white text-slate-900 box-border"
      style={{
        width: '55mm',
        height: '88mm',
        minWidth: '55mm',
        maxWidth: '55mm',
        minHeight: '88mm',
        maxHeight: '88mm',
        padding: '2.5mm 3mm 2.2mm 3mm',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Background Template Image (Layered underneath all content) */}
      <img
        src={ID_CARD_ASSETS.templateKartu}
        alt="Template Kartu"
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* 1. Header: Logo Badko & Logo FASI berdampingan di posisi Center + Text Panitia */}
      <div className="relative z-10 text-center pt-0.5 pb-0.5 shrink-0">
        <div className="flex items-center justify-center gap-2 mb-0.5">
          <img
            src={ID_CARD_ASSETS.logoBadko}
            alt="Logo Badko"
            crossOrigin="anonymous"
            className="h-[6.5mm] max-h-[6.5mm] w-auto object-contain shrink-0"
          />
          <div className="h-[4.5mm] w-[1px] bg-slate-300 mx-0.5" />
          <img
            src={ID_CARD_ASSETS.logoFasi}
            alt="Logo FASI"
            crossOrigin="anonymous"
            className="h-[6.5mm] max-h-[6.5mm] w-auto object-contain shrink-0"
          />
        </div>
        <div className="leading-[1.15]">
          <p className="font-extrabold text-[7.5px] tracking-wider uppercase text-slate-900 font-sans m-0">
            PANITIA FASI XIII
          </p>
          <p className="font-bold text-[6.5px] tracking-wider uppercase text-slate-800 m-0">
            KOTA YOGYAKARTA 2026
          </p>
        </div>
      </div>

      {/* 2. Middle Content: Kategori (TKA/TPA/TQA), Nama Peserta, Asal TPA & Kemantren, Cabang Lomba, Gender */}
      <div className="relative z-10 my-auto py-0.5 text-center flex flex-col items-center justify-center space-y-1">
        {/* Badge Kategori: Cukup TKA / TPA / TQA besar & jelas */}
        <div
          className="inline-flex items-center justify-center px-4 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xs"
          style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
        >
          <span>{levelText}</span>
        </div>

        {/* Nama Peserta */}
        <div className="w-full px-0.5">
          <span className="text-[5.5px] uppercase font-extrabold text-slate-500 block tracking-widest mb-0.5">
            NAMA PESERTA
          </span>
          <h4
            className={`font-black uppercase font-sans tracking-tight line-clamp-2 ${nameFontSizeClass}`}
            style={{ color: theme.textColor }}
          >
            {participant.fullName}
          </h4>
          <span className="text-[6.5px] font-semibold text-slate-700 block truncate mt-0.5">
            {displayTpaKemantren}
          </span>
        </div>

        {/* Cabang Lomba & Jenis Kelamin */}
        <div
          className="w-full rounded-md py-1 px-1.5 border bg-white/95 shadow-2xs"
          style={{
            borderColor: `${theme.borderColor}60`,
          }}
        >
          <span className="text-[5.5px] uppercase font-bold block text-slate-500 tracking-wider">
            CABANG LOMBA
          </span>
          <p className={`font-black text-slate-900 leading-tight line-clamp-2 ${catFontSizeClass}`}>
            {cleanCategoryName}
          </p>
          {genderDisplay && (
            <span
              className="inline-block mt-0.5 font-extrabold text-[7px] px-2 py-0.2 rounded"
              style={{
                color: theme.accentColor,
                backgroundColor: `${theme.accentColor}18`,
              }}
            >
              {genderDisplay}
            </span>
          )}
        </div>
      </div>

      {/* 3. Bottom Footer: QR Code & No Peserta -> Tagline -> BADKO TKA-TPA KOTA YOGYAKARTA */}
      <div className="relative z-10 pt-0.5 text-center flex flex-col items-center justify-end space-y-0.5 shrink-0">
        {/* QR Code & No Peserta (Ukuran QR Code Diperbesar) */}
        <div className="flex flex-col items-center justify-center">
          <div className="p-0.5 bg-white border border-slate-300 rounded shadow-2xs inline-block">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt={`QR ${participant.registrationNumber}`}
                crossOrigin="anonymous"
                className="w-9 h-9 object-contain"
              />
            ) : (
              <div className="w-9 h-9 bg-slate-100 flex items-center justify-center text-[6px] text-slate-400 font-bold">
                QR
              </div>
            )}
          </div>
          <span
            className="font-mono font-bold text-[7px] mt-0.5 tracking-tight"
            style={{ color: theme.primaryColor }}
          >
            {participant.registrationNumber}
          </span>
        </div>

        {/* Tagline */}
        <p
          className="text-[5px] italic leading-tight font-serif px-1 line-clamp-1 m-0"
          style={{ color: theme.taglineColor }}
        >
          “{customTagline}”
        </p>

        {/* Tulisan Badko TKA-TPA Kota Yogyakarta */}
        <p className="text-[5.5px] font-extrabold text-slate-700 uppercase tracking-wider m-0">
          BADKO TKA-TPA KOTA YOGYAKARTA
        </p>
      </div>
    </div>
  );
};
