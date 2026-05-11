import React from 'react';
import { ExaminationData } from '../../types';

interface Props {
  data: ExaminationData;
  onChange: (data: ExaminationData) => void;
}

export const ExaminationForm: React.FC<Props> = ({ data, onChange }) => {
  const update = <K extends keyof ExaminationData>(field: K, value: ExaminationData[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
        Обследования
      </h2>

      {/* Рентгенография */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Описание рентгенографии <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.xrayDescription}
          onChange={(e) => update('xrayDescription', e.target.value)}
          rows={3}
          placeholder="Например: Перелом хирургической шейки плечевой кости слева со смещением отломков."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
        />
      </div>

      {/* КТ */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => update('ctPerformed', !data.ctPerformed)}
              className={`w-12 h-6 rounded-full transition-colors duration-200 flex items-center ${
                data.ctPerformed ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                  data.ctPerformed ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">
              Выполнялась компьютерная томография (КТ)
            </span>
          </label>
        </div>

        {data.ctPerformed && (
          <div className="flex flex-col gap-1 pl-4 border-l-2 border-blue-200">
            <label className="text-sm font-medium text-gray-700">
              Описание КТ <span className="text-red-500">*</span>
            </label>
            <textarea
              value={data.ctDescription}
              onChange={(e) => update('ctDescription', e.target.value)}
              rows={3}
              placeholder="Например: Многооскольчатый перелом головки плечевой кости без дополнительных повреждений."
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
            />
          </div>
        )}
      </div>

      {/* Подсказка */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
        <span className="font-medium">Примечание:</span> Результаты обследований будут включены
        в предоперационный эпикриз. КТ будет упомянута только если выбрана опция выше.
      </div>
    </div>
  );
};
