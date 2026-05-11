import React, { useState, useEffect } from 'react';
import { DiaryEntry } from '../types';
import { formatDateShort } from '../logic/dateCalculations';
import { parseISO } from 'date-fns';

interface Props {
  document: DiaryEntry | null;
  onUpdate: (id: string, content: string) => void;
}

export const DocumentPreview: React.FC<Props> = ({ document, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (document) {
      setEditContent(document.content);
      setIsEditing(false);
    }
  }, [document?.id]);

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
        <svg className="w-16 h-16 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <p className="text-base">Выберите документ для просмотра</p>
        <p className="text-sm mt-1">Нажмите на документ в списке слева</p>
      </div>
    );
  }

  const dateStr = formatDateShort(parseISO(document.date));

  const handleSave = () => {
    onUpdate(document.id, editContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(document.content);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Заголовок предпросмотра */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{document.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {dateStr}
            {document.isEdited && (
              <span className="ml-2 text-orange-500 font-medium">
                ✎ Редактировался вручную
              </span>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={() => {
                setEditContent(document.content);
                setIsEditing(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Редактировать
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Сохранить
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Отмена
              </button>
            </>
          )}
        </div>
      </div>

      {/* Содержимое документа */}
      <div className="flex-1 overflow-auto">
        {isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full h-full min-h-[500px] px-6 py-4 text-sm font-mono text-gray-800 bg-white border-0 focus:outline-none resize-none leading-relaxed"
            spellCheck
          />
        ) : (
          <div className="px-6 py-4">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
              {document.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
