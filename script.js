// ============================================================
// Limpiador de Tags Matemáticos - Strategy Pattern Architecture
// ============================================================

// --- DOM Elements ---
const mathInput = document.getElementById('mathInput');
const mathPreview = document.getElementById('mathPreview');
const processBtn = document.getElementById('processBtn');
const copyBtn = document.getElementById('copyBtn');
const clearInput = document.getElementById('clearInput');
const pasteBtn = document.getElementById('pasteBtn');
const pasteHtmlBtn = document.getElementById('pasteHtmlBtn');
const downloadBtn = document.getElementById('downloadBtn');
const notification = document.getElementById('notification');

// --- State ---
let lastResult = null;

// ============================================================
// Strategy Pattern - Cleaning Strategies
// ============================================================

class CleaningStrategy {
    process(input) { throw new Error('Not implemented'); }
}

/**
 * RichMathMLStrategy: Parses LaTeX $...$ and MathML blocks,
 * renders with KaTeX for preview, builds MathML HTML for Word clipboard.
 */
class RichMathMLStrategy extends CleaningStrategy {
    process(input) {
        const segments = this.parseSegments(input);
        const previewHTML = this.buildPreviewHTML(segments);
        const wordHTML = this.buildWordHTML(segments);
        return { previewHTML, wordHTML, segments };
    }

    // --- Parsing (state-machine for robust $...$ handling) ---
    parseSegments(text) {
        const segments = [];

        // Step 1: Find <math>...</math> blocks and replace with placeholders
        const mathmlBlocks = [];
        let processed = text.replace(/<math[\s\S]*?<\/math>/gi, (m) => {
            const idx = mathmlBlocks.length;
            mathmlBlocks.push(m);
            return `\x00MATHML_${idx}\x00`;
        });

        // Step 2: Find $$...$$ blocks and replace with placeholders
        const displayBlocks = [];
        processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (m, latex) => {
            const idx = displayBlocks.length;
            displayBlocks.push(latex.trim());
            return `\x00DISPLAY_${idx}\x00`;
        });

        // Step 3: Find $...$ inline math using character scan
        // This avoids lookbehind issues and handles single-char math like $E$
        const inlineBlocks = [];
        let result = '';
        let i = 0;
        while (i < processed.length) {
            // Check for placeholder (don't scan inside them)
            if (processed[i] === '\x00') {
                const end = processed.indexOf('\x00', i + 1);
                result += processed.substring(i, end + 1);
                i = end + 1;
                continue;
            }

            if (processed[i] === '$' && (i === 0 || processed[i - 1] !== '\\')) {
                // Find matching closing $
                let j = i + 1;
                let found = false;
                while (j < processed.length) {
                    if (processed[j] === '\x00') {
                        // Skip placeholders
                        j = processed.indexOf('\x00', j + 1) + 1;
                        continue;
                    }
                    if (processed[j] === '$' && processed[j - 1] !== '\\') {
                        // Found closing $
                        const latex = processed.substring(i + 1, j).trim();
                        if (latex.length > 0) {
                            const idx = inlineBlocks.length;
                            inlineBlocks.push(latex);
                            result += `\x00INLINE_${idx}\x00`;
                            found = true;
                            i = j + 1;
                            break;
                        }
                    }
                    j++;
                }
                if (!found) {
                    result += processed[i];
                    i++;
                }
            } else {
                result += processed[i];
                i++;
            }
        }
        processed = result;

