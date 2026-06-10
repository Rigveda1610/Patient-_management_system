import React, { useState } from 'react';
import { Appointment, Patient } from '../types';
import { Calendar, Clock, Plus, Trash2, CheckCircle, Search, Sparkles, Filter } from 'lucide-react';

interface AppointmentsListProps {
  appointments: Appointment[];
  patients: Patient[];
  onAddAppointment: (appointment: Appointment) => void;
  onUpdateAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (apptId: string) => void;
}

export default function AppointmentsList({ 
  appointments, 
  patients, 
  onAddAppointment, 
  onUpdateAppointment, 
  onDeleteAppointment 
}: AppointmentsListProps) {
  const [filter, setFilter] = useState<'today' | 'all'>('today');
  
  // Schedule Appointment Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [appointmentTime, setAppointmentTime] = useState('10:00');
  const [appointmentType, setAppointmentType] = useState<'regular' | 'follow-up' | 'emergency'>('follow-up');
  const [appointmentReason, setAppointmentReason] = useState('');
  const [submitError, setSubmitError] = useState('');
  
  // Patient search states during booking
  const [ptQuery, setPtQuery] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtering list
  const filteredAppts = appointments.filter(a => {
    if (filter === 'today') {
      return a.date === todayStr;
    }
    return true; // all
  });

  // Filtered patients for the booking modal dropdown search
  const filteredPtSearch = ptQuery.trim() === '' 
    ? patients.slice(0, 5) 
    : patients.filter(p => p.fullName.toLowerCase().includes(ptQuery.toLowerCase())).slice(0, 6);

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setSubmitError('Please search and select a registered patient.');
      return;
    }
    
    const patientObj = patients.find(p => p.id === selectedPatientId);
    if (!patientObj) {
      setSubmitError('Invalid patient profile chosen.');
      return;
    }

    const newAppt: Appointment = {
      id: `apt_${Date.now()}`,
      patientId: patientObj.id,
      patientName: patientObj.fullName,
      patientMobile: patientObj.mobileNumber,
      date: appointmentDate,
      time: appointmentTime,
      type: appointmentType,
      status: 'scheduled',
      reason: appointmentReason.trim() || 'Urgent Clinic follow-up consultation'
    };

    onAddAppointment(newAppt);
    
    // reset states
    setSelectedPatientId('');
    setPtQuery('');
    setAppointmentReason('');
    setShowAddForm(false);
    setSubmitError('');
  };

  const toggleCheckIn = (appt: Appointment) => {
    const updatedStatus = appt.status === 'scheduled' ? 'completed' : 'scheduled';
    onUpdateAppointment({
      ...appt,
      status: updatedStatus
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Upper header action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex bg-[#14171c] border border-slate-800 p-1 rounded-xl">
          <button 
            type="button"
            onClick={() => setFilter('today')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'today' ? 'bg-emerald-600 text-black shadow-md shadow-emerald-950/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Today's Visits ({appointments.filter(a => a.date === todayStr).length})
          </button>
          <button 
            type="button"
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-emerald-600 text-black shadow-md shadow-emerald-950/20' : 'text-slate-400 hover:text-slate-200'}`}
          >
            All Bookings ({appointments.length})
          </button>
        </div>

        <button 
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black rounded-lg shadow-md shadow-emerald-950/10 text-xs font-bold flex items-center space-x-1.5 transition-all"
        >
          <Plus className="w-4 h-4 text-black" strokeWidth={2.5} />
          <span>Book Consultation</span>
        </button>
      </div>

      {/* Main Grid: booking list */}
      <div className="bg-[#1a1d23] rounded-2xl border border-slate-800 shadow-md overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-[#14171c] flex items-center justify-between">
          <h4 className="text-sm font-extrabold text-white uppercase tracking-widest flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Consultation Schedule Queue</span>
          </h4>
          <span className="text-xs text-slate-400 font-medium">{filteredAppts.length} appointments listed</span>
        </div>

        <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto bg-[#1a1d23]">
          {filteredAppts.map((appt) => {
            const isToday = appt.date === todayStr;
            const isCompleted = appt.status === 'completed';
            const badgeColors = appt.type === 'emergency' 
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_8px_rgba(239,68,68,0.05)]' 
              : (appt.type === 'follow-up' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20');

            return (
              <div 
                key={appt.id} 
                className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-slate-800/40 ${isCompleted ? 'bg-slate-800/10' : ''}`}
              >
                <div className="flex items-start space-x-3">
                  <button
                    onClick={() => toggleCheckIn(appt)}
                    title={isCompleted ? 'Mark Scheduled' : 'Mark Visited/Completed'}
                    className={`mt-1 flex items-center justify-center w-5 h-5 rounded-full border transition-all ${isCompleted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_6px_rgba(16,185,129,0.2)]' : 'border-slate-700 hover:border-emerald-500 text-slate-700'}`}
                  >
                    <CheckCircle className="w-4 h-4 shrink-0 fill-current" />
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className={`font-bold text-sm ${isCompleted ? 'text-slate-500 line-through' : 'text-white'}`}>
                        {appt.patientName}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${badgeColors}`}>
                        {appt.type}
                      </span>
                      {isToday && (
                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 border border-emerald-500/20 rounded">
                          Today
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${isCompleted ? 'text-slate-500' : 'text-slate-400'} font-medium`}>
                      📞 {appt.patientMobile} &middot; <span className="text-slate-500 font-mono text-[11px]">Reason:</span> {appt.reason}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-x-5 px-8 md:px-0">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 font-mono">
                    <Clock className="w-4 h-4 text-[#ecc94b]" />
                    <span>{appt.date} &middot; {appt.time}</span>
                  </div>

                  <button 
                    onClick={() => onDeleteAppointment(appt.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Remove Appointment Log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredAppts.length === 0 && (
            <div className="text-center py-12 text-slate-500 bg-[#1a1d23] px-4 space-y-2">
              <Calendar className="w-10 h-10 mx-auto text-slate-700 stroke-1" />
              <p className="text-sm">No scheduled consultations for this queue view</p>
              <p className="text-xs text-slate-600">Click &quot;Book Consultation&quot; above to queue a follow-up.</p>
            </div>
          )}
        </div>
      </div>

      {/* Book Consultation Modal Dialogue */}
      {showAddForm && (
        <div className="fixed inset-0 bg-[#0c0d10]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2229] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#14171c]">
              <h3 className="font-extrabold text-white text-sm flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Book Clinic Consultation Slot</span>
              </h3>
              <button 
                type="button" 
                onClick={() => { setShowAddForm(false); setSubmitError(''); }} 
                className="p-1 text-2xl font-bold rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                style={{ lineHeight: '1' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="p-5 space-y-4">
              {submitError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl font-medium">⚠️ {submitError}</p>
              )}

              {/* Patient Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Search Patient Registry *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input 
                    type="text"
                    required
                    placeholder="Search name to schedule..."
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-700 bg-[#0c0d10] text-[#cbd5e1] placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none rounded-xl text-xs"
                    value={ptQuery}
                    onChange={(e) => {
                      setPtQuery(e.target.value);
                      setSelectedPatientId(''); // reset if typing
                    }}
                  />
                </div>

                {/* Autocomplete items */}
                {selectedPatientId === '' && (
                  <div className="bg-[#14171c] border border-slate-800 rounded-lg max-h-36 overflow-y-auto mt-1 divide-y divide-slate-800">
                    {filteredPtSearch.map(p => (
                      <button 
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatientId(p.id);
                          setPtQuery(p.fullName);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-500/10 hover:text-emerald-400 text-slate-300 flex justify-between"
                      >
                        <span className="font-bold">{p.fullName}</span>
                        <span className="text-slate-500 font-mono text-[10px]">Age {p.age} &middot; {p.mobileNumber}</span>
                      </button>
                    ))}
                    {filteredPtSearch.length === 0 && (
                      <p className="p-2 text-[11px] text-slate-500 text-center">No matching patients. Search or register them first.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Booking Date</label>
                  <input 
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-slate-700 bg-[#0c0d10] text-[#cbd5e1] focus:border-emerald-500/50 focus:outline-none rounded-xl text-xs"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Time Slot</label>
                  <input 
                    type="time"
                    required
                    className="w-full px-3 py-2 border border-slate-700 bg-[#0c0d10] text-[#cbd5e1] focus:border-emerald-500/50 focus:outline-none rounded-xl text-xs font-mono"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Consultation Category</label>
                <select 
                  className="w-full px-3 py-2.5 border border-slate-700 bg-[#0c0d10] text-[#cbd5e1] focus:border-emerald-500/50 focus:outline-none rounded-xl text-xs"
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value as any)}
                >
                  <option value="regular">Regular Checkup</option>
                  <option value="follow-up">Follow-up Diagnostic Scan</option>
                  <option value="emergency">🚨 EMERGENCY CASE</option>
                </select>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Reason / Clinical Notes</label>
                <input 
                  type="text"
                  placeholder="e.g. Chronic post-operative reviews"
                  className="w-full px-3 py-2 border border-slate-700 bg-[#0c0d10] text-[#cbd5e1] focus:border-emerald-500/50 focus:outline-none rounded-xl text-xs"
                  value={appointmentReason}
                  onChange={(e) => setAppointmentReason(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={() => { setShowAddForm(false); setSubmitError(''); }}
                  className="px-3 py-1.5 border border-slate-700 hover:bg-slate-800 text-slate-400 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black rounded-lg text-xs font-bold"
                >
                  Confirm Slot
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
