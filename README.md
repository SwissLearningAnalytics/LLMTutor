# Swiss Learning Analytics LLM Tutor

 This application provides interactive tutors that help students learn various statistical concepts through conversational AI.

## Prerequisites

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/) package manager
- [Docker](https://www.docker.com/get-started/) (for local database)
- One of the following for LLM Services:
  - OpenAI API key (for production)
  - [Ollama](https://ollama.com/) (for local development)

## Quick Start

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start the development database:**
   ```bash
   pnpm db:up
   ```

3. **Apply schema to development database:**
   ```bash
   pnpm db:push
   ```

4. **Pull the needed model (`mistral:v0.3` by default) and start Ollama:**
    ```bash
    ollama pull mistral:v0.3
    ollama serve
    ```

5. **Start the development server:**
   ```bash
   pnpm dev
   ```

6. **Access the application:**
   Open your browser and navigate to [http://localhost:3000/overview](http://localhost:3000/overview)

## Configuration

### AI Provider

The application supports two AI providers:

- **Ollama (Local)**: Default for development mode
- **OpenAI**: Default for production builds

You can override the default provider using the `VITE_AI_PROVIDER` environment variable:

```bash
# Use OpenAI
VITE_AI_PROVIDER=openai

# Use Ollama
VITE_AI_PROVIDER=ollama-local
```

When using OpenAI, you must provide your API Key via the environment variable `OPENAI_API_KEY`.

### Model Selection

Available models are configured in `src/lib/ai/model.ts`. The first model listed for each provider is the default.

**Adding new models:**
1. Open `src/lib/ai/model.ts`
2. Add your model descriptor to the appropriate provider array

**Using a specific model (development only):**

You can specify a model via query parameter in local development or development builds (e.g.,`?model=gpt-4o`).

> **Note:** Model selection via query parameter is disabled in production builds.

### Modes
The tutor has two different modes.
One enforces users to answer the feedback questions to proceed (study mode) and the other one does not (non-study mode).
The questions and the UI are different in the two modes.

To choose between the two modes, you must access the application via different URL.
The default mode is the study mode.
To access the non-study mode you must go to `http://demo.localhost:3000`.

The URL to be used for the non-study mode can be configured via the `VITE_NON_STUDY_MODE_HOSTNAME` environment variable.

## Development

### Adding Tutors

Tutors are defined in YAML files located in `tutors/tutors/`.

1. **Create or modify a tutor file:**
   ```bash
   # Example: tutors/tutors/my-new-tutor.yaml
   ```

2. **Generate the necessary code:**
   ```bash
   pnpm prepare
   ```
   
   This script generates `tutors/index.ts`, which lazily imports all tutors.

### Database Management

The project uses PostgreSQL with Drizzle ORM.

```bash
# Start database
pnpm db:up

# Stop database
pnpm db:down

# Push schema to development database
pnpm db:push

# Generate migrations
pnpm db:migrations:generate

# Apply migrations
pnpm db:migrations:appu

# Start drizzle's database viewer
pnpm db:studio
```

Database schema is defined in `src/lib/db/schema.ts`.

> **Note:** When deploying the applicication, you must ensure that the current migrations are applied to the production database.
This is not done automatically.

## Building for Production

Build the application for a specific environment:

```bash
pnpm build:<env>
```

The output will be placed in the `.output` folder.


> **Note:** When running the built application, you must provide some of the environment variables to the running system.

## Project Structure

```
src/
├── lib/
│   ├── ai/          # AI provider configuration
│   ├── db/          # Database schema and utilities
│   └── feedback/    # Feedback system
├── routes/          # Application routes
├── components/      # React components
└── styles/          # Global styles

tutors/
└── tutors/          # Tutor YAML definitions

drizzle/             # Database migrations
```

## License

See [LICENSE](LICENSE) file for details.
