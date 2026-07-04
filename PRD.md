# TuneTogether

## Product Requirements Document

**Version 1.0**
**Status: Active Development**

---

## Table of Contents

1. Executive Summary
2. Product Vision
3. User Stories
4. Feature Specifications
5. Screen Designs
6. Technical Architecture
7. Database Schema
8. API Design
9. Real-Time Synchronization
10. UI Design System
11. Development Roadmap
12. Future Considerations

---

---

# 1. Executive Summary

TuneTogether is a real-time social listening platform that allows friends to experience music together regardless of physical location. Users join shared rooms, communicate through voice and text chat, and listen to synchronized music playback where every member hears the exact same moment of a song at the exact same time.

The core problem TuneTogether solves is simple. Remote music listening between friends has always been broken. People resort to counting down manually, sharing links separately, or using clunky workarounds. TuneTogether eliminates that friction entirely.

> **Listen together. Talk together. Feel the same beat.**

---

**What makes this different from existing solutions:**

| Problem | Existing Approach | TuneTogether Approach |
|---|---|---|
| Sync playback | Manual countdown | Server-side timestamp sync |
| Voice over music | Push to talk or mute | Automatic voice ducking |
| Joining late | Out of sync forever | Instant position catch-up |
| Complexity | Feature overload | Single focused experience |

---

---

# 2. Product Vision

## 2.1 The Core Idea

Imagine this scenario.

Your friend found a song you need to hear. They send you a link. You open it. They say ready? You both count down. Someone misses the mark. The moment is already broken before the song even starts.

TuneTogether replaces that entire experience with something better.

```
Friend creates a room.

You enter the invite code.

You both talk naturally.

Host clicks Play.

The song starts for everyone.

At the exact same millisecond.
```

That is the entire product idea distilled into its simplest form.

---

## 2.2 Product Principles

These principles guide every design and development decision in Version 1.

**Principle 1 — One thing done perfectly**
TuneTogether does synchronized social listening. It does not try to be a social network, a music discovery platform, or a streaming service. Every feature either supports or enhances that single purpose.

**Principle 2 — Invisible technology**
The synchronization, the voice mixing, the real-time communication. None of it should feel technical to the user. It should feel like magic. The host clicks Play and music plays. That is all the user needs to know.

**Principle 3 — No unnecessary decisions**
Every screen the user sees should require the minimum number of choices. Fewer choices means less confusion and a faster path to the moment that matters, which is listening together.

**Principle 4 — The demo must be unforgettable**
This product exists in the real world partly as a demonstration of technical skill. The wow moment, three people connecting and hearing the same song start at the same instant, must be reliable, clean, and impressive every single time.

---

## 2.3 What Version 1 Includes

- User authentication with accounts
- Room creation with invite codes
- Real-time voice communication
- Synchronized music playback controlled by the host
- Automatic voice and music volume balancing
- Lightweight text chat inside rooms
- Late-join synchronization

## 2.4 What Version 1 Does Not Include

Everything else. A detailed list of future considerations is documented in Section 12.

---

---

# 3. User Stories

## 3.1 Primary User Story

> Akib wants to show his friends a new song he discovered. He does not want to share a link and go through the countdown ritual. He wants to just play it for them while they talk.

**Journey:**

```
Akib opens TuneTogether and logs in.

He sees the home screen.

He clicks Create Room.

He names it  →  Late Night Vibes

He receives an invite code  →  K4L9P

He sends the code to his friends.

His friend John enters K4L9P on the Join Room screen.

Both are now inside the room.

Their microphones are already connected.

They talk while Akib searches for a song.

Akib searches  →  Coldplay - Yellow

He clicks Play.

Yellow begins playing for both of them.

At the exact same moment.

John says  →  "Wait for the bridge."

The voice comes through naturally over the music.

Neither audio drowns out the other.

They listen until the song ends.

Someone asks what to play next.

They keep going.
```

---

## 3.2 Secondary User Stories

**Guest joining a room:**

> Sarah receives an invite code from a friend. She opens TuneTogether, enters the code, and immediately finds herself inside the room where a song is already playing. She hears the song from the correct position, not from the beginning.

**Late joining:**

