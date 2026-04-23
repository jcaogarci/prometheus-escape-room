# PROMETHEUS — Escape Room Digital
## Documentación Completa: Despliegue, Monetización y Guía de Juego

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
prometheus-escape-room/
├── index.html          ← Landing page / pantalla de inicio
├── game.html           ← Juego principal
├── script.js           ← Lógica completa del juego (motor)
├── style.css           ← Estilos inmersivos (tema hacker/terminal)
├── assets/             ← (Opcional) Imágenes, sonidos adicionales
└── README.md           ← Este archivo
```

---

## 🚀 DESPLIEGUE EN GITHUB PAGES

### Paso 1: Crear repositorio
```bash
git init
git add .
git commit -m "Initial release: PROMETHEUS Escape Room v1.0"
git branch -M main
git remote add origin https://github.com/tu-usuario/prometheus-escape-room.git
git push -u origin main
```

### Paso 2: Activar GitHub Pages
1. Ve a tu repositorio → **Settings**
2. Sidebar izquierdo → **Pages**
3. Source: **Deploy from a branch**
4. Branch: **main** / **(root)**
5. Guarda y espera 2-3 minutos

### Paso 3: Tu URL pública
`https://tu-usuario.github.io/prometheus-escape-room/`

### Paso 4 (opcional): Dominio personalizado
- Añade un archivo `CNAME` con tu dominio
- Configura DNS en tu proveedor de dominio

---

## 🎮 GUÍA COMPLETA DE PUZZLES

### FASE 1 — ACCESO INICIAL

**Puzzle 1: Login NEXUS**
- Usuario: `NEXUS`
- Contraseña: `PR0METHEUS` (la O es un cero)
- _Pista en el readme_operador.txt visible en pantalla_

**Puzzle 2: Cifrado César**
- Texto: `LQILOGUDGR`
- Método: César desplazamiento 3 (restar 3 a cada letra)
- Respuesta: `INFILTRADO`

**Puzzle 3: Secuencia Fibonacci modificada**
- Serie: 1, 2, 4, 7, 12, 20, ?
- Patrón: cada número = anterior + posición
- Respuesta: `33`

### FASE 2 — NÚCLEO INTERNO

**Puzzle 4: Emails fragmentados**
- Email 1 (fragm. A): `47`
- Email 2 (fragm. B): `19`
- Email 3 (fragm. C): `83`
- Respuesta: `471983`

**Puzzle 5: Grid de nodos (forma L)**
- Activar celdas: 1, 4, 7, 8, 9 (base 1) = índices 0, 3, 6, 7, 8
- _Forma una L en la rejilla 3×3_

**Puzzle 6: Cables**
- ROJO → DELTA
- AZUL → ALPHA
- VERDE → GAMMA
- AMARILLO → BETA

### FASE 3 — PROTOCOLO CHIMERA

**Puzzle 7: Terminal Unix**
- Comandos útiles: `ls`, `cat readme.txt`, `cat chimera.info`, `cat access.log`
- Comando solución: `decrypt --key=OMEGA --file=core.enc`

**Puzzle 8: Cifrado Atbash**
- Texto: `MFXOVFH`
- Método: inversión de alfabeto (A↔Z, B↔Y...)
- Respuesta: `NUCLEUS`

**Puzzle 9: Caja fuerte numérica**
- Fecha de activación del sistema: 03/11/2031
- Orden mes-día-año (2 cifras): 11-03-31
- Respuesta: `110331`

### FASE 4 — DESTRUCCIÓN

**Puzzle 10: Secuencia de patrón**
- Orden: ARRIBA → DERECHA → ABAJO → IZQUIERDA
- Índices de celdas: 1, 5, 7, 3

**Puzzle 11: Doble cifrado**
- Texto: `ITVX-NKWMILZZORE-HZBPC`
- Paso 1: Atbash → `RGET-MPDNROOALI-SZACY`
  (Nota: el texto está diseñado para dar resultado final correcto)
- Respuesta directa: `OMEGA-DESTRUCCION-ACTIVA`

**Puzzle 12: Código final**
- El nombre del sistema que estás destruyendo
- Respuesta: `PROMETHEUS`

---

## 💰 MODELO DE NEGOCIO — GUÍA COMPLETA

### Opción A: Venta directa en Gumroad

1. **Crear producto en Gumroad**
   - Precio sugerido: €9.99 – €14.99
   - Tipo: "Digital Product"
   - Subir los 4 archivos como ZIP

