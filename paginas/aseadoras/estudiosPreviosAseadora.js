async function loadWatermarkEstudiosPrevios() {
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

async function generatePDFEstudiosPreviosAseadora() {
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
            let currentX = x;
            segments.forEach(segment => {
                pdf.setFont('helvetica', segment.bold ? 'bold' : 'normal');
                pdf.text(segment.text, currentX, y);
                currentX += pdf.getTextWidth(segment.text);
            });
            return;
        }
        
        // Calcular ancho total de palabras usando posiciones exactas
        let totalWordsWidth = 0;
        const wordData = [];
        
        // Reconstruir la línea con posiciones exactas de palabras
        let linePosition = 0;
        const wordPositions = [];
        
        words.forEach(word => {
            const wordStart = line.indexOf(word, linePosition);
            const wordEnd = wordStart + word.length;
            wordPositions.push({ word, start: wordStart, end: wordEnd });
            linePosition = wordEnd;
        });
        
        // Para cada palabra, encontrar sus segmentos
        wordPositions.forEach(wordPos => {
            const wordSegments = [];
            let wordWidth = 0;
            
            // Encontrar qué segmentos se solapan con esta palabra
            let segmentPosition = 0;
            segments.forEach(segment => {
                const segmentStart = segmentPosition;
                const segmentEnd = segmentStart + segment.text.length;
                
                // Verificar si hay solapamiento
                if (wordPos.start < segmentEnd && wordPos.end > segmentStart) {
                    const overlapStart = Math.max(wordPos.start, segmentStart);
                    const overlapEnd = Math.min(wordPos.end, segmentEnd);
                    const overlapText = line.substring(overlapStart, overlapEnd);
                    
                    if (overlapText.length > 0) {
                        pdf.setFont('helvetica', segment.bold ? 'bold' : 'normal');
                        const width = pdf.getTextWidth(overlapText);
                        
                        wordSegments.push({
                            text: overlapText,
                            bold: segment.bold,
                            width: width
                        });
                        wordWidth += width;
                    }
                }
                
                segmentPosition = segmentEnd;
            });
            
            wordData.push({ segments: wordSegments, width: wordWidth });
            totalWordsWidth += wordWidth;
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

    // Función para verificar y agregar nueva página si es necesario
    function checkAndAddPage(pdf, currentY, neededSpace = 15) {
        if (currentY + neededSpace > pageHeight - margins.bottom) {
            pdf.addPage();
            if (watermarkBase64) {
                pdf.addImage(watermarkBase64, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'NONE');
            }
            return margins.top;
        }
        return currentY;
    }

    // Función para renderizar párrafo completo con justificación uniforme
    function renderParagraph(pdf, text, x, startY, maxWidth, lineHeight, justify = false, boldPhrases = []) {
        pdf.setFont('helvetica', 'normal');
        const lines = splitTextToLinesWithHyphenation(pdf, text, maxWidth, boldPhrases);
        let currentY = startY;

        lines.forEach((line, index) => {
            // Verificar si necesitamos nueva página antes de cada línea
            currentY = checkAndAddPage(pdf, currentY, lineHeight + 5);
            
            const isLastLine = index === lines.length - 1;
            const shouldJustify = justify && !isLastLine;
            
            renderLineWithBold(pdf, line, x, currentY, maxWidth, shouldJustify, boldPhrases);
            currentY += lineHeight;
        });

        return currentY;
    }

    // Cargar marca de agua
    const watermarkBase64 = await loadWatermarkEstudiosPrevios();
    if (watermarkBase64) {
        pdf.addImage(watermarkBase64, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'NONE');
    }

    
    const nombreContratista = document.getElementById('nombreContratista')?.value || '';
    const valorTotal = document.getElementById('totalContrato').value; // "1000000"
    const valorFormateado = Number(valorTotal).toLocaleString('es-CO'); // "1.000.000"
    const numeroMes = document.getElementById('numeroMes').value || '';
    

    // Definir frases en negrita
    const boldPhrases = [
        'ESTUDIOS PREVIOS',
        'DESCRIPCIÓN DE LA NECESIDAD QUE LA ENTIDAD PRETENDE SATISFACER',
        'PRESTACION DE SERVICIOS DE APOYO A LA GESTION COMO CELADOR EN LAS DIFERENTES',
        'DEPENDENCIAS DE LA ALCALDIA MUNICIPAL DE EL BANCO, MAGDALENA.',
        'OBJETO A CONTRATAR CON SUS ESPECIFICACIONES',
        'CLASIFICACION DEL SERVICIO: CODIGO UNSPSC 80111620.',
        'PLAZO DE EJECUCIÓN – VALOR ESTIMADO – FORMA DE PAGO – LUGAR DE EJECUCION DEL CONTRATO:',
        'MODALIDAD DE SELECCIÓN DEL CONTRATISTA Y SU JUSTIFICACIÓN:',
        'ANÁLISIS DE RIESGO Y LA FORMA DE MITIGARLO:',
        'INDICACIÓN SI EL PROCESO DE CONTRATACIÓN ESTÁ COBIJADO POR UN ACUERDO COMERCIAL.',
        'LOS CRITERIOS PARA SELECCIONAR LA OFERTA MAS FAVORABLE:',
        'SUPERVISIÓN:',
        'PLAZO DE EJECUCIÓN – VALOR ESTIMADO – FORMA DE PAGO – LUGAR DE EJECUCION',
        'DEL CONTRATO:',
        'INDICACIÓN SI EL PROCESO DE CONTRATACIÓN ESTÁ COBIJADO POR UN ACUERDO',
        'COMERCIAL.',
        'ARTÍCULO PRIMERO:',
        'ARTÍCULO SEGUNDO:'

    ];

    let currentY = margins.top;

    // Título centrado
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    const titulo = 'ESTUDIOS PREVIOS';
    const tituloWidth = pdf.getTextWidth(titulo);
    pdf.text(titulo, (pageWidth - tituloWidth) / 2, currentY);
    currentY += 10;

    pdf.setFontSize(10);

    // 1. DESCRIPCIÓN DE LA NECESIDAD
    currentY = checkAndAddPage(pdf, currentY, 20);
    currentY = renderParagraph(pdf, '1. DESCRIPCIÓN DE LA NECESIDAD QUE LA ENTIDAD PRETENDE SATISFACER', margins.left, currentY, textWidth, lineHeight, false, boldPhrases);
    currentY += 3;

    currentY = checkAndAddPage(pdf, currentY, 25);
    const parrafo1 = 'En desarrollo de lo señalado en los numerales 7 y 12 del Artículo 25 de la Ley 80 de 1993 (modificado por el artículo 87 de la Ley 1474 de 2011) y el Artículo 2.2.1.1.2.1.1 del Decreto 1082 de 2015, los estudios y documentos previos son el soporte para elaborar el proyecto de pliego, los pliegos de condiciones, el contrato y estarán conformados por los documentos definitivos que sirven de soporte para la contratación.';
    currentY = renderParagraph(pdf, parrafo1, margins.left, currentY, textWidth, lineHeight, true, boldPhrases);
    currentY += 3;

    currentY = checkAndAddPage(pdf, currentY, 25);
    const parrafo2 = 'La Ley 80 de 1993 en el numeral 3º de su artículo 32 determinó que son contratos de prestación de servicios aquellos destinados al desarrollo de actividades relacionadas con la administración y funcionamiento de la entidad, los cuales no pueden generar relación laboral ni prestaciones sociales y su celebración es por el termino estrictamente indispensable.';
    currentY = renderParagraph(pdf, parrafo2, margins.left, currentY, textWidth, lineHeight, true, boldPhrases);
    currentY += 3;

    currentY = checkAndAddPage(pdf, currentY, 60);
    const parrafo3 = 'La alcaldía del municipio de El Banco Magdalena cuenta con una infraestructura propia compuesta por diferentes dependencias donde funcionan los despachos de oficina en las cuales se ejecutan labores propias de la misión institucional del ente municipal. La Alcaldía Municipal por ser un ente del sector público tiene por mandato legal la obligación de establecer los mecanismos necesarios que permita la salvaguardia y conservación de los bienes entregados para el cumplimiento de las funciones, así como ejercer el control del ingreso y salida de bienes muebles, contratista y usuarios del mismo, además que pueda realizar los diferentes tramites en las instalaciones del edificio de la alcaldía municipal. Por lo anterior y con el fin de brindar seguridad y control a las instalaciones donde funcionan el edificio de la alcaldía municipal de El Banco Magdalena, se hace necesario contratar el servicio de objeto de estudio con una persona natural o jurídica que cumpla con estas actividades, debido a que en la plata de personal no se cuenta con el personal requerido para el desarrollo de las actividades. Que no obstante contar el municipio con personal de planta con los conocimientos y habilidades, este no es suficiente para atender toda el área misional.';
    currentY = renderParagraph(pdf, parrafo3, margins.left, currentY, textWidth, lineHeight, true, boldPhrases);
    currentY += 3;

    currentY = checkAndAddPage(pdf, currentY, 25);
    const parrafo4 = 'Por lo anterior, se requiere de un Celador que se encargue de la seguridad en la alcaldía municipal, de manera que debe encargarse del registro de la llegada de los usuarios y personal administrativo, realización de rondas de seguridad en las instalaciones entre otros, lo anterior, con la finalidad de garantizar un ambiente de seguridad en la alcaldía.';
    currentY = renderParagraph(pdf, parrafo4, margins.left, currentY, textWidth, lineHeight, true, boldPhrases);
    currentY += 5;

    currentY = checkAndAddPage(pdf, currentY, 15);
    const objetoTitulo = 'PRESTACION DE SERVICIOS PROFESIONALES Y APOYO A LA GESTION COMO ASEADORA EN LAS DIFERENTES INSTALACIONES DE LA ALCALDIA MUNICIPAL DE EL BANCO, MAGDALENA';
    currentY = renderParagraph(pdf, objetoTitulo, margins.left, currentY, textWidth, lineHeight, false, boldPhrases);
    currentY += 5;

    // 2. OBJETO A CONTRATAR
    currentY = checkAndAddPage(pdf, currentY, 15);
    currentY = renderParagraph(pdf, '2. OBJETO A CONTRATAR CON SUS ESPECIFICACIONES', margins.left, currentY, textWidth, lineHeight, false, boldPhrases);
    currentY += 3;

    currentY = checkAndAddPage(pdf, currentY, 10);
    currentY = renderParagraph(pdf, 'CLASIFICACION DEL SERVICIO: CODIGO UNSPSC 80111620.', margins.left, currentY, textWidth, lineHeight, false, boldPhrases);
    currentY += 5;

    currentY = checkAndAddPage(pdf, currentY, 80);
    const alcanceTexto = 'El alcance del objeto: 1. Mantener un excelente estado de aseo e higiene en las dependencias de las diferentes oficinas donde funciona la alcaldía municipal. 2. Responder por los elementos que quedan a su cuidado durante las horas que no son de atención al público. 3. Limpiar y desempolvar exteriormente los equipos de cómputo, escritorios, archivadores y demás muebles que se encuentren dentro de las diferentes dependencias de la alcaldía. 4. Limpiar, desmanchar y desinfectar los baños de las instalaciones de la alcaldía. 5. Limpiar vidrios interiores, lámpara, tapetes y de más elementos encontrados en la dependencia que requieran el servicio de aseo. Las demás que se requiera en la ejecución de la prestación del servicio.';
    currentY = renderParagraph(pdf, alcanceTexto, margins.left, currentY, textWidth, lineHeight, true, boldPhrases);
    currentY += 5;

    // 3. PLAZO DE EJECUCIÓN
    currentY = checkAndAddPage(pdf, currentY, 15);
    currentY = renderParagraph(pdf, '3. PLAZO DE EJECUCIÓN – VALOR ESTIMADO – FORMA DE PAGO – LUGAR DE EJECUCION DEL CONTRATO:', margins.left, currentY, textWidth, lineHeight, false, boldPhrases);
    currentY += 3;

    currentY = checkAndAddPage(pdf, currentY, 30);
    const plazoTexto = `El plazo de ejecución del presente contrato es de un (${numeroMes}) mes, contados a partir del Acta de Inicio. 
    El valor del contrato asciende a la suma de ($${valorFormateado} Pesos Colombianos m/cte), 
    incluyendo costos prestacionales que ocasione la ejecución del contrato. El valor total del contrato será 
    cancelado en una cuota mensual vencida, por valor de ${valorFormateado} Pesos Colombianos m/cte, previo informe de actividades, pago 
    a su seguridad social y recibido a satisfacción de conformidad por parte del Supervisor del Contrato. 
    El lugar de ejecución del presente contrato es en el Municipio de El Banco - Magdalena.`;
    currentY = renderParagraph(pdf, plazoTexto, margins.left, currentY, textWidth, lineHeight, true, boldPhrases);
    currentY += 5;

    // 4. MODALIDAD DE SELECCIÓN
    currentY = checkAndAddPage(pdf, currentY, 15);
    currentY = renderParagraph(pdf, '4. MODALIDAD DE SELECCIÓN DEL CONTRATISTA Y SU JUSTIFICACIÓN:', margins.left, currentY, textWidth, lineHeight, false, boldPhrases);
    currentY += 3;

    currentY = checkAndAddPage(pdf, currentY, 15);
    const modalidadTexto = 'El Artículo 2.2.1.2.1.4.9 del decreto 1082 de 2015 consagra: Contratos de prestación de servicios profesionales y de apoyo a la gestión, o para la ejecución de trabajos artísticos que solo pueden encomendarse a determinadas personas naturales.';
    currentY = renderParagraph(pdf, modalidadTexto, margins.left, currentY, textWidth, lineHeight, true, boldPhrases);
    currentY += 3;

    currentY = checkAndAddPage(pdf, currentY, 20);
    const justificacionTexto = 'Por lo anterior, el municipio de El Banco, Magdalena para adelantar la presente contratación tuvo en cuenta el perfil del personal, su experiencia para el desarrollo del objeto contractual percibida a través de su hoja de vida; así como la certeza que la entidad no cuenta con personal suficiente para llevar a cabo las funciones a encomendar señaladas en el presente estudio.';
    currentY = renderParagraph(pdf, justificacionTexto, margins.left, currentY, textWidth, lineHeight, true, boldPhrases);
    currentY += 5;

    // 5. ANÁLISIS DE RIESGO
    currentY = checkAndAddPage(pdf, currentY, 15);
    currentY = renderParagraph(pdf, '5. ANÁLISIS DE RIESGO Y LA FORMA DE MITIGARLO:', margins.left, currentY, textWidth, lineHeight, false, boldPhrases);
    currentY += 3;

    currentY = checkAndAddPage(pdf, currentY, 40);
    const riesgoTexto = 'Para efectos de la exigencia de garantías en el presente proceso contractual, la Alcaldía Municipal considera que para el cumplimiento del objeto contractual no se requiere una cualificación especial, es decir, que, de acuerdo al análisis de asignación de riesgos, las obligaciones especificas establecidas no contienen un nivel de complejidad que conlleven o produzcan alguna vicisitud en la ejecución del contrato. Por otro lado, teniendo en cuenta que los pagos se realizaran una vez sea verificado el cumplimiento del objeto contractual por parte del supervisor del contrato, impidiendo algún perjuicio para la entidad, no se exigirá garantía en virtud de lo establecido en el Art. 2.2.1.2.1.4.5 del decreto 1082 de 2015.';
    currentY = renderParagraph(pdf, riesgoTexto, margins.left, currentY, textWidth, lineHeight, true, boldPhrases);
    currentY += 5;

    // 6. INDICACIÓN SI EL PROCESO ESTÁ COBIJADO
    currentY = checkAndAddPage(pdf, currentY, 15);
    currentY = renderParagraph(pdf, '6. INDICACIÓN SI EL PROCESO DE CONTRATACIÓN ESTÁ COBIJADO POR UN ACUERDO COMERCIAL.', margins.left, currentY, textWidth, lineHeight, false, boldPhrases);
    currentY += 3;

    currentY = checkAndAddPage(pdf, currentY, 30);
    const acuerdoTexto = 'La modalidad de Contratación Directa NO se cobija por un Acuerdo Comercial vigente para el Estado Colombiano en los términos del Manual para el Manejo de los Acuerdos Comerciales en Procesos de Contratación, elaborado por Colombia Compra Eficiente, el cual puede consultar en el Sistema Electrónico para la Contratación Publica www.contratos.gov.co o www.colombiacompra.gov.co.), teniendo en cuenta que este Manual excluye esta modalidad de la aplicación de los Acuerdos Comerciales.';
    currentY = renderParagraph(pdf, acuerdoTexto, margins.left, currentY, textWidth, lineHeight, true, boldPhrases);
    currentY += 5;

    // 7. LOS CRITERIOS PARA SELECCIONAR
    currentY = checkAndAddPage(pdf, currentY, 15);
    currentY = renderParagraph(pdf, '7. LOS CRITERIOS PARA SELECCIONAR LA OFERTA MAS FAVORABLE:', margins.left, currentY, textWidth, lineHeight, false, boldPhrases);
    currentY += 3;

    currentY = checkAndAddPage(pdf, currentY, 20);
    const criteriosTexto = 'Según el artículo 2.2.1.2.1.4.9, del Decreto 1082 de 2015, no es necesario que la Entidad hayan obtenido previamente varias ofertas, de lo cual el ordenador del gasto debe dejar constancia escrita. En este caso se hizo el estudio de una propuesta con su respectiva hoja de vida.';
    currentY = renderParagraph(pdf, criteriosTexto, margins.left, currentY, textWidth, lineHeight, true, boldPhrases);
    currentY += 5;

    // 8. SUPERVISIÓN
    currentY = checkAndAddPage(pdf, currentY, 15);
    currentY = renderParagraph(pdf, '8. SUPERVISIÓN:', margins.left, currentY, textWidth, lineHeight, false, boldPhrases);
    currentY += 3;

    currentY = checkAndAddPage(pdf, currentY, 15);
    const supervisionTexto = 'La supervisión del contrato resultante del presente proceso de selección estará a cargo de la Secretaria Administrativa y Financiera.';
    currentY = renderParagraph(pdf, supervisionTexto, margins.left, currentY, textWidth, lineHeight, true, boldPhrases);
    currentY += 3;

    currentY = checkAndAddPage(pdf, currentY, 15);
    const apoyo = 'Por lo anterior se declara que es conveniente y oportuna la contratación de personal de apoyo a la gestión cuyo perfil se señaló anteriormente para cumplir con el objeto contractual requerido';
    currentY = renderParagraph(pdf, apoyo, margins.left, currentY, textWidth, lineHeight, true, boldPhrases);
    currentY += 10;

    // Verificar si necesitamos nueva página para la firma
    currentY = checkAndAddPage(pdf, currentY, 40);

    // Firma
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 0, 0);
    const firmado = 'Firmado en original';
    const firmadoWidth = pdf.getTextWidth(firmado);
    pdf.text(firmado, (pageWidth - firmadoWidth) / 2, currentY);
    currentY += 3;

    pdf.setTextColor(0, 0, 0);
    const nombreSecretaria = 'ISOLINA ALICIA VIDES MARTINEZ';
    const nombreWidth = pdf.getTextWidth(nombreSecretaria);
    pdf.text(nombreSecretaria, (pageWidth - nombreWidth) / 2, currentY);
    currentY += 3;

    pdf.setFont('helvetica', 'normal');
    const cargoSecretaria = 'SECRETARIA ADMINISTRATIVA Y FINANCIERA';
    const cargoWidth = pdf.getTextWidth(cargoSecretaria);
    pdf.text(cargoSecretaria, (pageWidth - cargoWidth) / 2, currentY);

    // Guardar PDF
    pdf.save(`Estudios_Previos_${nombreContratista}.pdf`);
}

// Llamar a la función cuando se necesite
// generatePDFEstudiosPrevios();