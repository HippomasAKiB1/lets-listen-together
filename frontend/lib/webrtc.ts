"use client";
/**
 * WebRTC voice manager using simple-peer.
 * Handles multi-peer mesh for voice communication.
 * Also handles screenshare stream relay.
 */

import Peer from "simple-peer";
import { Socket } from "socket.io-client";
import { useRoomStore } from "@/store/roomStore";

type PeerEntry = {
  peer: Peer.Instance;
  userId: string;
  username: string;
};

const peers: Map<string, PeerEntry> = new Map(); // sid → peer
let localStream: MediaStream | null = null;
let screenshareStream: MediaStream | null = null;
let audioContext: AudioContext | null = null;
let musicGainNode: GainNode | null = null;
let voiceActive = false;
let voiceTimeout: ReturnType<typeof setTimeout> | null = null;

// ── Local stream ──────────────────────────────────────────────────────────

export async function initLocalStream(): Promise<MediaStream> {
  if (localStream) return localStream;
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  return localStream;
}

export function stopLocalStream() {
  localStream?.getTracks().forEach((t) => t.stop());
  localStream = null;
}

// ── Create peer connection ────────────────────────────────────────────────

export function createPeer(
  targetSid: string,
  targetUserId: string,
  targetUsername: string,
  initiator: boolean,
  socket: Socket
): Peer.Instance {
  const peer = new Peer({
    initiator,
    stream: localStream || undefined,
    trickle: true,
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    },
  });

  peer.on("signal", (signalData) => {
    if (signalData.type === "offer") {
      socket.emit("webrtc_offer", { target_sid: targetSid, signal: signalData });
    } else if (signalData.type === "answer") {
      socket.emit("webrtc_answer", { target_sid: targetSid, signal: signalData });
    } else {
      socket.emit("webrtc_ice", { target_sid: targetSid, signal: signalData });
    }
  });

  peer.on("stream", (remoteStream) => {
    // Attach audio to a hidden element
    const audio = new Audio();
    audio.srcObject = remoteStream;
    audio.autoplay = true;
    audio.id = `audio-${targetSid}`;
    document.body.appendChild(audio);

    // Voice activity detection → ducking
    _monitorVoice(remoteStream, targetUserId);
  });

  peer.on("track", (track, remoteStream) => {
    // Handle screenshare video tracks
    if (track.kind === "video") {
      const event = new CustomEvent("screenshare-stream", {
        detail: { stream: remoteStream, sid: targetSid },
      });
      window.dispatchEvent(event);
    }
  });

  peer.on("close", () => {
    _cleanupPeer(targetSid);
  });

  peer.on("error", (err) => {
    console.warn("WebRTC peer error:", err);
    _cleanupPeer(targetSid);
  });

  peers.set(targetSid, { peer, userId: targetUserId, username: targetUsername });
  return peer;
}

function _cleanupPeer(sid: string) {
  const audio = document.getElementById(`audio-${sid}`);
  audio?.remove();
  peers.delete(sid);
}

export function destroyAllPeers() {
  peers.forEach(({ peer }, sid) => {
    peer.destroy();
    const audio = document.getElementById(`audio-${sid}`);
    audio?.remove();
  });
  peers.clear();
}

export function getPeer(sid: string): Peer.Instance | undefined {
  return peers.get(sid)?.peer;
}

export function getAllPeerSids(): string[] {
  return Array.from(peers.keys());
}

// ── Mute / Unmute ─────────────────────────────────────────────────────────

export function setMuted(muted: boolean) {
  localStream?.getAudioTracks().forEach((track) => {
    track.enabled = !muted;
  });
}

// ── Screenshare ──────────────────────────────────────────────────────────

export async function startScreenShare(socket: Socket, roomId: string): Promise<MediaStream> {
  screenshareStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: { echoCancellation: false } as MediaTrackConstraints,
  });

  // Add screenshare track to all existing peers
  screenshareStream.getTracks().forEach((track) => {
    peers.forEach(({ peer }) => {
      try { peer.addTrack(track, screenshareStream!); } catch {}
    });
  });

  screenshareStream.getVideoTracks()[0].onended = () => {
    stopScreenShare(socket);
  };

  socket.emit("screenshare_started", { room_id: roomId });
  return screenshareStream;
}

export function stopScreenShare(socket: Socket) {
  screenshareStream?.getTracks().forEach((t) => t.stop());
  screenshareStream = null;
  socket.emit("screenshare_ended", {});
}

// ── Voice Ducking (Web Audio API & YouTube API Support) ─────────────────────────────────────────

type VoiceCallback = (active: boolean) => void;
let voiceCallback: VoiceCallback | null = null;

export function setVoiceCallback(cb: VoiceCallback | null) {
  voiceCallback = cb;
}

export function setupAudioMixer(audioElement: HTMLAudioElement) {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  const source = audioContext.createMediaElementSource(audioElement);
  musicGainNode = audioContext.createGain();
  musicGainNode.gain.value = 1.0;
  source.connect(musicGainNode);
  musicGainNode.connect(audioContext.destination);
}

function _monitorVoice(stream: MediaStream, userId: string) {
  if (!audioContext) return;
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.3;
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);

  const data = new Uint8Array(analyser.frequencyBinCount);

  const check = () => {
    if (!audioContext) return; // Exit if cleaned up
    analyser.getByteFrequencyData(data);
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    const speaking = avg > 15;

    // Update store for UI
    useRoomStore.getState().setMemberSpeaking(userId, speaking);

    if (speaking && !voiceActive) {
      voiceActive = true;
      if (musicGainNode && audioContext) {
        musicGainNode.gain.setTargetAtTime(0.4, audioContext.currentTime, 0.05);
      }
      if (voiceCallback) {
        voiceCallback(true);
      }
      if (voiceTimeout) { clearTimeout(voiceTimeout); voiceTimeout = null; }
    } else if (!speaking && voiceActive) {
      if (!voiceTimeout) {
        voiceTimeout = setTimeout(() => {
          voiceActive = false;
          if (musicGainNode && audioContext) {
            musicGainNode.gain.setTargetAtTime(1.0, audioContext.currentTime, 0.5);
          }
          if (voiceCallback) {
            voiceCallback(false);
          }
          voiceTimeout = null;
        }, 500);
      }
    }

    requestAnimationFrame(check);
  };
  check();
}

export function cleanupAudio() {
  audioContext?.close();
  audioContext = null;
  musicGainNode = null;
  voiceActive = false;
  voiceCallback = null;
}
