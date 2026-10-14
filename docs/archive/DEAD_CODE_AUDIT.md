# Dead Code Audit & Safe Refactoring Report

**Project:** Jewellery Storefront & Pawnshop ERP  
**Audit Date:** 2026-10-13  
**Status:** Phase 1 & 2 Completed — Awaiting User Approval Before Deletion  

---

## 1. Dead Code Candidates Inventory

| Candidate | Category | Location | Evidence | Verification | Confidence | Risk | Recommendation | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `src/pages/Jewelry.tsx` | Unused file | `src/pages/Jewelry.tsx` (415 lines) | Storefront catalog merged into `Home.tsx`. `App.tsx` routes `/jewelry` directly to `Home.tsx` via `<Navigate to="/" replace />`. Zero imports across codebase. | `grep` search for `pages/Jewelry` returned 0 imports. Test suite & build pass without it. | Confirmed unused | Low | Delete after approval | Awaiting approval |
| `seed-now.js` | Unused file | Root directory | Empty file (0 bytes). | File size check shows 0 bytes. Zero imports across repo. | Confirmed unused | None | Delete | Awaiting approval |
| `seed-now.cjs` | Unused file | Root directory (91 lines) | Ad-hoc debugging script with hardcoded demo credentials. Not referenced in `package.json` scripts, Vite, or CI/CD. Seed logic is handled by `src/lib/seedData.ts`. | Grep search shows zero imports. | Confirmed unused | None | Delete | Awaiting approval |
| `check-rls.cjs` | Unused file | Root directory (15 lines) | Ad-hoc database query script with plaintext password. Never referenced in `package.json` scripts, build, or CI/CD. | Grep search shows zero imports or script references. | Confirmed unused | None (Security gain) | Delete | Awaiting approval |
| `extract-sql.cjs` | Unused file | Root directory (15 lines) | One-time regex extraction script used to generate `schema.sql`. Not referenced in `package.json` scripts or build tooling. | Grep search shows zero references. | Confirmed unused | None | Delete | Awaiting approval |
| `jewelry-store-website/` | Unused directory | `jewelry-store-website/` (Subdir) | Obsolete legacy Create-React-App project (React 17, React Router 5) nested inside root. Root project is Vite + React 18. | Zero imports from root project. Never bundled by Vite. | Confirmed unused | Low | Delete / Archive | Awaiting approval |
| `build_log.txt` | Unused file | Root directory (3.4 KB) | Temporary build log dump from a previous build run. | Not referenced by tooling or code. | Confirmed unused | None | Delete | Awaiting approval |
| `gsap` dependency | Unused dependency | `package.json:20` | Installed via commit `02d75c3`, but all application animations are built using `framer-motion` (`Home.tsx`, `ThemeToggle.tsx`, `LiveMetalRates.tsx`). | Grep search across `src/` for `gsap` yields 0 results. Build and tests pass without it. | Confirmed unused | Low | Remove from `package.json` | Awaiting approval |
| `AccountsSection.tsx` unused import | Unused import | `src/components/admin/AccountsSection.tsx:3` | `DollarSign` imported from `lucide-react` but never used in component JSX. | Flagged by ESLint `@typescript-eslint/no-unused-vars`. | Confirmed unused | None | Remove import | Awaiting approval |
| `AdditionalPledgeForm.tsx` unused import | Unused import | `src/components/admin/AdditionalPledgeForm.tsx:2` | `X` imported from `lucide-react` but never used in component JSX. | Flagged by ESLint `@typescript-eslint/no-unused-vars`. | Confirmed unused | None | Remove import | Awaiting approval |
| `BankSection.tsx` unused imports & types | Unused imports / types | `src/components/admin/BankSection.tsx:3, 20` | `Search, Save, X, Eye` imported from `lucide-react`; interface `BankPledge` declared but never referenced. | Flagged by ESLint `@typescript-eslint/no-unused-vars`. | Confirmed unused | None | Remove unused imports and local interface | Awaiting approval |
| `CancelTransactionForm.tsx` unused imports | Unused imports / types | `src/components/admin/CancelTransactionForm.tsx:2, 4` | `X` and `CancelledTransaction` imported but never referenced in component. | Flagged by ESLint `@typescript-eslint/no-unused-vars`. | Confirmed unused | None | Remove unused imports | Awaiting approval |
| `SeedButton.tsx` Hook placement defect | Defective code | `src/components/admin/SeedButton.tsx:7-12` | Early return `if (!import.meta.env.DEV) return null;` placed before `useState`, violating React Rules of Hooks. | Flagged by ESLint `react-hooks/rules-of-hooks` (2 errors). | Confirmed defect | None | Move hooks to top of component | Awaiting approval |
| `validation.ts` regex escape | Unused escape | `src/utils/validation.ts:54` | Unnecessary escape character `\-` in regex character class. | Flagged by ESLint `no-useless-escape` (1 error). | Confirmed defect | None | Remove useless escape | Awaiting approval |
| Currency formatting duplication | Duplicate logic | 8 files (`Home.tsx`, `WishlistDrawer.tsx`, `ProductDetailsModal.tsx`, `PaymentGateway.tsx`, `LiveMetalRates.tsx`, `CheckoutModal.tsx`, `CartDrawer.tsx`, `OrdersSection.tsx`) | `new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(...)` duplicated 14 times. | Code audit of all format calls. | Confirmed duplicate | Low | Refactor to `formatCurrencyINR` in `src/utils/formatters.ts` | Awaiting approval |
| Date formatting duplication | Duplicate logic | 7 files (`receiptUtils.ts`, `invoiceUtils.ts`, `Pawn.tsx`, `Notifications.tsx`, `Dashboard.tsx`, `OrdersSection.tsx`, `OnlineRequests.tsx`) | Inconsistent inline `new Date(d).toLocaleDateString()` calls without shared fallback. | Code audit of date rendering. | Confirmed duplicate | Low | Refactor to `formatDate` in `src/utils/formatters.ts` | Awaiting approval |

