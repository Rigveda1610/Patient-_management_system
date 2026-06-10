import { Patient, Appointment, CaseDocument, HistoricalRecord } from './types';

// Lists of medical and demographic options for random generation of 1050 records
const firstNamesM = ['John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian', 'George', 'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin'];
const firstNamesF = ['Mary', 'Patricia', 'Jennifer', 'Elizabeth', 'Linda', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Dorothy', 'Kimberly', 'Emily', 'Donna', 'Michelle', 'Carol', 'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia', 'Kathleen', 'Amy', 'Shirley', 'Angela', 'Helen', 'Anna', 'Brenda', 'Pamela', 'Nicole', 'Samantha'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'];

const residences = ['Downtown Heights', 'Green Valley', 'Maplewood', 'Oakridge', 'Riverside', 'Sunset Hills', 'Westside', 'East End', 'Parkview', 'Lakeside Ridge', 'Northwood', 'Pinecrest'];
const professions = ['Software Engineer', 'Teacher', 'Accountant', 'Nurse', 'Sales Manager', 'Retired', 'Student', 'Homemaker', 'Business Owner', 'Electrician', 'Plumber', 'Chef', 'Architect', 'Civil Servant', 'Banker', 'Driver'];

const commonDiagnoses = [
  { primary: 'Hypertension', final: 'Essential Hypertension (Stage I)', medication: 'Tab. Amlodipine 5mg OD, Tab. Telmisartan 40mg OD' },
  { primary: 'Diabetes Mellitus', final: 'Type 2 Diabetes Mellitus', medication: 'Tab. Metformin 500mg BD after meals, Diet control' },
  { primary: 'Bronchial Asthma', final: 'Mild Persistent Bronchial Asthma', medication: 'Budecort Inhaler 200mcg - 1 puff BD, Tab. Montelukast 10mg HS' },
  { primary: 'Acute Pharyngitis', final: 'Viral Pharyngitis with acute rhinitis', medication: 'Tab. Paracetamol 650mg TDS PRN, Warm saline water gargles' },
  { primary: 'Gastroenteritis', final: 'Acute Bacterial Gastroenteritis', medication: 'Cap. Ofloxacin-Ornidazole BD x 5 days, ORS sachets' },
  { primary: 'Osteoarthritis', final: 'Bilateral Knee Osteoarthritis (Grade II)', medication: 'Tab. glucosamine-chondroitin OD, Gel Diclofenac local application' },
  { primary: 'Allergic Rhinitis', final: 'Seasonal Allergic Rhinitis', medication: 'Tab. Levocetirizine 5mg HS x 10 days, Fluticasone Nasal Spray OD' },
  { primary: 'Anemia', final: 'Iron Deficiency Anemia', medication: 'Tab. Ferrous Ascorbate + Folic Acid OD x 3 months' },
  { primary: 'Hyperlipidemia', final: 'Mixed Hyperlipidemia', medication: 'Tab. Atorvastatin 20mg HS, Low-fat diet' },
  { primary: 'GERD', final: 'Gastroesophageal Reflux Disease with mild esophagitis', medication: 'Cap. Pantoprazole 40mg OM before meals x 4 weeks' },
  { primary: 'UTI', final: 'Acute Uncomplicated Urinary Tract Infection', medication: 'Tab. Nitrofurantoin 100mg BD x 5 days, High fluid intake' },
  { primary: 'Migraine', final: 'Common Migraine without aura', medication: 'Tab. Naproxen 500mg PRN at onset, Tab. Flunarizine 5mg HS' },
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

// Generates 1,050 patients for advanced analytics testing
export function generateMockPatients(): Patient[] {
  const patients: Patient[] = [];
  const now = new Date();
  
  for (let i = 1; i <= 1050; i++) {
    const isMale = Math.random() > 0.45;
    const isFemale = !isMale && Math.random() > 0.1;
    const sex: 'Male' | 'Female' | 'Other' = isMale ? 'Male' : (isFemale ? 'Female' : 'Other');
    
    const firstName = sex === 'Male' 
      ? getRandomItem(firstNamesM) 
      : (sex === 'Female' ? getRandomItem(firstNamesF) : getRandomItem([...firstNamesM, ...firstNamesF]));
    const lastName = getRandomItem(lastNames);
    const fullName = `${firstName} ${lastName}`;
    
    const age = Math.floor(Math.random() * 75) + 5; // ages 5 to 80
    // Date of Birth approximate
    const birthYear = now.getFullYear() - age;
    const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const dateOfBirth = `${birthYear}-${birthMonth}-${birthDay}`;
    
    // Mobile number
    const mobileNumber = `+1 (${Math.floor(Math.random() * 900) + 100}) 555-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    
    const dx = getRandomItem(commonDiagnoses);
    const residence = getRandomItem(residences);
    const profession = age < 18 ? 'Student' : (age > 65 ? 'Retired' : getRandomItem(professions));
    
    // Visit dates in the last year
    const lastVisitDate = getRandomDate(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()), now);
    const createdAt = getRandomDate(new Date(now.getFullYear() - 1, now.getMonth() - 2, now.getDate()), new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()));
    
    patients.push({
      id: `p_${10000 + i}`,
      fullName,
      age,
      sex,
      dateOfBirth,
      mobileNumber,
      residence,
      profession,
      primaryDiagnosis: dx.primary,
      finalDiagnosis: dx.final,
      medicationDetails: dx.medication,
      lastVisitDate,
      createdAt,
      updatedAt: lastVisitDate,
      status: Math.random() > 0.08 ? 'active' : 'inactive',
    });
  }

  // Ensure first few entries are recognizable for quick UI listing
  patients[0] = {
    id: 'p_10001',
    fullName: 'Robert Harrison',
    age: 54,
    sex: 'Male',
    dateOfBirth: '1972-04-12',
    mobileNumber: '+1 (415) 555-0199',
    residence: 'Sunset Hills',
    profession: 'Software Architect',
    primaryDiagnosis: 'Hypertension',
    finalDiagnosis: 'Essential Hypertension (Stage II) with mild left ventricular hypertrophy',
    medicationDetails: 'Tab. Amlodipine 5mg OD (早上), Tab. Losartan 50mg OD (晚上), Diet low in sodium',
    lastVisitDate: '2026-06-05',
    createdAt: '2025-06-01',
    updatedAt: '2026-06-05',
    status: 'active',
  };

  patients[1] = {
    id: 'p_10002',
    fullName: 'Sarah Jenkins',
    age: 39,
    sex: 'Female',
    dateOfBirth: '1987-11-23',
    mobileNumber: '+1 (650) 555-0143',
    residence: 'Green Valley',
    profession: 'School Teacher',
    primaryDiagnosis: 'Diabetes Mellitus',
    finalDiagnosis: 'Type 2 Diabetes Mellitus - newly diagnosed',
    medicationDetails: 'Tab. Metformin 500mg BD after lunch and dinner, Regular glucose monitoring, diabetic diet',
    lastVisitDate: '2026-06-08',
    createdAt: '2025-08-10',
    updatedAt: '2026-06-08',
    status: 'active',
  };

  patients[2] = {
    id: 'p_10003',
    fullName: 'Emily Rose Rodriguez',
    age: 28,
    sex: 'Female',
    dateOfBirth: '1998-02-15',
    mobileNumber: '+1 (510) 555-0821',
    residence: 'Downtown Heights',
    profession: 'Graphic Designer',
    primaryDiagnosis: 'Bronchial Asthma',
    finalDiagnosis: 'Allergic Asthma provoked by pollen/dust',
    medicationDetails: 'Budecort Inhaler 200mcg - 2 puffs BD, Ventolin inhaler 100mcg - 2 puffs SOS as rescue inhaler',
    lastVisitDate: '2026-05-20',
    createdAt: '2025-11-04',
    updatedAt: '2026-05-20',
    status: 'active',
  };

  // Sort by updatedAt descending initially so newest visits show first
  return patients.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function generateMockAppointments(patients: Patient[]): Appointment[] {
  const appointments: Appointment[] = [];
  const now = new Date();
  
  // Create 5 appointments for today
  const todayStr = now.toISOString().split('T')[0];
  const types: ('regular' | 'follow-up' | 'emergency')[] = ['regular', 'follow-up', 'emergency'];
  const times = ['09:00', '10:15', '11:30', '14:00', '15:30', '16:45'];
  
  for (let i = 0; i < 5; i++) {
    const patient = patients[i];
    appointments.push({
      id: `apt_today_${i}`,
      patientId: patient.id,
      patientName: patient.fullName,
      patientMobile: patient.mobileNumber,
      date: todayStr,
      time: times[i] || '10:00',
      type: i === 1 ? 'follow-up' : (i === 3 ? 'emergency' : 'regular'),
      status: i < 2 ? 'completed' : 'scheduled',
      reason: i === 1 ? 'Routine Diabetic Followup' : (i === 3 ? 'Acute shortness of breath' : 'General clinical checkup'),
    });
  }

  // Create 15 future/past appointments
  for (let i = 5; i < 20; i++) {
    const patient = patients[i];
    const offsetDays = Math.floor(Math.random() * 10) - 5; // -5 to +5 days
    const dateObj = new Date();
    dateObj.setDate(now.getDate() + offsetDays);
    const dateStr = dateObj.toISOString().split('T')[0];
    
    // skip zero offset to avoid today duplication
    if (offsetDays === 0) continue;

    appointments.push({
      id: `apt_${1000 + i}`,
      patientId: patient.id,
      patientName: patient.fullName,
      patientMobile: patient.mobileNumber,
      date: dateStr,
      time: getRandomItem(times),
      type: getRandomItem(types),
      status: offsetDays < 0 ? 'completed' : 'scheduled',
      reason: 'General follow-up consultation',
    });
  }

  return appointments.sort((a, b) => {
    const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateDiff === 0) return a.time.localeCompare(b.time);
    return dateDiff;
  });
}

export function generateMockHistory(patientId: string, currentPatient: Patient): HistoricalRecord[] {
  return [
    {
      id: `hist_${patientId}_1`,
      patientId,
      date: '2025-06-15',
      primaryDiagnosis: currentPatient.primaryDiagnosis,
      finalDiagnosis: 'Initial presentation with mild symptoms',
      medications: currentPatient.medicationDetails,
      notes: 'Patient reported feeling mild fatigue and occasional discomfort. Blood pressure: 135/85. Instructed to maintain active journal and monitor symptoms daily.',
      doctorName: 'Dr. Tipre Acupuncture Expert'
    },
    {
      id: `hist_${patientId}_2`,
      patientId,
      date: '2025-11-20',
      primaryDiagnosis: currentPatient.primaryDiagnosis,
      finalDiagnosis: currentPatient.finalDiagnosis,
      medications: currentPatient.medicationDetails,
      notes: 'Follow-up consultation. Patient is highly compliant with medication. Clinical vitals within physiological limits. Advised to continue same therapeutic line.',
      doctorName: 'Dr. Tipre Acupuncture Expert'
    }
  ];
}

export function generateMockDocuments(patientId: string): CaseDocument[] {
  // Return some preloaded document representations (using custom minimal base64 or placeholders)
  return [
    {
      id: `doc_${patientId}_1`,
      patientId,
      name: 'Initial Case Paper - June 2025.jpg',
      type: 'case-paper',
      fileData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="40%" font-family="sans-serif" font-size="12" fill="%236b7280" text-anchor="middle">Initial Case Sheet</text><text x="50%" y="60%" font-family="monospace" font-size="10" fill="%239ca3af" text-anchor="middle">Click to View</text></svg>',
      mimeType: 'image/svg+xml',
      uploadedAt: '2025-06-15',
      notes: 'Scanned cover page of intake documents and initial diagnostic check list.',
      sizeKb: 45
    },
    {
      id: `doc_${patientId}_2`,
      patientId,
      name: 'Diagnostic Blood Panel.pdf',
      type: 'medical-report',
      fileData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="100%" height="100%" fill="%23eff6ff"/><text x="50%" y="40%" font-family="sans-serif" font-size="12" fill="%233b82f6" text-anchor="middle">CBC & Lipid Panel</text><text x="50%" y="60%" font-family="monospace" font-size="10" fill="%2393c5fd" text-anchor="middle">PDF Document</text></svg>',
      mimeType: 'image/svg+xml',
      uploadedAt: '2025-11-22',
      notes: 'Cholesterol panel, complete blood counts, and metabolic activity summary.',
      sizeKb: 120
    }
  ];
}
