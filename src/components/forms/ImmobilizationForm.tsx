import React from 'react';
import { ImmobilizationData, PostOpFixationType } from '../../types';

interface Props {
  data: ImmobilizationData;
  onChange: (data: ImmobilizationData) => void;
}

const FIXATION_OPTIONS: { value: PostOpFixationType; label: string }[] = [
  { value: 'none', label: 'Нет фиксации' },
  { value: 'cast', label: 'Гипсовая повязка' },
  { value: 'sling', label: 'Косыночная повязка' },
  { value: 'deso', label: 'Повязка Дезо' },
  { value: 'other', label: 'Другое' },
];

function FixationSelector({
  label,
  value,
  description,
  onValueChange,
  onDescriptionChange,
}: {
  label: string;
  value: PostOpFixationType;
  description: string;
  onValueChange: (v: PostOpFixationType) => void;
  onDescriptionChange: (v: string) => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {FIXATION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onValueChange(opt.value)}
            className={`flex items-center gap-2 p-3 rounded-lg border text-left transition ${
              value === opt.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="text-sm font-medium">{opt.label}</span>
          </button>
        ))}
      </div>
      {value !== 'none' && (
        <div className="flex flex-col gap-1 pl-4 border-l-2 border-blue-200">
          <label className="text-sm font-medium text-gray-700">
            Описание фиксации{value === 'other' && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder={
              value === 'other'
                ? 'Опишите тип фиксации...'
                : 'Дополнительное описание (необязательно)'
            }
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
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
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
        Иммобилизация и фиксация
      </h2>

      <FixationSelector
        label="Фиксация при поступлении"
        value={data.admissionFixation}
        description={data.admissionFixationDescription}
        onValueChange={(v) => update('admissionFixation', v)}
        onDescriptionChange={(v) => update('admissionFixationDescription', v)}
      />

      <FixationSelector
        label="Послеоперационная фиксация"
        value={data.postOpFixation}
        description={data.fixationDescription}
        onValueChange={(v) => update('postOpFixation', v)}
        onDescriptionChange={(v) => update('fixationDescription', v)}
      />

      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
        <span className="font-medium">Как используется:</span> Тип иммобилизации автоматически
        подставляется в status localis каждого дневника. До операции — фиксация при поступлении,
        после операции — послеоперационная фиксация.
      </div>
    </div>
  );
};
