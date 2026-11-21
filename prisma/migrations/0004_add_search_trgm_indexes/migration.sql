-- Aktifkan ekstensi pg_trgm agar pencarian ILIKE '%...%' memakai indeks GIN
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Indeks GIN Trigram pada kolom pencarian TimEvaluator & Peserta
CREATE INDEX IF NOT EXISTS "TimEvaluator_namaTim_idx" ON "TimEvaluator" USING gin ("namaTim" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Peserta_nama_idx" ON "Peserta" USING gin ("nama" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Peserta_nip_idx" ON "Peserta" USING gin ("nip" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Peserta_instansi_idx" ON "Peserta" USING gin ("instansi" gin_trgm_ops);
