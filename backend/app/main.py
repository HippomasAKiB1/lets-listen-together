import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
from dotenv import load_dotenv

from app.database import init_db
from app.routers import auth, rooms
from app.sockets.hub import sio

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="TuneTogether API",
    description="Real-time social music listening platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS for frontend deployments (supports any Vercel deployment, custom domain, and localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST routers
app.include_router(auth.router)
app.include_router(rooms.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "TuneTogether API"}


# Mount Socket.io as ASGI sub-app
socket_app = socketio.ASGIApp(sio, other_asgi_app=app, socketio_path="/socket.io")
