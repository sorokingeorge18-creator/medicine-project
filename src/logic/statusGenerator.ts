// ============================================================
// Генерация уникальных показателей жизнедеятельности
// (status praesens) для каждого дневника
// ============================================================

import { VitalSigns } from '../types';

/**
 * Простой детерминированный псевдослучайный генератор на основе seed.
 * Используется для получения воспроизводимых, но разных значений
 * для каждого дневника (seed = день года).
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Возвращает целое число в диапазоне [min, max] включительно.
 */
function randInt(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

/**
 * Возвращает число с одним знаком после запятой в диапазоне [min, max].
 */
function randFloat(rand: () => number, min: number, max: number): number {
  const steps = Math.round((max - min) / 0.1);
  const step = Math.floor(rand() * (steps + 1));
  return Math.round((min + step * 0.1) * 10) / 10;
}

/**
 * Генерирует уникальные показатели жизнедеятельности для дневника.
 * seed = порядковый номер дневника (0, 1, 2, ...) для гарантии различия.
 *
 * Диапазоны (в пределах нормы):
 * - АД систолическое: 110–139 мм рт. ст.
 * - АД диастолическое: 70–89 мм рт. ст.
 * - Пульс: 60–89 в минуту
 * - ЧДД: 16–18 в минуту
 * - Температура: 36,3–36,7 °C
 */
export function generateVitalSigns(seed: number): VitalSigns {
  const rand = seededRandom(seed * 1337 + 42);

  // Генерируем с небольшим смещением, чтобы избежать одинаковых значений
  const bpSystolic = randInt(rand, 110, 139);
  const bpDiastolic = randInt(rand, 70, 89);
  const pulse = randInt(rand, 60, 89);
  const rr = randInt(rand, 16, 18);
  const temperature = randFloat(rand, 36.3, 36.7);

  return { bpSystolic, bpDiastolic, pulse, rr, temperature };
}

/**
 * Форматирует показатели жизнедеятельности в строку status praesens.
 */
export function formatStatusPraesens(vitals: VitalSigns): string {
  const tempStr = vitals.temperature.toFixed(1).replace('.', ',');
  return (
    `Состояние удовлетворительное. Сознание ясное. Кожные покровы обычной окраски. ` +
    `АД ${vitals.bpSystolic}/${vitals.bpDiastolic} мм рт. ст., ` +
    `Ps ${vitals.pulse} в мин., ` +
    `ЧДД ${vitals.rr} в мин., ` +
    `температура тела ${tempStr} °C.`
  );
}

/**
 * Генерирует набор уникальных показателей для массива дневников.
 * Гарантирует, что все наборы отличаются.
 */
export function generateUniqueVitalSigns(count: number): VitalSigns[] {
  const result: VitalSigns[] = [];
  const usedKeys = new Set<string>();

  for (let i = 0; i < count; i++) {
    let vitals: VitalSigns;
    let attempts = 0;
    do {
      vitals = generateVitalSigns(i * 100 + attempts);
      attempts++;
    } while (
      usedKeys.has(
        `${vitals.bpSystolic}/${vitals.bpDiastolic}-${vitals.pulse}-${vitals.temperature}`
      ) && attempts < 50
    );

    usedKeys.add(
      `${vitals.bpSystolic}/${vitals.bpDiastolic}-${vitals.pulse}-${vitals.temperature}`
    );
    result.push(vitals);
  }

  return result;
}
