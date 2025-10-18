# Patient Actor

An interactive medical education simulation platform powered by Google's Gemini AI. Practice diagnostic skills by interviewing AI patients with realistic medical histories and symptoms.

## Overview

Patient Actor allows medical students and healthcare professionals to practice patient interviews in a safe, simulated environment. Each AI patient is programmed with:

- Detailed medical history and demographics
- Chief complaints and symptoms
- Personality traits and communication styles
- Realistic responses based on their condition

## Features

- **Multiple Patient Cases**: Choose from a variety of pre-configured patient scenarios
- **AI-Powered Conversations**: Natural, context-aware patient responses using Gemini 2.0 Flash
- **Resizable Layout**: Adjustable sidebar and chat interface for optimal viewing
- **Real-time Interaction**: Smooth chat experience with loading states and error handling

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **AI Integration**: Google Gemini AI via AI SDK
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- Google Generative AI API key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd patient-actor
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
cp env.example .env.local
```

4. Add your Gemini API key to `.env.local`:

```
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

5. Run the development server:

```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/
│   ├── page.tsx              # Main page with patient selector and chat
│   └── layout.tsx            # Root layout
├── components/
│   ├── chat-interface.tsx    # Chat UI component
│   ├── patient-sidebar.tsx   # Patient selection sidebar
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── actions/
│   │   └── chat.ts           # Server action for LLM calls
│   ├── gemini.ts             # Gemini AI integration
│   ├── patient-data.ts       # Patient case definitions
│   └── types.ts              # TypeScript type definitions
```

## Available Patients

The simulation includes four diverse patient cases:

1. **PT-2023-0055**: 55-year-old male with Parkinsonian symptoms
2. **PT-2023-0108**: 62-year-old female with memory loss concerns
3. **PT-2023-0042**: 48-year-old male with severe migraines
4. **PT-2023-0076**: 71-year-old female with weakness and mobility issues

## Usage

1. Select a patient from the sidebar
2. Review their basic information in the patient details panel
3. Start the conversation by typing your questions in the chat interface
4. The AI patient will respond based on their medical history and personality

## Development

### Adding New Patients

Edit `lib/patient-data.ts` and add new patient objects following the `Patient` type definition:

```typescript
{
  id: "PT-2023-XXXX",
  demographics: "age, gender",
  chiefComplaint: "main symptom or concern",
  medicalHistory: ["condition 1", "condition 2"],
  medications: ["medication 1", "medication 2"],
  personality: "personality traits",
  socialHistory: "social context",
  neurologicalFindings: ["finding 1", "finding 2"],
  nonMotorSymptoms: ["symptom 1", "symptom 2"]
}
```

## Security

- API keys are kept secure on the server via Next.js Server Actions
- Environment variables are never exposed to the client
- All LLM calls happen server-side only

## License

MIT

## Acknowledgments

Built with Next.js and powered by Google's Gemini AI
