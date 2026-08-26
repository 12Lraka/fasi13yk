/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Komponen ID Card Official Kontingen Rayon (Portrait 5.5cm x 8.8cm)
 * Menggunakan Template Kartu Resmi Supabase
 */

import React from 'react';
import { ID_CARD_ASSETS, ID_CARD_THEMES, IdCardTheme } from './idCardThemes';

export interface OfficialCardData {
  id: string;
  name: string;
  role: string; // e.g. "Ketua Kontingen", "Official Pendamping", "Koordinator Lomba", "Medis"
  kemantrenName: string;
  kemantrenCode?: string;
  contactNumber?: string;
}

interface IdCardOfficialProps {
  data: OfficialCardData;
  theme?: IdCardTheme;
  customTagline?: string;
}

export const IdCardOfficial: React.FC<IdCardOfficialProps> = ({
  data,
  theme = ID_CARD_THEMES.navy,
  customTagline = 'Santri Hebat, Hebat Prestasi, Hebat Mengaji, & Berakhlakul Karimah.',
}) => {
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

      {/* 2. Middle Content: Tulisan OFFICIAL BOLD BESAR & Nama Kontingen */}
      <div className="relative z-10 my-auto py-1 text-center flex flex-col items-center justify-center space-y-1.5">
        {/* Tulisan OFFICIAL Bold Besar */}
        <div
          className="w-full py-1.5 rounded-lg tracking-widest uppercase font-black text-sm shadow-xs"
          style={{
            backgroundColor: theme.badgeBg,
            color: theme.badgeText,
            letterSpacing: '0.2em',
          }}
        >
          OFFICIAL
        </div>

        {/* Info Rayon Asal */}
        <div className="w-full">
          <span className="text-[6px] uppercase font-bold text-slate-500 block tracking-wider mb-0.2">
            Kontingen Rayon
          </span>
          <h3
            className="font-black text-[11px] uppercase tracking-tight leading-tight"
            style={{ color: theme.primaryColor }}
          >
            {data.kemantrenName ? (data.kemantrenName.startsWith('Rayon') ? data.kemantrenName : `Rayon ${data.kemantrenName.replace(/^Kemantren\s*/i, '')}`) : 'RAYON KOTA YOGYAKARTA'}
          </h3>
        </div>

        {/* Nama Official & Jabatan */}
        <div
          className="w-full rounded-md py-1.5 px-2 border bg-white/85 shadow-2xs backdrop-blur-xs"
          style={{
            borderColor: `${theme.borderColor}50`,
          }}
        >
          <span className="text-[6px] uppercase font-bold block text-slate-500">
            Nama Lengkap Official
          </span>
          <h4
            className="font-extrabold text-[10px] leading-tight uppercase font-sans tracking-tight line-clamp-2"
            style={{ color: theme.textColor }}
          >
            {data.name || 'Official Pendamping'}
          </h4>
          <span
            className="inline-block mt-0.5 font-bold text-[7px] px-2 py-0.2 rounded-full"
            style={{
              color: theme.subtextColor,
              backgroundColor: `${theme.borderColor}15`,
            }}
          >
            {data.role || 'Official Kontingen'}
          </span>
        </div>
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
