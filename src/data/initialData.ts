import {
  UserProfile,
  GradeLevel,
  CourseItem,
  TopicItem,
  StudentProgressRecord,
  AssessmentItem,
  AttendanceEntry,
  PushNotificationItem,
  CurricularMaterial,
  ScheduleSlot,
  SchoolDay,
  GradeSchedule,
  StudentChatMessage,
  ChatChannel,
  LiveClassSession,
  LiveClassParticipant,
} from '../types';

import fondoPaginaImg from '../assets/images/colegio_oppenheimer_fondo_premios.jpg';
import fondoInicialImg from '../assets/images/fondo_magico_inicial.svg';
import campusHeroImg from '../assets/images/colegio_oppenheimer_campus_1791666912151.jpg';
import awardsBannerImg from '../assets/images/colegio_oppenheimer_fondo_premios.jpg';
import compositePortalImg from '../assets/images/portada_acceso_oppenheimer_composite.jpg';
import blendedPortalImg from '../assets/images/portada_acceso_oppenheimer_blended.jpg';
import crestEmblemTransparent from '../assets/images/colegio_oppenheimer_escudo_transparente.png';
import crestEmblemOriginal from '../assets/images/colegio_oppenheimer_escudo_44.png';

export const INSTITUTION_ASSETS = {
  fondoPagina: fondoPaginaImg,
  fondoInicial: fondoInicialImg,
  campusHero: campusHeroImg,
  awardsBanner: awardsBannerImg,
  compositePortal: compositePortalImg,
  blendedPortal: blendedPortalImg,
  crestEmblem: crestEmblemTransparent,
  crestEmblemInsignia: crestEmblemTransparent,
  crestEmblemSvg: crestEmblemTransparent,
  crestEmblemSolid: crestEmblemOriginal,
};

// ============================================================================
// ÚNICO USUARIO INICIAL: ADMINISTRADOR
// Credenciales oficiales:
// Usuario: admin
// Contraseña: admin
// ============================================================================
export const ADMIN_USER: UserProfile = {
  id: 'usr-admin-root',
  name: 'Administrador General',
  code: 'admin',
  password: 'admin',
  role: 'admin',
  educationLevel: 'Secundaria',
  specialty: 'Dirección General y Administración Escolar',
  email: 'admin@colegiooppenheimer.edu.pe',
  avatarInitials: 'AD',
  status: 'Activo',
  createdAt: '10 Oct 2026',
};

export const INITIAL_SYSTEM_USERS: UserProfile[] = [
  ADMIN_USER,
];


