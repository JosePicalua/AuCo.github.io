    // Auto-capitalizar nombre contratista
       

        // Formatear cédula con puntos
        document.getElementById('cedulaContratista').addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            let formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            e.target.value = formatted;
            
        });


        document.getElementById('totalContrato').addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            let formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            e.target.value = formatted;
            
        });

        // Actualizar preview en tiempo real para todos los campos
        const formFields = ['numeroContrato', 'nombreContratista', 'cedulaContratista', 'lugarExpedicion', 
                           'totalContrato', 'numeroPresupuesto', 'fechaRadicacion', 'anoFiscal', 
                           'fechaCreacion', 'numeroMes'];
        
        formFields.forEach(field => {
            document.getElementById(field).addEventListener('input');
        });

        /**
         * Formatea un número agregando puntos como separador de miles.
         * @param {number|string} num El número (ej: 50000000).
         * @returns {string} El número formateado (ej: 50.000.000).
         */
        function formatNumberWithDots(num) {
            if (typeof num === 'string') {
                num = num.replace(/[^0-9]/g, ''); // Limpiamos cualquier caracter no numérico
            }
            return new Intl.NumberFormat('es-CO').format(parseInt(num, 10));
        }


        function limpiarFormulario() {
            const formContainer = document.querySelector('.form-container');
            if (formContainer) {
                formContainer.style.display = "none";
            }
        }


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

        

        // Función para cargar la marca de agua
        async function loadWatermarkFormulario() {
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

        function mostrarLoader() {
            document.getElementById('loader').style.display = 'flex';
        }

        function ocultarLoader() {
            document.getElementById('loader').style.display = 'none';
        }


        


        

        // Generar PDF
        async function generatePDFAseadoras() {
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

            // Función para renderizar una línea con palabras en negrita
        // Función MEJORADA para renderizar una línea con palabras en negrita
        function renderLineWithBold(pdf, words, x, y, maxWidth, justify = false, boldPhrases = []) {
            const fullText = words.join(' ');
            
            if (!justify || words.length === 1) {
                let currentX = x;
                words.forEach((word, index) => {
                    // Verificar si esta palabra es parte de alguna frase en negrita
                    let shouldBeBold = false;
                    
                    for (const phrase of boldPhrases) {
                        const phraseIndex = fullText.indexOf(phrase);
                        
                        if (phraseIndex !== -1) {
                            const wordsBeforeCurrent = words.slice(0, index).join(' ');
                            const currentWordStart = wordsBeforeCurrent.length + (index > 0 ? 1 : 0);
                            const currentWordEnd = currentWordStart + word.length;
                            
                            if (currentWordStart >= phraseIndex && currentWordEnd <= phraseIndex + phrase.length) {
                                shouldBeBold = true;
                                break;
                            }
                        }
                    }
                    
                    pdf.setFont('helvetica', shouldBeBold ? 'bold' : 'normal');
                    pdf.text(word, currentX, y);
                    currentX += pdf.getTextWidth(word);
                    if (index < words.length - 1) {
                        pdf.setFont('helvetica', 'normal');
                        pdf.text(' ', currentX, y);
                        currentX += pdf.getTextWidth(' ');
                    }
                });
                return;
            }
            
            // Calcular el ancho real de todas las palabras (sin espacios)
            let wordsWidth = 0;
            const wordWidths = [];
            
            words.forEach((word, index) => {
                // Verificar si esta palabra es parte de alguna frase en negrita
                let shouldBeBold = false;
                
                for (const phrase of boldPhrases) {
                    const phraseIndex = fullText.indexOf(phrase);
                    
                    if (phraseIndex !== -1) {
                        const wordsBeforeCurrent = words.slice(0, index).join(' ');
                        const currentWordStart = wordsBeforeCurrent.length + (index > 0 ? 1 : 0);
                        const currentWordEnd = currentWordStart + word.length;
                        
                        if (currentWordStart >= phraseIndex && currentWordEnd <= phraseIndex + phrase.length) {
                            shouldBeBold = true;
                            break;
                        }
                    }
                }
                
                pdf.setFont('helvetica', shouldBeBold ? 'bold' : 'normal');
                const wordWidth = pdf.getTextWidth(word);
                wordWidths.push(wordWidth);
                wordsWidth += wordWidth;
            });
            
            const spacesCount = words.length - 1;
            
            if (spacesCount === 0) {
                // Verificar si esta palabra es parte de alguna frase en negrita
                let shouldBeBold = false;
                
                for (const phrase of boldPhrases) {
                    const phraseIndex = fullText.indexOf(phrase);
                    
                    if (phraseIndex !== -1) {
                        if (phraseIndex === 0 && words[0].length <= phrase.length) {
                            shouldBeBold = true;
                            break;
                        }
                    }
                }
                
                pdf.setFont('helvetica', shouldBeBold ? 'bold' : 'normal');
                pdf.text(words[0], x, y);
                return;
            }
            
            // Calcular el espacio disponible para los espacios entre palabras
            const totalSpaceAvailable = maxWidth - wordsWidth;
            const spaceWidth = totalSpaceAvailable / spacesCount;
            
            let currentX = x;
            words.forEach((word, index) => {
                // Verificar si esta palabra es parte de alguna frase en negrita
                let shouldBeBold = false;
                
                for (const phrase of boldPhrases) {
                    const phraseIndex = fullText.indexOf(phrase);
                    
                    if (phraseIndex !== -1) {
                        const wordsBeforeCurrent = words.slice(0, index).join(' ');
                        const currentWordStart = wordsBeforeCurrent.length + (index > 0 ? 1 : 0);
                        const currentWordEnd = currentWordStart + word.length;
                        
                        if (currentWordStart >= phraseIndex && currentWordEnd <= phraseIndex + phrase.length) {
                            shouldBeBold = true;
                            break;
                        }
                    }
                }
                
                pdf.setFont('helvetica', shouldBeBold ? 'bold' : 'normal');
                pdf.text(word, currentX, y);
                currentX += wordWidths[index];
                
                if (index < words.length - 1) {
                    currentX += spaceWidth;
                }
            });
        }

        // === INTEGRACIÓN CON TU CÓDIGO ===

        // Después de obtener watermarkBase64 y antes del título
        const watermarkBase64 = await loadWatermarkFormulario();

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

        // Obtener datos del formulario
        const numeroContrato = document.getElementById('numeroContrato').value || '[NUMERO CONTRATO]';
        const nombreContratista = document.getElementById('nombreContratista').value || '[NOMBRE CONTRATISTA]';
        const cedulaContratista = document.getElementById('cedulaContratista').value || '[CEDULA CONTRATISTA]';
        const lugarExpedicion = document.getElementById('lugarExpedicion').value || '[LUGAR DE EXPEDICION]';
        const valorNumerico = document.getElementById('totalContrato').value || '0';
        const numeroPresupuesto = document.getElementById('numeroPresupuesto').value || '[NUMERO PRESUPUESTO]';
        const fechaRadicaciondePresupuesot = formatearFechaLarga(document.getElementById('fechaRadicacion').value);
        const anoFiscal = document.getElementById('anoFiscal').value || '[AÑO FISCAL]';
        const fechaCreacion = formatearFechaLarga(document.getElementById('fechaCreacion').value);
        const numeroMes = document.getElementById('numeroMes').value || '[NUMERO DE MES]';
        const fechaTerminaciondecontrato = formatearFechaLarga(document.getElementById('fechaTerminacion').value);
        const NumeroDecretoParaContrato = document.getElementById('NumeroDecretoParaContrato').value || '[NUMERO DECRETO PARA CONTRATO]';
        const fechaDecretoParaContrato = formatearFechaLarga(document.getElementById('fechaDecretoParaContrato').value);
        const calcularValorMensual = Math.round(parseInt(valorNumerico.replace(/\./g, '')) / parseInt(numeroMes)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');



        // 1. Obtener el valor formateado para el documento (ej: 50.000.000)
        const valorFormateado = formatNumberWithDots(valorNumerico); 

        // Puedes usar esta variable para reemplazar el placeholder en tu texto largo.
        const totalContrato_Formateado = valorFormateado;




        // Definir yPosition UNA SOLA VEZ
        let yPosition = margins.top;
        const lineHeight = 5;

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

        yPosition += 5;

        // Volver a fuente normal
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');

// AQUÍ VA TU TEXTO LARGO (puede tener saltos de línea, se convertirá a uniforme)
const textoContratoLargo = `Entre los suscritos a saber: ISOLINA ALICIA VIDES MARTÍNEZ, identificada con cédula de ciudadanía 
No 39.023.360 de El Banco, Magdalena, en su calidad de Alcalde Municipal Encargada de El Banco, departamento del Magdalena, 
mediante Decreto No. 143 del 4 de noviembre de 2025, en uso de sus facultades y funciones como Alcalde, de conformidad con lo 
establecido con el artículo 314 de la Constitución Política de Colombia, y en ejercicio de las facultades conferidas en el literal
b del artículo 11 de la Ley 80 de 1993, y que para los efectos del presente contrato se denominará  EL MUNICIPIO, y por otra
parte ${nombreContratista}, identificada con cedula de ciudadanía No ${cedulaContratista} de ${lugarExpedicion},  y quien actúa en 
nombre propio y en su condición de persona natural, se encuentra facultado para suscribir el presente documento y quien en
adelante se denominará EL CONTRATISTA, hemos convenido en celebrar el presente Contrato de Prestación de Servicios 
Profesionales, teniendo en cuenta las siguientes consideraciones: 1. La Ley 80 de 1993 en el numeral 3º de su artículo 
32 determinó que son contratos de prestación de servicios aquellos destinados al desarrollo de actividades relacionadas 
con la administración y funcionamiento de la entidad, los cuales no generan relación laboral ni prestaciones sociales y 
su celebración es por el término estrictamente indispensable. 2. El municipio desarrolló los respectivos estudios y documentos 
Previos, en el cual se consignó, la necesidad de contratar a una persona natural para “PRESTACION DE SERVICIOS PROFESIONALES Y 
APOYO A LA GESTION COMO ASEADORA EN LAS DIFERENTES INSTALACIONES DE LA ALCALDIA MUNICIPAL DE EL BANCO, MAGDALENA”. 3. Que el 
proceso de contratación se encuentra incluido en el plan anual de adquisiciones. 4. Que no existe personal de planta al servicio
del municipio, para atender las específicas actividades a contratar y los servicios requeridos corresponden a actividades 
transitorias y ajenas al giro ordinario de las actividades permanentes de la entidad y demandan conocimientos especializados. 
5. Que atendiendo la naturaleza de las actividades a desarrollar conforme a lo previsto en el artículo 2, numeral 4, literal 
h de la Ley 1150 de 2007 y en el decreto 1082 de 2015, el ente territorial, puede contratar bajo la modalidad de contratación 
directa la prestación de servicios profesionales y de apoyo a la gestión con la persona natural o jurídica que esté en 
capacidad de ejecutar el objeto del contrato, siempre y cuando, se verifique la idoneidad o experiencia requerida y relacionada
con el área de que se trate. CLÁUSULA PRIMERA - DEFINICIONES: Los términos definidos son utilizados en singular y en plural de 
acuerdo con el contexto en el cual son utilizados. Otros términos utilizados con mayúscula inicial deben ser entendidos de 
acuerdo con la definición contenida en el Decreto 1082 de 2015. Los términos no definidos en los documentos referenciados o
en la presente cláusula, deben entenderse de acuerdo con su significado natural y obvio: CLÁUSULA SEGUNDA - 
OBJETO DEL CONTRATO: PRESTACION DE SERVICIOS PROFESIONALES Y APOYO A LA GESTION COMO ASEADORA EN LAS DIFERENTES 
INSTALACIONES DE LA ALCALDIA MUNICIPAL DE EL BANCO, MAGDALENA. CLÁUSULA TERCERA – ACTIVIDADES ESPECÍFICAS DEL CONTRATO: 
1. Mantener un excelente estado de aseo e higiene en las dependencias de las diferentes oficinas donde funciona la 
alcaldía municipal. 2. Responder por los elementos que quedan a su cuidado durante las horas que no son de atención 
al público. 3. Limpiar y desempolvar exteriormente los equipos de cómputo, escritorios, archivadores y demás muebles 
que se encuentren dentro de las diferentes dependencias de la alcaldía. 4. Limpiar, desmanchar y desinfectar los baños 
de las instalaciones de la alcaldía. 5. Limpiar vidrios interiores, lámpara, tapetes y de más elementos encontrados en la 
dependencia que requieran el servicio de aseo. Las demás que se requiera en la ejecución de la prestación del servicio. 
CLÁUSULA CUARTO – INFORMES. En desarrollo de las cláusulas 2 y 3 del presente contrato, el Contratista deberá presentar los 
informes o entregables en los que dé cuenta de las actuaciones realizadas al vencimiento de cada mes. CLÁUSULA QUINTA:  
VALOR DEL CONTRATO – FORMA DE PAGO – LUGAR DE EJECUCION DEL CONTRATO.    El valor del contrato asciende a la suma de ${totalContrato_Formateado} 
($ ${valorNumerico}), incluyendo costos directos e indirectos que ocasione la ejecución del contrato. El valor total del contrato 
será cancelado en ${numeroMes} cuotas mensuales vencidas $ ${calcularValorMensual} cada una, previo informe de actividades, pago a su seguridad 
social y recibido de conformidad por parte del Supervisor del Contrato. El lugar de ejecución del presente contrato es en 
el Municipio de El Banco – Magdalena. CLÁUSULA SEXTA – DECLARACIONES DEL CONTRATISTA: El CONTRATISTA hace las siguientes 
declaraciones: 1. Conozco y acepto los documentos del proceso. 2. Tuve la oportunidad de solicitar aclaraciones y 
modificaciones a los documentos del proceso y recibí del municipio respuesta oportuna a cada una de las solicitudes. 
3. Me encuentro debidamente facultado para suscribir el presente contrato. 4. Que al momento de la celebración del 
presente contrato no me encuentro en ninguna causal de inhabilidad e incompatibilidad. 5. Estoy a paz y salvo con las 
obligaciones laborales y frente al sistema de seguridad social integral. 6. El valor del contrato incluye todos los 
gastos, costos, derechos, impuestos, tasas y demás contribuciones relacionados con el cumplimiento del objeto del presente 
contrato. CLÁUSULA SÉPTIMA – PLAZO DE EJECUCIÓN.  El plazo de ejecución del presente contrato será hasta el ${fechaTerminaciondecontrato}. OCTAVA – DERECHOS DEL CONTRATISTA: 1. Recibir la remuneración del contrato en los términos pactados en 
 la cláusula Quinta del presente Contrato. 2. Las demás consagradas en el Artículo 5 de la Ley 80 de 1993. CLÁUSULA NOVENA –
  OBLIGACIONES GENERALES DEL CONTRATISTA: 1.  El CONTRATISTA se obliga a ejecutar el objeto del contrato y a desarrollar las 
  actividades específicas en las condiciones pactadas. 2. El Contratista debe custodiar y a la terminación del presente 
  contrato devolver los insumos, suministros, herramientas, dotación, implementación, inventarios y/o materiales que sean 
  puestos a su disposición para la prestación del servicio objeto de este contrato. 3. Cumplir con el objeto del contrato 
  de conformidad con lo dispuesto en el contrato que se suscribe. 4. Presentar un informe mensual de sus actividades 
  6. Las demás que por ley o el contrato le correspondan. 7. El contratista será responsable ante la autoridad de los 
  actos u omisiones en el ejercicio de las actividades que desarrolle en virtud del contrato, cuando con ellos cause 
  perjuicios a la administración o a terceros. CLÁUSULA DECIMA – DERECHOS DEL CONTRATANTE: 1. Hacer uso de la cláusula de 
  imposición de multas, la cláusula penal o cualquier otro derecho consagrado al MUNICIPIO de manera legal o contractual. 
  2. Hacer uso de las cláusulas excepcionales del contrato. CLÁUSULA DECIMA PRIMERA – OBLIGACIONES GENERALES DEL CONTRATANTE: 
  1. Ejercer el respectivo control en el cumplimiento del objeto del contrato y expedir el recibo de cumplimiento a 
  satisfacción. 2. Pagar el valor del contrato de acuerdo con los términos establecidos. 3. Suministrar al Contratista 
  todos aquellos documentos, información e insumos que requiera para el desarrollo de la actividad encomendada. 
  4. Prestar su colaboración para el cumplimiento de las obligaciones del Contratista. CLÁUSULA DECIMA SEGUNDA – 
  RESPONSABILIDAD: EL CONTRATISTA es responsable por el cumplimiento del objeto del presente Contrato. EL CONTRATISTA será 
  responsable por los daños que ocasionen sus empleados y/o los empleados de sus subcontratistas, al MUNICIPIO en la 
  ejecución del objeto del presente Contrato. PARÁGRAFO: Ninguna de las partes será responsable frente a la otra o frente a 
  terceros por daños especiales, imprevisibles o daños indirectos, derivados de fuerza mayor o caso fortuito de acuerdo con la 
  ley. CLÁUSULA DECIMA TERCERA – TERMINACIÓN, MODIFICACIÓN E INTERPRETACIÓN UNILATERAL DEL CONTRATO: EL MUNICIPIO puede 
  terminar, modificar y/o interpretar unilateralmente el contrato, de acuerdo con los artículos 15 a 17 de la Ley 80 de 1993, 
  cuando lo considere necesario para que el Contratista cumpla con el objeto del presente Contrato. CLÁUSULA DECIMA CUARTA – 
  CADUCIDAD: La caducidad, de acuerdo con las disposiciones y procedimientos legamente establecidos, puede ser declarada por 
  EL MUNICIPIO cuando exista un incumplimiento grave que afecte la ejecución del presente Contrato. CLÁUSULA DECIMA QUINTA – 
  MULTAS: En caso de incumplimiento a las obligaciones del CONTRATISTA derivadas del presente contrato, EL MUNICIPIO puede 
  adelantar el procedimiento establecido en la ley e imponer multas sucesivas del 0.1% del valor de la parte incumplida por 
  cada día de mora, la cual podrá ser descontada de los créditos a favor del CONTRATISTA. CLÁUSULA DECIMA SEXTA – CLÁUSULA PENAL: 
  En caso de declaratoria de caducidad o de incumplimiento total o parcial de las obligaciones del presente Contrato, EL 
  CONTRATISTA debe pagar a EL MUNICIPIO, a título de indemnización, una suma equivalente al Diez por ciento (10%). El valor
pactado de la presente cláusula penal es el de la estimación anticipada de perjuicios, no obstante, la presente cláusula no 
impide el cobro de todos los perjuicios adicionales que se causen sobre el citado valor. Este valor puede ser compensado con 
los montos que EL MUNICIPIO adeude al CONTRATISTA con ocasión de la ejecución del presente contrato, de conformidad con las 
reglas del Código Civil. CLÁUSULA DECIMA SÉPTIMA – GARANTÍAS Y MECANISMOS DE COBERTURA DEL RIESGO: De acuerdo a la naturaleza 
del contrato, de la actividad a ejecutar y de la forma de pago, EL MUNICIPIO se abstiene de exigir garantía. CLÁUSULA DECIMA 
OCTAVA – INDEPENDENCIA DEL CONTRATISTA: EL CONTRATISTA es una entidad independiente de EL MUNICIPIO, y, en consecuencia, EL 
CONTRATISTA no es su representante, agente o mandatario. EL CONTRATISTA no tiene la facultad de hacer declaraciones, 
representaciones o compromisos en nombre del MUNICIPIO, ni de tomar decisiones o iniciar acciones que generen obligaciones 
a su cargo. EL CONTRATISTA realizará la labor contratada de forma discrecional y autónoma y recibirá honorarios por los 
servicios prestados. CLÁUSULA DECIMA NOVENA – CESIONES: EL CONTRATISTA no puede ceder parcial ni totalmente sus obligaciones 
o derechos derivados del presente contrato sin la autorización previa, expresa y escrita del MUNICIPIO. Si EL CONTRATISTA es 
objeto de fusión, escisión o cambio de control, EL MUNICIPIO está facultado a conocer las condiciones de esa operación. 
En consecuencia, EL CONTRATISTA se obliga a informar oportunamente a EL MUNICIPIO de la misma y solicitar su consentimiento. 
CLÁUSULA VIGÉSIMA – INDEMNIDAD: EL CONTRATISTA se obliga a indemnizar a EL MUNICIPIO con ocasión de la violación o el 
incumplimiento de las obligaciones previstas en el presente contrato. EL CONTRATISTA se obliga a mantener indemne a EL 
MUNICIPIO de cualquier daño o perjuicio originado en reclamaciones de terceros que tengan como causa sus actuaciones hasta 
por el monto del daño o perjuicio causado y hasta por el valor del presente contrato. CLÁUSULA VIGÉSIMA PRIMERA – CASO FORTUITO 
Y FUERZA MAYOR: Las partes quedan exoneradas de responsabilidad por el incumplimiento de cualquiera de sus obligaciones o 
por la demora en la satisfacción de cualquiera de las prestaciones a su cargo derivadas del presente contrato, cuando el 
incumplimiento sea resultado o consecuencia de la ocurrencia de un evento de fuerza mayor y caso fortuito debidamente invocadas 
y constatadas de acuerdo con la ley y la jurisprudencia. CLÁUSULA VIGÉSIMA SEGUNDA – SOLUCIÓN DE CONTROVERSIAS: Las controversias
 o diferencias que surjan entre EL CONTRATISTA y EL MUNICIPIO con ocasión de la firma, ejecución, interpretación, prórroga o 
 terminación del contrato, así como de cualquier otro asunto relacionado con el presente contrato, serán sometidas a la revisión 
 de las partes para buscar un arreglo directo, en un término no mayor a cinco (5) días hábiles a partir de la fecha en que 
 cualquiera de las partes comunique por escrito a la otra la existencia de una diferencia. Las controversias que no puedan ser 
 resueltas de forma directa entre las partes, se resolverán a través del proceso judicial correspondiente. CLÁUSULA VIGÉSIMA 
 TERCERA – SUPERVISIÓN: La supervisión de la ejecución y cumplimiento de las obligaciones contraídas por el CONTRATISTA a favor 
 del MUNICIPIO, estará a cargo de la Secretaría Administrativa y Financiera. CLÁUSULA VIGÉSIMA CUARTA – ANEXOS DEL CONTRATO: 
 Hacen parte integrante de este contrato los siguientes documentos: 1. Los estudios previos. 2. Los documentos precontractuales. 
 3. Certificado de Disponibilidad Presupuestal. 4. Los demás que se estimen necesarios. CLÁUSULA VIGÉSIMA QUINTA – REGISTRO Y 
 APROPIACIONES PRESUPUESTALES: EL MUNICIPIO pagará AL CONTRATISTA el valor del presente Contrato con cargo al certificado de 
 disponibilidad presupuestal N° ${numeroPresupuesto} de fecha ${fechaDecretoParaContrato}, por valor de $ ${valorNumerico}. El presente Contrato está 
 sujeto a registro presupuestal y el pago de su valor a las apropiaciones presupuestales de la Vigencia Fiscal ${anoFiscal} CLÁUSULA 
 VIGÉSIMA OCTAVA - CONFIDENCIALIDAD: En caso de que exista información sujeta a alguna reserva legal, las partes deben mantener 
 la confidencialidad de esta información. Para ello, debe comunicar a la otra parte que la información suministrada tiene el 
 carácter de confidencial. CLÁUSULA VIGÉSIMA NOVENA – LUGAR DE EJECUCIÓN Y DOMICILIO CONTRACTUAL: Las actividades previstas en el 
 presente contrato se deben desarrollar en el Municipio de El Banco – Magdalena y el domicilio contractual es el Municipio El 
 Banco Magdalena. Para constancia, se firma en el Municipio de El Banco, Magdalena al ${fechaDecretoParaContrato} .`;

            // DEFINE LAS PALABRAS QUE QUIERES EN NEGRITA
            const palabrasEnNegrita = [
                'ISOLINA ALICIA VIDES MARTÍNEZ', 
                'PRESTACION DE SERVICIOS PROFESIONALES Y APOYO A LA GESTION COMO ASEADORA EN LAS DIFERENTES INSTALACIONES DE LA ALCALDIA MUNICIPAL DE EL BANCO, MAGDALENA. CLÁUSULA TERCERA – ACTIVIDADES ESPECÍFICAS DEL CONTRATO:',
                'EL MUNICIPIO',
                'EL CONTRATISTA',
                '"PRESTACIONDE SERVICIOS DE APOYO A LA GESTION COMO CELADOR',
                'EN LAS DIFERENTES DEPENDENCIAS DE LA ALCALDIA MUNICIPAL DE EL BANCO',
                'SEGUNDA- OBJETO DEL CONTRATO:PRESTACIONDE SERVICIOS DE APOYOA LA GESTION',
                'COMO CELADOR EN LAS DIFERENTES DEPENDENCIAS DE LA ALCALDIA MUNICIPAL DE EL',
                'BANCO, MAGDALENA. CLÁUSULA TERCERA– ACTIVIDADES ESPECÍFICAS DEL CONTRATO:1.',
                'VALORDEL CONTRATO– FORMA DE PAGO– LUGAR DE EJECUCION DEL CONTRATOEl',
                'CLÁUSULA DECIMA TERCERA– TERMINACIÓN,',
                'CLÁUSULA DECIMA SEGUNDA– RESPONSABILIDAD: EL CONTRATISTA',
                'MODIFICACIÓN E INTERPRETACIÓN UNILATERAL DEL CONTRATO: EL MUNICIPIO',
                '“PRESTACION',
                'DE SERVICIOS DE APOYO A LA SECRETARIA DE PLANEACIÓN MUNICIPAL COMO',
                'ENCUESTADORESPARA LA IMPLEMENTACIÓN DEL NUEVO SISTEMA DE IDENTIFICACIÓN DE',
                'MAGDALENA',
                'EL MUNICIPIO,',
                'EL CONTRATISTA',
                'El Banco, Magdalena',
                '“PRESTACION DE SERVICIOS DE APOYO A LA GESTION COMO CELADOR EN LAS DIFERENTES DEPENDENCIAS DE LA ALCALDIA MUNICIPAL DE EL BANCO, MAGDALENA”. ',
                'CLÁUSULA PRIMERA - DEFINICIONES:',
                'CLÁUSULA SEGUNDA - OBJETO DEL CONTRATO: PRESTACION DE SERVICIOS DE APOYO A LA GESTION COMO CELADOR EN LAS DIFERENTES DEPENDENCIAS DE LA ALCALDIA MUNICIPAL DE EL BANCO, MAGDALENA. CLÁUSULA TERCERA – ACTIVIDADES ESPECÍFICAS DEL CONTRATO:',
                'CLÁUSULA CUARTO – INFORMES.',
                ' CLÁUSULA QUINTA:VALORDEL CONTRATO– FORMA DE PAGO– LUGAR DE EJECUCION DEL CONTRATO',
                'CLÁUSULA SEXTA– DECLARACIONES DEL CONTRATISTA:El CONTRATISTA',
                'CLÁUSULA SÉPTIMA – PLAZO DE EJECUCIÓN:',
                'CLÁUSULA OCTAVA – DERECHOS DEL CONTRATISTA:', 
                ' CLÁUSULA NOVENA– OBLIGACIONES GENERALES DEL CONTRATISTA:1. El CONTRATISTAse',
                ' CLÁUSULA DECIMA– DERECHOS DEL CONTRATANTE:1.',
                ' CLÁUSULA DECIMA PRIMERA– OBLIGACIONES GENERALES DELCONTRATANTE:1. ',
                ' CLÁUSULA DECIMA SEGUNDA RESPONSABILIDAD: EL CONTRATISTA',
                'MUNICIPIO ',
                ' CLÁUSULA DECIMA TERCERA– TERMINACIÓN, MODIFICACIÓN E INTERPRETACIÓN UNILATERAL DEL CONTRATO: EL MUNICIPIO',
                ' CLÁUSULA DECIMA CUARTA– CADUCIDAD:',
                'CLÁUSULA DECIMA QUINTA – MULTAS:',
                'CONTRATISTA',
                'EL MUNICIPIO,',
                ' A FAVOR DEL CONTRATISTA. CLÁUSULA DECIMA SEXTA– CLÁUSULA PENAL:',
                'CLÁUSULA DECIMA SÉPTIMA – GARANTÍAS Y MECANISMOS DE COBERTURA DEL RIESGO:',
                'CLÁUSULA DECIMA OCTAVA – INDEPENDENCIA DEL CONTRATISTA:',
                'CLÁUSULA DECIMA NOVENA – CESIONES: EL CONTRATISTA',
                'CLÁUSULA VIGÉSIMA – INDEMNIDAD: EL CONTRATISTA',
                ' CLÁUSULA VIGÉSIMA PRIMERA– CASO FORTUITO Y FUERZA MAYOR:',
                ' CLÁUSULA VIGÉSIMA SEGUNDA– SOLUCIÓN DE CONTROVERSIAS:',
                ' CLÁUSULA VIGÉSIMA TERCERA– SUPERVISIÓN:',
                'CLÁUSULA VIGÉSIMA CUARTA – ANEXOS DEL CONTRATO:',
                '. CLÁUSULA VIGÉSIMA QUINTA– REGISTRO Y APROPIACIONES PRESUPUESTALES:EL MUNICIPIO',
                'CLÁUSULA VIGÉSIMA OCTAVA - CONFIDENCIALIDAD:',
                'CLÁUSULA VIGÉSIMA NOVENA – LUGAR DE EJECUCIÓN Y DOMICILIO CONTRACTUAL:',
                fechaDecretoParaContrato,
                fechaDecretoParaContrato,
                fechaTerminaciondecontrato,
                numeroMes,
                fechaCreacion,
                anoFiscal,
                fechaRadicaciondePresupuesot,
                numeroPresupuesto,
                valorNumerico,
                cedulaContratista,
                nombreContratista,
                numeroContrato,
                numeroPresupuesto,
                numeroMes,
                valorFormateado,
                calcularValorMensual,

            ];



                    // Función mejorada para calcular el ancho real de un texto con palabras en negrita
            function getLineWidthWithBold(pdf, words, boldPhrases) {
                let totalWidth = 0;
                const fullText = words.join(' ');
                
                words.forEach((word, index) => {
                    // Verificar si esta palabra es parte de alguna frase en negrita
                    let shouldBeBold = false;
                    
                    for (const phrase of boldPhrases) {
                        // Buscar si la frase aparece en el texto completo
                        const phraseIndex = fullText.indexOf(phrase);
                        
                        if (phraseIndex !== -1) {
                            // Calcular la posición de la palabra actual en el texto
                            const wordsBeforeCurrent = words.slice(0, index).join(' ');
                            const currentWordStart = wordsBeforeCurrent.length + (index > 0 ? 1 : 0);
                            const currentWordEnd = currentWordStart + word.length;
                            
                            // Verificar si la palabra actual está dentro de la frase en negrita
                            if (currentWordStart >= phraseIndex && currentWordEnd <= phraseIndex + phrase.length) {
                                shouldBeBold = true;
                                break;
                            }
                        }
                    }
                    
                    pdf.setFont('helvetica', shouldBeBold ? 'bold' : 'normal');
                    totalWidth += pdf.getTextWidth(word);
                    
                    if (index < words.length - 1) {
                        pdf.setFont('helvetica', 'normal');
                        totalWidth += pdf.getTextWidth(' ');
                    }
                });
                
                return totalWidth;
            }
            // Convertir texto a uniforme - MEJORADO
            const textoCompleto = textoContratoLargo
                .replace(/\n/g, ' ')           // Reemplazar saltos de línea
                .replace(/\r/g, ' ')           // Reemplazar retornos de carro
                .replace(/\t/g, ' ')           // Reemplazar tabs
                .replace(/\s+/g, ' ')          // Reemplazar múltiples espacios por uno solo
                .trim();                        // Eliminar espacios al inicio y final
                        // Reemplaza la sección donde procesas el texto palabra por palabra:
            // Procesar el texto palabra por palabra - MEJORADO
                const words = textoCompleto.split(' ').filter(word => word.trim() !== ''); // Filtrar palabras vacías
                let currentLine = [];

                words.forEach((word, wordIndex) => {
                    const testLine = [...currentLine, word];
                    
                    // USA LA NUEVA FUNCIÓN en lugar de pdf.getTextWidth
                    const testWidth = getLineWidthWithBold(pdf, testLine, palabrasEnNegrita);
                    
                    if (testWidth > textWidth) {
                        if (currentLine.length > 0) {
                            if (yPosition + lineHeight > pageHeight - margins.bottom) {
                                pdf.addPage();
                                yPosition = margins.top;
                                
                                if (watermarkBase64) {
                                    pdf.addImage(watermarkBase64, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'NONE');
                                }
                            }
                            
                            const isLastWord = wordIndex === words.length - 1;
                            const shouldJustify = !isLastWord && currentLine.length > 1;
                            
                            renderLineWithBold(pdf, currentLine, margins.left, yPosition, textWidth, shouldJustify, palabrasEnNegrita);
                            yPosition += lineHeight;
                        }
                        
                        currentLine = [word];
                    } else {
                        currentLine.push(word);
                    }
                });

            // Última línea
            if (currentLine.length > 0) {
                if (yPosition + lineHeight > pageHeight - margins.bottom) {
                    pdf.addPage();
                    yPosition = margins.top;
                    
                    if (watermarkBase64) {
                        pdf.addImage(watermarkBase64, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'NONE');
                    }
                }
                
                renderLineWithBold(pdf, currentLine, margins.left, yPosition, textWidth, false, palabrasEnNegrita);
                yPosition += lineHeight;
            }

            // SECCIÓN DE FIRMAS
            yPosition += 50; // Espacio antes de las firmas

            // Verificar si hay espacio suficiente para las firmas (aproximadamente 20 unidades)
            if (yPosition + 20 > pageHeight - margins.bottom) {
                pdf.addPage();
                yPosition = margins.top;
                
                if (watermarkBase64) {
                    pdf.addImage(watermarkBase64, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'NONE');
                }
            }
            // Calcular posiciones para dos columnas centradas
            const colWidth = textWidth / 2;
            const col1X = margins.left + 20; // Columna izquierda con un pequeño margen
            const col2X = margins.left + colWidth + 20; // Columna derecha

            // Primera línea: "Firmado en original" en rojo y centrado en cada columna
            pdf.setTextColor(255, 0, 0); // Rojo
            pdf.setFont('helvetica', 'bold');

            const firmadoTexto = 'Firmado en original';
            const firmado1Width = pdf.getTextWidth(firmadoTexto);
            const firmado1X = col1X + (colWidth - 40 - firmado1Width) / 2;
            const firmado2X = col2X + (colWidth - 40 - firmado1Width) / 2;

            pdf.text(firmadoTexto, firmado1X, yPosition);
            pdf.text(firmadoTexto, firmado2X, yPosition);
            yPosition += 6;

            // Segunda línea: Nombres en negrita y centrados
            pdf.setTextColor(0, 0, 0); // Negro

            const nombre1 = 'ISOLINA ALICIA VIDES MARTINEZ';
            const nombre2 = document.getElementById('nombreContratista').value || '[NOMBRE CONTRATISTA]';

            const nombre1Width = pdf.getTextWidth(nombre1);
            const nombre2Width = pdf.getTextWidth(nombre2);

            const nombre1X = col1X + (colWidth - 40 - nombre1Width) / 2;
            const nombre2X = col2X + (colWidth - 40 - nombre2Width) / 2;

            pdf.text(nombre1, nombre1X, yPosition);
            pdf.text(nombre2, nombre2X, yPosition);
            yPosition += 6;

            // Tercera línea: Cargos en normal y centrados
            pdf.setFont('helvetica', 'normal');

            const cargo1 = 'Alcaldesa Municipal Encargada';
            const cargo2 = 'El Contratista';

            const cargo1Width = pdf.getTextWidth(cargo1);
            const cargo2Width = pdf.getTextWidth(cargo2);

            const cargo1X = col1X + (colWidth - 40 - cargo1Width) / 2;
            const cargo2X = col2X + (colWidth - 40 - cargo2Width) / 2;

            pdf.text(cargo1, cargo1X, yPosition);
            pdf.text(cargo2, cargo2X, yPosition);



            pdf.save(`CONTRATO DE ${nombreContratista} con Numero de contrato ${numeroContrato} ${fechaCreacion}.pdf`);

            await generarContenidoPDFdeActaInicioAseadora();
            await generatePDFCertificadoNoExistenciaAseadora();
            await generatePDFConstanciaIdoneidaAseadora();
            await generatePDFDesignacionSupervisorAseadora();
            await generatePDFEstudiosPreviosAseadora();  // ← ÚLTIMA

            limpiarFormulario();
        
        }

        