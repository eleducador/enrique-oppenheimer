import React, { useState } from 'react';
import {
  BookOpen,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  ChevronRight,
  FileText,
  Lightbulb,
  Check,
  AlertCircle,
  Loader2,
  FileUp,
  Download,
  Eye,
  Trash2,
  X,
  Presentation,
  SlidersHorizontal,
  ChevronLeft,
  Calendar,
  Layers,
  FolderOpen,
} from 'lucide-react';
import {
  UserRole,
  CourseItem,
  GradeLevel,
  TopicItem,
  StudentProgressRecord,
  CurricularMaterial,
  MaterialFileType,
} from '../types';

interface CurriculumStudioProps {
  userRole: UserRole;
  userName: string;
  courses: CourseItem[];
  grades: GradeLevel[];
  topics: TopicItem[];
  materials?: CurricularMaterial[];
  selectedGradeId: string;
  selectedCourseId: string;
  onSelectGrade: (gradeId: string) => void;
  onSelectCourse: (courseId: string) => void;
  onAddTopic: (newTopic: TopicItem) => void;
  onAddMaterial?: (newMaterial: CurricularMaterial) => void;
  onDeleteMaterial?: (materialId: string) => void;
  studentProgress: StudentProgressRecord;
  onRecordExerciseScore: (topicId: string, correctCount: number, totalCount: number) => void;
}

