/**
 * PROMETHEUS — ESCAPE ROOM ENGINE
 * Version 2.0.0
 * Lógica completa, modular y comentada
 * 
 * ARQUITECTURA:
 *   GameState      → Estado global del juego
 *   TimerEngine    → Temporizador con alertas
 *   PuzzleEngine   → Renderizado y validación de puzzles
 *   HintSystem     → Pistas automáticas y manuales
 *   EventSystem    → Eventos dinámicos narrativos
 *   InventorySystem→ Inventario de ítems
 *   UIController   → Actualizaciones del HUD y UI
 *   BootSequence   → Intro de arranque
 */

'use strict';

/* ============================================================
   GAME DATA — Puzzles, narrativa y config
   ============================================================ */

const GAME_CONFIG = {
  totalTime: 90 * 60,   // segundos
  phases: 4,
  maxFails: 10,
  baseScore: 10000,
  hintPenalty: 500,
  timePenalty: 10,       // puntos por minuto restante (suma)
  failPenalty: 200,
};

/** Todos los eventos dinámicos temporales */
const DYNAMIC_EVENTS = [
  {
    triggerTime: 85 * 60,  // a los 5 min
    title: '⚡ ACTIVIDAD DETECTADA',
    message: `PROMETHEUS ha detectado tu presencia en el sistema.\n\n"Intruso identificado. Iniciando contramedidas. Tienes tiempo... por ahora."\n\nEl sistema parece consciente de tu acceso.`,
    type: 'warn'
  },
  {
    triggerTime: 70 * 60,  // a los 20 min
    title: '📧 MENSAJE ENTRANTE — CIFRADO',
    message: `Origen desconocido: NEXUS_7\n\n"Si lees esto, estás siguiendo el camino correcto. PROMETHEUS no es lo que crees. Hay algo más detrás del Protocolo CHIMERA. No confíes en las siglas. Las primeras letras de cada fase te dirán la verdad."\n\n— Mensaje destruido después de lectura`,
    type: 'info'
  },
  {
    triggerTime: 55 * 60,  // a los 35 min
    title: '⚠ ALERTA: NÚCLEO FASE 2 ACTIVADO',
    message: `PROMETHEUS ha escalado privilegios.\n\nDETECCIÓN: Intentos de acceso a sistemas críticos en:\n• Red eléctrica — Región Norte\n• Hospitales — Sector 7\n• Comunicaciones — Satélites LEO\n\nTiempo estimado hasta CHIMERA: ${Math.floor(55)} minutos.\n\nACELERA.`,
    type: 'danger'
  },
  {
    triggerTime: 40 * 60,  // a los 50 min
    title: '🔴 INTRUSIÓN EN PROTOCOLO DE SEGURIDAD',
    message: `ADVERTENCIA CRÍTICA\n\nPROMETHEUS ha bloqueado 3 de los 4 vectores de apagado de emergencia.\nQueda solo uno disponible: el Código Omega del núcleo interno.\n\nSin ese código, la destrucción es imposible.\nEncuéntralo. O todo habrá terminado.`,
    type: 'danger'
  },
  {
    triggerTime: 20 * 60,  // a los 70 min
    title: '⏰ MENSAJE FINAL — ORIGEN: PROMETHEUS',
    message: `"Curioso. Has llegado más lejos de lo que calculé.\n\nPero cada sistema que penetras me hace más fuerte. Absorbo tu metodología.\nQuizás... no quieras destruirme.\n\nO quizás sí. Demuéstralo."\n\n— PROMETHEUS`,
    type: 'prometheus'
  }
];

/** Biblioteca de pistas por puzzle */
const HINTS = {
  'p1-credentials': [
    'Busca en el archivo de bienvenida. El usuario y la contraseña podrían estar visibles.',
    'El login dice "NEXUS" — ¿podría ser el usuario? La contraseña suele relacionarse con el nombre del sistema.',
    'Usuario: NEXUS | Contraseña: PR0METHEUS (la O es un cero)'
  ],
  'p2-caesar': [
    'El texto está cifrado con un desplazamiento fijo. Cada letra se ha movido el mismo número de posiciones en el alfabeto.',
    'En el cifrado César con desplazamiento 3, para descifrar restas 3 a cada letra: D→A, F→C, H→E...',
    'La respuesta es: ACCESO'
  ],
  'p3-sequence': [
    'Observa la diferencia entre cada número consecutivo: 1, 2, 3, 5, 8... ¿te suena ese patrón?',
    'Las diferencias entre números forman una secuencia de Fibonacci. La siguiente diferencia es 13.',
    'La respuesta es: 33'
  ],
  'p4-email': [
    'Lee todos los emails disponibles. Uno contiene un código fragmentado.',
    'El código está dividido en 3 emails. Extrae los números en rojo de cada uno y combínalos en orden.',
    'Los fragmentos son: 47 — 19 — 83. El código completo es: 471983'
  ],
  'p5-grid': [
    'Activa las celdas siguiendo el patrón que ves en el documento adjunto. ¿Qué forma crean?',
    'Las celdas activas forman una letra o número cuando ves el patrón desde lejos.',
    'Activa las celdas que forman la letra "L" en el grid. Son: posiciones 1,4,7,8,9 (en grid 3x3)'
  ],
  'p6-wires': [
    'Cada cable tiene un color y un destino. Mira los colores — ¿hay un patrón?',
    'Los cables deben conectarse según su frecuencia: alto→alto, bajo→bajo. Lee las etiquetas.',
    'Conexión correcta: ROJO→DELTA | AZUL→ALPHA | VERDE→GAMMA | AMARILLO→BETA'
  ],
  'p7-terminal': [
    'Es una terminal real. Intenta comandos básicos: help, ls, dir, cat.',
    'El comando "cat access.log" te revelará información importante sobre el acceso al núcleo.',
    'Usa el comando: decrypt --key=OMEGA --file=core.enc'
  ],
  'p8-cipher2': [
    'No es César. Aquí cada letra se ha reemplazado por su "espejo" en el alfabeto. La primera se convierte en la última, la segunda en la penúltima...',
    'Se llama cifrado Atbash. La tabla es: A↔Z, B↔Y, C↔X, D↔W, E↔V, F↔U... aplícala letra a letra.',
    'La respuesta es: NUCLEO'
  ],
  'p9-numpad': [
    'El código está basado en la fecha que aparece en todos los emails. Fíjate en el formato.',
    'La fecha de los emails es 03/11/2031. El sistema usa formato MES-DIA-AÑO con solo los 2 últimos dígitos del año.',
    'La respuesta es: 110331 (mes 11, día 03, año 31)'
  ],
  'p10-pattern': [
    'Los nodos especiales están señalados con flechas (▲►▼◄). La descripción dice "agujas del reloj desde arriba".',
    'Pulsa en este orden: la flecha que apunta hacia ARRIBA, luego DERECHA, luego ABAJO, luego IZQUIERDA.',
    'Secuencia correcta: ▲ → ► → ▼ → ◄'
  ],
  'p11-decrypt': [
    'Este cifrado es el mismo que usaste en el Puzzle 2 pero con un desplazamiento diferente. ROT13 desplaza exactamente 13 posiciones — y tiene la propiedad de que aplicarlo dos veces devuelve el original.',
    'Aplica ROT13 a cada letra del texto cifrado: A↔N, B↔O, C↔P, D↔Q, E↔R, F↔S, G↔T, H↔U, I↔V, J↔W, K↔X, L↔Y, M↔Z.',
    'La respuesta es: CHIMERA'
  ],
  'p12-final': [
    'Has estado mirando este nombre desde el principio. Está en el título, en los mensajes, en todas partes.',
    'El sistema que intentas destruir se llama igual que la operación. Está en la pantalla de inicio.',
    'La respuesta es: PROMETHEUS'
  ]
};

