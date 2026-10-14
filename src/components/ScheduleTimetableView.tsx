import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  GraduationCap,
  Printer,
  Sparkles,
  BookOpen,
  User,
  Coffee,
  CheckCircle2,
  Video,
} from 'lucide-react';
import { UserProfile, GradeLevel, CourseItem, ScheduleSlot, SchoolDay } from '../types';
import { TIME_PERIODS, SCHOOL_DAYS } from '../data/initialData';

interface ScheduleTimetableViewProps {
  currentUser: UserProfile;
  grades: GradeLevel[];
  courses: CourseItem[];
  schedules: Record<string, ScheduleSlot[]>;
  onNavigateToLiveClass?: (courseId: string, gradeId: string) => void;
}

export const ScheduleTimetableView: React.FC<ScheduleTimetableViewProps> = ({
  currentUser,
  grades,
  courses,
  schedules,
  onNavigateToLiveClass,
}) => {
  // Default to student's own grade or first grade
  const initialGradeId =
    currentUser.gradeId || (grades.length > 0 ? grades.find((g) => g.id === 'sec-4')?.id || grades[0].id : '');
  const [selectedGradeId, setSelectedGradeId] = useState<string>(initialGradeId);
  const [highlightDay, setHighlightDay] = useState<SchoolDay | 'Todos'>('Todos');

  const selectedGrade = grades.find((g) => g.id === selectedGradeId) || grades[0];
  const gradeSlots = schedules[selectedGradeId] || [];

  // Group slots by period index for matrix rendering
  const getSlot = (day: SchoolDay, periodIndex: number): ScheduleSlot | undefined => {
    return gradeSlots.find((s) => s.day === day && s.periodIndex === periodIndex);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Header Card */}
      <div className="rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/15 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FACC15] to-transparent opacity-90" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7F1D1D] to-[#991B1B] border border-[#FACC15]/60 flex items-center justify-center shadow-lg shrink-0">
              <Calendar className="w-6 h-6 text-[#FACC15]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                  Horario Escolar Oficial 2026
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                  Sin Cruces Docentes
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Colegio Capitán Enrique Oppenheimer · Plan Curricular Semanal
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Grade Selector */}
            <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-white/20">
              <GraduationCap className="w-4 h-4 text-[#FACC15]" />
              <label htmlFor="schedule-grade-select" className="text-xs font-semibold text-slate-300">Grado:</label>
              <select
                id="schedule-grade-select"
                aria-label="Seleccionar grado para ver horario"
                value={selectedGradeId}
                onChange={(e) => setSelectedGradeId(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#FEF08A] focus:outline-none cursor-pointer"
              >
                {grades.map((g) => (
                  <option key={g.id} value={g.id} className="bg-slate-900 text-white">
                    {g.name} ({g.level})
                  </option>
                ))}
              </select>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Imprimir u obtener PDF del horario oficial"
            >
              <Printer className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>Imprimir Horario</span>
            </button>
          </div>
        </div>

        {/* Grade Details Summary Banner */}
        {selectedGrade && (
          <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Nivel & Sección:
              </span>
              <span className="font-bold text-white text-xs">{selectedGrade.section}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Tutor(a) de Aula:
              </span>
              <span className="font-bold text-[#FEF08A] text-xs">{selectedGrade.tutorName}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Jornada Escolar:
              </span>
              <span className="font-bold text-white text-xs">08:00 AM - 01:00 PM</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                Recreo Institucional:
              </span>
              <span className="font-bold text-amber-300 text-xs">10:15 AM - 10:45 AM</span>
            </div>
          </div>
        )}
      </div>

      {/* Day Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs text-slate-400 font-semibold shrink-0">Filtrar Día:</span>
        {(['Todos', ...SCHOOL_DAYS] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setHighlightDay(d)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              highlightDay === d
                ? 'bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] text-white shadow-md border border-[#FACC15]/40'
                : 'bg-black/50 text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Main Weekly Timetable Grid */}
      <div className="rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/15 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-white/15 bg-white/5">
                <th className="p-3.5 text-xs font-bold uppercase tracking-wider text-slate-300 w-28 text-center">
                  Bloque / Hora
                </th>
                {SCHOOL_DAYS.map((day) => {
                  const isFiltered = highlightDay !== 'Todos' && highlightDay !== day;
                  return (
                    <th
                      key={day}
                      className={`p-3.5 text-xs font-bold uppercase tracking-wider text-center transition-opacity ${
                        isFiltered ? 'opacity-40' : 'opacity-100 text-[#FEF08A]'
                      }`}
                    >
                      {day}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {TIME_PERIODS.map((period) => {
                if (period.isRecess) {
                  return (
                    <tr
                      key={period.index}
                      className="bg-amber-950/40 border-y-2 border-amber-500/40"
                    >
                      <td className="p-3 text-center font-mono-tabular text-xs font-bold text-amber-300">
                        {period.time}
                      </td>
                      <td
                        colSpan={5}
                        className="p-3 text-center text-xs font-extrabold text-[#FEF08A] tracking-wider uppercase bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Coffee className="w-4 h-4 text-[#FACC15]" />
                          <span>🔔 RECREO Y DESCANSO INSTITUCIONAL · PATIO CENTRAL OPPENHEIMER</span>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={period.index} className="hover:bg-white/[0.02] transition-colors">
                    {/* Time Column */}
                    <td className="p-3.5 text-center font-mono-tabular text-xs font-bold text-slate-400 border-r border-white/10 bg-black/30">
                      <div>{period.time}</div>
                      <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                        {period.label}
                      </span>
                    </td>

                    {/* Day Columns */}
                    {SCHOOL_DAYS.map((day) => {
                      const slot = getSlot(day, period.index);
                      const isFiltered = highlightDay !== 'Todos' && highlightDay !== day;

                      if (!slot) {
                        return (
                          <td
                            key={day}
                            className={`p-2.5 text-center text-xs text-slate-400 border-r border-white/5 ${
                              isFiltered ? 'opacity-30' : ''
                            }`}
                          >
                            Libre
                          </td>
                        );
                      }

                      return (
                        <td
                          key={day}
                          className={`p-2.5 border-r border-white/10 align-top transition-all ${
                            isFiltered ? 'opacity-30' : ''
                          }`}
                        >
                          <div
                            className="p-3 rounded-2xl border transition-all h-full flex flex-col justify-between group shadow-md"
                            style={{
                              backgroundColor: `${slot.accentColor || '#7F1D1D'}18`,
                              borderColor: `${slot.accentColor || '#FACC15'}40`,
                            }}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-1 mb-1">
                                <h4 className="text-xs font-bold text-white group-hover:text-[#FEF08A] transition-colors line-clamp-2">
                                  {slot.courseName}
                                </h4>
                              </div>

                              <div className="text-[11px] text-[#FEF08A] flex items-center gap-1 font-medium mt-1">
                                <User className="w-3 h-3 text-[#FACC15] shrink-0" />
                                <span className="truncate">{slot.teacherName}</span>
                              </div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300">
                              <span className="bg-black/50 px-2 py-0.5 rounded border border-white/10 font-mono-tabular">
                                {slot.classroom || 'Aula'}
                              </span>

                              {onNavigateToLiveClass && slot.courseId && (
                                <button
                                  type="button"
                                  onClick={() => onNavigateToLiveClass(slot.courseId!, selectedGradeId)}
                                  className="text-[#FACC15] hover:text-[#FEF08A] flex items-center gap-0.5 font-bold cursor-pointer hover:underline"
                                  title="Ir al aula virtual de este curso"
                                >
                                  <Video className="w-3 h-3" />
                                  <span>Clase</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
