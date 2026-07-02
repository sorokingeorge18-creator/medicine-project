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
    nounGender: 'masculine',
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

// ─── Типы и константы ────────────────────────────────────────────────────────

type TabId = 'patient' | 'diagnosis' | 'examination' | 'operation' | 'immobilization' | 'doctors' | 'documents';

const NEXT_TAB: Partial<Record<TabId, TabId>> = {
  patient:        'diagnosis',
  diagnosis:      'examination',
  examination:    'operation',
  operation:      'immobilization',
  immobilization: 'doctors',
};

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: 'patient', label: 'Пациент',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0"><circle cx="8" cy="5.5" r="2.5"/><path d="M3 14c0-2.76 2.24-5 5-5s5 2.24 5 5" strokeLinecap="round"/></svg>,
  },
  {
    id: 'diagnosis', label: 'Диагноз',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0"><rect x="3" y="1.5" width="10" height="13" rx="1.5"/><path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" strokeLinecap="round"/></svg>,
  },
  {
    id: 'examination', label: 'Обследования',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5l3 3" strokeLinecap="round"/></svg>,
  },
  {
    id: 'operation', label: 'Операция',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0"><circle cx="8" cy="8" r="6"/><path d="M8 5v6M5 8h6" strokeLinecap="round"/></svg>,
  },
  {
    id: 'immobilization', label: 'Фиксация',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0"><path d="M4 8a4 4 0 018 0" strokeLinecap="round"/><path d="M2.5 10.5l2-1.5M2.5 5.5l2 1.5M13.5 10.5l-2-1.5M13.5 5.5l-2 1.5" strokeLinecap="round"/></svg>,
  },
  {
    id: 'doctors', label: 'Врачи',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0"><circle cx="5.5" cy="5" r="2"/><path d="M1.5 13c0-2.21 1.79-4 4-4s4 1.79 4 4" strokeLinecap="round"/><circle cx="11.5" cy="5.5" r="1.5"/><path d="M10 13c0-.93.27-1.8.74-2.52" strokeLinecap="round"/></svg>,
  },
  {
    id: 'documents', label: 'Документы',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0"><path d="M3 3.5A1.5 1.5 0 014.5 2h4.69L12 5v7.5A1.5 1.5 0 0110.5 14h-6A1.5 1.5 0 013 12.5v-9z"/><path d="M9 2v3.5H12M5.5 8h5M5.5 10.5h3.5" strokeLinecap="round"/></svg>,
  },
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
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
}
function saveCases(cases: SavedCase[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    return true;
  } catch {
    return false;
  }
}

// ─── AnimatedPane ─────────────────────────────────────────────────────────────

const AnimatedPane: React.FC<{ tabKey: string; children: React.ReactNode }> = ({ tabKey, children }) => {
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState(children);
  const [currentKey, setCurrentKey] = useState(tabKey);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (tabKey === currentKey) { setVisible(true); return; }
    setVisible(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setContent(children);
      setCurrentKey(tabKey);
      setVisible(true);
    }, 160);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [tabKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (tabKey === currentKey) setContent(children); });

  return (
    <div style={{
      transition: 'opacity 0.16s ease, transform 0.16s ease',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(5px)',
    }}>
      {content}
    </div>
  );
};

// ─── Статус-индикатор ─────────────────────────────────────────────────────────

