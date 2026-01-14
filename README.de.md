# Swiss Learning Analytics LLM Tutor

Dieses Repository enthält einen Open-Source-Lern­tutor auf Basis von Large Language Models (LLMs), der es Institutionen ermöglicht, einen eigenen fallbasierten, personalisierten LLM-basierten Lerntutor zu betreiben. Das System ist darauf ausgelegt, Lernende beim Verständnis abstrakter oder anspruchsvoller Inhalte zu unterstützen, indem diese in interaktive und realitätsnahe Fall­szenarien eingebettet werden.

Der Tutor wurde im Rahmen des BeLEARN-Projekts ["LLM-basiertes Training mit personalisierten Fallbeispielen"](https://belearn.swiss/forschung-praxis/projekte/llm-basiertes-training-mit-personalisierten-fallbeispielen/) entwickelt. In diesem Projekt wurde untersucht, wie Large Language Models das Lernen in anspruchsvollen methodischen Veranstaltungen wie Statistik unterstützen kann. Ab 2026 wird das System im BeLEARN Folgeprojekt ["Erfolgreiches Lernen mit LLM-Tutoren: Merkmale lernförderlicher Interaktionen"](https://belearn.swiss/forschung-praxis/projekte/erfolgreiches-lernen-mit-llm-tutoren/) weiterentwickelt, mit dem Ziel herauszufinden, welches Verhalten in der Interaktion mit dem LLM-basierten Tutor mit erfolgreichem Lernen assoziiert ist.

Anstatt Inhalte lediglich passiv zu konsumieren, interagieren Lernende mit dem Tutor ähnlich wie mit einer menschlichen Lehrperson. Sie werden durch anwendungsnahe Szenarien geführt, dazu aufgefordert, ihre Überlegungen zu erläutern, und erhalten adaptives Feedback, wenn ihre Erklärungen unvollständig oder fehlerhaft sind. Durch die systematische Verknüpfung von Theorie und Praxis soll der Tutor Engagement, Verständnis und Lernerfolg fördern, insbesondere in Bereichen, in denen abstrakte Inhalte häufig Schwierigkeiten bereiten.

Durch die Open-Source-Ausrichtung und die Möglichkeit zum Selbst-Hosting können Hochschulen, Lehrpersonen und Forschende KI-gestützte Tutorien in ihren eigenen Bildungskontexten einsetzen, anpassen und wissenschaftlich untersuchen, wobei die volle Kontrolle über Daten und Infrastruktur erhalten bleibt. Sollten Sie den Tutor oder das GitHub-Projekt nicht selbst auf Ihrer eigenen Infrastruktur betreiben wollen oder können, ist ein Betrieb über unseren Non-Profit-Verein Swiss Learning Analytics (www.learning-analytics.ch) möglich. Unser Ziel ist es, moderne Technologien mit Erkenntnissen aus der Lernforschung zu verbinden und direkt in die Bildungspraxis zu übertragen.

Um den Mehrwert des Projekts zu maximieren und gegenseitiges Lernen zu fördern, ermutigen wir alle, selbst entwickelte Tutoren mit der Community zu teilen. Auf [GitHub](https://github.com/SwissLearningAnalytics/LLMTutor) finden sich im Verzeichnis [tutors/tutors/](./tutors/tutors) mehrere Beispiele bereits umgesetzter Tutoren, die sowohl als Inspiration als auch als konkrete Referenzen für die eigene Arbeit dienen können. Die Veröffentlichung eines eigenen Tutors bietet die Möglichkeit, andere in ihrer Arbeit zu unterstützen, gemeinsam die Vision einer forschungsbasierten und praxisnahen KI-gestützten Lernbegleitung weiterzuentwickeln und zugleich den gesellschaftlichen Impact der eigenen Arbeit zu erhöhen, da alle von diesem Engagement profitieren können. Auf diese Weise wachsen individuelle Beiträge zu einer gemeinsamen Ressource, von der langfristig alle Beteiligten profitieren. 
Wenn Sie einen neuen Tutor entwickeln und diesen über das Repository verfügbar machen möchten oder Schulung, Beratung oder den Betrieb benötigen, kontaktieren Sie uns bitte per E-Mail unter [borter@learning-analytics.ch](mailto:borter@learning-analytics.ch). 

Wir hoffen, dass Ihnen dieses Projekt dabei hilft, Ihre Expertise und Erfahrung mit moderner, lernwissenschaftlich fundierter Technologie zu verbinden, um Lernende bestmöglich beim Lernen zu unterstützen.



  ## Voraussetzungen

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/) Paketmanager
- [Docker](https://www.docker.com/get-started/) (für die lokale Datenbank)
- Einer der folgenden LLM-Dienste:
  - OpenAI-API-Key (für Produktion)
  - [Ollama](https://ollama.com/) (für lokale Entwicklung)


## Schnellstart

1. **Abhängigkeiten installieren:**
   ```bash
   pnpm install
   ```

2. **Entwicklungsdatenbank starten:**
   ```bash
   pnpm db:up
   ```

3. **Schema auf die Entwicklungsdatenbank anwenden:**
   ```bash
   pnpm db:push
   ```

4. **Benötigtes Modell herunterladen (`mistral:v0.3` standardmässig) und Ollama starten:**
   ```bash
   ollama pull mistral:v0.3
   ollama serve
   ```

5. **Entwicklungsserver starten:**
   ```bash
   pnpm dev
   ```

6. **Auf die Anwendung zugreifen:**
   Öffnen Sie Ihren Browser und rufen Sie  
   [http://localhost:3000/overview](http://localhost:3000/overview) auf.


## Konfiguration

### KI-Anbieter

Die Anwendung unterstützt zwei KI-Anbieter:

- **Ollama (lokal)**: Standard im Entwicklungsmodus
- **OpenAI**: Standard für Produktions-Builds

Der Standardanbieter kann über die Umgebungsvariable `VITE_AI_PROVIDER` überschrieben werden:

```bash
# OpenAI verwenden
VITE_AI_PROVIDER=openai

# Ollama verwenden
VITE_AI_PROVIDER=ollama-local
```

Bei Verwendung von OpenAI muss der API-Key über die Umgebungsvariable `OPENAI_API_KEY` gesetzt werden.


### Modellauswahl

Die verfügbaren Modelle sind in `src/lib/ai/model.ts` konfiguriert. Das jeweils erste Modell pro Anbieter ist das Standardmodell.

**Neue Modelle hinzufügen:**
1. Öffnen Sie `src/lib/ai/model.ts`
2. Fügen Sie den Modelldeskriptor zum passenden Anbieter-Array hinzu

**Ein bestimmtes Modell verwenden (nur Entwicklung):**

In der lokalen Entwicklung oder in Entwicklungs-Builds kann ein Modell über einen Query-Parameter festgelegt werden (z. B. `?model=gpt-4o`).

> **Hinweis:** Die Modellauswahl per Query-Parameter ist in Produktions-Builds deaktiviert.


### Modi

Der Tutor hat zwei unterschiedliche Modi.  
In einem Modus müssen Nutzer die Feedback-Fragen beantworten, um fortzufahren (Studienmodus), im anderen nicht (Nicht-Studienmodus).  
Die Fragen und die Benutzeroberfläche unterscheiden sich zwischen den beiden Modi.

Um zwischen den Modi zu wechseln, muss die Anwendung über unterschiedliche URLs aufgerufen werden.  
Der Standardmodus ist der Studienmodus.  
Für den Nicht-Studienmodus rufen Sie `http://demo.localhost:3000` auf.

Die URL für den Nicht-Studienmodus kann über die Umgebungsvariable `VITE_NON_STUDY_MODE_HOSTNAME` konfiguriert werden.



## Entwicklung

### YAML-Datei erstellen

Die YAML-Datei enthält alle Informationen zur Erstellung eines neuen Tutors.  
Insbesondere enthält sie die System Message. Das Verhalten des Tutors wird durch diese System Message gesteuert – eine versteckte Instruktion, die das Verhalten des LLM kontrolliert.  
Auf Basis der System Messages der bestehenden Tutoren wurden Richtlinien erstellt, wie eine effektive System Message formuliert werden soll. Diese finden Sie hier:  
[Guidelines YAML File](./tutors/tutors/guidelines_tutor_yaml_file.pdf).  

### Tutoren hinzufügen

Tutoren werden in YAML-Dateien im Verzeichnis `tutors/tutors/` definiert.

1. **Tutor-Datei erstellen oder anpassen:**
   ```bash
   # Beispiel: tutors/tutors/my-new-tutor.yaml
   ```

2. **Notwendigen Code generieren:**
   ```bash
   pnpm prepare
   ```
   
   Dieses Skript erzeugt `tutors/index.ts`, das alle Tutoren lädt.


### Datenbankverwaltung

Das Projekt verwendet PostgreSQL mit Drizzle ORM.

```bash
# Datenbank starten
pnpm db:up

# Datenbank stoppen
pnpm db:down

# Schema auf die Entwicklungsdatenbank übertragen
pnpm db:push

# Migrationen generieren
pnpm db:migrations:generate

# Migrationen anwenden
pnpm db:migrations:appu

# Drizzle-Datenbankviewer starten
pnpm db:studio
```

Das Datenbankschema ist in `src/lib/db/schema.ts` definiert.

> **Hinweis:** Beim Deployment der Anwendung muss sichergestellt werden, dass die aktuellen Migrationen auf die Produktionsdatenbank angewendet werden.  
Dies geschieht nicht automatisch.


## Build für die Produktion

Die Anwendung für eine bestimmte Umgebung bauen:

```bash
pnpm build:<env>
```

Die Ausgabe wird im Ordner `.output` abgelegt.

> **Hinweis:** Beim Ausführen der gebauten Anwendung müssen einige Umgebungsvariablen im Laufzeitsystem gesetzt sein.

## Projektstruktur

```
src/
├── lib/
│   ├── ai/          # Konfiguration der KI-Anbieter
│   ├── db/          # Datenbankschema und Hilfsfunktionen
│   └── feedback/    # Feedbacksystem
├── routes/          # Applikationsrouten
├── components/      # React-Komponenten
└── styles/          # Globale Styles

tutors/
└── tutors/          # Tutor-YAML-Definitionen

drizzle/             # Datenbank-Migrationen
```

## Lizenz

Siehe die Datei [LICENSE](LICENSE) für Details.
