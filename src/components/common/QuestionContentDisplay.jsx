import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.css';

function renderLatexToHtml(latex, displayMode) {
  try {
    return katex.renderToString(latex, { throwOnError: false, displayMode });
  } catch {
    return '<span class="text-red-600">Lỗi cú pháp LaTeX</span>';
  }
}

export function QuestionContentDisplay({ content = '', type = 'Trắc nghiệm' }) {
  if (!content) {
    return <div className="text-gray-500 italic">Không có nội dung</div>;
  }

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
          className="my-3"
          dangerouslySetInnerHTML={{ __html: renderLatexToHtml(latex, true) }}
        />,
      );
    } else if (match[2] !== undefined) {
      const latex = match[2];
      nodes.push(
        <span
          key={`i-${key++}`}
          className="inline-block align-middle mx-0.5"
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
