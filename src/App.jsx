import { useEffect, useState } from 'react';
import { Upload, BookOpen, AlertCircle } from 'lucide-react';
import { parseBibtex, parseBibtexText } from './utils/bibParser';
import { scanText } from './scanner';
import BibliographyCard from './components/BibliographyCard';

const enhanceEntries = (items) => items.map(entry => ({
  ...entry,
  analysis: scanText(entry.abstract || entry.title)
}));

function App() {
  const [entries, setEntries] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [_error, setError] = useState('');

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
      if (file.name.endsWith('.bib')) {
        const parsedEntries = await parseBibtex(file);
        setEntries(enhanceEntries(parsedEntries));
      } else {
        setError('This import currently supports .bib files only.');
      }
    } catch (err) {
      setError('Failed to read this source file. Please check that it is a valid .bib file.');
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleDelete = (idToRemove) => {
    setEntries(entries.filter(entry => entry.id !== idToRemove));
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

          <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded transition-colors shadow-lg shadow-indigo-500/20">
            <Upload size={18} className="mr-2" />
            Import Sources
            <input type="file" className="hidden" accept=".bib" onChange={handleFileUpload} />
          </label>
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
            <div className="text-sm font-medium text-slate-500 mb-4 px-1">
              Showing {entries.length} entries
            </div>
            {entries.map(entry => (
              <BibliographyCard
                key={entry.id}
                entry={entry}
                analysis={entry.analysis}
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
