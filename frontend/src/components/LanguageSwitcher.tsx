import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const getNormalizedLang = () => {
    const raw = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase();
    if (raw.startsWith('ta')) return 'ta';
    if (raw.startsWith('hi')) return 'hi';
    return 'en';
  };

  const [currentLanguage, setCurrentLanguage] = useState<string>(getNormalizedLang);

  useEffect(() => {
    const handleLangChange = (lng: string) => {
      const norm = (lng || '').toLowerCase();
      if (norm.startsWith('ta')) setCurrentLanguage('ta');
      else if (norm.startsWith('hi')) setCurrentLanguage('hi');
      else setCurrentLanguage('en');
    };
    i18n.on('languageChanged', handleLangChange);
    return () => {
      i18n.off('languageChanged', handleLangChange);
    };
  }, [i18n]);

  const changeLanguage = async (lng: string) => {
    try {
      await i18n.changeLanguage(lng);
      localStorage.setItem('i18nextLng', lng);
      document.documentElement.lang = lng;
      setCurrentLanguage(lng);
    } catch (err) {
      console.error('Failed to change language:', err);
    }
  };

  const getLanguageLabel = (code: string) => {
    switch (code) {
      case 'ta': return 'தமிழ்';
      case 'hi': return 'हिंदी';
      default: return 'EN';
    }
  };

  return (
    <div className="relative inline-block group">
      <button
        type="button"
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
        title="Change Language"
      >
        <Globe className="h-4 w-4" />
        <span className="font-semibold">{getLanguageLabel(currentLanguage)}</span>
      </button>
      <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
        <button
          type="button"
          onClick={() => changeLanguage('en')}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-purple-50 transition-colors ${
            currentLanguage === 'en' ? 'text-purple-600 font-semibold' : 'text-gray-700'
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => changeLanguage('ta')}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-purple-50 transition-colors ${
            currentLanguage === 'ta' ? 'text-purple-600 font-semibold' : 'text-gray-700'
          }`}
        >
          தமிழ்
        </button>
        <button
          type="button"
          onClick={() => changeLanguage('hi')}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-purple-50 transition-colors ${
            currentLanguage === 'hi' ? 'text-purple-600 font-semibold' : 'text-gray-700'
          }`}
        >
          हिंदी
        </button>
      </div>
    </div>
  );
};

// Dropdown version
export const LanguageSwitcherDropdown: React.FC<{ className?: string; buttonClassName?: string }> = ({
  className = '',
  buttonClassName = ''
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getNormalizedLang = () => {
    const raw = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase();
    if (raw.startsWith('ta')) return 'ta';
    if (raw.startsWith('hi')) return 'hi';
    return 'en';
  };

  const [currentLanguage, setCurrentLanguage] = useState<string>(getNormalizedLang);

  useEffect(() => {
    const handleLangChange = (lng: string) => {
      const norm = (lng || '').toLowerCase();
      if (norm.startsWith('ta')) setCurrentLanguage('ta');
      else if (norm.startsWith('hi')) setCurrentLanguage('hi');
      else setCurrentLanguage('en');
    };
    i18n.on('languageChanged', handleLangChange);
    return () => {
      i18n.off('languageChanged', handleLangChange);
    };
  }, [i18n]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const changeLanguage = async (lng: string) => {
    try {
      await i18n.changeLanguage(lng);
      localStorage.setItem('i18nextLng', lng);
      document.documentElement.lang = lng;
      setCurrentLanguage(lng);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to change language:', err);
    }
  };

  const getLanguageLabel = (code: string) => {
    switch (code) {
      case 'ta': return 'தமிழ்';
      case 'hi': return 'हिंदी';
      default: return 'EN';
    }
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={buttonClassName || "flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"}
        title="Change Language / மொழி தேர்வு"
        aria-label="Change Language"
        aria-expanded={isOpen}
      >
        <Globe className="h-4 w-4 shrink-0 text-[var(--gold-primary)]" />
        <span className="font-semibold text-xs tracking-wide">{getLanguageLabel(currentLanguage)}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-[var(--bg-card)] rounded-xl shadow-2xl border border-[var(--border-color)] py-1.5 z-50 text-xs space-y-0.5 backdrop-blur-md">
          <button
            type="button"
            onClick={() => changeLanguage('en')}
            className={`w-full flex items-center justify-between px-3.5 py-2 transition-colors cursor-pointer ${
              currentLanguage === 'en'
                ? 'text-[var(--gold-primary)] font-semibold bg-[var(--gold-primary)]/10'
                : 'text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            <span>English</span>
            {currentLanguage === 'en' && <Check className="w-3.5 h-3.5 text-[var(--gold-primary)]" />}
          </button>
          <button
            type="button"
            onClick={() => changeLanguage('ta')}
            className={`w-full flex items-center justify-between px-3.5 py-2 transition-colors cursor-pointer ${
              currentLanguage === 'ta'
                ? 'text-[var(--gold-primary)] font-semibold bg-[var(--gold-primary)]/10'
                : 'text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            <span className="font-medium">தமிழ்</span>
            {currentLanguage === 'ta' && <Check className="w-3.5 h-3.5 text-[var(--gold-primary)]" />}
          </button>
          <button
            type="button"
            onClick={() => changeLanguage('hi')}
            className={`w-full flex items-center justify-between px-3.5 py-2 transition-colors cursor-pointer ${
              currentLanguage === 'hi'
                ? 'text-[var(--gold-primary)] font-semibold bg-[var(--gold-primary)]/10'
                : 'text-[var(--text-main)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            <span className="font-medium">हिंदी</span>
            {currentLanguage === 'hi' && <Check className="w-3.5 h-3.5 text-[var(--gold-primary)]" />}
          </button>
        </div>
      )}
    </div>
  );
};
