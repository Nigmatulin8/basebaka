# Basebaka

Desktop GUI for working with **Firebase** — browse and manage projects, data, and admin tasks from a focused native app instead of juggling browser tabs and CLI tools.

The app combines a **React** UI, a **local Node sidecar** (API and Firebase-facing logic), and a **Tauri** shell that starts the backend and hosts the webview.

## Stack

| Layer               | Tech                                                                                                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop shell       | [Tauri 2](https://v2.tauri.app/) (Rust)                                                                                                                          |
| UI                  | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/)                                                         |
| Styling             | SCSS                                                                                                                                                             |
| Data & routing (UI) | [TanStack Query](https://tanstack.com/query), [TanStack Router](https://tanstack.com/router), [Zustand](https://zustand.docs.pmnd.dev/), [Zod](https://zod.dev/) |
| Local API           | Node.js (`server/`), HTTP on `127.0.0.1` (port from `basebaka.config.json`, default `3001`)                                                                      |
| Sidecar binary      | [`@yao-pkg/pkg`](https://github.com/yao-pkg/pkg) → bundled exe for Tauri `externalBin`                                                                           |
| Shared config       | `shared/` (constants shared by UI and server)                                                                                                                    |
| Tooling             | pnpm workspace, ESLint, Oxlint, Prettier                                                                                                                         |

Rust tooling (`src-tauri/`) is separate: use `cargo fmt`, `clippy`, and `cargo check` there.

## Repository layout

```text
Basebaka/
├── src/              React UI
│   ├── routes/       File routes (__root, login, _authenticated/…)
│   ├── screens/      Non-routed UI (e.g. StartupGate)
│   ├── lib/          Shared UI helpers / Tauri bindings
│   └── main.tsx
├── server/           Node API (sidecar source)
├── shared/           Shared config constants
├── basebaka.config.json  Local API port (default 3001)
├── src-tauri/        Tauri / Rust (window, sidecar lifecycle)
├── scripts/          build-sidecar.mjs, etc.
└── package.json      Root scripts and devDependencies
```

## Architecture (runtime)

```text
┌─────────────────────────────────────┐
│  Tauri (Rust)                       │
│  · startup gate / sidecar lifecycle │
│  · window + webview                 │
└──────────────┬──────────────────────┘
               │ spawns
               ▼
┌─────────────────────────────────────┐
│  basabaka-server (Node sidecar)     │
│  http://127.0.0.1:<serverPort>      │
└──────────────▲──────────────────────┘
               │ fetch / API
┌──────────────┴──────────────────────┐
│  React UI (Vite)                    │
└─────────────────────────────────────┘
```

## Server port

Default listen port is **3001** (`127.0.0.1`). Change it without editing Rust/server code:

1. Edit committed defaults in [`basebaka.config.json`](./basebaka.config.json), or
2. Create a gitignored local override:

```json
{
  "serverPort": 18765
}
```

Save as `basebaka.config.local.json` in the repo root.

3. Or set env `BASEBAKA_SERVER_PORT` (wins over both files).

Priority: `BASEBAKA_SERVER_PORT` → `basebaka.config.local.json` → `basebaka.config.json` → `3001`.

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install) (for Tauri)
- Windows: [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (usually preinstalled)

## Getting started

Install dependencies:

```bash
pnpm install
```

### Web UI only (Vite)

```bash
pnpm dev
```

### Local API only (tsx watch)

```bash
pnpm dev:server
```

### Full desktop app

Tauri needs a **platform-specific** sidecar under `src-tauri/binaries/`
(e.g. `basabaka-server-aarch64-apple-darwin` on Apple Silicon,
`basabaka-server-x86_64-pc-windows-msvc.exe` on Windows). A Windows
binary will not run on macOS.

`pnpm tauri dev` runs `ensure:sidecar` first and builds the missing binary
for the current host. After changing `server/`, rebuild explicitly:

```bash
pnpm build:sidecar
pnpm tauri dev
```

If `build:sidecar` fails with **EPERM**, the old exe is still running — close the app or run:

```bash
pnpm stop:sidecar
pnpm build:sidecar
```

## Scripts

| Command                             | Description                                          |
| ----------------------------------- | ---------------------------------------------------- |
| `pnpm dev`                          | Vite dev server (UI)                                 |
| `pnpm dev:server`                   | Node API with hot reload                             |
| `pnpm tauri dev`                    | Desktop app (Vite + Tauri)                           |
| `pnpm build`                        | Build server + UI                                    |
| `pnpm build:sidecar`                | Compile server and package Tauri sidecar for this OS |
| `pnpm ensure:sidecar`               | Build sidecar only if the host binary is missing     |
| `pnpm stop:sidecar`                 | Stop running sidecar / debug app process             |
| `pnpm typecheck`                    | TypeScript (UI + server + configs)                   |
| `pnpm lint` / `pnpm lint:fix`       | Oxlint + ESLint                                      |
| `pnpm format` / `pnpm format:check` | Prettier                                             |

## License

Basebaka is **open source** under the [MIT License](./LICENSE).

You are free to use, modify, and distribute the project under the terms of that license. Contributions are welcome via pull requests.
