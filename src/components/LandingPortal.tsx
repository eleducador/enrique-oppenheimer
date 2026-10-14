import React, { useState } from 'react';
import {
  Lock,
  User,
  ArrowRight,
  Smartphone,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { UserRole, UserProfile } from '../types';
import { INSTITUTION_ASSETS, ADMIN_USER } from '../data/initialData';

import { authenticateUser } from '../services/dbService';

interface LandingPortalProps {
  systemUsers?: UserProfile[];
  onLogin: (role: UserRole, customCode?: string, matchedUser?: UserProfile) => void;
  onOpenMobileModal: () => void;
}

export const LandingPortal: React.FC<LandingPortalProps> = ({
  systemUsers = [ADMIN_USER],
  onLogin,
  onOpenMobileModal,
}) => {
  const [userCode, setUserCode] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [crestImgError, setCrestImgError] = useState(false);
  const [blockedStudentInfo, setBlockedStudentInfo] = useState<UserProfile | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsAuthenticating(true);

    try {
      const res = await authenticateUser(userCode, password);

      if (!res.success) {
        if (res.error === 'BLOCKED_PAYMENT' && res.user) {
          setBlockedStudentInfo(res.user);
          return;
        }
        setErrorMessage(
          res.error || 'Credenciales no válidas. Verifique su usuario y contraseña o comuníquese con Dirección.'
        );
        return;
      }

      if (res.user) {
        onLogin(res.user.role, res.user.code, res.user);
      }
    } catch {
      setErrorMessage('Error al conectar con el servidor institucional. Intente nuevamente.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col text-white bg-cover bg-center bg-no-repeat relative select-none"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(10, 8, 16, 0.35), rgba(12, 8, 18, 0.55)), url(${INSTITUTION_ASSETS.fondoPagina})`,
      }}
    >
      {/* Top Header Bar (Compact & Sleek Dark Glass with Official 44 Años Crest) */}
      <header className="shrink-0 z-30 flex items-center justify-between px-6 py-3.5 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src={crestImgError ? INSTITUTION_ASSETS.crestEmblemSvg : INSTITUTION_ASSETS.crestEmblem}
            alt="Insignia Oficial Oppenheimer"
            onError={() => {
              if (!crestImgError) setCrestImgError(true);
            }}
            className="w-12 h-12 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] transition-transform hover:scale-105"
          />
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#FEF08A] font-display leading-tight drop-shadow-md">
              Colegio Capitán Enrique Oppenheimer
            </h1>
            <p className="text-xs text-slate-300 font-medium">
              Aula Virtual & Gestión Curricular · Inicial, Primaria y Secundaria
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenMobileModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all cursor-pointer backdrop-blur-sm shadow-sm"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#FACC15]" />
          <span className="hidden sm:inline">App iOS & Android</span>
        </button>
      </header>

      {/* Main Center Area: Pure, secure login box without shortcut role switcher or exposed credentials */}
      <main className="flex-1 min-h-0 flex items-center justify-center p-4 sm:p-6 overflow-hidden relative">
        <div className="w-full max-w-sm">
          <div className="rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/20 p-8 shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-white/30">
            {/* Elegant Institutional Gold Top Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FACC15] to-transparent opacity-90" />

            {/* Official School Crest in Center of Login Box */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 mb-3 drop-shadow-[0_8px_24px_rgba(250,204,21,0.25)] transition-transform hover:scale-105">
                <img
                  src={crestImgError ? INSTITUTION_ASSETS.crestEmblemSvg : INSTITUTION_ASSETS.crestEmblem}
                  alt="Escudo Oficial Oppenheimer"
                  onError={() => {
                    if (!crestImgError) setCrestImgError(true);
                  }}
                  className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
                />
              </div>
              <h2 className="text-2xl font-bold text-white font-display tracking-tight">
                Acceso al Sistema
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Colegio Capitán Enrique Oppenheimer
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs flex items-center gap-2 animate-fadeIn shadow-lg">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Form: Cuadro de Usuario, Contraseña, and Botón de Ingresar */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Cuadro de Usuario */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={userCode}
                    onChange={(e) => {
                      setUserCode(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Ingresa tu usuario institucional"
                    className="w-full pl-10 pr-3.5 py-3 text-xs font-mono-tabular rounded-xl border border-white/25 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-[#FACC15] focus:bg-white/15 focus:ring-1 focus:ring-[#FACC15] transition-all"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Cuadro de Contraseña */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Ingresa tu contraseña"
                    className="w-full pl-10 pr-10 py-3 text-xs rounded-xl border border-white/25 bg-white/10 text-white placeholder-slate-400 focus:outline-none focus:border-[#FACC15] focus:bg-white/15 focus:ring-1 focus:ring-[#FACC15] transition-all"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1"
                    aria-label="Mostrar u ocultar contraseña"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botón de Ingresar */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] hover:from-[#991B1B] hover:to-[#B91C1C] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl border border-[#FACC15]/50 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-60"
                >
                  <span>{isAuthenticating ? 'Verificando...' : 'Ingresar'}</span>
                  <ArrowRight className="w-4 h-4 text-[#FACC15]" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Strict Minimal 1-row Dark Footer */}
      <footer className="shrink-0 z-20 px-6 py-2.5 bg-black/50 backdrop-blur-md border-t border-white/10 text-slate-400 text-[11px] flex items-center justify-between">
        <span>© 2026 Colegio Capitán Enrique Oppenheimer · Lima, Perú</span>
        <span>Inicial · Primaria · Secundaria · Control de Accesos Institucional</span>
      </footer>

      {/* Institutional Restricted Access Modal for Unpaid Tuition */}
      {blockedStudentInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-neutral-900 border border-red-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-white">
            {/* Top Red Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

            {/* Header with Crest and Lock Icon */}
            <div className="flex items-center gap-4 mb-5">
              <div className="relative shrink-0">
                <img
                  src={crestImgError ? INSTITUTION_ASSETS.crestEmblemSvg : INSTITUTION_ASSETS.crestEmblem}
                  alt="Escudo Oppenheimer"
                  className="w-14 h-14 object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-600 border-2 border-neutral-900 flex items-center justify-center text-white shadow-md">
                  <Lock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-500/50 uppercase tracking-wider">
                  Acceso Restringido · Tesorería
                </span>
                <h3 className="text-lg font-bold text-white font-display mt-0.5">
                  Suspensión por Falta de Pago
                </h3>
                <p className="text-xs text-slate-300">
                  Colegio Capitán Enrique Oppenheimer
                </p>
              </div>
            </div>

            {/* Student Details Card */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2 mb-4 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-slate-400">Estudiante:</span>
                <span className="font-bold text-white text-sm">{blockedStudentInfo.name}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-slate-400">Código de Matrícula:</span>
                <span className="font-mono text-[#FACC15] font-semibold">{blockedStudentInfo.code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Concepto Pendiente:</span>
                <span className="font-bold text-red-400">
                  {blockedStudentInfo.paymentDebtMonths && blockedStudentInfo.paymentDebtMonths.length > 0
                    ? blockedStudentInfo.paymentDebtMonths.join(', ')
                    : 'Pensión Escolar Vencida'}
                </span>
              </div>
            </div>

            {/* Explanatory notes */}
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-slate-200 leading-relaxed mb-5">
              <p className="font-semibold text-red-300 mb-1">
                Estimado(a) estudiante y padre de familia:
              </p>
              <p>
                El ingreso al Aula Virtual ha sido temporalmente restringido por registrar cuotas o pensiones escolares pendientes de regularización.
              </p>
              <div className="mt-2.5 pt-2 border-t border-red-500/20 text-[11px] text-slate-300 space-y-1">
                <p>• <strong>Presencial:</strong> Acercarse a la oficina de Tesorería del plantel de 8:00 AM a 3:00 PM.</p>
                <p>• <strong>Banca Móvil / Yape:</strong> Enviar comprobante al WhatsApp institucional o al correo <strong className="text-white">tesoreria@colegiooppenheimer.edu.pe</strong> indicando nombre y código del estudiante.</p>
                <p>• Su servicio será reactivado inmediatamente en cuanto se confirme el abono.</p>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setBlockedStudentInfo(null)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer text-center"
              >
                Entendido, Volver al Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