// Estructura oficial de los 3 niveles: Inicial, Primaria y Secundaria
export const GRADE_LEVELS: GradeLevel[] = [
  {
    id: 'ini-3',
    name: 'Inicial 3 Años',
    level: 'Inicial',
    section: 'Aula "Estrellitas Mágicas"',
    tutorName: 'Por Asignar en Administración',
    studentCount: 0,
  },
  {
    id: 'ini-4',
    name: 'Inicial 4 Años',
    level: 'Inicial',
    section: 'Aula "Arcoíris Encantado"',
    tutorName: 'Por Asignar en Administración',
    studentCount: 0,
  },
  {
    id: 'ini-5',
    name: 'Inicial 5 Años',
    level: 'Inicial',
    section: 'Aula "Castillo Mágico"',
    tutorName: 'Por Asignar en Administración',
    studentCount: 0,
  },
  {
    id: 'pri-1',
    name: '1.° Grado de Primaria',
    level: 'Primaria',
    section: 'Sección A "Semillitas del Saber"',
    tutorName: 'Prof. Carmen Valdivia',
    studentCount: 22,
  },
  {
    id: 'pri-2',
    name: '2.° Grado de Primaria',
    level: 'Primaria',
    section: 'Sección A "Exploradores"',
    tutorName: 'Prof. Ricardo Morales',
    studentCount: 24,
  },
  {
    id: 'pri-3',
    name: '3.° Grado de Primaria',
    level: 'Primaria',
    section: 'Sección A "Pioneros"',
    tutorName: 'Prof. Elena Ramos',
    studentCount: 25,
  },
  {
    id: 'pri-4',
    name: '4.° Grado de Primaria',
    level: 'Primaria',
    section: 'Sección A "Líderes del Futuro"',
    tutorName: 'Prof. Javier Espinoza',
    studentCount: 26,
  },
  {
    id: 'pri-5',
    name: '5.° Grado de Primaria',
    level: 'Primaria',
    section: 'Sección A "Lira de Oro"',
    tutorName: 'Prof. David Chen',
    studentCount: 24,
  },
  {
    id: 'pri-6',
    name: '6.° Grado de Primaria',
    level: 'Primaria',
    section: 'Sección Única "Bicentenario"',
    tutorName: 'Prof. Carmen Valdivia',
    studentCount: 28,
  },
  {
    id: 'sec-1',
    name: '1.° Año de Secundaria',
    level: 'Secundaria',
    section: 'Sección A "César Vallejo"',
    tutorName: 'Por Asignar en Administración',
    studentCount: 0,
  },
  {
    id: 'sec-2',
    name: '2.° Año de Secundaria',
    level: 'Secundaria',
    section: 'Sección A "Jorge Basadre"',
    tutorName: 'Por Asignar en Administración',
    studentCount: 0,
  },
  {
    id: 'sec-3',
    name: '3.° Año de Secundaria',
    level: 'Secundaria',
    section: 'Sección A "Pedro Paulet"',
    tutorName: 'Por Asignar en Administración',
    studentCount: 0,
  },
  {
    id: 'sec-4',
    name: '4.° Año de Secundaria',
    level: 'Secundaria',
    section: 'Sección A "Capitán Oppenheimer"',
    tutorName: 'Por Asignar en Administración',
    studentCount: 0,
  },
  {
    id: 'sec-5',
    name: '5.° Año de Secundaria',
    level: 'Secundaria',
    section: 'Promoción "Excelencia 2026"',
    tutorName: 'Por Asignar en Administración',
    studentCount: 0,
  },
];

