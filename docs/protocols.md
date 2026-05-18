# React app protocols

This document list the operations to run, implementations to write and tools to use for specific cases that may happen during the development of a React app.

> The goal of this document is to be as exhaustive as possible, leaving no doubt when it comes to add/use something in a project. Please report any missing part or need for more details.

## Routing

The preferred routing library is *TanStack Router* with file-based routing.

If you are using Vite, we also recommend using the related plugin.

### Add routing tools

1. Install the runtime and the Vite plugin:

```sh
npm install @tanstack/react-router
npm install --save-dev @tanstack/router-plugin
```

2. Register the Vite plugin **before** the React plugin in `vite.config.ts`:

```ts
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
  ],
})
```

**Note**: `autoCodeSplitting: true` lazy-loads each route automatically, and is strongly recommended.

3. Bootstrap the router in `main.tsx`:

```tsx
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { routeTree } from './routeTree.gen'

// Create route tree from generated file
const router = createRouter({ routeTree })
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element #root not found')
}

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

4. Fix Biome config

`routeTree.gen.ts` must be excluded from Biome, as it's a generated file that may not match the Biome rules. Add this to your Biome config:

```json
{
  "files": {
    "includes": ["**", "!src/routeTree.gen.ts"]
  }
}
```

### Add a new route

@todo

### Setup a route guard

Use `beforeLoad` for auth guards. Redirect using `throw redirect(...)`:

```ts
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/protected')({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/auth' })
    }
  },
  component: ProtectedPage,
})
```

### 404 handling

#### Use a route for 404 error

@todo

#### Redirect on 404 error

Create a "catch-all" route script `src/routes/$.tsx`:

```ts
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/$')({
  beforeLoad: () => {
    throw redirect({ to: '/' })
  },
})
```

Then regenerate the route tree script by running the server with `npm run dev` or `npx vite`.

**Note**: Starting the server to regenera the file is a bit clunky. You should check if a command exists to do it properly in the recent version of *TanStack Router*.

### Handle render errors (error boundary)

React crashes during rendering are caught by error boundaries. TanStack Router exposes `defaultErrorComponent` on the router for a single app-wide fallback, with the option to override it per route.

#### Setup

1. Create `src/components/route-error.tsx`:

```tsx
import type { ErrorComponentProps } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export function RouteError({ error, reset }: ErrorComponentProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4">
      <p className="text-destructive text-sm">{error.message}</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>Reload page</Button>
      </div>
    </div>
  )
}
```

`reset` re-runs the route load. `window.location.reload()` is a harder reset for cases where React state itself is corrupted.

`console.error` is called inside `useEffect` because React already logs render errors in development via its error overlay, but not in production. The effect ensures the error is always surfaced in the console regardless of environment.

2. Register it as the default in `main.tsx`:

```tsx
import { RouteError } from '@/components/route-error'

const router = createRouter({ routeTree, defaultErrorComponent: RouteError })
```

#### Override per route

For routes where the fallback should look or behave differently, pass `errorComponent` directly on the route definition:

```ts
export const Route = createFileRoute('/board')({
  errorComponent: ({ error, reset }) => <BoardError error={error} reset={reset} />,
  component: BoardPage,
})
```

#### Testing

Temporarily throw inside the component body and navigate to that route:

```tsx
function BoardPage() {
  throw new Error('Test error boundary')
}
```

The `RouteError` fallback should render with the message and both buttons. Remove the line once verified.

## UI components

The preferred component library is [`shadcn/ui`](https://ui.shadcn.com/) with [*Tailwind CSS v4*](https://tailwindcss.com/).

`shadcn/ui` is not a traditional npm package: it copies component source code directly into your project under `src/components/ui/`. Components are yours to read and modify. New components are added one by one with `npx shadcn add <component>`.

*Tailwind CSS* is a hard requirement for `shadcn/ui`, as component source files use *Tailwind* utility classes directly.

### Add a component

```sh
npx shadcn add <component>
```

For example: `npx shadcn add dialog`, `npx shadcn add input`.

The component is copied into `src/components/ui/` and is ready to import and modify.

### Setup toast notifications (Sonner)

[*Sonner*](https://sonner.emilkowal.ski/) is the toast library recommended by `shadcn/ui`. `shadcn` wraps it in a `Toaster` component that reads the active theme automatically.

#### Setup

1. Add the component via `shadcn`:

```sh
npx shadcn@latest add sonner
```

This installs the `sonner` package and generates `src/components/ui/sonner.tsx`.

2. Mount `<Toaster />` once at the app root in `main.tsx`, inside `QueryClientProvider` so it is always rendered regardless of the active route:

```tsx
import { Toaster } from '@/components/ui/sonner'

