# SkillCheck — Revisione Formule di Punteggio

Sto sviluppando una web app di benchmark cognitivo con 7 mini-giochi. Ogni gioco produce un punteggio normalizzato da 0 a 1000. Il punteggio finale è la media dei 7 giochi. Vorrei sapere se le formule sono ben calibrate per discriminare i livelli di abilità degli utenti (principiante, medio, esperto).

---

## 1. Reaction Time

**Cosa misura:** velocità di reazione visiva. L'utente clicca appena lo schermo cambia colore. Si fanno 5 round, si prende la mediana.

**Formula:**
```
score = clamp(0, 1000, 1000 - (mediana_ms - 200) * 3)
```

**Calibrazione:**
- 200ms → 1000 (riflessi eccezionali)
- 250ms → 850
- 300ms → 700
- 400ms → 400
- 533ms → 1
- 600ms+ → 0

**Domanda:** La mediana umana è circa 250ms. Questa formula penalizza troppo i tempi sopra 400ms?

---

## 2. Aim Precision

**Cosa misura:** precisione e velocità nel cliccare bersagli circolari di dimensioni casuali. 15 secondi, bersagli che appaiono in posizioni random.

**Formula:**
```
score = clamp(0, 1000, hits * 40 - misses * 20)
```

**Calibrazione:**
- 25 colpi, 0 mancati → 1000 (eccellente)
- 20 colpi, 2 mancati → 760
- 15 colpi, 3 mancati → 540 (buono)
- 10 colpi, 5 mancati → 300
- 0 colpi → 0

**Domanda:** È giusto pesare un miss come metà di un hit? O dovrebbe essere penalizzato di più?

---

## 3. Visual Memory

**Cosa misura:** memoria sequenziale visiva. Una griglia 3×3 mostra caselle illuminate in sequenza, l'utente deve ripetere l'ordine. Ogni livello aggiunge un elemento alla sequenza (livello 1 = 3 elementi, livello 2 = 4, ecc.).

**Formula:**
```
score = clamp(0, 1000, (livello - 2) * 100)
```

**Calibrazione:**
- Livello 2 → 0
- Livello 5 → 300
- Livello 7 → 500
- Livello 10 → 800
- Livello 12 → 1000

**Domanda:** La scala lineare è appropriata o dovrebbe essere esponenziale visto che la difficoltà cresce molto con la lunghezza della sequenza?

---

## 4. Typing Speed

**Cosa misura:** velocità di digitazione. Una parola alla volta per 15 secondi. Score basato su WPM (parole al minuto) e accuratezza.

**Formula:**
```
wpm = parole_corrette * 4        // 15s → WPM
accuracy = corrette / (corrette + errori)
score = clamp(0, 1000, (wpm - 10) * 11) * accuracy
```

**Calibrazione:**
- 100 WPM, 100% acc → 990
- 80 WPM, 95% acc → 742
- 60 WPM, 90% acc → 550
- 40 WPM, 85% acc → 323
- 20 WPM → 110
- 10 WPM → 0

**Domanda:** La media umana è circa 40-50 WPM. La formula è troppo generosa con chi va veloce o troppo penalizzante con chi va lento?

---

## 5. Math Sprint

**Cosa misura:** velocità di calcolo mentale. Addizioni, sottrazioni e moltiplicazioni semplici. 30 secondi. Ogni risposta corretta +1 punto, ogni errore -0.5 punti.

**Formula:**
```
final = corretti - (errori * 0.5)
score = clamp(0, 1000, (final - 5) * 40)
```

**Calibrazione:**
- 30 risolti, 0 errori → 1000
- 20 risolti, 2 errori → 580
- 15 risolti, 3 errori → 400
- 10 risolti, 0 errori → 200
- 5 risolti → 0

**Domanda:** Il tempo è 30 secondi (doppio rispetto agli altri giochi). La normalizzazione è coerente con gli altri?

---

## 6. Pattern Scan

**Cosa misura:** velocità di scansione visiva. Una griglia di simboli dove uno solo è diverso dagli altri. 10 livelli con griglie da 3×3 a 12×12. 7 secondi per livello.

**Formula:**
```
media_ms = tempo_totale / livelli_completati
score = clamp(0, 1000, round(1000 - (media_ms - 500) * 0.66))
```

Se il timer scade su un livello, aggiunge 7000ms alla media.

**Calibrazione:**
- 500ms media → 1000
- 1000ms media → 670
- 1250ms media → 500
- 2000ms media → 10
- 2000ms+ → 0

**Domanda:** La formula misura il tempo medio su tutti i livelli, ma i livelli difficili (griglie grandi) richiedono naturalmente più tempo. Non sarebbe più giusto normalizzare per livello?

---

## 7. Color Perception

**Cosa misura:** percezione cromatica. Una griglia di quadrati tutti dello stesso colore HSL, tranne uno con una leggera variazione di luminosità. 20 livelli con griglia crescente e differenza di tonalità decrescente. 10 secondi per livello.

**Formula:**
```
score = clamp(0, 1000, (livello - 1) * 52)
```

Differenza di luminosità per livello: `max(2, 18 - livello * 0.9)`

**Calibrazione:**
- Livello 1 → 0
- Livello 5 → 208
- Livello 10 → 468
- Livello 15 → 728
- Livello 20 → 988 (~1000)

**Domanda:** La difficoltà è lineare ma la percezione umana dei colori non lo è. Dovrei usare una curva esponenziale per la differenza di luminosità?

---

## Domanda Generale

Il punteggio finale è la **media semplice** dei 7 giochi. Ha senso fare una media pesata dove alcuni giochi valgono di più (es. reaction time e memory sono più "cognitivi" di math sprint)?

Obiettivo: un utente medio dovrebbe ottenere circa 400-550, un esperto 700-850, un professionista 900+.
