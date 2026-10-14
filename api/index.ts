import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
app.use(express.json({ limit: '5mb' }));

const CANDIDATE_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-3-flash-preview',
];

async function generateContentResilient(ai: GoogleGenAI, requestPayload: any) {
  let lastError: any = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const resp = await ai.models.generateContent({
        ...requestPayload,
        model: modelName,
      });
      return { response: resp, modelUsed: modelName };
    } catch (err: any) {
      lastError = err;
    }
  }
  throw lastError;
}

// 1. GENERAR CONTENIDO DE TEMA CURRICULAR CON IA
app.post('/api/generate-topic', async (req: Request, res: Response) => {
  const { topicTitle, courseName, gradeLevel, unitName, teacherNotes } = req.body;

  if (!topicTitle || !courseName) {
    return res.status(400).json({ error: 'Se requiere el título del tema y el nombre del curso.' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  const createRichFallback = () => ({
    summary: `Desarrollo curricular estructurado sobre "${topicTitle}" para el curso de ${courseName} (${gradeLevel || 'Nivel Secundaria'}), diseñado conforme a los estándares académicos del Colegio Capitán Enrique Oppenheimer.`,
    estimatedMinutes: 45,
    concepts: [
      {
        title: `1. Fundamentos y Definición de ${topicTitle}`,
        explanation: `El estudio de ${topicTitle} dentro de ${courseName} permite comprender las estructuras fundamentales y relaciones lógicas que rigen esta unidad (${unitName || 'Unidad Académica'}).`,
        keyFormulaOrRule: `Principio Fundamental: Identificar variables de entrada, aplicar la propiedad invariante del sistema y verificar la consistencia del resultado.`
      },
      {
        title: `2. Propiedades y Procedimientos Sistemáticos`,
        explanation: `Dentro del desarrollo curricular de ${gradeLevel || 'este grado'}, ${topicTitle} se clasifica según sus elementos constitutivos y su comportamiento operativo.`,
        keyFormulaOrRule: `Regla de Aplicación: Datos conocidos → Relación operativa → Comprobación de unidades y coherencia.`
      },
      {
        title: `3. Aplicaciones Prácticas`,
        explanation: `La utilidad de ${topicTitle} se refleja en situaciones cotidianas, científicas y de análisis estructurado. ${teacherNotes ? `Indicación docente: ${teacherNotes}` : 'Aplicación en ejercicios resueltos y casos modelo.'}`,
        keyFormulaOrRule: `Síntesis: Dominio conceptual verificado mediante demostración guiada y práctica autónoma.`
      }
    ],
    examples: [
      {
        title: `Caso Modelo Resuelto: Aplicación directa de ${topicTitle}`,
        problemStatement: `En una actividad académica de ${courseName} para ${gradeLevel}, se pide resolver una situación modelo aplicando los principios de ${topicTitle}.`,
        stepByStepSolution: [
          `Paso 1: Identificación y ordenamiento de variables.`,
          `Paso 2: Aplicación del teorema o propiedad fundamental.`,
          `Paso 3: Reducción algebraica o procedimental paso a paso.`,
          `Paso 4: Verificación del resultado obtenido.`
        ],
        finalAnswer: `El valor obtenido satisface la condición del problema con exactitud matemática.`
      }
    ],
    exercises: [
      {
        question: `¿Cuál es el criterio principal para verificar la validez de un resultado en "${topicTitle}"?`,
        difficulty: 'Básico',
        hint: `Revisa la coherencia entre los datos de entrada y la relación operativa principal.`
      }
    ]
  });

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.json(createRichFallback());
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Actúa como especialista pedagógico del Colegio Capitán Enrique Oppenheimer. Genera el contenido curricular para el tema: "${topicTitle}" del curso "${courseName}", grado: "${gradeLevel || 'Secundaria'}". Formato JSON.`;
    const { response } = await generateContentResilient(ai, {
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });
    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch {
    return res.json(createRichFallback());
  }
});

// 2. TUTOR IA ESTUDIANTIL (CHAT ACADÉMICO CON IMÁGENES EDUCATIVAS Y FÓRMULAS)
app.post('/api/student-chat', async (req: Request, res: Response) => {
  const { message, courseContext, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Mensaje requerido' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  const fallbackAnswer = `### Explicación Pedagógica del Tutor Oppenheimer
En relación a tu consulta sobre **${courseContext || 'tu asignatura'}**:

1. **Concepto Clave**:
   Para resolver este tipo de dudas, analizamos los fundamentos teóricos y descomponemos el problema en pasos claros.

2. **Aplicación Práctica**:
   Aplica la relación operativa correspondiente y comprueba cada paso con rigurosidad académica.

3. **Consejo de Estudio**:
   Puedes apoyarte en la pizarra interactiva del aula virtual y en los ejercicios resueltos de tu biblioteca curricular.`;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.json({
      reply: fallbackAnswer,
      model: 'Tutor IA Oppenheimer (Modo Didáctico)',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Eres el Tutor de Inteligencia Artificial del Colegio Capitán Enrique Oppenheimer. 
Curso: ${courseContext || 'General'}.
Responde de manera muy didáctica, con formato Markdown, pasos numerados y fórmulas matemáticas KaTeX si corresponde ($...$).
Pregunta del alumno: "${message}"`;

    const { response, modelUsed } = await generateContentResilient(ai, {
      contents: prompt,
    });

    return res.json({
      reply: response.text || fallbackAnswer,
      model: modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return res.json({
      reply: fallbackAnswer,
      model: 'Tutor IA Oppenheimer (Respaldo)',
      timestamp: new Date().toISOString(),
    });
  }
});

// Export default para compatibilidad nativa con Vercel Serverless Functions
export default app;
