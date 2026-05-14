// ============================================================
// Экспорт документов в DOCX с правильным форматированием
// Жирные метки, подписи, поля по ГОСТ
// ============================================================

import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  Packer,
  PageBreak,
  SectionType,
  UnderlineType,
} from 'docx';
import { saveAs } from 'file-saver';
import { DiaryEntry, FormData } from '../types';
import { formatDateShort } from './dateCalculations';
import { parseISO } from 'date-fns';

// ─── Константы форматирования ─────────────────────────────────────────────────

const FONT = 'Times New Roman';
const SIZE = 24;       // 12pt = 24 half-points
const LINE_SPACING = 360; // 1.5 интервал

// ─── Жирные метки, которые выделяются в начале абзаца ────────────────────────

const BOLD_LABELS = [
  'Жалобы:',
  'Status localis:',
  'Status praesens:',
  'St.praesens:',
  'St.localis:',
  'Диагноз:',
  'Рекомендовано:',
  'Замечания:',
  'Осложнения основного заболевания:',
  'Внешняя причина при травмах, отравлениях:',
  'Сопутствующие заболевания:',
  'Основное заболевание:',
  'Постоянный прием лекарственных препаратов:',
  'Аллергические реакции',
  'Наличие имплантированных медицинских изделий:',
];

// Строки, которые жирные целиком
const BOLD_FULL_LINES = [
  'ПРЕДОПЕРАЦИОННЫЙ ЭПИКРИЗ',
  'В дальнейшем стационарном лечении не нуждается',
];

// Метки, которые подчёркнуты (заголовки разделов в эпикризе)
const UNDERLINE_LABELS = [
  'Сведения о пациенте:',
  'Диагноз:',
  'Дополнительные сведения о заболевании:',
  'Физикальное исследование, локальный статус:',
  'Результаты медицинского обследования:',
  'Дополнительные сведения:',
  'Обоснование необходимости',
  'Сведения о наличии информированного',
];

// ─── Вспомогательные функции для создания прогонов ───────────────────────────

function makeRun(text: string, bold = false, underline = false): TextRun {
  return new TextRun({
    text,
    bold,
    size: SIZE,
    font: FONT,
    underline: underline ? { type: UnderlineType.SINGLE } : undefined,
  });
}

function makeEmptyParagraph(): Paragraph {
  return new Paragraph({
    children: [makeRun('')],
    spacing: { line: 240, after: 0, before: 0 },
  });
}

function makePageBreak(): Paragraph {
  return new Paragraph({ children: [new PageBreak()] });
}

// ─── Разбор строки с жирными метками ─────────────────────────────────────────

/**
 * Разбивает строку на фрагменты [text, isBold] для создания TextRun.
 * Метка типа "Жалобы:" выделяется жирным, остальное — обычным шрифтом.
 */
function parseLineRuns(line: string): TextRun[] {
  // Строки с подписями — правое выравнивание обрабатывается в makeLineParagraph
  // Полностью жирные строки
  for (const full of BOLD_FULL_LINES) {
    if (line.includes(full)) {
      return [makeRun(line, true)];
    }
  }

  // Поиск жирной метки в начале строки
  for (const label of BOLD_LABELS) {
    if (line.startsWith(label)) {
      const rest = line.slice(label.length);
      const isUnderLabel = UNDERLINE_LABELS.includes(label);
      return [
        makeRun(label, true, isUnderLabel),
        makeRun(rest, false),
      ];
    }
    // Метка после отступа "   • Жалобы:" и т.п.
    const stripped = line.trimStart();
    if (stripped.startsWith(label)) {
      const indent = line.slice(0, line.length - stripped.length);
      const rest = stripped.slice(label.length);
      return [
        makeRun(indent, false),
        makeRun(label, true),
        makeRun(rest, false),
      ];
    }
  }

  // Подчёркнутые заголовки разделов эпикриза
  for (const ulLabel of UNDERLINE_LABELS) {
    if (line.includes(ulLabel)) {
      const idx = line.indexOf(ulLabel);
      const before = line.slice(0, idx);
      const after = line.slice(idx + ulLabel.length);
      return [
        makeRun(before, false),
        makeRun(ulLabel, true, true),
        makeRun(after, false),
      ];
    }
  }

  // Заголовок дневника: первая строка с датой и фамилией
  // Формат: "30.10.2025 10:00      Первичный осмотр...      Голышева"
  // Фамилия в конце — жирная
  const headerMatch = line.match(/^(\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}\s+)(.*?)\s{2,}(\S+)$/);
  if (headerMatch) {
    return [
      makeRun(headerMatch[1], false),
      makeRun(headerMatch[2], false),
      makeRun('      ', false),
      makeRun(headerMatch[3], true),
    ];
  }

  return [makeRun(line, false)];
}

