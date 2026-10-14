import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import {
  UserProfile,
  LiveClassSession,
  LiveClassMessage,
  StudentChatMessage,
  CourseItem,
  ScheduleSlot,
} from '../types';
import {
  ADMIN_USER,
  INITIAL_SYSTEM_USERS,
  COURSES,
  INITIAL_SCHEDULES,
  INITIAL_LIVE_CLASS_SESSION,
  INITIAL_STUDENT_MESSAGES,
} from '../data/initialData';

/**
 * ==============================================================================
 * DATABASE & REALTIME SYNCHRONIZATION SERVICE
 * Colegio Capitán Enrique Oppenheimer
 * ==============================================================================
 * Maneja la concurrencia multiusuario mediante Google Firestore en producción
 * y fallback automático a almacenamiento local reactivo.
 *
 * El acceso es mediante Usuario (código) y Contraseña otorgados por el Administrador.
 * No se requiere cuenta de correo electrónico de los alumnos o docentes.
 */

// Claves de almacenamiento local de respaldo
const STORAGE_KEYS = {
  USERS: 'oppenheimer_db_users',
  LIVE_CLASS: 'oppenheimer_db_live_class',
  CHAT_MESSAGES: 'oppenheimer_db_chat_messages',
  COURSES: 'oppenheimer_db_courses',
  SCHEDULES: 'oppenheimer_db_schedules',
};

// ------------------------------------------------------------------------------
// 1. GESTIÓN DE USUARIOS & AUTENTICACIÓN INSTITUCIONAL
// ------------------------------------------------------------------------------

export async function authenticateUser(
  code: string,
  password: string
): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  const normalizedCode = code.trim().toLowerCase();
  const trimmedPassword = password.trim();

  if (!normalizedCode || !trimmedPassword) {
    return { success: false, error: 'Por favor ingrese su usuario y contraseña.' };
  }

  // 1. Si Firebase está activo, consultar la colección 'users'
  if (isFirebaseConfigured() && db) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('codeLower', '==', normalizedCode));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0].data() as UserProfile;
        if (userDoc.password && userDoc.password !== trimmedPassword) {
          return { success: false, error: 'Contraseña incorrecta para el usuario ingresado.' };
        }
        if (userDoc.paymentStatus === 'Bloqueado por Pago') {
          return { success: false, user: userDoc, error: 'BLOCKED_PAYMENT' };
        }
        return { success: true, user: userDoc };
      }
    } catch (err) {
      console.warn('⚠️ [Auth] Error consultando Firestore, verificando almacenamiento local:', err);
    }
  }

  // 2. Almacenamiento Local / Respaldo en Memoria
  const localUsers = getStoredUsers();
  const matched = localUsers.find(
    (u) => u.code.toLowerCase().trim() === normalizedCode
  );

  if (matched) {
    if (matched.password && matched.password !== trimmedPassword) {
      return { success: false, error: 'Contraseña incorrecta para el usuario ingresado.' };
    }
    if (matched.paymentStatus === 'Bloqueado por Pago') {
      return { success: false, user: matched, error: 'BLOCKED_PAYMENT' };
    }
    return { success: true, user: matched };
  }

  // Comprobación de acceso inicial para Administrador Maestro
  if (normalizedCode === 'admin' && trimmedPassword === 'admin') {
    return { success: true, user: ADMIN_USER };
  }

  return {
    success: false,
    error: 'Credenciales no válidas. Verifique su usuario y contraseña o comuníquese con Dirección.',
  };
}

export function subscribeUsers(callback: (users: UserProfile[]) => void): () => void {
  if (isFirebaseConfigured() && db) {
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        if (snapshot.empty) {
          // Inicializar usuario admin raíz si la base de datos está vacía
          saveUser(ADMIN_USER);
          callback([ADMIN_USER]);
        } else {
          const usersList: UserProfile[] = [];
          snapshot.forEach((docSnap) => {
            usersList.push(docSnap.data() as UserProfile);
          });
          callback(usersList);
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersList));
        }
      },
      (error) => {
        console.warn('⚠️ [Firestore users listener]:', error);
        callback(getStoredUsers());
      }
    );
    return unsubscribe;
  }

  // Modo local
  const current = getStoredUsers();
  callback(current);
  return () => {};
}

export async function saveUser(user: UserProfile): Promise<void> {
  const userPayload: UserProfile & { codeLower: string } = {
    ...user,
    codeLower: user.code.toLowerCase().trim(),
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'users', user.id), userPayload, { merge: true });
    } catch (err) {
      console.error('Error guardando usuario en Firestore:', err);
    }
  }

  // Respaldo local
  const localUsers = getStoredUsers();
  const idx = localUsers.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    localUsers[idx] = user;
  } else {
    localUsers.push(user);
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(localUsers));
}

export async function deleteUser(userId: string): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err) {
      console.error('Error eliminando usuario de Firestore:', err);
    }
  }

  const localUsers = getStoredUsers().filter((u) => u.id !== userId);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(localUsers));
}

function getStoredUsers(): UserProfile[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_SYSTEM_USERS;
}

// ------------------------------------------------------------------------------
// 2. SINCRONIZACIÓN DE CLASE EN VIVO & PIZARRA DIGITAL
// ------------------------------------------------------------------------------

