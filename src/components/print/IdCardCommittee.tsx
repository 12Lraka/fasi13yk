/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Komponen ID Card Panitia Pelaksana Resmi (Portrait 5.5cm x 8.8cm)
 * Menggunakan Template Kartu Resmi Supabase
 */

import React from 'react';
import { ID_CARD_ASSETS, ID_CARD_THEMES, IdCardTheme } from './idCardThemes';

export interface CommitteeCardData {
  id: string;
  name?: string; // Optional: If empty, provides empty space area for physical sticker/handwritten name
  division: string; // e.g. "Sie Acara & Lomba", "Dewan Juri", "Sie IT & Registrasi", "Sie Konsumsi", "Ketua Panitia"
  accessLevel?: string; // e.g. "ALL ACCESS", "PANITIA INTI", "JURI LOMBA"
}

interface IdCardCommitteeProps {
  data: CommitteeCardData;
  theme?: IdCardTheme;
  customTagline?: string;
}

export const IdCardCommittee: React.FC<IdCardCommitteeProps> = ({
  data,
  theme = ID_CARD_THEMES.maroon,
  customTagline = 'Santri Hebat, Hebat Prestasi, Hebat Mengaji, & Berakhlakul Karimah.',
}) => {
  const hasDigitalName = Boolean(data.name && data.name.trim().length > 0);

  // Dynamic font sizing
  const nameLength = (data.name || '').trim().length;
  let nameFontSizeClass = 'text-[11px] leading-[1.2]';
  if (nameLength > 30) {
    nameFontSizeClass = 'text-[8.5px] leading-[1.12]';
  } else if (nameLength > 22) {
    nameFontSizeClass = 'text-[9.5px] leading-[1.15]';
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

      {/* 2. Middle Content: Divisi / Jabatan + Area Nama */}
      <div className="relative z-10 my-auto py-1 text-center flex flex-col items-center justify-center space-y-1.5">
        {/* Badge Panitia: Cukup PANITIA besar & jelas */}
        <div
          className="inline-flex items-center justify-center px-4 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xs"
          style={{
            backgroundColor: theme.badgeBg,
            color: theme.badgeText,
          }}
        >
          <span>PANITIA</span>
        </div>

        {/* Divisi / Seksi Panitia */}
        <div className="w-full pt-0.5">
          <span className="text-[5.5px] uppercase font-extrabold text-slate-500 block tracking-widest mb-0.5">
            SEKSI / DIVISI
          </span>
          <h3
            className="font-black text-[11px] uppercase tracking-tight leading-tight m-0"
            style={{ color: theme.primaryColor }}
          >
            {data.division || 'PANITIA FASI XIII'}
          </h3>
        </div>

        {/* Space Area untuk Tempel Nama / Tulisan Nama */}
        {hasDigitalName ? (
          <div
            className="w-full rounded-md py-1.5 px-2 border bg-white/95 shadow-2xs"
            style={{ borderColor: `${theme.borderColor}60` }}
          >
            <span className="text-[5.5px] uppercase font-bold block text-slate-500 tracking-wider">
              NAMA LENGKAP PANITIA
            </span>
            <h4
              className={`font-black uppercase font-sans tracking-tight line-clamp-2 ${nameFontSizeClass}`}
              style={{ color: theme.textColor }}
            >
              {data.name}
            </h4>
            <div className="mt-0.5">
              <span
                className="inline-block font-extrabold text-[7px] uppercase tracking-wider px-2 py-0.2 rounded"
                style={{
                  color: theme.accentColor,
                  backgroundColor: `${theme.accentColor}18`,
                }}
              >
                {data.accessLevel || 'ALL ACCESS'}
              </span>
            </div>
          </div>
        ) : (
          /* Area Tempel Nama Blanko yang Bersih */
          <div
            className="w-full rounded-md p-1.5 border-2 border-dashed bg-white/95 flex flex-col items-center justify-center min-h-[14mm]"
            style={{
              borderColor: `${theme.borderColor}70`,
            }}
          >
            <span className="text-[6px] font-extrabold uppercase tracking-wider text-slate-600 mb-0.5">
              [ TEMPEL LABEL / TULIS NAMA ]
            </span>
            <div className="w-3/4 h-[1px] bg-slate-300 my-0.5" />
            <span className="text-[5.5px] font-bold text-slate-500">
              Format Stiker Label No. 103 / 107
            </span>
          </div>
        )}
      </div>

      {/* 3. Bottom Footer: Tagline & BADKO TKA-TPA KOTA YOGYAKARTA */}
      <div className="relative z-10 pt-0.5 text-center flex flex-col items-center justify-end space-y-0.5 shrink-0">
        <p
          className="text-[5px] italic leading-tight font-serif px-1 line-clamp-1 m-0"
          style={{ color: theme.taglineColor }}
        >
          “{customTagline}”
        </p>

        <p className="text-[5.5px] font-extrabold text-slate-700 uppercase tracking-wider m-0">
          BADKO TKA-TPA KOTA YOGYAKARTA
        </p>
      </div>
    </div>
  );
};