        // Step 4: Split by placeholders and build segments
        const parts = processed.split(/(\x00[A-Z]+_\d+\x00)/);
        for (const part of parts) {
            if (!part) continue;

            const mathmlMatch = part.match(/^\x00MATHML_(\d+)\x00$/);
            const displayMatch = part.match(/^\x00DISPLAY_(\d+)\x00$/);
            const inlineMatch = part.match(/^\x00INLINE_(\d+)\x00$/);

            if (mathmlMatch) {
                const raw = mathmlBlocks[parseInt(mathmlMatch[1])];
                const annot = /<annotation[^>]*encoding=["']application\/x-tex["'][^>]*>([\s\S]*?)<\/annotation>/i.exec(raw);
                segments.push({
                    type: 'math',
                    latex: annot ? annot[1].trim() : raw.replace(/<[^>]*>/g, ''),
                    displayMode: true,
                    originalMathML: raw
                });
            } else if (displayMatch) {
                segments.push({
                    type: 'math',
                    latex: displayBlocks[parseInt(displayMatch[1])],
                    displayMode: true
                });
            } else if (inlineMatch) {
                const latex = inlineBlocks[parseInt(inlineMatch[1])];
                segments.push({
                    type: 'math',
                    latex: latex,
                    displayMode: this.shouldBeDisplayMode(latex)
                });
            } else {
                // Plain text
                segments.push({ type: 'text', content: part });
            }
        }

        return segments;
    }

    shouldBeDisplayMode(latex) {
        return /\\begin\{(pmatrix|bmatrix|vmatrix|Vmatrix|matrix|cases|align|equation|gather)/.test(latex);
    }

    // --- Preview HTML (KaTeX HTML rendering) ---
    buildPreviewHTML(segments) {
        let html = '';
        for (const seg of segments) {
            if (seg.type === 'text') {
                html += this.formatText(seg.content);
            } else {
                html += this.renderKaTeX(seg.latex, seg.displayMode, 'html');
            }
        }
        return html;
    }

    // --- Word HTML (KaTeX MathML rendering) ---
    buildWordHTML(segments) {
        let body = '';
        for (const seg of segments) {
            if (seg.type === 'text') {
                body += this.formatText(seg.content);
            } else {
                // Use original MathML if available, else generate via KaTeX
                if (seg.originalMathML) {
                    body += seg.originalMathML;
                } else {
                    body += this.renderKaTeX(seg.latex, seg.displayMode, 'mathml');
                }
            }
        }
        return `<html><head><meta charset="utf-8"></head><body style="font-family:Cambria,serif;font-size:12pt;">${body}</body></html>`;
    }

    // --- KaTeX rendering helper ---
    renderKaTeX(latex, displayMode, output) {
        try {
            return katex.renderToString(latex, {
                displayMode: displayMode,
                throwOnError: false,
                errorColor: '#cc0000',
                strict: false,
                trust: true,
                output: output // 'html' or 'mathml'
            });
        } catch (e) {
            const escaped = escapeHTML(latex);
            return `<span class="math-error" title="${escapeHTML(e.message)}">${escaped}</span>`;
        }
    }

    // --- Text formatting (Markdown-like → HTML) ---
    formatText(text) {
        let html = escapeHTML(text);

        // Bold: **text** → <strong>text</strong>
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // Italic: *text* → <em>text</em>
        html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

        // Bullet points: lines starting with • or - (after newline)
        html = html.replace(/^([•\-●])\s*/gm, '<span class="bullet">$1</span> ');

        // Line breaks
        html = html.replace(/\n/g, '<br>\n');

        return html;
    }
}

/**
 * PlainTextStrategy: Legacy plain text cleaning (kept as fallback).
 */
class PlainTextStrategy extends CleaningStrategy {
    process(input) {
        let text = input;

        // Extract LaTeX from annotation tags
        const annotationRegex = /<annotation\s+encoding=["']application\/x-tex["'][^>]*>(.*?)<\/annotation>/gi;
        const annotations = [];
        let match;
        while ((match = annotationRegex.exec(input)) !== null) {
            annotations.push(match[1].trim());
        }

        if (annotations.length > 0) {
            let idx = 0;
            text = input.replace(/<math[^>]*>.*?<\/math>/gi, () =>
                idx < annotations.length ? annotations[idx++] : ''
            );
        }

        // Strip HTML tags
        text = text.replace(/<[^>]*>/g, '');
        // Remove $...$ delimiters
        text = text.replace(/\$\$([\s\S]+?)\$\$/g, '$1');
        text = text.replace(/\$([^\$]+?)\$/g, '$1');
        // Basic LaTeX cleanup
        text = text.replace(/\\begin\{[^}]*\}/gi, '');
        text = text.replace(/\\end\{[^}]*\}/gi, '');
        text = text.replace(/\\\\/g, '\n');
        text = text.replace(/&/g, ' ');
        text = text.replace(/\\text\{([^}]*)\}/gi, '$1');
        text = text.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/gi, '($1)/($2)');
        text = text.replace(/\\left[(\[|]/g, m => m.slice(-1));
        text = text.replace(/\\right[)\]|]/g, m => m.slice(-1));
        text = text.replace(/\\[a-zA-Z]+/g, ' ');
        text = text.replace(/[{}]/g, '');
        text = text.replace(/\s{2,}/g, ' ');
        text = text.trim();

        return { plainText: text };
    }
}

