/**
 * lib/pptx-ekspose.ts
 * Generator file PowerPoint (.pptx) resmi untuk 6 slide Ekspose BPSDM Provinsi Jawa Barat
 * (Slide 5-9 grafik horizontal + kotak Pembahasan, dan Slide 10 Kesimpulan & Rekomendasi).
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import PptxGenJS from 'pptxgenjs';
import type { PembahasanItem, RekapGrafikData } from './ai';
import {
  EKSPOSE_CATEGORIES,
  EKSPOSE_COLORS,
  EKSPOSE_GRAFIK_SLIDES,
  extractKesimpulanContent,
  parseBoldSegments,
} from './ekspose-config';

export interface EksposePptxInput {
  rekapMap: Record<'grafik1' | 'grafik2' | 'grafik3' | 'grafik4' | 'grafik5', RekapGrafikData>;
  pembahasanMap: Record<string, PembahasanItem>;
}

const SLIDE_W = 13.333; // 16:9 widescreen (inches)
const LOGO_RATIO = 340 / 79; // Dimensi intrinsik public/logo-jabar.png
const FONT_FAMILY = 'Calibri';

async function loadLogoDataUri(): Promise<string | null> {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo-jabar.png');
    const buf = await readFile(logoPath);
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

function addSlideHeader(
  slide: PptxGenJS.Slide,
  title: string,
  logoDataUri: string | null
) {
  // Judul utama diposisikan simetris namun aman dari area logo kanan atas
  slide.addText(title, {
    x: 2.35,
    y: 0.22,
    w: 7.95,
    h: 0.92,
    fontFace: FONT_FAMILY,
    fontSize: 20,
    bold: true,
    color: '000000',
    align: 'center',
    valign: 'middle',
    margin: 0,
  });

  if (logoDataUri) {
    const logoH = 0.56;
    const logoW = Number((logoH * LOGO_RATIO).toFixed(3));
    slide.addImage({
      data: logoDataUri,
      x: SLIDE_W - logoW - 0.38,
      y: 0.22,
      w: logoW,
      h: logoH,
    });
  }
}

function computeBoxTypography(items: string[], maxCharsNormal = 620, maxCharsCompact = 880) {
  const totalChars = items.reduce((sum, line) => sum + line.length, 0);
  if (totalChars > maxCharsCompact) {
    return { fontSize: 10.5, paraSpaceAfter: 4 };
  }
  if (totalChars > maxCharsNormal) {
    return { fontSize: 11.5, paraSpaceAfter: 6 };
  }
  return { fontSize: 12.5, paraSpaceAfter: 8 };
}

function buildListTextProps(
  items: string[],
  bulletMode: 'bullet' | 'number',
  baseOpts: { fontSize: number; color: string; paraSpaceAfter: number }
): PptxGenJS.TextProps[] {
  const runs: PptxGenJS.TextProps[] = [];
  const bulletConfig =
    bulletMode === 'number'
      ? ({ type: 'number', numberType: 'arabicPeriod', indent: 18 } as const)
      : ({ type: 'bullet', indent: 15 } as const);

  items.forEach((rawItem, itemIdx) => {
    const segments = parseBoldSegments(rawItem);
    const isLastItem = itemIdx === items.length - 1;
    const safeSegments = segments.length > 0 ? segments : [{ text: rawItem, bold: false }];

    safeSegments.forEach((seg, segIdx) => {
      const isFirstSeg = segIdx === 0;
      const isLastSeg = segIdx === safeSegments.length - 1;
      const options: PptxGenJS.TextPropsOptions = {
        fontFace: FONT_FAMILY,
        fontSize: baseOpts.fontSize,
        color: baseOpts.color,
        bold: seg.bold,
        paraSpaceAfter: baseOpts.paraSpaceAfter,
      };
      if (isFirstSeg) {
        options.bullet = bulletConfig;
      }
      if (isLastSeg && !isLastItem) {
        options.breakLine = true;
      }
      runs.push({ text: seg.text, options });
    });
  });

  return runs;
}

function addStyledNarrativePanel(
  slide: PptxGenJS.Slide,
  opts: {
    x: number;
    y: number;
    w: number;
    h: number;
    fillHex: string;
    heading: string;
    items: string[];
    bulletMode: 'bullet' | 'number';
    emptyFallback?: string;
    denseThreshold?: [number, number];
  }
) {
  slide.addShape('rect', {
    x: opts.x,
    y: opts.y,
    w: opts.w,
    h: opts.h,
    fill: { color: opts.fillHex },
    line: { color: opts.fillHex, width: 0 },
  });

  // Heading tergaris bawah sesuai template resmi
  slide.addText(opts.heading, {
    x: opts.x + 0.25,
    y: opts.y + 0.16,
    w: opts.w - 0.5,
    h: 0.42,
    fontFace: FONT_FAMILY,
    fontSize: 16,
    bold: false,
    underline: { style: 'sng' },
    color: '000000',
    align: 'center',
    valign: 'middle',
    margin: 0,
  });

  const bodyX = opts.x + 0.24;
  const bodyY = opts.y + 0.64;
  const bodyW = opts.w - 0.48;
  const bodyH = opts.h - 0.80;

  if (opts.items.length === 0) {
    slide.addText(opts.emptyFallback || 'Belum ada catatan pembahasan.', {
      x: bodyX,
      y: bodyY + 0.3,
      w: bodyW,
      h: bodyH - 0.6,
      fontFace: FONT_FAMILY,
      fontSize: 12,
      italic: true,
      color: '475569',
      align: 'center',
      valign: 'top',
    });
    return;
  }

  const [tNormal, tCompact] = opts.denseThreshold ?? [620, 880];
  const { fontSize, paraSpaceAfter } = computeBoxTypography(opts.items, tNormal, tCompact);
  const textProps = buildListTextProps(opts.items, opts.bulletMode, {
    fontSize,
    color: '1E293B',
    paraSpaceAfter,
  });

  slide.addText(textProps, {
    x: bodyX,
    y: bodyY,
    w: bodyW,
    h: bodyH,
    align: 'left',
    valign: 'top',
    lineSpacingMultiple: 1.15,
    margin: [2, 6, 4, 6],
  });
}

function addHorizontalEksposeChart(
  pres: PptxGenJS,
  slide: PptxGenJS.Slide,
  subtitle: string,
  labelOrange: string,
  labelBlue: string,
  rekap: RekapGrafikData
) {
  slide.addText(subtitle, {
    x: 0.48,
    y: 1.32,
    w: 7.30,
    h: 0.62,
    fontFace: FONT_FAMILY,
    fontSize: 16,
    color: EKSPOSE_COLORS.subtitleHex,
    align: 'center',
    valign: 'middle',
    margin: 0,
  });

  const categories = [...EKSPOSE_CATEGORIES]; // ['76-100', '51-75', '26-50', '1-25', '0']
  const valuesOrange = [...rekap.dataB].reverse();
  const valuesBlue = [...rekap.dataA].reverse();
  const maxVal = Math.max(...valuesOrange, ...valuesBlue, 10);

  const chartSeries = [
    {
      name: labelOrange,
      labels: categories,
      values: valuesOrange,
    },
    {
      name: labelBlue,
      labels: categories,
      values: valuesBlue,
    },
  ];

  // catAxisOrientation='maxMin' menjaga kategori '76-100' di puncak dan batang Orange di atas Blue
  const chartOpts: PptxGenJS.IChartOpts = {
    x: 0.42,
    y: 1.98,
    w: 7.42,
    h: 5.05,
    barDir: 'bar',
    barGrouping: 'clustered',
    barGapWidthPct: 85,
    barOverlapPct: 0,
    chartColors: [EKSPOSE_COLORS.orangeHex, EKSPOSE_COLORS.blueHex],
    catAxisOrientation: 'maxMin' as unknown as 'minMax',
    catAxisLabelColor: EKSPOSE_COLORS.axisTextHex,
    catAxisLabelFontFace: FONT_FAMILY,
    catAxisLabelFontSize: 12,
    catAxisLineShow: true,
    catAxisLineColor: 'D9D9D9',
    catAxisLineSize: 1,
    catAxisMajorTickMark: 'none',
    catGridLine: { style: 'none' },
    valAxisHidden: true,
    valAxisMinVal: 0,
    valAxisMaxVal: Math.max(maxVal + 4, 22),
    valGridLine: { style: 'none' },
    showValue: true,
    dataLabelPosition: 'outEnd',
    dataLabelColor: EKSPOSE_COLORS.dataLabelHex,
    dataLabelFontFace: FONT_FAMILY,
    dataLabelFontSize: 11,
    showLegend: true,
    legendPos: 'b',
    legendFontFace: FONT_FAMILY,
    legendFontSize: 12,
    legendColor: EKSPOSE_COLORS.axisTextHex,
    showTitle: false,
  };

  slide.addChart(pres.ChartType.bar, chartSeries, chartOpts);
}

/**
 * Menghasilkan file presentasi PowerPoint (.pptx) berisi 6 slide resmi Ekspose.
 */
