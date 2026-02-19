# Activity Log

## 2026-02-18T16:20:00-04:00 — Major Architecture Redesign: Rich MathML Strategy

### Why
The app was stripping LaTeX/MathML to plain text, leaving raw commands like `\begin{pmatrix}`, `$`, `\\` visible in the output. The desired output is rendered math equations ready to paste into Word.

### What Changed
- **Strategy Pattern**: Introduced `CleaningStrategy` base class with two implementations:
  - `RichMathMLStrategy` (default): Parses `$...$`, `$$...$$`, and `<math>` blocks; renders with KaTeX for preview; builds MathML HTML for rich clipboard copy to Word.
  - `PlainTextStrategy` (legacy fallback): Original plain-text cleaning logic preserved.
- **index.html**: Added KaTeX CDN, replaced output `<textarea>` with rich `<div>` preview, added "Pegar HTML" button.
- **script.js**: Complete rewrite with Strategy pattern architecture.
- **styles.css**: Added `.output-preview` styles for rendered math display, kept all original styles.

### Revert Path
1. Restore `index.html`, `script.js`, `styles.css` from git history (`git checkout HEAD~1 -- index.html script.js styles.css`).