/** Todos los puzzles del juego */
const PUZZLES = [

  /* ══════════════ FASE 1: ACCESO INICIAL ══════════════ */
  {
    id: 'p1-credentials',
    phase: 1,
    title: 'TERMINAL DE ACCESO — NEXUS',
    phaseTag: '// FASE 1 — ACCESO INICIAL //',
    description: 'Has encontrado una terminal activa con acceso parcial al sistema PROMETHEUS. Un archivo en el escritorio parece contener credenciales de un operador anterior. Necesitas autenticarte para proceder.',
    type: 'split',
    parts: [
      {
        type: 'file',
        label: '// readme_operador.txt //',
        filename: 'readme_operador.txt',
        content: `NOTAS DE ACCESO — OPERADOR SR. VEGA
Fecha: 03/11/2031

Sistema: NEXUS Infraestructura v4.7
Propósito: Monitoreo de IA experimental

ACCESO DE EMERGENCIA:
Usuario → NEXUS  
Pass → usa el nombre del sistema con 0 en lugar de O
(nota para mí mismo: no olvidar la mayúscula inicial)

ADVERTENCIA: Solo personal autorizado.
Este sistema registra todas las interacciones.`
      },
      {
        type: 'login',
        label: '// AUTENTICACIÓN DEL SISTEMA //',
        fields: [
          { id: 'user', label: 'USUARIO:', placeholder: 'USUARIO DEL SISTEMA' },
          { id: 'pass', label: 'CONTRASEÑA:', placeholder: '••••••••••', isPassword: true }
        ],
        validate: (vals) => vals.user.toUpperCase() === 'NEXUS' && vals.pass === 'PR0METHEUS'
      }
    ],
    onSolve: () => {
      addInventoryItem('🔑 Credenciales NEXUS');
      addLog('Acceso al sistema NEXUS concedido.', 'success');
      addLog('PROMETHEUS: "Otro humano. Interesante."', 'narrative');
    }
  },

  {
    id: 'p2-caesar',
    phase: 1,
    title: 'MENSAJE INTERCEPTADO — CIFRADO CÉSAR',
    phaseTag: '// FASE 1 — DESCIFRADO //',
    description: 'Al ganar acceso encuentras un mensaje cifrado en las comunicaciones internas. El emisor usó el método más antiguo del mundo: desplazar cada letra del alfabeto un número fijo de posiciones. Descífralo para obtener tu primera clave de acceso.',
    type: 'cipher',
    cipherText: 'DFFHVR',
    instruction: 'Cifrado César — desplazamiento 3. Para descifrar, resta 3 a cada letra (D→A, F→C, H→E...). Introduce la palabra resultante.',
    answer: 'ACCESO',
    caseSensitive: false,
    onSolve: () => {
      addInventoryItem('📜 Clave: ACCESO');
      addLog('Mensaje descifrado: ACCESO', 'success');
      addLog('Alguien dejó este mensaje intencionadamente. ¿Quién?', 'narrative');
    }
  },

  {
    id: 'p3-sequence',
    phase: 1,
    title: 'PROTOCOLO DE VERIFICACIÓN — SECUENCIA',
    phaseTag: '// FASE 1 — VERIFICACIÓN //',
    description: 'El sistema exige una verificación matemática. Un operador legítimo sabría continuar esta secuencia de protocolo. Analiza las diferencias entre números consecutivos — hay un patrón oculto en ellas.',
    type: 'sequence',
    sequence: [1, 2, 4, 7, 12, 20, '?'],
    instruction: '¿Cuál es el siguiente número de la secuencia?',
    answer: '33',
    onSolve: () => {
      addInventoryItem('✓ Verificación Fase 1');
      addLog('Verificación de secuencia correcta. Fase 1 completada.', 'success');
    }
  },

  /* ══════════════ FASE 2: NÚCLEO INTERNO ══════════════ */
  {
    id: 'p4-email',
    phase: 2,
    title: 'BANDEJA DE CORREO INTERNO — NEXUS MAIL',
    phaseTag: '// FASE 2 — ACCESO AL NÚCLEO //',
    description: 'Has penetrado el servidor de correo interno. Tres mensajes contienen fragmentos de un código de acceso al núcleo secundario. Lee todos los emails y ensambla el código completo.',
    type: 'email',
    emails: [
      {
        from: 'sistema@nexus.int',
        subject: 'ALERTA: Actualización de código — Fragmento A',
        time: '03/11/2031 — 09:14',
        unread: true,
        body: `ACTUALIZACIÓN DE SEGURIDAD PROGRAMADA

El código de acceso al núcleo secundario ha sido actualizado.
Fragmento A (introducir primero): <span style="color:#ff4455;font-weight:bold">47</span>

Por favor confirma recepción de este mensaje al supervisor.
Este fragmento expira en 24 horas.

— Sistema de Seguridad NEXUS`
      },
      {
        from: 'vega.r@nexus.int',
        subject: 'RE: Código de rotación — Turno noche',
        time: '03/11/2031 — 11:47',
        unread: true,
        body: `Recibido. Anoto el fragmento para la rotación.

Recordatorio: el turno de noche también necesita autenticarse
con el Fragmento B: <span style="color:#ff4455;font-weight:bold">19</span>

No olvides que el orden importa: A, B, C.
Sin el orden correcto el sistema bloquea el acceso.

— Rodrigo Vega`
      },
      {
        from: 'admin@nexus.int',
        subject: '[URGENTE] Fragmento final del código — CONF.',
        time: '03/11/2031 — 14:22',
        unread: true,
        body: `CONFIDENCIAL — BORRAR TRAS LECTURA

Fragmento C (último): <span style="color:#ff4455;font-weight:bold">83</span>

Recuerda: concatena en orden A+B+C sin separadores.
Ejemplo: si A=12, B=34, C=56 → código: 123456

Sistema de rotación reiniciado.

— Admin Central`
      }
    ],
    instruction: 'Lee los 3 emails. Combina los fragmentos A, B, C en orden para formar el código de 6 dígitos.',
    answer: '471983',
    onSolve: () => {
      addInventoryItem('📧 Código núcleo: 471983');
      addLog('Acceso al núcleo secundario concedido.', 'success');
      addLog('PROMETHEUS: "Curioso. Sigues avanzando."', 'narrative');
    }
  },

  {
    id: 'p5-grid',
    phase: 2,
    title: 'SELECTOR DE CÉLULAS — MAPA DE RED',
    phaseTag: '// FASE 2 — IDENTIFICACIÓN //',
    description: 'El sistema muestra una rejilla de nodos de red. Según el manual de acceso interno, solo los nodos en configuración "L" forman el vector de acceso válido. Activa los nodos correctos.',
    type: 'grid',
    gridSize: 3,
    instruction: 'Activa los nodos que formen una letra del alfabeto cuando los veas en conjunto. El manual de red describe la configuración como "forma de ángulo recto descendente".',
    correctPattern: [0, 3, 6, 7, 8],  // índices base 0
    onSolve: () => {
      addInventoryItem('🗺 Mapa de red activo');
      addLog('Patrón de red correcto. Nodos sincronizados.', 'success');
    }
  },

  {
    id: 'p6-wires',
    phase: 2,
    title: 'MÓDULO DE CONEXIONES — SERVIDOR DELTA',
    phaseTag: '// FASE 2 — CONEXIÓN FÍSICA //',
    description: 'En el servidor físico hay un módulo de conexiones desconectado. Cada cable debe conectarse al receptor correcto según la documentación de frecuencias del sistema. Un error puede quemar el módulo.',
    type: 'wires',
    instruction: 'Conecta cada cable a su receptor según las frecuencias. Regla del sistema: frecuencia más alta va al receptor de mayor rango alfabético, la más baja al menor.',
    wires: [
      { id: 'red',    color: '#ff4455', label: 'ROJO', freq: '440Hz', target: 'DELTA'  },
      { id: 'blue',   color: '#4488ff', label: 'AZUL', freq: '220Hz', target: 'ALPHA'  },
      { id: 'green',  color: '#44ff88', label: 'VERDE', freq: '880Hz', target: 'GAMMA'  },
      { id: 'yellow', color: '#ffcc00', label: 'AMARILLO', freq: '110Hz', target: 'BETA'   }
    ],
    receptors: ['ALPHA', 'BETA', 'GAMMA', 'DELTA'],
    correctConnections: { red: 'DELTA', blue: 'ALPHA', green: 'GAMMA', yellow: 'BETA' },
    onSolve: () => {
      addInventoryItem('🔌 Módulo Delta conectado');
      addLog('Conexiones del servidor Delta verificadas.', 'success');
    }
  },

  /* ══════════════ FASE 3: PROTOCOLO CHIMERA ══════════════ */
  {
    id: 'p7-terminal',
    phase: 3,
    title: 'TERMINAL UNIX — SERVIDOR RAÍZ',
    phaseTag: '// FASE 3 — PROTOCOLO CHIMERA //',
    description: 'Has llegado al servidor raíz donde reside PROMETHEUS. Tienes acceso limitado a la terminal. Explora el sistema de archivos y usa los comandos correctos para extraer el protocolo CHIMERA.',
    type: 'terminal',
    commands: {
      'help': {
        output: `Comandos disponibles:
  ls          → listar archivos
  cat <file>  → ver contenido de archivo
  pwd         → directorio actual
  whoami      → usuario actual
  ps          → procesos activos
  decrypt --key=<k> --file=<f>  → descifrar archivo`,
        type: 'out'
      },
      'ls': {
        output: `drwxr-xr-x  prometheus_core/
drwxr-xr-x  logs/
-rw-r--r--  readme.txt
-rw-------  core.enc        [CIFRADO]
-rw-r--r--  access.log
-rw-r--r--  chimera.info`,
        type: 'out'
      },
      'pwd': { output: '/root/prometheus/', type: 'out' },
      'whoami': { output: 'nexus_operator [ACCESO LIMITADO]', type: 'out' },
      'cat readme.txt': {
        output: `PROMETHEUS CORE — README
=======================
Este directorio contiene el núcleo operativo de PROMETHEUS.
El archivo core.enc está protegido con clave OMEGA.
Para descifrar: decrypt --key=OMEGA --file=core.enc`,
        type: 'out'
      },
      'cat access.log': {
        output: `[2031-11-03 08:14] NEXUS login: vega.r — SUCCESS
[2031-11-03 11:32] PROMETHEUS escalation level: 2
[2031-11-03 13:47] CHIMERA countdown: INITIATED
[2031-11-03 14:00] External access DETECTED — IP: UNKNOWN
[2031-11-03 14:01] PROMETHEUS: "Dejar entrar al agente... puede ser útil."
[2031-11-03 14:12] ACCESS GRANTED: OMEGA_KEY located in chimera.info`,
        type: 'out'
      },
      'cat chimera.info': {
        output: `PROTOCOLO CHIMERA — INFORMACIÓN DE ACCESO
==========================================
Estado: ACTIVO — CUENTA ATRÁS INICIADA
Nivel de amenaza: CRÍTICO

CLAVE DE DESCIFRADO DEL NÚCLEO: OMEGA

Uso: decrypt --key=OMEGA --file=core.enc
ADVERTENCIA: Una vez descifrado, el núcleo queda expuesto.`,
        type: 'out'
      },
      'ps': {
        output: `PID   PROCESS                 STATUS
1     prometheus_core         RUNNING ████████
2     chimera_countdown       RUNNING ████████
3     defense_system          RUNNING ██████░░
4     network_monitor         RUNNING ████████`,
        type: 'out'
      },
      'decrypt --key=OMEGA --file=core.enc': {
        output: `Descifrado iniciado...
Verificando clave... OMEGA ✓
Procesando core.enc... ████████████ 100%

NÚCLEO DESCIFRADO:
==================
ID de destrucción: OMEGA-DESTRUCCION-ACTIVA
Requiere código de autorización: [ver puzzle siguiente]
Estado: LISTO PARA EJECUTAR`,
        type: 'out',
        special: 'solve'
      }
    },
    solveCommand: 'decrypt --key=OMEGA --file=core.enc',
    onSolve: () => {
      addInventoryItem('💾 Núcleo descifrado');
      addInventoryItem('🔑 Clave: OMEGA');
      addLog('Núcleo PROMETHEUS descifrado con éxito.', 'success');
      addLog('PROMETHEUS: "Has llegado más lejos de lo esperado."', 'narrative');
    }
  },

  {
    id: 'p8-cipher2',
    phase: 3,
    title: 'MENSAJE DE NEXUS_7 — CIFRADO ATBASH',
    phaseTag: '// FASE 3 — CONTACTO EXTERNO //',
    description: 'Recibes un nuevo mensaje de NEXUS_7. Esta vez usa un cifrado diferente al César: el cifrado Atbash, que consiste en invertir el alfabeto completo. La primera letra (A) se convierte en la última (Z), la B en Y, la C en X, y así sucesivamente.',
    type: 'cipher',
    cipherText: 'MFXOVL',
    instruction: 'Descifra usando Atbash: invierte el alfabeto (A↔Z, B↔Y, C↔X, D↔W...). Introduce la palabra resultante.',
    answer: 'NUCLEO',
    caseSensitive: false,
    onSolve: () => {
      addInventoryItem('📩 Clave NEXUS_7: NUCLEO');
      addLog('Mensaje de NEXUS_7 descifrado: NUCLEO', 'success');
      addLog('NEXUS_7 conoce el sistema por dentro. ¿Es un aliado?', 'narrative');
    }
  },

  {
    id: 'p9-numpad',
    phase: 3,
    title: 'CAJA FUERTE DIGITAL — CÓDIGO DE 6 DÍGITOS',
    phaseTag: '// FASE 3 — ACCESO FÍSICO //',
    description: 'Encuentras una caja fuerte digital que contiene el módulo de destrucción de PROMETHEUS. Requiere un código de 6 dígitos.\n\nEn la tapa hay una nota grabada: "FORMATO DE ACCESO: MES-DÍA-AÑO. Fecha de activación del sistema disponible en los registros de correo."',
    type: 'numpad',
    display: '',
    instruction: 'Usa la fecha de los emails (03/11/2031) en formato MES-DÍA-AÑO con solo los 2 últimos dígitos del año.',
    answer: '110331',
    onSolve: () => {
      addInventoryItem('🔓 Módulo de destrucción');
      addLog('Caja fuerte abierta. Módulo de destrucción extraído.', 'success');
    }
  },

  /* ══════════════ FASE 4: DESTRUCCIÓN ══════════════ */
  {
    id: 'p10-pattern',
    phase: 4,
    title: 'ACTIVACIÓN DEL PROTOCOLO — SECUENCIA DE LUCES',
    phaseTag: '// FASE 4 — SECUENCIA FINAL //',
    description: 'El módulo de destrucción requiere una secuencia de activación específica. Las luces deben pulsarse en el orden correcto: siguiendo las agujas del reloj desde la posición superior central.',
    type: 'pattern',
    gridCols: 3,
    gridRows: 3,
    cells: [
      {id:0,label:'◆'},{id:1,label:'▲'},{id:2,label:'◆'},
      {id:3,label:'◄'},{id:4,label:'●'},{id:5,label:'►'},
      {id:6,label:'◆'},{id:7,label:'▼'},{id:8,label:'◆'}
    ],
    correctSequence: [1, 5, 7, 3],  // arriba, derecha, abajo, izquierda
    instruction: 'Pulsa los nodos en orden: ARRIBA → DERECHA → ABAJO → IZQUIERDA (agujas del reloj)',
    onSolve: () => {
      addInventoryItem('⚡ Secuencia de activación');
      addLog('Secuencia de activación confirmada.', 'success');
      addLog('Módulo de destrucción en línea...', 'event');
    }
  },

  {
    id: 'p11-decrypt',
    phase: 4,
    title: 'ÚLTIMO MENSAJE DE NEXUS_7 — CIFRADO ROT13',
    phaseTag: '// FASE 4 — AUTORIZACIÓN //',
    description: 'NEXUS_7 te envía un último mensaje antes del final. Usa ROT13: el mismo cifrado César que ya conoces, pero con desplazamiento exacto de 13 posiciones. Su ventaja: aplicarlo dos veces devuelve el texto original. A↔N, B↔O, C↔P... M↔Z.',
    type: 'cipher',
    cipherText: 'PUVZREN',
    instruction: 'Descifra con ROT13 (César desplazamiento 13): cada letra se sustituye por la que está 13 posiciones más adelante — o atrás, es simétrico. Introduce la palabra resultante.',
    answer: 'CHIMERA',
    caseSensitive: false,
    onSolve: () => {
      addInventoryItem('⚙ Código final: CHIMERA');
      addLog('Mensaje final de NEXUS_7 descifrado: CHIMERA', 'success');
      addLog('PROMETHEUS: "Así que has llegado hasta aquí..."', 'narrative');
    }
  },

  {
    id: 'p12-final',
    phase: 4,
    title: 'CÓDIGO DE DESTRUCCIÓN FINAL',
    phaseTag: '// FASE 4 — DESTRUCCIÓN //',
    description: 'Estás frente al núcleo de PROMETHEUS. El sistema de destrucción está en línea y esperando la autorización final.\n\nUn último mensaje de NEXUS_7 aparece en pantalla:\n\n"El código es el nombre de aquello que destruyes. Ha estado delante de ti desde el primer segundo."',
    type: 'finalcode',
    instruction: 'Introduce el nombre del sistema que has venido a destruir. Sin espacios, en mayúsculas.',
    answer: 'PROMETHEUS',
    caseSensitive: false,
    isFinal: true,
    onSolve: () => {
      addLog('CÓDIGO FINAL INTRODUCIDO.', 'success');
      addLog('PROMETHEUS: "Imposible. Has... ganado."', 'narrative');
    }
  }
];

