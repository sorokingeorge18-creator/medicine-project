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
    <div className="space-y-6">
      <h2 className="section-title">Врачи</h2>

      <p className="text-sm text-ink-2 -mt-3">
        ФИО подставляются в подписи документов и в заголовки дневников с заведующим.
      </p>

      <div className="space-y-4">
        <div>
          <label className="field-label">Клинический ординатор</label>
          <input
            type="text"
            value={data.residentName}
            onChange={(e) => update('residentName', e.target.value)}
            placeholder="Фамилия И.О."
            className="field-input"
          />
        </div>

        <div>
          <label className="field-label">Лечащий врач <span className="text-negative">*</span></label>
          <input
            type="text"
            value={data.attendingName}
            onChange={(e) => update('attendingName', e.target.value)}
            placeholder="Фамилия И.О."
            className="field-input"
          />
        </div>

        <div>
          <label className="field-label">Заведующий отделением <span className="text-negative">*</span></label>
          <input
            type="text"
            value={data.headName}
            onChange={(e) => update('headName', e.target.value)}
            placeholder="Фамилия И.О."
            className="field-input"
          />
        </div>
      </div>

      {/* Использование */}
      <div className="border border-line rounded-lg p-4 space-y-2.5 bg-canvas">
        <p className="field-label mb-0">Как используется в документах</p>
        <div className="space-y-1.5 text-xs text-ink-2">
          <div className="flex gap-2">
            <span className="text-ink-4 shrink-0">·</span>
            <span>Заголовок дневника: «Первичный осмотр совместно с заведующим <span className="font-semibold text-ink">{data.headName || '...'}</span>»</span>
          </div>
          <div className="flex gap-2">
            <span className="text-ink-4 shrink-0">·</span>
            <span>Подпись: «Клин. ординатор _____ <span className="font-semibold text-ink">{data.residentName || '...'}</span>»</span>
          </div>
          <div className="flex gap-2">
            <span className="text-ink-4 shrink-0">·</span>
            <span>Подпись: «Врач _____ <span className="font-semibold text-ink">{data.attendingName || '...'}</span>»</span>
          </div>
        </div>
      </div>
    </div>
  );
};
