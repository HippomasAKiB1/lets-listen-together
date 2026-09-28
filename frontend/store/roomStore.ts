import { create } from "zustand";

export interface Member {
  user_id: string;
  username: string;
  is_speaking?: boolean;
  is_muted?: boolean;
  sid?: string;
}

export interface QueueItem {
  video_id: string;
  song_title: string;
  artist: string;
  thumbnail_url: string;
  duration_seconds: number;
  added_by?: string;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  username: string;
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
  queue: QueueItem[];
  reactions: FloatingReaction[];
  mode: "youtube" | "screenshare";
  isScreenSharing: boolean;

  setRoom: (data: {
    roomId?: string | null;
    room_id?: string | null;
    roomName?: string | null;
    room_name?: string | null;
    hostId?: string | null;
    host_id?: string | null;
    inviteCode?: string | null;
    invite_code?: string | null;
    members?: Member[];
    queue?: QueueItem[];
    currentSong?: Partial<CurrentSong>;
    current_song?: Partial<CurrentSong>;
    mode?: "youtube" | "screenshare";
  }) => void;

  setMembers: (members: Member[]) => void;
  setMemberSpeaking: (userId: string, isSpeaking: boolean) => void;
  setMemberMic: (userId: string, isMuted: boolean) => void;
  setHostId: (hostId: string) => void;
  setCurrentSong: (song: Partial<CurrentSong>) => void;
  setQueue: (queue: QueueItem[]) => void;
  addReaction: (reaction: FloatingReaction) => void;
  removeReaction: (id: string) => void;
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
  queue: [],
  reactions: [],
  mode: "youtube",
  isScreenSharing: false,

  setRoom: (data) => {
    const rawSong = data.currentSong || data.current_song || {};
    const resolvedMode = (rawSong?.mode || data.mode || "youtube") as "youtube" | "screenshare";
    set((state) => ({
      roomId: data.roomId || data.room_id || state.roomId,
      roomName: data.roomName || data.room_name || state.roomName,
      hostId: data.hostId || data.host_id || state.hostId,
      inviteCode: data.inviteCode || data.invite_code || state.inviteCode,
      members: data.members || state.members,
      queue: data.queue || state.queue,
      currentSong: { ...DEFAULT_SONG, ...rawSong } as CurrentSong,
      mode: resolvedMode,
    }));
  },

  setMembers: (members) => set({ members }),

  setMemberSpeaking: (userId, isSpeaking) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.user_id === userId ? { ...m, is_speaking: isSpeaking } : m
      ),
    })),

  setMemberMic: (userId, isMuted) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.user_id === userId ? { ...m, is_muted: isMuted } : m
      ),
    })),

  setHostId: (hostId) => set({ hostId }),

  setCurrentSong: (song) =>
    set((state) => ({
      currentSong: { ...state.currentSong, ...song },
    })),

  setQueue: (queue) => set({ queue }),

  addReaction: (reaction) =>
    set((state) => ({
      reactions: [...state.reactions.slice(-15), reaction], // keep at most 15 in memory
    })),

  removeReaction: (id) =>
    set((state) => ({
      reactions: state.reactions.filter((r) => r.id !== id),
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
      queue: [],
      reactions: [],
      mode: "youtube",
      isScreenSharing: false,
    }),
}));
