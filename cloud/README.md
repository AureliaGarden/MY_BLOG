# Camellia Blog Cloud adapter

This directory stages the existing local blog for Cloudflare Workers. The local
Node editor remains separate. D1 stores blog content, R2 stores referenced
images, GitHub OAuth authenticates the owner, and giscus provides comments.

## Local preparation

1. Install Node 24 and run `npm install` in this directory.
2. Run `npm run stage` to stage a public application shell in the ignored
   `public/` directory. This does not copy personal data or images.
3. Run `npm test`. Tests use an in-memory database and fake credentials.
4. Run `npm run migration:plan` for a count of locally referenced items.

`prepare-migration.mjs --prepare` creates a private local snapshot under the
ignored `migration-local-v2/` directory. The snapshot contains real personal
data. `verify-migration.mjs` checks that snapshot against local source files.
Never commit, share, or deploy that directory as static assets.

## Cloud resources and security

`wrangler.jsonc` names the existing D1 database and R2 bucket. It contains no
credentials. The Worker is routed to the configured custom domain. Configure the GitHub OAuth app and
store `GITHUB_CLIENT_SECRET` and a random, at least 32-byte `SESSION_SECRET`
as Cloudflare Worker secrets. `GITHUB_CLIENT_ID` is a public identifier. Never
put secret values in source, Git, chat, screenshots, or command-line arguments. The callback is
`https://camelliagarden.top/auth/callback`.

The existing database must be empty before the one-time schema and content
import. Import referenced image files to the private R2 bucket before making
the domain route public. Never overwrite an existing object or database. Run
the live login, unauthorized-write, editor, image, and comment tests after
binding the domain. Keep backups of original local data and files.

The free R2 allowance applies to Standard storage. Overage is billed according
to the Cloudflare account's R2 subscription. Monitor actual usage.