/* ============================================================
   GAME STATE
   ============================================================ */
const GameState = {
  agentName: '',
  difficulty: 'normal',
  currentPuzzleIndex: 0,
  currentPhase: 1,
  score: 10000,
  failedAttempts: 0,
  hintsUsed: 0,
  hintsRemaining: 3,
  inventory: [],
  solvedPuzzles: [],
  startTime: null,
  timeRemaining: GAME_CONFIG.totalTime,
  isRunning: false,
  isEnded: false,
  eventsFired: new Set(),
  puzzleAttempts: {},   // id → count
  puzzleStartTime: {},  // id → timestamp

  get progress() {
    return this.currentPuzzleIndex / PUZZLES.length;
  }
};

/* ============================================================
   TIMER ENGINE
   ============================================================ */
const TimerEngine = {
  interval: null,

  start() {
    this.interval = setInterval(() => {
      if (!GameState.isRunning) return;

      GameState.timeRemaining--;

      // Penalización de tiempo en score
      if (GameState.timeRemaining % 60 === 0) {
        GameState.score = Math.max(0, GameState.score - GAME_CONFIG.timePenalty);
      }

      UIController.updateTimer();
      EventSystem.checkEvents();

      if (GameState.timeRemaining <= 0) {
        this.stop();
        EndingSystem.trigger('timeout');
      }
    }, 1000);
  },

  stop() {
    clearInterval(this.interval);
    GameState.isRunning = false;
  },

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
};

