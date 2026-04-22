# Pagina Profilo — Design
**Data:** 2026-04-22

## Overview

Aggiungere una pagina profilo raggiungibile cliccando sull'avatar/username nell'header. Mostra info utente, storico partite e pulsante di logout.

---

## 1. Navigazione

Il tipo `View` in `App.tsx` passa da `'landing' | 'game' | 'results'` a `'landing' | 'game' | 'results' | 'profile'`.

- **AuthButton loggato:** click su avatar/username → `setView('profile')`
- **AuthButton non loggato:** invariato → apre AuthModal
- Il pulsante "Esci" viene rimosso dall'AuthButton e spostato nella pagina profilo

---

## 2. Layout Pagina Profilo

Una colonna centrata, max-w-2xl, stile coerente con il resto (bg `#050505`, `.theme-card`).

### Hero card
- Avatar: se `user.user_metadata.avatar_url` esiste → `<img>` circolare; altrimenti cerchio `#00F5FF` con iniziale maiuscola
- Username: testo grande (font-bold)
- Data iscrizione: `profile.created_at` formattata `dd/mm/yyyy`

### Storico partite card
- Titolo "I Miei Score"
- Lista run da `fetchMyScores(user.id)`
- Colonne per ogni riga: **Data** | **Score Totale**
- Ordinato per data decrescente (già gestito dal helper)
- Max 20 righe visibili, scroll verticale se superato
- Stato vuoto: "Nessuna partita ancora."
- Stato loading: "Caricamento..."

### Footer (fuori dalle card)
- Pulsante **"Esci"** — chiama `signOut()` poi `setView('landing')`
- Pulsante **"Home"** — chiama `setView('landing')`

---

## 3. File Modificati / Creati

| Azione | File | Cosa cambia |
|--------|------|-------------|
| Crea | `src/components/Profile.tsx` | Componente completo della pagina profilo |
| Modifica | `src/App.tsx` | Aggiunge `'profile'` a View, rimuove "Esci" da AuthButton, aggiunge render del Profile, passa `onHome` e `onSignOut` |

---

## 4. Out of Scope

- Modifica username
- Cambio avatar
- Statistiche aggregate per gioco (radar, best score)
- Paginazione oltre 20 run
