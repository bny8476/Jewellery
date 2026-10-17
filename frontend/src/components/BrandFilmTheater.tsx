import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  RotateCcw, 
  Sparkles, 
  Film, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface BrandFilm {
  id: string;
  tabLabel: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  videoSrc: string;
  poster: string;
  durationText: string;
  resolutionText: string;
  categoryLink: string;
  metalType: string;
}

const BRAND_FILMS: BrandFilm[] = [
  {
    id: 'diamond-commercial',
    tabLabel: 'Film I • Diamond Solitaire',
    badge: 'Official Commercial Film',
    title: 'The Solitaire Symphony',
    subtitle: 'IGI & GIA Certified Natural Diamonds',
    description: 'A cinematic celebration of radiant light, master cut, and eternal fire. Experience our signature diamond necklaces, solitaire rings, and drops in fluid motion.',
    videoSrc: '/images/Diamond_jewellery_commercial_fil…_20261016165859.mp4',
    poster: '/images/luxury_necklace_hero.jpg',
    durationText: '10s Film',
    resolutionText: '4K Ultra HD',
    categoryLink: 'Necklaces',
    metalType: 'Diamond'
  },
  {
    id: 'gold-heritage',
    tabLabel: 'Film II • Royal 22K Gold',
    badge: 'Artisanal Model Showcase',
    title: 'Heritage Splendour in 22K Gold',
    subtitle: 'Pure 916 BIS Hallmarked Bridal Goldsmithing',
    description: 'Steeped in Dravidian temple artistry and royal South Indian heritage. Watch our handcrafted kasu malas, antique chokers, and bridal waistbands come alive.',
    videoSrc: '/images/Model_showcasing_gold_jewellery_…_20261016165903.mp4',
    poster: '/images/hero_bride_aurelle.jpg',
    durationText: '10s Film',
    resolutionText: '4K Ultra HD',
    categoryLink: 'Bridal Sets',
    metalType: 'Gold'
  }
];

interface BrandFilmTheaterProps {
  onSelectCategory?: (category: string) => void;
  onSelectMetal?: (metal: string) => void;
}