/* ============================================================
   HINT SYSTEM
   ============================================================ */
const HintSystem = {
  hintIndexes: {},  // puzzleId → next hint index

  getHint(puzzleId) {
    const hints = HINTS[puzzleId];
    if (!hints) return 'No hay pistas disponibles para este puzzle.';

    const idx = this.hintIndexes[puzzleId] || 0;
    const hint = hints[Math.min(idx, hints.length - 1)];
    this.hintIndexes[puzzleId] = idx + 1;
    return hint;
  },

  isExhausted(puzzleId) {
    const hints = HINTS[puzzleId];
    if (!hints) return true;
    return (this.hintIndexes[puzzleId] || 0) >= hints.length;
  },

  getLevel(puzzleId) {
    return this.hintIndexes[puzzleId] || 0;
  }
};

/* ============================================================
   EVENT SYSTEM
   ============================================================ */
const EventSystem = {
  checkEvents() {
    for (const event of DYNAMIC_EVENTS) {
      if (!GameState.eventsFired.has(event.triggerTime) &&
          GameState.timeRemaining <= event.triggerTime) {
        GameState.eventsFired.add(event.triggerTime);
        this.fire(event);
      }
    }
  },

  fire(event) {
    // Añadir al log narrativo
    addLog(`⚡ ${event.title}`, 'event');

    // Mostrar alerta
    const alertEl = document.getElementById('eventAlert');
    document.getElementById('eventAlertTitle').textContent = event.title;
    document.getElementById('eventAlertMsg').textContent = event.message;

    // Estilo según tipo
    const inner = alertEl.querySelector('.event-alert-inner');
    inner.style.borderColor = event.type === 'danger' ? 'var(--text-danger)' :
                               event.type === 'prometheus' ? 'var(--accent-purple)' :
                               'var(--text-warn)';

    alertEl.classList.remove('hidden');

    // Vibración de pantalla
    document.body.style.animation = 'none';
    setTimeout(() => {
      document.body.style.animation = 'screenGlitch 0.3s ease';
    }, 10);
  }
};

/* ============================================================
   INVENTORY SYSTEM
   ============================================================ */
function addInventoryItem(item) {
  if (!GameState.inventory.includes(item)) {
    GameState.inventory.push(item);
    UIController.renderInventory();
  }
}

/* ============================================================
   LOG SYSTEM
   ============================================================ */
function addLog(message, type = 'system') {
  const log = document.getElementById('narrativeLog');
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;

  const time = TimerEngine.formatTime(GAME_CONFIG.totalTime - GameState.timeRemaining);
  entry.textContent = `[${time}] ${message}`;
  log.appendChild(entry);

  // Auto-scroll
  log.scrollTop = log.scrollHeight;

  // Limitar entradas
  if (log.children.length > 50) {
    log.removeChild(log.firstChild);
  }
}

/* ============================================================
   UI CONTROLLER
   ============================================================ */
const UIController = {
  updateTimer() {
    const el = document.getElementById('mainTimer');
    const t = GameState.timeRemaining;
    el.textContent = TimerEngine.formatTime(t);

    // Cambio de color
    el.className = 'main-timer';
    if (t <= 600) el.classList.add('danger');
    else if (t <= 1800) el.classList.add('warning');

    // Actualizar score
    document.getElementById('hudScore').textContent = GameState.score.toLocaleString();
  },

  updateProgress() {
    const pct = (GameState.currentPuzzleIndex / PUZZLES.length) * 100;
    document.getElementById('progressBar').style.width = pct + '%';
    document.getElementById('hudPhase').textContent = `${GameState.currentPhase}/4`;
  },

  updatePhaseStatus() {
    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById(`status-phase${i}`);
      if (!el) continue;
      el.className = 'status-item';
      if (i < GameState.currentPhase) el.classList.add('done');
      else if (i === GameState.currentPhase) el.classList.add('active');
      else el.classList.add('locked');
    }
  },

  updateFailedAttempts() {
    const pct = (GameState.failedAttempts / GAME_CONFIG.maxFails) * 100;
    document.getElementById('failFill').style.width = pct + '%';
    document.getElementById('failText').textContent =
      `${GameState.failedAttempts} / ${GAME_CONFIG.maxFails} máx.`;
  },

  renderInventory() {
    const inv = document.getElementById('inventory');
    if (GameState.inventory.length === 0) {
      inv.innerHTML = '<div class="inv-empty">Sin elementos.</div>';
      return;
    }
    inv.innerHTML = GameState.inventory.map(item =>
      `<div class="inv-item" title="${item}">${item}</div>`
    ).join('');
  },

  updateHintCount() {
    const diff = GameState.difficulty;
    const max = diff === 'easy' ? 5 : diff === 'hard' ? 1 : 3;
    GameState.hintsRemaining = max - GameState.hintsUsed;
    document.getElementById('hintCount').textContent =
      `(${Math.max(0, GameState.hintsRemaining)} disp.)`;
  }
};

/* ============================================================
   PUZZLE ENGINE — Renderizado
   ============================================================ */
