import React from 'react';
import { ImmobilizationData, PostOpFixationType } from '../../types';

interface Props {
  data: ImmobilizationData;
  onChange: (data: ImmobilizationData) => void;
}

const FIXATION_OPTIONS: { value: PostOpFixationType; label: string; icon: string }[] = [
  { value: 'none', label: 'Нет фиксации', icon: '✕' },
  { value: 'cast', label: 'Гипсовая повязка', icon: '🩹' },
  { value: 'sling', label: 'Косыночная повязка', icon: '🔺' },
  { value: 'deso', label: 'Повязка Дезо', icon: '⬡' },
  { value: 'other', label: 'Другое', icon: '…' },
];

export const ImmobilizationForm: React.FC<Props> = ({ data, onChange }) => {
  const update = <K extends keyof ImmobilizationData>(field: K, value: ImmobilizationData[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
        Иммобилизация и фиксация
      </h2>

      {/* Гипс при поступлении */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">
            Гипсовая иммобилизация при поступлении
          </span>
          <div
            onClick={() => update('castOnAdmission', !data.castOnAdmission)}
            className={`w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 flex items-center ${
              data.castOnAdmission ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                data.castOnAdmission ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </div>
          <span
            className={`text-sm font-medium ${
              data.castOnAdmission ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            {data.castOnAdmission ? 'Да' : 'Нет'}
          </span>
        </div>

        {data.castOnAdmission && (
          <div className="flex flex-col gap-1 pl-4 border-l-2 border-blue-200">
            <label className="text-sm font-medium text-gray-700">
              Описание гипсовой повязки
            </label>
            <input
              type="text"
              value={data.castDescription}
              onChange={(e) => update('castDescription', e.target.value)}
              placeholder="Например: Левая верхняя конечность в гипсовой повязке, гипс стабилен."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        )}
      </div>

      {/* Послеоперационная фиксация */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        <span className="text-sm font-semibold text-gray-700">
          Послеоперационная фиксация
        </span>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {FIXATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update('postOpFixation', opt.value)}
              className={`flex items-center gap-2 p-3 rounded-lg border text-left transition ${
                data.postOpFixation === opt.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-base">{opt.icon}</span>
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          ))}
        </div>

        {data.postOpFixation !== 'none' && (
          <div className="flex flex-col gap-1 pl-4 border-l-2 border-blue-200">
            <label className="text-sm font-medium text-gray-700">
              Описание фиксации{' '}
              {data.postOpFixation === 'other' && (
                <span className="text-red-500">*</span>
              )}
            </label>
            <input
              type="text"
              value={data.fixationDescription}
              onChange={(e) => update('fixationDescription', e.target.value)}
              placeholder={
                data.postOpFixation === 'other'
                  ? 'Опишите тип фиксации...'
                  : 'Дополнительное описание (необязательно)'
              }
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        )}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
        <span className="font-medium">Как используется:</span> Тип иммобилизации автоматически
        подставляется в status localis каждого дневника. До операции — гипс при поступлении,
        после операции — послеоперационная фиксация.
      </div>
    </div>
  );
};
