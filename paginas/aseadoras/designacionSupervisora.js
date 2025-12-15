async function loadWatermarkDesgnacionSSupervisor() {
    try {
        const response = await fetch('/AuCo.github.io/componentes/marcadeaguaJURIDICA.png');
        
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

async function generatePDFDesignacionSupervisorAseadora() {
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
    const lineHeight = 6;

    // Función para encontrar segmentos en negrita
    function findBoldSegments(line, boldPhrases) {
        const segments = [];
        let currentIndex = 0;
        const lineUpper = line.toUpperCase();
        
        boldPhrases.sort((a, b) => {
            const aIndex = lineUpper.indexOf(a.toUpperCase());
            const bIndex = lineUpper.indexOf(b.toUpperCase());
            return aIndex - bIndex;
        });
        
        boldPhrases.forEach(phrase => {
            const phraseIndex = lineUpper.indexOf(phrase.toUpperCase(), currentIndex);
            
            if (phraseIndex !== -1) {
                if (phraseIndex > currentIndex) {
                    segments.push({
                        text: line.substring(currentIndex, phraseIndex),
                        bold: false
                    });
                }
                
                segments.push({
                    text: line.substring(phraseIndex, phraseIndex + phrase.length),
                    bold: true
                });
                
                currentIndex = phraseIndex + phrase.length;
            }
        });
        
        if (currentIndex < line.length) {
            segments.push({
                text: line.substring(currentIndex),
                bold: false
            });
        }
        
        return segments.length > 0 ? segments : [{ text: line, bold: false }];
    }

    // Función para dividir palabras largas con guiones (solo cuando es absolutamente necesario)
    function hyphenateWord(pdf, word, maxWidth, isBold = false) {
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        const hyphen = '-';
        
        if (pdf.getTextWidth(word) <= maxWidth) {
            return [word];
        }
        
        const parts = [];
        let currentPart = '';
        
        for (let i = 0; i < word.length; i++) {
            const testPart = currentPart + word[i];
            const testWidth = pdf.getTextWidth(testPart + hyphen);
            
            if (testWidth > maxWidth && currentPart.length > 2) {
                parts.push(currentPart + hyphen);
                currentPart = word[i];
            } else {
                currentPart = testPart;
            }
        }
        
        if (currentPart.length > 0) {
            parts.push(currentPart);
        }
        
        return parts;
    }

    // Función para encontrar segmentos en negrita
    function findBoldSegments(text, boldPhrases = []) {
        if (!boldPhrases || boldPhrases.length === 0) {
            return [{ text: text, bold: false }];
        }
        
        const segments = [];
        let remaining = text;
        let position = 0;
        
        while (remaining.length > 0) {
            let foundMatch = false;
            
            for (const phrase of boldPhrases) {
                const upperRemaining = remaining.toUpperCase();
                const upperPhrase = phrase.toUpperCase();
                const index = upperRemaining.indexOf(upperPhrase);
                
                if (index === 0) {
                    const matchedText = remaining.substring(0, phrase.length);
                    segments.push({ text: matchedText, bold: true });
                    remaining = remaining.substring(phrase.length);
                    position += phrase.length;
                    foundMatch = true;
                    break;
                }
            }
            
            if (!foundMatch) {
                let nextBoldIndex = remaining.length;
                
                for (const phrase of boldPhrases) {
                    const upperRemaining = remaining.toUpperCase();
                    const upperPhrase = phrase.toUpperCase();
                    const index = upperRemaining.indexOf(upperPhrase);
                    
                    if (index > 0 && index < nextBoldIndex) {
                        nextBoldIndex = index;
                    }
                }
                
                const normalText = remaining.substring(0, nextBoldIndex);
                segments.push({ text: normalText, bold: false });
                remaining = remaining.substring(nextBoldIndex);
                position += nextBoldIndex;
            }
        }
        
        return segments;
    }

    // Función mejorada para dividir texto en líneas con manejo de palabras largas
    function splitTextToLinesWithHyphenation(pdf, text, maxWidth, boldPhrases = []) {
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const lines = [];
        let currentLine = '';
        
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine.length === 0 ? word : currentLine + ' ' + word;
            
            // Determinar si la palabra es en negrita
            const wordUpper = word.toUpperCase();
            const isBold = boldPhrases.some(phrase => wordUpper.includes(phrase.toUpperCase()));
            
            pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
            const testWidth = pdf.getTextWidth(testLine);
            
            if (testWidth > maxWidth) {
                // Si ya hay texto en la línea actual, guardarla
                if (currentLine.length > 0) {
                    lines.push(currentLine);
                    currentLine = '';
                    
                    // Reintentar con la palabra en nueva línea
                    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
                    const wordWidth = pdf.getTextWidth(word);
                    
                    // Solo dividir si la palabra sola excede el ancho
                    if (wordWidth > maxWidth) {
                        const hyphenatedParts = hyphenateWord(pdf, word, maxWidth, isBold);
                        for (let j = 0; j < hyphenatedParts.length - 1; j++) {
                            lines.push(hyphenatedParts[j]);
                        }
                        currentLine = hyphenatedParts[hyphenatedParts.length - 1];
                    } else {
                        currentLine = word;
                    }
                } else {
                    // La palabra sola no cabe, dividirla
                    const hyphenatedParts = hyphenateWord(pdf, word, maxWidth, isBold);
                    for (let j = 0; j < hyphenatedParts.length - 1; j++) {
                        lines.push(hyphenatedParts[j]);
                    }
                    currentLine = hyphenatedParts[hyphenatedParts.length - 1];
                }
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }
        
        return lines;
    }

    // Función CORREGIDA para renderizar línea con espaciado uniforme
    function renderLineWithBold(pdf, line, x, y, maxWidth, justify = false, boldPhrases = []) {
        const segments = findBoldSegments(line, boldPhrases);
        
        // Modo sin justificación: renderizado simple
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
            // Una sola palabra no se justifica
            let currentX = x;
            segments.forEach(segment => {
                pdf.setFont('helvetica', segment.bold ? 'bold' : 'normal');
                pdf.text(segment.text, currentX, y);
                currentX += pdf.getTextWidth(segment.text);
            });
            return;
        }
        
        // CORRECCIÓN: Calcular segmentos por palabra correctamente
        const wordSegmentsArray = [];
        let totalWordsWidth = 0;
        
        words.forEach(word => {
            const wordSegments = findBoldSegments(word, boldPhrases);
            let wordWidth = 0;
            
            wordSegments.forEach(segment => {
                pdf.setFont('helvetica', segment.bold ? 'bold' : 'normal');
                wordWidth += pdf.getTextWidth(segment.text);
            });
            
            wordSegmentsArray.push({
                segments: wordSegments,
                width: wordWidth
            });
            
            totalWordsWidth += wordWidth;
        });
        
        // Calcular espaciado uniforme entre palabras
        const spacesCount = words.length - 1;
        const totalSpaceWidth = maxWidth - totalWordsWidth;
        const spaceWidth = totalSpaceWidth / spacesCount;
        
        // Renderizar con espaciado uniforme
        let currentX = x;
        wordSegmentsArray.forEach((wordData, wordIndex) => {
            wordData.segments.forEach(segment => {
                pdf.setFont('helvetica', segment.bold ? 'bold' : 'normal');
                pdf.text(segment.text, currentX, y);
                currentX += pdf.getTextWidth(segment.text);
            });
            
            // Añadir espacio uniforme entre palabras (excepto después de la última)
            if (wordIndex < wordSegmentsArray.length - 1) {
                currentX += spaceWidth;
            }
        });
    }

    // Función para renderizar párrafo completo con justificación uniforme
    function renderParagraph(pdf, text, x, startY, maxWidth, lineHeight, justify = false, boldPhrases = []) {
        pdf.setFont('helvetica', 'normal');
        const lines = splitTextToLinesWithHyphenation(pdf, text, maxWidth, boldPhrases);
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
    const watermarkBase64 = await loadWatermarkDesgnacionSSupervisor();
    if (watermarkBase64) {
        pdf.addImage(watermarkBase64, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'NONE');
    }

    function formatearFechaLarga(fecha) {
            if (!fecha) return '';
            
            const meses = [
                "enero", "febrero", "marzo", "abril", "mayo", "junio",
                "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
            ];

            const [anio, mes, dia] = fecha.split("-");
            const nombreMes = meses[parseInt(mes) - 1];

            return `${parseInt(dia)} de ${nombreMes} del ${anio}`;
        }
        

    // Obtener datos del formulario
    const fechaCreacion = formatearFechaLarga(document.getElementById('fechaCreacion').value);
    const numeroContrato = document.getElementById('numeroContrato')?.value || '';
    const cedulaContratista = document.getElementById('cedulaContratista')?.value || '';
    const valorTotal = document.getElementById('totalContrato').value; // "1000000"
    const nombreContratista = document.getElementById('nombreContratista')?.value || '';
    const valorFormateado = Number(valorTotal).toLocaleString('es-CO');
    const nombreSupervisor = document.getElementById('nombreSupervisor')?.value || '';
    const cedulaSupervisor = document.getElementById('cedulaSupervisor')?.value || '';
    const cargoSupervisor = document.getElementById('cargoSupervisor')?.value || 'Secretaria Administrativa y Financiera Municipal';
    const lugarExpedicion = document.getElementById('lugarExpedicion').value || '';
    
    

    // Definir frases en negrita
    const boldPhrases = [
    ];

    // Título centrado
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    const titulo = `POR LA CUAL SE DESIGNA EL SUPERVISOR DEL CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES Y APOYO A LA GESTIÓN No ${numeroContrato} DE FECHA ${fechaCreacion}.`;
    const tituloLines = pdf.splitTextToSize(titulo, textWidth);
    let currentY = margins.top;
    
    tituloLines.forEach(line => {
        const lineWidth = pdf.getTextWidth(line);
        const xCentered = (pageWidth - lineWidth) / 2;
        pdf.text(line, xCentered, currentY);
        currentY += lineHeight;
    });

    currentY += 5;

    // Párrafo A
    pdf.setFontSize(11);
    const parrafoA = `A. Que el municipio de El Banco, Magdalena, firmo el contrato de prestación de servicios y 
    apoyo a la gestión No ${numeroContrato} de fecha ${fechaCreacion} firmado con ${nombreContratista}, identificado 
    con cedula de ciudadanía No ${cedulaContratista} expedida en El Banco, Magdalena, cuyo objeto es PRESTACION DE SERVICIOS 
    PROFESIONALES Y APOYO A LA GESTION COMO ASEADORA EN LAS DIFERENTES INSTALACIONES DE LA ALCALDIA MUNICIPAL DE EL 
    BANCO, MAGDALENA, ($${valorFormateado}) pesos m/cte .`;
    currentY = renderParagraph(pdf, parrafoA, margins.left, currentY, textWidth, lineHeight, true, boldPhrases);

    currentY += 3;

    // Párrafo B
    const parrafoB = `B. Que el municipio requiere asignarle a esta clase de contratos la SUPERVISIÓN de la labor contratada.`;
    currentY = renderParagraph(pdf, parrafoB, margins.left, currentY, textWidth, lineHeight, true, boldPhrases);

    currentY += 3;

    // Párrafo C
    const parrafoC = `C. Que por lo antes expuesto:`;
    currentY = renderParagraph(pdf, parrafoC, margins.left, currentY, textWidth, lineHeight, false, boldPhrases);

    currentY += 5;

    // DESIGNA centrado
    pdf.setFont('helvetica', 'bold');
    const designa = 'DESIGNA';
    const designaWidth = pdf.getTextWidth(designa);
    pdf.text(designa, (pageWidth - designaWidth) / 2, currentY);
    currentY += 8;
        

    // Artículo Primero
    const articuloPrimero = `ARTÍCULO PRIMERO: Desígnese como SUPERVISOR del contrato de prestación de servicios 
    y apoyo a la gestión No ${numeroContrato} de fecha ${fechaCreacion} firmado con ${nombreContratista}, identificado con 
    cedula de ciudadanía No ${cedulaContratista} expedida en El Banco, Magdalena, a la ${cargoSupervisor}, la cual en este 
    momento se encuentra en cabeza de la doctora ${nombreSupervisor}, identificada con la cédula de ciudadanía No ${cedulaSupervisor} 
    expedida en ${lugarExpedicion}.`;
    currentY = renderParagraph(pdf, articuloPrimero, margins.left, currentY, textWidth, lineHeight, true, boldPhrases);

    currentY += 3;

    // Artículo Segundo
    const articuloSegundo = `ARTÍCULO SEGUNDO: Comuníquese la presente designación a las partes intervinientes en el proceso contractual.`;
    currentY = renderParagraph(pdf, articuloSegundo, margins.left, currentY, textWidth, lineHeight, true, boldPhrases);

    currentY += 8;

    // COMUNÍQUESE Y CÚMPLASE centrado
    pdf.setFont('helvetica', 'bold');
    const comuniquese = 'COMUNÍQUESE Y CÚMPLASE';
    const comuniqueseWidth = pdf.getTextWidth(comuniquese);
    pdf.text(comuniquese, (pageWidth - comuniqueseWidth) / 2, currentY);
    currentY += 8;

    // Fecha
    pdf.setFont('helvetica', 'normal');
    const fechaTexto = `Dado en El Banco, Magdalena, al primer ${fechaCreacion}.`;
    const fechaWidth = pdf.getTextWidth(fechaTexto);
    pdf.text(fechaTexto, (pageWidth - fechaWidth) / 2, currentY);
    currentY += 20;

    // Firma
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 0, 0);
    const firmado = 'Firmado en original';
    const firmadoWidth = pdf.getTextWidth(firmado);
    pdf.text(firmado, (pageWidth - firmadoWidth) / 2, currentY);
    currentY += 5;

    pdf.setTextColor(0, 0, 0);
    const nombreAlcaldesa = 'ISOLINA ALICIA VIDES MARTINEZ';
    const nombreWidth = pdf.getTextWidth(nombreAlcaldesa);
    pdf.text(nombreAlcaldesa, (pageWidth - nombreWidth) / 2, currentY);
    currentY += 5;

    pdf.setFont('helvetica', 'normal');
    const cargoAlcaldesa = 'Alcaldesa Municipal Encargada';
    const cargoWidth = pdf.getTextWidth(cargoAlcaldesa);
    pdf.text(cargoAlcaldesa, (pageWidth - cargoWidth) / 2, currentY);

    // Guardar PDF
    pdf.save(`DESIGNACION SUPERVISOR${nombreContratista} ${numeroContrato}.pdf`);
}

// Llamar a la función cuando se necesite
// generatePDFDesignacionSupervisor();