export interface ReactionItem {
  id: string;
  label: string;
  src: string;
}

export const REACTION_ITEMS: ReactionItem[] = [
  { id: "fire", label: "Fire", src: "/assets/fire-emoji.webp" },
  { id: "love", label: "Love", src: "/assets/love-emoji.webp" },
  { id: "haha", label: "Haha", src: "/assets/haha-emoji.webp" },
  { id: "clap", label: "Clap", src: "/assets/clap-emoji.webp" },
  { id: "flower", label: "Flower", src: "/assets/flower-emoji.webp" },
];

export const REACTION_MAP: Record<string, { src: string; label: string }> = {
  fire: { src: "/assets/fire-emoji.webp", label: "Fire" },
  "🔥": { src: "/assets/fire-emoji.webp", label: "Fire" },
  "/assets/fire-emoji.png": { src: "/assets/fire-emoji.webp", label: "Fire" },
  love: { src: "/assets/love-emoji.webp", label: "Love" },
  "❤️": { src: "/assets/love-emoji.webp", label: "Love" },
  "/assets/love-emoji.png": { src: "/assets/love-emoji.webp", label: "Love" },
  haha: { src: "/assets/haha-emoji.webp", label: "Haha" },
  "😂": { src: "/assets/haha-emoji.webp", label: "Haha" },
  "/assets/haha-emoji.png": { src: "/assets/haha-emoji.webp", label: "Haha" },
  clap: { src: "/assets/clap-emoji.webp", label: "Clap" },
  "👏": { src: "/assets/clap-emoji.webp", label: "Clap" },
  "/assets/clap-emoji.png": { src: "/assets/clap-emoji.webp", label: "Clap" },
  flower: { src: "/assets/flower-emoji.webp", label: "Flower" },
  "🎉": { src: "/assets/flower-emoji.webp", label: "Flower" },
  "🌸": { src: "/assets/flower-emoji.webp", label: "Flower" },
  "/assets/flower-emoji.png": { src: "/assets/flower-emoji.webp", label: "Flower" },
};
