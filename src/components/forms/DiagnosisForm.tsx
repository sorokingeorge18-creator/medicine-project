import React from 'react';
import { DiagnosisData, Side, InjuryCause, LimbType } from '../../types';

interface Props {
  data: DiagnosisData;
  onChange: (data: DiagnosisData) => void;
}

const INJURY_CAUSES: { value: InjuryCause; label: string }[] = [
  { value: 'household', label: 'Бытовая' },
  { value: 'road', label: 'Дорожная (ДТП)' },
  { value: 'sport', label: 'Спортивная' },
  { value: 'criminal', label: 'Криминальная' },
  { value: 'industrial', label: 'Производственная' },
  { value: 'other', label: 'Другая' },
];

export const DiagnosisForm: React.FC<Props> = ({ data, onChange }) => {
  const update = <K extends keyof DiagnosisData>(field: K, value: DiagnosisData[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
        Диагноз
      </h2>

      {/* Основной диагноз */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Основной диагноз <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.mainDiagnosis}
          onChange={(e) => update('mainDiagnosis', e.target.value)}
          rows={2}
          placeholder="Например: перелом проксимального эпиметафиза левой плечевой кости"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
        />
      </div>

      {/* Анатомическая область + Локальная область */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Анатомическая область <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.anatomicalArea}
            onChange={(e) => update('anatomicalArea', e.target.value)}
            placeholder="плечевая кость, бедро, голень..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Область для status localis{' '}
            <span className="text-gray-400 font-normal">(родительный падеж)</span>
          </label>
          <input
            type="text"
            value={data.localisArea}
            onChange={(e) => update('localisArea', e.target.value)}
            placeholder="плечевого сустава, бедра, голени..."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          <p className="text-xs text-gray-400">
            Используется в фразах: «в области левого <em>плечевого сустава</em>»
          </p>
        </div>
      </div>

      {/* Сторона + Тип конечности */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Сторона поражения <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3 mt-1">
            {(['right', 'left'] as Side[]).map((side) => (
              <label
                key={side}
                className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border flex-1 justify-center transition ${
                  data.side === side
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="side"
                  value={side}
                  checked={data.side === side}
                  onChange={() => update('side', side)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium">
                  {side === 'right' ? 'Справа' : 'Слева'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Тип конечности <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3 mt-1">
            {([['upper', 'Верхняя'], ['lower', 'Нижняя']] as [LimbType, string][]).map(([val, label]) => (
              <label
                key={val}
                className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border flex-1 justify-center transition ${
                  data.limbType === val
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="limbType"
                  value={val}
                  checked={data.limbType === val}
                  onChange={() => update('limbType', val)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Причина */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Внешняя причина травмы <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
          {INJURY_CAUSES.map((cause) => (
            <label
              key={cause.value}
              className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition ${
                data.injuryCause === cause.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="injuryCause"
                value={cause.value}
                checked={data.injuryCause === cause.value}
                onChange={() => update('injuryCause', cause.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">{cause.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Сопутствующие */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Сопутствующие заболевания
        </label>
        <textarea
          value={data.comorbidities}
          onChange={(e) => update('comorbidities', e.target.value)}
          rows={3}
          placeholder="Гипертоническая болезнь II ст, АГ контролируемая, риск 3. ХСН 0."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
        />
        <p className="text-xs text-gray-400">Если нет — оставьте пустым</p>
      </div>
    </div>
  );
};
