import React from 'react';
import { OperationData } from '../../types';

interface Props {
  data: OperationData;
  onChange: (data: OperationData) => void;
}

const ANESTHESIA_OPTIONS = [
  'Спинномозговая анестезия',
  'Эндотрахеальный наркоз',
  'Проводниковая анестезия',
  'Внутривенная анестезия',
  'Местная анестезия',
];

export const OperationForm: React.FC<Props> = ({ data, onChange }) => {
  const update = <K extends keyof OperationData>(field: K, value: OperationData[K]) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <h2 className="section-title">Операция</h2>

      <div>
        <label className="field-label">Название операции</label>
        <input
          type="text"
          value={data.operationName}
          onChange={(e) => update('operationName', e.target.value)}
          placeholder="ЗИМО плечевой кости, интрамедуллярный остеосинтез"
          className="field-input"
        />
      </div>

      <div>
        <label className="field-label">Объём оперативного лечения <span className="text-negative">*</span></label>
        <textarea
          value={data.operationVolume}
          onChange={(e) => update('operationVolume', e.target.value)}
          rows={3}
          placeholder="ЗИМО левого плеча, ВПА. Интрамедуллярный остеосинтез гвоздём с блокированием."
          className="field-textarea"
        />
      </div>

      <div>
        <label className="field-label">Вид анестезии <span className="text-negative">*</span></label>
        <div className="flex flex-wrap gap-2 mb-3 mt-0.5">
          {ANESTHESIA_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => update('anesthesia', opt)}
              className={`chip text-xs py-1.5 ${data.anesthesia === opt ? 'chip-on' : 'chip-off'}`}
            >
              {opt}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={data.anesthesia}
          onChange={(e) => update('anesthesia', e.target.value)}
          placeholder="Или введите вручную..."
          className="field-input"
        />
      </div>

      <div className="hint-block">
        Название и объём операции включаются в предоперационный эпикриз в раздел «Обоснование».
      </div>
    </div>
  );
};
