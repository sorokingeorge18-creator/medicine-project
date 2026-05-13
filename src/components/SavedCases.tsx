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

export const SavedCases: React.FC<Props> = ({ cases, onLoad, onDelete, onSave, currentData }) => {
  const [saveName, setSaveName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const defaultName = [
    currentData.patient.lastName,
    currentData.patient.firstName,
    currentData.patient.admissionDate ? formatDateShort(parseISO(currentData.patient.admissionDate)) : '',
  ].filter(Boolean).join(' — ');

  const handleSave = () => {
    const name = saveName.trim() || defaultName || 'Безымянный случай';
    onSave(name);
    setSaveName('');
    setShowSaveForm(false);
  };

  return (
    <div className="space-y-3">
      {/* Кнопка / форма сохранения */}
      {!showSaveForm ? (
        <button
          onClick={() => setShowSaveForm(true)}
          className="w-full btn btn-sm btn-ghost text-xs justify-center py-2"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 2v8M5 7l3 3 3-3M3 13h10" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Сохранить случай
        </button>
      ) : (
        <div className="border border-line rounded-lg p-3 bg-canvas space-y-2.5 animate-fade-up">
          <label className="field-label">Название случая</label>
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder={defaultName || 'Введите название...'}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="field-input text-xs py-2"
            autoFocus
          />
          <div className="flex gap-1.5">
            <button onClick={handleSave} className="flex-1 btn btn-sm text-xs btn-dark py-1.5">
              Сохранить
            </button>
            <button
              onClick={() => { setShowSaveForm(false); setSaveName(''); }}
              className="btn btn-sm btn-ghost text-xs py-1.5"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список */}
      {cases.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-9 h-9 rounded-lg bg-line-subtle flex items-center justify-center mx-auto mb-2.5">
            <svg className="w-4.5 h-4.5 text-ink-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 14H3a1 1 0 01-1-1V5a1 1 0 011-1h2.5L7 5.5h4a1 1 0 011 1V8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 14h9a1 1 0 001-1v-4a1 1 0 00-1-1H8a1 1 0 00-1 1v4a1 1 0 01-1 1z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="text-xs text-ink-3">Сохранённых случаев нет</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="field-label">{cases.length} сохранено</p>
          {cases.map((c) => {
            const savedStr = formatDateShort(new Date(c.savedAt));
            return (
              <div
                key={c.id}
                className="flex items-center gap-2 p-2.5 border border-line rounded-lg bg-surface hover:border-line-strong transition-colors duration-150"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink truncate">{c.name}</p>
                  <p className="text-[11px] text-ink-4 mt-0.5">{savedStr}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => onLoad(c)}
                    className="btn btn-sm text-[11px] btn-brand-soft px-2 py-1"
                  >
                    Открыть
                  </button>
                  <button
                    onClick={() => { if (confirm(`Удалить случай "${c.name}"?`)) onDelete(c.id); }}
                    className="btn btn-sm btn-negative-soft px-2 py-1 text-[11px]"
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
