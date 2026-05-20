import React, { useEffect, useState } from 'react';
import { Plus, Tag, Layers, Trash2, Edit2 } from 'lucide-react';
import { categoryApi } from '../../services/api';
import { cn } from '../../lib/utils';
import { useToast } from '../../context/ToastContext.jsx';

export function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    subject: '',
    grade: '',
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryApi.getAll();
      setCategories(res.data);
    } catch {
      setError('Không thể tải danh mục. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      name: '',
      description: '',
      subject: '',
      grade: '',
    });
    setIsModalOpen(true);
  };

  const openEdit = (category) => {
    setEditingId(category._id);
    setForm({
      name: category.name || '',
      description: category.description || '',
      subject: category.subject || '',
      grade: category.grade || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) {
      setError('Tên danh mục là bắt buộc');
      return;
    }
    try {
      setSaving(true);
      setError('');
      if (editingId) {
        await categoryApi.update(editingId, form);
        showToast({
          type: 'success',
          title: 'Cập nhật danh mục',
          message: 'Đã cập nhật danh mục thành công.',
        });
      } else {
        await categoryApi.create(form);
        showToast({
          type: 'success',
          title: 'Thêm danh mục',
          message: 'Đã tạo danh mục mới thành công.',
        });
      }
      setIsModalOpen(false);
      await loadCategories();
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể lưu danh mục. Vui lòng thử lại.';
      setError(message);
      showToast({
        type: 'error',
        title: 'Lưu danh mục thất bại',
        message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const ok = window.confirm(`Xóa danh mục "${category.name}"?`);
    if (!ok) return;
    try {
      await categoryApi.delete(category._id);
      setCategories((prev) => prev.filter((c) => c._id !== category._id));
      showToast({
        type: 'success',
        title: 'Xóa danh mục',
        message: 'Đã xóa danh mục thành công.',
      });
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể xóa danh mục.';
      showToast({
        type: 'error',
        title: 'Xóa danh mục thất bại',
        message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-gray-500">
        Đang tải danh mục...
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
            <span>Categories</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý danh mục</h1>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Thêm danh mục
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Layers className="w-4 h-4 text-blue-500" />
            <span>Tổng cộng</span>
            <span className="font-semibold text-gray-900">{categories.length}</span>
            <span>danh mục</span>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {categories.length === 0 && (
            <div className="px-6 py-10 text-center text-gray-500 text-sm">
              Chưa có danh mục nào. Bấm "Thêm danh mục" để bắt đầu.
            </div>
          )}
          {categories.map((category) => (
            <div
              key={category._id}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm">
                      {category.name}
                    </p>
                    {category.subject && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs">
                        {category.subject}
                      </span>
                    )}
                    {category.grade && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs">
                        {category.grade}
                      </span>
                    )}
                  </div>
                  {category.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(category)}
                  className={cn(
                    'p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50',
                  )}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingId ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Tên danh mục</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="VD: Ôn tập Toán 12"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Môn học</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="VD: Toán, Lý, Hóa..."
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Khối lớp</label>
                  <input
                    type="text"
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="VD: 10, 11, 12"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Mô tả</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  placeholder="Mục đích của danh mục này..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-70"
                >
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
