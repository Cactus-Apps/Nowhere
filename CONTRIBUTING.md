# Contributing to Nowhere

Thanks for your interest in contributing to Nowhere! Nowhere is a privacy-first, open-source location simulation app built with React Native and Expo. Every contribution — whether it's a bug report, a fix, a feature, or improved documentation — is welcome.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)
- [License](#license)

---

## Code of Conduct

Be respectful. Constructive criticism is welcome; personal attacks are not. We want this to be a project where everyone feels comfortable contributing.

---

## Ways to Contribute

You don't have to write code to contribute. Here are some ways to help:

- **Report a bug** — open a GitHub Issue with steps to reproduce
- **Fix a bug** — pick an open issue and submit a pull request
- **Improve documentation** — fix typos, clarify explanations, translate strings
- **Add or improve translations** — see the `locales/` folder
- **Suggest a feature** — open an Issue with the `feature request` label
- **Improve map data** — Nowhere uses OpenStreetMap; editing OSM directly benefits all OSM-based apps including Nowhere (openstreetmap.org)
- **Test on your device** — report edge cases, unexpected behavior, or performance issues. Location simulation in particular can behave differently across devices and Android versions
- **Or, if you're good at UI/UX, feel free to improve the app—I'm just a mobile developer, not a UX/UI designer. I'd really appreciate that.**

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm
- Android Studio (for Android builds)
- A physical Android device, or an emulator with the mock location app set

### Setup

```bash
# Clone the repository
git clone https://github.com/Cactus-Apps/Nowhere.git
cd Nowhere

# Install dependencies
npm install
# patches the joystick package via the postinstall script

# Start the development server
npx expo start
# or
npm start
```

### Development build required

Nowhere ships a custom native Android module for mock location. Expo Go will **not** work — you need a development build:

```bash
npx expo run:android
# or
npm run android
```

To regenerate the native projects after changing plugins or native code:

```bash
npm run prebuild
```

### Environment variables

Routing, geocoding, traffic rules and map tiles are all fetched from public, keyless services (OSRM, Nominatim, Overpass, OpenFreeMap). The Supabase-backed announcement popups are optional: copy `.env.example` to `.env` and fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Without these values the app simply skips announcement checks.

### Enabling the mock location app

For location simulation to actually reach other apps, set Nowhere as the mock location app in the device's developer options (see the README for step-by-step instructions). Without it, the app UI works but the simulated position is not reported to other apps.

---

## Project Structure

```
Nowhere/
├── app/                  # Expo Router screens
│   ├── index.tsx         # Home: map, pin control, start simulation
│   ├── walk.tsx          # Walking simulation (joystick or route)
│   ├── car.tsx           # Driving simulation (joystick or route)
│   ├── free-roam.tsx     # Free joystick movement
│   ├── map.tsx           # Full map & coordinate detail screen
│   ├── onboarding.tsx    # First-run setup walkthrough
│   └── settings/         # Settings, about, update log
│       └── legal/        # Privacy, Terms, Accessibility, Licenses
├── assets/               # Icons, images, map styles
│   ├── images/           # Icons and previews
│   └── maps/             # Bundled map styles
├── components/           # Reusable UI components
│   ├── modals/           # Bottom sheets and modals
│   ├── simulate/         # Joystick and route simulation engines
│   └── ui/               # Small UI building blocks
├── lib/                  # Business logic and utilities
│   ├── geo/              # Geocoding, OSM, OSRM, location helpers
│   ├── storage/          # Global store (useSyncExternalStore)
│   ├── mockLocation.ts   # Mock location API wrapper
│   ├── mockLocationController.ts  # Native mock module bridge
│   ├── backgroundLocation.ts      # Background simulation task
│   ├── simRuntime.ts     # Persisted simulation state
│   ├── i18n.ts           # i18next setup
│   └── units.ts          # Speed/unit formatting
├── locales/              # Translation files (en, de, es)
├── plugins/              # Expo config plugins + native mock module
│   ├── expo-mock-location/        # Custom Android mock location module
│   └── withBackgroundPermissions/ # Background permission plugin
├── scripts/              # Package patches and generated data
└── theme.ts              # Theme tokens (colors, spacing, typography)
```

---

## Development Workflow

1. **Fork** the repository and create a branch from `main`:

   ```bash
   git checkout -b fix/your-description
   # or
   git checkout -b feat/your-description
   ```

2. **Make your changes.** Keep commits small and focused on one thing.

3. **Test your changes** on a real device if possible — especially anything
   touching location, the mock module, background simulation, or the joystick.

4. **Check TypeScript** — the project uses strict TypeScript:

   ```bash
   npx tsc --noEmit
   ```

5. **Commit** with a clear message:
   ```
   fix: keep mock location active when starting a route
   feat: add cycling speed preset
   docs: clarify mock location app setup
   ```
   We loosely follow [Conventional Commits](https://www.conventionalcommits.org).

---

## Submitting a Pull Request

- Open your PR against the `main` branch.
- Describe **what** you changed and **why**.
- Reference any related issues with `Fixes #123` or `Relates to #456`.
- Keep PRs focused — one fix or feature per PR makes review much easier.
- Screenshots or screen recordings are very helpful for UI changes.

A maintainer will review your PR as soon as possible. We may ask for changes
or clarification before merging.

---

## Reporting Bugs

Please open a [GitHub Issue](https://github.com/Cactus-Apps/Nowhere/issues/new)
and include:

- A clear title and description
- Steps to reproduce the bug
- Expected vs. actual behavior
- Your device model and Android version
- App version (visible in the app's settings screen)
- Relevant logs or screenshots if available

Location simulation issues are especially helpful to report with your Android
version and whether Nowhere is set as the mock location app.

For security vulnerabilities, please **do not** open a public issue. Email us
directly at cactus_apps@proton.me.

---

## Requesting Features

Open a [GitHub Issue](https://github.com/Cactus-Apps/Nowhere/issues/new) with
the label `feature request`. Describe:

- What problem the feature would solve
- How you imagine it working
- Any alternatives you have considered

We can't promise every request will be implemented, but all suggestions are
read and considered.

---

## License

By contributing to Nowhere you agree that your contributions will be licensed
under the same license as the project: **GNU General Public License v3.0 (GPLv3)**.

This means your code can be freely used, modified, and distributed, but any
derivative work must also be released under GPLv3.

See [LICENSE](./LICENSE) for the full license text.

---

Questions? Reach out at cactus_apps@proton.me or open an Issue.