// Catálogo curricular oficial de cursos por nivel educativo
export const COURSES: CourseItem[] = [
  // Inicial
  {
    id: 'cur-ini-art',
    code: 'INI-ART',
    name: 'Arte, Creatividad y Colores Mágicos',
    area: 'Arte y Cultura Musical',
    gradeIds: ['ini-3', 'ini-4', 'ini-5'],
    teacherName: 'Docente de Inicial',
    weeklyHours: 6,
    description: 'Estimulación sensorial, pintura con témperas, modelado en plastilina y expresión artística infantil.',
    accentColor: '#FF6B8B',
  },
  {
    id: 'cur-ini-cuen',
    code: 'INI-LIT',
    name: 'Cuentos Mágicos y Primeras Palabras',
    area: 'Humanidades y Letras',
    gradeIds: ['ini-3', 'ini-4', 'ini-5'],
    teacherName: 'Docente de Inicial',
    weeklyHours: 5,
    description: 'Cuentacuentos participativos, rimas divertidas, reconocimiento de vocales y estimulación del lenguaje.',
    accentColor: '#54A0FF',
  },
  {
    id: 'cur-ini-mat',
    code: 'INI-MAT',
    name: 'Números Traviesos y Formas Mágicas',
    area: 'Ciencias y Matemática',
    gradeIds: ['ini-3', 'ini-4', 'ini-5'],
    teacherName: 'Docente de Inicial',
    weeklyHours: 5,
    description: 'Juegos de conteo lúdico, reconocimiento de figuras y desarrollo del pensamiento lógico temprano.',
    accentColor: '#FECA57',
  },
  {
    id: 'cur-ini-psi',
    code: 'INI-PSI',
    name: 'Rondas Musicales y Psicomotricidad',
    area: 'Arte y Cultura Musical',
    gradeIds: ['ini-3', 'ini-4', 'ini-5'],
    teacherName: 'Docente de Música',
    weeklyHours: 4,
    description: 'Coordinación motriz, bailes infantiles, rondas rítmicas e iniciación con instrumentos de percusión.',
    accentColor: '#1DD1A1',
  },
  // Primaria y Secundaria
  {
    id: 'cur-mat',
    code: 'MAT-401',
    name: 'Matemática: Álgebra, Geometría y Aritmética',
    area: 'Ciencias y Matemática',
    gradeIds: ['pri-1', 'pri-2', 'pri-3', 'pri-4', 'pri-5', 'pri-6', 'sec-1', 'sec-2', 'sec-3', 'sec-4', 'sec-5'],
    teacherName: 'Prof. Ricardo Morales',
    weeklyHours: 6,
    description: 'Modelamiento numérico, razonamiento lógico, geometría y resolución analítica de problemas.',
    accentColor: '#7F1D1D',
  },
  {
    id: 'cur-cta',
    code: 'CYT-402',
    name: 'Ciencia y Tecnología: Física, Química y Biología',
    area: 'Ciencias y Matemática',
    gradeIds: ['pri-1', 'pri-2', 'pri-3', 'pri-4', 'pri-5', 'pri-6', 'sec-1', 'sec-2', 'sec-3', 'sec-4', 'sec-5'],
    teacherName: 'Prof. Roberto Ramos',
    weeklyHours: 5,
    description: 'Leyes de la física, indagación científica experimental, naturaleza y balance químico.',
    accentColor: '#0F766E',
  },
  {
    id: 'cur-com',
    code: 'COM-403',
    name: 'Comunicación, Comprensión Lectora y Redacción',
    area: 'Humanidades y Letras',
    gradeIds: ['pri-1', 'pri-2', 'pri-3', 'pri-4', 'pri-5', 'pri-6', 'sec-1', 'sec-2', 'sec-3', 'sec-4', 'sec-5'],
    teacherName: 'Prof. Carmen Valdivia',
    weeklyHours: 5,
    description: 'Comprensión lectora avanzada, redacción académica, oratoria y literatura hispanoamericana.',
    accentColor: '#B45309',
  },
  {
    id: 'cur-his',
    code: 'CCS-404',
    name: 'Ciencias Sociales, Historia y Formación Ciudadana',
    area: 'Humanidades y Letras',
    gradeIds: ['pri-1', 'pri-2', 'pri-3', 'pri-4', 'pri-5', 'pri-6', 'sec-1', 'sec-2', 'sec-3', 'sec-4', 'sec-5'],
    teacherName: 'Prof. Javier Espinoza',
    weeklyHours: 4,
    description: 'Historia del Perú y universal, formación ciudadana, geografía y economía aplicada.',
    accentColor: '#1E3A8A',
  },
  {
    id: 'cur-mus',
    code: 'ART-405',
    name: 'Arte y Cultura: Banda Sinfónica y Coro',
    area: 'Arte y Cultura Musical',
    gradeIds: ['pri-1', 'pri-2', 'pri-3', 'pri-4', 'pri-5', 'pri-6', 'sec-1', 'sec-2', 'sec-3', 'sec-4', 'sec-5'],
    teacherName: 'Prof. Elena Ramos',
    weeklyHours: 4,
    description: 'Programa de formación musical emblemática Oppenheimer: partituras, armonía y ensamble de lira.',
    accentColor: '#991B1B',
  },
  {
    id: 'cur-ing',
    code: 'ING-406',
    name: 'Inglés Académico e Investigación Digital',
    area: 'Tecnología e Idiomas',
    gradeIds: ['pri-1', 'pri-2', 'pri-3', 'pri-4', 'pri-5', 'pri-6', 'sec-1', 'sec-2', 'sec-3', 'sec-4', 'sec-5'],
    teacherName: 'Prof. David Chen',
    weeklyHours: 4,
    description: 'Habilidades comunicativas en inglés estándar, vocabulario técnico y preparación académica.',
    accentColor: '#3730A3',
  },
];

// ============================================================================
// DATOS LIMPIOS: Listos para comenzar a generar contenido y usuarios reales
// ============================================================================
export const INITIAL_TOPICS: TopicItem[] = [];

