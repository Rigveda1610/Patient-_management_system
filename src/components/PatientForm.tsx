import React, { useState, useEffect } from 'react';
import { Patient } from '../types';
import { X, Save, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';

interface PatientFormProps {
  patientToEdit?: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => void;
}

export default function PatientForm({ patientToEdit, isOpen, onClose, onSave }: PatientFormProps) {
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<number>(30);
  const [sex, setSex] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [residence, setResidence] = useState('');
  const [profession, setProfession] = useState('');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('');
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [medicationDetails, setMedicationDetails] = useState('');
  const [lastVisitDate, setLastVisitDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [treatmentStatus, setTreatmentStatus] = useState<
  'Treatment Completed' | 'Satisfied' | 'Not Satisfied' | ''
>('');

  const [testCasePhoto, setTestCasePhoto] = useState<string>('');
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  
  const [error, setError] = useState<string | null>(null);

  // Sync state if editing an existing patient
  useEffect(() => {
    if (patientToEdit) {
      setFullName(patientToEdit.fullName);
      setAge(patientToEdit.age);
      setSex(patientToEdit.sex);
      setDateOfBirth(patientToEdit.dateOfBirth);
      setMobileNumber(patientToEdit.mobileNumber);
      setResidence(patientToEdit.residence);
      setProfession(patientToEdit.profession);
      setPrimaryDiagnosis(patientToEdit.primaryDiagnosis);
      setFinalDiagnosis(patientToEdit.finalDiagnosis);
      setMedicationDetails(patientToEdit.medicationDetails);
      setLastVisitDate(patientToEdit.lastVisitDate);
      setStatus(patientToEdit.status);
      setTreatmentStatus(patientToEdit.treatmentStatus || '');
      setTreatmentStatus(patientToEdit.treatmentStatus || '');
      setTestCasePhoto(patientToEdit.testCasePhoto || '');
    } else {
      // Clear for new patient
      setFullName('');
      setAge(30);
      setSex('Male');
      const birthStr = new Date();
      birthStr.setFullYear(birthStr.getFullYear() - 30);
      setDateOfBirth(birthStr.toISOString().split('T')[0]);
      setMobileNumber('');
      setResidence('');
      setProfession('');
      setPrimaryDiagnosis('');
      setFinalDiagnosis('');
      setMedicationDetails('');
      setLastVisitDate(new Date().toISOString().split('T')[0]);
      setStatus('active');
      setTreatmentStatus('');
      setTestCasePhoto('');
    }
    setError(null);
  }, [patientToEdit, isOpen]);

  // Handle DOB changes to auto-calculate clinical age
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dob = e.target.value;
    setDateOfBirth(dob);
    if (dob) {
      const birth = new Date(dob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
      setAge(Math.max(0, calculatedAge));
    }
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAge = parseInt(e.target.value) || 0;
    setAge(newAge);
    // Adjust DOB year approximate
    if (newAge >= 0) {
      const today = new Date();
      const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
      const currentDay = String(today.getDate()).padStart(2, '0');
      setDateOfBirth(`${today.getFullYear() - newAge}-${currentMonth}-${currentDay}`);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Only image files are supported for the test case photo.');
        return;
      }
      setIsPhotoUploading(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_DIM = 850; 
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
            // JPG 0.65 quality compression for reliable size
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.65);
            setTestCasePhoto(compressedUrl);
          } else {
            setTestCasePhoto(dataUrl);
          }
          setIsPhotoUploading(false);
        };
        img.onerror = () => {
          setError('Failed to decode image file.');
          setIsPhotoUploading(false);
        };
        img.src = dataUrl;
      };
      reader.onerror = () => {
        setError('Failed to read image file.');
        setIsPhotoUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please fill in the patient's full name.");
      return;
    }
    if (!mobileNumber.trim()) {
      setError("Please supply a valid contact phone number.");
      return;
    }
    if (!primaryDiagnosis.trim()) {
      setError("A primary diagnostic finding is required.");
      return;
    }

    const compiled: Patient = {
      id: patientToEdit ? patientToEdit.id : `p_${Date.now()}`,
      fullName: fullName.trim(),
      age,
      sex,
      dateOfBirth,
      mobileNumber: mobileNumber.trim(),
      residence: residence.trim() || 'Not Disclosed',
      profession: profession.trim() || 'Not Disclosed',
      primaryDiagnosis: primaryDiagnosis.trim(),
      finalDiagnosis: finalDiagnosis.trim() || primaryDiagnosis.trim(), // fallback
      medicationDetails: medicationDetails.trim() || 'No active therapy prescribed.',
      lastVisitDate,
      createdAt: patientToEdit ? patientToEdit.createdAt : new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      status,
      ...(treatmentStatus ? { treatmentStatus } : {}),
      testCasePhoto: testCasePhoto || undefined,
    };

    onSave(compiled);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#0c0d10]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#1e2229] rounded-2xl w-full max-w-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#14171c]">
          <div>
            <h3 className="font-extrabold text-white text-lg">
              {patientToEdit ? 'Edit Patient Clinical Sheet' : 'Register New Patient Records'}
            </h3>
            <p className="text-xs text-slate-400">
              Ensure accurate medical records for optimal patient billing and follow-ups.
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-rose-500/10 text-rose-400 p-3 rounded-xl border border-rose-500/20 flex items-center space-x-2 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Core Demographic Info Group */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">1. Personal & Demographic Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Full Legal Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Richard Hendricks"
                  className="w-full px-3.5 py-2.5 border border-slate-700 bg-[#0c0d10] text-[#cbd5e1] placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm transition-all"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Mobile Phone Number *</label>
                <input 
                  type="tel"
                  required
                  placeholder="+1 (555) 012-3456"
                  className="w-full px-3.5 py-2.5 border border-slate-700 bg-[#0c0d10] text-[#cbd5e1] placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm transition-all"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Date of Birth</label>
                  <input 
                    type="date"
                    className="w-full px-3 py-2 border border-slate-700 bg-[#0c0d10] text-[#cbd5e1] focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm transition-all"
                    value={dateOfBirth}
                    onChange={handleDobChange}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Calculated Age</label>
                  <input 
                    type="number"
                    min="0"
                    max="150"
                    className="w-full px-3 py-2 border border-slate-700 bg-[#0c0d10] text-[#cbd5e1] focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm transition-all"
                    value={age}
                    onChange={handleAgeChange}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Sex Assigned at Birth</label>
                <select 
                  className="w-full px-3.5 py-2.5 border border-slate-700 bg-[#0c0d10] text-[#cbd5e1] focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm transition-all"
                  value={sex}
                  onChange={(e) => setSex(e.target.value as any)}
                >
                  <option value="Male" className="bg-[#1e2229]">Male</option>
                  <option value="Female" className="bg-[#1e2229]">Female</option>
                  <option value="Other" className="bg-[#1e2229]">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Residence (City / Area)</label>
                <input 
                  type="text"
                  placeholder="e.g. Sunset Hills, East End"
                  className="w-full px-3.5 py-2.5 border border-slate-700 bg-[#0c0d10] text-[#cbd5e1] placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm transition-all"
                  value={residence}
                  onChange={(e) => setResidence(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Profession / Occupation</label>
                <input 
                  type="text"
                  placeholder="e.g. Electrical Engineer, Student"
                  className="w-full px-3.5 py-2.5 border border-slate-700 bg-[#0c0d10] text-[#cbd5e1] placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm transition-all"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                />
              </div>

            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Clinical Diagnostic / Therapeutic Info */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">2. Clinical & Diagnostic Profile</h4>
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Primary Diagnosis *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Hypertension, DM-2, Renal Insufficiency"
                    className="w-full px-3.5 py-2.5 border border-slate-700 bg-[#0c0d10] text-[#cbd5e1] placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm transition-all"
                    value={primaryDiagnosis}
                    onChange={(e) => setPrimaryDiagnosis(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Final / Differential Diagnosis</label>
                  <input 
                    type="text"
                    placeholder="e.g. Essential Stage 1 Hypertension with left axial deviation"
                    className="w-full px-3.5 py-2.5 border border-slate-700 bg-[#0c0d10] text-[#cbd5e1] placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm transition-all"
                    value={finalDiagnosis}
                    onChange={(e) => setFinalDiagnosis(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Active Medication & Prescribed Therapy</label>
                <textarea 
                  rows={4}
                  placeholder="Tab. Ramipril 5mg HS, Tab. Metformin 850mg BD, lifestyle weight reduction..."
                  className="w-full px-3.5 py-2 border border-slate-700 bg-[#0c0d10] text-[#cbd5e1] placeholder-slate-600 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm font-mono transition-all"
                  value={medicationDetails}
                  onChange={(e) => setMedicationDetails(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Date of Last Consultation</label>
                  <input 
                    type="date"
                    className="w-full px-3.5 py-2 border border-slate-700 bg-[#0c0d10] text-[#cbd5e1] focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm transition-all"
                    value={lastVisitDate}
                    onChange={(e) => setLastVisitDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Active Patient Status</label>
                  <div className="flex items-center space-x-4 h-[38px]">
                    <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
                      <input 
                        type="radio" 
                        name="status" 
                        value="active"
                        checked={status === 'active'}
                        className="text-emerald-500 focus:ring-emerald-500 bg-[#0c0d10] border-slate-700 accent-emerald-500"
                        onChange={() => setStatus('active')}
                      />
                      <span>Active clinical registry</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
                      <input 
                        type="radio" 
                        name="status" 
                        value="inactive"
                        checked={status === 'inactive'}
                        className="text-emerald-500 focus:ring-emerald-500 bg-[#0c0d10] border-slate-700 accent-emerald-500"
                        onChange={() => setStatus('inactive')}
                      />
                      <span>Inactive / Archive file</span>
                    </label>
                  </div>
                </div>
              </div>
              {/* TREATMENT STATUS */}
<div className="space-y-1 mt-4">

  <label className="text-xs font-bold text-slate-300">
    Treatment Status
  </label>

  <div className="flex items-center flex-wrap gap-6 min-h-[38px]">

    <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
      <input
        type="radio"
        name="treatmentStatus"
        value="Treatment Completed"
        checked={treatmentStatus === 'Treatment Completed'}
        onChange={() => setTreatmentStatus('Treatment Completed')}
        className="text-emerald-500 focus:ring-emerald-500 bg-[#0c0d10] border-slate-700"
      />
      <span>Treatment Completed</span>
    </label>

    <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
      <input
        type="radio"
        name="treatmentStatus"
        value="Satisfied"
        checked={treatmentStatus === 'Satisfied'}
        onChange={() => setTreatmentStatus('Satisfied')}
        className="text-emerald-500 focus:ring-emerald-500 bg-[#0c0d10] border-slate-700"
      />
      <span>Satisfied</span>
    </label>

    <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
      <input
        type="radio"
        name="treatmentStatus"
        value="Not Satisfied"
        checked={treatmentStatus === 'Not Satisfied'}
        onChange={() => setTreatmentStatus('Not Satisfied')}
        className="text-emerald-500 focus:ring-emerald-500 bg-[#0c0d10] border-slate-700"
      />
      <span>Not Satisfied</span>
    </label>

  </div>
</div>

            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Test Case Photo Section */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">3. Diagnostic Test Case Photo</h4>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-[#14171c] rounded-xl border border-slate-850">
                <div className="w-24 h-24 rounded-lg bg-[#0c0d10] border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {testCasePhoto ? (
                    <img 
                      src={testCasePhoto} 
                      alt="Test Case Preview" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center p-2 text-slate-600">
                      <ImageIcon className="w-8 h-8 mx-auto stroke-1" />
                      <span className="text-[10px]">No Photo</span>
                    </div>
                  )}
                </div>

                <div className="flex-grow space-y-2 text-center sm:text-left">
                  <p className="text-xs text-slate-350">
                    Upload a high-resolution clinical test case photo (e.g., diagnostic screen, X-ray crop, or clinical lesion scan).
                  </p>
                  
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <input 
                      type="file"
                      id="test_case_photo_upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />
                    <label 
                      htmlFor="test_case_photo_upload"
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold cursor-pointer transition-all border border-emerald-500/20 inline-flex items-center space-x-1"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{testCasePhoto ? 'Change Photo' : 'Upload Photo'}</span>
                    </label>

                    {testCasePhoto && (
                      <button
                        type="button"
                        onClick={() => setTestCasePhoto('')}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-bold cursor-pointer transition-all border border-rose-500/20"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>

                  {isPhotoUploading && (
                    <p className="text-[11px] text-[#10b981] animate-pulse">Compressing photo...</p>
                  )}
                </div>
              </div>
            </div>
          </div>

        </form>

        {/* Footer actions */}
        <div className="border-t border-slate-800 bg-[#14171c] p-4 flex justify-end space-x-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-700 rounded-xl hover:bg-slate-800 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-black rounded-xl shadow-md text-sm font-extrabold flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 text-black font-black" />
            <span>Save Case Record</span>
          </button>
        </div>

      </div>
    </div>
  );
}
