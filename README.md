# Swiss Learning Analytics LLM Tutor

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

### Create YAML File

The YAML File contains all information to make a new tutor. Most importantly it contains the system message. The behaviour of the tutor is guided by this system message, a hidden instruction that controls the LLM’s behaviour. Drawing on the system messages used in the existing tutors guidelines were created on how to formulate an effective system message. Those guidelines can be found here: [Guidelines YAML File](./tutors/tutors/guidelines_tutor_yaml_file.pdf). As these tutors were implemented in German, the guidelines are also provided in German.

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
