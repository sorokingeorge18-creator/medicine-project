// ============================================================
// Типы данных для медицинского приложения
// Травматология / Ортопедия
// ============================================================

/** Пол пациента */
export type Gender = 'female' | 'male';

/** Тип конечности */
export type LimbType = 'upper' | 'lower';

/** Данные пациента */
export interface PatientData {
  lastName: string;
  firstName: string;
  middleName: string;
  birthDate: string;
  admissionDate: string;
  admissionTime: string;
  operationDate: string;
  dischargeDate: string;
  gender: Gender;
  examinationTime: string; // время осмотра, по умолчанию "10:00"
}

/** Сторона поражения */
export type Side = 'right' | 'left';

/** Внешняя причина травмы */
export type InjuryCause =
  | 'household'
  | 'road'
  | 'sport'
  | 'criminal'
  | 'industrial'
  | 'other';

/** Данные диагноза */
export interface DiagnosisData {
  mainDiagnosis: string;
  anatomicalArea: string;
  localisArea: string;    // область в родительном падеже: "плечевого сустава"
  limbType: LimbType;     // верхняя / нижняя конечность
  side: Side;
  injuryCause: InjuryCause;
  comorbidities: string;
}

/** Данные обследований */
export interface ExaminationData {
  xrayDescription: string;
  ctPerformed: boolean;
  ctDescription: string;
}

/** Данные операции */
export interface OperationData {
  operationName: string;
  operationVolume: string;
  anesthesia: string;
}

/** Тип послеоперационной фиксации */
export type PostOpFixationType = 'none' | 'cast' | 'sling' | 'deso' | 'other';

/** Данные иммобилизации */
export interface ImmobilizationData {
  castOnAdmission: boolean;
  castDescription: string;
  postOpFixation: PostOpFixationType;
  fixationDescription: string;
}

/** Данные врачей */
export interface DoctorsData {
  residentName: string;   // Клин. ординатор
  attendingName: string;  // Врач (лечащий)
  headName: string;       // Зав. отделением
}

/** Полные данные формы */
export interface FormData {
  patient: PatientData;
  diagnosis: DiagnosisData;
  examination: ExaminationData;
  operation: OperationData;
  immobilization: ImmobilizationData;
  doctors: DoctorsData;
}

/** Тип дневника */
export type DiaryType = 'regular' | 'withHead' | 'preop';

/** Запись дневника / документа */
export interface DiaryEntry {
  id: string;
  date: string;
  type: DiaryType;
  title: string;
  content: string;
  isPostOp: boolean;
  isEdited: boolean;
}

/** Сохранённый случай пациента */
export interface SavedCase {
  id: string;
  name: string;
  savedAt: string;
  formData: FormData;
}

/** Показатели жизнедеятельности */
export interface VitalSigns {
  bpSystolic: number;
  bpDiastolic: number;
  pulse: number;
  rr: number;
  temperature: number;
}
