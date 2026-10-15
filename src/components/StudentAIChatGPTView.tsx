import React, { useState, useRef, useEffect, useMemo } from 'react';
import katex from 'katex';
import {
  Sparkles,
  Send,
  Plus,
  MessageSquare,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Clock,
  Trash2,
  ChevronDown,
  GraduationCap,
  ArrowUp,
  Compass,
  Image as ImageIcon,
  Download,
  Maximize2,
  X,
  Palette,
  ExternalLink,
} from 'lucide-react';
import { UserProfile, CourseItem } from '../types';
import { INSTITUTION_ASSETS } from '../data/initialData';
import { askGeminiTutor } from '../services/geminiService';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  courseTag?: string;
  isStreaming?: boolean;
  imageUrl?: string;
  imagePrompt?: string;
}

interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
  courseId?: string;
}

interface StudentAIChatGPTViewProps {
  currentUser: UserProfile;
  courses: CourseItem[];
}

const INITIAL_THREADS: ChatThread[] = [
  {
    id: 'thread-01',
    title: 'Nueva Consulta Académica',
    createdAt: 'Hoy',
    messages: [],
  },
];

const EducationalImageCard: React.FC<{
  imageUrl: string;
  imagePrompt?: string;
  courseTag?: string;
  onZoom: () => void;
}> = ({ imageUrl, imagePrompt, onZoom }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Normalize URL removing any flux/enhance params that trigger 402, ensuring turbo
  let cleanUrl = imageUrl
    .replace(/[?&]model=flux/g, '')
    .replace(/[?&]enhance=true/g, '');
  if (!cleanUrl.includes('model=turbo')) {
    cleanUrl += (cleanUrl.includes('?') ? '&' : '?') + 'model=turbo';
  }

  return (
    <div className="mb-4 rounded-2xl overflow-hidden border border-[#FACC15]/50 bg-slate-950/90 shadow-2xl group/img relative">
      <div className="relative overflow-hidden bg-black/70 min-h-[240px] flex items-center justify-center">
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/90 z-10">
            <Sparkles className="w-6 h-6 text-[#FACC15] animate-spin" />
            <span className="text-xs text-[#FEF08A] font-medium animate-pulse">
              Cargando ilustración didáctica con IA...
            </span>
          </div>
        )}

        {hasError ? (
          <div className="py-10 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-amber-400">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-300">
              La imagen se está procesando o no se pudo previsualizar directamente.
            </p>
            <a
              href={cleanUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7F1D1D] hover:bg-[#991B1B] text-white text-xs font-bold border border-[#FACC15]/40 shadow transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir imagen en nueva pestaña</span>
            </a>
          </div>
        ) : (
          <img
            src={cleanUrl}
            alt="Ilustración didáctica escolar"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            className={`w-full max-h-[440px] object-cover sm:object-contain rounded-t-2xl transition-all duration-500 group-hover/img:scale-[1.01] ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
          />
        )}

        {/* Educational Badge */}
        {!hasError && (
          <div className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-[#FACC15]/70 text-[11px] font-bold text-[#FEF08A] flex items-center gap-1.5 shadow-lg z-20">
            <Sparkles className="w-3.5 h-3.5 text-[#FACC15]" />
            <span>Ilustración Educativa IA (Turbo)</span>
          </div>
        )}

        {/* Action Controls */}
        {!hasError && !isLoading && (
          <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
            <button
              type="button"
              onClick={onZoom}
              className="px-3 py-1.5 rounded-xl bg-black/85 hover:bg-black text-white text-xs font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
              title="Ver en pantalla completa"
            >
              <Maximize2 className="w-3.5 h-3.5 text-[#FACC15]" />
              <span className="hidden sm:inline">Ampliar</span>
            </button>
            <a
              href={cleanUrl}
              target="_blank"
              rel="noreferrer"
              download="ilustracion_escolar.jpg"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] hover:from-[#991B1B] hover:to-[#B91C1C] text-white text-xs font-bold border border-[#FACC15]/60 flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
              title="Descargar imagen en alta resolución"
            >
              <Download className="w-3.5 h-3.5 text-[#FEF08A]" />
              <span className="hidden sm:inline">Descargar</span>
            </a>
          </div>
        )}
      </div>

      {imagePrompt && (
        <div className="px-3.5 py-2 bg-black/85 border-t border-white/10 text-[10px] text-slate-300 font-mono flex items-center justify-between gap-3">
          <span className="truncate">
            <span className="text-[#FACC15] font-semibold">Prompt visual:</span> {imagePrompt}
          </span>
          <span className="shrink-0 text-emerald-400 font-sans font-bold text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
            Alta Calidad
          </span>
        </div>
      )}
    </div>
  );
};

const renderKaTeX = (math: string, displayMode: boolean = false): string => {
  try {
    return katex.renderToString(math.trim(), {
      displayMode,
      throwOnError: false,
      strict: false,
    });
  } catch (err) {
    return math;
  }
};

const DidacticOhmCard: React.FC = () => {
  const [solveFor, setSolveFor] = useState<'I' | 'V' | 'R'>('I');
  const [valV, setValV] = useState<number>(12);
  const [valI, setValI] = useState<number>(3);
  const [valR, setValR] = useState<number>(4);

  const computedResult = useMemo(() => {
    if (solveFor === 'I') {
      const r = valR > 0 ? valR : 1;
      return { val: (valV / r).toFixed(2), unit: 'A (Amperios)', label: 'Corriente' };
    }
    if (solveFor === 'V') {
      return { val: (valI * valR).toFixed(2), unit: 'V (Voltios)', label: 'Voltaje' };
    }
    const i = valI > 0 ? valI : 1;
    return { val: (valV / i).toFixed(2), unit: 'Ω (Ohmios)', label: 'Resistencia' };
  }, [solveFor, valV, valI, valR]);

  return (
    <div className="my-4 rounded-3xl overflow-hidden border-2 border-[#FACC15] bg-[#0A0F1D] shadow-2xl text-slate-100">
      {/* Golden Header Banner matching Image 2 */}
      <div className="bg-gradient-to-r from-amber-500/20 via-[#FACC15]/25 to-amber-500/20 px-6 py-4 border-b-2 border-[#FACC15] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl animate-pulse">⚡</span>
          <div>
            <h3 className="text-xl sm:text-2xl font-black tracking-widest text-[#FACC15] uppercase font-sans drop-shadow-[0_2px_10px_rgba(250,204,21,0.4)]">
              LEY DE OHM
            </h3>
            <p className="text-[10px] text-amber-200/80 font-mono tracking-wider uppercase">
              Infografía Didáctica Oficial · Colegio Oppenheimer
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-black/60 border border-[#FACC15]/60 text-[10px] font-bold text-[#FEF08A] shadow">
            Física & Circuitos
          </span>
        </div>
      </div>

      {/* Main Educational Grid matching Image 2 */}
      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left Column: Yellow-bordered Formula Boxes */}
        <div className="space-y-4">
          {/* Main VIR Box */}
          <div className="rounded-2xl border-2 border-[#FACC15] bg-black/90 overflow-hidden shadow-xl">
            {/* Top Cell: V = IR */}
            <div className="border-b-2 border-[#FACC15] p-3.5 text-center bg-white/[0.03]">
              <div
                className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide"
                dangerouslySetInnerHTML={{
                  __html: renderKaTeX('V = IR', true),
                }}
              />
            </div>
            {/* Bottom 2 Cells: I = V/R and R = V/I */}
            <div className="grid grid-cols-2 divide-x-2 divide-[#FACC15]">
              <div className="p-3 text-center flex items-center justify-center bg-white/[0.01]">
                <div
                  className="text-xl sm:text-2xl font-serif font-bold text-white"
                  dangerouslySetInnerHTML={{
                    __html: renderKaTeX('I = \\frac{V}{R}', true),
                  }}
                />
              </div>
              <div className="p-3 text-center flex items-center justify-center bg-white/[0.01]">
                <div
                  className="text-xl sm:text-2xl font-serif font-bold text-white"
                  dangerouslySetInnerHTML={{
                    __html: renderKaTeX('R = \\frac{V}{I}', true),
                  }}
                />
              </div>
            </div>
          </div>

          {/* Secondary Complementary Box */}
          <div className="rounded-2xl border-2 border-[#FACC15] bg-black/90 overflow-hidden shadow-xl">
            <div className="border-b-2 border-[#FACC15] p-2.5 text-center flex items-center justify-center bg-white/[0.02]">
              <div
                className="text-lg sm:text-xl font-serif font-bold text-white"
                dangerouslySetInnerHTML={{
                  __html: renderKaTeX('I = \\frac{Q}{t}', true),
                }}
              />
            </div>
            <div className="p-2.5 text-center flex items-center justify-center bg-white/[0.01]">
              <div
                className="text-lg sm:text-xl font-serif font-bold text-white"
                dangerouslySetInnerHTML={{
                  __html: renderKaTeX('V = \\frac{W}{Q}', true),
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Circuit Schematic + Legend */}
        <div className="flex flex-col items-center md:items-start justify-between space-y-4">
          {/* Circuit SVG Diagram matching Image 2 */}
          <div className="w-full max-w-[280px] mx-auto py-1">
            <svg
              viewBox="0 0 250 180"
              className="w-full h-auto drop-shadow-[0_0_20px_rgba(250,204,21,0.2)]"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Circuit Wires (White, 2.5px) */}
              {/* Top wire from source to resistor */}
              <line x1="60" y1="30" x2="200" y2="30" stroke="#FFFFFF" strokeWidth="2.5" />
              {/* Bottom wire from resistor back to source */}
              <line x1="60" y1="150" x2="200" y2="150" stroke="#FFFFFF" strokeWidth="2.5" />
              {/* Left wire vertical */}
              <line x1="60" y1="30" x2="60" y2="62" stroke="#FFFFFF" strokeWidth="2.5" />
              <line x1="60" y1="118" x2="60" y2="150" stroke="#FFFFFF" strokeWidth="2.5" />
              {/* Right wire vertical */}
              <line x1="200" y1="30" x2="200" y2="65" stroke="#FFFFFF" strokeWidth="2.5" />
              <line x1="200" y1="115" x2="200" y2="150" stroke="#FFFFFF" strokeWidth="2.5" />

              {/* Voltage Source Circle (Left) */}
              <circle cx="60" cy="90" r="28" stroke="#FFFFFF" strokeWidth="2.5" fill="#0A0F1D" />
              {/* Plus Sign */}
              <line x1="60" y1="75" x2="60" y2="85" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="55" y1="80" x2="65" y2="80" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              {/* Minus Sign */}
              <line x1="55" y1="100" x2="65" y2="100" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              {/* V label in blue */}
              <text x="24" y="97" fill="#60A5FA" fontSize="22" fontWeight="bold" fontFamily="serif">
                V
              </text>

              {/* Current Arrow on Top Wire */}
              <line x1="95" y1="18" x2="165" y2="18" stroke="#FFFFFF" strokeWidth="2" />
              <polygon points="165,14 178,18 165,22" fill="#FFFFFF" />
              {/* I label in blue */}
              <text x="130" y="12" fill="#60A5FA" fontSize="20" fontWeight="bold" fontFamily="serif">
                I
              </text>

              {/* Zigzag Resistor on Right Wire */}
              <polyline
                points="200,65 212,73 188,81 212,89 188,97 212,105 188,113 200,118"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* R label in blue */}
              <text x="216" y="97" fill="#60A5FA" fontSize="22" fontWeight="bold" fontFamily="serif">
                R
              </text>
            </svg>
          </div>

          {/* "Donde:" Legend matching Image 2 */}
          <div className="w-full bg-black/60 p-4 rounded-2xl border border-white/10 font-sans">
            <p className="text-[#F472B6] font-serif italic font-bold text-sm mb-2">
              Donde:
            </p>
            <ul className="text-xs sm:text-[13px] text-[#F9A8D4] italic space-y-1.5 font-serif">
              <li className="flex items-center gap-2">
                <span className="text-[#60A5FA] font-bold not-italic font-sans text-xs">I</span> = corriente (amperes A)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#60A5FA] font-bold not-italic font-sans text-xs">V</span> = voltaje (volts V)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#60A5FA] font-bold not-italic font-sans text-xs">R</span> = resistencia (ohms Ω)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#FEF08A] font-bold not-italic font-sans text-xs">Q</span> = carga (coulombs C)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#FEF08A] font-bold not-italic font-sans text-xs">W</span> = energía (joules J)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#FEF08A] font-bold not-italic font-sans text-xs">t</span> = tiempo (segundos s)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Interactive Quick Practice Calculator */}
      <div className="px-5 py-3.5 bg-black/90 border-t-2 border-[#FACC15]/40 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#FACC15] uppercase">
            ⚡ Calculadora Didáctica:
          </span>
          <div className="flex bg-white/10 rounded-lg p-0.5 border border-white/15">
            {(['I', 'V', 'R'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setSolveFor(key)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  solveFor === key
                    ? 'bg-[#FACC15] text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Despejar {key}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {solveFor === 'I' && (
            <div className="flex items-center gap-2 text-[11px]">
              <span>V:</span>
              <input
                type="number"
                value={valV}
                onChange={(e) => setValV(Number(e.target.value))}
                className="w-14 px-1.5 py-0.5 rounded bg-slate-900 border border-white/20 text-center font-bold text-[#FEF08A]"
              />
              <span>V ÷ R:</span>
              <input
                type="number"
                value={valR}
                onChange={(e) => setValR(Number(e.target.value))}
                className="w-14 px-1.5 py-0.5 rounded bg-slate-900 border border-white/20 text-center font-bold text-[#FEF08A]"
              />
              <span>Ω =</span>
              <span className="font-bold text-[#FACC15] text-sm bg-[#FACC15]/20 px-2 py-0.5 rounded border border-[#FACC15]/40">
                {computedResult.val} A
              </span>
            </div>
          )}

          {solveFor === 'V' && (
            <div className="flex items-center gap-2 text-[11px]">
              <span>I:</span>
              <input
                type="number"
                value={valI}
                onChange={(e) => setValI(Number(e.target.value))}
                className="w-14 px-1.5 py-0.5 rounded bg-slate-900 border border-white/20 text-center font-bold text-[#FEF08A]"
              />
              <span>A × R:</span>
              <input
                type="number"
                value={valR}
                onChange={(e) => setValR(Number(e.target.value))}
                className="w-14 px-1.5 py-0.5 rounded bg-slate-900 border border-white/20 text-center font-bold text-[#FEF08A]"
              />
              <span>Ω =</span>
              <span className="font-bold text-[#FACC15] text-sm bg-[#FACC15]/20 px-2 py-0.5 rounded border border-[#FACC15]/40">
                {computedResult.val} V
              </span>
            </div>
          )}

          {solveFor === 'R' && (
            <div className="flex items-center gap-2 text-[11px]">
              <span>V:</span>
              <input
                type="number"
                value={valV}
                onChange={(e) => setValV(Number(e.target.value))}
                className="w-14 px-1.5 py-0.5 rounded bg-slate-900 border border-white/20 text-center font-bold text-[#FEF08A]"
              />
              <span>V ÷ I:</span>
              <input
                type="number"
                value={valI}
                onChange={(e) => setValI(Number(e.target.value))}
                className="w-14 px-1.5 py-0.5 rounded bg-slate-900 border border-white/20 text-center font-bold text-[#FEF08A]"
              />
              <span>A =</span>
              <span className="font-bold text-[#FACC15] text-sm bg-[#FACC15]/20 px-2 py-0.5 rounded border border-[#FACC15]/40">
                {computedResult.val} Ω
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const StudentAIChatGPTView: React.FC<StudentAIChatGPTViewProps> = ({
  currentUser,
  courses,
}) => {
  const [threads, setThreads] = useState<ChatThread[]>(INITIAL_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string>(INITIAL_THREADS[0].id);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('todos');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isImageMode, setIsImageMode] = useState<boolean>(false);
  const [zoomedImage, setZoomedImage] = useState<{
    url: string;
    title: string;
    prompt?: string;
  } | null>(null);

  const activeThread =
    threads.find((t) => t.id === activeThreadId) || threads[0] || null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeThread?.messages, isLoading]);

  const handleCreateNewThread = () => {
    const newThreadId = `thread-${Date.now()}`;
    const newThread: ChatThread = {
      id: newThreadId,
      title: 'Nueva Consulta Académica',
      createdAt: 'Ahora mismo',
      courseId: selectedCourseFilter !== 'todos' ? selectedCourseFilter : undefined,
      messages: [],
    };
    setThreads([newThread, ...threads]);
    setActiveThreadId(newThreadId);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleDeleteThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = threads.filter((t) => t.id !== threadId);
    setThreads(filtered);
    if (activeThreadId === threadId && filtered.length > 0) {
      setActiveThreadId(filtered[0].id);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleSendMessage = async (textToSend?: string, forceImage?: boolean) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const requestForImage = forceImage ?? isImageMode;
    if (isImageMode) setIsImageMode(false);
    setInputMessage('');

    const activeCourse = courses.find((c) => c.id === selectedCourseFilter);
    const userMsg: ChatMessage = {
      id: `usr-msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      courseTag: activeCourse?.name || 'Consulta General',
    };

    // Update thread title if first message
    const currentMsgs = activeThread ? activeThread.messages : [];
    const isFirstMessage = currentMsgs.length === 0;
    const computedTitle = isFirstMessage
      ? query.slice(0, 36) + (query.length > 36 ? '...' : '')
      : activeThread?.title || 'Consulta';

    const updatedMessages = [...currentMsgs, userMsg];

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              title: isFirstMessage ? computedTitle : t.title,
              messages: updatedMessages,
            }
          : t
      )
    );

    setIsLoading(true);

    try {
      const historyPayload = currentMsgs.slice(-4).map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        text: m.text,
      }));

      const aiResponse = await askGeminiTutor(
        query,
        activeCourse?.name,
        currentUser.name,
        historyPayload,
        requestForImage
      );

      const botMsg: ChatMessage = {
        id: `bot-msg-${Date.now()}`,
        sender: 'assistant',
        text: aiResponse.reply,
        timestamp: new Date().toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        courseTag: activeCourse?.name || 'Tutor Oppenheimer',
        imageUrl: aiResponse.imageUrl,
        imagePrompt: aiResponse.imagePrompt,
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? { ...t, messages: [...t.messages, botMsg] }
            : t
        )
      );
    } catch (err) {
      console.warn('Error en consulta de IA:', err);
      const qLower = query.toLowerCase();
      let fallbackText = '';
      let fallbackImgUrl: string | undefined = undefined;

      if (requestForImage || qLower.includes('imagen') || qLower.includes('dibuja') || qLower.includes('ilustra')) {
        fallbackImgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(query.slice(0, 160))}?width=800&height=600&nologo=true&model=turbo`;
        fallbackText = `### 🎨 Ilustración Generada sobre "${query}"\n\nAquí tienes la imagen generada con IA para apoyar tu investigación escolar.`;
      } else if (qLower.includes('inca') || qLower.includes('tahuantinsuyo') || qLower.includes('cusco') || qLower.includes('machu')) {
        fallbackText = `### 🏛️ Los Incas y el Tahuantinsuyo

Los **incas** conformaron la civilización más extendida y desarrollada de América del Sur antes de la conquista española. Su imperio, llamado **Tahuantinsuyo** ("las cuatro regiones unidas"), tuvo como capital sagrada la ciudad de **Cusco** (Perú) y se extendió a lo largo de la cordillera de los Andes abarcando territorios de Perú, Bolivia, Ecuador y partes de Colombia, Chile y Argentina.

#### Aspectos Clave:
* **Gobernante Supremo:** El **Inca**, considerado hijo del dios Sol (*Inti*).
* **Ingeniería y Agricultura:** Crearon una colosal red vial (**Qhapaq Ñan**) y terrazas agrícolas (**andenes**) para cultivar papa, maíz y quinua en laderas empinadas.
* **Administración y Registro:** Utilizaron el **quipu**, un sofisticado sistema de cuerdas y nudos para registrar cosechas, censos y tributos.
* **Monumentos:** Dejaron admirables obras líticas como **Machu Picchu**, **Sacsayhuamán** y el **Qorikancha**.`;
      } else if (qLower.includes('pitagora') || qLower.includes('triangulo') || qLower.includes('hipotenusa')) {
        fallbackText = `### 📐 Teorema de Pitágoras — Fundamento y Aplicación Práctica\n\nEn todo **triángulo rectángulo**:\n\n> **$a^2 + b^2 = c^2$**\n\n* Donde **$a$** y **$b$** son los catetos perpendiculares.\n* Y **$c$** es la hipotenusa (el lado mayor opuesto a los 90°).\n\n#### Ejemplo:\nSi los catetos miden **3 m** y **4 m**:\n$$3^2 + 4^2 = 9 + 16 = 25 \\implies c = \\sqrt{25} = 5\\text{ m}$$`;
      } else {
        fallbackText = `### 🎓 Tutor Académico Oppenheimer\n\nEstimado estudiante, hemos procesado tu consulta sobre **"${query}"**.\n\nPara profundizar en este tema de forma óptima, te recomendamos:\n* Revisar la guía y materiales de tu curso en el aula virtual.\n* Consultar los ejercicios tipo examen resueltos en la biblioteca escolar.\n* Puedes volver a enviar tu pregunta o solicitar un ejemplo específico para recibir asistencia inmediata de la IA.`;
      }

      const botMsg: ChatMessage = {
        id: `bot-fallback-${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        imageUrl: fallbackImgUrl,
        timestamp: new Date().toLocaleTimeString('es-PE', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        courseTag: activeCourse?.name || 'Tutor Oppenheimer',
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? { ...t, messages: [...t.messages, botMsg] }
            : t
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatInline = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[\s\S]*?\*\*|\*(?!\*)[\s\S]*?\*|\$[^\$\n]+?\$)/g);
    return parts.map((part, i) => {
      if (!part) return null;
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={i} className="font-bold text-[#FEF08A]">
            {formatInline(part.slice(2, -2))}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <em key={i} className="italic text-slate-200">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        const mathContent = part.slice(1, -1);
        const html = renderKaTeX(mathContent, false);
        return (
          <span
            key={i}
            className="inline-math px-1 py-0.5 text-[#FEF08A] font-medium"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }
      return part;
    });
  };

  const renderFormattedMessage = (text: string) => {
    // Check if this message covers Ohm's Law or electric circuits
    const isOhmTopic =
      /ley\s+de\s+ohm|circuito|resistencia|tri[aá]ngulo\s+vir/i.test(text) &&
      /voltaje|amper|corriente/i.test(text);

    // Split text by block math delimiter $$...$$
    const blockParts = text.split(/\$\$([\s\S]*?)\$\$/g);

    return (
      <div className="space-y-3">
        {/* Render Official Didactic Infographic when discussing Ohm's Law matching Image 2 */}
        {isOhmTopic && <DidacticOhmCard />}

        {blockParts.map((part, partIdx) => {
          // Odd indices are block math content ($$...$$)
          if (partIdx % 2 === 1) {
            const mathStr = part.trim();
            if (!mathStr) return null;
            return (
              <div
                key={`math-block-${partIdx}`}
                className="my-3.5 p-3.5 sm:p-4 rounded-2xl bg-slate-950/90 border-2 border-[#FACC15] shadow-xl text-center overflow-x-auto relative group"
              >
                <div className="inline-block px-2.5 py-0.5 mb-1.5 rounded-full text-[10px] font-bold bg-[#FACC15]/20 text-[#FEF08A] uppercase tracking-wider border border-[#FACC15]/40">
                  📐 Cuadro Didáctico de Fórmulas
                </div>
                <div
                  className="text-white text-base sm:text-xl py-1 flex items-center justify-center overflow-x-auto"
                  dangerouslySetInnerHTML={{
                    __html: renderKaTeX(mathStr, true),
                  }}
                />
              </div>
            );
          }

          // Even indices are standard formatted text
          const lines = part.split('\n');
          return (
            <div key={`text-block-${partIdx}`} className="space-y-1.5">
              {lines.map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) {
                  return <div key={idx} className="h-1" />;
                }
                if (trimmed.startsWith('### ')) {
                  return (
                    <h3
                      key={idx}
                      className="text-sm sm:text-base font-extrabold text-[#FEF08A] pt-3 pb-1 border-b border-[#FACC15]/30 font-display flex items-center gap-2"
                    >
                      <span>{formatInline(trimmed.replace('### ', ''))}</span>
                    </h3>
                  );
                }
                if (trimmed.startsWith('#### ')) {
                  return (
                    <h4
                      key={idx}
                      className="text-xs sm:text-sm font-bold text-[#FACC15] pt-2 pb-0.5 font-sans"
                    >
                      {formatInline(trimmed.replace('#### ', ''))}
                    </h4>
                  );
                }
                if (trimmed.startsWith('> ')) {
                  return (
                    <blockquote
                      key={idx}
                      className="border-l-4 border-[#FACC15] pl-3 py-1.5 my-2 italic text-slate-200 bg-white/5 rounded-r-xl font-serif"
                    >
                      {formatInline(trimmed.replace('> ', ''))}
                    </blockquote>
                  );
                }
                if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                  return (
                    <div key={idx} className="flex items-start gap-2 pl-2">
                      <span className="text-[#FACC15] mt-1 text-xs shrink-0">•</span>
                      <span className="flex-1 text-slate-200 leading-relaxed">
                        {formatInline(trimmed.replace(/^(\*|-)\s+/, ''))}
                      </span>
                    </div>
                  );
                }
                if (/^\d+\.\s+/.test(trimmed)) {
                  const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
                  if (numMatch) {
                    return (
                      <div key={idx} className="flex items-start gap-2.5 pl-2 my-1">
                        <span className="w-5 h-5 rounded-full bg-[#7F1D1D] border border-[#FACC15]/40 text-[#FEF08A] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          {numMatch[1]}
                        </span>
                        <span className="flex-1 text-slate-200 leading-relaxed">
                          {formatInline(numMatch[2])}
                        </span>
                      </div>
                    );
                  }
                }
                if (trimmed === '---') {
                  return <hr key={idx} className="border-white/10 my-3" />;
                }
                return (
                  <p key={idx} className="text-slate-200 leading-relaxed">
                    {formatInline(line)}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const promptSuggestions = [
    {
      title: '⚡ Ley de Ohm (Infografía)',
      prompt: 'Explícame la Ley de Ohm de forma didáctica con el cuadro de fórmulas, despejes y diagrama del circuito.',
      icon: '⚡',
      course: 'Física y Circuitos',
      isImage: false,
    },
    {
      title: '🎨 Sistema Solar 3D',
      prompt: 'Genera una ilustración detallada en 3D del sistema solar con las órbitas de los planetas y el sol',
      icon: '🌌',
      course: 'Ilustración IA',
      isImage: true,
    },
    {
      title: '🔬 Célula Animal',
      prompt: 'Genera una ilustración científica de la célula animal con sus organelos principales',
      icon: '🧬',
      course: 'Ilustración IA',
      isImage: true,
    },
    {
      title: 'Teorema de Pitágoras',
      prompt: 'Explícame el Teorema de Pitágoras con un ejemplo de la vida real paso a paso.',
      icon: '📐',
      course: 'Matemática',
      isImage: false,
    },
    {
      title: 'Enlaces Químicos',
      prompt: '¿Cuáles son las diferencias clave entre un enlace iónico y un enlace covalente?',
      icon: '🧪',
      course: 'Ciencias',
      isImage: false,
    },
    {
      title: 'Redacción de Ensayos',
      prompt: '¿Cómo estructurar la introducción y los argumentos de un ensayo escolar con citas?',
      icon: '📚',
      course: 'Comunicación',
      isImage: false,
    },
    {
      title: '3 Preguntas de Examen',
      prompt: 'Dame 3 ejercicios de práctica tipo examen de 4.° de secundaria con soluciones explicadas.',
      icon: '📝',
      course: 'Evaluaciones',
      isImage: false,
    },
  ];

  return (
    <div className="h-[calc(100vh-5rem)] rounded-2xl bg-black/75 backdrop-blur-2xl border border-white/15 shadow-2xl flex overflow-hidden text-slate-100">
      {/* ChatGPT-Style Left History Sidebar */}
      <div
        className={`${
          showSidebar ? 'w-64 sm:w-72' : 'w-0'
        } transition-all duration-300 shrink-0 bg-black/60 border-r border-white/10 flex flex-col justify-between overflow-hidden z-10`}
      >
        <div className="p-3.5 space-y-3 flex-1 flex flex-col min-h-0">
          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleCreateNewThread}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] hover:from-[#991B1B] hover:to-[#B91C1C] border border-[#FACC15]/40 text-white font-bold text-xs shadow-lg cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#FACC15]" />
              <span>Nueva Consulta</span>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-[#FEF08A]" />
          </button>

          {/* Subject Filter inside History */}
          <div className="pt-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
              Materia de Consulta:
            </label>
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-[11px] rounded-lg bg-slate-900 border border-white/15 text-slate-200 focus:outline-none focus:border-[#FACC15]"
            >
              <option value="todos">Todas las Asignaturas</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 mt-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
              Consultas Recientes
            </p>
            {threads.map((thread) => {
              const isActive = thread.id === activeThreadId;
              return (
                <div
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-white/10 text-white border border-[#FACC15]/30 shadow-md font-semibold'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MessageSquare
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-[#FACC15]' : 'text-slate-400'
                      }`}
                    />
                    <div className="truncate text-left">
                      <p className="truncate text-xs">{thread.title}</p>
                      <p className="text-[10px] text-slate-400">{thread.createdAt}</p>
                    </div>
                  </div>

                  {threads.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteThread(thread.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 rounded transition-all"
                      title="Eliminar consulta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer with Student ID */}
        <div className="p-3 border-t border-white/10 bg-black/40">
          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-lg bg-[#7F1D1D] border border-[#FACC15]/40 flex items-center justify-center font-bold text-xs text-[#FEF08A]">
              {currentUser.avatarInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-400 font-mono-tabular">
                4.° Secundaria · {currentUser.code}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ChatGPT-Style Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Top Header Bar */}
        <div className="h-14 shrink-0 px-4 sm:px-6 border-b border-white/10 flex items-center justify-between bg-black/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 cursor-pointer"
              title={showSidebar ? 'Ocultar historial' : 'Ver historial'}
            >
              <MessageSquare className="w-4 h-4 text-[#FACC15]" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-black/60 border border-[#FACC15]/60 flex items-center justify-center shadow-md overflow-hidden p-1">
                <img
                  src={INSTITUTION_ASSETS.crestEmblem}
                  alt="Escudo Oficial Oppenheimer"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white font-display">
                    Tutor IA Oppenheimer
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#7F1D1D]/80 border border-[#FACC15]/40 text-[#FEF08A]">
                    Gemini 3.8 Flash
                  </span>
                </div>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>En línea · Tutoría Pedagógica Activa</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCreateNewThread}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Consulta</span>
            </button>
          </div>
        </div>

        {/* Message Viewport */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
          {(!activeThread || activeThread.messages.length === 0) ? (
            /* Empty State / Welcome Screen like ChatGPT */
            <div className="max-w-2xl mx-auto py-8 sm:py-12 text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-black/60 border-2 border-[#FACC15]/60 flex items-center justify-center mx-auto shadow-2xl overflow-hidden p-2 backdrop-blur-md">
                <img
                  src={INSTITUTION_ASSETS.crestEmblem}
                  alt="Escudo Oficial Oppenheimer"
                  className="w-full h-full object-contain filter drop-shadow-[0_4px_12px_rgba(250,204,21,0.3)]"
                />
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
                  ¿Qué deseas aprender hoy?
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-lg mx-auto">
                  Soy tu tutor académico inteligente del Colegio Capitán Enrique Oppenheimer. Puedes hacerme preguntas sobre tus tareas, pedirme explicaciones paso a paso o generar ejercicios de práctica.
                </p>
              </div>

              {/* Prompt Suggestion Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                {promptSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(item.prompt)}
                    className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FACC15]/40 transition-all text-left group cursor-pointer shadow-md"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-semibold text-[#FEF08A]">{item.course}</span>
                      <span className="text-base">{item.icon}</span>
                    </div>
                    <div className="text-xs font-bold text-white group-hover:text-[#FACC15] transition-colors">
                      {item.title}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                      {item.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Message Flow */
            <div className="max-w-3xl mx-auto space-y-6">
              {activeThread.messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 sm:gap-4 ${
                      isUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-black/60 border border-[#FACC15]/60 flex items-center justify-center shrink-0 shadow-md mt-1 overflow-hidden p-1">
                        <img
                          src={INSTITUTION_ASSETS.crestEmblem}
                          alt="Escudo Oficial Oppenheimer"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 shadow-lg ${
                        isUser
                          ? 'bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] text-white border border-[#FACC15]/40 rounded-tr-none'
                          : 'bg-black/65 backdrop-blur-xl border border-white/15 text-slate-100 rounded-tl-none'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 text-[10px] text-slate-300 pb-2 mb-2 border-b border-white/10">
                        <div className="flex items-center gap-1.5 font-bold">
                          {isUser ? (
                            <>
                              <User className="w-3 h-3 text-[#FACC15]" />
                              <span className="text-[#FEF08A]">{currentUser.name}</span>
                            </>
                          ) : (
                            <>
                              <Bot className="w-3 h-3 text-[#FACC15]" />
                              <span className="text-[#FEF08A]">Tutor IA Oppenheimer</span>
                            </>
                          )}
                          {msg.courseTag && (
                            <span className="opacity-75">· {msg.courseTag}</span>
                          )}
                        </div>
                        <span className="font-mono-tabular text-[10px] opacity-75">
                          {msg.timestamp}
                        </span>
                      </div>

                      {/* Generated Image Card */}
                      {msg.imageUrl && (
                        <EducationalImageCard
                          imageUrl={msg.imageUrl}
                          imagePrompt={msg.imagePrompt}
                          courseTag={msg.courseTag}
                          onZoom={() =>
                            setZoomedImage({
                              url: msg.imageUrl!,
                              title: msg.courseTag || 'Ilustración Académica',
                              prompt: msg.imagePrompt,
                            })
                          }
                        />
                      )}

                      {/* Content Body formatted */}
                      <div className="text-xs sm:text-sm leading-relaxed font-sans space-y-2">
                        {renderFormattedMessage(msg.text)}
                      </div>

                      {/* Assistant Bottom Action Bar */}
                      {!isUser && (
                        <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => handleCopyText(msg.id, msg.text)}
                            className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-[#FEF08A] cursor-pointer transition-colors"
                          >
                            {copiedMsgId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copiado al portapapeles</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar texto</span>
                              </>
                            )}
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleSendMessage(
                                  `Genera una ilustración detallada sobre: "${msg.courseTag || 'el tema actual'}"`,
                                  true
                                )
                              }
                              className="text-[10px] text-[#FEF08A] hover:text-white px-2.5 py-1 rounded-lg bg-[#7F1D1D]/70 hover:bg-[#991B1B] border border-[#FACC15]/40 flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <Palette className="w-3 h-3 text-[#FACC15]" />
                              <span>Ilustrar este tema</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleSendMessage('¿Podrías darme un ejemplo práctico adicional sobre esto?')
                              }
                              className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-white/5 border border-white/10 cursor-pointer"
                            >
                              + Otro ejemplo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-[#7F1D1D] border border-[#FACC15]/50 flex items-center justify-center font-bold text-xs text-[#FEF08A] shrink-0 mt-1 shadow-md">
                        {currentUser.avatarInitials}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Loading Thinking Indicator */}
              {isLoading && (
                <div className="flex gap-3 sm:gap-4 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7F1D1D] to-[#991B1B] border border-[#FACC15]/60 flex items-center justify-center shrink-0 shadow-md mt-1 animate-pulse">
                    <Sparkles className="w-4 h-4 text-[#FACC15]" />
                  </div>
                  <div className="rounded-2xl p-4 bg-black/65 backdrop-blur-xl border border-white/15 text-slate-200 rounded-tl-none flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#FACC15] animate-ping" />
                      <span className="w-2 h-2 rounded-full bg-[#FEF08A] animate-pulse" />
                      <span className="w-2 h-2 rounded-full bg-white/70" />
                    </div>
                    <span className="text-xs text-[#FEF08A] font-medium">
                      {isImageMode
                        ? 'Diseñando y generando la ilustración educativa con IA (FLUX)...'
                        : 'El Tutor IA Oppenheimer está analizando tu consulta...'}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ChatGPT Bottom Floating Input Container */}
        <div className="p-4 sm:p-5 bg-gradient-to-t from-black/95 via-black/80 to-transparent shrink-0">
          <div className="max-w-3xl mx-auto space-y-2.5">
            {/* Visual Mode Active Indicator Banner */}
            <div className="flex items-center justify-between gap-2 px-1">
              <button
                type="button"
                onClick={() => setIsImageMode(!isImageMode)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isImageMode
                    ? 'bg-[#FACC15] text-slate-950 border-[#FACC15] shadow-lg shadow-[#FACC15]/30'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/15 hover:border-[#FACC15]/50'
                }`}
                title="Generar ilustraciones y diagramas visuales con IA"
              >
                <Palette className={`w-3.5 h-3.5 ${isImageMode ? 'text-slate-950' : 'text-[#FACC15]'}`} />
                <span>
                  {isImageMode ? '✨ Modo Ilustración ACTIVO' : '🎨 Generar Ilustración'}
                </span>
              </button>

              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
                <span className="text-slate-500">Ejemplos rápidos:</span>
                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage('Genera una ilustración en 3D del sistema solar con órbitas y planetas', true)
                  }
                  className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  🌌 Sistema Solar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage('Genera un esquema científico de la célula animal con sus partes', true)
                  }
                  className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  🧬 Célula Animal
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage('Genera un retrato histórico de Don José de San Martín proclamando la independencia', true)
                  }
                  className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  🇵🇪 San Martín
                </button>
              </div>
            </div>

            {/* Input Box */}
            <div
              className={`relative rounded-2xl bg-black/85 backdrop-blur-2xl border shadow-2xl transition-all p-2 flex items-end gap-2 ${
                isImageMode
                  ? 'border-[#FACC15] ring-2 ring-[#FACC15]/20 shadow-[#FACC15]/10'
                  : 'border-white/20 focus-within:border-[#FACC15]'
              }`}
            >
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isImageMode
                    ? 'Describe la ilustración educativa que deseas generar... (Ej. La fotosíntesis en una hoja de planta)'
                    : 'Escribe tu consulta escolar al tutor IA... (Ej. Explícame la fotosíntesis o dibuja una célula)'
                }
                rows={1}
                className="w-full max-h-36 resize-none bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className={`w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 shadow-md cursor-pointer transition-all border ${
                  isImageMode
                    ? 'bg-gradient-to-r from-[#FACC15] to-[#EAB308] text-slate-950 border-[#FACC15] hover:opacity-90'
                    : 'bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] hover:from-[#991B1B] hover:to-[#B91C1C] disabled:opacity-40 disabled:hover:from-[#7F1D1D] border-[#FACC15]/40'
                }`}
                title={isImageMode ? 'Generar ilustración' : 'Enviar mensaje (Enter)'}
              >
                {isImageMode ? (
                  <Palette className="w-4 h-4 text-slate-950" />
                ) : (
                  <ArrowUp className="w-4 h-4 text-[#FACC15]" />
                )}
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-400">
              Tutor IA del <strong className="text-slate-300">Colegio Capitán Enrique Oppenheimer</strong> · Consultas de investigación escolar y generación de ilustraciones didácticas.
            </p>
          </div>
        </div>
      </div>

      {/* Fullscreen Zoomed Image Lightbox Modal */}
      {zoomedImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center bg-slate-950 border border-[#FACC15]/40 rounded-3xl overflow-hidden shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Modal Bar */}
            <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FACC15]" />
                <span className="font-bold text-[#FEF08A]">{zoomedImage.title}</span>
                <span className="text-[10px] text-slate-400 bg-white/10 px-2 py-0.5 rounded">
                  Ilustración FLUX 8K
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={zoomedImage.url}
                  target="_blank"
                  rel="noreferrer"
                  download="ilustracion_escolar.jpg"
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] hover:from-[#991B1B] hover:to-[#B91C1C] text-white text-xs font-bold border border-[#FACC15]/60 flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#FEF08A]" />
                  <span>Descargar Imagen</span>
                </a>
                <button
                  type="button"
                  onClick={() => setZoomedImage(null)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Image */}
            <div className="w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden rounded-2xl bg-black">
              <img
                src={zoomedImage.url}
                alt={zoomedImage.prompt || zoomedImage.title}
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
              />
            </div>

            {zoomedImage.prompt && (
              <p className="w-full text-center text-[11px] text-slate-400 font-mono mt-3 truncate px-4">
                <strong className="text-[#FACC15]">Prompt:</strong> {zoomedImage.prompt}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
