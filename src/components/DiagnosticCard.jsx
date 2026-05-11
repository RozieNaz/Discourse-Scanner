import { useState } from 'react';
import { ChevronDown, ChevronRight, Tag } from 'lucide-react';

export default function DiagnosticCard({ category, snippets }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!snippets || snippets.length === 0) return null;

  return (
    <div className="border border-slate-200 rounded-md mb-4 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        <div>
          <h3 className="font-medium text-slate-800 text-sm">{category.title}</h3>
          <p className="text-xs text-slate-500 mt-1">{category.question}</p>
        </div>
        {isOpen ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-200">
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Evidence Snippets</h4>
            <ul className="space-y-2">
              {snippets.map((snippet, idx) => (
                <li key={idx} className="text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 italic">
                  "{snippet}"
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
            {category.tags.map(tag => (
              <span key={tag} className="inline-flex items-center text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                <Tag size={10} className="mr-1" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
