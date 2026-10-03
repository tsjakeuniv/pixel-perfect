import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, Search, SkipBack, Disc3, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { searchTracks, usePlayer, type Track } from "@/lib/player-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vinyl — A tactile turntable for your music" },
      { name: "description", content: "Search any song and play its preview on a realistic spinning turntable." },
      { property: "og:title", content: "Vinyl — A tactile turntable" },
      { property: "og:description", content: "Search any song and drop the needle on a realistic turntable." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function fmt(s: number) {
  const n = Math.max(0, Math.floor(s));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
}

function Index() {
  const { track, playing, time, duration, setTrack, setPlaying, toggle, setTime, setDuration } =
    usePlayer();
  const audio = useRef<HTMLAudioElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  const run = async (q: string, boot = false) => {
    setLoading(true);
    try {
      const r = await searchTracks(q);
      setResults(r);
      if (boot && r[0]) setTrack(r[0], false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    run("Daft Punk", true);
  }, []);

  useEffect(() => {
    const a = audio.current;
    if (!a || !track) return;
    if (a.src !== track.preview) a.src = track.preview;
    if (playing) {
      // small delay so the tonearm lands first
      const t = setTimeout(() => a.play().catch(() => setPlaying(false)), 350);
      return () => clearTimeout(t);
    }
    a.pause();
  }, [track, playing]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <audio
        ref={audio}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 30)}
        onEnded={() => setPlaying(false)}
      />
      <nav className="bg-nav text-nav-foreground">
        <div className="mx-auto flex h-11 max-w-5xl items-center gap-2 px-6 text-xs">
          <Disc3 className="h-4 w-4" /> Vinyl
        </div>
      </nav>
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-3">
          <h2 className="text-[21px]">Turntable</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) run(query.trim());
            }}
            className="relative w-full max-w-sm"
          >
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search artists or songs"
              className="h-10 w-full rounded-full border border-border bg-card pl-10 pr-4 text-[15px] outline-none focus:border-primary"
            />
          </form>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <TurntablePlinth
          track={track}
          playing={playing}
          onToggle={toggle}
        />

        <section className="mx-auto mt-10 max-w-xl text-center">
          <h1 className="truncate text-[21px] leading-tight">{track?.title ?? "No record"}</h1>
          <p className="truncate text-muted-foreground">{track?.artist ?? "Search to begin"}</p>
          <div className="mt-6 flex items-center gap-3 text-xs tabular-nums text-muted-foreground">
            <span className="w-8 text-right">{fmt(time)}</span>
            <Slider
              value={[time]}
              max={duration || 30}
              step={0.1}
              onValueChange={([v]) => {
                if (audio.current) audio.current.currentTime = v;
                setTime(v);
              }}
              className="flex-1"
            />
            <span className="w-8">{fmt(duration)}</span>
          </div>
          <div className="mt-5 flex items-center justify-center gap-4">
            <button
              aria-label="Restart"
              onClick={() => {
                if (audio.current) audio.current.currentTime = 0;
              }}
              className="press flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              aria-label={playing ? "Pause" : "Play"}
              onClick={toggle}
              className="press flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              {playing ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="ml-0.5 h-5 w-5" fill="currentColor" />}
            </button>
          </div>
        </section>

        <section className="mt-16">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-[21px]">Crate</h2>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => setTrack(r, true)}
                className={cn(
                  "press flex items-center gap-3 rounded-2xl border bg-card p-3 text-left",
                  track?.id === r.id ? "border-primary" : "border-border",
                )}
              >
                <img src={r.cover} alt="" className="h-14 w-14 rounded-lg object-cover" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">{r.title}</p>
                  <p className="truncate text-sm text-muted-foreground">{r.artist}</p>
                </div>
                {track?.id === r.id && playing && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
                    Playing
                  </span>
                )}
              </button>
            ))}
            {!loading && results.length === 0 && (
              <p className="text-muted-foreground">No tracks found.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function TurntablePlinth({
  track,
  playing,
  onToggle,
}: {
  track: Track | null;
  playing: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="plinth-texture shadow-plinth relative mx-auto aspect-[5/4] w-full max-w-2xl rounded-[28px] p-[6%]">
      <div className="relative h-full w-[78%]">
        {/* platter */}
        <div className="absolute inset-0 m-auto aspect-square h-full rounded-full bg-metal/20 p-[2%]">
          <div
            className={cn("vinyl-grooves spin-33 relative h-full w-full rounded-full")}
            style={{ animationPlayState: playing ? "running" : "paused" }}
          >
            <div className="absolute inset-[32%] overflow-hidden rounded-full border-4 border-vinyl">
              {track && <img src={track.cover} alt={track.album} className="h-full w-full object-cover" />}
            </div>
            <div className="absolute left-1/2 top-1/2 h-[3%] w-[3%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-metal" />
          </div>
        </div>
      </div>
      {/* tonearm */}
      <button
        aria-label="Tonearm"
        onClick={onToggle}
        className="absolute right-[9%] top-[9%] h-[72%] w-[14%] origin-[50%_8%] transition-transform duration-700 ease-in-out"
        style={{ transform: `rotate(${playing ? 28 : 0}deg)` }}
      >
        <span className="absolute left-1/2 top-0 aspect-square w-[70%] -translate-x-1/2 rounded-full border border-plinth-foreground/30 bg-metal" />
        <span className="absolute left-1/2 top-[6%] h-[82%] w-[8%] -translate-x-1/2 rounded-full bg-metal" />
        <span className="absolute bottom-0 left-1/2 h-[14%] w-[34%] -translate-x-[70%] rotate-[20deg] rounded-md bg-metal" />
      </button>
      <div className="absolute bottom-[6%] right-[6%] flex items-center gap-2 text-xs text-plinth-foreground">
        <span className={cn("h-2 w-2 rounded-full", playing ? "bg-sky" : "bg-plinth-foreground/30")} />
        33⅓
      </div>
    </div>
  );
}
