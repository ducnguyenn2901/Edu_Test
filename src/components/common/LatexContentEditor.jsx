import React, { useEffect, useMemo, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.css';
import { X, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

function renderLatexToHtml(latex, displayMode) {
  try {
    return katex.renderToString(latex, { throwOnError: false, displayMode });
  } catch {
    return '<span class="text-red-600">Lỗi cú pháp</span>';
  }
}

function renderMixedContent(content) {
  if (!content) return null;

  const regex = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  const nodes = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(content)) !== null) {
    const start = match.index;
    const end = regex.lastIndex;
    const before = content.slice(lastIndex, start);
    if (before) {
      nodes.push(
        <span key={`t-${key++}`} className="whitespace-pre-wrap">
          {before}
        </span>,
      );
    }

    if (match[1] !== undefined) {
      const latex = match[1];
      nodes.push(
        <div
          key={`d-${key++}`}
          className="my-2"
          dangerouslySetInnerHTML={{ __html: renderLatexToHtml(latex, true) }}
        />,
      );
    } else if (match[2] !== undefined) {
      const latex = match[2];
      nodes.push(
        <span
          key={`i-${key++}`}
          className="inline-block align-middle"
          dangerouslySetInnerHTML={{ __html: renderLatexToHtml(latex, false) }}
        />,
      );
    }

    lastIndex = end;
  }

  const after = content.slice(lastIndex);
  if (after) {
    nodes.push(
      <span key={`t-${key++}`} className="whitespace-pre-wrap">
        {after}
      </span>,
    );
  }

  return <div className="text-gray-900 leading-relaxed">{nodes}</div>;
}

export function LatexContentEditor({
  isOpen,
  title = 'Soạn nội dung (LaTeX)',
  initialValue = '',
  onClose,
  onSave,
  getPreviewQuestion,
}) {
  const [draft, setDraft] = useState(initialValue);

  useEffect(() => {
    if (isOpen) setDraft(initialValue || '');
  }, [isOpen, initialValue]);

  const previewQuestion = useMemo(() => {
    if (!getPreviewQuestion) {
      return { content: draft, type: null, answers: [] };
    }
    return getPreviewQuestion(draft);
  }, [draft, getPreviewQuestion]);

  if (!isOpen) return null;

  const answers =
    Array.isArray(previewQuestion?.answers) && previewQuestion.answers.length > 0
      ? previewQuestion.answers
      : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="text-lg font-bold text-gray-900">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          <div className="p-5 border-b lg:border-b-0 lg:border-r border-gray-200 bg-gray-50">
            <div className="text-sm font-bold text-gray-700 mb-3">Xem trước</div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 overflow-auto max-h-[62vh]">
              <div className="text-sm font-semibold text-gray-700 mb-2">Câu hỏi</div>
              <div className="text-[15px]">
                {renderMixedContent(previewQuestion?.content || '')}
              </div>

              {answers.length > 0 && previewQuestion?.type !== 'Tự luận' && (
                <div className="mt-4 space-y-2">
                  {answers.map((a, idx) => (
                    <div key={a.id || idx} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {a.id || idx + 1}
                      </div>
                      <div className="flex-1">{renderMixedContent(a.content || '')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-gray-700">Code</div>
              <div className="text-xs text-gray-500">Inline: $...$ • Block: $$...$$</div>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full h-[62vh] p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm bg-white"
              placeholder="Nhập nội dung + LaTeX ở đây..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-semibold"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => onSave?.(draft)}
            className={cn(
              'flex items-center gap-2 px-6 py-2 rounded-xl font-semibold transition-colors',
              'bg-blue-600 hover:bg-blue-700 text-white',
            )}
          >
            <Check className="w-4 h-4" />
            Cập nhật
          </button>
        </div>
      </div>
    </div>
  );
}