> Marcus joins a room twelve minutes after everyone else. The song is currently at 2:34. When Marcus connects, he does not hear the song from 0:00. He hears it from 2:34, synchronized with everyone else, within milliseconds of joining.

**Host managing playback:**

> Priya is the host. She searches for a song, plays it, pauses it when someone wants to say something important, then resumes. She skips to the next song when the group is ready. No one else can interfere with playback unless she transfers host status.

---

---

# 4. Feature Specifications

## 4.1 Authentication

**What it does:**
Allows users to create accounts and log in securely.

**Requirements:**
- Username must be unique across the platform
- Password is stored as a hashed value, never plaintext
- Session is maintained using JWT tokens
- No email verification required in Version 1

**What it does not do:**
- No OAuth or social login in Version 1
- No password reset in Version 1
- No profile pictures in Version 1

---

## 4.2 Room Creation

**What it does:**
Allows any authenticated user to create a listening room.

**Requirements:**
- User provides a room name
- User optionally sets a room password
- User sets a maximum member count
- System generates a unique 5-character alphanumeric invite code
- Creator automatically becomes the host
- Room persists until the host ends it or all members leave

**Invite Code Generation Rules:**
```
Length         →  5 characters
Character set  →  A-Z and 0-9
Example codes  →  K4L9P   ABC72   XR8Q1
Collision check →  If code exists, regenerate
```

---

## 4.3 Room Joining

**What it does:**
Allows authenticated users to enter an existing room using an invite code.

**Requirements:**
- User enters the 5-character invite code
- If room has a password, user must provide it
- If room is at maximum capacity, joining is rejected with a clear message
- On successful join, user immediately enters the voice room screen
- If a song is currently playing, user synchronizes to the current playback position

---

## 4.4 Voice Communication

**What it does:**
Provides real-time voice chat between all members of a room.

**Requirements:**
- Voice connection established automatically on room entry
- No push-to-talk required, open microphone by default
- User can mute and unmute their own microphone
- Visual indicator shows when a user is speaking
- Animated waveform appears next to speaking user's name

**Technical approach:**
WebRTC peer connections managed through a signaling server built into the FastAPI backend. For rooms with more than two people, a simple SFU-style relay pattern is used to avoid the complexity of full mesh connections.

---

## 4.5 Synchronized Music Playback

**What it does:**
Plays music for all room members simultaneously with millisecond-level accuracy.

**Requirements:**
- Only the host can search, play, pause, and skip
- On Play command, server records the exact timestamp of the action
- Server broadcasts song ID, start position, and server timestamp to all clients
- Each client calculates local offset and begins playback at the correct position
- Progress bar reflects real position in the song for all members
- Late joiners receive current position on connection

**The synchronization payload:**

```json
{
  "event": "play",
  "song_id": "coldplay_yellow",
  "song_title": "Yellow",
  "artist": "Coldplay",
  "position_ms": 45230,
  "server_timestamp": 1704067245123,
  "is_playing": true
}
```

Every client receives this payload. Every client starts from `position_ms` adjusted by the time elapsed since `server_timestamp`. The result is synchronization accurate to within the network latency margin, typically under 100 milliseconds.

---

## 4.6 Voice and Music Mixing

**What it does:**
Automatically balances music volume and voice volume so both can be heard comfortably at the same time.

**Requirements:**
- Default music volume: 100 percent
- When no one is speaking: voice channel carries no audio
- When someone begins speaking: music volume reduces to 40 percent
- Voice audio plays at comfortable level over reduced music
- When speaking stops: music volume returns to 100 percent within 500 milliseconds
- Transition must be smooth, not jarring

**Volume state machine:**

```
State A  →  Nobody talking
             Music: 100%
             Voice: Silent

State B  →  Someone talking
             Music: 40%
             Voice: Comfortable level

Transition A to B  →  Instant on voice detection
Transition B to A  →  500ms fade after silence detected
```

This is the feature that makes TuneTogether feel polished. It mirrors the experience of listening to music with friends in person, where conversation happens naturally over the background audio.

---

## 4.7 Text Chat

**What it does:**
Provides a simple text chat panel inside the room for members who want to type reactions or messages.

**Requirements:**
- Any room member can send messages
- Messages appear in chronological order
- Each message shows username and message text
- Messages are stored in the database per room
- No message editing or deletion in Version 1
- No rich media of any kind in Version 1

