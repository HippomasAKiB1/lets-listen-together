export interface ReactionItem {
  id: string;
  label: string;
  src: string;
}

export const REACTION_ITEMS: ReactionItem[] = [
  { id: "fire", label: "Fire", src: "/assets/fire-emoji.png" },
  { id: "love", label: "Love", src: "/assets/love-emoji.png" },
  { id: "haha", label: "Haha", src: "/assets/haha-emoji.png" },
  { id: "clap", label: "Clap", src: "/assets/clap-emoji.png" },
  { id: "flower", label: "Flower", src: "/assets/flower-emoji.png" },
];

export const REACTION_MAP: Record<string, { src: string; label: string }> = {
  fire: { src: "/assets/fire-emoji.png", label: "Fire" },
  "🔥": { src: "/assets/fire-emoji.png", label: "Fire" },
  love: { src: "/assets/love-emoji.png", label: "Love" },
  "❤️": { src: "/assets/love-emoji.png", label: "Love" },
  haha: { src: "/assets/haha-emoji.png", label: "Haha" },
  "😂": { src: "/assets/haha-emoji.png", label: "Haha" },
  clap: { src: "/assets/clap-emoji.png", label: "Clap" },
  "👏": { src: "/assets/clap-emoji.png", label: "Clap" },
  flower: { src: "/assets/flower-emoji.png", label: "Flower" },
  "🎉": { src: "/assets/flower-emoji.png", label: "Flower" },
  "🌸": { src: "/assets/flower-emoji.png", label: "Flower" },
};
