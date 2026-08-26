# Sistem Informasi FASI XIII Kota Yogyakarta
Badko TKA-TPA Kota Yogyakarta

Aplikasi manajemen dan administrasi Festival Anak Sholeh Indonesia (FASI) XIII Tingkat Kota Yogyakarta.

## Fitur Utama
- **Pendaftaran & Rekap Peserta:** Manajemen data santri utusan 14 Kemantren se-Kota Yogyakarta.
- **Validasi Usia Otomatis:** Perhitungan usia otomatis berdasarkan tanggal cutoff FASI.
- **Undian Nomor Tampil:** Pengacakan nomor urut tampil transparan (Kategori Individu & Beregu/Grup).
- **Cetak ID Card Standar:** Generator ID Card Peserta, Official, dan Panitia format A4 (9 kartu per lembar) siap cetak dan ekspor PDF.
- **Presensi QR Code:** Pemindaian QR Code peserta dengan integrasi status kehadiran langsung ke Supabase.
- **Ekspor Excel & Laporan:** Unduh rekapitulasi data peserta lengkap per cabang lomba dan kemantren.

## Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS, Lucide Icons
- **Backend & Database:** Supabase (PostgreSQL, Storage, Realtime)
- **PDF & Export Engine:** jsPDF, html2canvas, SheetJS (XLSX)
- **Deployment:** Vercel