**What it explicitly excludes:**
- No image uploads
- No GIFs
- No stickers
- No emoji reactions to messages
- No threading or replies

---

## 4.8 Host Controls

**What it does:**
Gives the host exclusive control over music playback and room management.

**Host permissions:**

| Action | Host | Guest |
|---|---|---|
| Play music | ✅ | ❌ |
| Pause music | ✅ | ❌ |
| Skip song | ✅ | ❌ |
| Search songs | ✅ | ❌ |
| End room | ✅ | ❌ |
| Send chat messages | ✅ | ✅ |
| Use voice | ✅ | ✅ |
| Mute themselves | ✅ | ✅ |
| Leave room | ✅ | ✅ |

**Host leaving behavior:**
If the host leaves, the room ends for everyone. A system message appears in chat indicating the room has ended. Version 1 does not support host transfer.

---

---

# 5. Screen Designs

## 5.1 Login Screen

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│           🎵 TuneTogether           │
│                                     │
│      Listen together. Feel the      │
│             same beat.              │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Username                     │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Password                     │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │           Log In              │  │
│  └───────────────────────────────┘  │
│                                     │
│       Don't have an account?        │
│           Create Account            │
│                                     │
└─────────────────────────────────────┘
```

**Design notes:**
- Dark background, centered card layout
- Logo mark above the wordmark
- Single primary action button in accent color
- Secondary action as a text link, not a button

---

## 5.2 Home Screen

```
┌─────────────────────────────────────┐
│  🎵 TuneTogether          Akib  ↗   │
├─────────────────────────────────────┤
│                                     │
│    Welcome back, Akib               │
│                                     │
│                                     │
│  ┌───────────────────────────────┐  │
│  │       + Create Room           │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │         Join Room             │  │
│  └───────────────────────────────┘  │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Design notes:**
- Minimal. Only two actions.
- No feed, no discovery, no recommendations
- Username displayed top right with logout option

---

## 5.3 Create Room Screen

```
┌─────────────────────────────────────┐
│  ←  Create a Room                   │
├─────────────────────────────────────┤
│                                     │
│  Room Name                          │
│  ┌───────────────────────────────┐  │
│  │  Late Night Vibes             │  │
│  └───────────────────────────────┘  │
│                                     │
│  Room Password  (optional)          │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  Max Members                        │
│  ┌───────────────────────────────┐  │
│  │  8                            │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │           Create              │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**After creation:**

```
┌─────────────────────────────────────┐
│                                     │
│         Room Created! 🎉            │
│                                     │
│    Share this code with friends     │
│                                     │
│    ┌───────────────────────────┐    │
│    │                           │    │
│    │         K 4 L 9 P         │    │
│    │                           │    │
│    └───────────────────────────┘    │
│                                     │
│         [ Copy Code ]               │
│                                     │
│    ┌───────────────────────────┐    │
│    │       Enter Room          │    │
│    └───────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

---

## 5.4 Join Room Screen