// --- Active Strategy ---
let activeStrategy = new RichMathMLStrategy();

// ============================================================
// Utility Functions
// ============================================================

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3500);
}

// ============================================================
// Clipboard Functions
// ============================================================

async function copyRichHTMLToClipboard(html, plainText) {
    try {
        const htmlBlob = new Blob([html], { type: 'text/html' });
        const textBlob = new Blob([plainText || ''], { type: 'text/plain' });
        const item = new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob
        });
        await navigator.clipboard.write([item]);
        showNotification('✅ Copiado al portapapeles (listo para Word)', 'success');
    } catch (err) {
        console.error('Clipboard API failed, using fallback:', err);
        fallbackRichCopy(html);
    }
}

function fallbackRichCopy(html) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    tempDiv.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
    document.body.appendChild(tempDiv);

    const range = document.createRange();
    range.selectNodeContents(tempDiv);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    try {
        document.execCommand('copy');
        showNotification('✅ Copiado (fallback)', 'success');
    } catch (e) {
        showNotification('❌ Error al copiar. Selecciona y copia manualmente.', 'error');
    }

    sel.removeAllRanges();
    document.body.removeChild(tempDiv);
}

async function pasteFromClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        mathInput.value = text;
        autoResize(mathInput);
        showNotification('📋 Texto pegado desde el portapapeles', 'info');
    } catch (err) {
        showNotification('❌ No se pudo acceder al portapapeles. Pega manualmente con Ctrl+V.', 'error');
    }
}

async function pasteHTMLFromClipboard() {
    try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
            if (item.types.includes('text/html')) {
                const blob = await item.getType('text/html');
                const html = await blob.text();
                mathInput.value = html;
                autoResize(mathInput);
                showNotification('📋 HTML pegado (con MathML preservado)', 'success');
                return;
            }
        }
        // Fallback to plain text
        await pasteFromClipboard();
    } catch (err) {
        showNotification('❌ No se pudo leer HTML. Usa "Pegar" normal.', 'error');
    }
}

// ============================================================
// Download Function
// ============================================================

