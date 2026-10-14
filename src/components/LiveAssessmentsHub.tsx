import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  PlusCircle,
  Play,
  FileCheck,
  Award,
  RotateCcw,
  Send,
} from 'lucide-react';
import {
  UserRole,
  AssessmentItem,
  CourseItem,
  GradeLevel,
} from '../types';

interface LiveAssessmentsHubProps {
  userRole: UserRole;
  assessments: AssessmentItem[];
  courses: CourseItem[];
  grades: GradeLevel[];
  onAddAssessment: (newAssessment: AssessmentItem) => void;
  onCompleteAssessment: (assessmentId: string, scoreObtained: number) => void;
}

export const LiveAssessmentsHub: React.FC<LiveAssessmentsHubProps> = ({
  userRole,
  assessments,
  courses,
  grades,
  onAddAssessment,
  onCompleteAssessment,
}) => {
  const [activeAssessmentId, setActiveAssessmentId] = useState<string>(
    assessments[0]?.id || ''
  );
  const [isExamRunning, setIsExamRunning] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1500);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submittedResult, setSubmittedResult] = useState<{
    score: number;
    total: number;
  } | null>(null);

  // Teacher / Admin Create Assessment Form
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newType, setNewType] = useState<
    'Examen en Tiempo Real' | 'Tarea Domiciliaria' | 'Práctica Calificada'
  >('Examen en Tiempo Real');
  const [newCourseId, setNewCourseId] = useState<string>(courses[0]?.id || 'cur-mat');
  const [newGradeId, setNewGradeId] = useState<string>('sec-4');
  const [newDuration, setNewDuration] = useState<number>(25);
  const [newQuestionPrompt, setNewQuestionPrompt] = useState<string>('');
  const [newOptionA, setNewOptionA] = useState<string>('');
  const [newOptionB, setNewOptionB] = useState<string>('');
  const [newOptionC, setNewOptionC] = useState<string>('');
  const [newOptionD, setNewOptionD] = useState<string>('');

  const currentAssessment =
    assessments.find((a) => a.id === activeAssessmentId) || assessments[0];

  useEffect(() => {
    if (!isExamRunning) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isExamRunning]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
  };

  const handleStartExam = (assessment: AssessmentItem) => {
    setActiveAssessmentId(assessment.id);
    setSecondsRemaining(assessment.durationMinutes * 60);
    setAnswers({});
    setSubmittedResult(null);
    setIsExamRunning(true);
  };

  const handleSubmitExam = () => {
    if (!currentAssessment) return;
    let totalEarned = 0;
    currentAssessment.questions.forEach((q) => {
      if (answers[q.id] === q.correctIndex) {
        totalEarned += q.points;
      }
    });

    const finalScore = Math.min(20, Math.round((totalEarned / currentAssessment.totalPoints) * 20));
    setSubmittedResult({ score: finalScore, total: 20 });
    setIsExamRunning(false);
    onCompleteAssessment(currentAssessment.id, finalScore);
  };

  const handleCreateAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created: AssessmentItem = {
      id: `ass-new-${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      courseId: newCourseId,
      gradeId: newGradeId,
      durationMinutes: newDuration,
      status: 'En Vivo',
      dueDate: 'Hoy · Sesión en curso',
      submissionsCount: 0,
      totalStudents: 32,
      totalPoints: 20,
      questions: [
        {
          id: `q-gen-1`,
          prompt:
            newQuestionPrompt.trim() ||
            `Determinar la solución demostrada para el caso planteado en ${newTitle.trim()}.`,
          points: 20,
          options: [
            newOptionA.trim() || 'Solución A comprobada',
            newOptionB.trim() || 'Solución alternativa B',
            newOptionC.trim() || 'Opción teórica C',
            newOptionD.trim() || 'Aproximación empírica D',
          ],
          correctIndex: 0,
        },
      ],
    };

    onAddAssessment(created);
    setActiveAssessmentId(created.id);
    setNewTitle('');
    setNewQuestionPrompt('');
    setNewOptionA('');
    setNewOptionB('');
    setNewOptionC('');
    setNewOptionD('');
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Controls (Dark Theme) */}
      <div className="p-5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#FEF08A]">
            Evaluaciones Sincrónicas y Tareas Escolares
          </p>
          <h2 className="text-xl font-bold text-white font-display">
            Gestión de Exámenes y Tareas en Tiempo Real
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Monitoreo en vivo de entregas, cronómetro sincrónico y calificación vigesimal (0 a 20).
          </p>
        </div>

        {(userRole === 'docente' || userRole === 'admin') && (
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] hover:from-[#991B1B] hover:to-[#B91C1C] text-white text-xs font-bold flex items-center gap-2 border border-[#FACC15]/40 shadow-lg cursor-pointer transition-all"
          >
            <PlusCircle className="w-4 h-4 text-[#FACC15]" />
            <span>Programar Examen o Tarea en Vivo</span>
          </button>
        )}
      </div>

      {/* Create Assessment Form for Teachers/Admins */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateAssessment}
          className="p-6 rounded-2xl bg-black/70 backdrop-blur-2xl border border-[#FACC15]/40 space-y-4 shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-display">
              Lanzar Nueva Evaluación o Tarea en Tiempo Real
            </h3>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Título del Examen o Tarea *
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ej. Práctica Calificada de Álgebra y Funciones"
                className="w-full px-3 py-2 text-xs rounded-xl border border-white/20 bg-slate-900 text-white placeholder-slate-400 focus:outline-none focus:border-[#FACC15]"
                required
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Modalidad
              </label>
              <select
                value={newType}
                onChange={(e) =>
                  setNewType(
                    e.target.value as
                      | 'Examen en Tiempo Real'
                      | 'Tarea Domiciliaria'
                      | 'Práctica Calificada'
                  )
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-[#FACC15]"
              >
                <option value="Examen en Tiempo Real">Examen en Tiempo Real</option>
                <option value="Práctica Calificada">Práctica Calificada</option>
                <option value="Tarea Domiciliaria">Tarea Domiciliaria</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Curso
              </label>
              <select
                value={newCourseId}
                onChange={(e) => setNewCourseId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-[#FACC15]"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Duración (min)
              </label>
              <input
                type="number"
                min={5}
                max={120}
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono-tabular rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-[#FACC15]"
              />
            </div>

            <div className="sm:col-span-12">
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Pregunta Principal de Evaluación (Escala 0 a 20)
              </label>
              <input
                type="text"
                value={newQuestionPrompt}
                onChange={(e) => setNewQuestionPrompt(e.target.value)}
                placeholder="Escribe el enunciado del problema o pregunta..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-white/20 bg-slate-900 text-white placeholder-slate-400 focus:outline-none focus:border-[#FACC15]"
              />
            </div>

            <div className="sm:col-span-3">
              <input
                type="text"
                value={newOptionA}
                onChange={(e) => setNewOptionA(e.target.value)}
                placeholder="Opción A (Correcta)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-500/50 bg-emerald-950/30 text-emerald-200 placeholder-emerald-400/50"
              />
            </div>
            <div className="sm:col-span-3">
              <input
                type="text"
                value={newOptionB}
                onChange={(e) => setNewOptionB(e.target.value)}
                placeholder="Opción B"
                className="w-full px-3 py-2 text-xs rounded-xl border border-white/20 bg-slate-900 text-white placeholder-slate-400"
              />
            </div>
            <div className="sm:col-span-3">
              <input
                type="text"
                value={newOptionC}
                onChange={(e) => setNewOptionC(e.target.value)}
                placeholder="Opción C"
                className="w-full px-3 py-2 text-xs rounded-xl border border-white/20 bg-slate-900 text-white placeholder-slate-400"
              />
            </div>
            <div className="sm:col-span-3">
              <input
                type="text"
                value={newOptionD}
                onChange={(e) => setNewOptionD(e.target.value)}
                placeholder="Opción D"
                className="w-full px-3 py-2 text-xs rounded-xl border border-white/20 bg-slate-900 text-white placeholder-slate-400"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] hover:from-[#991B1B] hover:to-[#B91C1C] text-white text-xs font-bold border border-[#FACC15]/40 shadow-lg cursor-pointer"
            >
              Publicar y Emitir Alerta Push a Estudiantes
            </button>
          </div>
        </form>
      )}

      {/* Split View: Left List of Assessments + Right Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-3">
          {assessments.length === 0 ? (
            <div className="p-8 rounded-2xl bg-black/40 border border-white/10 text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-semibold text-white">Sin Evaluaciones Programadas</p>
              <p className="text-xs text-slate-400">
                Aún no hay exámenes o tareas creadas. Use el botón superior para programar la primera evaluación del colegio.
              </p>
            </div>
          ) : (
            assessments.map((item) => {
              const course = courses.find((c) => c.id === item.courseId);
              const grade = grades.find((g) => g.id === item.gradeId);
              const isSelected = currentAssessment?.id === item.id;
              const participationPct = Math.round(
                (item.submissionsCount / item.totalStudents) * 100
              );

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveAssessmentId(item.id);
                    setIsExamRunning(false);
                    setSubmittedResult(null);
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#7F1D1D]/50 border-[#FACC15]/60 text-white shadow-lg'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span className="font-semibold text-[#FEF08A]">{item.type}</span>
                    <span>
                      Estado: <strong className="text-white">{item.status}</strong>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">
                    {item.title}
                  </h3>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    <span>{course?.name}</span>
                    <span aria-hidden="true">·</span>
                    <span>{grade?.name}</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-slate-300 flex items-center gap-1 font-mono-tabular">
                      <Clock className="w-3.5 h-3.5 text-[#FACC15]" />
                      {item.durationMinutes} min · {item.dueDate}
                    </span>
                    <span className="font-mono-tabular font-semibold text-[#FEF08A]">
                      Entregas: {item.submissionsCount}/{item.totalStudents} ({participationPct}%)
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Live Assessment Execution & Real-Time Telemetry */}
        <div className="lg:col-span-7 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 p-6 sm:p-8 space-y-6 shadow-xl">
          {currentAssessment ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <div className="text-xs text-slate-400">
                    {currentAssessment.type} · Calificación Vigesimal ({currentAssessment.totalPoints} pts)
                  </div>
                  <h3 className="text-xl font-bold text-white font-display mt-0.5">
                    {currentAssessment.title}
                  </h3>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isExamRunning ? (
                    <div className="px-4 py-2 rounded-xl bg-[#7F1D1D] text-white font-mono-tabular text-sm font-bold flex items-center gap-2 border border-[#FACC15]/40 shadow-md">
                      <Clock className="w-4 h-4 text-[#FACC15]" />
                      <span>{formatTimer(secondsRemaining)}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartExam(currentAssessment)}
                      className="px-4 py-2.5 rounded-xl bg-[#7F1D1D] hover:bg-[#991B1B] text-white text-xs font-bold flex items-center gap-2 border border-[#FACC15]/40 transition-all cursor-pointer shadow-md"
                    >
                      <Play className="w-4 h-4 text-[#FACC15]" />
                      <span>
                        {userRole === 'estudiante'
                          ? 'Rendir Evaluación Ahora'
                          : 'Vista Previa Interactiva'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Submitted Score Banner */}
              {submittedResult && (
                <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                  <div className="flex items-center gap-3.5">
                    <Award className="w-8 h-8 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="text-base font-bold text-emerald-200">
                        Evaluación Calificada en Tiempo Real
                      </h4>
                      <p className="text-xs text-emerald-300/80">
                        La nota se ha sincronizado en el registro auxiliar y el progreso curricular.
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold font-mono-tabular text-emerald-200">
                      Nota: {submittedResult.score} / {submittedResult.total}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartExam(currentAssessment)}
                      className="text-xs font-semibold text-emerald-300 hover:underline flex items-center gap-1 ml-auto mt-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Reintentar simulación
                    </button>
                  </div>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-5">
                {currentAssessment.questions.map((q) => {
                  const chosen = answers[q.id];

                  return (
                    <div
                      key={q.id}
                      className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-3.5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <p className="text-sm font-semibold text-white">
                          {q.prompt}
                        </p>
                        <span className="text-xs font-mono-tabular font-semibold text-[#FEF08A] shrink-0">
                          {q.points} pts
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = chosen === oIdx;
                          let style =
                            'bg-black/40 border-white/15 text-slate-300 hover:border-white/30';

                          if (isSelected && !submittedResult) {
                            style =
                              'bg-[#7F1D1D] border-[#FACC15]/60 text-white font-semibold shadow-md';
                          } else if (submittedResult) {
                            if (oIdx === q.correctIndex) {
                              style =
                                'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold';
                            } else if (isSelected && oIdx !== q.correctIndex) {
                              style =
                                'bg-red-950/60 border-red-500 text-red-200 font-semibold';
                            }
                          }

                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => {
                                if (!isExamRunning && !submittedResult) {
                                  setIsExamRunning(true);
                                }
                                if (submittedResult) return;
                                setAnswers((prev) => ({ ...prev, [q.id]: oIdx }));
                              }}
                              className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-mono-tabular transition-all cursor-pointer ${style}`}
                            >
                              {String.fromCharCode(65 + oIdx)}. {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit Exam Footer */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-300 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#FACC15]" />
                  <span>
                    Preguntas respondidas: {Object.keys(answers).length} de{' '}
                    {currentAssessment.questions.length}
                  </span>
                </div>

                {!submittedResult && (
                  <button
                    type="button"
                    onClick={handleSubmitExam}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 border border-emerald-400/40 shadow-lg transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Finalizar y Enviar Evaluación</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="py-16 text-center space-y-3">
              <Award className="w-12 h-12 text-[#FACC15]/40 mx-auto" />
              <h4 className="text-base font-bold text-white font-display">
                Módulo de Evaluaciones y Tareas en Tiempo Real
              </h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                No hay ninguna evaluación seleccionada. Cuando programe un examen o tarea en vivo, los estudiantes podrán rendirla sincrónicamente desde aquí.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
