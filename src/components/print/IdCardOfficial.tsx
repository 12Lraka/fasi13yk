/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Komponen ID Card Official Kontingen Kemantren (Portrait 85mm x 55mm)
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
  theme = ID_CARD_THEMES.navy, // Default official is royal navy or selected theme
  customTagline = 'Santri Hebat, Hebat Prestasi, Hebat Mengaji, & Berakhlakul Karimah.',
}) => {
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
          className="w-[125px] h-[125px] object-contain rotate-[-12deg] scale-115"
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

      {/* 3. Middle Content: Tulisan OFFICIAL BOLD BESAR & Nama Kontingen */}
      <div className="relative z-10 my-auto py-1 text-center flex flex-col items-center justify-center space-y-2">
        {/* Tulisan OFFICIAL Bold Besar */}
        <div
          className="w-full py-1 rounded-lg tracking-widest uppercase font-black text-sm sm:text-base shadow-xs"
          style={{
            backgroundColor: theme.badgeBg,
            color: theme.badgeText,
            letterSpacing: '0.18em',
          }}
        >
          OFFICIAL
        </div>

        {/* Info Kemantren Asal */}
        <div className="w-full">
          <span className="text-[6.5px] uppercase font-bold text-slate-400 block tracking-wider mb-0.5">
            Kontingen Kemantren
          </span>
          <h3
            className="font-black text-[11px] uppercase tracking-tight leading-tight"
            style={{ color: theme.primaryColor }}
          >
            {data.kemantrenName || 'KEMANTREN KOTA YOGYAKARTA'}
          </h3>
        </div>

        {/* Nama Official & Jabatan */}
        <div
          className="w-full rounded-lg py-1.5 px-2 border"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            borderColor: `${theme.borderColor}40`,
          }}
        >
          <span className="text-[6.5px] uppercase font-bold block text-slate-400">
            Nama Lengkap Official
          </span>
          <h4
            className="font-extrabold text-[10px] leading-tight uppercase font-sans tracking-tight line-clamp-2"
            style={{ color: theme.textColor }}
          >
            {data.name || 'Official Kontingen'}
          </h4>
          <span
            className="inline-block mt-0.5 font-bold text-[7.5px] px-2 py-0.2 rounded-full"
            style={{
              color: theme.subtextColor,
              backgroundColor: `${theme.borderColor}15`,
            }}
          >
            {data.role || 'Pendamping Kontingen'}
          </span>
        </div>
      </div>

      {/* 4. Bottom Footer: Tanpa QR Code */}
      <div
        className="relative z-10 pt-1.5 border-t text-center space-y-1"
        style={{ borderColor: `${theme.borderColor}40` }}
      >
        <p
          className="text-[6.5px] italic leading-tight line-clamp-2 font-serif px-1"
          style={{ color: theme.taglineColor }}
        >
          “{customTagline}”
        </p>

        <div
          className="w-full py-0.5 rounded text-[6.5px] font-black tracking-wider uppercase"
          style={{ backgroundColor: `${theme.primaryColor}10`, color: theme.primaryColor }}
        >
          BADKO TKA-TPA KOTA YOGYAKARTA
        </div>
      </div>
    </div>
  );
};
