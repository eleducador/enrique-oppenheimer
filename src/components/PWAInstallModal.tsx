import React, { useState } from 'react';
import { Smartphone, Check, X, Share2, Download, BellRing } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  pushPermission: NotificationPermission | 'default';
  onRequestPushPermission: () => void;
  onTriggerTestPush: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  pushPermission,
  onRequestPushPermission,
  onTriggerTestPush,
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [selectedOS, setSelectedOS] = useState<'ios' | 'android'>('android');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-xl rounded-2xl bg-black/85 backdrop-blur-2xl border border-white/20 text-slate-100 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] text-white border-b border-[#FACC15]/40">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-[#FACC15]" />
            <h3 className="text-base font-bold tracking-tight">
              App Móvil Institucional (iOS y Android) & Alertas Push
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* Push Notifications Status Block */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-[#FACC15]" />
                  Notificaciones Push en Tiempo Real
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Recibe avisos instantáneos cuando un docente publique un nuevo tema, inicie un examen sincrónico o registre la asistencia escolar.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {pushPermission === 'granted' ? (
                  <button
                    onClick={onTriggerTestPush}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap cursor-pointer shadow-md"
                  >
                    Enviar Alerta de Prueba
                  </button>
                ) : (
                  <button
                    onClick={onRequestPushPermission}
                    className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#7F1D1D] hover:bg-[#991B1B] text-white border border-[#FACC15]/40 transition-colors whitespace-nowrap cursor-pointer shadow-md"
                  >
                    Activar Notificaciones
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* OS Selector Tabs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300">
                Selecciona tu dispositivo para instalar el Aula Virtual:
              </span>
              <div className="flex items-center gap-1 p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/15">
                <button
                  onClick={() => setSelectedOS('android')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    selectedOS === 'android'
                      ? 'bg-[#7F1D1D] text-white shadow-md border border-[#FACC15]/40'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Android / Chrome
                </button>
                <button
                  onClick={() => setSelectedOS('ios')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    selectedOS === 'ios'
                      ? 'bg-[#7F1D1D] text-white shadow-md border border-[#FACC15]/40'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  iPhone / iPad (iOS)
                </button>
              </div>
            </div>

            {selectedOS === 'android' ? (
              <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h5 className="text-sm font-bold text-white">
                      Instalación Directa en Android y Escritorio
                    </h5>
                    <p className="text-xs text-slate-300 mt-1">
                      Compatible con teléfonos y tablets Android. Funciona a pantalla completa y guarda los temas curriculares para consulta rápida.
                    </p>
                  </div>
                  {isInstalled && (
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 shrink-0">
                      <Check className="w-4 h-4" /> Instalada
                    </span>
                  )}
                </div>

                {isInstallable ? (
                  <button
                    onClick={install}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] hover:from-[#991B1B] hover:to-[#B91C1C] text-white text-xs font-bold border border-[#FACC15]/40 shadow-lg transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#FACC15]" />
                    Instalar App Colegio Oppenheimer Ahora
                  </button>
                ) : (
                  <div className="text-xs text-slate-300 space-y-1.5 pt-1">
                    <p className="font-semibold text-white">Pasos rápidos en Chrome para Android:</p>
                    <p>1. Toca el menú de opciones (tres puntos arriba a la derecha en tu navegador).</p>
                    <p>2. Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.</p>
                    <p>3. Confirma para tener el ícono del Colegio Capitán Enrique Oppenheimer en tu pantalla de inicio.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
                <h5 className="text-sm font-bold text-white flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#FACC15]" />
                  Instalación en iPhone y iPad (Safari iOS)
                </h5>
                <div className="text-xs text-slate-300 space-y-2">
                  <p>
                    1. Abre esta plataforma desde el navegador <strong>Safari</strong> en tu iPhone o iPad.
                  </p>
                  <p>
                    2. Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.
                  </p>
                  <p>
                    3. Desliza hacia abajo y selecciona <strong>"Agregar a inicio" (Add to Home Screen)</strong>.
                  </p>
                  <p>
                    4. Pulsa <strong>Agregar</strong> en la esquina superior derecha para habilitar el acceso directo y las notificaciones escolares.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end pt-2 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
