        async function loadWatermarkActaInicio() {
            try {
                const response = await fetch('/AuCo.github.io/componentes/marcadeaguaJURIDICA.png');
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
        
        // Función para convertir número a texto en español
        function numeroATexto(num) {
            const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
            const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
            const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
            
            if (num < 10) return unidades[num];
            if (num >= 10 && num < 20) return especiales[num - 10];
            if (num >= 20 && num < 100) {
                const dec = Math.floor(num / 10);
                const uni = num % 10;
                return decenas[dec] + (uni > 0 ? ' y ' + unidades[uni] : '');
            }
            return num.toString();
        }
        
        // Función para formatear fecha a texto
        function formatearFechaTexto(fechaStr) {
            const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 
                          'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
            const fecha = new Date(fechaStr + 'T00:00:00');
            const dia = fecha.getDate();
            const mes = meses[fecha.getMonth()];
            const anio = fecha.getFullYear();
            return `${dia} DE ${mes} DE ${anio}`;
        }
        
        // Función para formatear fecha corta
        function formatearFechaCorta(fechaStr) {
            const fecha = new Date(fechaStr + 'T00:00:00');
            const dia = fecha.getDate();
            const mes = fecha.getMonth() + 1;
            const anio = fecha.getFullYear();
            return `${dia}/${mes}/${anio}`;
        }
        
        // Función para calcular valor mensual
        function calcularValorMensual(valorTotal, numeroMeses) {
            const valor = parseFloat(valorTotal.replace(/[$.]/g, '').replace(',', '.'));
            const mensual = valor / numeroMeses;
            return '$ ' + mensual.toLocaleString('es-CO', {minimumFractionDigits: 0, maximumFractionDigits: 0});
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
        
        
        // Función para generar el contenido del PDF
        function generarContenidoPDFdeActaInicioAseadora() {
                const numeroContrato = document.getElementById('numeroContrato').value;
                const fechaContrato = formatearFechaLarga(document.getElementById('fechaCreacion').value);
                const fechaInicio = formatearFechaLarga(document.getElementById('fechaCreacion').value);
                const valorTotal = document.getElementById('totalContrato').value; // "1000000"
                const valorFormateado = Number(valorTotal).toLocaleString('es-CO'); // "1.000.000"
                const numeroMeses = parseInt(document.getElementById('numeroMes').value) || 1;
                const nombreContratista = document.getElementById('nombreContratista').value;
                const cedulaContratista = document.getElementById('cedulaContratista').value;
                const garantias = document.getElementById('garantias').value;
                const valorMensual = calcularValorMensual(valorTotal, numeroMeses);
                const textoMeses = numeroMeses === 1 ? 'una cuota mensual' : `${numeroMeses} cuotas mensuales`;
                const palabraMes = numeroMeses === 1 ? 'mes' : 'meses';
                const lugarExpedicion = document.getElementById('lugarExpedicion').value || '';


                const objeto = `PRESTACION DE SERVICIOS PROFESIONALES Y APOYO A LA GESTION COMO ASEADORA EN LAS DIFERENTES INSTALACIONES DE LA ALCALDIA MUNICIPAL DE EL BANCO, MAGDALENA`;

                const formaPago = `El valor total del contrato será cancelado en ${textoMeses} vencidas, por valor de ${valorMensual}, previo informe de actividades, pago a su seguridad social y recibido de conformidad por parte del Supervisor del Contrato.`;

                const contenido = {
                    titulo: `ACTA DE INICIO DEL CONTRATO DE PRESTACIÓN DE SERVICIOS DE APOYO A LA GESTION\nNo ${numeroContrato} DE FECHA ${fechaInicio}`,

                    tabla: [
                        { campo: 'FECHA ELABORACION', valor: fechaContrato },
                        { campo: 'CIUDAD', valor: 'El Banco – Magdalena' },
                        { campo: 'CONTRATO No', valor: `${numeroContrato} DE FECHA ${fechaContrato}` },
                        { campo: 'OBJETO', valor: objeto },
                        { campo: 'VALOR', valor: valorFormateado},
                        { campo: 'ANTICIPO:', valor: '$ 0' },
                        { campo: 'FORMA DE PAGO:', valor: formaPago },
                        { campo: 'NOMBRE DEL CONTRATISTA', valor: nombreContratista },
                        { campo: 'NOMBRE SUPERVISOR', valor: 'ISOLINA ALICIA VIDES MARTINEZ' },
                        { campo: 'CARGO:', valor: 'SECRETARIA ADMINISTRATIVA Y FINANCIERA' },
                        { campo: 'PLAZO INICIAL', valor: `Un (${numeroMeses}) ${palabraMes}` },
                        { campo: 'Garantías', valor: garantias || 'No se solicitaron' },
                        { campo: 'FECHA DE INICIO', valor: fechaInicio }
                    ],

                    // Este texto tiene saltos de línea, pero será limpiado en la otra función.
                    textoActa: `Los suscritos ISOLINA ALICIA VIDES MARTINEZ, identificada con la cédula de ciudadanía No 39.023.360 
                            expedida en El Banco, Magdalena, en calidad de Secretaria Administrativa y Financiera Municipal, designada por el 
                            señor alcalde municipal como supervisora del presente contrato, ${nombreContratista}, identificado con cedula de 
                            ciudadanía No ${cedulaContratista} expedida en ${lugarExpedicion}, dejan constancia del inicio 
                            del contrato anteriormente citado, previo cumplimiento de los requisitos de perfeccionamiento y presentación de todos 
                            los soportes documentales exigidos.\n\nPara constancia de lo anterior, se firma la presente acta bajo la responsabilidad 
                            expresa de los que intervienen en ella.`,

                    firmas: [
                        {
                            nombre: 'ISOLINA ALICIA VIDES MARTINEZ',
                            cargo: 'Supervisor del contrato'
                        },
                        {
                            nombre: nombreContratista,
                            cargo: 'Contratista'
                        }
                    ]
                };

                return contenido;
            }
        
        // Función para generar PDF con jsPDF
        async function generarPDFActaInicio() {
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

            // Cargar marca de agua
            const watermarkData = await loadWatermarkActaInicio();
            if (watermarkData) {
                pdf.addImage(watermarkData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'NONE');
                pdf.setGState(new pdf.GState({ opacity: 0.1 }));
                pdf.setGState(new pdf.GState({ opacity: 1.0 }));
            }

            const contenido = generarContenidoPDFdeActaInicio();
            let yPos = margins.top;

            // Título
            pdf.setFontSize(11);
            pdf.setFont(undefined, 'bold');
            const tituloLines = pdf.splitTextToSize(contenido.titulo, textWidth);
            tituloLines.forEach(line => {
                pdf.text(line, pageWidth / 2, yPos, { align: 'center' });
                yPos += 6;
            });

            yPos += 5;

            // ---
            // ## Tabla (Ajustes de Diseño para un aspecto más compacto)
            // ---
            const cellMinHeight = 6; 
            const lineSpacingInsideCell = 3.5; 
            const verticalPadding = 4;
            const col1Width = textWidth * 0.35;
            const col2Width = textWidth * 0.65;

            pdf.setFontSize(8); 

            contenido.tabla.forEach(row => {
                const textLines = pdf.splitTextToSize(row.valor, col2Width - 4);
                const neededHeight = Math.max(cellMinHeight, textLines.length * lineSpacingInsideCell + 1);

                if (yPos + neededHeight > pageHeight - margins.bottom) {
                    pdf.addPage();
                    yPos = margins.top;
                }

                // Celda 1 (Campo/Etiqueta)
                pdf.setFillColor(245, 245, 245);
                pdf.rect(margins.left, yPos, col1Width, neededHeight, 'F');
                pdf.rect(margins.left, yPos, col1Width, neededHeight);
                pdf.setFont(undefined, 'bold');
                pdf.text(row.campo, margins.left + 2, yPos + verticalPadding); 

                // Celda 2 (Valor)
                pdf.rect(margins.left + col1Width, yPos, col2Width, neededHeight);
                pdf.setFont(undefined, 'normal');
                textLines.forEach((line, index) => {
                    pdf.text(line, margins.left + col1Width + 2, yPos + verticalPadding + (index * lineSpacingInsideCell)); 
                });

                yPos += neededHeight;
            });

            yPos += 10;

            // ---
            // ## TEXTO DEL ACTA CON JUSTIFICACIÓN (UNIFORME)
            // ---
            if (yPos > pageHeight - margins.bottom - 50) {
                pdf.addPage();
                yPos = margins.top;
            }

            // Establecer el estilo de fuente para el cuerpo del texto
            pdf.setFontSize(10);
            pdf.setFont(undefined, 'normal');
            const lineHeight = 5;

            // 1. Unificar y limpiar el texto
            const textoLimpio = contenido.textoActa
                .replace(/\n/g, ' ') 
                .replace(/\r/g, ' ')
                .replace(/\t/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            // 2. Función para justificar texto manualmente
            function justificarTexto(texto, anchoMaximo) {
                const palabras = texto.split(' ');
                const lineas = [];
                let lineaActual = [];
                
                palabras.forEach(palabra => {
                    const pruebaLinea = [...lineaActual, palabra].join(' ');
                    const anchoLinea = pdf.getTextWidth(pruebaLinea);
                    
                    if (anchoLinea <= anchoMaximo) {
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

            // 3. Función para imprimir línea justificada
            function imprimirLineaJustificada(palabras, x, y, anchoMaximo, esUltimaLinea = false) {
                if (palabras.length === 0) return;
                
                // Si es la última línea o solo hay una palabra, alinear a la izquierda
                if (esUltimaLinea || palabras.length === 1) {
                    pdf.text(palabras.join(' '), x, y);
                    return;
                }
                
                // Calcular el ancho total del texto sin espacios extras
                const textoSinEspacios = palabras.join('');
                const anchoTexto = pdf.getTextWidth(textoSinEspacios);
                
                // Calcular el espacio total disponible para los espacios entre palabras
                const espacioTotal = anchoMaximo - anchoTexto;
                const numEspacios = palabras.length - 1;
                const espacioPorHueco = espacioTotal / numEspacios;
                
                // Imprimir cada palabra con el espacio calculado
                let xActual = x;
                palabras.forEach((palabra, index) => {
                    pdf.text(palabra, xActual, y);
                    xActual += pdf.getTextWidth(palabra);
                    if (index < palabras.length - 1) {
                        xActual += espacioPorHueco;
                    }
                });
            }

            // 4. Dividir el texto en líneas respetando palabras completas
            const lineasJustificadas = justificarTexto(textoLimpio, textWidth);

            // 5. Imprimir cada línea justificada
            lineasJustificadas.forEach((palabras, index) => {
                if (yPos + lineHeight > pageHeight - margins.bottom) {
                    pdf.addPage();
                    yPos = margins.top;
                }
                
                const esUltimaLinea = (index === lineasJustificadas.length - 1);
                imprimirLineaJustificada(palabras, margins.left, yPos, textWidth, esUltimaLinea);
                yPos += lineHeight;
            });

            yPos += 20;

            // ---
            // ## Firmas
            // ---
            if (yPos > pageHeight - margins.bottom - 40) {
                pdf.addPage();
                yPos = margins.top;
            }

            const firmaWidth = (textWidth - 20) / 2;
            const firmaX1 = margins.left;
            const firmaX2 = margins.left + firmaWidth + 20;

            contenido.firmas.forEach((firma, index) => {
                const xPos = index === 0 ? firmaX1 : firmaX2;

                pdf.line(xPos, yPos, xPos + firmaWidth, yPos);

                pdf.setFontSize(9);
                pdf.setTextColor(255, 0, 0);
                pdf.setFont(undefined, 'bold');
                pdf.text('Firmado en original', xPos + (firmaWidth / 2), yPos + 5, { align: 'center' });

                pdf.setTextColor(0, 0, 0);
                pdf.setFont(undefined, 'bold');
                pdf.text(firma.nombre, xPos + (firmaWidth / 2), yPos + 10, { align: 'center' });

                pdf.setFont(undefined, 'normal');
                pdf.text(firma.cargo, xPos + (firmaWidth / 2), yPos + 14, { align: 'center' });
            });

            // Guardar PDF
            const numeroContrato = document.getElementById('numeroContrato').value;
            const nombreContratista = document.getElementById('nombreContratista').value;
            pdf.save(`Acta_Inicio_${numeroContrato}_de_${nombreContratista}.pdf`);
        }