```
┌─────────────────────────────────────┐
│  ←  Join a Room                     │
├─────────────────────────────────────┤
│                                     │
│  Invite Code                        │
│  ┌───────────────────────────────┐  │
│  │  K4L9P                        │  │
│  └───────────────────────────────┘  │
│                                     │
│  Room Password  (if required)       │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │            Join               │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

---

## 5.5 Voice Room Screen

This is the heart of the application. Every design decision here should serve the listening experience.

```
┌─────────────────────────────────────┐
│  Late Night Vibes            🔴 End │
├─────────────────────────────────────┤
│                                     │
│  MEMBERS                            │
│  ──────────────────────────────     │
│  🟢  Akib          ~~~  (Host)      │
│  🟢  John                           │
│  🟢  Sarah         ~~~              │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  NOW PLAYING                        │
│  ──────────────────────────────     │
│                                     │
│    ┌──────┐   Yellow                │
│    │  🎵  │   Coldplay              │
│    └──────┘                         │
│                                     │
│    ████████████████░░░░░░  2:14     │
│    00:45 ─────────────── 03:28      │
│                                     │
│         ⏮   ⏸   ⏭                  │
│         (host only)                 │
│                                     │
├─────────────────────────────────────┤
│  🔍  Search for a song...           │
│  (host only)                        │
├─────────────────────────────────────┤
│                                     │
│  CHAT                               │
│  ──────────────────────────────     │
│  Akib:   This part is amazing       │
│  John:   Wait for the solo          │
│  Sarah:  ❤️                          │
│                                     │
│  ┌──────────────────┐  [ Send ]     │
│  │  Type something  │               │
│  └──────────────────┘               │
│                                     │
├─────────────────────────────────────┤
│  🎤 Mic On              Leave Room  │
└─────────────────────────────────────┘
```

**Design notes:**
- `~~~` next to username indicates active speaking with animated waveform
- `🟢` indicates connected and active
- Progress bar updates in real time for all members
- Playback controls are visible to everyone but only respond for the host
- Chat is always visible, no tab switching required
- Mic toggle and Leave are always accessible at the bottom

---

---

# 6. Technical Architecture

## 6.1 System Overview

```
┌──────────────┐         ┌──────────────────────────┐
│              │  HTTPS  │                          │
│  Next.js     │ ──────► │  FastAPI Backend          │
│  Frontend    │         │                          │
│              │ ◄────── │  REST + WebSocket        │
│              │  WS     │                          │
└──────────────┘         └────────────┬─────────────┘
                                      │
                              ┌───────▼──────┐
                              │              │
                              │  PostgreSQL  │
                              │  Database    │
                              │              │
                              └──────────────┘
```

---

## 6.2 Frontend — Next.js

**Responsibilities:**
- User interface rendering
- WebSocket connection management
- WebRTC voice connection handling
- Local audio processing for voice ducking
- Real-time state management for room members, playback, and chat

**Key libraries:**
```
Next.js          →  React framework with routing
Socket.io-client →  WebSocket communication
simple-peer      →  WebRTC abstraction for voice
Web Audio API    →  Volume control and mixing
Tailwind CSS     →  Styling system
Zustand          →  Client state management
```

---

## 6.3 Backend — FastAPI

**Responsibilities:**
- User authentication and session management
- Room lifecycle management (create, join, end)
- WebSocket hub for real-time events
- Broadcast synchronization payloads to room members
- Persist chat messages and room state to database
- Serve room and user data through REST endpoints

**Key libraries:**
```
FastAPI          →  Web framework
python-socketio  →  WebSocket and event handling
SQLAlchemy       →  Database ORM
passlib          →  Password hashing
python-jose      →  JWT token creation and validation
asyncpg          →  Async PostgreSQL driver
```

---

## 6.4 Communication Layers

TuneTogether uses two distinct communication channels.

**Layer 1 — REST API**
Used for stateless operations that do not require real-time updates.

```
POST  /auth/register        →  Create account
POST  /auth/login           →  Get JWT token
POST  /rooms/create         →  Create room
POST  /rooms/join           →  Join room
GET   /rooms/{id}/messages  →  Fetch chat history
```

**Layer 2 — WebSocket**
Used for everything real-time inside a room.

```
connect          →  Client connects to room channel
disconnect       →  Client leaves room channel

Events emitted by server:
member_joined    →  New member entered room
member_left      →  Member disconnected
play             →  Host started playback
pause            →  Host paused playback
skip             →  Host skipped song
chat_message     →  New chat message received
sync_state       →  State sent to late joiner
```

**Layer 3 — WebRTC**
Used for peer-to-peer voice audio. WebSocket channel is used for WebRTC signaling (offer, answer, ICE candidates).

---

---

# 7. Database Schema

## 7.1 Users Table

```sql
CREATE TABLE users (
    user_id       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(32)   UNIQUE NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    created_at    TIMESTAMP     DEFAULT NOW()
);
```

---

## 7.2 Rooms Table

```sql
CREATE TABLE rooms (
    room_id       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    room_name     VARCHAR(64)   NOT NULL,
    host_id       UUID          REFERENCES users(user_id),
    password_hash VARCHAR(255)  NULL,
    invite_code   VARCHAR(5)    UNIQUE NOT NULL,
    max_members   INTEGER       DEFAULT 8,
    is_active     BOOLEAN       DEFAULT TRUE,
    created_at    TIMESTAMP     DEFAULT NOW()
);
```

---

## 7.3 Room Members Table

```sql
CREATE TABLE room_members (
    room_id    UUID       REFERENCES rooms(room_id),
    user_id    UUID       REFERENCES users(user_id),
    joined_at  TIMESTAMP  DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);