export function subscribeLiveClass(
  callback: (session: LiveClassSession) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const liveDocRef = doc(db, 'live_classes', 'active_session');
    const unsubscribe = onSnapshot(
      liveDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as LiveClassSession);
        } else {
          // Inicializar sesión limpia
          setDoc(liveDocRef, INITIAL_LIVE_CLASS_SESSION);
          callback(INITIAL_LIVE_CLASS_SESSION);
        }
      },
      (error) => {
        console.warn('⚠️ [Firestore live class listener]:', error);
      }
    );
    return unsubscribe;
  }

  return () => {};
}

export async function updateLiveClass(
  data: Partial<LiveClassSession>
): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      const liveDocRef = doc(db, 'live_classes', 'active_session');
      await setDoc(liveDocRef, data, { merge: true });
    } catch (err) {
      console.error('Error actualizando sesión en vivo en Firestore:', err);
    }
  }
}

export async function updateWhiteboard(
  notes: string,
  isProjected: boolean,
  drawingData?: string
): Promise<void> {
  const payload: Partial<LiveClassSession> = {
    whiteboardNotes: notes,
    isWhiteboardProjected: isProjected,
  };
  if (drawingData !== undefined) {
    payload.whiteboardDrawingData = drawingData;
  }
  await updateLiveClass(payload);
}

// ------------------------------------------------------------------------------
// 3. CHAT ESCOLAR COMUNITARIO ENTRE ESTUDIANTES & SALONES
// ------------------------------------------------------------------------------

export function subscribeCommunityChat(
  callback: (messages: StudentChatMessage[]) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const chatRef = collection(db, 'community_chat');
    const q = query(chatRef, orderBy('createdAtMs', 'asc'), limit(200));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs: StudentChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          msgs.push(docSnap.data() as StudentChatMessage);
        });
        callback(msgs);
        localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(msgs));
      },
      (error) => {
        console.warn('⚠️ [Firestore community chat listener]:', error);
        callback(getStoredChatMessages());
      }
    );
    return unsubscribe;
  }

  callback(getStoredChatMessages());
  return () => {};
}

export async function sendCommunityChatMessage(
  message: StudentChatMessage
): Promise<void> {
  const payload = {
    ...message,
    createdAtMs: Date.now(),
  };

  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'community_chat', message.id), payload);
    } catch (err) {
      console.error('Error enviando mensaje en Firestore:', err);
    }
  }

  const current = getStoredChatMessages();
  current.push(payload);
  localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(current));
}

export async function reactToCommunityChatMessage(
  messageId: string,
  emoji: string
): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      const msgRef = doc(db, 'community_chat', messageId);
      const snap = await getDoc(msgRef);
      if (snap.exists()) {
        const data = snap.data() as StudentChatMessage;
        const currentReactions: Record<string, number> = Array.isArray(data.reactions)
          ? {}
          : ((data.reactions || {}) as Record<string, number>);
        const count = currentReactions[emoji] || 0;
        await setDoc(
          msgRef,
          {
            reactions: {
              ...currentReactions,
              [emoji]: count + 1,
            },
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.error('Error agregando reacción en Firestore:', err);
    }
  }

  const current = getStoredChatMessages();
  const target = current.find((m) => m.id === messageId);
  if (target) {
    const rx: Record<string, number> = Array.isArray(target.reactions)
      ? {}
      : ((target.reactions || {}) as Record<string, number>);
    rx[emoji] = (rx[emoji] || 0) + 1;
    target.reactions = rx;
    localStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(current));
  }
}

function getStoredChatMessages(): StudentChatMessage[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
    if (saved) return JSON.parse(saved);
  } catch {}
  return INITIAL_STUDENT_MESSAGES;
}

// ------------------------------------------------------------------------------
// 4. HORARIOS & CURSOS ASIGNADOS
// ------------------------------------------------------------------------------

export function subscribeCourses(callback: (courses: CourseItem[]) => void): () => void {
  if (isFirebaseConfigured() && db) {
    const coursesRef = collection(db, 'courses');
    const unsubscribe = onSnapshot(coursesRef, (snapshot) => {
      if (snapshot.empty) {
        callback(COURSES);
      } else {
        const list: CourseItem[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as CourseItem);
        });
        callback(list);
      }
    });
    return unsubscribe;
  }
  callback(COURSES);
  return () => {};
}

export async function saveCourses(coursesList: CourseItem[]): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      for (const course of coursesList) {
        await setDoc(doc(db, 'courses', course.id), course, { merge: true });
      }
    } catch (err) {
      console.error('Error guardando cursos en Firestore:', err);
    }
  }
  localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(coursesList));
}

export function subscribeSchedules(
  callback: (schedules: Record<string, ScheduleSlot[]>) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const schedRef = doc(db, 'institutional', 'schedules');
    const unsubscribe = onSnapshot(schedRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data().data as Record<string, ScheduleSlot[]>);
      } else {
        callback(INITIAL_SCHEDULES);
      }
    });
    return unsubscribe;
  }
  callback(INITIAL_SCHEDULES);
  return () => {};
}

export async function saveSchedules(
  schedulesData: Record<string, ScheduleSlot[]>
): Promise<void> {
  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, 'institutional', 'schedules'), { data: schedulesData });
    } catch (err) {
      console.error('Error guardando horarios en Firestore:', err);
    }
  }
  localStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedulesData));
}