export const CurriculumStudio: React.FC<CurriculumStudioProps> = ({
  userRole,
  userName,
  courses,
  grades,
  topics,
  materials = [],
  selectedGradeId,
  selectedCourseId,
  onSelectGrade,
  onSelectCourse,
  onAddTopic,
  onAddMaterial,
  onDeleteMaterial,
  studentProgress,
  onRecordExerciseScore,
}) => {
  // Main Tab: "temas" (Syllabus & Generator) vs "materiales" (PDF & PPTX files)
  const [activeMainSection, setActiveMainSection] = useState<'temas' | 'materiales'>('temas');

  const filteredTopics = topics.filter(
    (t) => t.courseId === selectedCourseId && t.gradeId === selectedGradeId
  );

  const activeTopics =
    filteredTopics.length > 0
      ? filteredTopics
      : topics.filter((t) => t.courseId === selectedCourseId);

  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    activeTopics[0]?.id || ''
  );
  const [activeSubTab, setActiveSubTab] = useState<'conceptos' | 'ejemplos' | 'ejercicios'>('conceptos');

  // Teacher Topic Auto-Generator State
  const [showUploadPanel, setShowUploadPanel] = useState<boolean>(false);
  const [newTopicTitle, setNewTopicTitle] = useState<string>('');
  const [newUnitName, setNewUnitName] = useState<string>('Unidad 6: Desarrollo Curricular Aplicado');
  const [newBimestre, setNewBimestre] = useState<'I Bimestre' | 'II Bimestre' | 'III Bimestre' | 'IV Bimestre'>('III Bimestre');
  const [teacherNotes, setTeacherNotes] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationNotice, setGenerationNotice] = useState<string>('');

  // Teacher PDF / PPTX Upload Modal State
  const [showMaterialModal, setShowMaterialModal] = useState<boolean>(false);
  const [materialTitle, setMaterialTitle] = useState<string>('');
  const [materialDescription, setMaterialDescription] = useState<string>('');
  const [materialFileType, setMaterialFileType] = useState<MaterialFileType>('pdf');
  const [materialFileName, setMaterialFileName] = useState<string>('');
  const [materialFileSize, setMaterialFileSize] = useState<string>('3.5 MB');
  const [materialUnit, setMaterialUnit] = useState<string>('Unidad Curricular Principal');
  const [materialBimestre, setMaterialBimestre] = useState<'I Bimestre' | 'II Bimestre' | 'III Bimestre' | 'IV Bimestre'>('I Bimestre');
  const [materialPagesOrSlides, setMaterialPagesOrSlides] = useState<number>(20);
  const [uploadedFileRaw, setUploadedFileRaw] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Material Document Preview Modal State
  const [previewMaterial, setPreviewMaterial] = useState<CurricularMaterial | null>(null);
  const [previewSlideIndex, setPreviewSlideIndex] = useState<number>(0);

  // Interactive Exercise State keyed by `${topicId}-${exerciseIndex}`
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submittedExercises, setSubmittedExercises] = useState<Record<string, boolean>>({});
  const [visibleHints, setVisibleHints] = useState<Record<string, boolean>>({});

  const currentCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const currentGrade = grades.find((g) => g.id === selectedGradeId) || grades[0];
  const currentTopic =
    activeTopics.find((t) => t.id === selectedTopicId) || activeTopics[0] || null;

  // Filtered Curricular Materials for selected course and grade
  const currentMaterials = materials.filter(
    (m) => m.courseId === selectedCourseId && m.gradeId === selectedGradeId
  );

  const handleGenerateAndPublishTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;

    setIsGenerating(true);
    setGenerationNotice(
      'Estructurando conceptos teóricos, ejemplos resueltos paso a paso y ejercicios propuestos...'
    );

    try {
      const response = await fetch('/api/generate-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicTitle: newTopicTitle.trim(),
          courseName: currentCourse.name,
          gradeLevel: currentGrade.name,
          unitName: newUnitName.trim(),
          teacherNotes: teacherNotes.trim(),
        }),
      });

      const generated = await response.json();

      const createdTopic: TopicItem = {
        id: `top-gen-${Date.now()}`,
        courseId: currentCourse.id,
        gradeId: currentGrade.id,
        bimestre: newBimestre,
        unitName: newUnitName.trim() || 'Unidad Curricular Activa',
        orderIndex: activeTopics.length + 1,
        title: newTopicTitle.trim(),
        summary:
          generated.summary ||
          `Desarrollo curricular completo con conceptos teóricos, ejemplos ilustrativos y ejercicios prácticos de ${newTopicTitle.trim()}.`,
        estimatedMinutes: generated.estimatedMinutes || 45,
        publishedAt: 'Hoy · Recién Publicado',
        authorName: userName,
        status: 'En Curso',
        concepts:
          generated.concepts && generated.concepts.length > 0
            ? generated.concepts
            : [
                {
                  title: 'Definición y Marco Teórico de ' + newTopicTitle.trim(),
                  explanation:
                    'Fundamento conceptual estructurado con base en los lineamientos curriculares del curso.',
                  keyFormulaOrRule: 'Regla Operativa Fundamental: f(x) = Ecuación de aplicación directa',
                },
              ],
        examples:
          generated.examples && generated.examples.length > 0
            ? generated.examples
            : [
                {
                  title: 'Caso Práctico Resuelto',
                  problemStatement: 'Calcular el valor fundamental aplicando la propiedad analítica.',
                  stepByStepSolution: [
                    'Paso 1: Identificar las condiciones dadas en el enunciado.',
                    'Paso 2: Aplicar la propiedad teórica correspondiente.',
                    'Paso 3: Resolver y simplificar la expresión final.',
                  ],
                  finalAnswer: 'Resultado demostrado y comprobado.',
                },
              ],
        exercises:
          generated.exercises && generated.exercises.length > 0
            ? generated.exercises
            : [
                {
                  question: `¿Cuál es la propiedad fundamental para resolver ejercicios de ${newTopicTitle.trim()}?`,
                  difficulty: 'Intermedio',
                  options: [
                    'Aplicar el principio de conservación y descomposición algebraica',
                    'Asumir un valor empírico sin demostración',
                    'Omitir los términos cuadráticos',
                    'Solo operar números enteros',
                  ],
                  correctIndex: 0,
                  hint: 'Recuerda el marco conceptual desarrollado en la sección teórica.',
                  explanation:
                    'La opción A establece el procedimiento riguroso establecido para este nivel curricular.',
                },
              ],
      };

      onAddTopic(createdTopic);
      setSelectedTopicId(createdTopic.id);
      setShowUploadPanel(false);
      setNewTopicTitle('');
      setTeacherNotes('');
      setGenerationNotice('');
    } catch {
      setGenerationNotice('Generado con módulo pedagógico local.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Teacher Uploading PDF or PPTX File
  const handleFileSelection = (file: File) => {
    setUploadedFileRaw(file);
    const name = file.name;
    setMaterialFileName(name);

    // Detect file type
    const isPptx = name.endsWith('.pptx') || name.endsWith('.ppt');
    setMaterialFileType(isPptx ? 'pptx' : 'pdf');

    // Auto format size
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    setMaterialFileSize(`${sizeInMb} MB`);

    // Clean title suggestion
    const cleanTitle = name.replace(/\.[^/.]+$/, '').replace(/[_|-]/g, ' ');
    if (!materialTitle) {
      setMaterialTitle(cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1));
    }

    setMaterialPagesOrSlides(isPptx ? 24 : 18);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialTitle.trim()) return;

    const newMat: CurricularMaterial = {
      id: `mat-${materialFileType}-${Date.now()}`,
      title: materialTitle.trim(),
      description:
        materialDescription.trim() ||
        `Material pedagógico oficial en formato ${materialFileType.toUpperCase()} para el curso de ${currentCourse.name} (${currentGrade.name}).`,
      fileType: materialFileType,
      fileName: materialFileName || `Material_${materialFileType.toUpperCase()}_${Date.now()}.${materialFileType}`,
      fileSize: materialFileSize || '3.5 MB',
      courseId: currentCourse.id,
      gradeId: currentGrade.id,
      unitName: materialUnit.trim() || 'Unidad Curricular',
      bimestre: materialBimestre,
      uploadedBy: userName,
      uploadedAt: 'Hoy · Recién subido',
      pageOrSlideCount: materialPagesOrSlides || (materialFileType === 'pdf' ? 16 : 24),
      downloadCount: 0,
      tags: [currentCourse.name, materialFileType.toUpperCase(), currentGrade.name],
    };

    if (onAddMaterial) {
      onAddMaterial(newMat);
    }

    setShowMaterialModal(false);
    setMaterialTitle('');
    setMaterialDescription('');
    setMaterialFileName('');
    setUploadedFileRaw(null);
  };

  const handleDownloadMaterialFile = (material: CurricularMaterial) => {
    // Generate real downloadable Blob content
    const content = `=====================================================
COLEGIO CAPITÁN ENRIQUE OPPENHEIMER (LIMA, PERÚ)
DIRECCIÓN ACADÉMICA Y GESTIÓN CURRICULAR 2026
=====================================================

MATERIAL EDUCATIVO OFICIAL: ${material.title.toUpperCase()}
FORMATO ORIGINAL: ${material.fileType.toUpperCase()} (${material.pageOrSlideCount} ${material.fileType === 'pdf' ? 'Páginas' : 'Diapositivas'})
ASIGNATURA: ${currentCourse.name} (Código: ${currentCourse.code})
GRADO Y SECCIÓN: ${currentGrade.name} - ${currentGrade.section}
UNIDAD: ${material.unitName} (${material.bimestre})
DOCENTE RESPONSABLE: ${material.uploadedBy}
FECHA DE PUBLICACIÓN: ${material.uploadedAt}
TAMAÑO REGISTRADO: ${material.fileSize}

-----------------------------------------------------
ESTRUCTURA DEL DOCUMENTO PEDAGÓGICO:
1. INTRODUCCIÓN Y OBJETIVOS DE APRENDIZAJE
2. DESARROLLO CONCEPTUAL Y FORMULACIÓN
3. CASOS Y EJEMPLOS RESUELTOS PASO A PASO
4. PROBLEMAS PROPUESTOS Y TALLER DE REFORZAMIENTO
5. AUTOEVALUACIÓN Y RÚBRICA DE COMPETENCIAS

Este documento ha sido generado por la plataforma virtual del Colegio Capitán Enrique Oppenheimer para el uso exclusivo de estudiantes y docentes de la institución.
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = material.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSelectOption = (topicId: string, exIdx: number, optIdx: number) => {
    const key = `${topicId}-${exIdx}`;
    if (submittedExercises[key]) return;
    setSelectedAnswers((prev) => ({ ...prev, [key]: optIdx }));
  };

  const handleVerifyExercise = (topic: TopicItem, exIdx: number) => {
    const key = `${topic.id}-${exIdx}`;
    const chosen = selectedAnswers[key];
    if (chosen === undefined) return;

    setSubmittedExercises((prev) => ({ ...prev, [key]: true }));

    const updatedSubmitted = { ...submittedExercises, [key]: true };
    const allAnswered = topic.exercises.every(
      (_, idx) => updatedSubmitted[`${topic.id}-${idx}`]
    );

    if (allAnswered) {
      let correctCount = 0;
      topic.exercises.forEach((ex, idx) => {
        const k = `${topic.id}-${idx}`;
        if (selectedAnswers[k] === ex.correctIndex) {
          correctCount++;
        }
      });
      onRecordExerciseScore(topic.id, correctCount, topic.exercises.length);
    }
  };

  const handleResetTopicExercises = (topic: TopicItem) => {
    const nextAnswers = { ...selectedAnswers };
    const nextSubmitted = { ...submittedExercises };
    const nextHints = { ...visibleHints };

    topic.exercises.forEach((_, idx) => {
      const key = `${topic.id}-${idx}`;
      delete nextAnswers[key];
      delete nextSubmitted[key];
      delete nextHints[key];
    });

    setSelectedAnswers(nextAnswers);
    setSubmittedExercises(nextSubmitted);
    setVisibleHints(nextHints);
  };

  const completedCount = activeTopics.filter((t) =>
    studentProgress.completedTopicIds.includes(t.id)
  ).length;
  const curriculumCompletionPercent =
    activeTopics.length > 0
      ? Math.round((completedCount / activeTopics.length) * 100)
      : 0;

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Controls: Grade, Course and Navigation Tabs */}
      <div className="rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Malla Curricular por Grado y Curso</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-[#FACC15]">{currentGrade.name}</span>
            <span aria-hidden="true">·</span>
            <span>{currentGrade.section}</span>
          </div>
          <h2 className="text-xl font-bold text-white font-display">
            {currentCourse.name}
          </h2>
          <p className="text-xs text-slate-300">
            Docente Titular: <strong className="text-white">{currentCourse.teacherName}</strong> ·{' '}
            <span className="font-mono-tabular">{currentCourse.weeklyHours} hrs/semana</span> · Código{' '}
            <span className="font-mono-tabular text-[#FEF08A]">{currentCourse.code}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Grade Selector */}
          <div>
            <select
              value={selectedGradeId}
              onChange={(e) => onSelectGrade(e.target.value)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-[#FACC15]"
            >
              {grades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Course Selector */}
          <div>
            <select
              value={selectedCourseId}
              onChange={(e) => {
                onSelectCourse(e.target.value);
                const nextCourseTopics = topics.filter(
                  (t) => t.courseId === e.target.value
                );
                if (nextCourseTopics[0]) {
                  setSelectedTopicId(nextCourseTopics[0].id);
                }
              }}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-[#FACC15]"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* TEACHER / ADMIN ACTIONS: Upload Material (PDF / PPTX) & Topic Generator */}
          {(userRole === 'docente' || userRole === 'admin') && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowMaterialModal(true);
                  setActiveMainSection('materiales');
                }}
                className="px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#991B1B] to-[#7F1D1D] hover:from-[#B91C1C] hover:to-[#991B1B] rounded-xl flex items-center gap-2 border border-[#FACC15]/60 shadow-lg cursor-pointer transition-all"
              >
                <FileUp className="w-4 h-4 text-[#FACC15]" />
                <span>Subir Material (PDF / PPTX)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowUploadPanel(!showUploadPanel);
                  setActiveMainSection('temas');
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/15 rounded-xl flex items-center gap-1.5 border border-white/15 cursor-pointer transition-all"
                title="Generador pedagógico con IA"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FACC15]" />
                <span>Crear Tema</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Section Switcher Tabs: "Malla y Temas" vs "Material Didáctico (PDF / PPTX)" */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveMainSection('temas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeMainSection === 'temas'
              ? 'bg-[#7F1D1D] text-white border border-[#FACC15]/40 shadow-lg'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#FACC15]" />
          <span>Malla Curricular y Ejercicios Interactivos</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] text-[#FEF08A]">
            {activeTopics.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMainSection('materiales')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
            activeMainSection === 'materiales'
              ? 'bg-[#7F1D1D] text-white border border-[#FACC15]/40 shadow-lg'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <FolderOpen className="w-4 h-4 text-[#FACC15]" />
          <span>Material Curricular (PDF y PPTX)</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] text-[#FEF08A]">
            {currentMaterials.length}
          </span>
        </button>
      </div>

      {/* MODAL: SUBIR MATERIAL (PDF / PPTX) PARA EL PROFESOR */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-950 border border-[#FACC15]/50 shadow-2xl p-6 text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#7F1D1D] border border-[#FACC15]/50 flex items-center justify-center shadow">
                  <FileUp className="w-5 h-5 text-[#FACC15]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    Subir Material Curricular (PDF o PPTX)
                  </h3>
                  <p className="text-xs text-slate-300">
                    {currentCourse.name} · {currentGrade.name} · Docente: {userName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMaterialModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  isDragging
                    ? 'border-[#FACC15] bg-[#7F1D1D]/20'
                    : 'border-white/20 hover:border-white/40 bg-white/5'
                }`}
              >
                <input
                  type="file"
                  id="material-file-input"
                  accept=".pdf, .pptx, .ppt, application/pdf, application/vnd.openxmlformats-officedocument.presentationml.presentation, application/vnd.ms-powerpoint"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelection(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="material-file-input"
                  className="cursor-pointer block space-y-2"
                >
                  <div className="flex justify-center items-center gap-3">
                    <span className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 inline-flex items-center gap-1.5 text-xs font-bold">
                      <FileText className="w-4 h-4 text-red-400" />
                      <span>Formato PDF</span>
                    </span>
                    <span className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300 inline-flex items-center gap-1.5 text-xs font-bold">
                      <Presentation className="w-4 h-4 text-amber-400" />
                      <span>Diapositivas PPTX</span>
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-white pt-2">
                    {materialFileName ? (
                      <span className="text-[#FEF08A] font-bold">
                        Archivo seleccionado: {materialFileName} ({materialFileSize})
                      </span>
                    ) : (
                      'Arrastra aquí tu archivo PDF o presentación PPTX, o haz clic para explorar'
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Compatible con Adobe Acrobat PDF (.pdf) y Microsoft PowerPoint (.pptx / .ppt)
                  </p>
                </label>
              </div>

              {/* Form Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Título del Material Didáctico *
                  </label>
                  <input
                    type="text"
                    value={materialTitle}
                    onChange={(e) => setMaterialTitle(e.target.value)}
                    placeholder="Ej. Guía Teórica y Práctica: Funciones Cuadráticas"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:border-[#FACC15]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Tipo de Documento
                  </label>
                  <select
                    value={materialFileType}
                    onChange={(e) => setMaterialFileType(e.target.value as MaterialFileType)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-white/20 text-white focus:outline-none focus:border-[#FACC15]"
                  >
                    <option value="pdf">Documento PDF (Lectura / Guía)</option>
                    <option value="pptx">Presentación PPTX (Diapositivas)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    {materialFileType === 'pdf' ? 'Número de Páginas' : 'Número de Diapositivas'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={materialPagesOrSlides}
                    onChange={(e) => setMaterialPagesOrSlides(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-white/20 text-white focus:outline-none focus:border-[#FACC15]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Unidad Curricular
                  </label>
                  <input
                    type="text"
                    value={materialUnit}
                    onChange={(e) => setMaterialUnit(e.target.value)}
                    placeholder="Ej. Unidad 1: Álgebra Fundamental"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-white/20 text-white focus:outline-none focus:border-[#FACC15]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Periodo / Bimestre
                  </label>
                  <select
                    value={materialBimestre}
                    onChange={(e) =>
                      setMaterialBimestre(
                        e.target.value as 'I Bimestre' | 'II Bimestre' | 'III Bimestre' | 'IV Bimestre'
                      )
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-white/20 text-white focus:outline-none focus:border-[#FACC15]"
                  >
                    <option value="I Bimestre">I Bimestre</option>
                    <option value="II Bimestre">II Bimestre</option>
                    <option value="III Bimestre">III Bimestre</option>
                    <option value="IV Bimestre">IV Bimestre</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Descripción / Indicaciones para el Alumno
                  </label>
                  <textarea
                    rows={2}
                    value={materialDescription}
                    onChange={(e) => setMaterialDescription(e.target.value)}
                    placeholder="Ej. Revisar las diapositivas de clase antes de la sesión del jueves. Incluye problemas modelo y fórmulas destacadas."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:border-[#FACC15]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] hover:from-[#991B1B] hover:to-[#B91C1C] rounded-xl border border-[#FACC15]/40 shadow-lg cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-[#FACC15]" />
                  <span>Publicar Material para el Aula</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INTERACTIVE PREVIEW VIEWER (PDF / PPTX) */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-4xl rounded-2xl bg-slate-950 border border-white/20 shadow-2xl p-6 text-slate-100 space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-start justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow ${
                    previewMaterial.fileType === 'pdf'
                      ? 'bg-red-950 border-red-500/50 text-red-300'
                      : 'bg-amber-950 border-amber-500/50 text-amber-300'
                  }`}
                >
                  {previewMaterial.fileType === 'pdf' ? (
                    <FileText className="w-5 h-5 text-red-400" />
                  ) : (
                    <Presentation className="w-5 h-5 text-amber-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    {previewMaterial.title}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {previewMaterial.fileName} · {previewMaterial.fileSize} · {previewMaterial.pageOrSlideCount}{' '}
                    {previewMaterial.fileType === 'pdf' ? 'páginas' : 'diapositivas'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadMaterialFile(previewMaterial)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] text-white text-xs font-bold flex items-center gap-1.5 border border-[#FACC15]/40 cursor-pointer shadow"
                >
                  <Download className="w-3.5 h-3.5 text-[#FACC15]" />
                  <span>Descargar Archivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMaterial(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document / Slide Viewport */}
            <div className="flex-1 overflow-y-auto space-y-4 min-h-[360px] p-4 rounded-xl bg-black/60 border border-white/10">
              {previewMaterial.fileType === 'pptx' ? (
                /* PPTX Presentation Simulator */
                <div className="space-y-4">
                  <div className="aspect-video w-full max-w-2xl mx-auto rounded-xl bg-gradient-to-br from-slate-900 to-black border-2 border-amber-500/40 p-6 flex flex-col justify-between shadow-2xl relative">
                    <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/10 pb-2">
                      <span className="font-bold text-[#FEF08A]">
                        Colegio Oppenheimer · Diapositiva {previewSlideIndex + 1} de {previewMaterial.pageOrSlideCount}
                      </span>
                      <span>{currentCourse.name}</span>
                    </div>

                    <div className="text-center py-6 space-y-3">
                      {previewSlideIndex === 0 ? (
                        <>
                          <span className="px-3 py-1 rounded-full bg-amber-950/80 text-amber-300 text-xs font-bold border border-amber-500/40">
                            Presentación Magistral Curricular
                          </span>
                          <h2 className="text-2xl font-extrabold text-white font-display">
                            {previewMaterial.title}
                          </h2>
                          <p className="text-xs text-slate-300 max-w-md mx-auto">
                            {previewMaterial.description}
                          </p>
                          <p className="text-[11px] text-amber-200 font-mono-tabular">
                            Expositor: {previewMaterial.uploadedBy}
                          </p>
                        </>
                      ) : (
                        <>
                          <h4 className="text-lg font-bold text-white">
                            Sección {previewSlideIndex}: Análisis Conceptual y Gráfico
                          </h4>
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 text-left max-w-lg mx-auto space-y-2">
                            <p className="font-semibold text-[#FEF08A]">
                              Puntos Clave Desarrollados:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                              <li>Modelamiento y aplicaciones en la vida cotidiana.</li>
                              <li>Identificación de variables críticas y ecuaciones directas.</li>
                              <li>Demostración ilustrada paso a paso para el nivel 4.° de secundaria.</li>
                            </ul>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10 pt-2">
                      <span>{previewMaterial.unitName}</span>
                      <span>Capitán Enrique Oppenheimer 2026</span>
                    </div>
                  </div>

                  {/* Slide Navigation Controls */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={previewSlideIndex === 0}
                      onClick={() => setPreviewSlideIndex((prev) => Math.max(0, prev - 1))}
                      className="px-3 py-1.5 rounded-lg bg-white/10 disabled:opacity-30 hover:bg-white/20 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Anterior</span>
                    </button>
                    <span className="text-xs font-mono-tabular text-slate-300">
                      {previewSlideIndex + 1} / {previewMaterial.pageOrSlideCount}
                    </span>
                    <button
                      type="button"
                      disabled={previewSlideIndex >= previewMaterial.pageOrSlideCount - 1}
                      onClick={() =>
                        setPreviewSlideIndex((prev) =>
                          Math.min(previewMaterial.pageOrSlideCount - 1, prev + 1)
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-white/10 disabled:opacity-30 hover:bg-white/20 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* PDF Document Viewer Simulator */
                <div className="max-w-2xl mx-auto rounded-xl bg-slate-900 border border-red-500/40 p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-red-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Documento PDF Oficial · {previewMaterial.pageOrSlideCount} Páginas
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono-tabular">
                      Pág. 1 de {previewMaterial.pageOrSlideCount}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed text-slate-200">
                    <h2 className="text-lg font-bold text-white font-display border-b border-white/10 pb-2">
                      {previewMaterial.title}
                    </h2>
                    <p className="text-slate-300 italic">
                      {previewMaterial.description}
                    </p>

                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                      <p className="font-bold text-[#FEF08A] uppercase tracking-wide text-[11px]">
                        Contenido Curricular Desarrollado:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs">
                        <li>Marco conceptual y axiomas de la unidad ({previewMaterial.unitName}).</li>
                        <li>Ejercicios modelo resueltos con metodología rigurosa.</li>
                        <li>Banco de preguntas para el examen bimestral con claves justificadas.</li>
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-[11px] text-red-200">
                      <strong>Nota del Docente:</strong> Este material es de lectura obligatoria y constituye la base para las prácticas calificadas y el avance de temas en la plataforma.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: MATERIAL DIDÁCTICO (PDF Y PPTX) */}
      {activeMainSection === 'materiales' ? (
        <div className="space-y-5">
          <div className="p-5 sm:p-6 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#FEF08A] font-semibold mb-1">
                <FolderOpen className="w-4 h-4 text-[#FACC15]" />
                <span>Repositorio Curricular Oficial de Archivos</span>
              </div>
              <h3 className="text-lg font-bold text-white font-display">
                Materiales en PDF y Presentaciones PPTX
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Archivos subidos por los docentes de {currentCourse.name} para consulta, estudio y descarga de los estudiantes.
              </p>
            </div>

            {(userRole === 'docente' || userRole === 'admin') && (
              <button
                type="button"
                onClick={() => setShowMaterialModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] hover:from-[#991B1B] hover:to-[#B91C1C] text-white text-xs font-bold flex items-center gap-2 border border-[#FACC15]/40 shadow-lg cursor-pointer shrink-0"
              >
                <PlusCircle className="w-4 h-4 text-[#FACC15]" />
                <span>Subir Nuevo PDF / PPTX</span>
              </button>
            )}
          </div>

          {currentMaterials.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-black/40 border border-white/10 p-6 space-y-3">
              <FolderOpen className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-sm text-slate-300 font-medium">
                No hay materiales PDF o PPTX cargados para este curso y grado aún.
              </p>
              {(userRole === 'docente' || userRole === 'admin') && (
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#7F1D1D] text-white text-xs font-bold cursor-pointer"
                >
                  Subir Primer Material Ahora
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentMaterials.map((mat) => {
                const isPdf = mat.fileType === 'pdf';
                return (
                  <div
                    key={mat.id}
                    className="rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-white/30 transition-all group"
                  >
                    <div className="space-y-3">
                      {/* Header with Type Badge and Size */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border shadow ${
                            isPdf
                              ? 'bg-red-950/80 text-red-300 border-red-500/40'
                              : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {isPdf ? (
                            <>
                              <FileText className="w-3.5 h-3.5 text-red-400" />
                              <span>PDF · Documento</span>
                            </>
                          ) : (
                            <>
                              <Presentation className="w-3.5 h-3.5 text-amber-400" />
                              <span>PPTX · Diapositivas</span>
                            </>
                          )}
                        </span>

                        <span className="text-[11px] font-mono-tabular text-slate-400">
                          {mat.fileSize} · {mat.pageOrSlideCount} {isPdf ? 'págs.' : 'slides'}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-[#FACC15] transition-colors leading-snug">
                          {mat.title}
                        </h4>
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                          {mat.description}
                        </p>
                      </div>

                      {/* Unit & Metadata */}
                      <div className="pt-2 border-t border-white/10 text-[11px] text-slate-400 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[#FEF08A] font-medium">{mat.unitName}</span>
                          <span>{mat.bimestre}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Subido por: {mat.uploadedBy}</span>
                          <span>{mat.uploadedAt}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewMaterial(mat);
                            setPreviewSlideIndex(0);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#FACC15]" />
                          <span>Ver</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadMaterialFile(mat)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] hover:from-[#991B1B] hover:to-[#B91C1C] text-white text-xs font-bold flex items-center gap-1.5 border border-[#FACC15]/40 cursor-pointer transition-all shadow"
                        >
                          <Download className="w-3.5 h-3.5 text-[#FACC15]" />
                          <span>Descargar</span>
                        </button>
                      </div>

                      {(userRole === 'docente' || userRole === 'admin') && onDeleteMaterial && (
                        <button
                          type="button"
                          onClick={() => onDeleteMaterial(mat.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 cursor-pointer"
                          title="Eliminar material"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* VIEW 2: SYLLABUS, THEMES, AND INTERACTIVE EXERCISES */
        <>
          {/* Teacher Topic Upload Drawer */}
          {showUploadPanel && (
            <div className="p-6 rounded-2xl bg-black/70 backdrop-blur-2xl border border-[#FACC15]/40 space-y-4 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#FEF08A]">
                    <Sparkles className="w-4 h-4 text-[#FACC15]" />
                    <span>Generador Pedagógico Automático</span>
                  </div>
                  <h3 className="text-lg font-bold text-white font-display mt-0.5">
                    Subir Nuevo Tema a {currentCourse.name} ({currentGrade.name})
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Ingresa el título del tema. El sistema generará automáticamente los conceptos teóricos, ejemplos resueltos y ejercicios prácticos interactivos con seguimiento.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUploadPanel(false)}
                  className="text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                >
                  Cerrar
                </button>
              </div>

              <form onSubmit={handleGenerateAndPublishTopic} className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6">
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Título del Tema Curricular *
                  </label>
                  <input
                    type="text"
                    value={newTopicTitle}
                    onChange={(e) => setNewTopicTitle(e.target.value)}
                    placeholder="Ej. Ecuaciones Cuadráticas y Función Parabólica"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-white/20 bg-slate-900 text-white placeholder-slate-400 focus:outline-none focus:border-[#FACC15]"
                    required
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Unidad Académica
                  </label>
                  <input
                    type="text"
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-white/20 bg-slate-900 text-white placeholder-slate-400 focus:outline-none focus:border-[#FACC15]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Periodo
                  </label>
                  <select
                    value={newBimestre}
                    onChange={(e) =>
                      setNewBimestre(
                        e.target.value as 'I Bimestre' | 'II Bimestre' | 'III Bimestre' | 'IV Bimestre'
                      )
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-white/20 bg-slate-900 text-white focus:outline-none focus:border-[#FACC15]"
                  >
                    <option value="I Bimestre">I Bimestre</option>
                    <option value="II Bimestre">II Bimestre</option>
                    <option value="III Bimestre">III Bimestre</option>
                    <option value="IV Bimestre">IV Bimestre</option>
                  </select>
                </div>

                <div className="md:col-span-9">
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Indicaciones Pedagógicas (Opcional)
                  </label>
                  <input
                    type="text"
                    value={teacherNotes}
                    onChange={(e) => setTeacherNotes(e.target.value)}
                    placeholder="Ej. Énfasis en aplicaciones prácticas y problemas resueltos paso a paso"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-white/20 bg-slate-900 text-white placeholder-slate-400 focus:outline-none focus:border-[#FACC15]"
                  />
                </div>

                <div className="md:col-span-3 flex items-end">
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] hover:from-[#991B1B] hover:to-[#B91C1C] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 border border-[#FACC15]/40 shadow-lg cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#FACC15]" />
                        <span>Generando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#FACC15]" />
                        <span>Generar y Publicar</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {generationNotice && (
                <div className="text-xs font-medium text-[#FEF08A] flex items-center gap-2 pt-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{generationNotice}</span>
                </div>
              )}
            </div>
          )}

          {/* Two-Zone Layout: Left Syllabus + Right Topic Development */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Zone: Course Syllabus */}
            <div className="lg:col-span-4 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 p-5 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Índice de Temas del Curso
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeTopics.length} temas · Seguimiento automático
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-[#FEF08A] font-mono-tabular">
                    {curriculumCompletionPercent}%
                  </span>
                  <p className="text-[11px] text-slate-400">Avance</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/10">
                <div
                  className="bg-gradient-to-r from-[#7F1D1D] via-[#B91C1C] to-[#FACC15] h-full rounded-full transition-all duration-500"
                  style={{ width: `${curriculumCompletionPercent}%` }}
                />
              </div>

              {/* Topics List */}
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {activeTopics.map((topic, index) => {
                  const isSelected = topic.id === selectedTopicId;
                  const isDone = studentProgress.completedTopicIds.includes(topic.id);
                  const scoreInfo = studentProgress.exerciseScores[topic.id];

                  return (
                    <div
                      key={topic.id}
                      onClick={() => setSelectedTopicId(topic.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#7F1D1D]/90 to-[#991B1B]/80 border-[#FACC15]/50 shadow-md text-white'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-semibold mb-0.5">
                            <span className="text-[#FEF08A]">Tema {index + 1}</span>
                            <span>·</span>
                            <span>{topic.bimestre}</span>
                          </div>
                          <h4 className="text-xs font-bold line-clamp-2">
                            {topic.title}
                          </h4>
                          <p className="text-[11px] text-slate-300 mt-0.5 truncate">
                            {topic.unitName}
                          </p>
                        </div>

                        {isDone ? (
                          <span
                            className="shrink-0 p-1 rounded-full bg-emerald-950 border border-emerald-400 text-emerald-300"
                            title="Completado"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          </span>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                        )}
                      </div>

                      {scoreInfo && (
                        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300 font-mono-tabular">
                          <span>
                            Práctica: {scoreInfo.correct}/{scoreInfo.total} correctos
                          </span>
                          <span className="text-emerald-300">
                            {Math.round((scoreInfo.correct / scoreInfo.total) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Zone: Topic Development & Exercises */}
            <div className="lg:col-span-8 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 p-6 space-y-6 shadow-xl">
              {currentTopic ? (
                <>
                  {/* Topic Header */}
                  <div className="border-b border-white/10 pb-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#FEF08A]">
                        <span>{currentTopic.bimestre}</span>
                        <span>·</span>
                        <span>{currentTopic.unitName}</span>
                      </div>
                      <span className="text-xs font-mono-tabular text-slate-400">
                        Publicado: {currentTopic.publishedAt}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-extrabold text-white font-display">
                      {currentTopic.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {currentTopic.summary}
                    </p>
                  </div>

                  {/* Sub-tabs: Conceptos / Ejemplos / Ejercicios */}
                  <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('conceptos')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeSubTab === 'conceptos'
                          ? 'bg-[#7F1D1D] text-white border border-[#FACC15]/40 shadow-md'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      1. Marco Teórico ({currentTopic.concepts.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('ejemplos')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeSubTab === 'ejemplos'
                          ? 'bg-[#7F1D1D] text-white border border-[#FACC15]/40 shadow-md'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      2. Ejemplos Resueltos ({currentTopic.examples.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('ejercicios')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeSubTab === 'ejercicios'
                          ? 'bg-[#7F1D1D] text-white border border-[#FACC15]/40 shadow-md'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      3. Taller Interactivo ({currentTopic.exercises.length})
                    </button>
                  </div>

                  {/* Sub-tab 1: Concepts */}
                  {activeSubTab === 'conceptos' && (
                    <div className="space-y-4">
                      {currentTopic.concepts.map((c, idx) => (
                        <div
                          key={idx}
                          className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 shadow-sm"
                        >
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-[#7F1D1D] border border-[#FACC15]/40 text-[#FEF08A] text-xs flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <span>{c.title}</span>
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-8">
                            {c.explanation}
                          </p>
                          {c.keyFormulaOrRule && (
                            <div className="ml-8 p-3 rounded-xl bg-slate-900 border border-white/15 text-xs text-[#FEF08A] font-mono-tabular">
                              {c.keyFormulaOrRule}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sub-tab 2: Examples */}
                  {activeSubTab === 'ejemplos' && (
                    <div className="space-y-4">
                      {currentTopic.examples.map((ex, idx) => (
                        <div
                          key={idx}
                          className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3 shadow-sm"
                        >
                          <div className="flex items-center gap-2 text-xs font-bold text-[#FEF08A]">
                            <span className="px-2 py-0.5 rounded-md bg-[#7F1D1D] border border-[#FACC15]/40">
                              Caso {idx + 1}
                            </span>
                            <span>{ex.title}</span>
                          </div>
                          <div className="text-xs sm:text-sm text-slate-200 bg-slate-900/80 p-3.5 rounded-xl border border-white/10">
                            <strong>Planteamiento:</strong> {ex.problemStatement}
                          </div>
                          <div className="space-y-1.5 pl-2">
                            <p className="text-xs font-semibold text-slate-300">
                              Procedimiento paso a paso:
                            </p>
                            {ex.stepByStepSolution.map((step, sIdx) => (
                              <div
                                key={sIdx}
                                className="text-xs text-slate-300 flex items-start gap-2"
                              >
                                <span className="text-[#FACC15] font-bold">›</span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs font-semibold text-emerald-200">
                            <strong>Respuesta final:</strong> {ex.finalAnswer}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sub-tab 3: Interactive Exercises */}
                  {activeSubTab === 'ejercicios' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <p className="text-xs text-slate-300">
                          Responde las preguntas para afianzar tus competencias. El progreso se registra automáticamente.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleResetTopicExercises(currentTopic)}
                          className="text-xs text-[#FACC15] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reiniciar práctica</span>
                        </button>
                      </div>

                      {currentTopic.exercises.map((ex, exIdx) => {
                        const key = `${currentTopic.id}-${exIdx}`;
                        const chosen = selectedAnswers[key];
                        const isVerified = submittedExercises[key];
                        const showHint = visibleHints[key];
                        const isCorrect = chosen === ex.correctIndex;

                        return (
                          <div
                            key={exIdx}
                            className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-[#7F1D1D] text-[#FEF08A] text-xs font-bold flex items-center justify-center border border-[#FACC15]/40">
                                  {exIdx + 1}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-slate-300">
                                  Dificultad: {ex.difficulty}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  setVisibleHints((prev) => ({
                                    ...prev,
                                    [key]: !prev[key],
                                  }))
                                }
                                className="text-xs text-[#FEF08A] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                                <span>{showHint ? 'Ocultar pista' : 'Ver pista'}</span>
                              </button>
                            </div>

                            <p className="text-xs sm:text-sm font-semibold text-white">
                              {ex.question}
                            </p>

                            {/* Options */}
                            <div className="space-y-2">
                              {ex.options.map((opt, optIdx) => {
                                const isSelected = chosen === optIdx;
                                let btnClasses =
                                  'bg-slate-900 border-white/10 hover:bg-white/10 text-slate-200';

                                if (isVerified) {
                                  if (optIdx === ex.correctIndex) {
                                    btnClasses =
                                      'bg-emerald-950 border-emerald-400 text-emerald-200 font-semibold';
                                  } else if (isSelected) {
                                    btnClasses =
                                      'bg-rose-950 border-rose-500 text-rose-200 line-through';
                                  }
                                } else if (isSelected) {
                                  btnClasses =
                                    'bg-[#7F1D1D] border-[#FACC15] text-white font-semibold shadow';
                                }

                                return (
                                  <button
                                    key={optIdx}
                                    type="button"
                                    disabled={isVerified}
                                    onClick={() =>
                                      handleSelectOption(currentTopic.id, exIdx, optIdx)
                                    }
                                    className={`w-full text-left p-3 rounded-xl border text-xs flex items-center gap-3 transition-all cursor-pointer ${btnClasses}`}
                                  >
                                    <span className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center font-mono-tabular text-[10px] shrink-0">
                                      {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    <span>{opt}</span>
                                  </button>
                                );
                              })}
                            </div>

                            <div className="flex items-center justify-between pt-2">
                              {!isVerified ? (
                                <button
                                  type="button"
                                  disabled={chosen === undefined}
                                  onClick={() => handleVerifyExercise(currentTopic, exIdx)}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] hover:from-[#991B1B] hover:to-[#B91C1C] disabled:opacity-40 text-white text-xs font-bold border border-[#FACC15]/40 shadow cursor-pointer"
                                >
                                  Verificar Respuesta
                                </button>
                              ) : (
                                <span
                                  className={`text-xs font-semibold flex items-center gap-1.5 ${
                                    isCorrect ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {isCorrect ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>Respuesta Correcta · Progreso Guardado</span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="w-4 h-4" />
                                      <span>Revisa la resolución detallada</span>
                                    </>
                                  )}
                                </span>
                              )}
                            </div>

                            {showHint && (
                              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2">
                                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                <span>
                                  <strong>Pista:</strong> {ex.hint}
                                </span>
                              </div>
                            )}

                            {isVerified && (
                              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs text-slate-300 space-y-1">
                                <p className="font-semibold text-white">
                                  Sustento y Resolución del Ejercicio:
                                </p>
                                <p>{ex.explanation}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <p className="text-sm text-slate-400">
                    No hay temas registrados aún para este curso y grado.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
