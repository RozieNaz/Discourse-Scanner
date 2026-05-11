import { useState } from 'react';
import { Upload, BookOpen, AlertCircle } from 'lucide-react';
import { parseBibtex } from './utils/bibParser';
import { scanText } from './scanner';
import BibliographyCard from './components/BibliographyCard';

function App() {
  const [entries, setEntries] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [_error, setError] = useState('');

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsScanning(true);
    setError('');
    try {
      if (file.name.endsWith('.bib')) {
        const parsedEntries = await parseBibtex(file);

        // Enhance entries with analysis
        const enhancedEntries = parsedEntries.map(entry => ({
          ...entry,
          analysis: scanText(entry.abstract || entry.title) // scan abstract, fallback to title
        }));

        setEntries(enhancedEntries);
      } else {
        setError('Please upload a .bib file.');
      }
    } catch (err) {
      setError('Failed to parse file. Please ensure it is a valid BibTeX file.');
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
              Upload a .bib file to extract and analyse discourse patterns.
            </p>
          </div>

          <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded transition-colors shadow-lg shadow-indigo-500/20">
            <Upload size={18} className="mr-2" />
            Upload Bibliography (.bib)
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
              <p className="text-slate-400">Parsing and analysing bibliography...</p>
            </div>
          </div>
        )}

        {!isScanning && entries.length === 0 && !_error && (
          <div className="text-center p-16 border-2 border-dashed border-[#2a2d3d] rounded-xl text-slate-500 flex flex-col items-center">
            <BookOpen size={48} className="mb-4 text-[#2a2d3d]" />
            <p className="text-lg font-medium text-slate-400 mb-2">No entries loaded</p>
            <p className="text-sm">Upload a BibTeX file to begin analysis.</p>
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