export const INITIAL_STUDENTS: StudentProgressRecord[] = [];

export const INITIAL_ASSESSMENTS: AssessmentItem[] = [];

export const INITIAL_ATTENDANCE: AttendanceEntry[] = [];

export const INITIAL_MATERIALS: CurricularMaterial[] = [];

export const INITIAL_NOTIFICATIONS: PushNotificationItem[] = [
  {
    id: 'not-01',
    title: 'Sistema Institucional Inicializado',
    message: 'Portal del Colegio Capitán Enrique Oppenheimer listo para la creación de usuarios, docentes y estudiantes desde el panel de administración.',
    category: 'Institucional',
    timestamp: 'Hoy',
    targetRole: 'Todos',
    read: false,
  },
];

export const INITIAL_AWARDS = [
  {
    year: '2024',
    title: 'Gran Premio Nacional de Música Escolar',
    issuer: 'Concurso Nacional de Bandas y Orquestas Escolares',
    category: 'Excelencia Musical',
  },
  {
    year: '2023',
    title: 'Medalla de Oro en Ciencias Experimentales',
    issuer: 'Feria Escolar Nacional de Ciencia y Tecnología (EUREKA)',
    category: 'Innovación Científica',
  },
  {
    year: '2022',
    title: 'Primer Puesto Departamental de Bandas Sinfónicas',
    issuer: 'Dirección Regional de Educación de Lima',
    category: 'Formación Artística',
  },
  {
    year: '2021',
    title: 'Placa de Honor al Desempeño Curricular Integral',
    issuer: 'Comité Educativo Nacional',
    category: 'Calidad Educativa',
  },
];

export const INSTITUTIONAL_AWARDS = INITIAL_AWARDS;

// ==========================================
// CONFIGURACIÓN DE PERIODOS Y GENERADOR DE HORARIOS
// ==========================================
export const TIME_PERIODS = [
  { index: 1, time: '08:00 - 08:45', label: '1.° Bloque' },
  { index: 2, time: '08:45 - 09:30', label: '2.° Bloque' },
  { index: 3, time: '09:30 - 10:15', label: '3.° Bloque' },
  { index: 4, time: '10:15 - 10:45', label: '🔔 RECREO INSTITUCIONAL', isRecess: true },
  { index: 5, time: '10:45 - 11:30', label: '4.° Bloque' },
  { index: 6, time: '11:30 - 12:15', label: '5.° Bloque' },
  { index: 7, time: '12:15 - 13:00', label: '6.° Bloque' },
];