```

---

## 7.4 Messages Table

```sql
CREATE TABLE messages (
    message_id  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id     UUID          REFERENCES rooms(room_id),
    user_id     UUID          REFERENCES users(user_id),
    content     TEXT          NOT NULL,
    sent_at     TIMESTAMP     DEFAULT NOW()
);
```

---

## 7.5 Current Song Table

```sql
CREATE TABLE current_song (
    room_id          UUID     PRIMARY KEY REFERENCES rooms(room_id),
    song_id          VARCHAR(255)  NULL,
    song_title       VARCHAR(255)  NULL,
    artist           VARCHAR(255)  NULL,
    album_art_url    TEXT          NULL,
    position_ms      INTEGER       DEFAULT 0,
    is_playing       BOOLEAN       DEFAULT FALSE,
    updated_at       TIMESTAMP     DEFAULT NOW()
);
```

---

## 7.6 Schema Relationships

```
users ────────────────── rooms
  │         host_id FK     │
  │                        │
  └──── room_members ──────┘
              │
              │
         messages
              │
          current_song
              │
           rooms
```

---

---

# 8. API Design

## 8.1 Authentication Endpoints

**Register**
```
POST /auth/register

Request:
{
  "username": "akib",
  "password": "securepassword"
}

Response 201:
{
  "user_id": "uuid",
  "username": "akib"
}

Response 400:
{
  "error": "Username already taken"
}
```

---

**Login**
```
POST /auth/login

Request:
{
  "username": "akib",
  "password": "securepassword"
}

Response 200:
{
  "access_token": "jwt_token_here",
  "token_type": "bearer"
}

Response 401:
{
  "error": "Invalid credentials"
}
```

---

## 8.2 Room Endpoints

**Create Room**
```
POST /rooms/create
Authorization: Bearer <token>

Request:
{
  "room_name": "Late Night Vibes",
  "password": null,
  "max_members": 8
}

Response 201:
{
  "room_id": "uuid",
  "room_name": "Late Night Vibes",
  "invite_code": "K4L9P",
  "host_id": "uuid"
}
```

---

**Join Room**
```
POST /rooms/join
Authorization: Bearer <token>

Request:
{
  "invite_code": "K4L9P",
  "password": null
}

Response 200:
{
  "room_id": "uuid",
  "room_name": "Late Night Vibes",
  "host_id": "uuid",
  "members": [...],
  "current_song": {...}
}

Response 404:
{
  "error": "Room not found"
}

Response 403:
{
  "error": "Incorrect password"
}

Response 409:
{
  "error": "Room is full"
}
```

---

**Get Chat History**
```
GET /rooms/{room_id}/messages
Authorization: Bearer <token>

Response 200:
{
  "messages": [
    {
      "message_id": "uuid",
      "username": "Akib",
      "content": "This part is amazing",
      "sent_at": "2024-01-01T22:30:00"
    }
  ]
}
```

---

## 8.3 WebSocket Events

**Connection:**
```
Client connects to:
ws://server/ws/rooms/{room_id}?token={jwt}
```

---

**Event: play**
```json
Emitted by: Server  →  All clients in room

{
  "event": "play",
  "song_id": "coldplay_yellow",
  "song_title": "Yellow",
  "artist": "Coldplay",
  "album_art_url": "https://...",
  "position_ms": 45230,
  "server_timestamp": 1704067245123
}
```

---

**Event: pause**
```json
Emitted by: Server  →  All clients in room

{
  "event": "pause",
  "position_ms": 87400
}
```

---

**Event: chat_message**
```json
Emitted by: Server  →  All clients in room

{
  "event": "chat_message",
  "username": "John",
  "content": "Wait for the solo",
  "sent_at": "2024-01-01T22:31:00"
}
```

---

**Event: sync_state**
```json
Emitted by: Server  →  Newly joined client only

