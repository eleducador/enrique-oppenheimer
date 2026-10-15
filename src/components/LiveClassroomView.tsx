import React, { useState, useRef, useEffect } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Hand,
  PhoneOff,
  Users,
  MessageSquare,
  Sparkles,
  PenTool,
  Send,
  ScreenShare,
  Maximize2,
  Minimize2,
  ShieldAlert,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  CheckCircle,
  Eraser,
  Trash2,
  Radio,
  Tv,
  Layers,
  Palette,
  Check,
  Eye,
  Edit3,
} from 'lucide-react';
import katex from 'katex';
import {
  UserProfile,
  GradeLevel,
  CourseItem,
  LiveClassSession,
  LiveClassParticipant,
} from '../types';
import {
  startTeacherBroadcast,
  startStudentViewer,
  createAvatarVideoTrack,
  BroadcasterCleanup,
} from '../services/webrtcService';
import {
  updateLiveCamState,
  updateLiveBroadcastState,
  joinLiveClass,
} from '../services/dbService';

interface LiveClassroomViewProps {
  currentUser: UserProfile;
  session: LiveClassSession;
  grades: GradeLevel[];
  courses: CourseItem[];
  onStartClass: (courseId: string, gradeId: string, title: string) => void;
  onEndClass: () => void;
  onToggleHandRaise: (participantId: string) => void;
  onSendLiveChatMessage: (text: string) => void;
  onUpdateWhiteboard: (notes: string, isProjected?: boolean, drawingData?: string, activeTab?: 'notes' | 'canvas') => void;
}

