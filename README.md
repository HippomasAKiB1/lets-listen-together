<div align="center">

# Tune Together

**Ultra-low latency, synchronized audio & video streaming rooms with WebRTC voice mesh.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--time-010101?style=flat-square&logo=socket.io)](https://socket.io/)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P%20Voice-333333?style=flat-square&logo=webrtc)](https://webrtc.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

[Architecture](#system-architecture) • [Features](#key-capabilities) • [Quickstart](#local-development) • [Signaling Protocol](#real-time-sync--signaling-protocol) • [Author](#author--credits)

---

</div>

## Overview

**Tune Together** is a distributed real-time social streaming platform engineered for friends to listen to music, watch media, and converse with zero perceived desync. 

Built with an **Acid Brutalist / Industrial Swiss Grid** design aesthetic, Tune Together rejects generic glassmorphism and soft cards in favor of hard-edged borders, stark editorial typography, high-contrast states, and sub-millisecond precision.

---

## Key Capabilities

### 1. Drift-Compensated Media Sync
- **Sub-100ms Alignment**: Clients calculate playback drift against authoritative host timestamps using network latency compensation:
  ```text
  target_position = position_ms + (local_time - server_timestamp)
  ```
- **Natural Resync**: Continuous clock drift is corrected dynamically without jarring player skips or buffer loops. Tracks transition smoothly and stop cleanly at the end boundary without accidental looping.
- **Collaborative Up-Next Queue**: Any room member can queue YouTube tracks. The playlist automatically advances to the next track on song completion, and hosts retain full Next / Previous track controls.

### 2. P2P WebRTC Mesh Voice Engine
- **Decentralized Voice Mesh**: Direct peer-to-peer audio streams minimize server relay overhead and round-trip delay.
- **Microphone Privacy by Default**: Microphones initialize in a muted state on room entry with clear visual status indicators across the member roster.
- **Intelligent Voice Ducking**: Background YouTube player volume automatically ducks to 35% when any member speaks, smoothly returning to normal volume after a 500ms speech decay window.
- **Voice Activity Detection (VAD)**: Real-time Web Audio API `AudioContext` analyzers detect decibel energy levels, providing immediate green visual speaker pings.

### 3. Desktop Screen & Audio Sharing
- Hosts can switch from YouTube Sync to **Screenshare Mode** with a single click, streaming full HD desktop video and system loopback audio directly through the WebRTC mesh.

### 4. Seamless Invite & Auth Handshake
- Clean room entry via 5-character invitation codes or one-click shareable links (`/invite/:code`).
- Unauthenticated guests are automatically routed to sign in or register with their destination invite preserved, automatically joining the room immediately upon authentication.

---

## System Architecture

```mermaid
graph TD
    ClientHost["Host Client (Next.js 16)"]
    ClientGuest["Guest Client (Next.js 16)"]
    FastAPI["FastAPI / Socket.IO ASGI Server"]
    Postgres[(PostgreSQL Database)]
    YouTube["YouTube IFrame Player API"]

    ClientHost -- "REST (Auth / Rooms)" --> FastAPI
    ClientGuest -- "REST (Auth / Rooms)" --> FastAPI
    FastAPI -- "Async Engine (SQLAlchemy)" --> Postgres

    ClientHost <-->|"WebSocket / Socket.IO (Sync State)"| FastAPI
    ClientGuest <-->|"WebSocket / Socket.IO (Sync State)"| FastAPI

    ClientHost <==>|"WebRTC Mesh (P2P Voice & Screen)"| ClientGuest
    ClientHost -.->|"Controls Playback"| YouTube
    ClientGuest -.->|"Calculates Drift & Syncs"| YouTube
```

---

## Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) with local persistence middleware
- **Real-Time Client**: `socket.io-client` (v4.7+)
- **Audio / Voice**: WebRTC native mesh (`RTCPeerConnection`), Web Audio API (`AudioContext`, `AnalyserNode`)
- **Styling**: Vanilla CSS Design Tokens (Zero border-radius, hard CSS shadows, Acid Brutalist palette)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
- **Signaling Server**: `python-socketio` (Async Server wrapped with ASGI)
- **Database & ORM**: PostgreSQL via [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (asyncpg driver)
- **Authentication**: JWT (JSON Web Tokens) with Passlib bcrypt hashing

---

## Local Development

### Prerequisites
- **Node.js**: v18.18+ or v20+
- **Python**: v3.11+
- **PostgreSQL**: Local instance or free cloud database (e.g. Supabase, Neon)

### 1. Repository Setup
```bash
git clone https://github.com/HippomasAKiB1/lets-listen-together.git
cd lets-listen-together
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

Ensure your `.env` contains:
```ini
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/tunetogether
JWT_SECRET=your-secure-random-jwt-secret-string
YOUTUBE_API_KEY=your-optional-youtube-v3-api-key
```

Run database migrations / startup:
```bash
python -m uvicorn app.main:socket_app --reload --port 8000
```
Backend health check: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Configure local environment
# Create frontend/.env.local:
echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:8000" > .env.local

# Start dev server with Turbopack
npm run dev
```
Frontend runs at `http://localhost:3000`.

---

## Real-Time Sync & Signaling Protocol

Tune Together utilizes bidirectional Socket.IO events for state synchronization and WebRTC handshake orchestration:

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `host_play` | Client → Server | `{ video_id, song_title, position_ms }` | Host starts or changes a track. |
| `host_pause` | Client → Server | `{ position_ms }` | Host pauses playback. |
| `host_seek` | Client → Server | `{ position_ms }` | Host scrubs playback slider. |
| `sync_state` | Server → Client | `{ room_name, current_song, queue, members }` | Authoritative sync packet emitted on join. |
| `add_to_queue`| Client → Server | `{ video_id, song_title, duration_seconds }` | Adds a track to the shared playlist. |
| `toggle_mic` | Client → Server | `{ is_muted }` | Broadcasts microphone status change. |
| `send_reaction`| Client → Server | `{ emoji }` | Emits a temporary floating reaction. |
| `webrtc_offer`| Bidirectional | `{ offer, from_sid, to_sid }` | Relays WebRTC SDP offer between peers. |
| `webrtc_answer`| Bidirectional | `{ answer, from_sid, to_sid }` | Relays WebRTC SDP answer. |
| `webrtc_ice` | Bidirectional | `{ candidate, from_sid, to_sid }` | Relays ICE candidate exchange. |

---

## Author & Credits

Designed and engineered with passion by:

**AKIB HASAN PYIL**  
- **Portfolio**: [https://akibhasan.me](https://akibhasan.me)  
- **GitHub**: [@HippomasAKiB1](https://github.com/HippomasAKiB1)

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.