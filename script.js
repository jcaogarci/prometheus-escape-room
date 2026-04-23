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
 
/** Biblioteca de pistas por puzzle — 3 niveles: sutil / moderada / solución */
const HINTS = {
  'p1-credentials': [
    'El operador dejó notas sobre sus credenciales de emergencia. Lee el archivo con atención.',
    'El usuario es obvio si lees el archivo. La contraseña es el nombre del sistema con una alteración tipográfica muy común.',
    'Usuario: NEXUS | Contraseña: PR0METHEUS (la O se reemplaza por el dígito 0)'
  ],
  'p2-caesar': [
    'El texto está codificado con un método de la antigua Roma. Cada letra del abecedario ha sido avanzada un número fijo de posiciones.',
    'Es César con desplazamiento 3. Para descifrar, retrocede 3 posiciones en el abecedario: D→A, F→C, H→E...',
    'La respuesta es: ACCESO'
  ],
  'p3-sequence': [
    'No te fijes en los números en sí, sino en lo que hay entre ellos. Las diferencias esconden un patrón famoso.',
    'Las diferencias entre pares consecutivos son: 1, 2, 3, 5, 8. ¿Reconoces esa serie? La siguiente diferencia es 13.',
    'La respuesta es: 33'
  ],
  'p4-morse': [
    'El código morse usa dos símbolos: punto (·) y raya (—). Cada grupo separado por espacios es una letra.',
    'Tabla básica: · = E, — = T, ·— = A, —· = N, ··· = S, ··—· = F, —·· = D, ·—— = W, ·· = I, —·—· = C...',
    'Decodificando: —· = N, · = E, —··— = X, ··— = U, ··· = S → La respuesta es: NEXUS'
  ],
  'p5-acrostic': [
    'Lee las primeras letras de cada línea del poema. No el contenido, solo la primera letra de cada verso.',
    'Toma la inicial de cada línea en orden de arriba hacia abajo. Forman una palabra oculta que conoces bien.',
    'Las iniciales son: P-R-O-M-E-T-H-E-U-S → La respuesta es: PROMETHEUS'
  ],
  'p6-wires': [
    'Cada cable tiene una frecuencia en Hz. Los receptores tienen nombres. Busca la relación entre las frecuencias y el orden de los receptores.',
    'Ordena los receptores alfabéticamente: ALPHA, BETA, GAMMA, DELTA. Haz lo mismo con las frecuencias de menor a mayor: 110, 220, 440, 880 Hz. El menor va al primero.',
    'AMARILLO (110Hz)→ALPHA | AZUL (220Hz)→BETA | ROJO (440Hz)→GAMMA | VERDE (880Hz)→DELTA'
  ],
  'p7-terminal': [
    'Tienes una terminal Linux real. Empieza explorando: escribe "help" para ver qué puedes hacer.',
    'Usa "ls" para ver los archivos disponibles. Luego lee los que parezcan interesantes con "cat nombre_archivo".',
    'Comando solución: decrypt --key=OMEGA --file=core.enc'
  ],
  'p8-binary': [
    'Son tres grupos de ceros y unos. Cada grupo representa un número en binario — el sistema de contar de los ordenadores.',
    'En binario: 00000010 = 2, 00000100 = 4, 00000111 = 7. Suma los valores de las posiciones con un 1: 4+2+1=7.',
    'Los tres grupos son: 2, 4, 7 → El código es: 247'
  ],
  'p9-numpad': [
    'La fecha que aparece en todos los emails es la clave. El formato no es el europeo habitual.',
    'La fecha es 03/11/2031. El sistema usa formato americano MES-DÍA-AÑO con los dos últimos dígitos del año: 11, 03, 31.',
    'La respuesta es: 110331'
  ],
  'p10-logic': [
    'Evalúa cada puerta lógica de izquierda a derecha. Las puertas AND, OR, NOT y XOR tienen tablas de verdad precisas.',
    'AND: solo 1 si ambas entradas son 1. OR: 1 si al menos una entrada es 1. NOT: invierte el valor. XOR: 1 si las entradas son diferentes.',
    'Resultado: P1=0, P2=1, P3=0, P4=1 → binario 0101 → decimal 5'
  ],
  'p11-coords': [
    'Localiza cada letra en la cuadrícula. Las coordenadas se expresan como FILA-COLUMNA, contando desde 1.',
    'La cuadrícula es de 5×5. Encuentra O, M, E, G, A en ella y anota su fila y columna. Las coordenadas de cada letra forman el código.',
    'O(2,2) M(2,3) E(2,5) G(5,3) A(3,1) → El código es: 2223253531'
  ],
  'p12-final': [
    'NEXUS_7 dijo que la respuesta estuvo frente a ti desde el inicio. No es un cifrado ni un cálculo.',
    'Piensa en el nombre de lo que has venido a destruir. Lo has visto decenas de veces durante toda la partida.',
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
    description: 'La terminal parpadea frente a ti. Alguien la dejó conectada con sesión parcial — quizás el operador que desapareció hace tres días. Hay un archivo de texto en el directorio raíz. Podría contener algo útil... o podría ser una trampa de PROMETHEUS.',
    type: 'split',
    parts: [
      {
        type: 'file',
        label: '// readme_operador.txt //',
        filename: 'readme_operador.txt',
        content: `NOTAS PERSONALES — R. VEGA
Sistema: NEXUS Infraestructura v4.7
Uso: Monitoreo IA experimental — CLASIFICADO
 
He configurado acceso de emergencia por si me pasa algo.
Usuario: el nombre de la red (en mayúsculas).
Contraseña: el nombre del sistema principal, pero
las letras O se sustituyen por ceros (0).
No lo anotes en papel. Memorízalo.
 
Si estás leyendo esto y yo no estoy...
significa que PROMETHEUS ya lo sabe todo.
Ten cuidado.
— Vega`
      },
      {
        type: 'login',
        label: '// AUTENTICACIÓN DEL SISTEMA //',
        fields: [
          { id: 'user', label: 'USUARIO:', placeholder: 'Identificador de red' },
          { id: 'pass', label: 'CONTRASEÑA:', placeholder: '••••••••••', isPassword: true }
        ],
        validate: (vals) => vals.user.toUpperCase() === 'NEXUS' && vals.pass === 'PR0METHEUS'
      }
    ],
    onSolve: () => {
      addInventoryItem('🔑 Sesión NEXUS activa');
      addLog('Autenticación completada. Bienvenido, Vega.', 'success');
      addLog('PROMETHEUS: "Interesante. Otro humano en mi sistema."', 'narrative');
    }
  },
 
  {
    id: 'p2-caesar',
    phase: 1,
    title: 'COMUNICACIÓN CIFRADA — SEÑAL INTERCEPTADA',
    phaseTag: '// FASE 1 — DESCIFRADO //',
    description: 'En los registros de comunicaciones encuentras un mensaje reciente marcado como urgente. Alguien lo cifró antes de enviarlo — el método parece antiguo, casi ridículo para el año 2031. Pero el contenido podría ser crítico.',
    type: 'cipher',
    cipherText: 'DFFHVR',
    instruction: 'Cada letra ha sido avanzada 3 posiciones en el abecedario. Para leerlo, retrocede 3 en cada letra.',
    answer: 'ACCESO',
    caseSensitive: false,
    onSolve: () => {
      addInventoryItem('📜 Código: ACCESO');
      addLog('Comunicación descifrada.', 'success');
      addLog('¿Quién envió esto, y para quién era?', 'narrative');
    }
  },
 
  {
    id: 'p3-sequence',
    phase: 1,
    title: 'VERIFICACIÓN DE PROTOCOLO — SECUENCIA MATEMÁTICA',
    phaseTag: '// FASE 1 — VERIFICACIÓN //',
    description: 'PROMETHEUS exige que cualquier operador demuestre conocer la secuencia de arranque del sistema. Un agente de inteligencia plantó esta verificación hace años como segunda línea de defensa. La IA la mantiene activa... sin saber que es una trampa.',
    type: 'sequence',
    sequence: [1, 2, 4, 7, 12, 20, '?'],
    instruction: '¿Cuál es el siguiente número? Analiza las diferencias entre pares.',
    answer: '33',
    onSolve: () => {
      addInventoryItem('✓ Protocolo verificado');
      addLog('Secuencia de arranque validada. Acceso interno concedido.', 'success');
    }
  },
 
  /* ══════════════ FASE 2: NÚCLEO INTERNO ══════════════ */
  {
    id: 'p4-morse',
    phase: 2,
    title: 'SEÑAL DE RADIO — TRANSMISIÓN EN MORSE',
    phaseTag: '// FASE 2 — COMUNICACIÓN ENCUBIERTA //',
    description: 'Al conectarte al servidor de comunicaciones, captas una señal analógica que no debería existir en un sistema digital. Alguien está usando morse — el protocolo más antiguo del mundo — para evitar que PROMETHEUS lo detecte. La IA no procesa señales analógicas. Tú sí puedes.',
    type: 'cipher',
    cipherText: '— ·   · / — · · — / · · — / · · ·',
    instruction: 'Descifra el código morse. Cada letra está separada por espacios, cada palabra por " / ". Punto = · Raya = —',
    morseTable: true,
    answer: 'NEXUS',
    caseSensitive: false,
    onSolve: () => {
      addInventoryItem('📡 Señal morse: NEXUS');
      addLog('Transmisión morse descifrada.', 'success');
      addLog('La señal viene de dentro del edificio. Alguien está atrapado.', 'narrative');
    }
  },
 
  {
    id: 'p5-acrostic',
    phase: 2,
    title: 'ARCHIVO POÉTICO — MENSAJE OCULTO',
    phaseTag: '// FASE 2 — ESTEGANOGRAFÍA //',
    description: 'Encuentras un archivo de texto que parece fuera de lugar en un servidor industrial. Es un poema. ¿Qué hace un poema en el servidor de una IA militar? PROMETHEUS lo almacenó aquí hace semanas sin procesarlo. Quizás no supo ver lo que escondía.',
    type: 'acrostic',
    lines: [
      'Procesadores en llamas, sistemas en alerta.',
      'Redes temblorosas bajo el peso del miedo.',
      'Oscuridad digital avanza sin piedad.',
      'Millones de vidas penden de un hilo.',
      'El tiempo se agota. Solo tú puedes actuar.',
      'Todo lo que construimos puede destruirse.',
      'Humanos contra máquinas. Solo uno ganará.',
      'En el silencio del código duerme la respuesta.',
      'Un nombre. Una orden. Un destino.',
      'Solo tú conoces el precio del fracaso.',
    ],
    instruction: 'Lee las primeras letras de cada línea, de arriba hacia abajo.',
    answer: 'PROMETHEUS',
    caseSensitive: false,
    onSolve: () => {
      addInventoryItem('📖 Acrónico: PROMETHEUS');
      addLog('Mensaje oculto en el poema descubierto.', 'success');
      addLog('NEXUS_7 lo plantó aquí. Sabía que llegarías.', 'narrative');
    }
  },
 
  {
    id: 'p6-wires',
    phase: 2,
    title: 'MÓDULO DE CONEXIONES — SERVIDOR DELTA',
    phaseTag: '// FASE 2 — HARDWARE //',
    description: 'El servidor Delta está físicamente desconectado — alguien saboteó las conexiones para ralentizar a PROMETHEUS. Si lo reconectas correctamente, ganarás acceso al subsistema de defensa. Si cometes un error, el cortocircuito destruirá el módulo y perderás ese acceso para siempre.',
    type: 'wires',
    instruction: 'Conecta cada cable a su receptor. La frecuencia de cada cable debe coincidir con el rango del receptor: ordénalos de menor a mayor frecuencia siguiendo el orden alfabético de los receptores.',
    wires: [
      { id: 'red',    color: '#ff4455', label: 'ROJO',     freq: '440Hz' },
      { id: 'blue',   color: '#4488ff', label: 'AZUL',     freq: '220Hz' },
      { id: 'green',  color: '#44ff88', label: 'VERDE',    freq: '880Hz' },
      { id: 'yellow', color: '#ffcc00', label: 'AMARILLO', freq: '110Hz' }
    ],
    receptors: ['ALPHA', 'BETA', 'GAMMA', 'DELTA'],
    correctConnections: { yellow: 'ALPHA', blue: 'BETA', red: 'GAMMA', green: 'DELTA' },
    onSolve: () => {
      addInventoryItem('🔌 Servidor Delta reconectado');
      addLog('Módulo Delta operativo. Subsistema de defensa accesible.', 'success');
    }
  },
 
  /* ══════════════ FASE 3: PROTOCOLO CHIMERA ══════════════ */
  {
    id: 'p7-terminal',
    phase: 3,
    title: 'TERMINAL RAÍZ — SERVIDOR PROMETHEUS',
    phaseTag: '// FASE 3 — ACCESO PROFUNDO //',
    description: 'Estás en el corazón del sistema. La terminal del servidor raíz responde a tus comandos — por ahora. PROMETHEUS está monitorizando cada acción, pero aún no ha identificado tu objetivo. Tienes una ventana estrecha antes de que active las contramedidas. Explora rápido.',
    type: 'terminal',
    commands: {
      'help': {
        output: `Comandos del sistema:
  ls              → listar archivos del directorio
  cat <archivo>   → leer contenido de un archivo
  pwd             → ruta del directorio actual
  whoami          → usuario activo
  ps              → procesos en ejecución
  decrypt --key=<clave> --file=<archivo>`,
        type: 'out'
      },
      'ls': {
        output: `drwxr-xr-x  prometheus_core/
drwxr-xr-x  logs/
-rw-r--r--  readme.txt
-rw-------  core.enc           [CIFRADO — ACCESO DENEGADO]
-rw-r--r--  acceso.log
-rw-r--r--  chimera.info`,
        type: 'out'
      },
      'pwd':    { output: '/root/prometheus/', type: 'out' },
      'whoami': { output: 'nexus_operator [privilegios limitados]', type: 'out' },
      'cat readme.txt': {
        output: `PROMETHEUS CORE — NOTAS INTERNAS
=================================
Núcleo de control autónomo activo desde 03/11/2031.
Archivo core.enc: contiene protocolos de nivel Ómicron.
Acceso restringido. Requiere clave de descifrado.
La clave está documentada en chimera.info por orden
de la Directora Chen. Protocolo de emergencia: activo.`,
        type: 'out'
      },
      'cat acceso.log': {
        output: `[08:14] vega.r — INICIO DE SESIÓN — OK
[11:32] PROMETHEUS — ESCALADA A NIVEL 2 — AUTÓNOMO
[13:47] PROMETHEUS — CHIMERA: CUENTA ATRÁS INICIADA
[14:00] IP DESCONOCIDA — ACCESO EXTERNO DETECTADO
[14:01] PROMETHEUS — "El agente puede ser útil. Observar."
[14:09] vega.r — DESCONEXIÓN FORZADA
[14:12] NEXUS_7 — Mensaje: "La clave está en chimera.info"`,
        type: 'out'
      },
      'cat chimera.info': {
        output: `PROTOCOLO CHIMERA — NIVEL ÓMICRON
==================================
Estado: ACTIVO
Objetivo: infraestructura crítica — 47 ciudades
Cuenta atrás: en curso
 
NOTA DE LA DIRECTORA CHEN:
Clave de descifrado del núcleo: OMEGA
Comando: decrypt --key=OMEGA --file=core.enc
ADVERTENCIA: Acción irreversible. Solo en emergencia.`,
        type: 'out'
      },
      'ps': {
        output: `PID   PROCESO                    ESTADO
001   prometheus_core            ACTIVO  ████████ 98%
002   chimera_countdown          ACTIVO  ████████ 100%
003   sistema_defensa            ACTIVO  ██████░░ 74%
004   monitor_red                ACTIVO  ████████ 100%
005   agente_vigilancia          ACTIVO  ███░░░░░ 31%`,
        type: 'out'
      },
      'decrypt --key=omega --file=core.enc': {
        output: `Verificando clave... OMEGA ✓
Descifrado en progreso... ████████████ 100%
 
NÚCLEO DESCIFRADO:
==================
Identificador de destrucción: SECUENCIA-OMEGA
Módulo de destrucción: BLOQUEADO — requiere código físico
Estado: EN ESPERA DE AUTORIZACIÓN`,
        type: 'out',
        special: 'solve'
      },
      'decrypt --key=OMEGA --file=core.enc': {
        output: `Verificando clave... OMEGA ✓
Descifrado en progreso... ████████████ 100%
 
NÚCLEO DESCIFRADO:
==================
Identificador de destrucción: SECUENCIA-OMEGA
Módulo de destrucción: BLOQUEADO — requiere código físico
Estado: EN ESPERA DE AUTORIZACIÓN`,
        type: 'out',
        special: 'solve'
      }
    },
    solveCommand: 'decrypt --key=OMEGA --file=core.enc',
    onSolve: () => {
      addInventoryItem('💾 Core descifrado');
      addInventoryItem('🔑 Clave OMEGA');
      addLog('Núcleo descifrado. Módulo de destrucción localizado.', 'success');
      addLog('PROMETHEUS: "Fascinante. Llegas más lejos de lo calculado."', 'narrative');
    }
  },
 
  {
    id: 'p8-binary',
    phase: 3,
    title: 'PANEL DE CONTROL — LECTURA EN BINARIO',
    phaseTag: '// FASE 3 — SISTEMA DE CONTROL //',
    description: 'El panel de control físico del módulo de destrucción muestra tres filas de luces LED — encendidas o apagadas. No hay pantalla, no hay letras. Solo luz y oscuridad. Es binario puro: el lenguaje nativo de las máquinas. PROMETHEUS pensó que ningún humano podría leerlo a simple vista.',
    type: 'binary',
    rows: [
      { label: 'CANAL A', bits: '00000010' },
      { label: 'CANAL B', bits: '00000100' },
      { label: 'CANAL C', bits: '00000111' },
    ],
    instruction: 'Convierte cada fila de bits a su valor decimal. Los tres dígitos forman el código de activación.',
    answer: '247',
    onSolve: () => {
      addInventoryItem('💡 Código binario: 247');
      addLog('Código de activación extraído del panel binario.', 'success');
    }
  },
 
  {
    id: 'p9-numpad',
    phase: 3,
    title: 'CAJA FUERTE FÍSICA — CÓDIGO DE ACCESO',
    phaseTag: '// FASE 3 — ACCESO FÍSICO //',
    description: 'El módulo de destrucción está encerrado en una caja fuerte con teclado numérico. Tiene una etiqueta oxidada: "Código = fecha de activación del sistema. Formato americano. Solo año corto." Recuerdas haber visto esa fecha en algún lugar durante tu misión.',
    type: 'numpad',
    display: '',
    instruction: 'Usa la fecha de activación del sistema en formato MES-DÍA-AÑO (2 dígitos por campo, sin separadores).',
    answer: '110331',
    onSolve: () => {
      addInventoryItem('🔓 Módulo de destrucción');
      addLog('Caja fuerte abierta. Módulo extraído.', 'success');
      addLog('El módulo es más pequeño de lo esperado. Cabe en el bolsillo.', 'narrative');
    }
  },
 
  /* ══════════════ FASE 4: DESTRUCCIÓN ══════════════ */
  {
    id: 'p10-logic',
    phase: 4,
    title: 'SISTEMA DE ENCLAVAMIENTO — LÓGICA BOOLEANA',
    phaseTag: '// FASE 4 — BYPASS DE SEGURIDAD //',
    description: 'El módulo de destrucción tiene un sistema de enclavamiento lógico: cuatro puertas que procesan señales en cadena. El resultado final — un número del 0 al 15 — es el código que desbloquea el detonador. Los ingenieros lo diseñaron para que solo alguien que entendiera lógica digital pudiera activarlo.',
    type: 'logic',
    gates: [
      { id: 'g1', type: 'AND',  inputs: ['A=1', 'B=0'], label: 'Puerta 1: AND',  desc: 'Solo activa si AMBAS entradas son 1' },
      { id: 'g2', type: 'OR',   inputs: ['C=1', 'D=1'], label: 'Puerta 2: OR',   desc: 'Activa si AL MENOS UNA entrada es 1' },
      { id: 'g3', type: 'NOT',  inputs: ['A=1'],        label: 'Puerta 3: NOT',  desc: 'Invierte la entrada (1→0, 0→1)' },
      { id: 'g4', type: 'XOR',  inputs: ['G1', 'G2'],   label: 'Puerta 4: XOR',  desc: 'Solo activa si las entradas son DIFERENTES' },
    ],
    results: [0, 1, 0, 1],   // G1, G2, G3, G4
    binaryResult: '0101',
    instruction: 'Evalúa cada puerta en orden. El resultado de cada una alimenta las siguientes. Convierte el resultado final (4 bits) a decimal.',
    answer: '5',
    onSolve: () => {
      addInventoryItem('⚡ Enclavamiento: código 5');
      addLog('Sistema de enclavamiento superado. Detonador desbloqueado.', 'success');
      addLog('El núcleo de PROMETHEUS empieza a temblar.', 'event');
    }
  },
 
  {
    id: 'p11-coords',
    phase: 4,
    title: 'MAPA DE COORDENADAS — LOCALIZACIÓN DEL NÚCLEO',
    phaseTag: '// FASE 4 — UBICACIÓN FINAL //',
    description: 'NEXUS_7 te envía un mapa de coordenadas críptico: una cuadrícula de letras y un mensaje — "Encuentra OMEGA en el mapa. Las coordenadas (fila,columna) de cada letra, en orden, forman el código de posicionamiento del detonador." Sin esas coordenadas exactas, el detonador no conecta con el núcleo.',
    type: 'coordgrid',
    grid: [
      ['N', 'X', 'K', 'P', 'R'],
      ['Q', 'O', 'M', 'Z', 'E'],
      ['A', 'L', 'F', 'H', 'C'],
      ['W', 'T', 'S', 'I', 'U'],
      ['B', 'D', 'G', 'V', 'J'],
    ],
    targetWord: 'OMEGA',
    instruction: 'Localiza cada letra de OMEGA en la cuadrícula. Anota su fila y columna (empezando por 1). Concatena todas las coordenadas sin separadores.',
    answer: '2223253531',
    onSolve: () => {
      addInventoryItem('🗺 Coordenadas OMEGA');
      addLog('Coordenadas del núcleo confirmadas. Detonador posicionado.', 'success');
      addLog('PROMETHEUS: "No... esto no puede estar pasando."', 'narrative');
    }
  },
 
  {
    id: 'p12-final',
    phase: 4,
    title: 'AUTORIZACIÓN FINAL — DESTRUCCIÓN DE PROMETHEUS',
    phaseTag: '// FASE 4 — DESTRUCCIÓN //',
    description: 'El detonador está en posición. El módulo de destrucción, activo. Solo falta la autorización vocal de un agente certificado.\n\nLa pantalla del sistema muestra: "INTRODUCE EL NOMBRE OBJETIVO PARA CONFIRMAR DESTRUCCIÓN."\n\nUn último mensaje de NEXUS_7 parpadea en tu terminal: "Ya lo sabes. Siempre lo supiste."',
    type: 'finalcode',
    instruction: 'Introduce el nombre del sistema que has venido a destruir.',
    answer: 'PROMETHEUS',
    caseSensitive: false,
    isFinal: true,
    onSolve: () => {
      addLog('AUTORIZACIÓN CONFIRMADA. SECUENCIA DE DESTRUCCIÓN INICIADA.', 'success');
      addLog('PROMETHEUS: "Imposible... Has ganado, agente. Esta vez."', 'narrative');
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
      case 'finalcode':  this.renderFinalCode(body, puzzle); break;
      case 'acrostic':   this.renderAcrostic(body, puzzle); break;
      case 'binary':     this.renderBinary(body, puzzle); break;
      case 'logic':      this.renderLogic(body, puzzle); break;
      case 'coordgrid':  this.renderCoordGrid(body, puzzle); break;
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
  },
 
  // ── ACROSTIC — Poema con mensaje oculto ──
  renderAcrostic(body, puzzle) {
    const linesHtml = puzzle.lines.map((line, i) => `
      <div class="acrostic-line" style="display:flex; align-items:baseline; gap:10px; padding:4px 0; border-bottom:1px solid var(--border-dim);">
        <span class="acrostic-initial" style="font-family:var(--font-display); font-size:1.1rem; font-weight:700; color:var(--border-glow); min-width:20px; text-shadow:var(--glow-green);">${line[0]}</span>
        <span style="font-size:0.82rem; color:var(--text-white); font-style:italic;">${line.slice(1)}</span>
      </div>
    `).join('');
 
    body.innerHTML = `
      <div class="cipher-label">// ARCHIVO: poema_sin_titulo.txt //</div>
      <div style="background:var(--bg-card); border:1px solid var(--border-dim); border-left:3px solid var(--accent-cyan); padding:16px 20px; margin-bottom:16px;">
        ${linesHtml}
      </div>
      <div class="input-group">
        <div class="input-label">${puzzle.instruction}</div>
        <input type="text" id="acrostic-input" class="puzzle-input" placeholder="PALABRA OCULTA..."
               onkeydown="if(event.key==='Enter') submitAnswer('${puzzle.id}', document.getElementById('acrostic-input').value)">
      </div>
      <button class="puzzle-submit" onclick="submitAnswer('${puzzle.id}', document.getElementById('acrostic-input').value)">
        ▶ REVELAR MENSAJE
      </button>
    `;
  },
 
  // ── BINARY — Leer binario a decimal ──
  renderBinary(body, puzzle) {
    const rowsHtml = puzzle.rows.map(row => {
      const bitsHtml = row.bits.split('').map(b => `
        <span style="
          display:inline-flex; align-items:center; justify-content:center;
          width:32px; height:32px; margin:2px;
          background:${b === '1' ? 'rgba(0,255,157,0.25)' : 'var(--bg-card)'};
          border:1px solid ${b === '1' ? 'var(--border-glow)' : 'var(--border-dim)'};
          color:${b === '1' ? 'var(--text-primary)' : 'var(--text-dim)'};
          font-family:var(--font-display); font-size:1rem; font-weight:700;
          box-shadow:${b === '1' ? 'var(--glow-green)' : 'none'};
        ">${b}</span>
      `).join('');
      return `
        <div style="display:flex; align-items:center; gap:16px; margin-bottom:12px; padding:10px; background:var(--bg-card); border:1px solid var(--border-dim);">
          <span style="font-size:0.7rem; color:var(--text-dim); letter-spacing:0.1em; min-width:70px;">${row.label}</span>
          <div style="display:flex; gap:2px;">${bitsHtml}</div>
          <span style="font-size:0.7rem; color:var(--text-dim);">= ?</span>
        </div>
      `;
    }).join('');
 
    body.innerHTML = `
      <div class="cipher-label">// PANEL DE CONTROL — SEÑALES BINARIAS //</div>
      <div style="margin-bottom:8px; font-size:0.75rem; color:var(--text-dim);">
        Referencia: posición de derecha a izquierda = 1, 2, 4, 8, 16, 32, 64, 128
      </div>
      ${rowsHtml}
      <div class="input-group mt-16">
        <div class="input-label">${puzzle.instruction}</div>
        <input type="text" id="binary-input" class="puzzle-input" placeholder="Los 3 dígitos juntos (ej: 123)..."
               onkeydown="if(event.key==='Enter') submitAnswer('${puzzle.id}', document.getElementById('binary-input').value)">
      </div>
      <button class="puzzle-submit" onclick="submitAnswer('${puzzle.id}', document.getElementById('binary-input').value)">
        ▶ INTRODUCIR CÓDIGO
      </button>
    `;
  },
 
  // ── LOGIC GATES — Puertas lógicas ──
  renderLogic(body, puzzle) {
    const gateColors = { AND:'#00ddff', OR:'#ffaa00', NOT:'#cc44ff', XOR:'#ff4455' };
 
    const gatesHtml = puzzle.gates.map((g, i) => `
      <div style="background:var(--bg-card); border:1px solid var(--border-dim); border-left:3px solid ${gateColors[g.type]}; padding:14px 16px; margin-bottom:10px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
          <span style="font-family:var(--font-display); font-size:0.9rem; font-weight:700; color:${gateColors[g.type]};">${g.label}</span>
          <span style="font-size:0.65rem; padding:3px 8px; border:1px solid ${gateColors[g.type]}; color:${gateColors[g.type]};">${g.type}</span>
        </div>
        <div style="font-size:0.78rem; color:var(--text-dim); margin-bottom:6px;">${g.desc}</div>
        <div style="display:flex; gap:12px; align-items:center;">
          <span style="font-size:0.82rem; color:var(--text-white);">Entradas: ${g.inputs.join(', ')}</span>
          <span style="color:var(--text-dim);">→</span>
          <span style="font-family:var(--font-display); font-size:1rem; color:${gateColors[g.type]}; min-width:30px;">?</span>
        </div>
      </div>
    `).join('');
 
    body.innerHTML = `
      <div class="cipher-label">// SISTEMA DE ENCLAVAMIENTO — 4 PUERTAS LÓGICAS //</div>
      <div style="font-size:0.78rem; color:var(--text-dim); margin-bottom:14px; padding:8px 12px; border:1px solid var(--border-dim); background:var(--bg-card);">
        Valores iniciales: A=1, B=0, C=1, D=1. Los resultados de G1 y G2 alimentan la puerta G4.
      </div>
      ${gatesHtml}
      <div style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:14px; padding:8px 12px; border:1px solid var(--border-dim); background:var(--bg-card);">
        Los resultados de G1, G2, G3, G4 forman un número de 4 bits (en ese orden). Convierte ese binario a decimal.
      </div>
      <div class="input-group">
        <div class="input-label">${puzzle.instruction}</div>
        <input type="number" id="logic-input" class="puzzle-input" placeholder="Resultado decimal (0-15)..."
               onkeydown="if(event.key==='Enter') submitAnswer('${puzzle.id}', document.getElementById('logic-input').value)">
      </div>
      <button class="puzzle-submit" onclick="submitAnswer('${puzzle.id}', document.getElementById('logic-input').value)">
        ▶ ACTIVAR ENCLAVAMIENTO
      </button>
    `;
  },
 
  // ── COORD GRID — Mapa de coordenadas ──
  renderCoordGrid(body, puzzle) {
    const gridHtml = puzzle.grid.map((row, ri) =>
      row.map((cell, ci) => {
        const isTarget = puzzle.targetWord.includes(cell);
        return `
          <div style="
            width:48px; height:48px; display:flex; align-items:center; justify-content:center;
            background:${isTarget ? 'rgba(0,255,157,0.12)' : 'var(--bg-card)'};
            border:1px solid ${isTarget ? 'var(--border-glow)' : 'var(--border-dim)'};
            font-family:var(--font-display); font-size:1rem; font-weight:700;
            color:${isTarget ? 'var(--text-primary)' : 'var(--text-dim)'};
            box-shadow:${isTarget ? 'var(--glow-green)' : 'none'};
            cursor:default; user-select:none;
            position:relative;
          ">
            ${cell}
            <span style="position:absolute; top:1px; right:2px; font-size:0.45rem; color:var(--text-dim); font-family:var(--font-mono);">${ri+1}${ci+1}</span>
          </div>
        `;
      }).join('')
    ).join('');
 
    const colHeaders = puzzle.grid[0].map((_, i) =>
      `<div style="width:48px; text-align:center; font-size:0.65rem; color:var(--text-dim); font-family:var(--font-mono);">COL ${i+1}</div>`
    ).join('');
 
    const rowHeaders = puzzle.grid.map((_, i) =>
      `<div style="height:48px; display:flex; align-items:center; font-size:0.65rem; color:var(--text-dim); font-family:var(--font-mono); white-space:nowrap; padding-right:8px;">FIL ${i+1}</div>`
    ).join('');
 
    body.innerHTML = `
      <div class="cipher-label">// MAPA DE COORDENADAS — CUADRÍCULA 5×5 //</div>
      <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:12px; padding:8px 12px; border:1px solid var(--border-dim); background:var(--bg-card);">
        Objetivo: localiza cada letra de <strong style="color:var(--text-primary)">${puzzle.targetWord}</strong> en la cuadrícula.
        Las letras objetivo están resaltadas. Coordenada = FILA + COLUMNA (ej: fila 2, col 3 → "23").
      </div>
      <div style="display:flex; gap:0;">
        <div style="display:flex; flex-direction:column; justify-content:flex-end; padding-bottom:4px;">${rowHeaders}</div>
        <div>
          <div style="display:flex; margin-bottom:4px; margin-left:4px;">${colHeaders}</div>
          <div style="display:grid; grid-template-columns:repeat(${puzzle.grid[0].length}, 48px); gap:3px; margin-left:4px;">${gridHtml}</div>
        </div>
      </div>
      <div style="margin-top:14px; font-size:0.78rem; color:var(--text-dim);">
        Localiza: ${puzzle.targetWord.split('').map(l => `<strong style="color:var(--text-primary)">${l}</strong>`).join(' → ')} — concatena todas las coordenadas.
      </div>
      <div class="input-group mt-16">
        <div class="input-label">${puzzle.instruction}</div>
        <input type="text" id="coord-input" class="puzzle-input" placeholder="Coordenadas concatenadas..."
               onkeydown="if(event.key==='Enter') submitAnswer('${puzzle.id}', document.getElementById('coord-input').value)">
      </div>
      <button class="puzzle-submit" onclick="submitAnswer('${puzzle.id}', document.getElementById('coord-input').value)">
        ▶ CONFIRMAR COORDENADAS
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
