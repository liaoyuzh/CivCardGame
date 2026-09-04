# CivCardGame project structure

The repository is optimized for quick gameplay iteration in HTML and later deployment to Weixin and Douyin mini games.

```text
CivCardGame/
├── packages/
│   ├── core/                 # Deterministic, serializable game rules
│   │   └── src/
│   │       ├── model/        # GameState, Player, Card
│   │       ├── commands/     # Player intent
│   │       ├── application/  # Command processing
│   │       ├── events/       # Results consumed by clients
│   │       ├── rules/        # Configuration and rule helpers
│   │       └── ports/        # Platform-neutral dependencies such as RNG
│   ├── web/                  # Fast HTML prototype and debug tools
│   ├── minigame/             # Shared Canvas renderer and contracts
│   ├── wechat/               # Weixin SDK adapter and packaging
│   └── douyin/               # Douyin SDK adapter and packaging
├── assets/                    # Source art
├── tools/                     # Build and asset scripts
└── build/                     # Generated output
```

## Dependency rules

```text
web ───────────────> core
weixin ──> minigame ──> core
douyin ──> minigame ──> core
```

- `core` must not import DOM, Canvas, `wx`, `tt`, storage, networking, timers, or rendering code.
- UI translates input into `GameCommand` values and renders `GameState` plus `GameEvent` values.
- State remains JSON-serializable so games can be saved, replayed, simulated, or synchronized.
- Platform SDK references live only in their corresponding adapter package.
- Rendering shared by Weixin and Douyin belongs in `minigame`; SDK differences remain in adapters.

## Iteration workflow

1. Add or change a command and its rule in `core`.
2. Cover the rule with a deterministic unit test.
3. Add an HTML control to `web` and inspect state/events in the debug panel.
4. Once the interaction is proven, map it to Canvas/touch input in `minigame`.
5. Use the Weixin and Douyin adapters only for SDK integration and packaging.

## Commands

```bash
pnpm install
pnpm dev:web
pnpm typecheck
pnpm test
pnpm build:all
```
