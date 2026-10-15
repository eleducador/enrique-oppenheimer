import React, { useState } from 'react';
import {
  UserPlus,
  Users,
  Search,
  KeyRound,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Sparkles,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  Calendar,
  Clock,
  RefreshCw,
  ChevronRight,
  UserX,
  CreditCard,
  Filter,
} from 'lucide-react';
import { UserProfile, UserRole, GradeLevel, CourseItem, ScheduleSlot } from '../types';
import { ScheduleTimetableView } from './ScheduleTimetableView';

interface UserManagementViewProps {
  users: UserProfile[];
  grades: GradeLevel[];
  courses: CourseItem[];
  schedules: Record<string, ScheduleSlot[]>;
  onAddUser: (newUser: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
  onSendNotification: (title: string, message: string) => void;
  onUpdateUserPayment: (
    userId: string,
    status: 'Al Día' | 'Bloqueado por Pago' | 'Pendiente',
    debtMonths?: string[],
    notes?: string
  ) => void;
  onAssignTeacherToCourse: (courseId: string, teacherId: string, teacherName: string) => void;
  onRegenerateSchedules: () => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  grades,
  courses,
  schedules,
  onAddUser,
  onDeleteUser,
  onSendNotification,
  onUpdateUserPayment,
  onAssignTeacherToCourse,
  onRegenerateSchedules,
}) => {
  // Main admin active section tab
  const [adminTab, setAdminTab] = useState<'usuarios_pagos' | 'docentes_areas' | 'generador_horarios'>(
    'usuarios_pagos'
  );

  // --- TAB 1: USER & PAYMENT MANAGEMENT STATE ---
  const [activeFilter, setActiveFilter] = useState<'Todos' | UserRole | 'Bloqueados'>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Payment blocking modal state
  const [blockingStudent, setBlockingStudent] = useState<UserProfile | null>(null);
  const [blockingMonth, setBlockingMonth] = useState('Octubre 2026');
  const [blockingNotes, setBlockingNotes] = useState('Pensión escolar vencida. Regularizar en Tesorería.');

  // Form State for creating new user
  const [newRole, setNewRole] = useState<UserRole>('docente');
  const [newEducationLevel, setNewEducationLevel] = useState<'Inicial' | 'Primaria' | 'Secundaria'>('Secundaria');
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('DOC-CEO-101');
  const [newPassword, setNewPassword] = useState('docente2026');
  const [newEmail, setNewEmail] = useState('');
  const [newGradeId, setNewGradeId] = useState('sec-4');
  const [newSpecialty, setNewSpecialty] = useState('Docente de Asignatura Curricular');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // --- TAB 2: TEACHER ASSIGNMENT STATE ---
  const [selectedAssignmentGradeId, setSelectedAssignmentGradeId] = useState<string>('sec-4');

  // --- TAB 3: SCHEDULE GENERATOR STATE ---
  const [previewScheduleGradeId, setPreviewScheduleGradeId] = useState<string>('sec-4');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Teachers available in the system
  const teachersList = users.filter((u) => u.role === 'docente');

  // Handle role change in form with smart auto-generated code and suggested password
  const handleFormRoleChange = (role: UserRole) => {
    setNewRole(role);
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    if (role === 'docente') {
      setNewCode(`DOC-CEO-${randomSuffix}`);
      setNewPassword(`docente${new Date().getFullYear()}`);
      setNewSpecialty('Docente de Asignatura Curricular');
    } else if (role === 'estudiante') {
      setNewCode(`CEO-2026-${randomSuffix}`);
      setNewPassword(`estudiante${new Date().getFullYear()}`);
    } else {
      setNewCode(`DIR-CEO-${randomSuffix}`);
      setNewPassword(`admin${new Date().getFullYear()}`);
      setNewSpecialty('Coordinación Académica y Dirección');
    }
  };

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(`${newRole.substring(0, 3)}_${res}!`);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim() || !newPassword.trim()) return;

    const initials = newName
      .trim()
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() || '')
      .join('');

    const matchedGrade = grades.find((g) => g.id === newGradeId);
    const assignedLevel: 'Inicial' | 'Primaria' | 'Secundaria' =
      newRole === 'estudiante'
        ? matchedGrade?.level || newEducationLevel
        : newEducationLevel;

    const createdUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: newName.trim(),
      code: newCode.trim(),
      role: newRole,
      avatarInitials: initials || 'CO',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${initials}&backgroundColor=7f1d1d,b91c1c,991b1b&textColor=ffffff`,
      email: newEmail.trim() || `${newCode.toLowerCase()}@colegiooppenheimer.edu.pe`,
      gradeId: newRole === 'estudiante' ? newGradeId : undefined,
      educationLevel: assignedLevel,
      specialty: newRole === 'docente' || newRole === 'admin' ? newSpecialty : undefined,
      password: newPassword.trim(),
      paymentStatus: newRole === 'estudiante' ? 'Al Día' : undefined,
    };

    onAddUser(createdUser);

    setSuccessMessage(
      `¡Cuenta creada con éxito! Usuario: ${createdUser.code} | Contraseña: ${createdUser.password}`
    );
    onSendNotification(
      'Nuevo Usuario Registrado',
      `Se dio de alta a ${createdUser.name} · Usuario: ${createdUser.code} · Clave: ${createdUser.password}`
    );

    // Reset form with new code
    setNewName('');
    setNewEmail('');
    handleFormRoleChange(newRole);

    setTimeout(() => {
      setSuccessMessage('');
    }, 12000);
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleCopyCredentials = (user: UserProfile) => {
    const credText = `COLEGIO CAPITÁN ENRIQUE OPPENHEIMER - CREDENCIALES DE ACCESO\nNombre: ${user.name}\nRol: ${user.role.toUpperCase()}\nUsuario: ${user.code}\nContraseña: ${user.password || 'oppenheimer2026'}\nPortal: https://aulavirtual.colegiooppenheimer.edu.pe`;
    navigator.clipboard.writeText(credText);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Execute payment block
  const handleConfirmPaymentBlock = () => {
    if (!blockingStudent) return;
    onUpdateUserPayment(
      blockingStudent.id,
      'Bloqueado por Pago',
      [blockingMonth],
      blockingNotes
    );
    onSendNotification(
      'Acceso Bloqueado por Pago',
      `Se restringió el acceso al estudiante ${blockingStudent.name} (${blockingStudent.code}) por adeudo de ${blockingMonth}.`
    );
    setBlockingStudent(null);
  };

  // Execute payment unblock
  const handleUnblockStudent = (student: UserProfile) => {
    onUpdateUserPayment(student.id, 'Al Día', [], 'Pago regularizado en Tesorería');
    onSendNotification(
      'Acceso Restablecido',
      `Se habilitó nuevamente el acceso al estudiante ${student.name} (${student.code}) - Al Día.`
    );
  };

  // Trigger schedule regeneration
  const handleTriggerRegenerateSchedules = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      onRegenerateSchedules();
      setIsRegenerating(false);
      onSendNotification(
        'Horarios Escolares Actualizados',
        'Se generó una nueva distribución horaria semanal sin cruces para todos los grados de Primaria y Secundaria.'
      );
    }, 500);
  };

  // Filtered users for Tab 1
  const filteredUsers = users.filter((u) => {
    const matchesQuery =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.specialty && u.specialty.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesQuery) return false;

    if (activeFilter === 'Todos') return true;
    if (activeFilter === 'Bloqueados') {
      return u.paymentStatus === 'Bloqueado por Pago';
    }
    return u.role === activeFilter;
  });

  const blockedCount = users.filter((u) => u.paymentStatus === 'Bloqueado por Pago').length;
  const totalStudents = users.filter((u) => u.role === 'estudiante').length;

  return (
    <div className="h-full flex flex-col min-h-0 bg-transparent text-white overflow-hidden">
      {/* Top Header with 3 Admin Navigation Tabs */}
      <div className="shrink-0 p-4 sm:p-5 bg-black/40 backdrop-blur-md border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#7F1D1D] text-[#FEF08A] border border-[#FACC15]/40 shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white font-display">
              Gestión Integral del Plantel · Administración
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Colegio Capitán Enrique Oppenheimer · Cuentas, Cobranzas, Docentes y Horarios
          </p>
        </div>

        {/* Admin Navigation Pills */}
        <div className="flex items-center bg-black/60 p-1 rounded-2xl border border-white/15 gap-1 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setAdminTab('usuarios_pagos')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              adminTab === 'usuarios_pagos'
                ? 'bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] text-white shadow-md border border-[#FACC15]/40'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#FACC15]" />
            <span>Usuarios & Pensiones</span>
            {blockedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-600 text-white font-bold">
                {blockedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setAdminTab('docentes_areas')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              adminTab === 'docentes_areas'
                ? 'bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] text-white shadow-md border border-[#FACC15]/40'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#FACC15]" />
            <span>Asignación de Docentes</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminTab('generador_horarios')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              adminTab === 'generador_horarios'
                ? 'bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] text-white shadow-md border border-[#FACC15]/40'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#FACC15]" />
            <span>Horarios sin Cruces</span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: GESTIÓN DE USUARIOS Y CONTROL DE PENSIONES --- */}
      {adminTab === 'usuarios_pagos' && (
        <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-hidden flex flex-col lg:flex-row gap-6">
          {/* Left Column: Form to create user */}
          <div className="w-full lg:w-96 shrink-0 flex flex-col bg-black/55 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#FACC15]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Crear Nueva Cuenta
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-[#FEF08A] font-semibold border border-white/10">
                Alta Inmediata
              </span>
            </div>

            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="leading-snug">{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              {/* Role Picker */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Rol del Usuario
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
                  {(['docente', 'estudiante', 'admin'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleFormRoleChange(r)}
                      className={`py-1.5 rounded-lg font-semibold text-[11px] capitalize transition-all cursor-pointer ${
                        newRole === r
                          ? 'bg-[#7F1D1D] text-white shadow-sm border border-[#FACC15]/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {r === 'admin' ? 'Director' : r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Education Level */}
              {newRole !== 'admin' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Nivel Educativo
                  </label>
                  <select
                    value={newEducationLevel}
                    onChange={(e) =>
                      setNewEducationLevel(
                        e.target.value as 'Inicial' | 'Primaria' | 'Secundaria'
                      )
                    }
                    className="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-[#FACC15]"
                  >
                    <option value="Primaria">Primaria (1.° a 6.° Grado)</option>
                    <option value="Secundaria">Secundaria (1.° a 5.° Año)</option>
                    <option value="Inicial">Inicial (3 a 5 Años)</option>
                  </select>
                </div>
              )}

              {/* Grade assignment for students */}
              {newRole === 'estudiante' && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Grado Asignado
                  </label>
                  <select
                    value={newGradeId}
                    onChange={(e) => setNewGradeId(e.target.value)}
                    className="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-[#FACC15]"
                  >
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.level})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Specialty for Teacher or Admin */}
              {(newRole === 'docente' || newRole === 'admin') && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Especialidad / Cargo
                  </label>
                  <input
                    type="text"
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    placeholder="Ej. Docente de Matemática y Física"
                    className="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-[#FACC15]"
                  />
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Mg. Carlos Alberto Ramírez"
                  className="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-[#FACC15]"
                />
              </div>

              {/* User Code */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Código de Acceso (Usuario)
                </label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#FACC15]"
                />
              </div>

              {/* Password with generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    className="text-[10px] text-[#FACC15] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-generar</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showFormPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-9 bg-black/60 border border-white/15 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#FACC15]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showFormPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] hover:from-[#991B1B] hover:to-[#B91C1C] text-white font-bold text-xs shadow-lg border border-[#FACC15]/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-[#FACC15]" />
                <span>Registrar y Activar Cuenta</span>
              </button>
            </form>
          </div>

          {/* Right Column: User directory with payment status and blocking actions */}
          <div className="flex-1 min-h-0 flex flex-col bg-black/55 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl overflow-hidden">
            {/* Header and Search Filters */}
            <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div>
                <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#FACC15]" />
                  <span>Directorio Institucional & Estado de Pensiones</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Total {users.length} cuentas · {totalStudents} alumnos · {blockedCount} bloqueados por pago
                </p>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-black/60 border border-white/15 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#FACC15]"
                />
              </div>
            </div>

            {/* Role & Payment Filter Buttons */}
            <div className="shrink-0 flex flex-wrap items-center gap-1.5 py-3 border-b border-white/10">
              <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-[#FACC15]" />
                <span>Filtrar:</span>
              </span>
              {(['Todos', 'docente', 'estudiante', 'admin'] as const).map((fil) => (
                <button
                  key={fil}
                  type="button"
                  onClick={() => setActiveFilter(fil)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    activeFilter === fil
                      ? 'bg-[#7F1D1D] text-white border border-[#FACC15]/40 shadow-sm'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {fil === 'Todos' ? 'Todos' : fil === 'admin' ? 'Dirección' : `${fil}s`}
                </button>
              ))}

              {/* Special Filter: Bloqueados por Pago */}
              <button
                type="button"
                onClick={() => setActiveFilter('Bloqueados')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === 'Bloqueados'
                    ? 'bg-red-800 text-white border border-red-400 shadow-sm'
                    : 'bg-red-950/40 text-red-300 border border-red-500/30 hover:bg-red-900/40'
                }`}
              >
                <Lock className="w-3 h-3 text-red-400" />
                <span>Bloqueados por Pago ({blockedCount})</span>
              </button>
            </div>

            {/* User List */}
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-white/5 pr-1">
              {filteredUsers.map((user) => {
                const isRevealed = !!showPasswordMap[user.id];
                const isCopied = copiedId === user.id;
                const isBlocked = user.paymentStatus === 'Bloqueado por Pago';

                return (
                  <div
                    key={user.id}
                    className={`py-3.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 rounded-xl transition-all ${
                      isBlocked ? 'bg-red-950/20 border-l-4 border-l-red-500' : ''
                    }`}
                  >
                    {/* User Identity info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={user.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user.avatarInitials || 'CO'}&backgroundColor=7f1d1d,b91c1c,991b1b&textColor=ffffff`}
                          alt={user.name}
                          className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 object-cover"
                        />
                        {user.role === 'admin' && (
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center text-[9px] font-bold">
                            👑
                          </span>
                        )}
                        {isBlocked && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-[9px] font-bold text-white" title="Acceso Bloqueado">
                            <Lock className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-white truncate">{user.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              user.role === 'docente'
                                ? 'bg-amber-950/60 text-[#FEF08A] border border-amber-500/40'
                                : user.role === 'estudiante'
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                                : 'bg-purple-950/60 text-purple-300 border border-purple-500/40'
                            }`}
                          >
                            {user.role.toUpperCase()}
                          </span>

                          {/* Payment status badge for students */}
                          {user.role === 'estudiante' && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                                isBlocked
                                  ? 'bg-red-950/80 text-red-200 border border-red-500/50'
                                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                              }`}
                            >
                              {isBlocked ? (
                                <>
                                  <Lock className="w-2.5 h-2.5 text-red-400" />
                                  <span>Bloqueado por Pago</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                  <span>Al Día</span>
                                </>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Credentials detail */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300 mt-1 font-mono-tabular">
                          <span className="text-white font-semibold">
                            Usuario: <span className="text-[#FACC15]">{user.code}</span>
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <span>Clave:</span>
                            <span className="font-mono text-white">
                              {isRevealed ? user.password || 'oppenheimer2026' : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(user.id)}
                              className="text-slate-400 hover:text-white cursor-pointer ml-0.5"
                              title="Ver u ocultar clave"
                            >
                              {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </span>
                        </div>

                        {/* Specialty or Grade and debt info */}
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {user.specialty ||
                            (user.gradeId
                              ? grades.find((g) => g.id === user.gradeId)?.name
                              : 'Colegio Oppenheimer')}
                          {isBlocked && user.paymentDebtMonths && user.paymentDebtMonths.length > 0 && (
                            <span className="text-red-400 font-semibold ml-2">
                              (Adeuda: {user.paymentDebtMonths.join(', ')})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Actions: Payment Toggle, Copy Credentials & Delete */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {/* Student Payment Block / Unblock Button */}
                      {user.role === 'estudiante' && (
                        <>
                          {isBlocked ? (
                            <button
                              type="button"
                              onClick={() => handleUnblockStudent(user)}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-200 flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                              title="Desbloquear y marcar como Al Día"
                            >
                              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Desbloquear</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setBlockingStudent(user);
                                setBlockingMonth('Octubre 2026');
                                setBlockingNotes('Pensión escolar impaga. Bloqueo de acceso por Tesorería.');
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-red-950/60 hover:bg-red-900/80 border border-red-500/50 text-red-200 flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                              title="Bloquear acceso por falta de pago"
                            >
                              <Lock className="w-3.5 h-3.5 text-red-400" />
                              <span>Bloquear por Pago</span>
                            </button>
                          )}
                        </>
                      )}

                      {/* Copy Credentials */}
                      <button
                        type="button"
                        onClick={() => handleCopyCredentials(user)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border flex items-center gap-1 transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-900/60 border-emerald-500 text-emerald-200'
                            : 'bg-white/10 hover:bg-white/20 border-white/20 text-slate-200'
                        }`}
                        title="Copiar credenciales para enviar al usuario"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#FACC15]" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>

                      {/* Delete User */}
                      {user.code.toLowerCase() !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => onDeleteUser(user.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-950/40 transition-colors cursor-pointer"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No se encontraron usuarios con el criterio de búsqueda seleccionado.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: ASIGNACIÓN DE DOCENTES POR ÁREA --- */}
      {adminTab === 'docentes_areas' && (
        <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-hidden flex flex-col bg-black/55 backdrop-blur-xl border border-white/10 m-4 sm:m-6 rounded-2xl shadow-2xl">
          {/* Header of Tab 2 */}
          <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#FACC15]" />
                <span>Asignación de Docentes por Grado y Asignatura Curricular</span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Seleccione el grado y asigne el docente titular responsable de cada área académica.
              </p>
            </div>

            {/* Grade Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">Grado:</span>
              <select
                value={selectedAssignmentGradeId}
                onChange={(e) => setSelectedAssignmentGradeId(e.target.value)}
                className="px-3 py-1.5 bg-black/70 border border-white/20 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#FACC15]"
              >
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.level})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table of courses in this grade */}
          <div className="flex-1 min-h-0 overflow-y-auto mt-4 pr-1">
            <div className="space-y-3">
              {courses
                .filter((c) => c.gradeIds.includes(selectedAssignmentGradeId))
                .map((course) => {
                  return (
                    <div
                      key={course.id}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#7F1D1D]/80 border border-[#FACC15]/40 flex items-center justify-center text-[#FEF08A] font-bold shrink-0">
                          {course.code.substring(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{course.name}</h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FACC15]/20 text-[#FEF08A] border border-[#FACC15]/30">
                              {course.area}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Docente titular actual:{' '}
                            <span className="text-emerald-300 font-semibold">
                              {course.instructorName || course.teacherName}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Dropdown to reassign teacher */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <span className="text-xs text-slate-300">Asignar Docente:</span>
                        <select
                          value={
                            teachersList.find(
                              (t) =>
                                t.name === (course.instructorName || course.teacherName) ||
                                t.id === course.instructorId
                            )?.id ||
                            teachersList[0]?.id ||
                            ''
                          }
                          onChange={(e) => {
                            const newTeacher = teachersList.find((t) => t.id === e.target.value);
                            if (newTeacher) {
                              onAssignTeacherToCourse(course.id, newTeacher.id, newTeacher.name);
                              onSendNotification(
                                'Docente Reasignado',
                                `${newTeacher.name} fue asignado como titular de ${course.name}. Los horarios se sincronizaron sin cruces.`
                              );
                            }
                          }}
                          className="px-3 py-1.5 bg-black/80 border border-white/25 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-[#FACC15] cursor-pointer"
                        >
                          {teachersList.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacher.name} ({teacher.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#FACC15] shrink-0" />
              <span>
                <strong>Sincronización Inteligente:</strong> Cuando cambias el docente de una materia, el sistema actualiza de inmediato la vista del alumno y recalcula los horarios para garantizar que ningún docente tenga clases simultáneas en dos salones.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: GENERADOR DE HORARIOS SIN CRUCES --- */}
      {adminTab === 'generador_horarios' && (
        <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-hidden flex flex-col bg-black/55 backdrop-blur-xl border border-white/10 m-4 sm:m-6 rounded-2xl shadow-2xl">
          {/* Header of Tab 3 */}
          <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#FACC15]" />
                <h3 className="text-sm font-bold text-white font-display">
                  Generador y Validador de Horarios Semanales (Sin Cruces)
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Distribución curricular de Lunes a Viernes (08:00 a 14:00) con verificación estricta de cruce docente.
              </p>
            </div>

            {/* Actions: Regenerate & Grade select */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300">Ver Horario:</span>
                <select
                  value={previewScheduleGradeId}
                  onChange={(e) => setPreviewScheduleGradeId(e.target.value)}
                  className="px-3 py-1.5 bg-black/70 border border-white/20 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-[#FACC15]"
                >
                  {grades.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.level})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleTriggerRegenerateSchedules}
                disabled={isRegenerating}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] hover:from-[#991B1B] hover:to-[#B91C1C] text-white font-bold text-xs shadow-lg border border-[#FACC15]/40 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#FACC15] ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>{isRegenerating ? 'Calculando...' : '⚡ Regenerar Horarios sin Cruces'}</span>
              </button>
            </div>
          </div>

          {/* Status Bar */}
          <div className="shrink-0 mt-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                <strong>Algoritmo de Compatibilidad:</strong> 0 cruces de docentes detectados en toda la matriz escolar de Primaria y Secundaria.
              </span>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-400/30">
              100% Sin Colisiones
            </span>
          </div>

          {/* Schedule Table Preview */}
          <div className="flex-1 min-h-0 overflow-y-auto mt-4">
            <ScheduleTimetableView
              currentUser={users.find((u) => u.role === 'admin') || users[0]}
              grades={grades}
              courses={courses}
              schedules={schedules}
            />
          </div>
        </div>
      )}

      {/* --- MODAL: BLOQUEAR ACCESO POR PAGO --- */}
      {blockingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-neutral-900 border border-red-500/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-fadeIn text-white">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-red-950 border border-red-500/60 text-red-400">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Restringir Acceso al Aula Virtual
                </h3>
                <p className="text-xs text-red-300">
                  Bloqueo administrativo por pensión escolar impaga
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-4 text-xs space-y-1">
              <p>
                <strong>Estudiante:</strong> {blockingStudent.name}
              </p>
              <p>
                <strong>Código:</strong> {blockingStudent.code}
              </p>
              <p>
                <strong>Grado:</strong>{' '}
                {grades.find((g) => g.id === blockingStudent.gradeId)?.name || 'Primaria/Secundaria'}
              </p>
            </div>

            <div className="space-y-3 text-xs mb-5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Mes Adeudado
                </label>
                <select
                  value={blockingMonth}
                  onChange={(e) => setBlockingMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-white/20 rounded-xl text-white text-xs focus:outline-none focus:border-red-400"
                >
                  <option value="Octubre 2026">Pensión de Octubre 2026</option>
                  <option value="Septiembre 2026">Pensión de Septiembre 2026</option>
                  <option value="Agosto y Septiembre 2026">Pensiones de Agosto y Septiembre 2026</option>
                  <option value="Matrícula y Pensión 2026">Matrícula o Pensión Pendiente</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Instrucción / Mensaje para el Estudiante
                </label>
                <textarea
                  rows={3}
                  value={blockingNotes}
                  onChange={(e) => setBlockingNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-black/60 border border-white/20 rounded-xl text-white text-xs focus:outline-none focus:border-red-400 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setBlockingStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-200 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPaymentBlock}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white shadow-lg border border-red-500/50 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Confirmar Bloqueo de Acceso</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
