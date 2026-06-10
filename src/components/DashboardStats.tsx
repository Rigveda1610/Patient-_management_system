import React from 'react';
import { Patient, Appointment } from '../types';
import { Users, Calendar, Award, ClipboardList, Activity, MapPin } from 'lucide-react';
import ClinicLogo from './ClinicLogo';

interface DashboardStatsProps {
  patients: Patient[];
  appointments: Appointment[];
}

export default function DashboardStats({ patients, appointments }: DashboardStatsProps) {
  const activePatients = patients.filter(p => p.status === 'active');
  const count = patients.length;
  const activeCount = activePatients.length;

  // Gender Breakdown
  const males = patients.filter(p => p.sex === 'Male').length;
  const females = patients.filter(p => p.sex === 'Female').length;
  const others = count - males - females;

  // Average Age
  const totalAge = patients.reduce((sum, p) => sum + p.age, 0);
  const avgAge = count > 0 ? Math.round(totalAge / count) : 0;

  // Today Appts
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.date === todayStr);
  const todayPending = todayAppts.filter(a => a.status === 'scheduled').length;
  const todayCompleted = todayAppts.filter(a => a.status === 'completed').length;

  // Diagnosis Breakdown
  const dxCounts: { [key: string]: number } = {};
  patients.forEach(p => {
    const dx = p.primaryDiagnosis || 'Unclassified';
    dxCounts[dx] = (dxCounts[dx] || 0) + 1;
  });

  const sortedDx = Object.entries(dxCounts)
    .map(([name, val]) => ({ name, value: val }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const maxDxVal = sortedDx.length > 0 ? Math.max(...sortedDx.map(d => d.value)) : 1;

  // Residence Hotspots
  const resCounts: { [key: string]: number } = {};
  patients.forEach(p => {
    if (p.residence) {
      resCounts[p.residence] = (resCounts[p.residence] || 0) + 1;
    }
  });

  const sortedRes = Object.entries(resCounts)
    .map(([name, val]) => ({ name, value: val }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  const maxResVal = sortedRes.length > 0 ? Math.max(...sortedRes.map(r => r.value)) : 1;

  return (
    <div className="space-y-6">
      
      {/* Clinician Welcome Hero Panel */}
      <div className="bg-[#14171c] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-10">
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Dr. Tipre Acupuncture Expert</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            Dr. Tipre Health Care
          </h2>
          <p className="text-emerald-400 text-xs sm:text-sm font-bold tracking-wide uppercase">
            Established Since 2001
          </p>
          
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl">
            Welcome back to the clinical registry terminal. Use the toolkit below to review patient files, register diagnoses, and manage health records securely.
          </p>
        </div>

        <div className="shrink-0">
          <ClinicLogo variant="badge" />
        </div>
      </div>

      {/* Upper Grid of 4 numeric KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Active Patient Count */}
        <div className="bg-[#1a1d23] p-5 rounded-2xl border border-slate-800 shadow-md flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Patients</p>
            <h3 className="text-2xl font-black text-white tracking-tight">{count}</h3>
            <p className="text-xs text-emerald-400 font-semibold mt-0.5">
              💡 {activeCount} Active records
            </p>
          </div>
        </div>

        {/* KPI 2: Today's Appointments */}
        <div className="bg-[#1a1d23] p-5 rounded-2xl border border-slate-800 shadow-md flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Today's Visits</p>
            <h3 className="text-2xl font-black text-white tracking-tight">{todayAppts.length}</h3>
            <p className="text-xs text-amber-400 font-semibold mt-0.5">
              ⌛ {todayPending} pending, {todayCompleted} completed
            </p>
          </div>
        </div>

        {/* KPI 3: Demographics Average Age */}
        <div className="bg-[#1a1d23] p-5 rounded-2xl border border-slate-800 shadow-md flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Clinical Cohort Age</p>
            <h3 className="text-2xl font-black text-white tracking-tight">{avgAge} yrs</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Median medical group
            </p>
          </div>
        </div>

        {/* KPI 4: Demographic Ratio */}
        <div className="bg-[#1a1d23] p-5 rounded-2xl border border-slate-800 shadow-md flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Gender Demographics</p>
            <h3 className="text-sm font-bold text-slate-300 tracking-tight">
              M: {males} | F: {females}
            </h3>
            <div className="w-32 bg-[#0c0d10] h-1.5 rounded-full mt-2 overflow-hidden flex">
              <div 
                className="bg-blue-500 h-full" 
                style={{ width: `${count > 0 ? (males/count)*100 : 0}%` }}
                title={`Male: ${males}`}
              />
              <div 
                className="bg-rose-450 h-full" 
                style={{ width: `${count > 0 ? (females/count)*100 : 0}%` }}
                title={`Female: ${females}`}
              />
              <div 
                className="bg-teal-450 h-full" 
                style={{ width: `${count > 0 ? (others/count)*100 : 0}%` }}
                title={`Other: ${others}`}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Analytics Visualizers (Bento Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Diagnostic Prevalence Chart */}
        <div className="bg-[#1a1d23] p-6 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center space-x-2 mb-5">
            <Award className="w-5 h-5 text-emerald-400" />
            <h4 className="font-extrabold text-white text-base">Top Primary Diagnoses Prevalence</h4>
          </div>
          
          <div className="space-y-4">
            {sortedDx.map((item, idx) => {
              const pct = Math.round((item.value / count) * 100);
              const barWidth = Math.round((item.value / maxDxVal) * 100);
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>{idx + 1}. {item.name}</span>
                    <span className="text-slate-500 font-semibold">{item.value} patients ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#0c0d10] h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {sortedDx.length === 0 && (
              <p className="text-sm text-slate-550 text-center py-6">No diagnostic data entered yet.</p>
            )}
          </div>
        </div>

        {/* Location Hotspots Chart */}
        <div className="bg-[#1a1d23] p-6 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center space-x-2 mb-5">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <h4 className="font-extrabold text-white text-base">Patient Residence Hotspots</h4>
          </div>

          <div className="space-y-4">
            {sortedRes.map((item, idx) => {
              const pct = Math.round((item.value / count) * 100);
              const barWidth = Math.round((item.value / maxResVal) * 100);
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>🏠 {item.name}</span>
                    <span className="text-slate-500 font-semibold">{item.value} patients ({pct}%)</span>
                  </div>
                  <div className="w-full bg-[#0c0d10] h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {sortedRes.length === 0 && (
              <p className="text-sm text-slate-550 text-center py-6">No address details compiled yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