---

## 2. Retained Candidates Requiring Retention

The following files might appear unused at first glance, but are **explicitly retained**:

1. **`keep-alive.cjs`**: Used by `.github/workflows/keep-alive.yml` on a scheduled cron to ping Supabase and prevent automated project pausing.
2. **`scripts/update-metal-rates.cjs`**: Used by `package.json` script `"update:rates"`.
3. **`src/services/pawnshopService.ts`**: Re-export barrel maintaining backward compatibility across components.
4. **`src/utils/localData.ts`**: Fallback luxury inventory used when Supabase is in demo mode or offline.
5. **`supabase/migrations/` and SQL schema files**: Critical for database deployment and audit trail.

---

## 3. Environment Variables Audit

| Variable | Referenced In | Documented in `.env.example` | Status | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `src/lib/supabase.ts`, `scripts/` | Yes | Active & Required | Retain |
| `VITE_SUPABASE_ANON_KEY` | `src/lib/supabase.ts`, `scripts/` | Yes | Active & Required | Retain |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `src/components/PaymentGateway.tsx` | Yes | Active & Required | Retain |
| `STRIPE_SECRET_KEY` | `api/create-payment-intent.ts`, `api/stripe-webhook.ts` | Yes | Active & Required | Retain |
| `STRIPE_WEBHOOK_SECRET` | `api/stripe-webhook.ts` | Yes | Active & Optional (Dev fallback) | Retain |
| `VITE_GOLD_API_KEY` | `src/context/RateContext.tsx`, `scripts/` | Yes | Active & Optional | Retain |
| `VITE_ADMIN_EMAIL` | `src/pages/AdminLogin.tsx`, `src/components/ProtectedRoute.tsx` | **No** | Active & Missing from docs | Add to `.env.example` |
| `APP_URL` | `api/create-payment-intent.ts` | **No** | Active & Missing from docs | Add to `.env.example` |
| `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME` | `setup-db.cjs`, `setup-pawnshop-db.cjs` | Yes | Active for migrations | Retain |

---

## 4. Proposed Refactoring Blueprint

### New Module: `src/utils/formatters.ts`
```typescript
/**
 * Consolidated formatters for currency, dates, numbers, and weights.
 */
export const formatCurrencyINR = (amount: number | null | undefined): string => {
  const valid = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(valid);
};

export const formatDate = (
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', options);
};

export const formatWeight = (grams: number | null | undefined): string => {
  const valid = typeof grams === 'number' && Number.isFinite(grams) ? grams : 0;
  return `${valid.toFixed(2)} g`;
};
```