const StatusDot: React.FC<{ label: string; ok: boolean }> = ({ label, ok }) => (
  <div className="flex items-center gap-2">
    <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-300 ${ok ? 'bg-positive' : 'bg-line-strong'}`} />
    <span className={`text-xs transition-colors duration-300 ${ok ? 'text-positive' : 'text-ink-4'}`}>{label}</span>
  </div>
);

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
    if (errs.length > 0) { setErrors(errs); setShowErrors(true); return; }
    setShowErrors(false); setErrors([]);
    setIsGenerating(true);
    setTimeout(() => {
      const result = generateAllDocuments(formData);
      setDiaries(result.diaries);
      setPreopEpicrisis(result.preopEpicrisis);
      const first = result.preopEpicrisis ?? result.diaries[0] ?? null;
      setSelectedDocId(first?.id ?? null);
      setActiveTab('documents');
      setIsGenerating(false);
      showSuccessMsg(`Готово: ${result.diaries.length} дневников${result.preopEpicrisis ? ' + эпикриз' : ''}`);
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
    if (diaries.length === 0 && !preopEpicrisis) { setErrors(['Сначала сгенерируйте документы']); setShowErrors(true); return; }
    setIsExporting(true);
    try {
      const { exportToDocx } = await import('./logic/docxExporter');
      await exportToDocx(formData, diaries, preopEpicrisis);
      showSuccessMsg('Файл DOCX скачан');
    }
    catch (e) { setErrors([String(e)]); setShowErrors(true); }
    finally { setIsExporting(false); }
  }, [formData, diaries, preopEpicrisis]);

  const handleSaveCase = useCallback((name: string) => {
    const nc: SavedCase = { id: Date.now().toString(), name, savedAt: new Date().toISOString(), formData };
    const updated = [nc, ...savedCases].slice(0, 20);
    setSavedCases(updated);
    if (saveCases(updated)) {
      showSuccessMsg(`Случай «${name}» сохранён`);
    } else {
      setErrors(['Не удалось сохранить случай: хранилище браузера переполнено']);
      setShowErrors(true);
    }
  }, [formData, savedCases]);

  const handleLoadCase = useCallback((c: SavedCase) => {
    setFormData(c.formData); setDiaries([]); setPreopEpicrisis(null);
    setSelectedDocId(null); setActiveTab('patient');
    showSuccessMsg(`Загружен случай «${c.name}»`);
  }, []);

  const handleDeleteCase = useCallback((id: string) => {
    const updated = savedCases.filter((c) => c.id !== id);
    setSavedCases(updated); saveCases(updated);
  }, [savedCases]);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function showSuccessMsg(msg: string) {
    setSuccessMessage(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setSuccessMessage(''), 3000);
  }

  const hasDocuments = diaries.length > 0 || preopEpicrisis !== null;
  const selectedDocument = selectedDocId === preopEpicrisis?.id
    ? preopEpicrisis
    : diaries.find((d) => d.id === selectedDocId) ?? null;
  const isDocMode = activeTab === 'documents';
  const docCount = diaries.length + (preopEpicrisis ? 1 : 0);

  return (
    <div className="min-h-screen bg-canvas font-sans flex flex-col">

      {/* ── Шапка ──────────────────────────────────────────────────────── */}
      <header className="bg-surface border-b border-line sticky top-0 z-20">
        <div className="max-w-screen-2xl mx-auto px-5 h-14 flex items-center justify-between gap-4">

          {/* Логотип */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-7 h-7 bg-ink rounded-md flex items-center justify-center shrink-0">
              <svg viewBox="0 0 14 14" fill="none" className="w-4 h-4">
                <path d="M7 2v10M2 7h10" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="leading-tight">
              <span className="text-sm font-semibold text-ink">Мед. документы</span>
              <span className="text-xs text-ink-3 ml-2 hidden sm:inline">Травматология · Ортопедия</span>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSavedCases((v) => !v)}
              className={`btn btn-sm btn-ghost ${showSavedCases ? '!border-brand/30 !text-brand !bg-brand-light' : ''}`}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path d="M4 14H3a1 1 0 01-1-1V5a1 1 0 011-1h2.5L7 5.5h4A1 1 0 0112 6.5V8M4 14h9a1 1 0 001-1v-4a1 1 0 00-1-1H8a1 1 0 00-1 1v4a1 1 0 01-1 1z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="hidden sm:inline">Случаи</span>
              {savedCases.length > 0 && (
                <span className="bg-ink-4/30 text-ink-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
                  {savedCases.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { if (confirm('Очистить все данные формы?')) { setFormData(INITIAL_FORM); setDiaries([]); setPreopEpicrisis(null); setSelectedDocId(null); setActiveTab('patient'); }}}
              className="btn btn-sm btn-ghost"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path d="M6 2h4M2.5 4h11M11.5 4l-.6 8.1A1 1 0 0110 13H6a1 1 0 01-1-.9L4.5 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="hidden sm:inline">Очистить</span>
            </button>

            {hasDocuments && (
              <button onClick={handleExport} disabled={isExporting} className="btn btn-sm btn-md btn-ghost border-positive/30 text-positive bg-positive-light hover:bg-positive/10">
                {isExporting
                  ? <><Spinner /> <span className="hidden sm:inline">Экспорт...</span></>
                  : <>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                        <path d="M8 2v8M5 7l3 3 3-3M3 13h10" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="hidden sm:inline">Скачать DOCX</span>
                    </>
                }
              </button>
            )}

            <button onClick={handleGenerate} disabled={isGenerating} className="btn btn-sm btn-md btn-dark">
              {isGenerating
                ? <><Spinner /> Генерирую...</>
                : <>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                      <path d="M2 8h3l2-5 3 10 2-5h2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Сгенерировать
                  </>
              }
            </button>
          </div>
        </div>
      </header>

      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-white px-4 py-3 rounded-xl shadow-toast text-sm font-medium flex items-center gap-2.5 animate-fade-up">
          <svg className="w-4 h-4 text-positive-muted shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {successMessage}
        </div>
      )}

      {/* ── Ошибки ──────────────────────────────────────────────────────── */}
      {showErrors && errors.length > 0 && (
        <div className="max-w-screen-2xl mx-auto px-5 pt-3 w-full animate-fade-up">
          <div className="bg-negative-light border border-negative/20 rounded-xl p-4 flex gap-3">
            <svg className="w-4 h-4 text-negative shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6"/><path d="M8 5v3.5M8 11h.01" strokeLinecap="round"/>
            </svg>
            <div className="flex-1">
              <p className="text-xs font-semibold text-negative uppercase tracking-wide mb-1.5">Заполните обязательные поля</p>
              <ul className="text-sm text-ink-2 space-y-0.5">
                {errors.map((e, i) => <li key={i} className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-negative/50 shrink-0" />{e}</li>)}
              </ul>
            </div>
            <button onClick={() => setShowErrors(false)} className="text-ink-3 hover:text-ink shrink-0 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Основной контент ─────────────────────────────────────────────── */}
      <div className="flex-1 max-w-screen-2xl mx-auto w-full px-5 py-5 flex gap-4 min-h-0">

        {/* Панель сохранённых случаев */}
        {showSavedCases && (
          <aside className="w-64 shrink-0 animate-slide-in">
            <div className="card p-4 h-full">
              <p className="field-label mb-4">Сохранённые случаи</p>
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

        {/* ── Сайдбар навигации ─────────────────────────────────────────── */}
        <nav className="w-48 shrink-0 flex flex-col">
          <div className="space-y-0.5">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const isDoc = tab.id === 'documents';
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
                >
                  {/* Active left border */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand rounded-r-full" />
                  )}
                  <span className={`transition-colors ${isActive ? 'text-brand' : 'text-ink-3'}`}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {isDoc && hasDocuments && (
                    <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none ${
                      isActive ? 'bg-brand/15 text-brand' : 'bg-line text-ink-3'
                    }`}>
                      {docCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Разделитель */}
          <div className="mt-5 pt-4 border-t border-line space-y-2.5">
            <p className="field-label">Заполнено</p>
            <StatusDot label="Пациент" ok={!!(formData.patient.lastName && formData.patient.admissionDate && formData.patient.operationDate)} />
            <StatusDot label="Диагноз" ok={!!(formData.diagnosis.mainDiagnosis && formData.diagnosis.anatomicalArea)} />
            <StatusDot label="Обследования" ok={!!formData.examination.xrayDescription} />
            <StatusDot label="Операция" ok={!!formData.operation.operationVolume} />
            <StatusDot label="Врачи" ok={!!(formData.doctors.attendingName && formData.doctors.headName)} />
          </div>
        </nav>

        {/* ── Центральная панель (формы) ─────────────────────────────────── */}
        {!isDocMode && (
          <div className="flex-1 min-w-0">
            <AnimatedPane tabKey={activeTab}>
              <div className="card p-6 flex flex-col gap-6">
                {activeTab === 'patient'        && <PatientForm data={formData.patient} onChange={updatePatient} />}
                {activeTab === 'diagnosis'      && <DiagnosisForm data={formData.diagnosis} onChange={updateDiagnosis} />}
                {activeTab === 'examination'    && <ExaminationForm data={formData.examination} onChange={updateExamination} />}
                {activeTab === 'operation'      && <OperationForm data={formData.operation} onChange={updateOperation} />}
                {activeTab === 'immobilization' && <ImmobilizationForm data={formData.immobilization} onChange={updateImmobilization} />}
                {activeTab === 'doctors'        && <DoctorsForm data={formData.doctors} onChange={updateDoctors} />}

                {/* Кнопка "Далее" */}
                {NEXT_TAB[activeTab] && (
                  <div className="flex justify-end pt-2 border-t border-line">
                    <button
                      onClick={() => setActiveTab(NEXT_TAB[activeTab]!)}
                      className="btn btn-dark btn-sm flex items-center gap-1.5"
                    >
                      Далее
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </AnimatedPane>
          </div>
        )}

        {/* ── Режим документов ──────────────────────────────────────────── */}
        {isDocMode && (
          <>
            {/* Предпросмотр */}
            <div className="flex-1 min-w-0 card overflow-hidden flex flex-col">
              <DocumentPreview document={selectedDocument} onUpdate={handleDocumentUpdate} />
            </div>

            {/* Список документов */}
            <div className="w-60 shrink-0 card flex flex-col">
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-line">
                <p className="field-label mb-0">Документы</p>
                {hasDocuments && (
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="btn btn-sm text-[11px] border border-positive/30 text-positive bg-positive-light hover:bg-positive/10 px-2.5 py-1"
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                      <path d="M8 2v8M5 7l3 3 3-3M3 13h10" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    DOCX
                  </button>
                )}
              </div>
              <div className="px-3 py-3 flex-1 overflow-y-auto">
                <DocumentList
                  diaries={diaries}
                  preopEpicrisis={preopEpicrisis}
                  selectedId={selectedDocId}
                  onSelect={setSelectedDocId}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Спиннер ─────────────────────────────────────────────────────────────────

const Spinner: React.FC = () => (
  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" className="opacity-20"/>
    <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
