'use client';

import React, { useEffect, useState } from 'react';
import {
  Printer,
  Download,
  RefreshCw,
  Sparkles,
  Edit3,
  Save,
  X,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Plugin Chart.js untuk menampilkan angka peserta tepat di samping kanan ujung batang horizontal
const horizontalBarLabelPlugin = {
  id: 'horizontalBarLabelPlugin',
  afterDatasetsDraw(chart: any) {
    const { ctx } = chart;
    ctx.save();
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      meta.data.forEach((bar: any, index: number) => {
        const value = dataset.data[index];
        if (typeof value === 'number') {
          ctx.fillStyle = '#1e293b';
          // Tampilkan angka tepat di ujung kanan batang horizontal
          ctx.fillText(value.toString(), bar.x + 8, bar.y);
        }
      });
    });
    ctx.restore();
  },
};

// Helper untuk merender teks dengan tag markdown **bold** menjadi elemen <strong>
function renderFormattedText(text: string) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default function EksposePage() {
  const [data, setData] = useState<any>(null);
  const [pembahasanMap, setPembahasanMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);

  // State untuk mode sunting manual per slide (grafik 1-5 atau kesimpulan)
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    poin1: '',
    poin2: '',
    poin3: '',
    poin4: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resEkspose, resPembahasan] = await Promise.all([
        fetch('/api/ekspose', { cache: 'no-store' }),
        fetch('/api/ai/pembahasan', { cache: 'no-store' }),
      ]);

      const jsonEkspose = await resEkspose.json();
      const jsonPembahasan = await resPembahasan.json();

      if (jsonEkspose.success) setData(jsonEkspose);
      if (jsonPembahasan.success) setPembahasanMap(jsonPembahasan.data);
    } catch (err) {
      console.error('Error fetching ekspose data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegenerate = async (grafikKey: string) => {
    try {
      setActionLoadingKey(grafikKey);
      const res = await fetch('/api/ai/pembahasan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grafikKey }),
      });
      const json = await res.json();
      if (json.success) {
        setPembahasanMap((prev) => ({
          ...prev,
          ...json.data,
        }));
      } else {
        alert(json.error || 'Gagal memperbarui pembahasan');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui pembahasan');
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleStartEdit = (key: string, item: any) => {
    setEditingKey(key);
    setEditForm({
      poin1: item?.poin1 || '',
      poin2: item?.poin2 || '',
      poin3: item?.poin3 || '',
      poin4: item?.poin4 || '',
    });
  };

  const handleSaveEdit = async (key: string) => {
    try {
      setActionLoadingKey(key);
      const res = await fetch('/api/ai/pembahasan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grafikKey: key,
          ...editForm,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPembahasanMap((prev) => ({
          ...prev,
          [key]: json.data,
        }));
        setEditingKey(null);
      } else {
        alert(json.error || 'Gagal menyimpan suntingan');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi saat menyimpan');
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!data?.rekap) return;
    const rekap = data.rekap;
    const kategori = ['76-100', '51-75', '26-50', '1-25', '0'];

    let csvContent =
      'Slide,Judul Slide,Instrumen / Kategori,' +
      kategori.map((k) => `Rentang ${k}`).join(',') +
      ',Total Valid (N)\n';

    Object.keys(rekap).forEach((k) => {
      const g = rekap[k];
      const reversedA = [...g.dataA].reverse();
      const reversedB = [...g.dataB].reverse();
      csvContent += `"${g.slide}","${g.judul}","${g.labelB}",` + reversedB.join(',') + `,${g.totalB}\n`;
      csvContent += `"${g.slide}","${g.judul}","${g.labelA}",` + reversedA.join(',') + `,${g.totalA}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rekap_Slide_Ekspose_Resmi_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="py-28 text-center">
        <RefreshCw className="w-9 h-9 animate-spin text-emerald-600 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-700">Menyiapkan Tampilan Slide Presentasi Resmi Ekspose...</p>
        <p className="text-xs text-slate-400 mt-1">Mengonfigurasi 6 slide 1:1 sesuai berkas paparan resmi BPSDM</p>
      </div>
    );
  }

  const rekap = data?.rekap;
  // Urutan kategori vertikal dari atas ke bawah persis seperti PowerPoint
  const presentationCategories = ['76-100', '51-75', '26-50', '1-25', '0'];

  const getHorizontalChartOptions = (maxVal: number): any => ({
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        right: 36, // Ruang untuk teks angka di ujung batang
        top: 8,
        bottom: 8,
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        align: 'center' as const,
        labels: {
          font: { size: 12, weight: 'bold' },
          boxWidth: 15,
          boxHeight: 15,
          padding: 18,
          color: '#334155',
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.parsed.x} orang`,
        },
      },
    },
    scales: {
      x: {
        display: false, // Bersih tanpa angka sumbu x di bawah, sesuai slide PowerPoint
        beginAtZero: true,
        max: Math.max(maxVal + 3, 22),
      },
      y: {
        grid: { display: false },
        border: { display: true, color: '#94a3b8', width: 1.5 },
        ticks: {
          font: { weight: 'bold', size: 13 },
          color: '#1e293b',
          padding: 8,
        },
      },
    },
  });

  // 5 Slide Grafik Resmi (Slide 5-9 pada PPT)
  const slideList = [
    {
      key: 'grafik1',
      slideNumber: 'Slide 5',
      slideTitle: 'Perbandingan Capaian Jangka Menengah dengan Jangka Panjang (Hasil wawancara)',
      subtitle: 'Perbandingan capaian jangka menengah dengan jangka panjang (Hasil wawancara)',
      g: rekap?.grafik1,
      labelOrange: 'Jangka panjang',
      labelBlue: 'Jangka menengah',
    },
    {
      key: 'grafik2',
      slideNumber: 'Slide 6',
      slideTitle: 'Target Aksi Perubahan Dalam Jangka Panjang Tercapai',
      subtitle: 'Target Aksi Perubahan dalam jangka panjang tercapai',
      g: rekap?.grafik2,
      labelOrange: 'Nilai Wawancara',
      labelBlue: 'Nilai Survey',
    },
    {
      key: 'grafik3',
      slideNumber: 'Slide 7',
      slideTitle: 'Seluruh Tujuan Aksi Perubahan Dapat Tercapai',
      subtitle: 'Seluruh tujuan Aksi Perubahan dapat tercapai',
      g: rekap?.grafik3,
      labelOrange: 'Nilai Wawancara',
      labelBlue: 'Nilai Survey',
    },
    {
      key: 'grafik4',
      slideNumber: 'Slide 8',
      slideTitle: 'Manfaat Aksi Perubahan',
      subtitle: 'Manfaat Aksi Perubahan',
      g: rekap?.grafik4,
      labelOrange: 'Nilai Wawancara',
      labelBlue: 'Nilai Survey',
    },
    {
      key: 'grafik5',
      slideNumber: 'Slide 9',
      slideTitle: 'Nilai Keseluruhan',
      subtitle: 'Nilai Keseluruhan',
      g: rekap?.grafik5,
      labelOrange: 'Nilai Wawancara',
      labelBlue: 'Nilai Survey',
    },
  ];

  const kesimpulanItem = pembahasanMap['kesimpulan'] || {
    poin1:
      'Berdasarkan hasil wawancara dan survei alumni Diklat Pelatihan Kepemimpinan Pengawas (PKP) Kabupaten Bogor Angkatan 7 Tahun 2023 yang dilaksanakan pada tanggal 29–30 Oktober 2025, diperoleh gambaran bahwa capaian hasil pasca pelatihan menunjukkan tren positif. Mayoritas responden menilai tingkat keberhasilan aksi perubahan dalam jangka menengah dan panjang berada pada rentang 76–100%, yang menandakan bahwa tujuan pembelajaran dan implementasi aksi perubahan telah berjalan efektif di unit kerja masing-masing.',
    poin2: 'Proses mutasi/rotasi/promosi berdampak besar terhadap keberlangsungan Aksi Perubahan.',
    poin3:
      'Keberlanjutan dan Replikasi Aksi Perubahan Alumni perlu mendapat pendampingan agar aksi perubahan berlanjut dan diintegrasikan ke program kerja, serta direplikasi sebagai best practice di perangkat daerah lain.',
    poin4:
      'Aksi perubahan yang dibuat oleh peserta tidak harus menggunakan Aplikasi Komputer, karena konsekuensi harus menyiapkan infrastruktur pendukung seperti Server, Hosting dan SDM untuk pengembangan Aplikasi.\n\nProses mutasi/rotasi/promosi hendaknya memperhatikan terhadap Aksi Perubahan Alumni.',
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 print:p-0 print:m-0 print:max-w-none">
      {/* Top Application Bar (Hidden on Print) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
              Format Presentasi Resmi (1:1 Slide PPTX)
            </span>
            <span className="text-xs text-slate-400">• BPSDM Provinsi Jawa Barat</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mt-1 flex items-center gap-2">
            Ekspose Evaluasi Pasca Pelatihan PKP Angkatan VII
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Susunan visual 6 slide presentasi lengkap: 5 grafik batang horizontal dengan kotak pembahasan, diakhiri slide kesimpulan & rekomendasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleRegenerate('all')}
            disabled={actionLoadingKey === 'all'}
            className="px-3.5 py-2 text-xs font-bold rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Generate penjelasan AI untuk seluruh slide"
          >
            <Sparkles className={`w-3.5 h-3.5 text-emerald-600 ${actionLoadingKey === 'all' ? 'animate-spin' : ''}`} />
            Generate AI Semua Slide
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Ekspor Rekap CSV
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm shadow-emerald-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Slide (PDF)
          </button>
        </div>
      </header>

      {/* Slide Navigation Pill Quicklinks */}
      <div className="flex flex-wrap items-center gap-2 no-print bg-slate-100/80 p-2 rounded-xl text-xs font-semibold text-slate-600">
        <span className="px-2 py-1 text-slate-400 font-bold text-[11px]">Lompat ke Slide:</span>
        {slideList.map((s, idx) => (
          <a
            key={s.key}
            href={`#${s.key}`}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200/80 transition shadow-2xs cursor-pointer"
          >
            Slide {idx + 1} ({s.slideNumber})
          </a>
        ))}
        <a
          href="#kesimpulan"
          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-2xs cursor-pointer font-bold"
        >
          Slide 6 (Kesimpulan & Rekomendasi)
        </a>
      </div>

      {/* Banner Informasi Ketika Database Kosong */}
      {data?.ringkasan?.totalPeserta === 0 && (
        <div className="no-print bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold">
              !
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                Basis Data Saat Ini Kosong (0 Peserta)
              </p>
              <p className="text-xs text-amber-800/80 mt-0.5">
                Semua data telah dihapus. Nilai grafik pada slide di bawah kini menunjukkan angka 0. Halaman ini 100% dinamis dan akan otomatis terisi penuh saat berkas Excel diimpor.
              </p>
            </div>
          </div>
          <a
            href="/peserta"
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-700 hover:bg-amber-800 text-white transition shadow-2xs shrink-0 self-start sm:self-auto text-center"
          >
            Buka Menu Impor Excel
          </a>
        </div>
      )}

      {/* Rangkaian 6 Slide Presentasi Resmi */}
      <div className="space-y-12 print:space-y-0">
        {/* SLIDE 1 S.D. 5 (5 GRAFIK PRESENTASI) */}
        {slideList.map((slide, sIdx) => {
          const g = slide.g;
          if (!g) return null;

          const pItem = pembahasanMap[slide.key];
          const isEditing = editingKey === slide.key;
          const isItemLoading = actionLoadingKey === slide.key;

          const maxVal = Math.max(...(g.dataA || []), ...(g.dataB || []), 10);

          // Data dibalik agar sesuai dengan urutan kategori presentation: 76-100, 51-75, 26-50, 1-25, 0
          const reversedA = [...g.dataA].reverse(); // Survei / Jangka Menengah
          const reversedB = [...g.dataB].reverse(); // Wawancara / Jangka Panjang

          const chartData = {
            labels: presentationCategories,
            datasets: [
              {
                label: slide.labelOrange,
                data: reversedB,
                backgroundColor: '#ED7D31', // Oranye resmi PPTX
                barPercentage: 0.75,
                categoryPercentage: 0.8,
                borderRadius: 0,
              },
              {
                label: slide.labelBlue,
                data: reversedA,
                backgroundColor: '#4472C4', // Biru resmi PPTX
                barPercentage: 0.75,
                categoryPercentage: 0.8,
                borderRadius: 0,
              },
            ],
          };

          return (
            <section
              key={slide.key}
              id={slide.key}
              className="slide-card bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-8 md:p-10 transition space-y-6 relative overflow-hidden"
              style={{ minHeight: '520px' }}
            >
              {/* Header Slide: Judul di Tengah + Logo Pemprov Jabar di Kanan Atas */}
              <div className="relative flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="w-16 hidden sm:block">
                  <span className="no-print text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-500">
                    {slide.slideNumber}
                  </span>
                </div>

                <div className="flex-1 text-center px-4">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                    {slide.slideTitle}
                  </h2>
                </div>

                <div className="flex items-center gap-2.5 justify-end">
                  <div className="text-right hidden sm:block leading-none">
                    <p className="text-[10px] font-semibold text-slate-700">Provincial Government</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">of West Java</p>
                  </div>
                  <img
                    src="/logo-jabar.png"
                    alt="Logo Pemprov Jabar"
                    className="h-10 w-auto object-contain"
                  />
                </div>
              </div>

              {/* Isi Slide: 2 Kolom (Kiri: Grafik Batang Horizontal, Kanan: Kotak Pembahasan Biru Muda) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-2">
                {/* Kolom Kiri (~54%): Horizontal Bar Chart */}
                <div className="lg:col-span-7 flex flex-col justify-between">
                  <div className="mb-2">
                    <p className="text-sm font-semibold text-slate-600">
                      {slide.subtitle}
                    </p>
                  </div>

                  <div className="relative w-full h-[320px] sm:h-[350px]">
                    <Bar
                      data={chartData}
                      options={getHorizontalChartOptions(maxVal)}
                      plugins={[horizontalBarLabelPlugin]}
                    />
                  </div>

                  {/* Ringkasan Angka Valid */}
                  <div className="mt-2 text-right">
                    <span className="text-[11px] text-slate-400 font-medium">
                      N={g.totalB} responden wawancara • N={g.totalA} responden survei
                    </span>
                  </div>
                </div>

                {/* Kolom Kanan (~46%): Kotak Pembahasan Biru Muda (#D9E1F2) */}
                <div className="lg:col-span-5 flex flex-col">
                  <div className="bg-[#D9E1F2] rounded-lg p-5 sm:p-6 flex-1 flex flex-col justify-between shadow-2xs border border-[#C5D1E8]">
                    <div>
                      {/* Judul Kotak Pembahasan Bergaris Bawah */}
                      <div className="flex items-center justify-between mb-3 border-b border-slate-400/30 pb-2">
                        <div className="w-full text-center">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 underline decoration-1 underline-offset-4 tracking-wide">
                            Pembahasan
                          </h3>
                        </div>

                        {/* Tombol Aksi Mini (Sunting / AI) */}
                        <div className="flex items-center gap-1 no-print absolute right-8 top-auto">
                          {!isEditing ? (
                            <>
                              <button
                                onClick={() => handleRegenerate(slide.key)}
                                disabled={isItemLoading}
                                title="Refresh narasi AI"
                                className="p-1 rounded bg-white/70 hover:bg-white text-slate-700 border border-slate-300 transition cursor-pointer"
                              >
                                <RefreshCw className={`w-3 h-3 ${isItemLoading ? 'animate-spin' : ''}`} />
                              </button>
                              <button
                                onClick={() => handleStartEdit(slide.key, pItem)}
                                title="Sunting teks pembahasan"
                                className="p-1 rounded bg-white/70 hover:bg-white text-slate-700 border border-slate-300 transition cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setEditingKey(null)}
                                className="px-2 py-0.5 text-[10px] font-semibold rounded bg-white text-slate-600 border border-slate-300"
                              >
                                Batal
                              </button>
                              <button
                                onClick={() => handleSaveEdit(slide.key)}
                                disabled={isItemLoading}
                                className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-600 text-white flex items-center gap-0.5"
                              >
                                <Save className="w-2.5 h-2.5" />
                                Simpan
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Teks Butir-Butir Pembahasan */}
                      {!isEditing ? (
                        <div className="space-y-3 text-xs sm:text-[13px] text-slate-900 leading-relaxed font-sans">
                          {slide.key === 'grafik1' ? (
                            <ul className="list-disc pl-4 space-y-2">
                              <li>
                                {renderFormattedText(
                                  pItem?.poin1 ||
                                    'Sebagian besar alumni berhasil merealisasikan Rencana Aksi jangka menengah dengan baik.'
                                )}{' '}
                                {renderFormattedText(
                                  pItem?.poin2 ||
                                    'Sebanyak **11 orang** mencapai capaian **di atas 75%**, menunjukkan komitmen tinggi terhadap penerapan hasil pelatihan.'
                                )}{' '}
                                {renderFormattedText(
                                  pItem?.poin3 ||
                                    'Selain itu, **17 orang** berada pada kategori **51–75%**, sedangkan **1 orang** masih di bawah 50%.'
                                )}{' '}
                                {renderFormattedText(
                                  pItem?.poin4 ||
                                    'Secara keseluruhan, capaian ini menunjukkan bahwa mayoritas alumni mampu melaksanakan rencana jangka menengah secara efektif.'
                                )}
                              </li>
                            </ul>
                          ) : (
                            <ul className="list-disc pl-4 space-y-2.5">
                              {pItem?.poin1 && <li>{renderFormattedText(pItem.poin1)}</li>}
                              {pItem?.poin2 && <li>{renderFormattedText(pItem.poin2)}</li>}
                              {pItem?.poin3 && <li>{renderFormattedText(pItem.poin3)}</li>}
                              {pItem?.poin4 && <li>{renderFormattedText(pItem.poin4)}</li>}
                            </ul>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2.5 text-xs">
                          <div>
                            <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Poin 1:</label>
                            <textarea
                              rows={2}
                              value={editForm.poin1}
                              onChange={(e) => setEditForm({ ...editForm, poin1: e.target.value })}
                              className="w-full p-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Poin 2:</label>
                            <textarea
                              rows={2}
                              value={editForm.poin2}
                              onChange={(e) => setEditForm({ ...editForm, poin2: e.target.value })}
                              className="w-full p-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Poin 3:</label>
                            <textarea
                              rows={2}
                              value={editForm.poin3}
                              onChange={(e) => setEditForm({ ...editForm, poin3: e.target.value })}
                              className="w-full p-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-700 block mb-0.5">Poin 4:</label>
                            <textarea
                              rows={2}
                              value={editForm.poin4}
                              onChange={(e) => setEditForm({ ...editForm, poin4: e.target.value })}
                              className="w-full p-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-400/20 flex items-center justify-between text-[10px] text-slate-500">
                      <span>
                        Sumber:{' '}
                        {pItem?.sumber === 'ai'
                          ? 'Model AI (Gemini)'
                          : pItem?.sumber === 'manual'
                          ? 'Disunting Manual'
                          : 'Templat Baku (Slide PPT)'}
                      </span>
                      <span className="font-semibold text-emerald-800">BPSDM Jabar</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}

        {/* SLIDE 6 (SLIDE 10 PADA UPLOAD: KESIMPULAN DAN REKOMENDASI) */}
        <section
          id="kesimpulan"
          className="slide-card bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-8 md:p-10 transition space-y-6 relative overflow-hidden"
          style={{ minHeight: '520px' }}
        >
          {/* Header Slide: Judul di Tengah + Logo Pemprov Jabar */}
          <div className="relative flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="w-16 hidden sm:block">
              <span className="no-print text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-500">
                Slide 10
              </span>
            </div>

            <div className="flex-1 text-center px-4">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                Kesimpulan dan Rekomendasi
              </h2>
            </div>

            <div className="flex items-center gap-2.5 justify-end">
              <div className="text-right hidden sm:block leading-none">
                <p className="text-[10px] font-semibold text-slate-700">Provincial Government</p>
                <p className="text-[9px] text-slate-500 mt-0.5">of West Java</p>
              </div>
              <img
                src="/logo-jabar.png"
                alt="Logo Pemprov Jabar"
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>

          {/* Isi Slide 6: Dua Kolom Berdampingan (Kiri: Peach Pembahasan, Kanan: Hijau Muda Rekomendasi) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch pt-2">
            {/* Kolom Kiri: Kotak Peach (#FCE4D6) - Pembahasan */}
            <div className="bg-[#FCE4D6] rounded-lg p-6 flex flex-col justify-between border border-[#F4CCA4] shadow-2xs">
              <div>
                <div className="text-center mb-4">
                  <h3 className="text-base font-bold text-slate-900 underline decoration-1 underline-offset-4 tracking-wide">
                    Pembahasan
                  </h3>
                </div>

                {editingKey !== 'kesimpulan' ? (
                  <ul className="list-disc pl-5 space-y-4 text-xs sm:text-[13px] text-slate-900 leading-relaxed font-sans">
                    <li>{renderFormattedText(kesimpulanItem.poin1)}</li>
                    <li>{renderFormattedText(kesimpulanItem.poin2)}</li>
                  </ul>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-1">Paragraf 1 (Pembahasan Capaian):</label>
                      <textarea
                        rows={6}
                        value={editForm.poin1}
                        onChange={(e) => setEditForm({ ...editForm, poin1: e.target.value })}
                        className="w-full p-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-1">Paragraf 2 (Pengaruh Mutasi/Rotasi):</label>
                      <textarea
                        rows={3}
                        value={editForm.poin2}
                        onChange={(e) => setEditForm({ ...editForm, poin2: e.target.value })}
                        className="w-full p-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-2 border-t border-slate-400/20 text-[10px] text-slate-500 text-right">
                Evaluasi Pasca Pelatihan • PKP Angkatan VII
              </div>
            </div>

            {/* Kolom Kanan: Kotak Hijau Muda (#E2EFDA) - Rekomendasi */}
            <div className="bg-[#E2EFDA] rounded-lg p-6 flex flex-col justify-between border border-[#C5E0B4] shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-full text-center">
                    <h3 className="text-base font-bold text-slate-900 underline decoration-1 underline-offset-4 tracking-wide">
                      Rekomendasi
                    </h3>
                  </div>

                  {/* Tombol Sunting Slide 6 */}
                  <div className="no-print absolute right-8 top-auto">
                    {editingKey !== 'kesimpulan' ? (
                      <button
                        onClick={() => handleStartEdit('kesimpulan', kesimpulanItem)}
                        className="p-1.5 rounded bg-white/70 hover:bg-white text-slate-700 border border-slate-300 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                      >
                        <Edit3 className="w-3 h-3" />
                        Sunting
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingKey(null)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-white text-slate-600 border border-slate-300"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => handleSaveEdit('kesimpulan')}
                          disabled={actionLoadingKey === 'kesimpulan'}
                          className="px-3 py-1 text-xs font-bold rounded bg-emerald-600 text-white flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Simpan
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {editingKey !== 'kesimpulan' ? (
                  <ol className="list-decimal pl-5 space-y-4 text-xs sm:text-[13px] text-slate-900 leading-relaxed font-sans">
                    <li>
                      <strong>Keberlanjutan dan Replikasi Aksi Perubahan Alumni</strong> perlu mendapat pendampingan agar aksi perubahan berlanjut dan diintegrasikan ke program kerja, serta direplikasi sebagai best practice di perangkat daerah lain.
                    </li>
                    <li>
                      Aksi perubahan yang dibuat oleh peserta <strong>tidak harus menggunakan Aplikasi Komputer</strong>, karena konsekuensi harus menyiapkan infrastruktur pendukung seperti Server, Hosting dan SDM untuk pengembangan Aplikasi.
                    </li>
                    <li>
                      Proses <strong>mutasi/rotasi/promosi</strong> hendaknya memperhatikan terhadap Aksi Perubahan Alumni.
                    </li>
                  </ol>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-1">Rekomendasi 1:</label>
                      <textarea
                        rows={3}
                        value={editForm.poin3}
                        onChange={(e) => setEditForm({ ...editForm, poin3: e.target.value })}
                        className="w-full p-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-1">Rekomendasi 2 & 3:</label>
                      <textarea
                        rows={5}
                        value={editForm.poin4}
                        onChange={(e) => setEditForm({ ...editForm, poin4: e.target.value })}
                        className="w-full p-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-2 border-t border-slate-400/20 text-[10px] text-slate-500 text-right">
                BPSDM Provinsi Jawa Barat • 2025
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
