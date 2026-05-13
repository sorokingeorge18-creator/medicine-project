import React, { useState, useEffect } from 'react';
import { PatientData, Gender } from '../../types';

interface Props {
  data: PatientData;
  onChange: (data: PatientData) => void;
}

/** YYYY-MM-DD → DD.MM.YYYY */
function isoToDisplay(iso: string): string {
  if (!iso || iso.length < 10) return iso;
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/** DD.MM.YYYY → YYYY-MM-DD, или '' если неполная */
function displayToIso(display: string): string {
  const parts = display.split('.');
  if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return '';
}

/** Валидирует строку времени в формате HH:MM (24 ч) */
function isValidTime(val: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(val);
}

const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}> = ({ label, value, onChange, required, placeholder }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
    />
  </div>
);

/**
 * Поле ввода даты в формате DD.MM.YYYY.
 * Внутри хранит YYYY-MM-DD (ISO), снаружи показывает DD.MM.YYYY.
 * Автоматически вставляет слэши после дня и месяца.
 */
const DateField: React.FC<{
  label: string;
  value: string;          // YYYY-MM-DD
  onChange: (v: string) => void; // YYYY-MM-DD
  required?: boolean;
}> = ({ label, value, onChange, required }) => {
  const [display, setDisplay] = useState(() => isoToDisplay(value));

  // Синхронизируем если value изменилось снаружи
  useEffect(() => {
    setDisplay(isoToDisplay(value));
  }, [value]);

  const isValid = !display || display.length === 0 || /^\d{2}\.\d{2}\.\d{4}$/.test(display);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/[^0-9.]/g, '');
    // Автовставка точки после дня (2 цифры)
    if (v.length === 2 && !v.includes('.')) v = v + '.';
    // Автовставка точки после месяца ("DD.MM")
    if (v.length === 5 && (v.match(/\./g) || []).length === 1) v = v + '.';
    if (v.length > 10) return;
    setDisplay(v);
    const iso = displayToIso(v);
    if (iso) onChange(iso);
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        <span className="text-xs text-gray-400 font-normal ml-2">ДД.ММ.ГГГГ</span>
      </label>
      <input
        type="text"
        value={display}
        onChange={handleChange}
        placeholder="01.04.2026"
        maxLength={10}
        className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
          isValid ? 'border-gray-300' : 'border-red-400 bg-red-50'
        }`}
      />
      {!isValid && (
        <p className="text-xs text-red-500">Формат: ДД.ММ.ГГГГ (например 01.04.2026)</p>
      )}
    </div>
  );
};

/**
 * Поле ввода времени в 24-часовом формате.
 * Использует type="text" с маской ЧЧ:ММ, чтобы не зависеть
 * от локали браузера (Safari на macOS может показывать 12ч AM/PM).
 */
const TimeField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}> = ({ label, value, onChange, required }) => {
  const valid = !value || isValidTime(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/[^0-9:]/g, '');
    // Автоматически вставляем двоеточие после двух цифр
    if (v.length === 2 && !v.includes(':')) {
      v = v + ':';
    }
    if (v.length <= 5) onChange(v);
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        <span className="text-xs text-gray-400 font-normal ml-2">24 ч (ЧЧ:ММ)</span>
      </label>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="10:00"
        maxLength={5}
        className={`border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
          valid ? 'border-gray-300' : 'border-red-400 bg-red-50'
        }`}
      />
      {!valid && (
        <p className="text-xs text-red-500">Формат: ЧЧ:ММ (например 19:23)</p>
      )}
    </div>
  );
};

export const PatientForm: React.FC<Props> = ({ data, onChange }) => {
  const update = (field: keyof PatientData, value: string | Gender) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
        Данные пациента
      </h2>

      {/* ФИО */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InputField
          label="Фамилия"
          value={data.lastName}
          onChange={(v) => update('lastName', v)}
          required
        />
        <InputField
          label="Имя"
          value={data.firstName}
          onChange={(v) => update('firstName', v)}
          required
        />
        <InputField
          label="Отчество"
          value={data.middleName}
          onChange={(v) => update('middleName', v)}
        />
      </div>

      {/* Дата рождения + Пол */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DateField
          label="Дата рождения"
          value={data.birthDate}
          onChange={(v) => update('birthDate', v)}
          required
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Пол <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4 mt-1">
            {([['female', 'Женский'], ['male', 'Мужской']] as [Gender, string][]).map(([val, label]) => (
              <label
                key={val}
                className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition ${
                  data.gender === val
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="gender"
                  value={val}
                  checked={data.gender === val}
                  onChange={() => update('gender', val)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Даты и время госпитализации */}
      <div className="pt-2">
        <h3 className="text-sm font-semibold text-gray-600 mb-3">Даты госпитализации</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DateField
            label="Дата поступления"
            value={data.admissionDate}
            onChange={(v) => update('admissionDate', v)}
            required
          />
          <TimeField
            label="Время поступления"
            value={data.admissionTime}
            onChange={(v) => update('admissionTime', v)}
            required
          />
          <DateField
            label="Дата операции"
            value={data.operationDate}
            onChange={(v) => update('operationDate', v)}
            required
          />
          <DateField
            label="Дата выписки"
            value={data.dischargeDate}
            onChange={(v) => update('dischargeDate', v)}
            required
          />
        </div>
      </div>

      {/* Время осмотра */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TimeField
          label="Время осмотра по умолчанию"
          value={data.examinationTime}
          onChange={(v) => update('examinationTime', v)}
        />
      </div>

      {/* Информационная плашка с датами в формате ДД/ММ/ГГГГ */}
      {data.admissionDate && data.operationDate && data.dischargeDate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
          <span className="font-medium">Период:</span>{' '}
          {isoToDisplay(data.admissionDate)}
          {data.admissionTime && ` ${data.admissionTime}`}
          {' '}—{' '}
          {isoToDisplay(data.dischargeDate)}
          {'  '}
          <span className="text-blue-500">
            (операция: {isoToDisplay(data.operationDate)})
          </span>
        </div>
      )}
    </div>
  );
};
