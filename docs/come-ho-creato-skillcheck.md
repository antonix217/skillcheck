# Come ho creato SkillCheck

SkillCheck è una web app che misura le capacità cognitive e riflessive dell'utente attraverso 7 mini-giochi. Ecco come è nata.

---

## L'idea

Volevo un sito dove chiunque potesse misurare le proprie abilità di reazione, mira, memoria, digitazione, matematica, scansione visiva e percezione dei colori — tutto in circa 5 minuti. Alla fine si ottiene un punteggio da 0 a 1000 per ogni disciplina, un radar chart, e una posizione nella classifica mondiale.

---

## Stack tecnico

| Tecnologia | Uso |
|---|---|
| **React 19 + TypeScript** | Frontend |
| **Vite** | Build tool |
| **Tailwind CSS v4** | Stile |
| **motion/react** | Animazioni |
| **Recharts** | Radar chart nei risultati |
| **Supabase** | Database, autenticazione (Google + email) |
| **Vercel** | Deploy e hosting |
| **GitHub** | Versionamento |

---

## I 7 giochi

### 1. Reaction Time
L'utente deve cliccare appena lo schermo diventa verde. Si misurano 5 round e si prende la mediana. Punteggio: 200ms = 1000 punti, 533ms = 1 punto.

### 2. Aim Precision
Bersagli circolari appaiono in posizioni casuali con dimensioni variabili. 15 secondi per colpirne più possibili. Ogni mancato colpo penalizza. 25 bersagli = punteggio eccellente.

### 3. Visual Memory
Una griglia 3×3 mostra una sequenza di caselle illuminate. L'utente deve ripetere la sequenza. Ad ogni livello la sequenza cresce. L'errore termina il gioco.

### 4. Typing Speed
Una parola alla volta. L'utente digita e preme spazio per confermare. 15 secondi. Il punteggio tiene conto delle parole al minuto (WPM) e dell'accuratezza.

### 5. Math Sprint
Addizioni, sottrazioni e moltiplicazioni semplici. 30 secondi. Ogni risposta corretta vale 1 punto, ogni errore -0.5.

### 6. Pattern Scan
Una griglia di simboli. L'utente deve trovare il simbolo unico (quello diverso dagli altri) il più in fretta possibile. 10 livelli con griglie sempre più grandi.

### 7. Color Perception
Una griglia di quadrati tutti dello stesso colore tranne uno. L'utente deve trovare quello diverso. Con i livelli la differenza di tonalità diminuisce e la griglia cresce.

---

## Come funziona il punteggio

Ogni gioco produce un punteggio normalizzato da **0 a 1000**. Il punteggio finale è la media dei 7 giochi. Le formule sono calibrate su performance umane reali:

- **Reaction Time**: `1000 - (mediana_ms - 200) × 3`
- **Aim Precision**: `hits × 40 - mancati × 20`
- **Visual Memory**: `(livello - 2) × 100`
- **Typing Speed**: `(WPM - 10) × 11 × accuratezza`
- **Math Sprint**: `(punti - 5) × 40`
- **Pattern Scan**: `1000 - (media_ms - 500) × 0.66`
- **Color Perception**: `(livello - 1) × 52`

---

## Autenticazione e classifica

L'accesso è opzionale ma necessario per salvare il punteggio. Supporta:
- **Google OAuth** (login con un click)
- **Email + password** (con verifica email)

I punteggi vengono salvati su **Supabase PostgreSQL**. La classifica mondiale mostra solo i test completi (tutti e 7 i giochi), con il miglior punteggio per ogni utente.

---

## Deploy

Il sito è deployato su **Vercel** con deploy automatico ad ogni push su `main`. Le variabili d'ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) sono configurate direttamente su Vercel.

🔗 **Live**: https://skillcheck-three.vercel.app
📦 **Repository**: https://github.com/antonix217/skillcheck