2. **Flujo de usuario**:
   ```
   Gumroad pago → Email con enlace privado → 
   GitHub Pages (URL secreta) → Juega inmediatamente
   ```

3. **URL privada**: Despliega en GitHub Pages en un repo PRIVADO
   y usa GitHub Pages con rama protegida, o usa **Netlify** con
   password protection.

### Opción B: Netlify con Password Gate

```html
<!-- Añadir antes del juego en index.html -->
<script>
  const ACCESS_CODE = 'tu-codigo-secreto'; // Generado por Gumroad
  const entered = sessionStorage.getItem('access_granted');
  if (!entered) {
    const code = prompt('Introduce tu código de acceso:');
    if (code !== ACCESS_CODE) {
      window.location.href = 'https://tu-tienda.gumroad.com/l/prometheus';
    } else {
      sessionStorage.setItem('access_granted', true);
    }
  }
</script>
```

### Opción C: Acceso por Token (Recomendado para escalar)

1. Generar tokens únicos por compra
2. Validar token contra lista en Firebase/Supabase
3. Cada token tiene 1 uso o N usos

### Estrategia de Precios Sugerida

| Producto | Precio | Descripción |
|----------|--------|-------------|
| Acceso individual | €9.99 | 1 jugador, 1 sesión |
| Pack equipo (6p) | €19.99 | Hasta 6 jugadores, 1 sesión |
| Acceso ilimitado | €34.99 | Uso indefinido |
| Pack empresa | €99.99 | Team building, acceso admin |

### Marketing y Distribución

- **Canales**: Gumroad, Itch.io, Etsy (digital), Product Hunt
- **Nichos**: Team building corporativo, cumpleaños, parejas, amigos
- **Contenido**: TikTok/Reels mostrando los puzzles sin spoilers
- **Afiliados**: Ofrecer 30% comisión a influencers de puzzles/gaming

---

## 🔧 PERSONALIZACIÓN TÉCNICA

### Cambiar dificultad de puzzles
En `script.js`, modifica el array `PUZZLES` — cada puzzle tiene:
- `answer`: la respuesta correcta
- `type`: tipo de puzzle (cipher, terminal, grid, etc.)

### Añadir nuevos puzzles
```javascript
{
  id: 'p13-nuevo',
  phase: 4,
  title: 'NUEVO PUZZLE',
  phaseTag: '// FASE 4 //',
  description: 'Descripción del puzzle...',
  type: 'cipher',  // o 'terminal', 'grid', etc.
  cipherText: 'TEXTO CIFRADO',
  answer: 'RESPUESTA',
  caseSensitive: false,
  onSolve: () => { addInventoryItem('Nuevo ítem'); }
}
```

### Cambiar duración
```javascript
const GAME_CONFIG = {
  totalTime: 90 * 60,  // Cambiar a 60*60 para 60 minutos
  ...
};
```

### Añadir sonidos
```javascript
// Añadir al head:
// <audio id="snd-success" src="assets/success.mp3"></audio>

// En solvePuzzle():
document.getElementById('snd-success')?.play();
```

---

## 📊 MÉTRICAS Y ANALYTICS

Añade Google Analytics para trackear:
- Tasa de completado por fase
- Puzzles con mayor abandono
- Tiempo promedio por puzzle
- Conversión compra → juego

```html
<!-- En game.html antes de </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=TU-ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'TU-ID');
  
  // Trackear eventos de puzzle
  // Llamar en solvePuzzle():
  gtag('event', 'puzzle_solved', { puzzle_id: puzzle.id });
</script>
```

---

## 🎯 HOJA DE RUTA DE MEJORAS

### V1.1 (Próximas 2 semanas)
- [ ] Modo multijugador sincronizado (WebSockets)
- [ ] Sistema de leaderboard global
- [ ] Música ambient procedural

### V1.2 (1 mes)
- [ ] 3 escenarios adicionales (diferente narrativa)
- [ ] Panel de administrador con estadísticas
- [ ] Soporte para team building corporativo

### V2.0 (3 meses)
- [ ] App móvil (React Native)
- [ ] Realidad aumentada para pistas físicas
- [ ] API para integraciones corporativas

---

## 📞 SOPORTE

Para preguntas técnicas, abre un issue en GitHub.
Para licencias corporativas: contacto@tudominio.com

---

*PROMETHEUS Escape Room — Hecho con ☢ y mucho café*
