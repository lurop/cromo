# Cromo — Progreso del proyecto

> Documento de handoff. Cada sesión de trabajo lo actualizamos al final.
> Para el contexto general del producto, ver `CLAUDE.md`.

**Última actualización:** 2026-06-06
**Fase activa:** Fase 0 cerrada · próxima: Fase 1

---

## Estado actual

- **App pública**: https://cromo2026.luropdeuce.workers.dev
- **Repo**: https://github.com/lurop/cromo (privado)
- **Auto-deploy**: cada `git push` a `main` → live en ~30s (Cloudflare Workers/Pages, conectado al repo)
- **Branch principal**: `main`

---

## Fase 0 — Completa

MVP jugable de un jugador, estado en memoria, sin backend.

### Arquitectura
- Vanilla JS (sin frameworks), módulos vía IIFE sobre `window.Cromo`
- Carga ordenada por `<script defer>` en `index.html`
- Event delegation centralizada en `#view` (acciones por `data-action`)
- Routing por hash (`#/album`, `#/sobres`, etc.)
- PWA instalable: `manifest.json` + service worker con cache versionada (actual: `cromo-shell-v13`)
- Estética "Noche de campeón": negro + oro, Anton (display) + Hanken Grotesk (cuerpo)

### Estructura de archivos
```
/
├─ CLAUDE.md             # Spec del producto, contexto permanente para Claude
├─ PROGRESS.md           # Este archivo (handoff)
├─ index.html            # Shell PWA, header, bottom nav, carga de scripts
├─ manifest.json         # Manifiesto PWA
├─ sw.js                 # Service worker (network-first, cache fallback a index.html)
├─ assets/icon.svg       # Ícono dorado de la app
├─ css/styles.css        # Todo el design system en un archivo
├─ js/
│  ├─ icons.js           # Mapa de SVGs (ICON.gem, .flame, .bell, etc.) + banderas
│  ├─ data.js            # RAR (rarezas), TEAMS (3 selecciones), ROSTER (33 figuritas), LINES
│  ├─ jersey.js          # Generador SVG de camisetas según colores + número
│  ├─ state.js           # Estado en memoria (packs, owned, dupes, notifs, etc.)
│  ├─ pack.js            # Apertura de sobres, pity, conversiones, hooks de notifs
│  ├─ legends.js         # Mapa de leyendas (vacío en Fase 0; placeholder honesto)
│  ├─ notifications.js   # Sistema de eventos in-memory + helpers por tipo
│  ├─ anim.js            # Animación de gemas volando al chip de Purpurina
│  ├─ app.js             # Bootstrap: routing, render principal, handlers
│  └─ views/
│     ├─ sticker.js      # Card de figurita reutilizable
│     ├─ reveal.js       # Overlay de apertura (single + denso 5x)
│     ├─ sobres.js       # Pantalla de sobres + tabla de rarezas
│     ├─ album.js        # Páginas por selección, dividido por línea
│     ├─ cambios.js      # Inventario de repetidas, colapsable por país
│     ├─ tienda.js       # Comprar faltantes con Purpurina
│     ├─ notifs.js       # Panel de notificaciones
│     └─ placeholder.js  # Tabs Juego/Perfil aún vacías
└─ referencia/           # NO TOCAR — prototipos originales, solo consulta
   ├─ index.html
   └─ globo-mundial.html
```

### Features implementadas

**Economía** (sección 6 del CLAUDE.md)
- Sobres = 5 figuritas, rareza sorteada por figurita con probabilidades publicadas
- Rarezas: Común 70% (+1/–8), Especial 22% (+5/–30), Brillante 7% (+20/–90), Legendaria 1% (+100/–400)
- Pity blando desde sobre 30 (+2.5% por sobre, tope 60%), garantía dura a los 50
- Racha diaria con día 7 = sobre brillante

