async function loadWatermarkCostanciaIdoneida() {
    try {
        const response = await fetch('../../componentes/marcadeaguaJURIDICA.png');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} - No se pudo cargar la imagen`);
        }
        
        const blob = await response.blob();
        
        if (!blob.type.startsWith('image/')) {
            throw new Error('El archivo no es una imagen válida');
        }
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("⚠️ Error cargando la marca de agua:", error);
        console.error("Ruta intentada: ../../componentes/marcadeaguaJURIDICA.png");
        return null;
    }
}

async function generatePDFConstanciaIdoneida() {
    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [215.9, 355.9]
    });

    const topLetter = 1.2;
    const margins = {
        top: 45 + (topLetter * 10),
        bottom: 65,
        left: 30,
        right: 25
    };

    const pageWidth = 215.9;
    const pageHeight = 355.9;
    const textWidth = pageWidth - margins.left - margins.right;

    // Función mejorada para detectar frases en negrita
    function findBoldSegments(text, boldPhrases) {
        const segments = [];
        const normalizedText = text.toLowerCase().replace(/\s+/g, ' ');
        
        let lastEnd = 0;
        boldPhrases.forEach(phrase => {
            const normalizedPhrase = phrase.toLowerCase().replace(/\s+/g, ' ');
            let startIndex = normalizedText.indexOf(normalizedPhrase, lastEnd);
            
            if (startIndex !== -1) {
                // Texto normal antes de la frase en negrita
                if (startIndex > lastEnd) {
                    segments.push({
                        text: text.substring(lastEnd, startIndex),
                        bold: false
                    });
                }
                
                // Texto en negrita
                const endIndex = startIndex + normalizedPhrase.length;
                segments.push({
                    text: text.substring(startIndex, endIndex),
                    bold: true
                });
                
                lastEnd = endIndex;
            }
        });
        
        // Agregar el resto del texto
        if (lastEnd < text.length) {
            segments.push({
                text: text.substring(lastEnd),
                bold: false
            });
        }
        
        return segments.length > 0 ? segments : [{ text: text, bold: false }];
    }

    // Función mejorada para renderizar línea con espaciado uniforme
    function renderLineWithBold(pdf, line, x, y, maxWidth, justify = false, boldPhrases = []) {
        const segments = findBoldSegments(line, boldPhrases);
        
        if (!justify) {
            let currentX = x;
            segments.forEach(segment => {
                pdf.setFont('helvetica', segment.bold ? 'bold' : 'normal');
                pdf.text(segment.text, currentX, y);
                currentX += pdf.getTextWidth(segment.text);
            });
            return;
        }
        
        // Para justificación: calcular anchos
        const words = line.split(/\s+/).filter(w => w.length > 0);
        if (words.length <= 1) {
            segments.forEach(segment => {
                pdf.setFont('helvetica', segment.bold ? 'bold' : 'normal');
                pdf.text(segment.text, x, y);
            });
            return;
        }
        
        // Calcular ancho total de palabras
        let totalWordsWidth = 0;
        const wordData = [];
        
        let charIndex = 0;
        words.forEach(word => {
            const wordSegments = [];
            let wordWidth = 0;
            
            // Encontrar qué segmentos contienen esta palabra
            segments.forEach(segment => {
                const segmentStart = line.indexOf(segment.text, charIndex);
                const segmentEnd = segmentStart + segment.text.length;
                const wordStart = line.indexOf(word, charIndex);
                const wordEnd = wordStart + word.length;
                
                // Si hay intersección entre palabra y segmento
                if (wordStart < segmentEnd && wordEnd > segmentStart) {
                    const overlapStart = Math.max(wordStart, segmentStart);
                    const overlapEnd = Math.min(wordEnd, segmentEnd);
                    const overlapText = line.substring(overlapStart, overlapEnd);
                    
                    pdf.setFont('helvetica', segment.bold ? 'bold' : 'normal');
                    const width = pdf.getTextWidth(overlapText);
                    
                    wordSegments.push({
                        text: overlapText,
                        bold: segment.bold,
                        width: width
                    });
                    wordWidth += width;
                }
            });
            
            wordData.push({ segments: wordSegments, width: wordWidth });
            totalWordsWidth += wordWidth;
            charIndex = line.indexOf(word, charIndex) + word.length;
        });
        
        // Calcular espaciado uniforme
        const spacesCount = words.length - 1;
        const totalSpaceWidth = maxWidth - totalWordsWidth;
        const spaceWidth = totalSpaceWidth / spacesCount;
        
        // Renderizar con espaciado uniforme
        let currentX = x;
        wordData.forEach((word, index) => {
            word.segments.forEach(segment => {
                pdf.setFont('helvetica', segment.bold ? 'bold' : 'normal');
                pdf.text(segment.text, currentX, y);
                currentX += segment.width;
            });
            
            if (index < wordData.length - 1) {
                currentX += spaceWidth;
            }
        });
    }

    // Función para renderizar párrafo completo
    function renderParagraph(pdf, text, x, startY, maxWidth, lineHeight, justify = false, boldPhrases = []) {
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(text, maxWidth);
        let currentY = startY;

        lines.forEach((line, index) => {
            const isLastLine = index === lines.length - 1;
            const shouldJustify = justify && !isLastLine;
            
            renderLineWithBold(pdf, line, x, currentY, maxWidth, shouldJustify, boldPhrases);
            currentY += lineHeight;
        });

        return currentY;
    }

    // Cargar marca de agua
    const watermarkBase64 = await loadWatermarkCostanciaIdoneida();
    if (watermarkBase64) {
        pdf.addImage(watermarkBase64, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'NONE');
    }

    // Obtener datos del formulario
    const nombreContratista = document.getElementById('nombreContratista').value || '[NOMBRE CONTRATISTA]';
    const cedulaContratista = document.getElementById('cedulaContratista').value || '[CEDULA CONTRATISTA]';
    const fechaCreacion = document.getElementById('fechaCreacion').value || '[DIA DE CREACION DEL CONTRATO]';
    const numeroContrato = document.getElementById('numeroContrato').value || '[NUMERO CONTRATO]';

    // Frases en negrita
    const boldPhrases = [
        'PRESTACION DE SERVICIOS DE APOYO A LA GESTION COMO CELADOR EN LAS DIFERENTES DEPENDENCIAS DE LA ALCALDIA MUNICIPAL DE EL BANCO, MAGDALENA'
    ];

    let yPosition = margins.top;
    const lineHeight = 5;

    // Título principal (negrita)
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    const tituloTextoPrimario = 'CONSTANCIA DE IDONEIDAD Y EXPERIENCIA';
    const tituloWidth = pdf.getTextWidth(tituloTextoPrimario);
    const tituloX = margins.left + (textWidth - tituloWidth) / 2;
    pdf.text(tituloTextoPrimario, tituloX, yPosition);
    yPosition += 10;

    // Primer párrafo
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const textoParrafo1 = `Teniendo en cuenta lo dispuesto en el Articulo 2.2.1.2.1.4.9 del Decreto 1082 de 2015, el perfil señalado en el estudio de conveniencia y oportunidad respecto a la persona natural o jurídica que se requiere para desarrollar el objeto contractual consistente en: "PRESTACION DE SERVICIOS DE APOYO A LA GESTION COMO CELADOR EN LAS DIFERENTES DEPENDENCIAS DE LA ALCALDIA MUNICIPAL DE EL BANCO, MAGDALENA".`;
    
    yPosition = renderParagraph(pdf, textoParrafo1, margins.left, yPosition, textWidth, lineHeight, true, boldPhrases);
    yPosition += 7;

    // Segundo párrafo
    const textoParrafo2 = `Ante lo cual me permito certificar que Previo el Estudio y Evaluación realizado a la hoja de vida ${nombreContratista}, identificado con cedula de ciudadanía No ${cedulaContratista} expedida en El Banco, Magdalena, esta persona posee la idoneidad y experiencia suficientes para suplir la necesidad del servicio`;
    
    yPosition = renderParagraph(pdf, textoParrafo2, margins.left, yPosition, textWidth, lineHeight, true, []);
    yPosition += 10;

    // Tercer párrafo
    const textoParrafo3 = `Dada en El Banco, Magdalena al ${fechaCreacion}.`;
    
    yPosition = renderParagraph(pdf, textoParrafo3, margins.left, yPosition, textWidth, lineHeight, true, []);
    yPosition += 15;

    // Firma
    pdf.setFont('helvetica', 'bold');
    
    const firmaText = 'Firmado en original';
    const firmaWidth = pdf.getTextWidth(firmaText);
    pdf.text(firmaText, margins.left + (textWidth - firmaWidth) / 2, yPosition);
    yPosition += 6;

    const nombreFirma = 'ISOLINA ALICIA VIDES MARTINEZ';
    const nombreWidth = pdf.getTextWidth(nombreFirma);
    pdf.text(nombreFirma, margins.left + (textWidth - nombreWidth) / 2, yPosition);
    yPosition += 6;

    const cargoFirma = 'SECRETARIA ADMINISTRATIVA Y FINANCIERA';
    const cargoWidth = pdf.getTextWidth(cargoFirma);
    pdf.text(cargoFirma, margins.left + (textWidth - cargoWidth) / 2, yPosition);

    // Guardar PDF
    pdf.save(`Certificado_de_Idoneidad_${numeroContrato}_${fechaCreacion}.pdf`);
}