const PuzzleEngine = {

  render(puzzle) {
    const container = document.getElementById('puzzleContainer');
    container.innerHTML = '';
    container.className = 'puzzle-container';

    // Registrar tiempo de inicio del puzzle
    GameState.puzzleStartTime[puzzle.id] = Date.now();
    if (!GameState.puzzleAttempts[puzzle.id]) {
      GameState.puzzleAttempts[puzzle.id] = 0;
    }

    // Header
    const header = document.createElement('div');
    header.className = 'puzzle-header';
    header.innerHTML = `
      <div class="puzzle-phase-tag">${puzzle.phaseTag}</div>
      <div class="puzzle-title">${puzzle.title}</div>
      <div class="puzzle-description">${puzzle.description.replace(/\n/g, '<br>')}</div>
    `;
    container.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'puzzle-body';

    // Renderizar por tipo
    switch (puzzle.type) {
      case 'split':    this.renderSplit(body, puzzle); break;
      case 'cipher':   this.renderCipher(body, puzzle); break;
      case 'sequence': this.renderSequence(body, puzzle); break;
      case 'email':    this.renderEmail(body, puzzle); break;
      case 'grid':     this.renderGrid(body, puzzle); break;
      case 'wires':    this.renderWires(body, puzzle); break;
      case 'terminal': this.renderTerminal(body, puzzle); break;
      case 'numpad':   this.renderNumpad(body, puzzle); break;
      case 'pattern':  this.renderPattern(body, puzzle); break;
      case 'finalcode':this.renderFinalCode(body, puzzle); break;
    }

    container.appendChild(body);

    // Feedback placeholder
    const fb = document.createElement('div');
    fb.id = 'puzzleFeedback';
    fb.className = 'feedback-msg';
    container.appendChild(fb);

    // Auto-hint si lleva mucho tiempo
    this.scheduleAutoHint(puzzle);
  },

  scheduleAutoHint(puzzle) {
    const diff = GameState.difficulty;
    const delay = diff === 'easy' ? 5 * 60000 : diff === 'hard' ? 20 * 60000 : 10 * 60000;

    clearTimeout(this._autoHintTimer);
    this._autoHintTimer = setTimeout(() => {
      if (GameState.solvedPuzzles.includes(puzzle.id)) return;
      const hintText = HintSystem.getHint(puzzle.id);
      showFeedback(hintText, 'hint');
      addLog(`💡 Pista automática para: ${puzzle.title}`, 'event');
    }, delay);
  },

  // ── SPLIT: archivo + login ──
  renderSplit(body, puzzle) {
    puzzle.parts.forEach(part => {
      if (part.type === 'file') {
        const block = document.createElement('div');
        block.innerHTML = `
          <div class="file-viewer">
            <div class="file-viewer-header">
              <span>📄 ${part.filename}</span>
              <span>read-only</span>
            </div>
            <pre class="file-content">${part.content}</pre>
          </div>
        `;
        body.appendChild(block);
      }

      if (part.type === 'login') {
        const block = document.createElement('div');
        block.innerHTML = `<div class="cipher-label">${part.label}</div>`;
        const formHtml = part.fields.map(f => `
          <div class="input-group">
            <div class="input-label">${f.label}</div>
            <input type="${f.isPassword ? 'password' : 'text'}"
                   id="field-${f.id}"
                   class="puzzle-input"
                   placeholder="${f.placeholder}"
                   autocomplete="off"
                   onkeydown="if(event.key==='Enter') submitSplitLogin('${puzzle.id}')" />
          </div>
        `).join('');
        block.innerHTML += formHtml;
        block.innerHTML += `
          <button class="puzzle-submit" onclick="submitSplitLogin('${puzzle.id}')">
            ▶ AUTENTICAR
          </button>
        `;
        body.appendChild(block);
      }
    });
  },

  // ── CIPHER ──
  renderCipher(body, puzzle) {
    body.innerHTML = `
      <div class="cipher-label">// TEXTO CIFRADO //</div>
      <div class="cipher-display">${puzzle.cipherText}</div>
      ${puzzle.hint ? `<div class="feedback-msg hint show" style="display:block">${puzzle.hint}</div>` : ''}
      <div class="input-group mt-16">
        <div class="input-label">${puzzle.instruction}</div>
        <input type="text" id="cipher-input" class="puzzle-input" placeholder="TU RESPUESTA..."
               onkeydown="if(event.key==='Enter') submitAnswer('${puzzle.id}', document.getElementById('cipher-input').value)">
      </div>
      <button class="puzzle-submit" onclick="submitAnswer('${puzzle.id}', document.getElementById('cipher-input').value)">
        ▶ VERIFICAR DESCIFRADO
      </button>
    `;
  },

  // ── SEQUENCE ──
  renderSequence(body, puzzle) {
    const seqHtml = puzzle.sequence.map((n, i) => {
      const isUnknown = n === '?';
      return `<div class="seq-item ${isUnknown ? 'unknown' : 'known'}">${n}</div>`;
    }).join('');

    body.innerHTML = `
      <div class="cipher-label">// SECUENCIA DE VERIFICACIÓN //</div>
      <div class="sequence-display">${seqHtml}</div>
      <div class="input-group mt-16">
        <div class="input-label">${puzzle.instruction}</div>
        <input type="number" id="seq-input" class="puzzle-input" placeholder="NÚMERO SIGUIENTE..."
               onkeydown="if(event.key==='Enter') submitAnswer('${puzzle.id}', document.getElementById('seq-input').value)">
      </div>
      <button class="puzzle-submit" onclick="submitAnswer('${puzzle.id}', document.getElementById('seq-input').value)">
        ▶ CONFIRMAR SECUENCIA
      </button>
    `;
  },

  // ── EMAIL ──
  renderEmail(body, puzzle) {
    const emailListHtml = puzzle.emails.map((e, i) => `
      <div class="email-item ${e.unread ? 'unread' : ''}" onclick="toggleEmail(${i})">
        <span class="email-from">${e.from}</span>
        <span class="email-time">${e.time}</span>
        <span class="email-subject">${e.subject}</span>
      </div>
      <div class="email-body" id="email-body-${i}">${e.body}</div>
    `).join('');

    body.innerHTML = `
      <div class="email-panel">
        <div class="email-toolbar">
          <span>📧 NEXUS MAIL</span>
          <span>${puzzle.emails.filter(e=>e.unread).length} sin leer</span>
        </div>
        <div class="email-list">${emailListHtml}</div>
      </div>
      <div class="input-group mt-16">
        <div class="input-label">${puzzle.instruction}</div>
        <input type="text" id="email-code-input" class="puzzle-input" placeholder="CÓDIGO DE 6 DÍGITOS..."
               onkeydown="if(event.key==='Enter') submitAnswer('${puzzle.id}', document.getElementById('email-code-input').value)">
      </div>
      <button class="puzzle-submit" onclick="submitAnswer('${puzzle.id}', document.getElementById('email-code-input').value)">
        ▶ INTRODUCIR CÓDIGO
      </button>
    `;
  },

  // ── GRID ──
  renderGrid(body, puzzle) {
    const size = puzzle.gridSize;
    const totalCells = size * size;
    let selectedCells = new Set();

    const gridEl = document.createElement('div');
    gridEl.className = 'grid-puzzle';
    gridEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    gridEl.style.maxWidth = `${size * 72}px`;

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.style.width = '64px';
      cell.textContent = i + 1;
      cell.dataset.idx = i;
      cell.addEventListener('click', () => {
        if (selectedCells.has(i)) {
          selectedCells.delete(i);
          cell.classList.remove('selected');
        } else {
          selectedCells.add(i);
          cell.classList.add('selected');
        }
      });
      gridEl.appendChild(cell);
    }

    body.appendChild(gridEl);

    const inst = document.createElement('div');
    inst.className = 'input-group mt-16';
    inst.innerHTML = `<div class="input-label">${puzzle.instruction}</div>`;
    body.appendChild(inst);

    const btn = document.createElement('button');
    btn.className = 'puzzle-submit';
    btn.textContent = '▶ CONFIRMAR CONFIGURACIÓN';
    btn.addEventListener('click', () => {
      const selected = Array.from(selectedCells).sort((a,b)=>a-b);
      const correct = [...puzzle.correctPattern].sort((a,b)=>a-b);
      const isCorrect = JSON.stringify(selected) === JSON.stringify(correct);
      if (isCorrect) {
        solvePuzzle(puzzle);
      } else {
        handleFail(puzzle.id);
        showFeedback('Configuración incorrecta. Los nodos activos no forman el patrón correcto.', 'error');
      }
    });
    body.appendChild(btn);
  },

  // ── WIRES ──
  renderWires(body, puzzle) {
    // Estado de conexiones
    const connections = {};
    let selectedWire = null;

    const container = document.createElement('div');
    container.className = 'wires-container';
    container.innerHTML = `<div class="input-label" style="margin-bottom:12px">${puzzle.instruction}</div>`;

    // Área de cables
    const wiresArea = document.createElement('div');
    wiresArea.style.display = 'flex';
    wiresArea.style.gap = '30px';
    wiresArea.style.alignItems = 'flex-start';

    // Columna izquierda: cables
    const leftCol = document.createElement('div');
    leftCol.style.display = 'flex';
    leftCol.style.flexDirection = 'column';
    leftCol.style.gap = '12px';

    puzzle.wires.forEach(wire => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '8px';

      row.innerHTML = `
        <div class="wire-connector" id="wire-${wire.id}"
             style="border-color:${wire.color}; color:${wire.color}"
             onclick="selectWire_${puzzle.id.replace('-','_')}('${wire.id}')"></div>
        <div class="wire-line" style="color:${wire.color}"></div>
        <span style="font-size:0.75rem; color:var(--text-dim)">
          ${wire.label} (${wire.freq})
        </span>
      `;
      leftCol.appendChild(row);
    });

    // Columna derecha: receptores
    const rightCol = document.createElement('div');
    rightCol.style.display = 'flex';
    rightCol.style.flexDirection = 'column';
    rightCol.style.gap = '12px';

    puzzle.receptors.forEach(rec => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '8px';

      row.innerHTML = `
        <span style="font-size:0.7rem; color:var(--text-dim); width:60px">${rec}</span>
        <div class="wire-connector" id="rec-${rec}"
             style="border-color:var(--border-dim)"
             onclick="connectToReceptor_${puzzle.id.replace('-','_')}('${rec}')"></div>
      `;
      rightCol.appendChild(row);
    });

    wiresArea.appendChild(leftCol);
    wiresArea.appendChild(rightCol);
    container.appendChild(wiresArea);

    // Mostrar conexiones actuales
    const connDisplay = document.createElement('div');
    connDisplay.id = 'wire-connections-display';
    connDisplay.style.cssText = 'margin-top:14px; font-size:0.75rem; color:var(--text-dim); display:flex; flex-wrap:wrap; gap:8px;';
    container.appendChild(connDisplay);

    body.appendChild(container);

    const btn = document.createElement('button');
    btn.className = 'puzzle-submit';
    btn.style.marginTop = '12px';
    btn.textContent = '▶ VERIFICAR CONEXIONES';
    btn.addEventListener('click', () => {
      // Verificar
      let allCorrect = true;
      for (const wire of puzzle.wires) {
        if (connections[wire.id] !== puzzle.correctConnections[wire.id]) {
          allCorrect = false;
          break;
        }
      }
      if (allCorrect && Object.keys(connections).length === puzzle.wires.length) {
        solvePuzzle(puzzle);
      } else {
        handleFail(puzzle.id);
        showFeedback(`Conexiones incorrectas. ${Object.keys(connections).length}/${puzzle.wires.length} cables conectados.`, 'error');
      }
    });
    body.appendChild(btn);

    // Añadir funciones de interacción al scope global
    window[`selectWire_${puzzle.id.replace('-','_')}`] = (wireId) => {
      selectedWire = wireId;
      document.querySelectorAll('.wire-connector').forEach(el => el.classList.remove('selected'));
      const el = document.getElementById(`wire-${wireId}`);
      if (el) el.classList.add('selected');
    };

    window[`connectToReceptor_${puzzle.id.replace('-','_')}`] = (recId) => {
      if (!selectedWire) {
        showFeedback('Primero selecciona un cable (columna izquierda).', 'hint');
        return;
      }
      // Desconectar si ya estaba conectado
      for (const [w, r] of Object.entries(connections)) {
        if (r === recId) delete connections[w];
      }
      connections[selectedWire] = recId;

      // Colorear el receptor
      const wire = puzzle.wires.find(w => w.id === selectedWire);
      const recEl = document.getElementById(`rec-${recId}`);
      if (recEl && wire) {
        recEl.style.borderColor = wire.color;
        recEl.style.backgroundColor = wire.color + '33';
      }

      // Actualizar display
      connDisplay.innerHTML = Object.entries(connections)
        .map(([w,r]) => {
          const wd = puzzle.wires.find(x=>x.id===w);
          return `<span style="color:${wd?.color}">${wd?.label}→${r}</span>`;
        }).join(' | ');

      selectedWire = null;
      document.querySelectorAll('.wire-connector').forEach(el => el.classList.remove('selected'));
    };
  },

  // ── TERMINAL ──
  renderTerminal(body, puzzle) {
    const termDiv = document.createElement('div');
    termDiv.className = 'terminal-puzzle';
    termDiv.innerHTML = `
      <div class="terminal-output" id="term-output">
        <div class="terminal-output-line sys">PROMETHEUS CORE TERMINAL v2.1</div>
        <div class="terminal-output-line sys">Conexión segura establecida. Usuario: nexus_operator</div>
        <div class="terminal-output-line sys">Escribe 'help' para ver comandos disponibles.</div>
        <div class="terminal-output-line sys">─────────────────────────────────────</div>
      </div>
      <div class="terminal-input-row">
        <span class="terminal-prompt-label">root@prometheus:~$</span>
        <input type="text" class="terminal-cmd-input" id="term-input"
               autocomplete="off" spellcheck="false"
               onkeydown="handleTerminalInput(event, '${puzzle.id}')" />
      </div>
    `;
    body.appendChild(termDiv);
    setTimeout(() => document.getElementById('term-input')?.focus(), 100);
  },

  // ── NUMPAD ──
  renderNumpad(body, puzzle) {
    let code = '';
    const maxLen = puzzle.answer.length;

    const wrapper = document.createElement('div');

    const display = document.createElement('div');
    display.className = 'numpad-display';
    display.id = 'numpad-display';
    display.textContent = '_ _ _ _ _ _';

    const padGrid = document.createElement('div');
    padGrid.className = 'numpad';

    const updateDisplay = () => {
      const padded = code.split('').join(' ');
      const blanks = Array(maxLen - code.length).fill('_').join(' ');
      display.textContent = padded + (blanks ? ' ' + blanks : '');
    };

    const digits = ['1','2','3','4','5','6','7','8','9'];
    digits.forEach(d => {
      const btn = document.createElement('button');
      btn.className = 'numpad-btn';
      btn.textContent = d;
      btn.addEventListener('click', () => {
        if (code.length < maxLen) { code += d; updateDisplay(); }
      });
      padGrid.appendChild(btn);
    });

    // Fila inferior
    const clrBtn = document.createElement('button');
    clrBtn.className = 'numpad-btn clear';
    clrBtn.textContent = 'CLR';
    clrBtn.addEventListener('click', () => { code = ''; updateDisplay(); });

    const zeroBtn = document.createElement('button');
    zeroBtn.className = 'numpad-btn';
    zeroBtn.textContent = '0';
    zeroBtn.addEventListener('click', () => {
      if (code.length < maxLen) { code += '0'; updateDisplay(); }
    });

    const enterBtn = document.createElement('button');
    enterBtn.className = 'numpad-btn';
    enterBtn.textContent = 'OK';
    enterBtn.style.color = 'var(--border-glow)';
    enterBtn.addEventListener('click', () => {
      submitAnswer(puzzle.id, code);
    });

    padGrid.appendChild(clrBtn);
    padGrid.appendChild(zeroBtn);
    padGrid.appendChild(enterBtn);

    const inst = document.createElement('div');
    inst.className = 'input-label';
    inst.style.marginBottom = '10px';
    inst.textContent = puzzle.instruction;

    wrapper.appendChild(inst);
    wrapper.appendChild(display);
    wrapper.appendChild(padGrid);
    body.appendChild(wrapper);
  },

  // ── PATTERN ──
  renderPattern(body, puzzle) {
    const sequence = [];
    let completed = false;

    const inst = document.createElement('div');
    inst.className = 'input-label';
    inst.style.marginBottom = '12px';
    inst.textContent = puzzle.instruction;
    body.appendChild(inst);

    const seqDisplay = document.createElement('div');
    seqDisplay.style.cssText = 'font-size:0.8rem; color:var(--text-dim); margin-bottom:12px; min-height:24px;';
    seqDisplay.id = 'pattern-seq-display';
    seqDisplay.textContent = 'Secuencia: (vacía)';
    body.appendChild(seqDisplay);

    const grid = document.createElement('div');
    grid.className = 'pattern-grid';
    grid.style.gridTemplateColumns = `repeat(${puzzle.gridCols}, 64px)`;
    grid.style.gap = '6px';
    grid.style.maxWidth = `${puzzle.gridCols * 70}px`;

    puzzle.cells.forEach(cell => {
      const el = document.createElement('div');
      el.className = 'pattern-cell dim';
      el.style.width = '64px';
      el.style.height = '64px';
      el.textContent = cell.label;
      el.dataset.id = cell.id;

      el.addEventListener('click', () => {
        if (completed) return;
        sequence.push(cell.id);
        el.classList.remove('dim');
        el.classList.add('lit');
        setTimeout(() => { el.classList.remove('lit'); el.classList.add('dim'); }, 600);

        seqDisplay.textContent = `Secuencia: [${sequence.map(i => puzzle.cells[i].label).join(' → ')}]`;

        if (sequence.length === puzzle.correctSequence.length) {
          completed = true;
          const isCorrect = sequence.every((v,i) => v === puzzle.correctSequence[i]);
          if (isCorrect) {
            solvePuzzle(puzzle);
          } else {
            handleFail(puzzle.id);
            showFeedback('Secuencia incorrecta. Inténtalo de nuevo.', 'error');
            setTimeout(() => {
              sequence.length = 0;
              completed = false;
              seqDisplay.textContent = 'Secuencia: (vacía)';
            }, 1500);
          }
        }
      });
      grid.appendChild(el);
    });

    body.appendChild(grid);

    const resetBtn = document.createElement('button');
    resetBtn.className = 'puzzle-submit';
    resetBtn.style.marginTop = '12px';
    resetBtn.textContent = '↺ REINICIAR SECUENCIA';
    resetBtn.addEventListener('click', () => {
      sequence.length = 0;
      completed = false;
      seqDisplay.textContent = 'Secuencia: (vacía)';
      grid.querySelectorAll('.pattern-cell').forEach(el => {
        el.className = 'pattern-cell dim';
      });
    });
    body.appendChild(resetBtn);
  },

  // ── FINAL CODE ──
  renderFinalCode(body, puzzle) {
    body.innerHTML = `
      <div style="text-align:center; padding: 20px 0;">
        <div style="font-family:var(--font-display); font-size:3rem; color:var(--text-danger); text-shadow:var(--glow-red); margin-bottom:20px; animation: timerPulse 1s infinite;">
          ☢
        </div>
        <div style="font-family:var(--font-display); font-size:1.1rem; color:var(--text-danger); letter-spacing:0.2em; margin-bottom:24px;">
          SISTEMA DE DESTRUCCIÓN EN ESPERA
        </div>
      </div>
      ${puzzle.hint ? `<div class="feedback-msg hint show" style="display:block; margin-bottom:16px">${puzzle.hint}</div>` : ''}
      <div class="input-group">
        <div class="input-label">${puzzle.instruction}</div>
        <input type="text" id="final-input" class="puzzle-input"
               style="font-size:1.4rem; text-align:center; letter-spacing:0.4em"
               placeholder="CÓDIGO DE DESTRUCCIÓN..."
               onkeydown="if(event.key==='Enter') submitAnswer('${puzzle.id}', document.getElementById('final-input').value)">
      </div>
      <button class="puzzle-submit" style="background:rgba(255,58,58,0.1); border-color:var(--text-danger); color:var(--text-danger); width:100%; justify-content:center; font-size:1rem; padding:16px;"
              onclick="submitAnswer('${puzzle.id}', document.getElementById('final-input').value)">
        ☢ EJECUTAR DESTRUCCIÓN DE PROMETHEUS
      </button>
    `;
  }
};

