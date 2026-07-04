import { create } from "zustand";

export interface Member {
  user_id: string;
  username: string;
  is_speaking?: boolean;
  sid?: string;
}

export interface CurrentSong {
  video_id: string | null;
  song_title: string | null;
  artist: string | null;
  thumbnail_url: string | null;
  duration_seconds: number;
  position_ms: number;
  is_playing: boolean;
  server_timestamp: number;
  mode: "youtube" | "screenshare";
}

export interface ChatMessage {
  message_id: string;
  username: string;
  content: string;
  sent_at: string;
}

interface RoomState {
  roomId: string | null;
  roomName: string | null;
  hostId: string | null;
  inviteCode: string | null;
  members: Member[];
  currentSong: CurrentSong;
  messages: ChatMessage[];
  mode: "youtube" | "screenshare";
  isScreenSharing: boolean;

  setRoom: (data: {
    roomId: string;
    roomName: string;
    hostId: string;
    inviteCode: string;
    members: Member[];
    currentSong: Partial<CurrentSong>;
  }) => void;

  setMembers: (members: Member[]) => void;
  setMemberSpeaking: (userId: string, isSpeaking: boolean) => void;
  setCurrentSong: (song: Partial<CurrentSong>) => void;
  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  setMode: (mode: "youtube" | "screenshare") => void;
  setScreenSharing: (val: boolean) => void;
  clearRoom: () => void;
}

const DEFAULT_SONG: CurrentSong = {
  video_id: null,
  song_title: null,
  artist: null,
  thumbnail_url: null,
  duration_seconds: 0,
  position_ms: 0,
  is_playing: false,
  server_timestamp: 0,
  mode: "youtube",
};

export const useRoomStore = create<RoomState>((set) => ({
  roomId: null,
  roomName: null,
  hostId: null,
  inviteCode: null,
  members: [],
  currentSong: DEFAULT_SONG,
  messages: [],
  mode: "youtube",
  isScreenSharing: false,

  setRoom: ({ roomId, roomName, hostId, inviteCode, members, currentSong }) =>
    set({
      roomId,
      roomName,
      hostId,
      inviteCode,
      members,
      currentSong: { ...DEFAULT_SONG, ...currentSong } as CurrentSong,
      mode: (currentSong.mode as "youtube" | "screenshare") || "youtube",
    }),

  setMembers: (members) => set({ members }),

  setMemberSpeaking: (userId, isSpeaking) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.user_id === userId ? { ...m, is_speaking: isSpeaking } : m
      ),
    })),

  setCurrentSong: (song) =>
    set((state) => ({
      currentSong: { ...state.currentSong, ...song },
    })),

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg],
    })),

  setMessages: (msgs) => set({ messages: msgs }),

  setMode: (mode) => set({ mode }),

  setScreenSharing: (val) => set({ isScreenSharing: val }),

  clearRoom: () =>
    set({
      roomId: null,
      roomName: null,
      hostId: null,
      inviteCode: null,
      members: [],
      currentSong: DEFAULT_SONG,
      messages: [],
      mode: "youtube",
      isScreenSharing: false,
    }),
}));
