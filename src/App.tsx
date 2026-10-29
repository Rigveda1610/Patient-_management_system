import React, { useState, useEffect, useMemo } from 'react';
import { Patient, Appointment, PatientStats } from './types';
import { 
  getPatients, 
  addPatient, 
  updatePatient, 
  deletePatient, 
  getAppointments, 
  addAppointment, 
  updateAppointment, 
  deleteAppointment 
} from './patientService';
import { auth, isFirebaseConfigured } from './firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import type { User } from 'firebase/auth';

import DashboardStats from './components/DashboardStats';
import PatientForm from './components/PatientForm';
import AppointmentsList from './components/AppointmentsList';
import PatientDetailView from './components/PatientDetailView';
import ExcelPdfExport from './components/ExcelPdfExport';
import ClinicLogo from './components/ClinicLogo';

import { 
  Users, Stethoscope, Search, Plus, Filter, 
  Grid, Calendar, ChevronLeft, ChevronRight, AlertCircle, 
  ArrowUpDown, BadgeCheck, CloudOff, CloudLightning 
} from 'lucide-react';

function PatientDashboard() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients' | 'appointments'>('dashboard');
  
  // Real patient collections
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // App-wide loading flags
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter conditions
  const [searchQuery, setSearchQuery] = useState('');
  const [sexFilter, setSexFilter] = useState<string>('All');
  const [residenceFilter, setResidenceFilter] = useState<string>('All');
  const [diagnoseFilter, setDiagnoseFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'visit' | 'name' | 'age-asc' | 'age-desc'>('visit');

  // Selected patient for expanded Electronic Health Record (EHR) view
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // Patient detail Form (Add/Edit) state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);

  // Pagination states (Critical for high scalability - 1000+ patient lists!)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Global loading trigger
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const pts = await getPatients();
        setPatients(pts);

        const apts = await getAppointments();
        setAppointments(apts);
      } catch (err) {
        console.error("Clinical fetching failed:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Sync details if viewing patient currently being updated
  const activeViewingPatient = useMemo(() => {
    if (!selectedPatient) return null;
    return patients.find(p => p.id === selectedPatient.id) || selectedPatient;
  }, [patients, selectedPatient]);

  // Unique lists computed for filters dropdown lists
  const availableResidences = useMemo(() => {
    const list = new Set<string>();
    patients.forEach(p => { if (p.residence) list.add(p.residence); });
    return Array.from(list).sort();
  }, [patients]);

  const availableDiagnoses = useMemo(() => {
    const list = new Set<string>();
    patients.forEach(p => { if (p.primaryDiagnosis) list.add(p.primaryDiagnosis); });
    return Array.from(list).sort().slice(0, 15); // cap options for sanity
  }, [patients]);

  // Filter & sort patients list based on selections
  const filteredAndSortedPatients = useMemo(() => {
    let result = [...patients];

    // Search matches: Full Name, ID or Mobile
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.fullName.toLowerCase().includes(q) || 
        p.id.toLowerCase().includes(q) || 
        p.mobileNumber.toLowerCase().includes(q)
      );
    }

    // Gender Filter
    if (sexFilter !== 'All') {
      result = result.filter(p => p.sex === sexFilter);
    }

    // Residence Filter
    if (residenceFilter !== 'All') {
      result = result.filter(p => p.residence === residenceFilter);
    }

    // Diagnosis Filter
    if (diagnoseFilter !== 'All') {
      result = result.filter(p => p.primaryDiagnosis === diagnoseFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.fullName.localeCompare(b.fullName);
      } else if (sortBy === 'age-asc') {
        return a.age - b.age;
      } else if (sortBy === 'age-desc') {
        return b.age - a.age;
      } else {
        // visit date (newest first)
        return new Date(b.lastVisitDate).getTime() - new Date(a.lastVisitDate).getTime();
      }
    });

    return result;
  }, [patients, searchQuery, sexFilter, residenceFilter, diagnoseFilter, sortBy]);

  // Paginated patients for table representation
  const paginatedPatients = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedPatients.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredAndSortedPatients, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedPatients.length / itemsPerPage);

  // Reset page number on search & filter updates
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sexFilter, residenceFilter, diagnoseFilter]);

  // Aggregate stats payload for widgets
  const computedStats: PatientStats = useMemo(() => {
    const count = patients.length;
    const males = patients.filter(p => p.sex === 'Male').length;
    const females = patients.filter(p => p.sex === 'Female').length;
    const others = count - males - females;
    
    const totalAge = patients.reduce((sum, p) => sum + p.age, 0);
    const avgAge = count > 0 ? Math.round(totalAge / count) : 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayAptsCount = appointments.filter(a => a.date === todayStr).length;

    // Diagnosis breakdown
    const breakdown: { [key: string]: number } = {};
    patients.forEach(p => {
      breakdown[p.primaryDiagnosis] = (breakdown[p.primaryDiagnosis] || 0) + 1;
    });

    return {
      totalPatients: count,
      malePatients: males,
      femalePatients: females,
      otherPatients: others,
      todayAppointments: todayAptsCount,
      pendingFollowups: appointments.filter(a => a.status === 'scheduled').length,
      totalDocuments: 12, // cached approximation
      avgAge,
      diagnosisBreakdown: breakdown,
    };
  }, [patients, appointments]);

  // CRUDS Triggers

  const handleCreateOrUpdatePatient = async (patient: Patient) => {
    const exists = patients.some(p => p.id === patient.id);
    if (exists) {
      await updatePatient(patient);
      setPatients(prev => prev.map(p => p.id === patient.id ? patient : p));
    } else {
      await addPatient(patient);
      setPatients(prev => [patient, ...prev]);
    }
  };

  const handleDeletePatientRecord = async (pid: string) => {
    if (confirm('CRITICAL ACTION: Are you sure you want to permanently delete this patient record and all their associated medical history logs? This cannot be undone.')) {
      await deletePatient(pid);
      setPatients(prev => prev.filter(p => p.id !== pid));
      if (selectedPatient?.id === pid) {
        setSelectedPatient(null);
      }
    }
  };

  const handleCreateAppointment = async (appt: Appointment) => {
    await addAppointment(appt);
    setAppointments(prev => [appt, ...prev].sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff === 0) return a.time.localeCompare(b.time);
      return dateDiff;
    }));
  };

  const handleUpdateAppointment = async (appt: Appointment) => {
    await updateAppointment(appt);
    setAppointments(prev => prev.map(a => a.id === appt.id ? appt : a));
  };

  const handleDeleteAppointmentRecord = async (apptId: string) => {
    await deleteAppointment(apptId);
    setAppointments(prev => prev.filter(a => a.id !== apptId));
  };

  return (
    <div className="min-h-screen bg-[#0c0d10] text-slate-300 font-sans flex flex-col antialiased">
      
      {/* Clinic System Topbar */}
      <header className="bg-[#14171c] border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-3">
          
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setSelectedPatient(null); setActiveTab('dashboard'); }}>
            <ClinicLogo variant="compact" />
          </div>

          {/* Database System Sync Indicator */}
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
              isFirebaseConfigured 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]' 
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {isFirebaseConfigured ? (
                <>
                  <CloudLightning className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cloud Persistent (Firebase DB)</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-amber-500" />
                  <span>Secure Local Database (Seeded 1,000+ files)</span>
                </>
              )}
            </div>

            <div className="text-right text-xs shrink-0 select-none">
              <span className="font-bold text-slate-200 block">Dr. Tipre <span className="text-[10px] text-emerald-400 font-semibold">(Acupuncture Expert)</span></span>
              <span className="text-[9px] text-slate-500 font-medium">Chief Acupuncturist</span>
            </div>
          </div>

        </div>
      </header>

      {/* Roster & Dashboard tabs navigator */}
      <nav className="bg-[#14171c] border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 text-sm py-1.5">
            <button 
              onClick={() => { setSelectedPatient(null); setActiveTab('dashboard'); }}
              className={`pb-2 pt-2 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'dashboard' && !selectedPatient ? 'border-emerald-500 text-emerald-400 font-black' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              📊 Stats Dashboard
            </button>
            <button 
              onClick={() => { setSelectedPatient(null); setActiveTab('patients'); }}
              className={`pb-2 pt-2 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'patients' || selectedPatient ? 'border-emerald-500 text-emerald-400 font-black' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              👥 Patients Registry ({patients.length})
            </button>
            <button 
              onClick={() => { setSelectedPatient(null); setActiveTab('appointments'); }}
              className={`pb-2 pt-2 px-1 border-b-2 font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'appointments' && !selectedPatient ? 'border-emerald-500 text-emerald-400 font-black' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              📅 Consultations Lineup
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-400">Decrypting medical data vaults...</p>
          </div>
        ) : (
          
          <div className="space-y-8">
            
            {/* If a patient EHR file is selected, show detail views */}
            {activeViewingPatient ? (
              <PatientDetailView 
                patient={activeViewingPatient} 
                onBack={() => setSelectedPatient(null)} 
                onEdit={() => {
                  setPatientToEdit(activeViewingPatient);
                  setIsFormOpen(true);
                }}
              />
            ) : (
              
              // Standard listings / stats
              <>
                {activeTab === 'dashboard' && (
                  <div className="space-y-8">
                    <DashboardStats patients={patients} appointments={appointments} />
                    <ExcelPdfExport patients={patients} stats={computedStats} />
                  </div>
                )}

                {activeTab === 'patients' && (
                  <div className="space-y-6">
                    
                    {/* Header Action bar for registry panel */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-black text-white tracking-tight">Active Clinical Patient Registry</h2>
                        <p className="text-xs text-slate-400">Manage, query, and review diagnostics files of clinic cohorts.</p>
                      </div>

                      <button 
                        onClick={() => { setPatientToEdit(null); setIsFormOpen(true); }}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-950/30 text-xs font-bold transition-all self-end sm:self-auto"
                      >
                        <Plus className="w-4 h-4 text-black" strokeWidth={3} />
                        <span className="text-black">Register Patient Profile</span>
                      </button>
                    </div>

                    {/* Searches and precise filter cards */}
                    <div className="bg-[#1a1d23] p-5 border border-slate-800 shadow-md rounded-2xl space-y-4">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">
                        <Filter className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Filter &amp; Query Database Matrix</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 text-xs font-bold text-slate-400">
                        
                        {/* Search keyword query */}
                        <div className="space-y-1 sm:col-span-1 lg:col-span-1">
                          <label className="text-slate-400">Search Patients</label>
                          <div className="relative mt-1">
                            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
                            <input 
                              type="text" 
                              placeholder="Name, ID, Phone..." 
                              className="w-full pl-8.5 pr-3 py-2 border border-slate-700 rounded-xl bg-[#0c0d10] text-[#cbd5e1] placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 font-medium"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Sex Filter */}
                        <div className="space-y-1">
                          <label className="text-slate-400">Sex Assigned</label>
                          <select 
                            className="w-full mt-1 p-2 border border-slate-700 rounded-xl bg-[#0c0d10] text-[#cbd5e1] focus:outline-none focus:border-emerald-500/50 font-semibold"
                            value={sexFilter}
                            onChange={(e) => setSexFilter(e.target.value)}
                          >
                            <option value="All">All Genders</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {/* Region Filter */}
                        <div className="space-y-1">
                          <label className="text-slate-400">Residence Hub</label>
                          <select 
                            className="w-full mt-1 p-2 border border-slate-700 rounded-xl bg-[#0c0d10] text-[#cbd5e1] focus:outline-none focus:border-emerald-500/50 font-semibold"
                            value={residenceFilter}
                            onChange={(e) => setResidenceFilter(e.target.value)}
                          >
                            <option value="All">All Locations</option>
                            {availableResidences.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>

                        {/* Diagnosis Filter */}
                        <div className="space-y-1">
                          <label className="text-slate-400">Clinical Diagnosis</label>
                          <select 
                            className="w-full mt-1 p-2 border border-slate-700 rounded-xl bg-[#0c0d10] text-[#cbd5e1] focus:outline-none focus:border-emerald-500/50 font-semibold"
                            value={diagnoseFilter}
                            onChange={(e) => setDiagnoseFilter(e.target.value)}
                          >
                            <option value="All">All Diagnoses</option>
                            {availableDiagnoses.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>

                        {/* Sorting Selection */}
                        <div className="space-y-1 col-span-1">
                          <label className="text-slate-400">Sort Record Order</label>
                          <select 
                            className="w-full mt-1 p-2 border border-slate-700 rounded-xl bg-[#0c0d10] text-[#cbd5e1] focus:outline-none focus:border-emerald-500/50 font-semibold"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                          >
                            <option value="visit">Last Visited (Newest)</option>
                            <option value="name">Patient Name (A-Z)</option>
                            <option value="age-desc">Age (Senior Cohorts)</option>
                            <option value="age-asc">Age (Junior Cohorts)</option>
                          </select>
                        </div>

                      </div>
                    </div>

                    {/* Patient Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paginatedPatients.map((p) => (
                        <div 
                          key={p.id} 
                          className="bg-[#1a1d23] border border-slate-800 hover:border-emerald-500/30 hover:shadow-lg transition-all rounded-2xl p-5 flex flex-col justify-between space-y-4 cursor-pointer"
                          onClick={() => setSelectedPatient(p)}
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="space-y-0.5">
                                <h3 className="font-extrabold text-white text-sm leading-tight hover:text-emerald-400 transition truncate max-w-[190px]" title={p.fullName}>
                                  {p.fullName}
                                </h3>
                                <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">ID: {p.id}</span>
                              </div>
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${p.sex === 'Male' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : (p.sex === 'Female' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20')}`}>
                                {p.sex} &middot; {p.age} yrs
                              </span>
                            </div>

                            <p className="text-xs text-rose-400 font-bold bg-rose-500/10 p-2 border border-rose-500/20 rounded-lg truncate inline-block max-w-full">
                              🩺 {p.primaryDiagnosis}
                            </p>

                            <div className="text-[11px] space-y-1 font-semibold text-slate-400">
                              <p className="truncate">🏠 {p.residence}</p>
                              <p className="truncate">📞 {p.mobileNumber}</p>
                              <p className="truncate text-slate-500 font-normal italic font-mono">{p.medicationDetails}</p>
                            </div>
                          </div>

                          <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-[10px] font-bold text-slate-500 tracking-wider uppercase font-mono">
                            <span>VISITED {p.lastVisitDate}</span>
                            <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => setSelectedPatient(p)}
                                className="px-2.5 py-1 hover:bg-slate-800 text-emerald-400 rounded-lg font-bold"
                                title="Expand EHR Card"
                              >
                                EHR File
                              </button>
                              <button 
                                onClick={() => handleDeletePatientRecord(p.id)}
                                className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md"
                                title="Purge Record"
                              >
                                Purge
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {filteredAndSortedPatients.length === 0 && (
                        <div className="col-span-full text-center py-24 bg-[#1a1d23] border border-slate-800 rounded-2xl space-y-3">
                          <Users className="w-12 h-12 stroke-1 text-slate-600 mx-auto" />
                          <h3 className="font-bold text-slate-300 text-sm">No clinical files matches found</h3>
                          <p className="text-xs text-slate-500">Try modifying your filter queries or click &quot;Register Patient Profile&quot; to begin afresh.</p>
                        </div>
                      )}
                    </div>

                    {/* Pagination index */}
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center bg-[#1a1d23] px-4 py-3 border border-slate-800 rounded-2xl text-xs font-bold text-slate-400">
                        <button 
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 border border-slate-750 bg-[#14171c] hover:bg-slate-800 text-slate-300 rounded-lg flex items-center space-x-1 disabled:opacity-50 transition"
                        >
                          <ChevronLeft className="w-4 h-4 text-emerald-400" />
                          <span>Previous</span>
                        </button>

                        <span>Page {currentPage} of {totalPages} &middot; Showing {currentPage * itemsPerPage - itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAndSortedPatients.length)} of {filteredAndSortedPatients.length} Patients</span>

                        <button 
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 border border-slate-750 bg-[#14171c] hover:bg-slate-800 text-slate-300 rounded-lg flex items-center space-x-1 disabled:opacity-50 transition"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-4 h-4 text-emerald-400" />
                        </button>
                      </div>
                    )}

                  </div>
                )}

                {activeTab === 'appointments' && (
                  <AppointmentsList 
                    appointments={appointments} 
                    patients={patients} 
                    onAddAppointment={handleCreateAppointment} 
                    onUpdateAppointment={handleUpdateAppointment} 
                    onDeleteAppointment={handleDeleteAppointmentRecord}
                  />
                )}

              </>
            )}

          </div>
        )}
      </main>

      {/* Slide / Overlay Clinic Form */}
      <PatientForm 
        isOpen={isFormOpen}
        patientToEdit={patientToEdit}
        onClose={() => { setIsFormOpen(false); setPatientToEdit(null); }}
        onSave={handleCreateOrUpdatePatient}
      />

      {/* Footer Info */}
      <footer className="bg-[#14171c] border-t border-slate-800 py-6 mt-12 select-none">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-1.5 text-[11px] font-semibold text-slate-500">
          <p>Confidential HIPAA-Inspired Patient Information Management System</p>
          <p>&copy; {new Date().getFullYear()} Clinical EHR Matrix and Consulting Diagnostics. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (!auth || !isFirebaseConfigured) {
      setCheckingAuth(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setCheckingAuth(false);
      },
      () => {
        setUser(null);
        setCheckingAuth(false);
      }
    );

    return unsubscribe;
  }, []);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!auth || !isFirebaseConfigured) {
      setError('Firebase is not configured correctly.');
      return;
    }

    setLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      setError('Login failed. Check your email and password.');
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    if (auth) {
      try {
        await signOut(auth);
      } catch {
        setError('Unable to log out. Please try again.');
      }
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Checking login...
      </div>
    );
  }

  if (!auth || !isFirebaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 text-white">
        <div className="max-w-md rounded-xl bg-slate-900 p-6 text-center">
          <h1 className="text-xl font-bold text-red-400">Firebase unavailable</h1>
          <p className="mt-2 text-slate-300">
            The application cannot verify your login. Please contact the administrator.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md space-y-5 rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-xl"
        >
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Doctor Login</h1>
            <p className="mt-2 text-sm text-slate-400">Patient Management System</p>
          </div>

          <div>
            <label
              htmlFor="doctor-email"
              className="mb-2 block text-sm text-slate-200"
            >
              Email address
            </label>
            <input
              id="doctor-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 p-3 text-white outline-none focus:border-blue-500"
              placeholder="doctor@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="doctor-password"
              className="mb-2 block text-sm text-slate-200"
            >
              Password
            </label>
            <input
              id="doctor-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 p-3 text-white outline-none focus:border-blue-500"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loggingIn}
            className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {loggingIn ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-center text-xs text-slate-400">
            Access is restricted to authorized accounts.
          </p>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-end gap-3 border-b border-slate-700 bg-slate-900 px-4 py-3 text-white">
        <span className="text-sm">{user.email}</span>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600"
        >
          Log out
        </button>
      </div>
      <PatientDashboard />
    </>
  );
}
