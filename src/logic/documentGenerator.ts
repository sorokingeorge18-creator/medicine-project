// ============================================================
// Генерация медицинских документов по эталонному формату
// ============================================================

import { parseISO, isAfter } from 'date-fns';
import {
  FormData,
  DiaryEntry,
  Side,
  LimbType,
  PostOpFixationType,
  InjuryCause,
  Gender,
  NounGender,
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

// ─── Склонение: именительный → предложный падеж ──────────────────────────────

/**
 * Переводит одно слово из именительного падежа в предложный
 * (для употребления с предлогом «в»: «в гипсовой повязке»).
 */
function wordToPrep(word: string): string {
  // Слова с дефисом: склоняем только последнюю часть (U-образная → U-образной)
  const dashIdx = word.lastIndexOf('-');
  if (dashIdx > 0 && dashIdx < word.length - 1) {
    return word.slice(0, dashIdx + 1) + wordToPrep(word.slice(dashIdx + 1));
  }

  // Женские прилагательные
  if (word.endsWith('яя')) return word.slice(0, -2) + 'ей';   // задняя→задней, синяя→синей
  if (word.endsWith('ая')) return word.slice(0, -2) + 'ой';   // гипсовая→гипсовой, циркулярная→циркулярной

  // Мужские прилагательные (после велярных — твёрдые окончания)
  if (word.endsWith('кий')) return word.slice(0, -3) + 'ком'; // короткий→коротком
  if (word.endsWith('гий')) return word.slice(0, -3) + 'гом'; // строгий→строгом
  if (word.endsWith('хий')) return word.slice(0, -3) + 'хом'; // тихий→тихом
  // Мягкие / шипящие
  if (word.endsWith('жий')) return word.slice(0, -3) + 'жем'; // свежий→свежем
  if (word.endsWith('ший')) return word.slice(0, -3) + 'шем';
  if (word.endsWith('щий')) return word.slice(0, -3) + 'щем';
  if (word.endsWith('ний')) return word.slice(0, -3) + 'нем'; // последний→последнем, длинний→нет (длинный covered by -ый)
  if (word.endsWith('ий'))  return word.slice(0, -2) + 'ем';  // прочие мягкие
  if (word.endsWith('ый'))  return word.slice(0, -2) + 'ом';  // длинный→длинном, гипсовый→гипсовом

  // Существительные женского рода
  if (word.endsWith('ка')) return word.slice(0, -2) + 'ке';   // повязка→повязке, лонгетка→лонгетке
  if (word.endsWith('га')) return word.slice(0, -2) + 'ге';   // книга→книге
  if (word.endsWith('жа')) return word.slice(0, -2) + 'же';   // вожжа→вожже (редко)
  if (word.endsWith('та')) return word.slice(0, -1) + 'е';    // лонгета→лонгете
  if (word.endsWith('на')) return word.slice(0, -1) + 'е';    // шина→шине
  if (word.endsWith('а'))  return word.slice(0, -1) + 'е';    // общее: шина,рука → ...е

  // Существительные мужского рода на согласную
  if (/[бвгджзклмнпрстфхцчшщ]$/i.test(word)) return word + 'е'; // гипс→гипсе, ортез→ортезе

  return word; // не изменяем (числа, аббревиатуры и т.п.)
}

/**
 * Переводит фразу из именительного падежа в предложный.
 * Пример: «задняя гипсовая лонгета» → «задней гипсовой лонгете»
 */
function toPrep(phrase: string): string {
  return phrase.trim().split(/\s+/).map(wordToPrep).join(' ');
}

// ─── Творительный падеж фамилии ───────────────────────────────────────────────

/**
 * Склоняет первое слово строки «Фамилия И.О.» в творительный падеж.
 * Инициалы не изменяются.
 * Пример: «Привалов Д.А.» → «Приваловым Д.А.»
 */
function surnameInstrumental(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return fullName;
  const s = parts[0];
  const rest = parts.slice(1).join(' ');

  let declined = s;

  // Неизменяемые: -ых/-их (Черных, Долгих)
  if (/[ыи]х$/i.test(s)) {
    declined = s;
  }
  // Женские адъективные: -ская/-цкая → -ской/-цкой
  else if (s.endsWith('ская')) declined = s.slice(0, -4) + 'ской';
  else if (s.endsWith('цкая')) declined = s.slice(0, -4) + 'цкой';
  // Женские адъективные: -яя → -ей, -ая → -ой
  else if (s.endsWith('яя'))   declined = s.slice(0, -2) + 'ей';
  else if (s.endsWith('ая'))   declined = s.slice(0, -2) + 'ой';
  // Женские существительные: -ова/-ева/-ёва/-ина/-ына → убираем -а, добавляем -ой
  else if (s.endsWith('ова') || s.endsWith('ева') || s.endsWith('ёва'))
    declined = s.slice(0, -1) + 'ой';
  else if (s.endsWith('ина') || s.endsWith('ына'))
    declined = s.slice(0, -1) + 'ой';
  // Мужские адъективные: -ой → -ым (Толстой → Толстым)
  else if (s.endsWith('ой'))   declined = s.slice(0, -2) + 'ым';
  // Мужские адъективные: -ый → -ым (Белый → Белым)
  else if (s.endsWith('ый'))   declined = s.slice(0, -2) + 'ым';
  // Мужские адъективные мягкие: -ий → -им (Горький → Горьким, Достоевский → Достоевским)
  else if (s.endsWith('ий'))   declined = s.slice(0, -2) + 'им';
  // Мужские существительные адъективного склонения: -ов/-ев/-ёв → +ым
  else if (s.endsWith('ов') || s.endsWith('ев') || s.endsWith('ёв'))
    declined = s + 'ым';
  // -ин/-ын → +ым (Пушкин → Пушкиным, Ельцин → Ельциным)
  else if (s.endsWith('ин') || s.endsWith('ын'))
    declined = s + 'ым';
  // Твёрдая основа на согласную → +ом (Ятлук → Ятлуком)
  else if (/[бвгджзклмнпрстфхцчшщ]$/i.test(s))
    declined = s + 'ом';
  // Мягкий знак → +ем
  else if (s.endsWith('ь'))
    declined = s.slice(0, -1) + 'ем';
  // Прочее (неизменяемые иностранные фамилии на гласную, кроме -а)
  // оставляем как есть

  return rest ? `${declined} ${rest}` : declined;
}

// ─── Грамматика ───────────────────────────────────────────────────────────────

/** Прилагательное стороны — именительный падеж */
function sideNom(side: Side, limbType: LimbType): string {
  // Верхняя/нижняя конечность — женский род
  if (limbType === 'upper' || limbType === 'lower') {
    return side === 'right' ? 'Правая' : 'Левая';
  }
  return side === 'right' ? 'Правая' : 'Левая';
}

/**
 * Прилагательное стороны — родительный падеж, согласованное с родом существительного.
 * masculine/neuter → правого/левого (напр. "сустав", "бедро")
 * feminine         → правой/левой  (напр. "кость", "голень")
 */
function sideGen(side: Side, nounGender: NounGender = 'masculine'): string {
  if (nounGender === 'feminine') return side === 'right' ? 'правой' : 'левой';
  return side === 'right' ? 'правого' : 'левого';
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
 * Status praesens — единый формат для всех дневников (по образцу реальных документов).
 */
function buildStatusPraesensRegular(v: VitalTexts, gender: Gender): string {
  const subj = genderForm(gender, 'Больная', 'Больной');
  const adj1 = genderForm(gender, 'адекватна', 'адекватен');
  const adj2 = genderForm(gender, 'контактна', 'контактен');
  return (
    `Состояние удовлетворительное. Болевой синдром купируется анальгетиками. ` +
    `${subj} ${adj1}, ${adj2}. ` +
    `Кожные покровы чистые. В лёгких дыхание везикулярное, хрипов нет. ЧДД ${v.rr} в мин. ` +
    `Тоны сердца ясные, ритмичные, ЧСС ${v.pulse} уд. в мин. ` +
    `АД ${v.bpSystolic}/${v.bpDiastolic} мм рт. ст. Живот мягкий безболезненный. Стул, диурез в норме.`
  );
}

// ─── Status localis ───────────────────────────────────────────────────────────

/**
 * Строка фиксации для строки status localis (до операции).
 * Возвращает описание фиксации или пустую строку если нет.
 */
function buildAdmissionFixLine(
  side: Side,
  limbType: LimbType,
  fixationType: PostOpFixationType,
  fixationDescription: string
): string {
  const sn = sideNom(side, limbType);
  const ln = limbNom(limbType);
  switch (fixationType) {
    case 'cast': {
      const castDesc = fixationDescription?.trim()
        ? toPrep(fixationDescription.trim())
        : 'гипсовой повязке';
      return `${sn} ${ln} в ${castDesc}. Повязка стабильна.`;
    }
    case 'sling':
      return `${sn} ${ln} в косыночной повязке. Косыночная повязка в порядке.`;
    case 'deso':
      return `${sn} ${ln} в повязке Дезо. Повязка Дезо в порядке.`;
    case 'other':
      return fixationDescription
        ? `${sn} ${ln} в ${toPrep(fixationDescription)}.`
        : '';
    default:
      return '';
  }
}

/**
 * Status localis для дневника до операции.
 */
function buildLocalisPreOp(
  side: Side,
  limbType: LimbType,
  localisArea: string,
  admissionFixation: PostOpFixationType,
  admissionFixationDescription: string,
  edema: string,
  nounGender: NounGender = 'masculine'
): string {
  const sg = sideGen(side, nounGender);
  const lg = limbGen(limbType);
  const area = localisArea || 'плечевого сустава';
  const fixLine = buildAdmissionFixLine(side, limbType, admissionFixation, admissionFixationDescription);

  if (fixLine) {
    return `${fixLine} Отёк ${sg} ${area} ${edema}. Ишемических и периферических неврологических расстройств в ${sg} ${lg} нет.`;
  }
  return `Ось ${sg} ${lg} визуально не нарушена. Отёк ${sg} ${area} ${edema}. Ишемических и периферических неврологических расстройств в ${sg} ${lg} нет.`;
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
  isFirstPostOp: boolean,
  nounGender: NounGender = 'masculine'
): string {
  const sn = sideNom(side, limbType);
  const sg = sideGen(side, nounGender);
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
    case 'cast': {
      const castDesc = fixationDescription?.trim()
        ? toPrep(fixationDescription.trim())
        : 'гипсовой повязке';
      fixLine = `${sn} ${ln} в ${castDesc}.`;
      fixStatus = isFirstPostOp ? ` Повязка в порядке.` : '';
      break;
    }
    case 'other':
      fixLine = fixationDescription
        ? `${sn} ${ln} в ${toPrep(fixationDescription)}.`
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

  const prefix = fixLine ? `${fixLine}${fixStatus} ` : '';
  return (
    `${prefix}Отёк ${sg} ${area} ${edema}. ` +
    `${woundLine} Периферических ишемических и неврологических нарушений в ${sg} ${lg} не выявлено.`
  );
}

// ─── Жалобы ───────────────────────────────────────────────────────────────────

function buildComplaints(
  isAdmission: boolean,
  isFirstPostOp: boolean,
  isPostOp: boolean,
  side: Side,
  localisArea: string,
  index: number,
  postOpPos: number,    // порядковый номер среди послеоп. дневников (0 = первые сутки)
  nounGender: NounGender = 'masculine'
): string {
  const area = localisArea || 'повреждения';
  const sg = sideGen(side, nounGender);
  if (isAdmission) {
    return `на умеренные боли в области ${sg} ${area}.`;
  }
  if (isFirstPostOp) {
    // Первые сутки после операции — умеренные боли
    return `на умеренные боли в области ${sg} ${area}.`;
  }
  if (!isPostOp) {
    // Дневники до операции — не упоминаем операцию
    const opts = [
      'активно жалоб не предъявляет.',
      `на периодические боли в области ${sg} ${area}.`,
      `на умеренные боли в области ${sg} ${area}.`,
    ];
    return opts[index % opts.length];
  }
  // Послеоперационные дневники: градация умеренные → периодические → нет жалоб
  if (postOpPos === 1) {
    return 'жалобы на периодические боли в области оперативного вмешательства.';
  }
  return 'активно жалоб не предъявляет.';
}

// ─── Описание отёка ──────────────────────────────────────────────────────────

function buildEdema(isAdmission: boolean, isFirstPostOp: boolean, index: number): string {
  if (isAdmission) {
    return index % 2 === 0 ? 'умеренный' : 'умеренный, не нарос';
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
  return `${lastName}\n${dateStr}  ${time}  ${title}`;
}

// ─── Основная генерация дневника ──────────────────────────────────────────────

function generateDiaryContent(
  entry: DiaryDateEntry,
  index: number,
  isFirstPostOp: boolean,
  postOpPos: number,
  formData: FormData,
  vitals: VitalTexts
): string {
  const { patient, diagnosis, immobilization, doctors } = formData;
  const { side, limbType, mainDiagnosis, comorbidities } = diagnosis;
  const localisArea = diagnosis.localisArea || diagnosis.anatomicalArea || 'плечевого сустава';
  const nounGender = diagnosis.nounGender || 'masculine';
  const time = entry.time || patient.examinationTime || '10:00';
  const dateStr = formatDateShort(entry.date);
  const lastName = patient.lastName;

  const operationDate = parseISO(patient.operationDate);
  const isAdmission = entry.isAdmission;
  const isPostOp = isAfter(entry.date, operationDate);

  // Fix 2: Правильные названия дневников
  let diaryTitle: string;
  if (entry.type === 'withHead') {
    diaryTitle = isAdmission
      ? 'Первичный осмотр совместно с зав. отделением'
      : 'Обход с зав. отделением';
  } else if (isFirstPostOp) {
    diaryTitle = 'первые сутки после операции';
  } else {
    diaryTitle = 'дневник';
  }

  const header = buildDiaryHeader(dateStr, time, diaryTitle, lastName);
  const complaints = buildComplaints(isAdmission, isFirstPostOp, isPostOp, side, localisArea, index, postOpPos, nounGender);
  // Fix 3: Единый короткий format praesens для всех дневников
  const praesensText = buildStatusPraesensRegular(vitals, patient.gender);
  const edema = buildEdema(isAdmission, isFirstPostOp, index);

  const localis = isPostOp
    ? buildLocalisPostOp(side, limbType, localisArea, immobilization.postOpFixation, immobilization.fixationDescription, edema, isFirstPostOp, nounGender)
    : buildLocalisPreOp(side, limbType, localisArea, immobilization.admissionFixation, immobilization.admissionFixationDescription, edema, nounGender);

  const includeHead = entry.type === 'withHead';
  const signatures = buildSignatures(doctors.residentName, doctors.attendingName, doctors.headName, includeHead);

  // Fix 6: Единая структура — Жалобы → praesens → localis → Лечение → [ЛФК] → [Диагноз] → ...
  const praesensLabel = isPostOp ? 'Status praesens' : 'St.praesens';
  const parts: string[] = [header];
  parts.push(`\nЖалобы: ${complaints}`);
  parts.push(`\n${praesensLabel}: ${praesensText}`);
  parts.push(`\nStatus localis: ${localis}`);

  // Fix 5: "Лечение получает" для всех дневников
  if (isPostOp) {
    parts.push(`\nЛечение по листу назначений получает.\nЛФК с методистом.`);
  } else {
    parts.push(`\nЛечение по листу назначений получает.`);
  }

  // Диагноз и рекомендации только для дневников с заведующим
  if (entry.type === 'withHead') {
    parts.push(`\nДиагноз: ${mainDiagnosis}`);
    if (!isAdmission && comorbidities?.trim()) {
      parts.push(`\nСопутствующие заболевания: ${comorbidities.trim()}`);
    }
    const rec = isAdmission
      ? 'обследование для решения тактики лечения.'
      : entry.isDischarge
      ? 'выписка.'
      : 'дальнейшее наблюдение.';
    parts.push(`\nРекомендовано: ${rec}`);
    parts.push(`\nЗамечания: нет.`);
  }

  // Fix 7: Правильный текст выписки
  if (entry.isDischarge) {
    parts.push(`\n\nВ дальнейшем лечении в травматологическом отделении не нуждается. Выписывается в удовлетворительном состоянии под наблюдение травматолога по месту жительства.`);
  }

  parts.push(`\n${signatures}`);

  return parts.join('\n');
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
    `кожные покровы физиологической окраски. Дыхание везикулярное, проводится во всех отделах. Хрипов нет. ЧДД 16 в мин. ` +
    `Живот мягкий, безболезненный. Перитониальные симптомы отрицательные. Физиологические отправления в порядке. Температура 36,4.`;

  // Status localis эпикриза
  const nounGender = diagnosis.nounGender || 'masculine';
  const sg = sideGen(diagnosis.side, nounGender);
  const area = diagnosis.localisArea || diagnosis.anatomicalArea || 'плечевого сустава';
  const lg = limbGen(diagnosis.limbType);
  const admFixLine = buildAdmissionFixLine(
    diagnosis.side, diagnosis.limbType,
    immobilization.admissionFixation, immobilization.admissionFixationDescription
  );
  let localisEpicr: string;
  if (admFixLine) {
    localisEpicr =
      `${admFixLine} ` +
      `Отёк ${sg} ${area} умеренный, не нарос. ` +
      `Периферических ишемических и неврологических нарушений в ${sg} ${lg} не выявлено.`;
  } else {
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
    `                              Заведующим отделением: ${surnameInstrumental(doctors.headName)}______________________`,
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
    patient.dischargeDate,
    patient.admissionTime
  );

  const vitalSignsArr = generateUniqueVitalSigns(dateEntries.length);
  const operationDate = parseISO(patient.operationDate);

  const firstPostOpIndex = dateEntries.findIndex((e) => e.isPostOp);

  let postOpCounter = 0;
  const diaries: DiaryEntry[] = dateEntries.map((entry, index) => {
    const isFirstPostOp = entry.isPostOp && index === firstPostOpIndex;
    const isPostOp = isAfter(entry.date, operationDate);
    const postOpPos = isPostOp ? postOpCounter++ : -1;
    const vitals = vitalSignsArr[index];

    const content = generateDiaryContent(
      entry, index, isFirstPostOp, postOpPos, formData, vitals
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