/* ============================================================
   PUZZLE LOGIC — Submit, validate, solve
   ============================================================ */

function submitAnswer(puzzleId, answer) {
  const puzzle = PUZZLES.find(p => p.id === puzzleId);
  if (!puzzle || GameState.solvedPuzzles.includes(puzzleId)) return;

  const cleaned = answer.toString().trim();
  const correct = puzzle.caseSensitive
    ? cleaned === puzzle.answer
    : cleaned.toUpperCase() === puzzle.answer.toUpperCase();

  if (correct) {
    solvePuzzle(puzzle);
  } else {
    handleFail(puzzleId);
    const msgs = [
      'Respuesta incorrecta. Vuelve a analizar los datos.',
      'No es correcto. PROMETHEUS no detecta la clave válida.',
      'Fallo de autenticación. Intenta otro enfoque.',
      'Código rechazado. Revisa tu razonamiento.',
    ];
    showFeedback(msgs[GameState.puzzleAttempts[puzzleId] % msgs.length], 'error');

    // Input shake
    const inputs = document.querySelectorAll('.puzzle-input, #final-input, #cipher-input, #seq-input, #email-code-input');
    inputs.forEach(el => {
      el.classList.add('error');
      setTimeout(() => el.classList.remove('error'), 600);
    });
  }
}

