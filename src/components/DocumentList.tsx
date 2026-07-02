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

function getTypeLabel(entry: DiaryEntry): string {
  if (entry.type === 'preop') return 'Эпикриз';
  if (entry.type === 'withHead') return 'С заведующим';
  if (entry.isPostOp) return 'После операции';
  return 'Дневник';
}

function getTypeAccent(entry: DiaryEntry): string {
  if (entry.type === 'preop') return 'text-caution';
  if (entry.type === 'withHead') return 'text-brand';
  if (entry.isPostOp) return 'text-positive';
  return 'text-ink-3';
}

export const DocumentList: React.FC<Props> = ({ diaries, preopEpicrisis, selectedId, onSelect }) => {
  const allDocs: DiaryEntry[] = [];
  if (preopEpicrisis) allDocs.push(preopEpicrisis);
  allDocs.push(...diaries);

  if (allDocs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-10 h-10 rounded-xl bg-line-subtle flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-ink-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3.5A1.5 1.5 0 014.5 2h4.69L12 5v7.5A1.5 1.5 0 0110.5 14h-6A1.5 1.5 0 013 12.5v-9z"/>
            <path d="M9 2v3.5H12M5.5 8h5M5.5 10.5h3.5" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-ink-2">Нет документов</p>
        <p className="text-xs text-ink-3 mt-1 leading-relaxed">Заполните форму<br/>и нажмите «Сгенерировать»</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <p className="text-[11px] text-ink-4 mb-3">
        {allDocs.length} {allDocs.length === 1 ? 'документ' : allDocs.length < 5 ? 'документа' : 'документов'}
      </p>

      {allDocs.map((doc, index) => {
        const dateStr = formatDateShort(parseISO(doc.date));
        const isSelected = doc.id === selectedId;
        const typeLabel = getTypeLabel(doc);
        const typeAccent = getTypeAccent(doc);

        return (
          <button
            key={doc.id}
            onClick={() => onSelect(doc.id)}
            style={{ animationDelay: `${index * 45}ms` }}
            className={`
              animate-card-in relative w-full text-left rounded-lg border transition-all duration-150 overflow-hidden
              hover:-translate-y-px
              ${isSelected
                ? 'bg-brand-light border-brand/25'
                : 'bg-surface border-line hover:border-line-strong hover:bg-canvas'
              }
            `}
          >
            {isSelected && (
              <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand rounded-r-sm" />
            )}
            <div className="px-3 py-2.5 pl-4">
              <div className="flex items-center justify-between gap-1.5">
                <span className={`text-sm font-semibold ${isSelected ? 'text-brand' : 'text-ink'}`}>
                  {dateStr}
                </span>
                {doc.isEdited && (
                  <span className="w-1.5 h-1.5 rounded-full bg-caution shrink-0" title="Отредактирован вручную" />
                )}
              </div>
              <span className={`text-[11px] font-medium mt-0.5 block ${isSelected ? 'text-brand/70' : typeAccent}`}>
                {typeLabel}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
