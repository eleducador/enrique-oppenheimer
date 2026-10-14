import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

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
        console.warn(`[Gemini] Modelo ${modelName} no disponible (${err?.status || err?.message}), probando siguiente...`);
      }
    }
    throw lastError;
  }

  // Generate Educational Topic Content (Concepts, Examples, Proposed Exercises)
  app.post('/api/generate-topic', async (req, res) => {
    const { topicTitle, courseName, gradeLevel, unitName, teacherNotes } = req.body;

    if (!topicTitle || !courseName) {
      return res.status(400).json({ error: 'Se requiere el título del tema y el nombre del curso.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Fallback generator when API key is missing or quota is reached
    const createRichFallback = () => ({
      summary: `Desarrollo curricular estructurado sobre "${topicTitle}" para el curso de ${courseName} (${gradeLevel || 'Nivel Secundaria'}), diseñado conforme a los estándares académicos del Colegio Capitán Enrique Oppenheimer.`,
      estimatedMinutes: 45,
      concepts: [
        {
          title: `1. Fundamentos y Definición de ${topicTitle}`,
          explanation: `El estudio de ${topicTitle} dentro de ${courseName} permite comprender las estructuras fundamentales y relaciones lógicas que rigen esta unidad (${unitName || 'Unidad Académica'}). Se analiza desde una perspectiva teórica y aplicada para que el estudiante desarrolle pensamiento crítico y resolución metódica de problemas.`,
          keyFormulaOrRule: `Principio Fundamental: Todo análisis de ${topicTitle} requiere identificar variables de entrada, aplicar la propiedad invariante del sistema y verificar la consistencia del resultado.`
        },
        {
          title: `2. Propiedades y Clasificación Sistemática`,
          explanation: `Dentro del desarrollo curricular de ${gradeLevel || 'este grado'}, ${topicTitle} se clasifica según sus elementos constitutivos y su comportamiento bajo transformaciones directas. Comprender esta clasificación facilita abordar casos complejos mediante descomposición en pasos elementales.`,
          keyFormulaOrRule: `Regla de Aplicación: Identificar datos conocidos → Seleccionar relación operativa → Comprobar unidades y coherencia.`
        },
        {
          title: `3. Aplicaciones Prácticas en Contextos Reales`,
          explanation: `La utilidad de ${topicTitle} se refleja en situaciones cotidianas, científicas y de análisis cuantitativo/cualitativo. ${teacherNotes ? `Consideración especial del docente: ${teacherNotes}` : 'Los estudiantes aplican estos conceptos en laboratorios y proyectos integradores.'}`,
          keyFormulaOrRule: `Síntesis Curricular: Competencia lograda mediante demostración guiada y práctica autónoma verificable.`
        }
      ],
      examples: [
        {
          title: `Caso Resuelto Nivel Básico: Aplicación directa de ${topicTitle}`,
          problemStatement: `Planteamiento: En una actividad académica de ${courseName} para ${gradeLevel}, se pide analizar una situación modelo donde interviene directamente ${topicTitle} bajo condiciones iniciales estándar.`,
          stepByStepSolution: [
            `Paso 1: Identificamos los elementos principales del enunciado relacionados con ${topicTitle}.`,
            `Paso 2: Organizamos los datos y aplicamos la definición fundamental vista en la sección teórica.`,
            `Paso 3: Ejecutamos el procedimiento paso a paso verificando que cada transformación mantenga coherencia.`,
            `Paso 4: Interpretamos el resultado obtenido dentro del contexto del problema planteado.`
          ],
          finalAnswer: `El resultado verifica la propiedad principal de ${topicTitle} con precisión completa.`
        },
        {
          title: `Caso Resuelto Nivel Intermedio: Análisis integrado en ${courseName}`,
          problemStatement: `Planteamiento: Dado un escenario compuesto que combina ${topicTitle} con conceptos previos de ${unitName || 'la unidad'}, determinar la solución óptima justificando cada etapa.`,
          stepByStepSolution: [
            `Paso 1: Descomponemos el problema en dos subprocesos manejables.`,
            `Paso 2: Aplicamos la regla operativa de ${topicTitle} sobre el primer bloque de datos.`,
            `Paso 3: Sustituimos el valor intermedio en la condición general del ejercicio y simplificamos.`
          ],
          finalAnswer: `Solución demostrada y validada mediante comprobación cruzada.`
        }
      ],
      exercises: [
        {
          question: `¿Cuál es el propósito principal de aplicar los principios de "${topicTitle}" en el curso de ${courseName}?`,
          difficulty: 'Básico',
          options: [
            `Analizar sistemáticamente el problema, identificar sus variables clave y resolverlo con sustento teórico`,
            `Memorizar datos aislados sin relación con los demás temas del bimestre`,
            `Omitir la verificación de resultados durante el desarrollo práctico`,
            `Sustituir el razonamiento lógico por aproximaciones arbitrarias`
          ],
          correctIndex: 0,
          hint: `Recuerda el primer concepto fundamental sobre el enfoque metódico en ${courseName}.`,
          explanation: `El aprendizaje curricular en el Colegio Capitán Enrique Oppenheimer prioriza el análisis estructurado y la comprensión de principios antes que la memorización mecánica.`
        },
        {
          question: `Al resolver un problema práctico sobre "${topicTitle}", ¿qué paso debe realizarse inmediatamente después de identificar los datos iniciales?`,
          difficulty: 'Intermedio',
          options: [
            `Escribir una conclusión sin desarrollar el procedimiento`,
            `Seleccionar la propiedad, fórmula o criterio conceptual correspondiente y plantear la relación`,
            `Cambiar los datos del problema para que sea más corto`,
            `Descartar las unidades o el contexto de la pregunta`
          ],
          correctIndex: 1,
          hint: `Revisa la secuencia de los casos resueltos paso a paso.`,
          explanation: `Una vez identificados los datos, es indispensable vincularlos mediante la relación conceptual o fórmula pertinente antes de operar.`
        },
        {
          question: `En un ejercicio de nivel avanzado de "${topicTitle}" (${gradeLevel}), ¿cómo se valida que la solución obtenida es correcta?`,
          difficulty: 'Avanzado',
          options: [
            `Comprobando que el resultado cumple las condiciones iniciales y tiene coherencia lógica dentro del contexto`,
            `Eligiendo siempre la alternativa con el valor numérico más alto`,
            `Dejando el procedimiento incompleto en el segundo paso`,
            `Ignorando las restricciones planteadas en el enunciado`
          ],
          correctIndex: 0,
          hint: `La etapa final de todo método riguroso consiste en contrastar el resultado con el planteamiento original.`,
          explanation: `La verificación cruzada con las condiciones iniciales garantiza que el procedimiento aplicado en ${topicTitle} sea exacto y consistente.`
        }
      ]
    });

    if (!apiKey) {
      return res.json(createRichFallback());
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `Eres el coordinador pedagógico del Colegio Capitán Enrique Oppenheimer (Lima, Perú).
El docente del curso "${courseName}" para el grado "${gradeLevel || 'Secundaria'}" en la unidad "${unitName || 'Unidad Curricular'}" ha subido el tema: "${topicTitle}".
${teacherNotes ? `Indicaciones adicionales del docente: "${teacherNotes}".` : ''}

Genera el material didáctico completo en español riguroso, claro y pedagógico para los estudiantes, incluyendo:
1. Un resumen ejecutivo del tema (summary) y tiempo estimado en minutos (estimatedMinutes).
2. 3 conceptos fundamentales detallados (concepts) con título, explicación clara y una fórmula, regla clave o principio síntetico (keyFormulaOrRule).
3. 2 ejemplos prácticos resueltos paso a paso (examples) con título, enunciado del problema, lista de pasos detallados y respuesta final.
4. 3 ejercicios propuestos interactivos de opción múltiple (exercises) graduados en dificultad ('Básico', 'Intermedio', 'Avanzado'), cada uno con 4 opciones claras, el índice de la respuesta correcta (0 a 3), una pista pedagógica (hint) y la explicación detallada de la solución (explanation).`;

      const { response } = await generateContentResilient(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              estimatedMinutes: { type: Type.INTEGER },
              concepts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    keyFormulaOrRule: { type: Type.STRING },
                  },
                  required: ['title', 'explanation', 'keyFormulaOrRule'],
                },
              },
              examples: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    problemStatement: { type: Type.STRING },
                    stepByStepSolution: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    finalAnswer: { type: Type.STRING },
                  },
                  required: ['title', 'problemStatement', 'stepByStepSolution', 'finalAnswer'],
                },
              },
              exercises: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    difficulty: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctIndex: { type: Type.INTEGER },
                    hint: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                  required: ['question', 'difficulty', 'options', 'correctIndex', 'hint', 'explanation'],
                },
              },
            },
            required: ['summary', 'estimatedMinutes', 'concepts', 'examples', 'exercises'],
          },
        },
      });

      const rawText = response.text;
      if (!rawText) {
        return res.json(createRichFallback());
      }
      const parsed = JSON.parse(rawText.trim());
      return res.json(parsed);
    } catch (error) {
      console.error('Error generating topic material, using structured academic fallback:', error);
      return res.json(createRichFallback());
    }
  });

  // Student AI Tutor Consultation (ChatGPT-Style Assistant for Oppenheimer Students)
  app.post('/api/student-chat', async (req, res) => {
    const { message, history, studentName, courseContext, gradeLevel, requestImage } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Se requiere el mensaje del estudiante.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Detect if student explicitly requested an image or visual illustration
    const isImageIntent =
      Boolean(requestImage) ||
      /\b(genera.*(imagen|foto|ilustraci[oó]n|dibujo|esquema|gr[aá]fic[ao])|dibuja|ilustra|crea.*(imagen|foto|dibujo)|mu[eé]strame.*(imagen|foto|dibujo|ilustraci[oó]n)|foto de|imagen de|dibujo de)\b/i.test(
        message
      );

    // High quality pedagogical fallback when API key is missing or offline
    const generateFallbackResponse = (userQuery: string, subject?: string) => {
      const qLower = userQuery.toLowerCase();

      if (qLower.includes('pitagora') || qLower.includes('triangulo') || qLower.includes('hipotenusa')) {
        return `### 📐 Teorema de Pitágoras — Explicación Paso a Paso

¡Excelente consulta académica, ${studentName || 'estudiante'}! El **Teorema de Pitágoras** es uno de los pilares de la geometría y la trigonometría.

---

#### 1. Principio Fundamental
En todo **triángulo rectángulo** (un triángulo con un ángulo recto de 90°):
> **$a^2 + b^2 = c^2$**
* Donde **$a$** y **$b$** son los catetos (los lados que forman el ángulo recto).
* Y **$c$** es la hipotenusa (el lado opuesto al ángulo recto, siempre el más largo).

#### 2. Ejemplo Práctico de la Vida Real
Imagina que necesitas apoyar una escalera en una pared de la escuela Oppenheimer:
* Altura de la pared que deseas alcanzar ($a$): **4 metros**.
* Distancia desde la base de la pared a la escalera ($b$): **3 metros**.
* ¿Qué longitud debe tener la escalera ($c$)?

**Procedimiento:**
1. Planteamos la ecuación: $3^2 + 4^2 = c^2$
2. Desarrollamos las potencias: $9 + 16 = 25$
3. Despejamos la hipotenusa: $c = \\sqrt{25} = 5\\text{ metros}$

*Respuesta:* La escalera debe medir exactamente **5 metros**.

#### 3. Tip para tus Evaluaciones
Recuerda las ternas pitagóricas notables más frecuentes en exámenes:
* **(3, 4, 5)**
* **(5, 12, 13)**
* **(7, 24, 25)**

¿Deseas que resolvamos juntos un ejercicio con catetos diferentes o con fracciones? ¡Escríbeme!`;
      }

      if (qLower.includes('quimic') || qLower.includes('enlace') || qLower.includes('atomo') || qLower.includes('covalente')) {
        return `### 🧪 Enlaces Químicos y Estructura Molecular

¡Gran pregunta para el área de Ciencias, ${studentName || 'estudiante'}! Analicemos los **enlaces químicos** y cómo diferenciarlos rápidamente:

---

#### 1. ¿Por qué se unen los átomos?
Los átomos forman enlaces para alcanzar estabilidad electrónica, completando generalmente **8 electrones en su capa de valencia** (Regla del Octeto).

#### 2. Tipos Principales de Enlaces:
* **Enlace Iónico (Metal + No Metal):**
  * Ocurre por **transferencia completa de electrones**.
  * Se forman iones positivos (cationes) y negativos (aniones).
  * *Ejemplo cotidiano:* Sal de mesa ($\\text{NaCl}$).
  * *Propiedad:* Altos puntos de fusión y conducen electricidad disueltos en agua.

* **Enlace Covalente (No Metal + No Metal):**
  * Ocurre por **compartición de pares de electrones**.
  * Puede ser *polar* (diferencia de electronegatividad, como el $\\text{H}_2\\text{O}$) o *apolar* (como el $\\text{O}_2$).
  * *Propiedad:* Puntos de fusión moderados o bajos.

* **Enlace Metálico (Metal + Metal):**
  * Formado por una red de cationes sumergidos en un "mar de electrones deslocalizados".
  * *Propiedad:* Alta conductividad térmica y eléctrica, maleabilidad.

#### 💡 Consejo de Estudio Oppenheimer
Para determinar el tipo de enlace en un examen, fíjate en la diferencia de electronegatividad ($\\Delta EN$):
* Si $\\Delta EN \\ge 1.7$ $\\rightarrow$ Predomina enlace **iónico**.
* Si $\\Delta EN < 1.7$ $\\rightarrow$ Predomina enlace **covalente**.

¿Quieres que analicemos la estructura de Lewis de alguna molécula en particular?`;
      }

      if (qLower.includes('ensayo') || qLower.includes('comunicacion') || qLower.includes('literatura') || qLower.includes('redact')) {
        return `### 📚 Guía de Redacción: Estructura de un Ensayo Académico

¡Hola ${studentName || 'estudiante'}! Redactar un ensayo con rigor académico es una habilidad esencial en el Colegio Capitán Enrique Oppenheimer.

---

#### Estructura Canónica en Tres Partes:

1. **Introducción (15% del texto):**
   * **Contexto o gancho:** Una frase atractiva, cita o dato relevante para captar la atención.
   * **Definición del tema:** Delimita claramente el objeto de estudio.
   * **Tesis (el corazón del ensayo):** Tu postura clara y argumentable en una sola oración concisa.

2. **Cuerpo Argumentativo (70% del texto):**
   * **Párrafo 1 (Argumento principal):** Premisa sólida respaldada con evidencia, datos o ejemplos.
   * **Párrafo 2 (Argumento de profundización):** Análisis de causas, efectos o implicancias teóricas.
   * **Párrafo 3 (Contraargumento y refutación):** Muestra madurez intelectual considerando una postura contraria y rebatiéndola con fundamento.

3. **Conclusión (15% del texto):**
   * Síntesis de los puntos defendidos (sin repetir palabras exactas).
   * Reafirmación de la tesis a la luz de los argumentos.
   * Reflexión final o llamado al pensamiento crítico.

#### ✨ Conectores útiles para dar elegancia a tu texto:
* Para ordenar: *En primer término, por consiguiente, paralelamente...*
* Para contrastar: *No obstante, en contraposición, si bien es cierto...*
* Para concluir: *En síntesis, a modo de colofón, se colige que...*

¿Tienes ya una temática seleccionada? Dime el título o tema y te ayudo a formular una tesis contundente.`;
      }

      if (qLower.includes('examen') || qLower.includes('practic') || qLower.includes('ejercicio') || qLower.includes('pregunta')) {
        return `### 📝 Sesión de Práctica y Preparación Académica

¡Excelente iniciativa para afianzar tus conocimientos antes de las evaluaciones oficiales! Aquí tienes 3 preguntas de práctica seleccionadas con su correspondiente solución guiada:

---

#### Ejercicio 1 (Nivel Básico — Álgebra)
*Enunciado:* Resuelve la ecuación: $2x + 7 = 19$.
* **Paso 1:** Restamos 7 a ambos miembros: $2x = 19 - 7 = 12$
* **Paso 2:** Dividimos entre 2: $x = \\frac{12}{2} = 6$
* *Respuesta:* **$x = 6$**

#### Ejercicio 2 (Nivel Intermedio — Ciencias)
*Enunciado:* Un móvil parte del reposo y acelera a razón constante de $3\\text{ m/s}^2$ durante $4$ segundos. ¿Qué velocidad final alcanza?
* **Fórmula:** $v_f = v_0 + a \\cdot t$
* **Sustitución:** $v_f = 0 + (3)(4) = 12\\text{ m/s}$
* *Respuesta:* **$12\\text{ m/s}$**

#### Ejercicio 3 (Nivel Avanzado — Razonamiento Crítico)
*Enunciado:* ¿Por qué la masa de un objeto permanece constante en cualquier planeta mientras su peso varía?
* **Justificación:** La masa mide la cantidad de materia e inercia propia del cuerpo (invariante), mientras que el peso es la fuerza gravitacional ($P = m \\cdot g$), la cual depende de la aceleración gravitatoria del astro.

¿Quieres que subamos el nivel de dificultad o prefieres practicar otra materia?`;
      }

      return `### 💡 Tutor Académico Oppenheimer

Hola ${studentName || 'estudiante'}, he recibido tu consulta sobre:
> *"${userQuery}"*

${subject ? `Contextualizado para tu materia de **${subject}** (${gradeLevel || 'Nivel Secundaria'}).` : ''}

---

#### 1. Concepto Clave
Para comprender este tema, es fundamental desglosarlo en sus elementos principales:
* Identificar las variables o premisas centrales de la pregunta.
* Conectar con los contenidos revisados en las guías y sesiones de clase del Colegio Capitán Enrique Oppenheimer.
* Aplicar el método analítico: comprender $\\rightarrow$ estructurar $\\rightarrow$ verificar.

#### 2. Guía de Resolución Sugerida
1. Revisa las definiciones teóricas de la unidad en tu pestaña de **Avance Curricular**.
2. Contrasta con los ejemplos resueltos disponibles en el material didáctico.
3. Si se trata de un problema cuantitativo, asegúrate de homogenizar unidades y verificar las operaciones paso a paso.

¿Podrías darme un poco más de detalle o el enunciado específico del ejercicio para resolverlo paso a paso contigo? ¡Estoy aquí para ayudarte a lograr la máxima calificación!`;
    };

    if (!apiKey) {
      return res.json({
        reply: generateFallbackResponse(message, courseContext),
        model: 'gemini-3.8-flash (Simulado Pedagógico)',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const formattedHistory = Array.isArray(history)
        ? history
            .slice(-6)
            .map((h: { role: string; text: string }) => `${h.role === 'user' ? 'Estudiante' : 'Tutor IA'}: ${h.text}`)
            .join('\n')
        : '';

      async function getWikiImage(term?: string): Promise<string | null> {
        if (!term || typeof term !== 'string') return null;
        try {
          const url = `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term.trim())}`;
          const res = await fetch(url, { headers: { 'User-Agent': 'OppenheimerAulaVirtual/1.0' } });
          if (res.ok) {
            const data = (await res.json()) as any;
            if (data.originalimage?.source) return data.originalimage.source;
            if (data.thumbnail?.source) return data.thumbnail.source;
          }
        } catch (err) {
          console.warn('Wikipedia image lookup error:', err);
        }
        return null;
      }

      if (isImageIntent) {
        const imageGenPrompt = `Eres el Coordinador Pedagógico y Visual del Colegio Capitán Enrique Oppenheimer (Lima, Perú).
El estudiante ${studentName || 'Estudiante'} solicita una imagen o ilustración educativa sobre: "${message}".
Materia o área de estudio: ${courseContext || 'Ciencias e Historia'} (${gradeLevel || '4.° de Secundaria'}).

Debes generar una respuesta estructurada estrictamente en formato JSON con 3 campos obligatorios:
1. "searchTerm": Término enciclopédico exacto en español para buscar en Wikipedia (ejemplos: "Bandera del Perú", "Sistema solar", "Célula animal", "Miguel Grau", "Don José de San Martín", "Fotosíntesis", "Cultura Chavín"). Si es un tema ficticio, usa el concepto principal.
2. "imagePrompt": Un prompt en inglés conciso y claro (entre 8 y 16 palabras) para un motor de generación visual (ejemplo: "flag of Peru waving in the wind against blue sky, photorealistic 8k").
3. "explanation": Una explicación didáctica completa en español con formato Markdown (título ###, subtítulos, viñetas explicativas, datos clave y una pregunta para reflexionar) que analice el tema y enseñe al estudiante los conceptos esenciales.

Responde ÚNICAMENTE el objeto JSON sin bloques de código adicionales.`;

        const { response, modelUsed } = await generateContentResilient(ai, {
          contents: imageGenPrompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        let parsed: { searchTerm?: string; imagePrompt?: string; explanation?: string } = {};
        try {
          const raw = response.text?.trim() || '{}';
          parsed = JSON.parse(raw);
        } catch {
          parsed = {
            searchTerm: message,
            imagePrompt: `${message}, educational illustration, detailed, clean lighting`,
            explanation: `### 🎨 Ilustración Generada sobre "${message}"\n\nAquí tienes la imagen para apoyar tu investigación escolar en el Colegio Capitán Enrique Oppenheimer.`,
          };
        }

        let finalImageUrl: string | null = null;
        let sourceTag = 'Ilustración Educativa Oficial';

        // 1. First priority: Real encyclopedia image from Wikipedia/Wikimedia
        if (parsed.searchTerm) {
          finalImageUrl = await getWikiImage(parsed.searchTerm);
        }

        // 2. Fallback: Fast, free AI generator via Pollinations turbo
        if (!finalImageUrl) {
          const cleanPrompt = (parsed.imagePrompt || message)
            .replace(/["\n\r]/g, ' ')
            .slice(0, 100)
            .trim();
          finalImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=800&height=600&nologo=true&model=turbo`;
          sourceTag = 'Ilustración Generada con IA';
        }

        return res.json({
          reply: parsed.explanation || `### 🎨 Ilustración Didáctica Generada\n\nRepresentación visual sobre: **${message}**.`,
          imageUrl: finalImageUrl,
          imagePrompt: parsed.searchTerm || parsed.imagePrompt || message,
          sourceTag,
          model: `${modelUsed} + Visual`,
          timestamp: new Date().toISOString(),
        });
      }

      const systemPrompt = `Eres el Tutor Inteligente Académico del prestigioso Colegio Capitán Enrique Oppenheimer (Lima, Perú).
Tu misión es hacer que cada respuesta sea ULTRA-DIDÁCTICA, VISUAL Y FÁCIL DE COMPRENDER, como una infografía de libro escolar moderno de alto rendimiento.
Información del estudiante:
- Nombre: ${studentName || 'Estudiante Oppenheimer'}
- Grado: ${gradeLevel || '4.° de Secundaria'}
- Materia actual / contexto: ${courseContext || 'General'}

ESTRUCTURA DIDÁCTICA OBLIGATORIA PARA CIENCIAS Y MATEMÁTICAS (INFOGRAFÍA EDUCATIVA):
1. ENCABEZADO DIDÁCTICO:
   Inicia con un título claro en mayúsculas con emoji institucional (ejemplo: "### ⚡ LEY DE OHM (Circuitos Eléctricos y Resistencia)").

2. 📐 CUADRO DE FÓRMULAS PRINCIPALES Y DESPEJES:
   Presenta la fórmula fundamental y TODOS sus despejes de forma limpia en formato de bloque LaTeX ($$...$$):
   $$V = I \\times R$$
   $$I = \\frac{V}{R} \\qquad R = \\frac{V}{I}$$
   Si existen fórmulas complementarias directas (como $I = \\frac{Q}{t}$ o $V = \\frac{W}{Q}$), agrégalas ordenadas.

3. 🔺 TRIÁNGULO O TRUCO MNEMOTÉCNICO:
   Para leyes de tres variables (como Ley de Ohm VIR, velocidad $v = d/t$, densidad $\\rho = m/V$, etc.), incluye siempre la explicación del Triángulo Mnemotécnico: explica qué variable se tapa con el dedo y cómo se deduce cada despeje sin memorizar.

4. 📋 GLOSARIO DE VARIABLES Y UNIDADES (DONDE...):
   Desglosa OBLIGATORIAMENTE cada símbolo con su significado físico exacto y su unidad de medida en el Sistema Internacional (SI):
   * $V$ = Voltaje o Diferencia de Potencial (Voltios, $\\text{V}$)
   * $I$ = Intensidad de Corriente eléctrica (Amperios, $\\text{A}$)
   * $R$ = Resistencia eléctrica (Ohmios, $\\Omega$)
   * $Q$ = Carga eléctrica (Culombios, $\\text{C}$)
   * $W$ = Trabajo o Energía eléctrica (Julios, $\\text{J}$)
   * $t$ = Tiempo (Segundos, $\\text{s}$)

5. 💡 ESQUEMA CONCEPTUAL O CIRCUITO:
   Explica cómo se visualiza el circuito o modelo (fuente de tensión con polos $+/-$, flujo de electrones/corriente $I$ y elemento resistivo $R$).

6. 🎯 CASO PRÁCTICO RESUELTO PASO A PASO:
   Plantea un ejercicio numérico claro y desglósalo metódicamente:
   - **Datos conocidos:** Magnitudes con unidades.
   - **Incógnita:** Lo que pide el problema.
   - **Fórmula seleccionada:** Ecuación despejada a usar.
   - **Sustitución y cálculo:** Operación matemática paso a paso.
   - **Respuesta final:** Explicación física del resultado obtenido.

7. ✨ TIP DE EXAMEN OPPENHEIMER:
   Un consejo práctico sobre errores comunes (conversión de mA a A, despejes algebraicos o interpretación de gráficas).

Para humanidades, historia o literatura, aplica infografía conceptual con cronología (→), tablas comparativas y síntesis visual.`;

      const userFullPrompt = `${systemPrompt}

${formattedHistory ? `Historial previo de la conversación:\n${formattedHistory}\n` : ''}
Pregunta actual del estudiante: "${message}"

Responde como el Tutor IA de Oppenheimer:`;

      const { response, modelUsed } = await generateContentResilient(ai, {
        contents: userFullPrompt,
      });

      const text = response.text || generateFallbackResponse(message, courseContext);
      return res.json({
        reply: text,
        model: modelUsed,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error in student AI chat, falling back to rich response:', err);
      return res.json({
        reply: generateFallbackResponse(message, courseContext),
        model: 'gemini-3.8-flash (Respaldo Inteligente)',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ========================================================
  // REAL-TIME HOME NETWORK SYNC (LIVE CLASS & COMMUNITY CHAT)
  // ========================================================
  let sharedLiveClassSession: any = {
    id: 'live-mat-401',
    courseId: 'cur-mat',
    courseName: 'Matemática y Ciencias',
    gradeId: 'sec-4',
    gradeName: '4.° de Secundaria',
    teacherId: 'usr-admin-root',
    teacherName: 'Docente Titular',
    title: 'Clase Virtual en Vivo',
    isLive: false,
    startedAt: '',
    whiteboardNotes: '',
    participants: [],
    chatMessages: [],
  };

  let sharedStudentChatMessages: any[] = [];

  // Endpoints: Live Class State Sync
  app.get('/api/sync/live-class', (_req, res) => {
    res.json(sharedLiveClassSession);
  });

  app.post('/api/sync/live-class', (req, res) => {
    sharedLiveClassSession = { ...sharedLiveClassSession, ...req.body };
    res.json(sharedLiveClassSession);
  });

  app.post('/api/sync/live-class/hand-raise', (req, res) => {
    const { participantId } = req.body;
    if (sharedLiveClassSession.participants) {
      sharedLiveClassSession.participants = sharedLiveClassSession.participants.map((p: any) =>
        p.id === participantId
          ? { ...p, hasHandRaised: !p.hasHandRaised, isHandRaised: !p.hasHandRaised }
          : p
      );
    }
    res.json(sharedLiveClassSession);
  });

  app.post('/api/sync/live-class/message', (req, res) => {
    const { message } = req.body;
    if (message) {
      if (!sharedLiveClassSession.chatMessages) sharedLiveClassSession.chatMessages = [];
      sharedLiveClassSession.chatMessages.push(message);
    }
    res.json(sharedLiveClassSession);
  });

  app.post('/api/sync/live-class/whiteboard', (req, res) => {
    const { notes } = req.body;
    if (notes !== undefined) {
      sharedLiveClassSession.whiteboardNotes = notes;
    }
    res.json(sharedLiveClassSession);
  });

  // Endpoints: Student Community Chat Sync
  app.get('/api/sync/student-chat', (_req, res) => {
    res.json(sharedStudentChatMessages);
  });

  app.post('/api/sync/student-chat', (req, res) => {
    const { message } = req.body;
    if (message) {
      sharedStudentChatMessages.push(message);
    }
    res.json(sharedStudentChatMessages);
  });

  app.post('/api/sync/student-chat/reaction', (req, res) => {
    const { messageId, emoji } = req.body;
    const target = sharedStudentChatMessages.find((m) => m.id === messageId);
    if (target) {
      if (!target.reactions || Array.isArray(target.reactions)) target.reactions = {};
      target.reactions[emoji] = (target.reactions[emoji] || 0) + 1;
    }
    res.json(sharedStudentChatMessages);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor del Colegio Capitán Enrique Oppenheimer activo en http://localhost:${PORT}`);
  });
}

startServer();
