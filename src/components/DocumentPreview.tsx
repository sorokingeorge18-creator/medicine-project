import React, { useState, useEffect } from 'react';
import { DiaryEntry } from '../types';
import { formatDateShort } from '../logic/dateCalculations';
import { fixGrammarText } from '../logic/grammarApi';
import { parseISO } from 'date-fns';

interface Props {
  document: DiaryEntry | null;
  onUpdate: (id: string, content: string) => void;
}

export const DocumentPreview: React.FC<Props> = ({ document, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isFixing, setIsFixing] = useState(false);
  const [fixError, setFixError] = useState<string | null>(null);

  useEffect(() => {
    if (document) {
      setEditContent(document.content);
      setIsEditing(false);
    }
  }, [document?.id]);

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-canvas flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-ink-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-ink-2">Выберите документ</p>
        <p className="text-xs text-ink-3 mt-1">Нажмите на документ в списке справа</p>
      </div>
    );
  }

  const dateStr = formatDateShort(parseISO(document.date));

  const handleSave = () => { onUpdate(document.id, editContent); setIsEditing(false); };
  const handleCancel = () => { setEditContent(document.content); setIsEditing(false); };

  const handleFixGrammar = async () => {
    setFixError(null);
    setIsFixing(true);
    const source = isEditing ? editContent : document.content;
    try {
      const corrected = await fixGrammarText(source);
      if (isEditing) {
        setEditContent(corrected);
      } else {
        onUpdate(document.id, corrected);
      }
    } catch (err) {
      setFixError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Шапка */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-line bg-canvas/50">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink truncate">{document.title}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-ink-3">{dateStr}</span>
            {document.isEdited && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-caution">
                <span className="w-1 h-1 rounded-full bg-caution" />
                Изменён
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-4">
          <button
            onClick={handleFixGrammar}
            disabled={isFixing}
            className="btn btn-sm btn-ghost text-xs text-brand disabled:opacity-50"
            title="Исправить грамматику с помощью ИИ"
          >
            {isFixing ? (
              <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 8h2M12 8h2M8 2v2M8 12v2M4.1 4.1l1.4 1.4M10.5 10.5l1.4 1.4M4.1 11.9l1.4-1.4M10.5 5.5l1.4-1.4" strokeLinecap="round"/>
                <circle cx="8" cy="8" r="2.5"/>
              </svg>
            )}
            {isFixing ? 'Исправляю...' : 'Грамматика'}
          </button>

          {!isEditing ? (
            <button
              onClick={() => { setEditContent(document.content); setIsEditing(true); }}
              className="btn btn-sm btn-ghost text-xs"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M11.5 2.5a1.5 1.5 0 012.12 2.12L5 13.2l-3 .8.8-3L11.5 2.5z" strokeLinejoin="round"/>
              </svg>
              Редактировать
            </button>
          ) : (
            <>
              <button onClick={handleSave} className="btn btn-sm text-xs border border-positive/30 text-positive bg-positive-light hover:bg-positive/10">
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8l3.5 3.5L13 4.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Сохранить
              </button>
              <button onClick={handleCancel} className="btn btn-sm btn-ghost text-xs">
                Отмена
              </button>
            </>
          )}
        </div>
      </div>

      {/* Ошибка грамматики */}
      {fixError && (
        <div className="px-5 py-2 bg-negative-light border-b border-negative/20 flex items-center justify-between gap-2">
          <span className="text-xs text-negative">{fixError}</span>
          <button onClick={() => setFixError(null)} className="text-negative/60 hover:text-negative text-xs shrink-0">✕</button>
        </div>
      )}

      {/* Содержимое */}
      <div className="flex-1 overflow-auto bg-canvas/60">
        {isEditing ? (
          <div className="document-sheet">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="document-text w-full min-h-[500px] bg-transparent border-0 focus:outline-none resize-none"
              spellCheck
            />
          </div>
        ) : (
          <div key={document.id} className="document-sheet animate-sheet-in">
            <pre className="document-text font-serif">
              {document.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
