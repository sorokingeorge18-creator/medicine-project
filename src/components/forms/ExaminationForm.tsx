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
    <div className="space-y-6">
      <h2 className="section-title">Обследования</h2>

      {/* Рентгенография */}
      <div>
        <label className="field-label">Описание рентгенографии <span className="text-negative">*</span></label>
        <textarea
          value={data.xrayDescription}
          onChange={(e) => update('xrayDescription', e.target.value)}
          rows={3}
          placeholder="Перелом хирургической шейки плечевой кости слева со смещением отломков."
          className="field-textarea"
        />
      </div>

      {/* КТ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">Компьютерная томография (КТ)</p>
            <p className="text-xs text-ink-3 mt-0.5">Будет включена в эпикриз при наличии</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={data.ctPerformed}
            onClick={() => update('ctPerformed', !data.ctPerformed)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand focus:outline-none ${
              data.ctPerformed ? 'bg-brand' : 'bg-line-strong'
            }`}
          >
            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
              data.ctPerformed ? 'translate-x-4' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {data.ctPerformed && (
          <div className="pl-4 border-l-2 border-brand/20 animate-fade-up">
            <label className="field-label">Описание КТ <span className="text-negative">*</span></label>
            <textarea
              value={data.ctDescription}
              onChange={(e) => update('ctDescription', e.target.value)}
              rows={3}
              placeholder="Многооскольчатый перелом головки плечевой кости без дополнительных повреждений."
              className="field-textarea"
            />
          </div>
        )}
      </div>

      <div className="hint-block">
        Результаты обследований включаются в предоперационный эпикриз.
        КТ упоминается только если включена опция выше.
      </div>
    </div>
  );
};
