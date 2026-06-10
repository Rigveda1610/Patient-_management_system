import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from './firebase';
import { Patient, Appointment, CaseDocument, HistoricalRecord } from './types';
import { generateMockPatients, generateMockAppointments, generateMockDocuments, generateMockHistory } from './mockData';

const LOCAL_PATIENTS_KEY = 'pms_local_patients';
const LOCAL_APPOINTMENTS_KEY = 'pms_local_appointments';
const LOCAL_DOCUMENTS_PREFIX = 'pms_local_docs_';
const LOCAL_HISTORY_PREFIX = 'pms_local_hist_';

// Initialize LocalStorage with mock data if empty
export function initializeLocalStorageIfNeeded() {
  if (typeof window === 'undefined') return;
  
  if (!localStorage.getItem(LOCAL_PATIENTS_KEY)) {
    const freshPatients = generateMockPatients();
    localStorage.setItem(LOCAL_PATIENTS_KEY, JSON.stringify(freshPatients));
    
    const freshAppts = generateMockAppointments(freshPatients);
    localStorage.setItem(LOCAL_APPOINTMENTS_KEY, JSON.stringify(freshAppts));
    
    // Seed initial docs & history for the first few patients
    for (let i = 0; i < 5; i++) {
      const pid = freshPatients[i].id;
      localStorage.setItem(`${LOCAL_DOCUMENTS_PREFIX}${pid}`, JSON.stringify(generateMockDocuments(pid)));
      localStorage.setItem(`${LOCAL_HISTORY_PREFIX}${pid}`, JSON.stringify(generateMockHistory(pid, freshPatients[i])));
    }
  }
}

// Ensure database is initialized before running operations
initializeLocalStorageIfNeeded();

// --- Clinical Data API Services ---

export async function getPatients(): Promise<Patient[]> {
  if (isFirebaseConfigured && db) {
    const colPath = 'patients';
    try {
      const q = query(collection(db, colPath), orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      const list: Patient[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Patient);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colPath);
      return [];
    }
  } else {
    // LocalStorage Access
    const data = localStorage.getItem(LOCAL_PATIENTS_KEY);
    return data ? JSON.parse(data) : [];
  }
}

export async function addPatient(patient: Patient): Promise<void> {
  if (isFirebaseConfigured && db) {
    const path = `patients`;
    try {
      await setDoc(doc(db, path, patient.id), { ...patient });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${path}/${patient.id}`);
    }
  } else {
    const patients = await getPatients();
    patients.unshift(patient);
    localStorage.setItem(LOCAL_PATIENTS_KEY, JSON.stringify(patients));
  }
}

export async function updatePatient(patient: Patient): Promise<void> {
  if (isFirebaseConfigured && db) {
    const path = `patients`;
    try {
      const docRef = doc(db, path, patient.id);
      await updateDoc(docRef, { ...patient });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${path}/${patient.id}`);
    }
  } else {
    const patients = await getPatients();
    const idx = patients.findIndex(p => p.id === patient.id);
    if (idx !== -1) {
      patients[idx] = patient;
      localStorage.setItem(LOCAL_PATIENTS_KEY, JSON.stringify(patients));
    }
  }
}

export async function deletePatient(patientId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const path = `patients`;
    try {
      await deleteDoc(doc(db, path, patientId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${path}/${patientId}`);
    }
  } else {
    const patients = await getPatients();
    const updated = patients.filter(p => p.id !== patientId);
    localStorage.setItem(LOCAL_PATIENTS_KEY, JSON.stringify(updated));
    
    // Clean up associated appointments, history and docs
    const appts = await getAppointments();
    const filteredAppts = appts.filter(a => a.patientId !== patientId);
    localStorage.setItem(LOCAL_APPOINTMENTS_KEY, JSON.stringify(filteredAppts));
    
    localStorage.removeItem(`${LOCAL_DOCUMENTS_PREFIX}${patientId}`);
    localStorage.removeItem(`${LOCAL_HISTORY_PREFIX}${patientId}`);
  }
}

// --- Appointments API Services ---

export async function getAppointments(): Promise<Appointment[]> {
  if (isFirebaseConfigured && db) {
    const colPath = 'appointments';
    try {
      const q = query(collection(db, colPath), orderBy('date', 'asc'));
      const snapshot = await getDocs(q);
      const list: Appointment[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Appointment);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colPath);
      return [];
    }
  } else {
    const data = localStorage.getItem(LOCAL_APPOINTMENTS_KEY);
    return data ? JSON.parse(data) : [];
  }
}

export async function addAppointment(appt: Appointment): Promise<void> {
  if (isFirebaseConfigured && db) {
    const path = `appointments`;
    try {
      await setDoc(doc(db, path, appt.id), { ...appt });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${path}/${appt.id}`);
    }
  } else {
    const appts = await getAppointments();
    appts.push(appt);
    appts.sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff === 0) return a.time.localeCompare(b.time);
      return dateDiff;
    });
    localStorage.setItem(LOCAL_APPOINTMENTS_KEY, JSON.stringify(appts));
  }
}