{
  "event": "sync_state",
  "members": ["Akib", "John", "Sarah"],
  "current_song": {
    "song_id": "coldplay_yellow",
    "song_title": "Yellow",
    "artist": "Coldplay",
    "position_ms": 134500,
    "is_playing": true,
    "server_timestamp": 1704067312000
  }
}
```

---

---

# 9. Real-Time Synchronization

## 9.1 The Problem

Music playback synchronization is the defining technical challenge of this project. Without a solution, each client starts the song independently, and network delays create audible offsets between members.

## 9.2 The Solution

Server-authoritative timestamp synchronization.

When the host clicks Play, the following sequence occurs:

```
Step 1  →  Host client sends play request to server

Step 2  →  Server records exact Unix timestamp in milliseconds
            server_timestamp = 1704067245123

Step 3  →  Server saves updated current_song state to database

Step 4  →  Server broadcasts sync payload to all clients in room
            including the host

Step 5  →  Each client receives the payload

Step 6  →  Each client calculates adjusted start position

            local_time      = Date.now()
            elapsed_ms      = local_time - server_timestamp
            adjusted_pos    = position_ms + elapsed_ms

Step 7  →  Each client begins playback from adjusted_pos
```

---

## 9.3 Late Join Synchronization

When a new member joins a room where music is already playing:

```
Step 1  →  Client connects and receives sync_state event

Step 2  →  sync_state contains position_ms and server_timestamp
            from when the current song state was last updated

Step 3  →  Client calculates current position:

            now             = Date.now()
            elapsed_since   = now - server_timestamp
            current_pos     = position_ms + elapsed_since

Step 4  →  Client begins playback from current_pos

Result  →  Late joiner hears the same moment as everyone else
            within approximately one network round-trip time
```

---

## 9.4 Synchronization Accuracy

The expected accuracy depends on network conditions:

| Network Condition | Expected Offset |
|---|---|
| Same local network | Under 10 milliseconds |
| Same city, wired | 20 to 50 milliseconds |
| Cross-country | 50 to 150 milliseconds |
| International | 100 to 300 milliseconds |

For music listening between friends, offsets under 200 milliseconds are imperceptible. The experience feels perfectly synchronized.

---

## 9.5 Voice Ducking Implementation

Voice ducking is implemented entirely on the client side using the Web Audio API.

```javascript
const audioContext = new AudioContext()

// Music source connected through gain node
const musicGain = audioContext.createGain()
musicGain.gain.value = 1.0

// Voice activity detection on incoming WebRTC streams
peerConnection.ontrack = (event) => {
  const analyser = audioContext.createAnalyser()
  event.streams[0].connect(analyser)

  analyser.onaudioprocess = () => {
    const isVoiceActive = detectVoiceActivity(analyser)

    if (isVoiceActive) {
      // Reduce music to 40 percent
      musicGain.gain.setTargetAtTime(0.4, audioContext.currentTime, 0.05)
    } else {
      // Return to full volume over 500ms
      musicGain.gain.setTargetAtTime(1.0, audioContext.currentTime, 0.5)
    }
  }
}
```

The `setTargetAtTime` function creates a smooth exponential transition rather than a jarring jump, which is critical for the experience to feel natural.

---

---

# 10. UI Design System

## 10.1 Color Palette

```
Background Primary     →  #0F0F0F   Very dark gray, near black
Background Secondary   →  #1A1A2E   Deep navy dark panel
Background Card        →  #16213E   Slightly lighter panel
Accent Primary         →  #7C3AED   Purple
Accent Secondary       →  #6D28D9   Darker purple for hover states
Text Primary           →  #F9FAFB   Near white
Text Secondary         →  #9CA3AF   Muted gray
Text Muted             →  #4B5563   Dimmed text
Success / Online       →  #10B981   Emerald green
Warning                →  #F59E0B   Amber
Error                  →  #EF4444   Red
```

---

## 10.2 Typography

```
Font Family    →  Inter (Google Fonts)

