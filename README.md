# TinyHouse

A home-sharing marketplace: hosts list homes, guests book them and pay through Stripe Connect.

## Layout

| Path | What |
|---|---|
| `apps/server` | Express + Apollo GraphQL API, MongoDB |
| `apps/client` | React 18 client: Vite, Apollo Client 3, Ant Design |

## Development

Requires Node 22 and pnpm (`corepack enable`).

```bash
pnpm install
cp apps/server/.env.example apps/server/.env   # fill in
cp apps/client/.env.example apps/client/.env   # fill in
pnpm dev:server
pnpm dev:client
```

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Server tests run resolvers against a real MongoDB (`mongodb-memory-server`); Stripe and Google are mocked.
Client tests use Vitest, Testing Library and Apollo's `MockedProvider`.
