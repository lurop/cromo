# Cromo — Especificación del proyecto

> **Cómo usar este archivo:** colocalo en la raíz del repo (renombralo `CLAUDE.md`) para que Claude Code lo use como contexto permanente. Después construí **por fases**, pidiendo una cosa por vez (ver "Secuencia de construcción" al final). No pidas la app entera de una.

> **Nombre:** "Cromo". No usar "Mundial 2026", "World Cup" ni "Copa Mundial" en el branding (marcas de FIFA).

---

## 1. Qué es

Un álbum de figuritas digital del Mundial 2026, mobile-first, montado sobre la fiebre de las figuritas físicas. La vuelta de tuerca: **no se compran los sobres, se ganan**. El usuario colecciona, intercambia y completa el álbum. Diferenciales frente a Panini:
- **Ingenio:** se ganan sobres con minijuegos (no solo con plata/suerte).
- **Justicia:** las repetidas nunca se desperdician (se convierten en moneda).
- **Cero frustración:** sistema de *pity* que garantiza recompensas.
- **Alma:** leyendas educativas reales + un globo terráqueo interactivo.

---

## 2. Restricciones legales (NO NEGOCIABLES)

Estas reglas mandan sobre cualquier decisión de diseño.

- **Prohibido** usar nombres, caras, apodos o cualquier elemento que **identifique a un jugador real** (derechos de imagen y marca; los apodos identificables, ej. "Dibu"/"CR7", cuentan como identificación).
- **Prohibido** usar escudos de federación (AFA, CBF, etc.), logos de marca de indumentaria (Adidas/Nike), sponsors, y el emblema/mascota/trofeo de FIFA.
- **Permitido:** banderas nacionales (símbolos públicos), los **colores actuales** de cada selección, los **números**, y **camisetas de diseño propio** (no copia exacta de la oficial).
- **Leyendas educativas:** solo hechos **verificables y con fuente**, sobre el **colectivo/historia del equipo**, nunca destacando individuos por nombre.
- **Economía cerrada:** las figuritas no se compran ni se venden por dinero real, ni hay apertura de sobres aleatoria pagada con dinero real (evita regulación tipo *loot box*, sensible por el público infantil).
- Confirmar todo con un abogado antes del lanzamiento.

---

## 3. Identidad visual — "Noche de campeón"

Premium, negro y oro metálico.

- **Paleta:** fondo `#0c0a07`/`#14110d`; oro `#D4AF37`, oro claro `#F0D77B`, oro oscuro `#A8842A`; crema `#F4EEE3`; texto tenue `#B8AE9C`/`#857B69`. Líneas `rgba(212,175,55,.16)`.
- **Rarezas (color):** Común `#9DA3AB`, Especial `#4FA3E3`, Brillante `#9B6DD6`, Legendaria `#D4AF37`.
- **Tipografía:** display deportivo (ej. *Anton*) para números/títulos; sans limpia (ej. *Hanken Grotesk*) para cuerpo.
- **Principios:** modo oscuro, gradientes sutiles, microinteracciones "jugosas". Momentos clave con animación: apertura de sobre (sobre que se rasga, carta que gira y destella), **brillo foil** en las legendarias, confeti en momentos grandes.
- Hay un prototipo de referencia (`index.html`) y un globo (`globo-mundial.html`) ya construidos con esta estética; sirven como base de estilo y de lógica.

---

## 4. Stack técnico

- **Frontend:** PWA instalable (manifest + service worker). Mobile-first, contenedor centrado tipo app (~440px máx en desktop). Vanilla JS o un framework liviano; sin dependencias pesadas innecesarias.
- **Backend:** Supabase (auth + Postgres + realtime). Necesario para cuentas, inventarios e intercambio (no se puede hacer solo en el cliente).
- **Auth:** "Iniciar sesión con Google" + **modo invitado** (probar sin registro; registrarse para no perder progreso y para intercambiar).
- **Hosting:** Cloudflare Pages (gratis, permite uso comercial).
- **Sin publicidad.** Sin almacenamiento en `localStorage` para datos de cuenta (va en Supabase); cache de PWA aparte.
- **Distribución:** lanzar como PWA primero; envolver para Play Store (TWA) más adelante (cuenta nueva exige prueba cerrada de 12 testers por 14 días).

---

## 5. Modelo de datos (Postgres / Supabase)

```
teams            (id, name, flag_code, color_primary, color_secondary,
                  color_number, kit_type ['solid'|'stripes'], fifa_rank, tier ['S'|'A'|'B'|'C'])
stickers         (id, team_id, number [1..N], line ['def'|'mid'|'att'], rarity)
users            (id, display_name, is_guest, created_at)
user_stickers    (user_id, sticker_id, count)            -- count>1 = repetidas
user_state       (user_id, purpurina, streak, last_daily_claim,
                  pity_counter, energy, energy_updated_at)
trades           (id, from_user, to_user, offered_ids[], requested_ids[],
                  status ['pending'|'accepted'|'rejected'|'cancelled'], created_at)
legends          (id, team_id, line, text, source_url, verified)
```

