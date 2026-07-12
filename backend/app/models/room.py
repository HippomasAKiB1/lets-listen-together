import uuid
from datetime import datetime
from sqlalchemy import String, Integer, BigInteger, Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Room(Base):
    __tablename__ = "rooms"

    room_id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    room_name: Mapped[str] = mapped_column(String(64), nullable=False)
    host_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.user_id"), nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    invite_code: Mapped[str] = mapped_column(String(5), unique=True, nullable=False)
    max_members: Mapped[int] = mapped_column(Integer, default=8)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class RoomMember(Base):
    __tablename__ = "room_members"

    room_id: Mapped[str] = mapped_column(String(36), ForeignKey("rooms.room_id"), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.user_id"), primary_key=True)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class Message(Base):
    __tablename__ = "messages"

    message_id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    room_id: Mapped[str] = mapped_column(String(36), ForeignKey("rooms.room_id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.user_id"), nullable=False)
    username: Mapped[str] = mapped_column(String(32), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class CurrentSong(Base):
    __tablename__ = "current_song"

    room_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("rooms.room_id"), primary_key=True
    )
    # YouTube mode
    video_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    song_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    artist: Mapped[str | None] = mapped_column(String(255), nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    # Playback state
    position_ms: Mapped[int] = mapped_column(Integer, default=0)
    is_playing: Mapped[bool] = mapped_column(Boolean, default=False)
    server_timestamp: Mapped[int] = mapped_column(BigInteger, default=0)  # Unix ms
    # Room mode
    mode: Mapped[str] = mapped_column(String(20), default="youtube")  # 'youtube' | 'screenshare'
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
