

export default function ResearchNotes() {
  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-sm mt-8">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h2 className="font-medium text-slate-800">Research Notes</h2>
      </div>
      <div className="p-4">
        <div className="space-y-6">

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2 border-b border-slate-100 pb-1">Summary</h3>
            <textarea
              className="w-full h-24 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-400 resize-y text-slate-600"
              placeholder="Enter brief summary of the text..."
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2 border-b border-slate-100 pb-1">Claims with Page Numbers</h3>
            <textarea
              className="w-full h-24 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-400 resize-y text-slate-600"
              placeholder="e.g., Claim 1 (p. 45)..."
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2 border-b border-slate-100 pb-1">Questions to Think About</h3>
            <textarea
              className="w-full h-24 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-400 resize-y text-slate-600"
              placeholder="Record questions for further investigation..."
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2 border-b border-slate-100 pb-1">Research Uses</h3>
            <textarea
              className="w-full h-24 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-400 resize-y text-slate-600"
              placeholder="How can this text be used in research?"
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2 border-b border-slate-100 pb-1">Areas Detected</h3>
            <textarea
              className="w-full h-24 p-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-400 resize-y text-slate-600"
              placeholder="Summarise detected diagnostic areas..."
            />
          </div>

        </div>
      </div>
    </div>
  );
}
