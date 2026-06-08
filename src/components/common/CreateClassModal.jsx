import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { classroomApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export function CreateClassModal({ isOpen, onClose, onClassCreated, classroom }) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('Khối 12');
  const [subject, setSubject] = useState('Toán học');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (classroom) {
      setName(classroom.name || '');
      setGrade(classroom.grade || 'Khối 12');
      setSubject(classroom.subject || 'Toán học');
    } else {
      setName('');
      setGrade('Khối 12');
      setSubject('Toán học');
    }
  }, [classroom, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast({ type: 'error', message: 'Vui lòng nhập tên lớp học.' });
      return;
    }
    setIsSubmitting(true);
    try {
      if (classroom) {
        // Update existing class
        await classroomApi.update(classroom._id, { name, grade, subject });
        showToast({ type: 'success', message: 'Đã cập nhật lớp học thành công!' });
      } else {
        // Create new class
        await classroomApi.create({ name, grade, subject });
        showToast({ type: 'success', message: 'Đã tạo lớp học thành công!' });
      }
      onClassCreated(); // Refresh list in parent
      onClose();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || (classroom ? 'Cập nhật thất bại.' : 'Tạo lớp học thất bại.');
      showToast({ type: 'error', message: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center animate-in fade-in-25">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 m-4 max-w-md w-full transform transition-all animate-in zoom-in-95 slide-in-from-bottom-4">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {classroom ? 'Chỉnh sửa lớp học' : 'Tạo lớp học mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="className"
              className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"
            >
              Tên lớp học <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="className"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Lớp 12A1 - Nâng cao"
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="grade"
              className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"
            >
              Khối lớp
            </label>
            <select
              id="grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
            >
              <option>Khối 6</option>
              <option>Khối 7</option>
              <option>Khối 8</option>
              <option>Khối 9</option>
              <option>Khối 10</option>
              <option>Khối 11</option>
              <option>Khối 12</option>
              <option>Đại học</option>
              <option>Khác</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5"
            >
              Môn học
            </label>
            <select
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
            >
              <option>Toán học</option>
              <option>Vật lý</option>
              <option>Hóa học</option>
              <option>Sinh học</option>
              <option>Tiếng Anh</option>
              <option>Ngữ văn</option>
              <option>Lịch sử</option>
              <option>Địa lý</option>
              <option>Giáo dục công dân</option>
              <option>Tin học</option>
              <option>Công nghệ</option>
              <option>Khác</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-400 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Đang lưu...' : classroom ? 'Lưu thay đổi' : 'Tạo lớp'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
