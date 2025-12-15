async function loadWatermarkCostanciaIdoneida() {
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

async function generatePDFConstanciaIdoneidaAseadora() {
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

    // Función para dividir texto en palabras respetando frases en negrita
    function dividirTextoEnPalabras(texto, boldPhrases = []) {
        // Ordenar frases por longitud (más largas primero) para evitar conflictos
        const frasesOrdenadas = [...boldPhrases].sort((a, b) => b.length - a.length);
        
        // Marcar las frases en negrita con delimitadores especiales
        let textoMarcado = texto;
        const marcadores = [];
        
        frasesOrdenadas.forEach((frase, idx) => {
            const marcador = `§BOLD${idx}§`;
            const regex = new RegExp(frase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            textoMarcado = textoMarcado.replace(regex, (match) => {
                marcadores.push({ marcador, texto: match, bold: true });
                return marcador;
            });
        });
        
        // Dividir en palabras manteniendo los marcadores
        const palabras = textoMarcado.split(/\s+/).filter(w => w.length > 0);
        
        // Reemplazar marcadores por objetos de palabra
        return palabras.map(palabra => {
            const marcadorEncontrado = marcadores.find(m => palabra.includes(m.marcador));
            if (marcadorEncontrado) {
                return {
                    texto: palabra.replace(marcadorEncontrado.marcador, marcadorEncontrado.texto),
                    bold: true
                };
            }
            return { texto: palabra, bold: false };
        });
    }

    // Función para dividir palabras en líneas respetando el ancho máximo
    function dividirEnLineas(pdf, palabras, anchoMaximo) {
        const lineas = [];
        let lineaActual = [];
        
        palabras.forEach(palabra => {
            const prueba = [...lineaActual, palabra];
            
            // Calcular ancho de la línea de prueba
            let anchoTotal = 0;
            prueba.forEach((p, idx) => {
                pdf.setFont('helvetica', p.bold ? 'bold' : 'normal');
                anchoTotal += pdf.getTextWidth(p.texto);
                if (idx < prueba.length - 1) {
                    anchoTotal += pdf.getTextWidth(' ');
                }
            });
            
            if (anchoTotal <= anchoMaximo) {
                lineaActual.push(palabra);
            } else {
                if (lineaActual.length > 0) {
                    lineas.push(lineaActual);
                }
                lineaActual = [palabra];
            }
        });
        
        if (lineaActual.length > 0) {
            lineas.push(lineaActual);
        }
        
        return lineas;
    }

    // Función para renderizar línea con justificación y negritas
    function renderLineWithBold(pdf, palabras, x, y, maxWidth, justify = false) {
        if (palabras.length === 0) return;
        
        // Si no hay justificación o es una sola palabra, renderizar normalmente
        if (!justify || palabras.length === 1) {
            let currentX = x;
            palabras.forEach(palabra => {
                pdf.setFont('helvetica', palabra.bold ? 'bold' : 'normal');
                pdf.text(palabra.texto, currentX, y);
                currentX += pdf.getTextWidth(palabra.texto);
                currentX += pdf.getTextWidth(' ');
            });
            return;
        }
        
        // Calcular ancho total de las palabras (sin espacios)
        let anchoTotalPalabras = 0;
        palabras.forEach(palabra => {
            pdf.setFont('helvetica', palabra.bold ? 'bold' : 'normal');
            anchoTotalPalabras += pdf.getTextWidth(palabra.texto);
        });
        
        // Calcular espacio entre palabras
        const numEspacios = palabras.length - 1;
        const espacioTotal = maxWidth - anchoTotalPalabras;
        const espacioPorHueco = espacioTotal / numEspacios;
        
        // Renderizar cada palabra con el espaciado calculado
        let currentX = x;
        palabras.forEach((palabra, index) => {
            pdf.setFont('helvetica', palabra.bold ? 'bold' : 'normal');
            pdf.text(palabra.texto, currentX, y);
            currentX += pdf.getTextWidth(palabra.texto);
            
            // Agregar espacio calculado (excepto después de la última palabra)
            if (index < palabras.length - 1) {
                currentX += espacioPorHueco;
            }
        });
    }

    // Función principal para renderizar párrafo completo
    function renderParagraph(pdf, text, x, startY, maxWidth, lineHeight, justify = false, boldPhrases = []) {
        // 1. Limpiar el texto
        const textoLimpio = text
            .replace(/\n/g, ' ')
            .replace(/\r/g, ' ')
            .replace(/\t/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        // 2. Dividir en palabras marcando las que son bold
        const palabras = dividirTextoEnPalabras(textoLimpio, boldPhrases);
        
        // 3. Dividir en líneas respetando el ancho máximo
        const lineas = dividirEnLineas(pdf, palabras, maxWidth);
        
        // 4. Renderizar cada línea
        let currentY = startY;
        lineas.forEach((palabrasLinea, index) => {
            const esUltimaLinea = index === lineas.length - 1;
            const debeJustificar = justify && !esUltimaLinea;
            
            renderLineWithBold(pdf, palabrasLinea, x, currentY, maxWidth, debeJustificar);
            currentY += lineHeight;
        });
        
        return currentY;
    }

    // Cargar marca de agua
    const watermarkBase64 = await loadWatermarkCostanciaIdoneida();
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
    const nombreContratista = document.getElementById('nombreContratista').value || '';
    const cedulaContratista = document.getElementById('cedulaContratista').value || '';
    const fechaCreacion = formatearFechaLarga(document.getElementById('fechaCreacion').value);
    const numeroContrato = document.getElementById('numeroContrato').value || '';
    const lugarExpedicion = document.getElementById('lugarExpedicion').value || '';
    


    // Frases en negrita
    const boldPhrases = [
        'PRESTACION DE SERVICIOS PROFESIONALES Y APOYO A LA GESTION COMO ASEADORA EN LAS DIFERENTES INSTALACIONES DE LA ALCALDIA MUNICIPAL DE EL BANCO, MAGDALENA. "',
        'Decreto 1082 de 2015',
        nombreContratista,
        cedulaContratista,
        lugarExpedicion,
        fechaCreacion,
        numeroContrato,

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
    
    const textoParrafo1 = `Teniendo en cuenta lo dispuesto en el Articulo 2.2.1.2.1.4.9 del Decreto 1082 de 2015, el perfil señalado en el estudio de conveniencia y oportunidad respecto a la persona natural o jurídica que se requiere para desarrollar el objeto contractual consistente en: "PRESTACION DE SERVICIOS PROFESIONALES Y APOYO A LA GESTION COMO ASEADORA EN LAS DIFERENTES INSTALACIONES DE LA ALCALDIA MUNICIPAL DE EL BANCO, MAGDALENA.".`;
    
    yPosition = renderParagraph(pdf, textoParrafo1, margins.left, yPosition, textWidth, lineHeight, true, boldPhrases);
    yPosition += 7;

    // Segundo párrafo
    const textoParrafo2 = `Ante lo cual me permito certificar que Previo el Estudio y Evaluación realizado a la hoja de vida ${nombreContratista}, identificado con cedula de ciudadanía No ${cedulaContratista} expedida   en ${lugarExpedicion}, esta persona posee la idoneidad y experiencia suficientes para suplir la necesidad del servicio`;
    
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