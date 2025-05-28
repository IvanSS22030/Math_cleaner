// Elementos del DOM
const mathInput = document.getElementById('mathInput');
const mathOutput = document.getElementById('mathOutput');
const processBtn = document.getElementById('processBtn');
const copyBtn = document.getElementById('copyBtn');
const clearInput = document.getElementById('clearInput');
const pasteBtn = document.getElementById('pasteBtn');
const downloadBtn = document.getElementById('downloadBtn');
const notification = document.getElementById('notification');

// Función principal para limpiar tags matemáticos
function cleanMathTags(text) {
    if (!text.trim()) {
        throw new Error('No hay texto para procesar');
    }

    let cleanedText = text;

    // Primero intentar extraer de tags <annotation encoding="application/x-tex">
    const annotationRegex = /<annotation\s+encoding=["']application\/x-tex["'][^>]*>(.*?)<\/annotation>/gi;
    const annotations = [];
    let match;

    while ((match = annotationRegex.exec(text)) !== null) {
        annotations.push(match[1].trim());
    }

    // Si encontramos annotations, las usamos (método preferido)
    if (annotations.length > 0) {
        // Reemplazar cada tag <math>...</math> con su correspondiente annotation
        const mathTagRegex = /<math[^>]*>.*?<\/math>/gi;
        let annotationIndex = 0;
        
        cleanedText = text.replace(mathTagRegex, () => {
            if (annotationIndex < annotations.length) {
                return annotations[annotationIndex++];
            }
            return '';
        });
    } else {
        // Si no hay annotations, procesar manualmente el MathML
        cleanedText = processMathMLTags(text);
    }

    // Limpiar cualquier tag HTML/XML restante
    cleanedText = cleanedText.replace(/<[^>]*>/g, '');
    
    // Decodificar entidades HTML
    cleanedText = decodeHTMLEntities(cleanedText);
    
    // Limpiar comandos LaTeX y formatos especiales
    cleanedText = cleanLaTeXCommands(cleanedText);
    
    // Limpiar casos específicos problemáticos adicionales
    cleanedText = cleanSpecificProblematicCases(cleanedText);
    
    // Preservar formato: mantener saltos de línea y estructura
    cleanedText = preserveTextFormat(cleanedText);
    
    // Limpiar caracteres especiales de MathML que puedan quedar
    cleanedText = cleanMathMLCharacters(cleanedText);

    if (!cleanedText.trim()) {
        throw new Error('No se pudo extraer texto matemático del contenido proporcionado');
    }

    return cleanedText;
}

// Función para procesar tags MathML manualmente
function processMathMLTags(text) {
    let processed = text;

    // Mapeo de operadores y símbolos MathML
    const mathMLMap = {
        // Operadores básicos
        '&plus;': '+',
        '&minus;': '-',
        '&times;': '×',
        '&divide;': '÷',
        '&equals;': '=',
        '&lt;': '<',
        '&gt;': '>',
        '&le;': '≤',
        '&ge;': '≥',
        '&ne;': '≠',
        
        // Paréntesis
        '&lpar;': '(',
        '&rpar;': ')',
        '&lbrack;': '[',
        '&rbrack;': ']',
        
        // Espacios (preservar algunos espacios)
        '&nbsp;': ' ',
        '&thinsp;': ' ',
    };

    // Reemplazar entidades conocidas
    for (const [entity, replacement] of Object.entries(mathMLMap)) {
        processed = processed.replace(new RegExp(entity, 'g'), replacement);
    }

    // Extraer contenido de elementos específicos de MathML
    const mathMLTags = [
        'mn', 'mi', 'mo', 'mtext', 'ms', 'mspace'
    ];

    for (const tag of mathMLTags) {
        const regex = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'gi');
        processed = processed.replace(regex, (match, content) => {
            // Limpiar contenido específico de cada tag
            content = content.trim();
            
            // Si es un operador matemático, añadir espacios apropiados
            if (tag === 'mo' && content.match(/^[+\-*/=<>≤≥≠]$/)) {
                return ` ${content} `;
            }
            
            return content;
        });
    }

    // Manejar potencias (msup)
    processed = processed.replace(/<msup[^>]*>(.*?)<\/msup>/gi, (match, content) => {
        const parts = content.split(/<\/?m[^>]*>/g).filter(p => p.trim());
        if (parts.length >= 2) {
            return `${parts[0]}^${parts[1]}`;
        }
        return content;
    });

    // Manejar subíndices (msub)
    processed = processed.replace(/<msub[^>]*>(.*?)<\/msub>/gi, (match, content) => {
        const parts = content.split(/<\/?m[^>]*>/g).filter(p => p.trim());
        if (parts.length >= 2) {
            return `${parts[0]}_${parts[1]}`;
        }
        return content;
    });

    // Manejar fracciones (mfrac)
    processed = processed.replace(/<mfrac[^>]*>(.*?)<\/mfrac>/gi, (match, content) => {
        const parts = content.split(/<\/?m[^>]*>/g).filter(p => p.trim());
        if (parts.length >= 2) {
            return `(${parts[0]})/(${parts[1]})`;
        }
        return content;
    });

    // Manejar raíces cuadradas (msqrt)
    processed = processed.replace(/<msqrt[^>]*>(.*?)<\/msqrt>/gi, (match, content) => {
        const cleanContent = content.replace(/<[^>]*>/g, '');
        return `√(${cleanContent})`;
    });

    return processed;
}

