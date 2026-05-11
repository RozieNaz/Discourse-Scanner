import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import mammoth from 'mammoth';

// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export const cleanText = (text) => {
  let cleaned = text;

  // Remove common ISBN patterns
  cleaned = cleaned.replace(/ISBN(?:-1[03])?:?\s*(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]/gi, '');

  // Remove copyright strings
  cleaned = cleaned.replace(/Copyright\s+(?:©|\(c\))\s+[0-9]{4}\s+.*$/gim, '');

  // Remove simple page numbers (lines that are just numbers)
  cleaned = cleaned.replace(/^\s*\d+\s*$/gm, '');

  // Remove URLs/browser footers
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');

  // Consolidate whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return cleaned.trim();
};

export const parseFile = async (file) => {
  const extension = file.name.split('.').pop().toLowerCase();

  try {
    if (extension === 'txt' || extension === 'md') {
      const text = await file.text();
      return cleanText(text);
    }

    if (extension === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return cleanText(result.value);
    }

    if (extension === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }
      return cleanText(fullText);
    }

    throw new Error('Unsupported file format');
  } catch (error) {
    console.error('Error parsing file:', error);
    throw error;
  }
};
