import { create } from "zustand";

export type Track = {
  id: number;
  title: string;
  artist: string;
  album: string;
  cover: string;
  preview: string;
};

type PlayerState = {
  track: Track | null;
  playing: boolean;
  time: number;
  duration: number;
  setTrack: (t: Track, autoplay?: boolean) => void;
  setPlaying: (p: boolean) => void;
  toggle: () => void;
  setTime: (t: number) => void;
  setDuration: (d: number) => void;
};

export const usePlayer = create<PlayerState>((set) => ({
  track: null,
  playing: false,
  time: 0,
  duration: 30,
  setTrack: (track, autoplay = true) => set({ track, playing: autoplay, time: 0 }),
  setPlaying: (playing) => set({ playing }),
  toggle: () => set((s) => ({ playing: s.track ? !s.playing : false })),
  setTime: (time) => set({ time }),
  setDuration: (duration) => set({ duration }),
}));

type ItunesResult = {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  previewUrl?: string;
};

export async function searchTracks(query: string): Promise<Track[]> {
  const res = await fetch(
    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15`,
  );
  const json = (await res.json()) as { results: ItunesResult[] };
  return json.results
    .filter((r) => r.previewUrl)
    .map((r) => ({
      id: r.trackId,
      title: r.trackName,
      artist: r.artistName,
      album: r.collectionName,
      cover: r.artworkUrl100.replace("/100x100bb.jpg", "/600x600bb.jpg"),
      preview: r.previewUrl!,
    }));
}
