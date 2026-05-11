import React from 'react';
import { DoctorsData } from '../../types';

interface Props {
  data: DoctorsData;
  onChange: (data: DoctorsData) => void;
}

export const DoctorsForm: React.FC<Props> = ({ data, onChange }) => {
  const update = (field: keyof DoctorsData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
        Врачи
      </h2>
      <p className="text-sm text-gray-500">
        ФИО врачей подставляются в подписи документов и в заголовки дневников с заведующим.
      </p>

      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Клинический ординатор
          </label>
          <input
            type="text"
            value={data.residentName}
            onChange={(e) => update('residentName', e.target.value)}
            placeholder="Марков А.Г."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Лечащий врач <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.attendingName}
            onChange={(e) => update('attendingName', e.target.value)}
            placeholder="Ятлук А.А."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Заведующий отделением <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.headName}
            onChange={(e) => update('headName', e.target.value)}
            placeholder="Привалов Д.А."
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
        <p className="font-medium mb-1">Как используются:</p>
        <ul className="space-y-1 text-xs text-gray-500">
          <li>• Заголовок дневника: «Первичный осмотр совместно с заведующим отделением <strong>{data.headName || 'Привалов Д.А.'}</strong>»</li>
          <li>• Подпись: «Клин. ординатор _____ <strong>{data.residentName || 'Марков А.Г.'}</strong>»</li>
          <li>• Подпись: «Врач _____ <strong>{data.attendingName || 'Ятлук А.А.'}</strong>»</li>
        </ul>
      </div>
    </div>
  );
};