export async function generateEksposePptxBuffer(input: EksposePptxInput): Promise<Buffer> {
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = 'Ekspose Evaluasi Pasca Pelatihan PKP Angkatan VII';
  pres.subject = 'Hasil Evaluasi Pasca Pelatihan BPSDM Provinsi Jawa Barat';
  pres.company = 'BPSDM Provinsi Jawa Barat';
  pres.author = 'Sistem Evaluasi Pasca Pelatihan';

  const logoDataUri = await loadLogoDataUri();

  // Slide 1 - 5: Grafik Batang Horizontal + Kotak Pembahasan Biru Muda (#D9E1F2)
  for (const meta of EKSPOSE_GRAFIK_SLIDES) {
    const slide = pres.addSlide();
    slide.background = { color: 'FFFFFF' };

    addSlideHeader(slide, meta.slideTitle, logoDataUri);

    const rekap = input.rekapMap[meta.key];
    addHorizontalEksposeChart(
      pres,
      slide,
      meta.subtitle,
      meta.labelOrange,
      meta.labelBlue,
      rekap
    );

    const pItem = input.pembahasanMap[meta.key];
    const bulletItems = [pItem?.poin1, pItem?.poin2, pItem?.poin3, pItem?.poin4]
      .map((p) => (typeof p === 'string' ? p.trim() : ''))
      .filter(Boolean);

    addStyledNarrativePanel(slide, {
      x: 8.15,
      y: 1.32,
      w: 4.78,
      h: 5.82,
      fillHex: EKSPOSE_COLORS.pembahasanBgHex,
      heading: 'Pembahasan',
      items: bulletItems,
      bulletMode: 'bullet',
      emptyFallback: 'Pembahasan untuk slide ini belum tersedia.',
      denseThreshold: [600, 860],
    });
  }

  // Slide 6 (Slide 10): Kesimpulan dan Rekomendasi
  const closingSlide = pres.addSlide();
  closingSlide.background = { color: 'FFFFFF' };
  addSlideHeader(closingSlide, 'Kesimpulan dan Rekomendasi', logoDataUri);

  const kesimpulanItem = input.pembahasanMap.kesimpulan;
  const { pembahasanList, rekomendasiList } = extractKesimpulanContent(kesimpulanItem);

  addStyledNarrativePanel(closingSlide, {
    x: 0.56,
    y: 1.32,
    w: 5.92,
    h: 5.82,
    fillHex: EKSPOSE_COLORS.kesimpulanBgHex,
    heading: 'Pembahasan',
    items: pembahasanList,
    bulletMode: 'bullet',
    emptyFallback: 'Pembahasan kesimpulan belum dibuat.',
    denseThreshold: [740, 1020],
  });

  addStyledNarrativePanel(closingSlide, {
    x: 6.85,
    y: 1.32,
    w: 5.92,
    h: 5.82,
    fillHex: EKSPOSE_COLORS.rekomendasiBgHex,
    heading: 'Rekomendasi',
    items: rekomendasiList,
    bulletMode: 'number',
    emptyFallback:
      'Rekomendasi belum dibuat. Gunakan Buat Semua dengan AI atau sunting manual di halaman Ekspose.',
    denseThreshold: [740, 1020],
  });

  const output = await pres.write({ outputType: 'nodebuffer' });
  if (Buffer.isBuffer(output)) {
    return output;
  }
  if (output instanceof Uint8Array) {
    return Buffer.from(output);
  }
  if (output instanceof ArrayBuffer) {
    return Buffer.from(output);
  }
  return Buffer.from(output as string, 'binary');
}
