/**
 * DocStudio Export Service
 * Lazy-loads the docx library to generate Word documents from the Schema.
 */
import { resolveLayout, DEFAULT_LAYOUT_CONFIG } from './layoutPresets.js';

export async function exportDocx(schema, filename = 'DocStudio_Export.docx', layoutConfig = null) {
    if (!schema || !schema.sections || schema.sections.length === 0) {
        throw new Error('Schema is empty. Nothing to export.');
    }

    // Lazy load heavy dependencies
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType, Header, Footer, AlignmentType, PageNumber } = await import('docx');
    const { saveAs } = await import('file-saver');

    // Same resolved layout as the on-screen preview (font, size, spacing, per-side margins)
    const layout = resolveLayout(layoutConfig || DEFAULT_LAYOUT_CONFIG);
    const config = { headerOptions: layout.headerOptions, footerOptions: layout.footerOptions };
    const docFont = layout.fontDocx;
    const docSize = layout.sizePt * 2; // half-points

    const children = [];

    schema.sections.forEach((section, idx) => {
        if (section.title) {
            children.push(new Paragraph({
                text: section.title,
                heading: HeadingLevel.TITLE,
                spacing: { after: 400 }
            }));
        }

        section.blocks.forEach(block => {
            switch (block.type) {
                case 'heading': {
                    const headingMapping = {
                        1: HeadingLevel.HEADING_1,
                        2: HeadingLevel.HEADING_2,
                        3: HeadingLevel.HEADING_3,
                        4: HeadingLevel.HEADING_4,
                        5: HeadingLevel.HEADING_5,
                        6: HeadingLevel.HEADING_6
                    };
                    children.push(new Paragraph({
                        text: block.text,
                        heading: headingMapping[block.level] || HeadingLevel.HEADING_1,
                        spacing: { before: 300, after: 120 }
                    }));
                    break;
                }

                case 'paragraph':
                    children.push(new Paragraph({
                        children: [new TextRun(block.text)],
                        spacing: { after: 200 },
                        alignment: 'both' // Justify
                    }));
                    break;

                case 'list':
                    block.items.forEach(item => {
                        children.push(new Paragraph({
                            text: item,
                            bullet: { level: 0 },
                            spacing: { after: 100 }
                        }));
                    });
                    break;

                case 'quote':
                    children.push(new Paragraph({
                        children: [new TextRun({ text: block.text, italics: true })],
                        spacing: { after: 200, before: 100 }
                    }));
                    break;

                case 'table': {
                    const tableRows = [];
                    // Header Row
                    tableRows.push(
                        new TableRow({
                            children: block.headers.map(h =>
                                new TableCell({
                                    children: [new Paragraph({ text: h, style: 'Strong' })]
                                })
                            )
                        })
                    );
                    // Data Rows
                    block.rows.forEach(r => {
                        tableRows.push(
                            new TableRow({
                                children: r.map(c => new TableCell({ children: [new Paragraph(c)] }))
                            })
                        )
                    });

                    children.push(new Table({
                        rows: tableRows,
                        width: { size: 100, type: WidthType.PERCENTAGE }
                    }));
                    children.push(new Paragraph({ text: '' })); // Spacer
                    break;
                }

                case 'signature':
                    children.push(new Paragraph({
                        children: [
                            new TextRun({ text: "Người báo cáo", bold: true })
                        ],
                        alignment: 'right',
                        spacing: { before: 400, after: 1000 }
                    }));
                    break;

                case 'date_field':
                    children.push(new Paragraph({
                        children: [new TextRun({ text: block.text, italics: true })],
                        alignment: 'right',
                        spacing: { before: 100, after: 100 }
                    }));
                    break;

                case 'closing':
                    children.push(new Paragraph({
                        children: [new TextRun({ text: block.text, bold: true })],
                        alignment: 'right',
                        spacing: { before: 100, after: 100 }
                    }));
                    break;

                case 'page_break':
                    children.push(new Paragraph({ pageBreakBefore: true }));
                    break;
            }
        });

        // Page break between sections
        if (idx < schema.sections.length - 1) {
            children.push(new Paragraph({ pageBreakBefore: true }));
        }
    });

    const headers = config.headerOptions.enabled && config.headerOptions.text ? {
        default: new Header({
            children: [
                new Paragraph({
                    children: [new TextRun({ text: config.headerOptions.text, color: '666666', size: 18, allCaps: true })],
                    alignment: AlignmentType.CENTER
                })
            ]
        })
    } : undefined;

    const footers = config.footerOptions.enabled ? {
        default: new Footer({
            children: [
                new Paragraph({
                    children: config.footerOptions.pageNumbers ? [
                        new TextRun("- "),
                        new TextRun({ children: [PageNumber.CURRENT] }),
                        new TextRun(" -")
                    ] : [],
                    alignment: AlignmentType.CENTER,
                    style: "FooterText"
                })
            ]
        })
    } : undefined;

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        size: docSize,
                        font: docFont,
                        color: '000000'
                    },
                    paragraph: {
                        spacing: { line: layout.docxLine, before: 0, after: 0 }
                    }
                }
            },
            paragraphStyles: [
                {
                    id: "Heading1",
                    name: "Heading 1",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { size: docSize + 8, bold: true, color: '000000' },
                    paragraph: { spacing: { before: 300, after: 120 }, alignment: AlignmentType.CENTER }
                },
                {
                    id: "Heading2",
                    name: "Heading 2",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { size: docSize + 4, bold: true, color: '000000' },
                    paragraph: { spacing: { before: 240, after: 120 } }
                },
                {
                    id: "Heading3",
                    name: "Heading 3",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { size: docSize + 2, bold: true, color: '000000' },
                    paragraph: { spacing: { before: 200, after: 100 } }
                }
            ]
        },
        sections: [{
            properties: {
                page: {
                    size: { width: 11906, height: 16838 }, // A4
                    margin: { ...layout.marginsTwip }
                }
            },
            headers: headers,
            footers: footers,
            children: children
        }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename);
}
