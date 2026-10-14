import React, { useState, useEffect } from 'react';
import {
  BellRing,
  X,
  Smartphone,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  LogOut,
  Award,
  Clock,
  UserCheck,
  KeyRound,
  Sparkles,
  Calendar,
  Video,
  MessageSquare,
} from 'lucide-react';
import {
  UserRole,
  UserProfile,
  TopicItem,
  AssessmentItem,
  AttendanceEntry,
  AttendanceStatus,
  PushNotificationItem,
  StudentProgressRecord,
  CurricularMaterial,
  CourseItem,
  ScheduleSlot,
  StudentChatMessage,
  ChatChannel,
  LiveClassSession,
  LiveClassMessage,
} from './types';
import {
  INSTITUTION_ASSETS,
  INITIAL_SYSTEM_USERS,
  GRADE_LEVELS,
  COURSES,
  INITIAL_TOPICS,
  INITIAL_STUDENTS,
  INITIAL_ASSESSMENTS,
  INITIAL_ATTENDANCE,
  INITIAL_NOTIFICATIONS,
  INITIAL_MATERIALS,
  INITIAL_SCHEDULES,
  INITIAL_CHAT_CHANNELS,
  INITIAL_STUDENT_MESSAGES,
  INITIAL_LIVE_CLASS_SESSION,
  generateConflictFreeSchedules,
} from './data/initialData';
import {
  LandingPortal } from './components/LandingPortal';
import { InstitutionalDashboardHome } from './components/InstitutionalDashboardHome';
import { CurriculumStudio } from './components/CurriculumStudio';
import { LiveAssessmentsHub } from './components/LiveAssessmentsHub';
import { AttendanceAnalyticsView } from './components/AttendanceAnalyticsView';
import { UserManagementView } from './components/UserManagementView';
import { StudentAIChatGPTView } from './components/StudentAIChatGPTView';
import { ScheduleTimetableView } from './components/ScheduleTimetableView';
import { StudentCommunityChatView } from './components/StudentCommunityChatView';
import { LiveClassroomView } from './components/LiveClassroomView';
import { InicialKidExperienceView } from './components/InicialKidExperienceView';
import { PWAInstallModal } from './components/PWAInstallModal';

