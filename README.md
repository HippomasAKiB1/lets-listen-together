# TuneTogether

> Listen together. Talk together. Feel the same beat.

TuneTogether is a real-time social listening platform that allows friends to join shared virtual rooms, talk using synchronized high-quality WebRTC voice chat, text reactively, and watch/listen to synchronized YouTube videos at the exact same millisecond. 

It also supports host-level **screensharing mode** allowing users to stream their desktop video and system audio directly to the group.

---

## Technical Stack
- **Frontend**: Next.js 14, Tailwind CSS, Zustand, Socket.io-client, simple-peer, Web Audio API
- **Backend**: FastAPI, python-socketio (ASGI), SQLAlchemy (async), PostgreSQL (Supabase)

---

## Local Setup

### 1. Database (Supabase)
1. Register/Login at [Supabase](https://supabase.com).
2. Create a new project.
3. Retrieve your **Transaction Pooler Connection String** (direct connection string using port 5432). It looks like:
   `postgresql+asyncpg://postgres:[your-password]@db.[your-project-ref].supabase.co:5432/postgres`

### 2. Backend Setup
1. Open a terminal, go to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Fill in your `DATABASE_URL` (using your Supabase link) and generate a secret `JWT_SECRET`.
3. Set up a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate

   pip install -r requirements.txt
   ```
4. Start the FastAPI backend server:
   ```bash
   python -m uvicorn app.main:socket_app --reload --port 8000
   ```
   The backend will run on [http://localhost:8000](http://localhost:8000).

### 3. Frontend Setup
1. Open a new terminal, go to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   The frontend will run on [http://localhost:3000](http://localhost:3000).

---

## Playback Modes

### 1. YouTube Sync Mode
The room host can search for any YouTube video. The server broadcasts the precise video ID, target start position, and server-side timestamp to all clients. Each client calculates network offset latency:
`target_position = position_ms + (local_time - server_timestamp)`
This ensures synchronized playback within sub-100ms accuracy.
*   **Automatic Volume Ducking**: When voice activity is detected from any peer, the YouTube player volume smoothly ducks to 40% using the YouTube Player API and transitions back to 100% after 500ms of silence.

### 2. Screenshare Mode
The host can toggle Screenshare Mode, select a screen or window, and toggle the "Share system audio" checkbox in the browser prompt. The screen and system audio are relayed using peer-to-peer WebRTC connections to all room members.
*   *Note: Screenshare audio capture works best on Chrome/Edge on Windows.*

---

## Deployment to Render.com

We have provided a `render.yaml` configuration blueprint file. To deploy:
1. Push your repository to GitHub.
2. Go to your [Render Dashboard](https://dashboard.render.com).
3. Click **New** > **Blueprint**.
4. Select your repository. Render will automatically parse `render.yaml` and configure the backend Web Service and frontend Static Site.
5. Provide your environment variables (`DATABASE_URL`, `JWT_SECRET`, etc.) when prompted.