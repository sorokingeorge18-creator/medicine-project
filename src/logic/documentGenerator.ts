// ============================================================
// Генерация медицинских документов по эталонному формату
// ============================================================

import { parseISO, isSameDay, isAfter } from 'date-fns';
import {
  FormData,
  DiaryEntry,
  Side,
  LimbType,
  PostOpFixationType,
  InjuryCause,
  Gender,
} from '../types';
import {
  calculateDiaryDates,
  getPreopEpicrisisDate,
  formatDateShort,
  DiaryDateEntry,
} from './dateCalculations';
import {
  generateUniqueVitalSigns,
} from './statusGenerator';

// ─── Грамматика ───────────────────────────────────────────────────────────────

/** Прилагательное стороны — именительный падеж */
function sideNom(side: Side, limbType: LimbType): string {
  // Верхняя/нижняя конечность — женский род
  if (limbType === 'upper' || limbType === 'lower') {
    return side === 'right' ? 'Правая' : 'Левая';
  }
  return side === 'right' ? 'Правая' : 'Левая';
}

/** Прилагательное стороны — родительный падеж */
function sideGen(side: Side): string {
  return side === 'right' ? 'правой' : 'левой';
}

/** Прилагательное стороны — именительный, нижний регистр */
function sideNomLower(side: Side): string {
  return side === 'right' ? 'правая' : 'левая';
}

/** Конечность — именительный падеж */
function limbNom(limbType: LimbType): string {
  return limbType === 'upper' ? 'верхняя конечность' : 'нижняя конечность';
}

/** Конечность — родительный падеж */
function limbGen(limbType: LimbType): string {
  return limbType === 'upper' ? 'верхней конечности' : 'нижней конечности';
}

/** Причина травмы — строка */
function injuryCauseToRu(cause: InjuryCause): string {
  const map: Record<InjuryCause, string> = {
    household: 'бытовая',
    road: 'дорожная',
    sport: 'спортивная',
    criminal: 'криминальная',
    industrial: 'производственная',
    other: 'прочая',
  };
  return map[cause];
}

/** Согласование глагольных форм по полу пациента */
function genderForm(gender: Gender, female: string, male: string): string {
  return gender === 'female' ? female : male;
}

// ─── Status praesens ─────────────────────────────────────────────────────────

interface VitalTexts {
  bpSystolic: number;
  bpDiastolic: number;
  pulse: number;
  rr: number;
  temperature: number;
}

/**
 * Расширенный status praesens — для дня поступления.
 * Соответствует формату из первичного осмотра с заведующим.
 */
function buildStatusPraesensAdmission(v: VitalTexts): string {
  const temp = v.temperature.toFixed(1).replace('.', ',');
  return (
    `Состояние удовлетворительное. Сознание ясное. Кожные покровы физиологической окраски, чистые, сухие. ` +
    `АД ${v.bpSystolic}/${v.bpDiastolic} мм.рт.ст. Ps ${v.pulse} в мин. ЧДД ${v.rr} в мин. Температура тела ${temp}. ` +
    `Грудная клетка правильной конфигурации, равномерно участвует в акте дыхания; при пальпации эластичная, безболезненная. ` +
    `Дыхание везикулярное, хрипов нет, одинаковое над симметричными отделами легких. ` +
    `Тоны сердца приглушенные, ритмичные. ` +
    `Живот округлый равномерно участвует в акте дыхания, при пальпации мягкий, безболезненный. ` +
    `Перитониальных симптомов, притупления в отлогих местах нет. ` +
    `Симптом поколачивания отрицательных с обеих сторон. Физиологические отправления регулярные.`
  );
}

/**
 * Сокращённый status praesens — для последующих дневников.
 * Используется с меткой "Status praesens:" в послеоперационных дневниках.
 */
function buildStatusPraesensRegular(v: VitalTexts, gender: Gender): string {
  const temp = v.temperature.toFixed(1).replace('.', ',');
  const adj1 = genderForm(gender, 'Адекватна', 'Адекватен');
  const adj2 = genderForm(gender, 'критична', 'критичен');
  const adj3 = genderForm(gender, 'ориентирована', 'ориентирован');
  return (
    `Состояние удовлетворительное. ${adj1}, к своему состоянию ${adj2}, в месте, времени и личности ${adj3}. ` +
    `Гемодинамика стабильная. Тоны сердца ясные, ритмичные. ` +
    `АД ${v.bpSystolic}/${v.bpDiastolic} мм. рт. ст. пульс ${v.pulse} уд. в мин., кожные покровы физиологической окраски. ` +
    `Дыхание везикулярное, проводится во всех отделах. хрипов нет ЧДД ${v.rr}. ` +
    `Живот мягкий, безболезненный. Перитониальные симптомы отрицательные. ` +
    `Физиологические отправления в порядке. Температура ${temp}.`
  );
}