// ─── Создание параграфа из строки ────────────────────────────────────────────

function makeLineParagraph(line: string): Paragraph {
  // Строки подписей — правое выравнивание
  const isSignature =
    line.includes('Клин. ординатор __') ||
    line.includes('Врач __') ||
    line.includes('Зав. отделением __') ||
    line.includes('Лечащий врач:') ||
    line.includes('Заведующим отделением:');

  if (isSignature) {
    const text = line.trim();
    return new Paragraph({
      children: [makeRun(text, false)],
      alignment: AlignmentType.RIGHT,
      spacing: { line: LINE_SPACING, after: 0, before: 0 },
    });
  }

  // Центрирование заголовка ПРЕДОПЕРАЦИОННЫЙ ЭПИКРИЗ
  const isCenteredTitle =
    line.trim() === 'ПРЕДОПЕРАЦИОННЫЙ ЭПИКРИЗ' ||
    /^\d{2}\.\d{2}\.\d{4} г\. \d{2}:\d{2}$/.test(line.trim());

  if (isCenteredTitle) {
    return new Paragraph({
      children: [makeRun(line.trim(), true)],
      alignment: AlignmentType.CENTER,
      spacing: { line: LINE_SPACING, after: 60, before: 60 },
    });
  }

  const runs = parseLineRuns(line);
  return new Paragraph({
    children: runs,
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: LINE_SPACING, after: 0, before: 0 },
  });
}

// ─── Конвертация текста документа в параграфы ─────────────────────────────────

function textToDocxParagraphs(content: string): Paragraph[] {
  const lines = content.split('\n');
  const paragraphs: Paragraph[] = [];

  for (const line of lines) {
    if (line.trim() === '') {
      paragraphs.push(makeEmptyParagraph());
    } else {
      paragraphs.push(makeLineParagraph(line));
    }
  }

  return paragraphs;
}

// ─── Основная функция экспорта ────────────────────────────────────────────────

export async function exportToDocx(
  formData: FormData,
  diaries: DiaryEntry[],
  preopEpicrisis: DiaryEntry | null
): Promise<void> {
  const { patient } = formData;

  // Порядок: сначала эпикриз, потом дневники
  const allDocuments: DiaryEntry[] = [];
  if (preopEpicrisis) allDocuments.push(preopEpicrisis);
  allDocuments.push(...diaries);

  if (allDocuments.length === 0) {
    throw new Error('Нет документов для экспорта');
  }

  const allParagraphs: Paragraph[] = [];

  for (let i = 0; i < allDocuments.length; i++) {
    const doc = allDocuments[i];

    if (i > 0) {
      // Разделитель между документами — пустая строка
      allParagraphs.push(makeEmptyParagraph());
    }

    const contentParagraphs = textToDocxParagraphs(doc.content);
    allParagraphs.push(...contentParagraphs);
  }

  const docxDocument = new Document({
    creator: 'Медицинская документация',
    title: `Документы — ${patient.lastName} ${patient.firstName}`,
    sections: [
      {
        properties: {
          type: SectionType.CONTINUOUS,
          page: {
            margin: {
              top: 1134,    // 2 см
              right: 850,   // 1.5 см
              bottom: 1134, // 2 см
              left: 1701,   // 3 см (переплёт)
            },
          },
        },
        children: allParagraphs,
      },
    ],
  });

  const lastName = patient.lastName || 'Пациент';
  const dischargeDate = patient.dischargeDate
    ? formatDateShort(parseISO(patient.dischargeDate)).replace(/\./g, '-')
    : 'дата';
  const fileName = `${lastName}_${dischargeDate}.docx`;

  const blob = await Packer.toBlob(docxDocument);
  saveAs(blob, fileName);
}
