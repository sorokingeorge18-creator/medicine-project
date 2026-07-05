import { describe, test, expect } from 'vitest';
import { toPrep, surnameInstrumental, generateAllDocuments } from './documentGenerator';
import { FormData } from '../types';

describe('toPrep — именительный → предложный падеж («в …»)', () => {
  test.each([
    ['задняя гипсовая лонгета', 'задней гипсовой лонгете'],
    ['циркулярная гипсовая повязка', 'циркулярной гипсовой повязке'],
    ['U-образная гипсовая лонгета', 'U-образной гипсовой лонгете'],
    ['гипсовый сапожок', 'гипсовом сапожке'],
    ['ортез', 'ортезе'],
    ['косыночная повязка', 'косыночной повязке'],
  ])('%s → %s', (input, expected) => {
    expect(toPrep(input)).toBe(expected);
  });
});

describe('surnameInstrumental — фамилия в творительном падеже', () => {
  test.each([
    ['Привалов Д.А.', 'Приваловым Д.А.'],
    ['Ятлук А.А.', 'Ятлуком А.А.'],
    ['Пушкин И.И.', 'Пушкиным И.И.'],
    ['Толстой Л.Н.', 'Толстым Л.Н.'],
    ['Достоевский Ф.М.', 'Достоевским Ф.М.'],
    ['Иванова И.И.', 'Ивановой И.И.'],
    ['Крупская Н.К.', 'Крупской Н.К.'],
    ['Черных Д.А.', 'Черных Д.А.'],   // несклоняемая
    ['Гоголь Н.В.', 'Гоголем Н.В.'],
  ])('%s → %s', (input, expected) => {
    expect(surnameInstrumental(input)).toBe(expected);
  });
});

describe('generateAllDocuments — интеграция', () => {
  const formData: FormData = {
    patient: {
      lastName: 'Иванова', firstName: 'Мария', middleName: 'Петровна',
      birthDate: '1965-03-12',
      admissionDate: '2026-06-01', admissionTime: '19:00',
      operationDate: '2026-06-04', dischargeDate: '2026-06-11',
      gender: 'female', examinationTime: '10:00',
    },
    diagnosis: {
      mainDiagnosis: 'Перелом проксимального эпиметафиза левой плечевой кости',
      anatomicalArea: 'плечевого сустава', localisArea: '',
      limbType: 'upper', side: 'left', injuryCause: 'household',
      comorbidities: '', nounGender: 'masculine',
    },
    examination: { xrayDescription: 'Перелом со смещением отломков.', ctPerformed: false, ctDescription: '' },
    operation: { operationName: '', operationVolume: 'Интрамедуллярный остеосинтез.', anesthesia: '' },
    immobilization: {
      admissionFixation: 'cast', admissionFixationDescription: 'задняя гипсовая лонгета',
      postOpFixation: 'sling', fixationDescription: '',
    },
    doctors: { residentName: 'Марков А.Г.', attendingName: 'Ятлук А.А.', headName: 'Привалов Д.А.' },
  };

  const result = generateAllDocuments(formData);

  test('генерирует 6 дневников и эпикриз для базового сценария', () => {
    expect(result.diaries).toHaveLength(6);
    expect(result.preopEpicrisis).not.toBeNull();
  });

  test('эпикриз содержит заголовок, ФИО и склонённую фамилию заведующего', () => {
    const content = result.preopEpicrisis!.content;
    expect(content).toContain('ПРЕДОПЕРАЦИОННЫЙ ЭПИКРИЗ');
    expect(content).toContain('Иванова Мария Петровна');
    expect(content).toContain('Приваловым Д.А.');
  });

  test('дооперационный дневник содержит фиксацию в предложном падеже', () => {
    const preOp = result.diaries[0];
    expect(preOp.content).toContain('в задней гипсовой лонгете');
  });

  test('каждый дневник содержит обязательные разделы', () => {
    for (const diary of result.diaries) {
      expect(diary.content).toContain('Жалобы:');
      expect(diary.content).toContain('Status localis:');
      expect(diary.content).toContain('Врач ______________ Ятлук А.А.');
    }
  });

  test('дневник выписки содержит выписной текст', () => {
    const last = result.diaries[result.diaries.length - 1];
    expect(last.content).toContain('Выписывается в удовлетворительном состоянии');
  });

  test('показатели жизнедеятельности различаются между дневниками', () => {
    const bpLines = result.diaries.map((diary) => diary.content.match(/АД \d+\/\d+/)?.[0]);
    expect(new Set(bpLines).size).toBeGreaterThan(1);
  });

  test('пустые даты → пустой результат без исключений', () => {
    const empty = generateAllDocuments({
      ...formData,
      patient: { ...formData.patient, admissionDate: '', operationDate: '', dischargeDate: '' },
    });
    expect(empty.diaries).toHaveLength(0);
    expect(empty.preopEpicrisis).toBeNull();
  });
});
