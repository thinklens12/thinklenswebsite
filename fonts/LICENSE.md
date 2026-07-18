# Self-hosted fonts

All three font files are subset (latin) variable woff2 builds, redistributed
under the **SIL Open Font License 1.1**, which permits self-hosting and bundling.

| File | Family | Role | Weights | Source |
|------|--------|------|---------|--------|
| `plusjakarta.woff2` | Plus Jakarta Sans | Display | 700–800 (variable) | https://github.com/tokotype/PlusJakartaSans — OFL 1.1 |
| `inter.woff2` | Inter | Body | 400–700 (variable) | https://github.com/rsms/inter — OFL 1.1 |
| `jetbrainsmono.woff2` | JetBrains Mono | Utility / data | 400–700 (variable) | https://github.com/JetBrains/JetBrainsMono — OFL 1.1 |

Display and body are the brand spec (`Thinklens-Brand-Guidelines.docx`). The mono
is the utility face for counts, metrics, and tracked uppercase labels — anything
that reads as data rather than prose. Bound to `--display`, `--body`, and
`--mono`; reference those tokens rather than naming a family in a rule.

Files were obtained from Google Fonts' `latin` subset endpoint and are declared
in the inlined `@font-face` rules (see `src/styles.css`) with `font-display: swap`.

SIL Open Font License: https://scripts.sil.org/OFL
