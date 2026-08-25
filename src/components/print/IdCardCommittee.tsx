/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistem Informasi FASI XIII Kota Yogyakarta
 * Komponen ID Card Panitia Pelaksana Resmi (Portrait 85mm x 55mm)
 * Dilengkapi Space Area Tempel Nama / Cetak Digital Divisi
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
  theme = ID_CARD_THEMES.maroon, // Default committee can be maroon, gold, or selected theme
  customTagline = 'Santri Hebat, Hebat Prestasi, Hebat Mengaji, & Berakhlakul Karimah.',
}) => {
  const hasDigitalName = Boolean(data.name && data.name.trim().length > 0);

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

      {/* 3. Middle Content: Tulisan PANITIA BOLD BESAR + Space Area Tempel Nama */}
      <div className="relative z-10 my-auto py-1 text-center flex flex-col items-center justify-center space-y-1.5">
        {/* Tulisan PANITIA Bold Besar */}
        <div
          className="w-full py-1 rounded-lg tracking-widest uppercase font-black text-sm sm:text-base shadow-xs"
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
            className="inline-block px-2 py-0.5 rounded-full font-black text-[8px] tracking-wider uppercase"
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
            className="w-full rounded-lg py-1.5 px-2 border bg-white/90 shadow-2xs"
            style={{ borderColor: `${theme.borderColor}60` }}
          >
            <span className="text-[6.5px] uppercase font-bold block text-slate-400">
              Nama Panitia
            </span>
            <h4
              className="font-black text-[10.5px] leading-tight uppercase font-sans tracking-tight line-clamp-2"
              style={{ color: theme.textColor }}
            >
              {data.name}
            </h4>
            <span className="text-[6.5px] font-bold text-slate-500 block uppercase mt-0.5">
              {data.accessLevel || 'ALL ACCESS'}
            </span>
          </div>
        ) : (
          /* Area Tempel Nama Blanko yang Presisi & Bersih */
          <div
            className="w-full rounded-lg p-2 border-2 border-dashed bg-white/80 flex flex-col items-center justify-center min-h-[16mm]"
            style={{
              borderColor: `${theme.borderColor}70`,
            }}
          >
            <span className="text-[6px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              [ AREA TEMPEL NAMA / TULIS NAMA ]
            </span>
            <div className="w-4/5 h-[1px] bg-slate-300 my-0.5" />
            <span className="text-[5.5px] font-medium text-slate-400">
              Label Stiker No. 103 / 107
            </span>
          </div>
        )}
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