export async function updateAppointment(appt: Appointment): Promise<void> {
  if (isFirebaseConfigured && db) {
    const path = `appointments`;
    try {
      const docRef = doc(db, path, appt.id);
      await updateDoc(docRef, { ...appt });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${path}/${appt.id}`);
    }
  } else {
    const appts = await getAppointments();
    const idx = appts.findIndex(a => a.id === appt.id);
    if (idx !== -1) {
      appts[idx] = appt;
      localStorage.setItem(LOCAL_APPOINTMENTS_KEY, JSON.stringify(appts));
    }
  }
}

export async function deleteAppointment(apptId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const path = `appointments`;
    try {
      await deleteDoc(doc(db, path, apptId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${path}/${apptId}`);
    }
  } else {
    const appts = await getAppointments();
    const updated = appts.filter(a => a.id !== apptId);
    localStorage.setItem(LOCAL_APPOINTMENTS_KEY, JSON.stringify(updated));
  }
}

// --- Historical Records API Services ---

export async function getHistory(patientId: string): Promise<HistoricalRecord[]> {
  if (isFirebaseConfigured && db) {
    const colPath = `patients/${patientId}/history`;
    try {
      const q = query(collection(db, colPath), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const list: HistoricalRecord[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as HistoricalRecord);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colPath);
      return [];
    }
  } else {
    const key = `${LOCAL_HISTORY_PREFIX}${patientId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }
}

export async function addHistoryRecord(record: HistoricalRecord): Promise<void> {
  if (isFirebaseConfigured && db) {
    const path = `patients/${record.patientId}/history`;
    try {
      await setDoc(doc(db, path, record.id), { ...record });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${path}/${record.id}`);
    }
  } else {
    const list = await getHistory(record.patientId);
    list.unshift(record);
    localStorage.setItem(`${LOCAL_HISTORY_PREFIX}${record.patientId}`, JSON.stringify(list));
  }
}

// --- Documents / Clinical Attachments API Services ---

export async function getDocuments(patientId: string): Promise<CaseDocument[]> {
  if (isFirebaseConfigured && db) {
    const colPath = `patients/${patientId}/documents`;
    try {
      const q = query(collection(db, colPath), orderBy('uploadedAt', 'desc'));
      const snapshot = await getDocs(q);
      const list: CaseDocument[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as CaseDocument);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, colPath);
      return [];
    }
  } else {
    const key = `${LOCAL_DOCUMENTS_PREFIX}${patientId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }
}

export async function addDocument(document: CaseDocument): Promise<void> {
  if (isFirebaseConfigured && db) {
    const path = `patients/${document.patientId}/documents`;
    try {
      await setDoc(doc(db, path, document.id), { ...document });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${path}/${document.id}`);
    }
  } else {
    const list = await getDocuments(document.patientId);
    list.unshift(document);
    localStorage.setItem(`${LOCAL_DOCUMENTS_PREFIX}${document.patientId}`, JSON.stringify(list));
  }
}

export async function deleteDocument(patientId: string, docId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const path = `patients/${patientId}/documents`;
    try {
      await deleteDoc(doc(db, path, docId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${path}/${docId}`);
    }
  } else {
    const list = await getDocuments(patientId);
    const updated = list.filter(d => d.id !== docId);
    localStorage.setItem(`${LOCAL_DOCUMENTS_PREFIX}${patientId}`, JSON.stringify(updated));
  }
}
