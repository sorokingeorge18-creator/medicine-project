import React, { useState, useEffect } from 'react';
import { PatientData, Gender } from '../../types';

interface Props {
  data: PatientData;
  onChange: (data: PatientData) => void;
}

function isoToDisplay(iso: string): string {
  if (!iso || iso.length < 10) return iso;
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function displayToIso(display: string): string {
  const parts = display.split('.');
  if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return '';
}

function isValidTime(val: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(val);
}

const Field: React.FC<{
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, required, hint, children }) => (
  <div className="flex flex-col gap-0">
    <label className="field-label">
      {label}{required && <span className="text-negative ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="field-hint">{hint}</p>}
  </div>
);

const DateField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}> = ({ label, value, onChange, required }) => {
  const [display, setDisplay] = useState(() => isoToDisplay(value));

  useEffect(() => { setDisplay(isoToDisplay(value)); }, [value]);

  const isValid = !display || display.length === 0 || /^\d{2}\.\d{2}\.\d{4}$/.test(display);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/[^0-9.]/g, '');
    if (v.length === 2 && !v.includes('.')) v = v + '.';
    if (v.length === 5 && (v.match(/\./g) || []).length === 1) v = v + '.';
    if (v.length > 10) return;
    setDisplay(v);
    const iso = displayToIso(v);
    if (iso) onChange(iso);
  };

  return (
    <Field label={label} required={required}>
      <input
        type="text"
        value={display}
        onChange={handleChange}
        placeholder="01.04.2026"
        maxLength={10}
        className={isValid ? 'field-input' : 'field-input-error'}
      />
      {!isValid && <p className="field-hint text-negative">Формат: ДД.ММ.ГГГГ</p>}
    </Field>
  );
};

const TimeField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  hint?: string;
}> = ({ label, value, onChange, required, hint }) => {
  const valid = !value || isValidTime(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/[^0-9:]/g, '');
    if (v.length === 2 && !v.includes(':')) v = v + ':';
    if (v.length <= 5) onChange(v);
  };

  return (
    <Field label={label} required={required} hint={hint}>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="10:00"
        maxLength={5}
        className={valid ? 'field-input' : 'field-input-error'}
      />
      {!valid && <p className="field-hint text-negative">Формат: ЧЧ:ММ (24 ч)</p>}
    </Field>
  );
};

export const PatientForm: React.FC<Props> = ({ data, onChange }) => {
  const update = (field: keyof PatientData, value: string | Gender) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <h2 className="section-title">Данные пациента</h2>

      {/* ФИО */}
      <div>
        <p className="field-label mb-3">ФИО</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Фамилия" required>
            <input type="text" value={data.lastName} onChange={(e) => update('lastName', e.target.value)} className="field-input" />
          </Field>
          <Field label="Имя" required>
            <input type="text" value={data.firstName} onChange={(e) => update('firstName', e.target.value)} className="field-input" />
          </Field>
          <Field label="Отчество">
            <input type="text" value={data.middleName} onChange={(e) => update('middleName', e.target.value)} className="field-input" />
          </Field>
        </div>
      </div>

      {/* Дата рождения + Пол */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DateField label="Дата рождения" value={data.birthDate} onChange={(v) => update('birthDate', v)} required />

        <Field label="Пол" required>
          <div className="flex gap-2 mt-0.5">
            {([['female', 'Женский'], ['male', 'Мужской']] as [Gender, string][]).map(([val, label]) => (
              <label
                key={val}
                className={`chip flex-1 ${data.gender === val ? 'chip-on' : 'chip-off'}`}
              >
                <input type="radio" name="gender" value={val} checked={data.gender === val}
                  onChange={() => update('gender', val)} className="sr-only" />
                {label}
              </label>
            ))}
          </div>
        </Field>
      </div>

      {/* Даты госпитализации */}
      <div>
        <p className="field-label mb-3">Даты госпитализации</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DateField label="Дата поступления" value={data.admissionDate} onChange={(v) => update('admissionDate', v)} required />
          <TimeField
            label="Время поступления"
            value={data.admissionTime}
            onChange={(v) => update('admissionTime', v)}
            required
            hint="24 ч · влияет на время первичного осмотра"
          />
          <DateField label="Дата операции" value={data.operationDate} onChange={(v) => update('operationDate', v)} required />
          <DateField label="Дата выписки" value={data.dischargeDate} onChange={(v) => update('dischargeDate', v)} required />
        </div>
      </div>

      {/* Время осмотра */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TimeField
          label="Время осмотра по умолчанию"
          value={data.examinationTime}
          onChange={(v) => update('examinationTime', v)}
          hint="Используется для всех дневников, кроме поступления"
        />
      </div>

      {/* Информационная плашка */}
      {data.admissionDate && data.operationDate && data.dischargeDate && (
        <div className="hint-block animate-fade-up">
          <span className="font-semibold text-ink">Период:</span>{' '}
          {isoToDisplay(data.admissionDate)}
          {data.admissionTime && ` · ${data.admissionTime}`}
          {' — '}
          {isoToDisplay(data.dischargeDate)}
          <span className="text-ink-3 ml-2">(операция: {isoToDisplay(data.operationDate)})</span>
        </div>
      )}
    </div>
  );
};
