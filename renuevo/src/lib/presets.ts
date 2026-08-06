export type Preset = {
  id: string;
  name: string;
  category: string;
  billingCycle: "monthly";
  accent: string;
};

export const PRESETS: Preset[] = [
  {
    id: "netflix",
    name: "Netflix",
    category: "streaming",
    billingCycle: "monthly",
    accent: "#E50914",
  },
  {
    id: "spotify",
    name: "Spotify",
    category: "streaming",
    billingCycle: "monthly",
    accent: "#1DB954",
  },
];