Reglas de servidor (no confiar en el cliente): apertura de sobres, conversión a Purpurina, compras, y ejecución de intercambios se validan en el backend (Supabase Edge Functions o RPC).

---

## 6. Economía y mecánicas

- **Rarezas y probabilidades (publicadas en la app):** Común 70% · Especial 22% · Brillante 7% · Legendaria 1%.
- **Sobre = 5 figuritas.** Por cada figurita: se sortea rareza, luego una figurita aleatoria de esa rareza. Si ya la tenés → repetida.
- **Repetidas → Purpurina** (moneda): Común +1, Especial +5, Brillante +20, Legendaria +100. Se gasta en la **tienda** para comprar figuritas faltantes (costo por rareza: 8 / 30 / 90 / 400, ajustable).
- **Pity:** blando (la chance de legendaria sube tras 30 sobres sin una) + duro (garantizada a los 50). Mostrar contador "garantizada en X".
- **Racha diaria:** recompensa creciente por días consecutivos; día 7 = sobre brillante. **Escudo de racha:** perdonar un día (automático o ganado) para no castigar de más.
- **Recompensas de completado:** por completar una **línea** (defensa/medio/ataque → desbloquea leyenda), una **página/equipo**, y el **álbum** entero.
- **Eventos por jornada** durante el Mundial (sobre del día temático, misiones atadas al fixture real).
- **Energía** para minijuegos: recarga **solo por tiempo** (sin anuncios). Ej. máx 5, +1 cada 30 min.

---

## 7. Contenido

### Selecciones: las 48 oficiales, con tiers por ranking FIFA
Congelar el ranking en una fecha al lanzar. El **tier del equipo** + la **posición/número** definen la rareza de cada figurita (ej.: el "10" de un Tier S = Legendaria; el "10" de un Tier C = Especial; un suplente = Común en cualquiera).

- **Tier S (ranking 1–6):** Francia, España, Argentina, Inglaterra, Portugal, Brasil.
- **Tier A (7–16):** Países Bajos, Marruecos, Bélgica, Alemania, Croacia, Colombia, Senegal, México, Estados Unidos, Uruguay.
- **Tier B (17–32):** Japón, Suiza, Irán, Austria, Ecuador, Australia, Corea del Sur, Egipto, Canadá, Costa de Marfil, Qatar, Argelia, Suecia, Túnez, Chequia, Turquía.
- **Tier C (33–48):** Noruega, Escocia, RD Congo, Bosnia y Herzegovina, Panamá, Arabia Saudita, Sudáfrica, Irak, Uzbekistán, Paraguay, Ghana, Jordania, Cabo Verde, Curazao, Haití, Nueva Zelanda.

### Figuritas
Cada figurita = **camiseta de diseño propio** en los **colores de la selección** + **número** (sin escudos ni marcas). Cada selección tiene su **bandera** como identificación.

### Leyendas (feature educativa)
48 equipos × 3 líneas = **144 textos**. Cada uno: breve, **real, verificado y con fuente**, sobre la historia/identidad colectiva del equipo. Construir como **pipeline editorial** (investigar por tanda, chequear cada dato). Se desbloquean al completar la línea correspondiente.

---

## 8. Pantallas y navegación

Barra inferior (pensada para el pulgar): **Álbum · Sobres · Cambios · Juego · Perfil**.

- **Álbum:** abre por defecto al **globo** (hub); con alternativa de **lista** de selecciones. Tocar un país → su página de figuritas (casilleros llenos/vacíos, % de avance, leyendas por línea). Vacíos muestran la camiseta "fantasma" con el número.
- **Sobres:** abrir sobres (con animación), sobre diario + racha, medidor de pity.
- **Cambios:** intercambio entre usuarios (ver sección 10).
- **Juego:** menú de minijuegos.
- **Perfil:** stats, % global, cosméticos, ajustes.

---

## 9. El globo (hub del álbum)

- Planeta 3D con **contornos reales** de los países (datos Natural Earth 110m; ya procesados en `globo-mundial.html`).
- Las **48 selecciones encendidas en oro**; **brillo/intensidad = % completado** de cada una.
- Estética "Noche de campeón": planeta oscuro, grilla y atmósfera doradas, contornos nítidos. Técnica liviana (proyección ortográfica sobre canvas) para girar fluido en mobile.
- Tocar un país → entra a su página de álbum.
- **Cabo Verde y Curazao** (islas no presentes como polígono a 110m) → punto dorado en su ubicación real.
- **Inglaterra y Escocia** comparten el territorio del Reino Unido en el mapa → se enciende como una pieza y, al tocarla, se aclara que son dos selecciones.

