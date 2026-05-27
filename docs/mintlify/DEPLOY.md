# RStack Docs — Mintlify Setup Guide

## Preview locally

Mintlify requires **Node.js 18–24** (Node 25+ breaks `remark-parse`). Use nvm to pin the version:

```bash
# Install nvm if you don't have it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.zshrc   # or ~/.bashrc

# Install and switch to Node 20 LTS
nvm install 20
nvm use 20        # .nvmrc in this folder will pick this up automatically

# Clean install and start
rm -rf node_modules package-lock.json
npm install
npm run dev
# → Opens at http://localhost:3000
```

> If you already have nvm, just `cd docs/mintlify && nvm use && npm install && npm run dev`.

## Deploy to Mintlify Cloud (free)

1. Go to [dashboard.mintlify.com](https://dashboard.mintlify.com) and sign in
2. Click **New Project** → **Connect GitHub repo**
3. Select `richard-devbot/SDLC-rstack`
4. Set the **docs directory** to `docs/mintlify`
5. Click **Deploy**

Mintlify will publish the site and give you a `*.mintlify.app` URL.
Every push to `main` redeploys automatically.

## Custom domain (optional)

In the Mintlify dashboard → **Settings** → **Custom Domain**, add:

```
docs.rstack.dev   (or your preferred subdomain)
```

Then add a CNAME at your DNS provider:

```
docs.rstack.dev  →  hosting.mintlify.com
```

## Check for broken links

```bash
npm run check
```

## Structure

```
docs/mintlify/
  mint.json                   ← Site config (colors, nav, logo, CTAs)
  introduction.mdx            ← Landing page
  quickstart.mdx
  getting-started/
    installation.mdx
    your-first-run.mdx
    governance-model.mdx
  concepts/
    overview.mdx
    orchestrator-builder-validator.mdx
    state-management.mdx
    plugins-and-skills.mdx
  sdlc-pipeline/
    overview.mdx              ← All 14 agents mapped
    environment.mdx
    transcript.mdx
    requirements.mdx
    architecture.mdx
    code.mdx
    testing.mdx
    deployment.mdx
    security.mdx
    compliance.mdx
    cost-estimation.mdx
  adapters/
    pi.mdx
    claude-code.mdx
    codex.mdx
    gemini.mdx
    universal.mdx
  reference/
    cli.mdx
    pi-tools.mdx
    configuration.mdx
    protected-actions.mdx
```

---
RStack developed by Richardson Gunde

