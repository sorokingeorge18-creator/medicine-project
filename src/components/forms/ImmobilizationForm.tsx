import React from 'react';
import { ImmobilizationData, PostOpFixationType } from '../../types';

interface Props {
  data: ImmobilizationData;
  onChange: (data: ImmobilizationData) => void;
}

const FIXATION_OPTIONS: { value: PostOpFixationType; label: string }[] = [
  { value: 'none',  label: 'Нет' },
  { value: 'cast',  label: 'Гипсовая повязка' },
  { value: 'sling', label: 'Косыночная' },
  { value: 'deso',  label: 'Повязка Дезо' },
  { value: 'other', label: 'Другое' },
];

function FixationSelector({
  label,
  hint,
  value,
  description,
  onValueChange,
  onDescriptionChange,
}: {
  label: string;
  hint?: string;
  value: PostOpFixationType;
  description: string;
  onValueChange: (v: PostOpFixationType) => void;
  onDescriptionChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="field-label">{label}</p>
        {hint && <p className="text-xs text-ink-3 mb-2">{hint}</p>}
        <div className="flex flex-wrap gap-2">
          {FIXATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onValueChange(opt.value)}
              className={`chip text-xs py-1.5 ${value === opt.value ? 'chip-on' : 'chip-off'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {(value === 'other' || value === 'cast') && (
        <div className="pl-4 border-l-2 border-brand/20 animate-fade-up">
          <label className="field-label">
            {value === 'cast' ? 'Тип гипсовой повязки' : 'Описание фиксации'}
            {value === 'other' && <span className="text-negative ml-0.5">*</span>}
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder={
              value === 'cast'
                ? 'задней гипсовой лонгете, циркулярной гипсовой повязке...'
                : 'Напр.: в шине Крамера, в ортезе...'
            }
            className="field-input"
          />
          {value === 'cast' && (
            <p className="field-hint">Если пусто — будет «гипсовой повязке»</p>
          )}
          {value === 'other' && (
            <p className="field-hint">Подставляется в status localis каждого дневника</p>
          )}
        </div>
      )}
    </div>
  );
}

export const ImmobilizationForm: React.FC<Props> = ({ data, onChange }) => {
  const update = <K extends keyof ImmobilizationData>(field: K, value: ImmobilizationData[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <h2 className="section-title">Иммобилизация и фиксация</h2>

      <FixationSelector
        label="Фиксация при поступлении"
        hint="Используется в дневниках до операции"
        value={data.admissionFixation}
        description={data.admissionFixationDescription}
        onValueChange={(v) => update('admissionFixation', v)}
        onDescriptionChange={(v) => update('admissionFixationDescription', v)}
      />

      <div className="border-t border-line pt-6">
        <FixationSelector
          label="Послеоперационная фиксация"
          hint="Используется в дневниках после операции"
          value={data.postOpFixation}
          description={data.fixationDescription}
          onValueChange={(v) => update('postOpFixation', v)}
          onDescriptionChange={(v) => update('fixationDescription', v)}
        />
      </div>

      <div className="hint-block">
        Тип фиксации автоматически подставляется в status localis каждого дневника.
      </div>
    </div>
  );
};
