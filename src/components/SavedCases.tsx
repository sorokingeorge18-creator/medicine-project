import React, { useState } from 'react';
import { SavedCase, FormData } from '../types';
import { formatDateShort } from '../logic/dateCalculations';
import { parseISO } from 'date-fns';

interface Props {
  cases: SavedCase[];
  onLoad: (c: SavedCase) => void;
  onDelete: (id: string) => void;
  onSave: (name: string) => void;
  currentData: FormData;
}

export const SavedCases: React.FC<Props> = ({
  cases,
  onLoad,
  onDelete,
  onSave,
  currentData,
}) => {
  const [saveName, setSaveName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  // Генерируем имя по умолчанию из данных пациента
  const defaultName = [
    currentData.patient.lastName,
    currentData.patient.firstName,
    currentData.patient.admissionDate
      ? formatDateShort(parseISO(currentData.patient.admissionDate))
      : '',
  ]
    .filter(Boolean)
    .join(' — ');

  const handleSave = () => {
    const name = saveName.trim() || defaultName || 'Безымянный случай';
    onSave(name);
    setSaveName('');
    setShowSaveForm(false);
  };

  return (
    <div className="space-y-3">
      {/* Кнопка сохранения */}
      {!showSaveForm ? (
        <button
          onClick={() => setShowSaveForm(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Сохранить текущий случай
        </button>
      ) : (
        <div className="border border-green-200 rounded-lg p-3 bg-green-50 space-y-2">
          <label className="text-xs font-medium text-gray-700">
            Название случая
          </label>
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder={defaultName || 'Введите название...'}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
            >
              Сохранить
            </button>
            <button
              onClick={() => { setShowSaveForm(false); setSaveName(''); }}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список сохранённых случаев */}
      {cases.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <svg className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">Сохранённых случаев нет</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            Сохранено случаев: <span className="font-semibold">{cases.length}</span>
          </p>
          {cases.map((c) => {
            const savedDate = new Date(c.savedAt);
            const savedStr = formatDateShort(savedDate);
            return (
              <div
                key={c.id}
                className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Сохранён: {savedStr}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => onLoad(c)}
                    className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition"
                  >
                    Загрузить
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Удалить случай "${c.name}"?`)) onDelete(c.id);
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
