# ML Recall

A mobile-first, offline-capable web app for active recall and spaced repetition in machine learning interviews. The cards are original and written in English. The deck uses atomic prompts, equation clozes, practical trade-offs and interviewer follow-ups.

- **Today:** resume an unfinished lesson or start a mixed review (due cards first, up to eight new cards a day).
- **Learn:** follow an English refresher for each concept, work through an example, and answer quick checks. Then rehearse a handful of matching interview cards with no changes to their spaced-repetition schedule. Lessons are not locked.
- **Curriculum:** [Evgeny Sokolov’s HSE ML course](https://github.com/esokolov/ml-course-hse) is the classical-ML syllabus reference. Use [ISLP/Python](https://www.statlearning.com/resources-python) for the main readings and labs, [public Stanford CS229 notes](https://see.stanford.edu/Course/CS229) for more mathematical detail, and [Dive into Deep Learning](https://d2l.ai/) for neural networks and transformers. App explanations and exercises are original.
- **Topics:** inspect your coverage, browse/search questions, or rehearse without changing your schedule.
- **Progress:** see which lessons and cards you've studied, and export or restore progress and personal cards. Older backups remain compatible.
- **Again / Hard / Good / Easy:** a small interval-based scheduler, not the Anki FSRS algorithm.
- **Storage:** no accounts, analytics, network calls for ratings, or automatic sync. Back up before changing devices or clearing site data.

The practice takes inspiration from [Boris Tseytlin’s technical interview guide](https://btseytlin.github.io/parts/3_interviewing/technical_interview.html) and [his recommendation to use spaced repetition](https://t.me/s/boris_again?before=307). The site is not affiliated with Boris or Anki.

## Run locally

Serve this directory over HTTP (opening the file directly will not load ES modules):

```sh
python3 -m http.server 8000
```

Visit `http://localhost:8000`. No build or installation is required. The service worker works on HTTPS and localhost. When editing deployed assets, bump the service worker cache name in `sw.js` and the versioned asset URLs in `index.html`, `app.js`, and the service worker precache list together.

## Install on iPhone

Open the deployed URL in Safari → Share → Add to Home Screen. Leave Open as Web App on if shown. Launch from the home-screen icon once while online so the app can cache the deck. Home-screen storage may be separate from the Safari tab; start from the installed app or export and restore progress.
