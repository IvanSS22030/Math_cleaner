# Bugs

## BUG-001: Output shows raw LaTeX commands instead of rendered math
- **Status**: Fixing (in progress)
- **Reported**: 2026-02-18
- **Description**: When processing text with LaTeX math (`$\begin{pmatrix}...$`), the cleaned output still shows raw LaTeX commands like `\begin{pmatrix}`, `\end{pmatrix}`, `$`, `\\` as visible text instead of rendered equations.
- **Root Cause**: The original cleaning pipeline only stripped HTML tags and attempted regex-based LaTeX-to-text conversion, which missed many LaTeX constructs (matrices, delimiters, environments).
- **Fix**: Replaced with Rich MathML Strategy that uses KaTeX to render LaTeX into proper math display and copies as rich HTML with MathML for Word compatibility.
- **Verification**: Pending user test — paste content from Grok, process, copy to Word.
