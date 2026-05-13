import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FormData, DiaryEntry, SavedCase } from './types';
import { PatientForm } from './components/forms/PatientForm';
import { DiagnosisForm } from './components/forms/DiagnosisForm';
import { ExaminationForm } from './components/forms/ExaminationForm';
import { OperationForm } from './components/forms/OperationForm';
import { ImmobilizationForm } from './components/forms/ImmobilizationForm';
import { DoctorsForm } from './components/forms/DoctorsForm';
import { DocumentList } from './components/DocumentList';
import { DocumentPreview } from './components/DocumentPreview';
import { SavedCases } from './components/SavedCases';
import { generateAllDocuments } from './logic/documentGenerator';
import { exportToDocx } from './logic/docxExporter';

// ─── Начальные данные ────────────────────────────────────────────────────────

const INITIAL_FORM: FormData = {
  patient: {
    lastName: '',
    firstName: '',
    middleName: '',
    birthDate: '',
    admissionDate: '',
    admissionTime: '19:00',
    operationDate: '',
    dischargeDate: '',
    gender: 'female',
    examinationTime: '10:00',
  },
  diagnosis: {
    mainDiagnosis: '',
    anatomicalArea: '',
    localisArea: '',
    limbType: 'upper',
    side: 'left',
    injuryCause: 'household',
    comorbidities: '',
  },
  examination: {
    xrayDescription: '',
    ctPerformed: false,
    ctDescription: '',
  },
  operation: {
    operationName: '',
    operationVolume: '',
    anesthesia: '',
  },
  immobilization: {
    admissionFixation: 'none',
    admissionFixationDescription: '',
    postOpFixation: 'none',
    fixationDescription: '',
  },
  doctors: {
    residentName: 'Марков А.Г.',
    attendingName: 'Ятлук А.А.',
    headName: 'Привалов Д.А.',
  },
};

// ─── Табы ────────────────────────────────────────────────────────────────────

type TabId = 'patient' | 'diagnosis' | 'examination' | 'operation' | 'immobilization' | 'doctors' | 'documents';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'patient', label: 'Пациент', icon: '👤' },
  { id: 'diagnosis', label: 'Диагноз', icon: '🏥' },
  { id: 'examination', label: 'Обследования', icon: '🔬' },
  { id: 'operation', label: 'Операция', icon: '⚕️' },
  { id: 'immobilization', label: 'Фиксация', icon: '🩹' },
  { id: 'doctors', label: 'Врачи', icon: '👨‍⚕️' },
  { id: 'documents', label: 'Документы', icon: '📄' },
];

// ─── Валидация ───────────────────────────────────────────────────────────────

function validateForm(data: FormData): string[] {
  const errors: string[] = [];
  const { patient, diagnosis, examination, operation } = data;

  if (!patient.lastName.trim()) errors.push('Фамилия пациента');
  if (!patient.firstName.trim()) errors.push('Имя пациента');
  if (!patient.birthDate) errors.push('Дата рождения');
  if (!patient.admissionDate) errors.push('Дата поступления');
  if (!patient.operationDate) errors.push('Дата операции');
  if (!patient.dischargeDate) errors.push('Дата выписки');
  if (!diagnosis.mainDiagnosis.trim()) errors.push('Основной диагноз');
  if (!diagnosis.anatomicalArea.trim()) errors.push('Анатомическая область');
  if (!examination.xrayDescription.trim()) errors.push('Описание рентгенографии');
  if (!operation.operationVolume.trim()) errors.push('Объём операции');

  if (patient.admissionDate && patient.operationDate && patient.dischargeDate) {
    const adm = new Date(patient.admissionDate);
    const op = new Date(patient.operationDate);
    const dis = new Date(patient.dischargeDate);
    if (op < adm) errors.push('Дата операции раньше даты поступления');
    if (dis < op) errors.push('Дата выписки раньше даты операции');
  }
  return errors;
}

// ─── localStorage ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'med_docs_saved_cases_v2';

function loadCases(): SavedCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCases(cases: SavedCase[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
}

// ─── Анимированный контент ────────────────────────────────────────────────────

/**
 * Оборачивает children в div с fade+slide анимацией при смене ключа.
 */
const AnimatedPane: React.FC<{ tabKey: string; children: React.ReactNode }> = ({ tabKey, children }) => {
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState(children);
  const [currentKey, setCurrentKey] = useState(tabKey);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (tabKey === currentKey) {
      setVisible(true);
      return;
    }
    // Fade out, swap content, fade in
    setVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setContent(children);
      setCurrentKey(tabKey);
      setVisible(true);
    }, 180);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [tabKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep content in sync when same tab re-renders
  useEffect(() => {
    if (tabKey === currentKey) setContent(children);
  });

  return (
    <div
      style={{
        transition: 'opacity 0.18s ease, transform 0.18s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
      }}
    >
      {content}
    </div>
  );
};

