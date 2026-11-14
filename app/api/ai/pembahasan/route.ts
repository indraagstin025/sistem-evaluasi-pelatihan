import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {buatPembahasanGrafik, generatePembahasanTemplate} from '@/lib/ai';
import {getRekapGrafikMap, PEMBAHASAN_KEYS} from '@/lib/pembahasan-server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// GET: Ambil pembahasan tersimpan atau inisialisasi dari templat (hanya jika ada peserta)
export async function GET() {
    try {
        const totalPeserta = await prisma.peserta.count();
        if (totalPeserta === 0) {
            return NextResponse.json({success: true, data: {}});
        }

        const saved = await prisma.pembahasan.findMany();
        const result: Record<string, any> = {};
        const keys = PEMBAHASAN_KEYS;

        const missingKeys = keys.filter((key) => !saved.some((s) => s.grafikKey === key));
        const rekapMap = missingKeys.length > 0 ? await getRekapGrafikMap() : null;

        await Promise.all(
            keys.map(async (key) => {
                const exist = saved.find((s) => s.grafikKey === key);
                if (exist) {
                    result[key] = exist;
                    return;
                }
                // Belum ada -> inisialisasi otomatis dari template baku
                const rekap = rekapMap ? (rekapMap as any)[key] : undefined;
                const initial = generatePembahasanTemplate(key, rekap);
                const created = await prisma.pembahasan.create({
                    data: {
                        grafikKey: key,
                        judul: initial.judul,
                        poin1: initial.poin1,
                        poin2: initial.poin2,
                        poin3: initial.poin3,
                        poin4: initial.poin4,
                        teksLengkap: initial.teksLengkap,
                        sumber: 'template',
                    },
                });
                result[key] = created;
            })
        );

        return NextResponse.json({success: true, data: result});
    } catch (error: any) {
        console.error('GET /api/ai/pembahasan error:', error);
        return NextResponse.json(
            {success: false, error: error.message || 'Gagal memuat pembahasan AI'},
            {status: 500}
        );
    }
}

// POST: Buat / generate ulang pembahasan (bisa 1 grafik atau semua)
export async function POST(request: Request) {
    try {
        const totalPeserta = await prisma.peserta.count();
        if (totalPeserta === 0) {
            return NextResponse.json(
                {success: false, error: 'Belum ada data peserta untuk dianalisis. Impor data terlebih dahulu.'},
                {status: 400}
            );
        }

        const body = await request.json().catch(() => ({}));
        const targetKey = body.grafikKey || 'all';

        const rekapMap = await getRekapGrafikMap();
        const keysToProcess =
            targetKey === 'all' ? ([...PEMBAHASAN_KEYS] as string[]) : ([targetKey] as string[]);

        const updatedMap: Record<string, any> = {};

        // Proses berurutan + jeda ringan agar aman terhadap rate limit Gemini
        for (let i = 0; i < keysToProcess.length; i++) {
            const key = keysToProcess[i];
            const rekap = key === 'kesimpulan' ? undefined : (rekapMap as any)[key];
            if (key !== 'kesimpulan' && !rekap) continue;

            if (i > 0) {
                await new Promise((resolve) => setTimeout(resolve, 800));
            }

            const hasil = await buatPembahasanGrafik(
                key,
                rekap,
                key === 'kesimpulan' ? {totalPeserta, rekapMap} : undefined
            );
            const payload = {
                judul: hasil.judul,
                poin1: hasil.poin1,
                poin2: hasil.poin2,
                poin3: hasil.poin3,
                poin4: hasil.poin4,
                teksLengkap: hasil.teksLengkap,
                sumber: hasil.sumber,
            };
            const saved = await prisma.pembahasan.upsert({
                where: {grafikKey: key},
                update: payload,
                create: {
                    grafikKey: key,
                    ...payload,
                },
            });
            updatedMap[key] = saved;
        }

        return NextResponse.json({
            success: true,
            message:
                targetKey === 'all'
                    ? 'Berhasil memperbarui pembahasan seluruh grafik'
                    : `Berhasil memperbarui pembahasan ${targetKey}`,
            data: updatedMap,
        });
    } catch (error: any) {
        console.error('POST /api/ai/pembahasan error:', error);
        return NextResponse.json(
            {success: false, error: error.message || 'Gagal membuat pembahasan AI'},
            {status: 500}
        );
    }
}

// PUT: Simpan suntingan manual pengguna
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const {grafikKey, poin1, poin2, poin3, poin4} = body;

        if (!grafikKey) {
            return NextResponse.json(
                {success: false, error: 'Parameter grafikKey wajib diisi.'},
                {status: 400}
            );
        }

        const teksLengkap = [
            `1. ${poin1 || ''}`,
            `2. ${poin2 || ''}`,
            `3. ${poin3 || ''}`,
            `4. ${poin4 || ''}`,
        ].join('\n');

        const updated = await prisma.pembahasan.upsert({
            where: {grafikKey},
            update: {
                poin1: poin1 || '',
                poin2: poin2 || '',
                poin3: poin3 || '',
                poin4: poin4 || '',
                teksLengkap,
                sumber: 'manual',
            },
            create: {
                grafikKey,
                judul: body.judul || `Grafik ${grafikKey}`,
                poin1: poin1 || '',
                poin2: poin2 || '',
                poin3: poin3 || '',
                poin4: poin4 || '',
                teksLengkap,
                sumber: 'manual',
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Perubahan pembahasan berhasil disimpan secara manual.',
            data: updated,
        });
    } catch (error: any) {
        console.error('PUT /api/ai/pembahasan error:', error);
        return NextResponse.json(
            {success: false, error: error.message || 'Gagal menyimpan suntingan'},
            {status: 500}
        );
    }
}
