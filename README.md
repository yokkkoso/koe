# Koe

***English** · [Русский](README_ru.md)*

Discord bot for private ("join-to-create") voice channels, written in TypeScript on NestJS + Necord.

---

## Features

- **Join-to-create** channels: joining a designated voice channel instantly spawns a private room and moves the user into it.
- Per-guild **interactive control panel** on buttons — which buttons to expose, their order, and the number of buttons per row are all configurable via the `!privates` text command.
- Owner actions: access give / take, hide / show, lock / unlock, mute / unmute, rename, kick, transfer ownership, user limit.
- **Ownership protection** — permission overrides made on a private channel by someone other than its owner are reverted via audit-log checks.
- Empty private channels are auto-deleted; state is recovered on restart.
- Per-guild admin allowlist (user IDs and role IDs) + a global bot-owner list that bypasses ownership restrictions.

## Requirements

|                |                            |
|----------------|----------------------------|
| **Node.js**    | 22+                        |
| **Yarn**       | 4.x (enabled via Corepack) |
| **PostgreSQL** | 13+                        |

## Configuration

Environment variables (`.env`):

| Variable        | Purpose                      |
|-----------------|------------------------------|
| `DISCORD_TOKEN` | Bot token                    |
| `DATABASE_URL`  | PostgreSQL connection string |

Runtime configuration is split across three files in `src/config/`:

| File                 | Purpose                                                                            |
|----------------------|------------------------------------------------------------------------------------|
| `main.config.ts`     | Global bot-owner user IDs (bypass ownership checks everywhere) + embed color       |
| `privates.config.ts` | Per-guild settings: admin user IDs, admin role IDs, and join-to-create channel IDs |
| `emoji.config.ts`    | Emoji used in embeds (separators, pagination)                                      |

Example files for each of these live in `src/config/examples/` — copy them into `src/config/` and fill with your values.

## Running on Linux/Windows

### 1. Clone

```bash
git clone https://github.com/yokkkoso/koe koe
cd koe
```

### 2. Environment

```bash
cp .env.example .env
```

Fill `DISCORD_TOKEN` and `DATABASE_URL`.

### 3. Configuration

```bash
cp src/config/examples/main.config.ts     src/config/main.config.ts
cp src/config/examples/privates.config.ts src/config/privates.config.ts
cp src/config/examples/emoji.config.ts    src/config/emoji.config.ts
```

Fill with your values.

### 4. Dependencies and database

```bash
corepack enable
yarn install
yarn prisma migrate deploy
```

### 5. Build and run

```bash
yarn build
yarn start:prod
```

For development use `yarn start:dev` (hot reload).

## Usage

On a configured guild, run `!privates` with an account that has administrator rights — the bot replies with the panel configuration message. Add/remove buttons, reorder them, pick how many appear per row, then send the finalized panel to the channel where your users live. End users press the buttons on that panel to manage their own private voice room.

## License

[GNU AGPL-3.0](LICENSE). If you run a modified version as a service (including as a Discord bot), the source code of your modifications must be made available to the users of that service.

---

*The only thing AI-generated here is this README — I was too lazy to write it myself, though I ended up rewriting it anyway.*
