export class PDFExporter {
    constructor() {
        this.pageWidth = 8.5;
        this.pageHeight = 11;
        this.margin = 1;
    }

    extractTitle(content, date) {
        const trimmed = content.trim();

        if (trimmed === '' || trimmed === '\n\n') {
            return `Entry ${date}`;
        }

        const words = trimmed
            .replace(/\n/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 0)
            .map(word => {
                return word
                    .replace(/[.,!?;:"'()\[\]{}<>]/g, '')
                    .toLowerCase();
            })
            .filter(word => word.length > 0);

        if (words.length >= 4) {
            return `${words[0]}-${words[1]}-${words[2]}-${words[3]}`;
        }

        if (words.length > 0) {
            return words.join('-');
        }

        return `Entry ${date}`;
    }

    async exportEntry(entry, fontSize, fontFamily) {
        if (typeof window.jspdf === 'undefined') {
            console.error('jsPDF library not loaded');
            alert('PDF library not loaded. Please refresh the page and try again.');
            return;
        }

        const { jsPDF } = window.jspdf;

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'in',
            format: 'letter'
        });

        const contentWidth = this.pageWidth - (this.margin * 2);
        const contentHeight = this.pageHeight - (this.margin * 2);
        const trimmedContent = entry.content.trim();

        const pdfFont = this.mapToPDFFont(fontFamily);

        doc.setFont(pdfFont.family, pdfFont.style);

        const fontSizeInPoints = fontSize * 0.75;
        doc.setFontSize(fontSizeInPoints);

        doc.setTextColor(51, 51, 51);

        const lineHeightInches = (fontSize * 1.5) / 72;

        const lines = doc.splitTextToSize(trimmedContent, contentWidth);

        let currentY = this.margin;
        let pageNumber = 1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (currentY + lineHeightInches > (this.pageHeight - this.margin)) {
                doc.addPage();
                currentY = this.margin;
                pageNumber++;

                if (pageNumber > 1000) {
                    console.error('Too many pages, stopping PDF generation');
                    break;
                }
            }

            doc.text(line, this.margin, currentY);
            currentY += lineHeightInches;
        }

        const title = this.extractTitle(entry.content, entry.date);
        const filename = `${title}.pdf`;

        doc.save(filename);
    }

    mapToPDFFont(fontFamily) {
        const fontLower = fontFamily.toLowerCase();

        if (fontLower.includes('lato')) {
            return { family: 'helvetica', style: 'normal' };
        } else if (fontLower.includes('arial')) {
            return { family: 'helvetica', style: 'normal' };
        } else if (fontLower.includes('system') || fontLower.includes('apple')) {
            return { family: 'helvetica', style: 'normal' };
        } else if (fontLower.includes('times') || fontLower.includes('serif')) {
            return { family: 'times', style: 'normal' };
        } else if (fontLower.includes('courier') || fontLower.includes('mono')) {
            return { family: 'courier', style: 'normal' };
        } else {
            return { family: 'helvetica', style: 'normal' };
        }
    }
}