// Función para decodificar entidades HTML
function decodeHTMLEntities(text) {
    const entityMap = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&apos;': "'",
        '&nbsp;': ' ',
        '&#x2B;': '+',
        '&#x2D;': '-',
        '&#x3D;': '=',
        '&#x28;': '(',
        '&#x29;': ')',
        '&#x5E;': '^',
        '&#x2F;': '/',
        '&#x2A;': '*'
    };

    let decoded = text;
    for (const [entity, replacement] of Object.entries(entityMap)) {
        decoded = decoded.replace(new RegExp(entity, 'g'), replacement);
    }

    // Decodificar entidades numéricas
    decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
        return String.fromCharCode(dec);
    });

    decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
    });

    return decoded;
}

// Función para limpiar comandos LaTeX y formatos especiales
function cleanLaTeXCommands(text) {
    // Limpiar comandos \text{...}
    text = text.replace(/\\text\{([^}]*)\}/gi, '$1');
    
    // Limpiar fracciones LaTeX \frac{numerador}{denominador}
    text = text.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/gi, '($1)/($2)');
    
    // Limpiar arrays/tablas complejas con contenido matemático
    // Patrón más agresivo para arrays con contenido mixto
    text = text.replace(/\\begin\{array\}[^}]*\}[\s\S]*?\\end\{array\}/gi, (match) => {
        // Extraer solo el contenido matemático útil del array
        let content = match.replace(/\\begin\{array\}[^}]*\}/gi, '');
        content = content.replace(/\\end\{array\}/gi, '');
        content = content.replace(/\\hline/gi, '');
        content = content.replace(/\\\\/gi, '\n');
        content = content.replace(/&/gi, ' ');
        return content;
    });
    
    // Limpiar comandos de array/tabla restantes
    text = text.replace(/\\begin\{array\}[^}]*\}/gi, '');
    text = text.replace(/\\end\{array\}/gi, '');
    
    // Limpiar patrones problemáticos específicos como "2x2 + 3x + 1 + x2−2x + 43x2"
    // Buscar y separar secuencias de números y variables pegadas
    text = text.replace(/(\d+)([a-zA-Z])(\d+)/g, '$1$2^$3');
    text = text.replace(/([a-zA-Z])(\d+)([+\-])(\d+)/g, '$1^$2 $3 $4');
    
    // Limpiar comandos de líneas
    text = text.replace(/\\hline/gi, '');
    text = text.replace(/\\\\/gi, '\n');
    
    // Limpiar espaciado LaTeX
    text = text.replace(/\\quad/gi, ' ');
    text = text.replace(/\\qquad/gi, ' ');
    text = text.replace(/\\,/gi, ' ');
    text = text.replace(/\\:/gi, ' ');
    text = text.replace(/\\;/gi, ' ');
    text = text.replace(/\\!/gi, '');
    
    // Limpiar otros comandos LaTeX comunes
    text = text.replace(/\\cdot/gi, '·');
    text = text.replace(/\\times/gi, '×');
    text = text.replace(/\\div/gi, '÷');
    text = text.replace(/\\pm/gi, '±');
    text = text.replace(/\\mp/gi, '∓');
    text = text.replace(/\\implies/gi, '⟹');
    text = text.replace(/\\rightarrow/gi, '→');
    text = text.replace(/\\leftarrow/gi, '←');
    text = text.replace(/\\leftrightarrow/gi, '↔');
    text = text.replace(/\\Rightarrow/gi, '⇒');
    text = text.replace(/\\Leftarrow/gi, '⇐');
    text = text.replace(/\\Leftrightarrow/gi, '⇔');
    
    // Símbolos matemáticos adicionales
    text = text.replace(/\\neq/gi, '≠');
    text = text.replace(/\\leq/gi, '≤');
    text = text.replace(/\\geq/gi, '≥');
    text = text.replace(/\\approx/gi, '≈');
    text = text.replace(/\\equiv/gi, '≡');
    text = text.replace(/\\propto/gi, '∝');
    text = text.replace(/\\infty/gi, '∞');
    
    // Limpiar comandos de formato
    text = text.replace(/\\textbf\{([^}]*)\}/gi, '$1');
    text = text.replace(/\\textit\{([^}]*)\}/gi, '$1');
    text = text.replace(/\\emph\{([^}]*)\}/gi, '$1');
    text = text.replace(/\\underline\{([^}]*)\}/gi, '$1');
    
    // Limpiar caracteres especiales LaTeX
    text = text.replace(/\\&/gi, '&');
    text = text.replace(/\\%/gi, '%');
    text = text.replace(/\\#/gi, '#');
    text = text.replace(/\\\$/gi, '$');
    text = text.replace(/\\{/gi, '{');
    text = text.replace(/\\}/gi, '}');
    
    // Limpiar patrones de array residuales específicos
    text = text.replace(/\{[r|c|l]+\}/gi, '');
    text = text.replace(/&+/gi, ' ');
    
    return text;
}