**Selecciones (Fase 0 subset)**
- 3 equipos: Argentina, Brasil, Francia
- 11 figuritas c/u en formación 4-3-3 (def #1-5 con arquero, mid #6-8, att #9-11)
- Arquero (#1) usa kit alterno monocromático (verde para ARG, gris/negro para BRA y FRA)
- Camisetas generadas por código (SVG), sin escudos ni marcas (respeta restricciones legales)

**Reveal de sobres**
- Single: 5 cartas grandes (96x130), flip cada 340ms
- Bulk x5: 25 cartas en grilla densa 4-cols (cards 74x92), flip cada 150ms
- Overlay scrolleable respetando safe-area (S23 friendly), confetti fixed-position
- Tag "Nueva" en cartas no repetidas
- Legendarias con glow + pulse + confetti
- Tally final con conteo de nuevas/repetidas/legendarias

**Inventario de repetidas (Cambios)**
- Las repetidas NO se auto-convierten — quedan en `state.dupes` para que el usuario elija
- Agrupadas por país en `<details>` colapsables (auto-abre si hay 1 sólo país)
- Cada item: botón "Cambiar" (disabled, Fase 1) + botón "Convertir" con valor en Purpurina
- "Convertir todo" en card superior
- Banner explicativo: "Intercambiar conserva todo el valor — convertir te da una fracción"

**Animación de conversión**
- Click en "Convertir" → 3-10 gemas doradas salen del botón en abanico
- Vuelan en arco hasta el chip de Purpurina del header (cubic-bezier, ~520ms)
- Al aterrizar la primera → mutación + render + chip-pop (scale 1.18 + glow)
- Anti doble-click con `data-busy=1`

**Sistema de notificaciones**
- Campana en header con badge rojo de no leídas (animación shake)
- Tipos: line-complete, team-complete, legendary, milestone (10/25/50/100%), streak-7, pity-hard
- Eventos detectados con snapshot before/after en `pack.openPack`
- Panel overlay con lista cronológica inversa, tiempo relativo ("recién", "hace 3 min")
- Line-complete son expandibles → muestran la leyenda desbloqueada (placeholder en Fase 0)
- Al cerrar el panel → markAllRead()
- Disclaimer: "Tu historial vive solo en esta sesión. Cuando crees cuenta (Fase 1), se guarda permanentemente."

**Pantallas placeholder**
- Juego: "Minijuegos. Llega en Fase 3."
- Perfil: "Cuenta, estadísticas y cosméticos. Llega en Fase 1."

---

## Decisiones de diseño tomadas

1. **Las repetidas no se auto-convierten** — quedan en inventario para fomentar el intercambio (sección 10 del CLAUDE.md). Convertir es una "salida de emergencia" con valor reducido para que cambiar con otros jugadores siempre sea más rentable.
2. **Tienda es subroute, no tab** — las 5 tabs están reservadas (Álbum, Sobres, Cambios, Juego, Perfil). Tienda se accede tocando el chip de Purpurina del header.
3. **Leyendas con `verified: true` flag** — el mapa `C.LEGENDS` está vacío; UI muestra placeholder honesto. Las 144 leyendas se cargan en Fase 2 como pipeline editorial con fuentes verificadas (restricción legal).
4. **Estado in-memory** — sin localStorage para datos de cuenta (regla del CLAUDE.md). Persistencia llega en Fase 1 con Supabase.
5. **Sin Mundial/FIFA en branding** — solo "Cromo". Restricciones legales de marca.

---

## Cómo correr localmente

```bash
cd C:\Users\LUCAS\Desktop\CROMO
npx serve
# abre http://localhost:3000
```

Tras cualquier cambio: **Ctrl+Shift+R** en el browser para invalidar el cache del service worker (o bumpear `CACHE_NAME` en `sw.js`).

---

## Cómo guardar cambios

```bash
git add -A
git commit -m "descripción del cambio"
git push
```

Cloudflare redeploya solo en ~30s.

---

## Próximo paso — Fase 1

**Cuentas + intercambio real con Supabase.**

Pasos en orden sugerido:

1. **Setup Supabase**
   - Crear proyecto en supabase.com (gratis hasta 500MB DB)
   - Crear esquema de tablas según sección 5 del CLAUDE.md:
     ```
     teams, stickers, users, user_stickers, user_state, trades, legends
     ```
   - Habilitar Row Level Security desde el principio

2. **Auth**
   - Configurar Google OAuth en Supabase
   - Modo invitado (anonymous auth de Supabase)
   - Pantalla de Perfil deja de ser placeholder: login/logout, "Iniciar con Google", advertencia para invitados

3. **Migración del estado**
   - `state.owned`, `state.dupes`, `state.purpurina`, `state.streak`, `state.notifications` → tablas
   - Toda mutación pasa a Supabase (RPC o Edge Functions para reglas críticas)
   - El cliente se vuelve un "view" del estado del servidor

4. **Intercambio**
   - Mercado: publicar "Ofrezco / Busco" o navegar ofertas
   - Match automático cuando hay dupe ⇄ faltante
   - Confirmación de ambos lados antes de ejecutar
   - Validación server-side (no confiar en el cliente)
   - Límite de 20 cambios/día anti-abuso

5. **Pulido**
   - Botón "Cambiar" de la pantalla de Cambios deja de estar disabled
   - Notificaciones persistentes (ya no se pierden al recargar)
   - Sistema de reporte de usuarios

**Tiempo estimado:** varias sesiones. La parte del intercambio es la más jugosa porque define el "foso defensivo" del producto a largo plazo.

---

## Pendientes menores (cuando quieras, no urgentes)

- Sonido: efectos para apertura, revelado de legendaria, conversión a Purpurina (sección 16 CLAUDE.md)
- Validación legal con abogado antes del lanzamiento público
- Hacer screenshots para la futura ficha de Play Store (TWA en Fase 3)