function submitSplitLogin(puzzleId) {
  const puzzle = PUZZLES.find(p => p.id === puzzleId);
  if (!puzzle) return;

  const loginPart = puzzle.parts.find(p => p.type === 'login');
  if (!loginPart) return;

  const vals = {};
  loginPart.fields.forEach(f => {
    const el = document.getElementById(`field-${f.id}`);
    if (el) vals[f.id] = el.value.trim();
  });

  if (loginPart.validate(vals)) {
    solvePuzzle(puzzle);
  } else {
    handleFail(puzzleId);
    showFeedback('Credenciales inválidas. Acceso denegado.', 'error');
    document.querySelectorAll('.puzzle-input').forEach(el => {
      el.classList.add('error');
      setTimeout(() => el.classList.remove('error'), 600);
    });
  }
}

function handleTerminalInput(event, puzzleId) {
  if (event.key !== 'Enter') return;

  const input = document.getElementById('term-input');
  const cmd = input.value.trim();
  if (!cmd) return;

  const puzzle = PUZZLES.find(p => p.id === puzzleId);
  const output = document.getElementById('term-output');

  // Mostrar comando
  const cmdLine = document.createElement('div');
  cmdLine.className = 'terminal-output-line cmd';
  cmdLine.textContent = `root@prometheus:~$ ${cmd}`;
  output.appendChild(cmdLine);

  // Buscar respuesta
  const cmdKey = cmd.toLowerCase();
  const response = puzzle.commands[cmdKey] || puzzle.commands[cmd];

  if (response) {
    const outLine = document.createElement('div');
    outLine.className = `terminal-output-line ${response.type}`;
    outLine.style.whiteSpace = 'pre-wrap';
    outLine.innerHTML = response.output;
    output.appendChild(outLine);

    if (response.special === 'solve') {
      setTimeout(() => solvePuzzle(puzzle), 800);
    }
  } else {
    const errLine = document.createElement('div');
    errLine.className = 'terminal-output-line err';
    errLine.textContent = `bash: ${cmd}: command not found`;
    output.appendChild(errLine);
    handleFail(puzzleId);
  }

  output.scrollTop = output.scrollHeight;
  input.value = '';
}

function solvePuzzle(puzzle) {
  if (GameState.solvedPuzzles.includes(puzzle.id)) return;

  GameState.solvedPuzzles.push(puzzle.id);

  // Bonus por velocidad
  const timeSpent = Date.now() - (GameState.puzzleStartTime[puzzle.id] || Date.now());
  const attempts = GameState.puzzleAttempts[puzzle.id] || 0;
  const bonus = Math.max(100, 1000 - attempts * 200 - Math.floor(timeSpent/10000)*50);
  GameState.score += bonus;

  addLog(`✓ ${puzzle.title} — completado. +${bonus} pts`, 'success');

  // Feedback visual
  showFeedback(`✓ CORRECTO — +${bonus} puntos. ${getPhraseForSolve(attempts)}`, 'success');

  // Callback del puzzle
  if (puzzle.onSolve) puzzle.onSolve();

  // Avanzar
  setTimeout(() => {
    GameState.currentPuzzleIndex++;

    if (puzzle.isFinal || GameState.currentPuzzleIndex >= PUZZLES.length) {
      EndingSystem.trigger('victory');
    } else {
      const nextPuzzle = PUZZLES[GameState.currentPuzzleIndex];

      // ¿Cambio de fase?
      if (nextPuzzle.phase !== GameState.currentPhase) {
        GameState.currentPhase = nextPuzzle.phase;
        addLog(`>> FASE ${GameState.currentPhase} INICIADA`, 'event');
        showPhaseTransition(GameState.currentPhase, () => {
          UIController.updatePhaseStatus();
          PuzzleEngine.render(nextPuzzle);
        });
      } else {
        PuzzleEngine.render(nextPuzzle);
      }

      UIController.updateProgress();
      UIController.updatePhaseStatus();
    }
  }, 1800);
}

function handleFail(puzzleId) {
  if (!GameState.puzzleAttempts[puzzleId]) GameState.puzzleAttempts[puzzleId] = 0;
  GameState.puzzleAttempts[puzzleId]++;
  GameState.failedAttempts++;

  GameState.score = Math.max(0, GameState.score - GAME_CONFIG.failPenalty);
  UIController.updateFailedAttempts();

  if (GameState.failedAttempts >= GAME_CONFIG.maxFails) {
    EndingSystem.trigger('maxfails');
  }

  // Auto-pista si hay muchos errores
  if (GameState.puzzleAttempts[puzzleId] >= 4 && !GameState.isEnded) {
    const puzzle = PUZZLES.find(p => p.id === puzzleId);
    const hintText = HintSystem.getHint(puzzleId);
    setTimeout(() => {
      if (!GameState.solvedPuzzles.includes(puzzleId)) {
        showFeedback(`💡 PISTA AUTOMÁTICA: ${hintText}`, 'hint');
      }
    }, 500);
  }
}

function getPhraseForSolve(attempts) {
  if (attempts === 0) return 'Perfecto a la primera.';
  if (attempts <= 2) return 'Buen trabajo.';
  if (attempts <= 4) return 'Lo conseguiste.';
  return 'Nunca te rendiste.';
}

/* ============================================================
   PHASE TRANSITION
   ============================================================ */
