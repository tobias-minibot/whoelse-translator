# WHO ELSE? — Universal Translator

A real-time translator showing how the phrase "Who else?" is expressed across 40+ major world languages, with rich linguistic and cultural context.

## About

This application is a living companion to the white paper **"Who Else?" as Universal Grammar**, demonstrating the central thesis: that this two-word question exists identically — in structure, function, and pragmatic meaning — across all human languages. Every language combines an interrogative pronoun ("who") with an additive particle ("else/more/still/other"), yet the specific word chosen for "else" is where languages diverge most fascinatingly.

## Features

- **Hero Translation Display** — Large, cinematic rendering of "Who else?" in native script with romanization and literal gloss
- **40+ Languages** across 16 language families — Indo-European, Afro-Asiatic, Sino-Tibetan, Japonic, Koreanic, Dravidian, Turkic, Niger-Congo, Austronesian, Austroasiatic, Uralic, Kartvelian, Quechuan, Uto-Aztecan, Language Isolates, and Sign Languages
- **Language Family Browser** — Sidebar grouping languages by family with collapsible sections
- **Audio Pronunciation** — Web Speech API integration with graceful fallback
- **Tour the World Mode** — Auto-cycles through all languages every 3 seconds
- **Share Card Generator** — Canvas API-powered social sharing images
- **RTL Support** — Proper right-to-left rendering for Arabic, Hebrew, and Farsi
- **Full Accessibility** — Keyboard navigable, ARIA labels, screen reader support

## Run Locally

No build step required. Simply serve the files with any static server:

```bash
# Python
python3 -m http.server 8000

# Node.js (npx)
npx serve .

# Or just open index.html directly in your browser
open index.html
```

## Data Sources & Linguistic Accuracy

Translation data is hardcoded in `languages.js`. Each entry includes:
- Native script rendering (Arabic, Devanagari, Hangul, Han characters, Cyrillic, Georgian, Tibetan, Khmer, Tamil, Telugu, Bengali, Hebrew, Ge'ez, etc.)
- Romanization/transliteration where applicable
- Word-by-word literal gloss
- Linguistic note on how each language encodes the "else" concept
- Speaker count estimates (approximate, based on Ethnologue and other sources)

Translations aim for natural, colloquial usage rather than formal/literary register. Corrections and additions are welcome.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `R` | Random language |
| `T` | Toggle Tour mode |
| `Esc` | Close modals / Stop tour |

## Credits

Based on the white paper **"Who Else?" as Universal Grammar**.

## License

WHO ELSE? is a trademark. All rights reserved. The application code is provided for educational and demonstration purposes.
