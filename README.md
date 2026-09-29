# Swiss Learning Analytics LLM Tutor

This README is in English. For the German version, see [README.de.md](README.de.md).

This repository contains an open-source LLM-based learning tutor that lets institutions host their own case-based, personalized AI coach. The system is designed to help students understand abstract and technical concepts by embedding them in interactive, realistic case scenarios.

The tutor was developed as part of the BeLEARN project ["LLM-based training using personalized case examples"](https://belearn.swiss/en/research-practice/projects/llm-based-training-using-personalized-case-examples/), which investigates how large language models can support learning in demanding methodological courses such as statistics. From 2026 onward, the system is further developed in the follow-up BeLEARN project ["Successful Learning with LLM Tutors"](https://belearn.swiss/en/research-practice/projects/successful-learning-with-llm-tutors/), which focuses on identifying patterns indicative of successful learning with a LLM Tutor.

Instead of passively consuming content, learners interact with the tutor as they would with a human instructor. They are guided through applied scenarios, asked to explain their reasoning, and receive adaptive feedback when their explanations are incomplete or incorrect. By connecting theory to practice, the tutor aims to improve engagement, understanding, and learning outcomes, especially in domains where students often struggle with abstract material.

By making the system open-source and self-hostable, this project enables universities, teachers, and researchers to deploy, customize, and study AI-supported tutoring in their own educational contexts while retaining full control over data and infrastructure. If you do not wish or are not able to run the tutor or the GitHub project on your own infrastructure, it can be operated through our non-profit organization Swiss Learning Analytics (www.learning-analytics.ch). Our goal is to combine modern technologies with insights from learning science and to transfer them directly into educational practice.

To maximize the value of the project and foster mutual learning, we encourage everyone to share the tutors they have developed with the community. On [GitHub](https://github.com/SwissLearningAnalytics/LLMTutor]), the directory [tutors/tutors/](./tutors/tutors) contains several examples of already implemented tutors, which can serve both as inspiration and as concrete references for further development. Publishing your own tutor provides an opportunity to support others in their work, to jointly advance the vision of research-based, practice-oriented AI-supported learning, and to increase the societal impact of your own efforts, as the entire community can benefit from this investment. In this way, individual contributions grow into a shared resource from which all participants benefit in the long term.

If you develop a new tutor and would like to make it available through the repository, or if you require training, consulting, or operational support, please contact us by email at [borter@learning-analytics.ch](mailto:borter@learning-analytics.ch).

We hope you find this repository useful and that it supports you in combining your expertise and experience with modern, learning-science-backed technology.

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

2. **Configure the environment:** Copy `.env.example` to `.env`. Set `BETTER_AUTH_SECRET` to a random value and fill in `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and `SEED_ADMIN_NAME` for the first administrator. The example already contains the local database URL.

   ```bash
   cp .env.example .env
   openssl rand -base64 32
   ```

   Put the generated secret in `BETTER_AUTH_SECRET` in `.env`. Keep the admin password and secret private.

3. **Start the development database:**

   ```bash
   pnpm db:up
   ```

4. **Apply schema to development database:**

   ```bash
   pnpm db:push
   ```

5. **Pull the default local model (`qwen3.5:latest`) and start Ollama:**

   ```bash
   ollama pull qwen3.5:latest
   ollama serve
   ```

6. **Start the development server:**

   ```bash
   pnpm dev
   ```

7. **Access the application:** Open [http://localhost:3000/admin](http://localhost:3000/admin), sign in with the seeded admin account, and create your first tutor. Published tutors appear at [http://localhost:3000/overview](http://localhost:3000/overview).

### Administrator account and `/admin`

At server startup, the application creates an account with the `admin` role from `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and `SEED_ADMIN_NAME`. All three variables must be set; if any are missing, seeding is skipped. If the email already exists, startup leaves that account unchanged, including its password and role. Apply the database schema before starting the server; there is no separate seed command.

`/admin` requires sign-in and redirects unauthenticated visitors to `/login`. Signed-in users can create, edit, publish, unpublish, and delete their own tutors; inspect their tutor conversations and questionnaire answers; and export conversation data as CSV. Users with the `admin` role can also manage accounts and assign `user` or `admin` roles at `/admin/users`. New accounts are created there by an admin; the login page has no public registration flow.

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

### Database and authentication

Set `PG_CONNECTION_STRING` for the PostgreSQL database and `BETTER_AUTH_SECRET` for session signing. `BETTER_AUTH_URL` is the canonical application URL (the example uses `http://localhost:3000`). If the app is served from additional hosts, set the optional comma-separated `BETTER_AUTH_ALLOWED_HOSTS`. Configure `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and `SEED_ADMIN_NAME` in the server environment when bootstrapping a new deployment. Apply migrations before starting the production server so the user and tutor tables exist when seeding runs.

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

### YAML tutor definitions

A YAML file is an optional way to define a tutor for import. It includes the system prompt, which guides the LLM's behaviour. Guidelines based on the existing tutors are available in German: [Guidelines YAML File](./tutors/tutors/guidelines_tutor_yaml_file.pdf).

### Adding Tutors

The normal workflow is to sign in at `/admin`, select **Create tutor**, and enter its display name, tutor ID, system prompt, and optional learning objectives. New tutors start unpublished; publish one to make it available to learners on `/overview` and at its tutor URL.

Existing YAML tutor definitions in `tutors/tutors/` can also be imported into the database:

1. **Create or modify a tutor file:**

   ```bash
   # Example: tutors/tutors/my-new-tutor.yaml
   ```

2. **Generate the tutor index:**

   ```bash
   pnpm prepare
   ```

   This script generates `tutors/index.ts`, which lazily imports all tutors.

3. **Import into the database:** With the server running, sign in and open `/admin/import`. Imported tutors belong to the signed-in user and are published. Reimporting updates the display name, prompt, and learning objectives of tutors with matching IDs.

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
pnpm db:migrations:apply

# Start drizzle's database viewer
pnpm db:studio
```

Database schema is defined in `src/lib/db/schema.ts`.

> **Note:** When deploying the applicication, you must ensure that the current migrations are applied to the production database.
> This is not done automatically.

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
│   ├── auth.ts      # Authentication configuration
│   ├── db/          # Database schema and utilities
│   ├── feedback/    # Feedback system
│   └── seed/        # Initial admin account seeding
├── routes/          # Application routes
├── components/      # React components
└── styles/          # Global styles

tutors/
└── tutors/          # Tutor YAML definitions

drizzle/             # Database migrations
```

## License

See [LICENSE](LICENSE) file for details.