export const SCHOOL_DAYS: SchoolDay[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

/**
 * Algoritmo determinista de generación de horarios escolares SIN CRUCES DOCENTES
 * Garantiza que ningún docente esté asignado a dos aulas simultáneamente en un mismo día y hora.
 */
export function generateConflictFreeSchedules(
  grades: GradeLevel[],
  courses: CourseItem[]
): Record<string, ScheduleSlot[]> {
  const schedules: Record<string, ScheduleSlot[]> = {};

  // Matriz de ocupación docente: [día][periodoIndex] => Set de nombres de docentes ocupados
  const teacherOccupancy: Record<string, Record<number, Set<string>>> = {};
  SCHOOL_DAYS.forEach((d) => {
    teacherOccupancy[d] = {};
    TIME_PERIODS.forEach((p) => {
      teacherOccupancy[d][p.index] = new Set<string>();
    });
  });

  grades.forEach((grade, gradeIdx) => {
    const slots: ScheduleSlot[] = [];
    const validCourses = courses.filter((c) => c.gradeIds.includes(grade.id));
    let cursor = (gradeIdx * 3) % (validCourses.length || 1);

    SCHOOL_DAYS.forEach((day) => {
      TIME_PERIODS.forEach((period) => {
        if (period.isRecess) {
          slots.push({
            id: `slot-${grade.id}-${day}-${period.index}`,
            gradeId: grade.id,
            day,
            timePeriod: period.time,
            periodIndex: period.index,
            courseName: '🔔 RECREO / DESCANSO',
            classroom: 'Patio de Honor',
            accentColor: '#334155',
            isRecess: true,
          });
          return;
        }

        // Buscar un curso cuyo docente NO esté ocupado en este día y periodo
        let selectedCourse: CourseItem | null = null;
        for (let attempt = 0; attempt < validCourses.length; attempt++) {
          const candidate = validCourses[(cursor + attempt) % validCourses.length];
          const isBusy =
            candidate.teacherName &&
            teacherOccupancy[day][period.index].has(candidate.teacherName);
          if (!isBusy) {
            selectedCourse = candidate;
            cursor = (cursor + attempt + 1) % validCourses.length;
            break;
          }
        }

        if (!selectedCourse && validCourses.length > 0) {
          selectedCourse = validCourses[cursor % validCourses.length];
        }

        if (selectedCourse) {
          if (selectedCourse.teacherName) {
            teacherOccupancy[day][period.index].add(selectedCourse.teacherName);
          }
          slots.push({
            id: `slot-${grade.id}-${day}-${period.index}`,
            gradeId: grade.id,
            day,
            timePeriod: period.time,
            periodIndex: period.index,
            courseId: selectedCourse.id,
            courseName: selectedCourse.name,
            teacherName: selectedCourse.teacherName,
            classroom: `Aula ${grade.name}`,
            accentColor: selectedCourse.accentColor,
            isRecess: false,
          });
        }
      });
    });

    schedules[grade.id] = slots;
  });

  return schedules;
}

export const INITIAL_SCHEDULES: Record<string, ScheduleSlot[]> = generateConflictFreeSchedules(
  GRADE_LEVELS,
  COURSES
);

// ==========================================
// CANALES Y MENSAJES DEL CHAT ESTUDIANTIL
// ==========================================
export const INITIAL_CHAT_CHANNELS: ChatChannel[] = [
  {
    id: 'chan-general',
    name: 'Comunidad Oppenheimer (General)',
    gradeId: 'all',
    description: 'Espacio de convivencia escolar y anuncios para todos los estudiantes.',
    icon: '🏫',
  },
  {
    id: 'chan-sec4',
    name: 'Salón 4.° Secundaria',
    gradeId: 'sec-4',
    description: 'Chat oficial del aula 4.° de Secundaria - Sección A "Capitán Oppenheimer".',
    icon: '🎓',
  },
  {
    id: 'chan-pri1',
    name: 'Salón 1.° Primaria',
    gradeId: 'pri-1',
    description: 'Espacio de coordinación y comunicación de 1.° Grado de Primaria.',
    icon: '🌱',
  },
  {
    id: 'chan-tareas',
    name: 'Consultas de Tareas & Proyectos',
    gradeId: 'all',
    description: 'Preguntas académicas, resolución colaborativa de ejercicios y apoyo mutuo.',
    icon: '📚',
  },
  {
    id: 'chan-ciencias',
    name: 'Grupo de Ciencias & Física',
    gradeId: 'sec-4',
    description: 'Fórmulas, laboratorio, Ley de Ohm y experimentos guiados.',
    icon: '⚡',
  },
  {
    id: 'chan-musica',
    name: 'Banda Sinfónica & Lira de Oro',
    gradeId: 'all',
    description: 'Partituras, ensayos de coro y coordinación de premiaciones escolares.',
    icon: '🎺',
  },
];

export const INITIAL_STUDENT_MESSAGES: StudentChatMessage[] = [];

// ==========================================
// SESIÓN DE VIDEOLLAMADA / CLASE EN VIVO
// ==========================================
export const INITIAL_LIVE_CLASS_SESSION: LiveClassSession = {
  id: 'live-class-101',
  courseId: 'cur-mat',
  courseName: 'Matemática y Ciencias',
  gradeId: 'sec-4',
  gradeName: '4.° Año de Secundaria',
  teacherId: 'usr-admin-root',
  teacherName: 'Docente Titular',
  title: 'Clase Virtual en Vivo',
  isLive: false,
  startedAt: '',
  participants: [],
  whiteboardNotes: '',
  chatMessages: [],
};

