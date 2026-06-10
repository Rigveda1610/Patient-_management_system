export interface CaseDocument {
  id: string;
  patientId: string;
  name: string;
  type: 'case-paper' | 'medical-report' | 'prescription' | 'other';
  fileData: string; // Base64 encoded compressed image or document representation
  mimeType: string;
  uploadedAt: string;
  notes?: string;
  sizeKb: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientMobile: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: 'regular' | 'follow-up' | 'emergency';
  status: 'scheduled' | 'checked-in' | 'completed' | 'cancelled';
  reason: string;
}

export interface HistoricalRecord {
  id: string;
  patientId: string;
  date: string;
  primaryDiagnosis: string;
  finalDiagnosis: string;
  medications: string;
  notes?: string;
  doctorName: string;
}

export interface Patient {
  id: string;
  fullName: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  dateOfBirth: string; // YYYY-MM-DD
  mobileNumber: string;
  residence: string; // City / Town
  profession: string;
  primaryDiagnosis: string;
  finalDiagnosis: string;
  medicationDetails: string; // Dosage, instructions, procedures
  lastVisitDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive';
  testCasePhoto?: string; // Base64 encoded test case image photo
}

export interface PatientStats {
  totalPatients: number;
  malePatients: number;
  femalePatients: number;
  otherPatients: number;
  todayAppointments: number;
  pendingFollowups: number;
  totalDocuments: number;
  avgAge: number;
  diagnosisBreakdown: { [diagnosis: string]: number };
}
