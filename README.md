# my-sphere

Personal site at [minlaxz.icu](https://minlaxz.icu). Vite + TypeScript + Three.js.

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check + build to dist/
```

## How it is served

GitHub Pages, deployed from GitHub Actions. No `gh-pages` branch and no committed build output.

1. Every push to `main` runs `.github/workflows/pages.yml`.
2. The runner installs dependencies, runs `npm run build`, and uploads `dist/` as the `github-pages` artifact.
3. `actions/deploy-pages` publishes that artifact to the Pages CDN.

Repo setting: **Settings → Pages → Source: GitHub Actions**. The repo must be public on the free plan.

## DNS (Cloudflare)

| Type  | Name | Content             | Proxy    |
| ----- | ---- | ------------------- | -------- |
| A     | @    | 185.199.108.153     | DNS only |
| A     | @    | 185.199.109.153     | DNS only |
| A     | @    | 185.199.110.153     | DNS only |
| A     | @    | 185.199.111.153     | DNS only |
| CNAME | www  | minlaxz.github.io   | DNS only |

Keep proxy off (grey cloud) at least until GitHub issues the certificate. Then **Settings → Pages → Enforce HTTPS**.

## Custom domain

`public/CNAME` contains `minlaxz.icu`. Vite copies it to `dist/CNAME` on build, so the domain stays attached to every deployment. The same domain is also set under **Settings → Pages → Custom domain**.

## Domain verification

Verify `minlaxz.icu` at [github.com/settings/pages](https://github.com/settings/pages) → **Add a domain**, and add the TXT record it gives you (`_github-pages-challenge-minlaxz`) in Cloudflare.

Why: without verification, if Pages is ever disabled on this repo while DNS still points at GitHub, any GitHub account can claim `minlaxz.icu` on their own repo and serve content on it. Verification locks the domain to this account.

## Using Pages with a custom domain in another repo

The apex `minlaxz.icu` can belong to only one repo. Other repos use a subdomain.

1. Copy `.github/workflows/pages.yml` into the other repo. It has no repo-specific values.
2. Make the repo public and set **Settings → Pages → Source: GitHub Actions**.
3. In Cloudflare add `CNAME  <sub>  minlaxz.github.io` (DNS only).
4. Add `public/CNAME` containing `<sub>.minlaxz.icu`, and set the same value under **Settings → Pages → Custom domain**.
5. Once the DNS check passes, enable **Enforce HTTPS**.

Without a custom domain the site lives at `https://minlaxz.github.io/<repo>/` and Vite needs `base: '/<repo>/'` in `vite.config.ts`. With a subdomain the default `base: '/'` is correct.
