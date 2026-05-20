import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, MoreHorizontal, Loader2, AlertTriangle, Download, Upload, Trash2, Edit, Eye, Filter, BookOpen, GraduationCap, Layers, ChevronRight, FileDown, FileUp, Clock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { questionApi } from '../../services/api';
import { useToast } from '../../context/ToastContext.jsx';
import { ConfirmModal } from '../../components/common/ConfirmModal.jsx';

function DropdownMenu({ question, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
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

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="p-2.5 text-gray-400 hover:text-brand hover:bg-brand/5 rounded-xl transition-all active:scale-90">
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-4 py-2 mb-1">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thao tác câu hỏi</p>
          </div>
          <button onClick={() => navigate(`/teacher/questions/edit/${question._id}`)} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-300 hover:bg-brand/5 hover:text-brand transition-colors">
            <Edit className="w-4 h-4" /> Chỉnh sửa nội dung
          </button>
          <button onClick={() => {/* View logic */}} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 dark:text-slate-300 hover:bg-brand/5 hover:text-brand transition-colors">
            <Eye className="w-4 h-4" /> Xem chi tiết câu
          </button>
          <div className="border-t border-gray-50 dark:border-slate-700 my-2"></div>
          <button onClick={() => { onDelete(question._id); setIsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors">
            <Trash2 className="w-4 h-4" /> Xóa khỏi hệ thống
          </button>
        </div>
      )}
    </div>
  );
}