// ─── Главный компонент ────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('patient');
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [preopEpicrisis, setPreopEpicrisis] = useState<DiaryEntry | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [savedCases, setSavedCases] = useState<SavedCase[]>(loadCases);
  const [showSavedCases, setShowSavedCases] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const updatePatient = useCallback((p: FormData['patient']) => setFormData((d) => ({ ...d, patient: p })), []);
  const updateDiagnosis = useCallback((p: FormData['diagnosis']) => setFormData((d) => ({ ...d, diagnosis: p })), []);
  const updateExamination = useCallback((p: FormData['examination']) => setFormData((d) => ({ ...d, examination: p })), []);
  const updateOperation = useCallback((p: FormData['operation']) => setFormData((d) => ({ ...d, operation: p })), []);
  const updateImmobilization = useCallback((p: FormData['immobilization']) => setFormData((d) => ({ ...d, immobilization: p })), []);
  const updateDoctors = useCallback((p: FormData['doctors']) => setFormData((d) => ({ ...d, doctors: p })), []);

  const handleGenerate = useCallback(() => {
    const errs = validateForm(formData);
    if (errs.length > 0) {
      setErrors(errs);
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setErrors([]);
    setIsGenerating(true);
    setTimeout(() => {
      const result = generateAllDocuments(formData);
      setDiaries(result.diaries);
      setPreopEpicrisis(result.preopEpicrisis);
      const first = result.preopEpicrisis ?? result.diaries[0] ?? null;
      setSelectedDocId(first?.id ?? null);
      setActiveTab('documents');
      setIsGenerating(false);
      showSuccessMsg(`Сгенерировано: ${result.diaries.length} дневников + ${result.preopEpicrisis ? '1 эпикриз' : '0'}`);
    }, 150);
  }, [formData]);

  const handleDocumentUpdate = useCallback((id: string, content: string) => {
    if (preopEpicrisis && preopEpicrisis.id === id) {
      setPreopEpicrisis({ ...preopEpicrisis, content, isEdited: true });
    } else {
      setDiaries((prev) => prev.map((d) => (d.id === id ? { ...d, content, isEdited: true } : d)));
    }
    showSuccessMsg('Изменения сохранены');
  }, [preopEpicrisis]);

  const handleExport = useCallback(async () => {
    if (diaries.length === 0 && !preopEpicrisis) {
      setErrors(['Сначала сгенерируйте документы']);
      setShowErrors(true);
      return;
    }
    setIsExporting(true);
    try {
      await exportToDocx(formData, diaries, preopEpicrisis);
      showSuccessMsg('Файл DOCX скачан');
    } catch (e) {
      setErrors([String(e)]);
      setShowErrors(true);
    } finally {
      setIsExporting(false);
    }
  }, [formData, diaries, preopEpicrisis]);

  const handleSaveCase = useCallback((name: string) => {
    const nc: SavedCase = { id: Date.now().toString(), name, savedAt: new Date().toISOString(), formData };
    const updated = [nc, ...savedCases].slice(0, 20);
    setSavedCases(updated);
    saveCases(updated);
    showSuccessMsg(`Случай «${name}» сохранён`);
  }, [formData, savedCases]);

  const handleLoadCase = useCallback((c: SavedCase) => {
    setFormData(c.formData);
    setDiaries([]);
    setPreopEpicrisis(null);
    setSelectedDocId(null);
    setActiveTab('patient');
    showSuccessMsg(`Загружен случай «${c.name}»`);
  }, []);

  const handleDeleteCase = useCallback((id: string) => {
    const updated = savedCases.filter((c) => c.id !== id);
    setSavedCases(updated);
    saveCases(updated);
  }, [savedCases]);

  function showSuccessMsg(msg: string) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  }

  const hasDocuments = diaries.length > 0 || preopEpicrisis !== null;
  const selectedDocument =
    selectedDocId === preopEpicrisis?.id
      ? preopEpicrisis
      : diaries.find((d) => d.id === selectedDocId) ?? null;

  const isDocMode = activeTab === 'documents';

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">

      {/* ── Шапка ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white text-lg font-bold shrink-0">
              М
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                Медицинские документы
              </h1>
              <p className="text-xs text-gray-500">Травматология / Ортопедия</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowSavedCases((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition ${
                showSavedCases ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
              Случаи{savedCases.length > 0 && ` (${savedCases.length})`}
            </button>

            <button
              onClick={() => { if (confirm('Очистить все данные формы?')) { setFormData(INITIAL_FORM); setDiaries([]); setPreopEpicrisis(null); setSelectedDocId(null); setActiveTab('patient'); } }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition"
            >
              Очистить
            </button>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-60 shadow-sm"
            >
              {isGenerating
                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Генерирую...</>
                : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>Сгенерировать</>
              }
            </button>

            {hasDocuments && (
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-60 shadow-sm"
              >
                {isExporting
                  ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Экспорт...</>
                  : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>Скачать DOCX</>
                }
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Уведомление об успехе ─────────────────────────────────────────── */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* ── Ошибки ───────────────────────────────────────────────────────── */}
      {showErrors && errors.length > 0 && (
        <div className="max-w-screen-2xl mx-auto px-4 mt-3 w-full">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700 mb-1">Заполните обязательные поля:</p>
              <ul className="text-sm text-red-600 space-y-0.5">
                {errors.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            </div>
            <button onClick={() => setShowErrors(false)} className="text-red-400 hover:text-red-600 shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Основной контент ─────────────────────────────────────────────── */}
      <div className="flex-1 max-w-screen-2xl mx-auto w-full px-4 py-4 flex gap-4 min-h-0">

        {/* Панель сохранённых случаев */}
        {showSavedCases && (
          <aside className="w-64 shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 h-full">
              <h2 className="text-sm font-semibold text-gray-800 mb-3">Сохранённые случаи</h2>
              <SavedCases
                cases={savedCases}
                onLoad={handleLoadCase}
                onDelete={handleDeleteCase}
                onSave={handleSaveCase}
                currentData={formData}
              />
            </div>
          </aside>
        )}

        {/* ── Левый сайдбар: вертикальные табы ──────────────────────────── */}
        <nav className="w-44 shrink-0 flex flex-col gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const isDoc = tab.id === 'documents';
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left
                  transition-all duration-200 w-full
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isDoc && hasDocuments
                      ? 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-800'
                  }
                `}
              >
                <span className="text-base leading-none">{tab.icon}</span>
                <span>{tab.label}</span>
                {isDoc && hasDocuments && !isActive && (
                  <span className="ml-auto bg-blue-100 text-blue-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                    {diaries.length + (preopEpicrisis ? 1 : 0)}
                  </span>
                )}
              </button>
            );
          })}

          {/* Статус заполнения */}
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            <StatusDot label="Пациент" ok={!!(formData.patient.lastName && formData.patient.admissionDate && formData.patient.operationDate)} />
            <StatusDot label="Диагноз" ok={!!(formData.diagnosis.mainDiagnosis && formData.diagnosis.anatomicalArea)} />
            <StatusDot label="Обследования" ok={!!formData.examination.xrayDescription} />
            <StatusDot label="Операция" ok={!!formData.operation.operationVolume} />
            <StatusDot label="Врачи" ok={!!(formData.doctors.attendingName && formData.doctors.headName)} />
          </div>
        </nav>

        {/* ── Центральная панель ─────────────────────────────────────────── */}
        {!isDocMode && (
          <div className="flex-1 min-w-0">
            <AnimatedPane tabKey={activeTab}>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                {activeTab === 'patient' && <PatientForm data={formData.patient} onChange={updatePatient} />}
                {activeTab === 'diagnosis' && <DiagnosisForm data={formData.diagnosis} onChange={updateDiagnosis} />}
                {activeTab === 'examination' && <ExaminationForm data={formData.examination} onChange={updateExamination} />}
                {activeTab === 'operation' && <OperationForm data={formData.operation} onChange={updateOperation} />}
                {activeTab === 'immobilization' && <ImmobilizationForm data={formData.immobilization} onChange={updateImmobilization} />}
                {activeTab === 'doctors' && <DoctorsForm data={formData.doctors} onChange={updateDoctors} />}
              </div>
            </AnimatedPane>
          </div>
        )}

        {/* ── Режим документов: список + предпросмотр ────────────────────── */}
        {isDocMode && (
          <>
            {/* Список документов */}
            <div className="w-64 shrink-0 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <h2 className="text-sm font-semibold text-gray-800">Документы</h2>
                {hasDocuments && (
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition disabled:opacity-60"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    DOCX
                  </button>
                )}
              </div>
              <div className="px-3 pb-4 flex-1 overflow-y-auto">
                <DocumentList
                  diaries={diaries}
                  preopEpicrisis={preopEpicrisis}
                  selectedId={selectedDocId}
                  onSelect={setSelectedDocId}
                />
              </div>
            </div>

            {/* Предпросмотр */}
            <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <DocumentPreview document={selectedDocument} onUpdate={handleDocumentUpdate} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const StatusDot: React.FC<{ label: string; ok: boolean }> = ({ label, ok }) => (
  <div className="flex items-center gap-1.5">
    <div className={`w-2 h-2 rounded-full shrink-0 transition-colors duration-300 ${ok ? 'bg-green-500' : 'bg-gray-300'}`} />
    <span className={`text-xs transition-colors duration-300 ${ok ? 'text-green-700' : 'text-gray-400'}`}>{label}</span>
  </div>
);