createRoot(root).render(
  <StrictMode>
    <Toaster />
  </StrictMode>,
)
```

#### Usage

`shadcn` only wraps the `Toaster` display component. The `toast()` trigger function is imported directly from the `sonner` package:

```ts
import { toast } from 'sonner'

toast.success('Saved!')
toast.error('Something went wrong.')
toast.info('3 items updated.')
```

**Note**: Do not import `toast` from `@/components/ui/sonner` — that file only exports `Toaster`. The split is intentional: the shadcn wrapper owns the display, `sonner` owns the imperative API.

### Example: create Auth page

#### 1. Create the components using UI tools

```
npx shadcn add card input label
```

#### 2. Create the Auth page

```tsx
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function AuthPage() {
  return (
    <div className="bg-muted flex min-h-svh items-center justify-center">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Please enter your credentials to log in.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" type="text" placeholder="" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full">
              Log in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

## API

The preferred stack for API integration is [*Orval*](https://orval.dev/) for code generation, *Axios* as the HTTP client, *TanStack Query* for HTTP state management, and *MSW* for local mocking.

*Orval* reads an OpenAPI document and generates TypeScript types, TanStack Query hooks, and MSW mock handlers. Everything is regenerated from a single command whenever the API contract changes.

### Add API tools

1. Install Orval:

```sh
npm install --save-dev orval
```

2. Install runtime dependencies:

```sh
npm install axios @tanstack/react-query
npm install --save-dev msw
```

3. Create `orval.config.ts` at the project root:

```ts
import { defineConfig } from 'orval'

export default defineConfig({
  list: {
    input: 'http://localhost:8080/swagger/doc.json',
    output: {
      target: './src/api/client.ts',
      client: 'react-query',
      httpClient: 'axios',
      mock: true,
      mode: 'split',
    },
  },
})
```

4. Add the `api` script in `package.json` for reloading the types:

```json
"scripts": {
  "api": "npx orval"
}
```

**Note**: Running `npx orval` will generate `client.ts` (the API client with TanStack Query hooks backed by Axios), and `client.schemas.ts` (the type interfaces for API).

### Reload API types & hooks

#### Requirements

- [Add API tools](#add-api-tools)

#### Reload scripts

Whenever the API changes, re-generate the types and hooks by running:

```sh
npm run api
```

### Mock API

MSW intercepts HTTP requests at the network level via a browser service worker. The app makes real Axios calls; MSW catches them and returns generated fake responses. It is strictly a local development tool — it is never active in any deployed environment.

Orval generates the MSW handler file (`client.msw.ts`) alongside the API client when `mock: true` and `mode: 'split'` are set in `orval.config.ts` (already the case). The handlers use `@faker-js/faker` to produce realistic fake data automatically from the OpenAPI schema.

#### Requirements

- [Add API tools](#add-api-tools)

#### Setup

1. Install the required tools:

```sh
npm install --save-dev msw @faker-js/faker
```

2. Add the generated and local-only files to `.gitignore`:

```
# Mock
mockServiceWorker.js
src/api/client.msw.ts
```

3. Create `src/mocks/browser.ts`:

```ts
import { setupWorker } from 'msw/browser'
import { getMyAPIMock } from '@/api/client.msw'

export const worker = setupWorker(...getMyAPIMock())
```

**Note**: The import name (`getMyAPIMock`) is derived from the OpenAPI document title by Orval. Check the generated `client.msw.ts` for the exact export name.

4. Update `main.tsx` to start the worker before mounting the app, and wrap the app with `QueryClientProvider`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { routeTree } from './routeTree.gen'
import './style.css'

const queryClient = new QueryClient()

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element #root not found')
}

/**
 * Starts the MSW service worker before mounting the app, so that all API calls made during initialisation are
 * intercepted. Only active when `VITE_MSW=true` (or `1`) is set in the local environment (.env.local).
 */
async function prepare() {
  if (import.meta.env.VITE_MSW !== 'true' && import.meta.env.VITE_MSW !== '1') {
    return
  }
  const { worker } = await import('./mocks/browser')
  return worker.start()
}

prepare().then(() => {
  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App/>
      </QueryClientProvider>
    </StrictMode>,
  )
})
```

5. Add the `local` script in `package.json`, which initialises the MSW service worker, regenerates all API files, then auto-fixes formatting on the generated output:

```json
"scripts": {
  "local": "npx msw init ./public --save && npx orval && npm run fix"
}
```

Then run it:

```sh
npm run local
```

#### Enable MSW locally

Create a `.env.local` file at the project root (already gitignored via `*.local`):

```
VITE_MSW=true
```

Then run the local setup script once to generate all required files:

```sh
npm run local
```

After that, `npm run dev` is enough — MSW starts automatically whenever `VITE_MSW=true` is present.

#### Disable MSW locally

Remove or comment out `VITE_MSW=true` from `.env.local`, then restart the dev server. The service worker import is never evaluated when the variable is absent, so MSW and faker are fully excluded from the runtime — and from any production build.

### Define API URL per environment

For this example, we will consider 3 "modes", but additional environments can be added following the same model:

- **Local *confined***: Use MSW to intercept HTTP calls and output fake data, no need for backend running locally
- **Local *remote***: Have the backend running locally, skip MSW
- **Production**: Use the actual API URL in production

For all of these, you can create an `.env` file with defaults:

```
VITE_MSW=false
VITE_API_URL=localhost:8080
```

#### Local *confined*

Requires [Mock API](#mock-api) step.

Create a `.env.local` file:

```
VITE_MSW=true
```

#### Local *remote*

Requires to have your backend running locally.

Create a `.env.local` file:

```
VITE_MSW=false
```

**Note**: `VITE_API_URL` will be inherited from `.env`, so you should define it only if you want to keep the example from `.env` and use a different URL for your local setup.

#### Production

Create a `.env.production` file:

```
VITE_MSW=false
VITE_API_URL=https://api.myapp.com
```

These values are automatically used when running `vite build`, but you can use it in development by running `vite dev --mode production`.

**Note**: You can use any mode you want if you have other environments for your project. Vite will automatically look for an environment file that match the mode name. For example, running `vite dev --mode staging` will make Vite look for `.env.staging`. It also works for `vite build`.

### Handle auth token

After a successful login the backend returns a JWT token. This token must be stored locally and injected as a `Bearer` header in every subsequent request. An Axios response interceptor handles token expiry: a `401` response clears the token and redirects the user to the login page.

#### Requirements

- [Add API tools](#add-api-tools)
- [Define API URL per environment](#define-api-url-per-environment)

#### Setup

1. Create `src/lib/auth.ts` with token helpers:

```ts
const TOKEN_KEY = 'auth_token'

/** Returns the stored JWT token, or null if the user is not authenticated. */
export const getToken = () => localStorage.getItem(TOKEN_KEY)

/** Persists the JWT token after a successful login. */
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token)

/** Removes the token, effectively logging the user out. */
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

/** Returns true if a token is present in storage. Does not validate the token. */
export const isAuthenticated = () => getToken() !== null
```

**Note**: `localStorage` is used so the session persists across page reloads and browser restarts. Use `sessionStorage` instead if you want the session to end when the tab is closed.

2. Create `src/lib/axios.ts` to configure the base URL and interceptors:

```ts
import axios from 'axios'
import { clearToken, getToken } from './auth'

// Set the base URL for all requests from the environment variable.
axios.defaults.baseURL = import.meta.env.VITE_API_URL

// Attach the Bearer token to every outgoing request when the user is authenticated.
// Using an interceptor means we never have to pass the header manually at the call site.
axios.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On a 401 response, the token is either expired or invalid.
// Clear it and hard-redirect to /auth so the user can re-authenticate.
// A hard redirect (window.location) is intentional: it resets all in-memory React state,
// which prevents stale authenticated data from leaking after logout.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // @todo Replace the `/auth` route condition by whatever your authentication route is. Avoiding to trigger a reload
    // on that route avoid reloading the page when a credential is not valid (which will likely trigger a 401 response)
    if (error.response?.status === 401 && error.config?.url !== '/auth') {
      clearToken()
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  },
)
```

**Note**: This file has no exports — it is imported purely for its side effects (registering defaults and interceptors on the global Axios instance). Orval-generated hooks use `axios.default` directly, so interceptors registered here apply to all generated API calls without any extra configuration.

3. Import `src/lib/axios.ts` in `main.tsx` **before** the app mounts, so the base URL and interceptors are in place before any API call fires:

```tsx
// Setup HTTP interceptors
import './lib/axios'
```

### Handle errors globally

TanStack Query exposes `MutationCache` and `QueryCache` on the `QueryClient`. Both accept an `onError` callback that fires for every error across the app (without any per-hook configuration).

As a standard, we prefer using a toast notification to display errors.

#### Requirements

- [Add API tools](#add-api-tools)
- [Setup toast notifications (Sonner)](#setup-toast-notifications-sonner)

#### Setup

Configure both caches when creating the `QueryClient` in `main.tsx`:

```tsx
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { toast } from 'sonner'
import type { LibErrorResponse } from '@/api/client.schemas'

function onError(error: Error) {
  const axiosError = error as AxiosError<LibErrorResponse>
  toast.error(axiosError.response?.data?.error?.message ?? error.message)
}

const queryClient = new QueryClient({
  mutationCache: new MutationCache({ onError }),
  queryCache: new QueryCache({ onError }),
})
```

`error.response?.data?.error?.message` uses the backend's user-readable message when available, and falls back to the Axios-level message (e.g. `"Network Error"`) when the server did not respond at all.

#### Relation to local `onError` handlers

The global handler and any local `onError` on a hook are **independent**, both always fire. This means:

- Hooks with no `onError` get a free error toast automatically.
- Hooks that need extra behaviour (e.g. setting local state for an inline error message) define their own `onError` for that state update only. The global handler still fires the toast.

```ts
// Local onError: only manages UI state, never calls toast.error()
onError: (error) => {
  if (error.response?.data?.error?.name === 'known_error_name') {
    setInlineError(true)
  }
}
// Global handler fires regardless and shows the toast.
```

## Translations (I18n)

The preferred i18n stack is `react-i18next` for the runtime and `i18next-cli` for extraction, linting, and status checks.

### Setup translations tools

1. Install the runtime dependencies:

```sh
npm install i18next react-i18next i18next-browser-languagedetector
npm install --save-dev i18next-cli
```

2. Create `i18next.config.ts` at the project root (or run `npx i18next-cli init`):

```ts
import { defineConfig } from 'i18next-cli'

export default defineConfig({
  locales: ['en', 'fr'],
  extract: {
    input: 'src/**/*.{js,jsx,ts,tsx}',
    output: 'src\\locales\\{{language}}\\{{namespace}}.json',
  },
})
```

**Note**: The first locale in `locales` is automatically the primary language (the source of truth for extraction). All other locales are secondary.

3. Create the locale directories and seed the initial translation files:

```
src/locales/
  en/
    translation.json -> primary language (all keys, all values filled)
  fr/
    translation.json -> secondary language (all keys, values filled progressively)
```

4. Create `src/lib/i18n.ts`:

```ts
import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en/translation.json'
import fr from '@/locales/fr/translation.json'

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })
```

Translations are bundled as static imports rather than loaded over HTTP. For this app's scale, this is simpler and has no meaningful size cost. `escapeValue: false` is safe because React already escapes output. `fallbackLng` ensures any key missing in the active language silently resolves to English.

`LanguageDetector` resolves the active language automatically by checking, in order: `localStorage`, `navigator.language`, and the HTML `lang` attribute. This scales to any number of languages without any extra configuration — adding a new locale to `resources` is all that is needed.

#### Change language at runtime

Use the `i18n` instance from `useTranslation`:

```tsx
const { i18n } = useTranslation()