// Función para limpiar casos específicos problemáticos
function cleanSpecificProblematicCases(text) {
    // Casos como "2x2 + 3x + 1 + x2−2x + 43x2 + x + 5"
    // Separar dígitos pegados incorrectamente con variables
    text = text.replace(/(\d)([a-zA-Z])(\d)(\s*[+\-]\s*)(\d)([a-zA-Z])/g, '$1$2^$3 $4 $5$6');
    
    // Casos como "43x2" donde debería ser "4 + 3x^2" o "43x^2"
    text = text.replace(/(\d{2})([a-zA-Z])(\d)/g, (match, digits, variable, exp) => {
        // Si son exactamente 2 dígitos, separar como suma
        if (digits.length === 2 && parseInt(digits[0]) < 5 && parseInt(digits[1]) < 5) {
            return `${digits[0]} + ${digits[1]}${variable}^${exp}`;
        }
        return `${digits}${variable}^${exp}`;
    });
    
    // Limpiar secuencias como "x2−2x + 4" donde el primer término está pegado
    text = text.replace(/([a-zA-Z])(\d)([\+\-])/g, '$1^$2 $3');
    
    // Limpiar casos donde hay múltiples expresiones pegadas sin separación
    text = text.replace(/([a-zA-Z]\^\d+|[a-zA-Z]|\d+)([a-zA-Z])(\d+)([+\-])/g, '$1 + $2^$3 $4');
    
    // Casos específicos de arrays mal procesados
    text = text.replace(/\\begin\{array\}\{[rcl|]*\}/, '');
    text = text.replace(/\\end\{array\}/, '');
    
    // Limpiar residuos de tablas como separadores
    text = text.replace(/\s*\|\s*/g, ' ');
    text = text.replace(/_{2,}/g, '');
    
    return text;
}