// ─── Status localis ───────────────────────────────────────────────────────────

/**
 * Status localis для дневника до операции.
 */
function buildLocalisPreOp(
  side: Side,
  limbType: LimbType,
  localisArea: string,
  castOnAdmission: boolean,
  castDescription: string,
  edema: string
): string {
  const sg = sideGen(side);
  const lg = limbGen(limbType);
  const area = localisArea || 'плечевого сустава';

  if (castOnAdmission && castDescription) {
    return `${castDescription} В области ${sg} ${area} ${edema}. Ишемических и периферических неврологических расстройств в ${sg} ${lg} нет. Лечение получает.`;
  }
  if (castOnAdmission) {
    return `Ось ${sg} ${lg} визуально не нарушена. Гипсовая повязка стабильна. В области ${sg} ${area} ${edema}. Ишемических и периферических неврологических расстройств в ${sg} ${lg} нет. Лечение получает.`;
  }
  return `Ось ${sg} ${lg} визуально не нарушена. В области ${sg} ${area} ${edema}. Ишемических и периферических неврологических расстройств в ${sg} ${lg} нет. Лечение получает.`;
}

/**
 * Status localis для послеоперационного дневника.
 */
function buildLocalisPostOp(
  side: Side,
  limbType: LimbType,
  localisArea: string,
  fixationType: PostOpFixationType,
  fixationDescription: string,
  edema: string,
  isFirstPostOp: boolean
): string {
  const sn = sideNom(side, limbType);
  const sg = sideGen(side);
  const ln = limbNom(limbType);
  const lg = limbGen(limbType);
  const area = localisArea || 'плечевого сустава';

  // Название фиксации и её описание
  let fixLine = '';
  let fixStatus = '';
  switch (fixationType) {
    case 'sling':
      fixLine = `${sn} ${ln} в косыночной повязке.`;
      fixStatus = isFirstPostOp ? ` Косыночная повязка в порядке.` : '';
      break;
    case 'deso':
      fixLine = `${sn} ${ln} в повязке Дезо.`;
      fixStatus = isFirstPostOp ? ` Повязка Дезо в порядке.` : '';
      break;
    case 'cast':
      fixLine = `${sn} ${ln} в гипсовой повязке.`;
      fixStatus = isFirstPostOp ? ` Гипсовая повязка в порядке.` : '';
      break;
    case 'other':
      fixLine = fixationDescription
        ? `${sn} ${ln} ${fixationDescription}.`
        : `${sn} ${ln} фиксирована.`;
      fixStatus = '';
      break;
    default:
      fixLine = '';
      fixStatus = '';
  }

  const woundLine =
    `Кожный покров в области швов без признаков воспаления. ` +
    `Послеоперационная рана без особенностей, отделяемое – нет.`;

  return (
    `${fixLine}${fixStatus} Отёк области ${sg} ${area} ${edema}. ` +
    `${woundLine} Периферических ишемических и неврологических нарушений в ${sg} ${lg} не выявлено.`
  );
}

// ─── Жалобы ───────────────────────────────────────────────────────────────────

const COMPLAINTS_LATER = [
  'активно жалоб не предъявляет.',
  'жалобы на периодические боли в области оперативного вмешательства.',
  'жалобы на дискомфорт в области оперативного вмешательства.',
];

function buildComplaints(
  isAdmission: boolean,
  isFirstPostOp: boolean,
  side: Side,
  localisArea: string,
  index: number
): string {
  const area = localisArea || 'повреждения';
  const sg = side === 'right' ? 'правого' : 'левого';
  if (isAdmission) {
    return `на боль в области ${sg} ${area}, купируется анальгетиками.`;
  }
  if (isFirstPostOp) {
    return `на умеренные боли в области ${sg} ${area}.`;
  }
  return COMPLAINTS_LATER[index % COMPLAINTS_LATER.length];
}

// ─── Описание отёка ──────────────────────────────────────────────────────────

function buildEdema(isAdmission: boolean, isFirstPostOp: boolean, index: number): string {
  if (isAdmission) {
    return index % 2 === 0 ? 'отёк умеренный' : 'отёк умеренный, не нарос';
  }
  if (isFirstPostOp) {
    return 'выражен умеренно, не нарос';
  }
  const opts = ['выражен слабо, регрессирует', 'незначительный', 'не выражен'];
  return opts[index % opts.length];
}

