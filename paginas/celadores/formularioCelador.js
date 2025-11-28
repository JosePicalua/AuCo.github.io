    // Auto-capitalizar nombre contratista
    document.getElementById('nombreContratista').addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
            updatePreview();
        });

        // Formatear cédula con puntos
        document.getElementById('cedulaContratista').addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            let formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            e.target.value = formatted;
            updatePreview();
        });

        // Actualizar preview en tiempo real para todos los campos
        const formFields = ['numeroContrato', 'nombreContratista', 'cedulaContratista', 'lugarExpedicion', 
                           'totalContrato', 'numeroPresupuesto', 'fechaRadicacion', 'anoFiscal', 
                           'fechaCreacion', 'numeroMes'];
        
        formFields.forEach(field => {
            document.getElementById(field).addEventListener('input', updatePreview);
        });

        // Función para convertir número a texto en español
        function numeroATexto(num) {
            const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
            const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
            const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
            const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

            if (num === 0) return 'CERO';
            if (num === 100) return 'CIEN';
            
            let texto = '';
            
            // Millones
            if (num >= 1000000) {
                const millones = Math.floor(num / 1000000);
                texto += (millones === 1 ? 'UN MILLON ' : numeroATexto(millones) + ' MILLONES ');
                num %= 1000000;
            }
            
            // Miles
            if (num >= 1000) {
                const miles = Math.floor(num / 1000);
                if (miles === 1) {
                    texto += 'MIL ';
                } else {
                    texto += numeroATexto(miles) + ' MIL ';
                }
                num %= 1000;
            }
            
            // Centenas
            if (num >= 100) {
                texto += centenas[Math.floor(num / 100)] + ' ';
                num %= 100;
            }
            
            // Decenas y unidades
            if (num >= 20) {
                texto += decenas[Math.floor(num / 10)];
                if (num % 10 !== 0) {
                    texto += ' Y ' + unidades[num % 10];
                }
            } else if (num >= 10) {
                texto += especiales[num - 10];
            } else if (num > 0) {
                texto += unidades[num];
            }
            
            return texto.trim();
        }

        // Actualizar previsualización
        function updatePreview() {
            const numeroContrato = document.getElementById('numeroContrato').value || '[NUMERO CONTRATO]';
            const nombreContratista = document.getElementById('nombreContratista').value || '[NOMBRE CONTRATISTA]';
            const cedulaContratista = document.getElementById('cedulaContratista').value || '[CEDULA CONTRATISTA]';
            const lugarExpedicion = document.getElementById('lugarExpedicion').value || '[LUGAR DE EXPEDICION]';
            const totalContratoNum = document.getElementById('totalContrato').value || '0';
            const totalContratoTexto = numeroATexto(parseInt(totalContratoNum.replace(/\D/g, ''))) + ' PESOS COLOMBIANOS';
            
            
           
        }

        // Inicializar preview
        updatePreview();

        // Función para cargar la marca de agua
        async function loadWatermark() {
            try {
                const response = await fetch('../../componentes/marcadeaguaJURIDICA.png');
                const blob = await response.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.log("⚠️ Error cargando la marca de agua:", error);
                return null;
            }
        }

        // Toggle previsualización
        function togglePreview() {
            const container = document.getElementById('previewContainer');
            const toggleText = document.getElementById('toggleText');

            if (container.classList.contains('hidden')) {
                container.classList.remove('hidden');
                toggleText.textContent = 'Ocultar Previsualización';
            } else {
                container.classList.add('hidden');
                toggleText.textContent = 'Mostrar Previsualización';
            }
        }


        

        // Generar PDF
        async function generatePDFCelador() {
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

            const watermarkBase64 = await loadWatermark();

            if (watermarkBase64) {
                pdf.addImage(watermarkBase64, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'NONE');
            }

            pdf.setFont('helvetica');
            pdf.setFontSize(12);

            // Obtener datos del formulario
            const numeroContrato = document.getElementById('numeroContrato').value || '[NUMERO CONTRATO]';
            const nombreContratista = document.getElementById('nombreContratista').value || '[NOMBRE CONTRATISTA]';
            const cedulaContratista = document.getElementById('cedulaContratista').value || '[CEDULA CONTRATISTA]';
            const lugarExpedicion = document.getElementById('lugarExpedicion').value || '[LUGAR DE EXPEDICION]';

            // Definir yPosition UNA SOLA VEZ
            let yPosition = margins.top;
            const lineHeight = 7;

            // Título centrado
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');

            const tituloTexto = `CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES Y APOYO A LA GESTIÓN Nº ${numeroContrato}`;
            const tituloLineas = pdf.splitTextToSize(tituloTexto, textWidth);

            tituloLineas.forEach(linea => {
                const anchoLinea = pdf.getTextWidth(linea);
                const xCentrado = margins.left + (textWidth - anchoLinea) / 2;
                pdf.text(linea, xCentrado, yPosition);
                yPosition += 7;
            });

            yPosition += 5; // Espacio antes del texto del contrato

            // Volver a fuente normal para el texto del contrato
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');

            const textoContratoLargo = `
            Entre los suscritos a saber: ISOLINA ALICIA VIDES MARTÍNEZ, identificada con cédula de ciudadanía No 39.023.360 de 
            El Banco, Magdalena, en su calidad de Alcalde Municipal Encargada de El Banco, departamento del Magdalena, 
            mediante Decreto No. 126 del 30 de septiembre de 2025, en uso de sus facultades y funciones como Alcalde, de conformidad 
            con lo establecido con el artículo 314 de la Constitución Política de Colombia, y en ejercicio de las facultades 
            conferidas en el literal b del artículo 11 de la Ley 80 de 1993, y que para los efectos del presente contrato se 
            denominará EL MUNICIPIO, y por otra parte ${nombreContratista}, identificado con cedula de 
            ciudadanía No ${cedulaContratista} expedida en ${lugarExpedicion}, y quien actúa en nombre propio y en su
            condición de persona natural, se encuentra facultado para suscribir el presente documento y 
            quien en adelante se denominará EL CONTRATISTA, hemos convenido en celebrar el 
            presente Contrato de Prestación de Servicios Profesionales, teniendo en cuenta las siguientes consideraciones: 
            1. La Ley 80 de 1993 en el numeral 3º de su artículo 32 determinó que son contratos de prestación de servicios 
            aquellos destinados al desarrollo de actividades relacionadas con la administración y funcionamiento de la entidad, 
            los cuales no generan relación laboral ni prestaciones sociales y su celebración es por el término estrictamente 
            indispensable. 2. El municipio desarrolló los respectivos estudios y documentos Previos, en el cual se 
            consignó, la necesidad de contratar a una persona natural para "PRESTACION DE SERVICIOS DE APOYO A LA GESTION COMO 
            CELADOR EN LAS DIFERENTES DEPENDENCIAS DE LA ALCALDIA MUNICIPAL DE EL BANCO, MAGDALENA". 3. Que el proceso de 
            contratación se encuentra incluido en el plan anual de adquisiciones. 4. Que no existe personal de 
            planta al servicio del municipio, para atender las específicas actividades a contratar y los servicios requeridos 
            corresponden a actividades transitorias y ajenas al giro ordinario de las actividades permanentes de la entidad y 
            demandan conocimientos especializados. 5. Que atendiendo la naturaleza de las actividades a desarrollar 
            conforme a lo previsto en el artículo 2, numeral 4, literal h de la Ley 1150 de 2007 y en el decreto 1082 de 2015, 
            el ente territorial, puede contratar bajo la modalidad de contratación directa la prestación de servicios profesionales 
            y de apoyo a la gestión con la persona natural o jurídica que esté en capacidad de ejecutar el objeto del contrato.`;

            // Consolidar todo el texto en un solo string continuo, eliminando saltos de línea
            const textoCompleto = textoContratoLargo.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

            // Todo es un solo párrafo
            const paragraphs = [textoCompleto];

            // ELIMINAR ESTAS DOS LÍNEAS QUE ESTÁN DUPLICADAS:
            // let yPosition = margins.top;
            // const lineHeight = 7;

            paragraphs.forEach(paragraph => {
                const words = paragraph.split(' ');
                let currentLine = [];
                
                words.forEach((word, wordIndex) => {
                    const testLine = [...currentLine, word].join(' ');
                    const testWidth = pdf.getTextWidth(testLine);
                    
                    if (testWidth > textWidth) {
                        if (currentLine.length > 0) {
                            if (yPosition + lineHeight > pageHeight - margins.bottom) {
                                pdf.addPage();
                                yPosition = margins.top;
                                
                                if (watermarkBase64) {
                                    pdf.addImage(watermarkBase64, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'NONE');
                                }
                            }
                            
                            // Justificar todas las líneas excepto la última del párrafo
                            const isLastWord = wordIndex === words.length - 1;
                            
                            if (!isLastWord && currentLine.length > 1) {
                                justifyLine(pdf, currentLine, margins.left, yPosition, textWidth);
                            } else {
                                pdf.text(currentLine.join(' '), margins.left, yPosition);
                            }
                            
                            yPosition += lineHeight;
                        }
                        
                        currentLine = [word];
                    } else {
                        currentLine.push(word);
                    }
                });
                
                // Última línea del párrafo (sin justificar)
                if (currentLine.length > 0) {
                    if (yPosition + lineHeight > pageHeight - margins.bottom) {
                        pdf.addPage();
                        yPosition = margins.top;
                        
                        if (watermarkBase64) {
                            pdf.addImage(watermarkBase64, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'NONE');
                        }
                    }
                    
                    pdf.text(currentLine.join(' '), margins.left, yPosition);
                    yPosition += lineHeight;
                }
            });
            
            pdf.save('contrato_prestacion_servicios.pdf');
        }

        // 🔥 Función para justificar una línea distribuyendo el espacio entre palabras
        function justifyLine(pdf, words, x, y, maxWidth) {
            if (words.length === 1) {
                pdf.text(words[0], x, y);
                return;
            }
            
            const totalTextWidth = words.reduce((sum, word) => sum + pdf.getTextWidth(word), 0);
            const totalSpaceNeeded = maxWidth - totalTextWidth;
            const spacePerGap = totalSpaceNeeded / (words.length - 1);
            
            let currentX = x;
            
            words.forEach((word, index) => {
                pdf.text(word, currentX, y);
                currentX += pdf.getTextWidth(word) + spacePerGap;
            });
        }