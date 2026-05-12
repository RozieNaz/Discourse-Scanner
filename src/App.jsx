import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Archive, CheckSquare, Copy, Database, FilePlus, FolderPlus, Search, Sparkles, Trash2, X } from 'lucide-react';
import { generateChicagoCitation, parseBibtex, parseBibtexText } from './utils/bibParser';
import { parseFile } from './utils/fileParser';
import { scanText } from './scanner';
import BibliographyCard from './components/BibliographyCard';

const STORAGE_KEY = 'discourse-scanner-state-v1';
const DB_NAME = 'discourse-scanner-db';
const DB_STORE = 'state';
const DB_KEY = 'library';

const openLocalDb = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => {
    request.result.createObjectStore(DB_STORE);
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const loadLocalState = async () => {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get(DB_KEY);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveLocalState = async (state) => {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(DB_STORE, 'readwrite').objectStore(DB_STORE).put(state, DB_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const clearLocalState = async () => {
  const db = await openLocalDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(DB_STORE, 'readwrite').objectStore(DB_STORE).delete(DB_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const enhanceEntries = (items) => items.map(entry => ({
  ...entry,
  analysis: scanText(entry.abstract || entry.title)
}));

const inferMetadata = (fileName, text) => {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 30);
  const title = lines.find(line => line.length > 8 && line.length < 160) || fileName.replace(/\.[^.]+$/, '');
  const authorLine = lines.find(line => /^by\s+/i.test(line));
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);

  return {
    title,
    author: authorLine ? authorLine.replace(/^by\s+/i, '') : '',
    year: yearMatch ? yearMatch[0] : 'n.d.',
  };
};

function App() {
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [entries, setEntries] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [analysedIds, setAnalysedIds] = useState(new Set());
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [_error, setError] = useState('');
  const [queueText, setQueueText] = useState('');
  const selectedCount = selectedIds.size;

  const importEntries = (nextEntries, { append = true, analyse = false } = {}) => {
    const enhanced = enhanceEntries(nextEntries);
    setEntries(previous => append ? [...enhanced, ...previous] : enhanced);
    setSelectedIds(new Set(enhanced.map(entry => entry.id)));
    if (analyse) {
      setAnalysedIds(previous => {
        const next = new Set(previous);
        enhanced.forEach(entry => next.add(entry.id));
        return next;
      });
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadDefaultSources = async () => {
      const saved = await loadLocalState().catch(() => null);
      if (saved) {
        try {
          if (Array.isArray(saved.entries) && saved.entries.length) {
            setEntries(saved.entries);
            setSelectedIds(new Set(saved.selectedIds || []));
            setAnalysedIds(new Set(saved.analysedIds || []));
            setHasLoadedStorage(true);
            return;
          }
        } catch (err) {
          console.error(err);
        }
      }

      setIsScanning(true);
      setError('');

      try {
        const response = await fetch(`${import.meta.env.BASE_URL}references.bib`);
        if (!response.ok) throw new Error('Default source list not found.');

        const text = await response.text();
        const parsedEntries = parseBibtexText(text);
        if (isMounted) setEntries(enhanceEntries(parsedEntries));
      } catch (err) {
        console.error(err);
        if (isMounted) setError('Could not load the default source list. You can still import a .bib file.');
      } finally {
        if (isMounted) setHasLoadedStorage(true);
        if (isMounted) setIsScanning(false);
      }
    };

    loadDefaultSources();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage) return;
    saveLocalState({
      entries,
      selectedIds: [...selectedIds],
      analysedIds: [...analysedIds],
    }).catch((err) => {
      console.error(err);
      setError('Your browser refused to save the local library. Try deleting older imports or resetting local data.');
    });
  }, [entries, selectedIds, analysedIds, hasLoadedStorage]);

  const createQueuedEntry = (line, index = 0) => {
    const value = line.trim();
    const isUrl = /^https?:\/\//i.test(value);
    const cleanedTitle = isUrl
      ? value
      : value.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

    return {
      id: `queued-source-${Date.now()}-${index}`,
      type: isUrl ? 'webpage' : 'document',
      title: cleanedTitle || 'Untitled source',
      author: '',
      authors: [],
      year: 'n.d.',
      publisher: '',
      address: '',
      isbn: '',
      language: 'EN',
      abstract: value,
      raw: { source: value },
    };
  };

  const parseImportFile = async (file) => {
    if (!file) return;

    if (file.name.toLowerCase().endsWith('.bib')) {
      return parseBibtex(file);
    }

    let text;
    try {
      text = await parseFile(file);
    } catch {
      text = await file.text();
    }

    if (!text.trim()) throw new Error('No readable text found.');

    const metadata = inferMetadata(file.name, text);
    return [{
      id: `${file.name}-${Date.now()}`,
      type: 'document',
      title: metadata.title,
      author: metadata.author,
      authors: [],
      year: metadata.year,
      publisher: '',
      address: '',
      isbn: '',
      language: 'EN',
      abstract: text,
      raw: { source: file.name },
    }];
  };

  const importFiles = async (fileList) => {
    const files = [...fileList].filter(Boolean);
    if (!files.length) return;

    setIsScanning(true);
    setError('');
    try {
      const parsedGroups = await Promise.all(files.map(parseImportFile));
      importEntries(parsedGroups.flat(), { append: true, analyse: true });
    } catch (err) {
      setError('I could not read that file. Best formats: .txt, .md, .pdf, .docx, or .bib.');
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (event) => {
    await importFiles(event.target.files);
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    await importFiles(event.dataTransfer.files);
  };

  const handleAnalyzeQueuedItems = () => {
    const lines = queueText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (!lines.length) {
      if (selectedCount > 0) {
        analyseSelected();
      } else {
        setAnalysedIds(new Set(entries.map(entry => entry.id)));
      }
      return;
    }

    importEntries(lines.map(createQueuedEntry), { append: true, analyse: true });
    setQueueText('');
    setError('');
  };

  const handleDelete = (idToRemove) => {
    setEntries(entries.filter(entry => entry.id !== idToRemove));
    setSelectedIds(previous => {
      const next = new Set(previous);
      next.delete(idToRemove);
      return next;
    });
    setAnalysedIds(previous => {
      const next = new Set(previous);
      next.delete(idToRemove);
      return next;
    });
  };

  const handleUpdateEntry = (idToUpdate, updates) => {
    setEntries(entries.map(entry => {
      if (entry.id !== idToUpdate) return entry;
      const updatedEntry = {
        ...entry,
        ...updates,
        authors: updates.author !== undefined ? [] : entry.authors,
      };
      return {
        ...updatedEntry,
        analysis: scanText(updatedEntry.abstract || updatedEntry.title),
      };
    }));
  };

  const toggleSelected = (id) => {
    setSelectedIds(previous => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAnalysis = (id) => {
    setAnalysedIds(previous => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(entries.map(entry => entry.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const selectedEntries = () => entries.filter(entry => selectedIds.has(entry.id));

  const copySelectedCitations = () => {
    const citations = selectedEntries().map(generateChicagoCitation).join('\n\n---\n\n');
    navigator.clipboard.writeText(citations);
  };

  const copySelectedTitles = () => {
    const titles = selectedEntries().map(entry => `${entry.author} - ${entry.title}`).join('\n');
    navigator.clipboard.writeText(titles);
  };

  const analyseSelected = () => {
    setAnalysedIds(previous => {
      const next = new Set(previous);
      selectedIds.forEach(id => next.add(id));
      return next;
    });
  };

  const deleteSelected = () => {
    setEntries(entries.filter(entry => !selectedIds.has(entry.id)));
    setAnalysedIds(previous => {
      const next = new Set(previous);
      selectedIds.forEach(id => next.delete(id));
      return next;
    });
    clearSelection();
  };

  const resetLocalLibrary = async () => {
    localStorage.removeItem(STORAGE_KEY);
    await clearLocalState().catch(console.error);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#050817] text-slate-300 font-sans p-8">
      <div className="fixed inset-0 pointer-events-none bg-indigo-950/20" />
      <div className="relative max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-start gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
              <span className="h-14 w-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-950/40 flex items-center justify-center">
                <Archive className="text-white" size={30} />
              </span>
              Discourse Studio
            </h1>
            <p className="text-lg text-slate-400 mt-4 max-w-2xl">
              Extract metadata, prepare Chicago citations, and analyse source discourse in a local browser library.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-2 rounded-xl border border-[#23304a] bg-[#10182a] p-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-[#1b2440]"
            >
              <FilePlus size={16} />
              Files
            </button>
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-[#1b2440]"
            >
              <FolderPlus size={16} />
              Folder
            </button>
          </div>
        </header>

        <section
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
          className="mb-12 rounded-2xl border border-[#23304a] bg-[#10182a]/95 p-6 shadow-2xl shadow-indigo-950/30"
        >
          <div className="grid gap-5">
            <div className="flex items-start gap-4">
              <Search className="mt-3 text-slate-500" size={24} />
              <textarea
                value={queueText}
                onChange={(event) => setQueueText(event.target.value)}
                className="min-h-28 flex-1 resize-y border-0 bg-transparent p-2 text-lg text-slate-200 outline-none placeholder:text-slate-600"
                placeholder="Paste filenames, URLs, titles, or source text... Shift+Enter for multiple lines"
              />
              <button
                type="button"
                onClick={handleAnalyzeQueuedItems}
                className="mt-12 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-950/40 hover:bg-indigo-500"
              >
                <Sparkles size={18} />
                Analyse Items
              </button>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Supports files, folders, bulk paste, URLs, titles, PDFs, DOCX, TXT, Markdown, and BibTeX.</span>
              <span className="inline-flex items-center gap-1">
                <Database size={13} />
                Stored locally
              </span>
            </div>
            <div className="hidden">
              <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} />
              <input ref={folderInputRef} type="file" multiple onChange={handleFileUpload} />
            </div>
          </div>
        </section>

        {entries.length === 0 && !isScanning && !_error && (
          <div className="min-h-[360px] flex flex-col items-center justify-center text-center text-slate-500">
            <div className="h-24 w-24 rounded-full border border-[#23304a] bg-[#10182a] flex items-center justify-center mb-8">
              <Search size={44} className="text-slate-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-300">No items to analyse</h2>
            <p className="mt-3 max-w-md text-slate-500">
              Paste a filename, import source files, or add a folder to start building your local research archive.
            </p>
          </div>
        )}

        {_error && (
          <div className="bg-red-950/50 text-red-400 p-4 rounded-lg mb-8 flex items-start border border-red-900/50">
            <AlertCircle size={18} className="mr-3 mt-0.5 flex-shrink-0" />
            <p>{_error}</p>
          </div>
        )}

        {isScanning && (
          <div className="text-center p-12 bg-[#111322] border border-[#2a2d3d] rounded-lg">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4"></div>
              <p className="text-slate-400">Parsing and analysing sources...</p>
            </div>
          </div>
        )}

        {!isScanning && entries.length > 0 && (
          <div className="space-y-6">
            <div className="sticky top-0 z-10 -mx-2 px-2 py-3 bg-[#0b0c10]/95 backdrop-blur border-b border-[#1e2235]">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm font-medium text-slate-500">
                  Showing {entries.length} entries
                  {selectedCount > 0 && <span className="text-indigo-300"> | {selectedCount} selected</span>}
                  <span className="text-slate-600"> | stored locally</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectedCount === entries.length ? clearSelection : selectAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#1e2235] hover:bg-[#2a2d3d] rounded border border-[#2a2d3d]"
                  >
                    <CheckSquare size={14} />
                    {selectedCount === entries.length ? 'Clear all' : 'Select all'}
                  </button>
                  <button
                    type="button"
                    onClick={resetLocalLibrary}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#1e2235] hover:bg-[#2a2d3d] rounded border border-[#2a2d3d]"
                  >
                    Reset local
                  </button>
                  {selectedCount > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={copySelectedCitations}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#1e2235] hover:bg-[#2a2d3d] rounded border border-[#2a2d3d]"
                      >
                        <Copy size={14} />
                        Copy citations
                      </button>
                      <button
                        type="button"
                        onClick={copySelectedTitles}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#1e2235] hover:bg-[#2a2d3d] rounded border border-[#2a2d3d]"
                      >
                        <Copy size={14} />
                        Copy list
                      </button>
                      <button
                        type="button"
                        onClick={analyseSelected}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-200 hover:text-white bg-indigo-950/50 hover:bg-indigo-700 rounded border border-indigo-700/40"
                      >
                        <Search size={14} />
                        Analyse
                      </button>
                      <button
                        type="button"
                        onClick={deleteSelected}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-300 hover:text-white bg-red-950/30 hover:bg-red-900 rounded border border-red-900/50"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="p-1.5 text-slate-500 hover:text-white bg-[#1e2235] hover:bg-[#2a2d3d] rounded border border-[#2a2d3d]"
                        title="Clear selection"
                      >
                        <X size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            {entries.map(entry => (
              <BibliographyCard
                key={entry.id}
                entry={entry}
                analysis={entry.analysis}
                isSelected={selectedIds.has(entry.id)}
                isAnalysed={analysedIds.has(entry.id)}
                onToggleSelected={() => toggleSelected(entry.id)}
                onToggleAnalysis={() => toggleAnalysis(entry.id)}
                onUpdateEntry={(updates) => handleUpdateEntry(entry.id, updates)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
