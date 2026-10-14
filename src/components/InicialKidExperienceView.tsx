import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Star,
  Heart,
  Palette,
  Music,
  Smile,
  Sun,
  CloudRain,
  Gift,
  Send,
  Download,
  CheckCircle2,
  Trophy,
  Volume2,
  Calendar,
  Layers,
  ArrowRight,
  LogOut,
  ChevronRight,
  BookOpen,
  Award,
  Crown,
  Wand2,
  Play,
  RotateCcw,
} from 'lucide-react';
import { UserProfile, CourseItem, CurricularMaterial } from '../types';
import { INSTITUTION_ASSETS } from '../data/initialData';

interface InicialKidExperienceViewProps {
  currentUser: UserProfile;
  courses: CourseItem[];
  materials: CurricularMaterial[];
  onLogout: () => void;
  onOpenMobileModal: () => void;
}

interface KidChatMessage {
  id: string;
  sender: 'kid' | 'fairy';
  text: string;
  timestamp: string;
}

export const InicialKidExperienceView: React.FC<InicialKidExperienceViewProps> = ({
  currentUser,
  courses,
  materials,
  onLogout,
  onOpenMobileModal,
}) => {
  const [activeKidTab, setActiveKidTab] = useState<'castillo' | 'cuentos' | 'estrellitas' | 'hada'>('castillo');
  const [starCount, setStarCount] = useState<number>(12);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [completedQuests, setCompletedQuests] = useState<Record<string, boolean>>({
    'q-1': true,
    'q-2': true,
  });

  // Mini-game state: Guess the magical shape
  const [shapeAnswer, setShapeAnswer] = useState<string | null>(null);
  const [shapeFeedback, setShapeFeedback] = useState<string>('');

  // Fairy Chat state (Kid ChatGPT)
  const [kidMessages, setKidMessages] = useState<KidChatMessage[]>([
    {
      id: 'km-01',
      sender: 'fairy',
      text: '¡Hola pequeño gran explorador! 🧚✨ Soy tu Hada Madrina del Colegio Oppenheimer. ¿Qué cuento mágico o pregunta divertida tienes hoy?',
      timestamp: '09:00 AM',
    },
  ]);
  const [inputKidQuery, setInputKidQuery] = useState<string>('');
  const [isFairyThinking, setIsFairyThinking] = useState<boolean>(false);
  const fairyChatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fairyChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [kidMessages, isFairyThinking]);

  const triggerEarnStar = () => {
    setStarCount((prev) => prev + 1);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2500);
  };

  const toggleQuest = (id: string) => {
    setCompletedQuests((prev) => {
      const next = !prev[id];
      if (next) triggerEarnStar();
      return { ...prev, [id]: next };
    });
  };

  const handleVerifyShape = (shape: string) => {
    setShapeAnswer(shape);
    if (shape === 'estrella') {
      setShapeFeedback('¡SIII! 🎉 ¡Es la Estrella Mágica Dorada! ¡Ganaste 2 estrellitas!');
      setStarCount((prev) => prev + 2);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
    } else {
      setShapeFeedback('¡Casi, casi! Esa es otra linda forma. ¡Intenta con la que brilla en el cielo! ✨');
    }
  };

  const handleSendFairyQuery = async (queryToSend?: string) => {
    const q = (queryToSend || inputKidQuery).trim();
    if (!q || isFairyThinking) return;

    setInputKidQuery('');

    const newKidMsg: KidChatMessage = {
      id: `kmsg-${Date.now()}`,
      sender: 'kid',
      text: q,
      timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    };

    setKidMessages((prev) => [...prev, newKidMsg]);
    setIsFairyThinking(true);

    try {
      const res = await fetch('/api/student-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Pregunta de niño de Educación Inicial (5 años): "${q}". Responde como un Hada Madrina amorosa, tierna, mágica, con rimas cortas, lenguaje súper sencillo, muchos emojis infantiles (🌈, 🦄, 🌟, 🎈, 🐱) y felicitaciones.`,
          studentName: currentUser.name,
          courseContext: 'Educación Inicial y Cuentacuentos',
          gradeLevel: 'Inicial (5 Años)',
        }),
      });

      const data = await res.json();
      const fairyReply = data.reply || '¡Qué linda pregunta! Las flores cantan cuando sale el sol y las mariposas bailan. ¡Sigue aprendiendo con alegría! 🌸🦋✨';

      const fairyMsg: KidChatMessage = {
        id: `fmsg-${Date.now()}`,
        sender: 'fairy',
        text: fairyReply,
        timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      };

      setKidMessages((prev) => [...prev, fairyMsg]);
    } catch {
      const fallbackReply = '¡Abracadabra patas de cabra! ✨ ¡Eres un niño muy curioso e inteligente! Recuerda sonreír y cantar la canción del jardín hoy. 🎈';
      setKidMessages((prev) => [
        ...prev,
        {
          id: `fmsg-${Date.now()}`,
          sender: 'fairy',
          text: fallbackReply,
          timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsFairyThinking(false);
    }
  };

  // Filter materials for Inicial (or default initial kid materials)
  const inicialMaterials = materials.filter(
    (m) => m.gradeId === 'ini-5' || m.gradeId === 'ini-4' || m.gradeId === 'ini-3'
  );

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col select-none relative font-sans text-slate-800"
      style={{
        backgroundImage: `url(${INSTITUTION_ASSETS.fondoInicial})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Whimsical Confetti Shower Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="text-center animate-bounce p-6 rounded-3xl bg-white/90 border-4 border-yellow-400 shadow-2xl backdrop-blur-md">
            <span className="text-5xl">🎉 ⭐ 🎈 🌈</span>
            <h3 className="text-2xl font-black text-pink-600 font-display mt-2">
              ¡¡SUPER CAMPEÓN!! ¡ESTRELLA MÁGICA GANADA!
            </h3>
            <p className="text-sm font-bold text-amber-600">
              ¡La Miss Claudia y el Hada Madrina están muy orgullosas de ti!
            </p>
          </div>
        </div>
      )}

      {/* Disney Castle Top Magical Header */}
      <header className="shrink-0 h-16 px-5 sm:px-8 bg-white/80 backdrop-blur-xl border-b-4 border-pink-300/80 shadow-lg flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-yellow-400 p-0.5 shadow-md animate-pulse">
            <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center text-xl">
              🏰
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-purple-900 font-display leading-tight tracking-wide drop-shadow-sm">
                Colegio Oppenheimer · Reino Infantil
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-pink-400 to-yellow-400 text-white shadow-sm">
                Nivel Inicial 🎈
              </span>
            </div>
            <p className="text-xs font-bold text-pink-600">
              Aula: Castillo Mágico (5 Años) · Miss Claudia Meléndez
            </p>
          </div>
        </div>

        {/* Stars Counter and Quick Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={triggerEarnStar}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-400 text-purple-950 font-black text-xs shadow-md border-2 border-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="¡Toca para sumar una estrellita mágica!"
          >
            <Star className="w-4 h-4 fill-amber-600 text-amber-700 animate-spin" />
            <span>{starCount} Estrellitas</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-pink-100 hover:bg-pink-200 text-pink-700 font-bold text-xs border border-pink-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Main Container: Lateral Disney Tabs + Central Playground Viewport */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Disney Whimsical Sidebar */}
        <aside className="w-64 sm:w-72 shrink-0 bg-white/85 backdrop-blur-2xl border-r-4 border-pink-200 p-4 flex flex-col justify-between shadow-xl z-20">
          <div className="space-y-4">
            {/* Kid Avatar Card */}
            <div className="p-3.5 rounded-3xl bg-gradient-to-br from-pink-100 via-purple-100 to-yellow-100 border-2 border-pink-300 shadow-md flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-400 flex items-center justify-center font-black text-white text-lg shadow-inner border-2 border-white">
                {currentUser.avatarInitials || '🧸'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[11px] font-black text-purple-800">
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span>Estudiante Mágico</span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-800 truncate">
                  {currentUser.name}
                </h3>
                <p className="text-[11px] font-bold text-pink-600 font-mono-tabular">
                  {currentUser.code} · Inicial
                </p>
              </div>
            </div>

            {/* Bubbly Lateral Navigation Tabs */}
            <nav className="space-y-2">
              <button
                type="button"
                onClick={() => setActiveKidTab('castillo')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black transition-all text-left cursor-pointer shadow-sm ${
                  activeKidTab === 'castillo'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md border-2 border-yellow-300 scale-[1.02]'
                    : 'bg-white/70 hover:bg-white text-purple-900 border border-purple-100'
                }`}
              >
                <span className="text-lg">🏰</span>
                <div className="min-w-0">
                  <p className="truncate">Mi Castillo de Juegos</p>
                  <p className="text-[10px] opacity-80 font-medium">Inicio divertido</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveKidTab('cuentos')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black transition-all text-left cursor-pointer shadow-sm ${
                  activeKidTab === 'cuentos'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md border-2 border-yellow-300 scale-[1.02]'
                    : 'bg-white/70 hover:bg-white text-purple-900 border border-purple-100'
                }`}
              >
                <span className="text-lg">🎨</span>
                <div className="min-w-0">
                  <p className="truncate">Cuentos, Dibujos y Formas</p>
                  <p className="text-[10px] opacity-80 font-medium">Fichas y juegos</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveKidTab('estrellitas')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black transition-all text-left cursor-pointer shadow-sm ${
                  activeKidTab === 'estrellitas'
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-purple-950 shadow-md border-2 border-white scale-[1.02]'
                    : 'bg-white/70 hover:bg-white text-purple-900 border border-purple-100'
                }`}
              >
                <span className="text-lg">⭐</span>
                <div className="min-w-0">
                  <p className="truncate">Mis Estrellitas de Asistencia</p>
                  <p className="text-[10px] opacity-80 font-medium">Soles y premios</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveKidTab('hada')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black transition-all text-left cursor-pointer shadow-sm ${
                  activeKidTab === 'hada'
                    ? 'bg-gradient-to-r from-cyan-400 to-teal-500 text-white shadow-md border-2 border-yellow-300 scale-[1.02]'
                    : 'bg-white/70 hover:bg-white text-purple-900 border border-purple-100'
                }`}
              >
                <span className="text-lg">🧚</span>
                <div className="min-w-0 flex items-center gap-1.5">
                  <p className="truncate">Hada Madrina IA</p>
                  <span className="px-1.5 py-0.2 rounded-md bg-yellow-300 text-purple-900 text-[9px] font-black">
                    ChatGPT
                  </span>
                </div>
              </button>
            </nav>
          </div>

          {/* Sidebar Footer with cheerful quote */}
          <div className="p-3.5 rounded-2xl bg-yellow-100/90 border border-yellow-300 text-center space-y-1">
            <span className="text-lg">🌈</span>
            <p className="text-[11px] font-extrabold text-purple-900">
              «¡Aprender jugando es pura magia!»
            </p>
            <p className="text-[10px] text-pink-700 font-medium">
              Colegio Capitán Oppenheimer 2026
            </p>
          </div>
        </aside>

        {/* Central Content Viewport for Inicial */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto p-4 sm:p-6 text-slate-800">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* VIEW 1: MI CASTILLO DE JUEGOS (INICIO) */}
            {activeKidTab === 'castillo' && (
              <div className="space-y-6">
                {/* Hero Disney Banner Card */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 text-white shadow-2xl border-4 border-white/80 relative overflow-hidden">
                  <div className="relative z-10 space-y-2">
                    <span className="px-3 py-1 rounded-full bg-white/30 backdrop-blur-md text-xs font-black tracking-wide inline-flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      <span>¡Aventura Mágica de Hoy!</span>
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-black font-display drop-shadow-md">
                      ¡Hola, {currentUser.name.split(' ')[0]}! 🎈✨
                    </h2>
                    <p className="text-sm sm:text-base font-bold text-yellow-100 max-w-xl drop-shadow">
                      ¡Bienvenido al Aula de 5 Años! Hoy vamos a cantar, pintar el arcoíris y jugar con las figuras geométricas mágicas.
                    </p>
                  </div>
                  {/* Decorative big emoji in corner */}
                  <div className="absolute right-4 bottom-2 text-7xl sm:text-8xl opacity-30 select-none">
                    🏰
                  </div>
                </div>

                {/* 4 Bubbly Cards: Activities of the Day */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border-3 border-pink-300 shadow-xl hover:scale-105 transition-all text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-pink-100 text-3xl mx-auto flex items-center justify-center shadow-inner">
                      🎨
                    </div>
                    <h4 className="text-base font-black text-pink-700 font-display">
                      Pintar y Crear
                    </h4>
                    <p className="text-xs text-slate-600 font-medium">
                      Témperas mágicas, plastilina de colores y dibujo libre.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveKidTab('cuentos')}
                      className="px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-black cursor-pointer shadow"
                    >
                      Ver Dibujos
                    </button>
                  </div>

                  <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border-3 border-purple-300 shadow-xl hover:scale-105 transition-all text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-purple-100 text-3xl mx-auto flex items-center justify-center shadow-inner">
                      🎵
                    </div>
                    <h4 className="text-base font-black text-purple-800 font-display">
                      Ronda Musical
                    </h4>
                    <p className="text-xs text-slate-600 font-medium">
                      Canción del trenecito y maracas de colores con la Miss.
                    </p>
                    <button
                      type="button"
                      onClick={triggerEarnStar}
                      className="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-black cursor-pointer shadow"
                    >
                      ¡Cantar Ahora!
                    </button>
                  </div>

                  <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border-3 border-yellow-400 shadow-xl hover:scale-105 transition-all text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-yellow-100 text-3xl mx-auto flex items-center justify-center shadow-inner">
                      🍎
                    </div>
                    <h4 className="text-base font-black text-amber-700 font-display">
                      Lonchera Feliz
                    </h4>
                    <p className="text-xs text-slate-600 font-medium">
                      Manzanitas dulces, uvas jugosas y agua fresca de frutas.
                    </p>
                    <button
                      type="button"
                      onClick={triggerEarnStar}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black cursor-pointer shadow"
                    >
                      ¡Qué Rico!
                    </button>
                  </div>

                  <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border-3 border-teal-300 shadow-xl hover:scale-105 transition-all text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-teal-100 text-3xl mx-auto flex items-center justify-center shadow-inner">
                      🧚
                    </div>
                    <h4 className="text-base font-black text-teal-800 font-display">
                      Hada Madrina IA
                    </h4>
                    <p className="text-xs text-slate-600 font-medium">
                      Pregúntale cuentos, canciones o por qué brillan las estrellas.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveKidTab('hada')}
                      className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-black cursor-pointer shadow"
                    >
                      Conversar
                    </button>
                  </div>
                </div>

                {/* Daily Quest Checklist for Kindergarten */}
                <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-xl border-3 border-purple-200 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-purple-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🌟</span>
                      <h3 className="text-lg font-black text-purple-900 font-display">
                        Mis Misiones Mágicas del Día
                      </h3>
                    </div>
                    <span className="text-xs font-extrabold text-pink-600">
                      Toca la carita para completar tu misión
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'q-1', text: 'Saludar a la Miss Claudia y a mis amigos con una sonrisa', icon: '😊' },
                      { id: 'q-2', text: 'Lavarme las manitos antes de la lonchera saludable', icon: '🧼' },
                      { id: 'q-3', text: 'Compartir mis colores y plastilina en la mesa', icon: '🖍️' },
                      { id: 'q-4', text: 'Ordenar los bloques y juguetes en la cajita feliz', icon: '🧸' },
                    ].map((quest) => {
                      const isDone = completedQuests[quest.id];
                      return (
                        <div
                          key={quest.id}
                          onClick={() => toggleQuest(quest.id)}
                          className={`p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all shadow-sm ${
                            isDone
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : 'bg-white hover:bg-yellow-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{quest.icon}</span>
                            <span className="text-xs font-bold leading-snug">{quest.text}</span>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border ${
                              isDone
                                ? 'bg-emerald-500 text-white border-emerald-600'
                                : 'bg-slate-100 text-slate-400 border-slate-300'
                            }`}
                          >
                            {isDone ? '✓' : ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: CUENTOS, DIBUJOS Y FORMAS (CURRICULAR INICIAL) */}
            {activeKidTab === 'cuentos' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-xl border-3 border-purple-200 shadow-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-pink-600">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Actividades y Talleres Lúdicos de Inicial</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-purple-900 font-display">
                    Cuentos Mágicos, Formas y Dibujos Infantiles
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    Explora los temas del aula de 5 años y descarga las fichas para colorear preparadas por Miss Claudia.
                  </p>
                </div>

                {/* Interactive Mini-Game: Guess the Magical Shape */}
                <div className="p-6 rounded-3xl bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 border-4 border-yellow-300 shadow-2xl text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 text-xs font-black text-purple-900 shadow-sm">
                    <span>🎮 Juego Mágico:</span>
                    <span>¿Cuál es la forma mágica que brilla en el cielo?</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                    {[
                      { id: 'circulo', label: 'Círculo Rojo', icon: '🔴', color: 'bg-red-100 hover:bg-red-200 border-red-300' },
                      { id: 'cuadrado', label: 'Cuadrado Azul', icon: '🟦', color: 'bg-blue-100 hover:bg-blue-200 border-blue-300' },
                      { id: 'triangulo', label: 'Triángulo Verde', icon: '🔺', color: 'bg-green-100 hover:bg-green-200 border-green-300' },
                      { id: 'estrella', label: 'Estrella Dorada', icon: '⭐', color: 'bg-yellow-100 hover:bg-yellow-200 border-yellow-400' },
                    ].map((shape) => (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() => handleVerifyShape(shape.id)}
                        className={`p-4 rounded-3xl border-3 flex flex-col items-center gap-2 shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer ${shape.color} ${
                          shapeAnswer === shape.id ? 'ring-4 ring-pink-500 scale-105' : ''
                        }`}
                      >
                        <span className="text-4xl">{shape.icon}</span>
                        <span className="text-xs font-black text-purple-950">{shape.label}</span>
                      </button>
                    ))}
                  </div>

                  {shapeFeedback && (
                    <div className="p-3.5 rounded-2xl bg-white/95 border-2 border-yellow-400 text-xs font-extrabold text-purple-900 shadow">
                      {shapeFeedback}
                    </div>
                  )}
                </div>

                {/* Printable Material Cards for Kids (PDF / PPTX) */}
                <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-xl border-3 border-pink-200 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-pink-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🖍️</span>
                      <h4 className="text-base font-black text-purple-900 font-display">
                        Fichas para Colorear y Diapositivas Infantiles
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-pink-600">
                      Material oficial de la Miss
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-pink-50 border-2 border-pink-300 shadow-sm flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-red-500 text-white">
                          PDF PARA COLOREAR
                        </span>
                        <h5 className="text-xs font-black text-purple-900">
                          Ficha Mágica: Figuras Geométricas y Colores
                        </h5>
                        <p className="text-[11px] text-slate-600">
                          12 páginas de dibujos con caritas para colorear con témperas y crayolas.
                        </p>
                      </div>
                      <a
                        href="#descargar"
                        onClick={(e) => {
                          e.preventDefault();
                          triggerEarnStar();
                          alert('¡Ficha PDF lista para imprimir y colorear! 🎨');
                        }}
                        className="px-3 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-black shrink-0 flex items-center gap-1 shadow"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Imprimir</span>
                      </a>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-500 text-white">
                          PPTX CUENTO ANIMADO
                        </span>
                        <h5 className="text-xs font-black text-purple-900">
                          Diapositivas: Los Animalitos de la Granja
                        </h5>
                        <p className="text-[11px] text-slate-600">
                          20 diapositivas animadas con sonidos de animales y canciones infantiles.
                        </p>
                      </div>
                      <a
                        href="#descargar"
                        onClick={(e) => {
                          e.preventDefault();
                          triggerEarnStar();
                          alert('¡Presentación PPTX descargada para ver con la familia! 📽️');
                        }}
                        className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black shrink-0 flex items-center gap-1 shadow"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Ver Cuento</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: MIS ESTRELLITAS DE ASISTENCIA */}
            {activeKidTab === 'estrellitas' && (
              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-xl border-3 border-yellow-300 shadow-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-600">
                    <Sun className="w-4 h-4 text-amber-500 animate-spin" />
                    <span>Registro Alegre de Puntualidad</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-purple-900 font-display">
                    ¡Mis Soles y Estrellitas de Asistencia!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium">
                    Cada día que llegas a tiempo con una sonrisa, te ganas un Sol Brillante ☀️ en tu calendario escolar.
                  </p>
                </div>

                {/* Big Kid Friendly Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-3xl bg-gradient-to-br from-yellow-100 to-amber-200 border-3 border-yellow-400 shadow-lg text-center space-y-1">
                    <span className="text-4xl">☀️</span>
                    <h4 className="text-xs font-black text-amber-800 uppercase tracking-wide">
                      ¡Llegué Puntualito!
                    </h4>
                    <p className="text-3xl font-black text-purple-950 font-display">
                      19 Días
                    </p>
                    <p className="text-[11px] font-bold text-amber-700">
                      ¡A tiempo para la oración y el juego!
                    </p>
                  </div>

                  <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-100 to-cyan-200 border-3 border-cyan-400 shadow-lg text-center space-y-1">
                    <span className="text-4xl">🌤️</span>
                    <h4 className="text-xs font-black text-cyan-800 uppercase tracking-wide">
                      Tardancita Corta
                    </h4>
                    <p className="text-3xl font-black text-purple-950 font-display">
                      1 Día
                    </p>
                    <p className="text-[11px] font-bold text-cyan-700">
                      ¡Papá y mamá prometieron salir antes!
                    </p>
                  </div>

                  <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-100 to-pink-200 border-3 border-pink-400 shadow-lg text-center space-y-1">
                    <span className="text-4xl">🏆</span>
                    <h4 className="text-xs font-black text-purple-800 uppercase tracking-wide">
                      Medalla de Oro
                    </h4>
                    <p className="text-3xl font-black text-purple-950 font-display">
                      98%
                    </p>
                    <p className="text-[11px] font-bold text-purple-700">
                      ¡Rey de la Puntualidad del Salón!
                    </p>
                  </div>
                </div>

                {/* Smiling Sun Attendance Days Grid */}
                <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-xl border-3 border-yellow-300 shadow-xl space-y-4">
                  <h4 className="text-base font-black text-purple-900 font-display flex items-center gap-2">
                    <span>🌈</span>
                    <span>Mi Calendario de Soles de Octubre</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { dia: 'Vie 10 Oct', estado: '☀️ Puntual', hora: '08:00 AM' },
                      { dia: 'Jue 09 Oct', estado: '☀️ Puntual', hora: '07:55 AM' },
                      { dia: 'Mié 08 Oct', estado: '☀️ Puntual', hora: '07:58 AM' },
                      { dia: 'Mar 07 Oct', estado: '☀️ Puntual', hora: '07:50 AM' },
                      { dia: 'Lun 06 Oct', estado: '☀️ Puntual', hora: '07:52 AM' },
                      { dia: 'Vie 03 Oct', estado: '☀️ Puntual', hora: '07:56 AM' },
                      { dia: 'Jue 02 Oct', estado: '🌤️ Tardancita', hora: '08:15 AM' },
                      { dia: 'Mié 01 Oct', estado: '☀️ Puntual', hora: '07:54 AM' },
                      { dia: 'Mar 30 Sep', estado: '☀️ Puntual', hora: '07:50 AM' },
                      { dia: 'Lun 29 Sep', estado: '☀️ Puntual', hora: '07:48 AM' },
                    ].map((registro, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-yellow-50 border-2 border-yellow-300 text-center space-y-1 shadow-sm"
                      >
                        <p className="text-[11px] font-bold text-purple-900">{registro.dia}</p>
                        <p className="text-xs font-black text-amber-700">{registro.estado}</p>
                        <p className="text-[10px] font-mono-tabular text-slate-500">{registro.hora}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 4: HADA MADRINA IA (CHATGPT INFANTIL DISNEY) */}
            {activeKidTab === 'hada' && (
              <div className="h-[calc(100vh-7rem)] rounded-3xl bg-white/90 backdrop-blur-2xl border-4 border-cyan-300 shadow-2xl flex flex-col overflow-hidden">
                {/* Header of Fairy Chat */}
                <div className="p-4 bg-gradient-to-r from-cyan-400 via-teal-400 to-indigo-400 text-white flex items-center justify-between shrink-0 shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-2xl shadow">
                      🧚
                    </div>
                    <div>
                      <h3 className="text-base font-black font-display flex items-center gap-2">
                        <span>Hada Madrina IA de Oppenheimer</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-300 text-purple-900">
                          ChatGPT Infantil
                        </span>
                      </h3>
                      <p className="text-xs text-yellow-100 font-bold">
                        ¡Pregúntame cualquier duda, un cuento o una canción!
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setKidMessages([
                        {
                          id: 'km-01',
                          sender: 'fairy',
                          text: '¡Hola! 🧚✨ Soy tu Hada Madrina del Colegio Oppenheimer. ¿Qué cuento mágico o pregunta divertida tienes hoy?',
                          timestamp: '09:00 AM',
                        },
                      ])
                    }
                    className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-black cursor-pointer"
                  >
                    Nuevo Cuento
                  </button>
                </div>

                {/* Chat Message Scrollport */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  {kidMessages.map((msg) => {
                    const isKid = msg.sender === 'kid';
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isKid ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isKid && (
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-400 to-teal-500 text-white flex items-center justify-center text-xl shrink-0 shadow-md">
                            🧚
                          </div>
                        )}

                        <div
                          className={`max-w-[85%] rounded-3xl p-4 sm:p-5 shadow-md ${
                            isKid
                              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-tr-none'
                              : 'bg-white border-2 border-cyan-200 text-purple-950 rounded-tl-none font-medium'
                          }`}
                        >
                          <div className="text-[10px] font-black opacity-80 mb-1 flex items-center justify-between gap-4">
                            <span>{isKid ? currentUser.name : 'Hada Madrina Mágica'}</span>
                            <span className="font-mono-tabular">{msg.timestamp}</span>
                          </div>
                          <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                            {msg.text}
                          </div>
                        </div>

                        {isKid && (
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-500 to-yellow-400 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md">
                            {currentUser.avatarInitials}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {isFairyThinking && (
                    <div className="flex gap-3 justify-start items-center">
                      <div className="w-9 h-9 rounded-2xl bg-cyan-400 text-white flex items-center justify-center text-xl shrink-0 animate-bounce">
                        🧚
                      </div>
                      <div className="px-4 py-2.5 rounded-2xl bg-white border-2 border-cyan-300 text-xs font-black text-teal-800 shadow-sm flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-amber-500 animate-spin" />
                        <span>¡El Hada Madrina está buscando en su libro de cuentos...! ✨</span>
                      </div>
                    </div>
                  )}

                  <div ref={fairyChatEndRef} />
                </div>

                {/* Prompt Suggestion Chips for Kindergarten */}
                <div className="px-4 py-2 bg-cyan-50 border-t border-cyan-200 flex gap-2 overflow-x-auto shrink-0">
                  {[
                    '📖 Cuéntame un cuento de un perrito astronauta',
                    '🌈 ¿Por qué sale el arcoíris en la lluvia?',
                    '🦁 ¿Qué animales viven en la selva mágica?',
                    '🎨 ¿Qué pasa si mezclo el rojo y el amarillo?',
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendFairyQuery(chip)}
                      className="px-3 py-1 rounded-full bg-white hover:bg-cyan-100 border border-cyan-300 text-purple-900 text-[11px] font-extrabold whitespace-nowrap shadow-sm cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Input Bar */}
                <div className="p-3.5 bg-white border-t-2 border-cyan-200 shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputKidQuery}
                      onChange={(e) => setInputKidQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendFairyQuery()}
                      placeholder="Escribe o pídele un cuento a tu Hada Madrina..."
                      className="flex-1 px-4 py-2.5 rounded-2xl bg-cyan-50 border-2 border-cyan-300 text-xs sm:text-sm text-purple-950 placeholder-slate-400 font-bold focus:outline-none focus:border-pink-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleSendFairyQuery()}
                      disabled={!inputKidQuery.trim() || isFairyThinking}
                      className="w-10 h-10 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:opacity-40 text-white flex items-center justify-center shadow-lg border-2 border-white cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
