export type UserRole = 'estudiante' | 'docente' | 'admin';
export type EducationLevel = 'Inicial' | 'Primaria' | 'Secundaria';

export interface UserProfile {
  id: string;
  name: string;
  code: string;
  password?: string;
  role: UserRole;
  educationLevel?: EducationLevel;
  gradeId?: string; // Primary grade for students
  specialty?: string; // For teachers/admins
  email: string;
  avatarInitials: string;
  avatarUrl?: string;
  status?: 'Activo' | 'Inactivo';
  paymentStatus?: 'Al Día' | 'Bloqueado por Pago' | 'Pendiente';
  paymentDebtMonths?: string[];
  paymentNotes?: string;
  createdAt?: string;
}

export interface ConceptBlock {
  title: string;
  explanation: string;
  keyFormulaOrRule: string;
}

export interface WorkedExample {
  title: string;
  problemStatement: string;
  stepByStepSolution: string[];
  finalAnswer: string;
}

export interface PracticeExercise {
  question: string;
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado' | string;
  options: string[];
  correctIndex: number;
  hint: string;
  explanation: string;
}

export type MaterialFileType = 'pdf' | 'pptx';

export interface CurricularMaterial {
  id: string;
  title: string;
  description: string;
  fileType: MaterialFileType;
  fileName: string;
  fileSize: string;
  fileUrl?: string;
  courseId: string;
  gradeId: string;
  unitName: string;
  bimestre: 'I Bimestre' | 'II Bimestre' | 'III Bimestre' | 'IV Bimestre';
  uploadedBy: string;
  uploadedAt: string;
  pageOrSlideCount: number;
  downloadCount: number;
  tags?: string[];
}

export interface TopicItem {
  id: string;
  courseId: string;
  gradeId: string;
  bimestre: 'I Bimestre' | 'II Bimestre' | 'III Bimestre' | 'IV Bimestre';
  unitName: string;
  orderIndex: number;
  title: string;
  summary: string;
  estimatedMinutes: number;
  publishedAt: string;
  authorName: string;
  status: 'Completado' | 'En Curso' | 'Programado';
  concepts: ConceptBlock[];
  examples: WorkedExample[];
  exercises: PracticeExercise[];
  attachedMaterials?: CurricularMaterial[];
}

export interface CourseItem {
  id: string;
  code: string;
  name: string;
  area: 'Ciencias y Matemática' | 'Humanidades y Letras' | 'Arte y Cultura Musical' | 'Tecnología e Idiomas';
  gradeIds: string[];
  teacherName: string;
  instructorName?: string;
  instructorId?: string;
  weeklyHours: number;
  description: string;
  accentColor: string;
}

export type Course = CourseItem;

export interface GradeLevel {
  id: string;
  name: string;
  level: EducationLevel;
  section: string;
  tutorName: string;
  studentCount: number;
}

export interface StudentProgressRecord {
  studentId: string;
  studentName: string;
  studentCode: string;
  gradeId: string;
  completedTopicIds: string[];
  exerciseScores: Record<string, { correct: number; total: number; lastAttempt: string }>; // keyed by topicId
  averageGrade: number; // Vigesimal scale 0 - 20 (Peru standard)
  attendanceRate: number; // Percentage 0 - 100
}

export interface ExamQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  points: number;
}

export interface AssessmentItem {
  id: string;
  title: string;
  type: 'Examen en Tiempo Real' | 'Tarea Domiciliaria' | 'Práctica Calificada';
  courseId: string;
  gradeId: string;
  dueDate: string;
  deadline?: string;
  durationMinutes: number;
  status: 'En Vivo' | 'Próximo' | 'Finalizado' | 'completado';
  totalPoints: number;
  totalQuestions?: number;
  questions: ExamQuestion[];
  submissionsCount: number;
  totalStudents: number;
  scoreObtained?: number;
}

export type AttendanceStatus = 'Presente' | 'Tardanza' | 'Falta' | 'Justificado';

export interface AttendanceEntry {
  studentId: string;
  studentCode: string;
  studentName: string;
  gradeId: string;
  status: AttendanceStatus;
  arrivalTime: string;
  observation: string;
}

export interface PushNotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'Académico' | 'Examen en Vivo' | 'Asistencia' | 'Institucional';
  timestamp: string;
  targetRole: 'Todos' | UserRole;
  read: boolean;
}

// ==========================================
// HORARIOS ESCOLARES (CONFLICT-FREE TIMETABLE)
// ==========================================
export type SchoolDay = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes';

export interface ScheduleSlot {
  id: string;
  gradeId: string;
  day: SchoolDay;
  timePeriod: string; // e.g. "08:00 - 08:45"
  periodIndex: number; // 1 to 7
  courseId?: string;
  courseName?: string;
  teacherName?: string;
  classroom?: string;
  accentColor?: string;
  isRecess?: boolean;
}

export interface GradeSchedule {
  gradeId: string;
  gradeName: string;
  slots: ScheduleSlot[];
}

// ==========================================
// CHAT INTERNO ENTRE ESTUDIANTES
// ==========================================
export interface StudentChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  gradeId?: string;
  senderGradeId?: string;
  channelId: string;
  text?: string;
  content?: string;
  timestamp: string;
  avatarInitials?: string;
  senderAvatar?: string;
  reactions?: Record<string, number> | string[];
}

export interface ChatChannel {
  id: string;
  name: string;
  gradeId: string;
  description: string;
  icon: string;
}

// ==========================================
// AULA VIRTUAL EN VIVO (VIDEOLLAMADA GRUPAL)
// ==========================================
export interface LiveClassParticipant {
  id: string;
  name: string;
  role: UserRole;
  gradeId?: string;
  avatarInitials?: string;
  avatarUrl?: string;
  hasHandRaised: boolean;
  isHandRaised?: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  joinedAt: string;
}

export interface LiveClassMessage {
  id: string;
  senderId?: string;
  senderName: string;
  role: UserRole;
  text?: string;
  message?: string;
  timestamp: string;
  avatar?: string;
}

export interface LiveClassSession {
  id: string;
  courseId: string;
  courseName: string;
  gradeId: string;
  gradeName: string;
  teacherId: string;
  teacherName: string;
  title: string;
  isLive: boolean;
  startedAt: string;
  participants: LiveClassParticipant[];
  isWhiteboardProjected?: boolean;
  whiteboardNotes?: string;
  whiteboardDrawingData?: string;
  chatMessages: LiveClassMessage[];
  messages?: LiveClassMessage[];
}
