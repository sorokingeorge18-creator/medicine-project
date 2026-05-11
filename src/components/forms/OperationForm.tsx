import React from 'react';
import { OperationData } from '../../types';

interface Props {
  data: OperationData;
  onChange: (data: OperationData) => void;
}

const ANESTHESIA_OPTIONS = [
  'Спинномозговая анестезия',
  'Эндотрахеальный наркоз',
  'Проводниковая анестезия',
  'Внутривенная анестезия',
  'Местная анестезия',
];

export const OperationForm: React.FC<Props> = ({ data, onChange }) => {
  const update = <K extends keyof OperationData>(field: K, value: OperationData[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
        Операция
      </h2>

      {/* Название операции */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Название операции <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.operationName}
          onChange={(e) => update('operationName', e.target.value)}
          placeholder="Например: ЗИМО плечевой кости, интрамедуллярный остеосинтез"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {/* Объём операции */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Объём оперативного лечения <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.operationVolume}
          onChange={(e) => update('operationVolume', e.target.value)}
          rows={3}
          placeholder="Например: ЗИМО левого плеча, ВПА. Интрамедуллярный остеосинтез гвоздём с блокированием."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
        />
      </div>

      {/* Вид анестезии */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Вид анестезии <span className="text-red-500">*</span>
        </label>

        {/* Быстрый выбор */}
        <div className="flex flex-wrap gap-2 mb-2">
          {ANESTHESIA_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => update('anesthesia', opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                data.anesthesia === opt
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={data.anesthesia}
          onChange={(e) => update('anesthesia', e.target.value)}
          placeholder="Или введите вручную..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
        <span className="font-medium">Подсказка:</span> Название и объём операции будут включены
        в предоперационный эпикриз в раздел «План лечения».
      </div>
    </div>
  );
};
