import React, { useState, useEffect } from 'react';
import { Patient, CaseDocument, HistoricalRecord } from '../types';
import { 
  getDocuments, 
  addDocument, 
  deleteDocument, 
  getHistory, 
  addHistoryRecord 
} from '../patientService';
import { 
  Trash2, Upload, FileText, Calendar, Plus, 
  CheckCircle, Paperclip, ChevronLeft, Image as ImageIcon, 
  FileCheck2, Eye, X, BookOpen, UserCheck, Stethoscope
} from 'lucide-react';

interface PatientDetailViewProps {
  patient: Patient;
  onBack: () => void;
  onEdit: () => void;
}

export default function PatientDetailView({ patient, onBack, onEdit }: PatientDetailViewProps) {
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [historyRecords, setHistoryRecords] = useState<HistoricalRecord[]>([]);
  
  // Progress note form states
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [primaryDx, setPrimaryDx] = useState(patient.primaryDiagnosis);
  const [finalDx, setFinalDx] = useState(patient.finalDiagnosis);
  const [medsText, setMedsText] = useState(patient.medicationDetails);
  const [noteDesc, setNoteDesc] = useState('');
  const [doctorName, setDoctorName] = useState('Dr. Tipre Acupuncture Expert');
  const [noteError, setNoteError] = useState('');

  // Scanning Document upload states
  const [uploadType, setUploadType] = useState<'case-paper' | 'medical-report' | 'prescription' | 'other'>('case-paper');
  const [uploadNotes, setUploadNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Document full screen visualizer
  const [viewingDoc, setViewingDoc] = useState<CaseDocument | null>(null);

  // Load patient specific documents and history logs
  useEffect(() => {
    async function loadSubData() {
      const docs = await getDocuments(patient.id);
      setDocuments(docs);
      
      const history = await getHistory(patient.id);
      setHistoryRecords(history);
    }
    loadSubData();
    
    // reset note form values
    setPrimaryDx(patient.primaryDiagnosis);
    setFinalDx(patient.finalDiagnosis);
    setMedsText(patient.medicationDetails);
    setNoteDesc('');
    setNoteError('');
    setShowNoteForm(false);
    setUploadError('');
    setUploadNotes('');
  }, [patient]);

  // Handle client-side canvas-based image downscaling & compression
  const compressAndProcessFile = (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadError('');

    const sizeKb = Math.round(file.size / 1024);
    
    // If it is not an image, we can read as plain text or standard dataURI, but for images we downscale!
    const isImage = file.type.startsWith('image/');

    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;

      if (isImage) {
        const img = new Image();
        img.onload = () => {
          // Canvas compression setup
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Downscale to max 1000px dimension
          const MAX_DIM = 1000;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress heavily: JPG 0.65 quality (results in highly readable ~60KB image)
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.65);
            
            saveProcessedDocument(file.name, file.type, compressedUrl, sizeKb);
          } else {
            // failed canvas drawing, save source
            saveProcessedDocument(file.name, file.type, dataUrl, sizeKb);
          }
        };
        img.onerror = () => {
          setUploadError('Failed to decode image scan file.');
          setIsUploading(false);
        };
        img.src = dataUrl;
      } else {
        // PDF or other documents (save directly)
        if (sizeKb > 1400) {
          setUploadError('Attached file exceeds 1.4MB. Please upload a smaller medical file or compressed image.');
          setIsUploading(false);
          return;
        }
        saveProcessedDocument(file.name, file.type, dataUrl, sizeKb);
      }
    };

    reader.onerror = () => {
      setUploadError('Error reading scan files.');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const saveProcessedDocument = async (name: string, mimeType: string, fileData: string, rawSizeKb: number) => {
    // estimate compressed length approximately
    const compSizeKb = Math.round((fileData.length * 3) / 4 / 1024);

    const docObj: CaseDocument = {
      id: `doc_${Date.now()}`,
      patientId: patient.id,
      name: name,
      type: uploadType,
      fileData,
      mimeType,
      uploadedAt: new Date().toISOString().split('T')[0],
      notes: uploadNotes.trim() || 'No active notes uploaded.',
      sizeKb: compSizeKb || rawSizeKb
    };

    await addDocument(docObj);
    
    // reload documents
    const updatedDocs = await getDocuments(patient.id);
    setDocuments(updatedDocs);
    
    // Reset states
    setUploadNotes('');
    setIsUploading(false);
  };

  const handleDeleteDoc = async (docId: string) => {
    if (confirm('Are you sure you want to permanently delete this attached document?')) {
      await deleteDocument(patient.id, docId);
      const updatedDocs = await getDocuments(patient.id);
      setDocuments(updatedDocs);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryDx.trim()) {
      setNoteError('Primary clinical diagnosis is required.');
      return;
    }

    const noteObj: HistoricalRecord = {
      id: `hist_${Date.now()}`,
      patientId: patient.id,
      date: new Date().toISOString().split('T')[0],
      primaryDiagnosis: primaryDx.trim(),
      finalDiagnosis: finalDx.trim() || primaryDx.trim(),
      medications: medsText.trim(),
      notes: noteDesc.trim() || 'Scheduled followup review.',
      doctorName: doctorName.trim() || 'Dr. Tipre Acupuncture Expert'
    };

    await addHistoryRecord(noteObj);

    // Reload history list
    const updatedHistory = await getHistory(patient.id);
    setHistoryRecords(updatedHistory);

    // Also optionally reflect this updated diag/med sheet in patient file! (Excellent clinical experience)
    patient.primaryDiagnosis = primaryDx.trim();
    patient.finalDiagnosis = finalDx.trim() || primaryDx.trim();
    patient.medicationDetails = medsText.trim();
    patient.lastVisitDate = new Date().toISOString().split('T')[0];

    // Reset notes builder
    setNoteDesc('');
    setShowNoteForm(false);
    setNoteError('');
  };

  // Drag and Drop files handling
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      compressAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      compressAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Return Navigation and actions bar */}
      <div className="flex justify-between items-center bg-[#14171c] p-4 border border-slate-800 rounded-2xl">
        <button 
          onClick={onBack}
          className="flex items-center space-x-1 px-3 py-1.5 hover:bg-slate-850 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition-all border border-transparent hover:border-slate-800"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Patient Roster</span>
        </button>

        <button 
          onClick={onEdit}
          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black rounded-lg text-xs font-bold transition-all"
        >
          Edit Profile Files
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Side: Demographics Info Block */}
        <div className="lg:col-span-1 bg-[#1a1d23] p-6 border border-slate-800 shadow-md rounded-2xl space-y-6 max-h-[820px] overflow-y-auto">
          <div className="text-center space-y-2 border-b border-slate-800 pb-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold mx-auto shadow-inner">
              {patient.fullName.charAt(0)}
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">{patient.fullName}</h3>
              <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase font-mono mt-0.5">ID: {patient.id}</p>
            </div>
            
            <div className="inline-flex items-center space-x-1.5 text-xs text-slate-300 font-semibold px-2.5 py-1 bg-[#14171c] border border-slate-800 rounded-full">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{patient.status === 'active' ? 'Active Records' : 'Archived'}</span>
            </div>
          </div>

          {/* Demographic Metrics mapping */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1.5">Personal Details</h4>
            
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <p className="text-slate-500">Date of Birth</p>
                <p className="text-slate-200 mt-0.5">{patient.dateOfBirth}</p>
              </div>
              <div>
                <p className="text-slate-500">Age / Gender</p>
                <p className="text-slate-200 mt-0.5">{patient.age} yrs / {patient.sex}</p>
              </div>
              <div>
                <p className="text-slate-500">Mobile Phone</p>
                <p className="text-emerald-400 mt-0.5">{patient.mobileNumber}</p>
              </div>
              <div>
                <p className="text-slate-500">Profession</p>
                <p className="text-slate-200 mt-0.5">{patient.profession}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-500">Residence / Village</p>
                <p className="text-slate-200 mt-0.5">🏠 {patient.residence}</p>
              </div>
            </div>
          </div>

          {/* Diagnostic Test Case Photo View */}
          {patient.testCasePhoto && (
            <div className="space-y-3 border-t border-slate-800 pt-5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1.5 flex items-center space-x-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Test Case Photo</span>
              </h4>
              <div 
                className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-800 bg-[#0c0d10] hover:border-emerald-500/35 transition-all shadow-md"
                onClick={() => setViewingDoc({
                  id: 'test_case_photo_id',
                  patientId: patient.id,
                  name: `${patient.fullName} - Test Case Photo`,
                  type: 'other',
                  fileData: patient.testCasePhoto!,
                  mimeType: 'image/jpeg',
                  uploadedAt: patient.updatedAt || patient.createdAt,
                  notes: 'Primary diagnostic test case/reference photograph attached in clinical files.',
                  sizeKb: Math.round((patient.testCasePhoto!.length * 3) / 4 / 1024)
                })}
              >
                <img 
                  src={patient.testCasePhoto} 
                  alt={`${patient.fullName} Case Photo`} 
                  referrerPolicy="no-referrer"
                  className="w-full h-44 object-cover transform group-hover:scale-[1.03] transition-all duration-300"
                />
                <div className="absolute inset-0 bg-[#0c0d10]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-emerald-600 text-black font-extrabold text-[10px] px-2.5 py-1 rounded-md shadow flex items-center space-x-1">
                    <Eye className="w-3 h-3 text-black font-black" />
                    <span>Enlarge Photo</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Diagnosis & Therapy Highlights */}
          <div className="space-y-4 border-t border-slate-800 pt-5">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1.5">Clinical Diagnoses</h4>
            
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-rose-450 uppercase tracking-wider text-[10px]">Primary clinical sign</span>
                <p className="text-rose-350 font-bold bg-rose-500/10 p-2.5 rounded-lg border border-rose-550/20 mt-1">
                  {patient.primaryDiagnosis}
                </p>
              </div>
              <div>
                <span className="font-bold text-slate-450 uppercase tracking-wider text-[10px]">Final Differential DX</span>
                <p className="text-slate-350 bg-slate-850 p-2.5 rounded-lg border border-slate-755 mt-1 italic">
                  {patient.finalDiagnosis}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-800 pt-5 text-xs">
            <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">Active Medication Details</span>
            <p className="text-slate-300 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 font-mono whitespace-pre-wrap leading-relaxed">
              {patient.medicationDetails}
            </p>
            <p className="text-[10px] text-slate-500">Modified Date: {patient.lastVisitDate}</p>
          </div>

        </div>

        {/* Right Side tabs & files details */}
        <div className="lg:col-span-2 space-y-6">

          {/* TAB Section 1: Progress Notes Log & Clinical History */}
          <div className="bg-[#1a1d23] p-6 border border-slate-800 shadow-md rounded-2xl">
            <div className="flex justify-between items-center border-[#1a1d23] border-b pb-4 mb-4">
              <h4 className="font-extrabold text-white text-base flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span>Clinical Consultations History</span>
              </h4>
              <button 
                onClick={() => setShowNoteForm(!showNoteForm)}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-[#14171c] text-emerald-400 border border-slate-700 hover:text-emerald-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showNoteForm ? 'Collapse Form' : 'Add Consultation Note'}</span>
              </button>
            </div>

            {/* Note logging builder */}
            {showNoteForm && (
              <form onSubmit={handleAddNote} className="space-y-4 bg-[#14171c] p-4 border border-slate-800 rounded-xl mb-6 text-xs shadow-inner">
                {noteError && <p className="text-rose-400 font-semibold mb-2">⚠️ {noteError}</p>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-350">Primary Diagnosis *</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-[#0c0d10] px-3 py-2 border border-slate-700 text-[#cbd5e1] placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none rounded-lg text-xs"
                      value={primaryDx}
                      onChange={(e) => setPrimaryDx(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-350">Final Differential DX</label>
                    <input 
                      type="text"
                      className="w-full bg-[#0c0d10] px-3 py-2 border border-slate-700 text-[#cbd5e1] placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none rounded-lg text-xs"
                      value={finalDx}
                      onChange={(e) => setFinalDx(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-350">Therapy & Prescription Updates</label>
                  <textarea 
                    rows={3}
                    className="w-full bg-[#0c0d10] px-3 py-2 border border-slate-700 text-[#cbd5e1] placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none rounded-lg text-[11px] font-mono"
                    value={medsText}
                    onChange={(e) => setMedsText(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-350">Progress Report / Vital Signs</label>
                  <textarea 
                    rows={3}
                    required
                    placeholder="Patient reports blood pressures are stable. Chest clear on auscultation. Advised next visits..."
                    className="w-full bg-[#0c0d10] px-3 py-2 border border-slate-700 text-[#cbd5e1] placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none rounded-lg text-xs"
                    value={noteDesc}
                    onChange={(e) => setNoteDesc(e.target.value)}
                  />
                </div>

                <div className="flex justify-between items-center gap-x-2">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-355 block">Doctor-in-Charge</label>
                    <input 
                      type="text"
                      required
                      className="px-3 py-1.5 border border-slate-700 bg-[#0c0d10] text-[#cbd5e1] rounded-lg text-xs focus:border-emerald-500/50"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold rounded-lg cursor-pointer transition-all shadow-md shadow-emerald-950/20"
                  >
                    Post Clinical Note
                  </button>
                </div>
              </form>
            )}

            {/* Note Records Timeline */}
            <div className="relative border-l border-slate-800 pl-4 space-y-6">
              {historyRecords.map((rec) => (
                <div key={rec.id} className="relative space-y-1 text-xs">
                  <span className="absolute -left-[21.5px] top-1 w-3 h-3 bg-emerald-500 border-2 border-[#1a1d23] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-200">{rec.primaryDiagnosis}</span>
                    <span className="text-[10px] text-slate-450 font-mono flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{rec.date}</span>
                    </span>
                  </div>
                  
                  <p className="text-[10px] text-emerald-400 font-bold">Dx Specifics: {rec.finalDiagnosis}</p>
                  <p className="text-slate-300 bg-slate-800/30 p-2.5 border border-slate-750 rounded-lg mt-1 break-words">{rec.notes}</p>
                  
                  {rec.medications && (
                    <div className="mt-1 bg-emerald-500/10 p-2.5 border border-emerald-500/20 rounded-lg">
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Prescribed</span>
                      <p className="text-slate-300 font-mono text-[10px] mt-0.5">{rec.medications}</p>
                    </div>
                  )}
                  <p className="text-[9px] text-slate-500 font-semibold mt-1">Logged by: {rec.doctorName}</p>
                </div>
              ))}

              {historyRecords.length === 0 && (
                <div className="text-center py-6 text-slate-500">
                  <Stethoscope className="w-8 h-8 stroke-1 mx-auto text-slate-700" />
                  <p className="text-xs mt-1">No historical consultations recorded yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* TAB Section 2: Scanned Documents, prescriptions & reports management */}
          <div className="bg-[#1a1d23] p-6 border border-slate-800 shadow-md rounded-2xl">
            <h4 className="font-extrabold text-white text-base mb-4 flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Paperclip className="w-5 h-5 text-emerald-400" />
              <span>Scanned Documents & Reports Archive</span>
            </h4>

            {/* Drag and Drop Box */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${dragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-[#0c0d10] hover:bg-slate-800/30'}`}
            >
              <div className="max-w-md mx-auto space-y-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-200">
                    Drag case photos, medical reports, or prescriptions here
                  </p>
                  <p className="text-[11px] text-slate-500 font-semibold">
                    Supports JPG, PNG images (auto-downscaled to save storage)
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-3 pt-2">
                  <select 
                    className="px-3 py-1.5 border border-slate-700 rounded-lg text-xs bg-[#0c0d10] text-[#cbd5e1] focus:outline-none"
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value as any)}
                  >
                    <option value="case-paper" className="bg-[#1e2229]">Case paper sheet</option>
                    <option value="medical-report" className="bg-[#1e2229]">Medical report file</option>
                    <option value="prescription" className="bg-[#1e2229]">Prescription sheet</option>
                    <option value="other" className="bg-[#1e2229]">Other reference photo</option>
                  </select>

                  <input 
                    type="file" 
                    id="clinic_file_upload"
                    className="hidden" 
                    accept="image/*,application/pdf"
                    onChange={handleFileSelect}
                  />
                  <label 
                    htmlFor="clinic_file_upload"
                    className="px-4 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold cursor-pointer transition-all border border-emerald-500/20"
                  >
                    Browse Files
                  </label>
                </div>

                <input 
                  type="text"
                  placeholder="Optional brief note about this file..."
                  className="w-full max-w-sm px-3 py-1.5 border border-slate-700 rounded-lg text-xs text-center bg-[#0c0d10] text-[#cbd5e1] focus:outline-none placeholder-slate-600"
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                />

                {isUploading && (
                  <div className="flex items-center justify-center space-x-1.5 text-xs text-emerald-400 font-semibold animate-pulse mt-3 bg-emerald-500/10 py-1.5 rounded-lg">
                    <span>Compressing & securing document scan...</span>
                  </div>
                )}

                {uploadError && (
                  <p className="text-xs text-rose-450 font-semibold bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg mt-3">⚠️ {uploadError}</p>
                )}
              </div>
            </div>

            {/* List of attachments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {documents.map((doc) => {
                const isImg = doc.fileData.includes('base64') || doc.fileData.includes('image');
                return (
                  <div key={doc.id} className="border border-slate-800 hover:border-slate-700 bg-slate-800/15 p-3 rounded-xl flex items-start justify-between gap-2 overflow-hidden transition-all">
                    <div className="flex items-start space-x-2.5 overflow-hidden">
                      <div className="p-2 bg-slate-800 text-slate-350 rounded-lg shrink-0 mt-0.5 border border-slate-700">
                        {isImg ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>

                      <div className="space-y-1 text-xs overflow-hidden">
                        <p className="font-bold text-slate-200 truncate" title={doc.name}>{doc.name}</p>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold capitalize">
                            {doc.type.replace('-', ' ')}
                          </span>
                          <span className="text-[9px] text-slate-500">{doc.sizeKb} KB</span>
                        </div>
                        {doc.notes && <p className="text-[10px] text-slate-400 italic truncate" title={doc.notes}>{doc.notes}</p>}
                        <p className="text-[9px] text-slate-500">Uploaded {doc.uploadedAt}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button 
                        onClick={() => setViewingDoc(doc)}
                        className="p-1 px-2 bg-slate-805 text-slate-300 rounded-lg hover:bg-slate-800 border border-slate-700 transition text-[10px] font-bold flex items-center space-x-1 cursor-pointer"
                        title="View Full Document Scan"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>

                      <button 
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        title="Remove Document scan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {documents.length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-500 bg-[#0c0d10]/40 border border-slate-800 rounded-xl space-y-1">
                  <FileCheck2 className="w-8 h-8 stroke-1 mx-auto text-slate-700" />
                  <p className="text-xs">No clinical files/photos have been scanned for this patient.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Embedded Document Visualizer / Slider Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-[#0c0d10]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2229] rounded-2xl w-full max-w-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#14171c]">
              <div>
                <h4 className="font-extrabold text-white text-xs truncate max-w-sm">{viewingDoc.name}</h4>
                <p className="text-[10px] text-slate-450 font-semibold">Uploaded on {viewingDoc.uploadedAt} ({viewingDoc.sizeKb} KB)</p>
              </div>
              <button 
                type="button" 
                onClick={() => setViewingDoc(null)} 
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-[#0c0d10] flex-1 flex items-center justify-center overflow-auto min-h-[350px]">
              {viewingDoc.fileData.startsWith('data:image/') || viewingDoc.mimeType.startsWith('image/') ? (
                <img 
                  src={viewingDoc.fileData} 
                  alt={viewingDoc.name} 
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg border border-slate-800 bg-[#1a1d23]"
                />
              ) : (
                <div className="bg-[#1a1d23] p-6 rounded-xl border border-slate-800 text-center space-y-3">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-300 font-bold">Pre-loaded PDF/Document Scan</p>
                  <p className="text-[10px] text-slate-500 max-w-xs">{viewingDoc.notes}</p>
                </div>
              )}
            </div>

            {viewingDoc.notes && (
              <div className="border-t border-slate-800 p-4 bg-[#14171c] text-xs text-[#cbd5e1]">
                <span className="font-extrabold text-white">Diagnosis Details / Notes:</span>
                <p className="mt-1 text-slate-405">{viewingDoc.notes}</p>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
