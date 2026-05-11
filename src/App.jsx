import { useEffect, useRef, useState } from 'react';
import { Upload, BookOpen, AlertCircle, CheckSquare, Copy, Search, Trash2, X } from 'lucide-react';
import { generateChicagoCitation, parseBibtex, parseBibtexText } from './utils/bibParser';
import { parseFile } from './utils/fileParser';
import { scanText } from './scanner';
import BibliographyCard from './components/BibliographyCard';

const enhanceEntries = (items) => items.map(entry => ({
  ...entry,
  analysis: scanText(entry.abstract || entry.title)
}));

function App() {
  const fileInputRef = useRef(null);
  const [entries, setEntries] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [analysedIds, setAnalysedIds] = useState(new Set());
  const [isScanning, setIsScanning] = useState(false);
  const [_error, setError] = useState('');
  const selectedCount = selectedIds.size;

  useEffect(() => {
    let isMounted = true;

    const loadDefaultSources = async () => {
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
        if (isMounted) setIsScanning(false);
      }
    };

    loadDefaultSources();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsScanning(true);
    setError('');
    try {
      if (file.name.toLowerCase().endsWith('.bib')) {
        const parsedEntries = await parseBibtex(file);
        setEntries(enhanceEntries(parsedEntries));
      } else {
        const text = await parseFile(file);
        const sourceEntry = {
          id: `${file.name}-${Date.now()}`,
          type: 'document',
          title: file.name.replace(/\.[^.]+$/, ''),
          author: 'Imported document',
          authors: [],
          year: 'n.d.',
          publisher: '',
          address: '',
          isbn: '',
          language: 'EN',
          abstract: text,
          raw: { source: file.name },
        };
        setEntries(enhanceEntries([sourceEntry]));
      }
      setSelectedIds(new Set());
      setAnalysedIds(new Set());
    } catch (err) {
      setError('Failed to read this source file. Try a .bib, .txt, .md, .pdf, or .docx file.');
      console.error(err);
    } finally {
      setIsScanning(false);
      event.target.value = '';
    }
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

  return (
    <div className="min-h-screen bg-[#0b0c10] text-slate-300 font-sans p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <BookOpen className="text-indigo-500" />
              Discourse Scanner
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Import sources and analyse discourse patterns.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Upload size={18} className="mr-2" />
            Import Sources
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            onChange={handleFileUpload}
          />
        </header>

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

        {!isScanning && entries.length === 0 && !_error && (
          <div className="text-center p-16 border-2 border-dashed border-[#2a2d3d] rounded-xl text-slate-500 flex flex-col items-center">
            <BookOpen size={48} className="mb-4 text-[#2a2d3d]" />
            <p className="text-lg font-medium text-slate-400 mb-2">No entries loaded</p>
            <p className="text-sm">Import a source file to begin analysis.</p>
          </div>
        )}

        {!isScanning && entries.length > 0 && (
          <div className="space-y-6">
            <div className="sticky top-0 z-10 -mx-2 px-2 py-3 bg-[#0b0c10]/95 backdrop-blur border-b border-[#1e2235]">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm font-medium text-slate-500">
                  Showing {entries.length} entries
                  {selectedCount > 0 && <span className="text-indigo-300"> | {selectedCount} selected</span>}
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