// Función para preservar el formato del texto
function preserveTextFormat(text) {
    // Normalizar diferentes tipos de saltos de línea
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Limpiar caracteres de control extraños que pueden aparecer
    text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Preservar párrafos y estructura
    // Reemplazar múltiples saltos de línea por doble salto (párrafos)
    text = text.replace(/\n\s*\n\s*\n+/g, '\n\n');
    
    // Limpiar espacios al inicio y final de cada línea, pero mantener la estructura
    text = text.split('\n').map(line => {
        // Limpiar caracteres extraños al inicio/final de línea
        line = line.replace(/^[\s\u00A0\u2000-\u200B\u2028\u2029\u3000]+|[\s\u00A0\u2000-\u200B\u2028\u2029\u3000]+$/g, '');
        
        // Reemplazar múltiples espacios internos por uno solo, pero mantener estructura
        return line.replace(/[ \t\u00A0\u2000-\u200B]+/g, ' ').trim();
    }).join('\n');
    
    // Remover líneas completamente vacías excesivas (más de 2 seguidas)
    text = text.replace(/\n{3,}/g, '\n\n');
    
    // Limpiar espacios al inicio y final del texto completo
    text = text.trim();
    
    return text;
}

// Función para limpiar caracteres especiales de MathML
function cleanMathMLCharacters(text) {
    // Procesar línea por línea para mantener formato
    const lines = text.split('\n');
    
    const cleanedLines = lines.map(line => {
        // Limpiar secuencias problemáticas específicas como "2x2 + 3x + 1 + x2−2x + 43x2"
        // Separar números y variables pegadas incorrectamente
        line = line.replace(/(\d+)([a-zA-Z])([a-zA-Z])([+\-])/g, '$1$2^$3 $4');
        line = line.replace(/([a-zA-Z])(\d+)([a-zA-Z])(\d+)/g, '$1^$2 + $3^$4');
        
        // Corregir patrones como "43x2" -> "4 + 3x^2"
        line = line.replace(/(\d{2,})([a-zA-Z])(\d+)/g, (match, nums, variable, exp) => {
            if (nums.length === 2) {
                return `${nums[0]} + ${nums[1]}${variable}^${exp}`;
            }
            return `${nums}${variable}^${exp}`;
        });
        
        // Remover espacios extra alrededor de operadores matemáticos
        line = line.replace(/\s*([+\-*/=<>≤≥≠])\s*/g, ' $1 ');
        
        // Remover espacios extra alrededor de paréntesis
        line = line.replace(/\s*([()])\s*/g, '$1');
        
        // Limpiar puntos/dots extraños
        line = line.replace(/\s*·\s*/g, ' · ');
        line = line.replace(/\s*\^\s*/g, '^');
        
        // Limpiar caracteres especiales problemáticos
        line = line.replace(/\{\}/g, '');
        line = line.replace(/\{\s*\}/g, '');
        line = line.replace(/\|+/g, '');
        
        // Limpiar múltiples operadores seguidos
        line = line.replace(/([+\-])\s*([+\-])/g, '$1$2');
        line = line.replace(/\s*([+\-])\s*([+\-])\s*/g, ' $1$2 ');
        
        // Limpiar espacios múltiples internos
        line = line.replace(/\s{2,}/g, ' ');
        
        // Limpiar espacios al inicio y final de la línea
        return line.trim();
    });
    
    return cleanedLines.join('\n');
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Función para copiar al portapapeles
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showNotification('✅ Texto copiado al portapapeles', 'success');
    } catch (err) {
        // Fallback para navegadores que no soportan navigator.clipboard
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            showNotification('✅ Texto copiado al portapapeles', 'success');
        } catch (fallbackErr) {
            showNotification('❌ Error al copiar. Selecciona y copia manualmente.', 'error');
        }
        
        document.body.removeChild(textArea);
    }
}

// Función para pegar desde el portapapeles
async function pasteFromClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        mathInput.value = text;
        showNotification('📋 Texto pegado desde el portapapeles', 'info');
    } catch (err) {
        showNotification('❌ No se pudo acceder al portapapeles. Pega manualmente con Ctrl+V.', 'error');
    }
}

// Función para descargar como archivo de texto
function downloadAsText(text, filename = 'texto_limpio.txt') {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('📥 Archivo descargado', 'success');
}

