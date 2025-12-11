async function loadWatermarkNoExistencia() {
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

async function generatePDFCertificadoNoExistencia() {
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

    function renderLineWithBold(pdf, words, x, y, maxWidth, justify = false, boldPhrases = []) {
        // Convertir frases a array de palabras para comparación
        const boldPhrasesWords = boldPhrases.map(phrase => 
            phrase.toLowerCase().split(/\s+/)
        );
        
        // Función para verificar si una secuencia de palabras coincide con alguna frase en negrita
        function isPartOfBoldPhrase(wordIndex) {
            for (const phraseWords of boldPhrasesWords) {
                let match = true;
                for (let i = 0; i < phraseWords.length; i++) {
                    if (wordIndex + i >= words.length) {
                        match = false;
                        break;
                    }
                    const currentWord = words[wordIndex + i].replace(/[.,;:"]/g, '').toLowerCase();
                    if (currentWord !== phraseWords[i]) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    return phraseWords.length; // Retorna cuántas palabras forman la frase
                }
            }
            return 0; // No es parte de ninguna frase en negrita
        }
        
        if (!justify || words.length === 1) {
            let currentX = x;
            let i = 0;
            while (i < words.length) {
                const phraseLength = isPartOfBoldPhrase(i);
                const shouldBeBold = phraseLength > 0;
                
                pdf.setFont('helvetica', shouldBeBold ? 'bold' : 'normal');
                
                // Si es una frase de múltiples palabras, renderizarlas juntas
                if (phraseLength > 1) {
                    const phrase = words.slice(i, i + phraseLength).join(' ');
                    pdf.text(phrase, currentX, y);
                    currentX += pdf.getTextWidth(phrase);
                    i += phraseLength; // Avanzar el índice por todas las palabras de la frase
                } else {
                    pdf.text(words[i], currentX, y);
                    currentX += pdf.getTextWidth(words[i]);
                    i++;
                }
                
                if (i < words.length) {
                    pdf.setFont('helvetica', 'normal');
                    pdf.text(' ', currentX, y);
                    currentX += pdf.getTextWidth(' ');
                }
            }
            return;
        }
        
        // Calcular el ancho real de todas las palabras (sin espacios)
        let wordsWidth = 0;
        const wordWidths = [];
        
        let i = 0;
        while (i < words.length) {
            const phraseLength = isPartOfBoldPhrase(i);
            const shouldBeBold = phraseLength > 0;
            
            pdf.setFont('helvetica', shouldBeBold ? 'bold' : 'normal');
            
            if (phraseLength > 1) {
                const phrase = words.slice(i, i + phraseLength).join(' ');
                const wordWidth = pdf.getTextWidth(phrase);
                wordWidths.push(wordWidth);
                wordsWidth += wordWidth;
                i += phraseLength;
            } else {
                const wordWidth = pdf.getTextWidth(words[i]);
                wordWidths.push(wordWidth);
                wordsWidth += wordWidth;
                i++;
            }
        }
        
        const spacesCount = wordWidths.length - 1;
        
        if (spacesCount === 0) {
            const phraseLength = isPartOfBoldPhrase(0);
            const shouldBeBold = phraseLength > 0;
            pdf.setFont('helvetica', shouldBeBold ? 'bold' : 'normal');
            pdf.text(words[0], x, y);
            return;
        }
        
        // Calcular el espacio disponible para los espacios entre palabras
        const totalSpaceAvailable = maxWidth - wordsWidth;
        const spaceWidth = totalSpaceAvailable / spacesCount;
        
        let currentX = x;
        i = 0;
        let widthIndex = 0;
        while (i < words.length) {
            const phraseLength = isPartOfBoldPhrase(i);
            const shouldBeBold = phraseLength > 0;
            
            pdf.setFont('helvetica', shouldBeBold ? 'bold' : 'normal');
            
            if (phraseLength > 1) {
                const phrase = words.slice(i, i + phraseLength).join(' ');
                pdf.text(phrase, currentX, y);
                currentX += wordWidths[widthIndex];
                i += phraseLength;
            } else {
                pdf.text(words[i], currentX, y);
                currentX += wordWidths[widthIndex];
                i++;
            }
            
            widthIndex++;
            
            if (widthIndex < wordWidths.length) {
                currentX += spaceWidth;
            }
        }
    }

    function renderParagraph(pdf, text, x, startY, maxWidth, lineHeight, justify = false, boldPhrases = []) {
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(text, maxWidth);
        let currentY = startY;

        lines.forEach((line, index) => {
            const words = line.split(/\s+/);
            const isLastLine = index === lines.length - 1;
            const shouldJustify = justify && !isLastLine && words.length > 1;
            
            renderLineWithBold(pdf, words, x, currentY, maxWidth, shouldJustify, boldPhrases);
            currentY += lineHeight;
        });

        return currentY;
    }

    const watermarkBase64 = await loadWatermarkNoExistencia();

    if (watermarkBase64) {
        pdf.addImage(watermarkBase64, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'NONE');
    }

    pdf.setFont('helvetica');
    pdf.setFontSize(12);


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
    const fechaCreacion = formatearFechaLarga(document.getElementById('fechaCreacion').value);
    const numeroContrato = document.getElementById('numeroContrato').value || '';

    const boldPhrases = [
        'PRESTACION DE SERVICIOS DE APOYO A LA GESTION COMO CELADOR EN LAS DIFERENTES DEPENDENCIAS DE LA ALCALDIA MUNICIPAL DE EL BANCO, MAGDALENA'
    ];

    let yPosition = margins.top;
    const lineHeight = 5;

    // Título centrado PRIMARIO (en negrilla)
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');

    const tituloTextoPrimario = `LA SUSCRITA SECRETARIA ADMINISTRATIVA Y FINANCIERA CON FUNCIONES DE TALENTO HUMANO DEL MUNICIPIO DE EL BANCO MAGDALENA`;
    const tituloLineas = pdf.splitTextToSize(tituloTextoPrimario, textWidth);

    tituloLineas.forEach(linea => {
        const anchoLinea = pdf.getTextWidth(linea);
        const xCentrado = margins.left + (textWidth - anchoLinea) / 2;
        pdf.text(linea, xCentrado, yPosition);
        yPosition += 7;
    });

    // Título SECUNDARIO (texto normal)
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    const tituloTextoSecundario = `En cumplimiento a lo establecido por el artículo 3, del Decreto 1737 de 1998, modificado por artículo 1 del Decreto 2209 del de 1998`;
    const tituloLineasSecundario = pdf.splitTextToSize(tituloTextoSecundario, textWidth);

    tituloLineasSecundario.forEach(linea => {
        const anchoLinea = pdf.getTextWidth(linea);
        const xCentrado = margins.left + (textWidth - anchoLinea) / 2; 
        pdf.text(linea, xCentrado, yPosition);
        yPosition += 7;
    });

    yPosition += 5;

    // Palabra CERTIFICA centrada
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    const certificaText = 'CERTIFICA';
    const certificaWidth = pdf.getTextWidth(certificaText);
    const certificaX = margins.left + (textWidth - certificaWidth) / 2;
    pdf.text(certificaText, certificaX, yPosition);
    yPosition += 10;

    // Volver a fuente normal
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    // Primer párrafo con texto justificado y frase en negrita
    const textoContratoLargoCertificadoPrimario = `Que no existe, es insuficiente o no está en capacidad el personal de planta o de nómina de la Alcaldía municipal de El Banco, Magdalena, para la contratación cuyo objeto es la; "PRESTACION DE SERVICIOS DE APOYO A LA GESTION COMO CELADOR EN LAS DIFERENTES DEPENDENCIAS DE LA ALCALDIA MUNICIPAL DE EL BANCO, MAGDALENA". Así mismo que dentro del plan de anual de adquisiciones del año 2025, se encuentra incluida la contratación del personal para la prestación del servicio en mención.`;

    yPosition = renderParagraph(pdf, textoContratoLargoCertificadoPrimario, margins.left, yPosition, textWidth, lineHeight, true, boldPhrases);
    yPosition += 5;

    // Segundo párrafo
    const textoContratoLargoCertificadoSecundario = `Se entiende que no existe el personal de planta cuando es imposible atender la actividad con personal de planta, porque de acuerdo con los manuales específicos no existe personal que pueda desarrollar la actividad para la cual se requiere contratar la prestación del servicio o cuando el desarrollo de la actividad requiera un grado de especialización que implica la contratación del servicio, aun existiendo personal en la planta este no sea suficiente.`;

    yPosition = renderParagraph(pdf, textoContratoLargoCertificadoSecundario, margins.left, yPosition, textWidth, lineHeight, true, []);
    yPosition += 10;

    // Tercer párrafo
    const textoContratoLargoCertificadoTercero = `Dada en El Banco, Magdalena al ${fechaCreacion}.`;

    yPosition = renderParagraph(pdf, textoContratoLargoCertificadoTercero, margins.left, yPosition, textWidth, lineHeight, true, []);
    yPosition += 15;

    // Firma
    pdf.setFont('helvetica', 'bold');
    const firmaText = 'Firmado en original';
    const firmaWidth = pdf.getTextWidth(firmaText);
    const firmaX = margins.left + (textWidth - firmaWidth) / 2;
    pdf.text(firmaText, firmaX, yPosition);
    yPosition += 7;

    const nombreFirma = 'ISOLINA ALICIA VIDES MARTINEZ';
    const nombreWidth = pdf.getTextWidth(nombreFirma);
    const nombreX = margins.left + (textWidth - nombreWidth) / 2;
    pdf.text(nombreFirma, nombreX, yPosition);
    yPosition += 7;

    const cargoFirma = 'SECRETARIA ADMINISTRATIVA Y FINANCIERA';
    const cargoWidth = pdf.getTextWidth(cargoFirma);
    const cargoX = margins.left + (textWidth - cargoWidth) / 2;
    pdf.text(cargoFirma, cargoX, yPosition);

    // Guardar el PDF
    pdf.save(`Certificado_No_Existencia_${numeroContrato}_${fechaCreacion}.pdf`);
}