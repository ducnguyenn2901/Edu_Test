import React, { useEffect, useState } from 'react';
import { Calendar, Clock, FileText, Trash2, Tag } from 'lucide-react';
import { examApi, categoryApi } from '../../services/api';
import { useToast } from '../../context/ToastContext.jsx';

export function ExamsManagement() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryMap, setCategoryMap] = useState({});
  const { showToast } = useToast();

  const loadExams = async () => {
    setLoading(true);
    try {
      const [examRes, categoryRes] = await Promise.all([
        examApi.getAll(),
        categoryApi.getAll().catch(() => ({ data: [] })),
      ]);
      setExams(examRes.data || []);
      const map = {};
      (categoryRes.data || []).forEach((c) => {
        map[c._id] = c.name;
      });
      setCategoryMap(map);
    } catch {
      setError('Không thể tải danh sách bài thi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleDelete = async (exam) => {
    const ok = window.confirm(`Xóa đề thi "${exam.title}"?`);
    if (!ok) return;
    try {
      await examApi.delete(exam._id);
      setExams((prev) => prev.filter((e) => e._id !== exam._id));
      showToast({
        type: 'success',
        title: 'Xóa bài thi',
        message: 'Đã xóa bài thi thành công.',
      });
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể xóa bài thi.';
      showToast({
        type: 'error',
        title: 'Xóa bài thi thất bại',
        message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-gray-500">
        Đang tải danh sách bài thi...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <span>Admin</span>
            <span>/</span>
            <span>Exams</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý bài thi</h1>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Tổng cộng <span className="font-semibold text-gray-900">{exams.length}</span> đề thi
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {exams.length === 0 && (
            <div className="px-6 py-10 text-center text-gray-500 text-sm">
              Chưa có đề thi nào.
            </div>
          )}
          {exams.map((exam) => (
            <div
              key={exam._id}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 text-sm">
                    {exam.title || 'Đề thi không tên'}
                  </p>
                  {exam.subject && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs">
                      {exam.subject}
                    </span>
                  )}
                  {exam.grade && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs">
                      {exam.grade}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{exam.duration || 0} phút</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>{exam.questions?.length || 0} câu hỏi</span>
                  </span>
                  {exam.createdAt && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(exam.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </span>
                  )}
                  {Array.isArray(exam.categories) && exam.categories.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span>
                        {exam.categories
                          .map((id) => categoryMap[id])
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(exam)}
                className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
