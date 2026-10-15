import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * ==============================================================================
 * WEBRTC 1-TO-MANY P2P LIVE STREAMING SERVICE CON SEÑALIZACIÓN EN FIRESTORE
 * Colegio Capitán Enrique Oppenheimer - Aula Virtual 2026
 * ==============================================================================
 * Permite transmisión en vivo de video y audio en alta definición (HD)
 * desde el navegador del profesor hacia todos los alumnos conectados simultáneamente.
 * Utiliza servidores STUN globales de Google para atravesar NAT/routers residenciales y móviles.
 */

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

export interface WebRTCViewerSignal {
  viewerId: string;
  viewerName: string;
  offer?: {
    type: RTCSdpType;
    sdp: string;
  };
  answer?: {
    type: RTCSdpType;
    sdp: string;
  };
  candidates?: RTCIceCandidateInit[];
  teacherCandidates?: RTCIceCandidateInit[];
  status: 'offer' | 'answered' | 'connected' | 'closed';
  createdAt: number;
}

/**
 * Genera una pista de video sintética ultraliviana (5 fps) con el emblema y nombre
 * del docente para mantener la sesión WebRTC y el audio activos cuando la cámara está apagada o proyectando pizarra.
 */
export function createAvatarVideoTrack(teacherName: string): MediaStreamTrack {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#070B14';
    ctx.fillRect(0, 0, 320, 180);

    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, 312, 172);

    ctx.fillStyle = '#7F1D1D';
    ctx.beginPath();
    ctx.arc(160, 70, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    const initials =
      teacherName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'OP';
    ctx.fillStyle = '#FEF08A';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, 160, 70);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(teacherName, 160, 125);

    ctx.fillStyle = '#4ADE80';
    ctx.font = '10px sans-serif';
    ctx.fillText('🎙️ Audio en Vivo · Explicando Pizarra', 160, 145);
  }

  const stream = (canvas as any).captureStream
    ? (canvas as any).captureStream(5)
    : (canvas as any).mozCaptureStream?.(5);
  return stream.getVideoTracks()[0];
}

export interface BroadcasterCleanup {
  (): void;
  stop: () => void;
  replaceTrack: (newTrack: MediaStreamTrack) => Promise<void>;
  updateStream: (newStream: MediaStream) => void;
}

/**
 * ------------------------------------------------------------------------------
 * 1. MODO PROFESOR (BROADCASTER): TRANSMITE SU CÁMARA/PANTALLA/MICRÓFONO A TODOS LOS ALUMNOS
 * ------------------------------------------------------------------------------
 */