import {
  subscribeUsers,
  saveUser,
  deleteUser,
  subscribeLiveClass,
  updateLiveClass,
  updateWhiteboard,
  subscribeCommunityChat,
  sendCommunityChatMessage,
  reactToCommunityChatMessage,
  subscribeCourses,
  saveCourses,
  subscribeSchedules,
  saveSchedules,
} from './services/dbService';
import { isFirebaseConfigured } from './services/firebase';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [systemUsers, setSystemUsers] = useState<UserProfile[]>(INITIAL_SYSTEM_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_SYSTEM_USERS[0]);
  const [activeTab, setActiveTab] = useState<
    | 'inicio'
    | 'curricular'
    | 'examenes'
    | 'asistencia'
    | 'horario'
    | 'clase_en_vivo'
    | 'chat_estudiantes'
    | 'usuarios'
    | 'consulta_ia'
  >('inicio');

  // Academic, Courses & Schedule State
  const [courses, setCourses] = useState<CourseItem[]>(COURSES);
  const [schedules, setSchedules] = useState<Record<string, ScheduleSlot[]>>(INITIAL_SCHEDULES);
  const [selectedGradeId, setSelectedGradeId] = useState<string>('sec-4');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('cur-mat');
  const [topics, setTopics] = useState<TopicItem[]>(INITIAL_TOPICS);
  const [curricularMaterials, setCurricularMaterials] =
    useState<CurricularMaterial[]>(INITIAL_MATERIALS);
  const [assessments, setAssessments] = useState<AssessmentItem[]>(INITIAL_ASSESSMENTS);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>(INITIAL_ATTENDANCE);
  const [studentsProgress, setStudentsProgress] =
    useState<StudentProgressRecord[]>(INITIAL_STUDENTS);
  const [notifications, setNotifications] =
    useState<PushNotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Community Chat & Live Classroom State
  const [chatChannels, setChatChannels] = useState<ChatChannel[]>(INITIAL_CHAT_CHANNELS);
  const [studentChatMessages, setStudentChatMessages] =
    useState<StudentChatMessage[]>(INITIAL_STUDENT_MESSAGES);
  const [activeLiveClass, setActiveLiveClass] =
    useState<LiveClassSession>(INITIAL_LIVE_CLASS_SESSION);

  // Synchronize Live Class, Chat, Users, Courses, and Schedules across devices via Firebase / Local Sync
  useEffect(() => {
    // 1. Subscribe to Users collection
    const unsubUsers = subscribeUsers((users) => {
      if (users && users.length > 0) {
        setSystemUsers(users);
        setCurrentUser((prev) => {
          const matched = users.find(
            (u) => u.id === prev.id || u.code.toLowerCase() === prev.code.toLowerCase()
          );
          return matched || prev;
        });
      }
    });

    // 2. Subscribe to Live Class session
    const unsubLive = subscribeLiveClass((liveData) => {
      if (liveData && liveData.id) {
        setActiveLiveClass((prev) => {
          if (
            prev.isLive !== liveData.isLive ||
            prev.isWhiteboardProjected !== liveData.isWhiteboardProjected ||
            prev.whiteboardNotes !== liveData.whiteboardNotes ||
            prev.whiteboardDrawingData !== liveData.whiteboardDrawingData ||
            prev.chatMessages?.length !== liveData.chatMessages?.length ||
            JSON.stringify(prev.participants) !== JSON.stringify(liveData.participants)
          ) {
            return liveData;
          }
          return prev;
        });
      }
    });

    // 3. Subscribe to Community Student Chat
    const unsubChat = subscribeCommunityChat((chatData) => {
      if (Array.isArray(chatData)) {
        setStudentChatMessages(chatData);
      }
    });

    // 4. Subscribe to Courses
    const unsubCourses = subscribeCourses((coursesData) => {
      if (Array.isArray(coursesData) && coursesData.length > 0) {
        setCourses(coursesData);
      }
    });

    // 5. Subscribe to Schedules
    const unsubSchedules = subscribeSchedules((schedData) => {
      if (schedData && Object.keys(schedData).length > 0) {
        setSchedules(schedData);
      }
    });

    // 6. Domestic Network REST Sync Fallback (when running local express server)
    let isMounted = true;
    const fetchSyncData = async () => {
      if (isFirebaseConfigured()) return; // Skip REST polling if Firebase is active
      try {
        const [liveRes, chatRes] = await Promise.all([
          fetch('/api/sync/live-class'),
          fetch('/api/sync/student-chat'),
        ]);
        if (liveRes.ok && isMounted) {
          const liveData = await liveRes.json();
          if (liveData && liveData.id) {
            setActiveLiveClass((prev) => {
              if (
                prev.isLive !== liveData.isLive ||
                prev.isWhiteboardProjected !== liveData.isWhiteboardProjected ||
                prev.whiteboardNotes !== liveData.whiteboardNotes ||
                prev.whiteboardDrawingData !== liveData.whiteboardDrawingData ||
                prev.chatMessages?.length !== liveData.chatMessages?.length ||
                JSON.stringify(prev.participants) !== JSON.stringify(liveData.participants)
              ) {
                return liveData;
              }
              return prev;
            });
          }
        }
        if (chatRes.ok && isMounted) {
          const chatData = await chatRes.json();
          if (Array.isArray(chatData)) {
            setStudentChatMessages((prev) => {
              if (prev.length !== chatData.length || JSON.stringify(prev) !== JSON.stringify(chatData)) {
                return chatData;
              }
              return prev;
            });
          }
        }
      } catch {
        // Silently ignore polling network glitches
      }
    };

    fetchSyncData();
    const interval = setInterval(fetchSyncData, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsubUsers();
      unsubLive();
      unsubChat();
      unsubCourses();
      unsubSchedules();
    };
  }, []);

  // Mobile PWA & Push Notification Toast State
  const [isMobileModalOpen, setIsMobileModalOpen] = useState<boolean>(false);
  const [pushPermission, setPushPermission] = useState<
    NotificationPermission | 'default'
  >(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  );
  const [activeToast, setActiveToast] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const triggerInstantPushNotification = (
    title: string,
    message: string,
    category: 'Académico' | 'Examen en Vivo' | 'Asistencia' | 'Institucional' = 'Académico',
    targetRole: 'Todos' | UserRole = 'Todos'
  ) => {
    const newNotif: PushNotificationItem = {
      id: `not-${Date.now()}`,
      title,
      message,
      category,
      timestamp: 'Ahora mismo',
      targetRole,
      read: false,
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setActiveToast({ title, message });

    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(title, {
          body: message,
          icon: '/icon.svg',
        });
      } catch {
        // Fallback to in-app toast banner
      }
    }
  };

  const handleRequestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPushPermission(perm);
        if (perm === 'granted') {
          triggerInstantPushNotification(
            'Notificaciones Push Activadas',
            'Tu dispositivo iOS/Android/Web recibirá avisos al instante del Colegio Capitán Enrique Oppenheimer.',
            'Institucional'
          );
        }
      } catch {
        setPushPermission('granted');
      }
    } else {
      setPushPermission('granted');
      triggerInstantPushNotification(
        'Alertas Instantáneas Activas',
        'Recibirás alertas académicas y de asistencia en tiempo real.',
        'Institucional'
      );
    }
  };

  const handleLogin = (
    role: UserRole,
    customCode?: string,
    matchedUser?: UserProfile
  ) => {
    if (matchedUser) {
      setCurrentUser(matchedUser);
    } else {
      const codeClean = (customCode || '').toLowerCase().trim();
      const found = systemUsers.find(
        (u) => u.code.toLowerCase() === codeClean
      );
      if (found) {
        setCurrentUser(found);
      } else {
        const fallback = systemUsers.find((u) => u.role === role) || systemUsers[0];
        setCurrentUser(fallback);
      }
    }
    setIsAuthenticated(true);
    setActiveTab('inicio');
  };

  // Admin user management handlers
  const handleAddUser = (newUser: UserProfile) => {
    setSystemUsers((prev) => [newUser, ...prev]);
    saveUser(newUser); // Persist to Firestore & LocalStorage

    // If new user is a student, automatically prepare student progress and attendance
    if (newUser.role === 'estudiante') {
      const newProgress: StudentProgressRecord = {
        studentId: newUser.id,
        studentName: newUser.name,
        studentCode: newUser.code,
        gradeId: newUser.gradeId || 'sec-4',
        completedTopicIds: [],
        exerciseScores: {},
        averageGrade: 20.0,
        attendanceRate: 100.0,
      };
      setStudentsProgress((prev) => [newProgress, ...prev]);

      const newAttendance: AttendanceEntry = {
        studentId: newUser.id,
        studentCode: newUser.code,
        studentName: newUser.name,
        gradeId: newUser.gradeId || 'sec-4',
        status: 'Presente',
        arrivalTime: '07:45 AM',
        observation: 'Alumno registrado en el aula virtual',
      };
      setAttendance((prev) => [newAttendance, ...prev]);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setSystemUsers((prev) => prev.filter((u) => u.id !== userId));
    deleteUser(userId); // Delete from Firestore & LocalStorage
    setStudentsProgress((prev) => prev.filter((s) => s.studentId !== userId));
    setAttendance((prev) => prev.filter((a) => a.studentId !== userId));
  };

  // Admin: Update student payment status (Block/Unblock)
  const handleUpdateUserPayment = (
    userId: string,
    status: 'Al Día' | 'Bloqueado por Pago' | 'Pendiente',
    debtMonths?: string[],
    notes?: string
  ) => {
    setSystemUsers((prev) => {
      const updated = prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              paymentStatus: status,
              paymentDebtMonths: debtMonths || user.paymentDebtMonths,
              paymentNotes: notes || user.paymentNotes,
            }
          : user
      );
      const targetUser = updated.find((u) => u.id === userId);
      if (targetUser) {
        saveUser(targetUser); // Sync to Firestore
      }
      return updated;
    });
  };

  // Admin: Assign teacher to course & auto-sync collision-free schedules
  const handleAssignTeacherToCourse = (
    courseId: string,
    teacherId: string,
    teacherName: string
  ) => {
    setCourses((prevCourses) => {
      const updated = prevCourses.map((c) =>
        c.id === courseId
          ? { ...c, teacherName, instructorName: teacherName, instructorId: teacherId }
          : c
      );
      // Auto-recalculate conflict-free schedules
      const newSchedules = generateConflictFreeSchedules(GRADE_LEVELS, updated);
      setSchedules(newSchedules);
      saveCourses(updated);
      saveSchedules(newSchedules);
      return updated;
    });
  };

  // Admin: Regenerate schedules button
  const handleRegenerateSchedules = () => {
    const freshSchedules = generateConflictFreeSchedules(GRADE_LEVELS, courses);
    setSchedules(freshSchedules);
    saveSchedules(freshSchedules);
  };

  // Community Chat handler
  const handleSendStudentChatMessage = async (channelId: string, content: string) => {
    const newMsg: StudentChatMessage = {
      id: `msg-${Date.now()}`,
      channelId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatarUrl,
      senderGradeId: currentUser.gradeId,
      avatarInitials: currentUser.avatarInitials,
      text: content,
      content,
      timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      reactions: {},
    };
    setStudentChatMessages((prev) => [...prev, newMsg]);
    sendCommunityChatMessage(newMsg); // Broadcast to Firestore

    try {
      await fetch('/api/sync/student-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMsg }),
      });
    } catch {
      // Local message already added
    }
  };

  // Live Video Classroom handlers
  const handleToggleLiveClass = () => {
    setActiveLiveClass((prev) => {
      const nextState = !prev.isLive;
      if (nextState) {
        triggerInstantPushNotification(
          '🔴 ¡Clase en Vivo Iniciada!',
          `${currentUser.name} ha iniciado la videollamada interactiva de ${prev.courseName} (${prev.gradeName}). ¡Únete ahora!`,
          'Institucional'
        );
      } else {
        triggerInstantPushNotification(
          'Clase en Vivo Finalizada',
          `La sesión de ${prev.courseName} ha concluido. La grabación y apuntes de pizarra están guardados.`,
          'Institucional'
        );
      }
      const updated = { ...prev, isLive: nextState };
      updateLiveClass({ isLive: nextState }); // Broadcast to Firestore
      return updated;
    });
  };

  const handleSendLiveMessage = (
    senderName: string,
    role: UserRole,
    content: string
  ) => {
    const newLiveMsg: LiveClassMessage = {
      id: `live-m-${Date.now()}`,
      senderId: currentUser.id,
      senderName,
      role,
      avatar: currentUser.avatarUrl,
      text: content,
      message: content,
      timestamp: new Date().toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setActiveLiveClass((prev) => {
      const updated = {
        ...prev,
        chatMessages: [...prev.chatMessages, newLiveMsg],
        messages: [...(prev.messages || prev.chatMessages), newLiveMsg],
      };
      updateLiveClass({ chatMessages: updated.chatMessages }); // Broadcast to Firestore
      return updated;
    });
  };

  const handleToggleHandRaise = (participantId: string) => {
    setActiveLiveClass((prev) => {
      const updatedParticipants = prev.participants.map((p) =>
        p.id === participantId
          ? { ...p, hasHandRaised: !p.hasHandRaised, isHandRaised: !p.hasHandRaised }
          : p
      );
      updateLiveClass({ participants: updatedParticipants }); // Broadcast to Firestore
      return {
        ...prev,
        participants: updatedParticipants,
      };
    });
  };

  // Academic handlers
  const handleAddTopic = (newTopic: TopicItem) => {
    setTopics((prev) => [newTopic, ...prev]);
    const course = courses.find((c) => c.id === newTopic.courseId);
    const grade = GRADE_LEVELS.find((g) => g.id === newTopic.gradeId);
    triggerInstantPushNotification(
      `Nuevo Tema y Ejercicios Publicados`,
      `${newTopic.authorName} subió "${newTopic.title}" en ${course?.name || 'el curso'} (${grade?.name || ''}).`,
      'Académico'
    );
  };

  const handleAddMaterial = (newMaterial: CurricularMaterial) => {
    setCurricularMaterials((prev) => [newMaterial, ...prev]);
    const course = courses.find((c) => c.id === newMaterial.courseId);
    triggerInstantPushNotification(
      `Nuevo Material ${newMaterial.fileType.toUpperCase()} Disponible`,
      `${newMaterial.uploadedBy} subió "${newMaterial.title}" (${newMaterial.fileType.toUpperCase()} · ${newMaterial.fileSize}) en ${course?.name || 'el curso'}.`,
      'Académico'
    );
  };

  const handleDeleteMaterial = (materialId: string) => {
    setCurricularMaterials((prev) => prev.filter((m) => m.id !== materialId));
  };

  const handleRecordExerciseScore = (
    topicId: string,
    correctCount: number,
    totalCount: number
  ) => {
    setStudentsProgress((prev) =>
      prev.map((student, idx) => {
        if (idx !== 0) return student;
        const completed = student.completedTopicIds.includes(topicId)
          ? student.completedTopicIds
          : [...student.completedTopicIds, topicId];
        return {
          ...student,
          completedTopicIds: completed,
          exerciseScores: {
            ...student.exerciseScores,
            [topicId]: {
              correct: correctCount,
              total: totalCount,
              lastAttempt: 'Hoy · Sincronizado',
            },
          },
        };
      })
    );

    if (correctCount === totalCount && totalCount > 0) {
      triggerInstantPushNotification(
        'Tema Dominado al 100%',
        `Progreso académico actualizado automáticamente: ${correctCount}/${totalCount} ejercicios resueltos con éxito.`,
        'Académico'
      );
    }
  };

  const handleAddAssessment = (newAssessment: AssessmentItem) => {
    setAssessments((prev) => [newAssessment, ...prev]);
    const course = courses.find((c) => c.id === newAssessment.courseId);
    triggerInstantPushNotification(
      `Nuevo Examen en Vivo Programado`,
      `"${newAssessment.title}" (${course?.name || 'Asignatura'}) · ${newAssessment.questions?.length || 10} preguntas · Fecha límite: ${newAssessment.dueDate || 'Hoy'}`,
      'Examen en Vivo'
    );
  };

  const handleCompleteAssessment = (assessmentId: string, score: number) => {
    setAssessments((prev) =>
      prev.map((a) =>
        a.id === assessmentId
          ? { ...a, status: 'completado', scoreObtained: score }
          : a
      )
    );
    triggerInstantPushNotification(
      `Examen Calificado al Instante`,
      `Obtuviste nota ${score.toFixed(1)}/20. Calificación asentada en el registro curricular.`,
      'Examen en Vivo'
    );
  };

  const handleUpdateAttendanceStatus = (
    studentId: string,
    newStatus: AttendanceStatus
  ) => {
    setAttendance((prev) =>
      prev.map((att) =>
        att.studentId === studentId
          ? {
              ...att,
              status: newStatus,
              arrivalTime:
                newStatus === 'Tardanza'
                  ? '08:15 AM'
                  : newStatus === 'Presente'
                  ? '07:50 AM'
                  : '08:00 AM',
            }
          : att
      )
    );
  };

  const handleMarkAllPresent = (gradeId: string) => {
    setAttendance((prev) =>
      prev.map((att) =>
        att.gradeId === gradeId
          ? {
              ...att,
              status: 'Presente',
              arrivalTime: '07:45 AM',
              observation: 'Asistencia validada en bloque',
            }
          : att
      )
    );
    const grade = GRADE_LEVELS.find((g) => g.id === gradeId);
    triggerInstantPushNotification(
      'Asistencia en Bloque Validada',
      `Se registró asistencia del 100% para ${grade?.name || 'el aula'}.`,
      'Asistencia'
    );
  };

  const handleNotifyAbsentParents = (gradeId: string, absentCount: number) => {
    const grade = GRADE_LEVELS.find((g) => g.id === gradeId);
    triggerInstantPushNotification(
      `Alerta de Inasistencias · Dirección`,
      `Se enviaron notificaciones a ${absentCount} apoderados por inasistencia en ${grade?.name || 'el aula'}.`,
      'Asistencia'
    );
  };

  // Determine if current user is an Inicial student
  const isInicialProfile =
    currentUser.role === 'estudiante' &&
    (currentUser.educationLevel === 'Inicial' ||
      currentUser.gradeId === 'ini-3' ||
      currentUser.gradeId === 'ini-4' ||
      currentUser.gradeId === 'ini-5');

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col text-white bg-cover bg-center bg-no-repeat relative select-none"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(10, 8, 16, 0.45), rgba(12, 8, 18, 0.65)), url(${INSTITUTION_ASSETS.fondoPagina})`,
      }}
    >
      {/* Real-time In-App Notification Toast */}
      {activeToast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm p-4 rounded-2xl bg-neutral-900/95 border border-[#FACC15]/60 text-white shadow-2xl backdrop-blur-xl flex items-start gap-3 animate-slideIn">
          <div className="p-2 rounded-xl bg-[#7F1D1D] text-[#FEF08A] shrink-0 border border-[#FACC15]/40 shadow-inner">
            <BellRing className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white font-display">
              {activeToast.title}
            </h4>
            <p className="text-[11px] text-slate-200 mt-0.5 leading-snug">
              {activeToast.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveToast(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* PWA iOS / Android & Push Settings Modal */}
      <PWAInstallModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        pushPermission={pushPermission}
        onRequestPushPermission={handleRequestPushPermission}
        onTriggerTestPush={() =>
          triggerInstantPushNotification(
            'Alerta Push de Prueba · Colegio Oppenheimer',
            'Comunicación instantánea operativa en dispositivos iOS, Android y escritorio.',
            'Institucional'
          )
        }
      />

      {!isAuthenticated ? (
        <LandingPortal
          systemUsers={systemUsers}
          onLogin={handleLogin}
          onOpenMobileModal={() => setIsMobileModalOpen(true)}
        />
      ) : isInicialProfile ? (
        /* SPECIAL MAGICAL EXPERIENCE ONLY FOR INICIAL */
        <InicialKidExperienceView
          currentUser={currentUser}
          courses={courses}
          materials={curricularMaterials}
          onLogout={() => setIsAuthenticated(false)}
          onOpenMobileModal={() => setIsMobileModalOpen(true)}
        />
      ) : (
        <>
          {/* Authenticated Full-Height No-Scroll Workspace with Lateral Tabs (Primaria & Secundaria) */}
          <div className="flex-1 min-h-0 flex overflow-hidden">
            {/* Lateral Tabs Sidebar (Strict Dark Theme, Exclusive Profile Access) */}
            <aside className="w-64 shrink-0 bg-black/65 backdrop-blur-2xl border-r border-white/10 flex flex-col justify-between p-4 z-20 text-white">
              <div className="space-y-4">
                {/* Header Brand within Sidebar */}
                <div className="flex items-center gap-2.5 px-2 pb-3 border-b border-white/10">
                  <img
                    src={INSTITUTION_ASSETS.crestEmblem}
                    alt="Emblema Oppenheimer"
                    className="w-10 h-10 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      Colegio Oppenheimer
                    </p>
                    <p className="text-[11px] text-[#FEF08A] font-mono-tabular">
                      Aula Virtual 2026
                    </p>
                  </div>
                </div>

                {/* Lateral Navigation Tabs */}
                <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                  {/* Inicio */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('inicio')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeTab === 'inicio'
                        ? 'bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] text-white shadow-lg border border-[#FACC15]/40'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Award className="w-4 h-4 shrink-0 text-[#FACC15]" />
                    <span>Inicio Institucional</span>
                  </button>

                  {/* Curricular */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('curricular')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeTab === 'curricular'
                        ? 'bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] text-white shadow-lg border border-[#FACC15]/40'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 shrink-0 text-[#FACC15]" />
                    <span>
                      {currentUser.role === 'estudiante'
                        ? 'Mis Temas y Ejercicios'
                        : 'Avance Curricular'}
                    </span>
                  </button>

                  {/* Exámenes */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('examenes')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeTab === 'examenes'
                        ? 'bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] text-white shadow-lg border border-[#FACC15]/40'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Clock className="w-4 h-4 shrink-0 text-[#FACC15]" />
                    <span>
                      {currentUser.role === 'estudiante'
                        ? 'Mis Exámenes en Vivo'
                        : 'Exámenes y Tareas'}
                    </span>
                  </button>

                  {/* Asistencia */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('asistencia')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeTab === 'asistencia'
                        ? 'bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] text-white shadow-lg border border-[#FACC15]/40'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 shrink-0 text-[#FACC15]" />
                    <span>
                      {currentUser.role === 'estudiante'
                        ? 'Mi Asistencia Escolar'
                        : 'Asistencia y Reportes'}
                    </span>
                  </button>

                  {/* HORARIO ESCOLAR (NEW) */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('horario')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeTab === 'horario'
                        ? 'bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] text-white shadow-lg border border-[#FACC15]/40'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Calendar className="w-4 h-4 shrink-0 text-[#FACC15]" />
                    <span>Mi Horario Escolar</span>
                  </button>

                  {/* CLASE EN VIVO (VIDEOLLAMADA) (NEW) */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('clase_en_vivo')}
                    className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeTab === 'clase_en_vivo'
                        ? 'bg-gradient-to-r from-red-800 to-rose-900 text-white shadow-lg border border-red-400'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Video className="w-4 h-4 shrink-0 text-red-400" />
                      <span>Clase en Vivo</span>
                    </div>
                    {activeLiveClass.isLive && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                  </button>

                  {/* CHAT DE COMUNIDAD / ESTUDIANTES (NEW) */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('chat_estudiantes')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                      activeTab === 'chat_estudiantes'
                        ? 'bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] text-white shadow-lg border border-[#FACC15]/40'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 shrink-0 text-[#FACC15]" />
                    <span>
                      {currentUser.role === 'estudiante'
                        ? 'Chat de Aula & Salón'
                        : 'Comunidad Escolar'}
                    </span>
                  </button>

                  {/* STUDENT EXCLUSIVE: CONSULTA IA (TUTOR CHATGPT) */}
                  {currentUser.role === 'estudiante' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('consulta_ia')}
                      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                        activeTab === 'consulta_ia'
                          ? 'bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] text-white shadow-lg border border-[#FACC15]/40'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 shrink-0 text-[#FACC15]" />
                        <span>Tutor IA (ChatGPT)</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FACC15]/20 text-[#FEF08A] border border-[#FACC15]/40">
                        IA
                      </span>
                    </button>
                  )}

                  {/* ADMIN EXCLUSIVE: GESTIÓN INTEGRAL (USUARIOS, HORARIOS, PAGOS) */}
                  {currentUser.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('usuarios')}
                      className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                        activeTab === 'usuarios'
                          ? 'bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] text-white shadow-lg border border-[#FACC15]/40'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <KeyRound className="w-4 h-4 shrink-0 text-[#FACC15]" />
                      <span>Gestión Escolar Integral</span>
                    </button>
                  )}
                </nav>

                {/* Exclusive Profile Card */}
                <div className="pt-3 border-t border-white/10">
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 shadow-inner">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-md bg-[#7F1D1D] text-[#FEF08A] border border-[#FACC15]/40">
                        {currentUser.role === 'estudiante' && <GraduationCap className="w-3.5 h-3.5" />}
                        {currentUser.role === 'docente' && <BookOpen className="w-3.5 h-3.5" />}
                        {currentUser.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5" />}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#FACC15]">
                        {currentUser.role === 'estudiante'
                          ? 'Perfil: Estudiante'
                          : currentUser.role === 'docente'
                          ? 'Perfil: Docente Titular'
                          : 'Perfil: Administrador'}
                      </span>
                    </div>
                    <p className="font-bold text-white text-xs truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-slate-300 font-mono-tabular text-[11px]">
                      {currentUser.code}
                    </p>
                    <p className="text-[10px] text-slate-400 pt-0.5 border-t border-white/5">
                      Sesión exclusiva activa
                    </p>
                  </div>
                </div>
              </div>

              {/* Sidebar Footer Actions */}
              <div className="space-y-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsMobileModalOpen(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5 text-[#FACC15]" />
                  <span>App iOS / Android</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAuthenticated(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-950/60 text-slate-300 hover:text-red-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </aside>

            {/* Main Content Viewport */}
            <main className="flex-1 min-w-0 h-full overflow-y-auto p-4 lg:p-6 text-slate-100 flex flex-col">
              {/* Floating Alert Banner if a Live Class is ongoing and user is on another tab */}
              {activeLiveClass.isLive && activeTab !== 'clase_en_vivo' && (
                <div className="shrink-0 mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-red-900/90 to-rose-950/90 border border-red-500/60 shadow-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-2">
                        <span>🔴 CLASE EN VIVO EN EMISIÓN:</span>
                        <span className="text-[#FEF08A]">{activeLiveClass.title}</span>
                      </p>
                      <p className="text-[11px] text-slate-300">
                        Docente: {activeLiveClass.teacherName} · {activeLiveClass.courseName} ({activeLiveClass.gradeName}) · {activeLiveClass.participants.length} alumnos conectados
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('clase_en_vivo')}
                    className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Ingresar a la Clase</span>
                  </button>
                </div>
              )}

              {/* View Container */}
              <div className="flex-1 min-h-0 flex flex-col">
                {activeTab === 'inicio' && (
                  <div className="max-w-[1340px] w-full mx-auto space-y-6">
                    <InstitutionalDashboardHome
                      currentUser={currentUser}
                      courses={courses}
                      grades={GRADE_LEVELS}
                      topics={topics}
                      assessments={assessments}
                      notifications={notifications}
                      onNavigateTab={setActiveTab}
                      onSelectCourseAndOpen={(courseId) => {
                        setSelectedCourseId(courseId);
                        setActiveTab('curricular');
                      }}
                      onSendPushBroadcast={(title, message, targetRole) =>
                        triggerInstantPushNotification(
                          title,
                          message,
                          'Institucional',
                          targetRole
                        )
                      }
                      onOpenMobileModal={() => setIsMobileModalOpen(true)}
                    />
                  </div>
                )}

                {activeTab === 'curricular' && (
                  <div className="max-w-[1340px] w-full mx-auto space-y-6">
                    <CurriculumStudio
                      userRole={currentUser.role}
                      userName={currentUser.name}
                      courses={courses}
                      grades={GRADE_LEVELS}
                      topics={topics}
                      materials={curricularMaterials}
                      selectedGradeId={selectedGradeId}
                      selectedCourseId={selectedCourseId}
                      onSelectGrade={setSelectedGradeId}
                      onSelectCourse={setSelectedCourseId}
                      onAddTopic={handleAddTopic}
                      onAddMaterial={handleAddMaterial}
                      onDeleteMaterial={handleDeleteMaterial}
                      studentProgress={studentsProgress[0]}
                      onRecordExerciseScore={handleRecordExerciseScore}
                    />
                  </div>
                )}

                {activeTab === 'examenes' && (
                  <div className="max-w-[1340px] w-full mx-auto space-y-6">
                    <LiveAssessmentsHub
                      userRole={currentUser.role}
                      assessments={assessments}
                      courses={courses}
                      grades={GRADE_LEVELS}
                      onAddAssessment={handleAddAssessment}
                      onCompleteAssessment={handleCompleteAssessment}
                    />
                  </div>
                )}

                {activeTab === 'asistencia' && (
                  <div className="max-w-[1340px] w-full mx-auto space-y-6">
                    <AttendanceAnalyticsView
                      userRole={currentUser.role}
                      currentUser={currentUser}
                      attendance={attendance}
                      grades={GRADE_LEVELS}
                      studentsProgress={studentsProgress}
                      selectedGradeId={selectedGradeId}
                      onSelectGrade={setSelectedGradeId}
                      onUpdateAttendanceStatus={handleUpdateAttendanceStatus}
                      onMarkAllPresent={() => handleMarkAllPresent(selectedGradeId)}
                      onNotifyAbsentParents={() => handleNotifyAbsentParents(selectedGradeId, 2)}
                    />
                  </div>
                )}

                {/* HORARIO ESCOLAR */}
                {activeTab === 'horario' && (
                  <div className="h-full flex flex-col min-h-0 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl">
                    <div className="shrink-0 mb-4 pb-3 border-b border-white/10 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-[#FACC15]" />
                          <span>Horario Escolar Oficial 2026</span>
                        </h3>
                        <p className="text-xs text-slate-300">
                          {currentUser.role === 'estudiante'
                            ? `Distribución semanal de clases para ${GRADE_LEVELS.find((g) => g.id === (currentUser.gradeId || 'sec-4'))?.name || 'tu grado'}`
                            : 'Distribución semanal curricular sin cruces de docentes'}
                        </p>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      <ScheduleTimetableView
                        currentUser={currentUser}
                        grades={GRADE_LEVELS}
                        courses={courses}
                        schedules={schedules}
                        onNavigateToLiveClass={() => setActiveTab('clase_en_vivo')}
                      />
                    </div>
                  </div>
                )}

                {/* CLASE EN VIVO (VIDEOLLAMADA GRUPAL INTERACTIVA) */}
                {activeTab === 'clase_en_vivo' && (
                  <div className="h-full flex flex-col min-h-0">
                    <LiveClassroomView
                      session={activeLiveClass}
                      currentUser={currentUser}
                      grades={GRADE_LEVELS}
                      courses={courses}
                      onStartClass={(courseId, gradeId, title) => {
                        const course = courses.find((c) => c.id === courseId);
                        const grade = GRADE_LEVELS.find((g) => g.id === gradeId);
                        const updated = {
                          ...activeLiveClass,
                          isLive: true,
                          courseId,
                          courseName: course?.name || activeLiveClass.courseName,
                          gradeId,
                          gradeName: grade?.name || activeLiveClass.gradeName,
                          teacherId: currentUser.id,
                          teacherName: currentUser.name,
                          title,
                          startedAt: 'En Vivo · Ahora',
                        };
                        setActiveLiveClass(updated);
                        updateLiveClass(updated); // Sync to Firestore
                        fetch('/api/sync/live-class', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(updated),
                        }).catch(() => {});
                        triggerInstantPushNotification(
                          '🔴 ¡Clase en Vivo Iniciada!',
                          `${currentUser.name} ha iniciado la videollamada interactiva de "${title}". ¡Ingresa ahora!`,
                          'Institucional'
                        );
                      }}
                      onEndClass={() => {
                        const updated = { ...activeLiveClass, isLive: false };
                        setActiveLiveClass(updated);
                        updateLiveClass({ isLive: false }); // Sync to Firestore
                        fetch('/api/sync/live-class', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(updated),
                        }).catch(() => {});
                        triggerInstantPushNotification(
                          'Clase en Vivo Concluida',
                          'La sesión en vivo ha finalizado con éxito.',
                          'Institucional'
                        );
                      }}
                      onToggleHandRaise={(participantId) => {
                        setActiveLiveClass((prev) => {
                          const updatedParticipants = prev.participants.map((p) =>
                            p.id === participantId
                              ? { ...p, hasHandRaised: !p.hasHandRaised, isHandRaised: !p.hasHandRaised }
                              : p
                          );
                          updateLiveClass({ participants: updatedParticipants }); // Sync to Firestore
                          return {
                            ...prev,
                            participants: updatedParticipants,
                          };
                        });
                        fetch('/api/sync/live-class/hand-raise', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ participantId }),
                        }).catch(() => {});
                      }}
                      onSendLiveChatMessage={(text) => {
                        const newMsg: LiveClassMessage = {
                          id: `live-m-${Date.now()}`,
                          senderId: currentUser.id,
                          senderName: currentUser.name,
                          role: currentUser.role,
                          avatar: currentUser.avatarUrl,
                          text,
                          message: text,
                          timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
                        };
                        setActiveLiveClass((prev) => {
                          const updatedMessages = [...prev.chatMessages, newMsg];
                          updateLiveClass({ chatMessages: updatedMessages }); // Sync to Firestore
                          return {
                            ...prev,
                            chatMessages: updatedMessages,
                            messages: [...(prev.messages || prev.chatMessages), newMsg],
                          };
                        });
                        fetch('/api/sync/live-class/message', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ message: newMsg }),
                        }).catch(() => {});
                      }}
                      onUpdateWhiteboard={(notes, isProjected, drawingData) => {
                        setActiveLiveClass((prev) => ({
                          ...prev,
                          whiteboardNotes: notes,
                          isWhiteboardProjected: isProjected !== undefined ? isProjected : prev.isWhiteboardProjected,
                          whiteboardDrawingData: drawingData !== undefined ? drawingData : prev.whiteboardDrawingData,
                        }));
                        updateWhiteboard(notes, isProjected ?? false, drawingData); // Sync to Firestore
                        fetch('/api/sync/live-class/whiteboard', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ notes, isProjected, drawingData }),
                        }).catch(() => {});
                      }}
                    />
                  </div>
                )}

                {/* CHAT DE COMUNIDAD Y AULA */}
                {activeTab === 'chat_estudiantes' && (
                  <div className="h-full flex flex-col min-h-0">
                    <StudentCommunityChatView
                      currentUser={currentUser}
                      grades={GRADE_LEVELS}
                      channels={chatChannels}
                      messages={studentChatMessages}
                      onSendMessage={(channelId, text) => handleSendStudentChatMessage(channelId, text)}
                      onAddReaction={(messageId, emoji) => {
                        setStudentChatMessages((prev) =>
                          prev.map((m) => {
                            if (m.id !== messageId) return m;
                            const currentReactions: Record<string, number> = Array.isArray(m.reactions)
                              ? {}
                              : { ...(m.reactions || {}) };
                            currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
                            return { ...m, reactions: currentReactions };
                          })
                        );
                        reactToCommunityChatMessage(messageId, emoji); // Sync to Firestore
                        fetch('/api/sync/student-chat/reaction', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ messageId, emoji }),
                        }).catch(() => {});
                      }}
                    />
                  </div>
                )}

                {/* TUTOR IA */}
                {activeTab === 'consulta_ia' && currentUser.role === 'estudiante' && (
                  <div className="h-full flex flex-col min-h-0">
                    <StudentAIChatGPTView
                      currentUser={currentUser}
                      courses={courses}
                    />
                  </div>
                )}

                {/* ADMIN GESTIÓN ESCOLAR (USUARIOS, HORARIOS, COBRANZAS) */}
                {activeTab === 'usuarios' && currentUser.role === 'admin' && (
                  <div className="h-full flex flex-col min-h-0">
                    <UserManagementView
                      users={systemUsers}
                      grades={GRADE_LEVELS}
                      courses={courses}
                      schedules={schedules}
                      onAddUser={handleAddUser}
                      onDeleteUser={handleDeleteUser}
                      onSendNotification={(title, msg) =>
                        triggerInstantPushNotification(title, msg, 'Institucional')
                      }
                      onUpdateUserPayment={handleUpdateUserPayment}
                      onAssignTeacherToCourse={handleAssignTeacherToCourse}
                      onRegenerateSchedules={handleRegenerateSchedules}
                    />
                  </div>
                )}
              </div>
            </main>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