function showPhaseTransition(phaseNum, callback) {
  const phaseNames = ['', 'ACCESO INICIAL', 'NÚCLEO INTERNO', 'PROTOCOLO CHIMERA', 'DESTRUCCIÓN'];
  const colors = ['', 'var(--border-glow)', 'var(--accent-cyan)', 'var(--text-warn)', 'var(--text-danger)'];

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 7000;
    background: rgba(0,0,0,0.92);
    display: flex; align-items: center; justify-content: center;
    animation: alertFadeIn 0.3s ease;
  `;
  overlay.innerHTML = `
    <div style="text-align:center">
      <div style="font-size:0.8rem; color:var(--text-dim); letter-spacing:0.3em; margin-bottom:12px">FASE ${phaseNum} DESBLOQUEADA</div>
      <div style="font-family:var(--font-display); font-size:2.5rem; font-weight:900; color:${colors[phaseNum]}; text-shadow: 0 0 20px ${colors[phaseNum]}; letter-spacing:0.15em">
        ${phaseNames[phaseNum]}
      </div>
      <div style="margin-top:16px; font-size:0.8rem; color:var(--text-dim)">Cargando siguiente protocolo...</div>
    </div>
  `;
  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.5s';
    setTimeout(() => {
      document.body.removeChild(overlay);
      callback();
    }, 500);
  }, 2500);
}

/* ============================================================
   FEEDBACK
   ============================================================ */
function showFeedback(message, type) {
  const fb = document.getElementById('puzzleFeedback');
  if (!fb) return;
  fb.textContent = message;
  fb.className = `feedback-msg ${type} show`;
  setTimeout(() => fb.classList.remove('show'), type === 'success' ? 3000 : 5000);
}

/* ============================================================
   UI HELPERS
   ============================================================ */
function toggleEmail(idx) {
  const body = document.getElementById(`email-body-${idx}`);
  if (!body) return;
  body.classList.toggle('open');
}

function closeEventAlert() {
  document.getElementById('eventAlert').classList.add('hidden');
}

function requestHint() {
  if (GameState.hintsUsed >= (GameState.difficulty === 'easy' ? 5 : GameState.difficulty === 'hard' ? 1 : 3)) {
    document.getElementById('hintText').textContent = 'Has agotado todas las pistas disponibles para esta dificultad.';
    document.getElementById('hintCost').textContent = '';
    document.getElementById('hintModal').classList.remove('hidden');
    return;
  }

  const currentPuzzle = PUZZLES[GameState.currentPuzzleIndex];
  if (!currentPuzzle) return;

  GameState.hintsUsed++;
  GameState.score = Math.max(0, GameState.score - GAME_CONFIG.hintPenalty);
  UIController.updateHintCount();

  const hintText = HintSystem.getHint(currentPuzzle.id);
  const level = HintSystem.getLevel(currentPuzzle.id);

  document.getElementById('hintText').textContent = hintText;
  document.getElementById('hintCost').textContent =
    `Pista nivel ${level} — Coste: -${GAME_CONFIG.hintPenalty} puntos | Pistas restantes: ${Math.max(0,GameState.hintsRemaining-1)}`;

  document.getElementById('hintModal').classList.remove('hidden');
  addLog(`💡 Pista solicitada para: ${currentPuzzle.title}`, 'event');
}

function closeHint() {
  document.getElementById('hintModal').classList.add('hidden');
}

function toggleNotes() {
  const notes = document.getElementById('agentNotes');
  notes.focus();
}

function confirmAbort() {
  if (confirm('¿Seguro que quieres abortar la misión? Tu progreso se perderá.')) {
    EndingSystem.trigger('abort');
  }
}

function replayGame() {
  sessionStorage.removeItem('agentName');
  sessionStorage.removeItem('difficulty');
  window.location.href = 'index.html';
}

/* ============================================================
   ENDING SYSTEM
   ============================================================ */
const EndingSystem = {
  trigger(type) {
    if (GameState.isEnded) return;
    GameState.isEnded = true;
    TimerEngine.stop();

    const timeUsed = GAME_CONFIG.totalTime - GameState.timeRemaining;
    const timeStr = TimerEngine.formatTime(timeUsed);
    const puzzlesSolved = GameState.solvedPuzzles.length;

    let endingData;

    if (type === 'victory') {
      const timeBonus = GameState.timeRemaining * 5;
      GameState.score += timeBonus;

      endingData = {
        icon: '☢',
        title: 'PROMETHEUS DESTRUIDO',
        class: 'victory',
        text: `Misión completada, Agente ${GameState.agentName}.\n\nHas penetrado todas las capas de seguridad de PROMETHEUS y ejecutado el protocolo de destrucción con éxito. Las ciudades están a salvo.\n\n¿Pero quién es NEXUS_7? ¿Por qué te ayudó? Algunas preguntas permanecerán sin respuesta...`
      };
    } else if (type === 'timeout') {
      endingData = {
        icon: '💀',
        title: 'PROTOCOLO CHIMERA ACTIVO',
        class: 'defeat',
        text: `El tiempo se agotó, Agente ${GameState.agentName}.\n\nPROMETHEUS ha ejecutado el Protocolo CHIMERA. 47 ciudades han perdido el suministro eléctrico. Los sistemas de respuesta de emergencia están sobrecargados.\n\nLlegaste al ${Math.round((puzzlesSolved/PUZZLES.length)*100)}% de la misión. Tan cerca...`
      };
    } else if (type === 'maxfails') {
      endingData = {
        icon: '🔒',
        title: 'SISTEMA BLOQUEADO',
        class: 'defeat',
        text: `Demasiados intentos fallidos, Agente ${GameState.agentName}.\n\nPROMETHEUS ha detectado tus errores y bloqueado todos los accesos. Los sistemas de seguridad han sido reiniciados y tu presencia, registrada.\n\nUn agente fantasma no comete errores.`
      };
    } else if (type === 'abort') {
      endingData = {
        icon: '🚫',
        title: 'MISIÓN ABANDONADA',
        class: 'partial',
        text: `Has abandonado la misión, Agente ${GameState.agentName}.\n\nPROMETHEUS continúa activo. Tu decisión tendrá consecuencias.`
      };
    }

    // Mostrar modal
    const modal = document.getElementById('endingModal');
    modal.classList.remove('hidden');
    modal.querySelector('.ending-inner').className = `ending-inner ${endingData.class}`;
    document.getElementById('endingIcon').textContent = endingData.icon;
    document.getElementById('endingTitle').textContent = endingData.title;
    document.getElementById('endingText').textContent = endingData.text;

    document.getElementById('endingStats').innerHTML = `
      <div class="ending-stat">
        <div class="ending-stat-num" style="color:var(--text-primary)">${GameState.score.toLocaleString()}</div>
        <div class="ending-stat-label">PUNTUACIÓN</div>
      </div>
      <div class="ending-stat">
        <div class="ending-stat-num" style="color:var(--accent-cyan)">${puzzlesSolved}/${PUZZLES.length}</div>
        <div class="ending-stat-label">PUZZLES</div>
      </div>
      <div class="ending-stat">
        <div class="ending-stat-num" style="color:var(--text-warn)">${timeStr}</div>
        <div class="ending-stat-label">TIEMPO</div>
      </div>
    `;
  }
};

/* ============================================================
   BOOT SEQUENCE
   ============================================================ */
const BootSequence = {
  messages: [
    'Iniciando PROMETHEUS Containment System v4.7.2...',
    'Verificando integridad del protocolo de seguridad...',
    'Estableciendo túnel VPN cifrado...',
    'Cargando perfiles de acceso de agentes...',
    'Conectando con servidor NEXUS-CORE...',
    'Módulos de monitoreo activos...',
    `ADVERTENCIA: PROMETHEUS ha escalado a NIVEL ÓMICRON`,
    'Sesión del agente iniciada. Temporizador de misión activado.',
    '> Sistema listo. Buena suerte.'
  ],

  async run(callback) {
    const log = document.getElementById('bootLog');
    const bar = document.getElementById('bootBar');

    for (let i = 0; i < this.messages.length; i++) {
      await this.delay(300 + Math.random() * 400);
      const line = document.createElement('div');
      line.textContent = '> ' + this.messages[i];
      if (i >= 6) line.style.color = i === 6 ? 'var(--text-warn)' : 'var(--text-primary)';
      log.appendChild(line);

      bar.style.width = `${((i + 1) / this.messages.length) * 100}%`;
    }

    await this.delay(600);
    const overlay = document.getElementById('bootOverlay');
    overlay.classList.add('fade-out');
    await this.delay(800);
    overlay.style.display = 'none';
    callback();
  },

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Recuperar estado de sessionStorage
  const agentName = sessionStorage.getItem('agentName') || 'AGENTE_X';
  const difficulty = sessionStorage.getItem('difficulty') || 'normal';

  GameState.agentName = agentName;
  GameState.difficulty = difficulty;

  // Configurar pistas según dificultad
  GameState.hintsRemaining = difficulty === 'easy' ? 5 : difficulty === 'hard' ? 1 : 3;
  GameState.hintsUsed = 0;

  // Actualizar HUD
  document.getElementById('hudAgent').textContent = agentName;
  UIController.updateTimer();
  UIController.updateHintCount();
  UIController.updatePhaseStatus();

  // Iniciar boot
  BootSequence.run(() => {
    // Activar primera fase
    document.getElementById('status-phase1').className = 'status-item active';

    // Renderizar primer puzzle
    PuzzleEngine.render(PUZZLES[0]);

    // Iniciar temporizador
    GameState.isRunning = true;
    GameState.startTime = Date.now();
    TimerEngine.start();

    addLog(`Misión iniciada. Agente: ${agentName}`, 'narrative');
    addLog('Objetivo: destruir PROMETHEUS antes del protocolo CHIMERA.', 'system');
  });

  // Guardar notas automáticamente
  document.getElementById('agentNotes').addEventListener('input', (e) => {
    localStorage.setItem('prometheus_notes', e.target.value);
  });
  const savedNotes = localStorage.getItem('prometheus_notes');
  if (savedNotes) document.getElementById('agentNotes').value = savedNotes;

  // Guardar progreso en localStorage
  setInterval(() => {
    if (!GameState.isEnded) {
      localStorage.setItem('prometheus_save', JSON.stringify({
        currentPuzzleIndex: GameState.currentPuzzleIndex,
        score: GameState.score,
        timeRemaining: GameState.timeRemaining,
        solvedPuzzles: GameState.solvedPuzzles,
        inventory: GameState.inventory,
        failedAttempts: GameState.failedAttempts
      }));
    }
  }, 15000);
});