export function startTeacherBroadcast(
  localStream: MediaStream,
  onViewerCountChange?: (count: number) => void
): BroadcasterCleanup {
  if (!db) {
    console.warn('⚠️ [WebRTC Broadcaster] Firestore no inicializado.');
    const noop: any = () => {};
    noop.stop = noop;
    noop.replaceTrack = async () => {};
    noop.updateStream = () => {};
    return noop as BroadcasterCleanup;
  }

  let activeLocalStream = localStream;
  const peerConnections = new Map<string, RTCPeerConnection>();
  const docUnsubscribers = new Map<string, () => void>();

  console.info('📡 [WebRTC Broadcaster] Iniciando transmisión del docente con', activeLocalStream.getTracks().length, 'pistas.');

  // Escuchar solicitudes de visualización de los alumnos en la colección 'live_webrtc_signals'
  const signalsCol = collection(db, 'live_webrtc_signals');
  const unsubscribeAll = onSnapshot(signalsCol, (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      const viewerId = change.doc.id;
      const data = change.doc.data() as WebRTCViewerSignal;

      if (change.type === 'removed') {
        // Alumno desconectado
        const pc = peerConnections.get(viewerId);
        if (pc) {
          pc.close();
          peerConnections.delete(viewerId);
        }
        const unsub = docUnsubscribers.get(viewerId);
        if (unsub) {
          unsub();
          docUnsubscribers.delete(viewerId);
        }
        onViewerCountChange?.(peerConnections.size);
        return;
      }

      // Si el alumno envió una oferta ("offer") y aún no le hemos respondido
      if (data.status === 'offer' && data.offer) {
        let pc = peerConnections.get(viewerId);

        // Si ya existía una conexión previa, cerrarla para renovar
        if (pc) {
          pc.close();
          peerConnections.delete(viewerId);
        }

        try {
          pc = new RTCPeerConnection(RTC_CONFIG);
          peerConnections.set(viewerId, pc);
          onViewerCountChange?.(peerConnections.size);

          // Adjuntar todas las pistas de audio y video del docente
          activeLocalStream.getTracks().forEach((track) => {
            pc?.addTrack(track, activeLocalStream);
          });

          // Enviar candidatos ICE del docente a Firestore
          pc.onicecandidate = async (event) => {
            if (event.candidate && db) {
              try {
                const signalDocRef = doc(db, 'live_webrtc_signals', viewerId);
                await updateDoc(signalDocRef, {
                  teacherCandidates: arrayUnion(event.candidate.toJSON()),
                });
              } catch (err) {
                // Ignore transient write errors
              }
            }
          };

          pc.onconnectionstatechange = () => {
            if (pc?.connectionState === 'disconnected' || pc?.connectionState === 'failed' || pc?.connectionState === 'closed') {
              peerConnections.delete(viewerId);
              onViewerCountChange?.(peerConnections.size);
            }
          };

          // 1. Establecer oferta del alumno
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

          // 2. Procesar candidatos previos del alumno
          if (Array.isArray(data.candidates)) {
            for (const cand of data.candidates) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch {
                // Ignore candidate errors
              }
            }
          }

          // 3. Crear respuesta (answer) del docente
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          // 4. Guardar respuesta en Firestore para que el alumno la reciba
          const signalDocRef = doc(db, 'live_webrtc_signals', viewerId);
          await updateDoc(signalDocRef, {
            answer: { type: answer.type, sdp: answer.sdp },
            status: 'answered',
          });

          // 5. Escuchar candidatos adicionales que el alumno agregue
          if (!docUnsubscribers.has(viewerId)) {
            const unsubDoc = onSnapshot(signalDocRef, async (docSnap) => {
              if (!docSnap.exists()) return;
              const freshData = docSnap.data() as WebRTCViewerSignal;
              if (Array.isArray(freshData.candidates)) {
                for (const c of freshData.candidates) {
                  try {
                    await pc?.addIceCandidate(new RTCIceCandidate(c));
                  } catch {
                    // Candidate already added
                  }
                }
              }
            });
            docUnsubscribers.set(viewerId, unsubDoc);
          }
        } catch (error) {
          console.error('❌ [WebRTC Broadcaster] Error conectando con alumno', viewerId, error);
        }
      }
    });
  });

  // Reemplazar pista (ej. alternar de avatar a cámara web real o viceversa) sin reiniciar la llamada
  const replaceTrack = async (newTrack: MediaStreamTrack) => {
    // Actualizar pista en el stream maestro
    const oldTracks = activeLocalStream.getTracks().filter((t) => t.kind === newTrack.kind);
    oldTracks.forEach((t) => {
      activeLocalStream.removeTrack(t);
      if (t !== newTrack) t.stop();
    });
    activeLocalStream.addTrack(newTrack);

    for (const [viewerId, pc] of peerConnections.entries()) {
      try {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === newTrack.kind);
        if (sender) {
          await sender.replaceTrack(newTrack);
        } else {
          pc.addTrack(newTrack, activeLocalStream);
        }
      } catch (err) {
        console.warn('Error reemplazando pista para alumno', viewerId, err);
      }
    }
  };

  const updateStream = (newStream: MediaStream) => {
    activeLocalStream = newStream;
  };

  // Función de limpieza para cuando el docente apaga la transmisión o finaliza la clase
  const stopFn: any = () => {
    unsubscribeAll();
    docUnsubscribers.forEach((unsub) => unsub());
    docUnsubscribers.clear();
    peerConnections.forEach((pc) => pc.close());
    peerConnections.clear();
    onViewerCountChange?.(0);
    console.info('📡 [WebRTC Broadcaster] Transmisión del docente finalizada.');
  };

  stopFn.stop = stopFn;
  stopFn.replaceTrack = replaceTrack;
  stopFn.updateStream = updateStream;

  return stopFn as BroadcasterCleanup;
}

