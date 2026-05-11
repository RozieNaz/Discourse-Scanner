import { Cite } from '@citation-js/core';
import '@citation-js/plugin-bibtex';

const formatEntries = (text) => {
  const cite = new Cite(text);
  const parsed = cite.data;

  return parsed.map(entry => {
    return {
      id: entry.id,
      type: entry.type,
      title: entry.title ? entry.title.replace(/[{}]/g, '') : 'Unknown Title',
      author: entry.author ? formatAuthors(entry.author) : 'Unknown Author',
      year: entry.issued && entry.issued['date-parts'] && entry.issued['date-parts'][0] ? entry.issued['date-parts'][0][0] : 'n.d.',
      publisher: entry.publisher || '',
      address: entry['publisher-place'] || '',
      isbn: entry.ISBN || '',
      language: entry.language ? entry.language.toUpperCase() : 'EN',
      abstract: entry.abstract || '',
      raw: entry,
    };
  });
};

export const parseBibtex = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        resolve(formatEntries(e.target.result));
      } catch (error) {
        console.error("Error parsing bibtex:", error);
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const parseBibtexText = (text) => formatEntries(text);

const formatAuthors = (authorsArray) => {
  if (!authorsArray || !Array.isArray(authorsArray)) return '';
  return authorsArray.map(author => {
    if (author.literal) return author.literal.replace(/[{}]/g, '');
    return `${author.given || ''} ${author.family || ''}`.trim().replace(/[{}]/g, '');
  }).join(', ');
};

export const generateChicagoCitation = (entry) => {
  if (!entry) return '';

  // Basic Chicago (Notes & Bibliography) format approximation
  const author = entry.author || 'Unknown';
  const title = entry.title ? `"${entry.title}"` : '';
  const publisherInfo = [];
  if (entry.address) publisherInfo.push(entry.address);
  if (entry.publisher) publisherInfo.push(entry.publisher);
  if (entry.year) publisherInfo.push(entry.year);

  const pubString = publisherInfo.length > 0 ? `(${publisherInfo.join(': ')})` : '';

  return `${author}. ${title} ${pubString}.`;
};
