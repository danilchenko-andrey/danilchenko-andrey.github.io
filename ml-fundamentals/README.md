# ML Recall

A mobile-first, offline-capable web app for active recall and spaced repetition in machine learning interviews. The cards are original and written in English. The deck uses atomic prompts, equation clozes, practical trade-offs and interviewer follow-ups.

- **Today:** due cards first, then up to eight new cards per day in mixed review. Topic reviews let you deliberately study more new cards.
- **Topics:** inspect your coverage, browse/search questions, or rehearse without changing your schedule.
- **Progress:** see which cards you've studied, and export or restore progress and personal cards.
- **Again / Hard / Good / Easy:** a small interval-based scheduler, not the Anki FSRS algorithm.
- **Storage:** no accounts, analytics, network calls for ratings, or automatic sync. Back up before changing devices or clearing site data.

The practice takes inspiration from [Boris Tseytlin’s technical interview guide](https://btseytlin.github.io/parts/3_interviewing/technical_interview.html) and [his recommendation to use spaced repetition](https://t.me/s/boris_again?before=307). The site is not affiliated with Boris or Anki.

## Run locally

Serve this directory over HTTP (opening the file directly will not load ES modules):

```sh
python3 -m http.server 8000
```

Visit `http://localhost:8000`. No build or installation is required. The service worker works on HTTPS and localhost. When editing deployed assets, bump the service worker cache name in `sw.js`.

## Install on iPhone

Open the deployed URL in Safari → Share → Add to Home Screen. Leave Open as Web App on if shown. Launch from the home-screen icon once while online so the app can cache the deck. Home-screen storage may be separate from the Safari tab; start from the installed app or export and restore progress.
