import { BookOpen, Check, ChevronDown, ChevronRight, Copy, FileText, Pencil, Search, Square, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DIAGNOSTIC_CATEGORIES } from '../scanner';
import { generateChicagoCitation, generateChicagoCitationParts } from '../utils/bibParser';

const metadataFields = [
  ['type', 'Type'],
  ['title', 'Title'],
  ['author', 'Author'],
  ['year', 'Year'],
  ['publisher', 'Publisher'],
  ['address', 'Place'],
  ['language', 'Language'],
];

export default function BibliographyCard({
  entry,
  analysis,
  isSelected,
  isAnalysed,
  onToggleSelected,
  onToggleAnalysis,
  onUpdateEntry,
  onDelete,
}) {
  const [isCitationOpen, setIsCitationOpen] = useState(false);
  const [isMetadataOpen, setIsMetadataOpen] = useState(entry.type === 'document');
  const hasAnalysis = analysis && Object.keys(analysis).length > 0;
  const citation = generateChicagoCitationParts(entry);

  const copyCitation = () => {
    navigator.clipboard.writeText(generateChicagoCitation(entry));
  };

  const copyRaw = () => {
    navigator.clipboard.writeText(`${entry.author} - ${entry.title}`);
  };

  const updateField = (field, value) => {
    onUpdateEntry({ [field]: value });
  };

  return (
    <div className={`bg-[#111322] border rounded-lg mb-6 overflow-hidden flex ${isSelected ? 'border-indigo-500/80 shadow-lg shadow-indigo-950/30' : 'border-[#2a2d3d]'}`}>
      <div className="w-16 flex justify-center py-4 bg-[#151726] border-r border-[#2a2d3d]">
        <button
          type="button"
          onClick={onToggleSelected}
          className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-[#1e2235] text-slate-400 hover:text-white'}`}
          title={isSelected ? 'Deselect source' : 'Select source'}
        >
          {isSelected ? <Check size={20} /> : <BookOpen size={20} />}
        </button>
      </div>

      <div className="flex-1 p-5 flex flex-col">
        <div className="flex justify-between items-start gap-6 mb-2">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 flex-wrap">
              <button type="button" onClick={onToggleSelected} className="text-slate-500 hover:text-indigo-300">
                <Square size={14} className={isSelected ? 'fill-indigo-500 text-indigo-500' : ''} />
              </button>
              <span>{entry.title || 'Untitled source'}</span>
              {entry.year && entry.year !== 'n.d.' && (
                <span className="text-xs bg-[#1e2235] text-slate-400 px-2 py-0.5 rounded border border-[#2a2d3d]">
                  {entry.year}
                </span>
              )}
              {entry.language && (
                <span className="text-xs bg-[#1e2235] text-slate-400 px-2 py-0.5 rounded border border-[#2a2d3d] uppercase">
                  {entry.language}
                </span>
              )}
            </h2>
            <div className="text-sm text-[#8b92a5] flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[#64748b]">{entry.author || 'Unknown author'}</span>
              {entry.publisher && (
                <>
                  <span className="text-[#2a2d3d]">|</span>
                  <span>{entry.publisher}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={copyCitation} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#1e2235] hover:bg-[#2a2d3d] rounded border border-[#2a2d3d] transition-colors">
              <FileText size={14} />
              Cite
            </button>
            <button onClick={copyRaw} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#1e2235] hover:bg-[#2a2d3d] rounded border border-[#2a2d3d] transition-colors">
              <Copy size={14} />
              Copy
            </button>
            <button onClick={() => setIsMetadataOpen(!isMetadataOpen)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:text-white bg-indigo-950/50 hover:bg-indigo-700 rounded border border-indigo-700/40 transition-colors">
              <Pencil size={14} />
              Metadata
            </button>
            <button onClick={onToggleAnalysis} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:text-white bg-indigo-950/50 hover:bg-indigo-700 rounded border border-indigo-700/40 transition-colors">
              <Search size={14} />
              Analyse
            </button>
            <button onClick={() => onDelete(entry.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors" title="Delete source">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {isMetadataOpen && (
          <div className="mt-4 rounded-md border border-[#1e2235] bg-[#0b0c16] p-4">
            <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-3">
              Citation Metadata
            </h3>
            <div className="grid gap-3">
              {metadataFields.map(([field, label]) => (
                <label key={field} className="grid grid-cols-[90px_1fr] items-center gap-3 text-sm text-slate-400">
                  <span>{label}</span>
                  <input
                    value={entry[field] || ''}
                    onChange={(event) => updateField(field, event.target.value)}
                    className="rounded border border-[#2a2d3d] bg-[#111322] px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 rounded-md border border-[#1e2235] bg-[#0b0c16]">
          <button
            type="button"
            onClick={() => setIsCitationOpen(!isCitationOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-left text-xs font-bold text-indigo-400 uppercase tracking-wider"
          >
            Chicago Full Note + Bibliography
            {isCitationOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {isCitationOpen && (
            <div className="border-t border-[#1e2235] px-4 py-3 space-y-3 text-sm text-slate-300">
              <p><span className="text-slate-500">Full note:</span> {citation.fullNote}</p>
              <p><span className="text-slate-500">Bibliography:</span> {citation.bibliography}</p>
            </div>
          )}
        </div>

        {isAnalysed && (
          <details className="mt-4 rounded-md border border-[#1e2235] bg-[#0b0c16]">
            <summary className="cursor-pointer px-4 py-3 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Source Analysis
            </summary>
            <div className="border-t border-[#1e2235] p-4">
              <p className="text-sm text-slate-400 mb-4">
                {entry.abstract ? 'Analysed from available source text and metadata.' : 'Limited analysis: this entry only has metadata.'}
              </p>
              {hasAnalysis ? (
                DIAGNOSTIC_CATEGORIES.map(category => {
                  const snippets = analysis[category.id];
                  if (!snippets || snippets.length === 0) return null;

                  return (
                    <div key={category.id} className="mb-4 last:mb-0">
                      <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-2">
                        {category.title}
                      </h4>
                      <div className="space-y-2">
                        {snippets.map((snippet, idx) => (
                          <div key={idx} className="text-sm text-slate-300 italic border-l-2 border-indigo-500/50 pl-3">
                            "{snippet}"
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">No discourse markers were found in this entry.</p>
              )}
            </div>
          </details>
        )}

        <div className="mt-4 flex items-center text-[10px] text-slate-600 font-mono">
          <FileText size={12} className="mr-1" />
          RAW: {entry.author || 'Unknown author'} - {entry.title || 'Untitled source'}
        </div>
      </div>
    </div>
  );
}