i18n.changeLanguage('fr')
```

`LanguageDetector` persists the choice to `localStorage` automatically, so the selected language survives page reloads.

5. Add TypeScript type augmentation in `src/types/i18next.d.ts`:

```ts
import type en from '@/locales/en/translation.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof en
    }
  }
}
```

This makes the `t()` function aware of every key in the primary translation file, enabling autocomplete and catching key typos at compile time.

6. Import `src/lib/i18n.ts` in `main.tsx` as a side-effect import, before the app mounts:

```tsx
// Initialize i18next with translations
import './lib/i18n'
```

7. Add the lint check to the pre-commit hook in `.husky/pre-commit`:

```sh
npx lint-staged
npx i18next-cli lint
```

This makes the commit fail if any hardcoded user-facing string is detected in source files. See [Find hardcoded strings](#find-hardcoded-strings) for details.

8. Create `.husky/pre-push` with the extraction sync check:

```sh
npx i18next-cli extract --ci
```

This makes the push fail if translation files are out of sync with source code (i.e. a `t()` call was added or removed without running `extract`). `pre-push` is preferred over `pre-commit` here because `extract --ci` scans the entire codebase — running it on every commit would incorrectly block commits that have nothing to do with translations.

9. Add translation checks to the CI workflow:

```yml
- name: Check primary translations
  run: npx i18next-cli extract --ci

