import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Clock,
  UserCheck,
  BellRing,
  Smartphone,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Send,
} from 'lucide-react';
import {
  UserRole,
  UserProfile,
  CourseItem,
  GradeLevel,
  TopicItem,
  AssessmentItem,
  PushNotificationItem,
} from '../types';
import { INSTITUTION_ASSETS, INSTITUTIONAL_AWARDS } from '../data/initialData';

interface InstitutionalDashboardHomeProps {
  currentUser: UserProfile;
  courses: CourseItem[];
  grades: GradeLevel[];
  topics: TopicItem[];
  assessments: AssessmentItem[];
  notifications: PushNotificationItem[];
  onNavigateTab: (tab: 'inicio' | 'curricular' | 'examenes' | 'asistencia') => void;
  onSelectCourseAndOpen: (courseId: string) => void;
  onSendPushBroadcast: (title: string, message: string, targetRole: 'Todos' | UserRole) => void;
  onOpenMobileModal: () => void;
}

export const InstitutionalDashboardHome: React.FC<InstitutionalDashboardHomeProps> = ({
  currentUser,
  courses,
  grades,
  topics,
  assessments,
  notifications,
  onNavigateTab,
  onSelectCourseAndOpen,
  onSendPushBroadcast,
  onOpenMobileModal,
}) => {
  const [campusError, setCampusError] = useState(false);
  const [awardsError, setAwardsError] = useState(false);
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushTarget, setPushTarget] = useState<'Todos' | UserRole>('Todos');

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle.trim() || !pushMessage.trim()) return;
    onSendPushBroadcast(pushTitle.trim(), pushMessage.trim(), pushTarget);
    setPushTitle('');
    setPushMessage('');
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Institutional Home Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 relative rounded-2xl overflow-hidden border border-white/15 bg-slate-950 min-h-[300px] flex flex-col justify-between p-6 sm:p-8 shadow-2xl">
          <img
            src={campusError ? '/images/colegio_oppenheimer_campus_1791666912151.jpg' : INSTITUTION_ASSETS.campusHero}
            alt="Campus Colegio Capitán Enrique Oppenheimer"
            onError={() => {
              if (!campusError) setCampusError(true);
            }}
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/15 pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="text-xs font-semibold text-[#FEF08A] bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
              Bienvenido(a), {currentUser.name} · {currentUser.role.toUpperCase()}
            </div>
            <button
              type="button"
              onClick={onOpenMobileModal}
              className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>App iOS & Android</span>
            </button>
          </div>

          <div className="relative z-10 space-y-3 mt-8">
            <h1
              className="text-2xl sm:text-3xl font-bold text-white font-display"
              style={{ textWrap: 'balance' }}
            >
              Panel Académico · Colegio Capitán Enrique Oppenheimer
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 max-w-2xl leading-relaxed">
              Gestiona el avance curricular por curso y grado, desarrolla temas con generación de conceptos, ejemplos paso a paso y ejercicios propuestos autocalificables, supervisa exámenes en tiempo real y controla la asistencia escolar.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigateTab('curricular')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] hover:from-[#991B1B] hover:to-[#B91C1C] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border border-[#FACC15]/40 shadow-lg"
              >
                <Sparkles className="w-4 h-4 text-[#FACC15]" />
                <span>
                  {currentUser.role === 'estudiante'
                    ? 'Continuar Mis Temas y Ejercicios'
                    : 'Subir Tema y Generar Material Curricular'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('examenes')}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border border-white/20 backdrop-blur-md"
              >
                <Clock className="w-4 h-4 text-[#FACC15]" />
                <span>Exámenes en Tiempo Real ({assessments.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Institutional Awards & Musical Heritage Card */}
        <div className="lg:col-span-4 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 overflow-hidden flex flex-col justify-between shadow-2xl">
          <div className="relative h-40 bg-slate-950 border-b border-white/10">
            <img
              src={awardsError ? '/images/colegio_oppenheimer_premios_1791666921941.jpg' : INSTITUTION_ASSETS.awardsBanner}
              alt="Premios Obtenidos Colegio Oppenheimer"
              onError={() => {
                if (!awardsError) setAwardsError(true);
              }}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent flex items-end p-4 pointer-events-none">
              <div>
                <p className="text-[11px] font-semibold text-[#FEF08A]">
                  Orgullo Institucional · Premios Obtenidos
                </p>
                <h3 className="text-sm font-bold text-white font-display">
                  Excelencia en Música Escolar y Ciencias
                </h3>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              {INSTITUTIONAL_AWARDS.slice(0, 3).map((aw) => (
                <div
                  key={aw.title}
                  className="text-xs flex items-start justify-between gap-2 pb-2 border-b border-white/10 last:border-none last:pb-0"
                >
                  <div>
                    <p className="font-semibold text-white">{aw.title}</p>
                    <p className="text-[11px] text-slate-400">{aw.issuer}</p>
                  </div>
                  <span className="font-mono-tabular font-semibold text-[#FACC15] shrink-0">
                    {aw.year}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onSelectCourseAndOpen('cur-mus')}
              className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-[#FEF08A] flex items-center justify-between transition-colors cursor-pointer"
            >
              <span>Ver Curso de Música y Banda Sinfónica</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#FACC15]" />
            </button>
          </div>
        </div>
      </div>

      {/* 4-Column Quantitative Overview Strip (Dark Theme) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Cursos Activos por Grado</span>
            <BookOpen className="w-4 h-4 text-[#FACC15]" />
          </div>
          <div className="text-2xl font-bold text-white font-mono-tabular">
            {courses.length} Áreas · {grades.length} Grados
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Inicial (3 a 5 años), Primaria (5.° y 6.°) y Secundaria (1.° a 5.°).
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Temas y Ejercicios Publicados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono-tabular">
            {topics.length} Módulos Activos
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Teoría, casos paso a paso y ejercicios propuestos.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Exámenes y Tareas en Vivo</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono-tabular">
            {assessments.filter((a) => a.status === 'En Vivo').length} En Curso
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Calificaciones en escala 0 a 20 sincronizadas.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Participación y Asistencia</span>
            <UserCheck className="w-4 h-4 text-[#FEF08A]" />
          </div>
          <div className="text-2xl font-bold text-white font-mono-tabular">
            96.4% Puntualidad
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Control matutino y alertas push instantáneas.
          </p>
        </div>
      </div>

      {/* Curriculum Progress by Course + Real-Time Push Notification Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Avance Curricular por Curso */}
        <div className="lg:col-span-7 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white font-display">
                Avance Curricular por Curso
              </h2>
              <p className="text-xs text-slate-300">
                Selecciona cualquier curso para desarrollar sus temas, ejemplos y ejercicios prácticos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('curricular')}
              className="text-xs font-semibold text-[#FEF08A] hover:underline cursor-pointer"
            >
              Ver Malla Completa
            </button>
          </div>

          <div className="space-y-3">
            {courses.map((course, idx) => {
              const courseTopicsCount = topics.filter(
                (t) => t.courseId === course.id
              ).length;
              const progressPct = [94, 88, 91, 86, 98, 90][idx % 6];

              return (
                <div
                  key={course.id}
                  onClick={() => onSelectCourseAndOpen(course.id)}
                  className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-mono-tabular font-semibold text-[#FACC15]">
                          {course.code}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{course.area}</span>
                        <span aria-hidden="true">·</span>
                        <span>{course.teacherName}</span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-0.5">
                        {course.name}
                      </h3>
                    </div>

                    <div className="text-right font-mono-tabular">
                      <span className="text-sm font-bold text-[#FEF08A]">
                        {progressPct}%
                      </span>
                      <p className="text-[11px] text-slate-400">
                        {courseTopicsCount > 0 ? `${courseTopicsCount} temas activos` : 'Módulos listos'}
                      </p>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#7F1D1D] to-[#FACC15]"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Instant Push Notifications & Broadcast Console */}
        <div className="lg:col-span-5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FEF08A]">
                <BellRing className="w-4 h-4 text-[#FACC15]" />
                <span>Comunicación Escolar al Instante</span>
              </div>
              <h2 className="text-lg font-bold text-white font-display mt-0.5">
                Centro de Notificaciones Push
              </h2>
            </div>
            <button
              type="button"
              onClick={onOpenMobileModal}
              className="text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
            >
              Configurar Móvil
            </button>
          </div>

          {/* If Docente or Admin: Instant Push Broadcast Form */}
          {(currentUser.role === 'docente' || currentUser.role === 'admin') && (
            <form
              onSubmit={handleBroadcastSubmit}
              className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">
                  Emitir Alerta Push (iOS / Android / Web)
                </span>
                <select
                  value={pushTarget}
                  onChange={(e) =>
                    setPushTarget(e.target.value as 'Todos' | UserRole)
                  }
                  className="px-2 py-1 text-xs rounded-lg border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-[#FACC15]"
                >
                  <option value="Todos">Todos</option>
                  <option value="estudiante">Estudiantes</option>
                  <option value="docente">Docentes</option>
                </select>
              </div>

              <input
                type="text"
                value={pushTitle}
                onChange={(e) => setPushTitle(e.target.value)}
                placeholder="Título del aviso (ej. Práctica habilitada)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-white/20 bg-slate-900 text-white placeholder-slate-400 focus:outline-none focus:border-[#FACC15]"
                required
              />

              <input
                type="text"
                value={pushMessage}
                onChange={(e) => setPushMessage(e.target.value)}
                placeholder="Mensaje detallado para los dispositivos..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-white/20 bg-slate-900 text-white placeholder-slate-400 focus:outline-none focus:border-[#FACC15]"
                required
              />

              <button
                type="submit"
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] hover:from-[#991B1B] hover:to-[#B91C1C] text-white text-xs font-bold flex items-center justify-center gap-2 border border-[#FACC15]/40 transition-all cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5 text-[#FACC15]" />
                <span>Enviar Alerta Push Inmediata</span>
              </button>
            </form>
          )}

          {/* List of Recent Push Notifications */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold text-slate-300">
              Notificaciones Push Recientes
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#FEF08A]">{notif.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono-tabular">
                      {notif.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {notif.message}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span className="px-1.5 py-0.5 rounded bg-white/10 text-white">
                      {notif.category}
                    </span>
                    <span>Destino: {notif.targetRole}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
