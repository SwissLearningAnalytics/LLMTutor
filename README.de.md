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

2. **Umgebung konfigurieren:** Kopieren Sie `.env.example` nach `.env`. Setzen Sie `BETTER_AUTH_SECRET` auf einen zufälligen Wert und tragen Sie `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` und `SEED_ADMIN_NAME` für das erste Admin-Konto ein. Die lokale Datenbank-URL ist in der Beispieldatei bereits enthalten.

   ```bash
   cp .env.example .env
   openssl rand -base64 32
   ```

   Tragen Sie den erzeugten Wert als `BETTER_AUTH_SECRET` in `.env` ein. Halten Sie das Admin-Passwort und den geheimen Schlüssel vertraulich.

3. **Entwicklungsdatenbank starten:**
   ```bash
   pnpm db:up
   ```

4. **Schema auf die Entwicklungsdatenbank anwenden:**
   ```bash
   pnpm db:push
   ```

5. **Lokales Standardmodell (`qwen3.5:latest`) herunterladen und Ollama starten:**
   ```bash
   ollama pull qwen3.5:latest
   ollama serve
   ```

6. **Entwicklungsserver starten:**
   ```bash
   pnpm dev
   ```

7. **Auf die Anwendung zugreifen:** Öffnen Sie [http://localhost:3000/admin](http://localhost:3000/admin), melden Sie sich mit dem angelegten Admin-Konto an und erstellen Sie Ihren ersten Tutor. Veröffentlichte Tutoren erscheinen unter [http://localhost:3000/overview](http://localhost:3000/overview).

### Admin-Konto und `/admin`

Beim Serverstart erstellt die Anwendung aus `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` und `SEED_ADMIN_NAME` ein Konto mit der Rolle `admin`. Alle drei Variablen müssen gesetzt sein; fehlt eine davon, wird das Seeding übersprungen. Existiert die E-Mail-Adresse bereits, bleibt das Konto einschliesslich Passwort und Rolle unverändert. Wenden Sie das Datenbankschema vor dem Serverstart an; ein separater Seed-Befehl ist nicht nötig.

`/admin` erfordert eine Anmeldung und leitet nicht angemeldete Personen zu `/login` weiter. Angemeldete Benutzer können eigene Tutoren erstellen, bearbeiten, veröffentlichen, die Veröffentlichung aufheben und löschen. Sie können die Konversationen und Fragebogenantworten ihrer Tutoren ansehen und Konversationsdaten als CSV exportieren. Benutzer mit der Rolle `admin` können unter `/admin/users` ausserdem Konten verwalten und die Rollen `user` oder `admin` vergeben. Neue Konten werden dort von einem Admin erstellt; auf der Anmeldeseite gibt es keine öffentliche Registrierung.


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

### Datenbank und Authentifizierung

Setzen Sie `PG_CONNECTION_STRING` für PostgreSQL und `BETTER_AUTH_SECRET` für die Sitzungen. `BETTER_AUTH_URL` ist die kanonische URL der Anwendung (im Beispiel `http://localhost:3000`). Wird die Anwendung über weitere Hosts aufgerufen, können diese mit `BETTER_AUTH_ALLOWED_HOSTS` als kommaseparierte Liste zugelassen werden. Für das erste Admin-Konto setzen Sie `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` und `SEED_ADMIN_NAME` in der Serverumgebung. Wenden Sie vor dem Start des Produktionsservers die Migrationen an, damit die Benutzer- und Tutor-Tabellen beim Seeding vorhanden sind.


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

### YAML-Tutor-Definitionen

Eine YAML-Datei ist eine optionale Möglichkeit, einen Tutor für den Import zu definieren. Sie enthält unter anderem den Systemprompt, der das Verhalten des LLM steuert.
Auf Basis der System Messages der bestehenden Tutoren wurden Richtlinien erstellt, wie eine effektive System Message formuliert werden soll. Diese finden Sie hier:  
[Guidelines YAML File](./tutors/tutors/guidelines_tutor_yaml_file.pdf).  

### Tutoren hinzufügen

Im normalen Ablauf melden Sie sich unter `/admin` an, wählen **Tutor erstellen** und tragen Anzeigename, Tutor-ID, Systemprompt und optional Lernziele ein. Neue Tutoren sind zunächst unveröffentlicht. Erst nach der Veröffentlichung sind sie unter `/overview` und über ihre Tutor-URL für Lernende zugänglich.

Vorhandene YAML-Tutor-Definitionen im Verzeichnis `tutors/tutors/` können weiterhin in die Datenbank importiert werden:

1. **Tutor-Datei erstellen oder anpassen:**
   ```bash
   # Beispiel: tutors/tutors/my-new-tutor.yaml
   ```

2. **Tutor-Index generieren:**
   ```bash
   pnpm prepare
   ```
   
   Dieses Skript erzeugt `tutors/index.ts`, das alle Tutoren lädt.

3. **In die Datenbank importieren:** Melden Sie sich bei laufendem Server an und rufen Sie `/admin/import` auf. Importierte Tutoren gehören dem angemeldeten Benutzer und werden veröffentlicht. Ein erneuter Import aktualisiert Anzeigename, Prompt und Lernziele bei übereinstimmenden Tutor-IDs.


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
pnpm db:migrations:apply

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
│   ├── auth.ts      # Authentifizierung
│   ├── db/          # Datenbankschema und Hilfsfunktionen
│   ├── feedback/    # Feedbacksystem
│   └── seed/        # Seeding des ersten Admin-Kontos
├── routes/          # Applikationsrouten
├── components/      # React-Komponenten
└── styles/          # Globale Styles

tutors/
└── tutors/          # Tutor-YAML-Definitionen

drizzle/             # Datenbank-Migrationen
```

## Lizenz

Siehe die Datei [LICENSE](LICENSE) für Details.