- name: Check translations
  run: npx i18next-cli status
  continue-on-error: true
```

`extract --ci` fails the build if translation files are out of sync with source code. `status` reports incomplete secondary-language translations without blocking the build: it acts as a visibility tool without being a hard gate.

### Find hardcoded strings

#### Detect

```sh
npx i18next-cli lint
```

The linter scans all source files for hardcoded user-facing strings and exits 1 if any are found. It also runs automatically on every commit via the pre-commit hook.

#### Suppress false positives

When a hardcoded string is intentional (a version number, a debug label, a technical identifier), suppress the warning with a directive comment on the line above:

```tsx
{/* i18next-instrument-ignore-next-line */}
<span className="font-mono">v1.0.0</span>
```

```ts
// i18next-instrument-ignore-next-line
const debugLabel = 'DEV_ONLY'
```

#### Semi-automatic replacement

```sh
npx i18next-cli instrument --interactive
```

The instrumenter walks through each detected hardcoded string and offers to wrap it in `t()` automatically. It is optional, and most useful after a large batch of untranslated UI has been written at once.

### Use translations

#### In a component

```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()

  return <p>{t('my_section.my_key', 'Default English text')}</p>
}
```

**Always provide a default value** as the second argument. It serves as an inline English fallback directly in the source, making the intent clear without opening the translation file, and keeps the UI functional if a key is somehow absent.

#### Pluralization

Pass `count` in the options object. i18next selects the correct plural form automatically based on the active locale's CLDR rules:

```tsx
<p>{t('list.item_count', '{{count}} items', { count: n })}</p>
```

The translation files must contain the locale-specific plural variants. For English:

```json
{
  "list": {
    "item_count_one": "{{count}} item",
    "item_count_other": "{{count}} items"
  }
}
```

For French (which has three cardinal plural categories):

```json
{
  "list": {
    "item_count_one": "{{count}} élément",
    "item_count_many": "{{count}} éléments",
    "item_count_other": "{{count}} éléments"
  }
}
```

**Note**: The plural key variants (`_one`, `_other`, `_many`, etc.) are generated automatically by `extract` based on each locale's rules. See [Generate translations](#generate-translations).

### Generate translations

After adding new `t()` calls to the source code, run:

```sh
npx i18next-cli extract
```

The extractor scans all source files, adds any new key it finds (with an empty string value), and removes keys no longer present. Run it whenever a translation key is added, renamed, or removed.

After running `extract`, fill in the empty values before committing. The pre-push hook enforces that extraction has been run — it does not enforce that values are filled in, so this is a manual responsibility.

**Note**: For keys that use `count`, `extract` generates all plural form variants for each locale automatically.

### Check for missing translations

#### Overview

```sh
npx i18next-cli status
```

Shows a progress bar per secondary locale with the ratio of translated vs total keys. Exits 1 if any key is missing.

#### Detail view

```sh
npx i18next-cli status fr
```

Shows the status of every key for the given locale:

- `✓` — translated
- `~` — present but empty (needs translation)
- `✗` — absent from the file entirely (run `extract`)

#### Show only missing keys

```sh
npx i18next-cli status fr --hide-translated
```

Filters out already-translated keys, showing only what remains to be done.

## Global behaviors

### Catch unhandled promise rejections

Any promise rejection not caught by a `try/catch`, TanStack Query's `QueryCache`/`MutationCache`, or a React error boundary will surface here. It is a last-resort safety net: if it fires, something was missed upstream.

For using a toast to render such error, follow the [*Setup toast notifications (Sonner)*](#setup-toast-notifications-sonner) instructions.

Register the listener in `main.tsx` before the app mounts:

```ts
import { toast } from 'sonner'

// Not calling event.preventDefault() so the browser still logs the rejection in the console.
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason instanceof Error ? event.reason.message : String(event.reason)
  toast.error(message)
})
```

**Note**: Deliberately omitting `event.preventDefault()` preserves the browser's default behaviour of logging the rejection to the console. The toast and the console entry are independent, both always appear.
