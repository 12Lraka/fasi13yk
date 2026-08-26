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

      {/* 2. Middle Content: Tulisan PANITIA BOLD BESAR + Divisi + Space Area Tempel Nama */}
      <div className="relative z-10 my-auto py-1 text-center flex flex-col items-center justify-center space-y-1.5">
        {/* Tulisan PANITIA Bold Besar */}
        <div
          className="w-full py-1.5 rounded-lg tracking-widest uppercase font-black text-sm shadow-xs"
          style={{
            backgroundColor: theme.badgeBg,
            color: theme.badgeText,
            letterSpacing: '0.2em',
          }}
        >
          PANITIA
        </div>

        {/* Divisi / Seksi Panitia */}
        <div className="w-full">
          <div
            className="inline-block px-2.5 py-0.5 rounded-full font-black text-[7.5px] tracking-wider uppercase shadow-2xs"
            style={{
              backgroundColor: `${theme.accentColor}20`,
              color: theme.accentColor,
            }}
          >
            {data.division || 'PANITIA PELAKSANA'}
          </div>
        </div>

        {/* Space Area untuk Tempel Nama / Tulisan Nama */}
        {hasDigitalName ? (
          <div
            className="w-full rounded-md py-1.5 px-2 border bg-white/85 shadow-2xs backdrop-blur-xs"
            style={{ borderColor: `${theme.borderColor}50` }}
          >
            <span className="text-[6px] uppercase font-bold block text-slate-500">
              Nama Panitia
            </span>
            <h4
              className="font-black text-[10px] leading-tight uppercase font-sans tracking-tight line-clamp-2"
              style={{ color: theme.textColor }}
            >
              {data.name}
            </h4>
            <span className="text-[6.5px] font-bold text-slate-600 block uppercase mt-0.5">
              {data.accessLevel || 'ALL ACCESS'}
            </span>
          </div>
        ) : (
          /* Area Tempel Nama Blanko yang Bersih */
          <div
            className="w-full rounded-md p-1.5 border-2 border-dashed bg-white/85 flex flex-col items-center justify-center min-h-[14mm] backdrop-blur-xs"
            style={{
              borderColor: `${theme.borderColor}70`,
            }}
          >
            <span className="text-[6px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
              [ TEMPEL LABEL / TULIS NAMA ]
            </span>
            <div className="w-3/4 h-[1px] bg-slate-300 my-0.5" />
            <span className="text-[5.5px] font-medium text-slate-500">
              Label Stiker No. 103 / 107
            </span>
          </div>
        )}
      </div>

      {/* 3. Bottom Footer: Tanpa QR Code -> Tagline -> Badko TKA TPA Kota Yogyakarta (Font Kecil) */}
      <div className="relative z-10 pt-1 text-center flex flex-col items-center justify-end space-y-0.5">
        <p
          className="text-[5.5px] italic leading-tight line-clamp-2 font-serif px-1 max-w-[95%]"
          style={{ color: theme.taglineColor }}
        >
          “{customTagline}”
        </p>

        <p className="text-[5px] font-extrabold text-slate-600 uppercase tracking-wider">
          Badko TKA TPA Kota Yogyakarta
        </p>
      </div>
    </div>
  );
};
