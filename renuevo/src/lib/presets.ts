export type Preset = {
  id: string;
  name: string;
  category: string;
  billingCycle: "monthly";
  logo: string;
  color: string;
};

export const PRESETS: Preset[] = [
  {
    id: "netflix",
    name: "Netflix",
    category: "streaming",
    billingCycle: "monthly",
    logo: "/logos/netflix.png",
    color: "#E50914",
  },
  {
    id: "spotify",
    name: "Spotify",
    category: "streaming",
    billingCycle: "monthly",
    logo: "/logos/spotify.png",
    color: "#1DB954",
  },
];