export const LiveClassroomView: React.FC<LiveClassroomViewProps> = ({
  currentUser,
  session,
  grades,
  courses,
  onStartClass,
  onEndClass,
  onToggleHandRaise,
  onSendLiveChatMessage,
  onUpdateWhiteboard,
}) => {
  const isTeacherOrAdmin = currentUser.role === 'docente' || currentUser.role === 'admin';
  const myParticipant = session.participants.find((p) => p.id === currentUser.id);

  // Call Local Media & Stage State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [mobileViewTab, setMobileViewTab] = useState<'stage' | 'chat'>('stage');
  
  // Remote WebRTC Media State (for Students)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remotePipVideoRef = useRef<HTMLVideoElement>(null);
  const [webrtcStatus, setWebrtcStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed'>('idle');
  const [studentAudioMuted, setStudentAudioMuted] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const frameIntervalRef = useRef<any>(null);

  // Stage mode: 'video' or 'whiteboard'. If teacher has whiteboard projected, defaults to 'whiteboard'
  const [activeStageMode, setActiveStageMode] = useState<'video' | 'whiteboard'>(
    session.isWhiteboardProjected ? 'whiteboard' : 'video'
  );

  // Whiteboard Sub-mode: 'notes' (Fórmulas y texto estructurado) vs 'canvas' (Dibujo libre con tiza)
  const [whiteboardTab, setWhiteboardTab] = useState<'notes' | 'canvas'>(
    session.whiteboardActiveTab || 'notes'
  );
  const [whiteboardText, setWhiteboardText] = useState(session.whiteboardNotes || '');
  const [whiteboardEditorView, setWhiteboardEditorView] = useState<'split' | 'rendered' | 'edit'>('split');
  const [syncToast, setSyncToast] = useState(false);

  // Teacher projection state (Broadcasts to all students)
  const isProjected = session.isWhiteboardProjected ?? (activeStageMode === 'whiteboard');

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState<string>('#FEF08A'); // Gold chalk default
  const [brushSize, setBrushSize] = useState<number>(3);
  const [isEraser, setIsEraser] = useState(false);

  // Floating Picture-in-Picture window for teacher video
  const [showPiP, setShowPiP] = useState(true);

  // Form state to start class (if not currently live)
  const [newClassCourseId, setNewClassCourseId] = useState(courses[0]?.id || 'cur-mat');
  const [newClassGradeId, setNewClassGradeId] = useState(currentUser.gradeId || 'sec-4');
  const [newClassTitle, setNewClassTitle] = useState('Clase Magistral Interactiva: Ley de Ohm y Circuitos');
  const [chatInput, setChatInput] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const debounceTimerRef = useRef<any>(null);

  // Broadcaster & Audio/Video Track Controllers
  const broadcasterControllerRef = useRef<BroadcasterCleanup | null>(null);
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);
  const webcamTrackRef = useRef<MediaStreamTrack | null>(null);
  const avatarTrackRef = useRef<MediaStreamTrack | null>(null);
  const persistentAudioRef = useRef<HTMLAudioElement>(null);

  // 1. Auto-register current user into session.participants
  useEffect(() => {
    if (session.isLive && currentUser.id) {
      const alreadyIn = session.participants.some((p) => p.id === currentUser.id);
      if (!alreadyIn) {
        const newPart: LiveClassParticipant = {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role,
          gradeId: currentUser.gradeId,
          avatarInitials: currentUser.name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase(),
          avatarUrl: currentUser.avatarUrl,
          isMuted: true,
          isVideoOn: false,
          hasHandRaised: false,
          joinedAt: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        };
        joinLiveClass(newPart);
      }
    }
  }, [session.isLive, currentUser.id, session.participants]);

  // 2. Sync: When teacher turns on/off Whiteboard Projection or Screen Share, students automatically switch stage mode!
  useEffect(() => {
    if (!isTeacherOrAdmin) {
      if (session.isScreenSharing) {
        setActiveStageMode('video');
      } else if (session.isWhiteboardProjected !== undefined) {
        setActiveStageMode(session.isWhiteboardProjected ? 'whiteboard' : 'video');
      }
    }
  }, [session.isScreenSharing, session.isWhiteboardProjected, isTeacherOrAdmin]);

  // 3. Sync: When teacher changes whiteboard sub-tab ('notes' vs 'canvas'), students follow automatically!
  useEffect(() => {
    if (!isTeacherOrAdmin && session.whiteboardActiveTab) {
      setWhiteboardTab(session.whiteboardActiveTab);
    }
  }, [session.whiteboardActiveTab, isTeacherOrAdmin]);

  // 4. Sync: When session.whiteboardNotes updates from server, sync student view
  useEffect(() => {
    if (session.whiteboardNotes !== undefined) {
      if (!isTeacherOrAdmin || !whiteboardText) {
        setWhiteboardText(session.whiteboardNotes);
      }
    }
  }, [session.whiteboardNotes, isTeacherOrAdmin]);

  // 5. Canvas Redraw helper: redrawn on drawingData update or tab switch
  const redrawCanvas = (targetData?: string) => {
    const src = targetData || session.whiteboardDrawingData;
    if (!src || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
    };
    img.src = src;
  };

  useEffect(() => {
    redrawCanvas(session.whiteboardDrawingData);
  }, [session.whiteboardDrawingData, whiteboardTab]);

  // 6. DOCENTE: Transmitir Micrófono y Video (Cámara Real o Avatar Sintético) continuamente mientras session.isLive
  useEffect(() => {
    if (!isTeacherOrAdmin) return;

    let isCancelled = false;

    if (session.isLive) {
      const initBroadcast = async () => {
        try {
          // 1. Capturar micrófono para permitir explicaciones en vivo continuas
          let audioTrack: MediaStreamTrack | null = null;
          try {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioTrack = audioStream.getAudioTracks()[0];
            audioTrack.enabled = isMicOn;
            audioTrackRef.current = audioTrack;
          } catch (audioErr) {
            console.warn('Micrófono no concedido o no disponible:', audioErr);
          }

          if (isCancelled) {
            if (audioTrack) audioTrack.stop();
            return;
          }

          // 2. Obtener pista de video: cámara real o avatar sintético (si la cámara está apagada o proyectando pizarra)
          let videoTrack: MediaStreamTrack;
          if (isCamOn) {
            try {
              const camStream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
              });
              videoTrack = camStream.getVideoTracks()[0];
              webcamTrackRef.current = videoTrack;
            } catch (camErr) {
              console.warn('Cámara web no disponible, usando avatar representativo:', camErr);
              setIsCamOn(false);
              videoTrack = createAvatarVideoTrack(currentUser.name);
              avatarTrackRef.current = videoTrack;
            }
          } else {
            videoTrack = createAvatarVideoTrack(currentUser.name);
            avatarTrackRef.current = videoTrack;
          }

          if (isCancelled) {
            videoTrack.stop();
            if (audioTrack) audioTrack.stop();
            return;
          }

          // 3. Crear stream maestro unificado
          const tracks: MediaStreamTrack[] = [videoTrack];
          if (audioTrack) tracks.push(audioTrack);
          const masterStream = new MediaStream(tracks);
          mediaStreamRef.current = masterStream;

          // 4. Conectar previsualización local si la cámara está encendida
          if (isCamOn) {
            if (videoRef.current) {
              videoRef.current.srcObject = masterStream;
              videoRef.current.muted = true;
            }
            if (pipVideoRef.current) {
              pipVideoRef.current.srcObject = masterStream;
              pipVideoRef.current.muted = true;
            }
          }

          // 5. Iniciar broadcaster WebRTC P2P
          const controller = startTeacherBroadcast(masterStream, (count) => {
            setViewerCount(count);
          });
          broadcasterControllerRef.current = controller;

          // 6. Actualizar estado en Firestore
          await updateLiveBroadcastState(true, isMicOn, isCamOn, undefined, isScreenSharing);
          if (isCamOn) {
            await updateLiveCamState(true);
          }

          // 7. Fotogramas de respaldo si la cámara web está activa
          if (isCamOn) {
            const offCanvas = document.createElement('canvas');
            offCanvas.width = 480;
            offCanvas.height = 270;
            const offCtx = offCanvas.getContext('2d');

            if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
            frameIntervalRef.current = setInterval(() => {
              if (videoRef.current && offCtx && videoRef.current.readyState >= 2) {
                try {
                  offCtx.drawImage(videoRef.current, 0, 0, 480, 270);
                  const frameJpeg = offCanvas.toDataURL('image/jpeg', 0.5);
                  updateLiveCamState(true, frameJpeg, isScreenSharing);
                } catch {
                  // Ignore glitches
                }
              }
            }, 1500);
          }
        } catch (err) {
          console.error('Error iniciando transmisión del docente:', err);
        }
      };

      initBroadcast();
    } else {
      if (broadcasterControllerRef.current) {
        broadcasterControllerRef.current.stop();
        broadcasterControllerRef.current = null;
      }
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
      if (audioTrackRef.current) {
        audioTrackRef.current.stop();
        audioTrackRef.current = null;
      }
      if (webcamTrackRef.current) {
        webcamTrackRef.current.stop();
        webcamTrackRef.current = null;
      }
      if (avatarTrackRef.current) {
        avatarTrackRef.current.stop();
        avatarTrackRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      updateLiveBroadcastState(false, false, false, '', false);
    }

    return () => {
      isCancelled = true;
      if (broadcasterControllerRef.current) {
        broadcasterControllerRef.current.stop();
        broadcasterControllerRef.current = null;
      }
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
      if (audioTrackRef.current) {
        audioTrackRef.current.stop();
        audioTrackRef.current = null;
      }
      if (webcamTrackRef.current) {
        webcamTrackRef.current.stop();
        webcamTrackRef.current = null;
      }
      if (avatarTrackRef.current) {
        avatarTrackRef.current.stop();
        avatarTrackRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [session.isLive, isTeacherOrAdmin]);

  // Alternar micrófono en caliente (Hardware Track Level + Firestore)
  const handleToggleMic = async () => {
    const nextMicState = !isMicOn;
    setIsMicOn(nextMicState);

    if (audioTrackRef.current) {
      audioTrackRef.current.enabled = nextMicState;
    } else if (nextMicState && isTeacherOrAdmin && session.isLive) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newAudioTrack = audioStream.getAudioTracks()[0];
        newAudioTrack.enabled = true;
        audioTrackRef.current = newAudioTrack;
        if (mediaStreamRef.current) {
          mediaStreamRef.current.addTrack(newAudioTrack);
        }
        if (broadcasterControllerRef.current) {
          await broadcasterControllerRef.current.replaceTrack(newAudioTrack);
        }
      } catch (err) {
        console.warn('No se pudo activar el micrófono:', err);
      }
    }

    if (isTeacherOrAdmin && session.isLive) {
      await updateLiveBroadcastState(true, nextMicState, isCamOn, undefined, isScreenSharing);
    }
  };

  // Alternar cámara web en caliente (Intercambio fluido de pistas WebRTC sin reiniciar llamada)
  const handleToggleCam = async () => {
    if (!isTeacherOrAdmin) return;
    const nextCamState = !isCamOn;
    setIsCamOn(nextCamState);

    if (nextCamState) {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        });
        const newWebcamTrack = camStream.getVideoTracks()[0];
        if (webcamTrackRef.current) {
          webcamTrackRef.current.stop();
        }
        webcamTrackRef.current = newWebcamTrack;

        if (avatarTrackRef.current) {
          avatarTrackRef.current.stop();
          avatarTrackRef.current = null;
        }

        if (broadcasterControllerRef.current) {
          await broadcasterControllerRef.current.replaceTrack(newWebcamTrack);
        }

        const previewStream = new MediaStream([newWebcamTrack]);
        if (videoRef.current) {
          videoRef.current.srcObject = previewStream;
          videoRef.current.muted = true;
        }
        if (pipVideoRef.current) {
          pipVideoRef.current.srcObject = previewStream;
          pipVideoRef.current.muted = true;
        }

        await updateLiveBroadcastState(true, isMicOn, true, undefined, isScreenSharing);
        await updateLiveCamState(true);

        const offCanvas = document.createElement('canvas');
        offCanvas.width = 480;
        offCanvas.height = 270;
        const offCtx = offCanvas.getContext('2d');
        if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = setInterval(() => {
          if (videoRef.current && offCtx && videoRef.current.readyState >= 2) {
            try {
              offCtx.drawImage(videoRef.current, 0, 0, 480, 270);
              const frameJpeg = offCanvas.toDataURL('image/jpeg', 0.5);
              updateLiveCamState(true, frameJpeg, isScreenSharing);
            } catch {}
          }
        }, 1500);
      } catch (err) {
        console.warn('Permiso de cámara no concedido:', err);
        setIsCamOn(false);
      }
    } else {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
      if (webcamTrackRef.current) {
        webcamTrackRef.current.stop();
        webcamTrackRef.current = null;
      }
      const avatarTrack = createAvatarVideoTrack(currentUser.name);
      avatarTrackRef.current = avatarTrack;

      if (broadcasterControllerRef.current) {
        await broadcasterControllerRef.current.replaceTrack(avatarTrack);
      }

      if (videoRef.current) videoRef.current.srcObject = null;
      if (pipVideoRef.current) pipVideoRef.current.srcObject = null;

      await updateLiveBroadcastState(true, isMicOn, false, '', isScreenSharing);
      await updateLiveCamState(false, '', isScreenSharing);
    }
  };

  // 7. ESTUDIANTE: Recibir señal WebRTC continua de audio y video de la maestra mientras session.isLive
  useEffect(() => {
    if (isTeacherOrAdmin) return;

    let stopViewerFn: (() => void) | null = null;

    if (session.isLive) {
      setWebrtcStatus('connecting');
      stopViewerFn = startStudentViewer(
        currentUser.id,
        currentUser.name,
        (stream) => {
          setRemoteStream(stream);
          setWebrtcStatus('connected');

          // Audio continuo garantizado a través de persistentAudioRef
          if (persistentAudioRef.current) {
            persistentAudioRef.current.srcObject = stream;
            persistentAudioRef.current.play().catch((err) => {
              console.warn('Reproducción de audio bloqueada hasta interacción del alumno:', err);
            });
          }

          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
            remoteVideoRef.current.play().catch(() => {});
          }
          if (remotePipVideoRef.current) {
            remotePipVideoRef.current.srcObject = stream;
            remotePipVideoRef.current.play().catch(() => {});
          }
        },
        (status) => {
          setWebrtcStatus(status);
        }
      );
    } else {
      if (stopViewerFn) stopViewerFn();
      setRemoteStream(null);
      setWebrtcStatus('idle');
      if (persistentAudioRef.current) {
        persistentAudioRef.current.srcObject = null;
      }
    }

    return () => {
      if (stopViewerFn) stopViewerFn();
    };
  }, [session.isLive, currentUser.id, currentUser.name, isTeacherOrAdmin]);

  // Mantener las etiquetas de audio y video del alumno sincronizadas al cambiar de vista
  useEffect(() => {
    if (remoteStream) {
      if (persistentAudioRef.current && persistentAudioRef.current.srcObject !== remoteStream) {
        persistentAudioRef.current.srcObject = remoteStream;
        persistentAudioRef.current.play().catch(() => {});
      }
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(() => {});
      }
      if (remotePipVideoRef.current && remotePipVideoRef.current.srcObject !== remoteStream) {
        remotePipVideoRef.current.srcObject = remoteStream;
        remotePipVideoRef.current.play().catch(() => {});
      }
    }
  }, [remoteStream, activeStageMode, showPiP]);

  // Compartir pantalla para docentes
  const handleToggleScreenShare = async () => {
    if (!isTeacherOrAdmin) return;
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            displaySurface: 'monitor',
          } as any,
          audio: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        if (webcamTrackRef.current) {
          webcamTrackRef.current.stop();
        }
        webcamTrackRef.current = screenTrack;

        if (avatarTrackRef.current) {
          avatarTrackRef.current.stop();
          avatarTrackRef.current = null;
        }

        if (broadcasterControllerRef.current) {
          await broadcasterControllerRef.current.replaceTrack(screenTrack);
        }

        const previewStream = new MediaStream([screenTrack]);
        if (videoRef.current) {
          videoRef.current.srcObject = previewStream;
          videoRef.current.muted = true;
        }
        if (pipVideoRef.current) {
          pipVideoRef.current.srcObject = previewStream;
          pipVideoRef.current.muted = true;
        }

        setIsCamOn(true);
        setIsScreenSharing(true);
        setActiveStageMode('video');
        handleForceProject(false);

        await updateLiveCamState(true, undefined, true);
        await updateLiveBroadcastState(true, isMicOn, true, undefined, true);

        screenTrack.onended = async () => {
          setIsScreenSharing(false);
          setIsCamOn(false);
          if (webcamTrackRef.current) {
            webcamTrackRef.current.stop();
            webcamTrackRef.current = null;
          }
          const avatarTrack = createAvatarVideoTrack(currentUser.name);
          avatarTrackRef.current = avatarTrack;
          if (broadcasterControllerRef.current) {
            await broadcasterControllerRef.current.replaceTrack(avatarTrack);
          }
          if (videoRef.current) videoRef.current.srcObject = null;
          if (pipVideoRef.current) pipVideoRef.current.srcObject = null;
          await updateLiveCamState(false, '', false);
          await updateLiveBroadcastState(true, isMicOn, false, '', false);
        };
      } catch (err) {
        console.warn('Pantalla cancelada por usuario:', err);
      }
    } else {
      setIsScreenSharing(false);
      setIsCamOn(false);
      if (webcamTrackRef.current) {
        webcamTrackRef.current.stop();
        webcamTrackRef.current = null;
      }
      const avatarTrack = createAvatarVideoTrack(currentUser.name);
      avatarTrackRef.current = avatarTrack;
      if (broadcasterControllerRef.current) {
        await broadcasterControllerRef.current.replaceTrack(avatarTrack);
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      if (pipVideoRef.current) pipVideoRef.current.srcObject = null;
      await updateLiveCamState(false, '', false);
      await updateLiveBroadcastState(true, isMicOn, false, '', false);
    }
  };

  // Debounced auto-sync when teacher types in whiteboard notes
  const handleWhiteboardChange = (newVal: string) => {
    setWhiteboardText(newVal);
    if (!isTeacherOrAdmin) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onUpdateWhiteboard(newVal, isProjected, session.whiteboardDrawingData, whiteboardTab);
    }, 400);
  };

  // Alternar sub-pestaña de pizarra (Fórmulas vs Lienzo)
  const handleSwitchWhiteboardTab = (tab: 'notes' | 'canvas') => {
    setWhiteboardTab(tab);
    if (isTeacherOrAdmin) {
      onUpdateWhiteboard(whiteboardText, isProjected, session.whiteboardDrawingData, tab);
    }
  };

  // Botón de proyección explícita de pizarra a todos los alumnos
  const handleForceProject = (projectValue: boolean) => {
    onUpdateWhiteboard(whiteboardText, projectValue, session.whiteboardDrawingData, whiteboardTab);
    setSyncToast(true);
    setTimeout(() => setSyncToast(false), 2000);
  };

  const handleStartClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassTitle.trim()) return;
    onStartClass(newClassCourseId, newClassGradeId, newClassTitle.trim());
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendLiveChatMessage(chatInput.trim());
    setChatInput('');
  };

  // --- CANVAS DRAWING METHODS (COMPRIMIDOS EN TIEMPO REAL) ---
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isTeacherOrAdmin) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = isEraser ? '#0A0E1A' : brushColor;
    ctx.lineWidth = isEraser ? brushSize * 4 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isTeacherOrAdmin) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (!isTeacherOrAdmin) return;

    const canvas = canvasRef.current;
    if (canvas) {
      // Usar compresión JPEG para sincronización ultrarrápida sin sobrepasar límites de Firestore
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      onUpdateWhiteboard(whiteboardText, isProjected, dataUrl, whiteboardTab);
    }
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onUpdateWhiteboard(whiteboardText, isProjected, '', whiteboardTab);
      }
    }
  };

  // Helper to render Markdown + KaTeX safely
  const renderWhiteboardContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Check for headings
      const isHeader = line.startsWith('## ') || line.startsWith('⚡ ') || line.startsWith('LEYES ');
      
      // Split by math delimiters $...$
      const parts = line.split(/(\$[^\$\n]+?\$)/g);

      return (
        <div key={idx} className={`min-h-[1.4rem] ${isHeader ? 'text-amber-300 font-bold text-base mt-2 pb-1 border-b border-white/10' : 'text-slate-100'}`}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
              try {
                const mathHtml = katex.renderToString(part.slice(1, -1), {
                  displayMode: false,
                  throwOnError: false,
                  strict: false,
                });
                return (
                  <span
                    key={pIdx}
                    className="inline-math px-1 py-0.5 text-[#FEF08A] font-bold"
                    dangerouslySetInnerHTML={{ __html: mathHtml }}
                  />
                );
              } catch {
                return <span key={pIdx} className="text-[#FEF08A]">{part}</span>;
              }
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </div>
      );
    });
  };

  const raisedHandsCount = session.participants.filter((p) => p.hasHandRaised).length;

  return (
    <div className="h-full min-h-[520px] max-h-[calc(100dvh-4rem)] sm:h-[calc(100vh-5.5rem)] rounded-2xl sm:rounded-3xl bg-black/85 backdrop-blur-2xl border border-white/15 shadow-2xl flex flex-col overflow-hidden text-slate-100">
      {/* Reproductor de audio continuo para alumnos: voz en vivo ininterrumpida de la maestra */}
      {!isTeacherOrAdmin && (
        <audio
          ref={persistentAudioRef}
          autoPlay
          playsInline
          muted={studentAudioMuted}
          className="hidden"
        />
      )}

      {/* Top Session Header Bar */}
      <div className="h-14 px-4 sm:px-6 border-b border-white/10 flex items-center justify-between bg-black/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                session.isLive ? 'bg-red-500 animate-ping' : 'bg-slate-500'
              }`}
            />
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                session.isLive
                  ? 'bg-red-600/80 border border-red-400 text-white shadow-lg'
                  : 'bg-white/10 border border-white/20 text-slate-300'
              }`}
            >
              {session.isLive ? '🔴 EN VIVO' : 'EN ESPERA'}
            </span>
          </div>

          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-white truncate font-display">
              {session.isLive ? session.title : 'Aula Virtual en Vivo Oppenheimer'}
            </h3>
            <p className="text-[10px] text-slate-300 truncate">
              {session.courseName} · {session.gradeName} · {session.teacherName}
            </p>
          </div>
        </div>

        {session.isLive && (
          <div className="flex items-center gap-2 shrink-0">
            {/* Status Indicator for Screen Sharing */}
            {(session.isScreenSharing || isScreenSharing) && (
              <span className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-950/90 border border-purple-400/80 text-purple-200 text-xs font-bold shadow-lg animate-pulse">
                <ScreenShare className="w-3.5 h-3.5 text-purple-300" />
                <span>Pantalla en Vivo</span>
              </span>
            )}

            {/* Status Indicator for projection */}
            {session.isWhiteboardProjected && !session.isScreenSharing && !isScreenSharing && (
              <span className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-950/80 border border-amber-400/60 text-[#FEF08A] text-xs font-bold animate-pulse">
                <Tv className="w-3.5 h-3.5 text-[#FACC15]" />
                <span>Pizarra Proyectada</span>
              </span>
            )}

            {/* Stage mode switcher (Video vs Pizarra) */}
            <div className="flex bg-white/10 p-0.5 rounded-xl border border-white/15 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveStageMode('video');
                  if (isTeacherOrAdmin) {
                    handleForceProject(false);
                  }
                }}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeStageMode === 'video'
                    ? 'bg-[#7F1D1D] text-white shadow-md border border-[#FACC15]/40'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {session.isScreenSharing || isScreenSharing ? (
                  <ScreenShare className="w-3.5 h-3.5 text-purple-300" />
                ) : (
                  <Video className="w-3.5 h-3.5 text-[#FACC15]" />
                )}
                <span className="hidden sm:inline">
                  {session.isScreenSharing || isScreenSharing ? 'Pantalla' : 'Cámara'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveStageMode('whiteboard');
                  if (isTeacherOrAdmin) {
                    handleForceProject(true);
                  }
                }}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeStageMode === 'whiteboard'
                    ? 'bg-[#7F1D1D] text-white shadow-md border border-[#FACC15]/40'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <PenTool className="w-3.5 h-3.5 text-[#FEF08A]" />
                <span className="hidden sm:inline">Pizarra Digital</span>
                <span className="sm:hidden">Pizarra</span>
              </button>
            </div>

            {/* Selector móvil rápido entre Clase (Pantalla completa) y Chat */}
            <div className="flex lg:hidden bg-white/10 p-0.5 rounded-xl border border-white/15 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setMobileViewTab('stage')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  mobileViewTab === 'stage'
                    ? 'bg-[#7F1D1D] text-white shadow border border-[#FACC15]/40'
                    : 'text-slate-300'
                }`}
                title="Ver Clase en Vivo a Pantalla Completa"
              >
                <Tv className="w-3.5 h-3.5 text-[#FACC15]" />
                <span className="text-[11px]">Clase</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileViewTab('chat')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all relative ${
                  mobileViewTab === 'chat'
                    ? 'bg-[#7F1D1D] text-white shadow border border-[#FACC15]/40'
                    : 'text-slate-300'
                }`}
                title="Ver Chat en Vivo"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#FACC15]" />
                <span className="text-[11px]">Chat</span>
                {session.chatMessages.length > 0 && (
                  <span className="px-1 py-0.2 rounded-full text-[9px] bg-amber-500 text-slate-950 font-bold">
                    {session.chatMessages.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {!session.isLive ? (
        /* Standby / Not Live Screen */
        <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
          {isTeacherOrAdmin ? (
            /* Teacher Control to Launch Class */
            <div className="max-w-md w-full rounded-3xl bg-black/60 backdrop-blur-2xl border-2 border-[#FACC15]/50 p-6 sm:p-8 shadow-2xl text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#7F1D1D] to-[#991B1B] border-2 border-[#FACC15]/60 flex items-center justify-center mx-auto shadow-2xl">
                <Video className="w-8 h-8 text-[#FACC15]" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-white font-display">
                  Iniciar Clase en Vivo
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Conéctate en directo con todos los estudiantes del grado. Podrás transmitir video, usar la pizarra digital y responder consultas en tiempo real.
                </p>
              </div>

              <form onSubmit={handleStartClassSubmit} className="space-y-3.5 text-left text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Título o Tema de la Clase:
                  </label>
                  <input
                    type="text"
                    value={newClassTitle}
                    onChange={(e) => setNewClassTitle(e.target.value)}
                    placeholder="Ej. Leyes de Exponentes y Ecuaciones Exponenciales"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/20 text-white focus:outline-none focus:border-[#FACC15]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Curso:
                    </label>
                    <select
                      value={newClassCourseId}
                      onChange={(e) => setNewClassCourseId(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-white/20 text-white text-xs focus:outline-none focus:border-[#FACC15]"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Grado Destino:
                    </label>
                    <select
                      value={newClassGradeId}
                      onChange={(e) => setNewClassGradeId(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-white/20 text-white text-xs focus:outline-none focus:border-[#FACC15]"
                    >
                      {grades.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold text-xs border border-[#FACC15]/60 shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <Play className="w-4 h-4 text-[#FACC15] fill-[#FACC15]" />
                  <span>Iniciar Transmisión para el Salón</span>
                </button>
              </form>
            </div>
          ) : (
            /* Student Waiting Room */
            <div className="max-w-md w-full rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/20 p-8 shadow-2xl text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-slate-800 border-2 border-white/20 flex items-center justify-center mx-auto shadow-xl">
                <VideoOff className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white font-display">
                  Sala de Espera de Clase
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Tu maestro(a) aún no ha iniciado la videollamada para este periodo. En cuanto inicie la sesión, la transmisión comenzará automáticamente.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-[#FEF08A] flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FACC15]" />
                <span>Revisa tu Horario Escolar para conocer tus horas de clase</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Active Live Class Workspace */
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Main Stage (70% on Desktop) */}
          <div className={`flex-1 flex flex-col min-w-0 bg-slate-950/80 p-2 sm:p-4 space-y-2 sm:space-y-3 relative overflow-hidden ${mobileViewTab === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
            {activeStageMode === 'video' ? (
              /* Main Video Stage - PERFECTAMENTE CENTRADO EN PC, TABLETS Y MÓVILES */
              <div className="flex-1 rounded-2xl overflow-hidden bg-black border border-white/20 relative flex items-center justify-center shadow-inner w-full min-h-0">
                {isTeacherOrAdmin ? (
                  /* Teacher local view */
                  isCamOn ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full max-h-full max-w-full object-contain mx-auto my-auto rounded-xl sm:rounded-2xl"
                      />
                      {isScreenSharing && (
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-purple-600/90 text-white text-[11px] sm:text-xs font-bold flex items-center gap-1.5 shadow-lg">
                          <ScreenShare className="w-3.5 h-3.5" />
                          <span>Compartiendo Pantalla</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center space-y-4 p-6 mx-auto my-auto">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#7F1D1D] to-[#991B1B] border-4 border-[#FACC15] flex items-center justify-center mx-auto shadow-2xl text-2xl sm:text-3xl font-black text-[#FEF08A]">
                        {currentUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-white font-display">
                          {currentUser.name}
                        </h4>
                        <p className="text-xs text-[#FEF08A] font-medium">
                          Tu cámara está apagada. Haz clic en el botón de cámara abajo para transmitir en vivo.
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  /* Student remote view */
                  session.isCamActive ? (
                    remoteStream ? (
                      <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
                        <video
                          ref={remoteVideoRef}
                          autoPlay
                          playsInline
                          muted={studentAudioMuted}
                          className="w-full h-full max-h-full max-w-full object-contain mx-auto my-auto rounded-xl sm:rounded-2xl"
                        />
                        {/* Indicador de pantalla compartida del docente */}
                        {session.isScreenSharing && (
                          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-purple-700/95 text-white text-[11px] sm:text-xs font-bold flex items-center gap-1.5 sm:gap-2 shadow-2xl border border-purple-300 animate-pulse">
                            <ScreenShare className="w-3.5 h-3.5 text-purple-200" />
                            <span>Docente Compartiendo Pantalla</span>
                          </div>
                        )}
                        {/* Audio control badge */}
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setStudentAudioMuted(!studentAudioMuted)}
                            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md cursor-pointer transition-all ${
                              studentAudioMuted
                                ? 'bg-red-600/90 text-white border border-red-400'
                                : 'bg-black/70 text-emerald-300 border border-emerald-400/40'
                            }`}
                            title={studentAudioMuted ? 'Activar sonido de la maestra' : 'Silenciar sonido'}
                          >
                            {studentAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                            <span>{studentAudioMuted ? 'Silenciado' : 'Audio en Vivo'}</span>
                          </button>
                        </div>
                      </div>
                    ) : session.teacherLiveFrame ? (
                      <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
                        <img
                          src={session.teacherLiveFrame}
                          alt="Transmisión en Vivo"
                          className="w-full h-full max-h-full max-w-full object-contain mx-auto my-auto rounded-xl sm:rounded-2xl"
                        />
                        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 py-1 sm:px-3 sm:py-1 rounded-xl bg-red-600/90 text-white text-[11px] sm:text-xs font-bold flex items-center gap-1.5 shadow-lg">
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                          <span>🔴 En Directo · Docente Transmitiendo</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-4 p-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#7F1D1D] to-[#991B1B] border-4 border-[#FACC15] flex items-center justify-center mx-auto shadow-2xl text-3xl font-black text-[#FEF08A] animate-pulse">
                          {session.teacherName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white font-display">
                            {session.teacherName}
                          </h4>
                          <p className="text-xs text-[#FEF08A] font-medium flex items-center justify-center gap-1.5">
                            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                            <span>Sintonizando transmisión en vivo de la maestra...</span>
                          </p>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-center space-y-4 p-6">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#7F1D1D] to-[#991B1B] border-4 border-[#FACC15] flex items-center justify-center mx-auto shadow-2xl text-3xl font-black text-[#FEF08A]">
                        {session.teacherName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white font-display">
                          {session.teacherName}
                        </h4>
                        <p className="text-xs text-slate-300 font-medium">
                          Docente Titular · Cámara apagada / Clase en curso
                        </p>
                        {session.isWhiteboardProjected && (
                          <button
                            type="button"
                            onClick={() => setActiveStageMode('whiteboard')}
                            className="mt-3 px-4 py-1.5 rounded-xl bg-[#7F1D1D] hover:bg-[#991B1B] border border-[#FACC15] text-[#FEF08A] text-xs font-bold inline-flex items-center gap-1.5 shadow-lg cursor-pointer"
                          >
                            <PenTool className="w-3.5 h-3.5" />
                            <span>Ver Pizarra Proyectada</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                )}

                {/* Overlaid Live Badges */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/20 text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{session.isCamActive || isCamOn ? '🔴 Señal HD en Vivo' : 'En Directo'}</span>
                  </div>
                  {isTeacherOrAdmin && viewerCount > 0 && (
                    <div className="px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-400/50 text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>{viewerCount} conectados a tu cámara</span>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-[#FACC15]/60 text-xs font-bold text-[#FEF08A]">
                  {session.title}
                </div>
              </div>
            ) : (
              /* High-Tech Interactive Digital Whiteboard Stage */
              <div className="flex-1 rounded-2xl overflow-hidden bg-[#0A0E1A] border-2 border-[#FACC15]/60 p-3 sm:p-4 flex flex-col justify-between shadow-2xl relative">
                {/* Top Blackboard Control Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/10 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-[#7F1D1D] text-[#FEF08A] border border-[#FACC15]/40">
                      <PenTool className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-[#FEF08A] uppercase tracking-wider flex items-center gap-2">
                        <span>Pizarra Digital Oppenheimer</span>
                        {session.isWhiteboardProjected && (
                          <span className="px-2 py-0.2 rounded-full text-[9px] bg-red-600 text-white font-extrabold uppercase animate-pulse">
                            En Pantalla
                          </span>
                        )}
                      </h4>
                    </div>

                    {/* Badge de micrófono / voz en vivo del docente explicando la pizarra */}
                    {(isTeacherOrAdmin ? isMicOn : session.isMicActive !== false) ? (
                      <div className="ml-2 px-2.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-400/60 text-emerald-200 text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <Mic className="w-3 h-3 text-emerald-400" />
                        <span className="hidden sm:inline">Docente Explicando en Vivo</span>
                        <span className="sm:hidden">En Vivo</span>
                      </div>
                    ) : (
                      <div className="ml-2 px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-500/50 text-red-300 text-[11px] font-bold flex items-center gap-1.5">
                        <MicOff className="w-3 h-3 text-red-400" />
                        <span className="hidden sm:inline">Micrófono en Pausa</span>
                      </div>
                    )}
                  </div>

                  {/* Sub-modes: Notes vs Canvas */}
                  <div className="flex items-center gap-2">
                    <div className="flex bg-white/10 p-0.5 rounded-xl border border-white/15 text-xs">
                      <button
                        type="button"
                        onClick={() => handleSwitchWhiteboardTab('notes')}
                        className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          whiteboardTab === 'notes'
                            ? 'bg-[#7F1D1D] text-white border border-[#FACC15]/40 shadow-sm'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <Edit3 className="w-3 h-3 text-[#FACC15]" />
                        <span>Fórmulas & Apuntes</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSwitchWhiteboardTab('canvas')}
                        className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                          whiteboardTab === 'canvas'
                            ? 'bg-[#7F1D1D] text-white border border-[#FACC15]/40 shadow-sm'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <Palette className="w-3 h-3 text-[#FEF08A]" />
                        <span>Lienzo con Tizas</span>
                      </button>
                    </div>

                    {/* Teacher Action: Broadcast / Project to all students toggle */}
                    {isTeacherOrAdmin && (
                      <button
                        type="button"
                        onClick={() => handleForceProject(!session.isWhiteboardProjected)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md border ${
                          session.isWhiteboardProjected
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-400'
                            : 'bg-amber-600 hover:bg-amber-700 text-slate-950 border-amber-300'
                        }`}
                        title="Transmitir pizarra a las pantallas de todos los alumnos"
                      >
                        <Tv className="w-3.5 h-3.5" />
                        <span>{session.isWhiteboardProjected ? 'Proyectando a Todos ✓' : 'Proyectar al Salón'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Toast feedback when teacher projects */}
                {syncToast && (
                  <div className="absolute top-14 right-6 z-30 px-3 py-1.5 rounded-xl bg-emerald-900 border border-emerald-400 text-emerald-100 text-xs font-bold shadow-xl animate-fadeIn flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-300" />
                    <span>¡Pizarra sincronizada en tiempo real con todos los alumnos!</span>
                  </div>
                )}

                {/* Sub-mode 1: Mathematical Notes with Live KaTeX Rendering */}
                {whiteboardTab === 'notes' && (
                  <div className="flex-1 min-h-0 flex flex-col my-2 overflow-hidden">
                    {/* Teacher Quick-Insert Equation Bar */}
                    {isTeacherOrAdmin && (
                      <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-white/10 text-[11px]">
                        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mr-1">
                          Insertar:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newText = whiteboardText + '\n\n⚡ LEY DE OHM:\n$V = I \\cdot R$\n$I = \\frac{V}{R} \\quad \\text{y} \\quad R = \\frac{V}{I}$\nDonde: $V$ = Voltaje (V), $I$ = Corriente (A), $R$ = Resistencia (\\Omega).';
                            handleWhiteboardChange(newText);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#FEF08A] font-semibold border border-white/10 cursor-pointer whitespace-nowrap"
                        >
                          + Ley de Ohm
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newText = whiteboardText + '\n\n📐 FÓRMULA GENERAL CUADRÁTICA:\n$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$';
                            handleWhiteboardChange(newText);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-300 font-semibold border border-white/10 cursor-pointer whitespace-nowrap"
                        >
                          + Ecuación Cuadrática
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newText = whiteboardText + '\n\n🔺 TEOREMA DE PITÁGORAS:\n$c^2 = a^2 + b^2 \\implies c = \\sqrt{a^2 + b^2}$';
                            handleWhiteboardChange(newText);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-cyan-300 font-semibold border border-white/10 cursor-pointer whitespace-nowrap"
                        >
                          + Pitágoras
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newText = whiteboardText + '\n\n🚀 MRUV (Física):\n$v_f = v_0 + a \\cdot t$\n$d = v_0 \\cdot t + \\frac{1}{2} a \\cdot t^2$';
                            handleWhiteboardChange(newText);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-purple-300 font-semibold border border-white/10 cursor-pointer whitespace-nowrap"
                        >
                          + Cinemática MRUV
                        </button>
                      </div>
                    )}

                    {/* Viewport for Notes: Split View on Teacher / Full Chalkboard on Student */}
                    <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-3 pt-2 overflow-hidden">
                      {/* Teacher Live Editor Box */}
                      {isTeacherOrAdmin && (
                        <div className="flex-1 min-h-0 flex flex-col bg-black/40 border border-white/10 rounded-xl p-3 overflow-hidden">
                          <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                              Editor de Texto y KaTeX (Escribe aquí)
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono">
                              Auto-sincronizando ✓
                            </span>
                          </div>
                          <textarea
                            value={whiteboardText}
                            onChange={(e) => handleWhiteboardChange(e.target.value)}
                            placeholder="Escribe apuntes, teoremas y fórmulas matemáticas con $formula$..."
                            className="flex-1 w-full bg-transparent p-1 text-xs text-white font-mono leading-relaxed resize-none focus:outline-none"
                          />
                        </div>
                      )}

                      {/* Rendered Educational Chalkboard Screen (What students see projected) */}
                      <div className="flex-1 min-h-0 bg-[#070b14] border-2 border-emerald-500/40 rounded-xl p-4 overflow-y-auto shadow-inner relative font-sans leading-relaxed">
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[9px] text-[#FEF08A] font-bold uppercase tracking-wider">
                          Pizarra en Alta Definición
                        </div>
                        <div className="space-y-1.5 text-xs sm:text-sm">
                          {renderWhiteboardContent(whiteboardText)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-mode 2: Interactive Chalk Drawing Canvas */}
                {whiteboardTab === 'canvas' && (
                  <div className="flex-1 min-h-0 flex flex-col my-2 overflow-hidden relative">
                    {/* Teacher Chalk Controls Toolbar */}
                    {isTeacherOrAdmin && (
                      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-[10px] font-bold uppercase">Color de Tiza:</span>
                          <div className="flex items-center gap-1">
                            {[
                              { label: 'Blanco', color: '#FFFFFF' },
                              { label: 'Oro', color: '#FACC15' },
                              { label: 'Verde', color: '#4ADE80' },
                              { label: 'Celeste', color: '#38BDF8' },
                              { label: 'Rojo', color: '#F87171' },
                            ].map((c) => (
                              <button
                                key={c.color}
                                type="button"
                                onClick={() => {
                                  setBrushColor(c.color);
                                  setIsEraser(false);
                                }}
                                style={{ backgroundColor: c.color }}
                                className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                                  !isEraser && brushColor === c.color ? 'scale-125 border-white shadow-lg' : 'border-transparent opacity-80'
                                }`}
                                title={c.label}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Eraser */}
                          <button
                            type="button"
                            onClick={() => setIsEraser(!isEraser)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                              isEraser ? 'bg-amber-600 text-slate-950 shadow-md' : 'bg-white/10 text-slate-300 hover:text-white'
                            }`}
                          >
                            <Eraser className="w-3.5 h-3.5" />
                            <span>Borrador</span>
                          </button>

                          {/* Clear Canvas */}
                          <button
                            type="button"
                            onClick={handleClearCanvas}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-200 flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Limpiar Pizarra</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Canvas Stage */}
                    <div className="flex-1 min-h-0 bg-[#0A0E1A] rounded-xl border border-white/20 mt-2 relative overflow-hidden flex items-center justify-center">
                      <canvas
                        ref={canvasRef}
                        width={1280}
                        height={720}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className={`w-full h-full object-contain ${isTeacherOrAdmin ? 'cursor-crosshair' : 'cursor-default'}`}
                      />
                      {!isTeacherOrAdmin && !session.whiteboardDrawingData && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
                          La maestra aún no ha dibujado trazos en este lienzo.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Floating Picture-in-Picture (PiP) Window for Teacher Video while Whiteboard is Projected */}
                {showPiP && (
                  <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 w-32 sm:w-44 md:w-56 rounded-xl sm:rounded-2xl bg-black/90 border-2 border-[#FACC15]/60 shadow-2xl overflow-hidden animate-slideIn">
                    <div className="h-6 px-2 sm:px-2.5 bg-black/80 flex items-center justify-between border-b border-white/15 text-[10px] text-white">
                      <div className="flex items-center gap-1 sm:gap-1.5 truncate">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span className="font-bold truncate text-[9px] sm:text-[10px]">{session.teacherName.split(' ')[0]}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPiP(false)}
                        className="text-slate-400 hover:text-white cursor-pointer ml-1"
                        title="Ocultar miniatura"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="h-20 sm:h-28 md:h-32 bg-slate-900 flex items-center justify-center relative">
                      {isTeacherOrAdmin ? (
                        isCamOn ? (
                          <video
                            ref={pipVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-contain mx-auto my-auto"
                          />
                        ) : (
                          <div className="text-center p-1 sm:p-2">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#7F1D1D] border-2 border-[#FACC15] flex items-center justify-center mx-auto text-xs sm:text-sm font-bold text-[#FEF08A]">
                              {currentUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                            </div>
                            <p className="text-[9px] sm:text-[10px] text-[#FEF08A] font-semibold mt-0.5 truncate">
                              {currentUser.name.split(' ')[0]}
                            </p>
                          </div>
                        )
                      ) : (
                        session.isCamActive ? (
                          remoteStream ? (
                            <video
                              ref={remotePipVideoRef}
                              autoPlay
                              playsInline
                              muted={studentAudioMuted}
                              className="w-full h-full object-contain mx-auto my-auto"
                            />
                          ) : session.teacherLiveFrame ? (
                            <img
                              src={session.teacherLiveFrame}
                              alt="Miniatura Docente"
                              className="w-full h-full object-contain mx-auto my-auto"
                            />
                          ) : (
                            <div className="text-center p-2">
                              <div className="w-10 h-10 rounded-full bg-[#7F1D1D] border-2 border-[#FACC15] flex items-center justify-center mx-auto text-sm font-bold text-[#FEF08A] animate-pulse">
                                {session.teacherName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                              </div>
                              <p className="text-[10px] text-[#FEF08A] font-semibold mt-1">
                                {session.teacherName}
                              </p>
                            </div>
                          )
                        ) : (
                          <div className="text-center p-2">
                            <div className="w-10 h-10 rounded-full bg-[#7F1D1D] border-2 border-[#FACC15] flex items-center justify-center mx-auto text-sm font-bold text-[#FEF08A]">
                              {session.teacherName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                            </div>
                            <p className="text-[10px] text-[#FEF08A] font-semibold mt-1">
                              {session.teacherName}
                            </p>
                          </div>
                        )
                      )}

                      <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-emerald-300 font-bold flex items-center gap-1">
                        <Mic className="w-2.5 h-2.5 text-emerald-400" />
                        <span>En vivo</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Floating PiP Restore button if minimized */}
                {!showPiP && (
                  <button
                    type="button"
                    onClick={() => setShowPiP(true)}
                    className="absolute bottom-4 right-4 z-20 px-3 py-1.5 rounded-xl bg-black/80 border border-[#FACC15]/50 text-[#FEF08A] text-xs font-bold flex items-center gap-1.5 shadow-xl cursor-pointer hover:bg-black"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Ver Docente (PiP)</span>
                  </button>
                )}
              </div>
            )}

            {/* Students Connected Mini-strip */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 shrink-0">
              {session.participants.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs shrink-0 relative transition-all ${
                    p.hasHandRaised
                      ? 'bg-amber-950/80 border-amber-400 text-[#FEF08A] shadow-md animate-bounce'
                      : 'bg-black/50 border-white/10 text-slate-300'
                  }`}
                >
                  <div className="w-5 h-5 rounded-md bg-[#7F1D1D] flex items-center justify-center font-bold text-[10px] text-white">
                    {p.avatarInitials || p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="truncate max-w-[90px]">{p.name.split(' ')[0]}</span>
                  {p.hasHandRaised && <span className="text-sm">✋</span>}
                  {p.isMuted && <MicOff className="w-3 h-3 text-slate-400" />}
                </div>
              ))}
            </div>

            {/* Call Controls Floating Bar */}
            <div className="h-14 px-3 sm:px-4 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/20 flex items-center justify-between gap-3 shadow-2xl shrink-0">
              <div className="flex items-center gap-2">
                {/* Mic toggle */}
                <button
                  type="button"
                  onClick={handleToggleMic}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isMicOn
                      ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-400/60 text-emerald-200 shadow-md'
                      : 'bg-red-950/80 border-red-500/60 text-red-300'
                  }`}
                  title={isMicOn ? 'Silenciar micrófono' : 'Activar micrófono'}
                >
                  {isMicOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
                  <span className="hidden sm:inline">
                    {isMicOn ? 'Micrófono Activo' : 'Micrófono Mudo'}
                  </span>
                </button>

                {/* Cam toggle (docente) */}
                {isTeacherOrAdmin && (
                  <button
                    type="button"
                    onClick={handleToggleCam}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isCamOn
                        ? 'bg-[#7F1D1D] border-[#FACC15]/60 text-white shadow'
                        : 'bg-white/10 hover:bg-white/20 border-white/20 text-slate-300'
                    }`}
                    title={isCamOn ? 'Apagar cámara' : 'Encender cámara web'}
                  >
                    {isCamOn ? <Video className="w-4 h-4 text-[#FACC15]" /> : <VideoOff className="w-4 h-4" />}
                    <span className="hidden sm:inline">
                      {isCamOn ? 'Cámara ON' : 'Cámara OFF'}
                    </span>
                  </button>
                )}

                {/* Screen Share toggle (docente) */}
                {isTeacherOrAdmin && (
                  <button
                    type="button"
                    onClick={handleToggleScreenShare}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isScreenSharing
                        ? 'bg-purple-700 hover:bg-purple-800 border-purple-300 text-white shadow-lg animate-pulse'
                        : 'bg-white/10 hover:bg-white/20 border-white/20 text-slate-300'
                    }`}
                    title={isScreenSharing ? 'Dejar de compartir pantalla' : 'Compartir pantalla / diapositivas'}
                  >
                    <ScreenShare className="w-4 h-4 text-purple-300" />
                    <span className="hidden sm:inline">
                      {isScreenSharing ? 'Dejar de Compartir' : 'Compartir Pantalla'}
                    </span>
                  </button>
                )}

                {/* Student Audio toggle (alumno) */}
                {!isTeacherOrAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = !studentAudioMuted;
                      setStudentAudioMuted(next);
                      if (persistentAudioRef.current) {
                        persistentAudioRef.current.muted = next;
                        if (!next) persistentAudioRef.current.play().catch(() => {});
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      studentAudioMuted
                        ? 'bg-red-950/80 border-red-500/60 text-red-300'
                        : 'bg-emerald-950/80 border-emerald-400/60 text-emerald-300'
                    }`}
                    title={studentAudioMuted ? 'Activar audio de la maestra' : 'Silenciar audio'}
                  >
                    {studentAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    <span className="hidden sm:inline">
                      {studentAudioMuted ? 'Audio Silenciado' : 'Audio en Vivo'}
                    </span>
                  </button>
                )}

                {/* Quick Toggle Whiteboard */}
                <button
                  type="button"
                  onClick={() => {
                    const nextMode = activeStageMode === 'whiteboard' ? 'video' : 'whiteboard';
                    setActiveStageMode(nextMode);
                    if (isTeacherOrAdmin) {
                      handleForceProject(nextMode === 'whiteboard');
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeStageMode === 'whiteboard'
                      ? 'bg-[#7F1D1D] border-[#FACC15]/60 text-[#FEF08A] shadow'
                      : 'bg-white/10 hover:bg-white/20 border-white/20 text-slate-300'
                  }`}
                  title="Alternar Pizarra Digital"
                >
                  <PenTool className="w-4 h-4" />
                </button>

                {/* Mobile quick toggle for chat */}
                <button
                  type="button"
                  onClick={() => setMobileViewTab(mobileViewTab === 'stage' ? 'chat' : 'stage')}
                  className={`lg:hidden p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    mobileViewTab === 'chat'
                      ? 'bg-[#7F1D1D] border-[#FACC15]/60 text-[#FEF08A] shadow'
                      : 'bg-white/10 hover:bg-white/20 border-white/20 text-slate-300'
                  }`}
                  title="Alternar entre Clase y Chat"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>

              {/* Hand raise button for students */}
              <div className="flex items-center gap-2">
                {!isTeacherOrAdmin && (
                  <button
                    type="button"
                    onClick={() => onToggleHandRaise(currentUser.id)}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      myParticipant?.hasHandRaised
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg scale-105'
                        : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                    }`}
                    title="Pedir la palabra a la maestra"
                  >
                    <Hand className="w-4 h-4" />
                    <span>{myParticipant?.hasHandRaised ? 'Mano Levantada ✋' : 'Levantar Mano'}</span>
                  </button>
                )}

                {/* Teacher End Call / Student Mode Toggle */}
                {isTeacherOrAdmin ? (
                  <button
                    type="button"
                    onClick={onEndClass}
                    className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span className="hidden sm:inline">Finalizar Clase</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveStageMode(activeStageMode === 'video' ? 'whiteboard' : 'video')}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    {activeStageMode === 'video' ? <PenTool className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    <span className="hidden sm:inline">
                      {activeStageMode === 'video' ? 'Ver Pizarra' : 'Ver Docente'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar: In-Call Live Chat & Participants (30% on Desktop, Toggleable on Mobile) */}
          <div
            className={`w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col bg-black/80 shrink-0 min-h-0 ${
              mobileViewTab === 'chat' ? 'flex flex-1' : 'hidden lg:flex'
            }`}
          >
            {/* Header móvil para volver a la clase en pantalla completa */}
            <div className="lg:hidden p-2.5 bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] border-b border-[#FACC15]/30 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMobileViewTab('stage')}
                className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 border border-white/20 text-[#FEF08A] text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Tv className="w-3.5 h-3.5 text-[#FACC15]" />
                <span>← Volver a Ver la Clase Completa</span>
              </button>
              <span className="text-[11px] text-[#FEF08A] font-bold">
                {activeTab === 'chat' ? 'Chat en Vivo' : 'Participantes'}
              </span>
            </div>

            {/* Tab switch (Chat vs Participantes) */}
            <div className="flex border-b border-white/10 bg-black/40">
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'chat'
                    ? 'border-[#FACC15] text-[#FEF08A] bg-white/5'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat en Vivo</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300">
                  {session.chatMessages.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('participants')}
                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'participants'
                    ? 'border-[#FACC15] text-[#FEF08A] bg-white/5'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Alumnos</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/10 text-slate-300">
                  {session.participants.length}
                </span>
                {raisedHandsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold animate-pulse">
                    ✋ {raisedHandsCount}
                  </span>
                )}
              </button>
            </div>

            {/* In-Call Live Chat Tab Content */}
            {activeTab === 'chat' ? (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {session.chatMessages.map((msg) => {
                    const isSelf = msg.senderName === currentUser.name;
                    const isTeacher = msg.role === 'docente' || msg.role === 'admin';
                    return (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-2xl text-xs space-y-1 ${
                          isSelf
                            ? 'bg-gradient-to-r from-[#7F1D1D]/90 to-[#991B1B]/90 border border-[#FACC15]/40 text-white ml-4 shadow-md'
                            : isTeacher
                            ? 'bg-amber-950/70 border border-amber-500/40 text-amber-100 mr-4'
                            : 'bg-white/10 border border-white/10 text-slate-200 mr-4'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-[10px]">
                          <span className={isTeacher ? 'text-[#FEF08A]' : 'text-slate-300'}>
                            {msg.senderName} {isTeacher && '👑'}
                          </span>
                          <span className="opacity-70 text-[9px]">{msg.timestamp}</span>
                        </div>
                        <p className="leading-snug">{msg.text || msg.message}</p>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSendChat} className="p-3 border-t border-white/10 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Escribe tu duda a la maestra..."
                    className="flex-1 px-3 py-2 bg-slate-900 border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#FACC15]"
                  />
                  <button
                    type="submit"
                    className="p-2.5 rounded-xl bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] text-white border border-[#FACC15]/40 cursor-pointer shadow hover:scale-105 transition-all"
                  >
                    <Send className="w-3.5 h-3.5 text-[#FACC15]" />
                  </button>
                </form>
              </div>
            ) : (
              /* Participants / Hands-up Tab Content */
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="pb-2 border-b border-white/10">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Cola de Preguntas (Mano Arriba ✋)
                  </p>
                </div>

                {raisedHandsCount === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">
                    No hay alumnos con la mano levantada.
                  </p>
                ) : (
                  session.participants
                    .filter((p) => p.hasHandRaised)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-400/60 flex items-center justify-between text-xs text-[#FEF08A]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">✋</span>
                          <span className="font-bold">{p.name}</span>
                        </div>
                        {isTeacherOrAdmin && (
                          <button
                            type="button"
                            onClick={() => onToggleHandRaise(p.id)}
                            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] text-white cursor-pointer"
                          >
                            Atendido ✓
                          </button>
                        )}
                      </div>
                    ))
                )}

                <div className="pt-3 pb-1 border-b border-white/10">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Todos los Conectados ({session.participants.length})
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  {session.participants.map((p) => (
                    <div
                      key={p.id}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-[#7F1D1D] text-white flex items-center justify-center font-bold text-[10px]">
                          {p.avatarInitials || p.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate text-xs">{p.name}</p>
                          <p className="text-[10px] text-slate-400 capitalize">{p.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        {p.hasHandRaised && <span>✋</span>}
                        {p.isMuted ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3 text-emerald-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