// Event Listeners
processBtn.addEventListener('click', () => {
    const inputText = mathInput.value.trim();
    
    if (!inputText) {
        showNotification('⚠️ Por favor, ingresa algún texto para procesar', 'error');
        mathInput.focus();
        return;
    }

    try {
        processBtn.classList.add('loading');
        processBtn.textContent = 'Procesando...';
        
        // Simular un pequeño delay para mostrar el estado de carga
        setTimeout(() => {
            try {
                const cleanedText = cleanMathTags(inputText);
                mathOutput.value = cleanedText;
                showNotification('✨ ¡Texto limpiado exitosamente!', 'success');
            } catch (error) {
                showNotification(`❌ Error: ${error.message}`, 'error');
                mathOutput.value = '';
            } finally {
                processBtn.classList.remove('loading');
                processBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Limpiar Tags';
            }
        }, 500);
        
    } catch (error) {
        showNotification(`❌ Error inesperado: ${error.message}`, 'error');
        processBtn.classList.remove('loading');
        processBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Limpiar Tags';
    }
});

copyBtn.addEventListener('click', () => {
    const outputText = mathOutput.value.trim();
    
    if (!outputText) {
        showNotification('⚠️ No hay texto para copiar. Primero procesa algún contenido.', 'error');
        return;
    }
    
    copyToClipboard(outputText);
});

clearInput.addEventListener('click', () => {
    mathInput.value = '';
    mathOutput.value = '';
    
    // Resetear tamaño de ambos textareas
    resetTextareaSize(mathInput);
    resetTextareaSize(mathOutput);
    
    mathInput.focus();
    showNotification('🗑️ Texto limpiado', 'info');
});

pasteBtn.addEventListener('click', () => {
    pasteFromClipboard();
});

downloadBtn.addEventListener('click', () => {
    const outputText = mathOutput.value.trim();
    
    if (!outputText) {
        showNotification('⚠️ No hay texto para descargar. Primero procesa algún contenido.', 'error');
        return;
    }
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    downloadAsText(outputText, `texto_matematico_limpio_${timestamp}.txt`);
});

// Atajos de teclado
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter para procesar
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        processBtn.click();
    }
    
    // Ctrl/Cmd + D para descargar
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        downloadBtn.click();
    }
    
    // Esc para limpiar
    if (e.key === 'Escape') {
        e.preventDefault();
        clearInput.click();
    }
});

// Auto-resize de textareas
function autoResize(textarea) {
    // Resetear height para calcular el tamaño correcto
    textarea.style.height = 'auto';
    
    // Calcular altura necesaria considerando contenido
    const minHeight = 200;
    const maxHeight = 600; // Límite máximo para evitar textareas gigantes
    let newHeight = Math.max(minHeight, textarea.scrollHeight);
    
    // Si el textarea está vacío o casi vacío, volver al tamaño mínimo
    if (textarea.value.trim().length === 0) {
        newHeight = minHeight;
    } else {
        newHeight = Math.min(maxHeight, newHeight);
    }
    
    textarea.style.height = newHeight + 'px';
}

// Función para resetear tamaño de textarea
function resetTextareaSize(textarea) {
    textarea.style.height = '200px';
}

mathInput.addEventListener('input', () => autoResize(mathInput));
mathOutput.addEventListener('input', () => autoResize(mathOutput));

// Detectar cuando se borra todo el contenido y resetear tamaño
mathInput.addEventListener('input', (e) => {
    if (e.target.value.trim().length === 0) {
        resetTextareaSize(mathInput);
    } else {
        autoResize(mathInput);
    }
});

mathOutput.addEventListener('input', (e) => {
    if (e.target.value.trim().length === 0) {
        resetTextareaSize(mathOutput);
    } else {
        autoResize(mathOutput);
    }
});

// Procesar automáticamente cuando se pega contenido
mathInput.addEventListener('paste', (e) => {
    setTimeout(() => {
        const pastedText = mathInput.value;
        if (pastedText.includes('<math') || pastedText.includes('xmlns')) {
            showNotification('📋 Contenido MathML detectado. ¡Listo para procesar!', 'info');
        }
    }, 100);
});

// Mensaje de bienvenida
window.addEventListener('load', () => {
    showNotification('👋 ¡Bienvenido! Pega tu contenido con tags MathML y haz clic en "Limpiar Tags"', 'info');
}); 