export const BrandFilmTheater: React.FC<BrandFilmTheaterProps> = ({
  onSelectCategory,
  onSelectMetal
}) => {
  const [activeFilmIndex, setActiveFilmIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(10);
  const [hasEnded, setHasEnded] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeFilm = BRAND_FILMS[activeFilmIndex];

  // Reload and start video whenever film tab changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      setHasEnded(false);
      setIsPlaying(true);
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setIsPlaying(false);
        });
      }
    }
  }, [activeFilmIndex]);

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setHasEnded(true);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (hasEnded) {
        videoRef.current.currentTime = 0;
        setHasEnded(false);
      }
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
      setCurrentTime(val);
      if (hasEnded) setHasEnded(false);
    }
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <section className="py-20 sm:py-24 bg-[#14050A] text-[#FAF5F0] relative overflow-hidden border-y border-[#C69A8B]/20">
      {/* Ambient background gold glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-radial from-[#702638]/30 via-transparent to-transparent pointer-events-none blur-3xl opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#2A0B14] border border-[#C69A8B]/40 text-[#E5C388] text-[10px] sm:text-xs font-sans tracking-[0.25em] uppercase font-semibold mb-3">
            <Film className="w-3.5 h-3.5 text-[#E5C388]" />
            <span>YAZHINI CINEMATIC BRAND FILMS</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#FAF5F0]">
            Experience The Craft <span className="font-editorial-italic text-[#E8A598]">In Motion</span>
          </h2>

          <div className="w-14 h-0.5 bg-[#C69A8B] mx-auto mt-3.5 mb-3" />

          <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed max-w-xl mx-auto">
            Immerse yourself in our full commercial films showcasing certified natural diamonds and pure 22K hallmarked bridal splendour.
          </p>

          {/* Film Selector Tabs */}
          <div className="flex items-center justify-center gap-3 mt-6 sm:mt-8">
            {BRAND_FILMS.map((film, idx) => {
              const isActive = activeFilmIndex === idx;
              return (
                <button
                  key={film.id}
                  onClick={() => setActiveFilmIndex(idx)}
                  className={`px-4 sm:px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 flex items-center gap-2 border ${
                    isActive
                      ? 'bg-[#702638] text-white border-[#E5C388] shadow-[0_0_20px_rgba(229,195,136,0.25)]'
                      : 'bg-[#1F0710]/80 text-stone-400 border-white/10 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#E5C388] animate-pulse' : 'bg-stone-500'}`} />
                  <span>{film.tabLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 16:9 Full Widescreen Video Theater Player */}
        <div 
          ref={containerRef}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => isPlaying && setShowControls(false)}
          className="relative max-w-5xl mx-auto aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-black border border-[#C69A8B]/40 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] group"
        >
          {/* Active 16:9 Full Frame Video */}
          <video
            ref={videoRef}
            key={activeFilm.videoSrc}
            src={activeFilm.videoSrc}
            poster={activeFilm.poster}
            autoPlay
            muted={isMuted}
            playsInline
            preload="auto"
            onClick={togglePlay}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full h-full object-cover sm:object-contain bg-black cursor-pointer"
          />

          {/* Subdued Gradient Scrim for Controls */}
          <div 
            onClick={togglePlay}
            className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300 pointer-events-none ${
              showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
            }`} 
          />

          {/* Top Info Bar */}
          <div className={`absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 flex items-center justify-between z-20 pointer-events-auto transition-opacity duration-300 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-black/60 border border-[#E5C388]/40 text-[#E5C388] text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
                {activeFilm.badge}
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-white/10 text-[10px] text-stone-300 uppercase tracking-wider backdrop-blur-sm">
                {activeFilm.resolutionText}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute Sound" : "Mute Sound"}
                className="px-3 py-1.5 rounded-full bg-black/65 hover:bg-[#702638] border border-white/20 hover:border-[#E5C388] text-white text-xs font-medium flex items-center gap-1.5 transition-all backdrop-blur-md shadow-lg"
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-300" />
                    <span className="text-[11px] font-sans">Sound Off</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="text-[11px] font-sans">Sound On</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Center Play/Pause/Replay Overlay Button */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <AnimatePresence>
              {(!isPlaying || showControls) && (
                <motion.button
                  key={hasEnded ? 'replay' : isPlaying ? 'pause' : 'play'}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={togglePlay}
                  className="pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#702638]/90 hover:bg-[#8B2F46] border border-[#E5C388]/80 text-[#FAF5F0] flex items-center justify-center shadow-[0_0_40px_rgba(112,38,56,0.8)] backdrop-blur-md transition-transform hover:scale-110 active:scale-95"
                >
                  {hasEnded ? (
                    <RotateCcw className="w-7 h-7 sm:w-8 sm:h-8 text-[#E5C388]" />
                  ) : isPlaying ? (
                    <Pause className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  ) : (
                    <Play className="w-7 h-7 sm:w-8 sm:h-8 text-white translate-x-0.5" />
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Floating Control Bar */}
          <div className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-20 pointer-events-auto transition-opacity duration-300 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}>
            {/* Title & Subtitle */}
            <div className="mb-2 sm:mb-3 flex items-end justify-between">
              <div>
                <h3 className="font-serif text-lg sm:text-2xl text-white font-normal drop-shadow">
                  {activeFilm.title}
                </h3>
                <p className="text-xs text-[#E5C388] font-light hidden sm:block">
                  {activeFilm.subtitle}
                </p>
              </div>

              <div className="text-[11px] sm:text-xs font-mono text-stone-300 font-medium tracking-wider">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            {/* Interactive Timeline Progress Scrubber */}
            <div className="relative flex items-center group/scrubber cursor-pointer mb-3">
              <input
                type="range"
                min="0"
                max={duration || 10}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 sm:h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#E5C388] focus:outline-none"
              />
              <div 
                className="absolute top-0 left-0 h-1 sm:h-1.5 bg-[#E5C388] rounded-full pointer-events-none transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Lower Controls & Action Row */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="text-stone-300 hover:text-white transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <button
                  onClick={toggleMute}
                  className="text-stone-300 hover:text-white transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (onSelectMetal) onSelectMetal(activeFilm.metalType);
                    if (onSelectCategory) onSelectCategory(activeFilm.categoryLink);
                    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-4 py-1.5 rounded-full bg-[#E5C388] hover:bg-[#F3D7A4] text-[#1A0B12] text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95"
                >
                  <span>Shop Featured Jewellery</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleFullscreen}
                  aria-label="Fullscreen"
                  className="text-stone-300 hover:text-white p-1 transition-colors"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid Below Video */}
        <div className="max-w-5xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-[#1C0811]/70 border border-[#C69A8B]/20 p-5 rounded-xl flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#702638]/40 border border-[#C69A8B]/30 flex items-center justify-center shrink-0 text-[#E5C388]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-wider uppercase text-[#E5C388]">4K Master Filming</h4>
              <p className="text-xs text-stone-300 mt-1 font-light leading-relaxed">
                Shot under natural lighting to reveal accurate pavilion fire and cut angles of our stones.
              </p>
            </div>
          </div>

          <div className="bg-[#1C0811]/70 border border-[#C69A8B]/20 p-5 rounded-xl flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#702638]/40 border border-[#C69A8B]/30 flex items-center justify-center shrink-0 text-[#E5C388]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-wider uppercase text-[#E5C388]">BIS &amp; IGI Certified</h4>
              <p className="text-xs text-stone-300 mt-1 font-light leading-relaxed">
                Every piece shown is backed by tamper-evident laser hallmarking and laboratory certification.
              </p>
            </div>
          </div>

          <div className="bg-[#1C0811]/70 border border-[#C69A8B]/20 p-5 rounded-xl flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#702638]/40 border border-[#C69A8B]/30 flex items-center justify-center shrink-0 text-[#E5C388]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold tracking-wider uppercase text-[#E5C388]">Exact Piece In Showroom</h4>
              <p className="text-xs text-stone-300 mt-1 font-light leading-relaxed">
                Available for live video viewing or touch-and-feel trials at our YAZHINI boutiques.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
