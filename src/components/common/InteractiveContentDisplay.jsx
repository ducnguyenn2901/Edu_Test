import React, { useState } from 'react';
import { Copy, Check, X } from 'lucide-react';

export function InteractiveContentDisplay({ content }) {
  const [copied, setCopied] = useState(false);

  if (!content) return null;

  // Extract all interactive content placeholders from content
  const placeholderRegex = /\[in:(\w+)_(\d+)\]/g;
  const matches = [...content.matchAll(placeholderRegex)];

  if (matches.length === 0) return null;

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 space-y-2">
      {matches.map((match, _idx) => {
        const fullCode = match[0];
        const type = match[1];
        const displayType = type === 'sketchType' ? '📐 Bài tập vẽ hình' : type;

        return (
          <div
            key={_idx}
            className="flex items-center justify-between gap-3 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-amber-700">{displayType}</span>
                <code className="text-xs bg-white px-2 py-0.5 rounded border border-amber-100 text-amber-900 font-mono">
                  {fullCode}
                </code>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(fullCode)}
              className="p-1.5 hover:bg-amber-100 rounded transition-colors flex-shrink-0"
              title="Sao chép mã"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-amber-600" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
