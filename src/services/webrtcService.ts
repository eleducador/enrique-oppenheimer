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
 * ------------------------------------------------------------------------------
 * 1. MODO PROFESOR (BROADCASTER): TRANSMITE SU CÁMARA/PANTALLA A TODOS LOS ALUMNOS
 * ------------------------------------------------------------------------------
 */
export function startTeacherBroadcast(
  localStream: MediaStream,
  onViewerCountChange?: (count: number) => void
): () => void {
  if (!db) {
    console.warn('⚠️ [WebRTC Broadcaster] Firestore no inicializado.');
    return () => {};
  }

  const peerConnections = new Map<string, RTCPeerConnection>();
  const docUnsubscribers = new Map<string, () => void>();

  console.info('📡 [WebRTC Broadcaster] Iniciando transmisión del docente con', localStream.getTracks().length, 'pistas.');

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
          localStream.getTracks().forEach((track) => {
            pc?.addTrack(track, localStream);
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

  // Función de limpieza para cuando el docente apaga la cámara o finaliza la clase
  return () => {
    unsubscribeAll();
    docUnsubscribers.forEach((unsub) => unsub());
    docUnsubscribers.clear();
    peerConnections.forEach((pc) => pc.close());
    peerConnections.clear();
    onViewerCountChange?.(0);
    console.info('📡 [WebRTC Broadcaster] Transmisión del docente finalizada.');
  };
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
