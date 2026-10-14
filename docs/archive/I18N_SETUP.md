# Multi-Language Support (i18n) Setup

This project now supports **English** and **Tamil** languages using `react-i18next`.

## 📦 Installed Packages

The following packages have been added to `package.json`:
- `i18next` - Core internationalization framework
- `react-i18next` - React bindings for i18next
- `i18next-browser-languagedetector` - Language detection from browser/localStorage

## 🚀 Installation

Run the following command to install the new dependencies:

```bash
npm install
```

This will install:
- `i18next@^23.7.16`
- `react-i18next@^14.0.0`
- `i18next-browser-languagedetector@^7.2.0`

## 📁 File Structure

```
src/
├── i18n/
│   ├── config.ts              # i18n configuration
│   └── locales/
│       ├── en.json            # English translations
│       └── ta.json            # Tamil translations
└── components/
    └── LanguageSwitcher.tsx   # Language switcher component
```

## 🔧 Configuration

### i18n Config (`src/i18n/config.ts`)

- **Default Language**: English (`en`)
- **Supported Languages**: English (`en`), Tamil (`ta`)
- **Language Detection**: 
  - Checks `localStorage` first (key: `i18nextLng`)
  - Falls back to browser language
- **Language Persistence**: Selected language is saved in `localStorage`

## 🌐 Usage

### Using Translations in Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.home')}</h1>
      <p>{t('messages.loginSuccess')}</p>
    </div>
  );
}
```

### Changing Language Programmatically

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { i18n } = useTranslation();
  
  const changeToTamil = () => {
    i18n.changeLanguage('ta');
    localStorage.setItem('i18nextLng', 'ta');
  };
  
  return <button onClick={changeToTamil}>Switch to Tamil</button>;
}
```

### Language Switcher Component

The `LanguageSwitcherDropdown` component is already integrated in:
- Admin Login page (`/admin/login`)
- Admin Dashboard (`/admin`)

To add it to other components:

```tsx
import { LanguageSwitcherDropdown } from '../components/LanguageSwitcher';

function MyComponent() {
  return (
    <div>
      <LanguageSwitcherDropdown />
      {/* Other content */}
    </div>
  );
}
```

## 📝 Translation Keys Structure

### Common Keys (`common.*`)
- `home`, `jewelry`, `pawn`, `login`, `logout`, `admin`, `dashboard`
- `save`, `cancel`, `delete`, `edit`, `add`, `search`
- `loading`, "error", "success"

### Admin Keys (`admin.*`)
- Page titles and labels
- Dashboard statistics
- Tab names
- Action buttons

### Customer Keys (`customer.*`)
- Customer management labels
- Form fields

### Login Keys (`login.*`)
- Login page labels
- Form fields
- Messages

### Messages Keys (`messages.*`)
- Success/error messages
- Notifications

## ✏️ Adding New Translations

1. **Add keys to English file** (`src/i18n/locales/en.json`):
```json
{
  "mySection": {
    "newKey": "English text"
  }
}
```

2. **Add corresponding Tamil translation** (`src/i18n/locales/ta.json`):
```json
{
  "mySection": {
    "newKey": "தமிழ் உரை"
  }
}
```

3. **Use in component**:
```tsx
const { t } = useTranslation();
<p>{t('mySection.newKey')}</p>
```

## 🎨 Language Switcher

Two versions are available:

1. **LanguageSwitcherDropdown** - Dropdown with click outside to close
   - Used in Admin pages
   - Shows current language (EN/தமிழ்)
   - Click to open dropdown

2. **LanguageSwitcher** - Simple button (can be extended)
   - Basic version
   - Can be customized as needed

## 📍 Current Implementation Status

### ✅ Fully Translated
- Admin Login page
- Admin Dashboard
- Common UI elements
- Navigation labels
- Error/success messages

### 🔄 Partially Translated
- Admin tabs and sections (some labels)
- Forms (basic labels)

### ⏳ Not Yet Translated
- Customer management forms
- Master data sections
- Transaction forms
- Reports
- Public pages (Home, Jewelry, Pawn)

## 🔄 Adding More Languages

To add a new language (e.g., Hindi):

1. **Create translation file**: `src/i18n/locales/hi.json`
2. **Add to config** (`src/i18n/config.ts`):
```typescript
import hiTranslations from './locales/hi.json';

resources: {
  en: { translation: enTranslations },
  ta: { translation: taTranslations },
  hi: { translation: hiTranslations }, // Add this
}
```

3. **Update LanguageSwitcher** component to include Hindi option
4. **Translate all keys** from English file to Hindi

## 💾 Language Persistence

The selected language is automatically:
- Saved to `localStorage` (key: `i18nextLng`)
- Loaded on page refresh
- Detected from browser language if not set

## 🐛 Troubleshooting

### Translations not showing
- Check browser console for missing key warnings
- Verify JSON files are valid (no trailing commas)
- Clear `localStorage` and refresh

### Language not persisting
- Check browser's localStorage settings
- Verify `i18next-browser-languagedetector` is installed
- Check `src/i18n/config.ts` configuration

### Missing translations
- Check translation keys exist in both `en.json` and `ta.json`
- Verify key path matches exactly (case-sensitive)
- Check for typos in translation keys

## 📚 Resources

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [Tamil Unicode Reference](https://unicode.org/charts/PDF/U0B80.pdf)

---

**Note**: The language preference stored in the `companies` table (`language_preference` field) is separate from the UI language selection. The UI language is stored in localStorage and affects the entire application, while the company language preference is for company-specific settings (like receipt language).

