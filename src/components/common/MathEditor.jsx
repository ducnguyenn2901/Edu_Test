import React, { useState, useRef, useEffect } from 'react';
import katex from 'katex';
import 'katex/dist/katex.css';
import { Calculator, X, Check } from 'lucide-react';

export function MathEditor({
  value,
  onChange,
  _placeholder = 'Nhập công thức LaTeX...',
  isOpen,
  onClose,
}) {
  const [isModalOpen, setIsModalOpenInternal] = useState(isOpen || false);
  const [latex, setLatex] = useState('');
  const modalRef = useRef(null);

  // Sync external isOpen prop
  useEffect(() => {
    if (isOpen !== undefined) {
      setIsModalOpenInternal(isOpen);
      if (isOpen) {
        setLatex(value || '');
      }
    }
  }, [isOpen, value]);

  const quickFormulas = [
    { label: 'Phương trình bậc 2', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
    { label: 'Đạo hàm', latex: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}" },
    { label: 'Tích phân', latex: '\\int_{a}^{b} f(x) dx' },
    { label: 'Tổng', latex: '\\sum_{n=1}^{\\infty} a_n' },
    { label: 'Ma trận', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
    { label: 'Định lý Pitago', latex: 'a^2 + b^2 = c^2' },
    { label: 'Sin/Cos', latex: '\\sin^2 \\theta + \\cos^2 \\theta = 1' },
    { label: 'Giới hạn', latex: '\\lim_{x \\to \\infty}' },
  ];

  const handleOpenModal = () => {
    setLatex(value || '');
    setIsModalOpenInternal(true);
  };

  const handleCloseModal = () => {
    if (onClose) onClose();
    setIsModalOpenInternal(false);
  };

  const handleInsert = () => {
    if (onChange) {
      onChange(latex);
    }
    handleCloseModal();
  };

  const renderPreview = () => {
    try {
      return {
        __html: katex.renderToString(latex, {
          throwOnError: false,
          displayMode: true,
        }),
      };
    } catch (_e) {
      // Silently handle LaTeX rendering errors
      return { __html: '<span class="text-red-500">Lỗi cú pháp</span>' };
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all font-medium text-sm"
        >
          <Calculator className="w-4 h-4" />
          Chèn công thức
        </button>
        {value && (
          <div className="px-3 py-2 bg-gray-50 rounded-lg flex items-center gap-2 border border-gray-200">
            <span className="text-gray-600 text-sm">Công thức:</span>
            <div
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(value, { throwOnError: false, displayMode: false }),
              }}
            />
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Soạn thảo công thức</h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* Input Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nhập LaTeX
                  </label>
                  <textarea
                    value={latex}
                    onChange={(e) => setLatex(e.target.value)}
                    placeholder="Ví dụ: x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
                    className="w-full h-40 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Công thức nhanh
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {quickFormulas.map((formula, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLatex(formula.latex)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-all"
                      >
                        {formula.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">Xem trước</label>
                <div className="min-h-40 p-6 border border-gray-300 rounded-xl bg-gray-50 flex items-center justify-center">
                  {latex ? (
                    <div dangerouslySetInnerHTML={renderPreview()} />
                  ) : (
                    <p className="text-gray-400 text-sm">Nhập LaTeX để xem trước công thức</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleInsert}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all"
              >
                <Check className="w-4 h-4" />
                Chèn
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
