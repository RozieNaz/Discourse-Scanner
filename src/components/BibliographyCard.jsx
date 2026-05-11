import { BookOpen, FileText, Trash2, Wand2 } from 'lucide-react';
import { generateChicagoCitation } from '../utils/bibParser';
import { DIAGNOSTIC_CATEGORIES } from '../scanner';

export default function BibliographyCard({ entry, analysis, onDelete }) {
  const handleCite = () => {
    const citation = generateChicagoCitation(entry);
    navigator.clipboard.writeText(citation);
    alert('Citation copied to clipboard!');
  };

  const handleAiCorrection = () => {
    alert('AI Correction feature coming soon!');
  };

  const hasAnalysis = analysis && Object.keys(analysis).length > 0;

  return (
    <div className="bg-[#111322] border border-[#2a2d3d] rounded-lg mb-6 overflow-hidden flex">
      {/* Left Icon Area */}
      <div className="w-16 flex justify-center py-4 bg-[#151726] border-r border-[#2a2d3d]">
        <div className="w-10 h-10 rounded bg-[#1e2235] flex items-center justify-center">
          <BookOpen size={20} className="text-slate-400" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 flex flex-col">
        {/* Header Row */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              {entry.title}
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
            <div className="text-sm text-[#8b92a5] flex items-center gap-2 mt-1">
              <span className="text-[#64748b]">{entry.author}</span>
              {entry.publisher && (
                <>
                  <span className="text-[#2a2d3d]">|</span>
                  <span>{entry.publisher}</span>
                </>
              )}
              {entry.isbn && (
                <>
                  <span className="text-[#2a2d3d]">|</span>
                  <span>{entry.isbn}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCite}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-[#1e2235] hover:bg-[#2a2d3d] rounded border border-[#2a2d3d] transition-colors"
            >
              <FileText size={14} />
              CITE
            </button>
            <button
              onClick={handleAiCorrection}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-[#1e2235] hover:bg-[#2a2d3d] rounded border border-indigo-900/30 transition-colors"
            >
              <Wand2 size={14} />
              AI Correction
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
              title="Delete Entry"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Analysis Section */}
        {hasAnalysis && (
          <div className="mt-4 bg-[#0b0c16] rounded-md border border-[#1e2235] p-4">
            {DIAGNOSTIC_CATEGORIES.map(category => {
              const snippets = analysis[category.id];
              if (!snippets || snippets.length === 0) return null;

              return (
                <div key={category.id} className="mb-4 last:mb-0">
                  <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">
                    {category.title}
                  </h3>
                  <div className="space-y-2">
                    {snippets.map((snippet, idx) => (
                      <div key={idx} className="flex items-start">
                        {category.id === 'thesis' ? (
                          <div className="text-sm text-slate-300 italic border-l-2 border-indigo-500/50 pl-3">
                            "{snippet}"
                          </div>
                        ) : (
                          <>
                            <span className="text-indigo-500 mr-2 mt-1.5 text-[8px]">●</span>
                            <span className="text-sm text-slate-400">{snippet}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-4 flex items-center text-[10px] text-slate-600 font-mono">
          <FileText size={12} className="mr-1" />
          RAW: {entry.author} - {entry.title}
        </div>
      </div>
    </div>
  );
}
