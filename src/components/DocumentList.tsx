import React from 'react';
import { DiaryEntry } from '../types';
import { formatDateShort } from '../logic/dateCalculations';
import { parseISO } from 'date-fns';

interface Props {
  diaries: DiaryEntry[];
  preopEpicrisis: DiaryEntry | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function getTypeColor(type: DiaryEntry['type']): string {
  switch (type) {
    case 'withHead':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'regular':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'preop':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function getTypeLabel(entry: DiaryEntry): string {
  if (entry.type === 'preop') return 'Эпикриз';
  if (entry.type === 'withHead') return 'С зав.';
  if (entry.isPostOp) return 'После оп.';
  return 'Дневник';
}

function getTypeLabelFull(entry: DiaryEntry): string {
  if (entry.type === 'preop') return 'Предоперационный эпикриз';
  if (entry.type === 'withHead') return 'С заведующим';
  if (entry.isPostOp) return 'Послеоперационный';
  return 'Обычный дневник';
}

export const DocumentList: React.FC<Props> = ({
  diaries,
  preopEpicrisis,
  selectedId,
  onSelect,
}) => {
  // Сортируем: сначала эпикриз, потом дневники по дате
  const allDocs: DiaryEntry[] = [];
  if (preopEpicrisis) allDocs.push(preopEpicrisis);
  allDocs.push(...diaries);

  if (allDocs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <svg className="w-12 h-12 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">Документы ещё не сгенерированы</p>
        <p className="text-xs mt-1">Заполните форму и нажмите «Сгенерировать»</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-xs text-gray-500 px-1 mb-2">
        Итого документов: <span className="font-semibold text-gray-700">{allDocs.length}</span>
        {' '}({diaries.length} дневников + {preopEpicrisis ? '1 эпикриз' : '0 эпикризов'})
      </div>

      {allDocs.map((doc) => {
        const dateStr = formatDateShort(parseISO(doc.date));
        const isSelected = doc.id === selectedId;
        const typeColor = getTypeColor(doc.type);
        const typeLabel = getTypeLabel(doc);
        const typeLabelFull = getTypeLabelFull(doc);

        return (
          <button
            key={doc.id}
            onClick={() => onSelect(doc.id)}
            className={`w-full text-left px-3 py-3 rounded-lg border transition-all ${
              isSelected
                ? 'border-blue-400 bg-blue-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium border ${typeColor}`}
              >
                {typeLabel}
              </span>
              <span className="text-sm font-semibold text-gray-800">{dateStr}</span>
              {doc.isEdited && (
                <span className="ml-auto text-xs text-orange-500 font-medium">✎ изм.</span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1 truncate">{typeLabelFull}</div>
          </button>
        );
      })}
    </div>
  );
};