// ─── Строки подписей ─────────────────────────────────────────────────────────

function buildSignatures(
  residentName: string,
  attendingName: string,
  headName: string,
  includeHead: boolean
): string {
  const lines = [];
  if (residentName) lines.push(`Клин. ординатор ______________ ${residentName}`);
  lines.push(`Врач ______________ ${attendingName}`);
  if (includeHead) lines.push(`Зав. отделением ______________ ${headName}`);
  // Правое выравнивание через отступ в тексте
  return lines.map((l) => `                              ${l}`).join('\n');
}

// ─── Заголовок дневника ───────────────────────────────────────────────────────

function buildDiaryHeader(
  dateStr: string,
  time: string,
  title: string,
  lastName: string
): string {
  return `${dateStr} ${time}      ${title}      ${lastName}`;
}

// ─── Основная генерация дневника ──────────────────────────────────────────────

function generateDiaryContent(
  entry: DiaryDateEntry,
  index: number,
  isFirstPostOp: boolean,
  formData: FormData,
  vitals: VitalTexts
): string {
  const { patient, diagnosis, immobilization, doctors } = formData;
  const { side, limbType, localisArea, mainDiagnosis, comorbidities } = diagnosis;
  const time = patient.examinationTime || '10:00';
  const dateStr = formatDateShort(entry.date);
  const lastName = patient.lastName;

  const admissionDate = parseISO(patient.admissionDate);
  const operationDate = parseISO(patient.operationDate);
  const isAdmission = isSameDay(entry.date, admissionDate);
  const isPostOp = isAfter(entry.date, operationDate);

  // Подбираем заголовок дневника
  let diaryTitle: string;
  if (entry.type === 'withHead') {
    if (isAdmission) {
      diaryTitle = `Первичный осмотр совместно с заведующим отделением ${doctors.headName}`;
    } else {
      diaryTitle = `Осмотр совместно с заведующим отделением ${doctors.headName}`;
    }
  } else if (isFirstPostOp) {
    diaryTitle = 'Осмотр лечащего врача (первые сутки после операции)';
  } else {
    diaryTitle = 'Осмотр лечащего врача';
  }

  const header = buildDiaryHeader(dateStr, time, diaryTitle, lastName);

  // Жалобы
  const complaints = buildComplaints(isAdmission, isFirstPostOp, side, localisArea, index);

  // Status praesens
  const praesensText = isAdmission
    ? buildStatusPraesensAdmission(vitals)
    : buildStatusPraesensRegular(vitals, patient.gender);

  // Отёк
  const edema = buildEdema(isAdmission, isFirstPostOp, index);

  // Status localis
  const localis = isPostOp
    ? buildLocalisPostOp(
        side, limbType, localisArea,
        immobilization.postOpFixation, immobilization.fixationDescription,
        edema, isFirstPostOp
      )
    : buildLocalisPreOp(
        side, limbType, localisArea,
        immobilization.castOnAdmission, immobilization.castDescription,
        edema
      );

  // Диагноз для дневника "с заведующим" (при поступлении — перед жалобами)
  const diagnosisLineAdmission =
    entry.type === 'withHead' && isAdmission
      ? `\nДиагноз: ${mainDiagnosis}\n`
      : '';

  // Раздел назначений / завершения
  const postOpBlock =
    isPostOp
      ? `\nЛечение по листу назначений получает.\nЛФК с методистом.`
      : '';

  // Для дневников "с заведующим" — диагноз и рекомендации ПОСЛЕ localis
  let tailBlock = '';
  if (entry.type === 'withHead' && !isAdmission) {
    const comorbLine = comorbidities?.trim() ? comorbidities : '';
    const diagFull = comorbLine
      ? `${mainDiagnosis}. ${comorbLine}`
      : mainDiagnosis;
    tailBlock += `\nДиагноз: ${diagFull}`;
    if (entry.isDischarge) {
      tailBlock += `\nРекомендовано: выписка.\nЗамечания: нет.`;
    } else {
      tailBlock += `\nРекомендовано: дальнейшее наблюдение.\nЗамечания: нет.`;
    }
  }

  // Строка выписки
  const dischargeBlock =
    entry.isDischarge
      ? `\n\nВ дальнейшем стационарном лечении не нуждается, рекомендации даны, выписка для наблюдения в травмпункте по месту жительства.`
      : '';

  // Рекомендация для первичного с заведующим (день поступления)
  const admissionRec =
    entry.type === 'withHead' && isAdmission
      ? `\nРекомендовано: обследование для решения тактики лечения.`
      : '';

  // Подписи
  const includeHead = entry.type === 'withHead';
  const signatures = buildSignatures(
    doctors.residentName,
    doctors.attendingName,
    doctors.headName,
    includeHead
  );

  // Сборка документа
  // Структура зависит от типа дня
  if (isAdmission) {
    // Формат: первичный осмотр с заведующим
    return [
      header,
      diagnosisLineAdmission.trim() ? `\n${diagnosisLineAdmission.trim()}` : '',
      `\nЖалобы: ${complaints}`,
      `\n${praesensText}`,
      `\nStatus localis: ${localis}`,
      admissionRec,
      `\n${signatures}`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (isPostOp) {
    // Формат: послеоперационный дневник
    // Status praesens имеет метку
    return [
      header,
      `\nЖалобы: ${complaints}`,
      `\nStatus praesens: ${praesensText}`,
      `\nStatus localis: ${localis}`,
      postOpBlock,
      tailBlock,
      dischargeBlock,
      `\n${signatures}`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  // Предоперационный плановый дневник (между поступлением и операцией)
  return [
    header,
    entry.type === 'withHead'
      ? `\nДиагноз: ${mainDiagnosis}\n`
      : '',
    `\nЖалобы: ${complaints}`,
    `\n${praesensText}`,
    `\nStatus localis: ${localis}`,
    tailBlock,
    `\n${signatures}`,
  ]
    .filter(Boolean)
    .join('\n');
}

// ─── Предоперационный эпикриз ─────────────────────────────────────────────────

function generatePreopEpicrisisContent(formData: FormData): string {
  const { patient, diagnosis, examination, operation, immobilization, doctors } = formData;

  const preopDate = getPreopEpicrisisDate(patient.operationDate);
  const time = patient.examinationTime || '10:00';

  const fio = `${patient.lastName} ${patient.firstName} ${patient.middleName}`.trim();
  const birthStr = formatDateShort(parseISO(patient.birthDate));
  const admStr = `${formatDateShort(parseISO(patient.admissionDate))} г. ${patient.admissionTime}`;
  const preopStr = `${formatDateShort(preopDate)} г. ${time}`;

  const injuryCause = injuryCauseToRu(diagnosis.injuryCause);
  const comorbStr = diagnosis.comorbidities?.trim() || '';

  // Status praesens эпикриза (тот же сокращённый формат)
  // Используем фиксированные "нейтральные" показатели для эпикриза
  const praesensEpicr =
    `Состояние удовлетворительное. Болевой синдром купируется анальгетиками. ` +
    `${genderForm(patient.gender, 'Больная адекватна', 'Больной адекватен')}, к своему состоянию ${genderForm(patient.gender, 'критична', 'критичен')}, ` +
    `в месте, времени и личности ${genderForm(patient.gender, 'ориентирована', 'ориентирован')}. ` +
    `Гемодинамика стабильная. Тоны сердца ясные, ритмичные. АД 121/75 мм. рт. ст. пульс 79 уд. в мин., ` +
    `кожные покровы физиологической окраски. Дыхание везикулярное, проводится во всех отделах. хрипов нет ЧДД 16. ` +
    `Живот мягкий, безболезненный. Перитониальные симптомы отрицательные. Физиологические отправления в порядке. Температура 36,4.`;

  // Status localis эпикриза
  let localisEpicr: string;
  if (immobilization.castOnAdmission) {
    const castDesc = immobilization.castDescription
      ? immobilization.castDescription
      : `${sideNomLower(diagnosis.side)} ${limbNom(diagnosis.limbType)} в гипсовой лонгете`;
    const sg = sideGen(diagnosis.side);
    const area = diagnosis.localisArea || 'плечевого сустава';
    const lg = limbGen(diagnosis.limbType);
    localisEpicr =
      `${castDesc}. Гипсовая повязка в порядке. ` +
      `Отёк области ${sg} ${area} умеренный, не нарос. ` +
      `Периферических ишемических и неврологических нарушений в ${sg} ${lg} не выявлено.`;
  } else {
    const sg = sideGen(diagnosis.side);
    const area = diagnosis.localisArea || 'плечевого сустава';
    const lg = limbGen(diagnosis.limbType);
    localisEpicr =
      `В области ${sg} ${area} умеренный отёк мягких тканей, болезненность при пальпации. ` +
      `Периферических ишемических и неврологических нарушений в ${sg} ${lg} не выявлено.`;
  }

  // Блок обследований
  let examBlock = '';
  if (examination.ctPerformed && examination.ctDescription) {
    examBlock = `На РГ и КТ ${diagnosis.localisArea ? diagnosis.localisArea + ':' : ':'} ${examination.xrayDescription}`;
    if (examination.ctDescription) {
      examBlock += ` ${examination.ctDescription}`;
    }
  } else {
    examBlock = `На рентгенограммах ${diagnosis.localisArea ? diagnosis.localisArea + ':' : ':'} ${examination.xrayDescription}`;
  }

  const lines = [
    `ПРЕДОПЕРАЦИОННЫЙ ЭПИКРИЗ`,
    `${preopStr}`,
    ``,
    `   • Сведения о пациенте:`,
    `Фамилия, имя, отчество (при наличии): ${fio}`,
    `Дата рождения: ${birthStr} г.`,
    `Дата и время поступления: ${admStr}`,
    ``,
    `   • Диагноз:`,
    `Основное заболевание: ${diagnosis.mainDiagnosis}.`,
    `Осложнения основного заболевания:`,
    `Внешняя причина при травмах, отравлениях: травма ${injuryCause}.`,
    `Сопутствующие заболевания: ${comorbStr || '—'}`,
    ``,
    `   • Дополнительные сведения о заболевании:`,
    `   • Особенности анамнеза: травма ${injuryCause}.`,
    `Аллергические реакции на лекарственные препараты, пищевая аллергия или иные виды непереносимости в анамнезе, с указанием типа и вида аллергической реакции: отрицает`,
    `Постоянный прием лекарственных препаратов: нет`,
    `Наличие имплантированных медицинских изделий: отрицает`,
    ``,
    `   • Физикальное исследование, локальный статус:`,
    `St.praesens: ${praesensEpicr}`,
    ``,
    `St.localis: ${localisEpicr}`,
    ``,
    `   • Результаты медицинского обследования:`,
    examBlock,
    ``,
    `   • Дополнительные сведения:`,
    `   • Обоснование необходимости проведения оперативного вмешательства (операции), медицинские показания, планируемое оперативное вмешательство (операция), планируемый вид анестезиологического пособия:`,
    `Учитывая характер и морфологию перелома, сроки после травмы, медицинские и социальные прогнозы, показано выполнение оперативного лечения в объёме: ${operation.operationVolume || operation.operationName}`,
    ``,
    `   • Сведения о наличии информированного добровольного согласия на оперативное вмешательство (операцию): Согласие на оперативное лечение: получено ${formatDateShort(preopDate)}`,
    ``,
    `                              Лечащий врач: ${doctors.attendingName}______________________`,
    ``,
    `                              Заведующим отделением: ${doctors.headName}______________________`,
  ];

  return lines.join('\n');
}

// ─── Главная функция ──────────────────────────────────────────────────────────

export function generateAllDocuments(formData: FormData): {
  diaries: DiaryEntry[];
  preopEpicrisis: DiaryEntry | null;
} {
  const { patient } = formData;

  if (!patient.admissionDate || !patient.operationDate || !patient.dischargeDate) {
    return { diaries: [], preopEpicrisis: null };
  }

  const dateEntries = calculateDiaryDates(
    patient.admissionDate,
    patient.operationDate,
    patient.dischargeDate
  );

  const vitalSignsArr = generateUniqueVitalSigns(dateEntries.length);
  const operationDate = parseISO(patient.operationDate);

  const firstPostOpIndex = dateEntries.findIndex((e) => e.isPostOp);

  const diaries: DiaryEntry[] = dateEntries.map((entry, index) => {
    const isFirstPostOp = entry.isPostOp && index === firstPostOpIndex;
    const isPostOp = isAfter(entry.date, operationDate);
    const vitals = vitalSignsArr[index];

    const content = generateDiaryContent(
      entry, index, isFirstPostOp, formData, vitals
    );

    const title =
      entry.type === 'withHead'
        ? 'Дневник наблюдения с заведующим отделением'
        : 'Дневник наблюдения';

    return {
      id: `diary-${index}`,
      date: entry.date.toISOString(),
      type: entry.type,
      title,
      content,
      isPostOp,
      isEdited: false,
    };
  });

  // Предоперационный эпикриз
  const preopDate = getPreopEpicrisisDate(patient.operationDate);
  const preopContent = generatePreopEpicrisisContent(formData);

  const preopEpicrisis: DiaryEntry = {
    id: 'preop-epicrisis',
    date: preopDate.toISOString(),
    type: 'preop',
    title: 'Предоперационный эпикриз',
    content: preopContent,
    isPostOp: false,
    isEdited: false,
  };

  return { diaries, preopEpicrisis };
}

/** ФИО полностью */
export function formatPatientName(l: string, f: string, m: string): string {
  return [l, f, m].filter(Boolean).join(' ');
}