Scale:
Display        →  32px   Bold      Room names, large headers
Heading        →  24px   Semibold  Section titles
Subheading     →  18px   Medium    Card titles
Body           →  16px   Regular   General text
Small          →  14px   Regular   Metadata, timestamps
Micro          →  12px   Regular   Labels, badges
```

---

## 10.3 Component Patterns

**Buttons:**
```
Primary    →  Purple background, white text, rounded-lg
Secondary  →  Dark background, white text, purple border
Ghost      →  Transparent, white text, hover shows border
Danger     →  Red background, white text (Leave Room, End Room)
```

**Input Fields:**
```
Background   →  #1A1A2E
Border       →  1px solid #374151
Border focus →  1px solid #7C3AED (purple glow)
Text color   →  #F9FAFB
Placeholder  →  #4B5563
Border radius →  8px
```

**Cards and Panels:**
```
Background   →  #16213E
Border       →  1px solid #1F2937
Border radius →  12px
Padding      →  16px to 24px
Shadow       →  Subtle dark shadow
```

---

## 10.4 Animated Elements

**Speaking Indicator:**
When a user is speaking, a waveform animation appears beside their name. Three vertical bars animated with a staggered sine wave pattern. Color matches the accent purple.

**Progress Bar:**
The playback progress bar updates every second. The filled portion uses a purple-to-violet gradient. The thumb indicator is a white circle with a subtle glow.

**Volume Ducking:**
The volume transition is visual as well as audible. A small music note icon in the player panel subtly dims when voice ducking is active, giving a visual cue that the balancing system is working.

**Connection Status:**
The green dot beside each member's name uses a gentle pulse animation to indicate live connection.

---

## 10.5 Layout Grid

```
Desktop (1280px+):
Left panel    →  Members list + Voice controls    (280px fixed)
Center panel  →  Music player                     (flexible)
Right panel   →  Chat                             (320px fixed)

Tablet (768px to 1279px):
Stacked layout with collapsible panels

