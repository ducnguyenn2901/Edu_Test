import React, { useState, useRef, useEffect } from 'react';
import { Zap, ChevronDown, Copy, Check } from 'lucide-react';

export function InteractiveContentButton({
  onInsert,
  textareaRef,
  _placeholder = 'Nhập nội dung tại đây...',
  onOpenLatexEditor,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate a unique sketch type ID based on timestamp and random value
  const generateSketchId = () => {
    const timestamp = Date.now() % 10000;
    const random = Math.floor(Math.random() * 100);
    return timestamp + random;
  };

  const interactiveTypes = [
    {
      label: 'Bài tập vẽ hình',
      type: 'sketch',
      generatePlaceholder: () => {
        const id = generateSketchId();
        return {
          code: `[in:sketchType_${id}]`,
          displayId: id,
          type: 'sketch',
        };
      },
    },
  ];

  const handleInsertContent = (typeConfig) => {
    if (typeConfig.action === 'open-latex') {
      onOpenLatexEditor?.();
      setIsOpen(false);
      return;
    }

    const placeholder = typeConfig.generatePlaceholder();
    const code = placeholder.code;

    // Insert at cursor position or at end
    if (textareaRef && textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentValue = textarea.value;

      // Add space before if needed
      const before = currentValue.substring(0, start);
      const after = currentValue.substring(end);
      const newValue = before + code + (after && !after.startsWith(' ') ? ' ' : '') + after;

      // Update textarea value
      textarea.value = newValue;

      // Trigger onChange event so React updates state
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);

      // Move cursor after inserted text
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + code.length;
      }, 0);
    } else {
      // Fallback: call onInsert callback
      if (onInsert) {
        onInsert(code);
      }
    }

    // Copy code to clipboard
    navigator.clipboard.writeText(code).catch(() => {
      console.log('Copied:', code);
    });

    setCopiedId(placeholder.displayId);
    setTimeout(() => setCopiedId(null), 2000);
    setIsOpen(false);
  };

  const menuItems = onOpenLatexEditor
    ? [{ label: 'Soạn nội dung (LaTeX)', action: 'open-latex' }, ...interactiveTypes]
    : interactiveTypes;

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-all font-medium text-sm border border-amber-200"
        title="Chèn nội dung tương tác (vẽ hình, v.v.)"
      >
        <Zap className="w-4 h-4" />
        <span>Nội dung tương tác</span>
        {isOpen && <ChevronDown className="w-3 h-3" />}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-4 py-2 mb-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Loại nội dung tương tác
            </p>
          </div>

          {menuItems.map((type, idx) => (
            <button
              key={idx}
              onClick={() => handleInsertContent(type)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors text-left group"
            >
              <Zap className="w-4 h-4 text-amber-600 group-hover:text-amber-700" />
              <div className="flex-1">
                <div>{type.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {type.action === 'open-latex'
                    ? 'Mở màn hình nhập code'
                    : 'Tạo mã [in:sketchType_XX]'}
                </div>
              </div>
              {copiedId !== null && <Check className="w-4 h-4 text-green-500 animate-pulse" />}
            </button>
          ))}

          <div className="border-t border-gray-100 mt-2 pt-2 px-4 py-2">
            <p className="text-xs text-gray-500 leading-relaxed">
              💡 <strong>Mẹo:</strong> Mã tương tác sẽ được chèn vào nội dung. Học sinh có thể tương
              tác trực tiếp với nó.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