function downloadAsHTML(html, filename = 'texto_limpio.html') {
    const fullHTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Texto Matemático Limpio</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<style>
body { font-family: Cambria, 'Times New Roman', serif; font-size: 12pt; line-height: 1.8; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #222; }
.bullet { font-weight: bold; }
strong { font-weight: 700; }
</style>
</head>
<body>
${html}
</body>
</html>`;
    const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('📥 Archivo HTML descargado', 'success');
}

// ============================================================
// Plain text extraction from segments (for clipboard fallback)
// ============================================================

function getPlainText(segments) {
    return segments.map(seg => seg.type === 'text' ? seg.content : seg.latex).join('');
}

// ============================================================
// Event Listeners
// ============================================================

processBtn.addEventListener('click', () => {
    const inputText = mathInput.value.trim();
    if (!inputText) {
        showNotification('⚠️ Por favor, ingresa algún texto para procesar', 'error');
        mathInput.focus();
        return;
    }

    processBtn.classList.add('loading');
    processBtn.textContent = 'Procesando...';

    setTimeout(() => {
        try {
            lastResult = activeStrategy.process(inputText);

            if (lastResult.previewHTML) {
                mathPreview.innerHTML = lastResult.previewHTML;
                mathPreview.classList.add('has-content');
            } else if (lastResult.plainText) {
                mathPreview.textContent = lastResult.plainText;
                mathPreview.classList.add('has-content');
            }

            showNotification('✨ ¡Texto limpiado y renderizado exitosamente!', 'success');
        } catch (error) {
            showNotification(`❌ Error: ${error.message}`, 'error');
            mathPreview.innerHTML = '<p class="placeholder-text">Error al procesar.</p>';
            lastResult = null;
        } finally {
            processBtn.classList.remove('loading');
            processBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Limpiar Tags';
        }
    }, 300);
});

copyBtn.addEventListener('click', () => {
    if (!lastResult) {
        showNotification('⚠️ No hay resultado. Primero procesa algún contenido.', 'error');
        return;
    }

    if (lastResult.wordHTML) {
        const plainText = getPlainText(lastResult.segments);
        copyRichHTMLToClipboard(lastResult.wordHTML, plainText);
    } else if (lastResult.plainText) {
        navigator.clipboard.writeText(lastResult.plainText)
            .then(() => showNotification('✅ Texto copiado', 'success'))
            .catch(() => showNotification('❌ Error al copiar', 'error'));
    }
});

clearInput.addEventListener('click', () => {
    mathInput.value = '';
    mathPreview.innerHTML = '<p class="placeholder-text">Aquí aparecerá tu texto limpio con fórmulas renderizadas...</p>';
    mathPreview.classList.remove('has-content');
    resetTextareaSize(mathInput);
    lastResult = null;
    mathInput.focus();
    showNotification('🗑️ Limpiado', 'info');
});

pasteBtn.addEventListener('click', pasteFromClipboard);
pasteHtmlBtn.addEventListener('click', pasteHTMLFromClipboard);

downloadBtn.addEventListener('click', () => {
    if (!lastResult) {
        showNotification('⚠️ No hay resultado para descargar. Primero procesa.', 'error');
        return;
    }
    const html = lastResult.previewHTML || lastResult.plainText || '';
    const ts = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    downloadAsHTML(html, `texto_matematico_${ts}.html`);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); processBtn.click(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); downloadBtn.click(); }
    if (e.key === 'Escape') { e.preventDefault(); clearInput.click(); }
});

// ============================================================
// UI Utilities
// ============================================================

function autoResize(textarea) {
    textarea.style.height = 'auto';
    const min = 200, max = 600;
    let h = Math.max(min, textarea.scrollHeight);
    if (!textarea.value.trim()) h = min;
    else h = Math.min(max, h);
    textarea.style.height = h + 'px';
}

function resetTextareaSize(textarea) {
    textarea.style.height = '200px';
}

mathInput.addEventListener('input', () => autoResize(mathInput));
mathInput.addEventListener('input', (e) => {
    if (!e.target.value.trim()) resetTextareaSize(mathInput);
    else autoResize(mathInput);
});

// Auto-detect math content on paste
mathInput.addEventListener('paste', () => {
    setTimeout(() => {
        const text = mathInput.value;
        if (text.includes('<math') || text.includes('$') || text.includes('\\begin{')) {
            showNotification('📋 Contenido matemático detectado. ¡Listo para procesar!', 'info');
        }
    }, 100);
});

// Render example on load
window.addEventListener('load', () => {
    showNotification('👋 ¡Bienvenido! Pega contenido con fórmulas y haz clic en "Limpiar Tags"', 'info');
    const exampleDiv = document.getElementById('exampleRendered');
    if (exampleDiv && typeof katex !== 'undefined') {
        try {
            exampleDiv.innerHTML = katex.renderToString(
                'A = \\begin{pmatrix} 2 & 3 \\\\ -1 & 4 \\end{pmatrix}',
                { displayMode: true, throwOnError: false }
            );
        } catch (e) {
            exampleDiv.textContent = 'A = ((2, 3), (-1, 4))';
        }
    }
});