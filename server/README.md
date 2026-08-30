# liefje memories server

A tiny login-gated backend so the two of you can add new memory-lane entries
(photo(s) + place + date + caption) from your phones. Submitting the form:

1. uploads the photo(s) to Cloudinary,
2. appends the new entry to `assets/data/memories.json` in this repo via a
   commit through the GitHub API.

GitHub Pages then rebuilds the site automatically, and `js/script.js` on the
public page reads `assets/data/memories.json` and renders the new entry into
the memory-lane timeline — no manual HTML editing needed.

This is deliberately **not linked from the public site**. Only the two of you
know the URL, so nobody else can find the login page by browsing the site.

## Local setup / testing

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env`:
- Set `DRY_RUN=true` for local testing — this skips Cloudinary and GitHub
  entirely and just returns what *would* be saved, so you can try the whole
  flow safely without touching the real repo or using real credentials.
- Generate a password hash for yourself and your girlfriend:
  ```bash
  npm run hash-password -- "the-real-password"
  ```
  Put both as `USERS=jij:<hash1>,zij:<hash2>` in `.env`.

Then run it:

```bash
npm start
```

Open `http://localhost:3000/admin.html`, log in, and submit a test memory.
With `DRY_RUN=true` the success banner says "(TEST-modus: niet echt
opgeslagen op GitHub)" and nothing is actually written anywhere.

## Deploying for real (Render, free tier)

1. Push this repo to GitHub (already done) and create a free account at
   [render.com](https://render.com).
2. **New → Web Service**, connect this repo, and it should auto-detect
   `server/render.yaml` (or manually set root directory to `server`, build
   command `npm install`, start command `npm start`).
3. In the service's **Environment** tab, fill in the secret values that
   `render.yaml` leaves blank:
   - `USERS` — `username:bcryptHash` pairs (see "Local setup" above for how
     to generate a hash — you can also run `npm run hash-password` locally).
   - `GITHUB_TOKEN` — a fine-grained GitHub personal access token
     ([github.com/settings/personal-access-tokens](https://github.com/settings/personal-access-tokens)),
     scoped to just the `liefje` repository, with **Contents: Read and
     write** permission and nothing else.
   - `CLOUDINARY_URL` — from your Cloudinary dashboard (free account at
     [cloudinary.com](https://cloudinary.com)), under Dashboard → "API
     Environment variable". It looks like
     `cloudinary://<api_key>:<api_secret>@<cloud_name>`.
   - Leave `DRY_RUN=false` (already set by `render.yaml`) so it actually
     saves for real.
   - `PUBLIC_SITE_ORIGIN` — the origin (scheme + host, no path) the public
     site is served from, e.g. `https://azzexxy.github.io`. The inline
     "add memory" tools on that site call this API cross-origin, and this
     is the only origin CORS will accept requests from.
4. Deploy. Once it's live, open `https://<your-service>.onrender.com/admin.html`
   — a private fallback login page (same login, but as a full standalone
   page) if the inline tools on the public site aren't reachable for
   whatever reason. The normal way in is the ⚙️ on the site itself.

Render's free tier spins the service down after inactivity, so the first
request after a while takes a few extra seconds to wake up — that's normal.

## Error handling

Every failure path returns a clear Dutch-language message instead of a raw
error or a silent hang:
- wrong/missing login → 401
- missing title/place/date, bad date format, no photo/video, an unsupported
  file type → 400 with a specific message
- a file over 100MB or more than 6 files in one go → 413 (that limit is
  large on purpose — a raw phone video before trimming can be big even for
  a couple of seconds; only the first 3 seconds actually get kept)
- Cloudinary or GitHub outage/misconfiguration → 502, with the underlying
  error logged server-side for debugging
- a corrupt/unreadable video that ffmpeg can't process → 502, distinct from
  the Cloudinary one so the two failure modes aren't confused with each other
- a GitHub commit conflict (someone else saved a memory at the exact same
  moment) is retried automatically with a fresh copy of the file before
  giving up

## Security notes

- Only 2 users exist, defined by you via the `USERS` env var — there's no
  public sign-up.
- Two auth mechanisms, both signed with `SESSION_SECRET`, nothing stored
  server-side: a session cookie for `admin.html` (same-origin), and a bearer
  token (sent as `Authorization: Bearer ...`, stored in the browser's
  localStorage) for the inline tools on the public site. The token exists
  because Safari (and Firefox) block cross-site cookies by default even
  with `SameSite=None; Secure` set correctly — a bearer token isn't a
  cookie, so none of that applies to it.
- The GitHub token should be scoped to *only* this repository with *only*
  Contents read/write — never use a token with broader access.
- `.env` is gitignored — never commit real secrets. Only `.env.example` (with
  placeholder values) is tracked.
