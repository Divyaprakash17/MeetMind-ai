# MeetMind-ai - AI Meeting Transcription & Analysis

MeetMind-ai is a web application that leverages AI to transcribe and analyze meeting recordings. It provides accurate transcriptions, speaker identification, and generates structured meeting summaries including key points, action items, and highlights.

## ✨ Features

- 🎤 Upload and transcribe meeting recordings (audio/video)
- 🎧 Interactive media player with synchronized transcript
- 🎯 Speaker identification and diarization
- 📝 AI-powered meeting summarization
- 🔍 Searchable transcript with timestamps
- 📋 Structured meeting notes with key points and action items
- 🎨 Modern, responsive UI built with React and TypeScript

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- API keys for:
  - AssemblyAI (for transcription)
  - Google Gemini (for summarization)

### Installation

1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd meet-scribe-ai-sync
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Create a `.env` file in the root directory with your API keys:
   ```
   VITE_ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Start the development server:
   ```sh
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **UI Components**: Radix UI, Tailwind CSS
- **State Management**: React Query
- **AI Services**:
  - AssemblyAI for speech-to-text transcription
  - Google Gemini for meeting summarization
- **Build Tool**: Vite
- **Package Manager**: npm

## 📁 Project Structure

```
meet-scribe-ai-sync/
├── public/               # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/            # Page components
│   ├── services/         # API and service integrations
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Application entry point
├── .env                  # Environment variables
├── package.json          # Project dependencies and scripts
└── vite.config.ts        # Vite configuration
```

## 📝 Usage

1. **Upload a Meeting Recording**:
   - Click the upload area or drag and drop an audio/video file
   - Supported formats: MP3, WAV, M4A, MP4, etc.

2. **View Transcription**:
   - The transcript will appear once processing is complete
   - Click on any part of the transcript to jump to that point in the recording

3. **Explore Summary**:
   - Switch to the "Summary" tab to view AI-generated meeting insights
   - Includes key points, action items, and participant information

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [AssemblyAI](https://www.assemblyai.com/) for speech-to-text transcription
- [Google Gemini](https://ai.google.dev/) for AI-powered summarization
- [Radix UI](https://www.radix-ui.com/) for accessible UI components