### Mejoras de usabilidad mobile (IMPORTANTE — pedido del usuario)
Los países chicos son difíciles de tocar. Implementar las tres:
1. **Tolerancia de toque:** si el toque no cae dentro de ningún país participante, seleccionar el participante **más cercano** dentro de un radio angular (~8°).
2. **Zoom:** pellizcar para acercar + doble-tap, con paneo; los países chicos se agrandan antes de tocarlos.
3. **Lista alternativa:** listado de las 48 (por grupo o alfabético, con buscador) como vía de selección garantizada.

---

## 10. Intercambio entre usuarios

- Cada usuario tiene **Repes** (sobran) y **Faltan**.
- **Mercado:** publicar "Ofrezco X / Busco Y" o navegar ofertas; **match automático** (tu repe = su faltante y viceversa).
- **Confirmación de los dos lados** antes de ejecutar (anti-estafa). Transacción validada en el servidor.
- **Economía cerrada:** sin dinero real. Límite de cambios por día (ej. 20) y reporte de usuarios contra abuso/bots.

---

## 11. Minijuegos (para ganar sobres)

Tres para el MVP, mecánicas probadas y accesibles (no dependen de fútbol). Se **clona la mecánica** (legal) con skin propio:
1. **Memoria / Pares.**
2. **Merge tipo 2048.**
3. **Stack / timing.**
Más adelante: Match-3, etc. Cada partida consume energía.

---

## 12. Monetización (limpia)

Free-to-play. Ingresos solo de lo que **no afecta la colección ni mete azar pago**: **cosméticos** (skins de álbum, brillos, marcos) y **pase de temporada** (recompensas extra por jugar). **Sin publicidad.**

---

## 13. Continuidad / escalado

Plantel propio = no se depende del calendario FIFA. Tras completar el álbum del Mundial, lanzar **nuevas temporadas/colecciones** a ritmo regular (estilo Fortnite/Candy Crush). Persisten entre temporadas: cuenta, Purpurina, cosméticos, stats y la **red de intercambios** (su mayor foso defensivo).

---

## 14. Roadmap por fases (orden de construcción)

**Fase 0 — MVP jugable (cliente, sin backend).** Loop de un jugador: abrir sobres (animación), álbum, repes→Purpurina, tienda, pity, racha. Estado en memoria. *(Ya existe un prototipo: `index.html`.)*
- *Hecho cuando:* se puede abrir sobres, completar el álbum vía sobres + tienda, con la estética puesta.

**Fase 1 — Cuentas y social.** Supabase: auth (Google + invitado) y persistencia. **Sistema de intercambio** completo. Misiones/logros.
- *Hecho cuando:* el progreso persiste entre sesiones y dos usuarios pueden intercambiar.

**Fase 2 — Mundial y mundo.** Integrar el **globo** con % reales como hub. **48 selecciones** con tiers por ranking. **Leyendas** por línea. Prode opcional + eventos por jornada. Leaderboards.
- *Hecho cuando:* el globo navega el álbum real, las 48 están con sus rarezas, y completar líneas desbloquea leyendas verificadas.

**Fase 3 — Pulido y monetización.** Cosméticos, pase de temporada, más minijuegos, notificaciones push, optimización.

---

## 15. Assets / datos a conseguir

- Contornos de países: Natural Earth 110m (ya procesado en `globo-mundial.html`).
- Banderas: set SVG open-source con licencia permisiva (ej. MIT).
- Ranking FIFA: snapshot a una fecha (la próxima edición sale el 11/6/2026).
- Lista de las 48 + grupos (definida).
- Camisetas: generadas por código (SVG) según colores + número (ya hay un generador en `index.html`).

---

## 16. Pendientes de diseño

- **Sonido / audio** (a definir en la próxima sesión): efecto al abrir sobre, revelado de legendaria, feedback de UI, música ambiente.
- Validación legal final con un abogado.

---

## Secuencia de construcción con Claude Code (sugerida)

No pidas todo junto. Una tarea por prompt, en este orden:

1. *"Inicializá el repo como PWA (manifest + service worker) con la estética Noche de campeón de la sección 3. Armá el shell: header, barra inferior (Álbum/Sobres/Cambios/Juego/Perfil) y ruteo entre pantallas vacías."*
2. *"Implementá la Fase 0 (sección 6 y 8): abrir sobres con animación, álbum por selección, repes→Purpurina y tienda, pity y racha. Estado en memoria por ahora. Usá el generador de camisetas y la lógica del prototipo `index.html` como base."*
3. *"Integrá el globo de `globo-mundial.html` como hub del Álbum, con las tres mejoras mobile de la sección 9."*
4. *"Conectá Supabase: esquema de la sección 5, auth Google + invitado, y persistencia del estado."*
5. *"Implementá el intercambio entre usuarios (sección 10)."*
6. *"Cargá las 48 selecciones con tiers (sección 7) y el sistema de leyendas por línea (sección 7), dejando los textos como pendientes a verificar."*

Después: prode/eventos, minijuegos extra, cosméticos, push.