/**
 * ------------------------------------------------------------------------------
 * 2. MODO ALUMNO (VIEWER): RECIBE EL VIDEO Y AUDIO EN VIVO DE LA MAESTRA
 * ------------------------------------------------------------------------------
 */
export function startStudentViewer(
  viewerId: string,
  viewerName: string,
  onRemoteStream: (stream: MediaStream) => void,
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'failed') => void
): () => void {
  if (!db) {
    console.warn('⚠️ [WebRTC Viewer] Firestore no inicializado.');
    return () => {};
  }

  let isTerminated = false;
  let pc: RTCPeerConnection | null = null;
  let unsubDoc: (() => void) | null = null;

  const initViewer = async () => {
    try {
      onStatusChange?.('connecting');
      pc = new RTCPeerConnection(RTC_CONFIG);

      // Declarar que este peer desea recibir video y audio del docente
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });

      // Cuando la pista del docente es recibida exitosamente
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          console.info('🎉 [WebRTC Viewer] ¡Pista de video/audio de la maestra recibida!');
          onRemoteStream(event.streams[0]);
          onStatusChange?.('connected');
        }
      };

      pc.onconnectionstatechange = () => {
        if (!pc) return;
        if (pc.connectionState === 'connected') {
          onStatusChange?.('connected');
        } else if (pc.connectionState === 'failed') {
          onStatusChange?.('failed');
        } else if (pc.connectionState === 'disconnected') {
          onStatusChange?.('disconnected');
        }
      };

      // Recolectar candidatos ICE del alumno y escribirlos en Firestore
      const signalDocRef = doc(db, 'live_webrtc_signals', viewerId);
      pc.onicecandidate = async (event) => {
        if (event.candidate && db && !isTerminated) {
          try {
            await updateDoc(signalDocRef, {
              candidates: arrayUnion(event.candidate.toJSON()),
            });
          } catch {
            // Document might be writing initially
          }
        }
      };

      // 1. Crear oferta (Offer) para la maestra
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // 2. Publicar oferta en Firestore
      await setDoc(signalDocRef, {
        viewerId,
        viewerName,
        offer: { type: offer.type, sdp: offer.sdp },
        candidates: [],
        teacherCandidates: [],
        status: 'offer',
        createdAt: Date.now(),
      });

      // 3. Escuchar la respuesta (Answer) de la maestra
      unsubDoc = onSnapshot(signalDocRef, async (docSnap) => {
        if (!docSnap.exists() || isTerminated || !pc) return;
        const data = docSnap.data() as WebRTCViewerSignal;

        // Establecer la respuesta de la maestra
        if (data.answer && !pc.currentRemoteDescription) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            console.info('✓ [WebRTC Viewer] Respuesta de la maestra aplicada con éxito.');
          } catch (err) {
            console.warn('Error estableciendo remoteDescription en alumno:', err);
          }
        }

        // Agregar candidatos ICE de la maestra
        if (Array.isArray(data.teacherCandidates)) {
          for (const cand of data.teacherCandidates) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch {
              // Ignore already added
            }
          }
        }
      });
    } catch (error) {
      console.error('❌ [WebRTC Viewer] Error iniciando conexión:', error);
      onStatusChange?.('failed');
    }
  };

  initViewer();

  // Función de limpieza al salir del aula o desconectarse
  return () => {
    isTerminated = true;
    if (unsubDoc) unsubDoc();
    if (pc) {
      pc.close();
      pc = null;
    }
    // Limpiar documento en Firestore
    if (db) {
      const signalDocRef = doc(db, 'live_webrtc_signals', viewerId);
      deleteDoc(signalDocRef).catch(() => {});
    }
    onStatusChange?.('disconnected');
    console.info('📡 [WebRTC Viewer] Conexión de alumno finalizada.');
  };
}
