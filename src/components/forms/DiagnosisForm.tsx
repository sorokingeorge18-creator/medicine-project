import React from 'react';
import { DiagnosisData, Side, InjuryCause, LimbType, NounGender } from '../../types';

interface Props {
  data: DiagnosisData;
  onChange: (data: DiagnosisData) => void;
}

const INJURY_CAUSES: { value: InjuryCause; label: string }[] = [
  { value: 'household',   label: 'Бытовая' },
  { value: 'road',        label: 'Дорожная (ДТП)' },
  { value: 'sport',       label: 'Спортивная' },
  { value: 'criminal',    label: 'Криминальная' },
  { value: 'industrial',  label: 'Производственная' },
  { value: 'other',       label: 'Другая' },
];

const NOUN_GENDER_OPTIONS: { value: NounGender; label: string; example: string }[] = [
  { value: 'masculine', label: 'Мужской / средний', example: 'правого сустава, бедра' },
  { value: 'feminine',  label: 'Женский',            example: 'правой кости, голени' },
];

export const DiagnosisForm: React.FC<Props> = ({ data, onChange }) => {
  const update = <K extends keyof DiagnosisData>(field: K, value: DiagnosisData[K]) => {
    onChange({ ...data, [field]: value });
  };

  const sideExample = data.nounGender === 'feminine'
    ? (data.side === 'right' ? 'правой' : 'левой')
    : (data.side === 'right' ? 'правого' : 'левого');

  return (
    <div className="space-y-6">
      <h2 className="section-title">Диагноз</h2>

      {/* Основной диагноз */}
      <div>
        <label className="field-label">Основной диагноз <span className="text-negative">*</span></label>
        <textarea
          value={data.mainDiagnosis}
          onChange={(e) => update('mainDiagnosis', e.target.value)}
          rows={2}
          placeholder="Перелом проксимального эпиметафиза левой плечевой кости"
          className="field-textarea"
        />
      </div>

      {/* Анатомическая область + род */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="field-label">
            Область поражения <span className="text-negative">*</span>
            <span className="text-ink-4 normal-case tracking-normal font-normal ml-1">(родит. падеж)</span>
          </label>
          <input
            type="text"
            value={data.anatomicalArea}
            onChange={(e) => update('anatomicalArea', e.target.value)}
            placeholder="плечевого сустава, голени, бедра..."
            className="field-input"
          />
          {data.anatomicalArea && (
            <p className="field-hint">
              «отёк <em>{sideExample} {data.anatomicalArea}</em>»
            </p>
          )}
        </div>

        <div>
          <label className="field-label">Род существительного <span className="text-negative">*</span></label>
          <div className="flex flex-col gap-2 mt-0.5">
            {NOUN_GENDER_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`chip justify-start gap-2 ${data.nounGender === opt.value ? 'chip-on' : 'chip-off'}`}
              >
                <input
                  type="radio"
                  name="nounGender"
                  value={opt.value}
                  checked={data.nounGender === opt.value}
                  onChange={() => update('nounGender', opt.value)}
                  className="sr-only"
                />
                <span className="font-medium">{opt.label}</span>
                <span className="text-xs opacity-60">— {opt.example}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Сторона + Тип конечности */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="field-label">Сторона <span className="text-negative">*</span></label>
          <div className="flex gap-2 mt-0.5">
            {(['right', 'left'] as Side[]).map((side) => (
              <label key={side} className={`chip flex-1 ${data.side === side ? 'chip-on' : 'chip-off'}`}>
                <input type="radio" name="side" value={side} checked={data.side === side}
                  onChange={() => update('side', side)} className="sr-only" />
                {side === 'right' ? 'Справа' : 'Слева'}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label">Конечность <span className="text-negative">*</span></label>
          <div className="flex gap-2 mt-0.5">
            {([['upper', 'Верхняя'], ['lower', 'Нижняя']] as [LimbType, string][]).map(([val, label]) => (
              <label key={val} className={`chip flex-1 ${data.limbType === val ? 'chip-on' : 'chip-off'}`}>
                <input type="radio" name="limbType" value={val} checked={data.limbType === val}
                  onChange={() => update('limbType', val)} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Причина травмы */}
      <div>
        <label className="field-label">Внешняя причина травмы <span className="text-negative">*</span></label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-0.5">
          {INJURY_CAUSES.map((cause) => (
            <label key={cause.value} className={`chip ${data.injuryCause === cause.value ? 'chip-on' : 'chip-off'}`}>
              <input type="radio" name="injuryCause" value={cause.value}
                checked={data.injuryCause === cause.value}
                onChange={() => update('injuryCause', cause.value)} className="sr-only" />
              {cause.label}
            </label>
          ))}
        </div>
      </div>

      {/* Сопутствующие */}
      <div>
        <label className="field-label">Сопутствующие заболевания</label>
        <textarea
          value={data.comorbidities}
          onChange={(e) => update('comorbidities', e.target.value)}
          rows={3}
          placeholder="Гипертоническая болезнь II ст, АГ контролируемая, риск 3. ХСН 0."
          className="field-textarea"
        />
        <p className="field-hint">Если нет — оставьте пустым</p>
      </div>
    </div>
  );
};
