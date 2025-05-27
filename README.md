# 🧹 Limpiador de Tags Matemáticos

Una aplicación web moderna para limpiar automáticamente los tags MathML de fórmulas matemáticas copiadas desde Grok, ChatGPT y otras IAs, dejando solo el texto matemático limpio para usar en Word y otros documentos.

## 🚀 Características

- **Limpieza automática de MathML**: Extrae el texto matemático limpio de tags XML/MathML complejos
- **Preserva formato original**: Mantiene saltos de línea, párrafos y estructura del texto
- **Interfaz moderna**: Diseño intuitivo y responsivo
- **Múltiples métodos de entrada**: Pegado manual, desde portapapeles, o arrastrar y soltar
- **Copia fácil**: Un click para copiar el resultado al portapapeles
- **Descarga**: Guarda el texto limpio como archivo .txt
- **Atajos de teclado**: Navega rápidamente con shortcuts
- **Detección automática**: Reconoce automáticamente contenido MathML

## 📖 ¿Cómo funciona?

### Problema que resuelve:

Cuando copias fórmulas matemáticas de IAs como Grok o ChatGPT y las pegas en Word, aparece código MathML como este:

```xml
<math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mo stretchy="false">(</mo><mn>2</mn><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><mn>3</mn><mi>x</mi><mo>+</mo><mn>1</mn><mo stretchy="false">)</mo><mo>+</mo><mo stretchy="false">(</mo><msup><mi>x</mi><mn>2</mn></msup><mo>−</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>4</mn><mo stretchy="false">)</mo><mo>=</mo><mn>2</mn><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><mn>3</mn><mi>x</mi><mo>−</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>1</mn><mo>+</mo><mn>4</mn><mo>=</mo><mn>3</mn><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><mi>x</mi><mo>+</mo><mn>5</mn></mrow><annotation encoding="application/x-tex">(2x^2 + 3x + 1) + (x^2 - 2x + 4) = 2x^2 + x^2 + 3x - 2x + 1 + 4 = 3x^2 + x + 5</annotation></semantics></math>
```

### Solución:

Esta aplicación convierte automáticamente ese código en texto limpio:

```
(2x^2 + 3x + 1) + (x^2 - 2x + 4) = 2x^2 + x^2 + 3x - 2x + 1 + 4 = 3x^2 + x + 5
```

## 🎯 Uso

### Método 1: Básico

1. Copia una fórmula matemática de Grok, ChatGPT u otra IA
2. Pégala en el área de texto superior
3. Haz clic en "Limpiar Tags"
4. Copia el resultado limpio y pégalo en Word

### Método 2: Con botones

1. Haz clic en "Pegar del portapapeles" para pegar automáticamente
2. Haz clic en "Limpiar Tags"
3. Haz clic en "Copiar resultado" para copiar automáticamente

### Método 3: Atajos de teclado

- **Ctrl + Enter**: Procesar texto
- **Ctrl + D**: Descargar resultado
- **Esc**: Limpiar todo

## 🔧 Instalación

### Opción 1: Uso directo

1. Descarga todos los archivos en una carpeta
2. Abre `index.html` en tu navegador web
3. ¡Listo para usar!

### Opción 2: Servidor local (opcional)

```bash
# Si tienes Python instalado
python -m http.server 8000

# Si tienes Node.js instalado
npx http-server
```

Luego abre `http://localhost:8000` en tu navegador.

## 📁 Estructura del proyecto

```
Web tag remover for word/
├── index.html          # Página principal
├── styles.css          # Estilos y diseño
├── script.js           # Lógica de la aplicación
└── README.md           # Este archivo
```

## 🛠️ Tecnologías utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Diseño moderno con variables CSS y flexbox
- **JavaScript (ES6+)**: Lógica de procesamiento y interactividad
- **Font Awesome**: Iconos
- **Diseño responsivo**: Funciona en desktop, tablet y móvil

## 🔍 Casos de uso principales

### ✅ Tipos de contenido que procesa:

- Fórmulas algebraicas con exponentes
- Ecuaciones matemáticas simples
- Operaciones aritméticas
- Expresiones con paréntesis
- Fracciones simples
- Texto mixto con fórmulas intercaladas

### 📝 Ejemplos de conversión:

| Antes (MathML)                                         | Después (Texto limpio)                              |
| ------------------------------------------------------ | --------------------------------------------------- |
| `<math>...<annotation>x^2 + 1</annotation>...</math>`  | `x^2 + 1`                                           |
| Tags complejos con `<msup><mi>x</mi><mn>2</mn></msup>` | `x^2`                                               |
| Múltiples ecuaciones en párrafos separados             | Mantiene la estructura original con saltos de línea |
| Texto explicativo + fórmulas                           | Preserva explicaciones y formato                    |

## 🚨 Limitaciones conocidas

- **Fracciones complejas**: Se convierten a formato `(numerador)/(denominador)`
- **Raíces**: Se representan con símbolo √
- **Integrales/derivadas**: Soporte limitado para notación avanzada
- **Matrices**: No soportadas actualmente

## 🐛 Resolución de problemas

### "No se pudo extraer texto matemático"

- Verifica que el contenido tenga tags MathML válidos
- Asegúrate de copiar el texto completo incluyendo los tags `<math>`

### "Error al copiar al portapapeles"

- Algunos navegadores requieren HTTPS para el portapapeles
- Usa la opción de seleccionar y copiar manualmente

### El texto no se ve bien en Word

- Asegúrate de pegar como "texto sin formato" primero
- Luego aplica formato matemático de Word si es necesario

## 🤝 Contribuciones

¿Encontraste un bug o tienes una idea para mejorar la aplicación?

1. Reporta el problema con ejemplos específicos del texto que no funciona
2. Incluye el código MathML original y el resultado esperado
3. Especifica qué navegador y versión estás usando

## 📄 Licencia

Este proyecto es de código abierto y libre para uso personal y comercial.

## 🎉 ¡Disfruta escribiendo matemáticas sin tags molestos!

Ahora puedes copiar fórmulas matemáticas de cualquier IA y pegarlas limpiamente en Word, Google Docs, o cualquier otro editor de texto.
