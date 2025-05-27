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

    // Si encontramos annotations, las usamos
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
    
    // Limpiar espacios múltiples y saltos de línea
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
    
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
        
        // Fracciones y potencias se manejan por estructura
        // Paréntesis
        '&lpar;': '(',
        '&rpar;': ')',
        '&lbrack;': '[',
        '&rbrack;': ']',
        
        // Espacios
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
        processed = processed.replace(regex, '$1');
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

// Función para limpiar caracteres especiales de MathML
function cleanMathMLCharacters(text) {
    // Reemplazar múltiples espacios por uno solo
    text = text.replace(/\s+/g, ' ');
    
    // Remover espacios alrededor de operadores
    text = text.replace(/\s*([+\-*/=<>≤≥≠])\s*/g, ' $1 ');
    
    // Remover espacios extra alrededor de paréntesis
    text = text.replace(/\s*([()])\s*/g, '$1');
    
    // Limpiar espacios al inicio y final
    text = text.trim();
    
    return text;
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
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(200, textarea.scrollHeight) + 'px';
}

mathInput.addEventListener('input', () => autoResize(mathInput));
mathOutput.addEventListener('input', () => autoResize(mathOutput));

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