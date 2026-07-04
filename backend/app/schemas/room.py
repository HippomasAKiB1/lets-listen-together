from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, field_validator


class CreateRoomRequest(BaseModel):
    room_name: str
    password: Optional[str] = None
    max_members: int = 8

    @field_validator("room_name")
    @classmethod
    def room_name_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1:
            raise ValueError("Room name cannot be empty")
        if len(v) > 64:
            raise ValueError("Room name must be at most 64 characters")
        return v

    @field_validator("max_members")
    @classmethod
    def max_members_valid(cls, v: int) -> int:
        if v < 2:
            raise ValueError("Room must allow at least 2 members")
        if v > 20:
            raise ValueError("Room cannot allow more than 20 members")
        return v


class CreateRoomResponse(BaseModel):
    room_id: str
    room_name: str
    invite_code: str
    host_id: str
    max_members: int


class JoinRoomRequest(BaseModel):
    invite_code: str
    password: Optional[str] = None


class MemberInfo(BaseModel):
    user_id: str
    username: str


class CurrentSongInfo(BaseModel):
    video_id: Optional[str] = None
    song_title: Optional[str] = None
    artist: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration_seconds: int = 0
    position_ms: int = 0
    is_playing: bool = False
    server_timestamp: int = 0
    mode: str = "youtube"


class JoinRoomResponse(BaseModel):
    room_id: str
    room_name: str
    host_id: str
    invite_code: str
    max_members: int
    members: List[MemberInfo]
    current_song: CurrentSongInfo


class MessageInfo(BaseModel):
    message_id: str
    username: str
    content: str
    sent_at: datetime

    class Config:
        from_attributes = True


class MessagesResponse(BaseModel):
    messages: List[MessageInfo]