Mobile (under 768px):
Not targeted in Version 1
```

---

---

# 11. Development Roadmap

## 11.1 Phase 1 — Foundation (Week 1)

**Goal:** Backend running, authentication working, database connected.

```
□  Set up FastAPI project structure
□  Configure PostgreSQL and create all tables
□  Implement user registration endpoint
□  Implement login endpoint with JWT
□  Test authentication flow with Postman
□  Set up Next.js project with Tailwind CSS
□  Build Login screen
□  Build Create Account screen
□  Connect frontend auth to backend
□  Verify JWT stored and sent correctly
```

---

## 11.2 Phase 2 — Rooms (Week 2)

**Goal:** Rooms can be created, joined, and persisted.

```
□  Implement create room endpoint
□  Implement invite code generation
□  Implement join room endpoint with validation
□  Implement room state retrieval
□  Build Home screen
□  Build Create Room screen with invite code display
□  Build Join Room screen
□  Test full create-and-join flow
□  Handle edge cases: wrong code, wrong password, room full
```

---

## 11.3 Phase 3 — Real-Time Communication (Week 3)

**Goal:** WebSocket hub working, members see each other.

```
□  Set up python-socketio with FastAPI
□  Implement room channel management
□  Broadcast member_joined and member_left events
□  Connect Next.js to WebSocket on room entry
□  Build Voice Room screen layout
□  Render live member list from WebSocket events
□  Test multi-client connection
□  Implement disconnect handling and cleanup
```

---

## 11.4 Phase 4 — Voice (Week 4)

**Goal:** Users can talk to each other inside rooms.

```
□  Implement WebRTC signaling through WebSocket
□  Integrate simple-peer on frontend
□  Handle offer, answer, ICE candidate exchange
□  Test voice between two clients
□  Test voice with three clients
□  Add microphone toggle (mute/unmute)
□  Add speaking indicator animation
□  Handle peer disconnect gracefully
```

---

## 11.5 Phase 5 — Music (Week 5)

**Goal:** Host can play music that syncs for all members.

```
□  Integrate music source (Jamendo API or local files)
□  Build song search UI
□  Implement play event broadcast with timestamp payload
□  Implement pause event broadcast
□  Implement skip event
□  Build music player UI with progress bar
□  Implement client-side sync calculation
□  Test sync accuracy between two clients
□  Implement late-join sync_state delivery
□  Test late join scenario
```

---

## 11.6 Phase 6 — Voice Mixing (Week 6)

**Goal:** Voice ducking works smoothly and feels natural.

```
□  Set up Web Audio API AudioContext
□  Route music audio through gain node
□  Implement voice activity detection on peer streams
□  Implement gain reduction on voice detection
□  Implement smooth gain restoration on silence
□  Tune timing constants for natural feel
□  Test with multiple speakers simultaneously
```

---

## 11.7 Phase 7 — Chat (Week 7)

**Goal:** Text chat works inside rooms.

```
□  Implement chat message storage in database
□  Implement chat message broadcast via WebSocket
□  Build chat panel UI
□  Implement message send functionality
□  Load chat history on room join
□  Auto-scroll to latest message
□  Test with multiple clients
```

---

## 11.8 Phase 8 — Polish (Week 8)

**Goal:** The product looks and feels finished.

```
□  Apply full design system across all screens
□  Add animations (speaking indicator, progress bar, transitions)
□  Error handling and user feedback for all failure states
□  Loading states for async operations
□  Responsive layout refinement
□  End-to-end test of complete user flow
□  Performance check on WebSocket and WebRTC connections
□  Prepare demo environment
□  Documentation
```

---

---

# 12. Future Considerations

The following features are intentionally excluded from Version 1. They represent a natural product roadmap and should be mentioned in project reports or presentations as evidence of forward thinking without committing to implementation.

## 12.1 Near-Term Features (Version 2)

**Shared Queue**
Any room member can suggest songs that are added to a queue. The host approves or reorders the queue. Songs play automatically in sequence.

**Emoji Reactions**
Members can send floating emoji reactions during playback (❤️ 🔥 😭) that appear briefly on screen and then fade. Designed for moments in songs.

**Synchronized Lyrics**
Lyrics scroll in time with playback, visible to all members simultaneously. Requires integration with a lyrics API such as Musixmatch.

**Host Transfer**
The host can pass host control to another member rather than ending the room when they leave.

## 12.2 Medium-Term Features (Version 3)

**Friend System**
Users can add friends and see when they are online or in a room. Friends can be invited directly without sharing a code manually.

**Listening History**
Each room's listening session is recorded. Users can see what was played, when, and with whom.

**Public Rooms**
Rooms can be made discoverable. Users can browse active public rooms and join any of them, with optional genre or mood tags.

**Room Moderation**
Hosts can mute specific members, remove members from the room, or restrict chat to host-only.

## 12.3 Long-Term Features (Version 4+)

**Mobile Application**
Native iOS and Android applications using React Native, sharing business logic with the web frontend.

**Collaborative Playlists**
Rooms can build a shared playlist over multiple sessions that persists and grows over time.

**AI Recommendations**
Based on the songs played in a room across sessions, an AI model suggests what to listen to next. Recommendations are personalized to the group's shared taste.

**Desktop Notifications**
Push notifications when a friend creates a room or when someone invites you directly.

**Album Art Animations**
Dynamic visual effects that respond to the music, such as a pulsing glow or color-extracted gradient backgrounds from album artwork.

---

---

# Appendix A — Glossary

| Term | Definition |
|---|---|
| Host | The room creator who controls music playback |
| Guest | Any room member who is not the host |
| Invite Code | The 5-character code used to join a specific room |
| Voice Ducking | Automatically lowering music volume when someone speaks |
| WebRTC | Web Real-Time Communication, the technology used for browser-to-browser voice |
| WebSocket | Persistent two-way connection between client and server for real-time events |
| JWT | JSON Web Token, used to authenticate API requests |
| Sync Payload | The data packet containing song position and server timestamp for synchronization |
| SFU | Selective Forwarding Unit, a relay server pattern for multi-party WebRTC |
| position_ms | Playback position measured in milliseconds |

---

# Appendix B — Assumptions and Constraints

**Music source:**
Version 1 uses the Jamendo API for royalty-free music, or a curated set of local audio files for demonstration purposes. Full integration with Spotify or Apple Music requires commercial licensing and is out of scope.

**Concurrent users:**
Version 1 is not designed to scale beyond demonstration usage. A single server instance is sufficient.

**Browser support:**
Version 1 targets modern Chromium-based browsers (Chrome, Edge) and Firefox. Safari has partial WebRTC support and is not guaranteed.

**Network assumption:**
Optimal experience requires a stable internet connection. Unstable connections may cause voice dropouts or minor sync drift.

**Mobile:**
Version 1 does not target mobile browsers. The layout is designed for desktop screens.

---

*TuneTogether — Product Requirements Document — Version 1.0*