export function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ type: '', difficulty: '', subject: '', grade: '' });
  const [onlyNeedsReview, setOnlyNeedsReview] = useState(false);
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionApi.getAll({ 
        search: search || undefined, 
        type: filters.type || undefined, 
        difficulty: filters.difficulty || undefined, 
        subject: filters.subject || undefined, 
        grade: filters.grade || undefined,
        needsReview: onlyNeedsReview ? 'true' : undefined 
      });
      setQuestions(response.data || []);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      setError('Không thể tải danh sách câu hỏi. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { fetchQuestions(); }, 500);
    return () => clearTimeout(timer);
  }, [search, filters, onlyNeedsReview]);

  const openDeleteModal = (id) => {
    setQuestionToDelete(id);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!questionToDelete) return;
    try {
      await questionApi.delete(questionToDelete);
      setQuestions(prev => prev.filter(q => q._id !== questionToDelete));
      showToast({ type: 'success', title: 'Thành công', message: 'Đã xóa câu hỏi thành công.' });
    } catch (err) {
      showToast({ type: 'error', title: 'Lỗi', message: err.response?.data?.message || 'Không thể xóa câu hỏi.' });
    } finally {
      setIsModalOpen(false);
      setQuestionToDelete(null);
    }
  };

  const handleExport = async () => {
    try {
      const res = await questionApi.export();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Questions_${new Date().toLocaleDateString()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showToast({ type: 'error', title: 'Export thất bại', message: 'Không thể xuất file Excel' });
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setLoading(true);
      const res = await questionApi.import(file, { subject: filters.subject, grade: filters.grade });
      showToast({ type: 'success', title: 'Import thành công', message: res.data.message });
      fetchQuestions();
    } catch (err) {
      showToast({ type: 'error', title: 'Import thất bại', message: err.response?.data?.message || 'Lỗi khi nhập file' });
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  if (loading && questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">Đang truy vấn ngân hàng câu hỏi...</p>
      </div>
    );
  }

  return (
    <>
      <ConfirmModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa câu hỏi"
        message="Bạn có chắc chắn muốn xóa câu hỏi này? Hành động này không thể hoàn tác và câu hỏi sẽ bị gỡ khỏi mọi bài thi hiện có."
      />
      
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Ngân hàng câu hỏi</h1>
            <p className="text-gray-500 mt-1 font-medium">Quản lý và tổ chức kho tài liệu giảng dạy của bạn.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-2xl hover:bg-gray-50 shadow-sm transition-all active:scale-95">
              <Upload className="w-4 h-4 text-blue-600" />
              Import
              <input type="file" className="hidden" accept=".xlsx,.xls,.csv,.docx" onChange={handleImport} />
            </label>
            <button onClick={handleExport} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-2xl hover:bg-gray-50 shadow-sm transition-all active:scale-95">
              <Download className="w-4 h-4 text-emerald-600" />
              Export
            </button>
            <Link to="/teacher/questions/new" className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-black rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
              <Plus className="w-4 h-4" />
              Tạo câu hỏi
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Tìm kiếm nội dung, kiến thức..." 
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})} className="px-4 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-600 focus:ring-2 focus:ring-blue-500/20 outline-none">
                <option value="">Tất cả loại</option>
                <option value="Trắc nghiệm">Trắc nghiệm</option>
                <option value="Tự luận">Tự luận</option>
              </select>
              <select value={filters.subject} onChange={(e) => setFilters({...filters, subject: e.target.value})} className="px-4 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-600 focus:ring-2 focus:ring-blue-500/20 outline-none">
                <option value="">Tất cả môn</option>
                <option value="Toán học">Toán học</option>
                <option value="Vật lý">Vật lý</option>
                <option value="Hóa học">Hóa học</option>
                <option value="Sinh học">Sinh học</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Ngữ văn">Ngữ văn</option>
                <option value="Lịch sử">Lịch sử</option>
                <option value="Địa lý">Địa lý</option>
                <option value="Giáo dục công dân">Giáo dục công dân</option>
                <option value="Tin học">Tin học</option>
                <option value="Công nghệ">Công nghệ</option>
              </select>
              <select value={filters.grade} onChange={(e) => setFilters({...filters, grade: e.target.value})} className="px-4 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-600 focus:ring-2 focus:ring-blue-500/20 outline-none">
                <option value="">Tất cả khối</option>
                <option value="Khối 6">Khối 6</option>
                <option value="Khối 7">Khối 7</option>
                <option value="Khối 8">Khối 8</option>
                <option value="Khối 9">Khối 9</option>
                <option value="Khối 10">Khối 10</option>
                <option value="Khối 11">Khối 11</option>
                <option value="Khối 12">Khối 12</option>
                <option value="Đại học">Đại học</option>
              </select>
              <select value={filters.difficulty} onChange={(e) => setFilters({...filters, difficulty: e.target.value})} className="px-4 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-600 focus:ring-2 focus:ring-blue-500/20 outline-none">
                <option value="">Mọi độ khó</option>
                <option value="Dễ">Dễ</option>
                <option value="Trung bình">Trung bình</option>
                <option value="Khó">Khó</option>
              </select>
              <button 
                type="button" 
                onClick={() => setOnlyNeedsReview((prev) => !prev)} 
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all',
                  onlyNeedsReview ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                )}
              >
                <AlertTriangle className="w-4 h-4" />
                Cần review
              </button>
            </div>
          </div>
        </div>

        {/* Questions Grid/List */}
        <div className="grid grid-cols-1 gap-4">
          {questions.map((q) => (
            <div key={q._id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="flex items-start gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-lg">{q.subject}</span>
                    <span className="px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-lg">{q.grade}</span>
                    <span className={cn(
                      "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg",
                      q.difficulty === 'Dễ' ? "bg-emerald-50 text-emerald-600" : 
                      q.difficulty === 'Trung bình' ? "bg-amber-50 text-amber-600" : 
                      "bg-rose-50 text-rose-600"
                    )}>{q.difficulty}</span>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg">{q.type}</span>
                  </div>
                  
                  <div className="text-gray-900 font-bold text-lg leading-relaxed mb-4 line-clamp-2">
                    {q.content}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-500">
                        {q.author?.charAt(0)}
                      </div>
                      <span>{q.author}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(q.updatedAt).toLocaleDateString('vi-VN')}
                    </div>
                    {q.needsReview && (
                      <>
                        <span>•</span>
                        <span className="text-amber-500 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Cần review
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                   <DropdownMenu question={q} onDelete={openDeleteModal} />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-white px-8 py-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between">
          <p className="text-sm font-bold text-gray-400">
            Hiển thị <span className="text-gray-900">{questions.length}</span> câu hỏi
          </p>
          <div className="flex gap-2">
             {/* Pagination can be added here */}
          </div>
        </div>
      </div>
    </>
  );
}

