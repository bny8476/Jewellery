import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, ExternalLink, Check, Sparkles
} from 'lucide-react';
import { 
  PlatformId, PLATFORMS, platformAccessService 
} from '../../services/platformAccessService';
import { toast } from '../../utils/toast';

interface PlatformSwitcherProps {
  activePlatform: PlatformId;
  onChangePlatform: (platform: PlatformId) => void;
  variant?: 'topNav' | 'sidebar' | 'banner';
}

export const PlatformSwitcher: React.FC<PlatformSwitcherProps> = ({
  activePlatform,
  onChangePlatform,
  variant = 'topNav'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentConfig = PLATFORMS[activePlatform] || PLATFORMS.all;
  const ActiveIcon = currentConfig.icon;

  const handleSelect = (platform: PlatformId) => {
    if (platform === activePlatform) {
      setIsOpen(false);
      return;
    }
    onChangePlatform(platform);
    platformAccessService.setActivePlatform(platform);
    setIsOpen(false);
    toast.success(`Switched workspace to ${PLATFORMS[platform].name}`);
  };

  const handleOpenLive = (e: React.MouseEvent, route: string) => {
    e.stopPropagation();
    window.open(route, '_blank');
  };

  // 1. Sidebar Mode
  if (variant === 'sidebar') {
    return (
      <div className="p-3 border-b border-[var(--border-color)] bg-[var(--bg-card)]/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Platform Switcher
            </span>
          </div>
          <button
            onClick={(e) => handleOpenLive(e, currentConfig.liveRoute)}
            className="text-[10px] text-[var(--gold-primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
            title="Open Live Platform"
          >
            <span>Live Site</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* 4 Platform Buttons Grid */}
        <div className="grid grid-cols-2 gap-1.5">
          {(['ecommerce', 'pawnshop', 'auragold', 'all'] as PlatformId[]).map((pid) => {
            const p = PLATFORMS[pid];
            const Icon = p.icon;
            const isSelected = activePlatform === pid;

            return (
              <button
                key={pid}
                onClick={() => handleSelect(pid)}
                className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[var(--gold-primary)]/15 border-[var(--gold-primary)]/60 text-[var(--text-primary)] shadow-sm'
                    : 'bg-[var(--bg-sidebar)]/80 hover:bg-[var(--bg-elevated)] border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title={p.tagline}
              >
                <div 
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: p.badgeBg, color: p.themeColor }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-semibold truncate block leading-tight">
                    {p.shortName}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. Banner Mode (Header across main workspace)
  if (variant === 'banner') {
    return (
      <div 
        className="px-4 py-2.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm transition-colors mb-5"
        style={{ 
          backgroundColor: currentConfig.badgeBg, 
          borderColor: currentConfig.borderColor 
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-xs shrink-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.25)', color: currentConfig.themeColor }}
          >
            <ActiveIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-serif font-bold text-[var(--text-primary)]">
                {currentConfig.name}
              </span>
            </div>
            <p className="text-[10.5px] text-[var(--text-secondary)] line-clamp-1">
              {currentConfig.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={(e) => handleOpenLive(e, currentConfig.liveRoute)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/30 hover:bg-black/50 border border-white/15 text-xs text-[var(--text-primary)] font-semibold transition-all cursor-pointer shadow-xs"
          >
            <span>View Live Store</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // 3. TopNav Dropdown Mode (Default)
  return (
    <div className="relative shrink-0">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 inline-flex items-center gap-2 px-3 rounded-xl border text-xs font-semibold tracking-wide transition-all shadow-xs cursor-pointer"
        style={{
          backgroundColor: currentConfig.badgeBg,
          color: currentConfig.themeColor,
          borderColor: currentConfig.borderColor
        }}
        title="Switch Platform Management System"
      >
        <ActiveIcon className="w-3.5 h-3.5 shrink-0" />
        <span className="font-bold tracking-tight">{currentConfig.shortName}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <ChevronDown className={`w-3 h-3 opacity-70 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-2.5 z-50 text-xs space-y-1.5"
            onMouseLeave={() => setIsOpen(false)}
          >
            <div className="px-3 py-2 border-b border-[var(--border-color)] flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                  Platform Access Management
                </p>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Switch platform workspace
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[9px] font-mono text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>

            {/* List of 3 Platforms + Unified Overview */}
            <div className="space-y-1 pt-1">
              {(['ecommerce', 'pawnshop', 'auragold', 'all'] as PlatformId[]).map((pid) => {
                const p = PLATFORMS[pid];
                const Icon = p.icon;
                const isSelected = activePlatform === pid;

                return (
                  <div
                    key={pid}
                    onClick={() => handleSelect(pid)}
                    className={`p-2.5 rounded-xl transition-all cursor-pointer border flex items-start justify-between gap-3 group ${
                      isSelected
                        ? 'bg-[var(--gold-primary)]/15 border-[var(--gold-primary)]/40 shadow-xs'
                        : 'hover:bg-[var(--bg-elevated)] border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs"
                        style={{ backgroundColor: p.badgeBg, color: p.themeColor }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-[var(--text-primary)] truncate">
                            {p.name}
                          </h4>
                        </div>
                        <p className="text-[10.5px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                          {p.tagline}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-1">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[var(--gold-primary)] text-black flex items-center justify-center shadow-2xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <button
                          onClick={(e) => handleOpenLive(e, p.liveRoute)}
                          className="p-1.5 rounded-lg hover:bg-black/20 text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Open live website in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Live Note */}
            <div className="p-2 bg-[var(--bg-sidebar)]/80 rounded-xl border border-[var(--border-color)] text-[10px] text-[var(--text-muted)] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>All changes automatically synchronize live with corresponding websites.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlatformSwitcher;
