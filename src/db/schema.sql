-- ====================================================================
-- SKEMA DATABASE RESMI: FESTIVAL ANAK SHOLEH INDONESIA (FASI) XIII
-- BADKO TKA-TPA KOTA YOGYAKARTA 2026
-- Kompatibel dengan: Supabase (PostgreSQL), Cloud SQL, Neon, MySQL 8.0+
-- ====================================================================

-- 1. EXTENSIONS (Khusus PostgreSQL / Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABEL KEMANTREN (14 Wilayah Kecamatan di Kota Yogyakarta)
CREATE TABLE IF NOT EXISTS kemantren (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    admin_name VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL DEFAULT 'kemantren123',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABEL CATEGORIES (18 Cabang Lomba Resmi FASI XIII)
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    level VARCHAR(10) NOT NULL CHECK (level IN ('TKA', 'TPA', 'TQA')),
    name VARCHAR(150) NOT NULL,
    gender_requirement VARCHAR(10) NOT NULL DEFAULT 'ALL' CHECK (gender_requirement IN ('L', 'P', 'ALL')),
    is_group BOOLEAN NOT NULL DEFAULT FALSE,
    group_member_count INT DEFAULT 1,
    max_participants_per_kemantren INT NOT NULL DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABEL PARTICIPANTS (Data Santri Peserta, Kategori, & Penilaian Juara)
CREATE TABLE IF NOT EXISTS participants (
    id VARCHAR(50) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    gender VARCHAR(5) NOT NULL CHECK (gender IN ('L', 'P')),
    birth_date DATE NOT NULL,
    age_years INT NOT NULL DEFAULT 0,
    age_months INT NOT NULL DEFAULT 0,
    age_days INT NOT NULL DEFAULT 0,
    kemantren_id VARCHAR(50) NOT NULL REFERENCES kemantren(id) ON DELETE CASCADE,
    category_id VARCHAR(50) NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    tpa_unit_name VARCHAR(200) NOT NULL,
    pj_name VARCHAR(150) NOT NULL,
    whatsapp_number VARCHAR(30) NOT NULL,
    document_url TEXT,
    lottery_number INT,
    lottery_drawn_at TIMESTAMP WITH TIME ZONE,
    lottery_drawn_by VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'verified' CHECK (status IN ('draft', 'verified', 'pending', 'rejected')),
    attendance VARCHAR(20) NOT NULL DEFAULT 'belum_tampil' CHECK (attendance IN ('belum_hadir', 'hadir', 'belum_tampil', 'siap_tampil', 'sudah_tampil')),
    score_jury1 DECIMAL(5,2),
    score_jury2 DECIMAL(5,2),
    score_jury3 DECIMAL(5,2),
    average_score DECIMAL(5,2),
    rank INT,
    points_awarded INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes untuk pencarian berkecepatan tinggi
CREATE INDEX IF NOT EXISTS idx_participants_kemantren ON participants(kemantren_id);
CREATE INDEX IF NOT EXISTS idx_participants_category ON participants(category_id);
CREATE INDEX IF NOT EXISTS idx_participants_reg_no ON participants(registration_number);
CREATE INDEX IF NOT EXISTS idx_participants_lottery ON participants(category_id, lottery_number);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);
CREATE INDEX IF NOT EXISTS idx_participants_attendance ON participants(attendance);

-- 5. TABEL APP_SETTINGS (Pengaturan Identitas & Tema Acara)
CREATE TABLE IF NOT EXISTS app_settings (
    id INT PRIMARY KEY DEFAULT 1,
    event_name VARCHAR(200) NOT NULL DEFAULT 'FESTIVAL ANAK SHOLEH INDONESIA - XIII',
    event_subtitle VARCHAR(150) NOT NULL DEFAULT 'Kota Yogyakarta 2026',
    tagline TEXT NOT NULL DEFAULT 'Santri Hebat, Hebat Prestasi, Hebat Mengaji, & Berakhlakul Karimah.',
    event_date VARCHAR(100) NOT NULL DEFAULT 'Ahad, 11 Oktober 2026',
    event_location TEXT NOT NULL DEFAULT 'SMPN 1 Yogyakarta (Jl. Cik Di Tiro No. 29, Terban, Gondokusuman)',
    theme_color VARCHAR(50) NOT NULL DEFAULT 'emerald',
    superadmin_password VARCHAR(255) DEFAULT 'badko2026',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABEL AUDIT_LOGS (Audit Trail Keamanan & Riwayat Aktivitas)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_name VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'BLOCKED_BOT', 'FLAGGED')),
    ip_address VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- SEED DATA AWAL (14 KEMANTREN SE-KOTA YOGYAKARTA)
-- ====================================================================
INSERT INTO kemantren (id, code, name, admin_name, password_hash) VALUES
('kem-1', 'DN', 'Danurejan', 'Admin Kemantren Danurejan', 'danurejan123'),
('kem-2', 'GD', 'Gedongtengen', 'Admin Kemantren Gedongtengen', 'gedongtengen123'),
('kem-3', 'GK', 'Gondokusuman', 'Admin Kemantren Gondokusuman', 'gondokusuman123'),
('kem-4', 'GM', 'Gondomanan', 'Admin Kemantren Gondomanan', 'gondomanan123'),
('kem-5', 'JT', 'Jetis', 'Admin Kemantren Jetis', 'jetis123'),
('kem-6', 'KG', 'Kotagede', 'Admin Kemantren Kotagede', 'kotagede123'),
('kem-7', 'KR', 'Kraton', 'Admin Kemantren Kraton', 'kraton123'),
('kem-8', 'MT', 'Mantrijeron', 'Admin Kemantren Mantrijeron', 'mantrijeron123'),
('kem-9', 'MG', 'Mergangsan', 'Admin Kemantren Mergangsan', 'mergangsan123'),
('kem-10', 'NG', 'Ngampilan', 'Admin Kemantren Ngampilan', 'ngampilan123'),
('kem-11', 'PK', 'Pakualaman', 'Admin Kemantren Pakualaman', 'pakualaman123'),
('kem-12', 'TG', 'Tegalrejo', 'Admin Kemantren Tegalrejo', 'tegalrejo123'),
('kem-13', 'UB', 'Umbulharjo', 'Admin Kemantren Umbulharjo', 'umbulharjo123'),
('kem-14', 'WB', 'Wirobrajan', 'Admin Kemantren Wirobrajan', 'wirobrajan123')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- SEED DATA AWAL (34 CABANG LOMBA RESMI FASI XIII)
-- ====================================================================
INSERT INTO categories (id, code, level, name, gender_requirement, is_group, group_member_count, max_participants_per_kemantren, description) VALUES
-- Tingkat TKA
('cat-tka-1', 'TKA-01', 'TKA', 'Tartil Al-Qur''an (Putra)', 'L', FALSE, 1, 3, 'Membaca tartil maqra pilihan Al-Qur''an dengan makhraj, tajwid, dan adab (Usia 4 - 7 thn)'),
('cat-tka-2', 'TKA-02', 'TKA', 'Tartil Al-Qur''an (Putri)', 'P', FALSE, 1, 3, 'Membaca tartil maqra pilihan Al-Qur''an dengan makhraj, tajwid, dan adab (Usia 4 - 7 thn)'),
('cat-tka-3', 'TKA-03', 'TKA', 'Adzan dan Iqomah (Putra)', 'L', FALSE, 1, 3, 'Melantunkan lafadz adzan & iqomah dengan fashahah dan lagu (Usia 4 - 7 thn)'),
('cat-tka-4', 'TKA-04', 'TKA', 'Peragaan Shalat (Putra)', 'L', FALSE, 1, 3, 'Praktik gerakan & bacaan shalat fardhu secara tartil dan tertib (Usia 4 - 7 thn)'),
('cat-tka-5', 'TKA-05', 'TKA', 'Peragaan Shalat (Putri)', 'P', FALSE, 1, 3, 'Praktik gerakan & bacaan shalat fardhu secara tartil dan tertib (Usia 4 - 7 thn)'),
('cat-tka-6', 'TKA-06', 'TKA', 'Ikrar & Puitisasi Tarjamah Al-Qur''an', 'ALL', TRUE, 3, 9, 'Penampilan ikrar santri dan puitisasi terjemah Al-Qur''an berkelompok (Usia 4 - 7 thn)'),
('cat-tka-7', 'TKA-07', 'TKA', 'Nasyid Islami', 'ALL', TRUE, 3, 9, 'Menyanyikan lagu wajib dan lagu pilihan FASI berkelompok (Usia 4 - 7 thn)'),
('cat-tka-8', 'TKA-08', 'TKA', 'Cerdas Cermat Al-Qur''an', 'ALL', TRUE, 3, 9, 'Lomba cerdas cermat materi dasar Al-Qur''an, Dinul Islam & doa harian (Usia 4 - 7 thn)'),
('cat-tka-9', 'TKA-09', 'TKA', 'Mewarnai Gambar (Putra)', 'L', FALSE, 1, 3, 'Kreativitas pewarnaan tema Islami menggunakan krayon/pastel (Usia 4 - 7 thn)'),
('cat-tka-10', 'TKA-10', 'TKA', 'Mewarnai Gambar (Putri)', 'P', FALSE, 1, 3, 'Kreativitas pewarnaan tema Islami menggunakan krayon/pastel (Usia 4 - 7 thn)'),
('cat-tka-11', 'TKA-11', 'TKA', 'Ceramah Agama Islam Bhs. Indonesia (Putra)', 'L', FALSE, 1, 3, 'Pidato/khitobah da''i cilik bertema adab kepada orang tua & guru (Usia 4 - 7 thn)'),
('cat-tka-12', 'TKA-12', 'TKA', 'Ceramah Agama Islam Bhs. Indonesia (Putri)', 'P', FALSE, 1, 3, 'Pidato/khitobah da''i cilik bertema adab kepada orang tua & guru (Usia 4 - 7 thn)'),

-- Tingkat TPA
('cat-tpa-1', 'TPA-01', 'TPA', 'Tartil Al-Qur''an (Putra)', 'L', FALSE, 1, 3, 'Membaca tartil ayat pilihan Al-Qur''an dengan kaidah tajwid lengkap (> 7 s.d. 12 thn)'),
('cat-tpa-2', 'TPA-02', 'TPA', 'Tartil Al-Qur''an (Putri)', 'P', FALSE, 1, 3, 'Membaca tartil ayat pilihan Al-Qur''an dengan kaidah tajwid lengkap (> 7 s.d. 12 thn)'),
('cat-tpa-3', 'TPA-03', 'TPA', 'Adzan dan Iqomah (Putra)', 'L', FALSE, 1, 3, 'Pengumandangan adzan subuh/umum dan doa sesudah adzan (> 7 s.d. 12 thn)'),
('cat-tpa-4', 'TPA-04', 'TPA', 'Ikrar & Puitisasi Tarjamah Al-Qur''an', 'ALL', TRUE, 3, 9, 'Ikrar santri dan puitisasi terjemah Al-Qur''an beregu (> 7 s.d. 12 thn)'),
('cat-tpa-5', 'TPA-05', 'TPA', 'Nasyid Islami', 'ALL', TRUE, 3, 9, 'Penampilan grup vocal akustik Islami 3 orang santri (> 7 s.d. 12 thn)'),
('cat-tpa-6', 'TPA-06', 'TPA', 'Cerdas Cermat Al-Qur''an', 'ALL', TRUE, 3, 9, 'Lomba cerdas cermat materi Dinul Islam, Al-Qur''an, Hadits, Fiqih (> 7 s.d. 12 thn)'),
('cat-tpa-7', 'TPA-07', 'TPA', 'Menggambar (Putra)', 'L', FALSE, 1, 3, 'Menggambar bebas dengan tema Nilai-Nilai Luhur Islam (> 7 s.d. 12 thn)'),
('cat-tpa-8', 'TPA-08', 'TPA', 'Menggambar (Putri)', 'P', FALSE, 1, 3, 'Menggambar bebas dengan tema Nilai-Nilai Luhur Islam (> 7 s.d. 12 thn)'),
('cat-tpa-9', 'TPA-09', 'TPA', 'Ceramah Agama Islam Bhs. Indonesia (Putra)', 'L', FALSE, 1, 3, 'Pidato/khitobah da''i cilik bertema Meneladani Akhlak Rasulullah (> 7 s.d. 12 thn)'),
('cat-tpa-10', 'TPA-10', 'TPA', 'Ceramah Agama Islam Bhs. Indonesia (Putri)', 'P', FALSE, 1, 3, 'Pidato/khitobah da''i cilik bertema Meneladani Akhlak Rasulullah (> 7 s.d. 12 thn)'),

-- Tingkat TQA
('cat-tqa-1', 'TQA-01', 'TQA', 'Tilawati Al-Quran (Putra)', 'L', FALSE, 1, 3, 'Membaca Al-Qur''an dengan lagu/naghom (Bayati, Shoba, Hijaz, dll) (> 12 s.d. 15 thn)'),
('cat-tqa-2', 'TQA-02', 'TQA', 'Tilawati Al-Quran (Putri)', 'P', FALSE, 1, 3, 'Membaca Al-Qur''an dengan lagu/naghom (Bayati, Shoba, Hijaz, dll) (> 12 s.d. 15 thn)'),
('cat-tqa-3', 'TQA-03', 'TQA', 'Tahfidz Juz Amma (Putra)', 'L', FALSE, 1, 3, 'Hafalan Al-Qur''an Juz 30 lengkap beserta sambung ayat (> 12 s.d. 15 thn)'),
('cat-tqa-4', 'TQA-04', 'TQA', 'Tahfidz Juz Amma (Putri)', 'P', FALSE, 1, 3, 'Hafalan Al-Qur''an Juz 30 lengkap beserta sambung ayat (> 12 s.d. 15 thn)'),
('cat-tqa-5', 'TQA-05', 'TQA', 'Syarhil Quran', 'ALL', TRUE, 3, 9, 'Pensyarahan isi kandungan Al-Qur''an beregu (Tilawah, Terjemah, Pensyarah) (> 12 s.d. 15 thn)'),
('cat-tqa-6', 'TQA-06', 'TQA', 'Cerdas Cermat Al-Quran', 'ALL', TRUE, 3, 9, 'Cerdas cermat pemahaman Al-Qur''an, Hadits, Fiqih, dan Sejarah Islam (> 12 s.d. 15 thn)'),
('cat-tqa-7', 'TQA-07', 'TQA', 'Kisah Islami (Putra)', 'L', FALSE, 1, 3, 'Menceritakan kisah keteladanan para Nabi, Sahabat, atau Pahlawan Islam (> 12 s.d. 15 thn)'),
('cat-tqa-8', 'TQA-08', 'TQA', 'Kisah Islami (Putri)', 'P', FALSE, 1, 3, 'Menceritakan kisah keteladanan para Nabi, Sahabat, atau Pahlawan Islam (> 12 s.d. 15 thn)'),
('cat-tqa-9', 'TQA-09', 'TQA', 'Kaligrafi (Putra)', 'L', FALSE, 1, 3, 'Seni penulisan ayat Al-Qur''an khat naskhi dan hiasan mushaf (> 12 s.d. 15 thn)'),
('cat-tqa-10', 'TQA-10', 'TQA', 'Kaligrafi (Putri)', 'P', FALSE, 1, 3, 'Seni penulisan ayat Al-Qur''an khat naskhi dan hiasan mushaf (> 12 s.d. 15 thn)'),
('cat-tqa-11', 'TQA-11', 'TQA', 'Ceramah Agama Islam Bhs. Indonesia (Putra)', 'L', FALSE, 1, 3, 'Pidato/khitobah da''i remaja bertema Moderasi Beragama & Cinta Tanah Air (> 12 s.d. 15 thn)'),
('cat-tqa-12', 'TQA-12', 'TQA', 'Ceramah Agama Islam Bhs. Indonesia (Putri)', 'P', FALSE, 1, 3, 'Pidato/khitobah da''i remaja bertema Moderasi Beragama & Cinta Tanah Air (> 12 s.d. 15 thn)')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- SEED DATA APP SETTINGS
-- ====================================================================
INSERT INTO app_settings (id, event_name, event_subtitle, tagline, event_date, event_location, theme_color, superadmin_password)
VALUES (1, 'FESTIVAL ANAK SHOLEH INDONESIA - XIII', 'Kota Yogyakarta 2026', 'Santri Hebat, Hebat Prestasi, Hebat Mengaji, & Berakhlakul Karimah.', 'Ahad, 11 Oktober 2026', 'SMPN 1 Yogyakarta (Jl. Cik Di Tiro No. 29, Terban, Gondokusuman)', 'emerald', 'badko2026')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES (SUPABASE)
-- Jalankan bagian ini di SQL Editor Supabase agar aplikasi web
-- memiliki izin membaca dan menulis (SELECT, INSERT, UPDATE, DELETE)
-- ====================================================================
ALTER TABLE kemantren ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Reset policies
DROP POLICY IF EXISTS "Public full access on kemantren" ON kemantren;
DROP POLICY IF EXISTS "Public full access on categories" ON categories;
DROP POLICY IF EXISTS "Public full access on participants" ON participants;
DROP POLICY IF EXISTS "Public full access on app_settings" ON app_settings;
DROP POLICY IF EXISTS "Public full access on audit_logs" ON audit_logs;

-- Izinkan akses penuh untuk anon & authenticated key
CREATE POLICY "Public full access on kemantren" ON kemantren FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on participants" ON participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on app_settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access on audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

