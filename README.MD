FORMATO PDF
// GENERAR PDF
async function generatePDF() {
    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [215.9, 355.9]
    });

    // 🔥 NUEVA VARIABLE: Ajuste vertical del texto (en cm, se convierte a mm)
    const topLetter = 1.2; // 1.2 cm = 12 mm

    const margins = {
        top: 45 + (topLetter * 10), // Convierte cm a mm y suma al margen superior
        bottom: 65,
        left: 30,
        right: 25
    };

    const pageWidth = 215.9;
    const pageHeight = 355.9;
    const textWidth = pageWidth - margins.left - margins.right;

    // 🔥 Cargar marca de agua usando fetch
    const watermarkBase64 = await loadWatermark();

    if (watermarkBase64) {
        pdf.addImage(watermarkBase64, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'NONE');     
    }

    pdf.setFont('helvetica');
    pdf.setFontSize(12);

    const text = contentText.value;
    
    // 🔥 CAMBIO: Usar splitTextToSize con hyphens habilitado
    const lines = pdf.splitTextToSize(text, textWidth, { hyphens: true });

    let yPosition = margins.top;
    const lineHeight = 7;

    lines.forEach((line, index) => {
        if (yPosition + lineHeight > pageHeight - margins.bottom) {
            pdf.addPage();
            yPosition = margins.top; // Usa el mismo margen con topLetter incluido

            // Marca de agua en nuevas páginas
            if (watermarkBase64) {
                pdf.addImage(watermarkBase64, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'NONE');     
            }
        }

        const isLastLine = index === lines.length - 1 || lines[index + 1] === '';

        if (!isLastLine && line.trim() !== '') {
            // 🔥 CAMBIO: Justificado con align: 'justify'
            pdf.text(line, margins.left, yPosition, { align: 'justify', maxWidth: textWidth });
        } else {
            pdf.text(line, margins.left, yPosition);
        }

        yPosition += lineHeight;
    });

    pdf.save('documento_tesoreria_municipal.pdf');
}