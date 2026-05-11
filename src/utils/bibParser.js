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
      authors: entry.author || [],
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

const clean = (value) => String(value || '').replace(/[{}]/g, '').trim();

const formatPersonNote = (author) => {
  if (!author) return '';
  if (author.literal) return clean(author.literal);
  return clean(`${author.given || ''} ${author.family || ''}`);
};

const formatPersonBibliography = (author) => {
  if (!author) return '';
  if (author.literal) return clean(author.literal);
  const given = clean(author.given);
  const family = clean(author.family);
  if (given && family) return `${family}, ${given}`;
  return clean(`${given} ${family}`);
};

const formatAuthorsNote = (authors = []) => {
  if (!authors.length) return 'Unknown Author';
  const names = authors.map(formatPersonNote).filter(Boolean);
  if (names.length <= 2) return names.join(' and ');
  return `${names.slice(0, -1).join(', ')}, and ${names.at(-1)}`;
};

const formatAuthorsBibliography = (authors = []) => {
  if (!authors.length) return 'Unknown Author';
  const [first, ...rest] = authors;
  const firstName = formatPersonBibliography(first);
  const restNames = rest.map(formatPersonNote).filter(Boolean);
  if (!restNames.length) return firstName;
  if (restNames.length === 1) return `${firstName}, and ${restNames[0]}`;
  return `${firstName}, ${restNames.slice(0, -1).join(', ')}, and ${restNames.at(-1)}`;
};

const formatEdition = (edition) => {
  const value = clean(edition);
  if (!value) return '';
  if (/ed\.?$/i.test(value)) return value;
  if (/^\d+$/.test(value)) {
    const number = Number(value);
    const suffix = number % 100 >= 11 && number % 100 <= 13
      ? 'th'
      : { 1: 'st', 2: 'nd', 3: 'rd' }[number % 10] || 'th';
    return `${number}${suffix} ed.`;
  }
  return `${value} ed.`;
};

const sentence = (parts) => parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

export const generateChicagoCitationParts = (entry) => {
  if (!entry) return { fullNote: '', bibliography: '' };

  const type = clean(entry.type).toLowerCase();
  const title = clean(entry.title) || 'Unknown Title';
  const year = entry.year && entry.year !== 'n.d.' ? clean(entry.year) : '';
  const publisher = clean(entry.publisher);
  const place = clean(entry.address);
  const edition = formatEdition(entry.raw?.edition);
  const authorsNote = formatAuthorsNote(entry.authors);
  const authorsBibliography = formatAuthorsBibliography(entry.authors);
  const publisherBlock = [place, publisher].filter(Boolean).join(': ');
  const notePublication = [publisherBlock, year].filter(Boolean).join(', ');
  const bibliographyPublication = [publisherBlock, year].filter(Boolean).join(', ');

  if (['book', 'monograph', 'collection'].includes(type)) {
    return {
      fullNote: sentence([
        `${authorsNote},`,
        `${title},`,
        edition,
        notePublication ? `(${notePublication})` : ''
      ]).replace(/\.$/, '') + '.',
      bibliography: sentence([
        `${authorsBibliography}.`,
        `${title}.`,
        edition,
        bibliographyPublication ? `${bibliographyPublication}.` : ''
      ])
    };
  }

  return {
    fullNote: sentence([
      `${authorsNote},`,
      `"${title},"`,
      year ? year : ''
    ]).replace(/\.$/, '') + '.',
    bibliography: sentence([
      `${authorsBibliography}.`,
      `"${title}."`,
      year ? `${year}.` : ''
    ])
  };
};

export const generateChicagoCitation = (entry) => {
  const { fullNote, bibliography } = generateChicagoCitationParts(entry);

  return `Full note:\n${fullNote}\n\nBibliography:\n${bibliography}`;
};
