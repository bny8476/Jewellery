import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  const currentLanguage = i18n.language || 'en';

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
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
        title="Change Language"
      >
        <Globe className="h-4 w-4" />
        <span className="uppercase font-semibold">{getLanguageLabel(currentLanguage)}</span>
      </button>
      <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
        <button
          onClick={() => changeLanguage('en')}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-purple-50 transition-colors ${currentLanguage === 'en' ? 'text-purple-600 font-semibold' : 'text-gray-700'
            }`}
        >
          English
        </button>
        <button
          onClick={() => changeLanguage('ta')}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-purple-50 transition-colors ${currentLanguage === 'ta' ? 'text-purple-600 font-semibold' : 'text-gray-700'
            }`}
        >
          தமிழ்
        </button>
        <button
          onClick={() => changeLanguage('hi')}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-purple-50 transition-colors ${currentLanguage === 'hi' ? 'text-purple-600 font-semibold' : 'text-gray-700'
            }`}
        >
          हिंदी
        </button>
      </div>
    </div>
  );
};

// Dropdown version
export const LanguageSwitcherDropdown: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
    setIsOpen(false);
  };

  const currentLanguage = i18n.language || 'en';

  const getLanguageLabel = (code: string) => {
    switch (code) {
      case 'ta': return 'தமிழ்';
      case 'hi': return 'हिंदी';
      default: return 'EN';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
        title="Change Language"
      >
        <Globe className="h-4 w-4" />
        <span className="uppercase font-semibold">{getLanguageLabel(currentLanguage)}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <button
              onClick={() => changeLanguage('en')}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-purple-50 transition-colors ${currentLanguage === 'en' ? 'text-purple-600 font-semibold bg-purple-50' : 'text-gray-700'
                }`}
            >
              English
            </button>
            <button
              onClick={() => changeLanguage('ta')}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-purple-50 transition-colors ${currentLanguage === 'ta' ? 'text-purple-600 font-semibold bg-purple-50' : 'text-gray-700'
                }`}
            >
              தமிழ்
            </button>
            <button
              onClick={() => changeLanguage('hi')}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-purple-50 transition-colors ${currentLanguage === 'hi' ? 'text-purple-600 font-semibold bg-purple-50' : 'text-gray-700'
                }`}
            >
              हिंदी
            </button>
          </div>
        </>
      )}
    </div>
  );
};

