import React, { useState } from 'react';
import {
  UserCheck,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  BarChart3,
  Bell,
  Calendar,
  Sparkles,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  UserRole,
  UserProfile,
  AttendanceEntry,
  AttendanceStatus,
  GradeLevel,
  StudentProgressRecord,
} from '../types';

interface AttendanceAnalyticsViewProps {
  userRole: UserRole;
  currentUser?: UserProfile;
  attendance: AttendanceEntry[];
  grades: GradeLevel[];
  studentsProgress: StudentProgressRecord[];
  selectedGradeId: string;
  onSelectGrade: (gradeId: string) => void;
  onUpdateAttendanceStatus: (studentId: string, status: AttendanceStatus) => void;
  onMarkAllPresent: () => void;
  onNotifyAbsentParents: () => void;
}

export const AttendanceAnalyticsView: React.FC<AttendanceAnalyticsViewProps> = ({
  userRole,
  currentUser,
  attendance,
  grades,
  studentsProgress,
  selectedGradeId,
  onSelectGrade,
  onUpdateAttendanceStatus,
  onMarkAllPresent,
  onNotifyAbsentParents,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  const currentGrade =
    grades.find((g) => g.id === selectedGradeId) || grades[0];

  // =========================================================================
  // ESTUDIANTE: VISTA EXCLUSIVA PERSONAL CON GRÁFICA DE BARRAS POR HORARIO
  // =========================================================================
  if (userRole === 'estudiante') {
    // Datos históricos personales de asistencia del estudiante
    const studentScheduleData = [
      {
        range: '07:30 - 07:45 AM',
        label: 'Puntual (Ingreso Óptimo)',
        category: 'Puntual' as const,
        daysCount: 14,
        percentage: 70,
        color: 'from-emerald-500 to-emerald-400',
        textColor: 'text-emerald-300',
        borderColor: 'border-emerald-500/40',
        bgPill: 'bg-emerald-950/60',
      },
      {
        range: '07:46 - 07:55 AM',
        label: 'Puntual (Hora Límite)',
        category: 'Puntual' as const,
        daysCount: 3,
        percentage: 15,
        color: 'from-teal-500 to-emerald-400',
        textColor: 'text-teal-300',
        borderColor: 'border-teal-500/40',
        bgPill: 'bg-teal-950/60',
      },
      {
        range: '07:56 - 08:15 AM',
        label: 'Tardanza Registrada',
        category: 'Tardanza' as const,
        daysCount: 2,
        percentage: 10,
        color: 'from-amber-500 to-yellow-400',
        textColor: 'text-amber-300',
        borderColor: 'border-amber-500/40',
        bgPill: 'bg-amber-950/60',
      },
      {
        range: 'Inasistencia / Falta',
        label: 'Sin Registro Matutino',
        category: 'Inasistencia' as const,
        daysCount: 1,
        percentage: 5,
        color: 'from-red-600 to-rose-400',
        textColor: 'text-rose-300',
        borderColor: 'border-rose-500/40',
        bgPill: 'bg-rose-950/60',
      },
    ];

    const totalDays = 20;
    const totalPuntualDays = 17;
    const totalTardanzaDays = 2;
    const totalInasistenciaDays = 1;
    const attendancePct = 95.0;

    // Historial cronológico individual de los últimos 10 días lectivos
    const personalLog = [
      { date: 'Hoy · Vie 10 Oct', time: '07:42 AM', status: 'Puntual', note: 'Ingreso puntual por puerta principal' },
      { date: 'Jue 09 Oct', time: '07:38 AM', status: 'Puntual', note: 'Ingreso regular a tiempo' },
      { date: 'Mié 08 Oct', time: '08:04 AM', status: 'Tardanza', note: 'Congestión vehicular reportada por apoderado' },
      { date: 'Mar 07 Oct', time: '07:45 AM', status: 'Puntual', note: 'Ingreso en horario regular' },
      { date: 'Lun 06 Oct', time: '07:35 AM', status: 'Puntual', note: 'Ingreso anticipado a ensayo musical' },
      { date: 'Vie 03 Oct', time: '07:40 AM', status: 'Puntual', note: 'Ingreso regular' },
      { date: 'Jue 02 Oct', time: '--:--', status: 'Inasistencia', note: 'Permiso médico justificado en Secretaría' },
      { date: 'Mié 01 Oct', time: '07:36 AM', status: 'Puntual', note: 'Ingreso regular' },
      { date: 'Mar 30 Sep', time: '07:59 AM', status: 'Tardanza', note: 'Retraso de 4 minutos registrado' },
      { date: 'Lun 29 Sep', time: '07:41 AM', status: 'Puntual', note: 'Ingreso regular' },
    ];

    return (
      <div className="space-y-6 text-slate-100">
        {/* Header Personal del Estudiante */}
        <div className="p-5 sm:p-6 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#FEF08A] mb-1 font-semibold">
              <Calendar className="w-4 h-4 text-[#FACC15]" />
              <span>Mi Registro Personal de Asistencia Escolar</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
              Control de Puntualidad e Ingreso · {currentUser?.name || 'Estudiante'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Código Institucional: <strong className="text-[#FEF08A]">{currentUser?.code || 'CEO-2026-408'}</strong> · Grado: 4.° de Secundaria · Año Lectivo 2026
            </p>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-right shrink-0">
            <span className="text-xs text-emerald-300 font-medium">Asistencia Efectiva</span>
            <div className="text-2xl font-bold text-emerald-200 font-mono-tabular">
              {attendancePct}%
            </div>
          </div>
        </div>

        {/* 3 Metric Cards for Puntual, Tardanza, Inasistencia */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-black/60 backdrop-blur-xl border border-emerald-500/30 shadow-lg">
            <div className="flex items-center justify-between text-xs text-emerald-300 mb-1">
              <span>Puntual (A tiempo)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-emerald-200 font-mono-tabular">
              {totalPuntualDays} <span className="text-sm font-normal text-slate-300">días ({Math.round((totalPuntualDays / totalDays) * 100)}%)</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Ingresos registrados antes de las 07:55 AM.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-black/60 backdrop-blur-xl border border-amber-500/30 shadow-lg">
            <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
              <span>Tardanza</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-amber-200 font-mono-tabular">
              {totalTardanzaDays} <span className="text-sm font-normal text-slate-300">días ({Math.round((totalTardanzaDays / totalDays) * 100)}%)</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Ingresos entre 07:56 y 08:15 AM.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-black/60 backdrop-blur-xl border border-rose-500/30 shadow-lg">
            <div className="flex items-center justify-between text-xs text-rose-300 mb-1">
              <span>Inasistencia</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-bold text-rose-200 font-mono-tabular">
              {totalInasistenciaDays} <span className="text-sm font-normal text-slate-300">día ({Math.round((totalInasistenciaDays / totalDays) * 100)}%)</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Ausencias justificadas acreditadas.
            </p>
          </div>
        </div>

        {/* GRÁFICA DE BARRAS POR HORARIO DE ENTRADA (Puntual, Tardanza, Inasistencia) */}
        <div className="p-6 sm:p-7 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 space-y-6 shadow-xl">
          <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#FEF08A] font-semibold">
                <BarChart3 className="w-4 h-4 text-[#FACC15]" />
                <span>Gráfica Analítica de Puntualidad</span>
              </div>
              <h3 className="text-lg font-bold text-white font-display mt-0.5">
                Distribución de Asistencia por Horario de Entrada
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Clasificación de los 20 días lectivos evaluados según la franja horaria de ingreso al colegio.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                Puntual
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Tardanza
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                Inasistencia
              </span>
            </div>
          </div>

          {/* Gráfica de Barras Verticales Interactiva */}
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end min-h-[220px] pt-4">
              {studentScheduleData.map((bar) => {
                // Altura proporcional entre 30% y 100% para visualización estética
                const visualHeight = Math.max(25, bar.percentage);

                return (
                  <div
                    key={bar.range}
                    className="flex flex-col items-center justify-end h-full group"
                  >
                    {/* Tooltip con días y porcentaje encima de la barra */}
                    <div className="mb-2 text-center">
                      <div className="text-base font-bold text-white font-mono-tabular">
                        {bar.daysCount} días
                      </div>
                      <div className={`text-xs font-semibold ${bar.textColor}`}>
                        {bar.percentage}% del total
                      </div>
                    </div>

                    {/* Barra Vertical */}
                    <div className="w-full max-w-[120px] h-44 bg-white/5 rounded-2xl p-1.5 flex flex-col justify-end border border-white/10 group-hover:border-white/30 transition-all">
                      <div
                        className={`w-full rounded-xl bg-gradient-to-t ${bar.color} transition-all duration-700 shadow-lg relative overflow-hidden flex items-end justify-center pb-2`}
                        style={{ height: `${visualHeight}%` }}
                      >
                        {/* Shimmer light effect */}
                        <div className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[11px] font-bold text-slate-950 font-mono-tabular">
                          {bar.category}
                        </span>
                      </div>
                    </div>

                    {/* Etiqueta del Horario debajo de la barra */}
                    <div className="mt-3 text-center">
                      <p className="text-xs font-bold text-white">
                        {bar.range}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {bar.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mensaje de retroalimentación pedagógica */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3 mt-4">
              <Sparkles className="w-4 h-4 text-[#FACC15] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-[#FEF08A]">Diagnóstico de Puntualidad:</strong> Tu horario promedio de ingreso es a las <strong className="text-white">07:41 AM</strong>, ubicándote en el <strong className="text-emerald-300">85% superior de puntualidad del colegio</strong>. Mantener este estándar garantiza tu concentración en la primera hora académica y tu participación en los ensayos y prácticas de laboratorio.
              </div>
            </div>
          </div>
        </div>

        {/* Historial Cronológico de Ingreso del Alumno */}
        <div className="p-6 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Historial Detallado de Mis Asistencias
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Registro cronológico día por día con horas exactas registradas en la puerta escolar.
              </p>
            </div>
            <span className="text-xs text-[#FEF08A] font-semibold bg-white/5 px-3 py-1 rounded-lg border border-white/10">
              Últimos 10 días
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[11px] font-semibold text-slate-300">
                  <th className="py-2.5 px-4">Fecha</th>
                  <th className="py-2.5 px-4">Hora de Entrada</th>
                  <th className="py-2.5 px-4">Estado</th>
                  <th className="py-2.5 px-4">Observación de Inspectoría</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-xs text-slate-200">
                {personalLog.map((log, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                      {log.date}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-slate-300 whitespace-nowrap">
                      {log.time}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          log.status === 'Puntual'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                            : log.status === 'Tardanza'
                            ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-[11px]">
                      {log.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // DOCENTE Y ADMINISTRADOR: VISTA COMPLETA DEL AULA Y REPORTES
  // =========================================================================
  const filteredAttendance = attendance.filter((entry) => {
    const matchesSearch =
      entry.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.studentCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'Todos' || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCount = attendance.length;
  const presentCount = attendance.filter((a) => a.status === 'Presente').length;
  const lateCount = attendance.filter((a) => a.status === 'Tardanza').length;
  const absentCount = attendance.filter((a) => a.status === 'Falta').length;
  const justifiedCount = attendance.filter(
    (a) => a.status === 'Justificado'
  ).length;

  const effectiveAttendanceRate =
    totalCount > 0
      ? (((presentCount + lateCount * 0.8 + justifiedCount) / totalCount) * 100).toFixed(1)
      : '100.0';

  const handleExportCSV = () => {
    const headers = [
      'Codigo',
      'Estudiante',
      'Grado',
      'Estado Asistencia',
      'Hora Ingreso',
      'Promedio Academico',
      'Observacion',
    ];
    const rows = attendance.map((entry) => {
      const prog = studentsProgress.find((s) => s.studentId === entry.studentId);
      return [
        entry.studentCode,
        `"${entry.studentName}"`,
        `"${currentGrade.name}"`,
        entry.status,
        entry.arrivalTime,
        prog ? prog.averageGrade.toFixed(1) : '17.0',
        `"${entry.observation}"`,
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `reporte_asistencia_oppenheimer_${selectedGradeId}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header and Control Strip */}
      <div className="p-5 sm:p-6 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Control de Asistencia Escolar y Puntualidad</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-[#FACC15]">{currentGrade.name}</span>
          </div>
          <h2 className="text-xl font-bold text-white font-display">
            Asistencia en Tiempo Real y Reportes Estadísticos
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Registro diario matutino, alertas automáticas de tardanza a apoderados y correlación académica.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedGradeId}
            onChange={(e) => onSelectGrade(e.target.value)}
            aria-label="Seleccionar grado para asistencia"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-[#FACC15]"
          >
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onMarkAllPresent}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 border border-emerald-400/40 shadow-md cursor-pointer transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Marcar Todos Presentes</span>
          </button>

          <button
            type="button"
            onClick={onNotifyAbsentParents}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] hover:from-[#991B1B] hover:to-[#B91C1C] text-white text-xs font-bold flex items-center gap-1.5 border border-[#FACC15]/40 shadow-md cursor-pointer transition-all"
          >
            <Bell className="w-3.5 h-3.5 text-[#FACC15]" />
            <span>Notificar Tardanzas Push</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#FACC15]" />
            <span>Descargar CSV</span>
          </button>
        </div>
      </div>

      {/* 4-Card Summary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Asistencia Efectiva Hoy</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono-tabular">
            {effectiveAttendanceRate}%
          </div>
          <p className="text-xs text-slate-300 mt-1">
            {presentCount} estudiantes puntuales antes de las 07:55 AM.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Tardanzas Registradas</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono-tabular">
            {lateCount} Alumnos
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Alerta enviada al celular del apoderado.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Inasistencias / Justificaciones</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono-tabular">
            {absentCount} Faltas · {justifiedCount} Justif.
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Control validado por Dirección Oppenheimer.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Promedio Curricular de Aula</span>
            <BarChart3 className="w-4 h-4 text-[#FACC15]" />
          </div>
          <div className="text-2xl font-bold text-white font-mono-tabular">
            17.3 / 20.0
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Ejercicios propuestos y exámenes en vivo.
          </p>
        </div>
      </div>

      {/* Main Attendance Roster Table & Statistical Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Interactive Attendance Roster */}
        <div className="lg:col-span-8 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 overflow-hidden shadow-xl">
          <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por apellido o código..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-white/20 bg-slate-900 text-white placeholder-slate-400 focus:outline-none focus:border-[#FACC15]"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/15">
              {(['Todos', 'Presente', 'Tardanza', 'Falta', 'Justificado'] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === st
                        ? 'bg-[#7F1D1D] text-white shadow-md border border-[#FACC15]/40'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[11px] font-semibold text-slate-300">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Estudiante</th>
                  <th className="py-3 px-4">Hora Ingreso</th>
                  <th className="py-3 px-4 text-right">Avance Ejercicios</th>
                  <th className="py-3 px-4">Estado de Asistencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-xs text-slate-200">
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Clock className="w-8 h-8 text-slate-500" />
                        <p className="text-sm text-slate-300 font-medium">
                          No hay alumnos registrados en la lista de asistencia de este grado aún.
                        </p>
                        <p className="text-xs text-slate-400">
                          Cree nuevos estudiantes en el módulo de «Gestión de Usuarios» para comenzar a registrar su asistencia y puntualidad.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((entry) => {
                    const studentProg = studentsProgress.find(
                      (s) => s.studentId === entry.studentId
                    );
                    const completedCount = studentProg
                      ? studentProg.completedTopicIds.length
                      : 0;

                    return (
                      <tr
                        key={entry.studentId}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono-tabular text-slate-300 whitespace-nowrap">
                          {entry.studentCode}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">
                            {entry.studentName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {entry.observation}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono-tabular text-slate-300 whitespace-nowrap">
                          {entry.arrivalTime}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-tabular">
                          <span className="font-semibold text-[#FEF08A]">
                            {completedCount} temas
                          </span>{' '}
                          <span className="text-slate-400">
                            (Prom: {studentProg ? studentProg.averageGrade.toFixed(1) : '20.0'})
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            {(
                              ['Presente', 'Tardanza', 'Falta', 'Justificado'] as AttendanceStatus[]
                            ).map((st) => {
                              const isSelected = entry.status === st;
                              let activeClass = 'bg-white/10 text-slate-300 hover:bg-white/20';
                              if (isSelected) {
                                if (st === 'Presente')
                                  activeClass = 'bg-emerald-600 text-white font-bold border border-emerald-400/50';
                                if (st === 'Tardanza')
                                  activeClass = 'bg-amber-600 text-white font-bold border border-amber-400/50';
                                if (st === 'Falta')
                                  activeClass = 'bg-red-700 text-white font-bold border border-red-400/50';
                                if (st === 'Justificado')
                                  activeClass = 'bg-slate-700 text-white font-bold border border-white/20';
                              }

                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() =>
                                    onUpdateAttendanceStatus(entry.studentId, st)
                                  }
                                  className={`px-2 py-1 rounded-md text-[11px] transition-all whitespace-nowrap cursor-pointer ${activeClass}`}
                                >
                                  {st}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 4 Cols: Statistical Participation Breakdown by Grade */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 space-y-4 shadow-xl">
            <div>
              <h3 className="text-sm font-bold text-white">
                Participación Escolar por Grado
              </h3>
              <p className="text-xs text-slate-400">
                Porcentaje de asistencia acumulada y resolución de ejercicios prácticos.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { label: '5.° Primaria "Lira de Oro"', pct: 97.2, avg: '18.1' },
                { label: '6.° Primaria "Bicentenario"', pct: 96.8, avg: '17.9' },
                { label: '1.° Secundaria "César Vallejo"', pct: 95.4, avg: '17.2' },
                { label: '2.° Secundaria "Jorge Basadre"', pct: 96.1, avg: '17.5' },
                { label: '3.° Secundaria "Pedro Paulet"', pct: 94.9, avg: '16.9' },
                { label: '4.° Secundaria "Cap. Oppenheimer"', pct: 96.4, avg: '17.8' },
                { label: '5.° Secundaria "Excelencia 2026"', pct: 98.1, avg: '18.5' },
              ].map((row) => (
                <div key={row.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200">{row.label}</span>
                    <span className="font-mono-tabular text-[#FEF08A]">
                      {row.pct}% · Nota {row.avg}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#7F1D1D] to-[#FACC15] rounded-full"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 space-y-3 shadow-xl">
            <h3 className="text-sm font-bold text-white">
              Correlación Asistencia vs. Rendimiento Curricular
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              En el Colegio Capitán Enrique Oppenheimer, los estudiantes con asistencia superior al <strong>95%</strong> completan el <strong>98.4%</strong> de los ejercicios propuestos dentro de la misma semana de publicación del tema.
            </p>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono-tabular text-slate-300">
              <span>Índice de Retención Anual:</span>
              <span className="font-bold text-emerald-300">99.2% Nominal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
