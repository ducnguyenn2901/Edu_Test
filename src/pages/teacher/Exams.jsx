import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  Filter,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  Edit3,
  Trash2,
  BarChart3,
  BookmarkPlus,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  examApi,
  questionApi,
  categoryApi,
  teacherApi,
  classroomApi,
} from '../../services/api';
import { cn } from '../../lib/utils';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export function Exams() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myExams, setMyExams] = useState([]);
  const [editingExamId, setEditingExamId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    subject: 'Toán học',
    grade: 'Khối 12',
    duration: 45,
    description: '',
    startAt: '',
    endAt: '',
    maxAttempts: '',
    tags: '',
  });
  const [examSearchTerm, setExamSearchTerm] = useState('');
  const [examSubjectFilter, setExamSubjectFilter] = useState('');
  const [examStatusFilter, setExamStatusFilter] = useState('');
  const [examCategoryFilter, setExamCategoryFilter] = useState('');
  const [examGradeFilter, setExamGradeFilter] = useState('');
  const [examDateFrom, setExamDateFrom] = useState('');
  const [examDateTo, setExamDateTo] = useState('');
  const [scoringEnabled, setScoringEnabled] = useState(false);
  const [negativeMarkRatio, setNegativeMarkRatio] = useState(0);
  const [passScore, setPassScore] = useState(5);
  const [randomEnabled, setRandomEnabled] = useState(false);
  const [randomCount, setRandomCount] = useState('');
  const [randomDifficultyFilter, setRandomDifficultyFilter] = useState('all');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [targetClassIds, setTargetClassIds] = useState([]);
  const [targetStudentIds, setTargetStudentIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [qRes, cRes, eRes] = await Promise.all([
          questionApi.getAll(),
          categoryApi.getAll().catch(() => ({ data: [] })),
          examApi.getMine().catch(() => ({ data: [] })),
        ]);
        setQuestions(qRes.data || []);
        setCategories(cRes.data || []);
        setMyExams(eRes.data || []);
      } catch {
        setError('Không thể tải dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadTargets = async () => {
      if (!user || !user.id) {
        return;
      }
      const [classRes, studentRes] = await Promise.all([
        classroomApi.getAll().catch(() => ({ data: [] })),
        teacherApi.getStudentsByTeacher(user.id).catch(() => ({ data: [] })),
      ]);
      setAvailableClasses(classRes.data || []);
      setAvailableStudents(studentRes.data || []);
    };
    loadTargets();
  }, [user]);

  const toggleQuestion = (id) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      title: '',
      subject: 'Toán học',
      grade: 'Khối 12',
      duration: 45,
      description: '',
      startAt: '',
      endAt: '',
      maxAttempts: '',
      tags: '',
    });
    setSelectedQuestionIds([]);
    setEditingExamId(null);
    setScoringEnabled(false);
    setNegativeMarkRatio(0);
    setPassScore(5);
    setRandomEnabled(false);
    setRandomCount('');
    setRandomDifficultyFilter('all');
    setTargetClassIds([]);
    setTargetStudentIds([]);
    setStudentSearch('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Vui lòng nhập tiêu đề kỳ thi');
      return;
    }
    if (!form.duration || Number(form.duration) <= 0) {
      setError('Vui lòng nhập thời lượng hợp lệ');
      return;
    }
    if (!randomEnabled && selectedQuestionIds.length === 0) {
      setError('Vui lòng chọn ít nhất một câu hỏi hoặc bật chế độ random');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const selectedQuestions = questions.filter((q) =>
        selectedQuestionIds.includes(q._id),
      );

      const examCategories = Array.from(
        new Set(
          selectedQuestions
            .map((q) => q.category)
            .filter((id) => typeof id === 'string' && id.length > 0),
        ),
      );

      const payload = {
        title: form.title,
        subject: form.subject,
        grade: form.grade,
        duration: Number(form.duration),
        description: form.description,
        questions: randomEnabled ? [] : selectedQuestionIds,
        categories: examCategories,
        tags: Array.isArray(form.tags)
          ? form.tags
          : String(form.tags || '')
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean),
      };

      if (scoringEnabled) {
        payload.scoringConfig = {
          enabled: true,
          negativeMarkRatio: Number(negativeMarkRatio) || 0,
          passScore: Number(passScore) || 5,
        };
      }

      if (randomEnabled) {
        const difficultiesMap = {
          easy: ['Dễ', 'Nhận biết'],
          medium: ['Trung bình', 'Thông hiểu'],
          hard: ['Khó', 'Nâng cao', 'Vận dụng', 'Vận dụng cao'],
        };

        const difficulties =
          randomDifficultyFilter === 'all'
            ? []
            : difficultiesMap[randomDifficultyFilter] || [];

        payload.randomConfig = {
          enabled: true,
          subject: form.subject,
          grade: form.grade,
          difficulties,
          tagFilters: [],
          category: selectedCategoryId || null,
          questionCount:
            randomCount !== '' ? Number(randomCount) || null : null,
        };
      }

      payload.targetClasses = targetClassIds;
      payload.targetStudents = targetStudentIds;

      if (form.startAt) {
        payload.startAt = new Date(form.startAt);
      }

      if (form.endAt) {
        payload.endAt = new Date(form.endAt);
      }

      if (form.maxAttempts !== '') {
        payload.maxAttempts = Number(form.maxAttempts);
      }

      if (editingExamId) {
        await examApi.update(editingExamId, payload);
        showToast({
          type: 'success',
          title: 'Cập nhật kỳ thi',
          message: 'Đã cập nhật kỳ thi thành công.',
        });
      } else {
        await examApi.create(payload);
        showToast({
          type: 'success',
          title: 'Tạo kỳ thi',
          message: 'Đã tạo kỳ thi thành công.',
        });
      }

      const refreshed = await examApi.getMine().catch(() => ({ data: [] }));
      setMyExams(refreshed.data || []);
      resetForm();
    } catch (err) {
      const message =
        err?.response?.data?.message || 'Không thể tạo kỳ thi. Vui lòng thử lại.';
      setError(message);
      showToast({
        type: 'error',
        title: 'Lưu kỳ thi thất bại',
        message,
      });
    } finally {
      setSaving(false);
    }
  };

  const startEditExam = (exam) => {
    setEditingExamId(exam._id);

    const dueDateValue = exam.dueDate
      ? new Date(exam.dueDate).toISOString().slice(0, 16)
      : '';

    const startAtValue = exam.startAt
      ? new Date(exam.startAt).toISOString().slice(0, 16)
      : '';

    const endAtValue = exam.endAt
      ? new Date(exam.endAt).toISOString().slice(0, 16)
      : '';

    setForm({
      title: exam.title || '',
      subject: exam.subject || 'Toán học',
      grade: exam.grade || 'Khối 12',
      duration: exam.duration || 45,
      description: exam.description || '',
      startAt: startAtValue,
      endAt: endAtValue || dueDateValue,
      maxAttempts:
        typeof exam.maxAttempts === 'number' && exam.maxAttempts > 0
          ? String(exam.maxAttempts)
          : '',
      tags: Array.isArray(exam.tags) ? exam.tags.join(', ') : '',
    });

    const questionIds = Array.isArray(exam.questions)
      ? exam.questions.map((q) => (typeof q === 'string' ? q : q._id))
      : [];

    setSelectedQuestionIds(questionIds);

    if (exam.scoringConfig) {
      setScoringEnabled(Boolean(exam.scoringConfig.enabled));
      setNegativeMarkRatio(exam.scoringConfig.negativeMarkRatio || 0);
      setPassScore(
        typeof exam.scoringConfig.passScore === 'number'
          ? exam.scoringConfig.passScore
          : 5,
      );
    } else {
      setScoringEnabled(false);
      setNegativeMarkRatio(0);
      setPassScore(5);
    }

    if (exam.randomConfig && exam.randomConfig.enabled) {
      setRandomEnabled(true);
      setRandomCount(
        typeof exam.randomConfig.questionCount === 'number' &&
          exam.randomConfig.questionCount > 0
          ? String(exam.randomConfig.questionCount)
          : '',
      );

      const diffs = exam.randomConfig.difficulties || [];
      if (
        diffs.length === 0 ||
        diffs.length >= 4
      ) {
        setRandomDifficultyFilter('all');
      } else if (
        diffs.every((d) => ['Dễ', 'Nhận biết'].includes(d))
      ) {
        setRandomDifficultyFilter('easy');
      } else if (
        diffs.every((d) => ['Trung bình', 'Thông hiểu'].includes(d))
      ) {
        setRandomDifficultyFilter('medium');
      } else {
        setRandomDifficultyFilter('hard');
      }
    } else {
      setRandomEnabled(false);
      setRandomCount('');
      setRandomDifficultyFilter('all');
    }
    const examTargetClasses = Array.isArray(exam.targetClasses)
      ? exam.targetClasses.map((c) => (typeof c === 'string' ? c : c._id))
      : [];
    const examTargetStudents = Array.isArray(exam.targetStudents)
      ? exam.targetStudents.map((s) => (typeof s === 'string' ? s : s._id))
      : [];
    setTargetClassIds(examTargetClasses);
    setTargetStudentIds(examTargetStudents);
    setSuccess('');
    setError('');
  };

  const handleStatusChange = async (exam, newStatus) => {
    try {
      setError('');
      setSuccess('');
      await examApi.update(exam._id, { status: newStatus });
      const refreshed = await examApi.getMine().catch(() => ({ data: [] }));
      setMyExams(refreshed.data || []);
      if (editingExamId === exam._id) {
        startEditExam(
          refreshed.data.find((e) => e._id === exam._id) || exam,
        );
      }
      setSuccess('Đã cập nhật trạng thái kỳ thi');
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        'Không thể cập nhật trạng thái kỳ thi. Vui lòng thử lại.';
      setError(message);
    }
  };

  const handleDeleteExam = async (exam) => {
    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn xóa kỳ thi này? Hành động không thể hoàn tác.',
    );
    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await examApi.delete(exam._id);
      const refreshed = await examApi.getMine().catch(() => ({ data: [] }));
      setMyExams(refreshed.data || []);
      if (editingExamId === exam._id) {
        resetForm();
      }
      setSuccess('Đã xóa kỳ thi thành công');
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        'Không thể xóa kỳ thi. Vui lòng thử lại.';
      setError(message);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const normalizeGrade = (g) => g?.toString().replace('Lớp', 'Khối').trim().toLowerCase();
    const normalizeSubject = (s) => s?.toString().trim().toLowerCase();

    // Lọc theo môn học của kì thi
    if (form.subject && normalizeSubject(q.subject) !== normalizeSubject(form.subject)) {
      return false;
    }
    // Lọc theo khối lớp của kì thi
    if (form.grade && normalizeGrade(q.grade) !== normalizeGrade(form.grade)) {
      return false;
    }
    // Lọc thêm theo danh mục nếu có chọn
    if (selectedCategoryId && q.category !== selectedCategoryId) {
      return false;
    }
    return true;
  });

  const availableStudentsToSelect = availableStudents.filter(s => {
    const isSelected = targetStudentIds.includes(s._id);
    if (isSelected) return false;
    if (!studentSearch) return true;
    const search = studentSearch.toLowerCase();
    return s.name.toLowerCase().includes(search) || (s.email && s.email.toLowerCase().includes(search));
  });

  const selectedStudents = availableStudents.filter(s => targetStudentIds.includes(s._id));

  const filteredMyExams = myExams.filter((exam) => {
    const titleMatch = exam.title
      .toLowerCase()
      .includes(examSearchTerm.toLowerCase());

    if (!titleMatch) {
      return false;
    }

    if (examSubjectFilter && exam.subject !== examSubjectFilter) {
      return false;
    }

    const examStatus = exam.status || 'Draft';
    if (examStatusFilter && examStatus !== examStatusFilter) {
      return false;
    }

    if (examCategoryFilter) {
      const categoriesOfExam = Array.isArray(exam.categories)
        ? exam.categories.map((c) => (typeof c === 'string' ? c : c?._id))
        : [];
      if (!categoriesOfExam.includes(examCategoryFilter)) {
        return false;
      }
    }

    const examGrade = exam.grade || (
      Array.isArray(exam.questions) && exam.questions.length > 0
        ? (typeof exam.questions[0] === 'string' ? '' : exam.questions[0].grade)
        : ''
    );

    if (examGradeFilter && examGrade !== examGradeFilter) {
      return false;
    }

    if (examDateFrom || examDateTo) {
      const baseDate = exam.startAt || exam.createdAt;
      if (!baseDate) {
        return false;
      }
      const d = new Date(baseDate);
      if (examDateFrom) {
        const from = new Date(examDateFrom);
        if (d < from) {
          return false;
        }
      }
      if (examDateTo) {
        const to = new Date(examDateTo);
        to.setHours(23, 59, 59, 999);
        if (d > to) {
          return false;
        }
      }
    }

    return true;
  });

  const handleCloneExam = async (exam) => {
    const confirmed = window.confirm(
      'Tạo bản sao của kỳ thi này? Bạn có thể chỉnh sửa rồi publish sau.',
    );
    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await examApi.clone(exam._id);
      const refreshed = await examApi.getMine().catch(() => ({ data: [] }));
      setMyExams(refreshed.data || []);
      showToast({
        type: 'success',
        title: 'Sao chép kỳ thi',
        message: 'Đã nhân bản kỳ thi thành công.',
      });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        'Không thể nhân bản kỳ thi. Vui lòng thử lại.';
      setError(message);
      showToast({
        type: 'error',
        title: 'Sao chép kỳ thi thất bại',
        message,
      });
    }
  };

  const handleSaveTemplate = async (exam) => {
    const confirmed = window.confirm(
      'Lưu kỳ thi này thành mẫu? Bạn có thể tạo bản sao từ mẫu cho các lớp khác.',
    );
    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await examApi.createTemplate(exam._id);
      const refreshed = await examApi.getMine().catch(() => ({ data: [] }));
      setMyExams(refreshed.data || []);
      showToast({
        type: 'success',
        title: 'Lưu mẫu đề',
        message: 'Đã lưu kỳ thi thành mẫu đề thành công.',
      });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        'Không thể lưu mẫu đề. Vui lòng thử lại.';
      setError(message);
      showToast({
        type: 'error',
        title: 'Lưu mẫu đề thất bại',
        message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-500">
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-4xl bg-gradient-brand p-8 text-white shadow-premium">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {editingExamId ? 'Chỉnh sửa kỳ thi' : 'Quản lý kỳ thi'}
            </h1>
            <p className="mt-2 text-blue-100 max-w-xl">
              Thiết kế bài kiểm tra chuyên nghiệp, linh hoạt với ngân hàng câu hỏi thông minh và cấu hình chấm điểm nâng cao.
            </p>
          </div>
          {!editingExamId && (
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="text-center px-4 border-r border-white/20">
                <p className="text-2xl font-bold">{myExams.length}</p>
                <p className="text-xs text-blue-100 uppercase tracking-wider">Kỳ thi</p>
              </div>
              <div className="text-center px-4">
                <p className="text-2xl font-bold">
                  {myExams.filter(e => e.status === 'Published').length}
                </p>
                <p className="text-xs text-blue-100 uppercase tracking-wider">Đang mở</p>
              </div>
            </div>
          )}
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl" />
      </div>

      {error && (
        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-danger-50 border border-danger-500/20 text-danger-600 text-sm animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-accent-50 border border-accent-500/20 text-accent-600 text-sm animate-in slide-in-from-top-2">
          <CheckSquare className="w-5 h-5 shrink-0" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-premium p-8 space-y-6 sticky top-24"
          >
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                <Edit3 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Thông tin cơ bản
              </h2>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tiêu đề kỳ thi</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:text-white"
                  placeholder="VD: Kiểm tra 1 tiết Toán 12 - Chương 1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Môn học</label>
                  <select
                    value={form.subject}
                    onChange={(e) => handleFormChange('subject', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:text-white appearance-none"
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
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Khối lớp</label>
                  <select
                    value={form.grade}
                    onChange={(e) => handleFormChange('grade', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:text-white appearance-none"
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Thời lượng (phút)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.duration}
                    onChange={(e) => handleFormChange('duration', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Số lần làm tối đa</label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxAttempts}
                    onChange={(e) => handleFormChange('maxAttempts', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:text-white"
                    placeholder="Không giới hạn"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Bắt đầu từ</label>
                  <input
                    type="datetime-local"
                    value={form.startAt}
                    onChange={(e) => handleFormChange('startAt', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Kết thúc lúc</label>
                  <input
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(e) => handleFormChange('endAt', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mô tả chi tiết</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:text-white resize-none"
                  placeholder="Hướng dẫn hoặc lưu ý cho thí sinh..."
                />
              </div>
            </div>

            {/* Target Audience Section */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-bold">Đối tượng tham gia</span>
                </div>
                {(targetClassIds.length > 0 || targetStudentIds.length > 0) && (
                  <button 
                    type="button" 
                    onClick={() => { setTargetClassIds([]); setTargetStudentIds([]); }}
                    className="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-wider"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {/* Classes Selection */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Theo lớp học</label>
                  <div className="flex flex-wrap gap-2">
                    {availableClasses.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Chưa có lớp học nào</p>
                    ) : (
                      availableClasses.map((cls) => {
                        const isSelected = targetClassIds.includes(cls._id);
                        return (
                          <button
                            key={cls._id}
                            type="button"
                            onClick={() => setTargetClassIds(prev => 
                              prev.includes(cls._id) ? prev.filter(x => x !== cls._id) : [...prev, cls._id]
                            )}
                            className={cn(
                              'px-3 py-1.5 rounded-xl border text-xs font-medium transition-all',
                              isSelected
                                ? 'border-brand-500 bg-brand-500 text-white shadow-md'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-brand-300'
                            )}
                          >
                            {cls.name}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Students Selection */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Học sinh cụ thể</label>
                  
                  {/* Selected Students Tags */}
                  {selectedStudents.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {selectedStudents.map(s => (
                        <span 
                          key={s._id} 
                          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-[10px] font-bold border border-brand-100 dark:border-brand-800"
                        >
                          {s.name}
                          <button 
                            type="button" 
                            onClick={() => setTargetStudentIds(prev => prev.filter(id => id !== s._id))}
                            className="hover:text-rose-500 transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Tìm và chọn học sinh..."
                      className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20 outline-none dark:text-white transition-all"
                    />
                    
                    {/* Search Results Dropdown */}
                    {studentSearch && availableStudentsToSelect.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 mt-2 max-h-40 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl divide-y divide-slate-50 dark:divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
                        {availableStudentsToSelect.map(s => (
                          <button
                            key={s._id}
                            type="button"
                            onClick={() => {
                              setTargetStudentIds(prev => [...prev, s._id]);
                              setStudentSearch('');
                            }}
                            className="w-full px-4 py-2.5 text-left text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group"
                          >
                            <span>{s.name}</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-brand-500 font-bold uppercase">Thêm</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {(targetClassIds.length === 0 && targetStudentIds.length === 0) && (
                    <p className="text-[10px] text-slate-400 text-center italic mt-2">
                      Để trống nếu muốn tất cả học sinh đều có thể tham gia
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Config Toggles */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    scoringEnabled ? "bg-accent-100 text-accent-600" : "bg-slate-200 text-slate-400"
                  )}>
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <label htmlFor="scoring-enabled" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Chấm điểm nâng cao
                  </label>
                </div>
                <input
                  id="scoring-enabled"
                  type="checkbox"
                  checked={scoringEnabled}
                  onChange={(e) => setScoringEnabled(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 transition-all cursor-pointer"
                />
              </div>

              {scoringEnabled && (
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-accent-100 bg-accent-50/30 animate-in zoom-in-95">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-accent-700 uppercase tracking-wider">Hệ số âm</label>
                    <input
                      type="number"
                      step="0.1"
                      value={negativeMarkRatio}
                      onChange={(e) => setNegativeMarkRatio(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-accent-200 rounded-lg text-sm focus:ring-2 focus:ring-accent-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-accent-700 uppercase tracking-wider">Điểm đạt</label>
                    <input
                      type="number"
                      max="10"
                      step="0.1"
                      value={passScore}
                      onChange={(e) => setPassScore(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-accent-200 rounded-lg text-sm focus:ring-2 focus:ring-accent-500 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    randomEnabled ? "bg-warning-100 text-warning-600" : "bg-slate-200 text-slate-400"
                  )}>
                    <Filter className="w-4 h-4" />
                  </div>
                  <label htmlFor="random-enabled" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Câu hỏi ngẫu nhiên
                  </label>
                </div>
                <input
                  id="random-enabled"
                  type="checkbox"
                  checked={randomEnabled}
                  onChange={(e) => setRandomEnabled(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 transition-all cursor-pointer"
                />
              </div>

              {randomEnabled && (
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-warning-100 bg-warning-50/30 animate-in zoom-in-95">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-warning-700 uppercase tracking-wider">Số câu</label>
                    <input
                      type="number"
                      value={randomCount}
                      onChange={(e) => setRandomCount(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-warning-200 rounded-lg text-sm focus:ring-2 focus:ring-warning-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-warning-700 uppercase tracking-wider">Độ khó</label>
                    <select
                      value={randomDifficultyFilter}
                      onChange={(e) => setRandomDifficultyFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-warning-200 rounded-lg text-sm focus:ring-2 focus:ring-warning-500 outline-none"
                    >
                      <option value="all">Tất cả</option>
                      <option value="easy">Dễ</option>
                      <option value="medium">Vừa</option>
                      <option value="hard">Khó</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-brand text-white rounded-2xl font-bold shadow-premium hover:shadow-premium-hover hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:translate-y-0"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <BookmarkPlus className="w-5 h-5" />
                )}
                {saving ? 'Đang xử lý...' : editingExamId ? 'Cập nhật kỳ thi' : 'Tạo kỳ thi mới'}
              </button>
              {editingExamId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full mt-3 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Hủy chỉnh sửa
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Content Management */}
        <div className="lg:col-span-7 space-y-8">
          {/* Question Selector */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-premium overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Chọn câu hỏi</h2>
                  <p className="text-xs text-slate-500">Đã chọn {selectedQuestionIds.length} câu</p>
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none dark:text-white"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 scrollbar-hide">
              {filteredQuestions.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Filter className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="font-medium">Không tìm thấy câu hỏi phù hợp</p>
                  <p className="text-xs mt-1 text-slate-400">
                    Môn: <span className="font-bold text-brand-600">{form.subject}</span> • Khối: <span className="font-bold text-brand-600">{form.grade}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/teacher/questions')}
                    className="mt-4 px-4 py-2 bg-brand-50 text-brand-600 rounded-xl text-xs font-bold hover:bg-brand-100 transition-colors"
                  >
                    Tạo câu hỏi mới
                  </button>
                </div>
              ) : (
                filteredQuestions.map((q) => {
                  const isSelected = selectedQuestionIds.includes(q._id);
                  return (
                    <button
                      key={q._id}
                      type="button"
                      onClick={() => toggleQuestion(q._id)}
                      className={cn(
                        "w-full p-5 flex gap-4 text-left transition-all group",
                        isSelected ? "bg-brand-50/50 dark:bg-brand-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <div className={cn(
                        "mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0",
                        isSelected ? "bg-brand-500 border-brand-500 text-white" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      )}>
                        {isSelected && <CheckSquare className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 mb-2 group-hover:text-brand-600 transition-colors">
                          {q.content}
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {q.type}
                          </span>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                            q.difficulty === 'Dễ' || q.difficulty === 'Nhận biết'
                              ? 'bg-emerald-100 text-emerald-700'
                              : q.difficulty === 'Trung bình' || q.difficulty === 'Thông hiểu'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-rose-100 text-rose-700',
                          )}>
                            {q.difficulty}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {q.subject} • {q.grade}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* My Exams List */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Kỳ thi đã tạo</h2>
                  <p className="text-xs text-slate-500">Tổng số {myExams.length} bài thi</p>
                </div>
              </div>
            </div>

            {/* List Filters */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 shadow-sm">
              <div className="relative col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm tên kỳ thi..."
                  value={examSearchTerm}
                  onChange={(e) => setExamSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500/20 dark:text-white"
                />
              </div>
              <select
                value={examSubjectFilter}
                onChange={(e) => setExamSubjectFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs outline-none dark:text-white"
              >
                <option value="">Tất cả môn</option>
                <option>Toán học</option>
                <option>Vật lý</option>
                <option>Hóa học</option>
                <option>Sinh học</option>
                <option>Tiếng Anh</option>
                <option>Lịch sử</option>
                <option>Địa lý</option>
              </select>
              <select
                value={examGradeFilter}
                onChange={(e) => setExamGradeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs outline-none dark:text-white"
              >
                <option value="">Tất cả khối</option>
                <option>Khối 6</option>
                <option>Khối 7</option>
                <option>Khối 8</option>
                <option>Khối 9</option>
                <option>Khối 10</option>
                <option>Khối 11</option>
                <option>Khối 12</option>
              </select>
              <select
                value={examStatusFilter}
                onChange={(e) => setExamStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs outline-none dark:text-white"
              >
                <option value="">Trạng thái</option>
                <option value="Draft">Bản nháp</option>
                <option value="Published">Đã đăng</option>
                <option value="Archived">Đã lưu trữ</option>
              </select>
              <button
                onClick={() => {
                  setExamSearchTerm('');
                  setExamSubjectFilter('');
                  setExamGradeFilter('');
                  setExamStatusFilter('');
                }}
                className="px-3 py-2 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
              >
                Đặt lại
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMyExams.map((exam) => (
                <div
                  key={exam._id}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-premium p-6 hover:shadow-premium-hover transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-sm",
                      exam.status === 'Published'
                        ? 'bg-emerald-500 text-white'
                        : exam.status === 'Archived'
                        ? 'bg-slate-500 text-white'
                        : 'bg-amber-500 text-white',
                    )}>
                      {exam.status || 'Draft'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                      <BookmarkPlus className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {exam.subject}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-brand-600 transition-colors">
                    {exam.title}
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-6">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {exam.duration}m
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5" />
                      {exam.questions?.length || 0} câu
                    </div>
                    {exam.grade && (
                      <div className="flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5" />
                        {exam.grade}
                      </div>
                    )}
                    {exam.isTemplate && (
                      <div className="flex items-center gap-1.5 text-purple-600 font-bold">
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        MẪU
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {exam.tags?.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-500 font-medium border border-slate-100 dark:border-slate-700">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-50 dark:border-slate-800">
                    <button
                      onClick={() => startEditExam(exam)}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-bold hover:bg-brand-100 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Sửa
                    </button>
                    <button
                      onClick={() => navigate(`/teacher/exams/${exam._id}/results`)}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 transition-colors"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      Báo cáo
                    </button>
                    <div className="col-span-2 flex gap-2">
                      <button
                        onClick={() => handleCloneExam(exam)}
                        className="flex-1 py-2 text-[10px] font-bold text-slate-400 hover:text-purple-600 transition-colors"
                      >
                        Nhân bản
                      </button>
                      <button
                        onClick={() => handleSaveTemplate(exam)}
                        className="flex-1 py-2 text-[10px] font-bold text-slate-400 hover:text-amber-600 transition-colors"
                      >
                        Lưu mẫu
                      </button>
                      <button
                        onClick={() => handleDeleteExam(exam)}
                        className="flex-1 py-2 text-[10px] font-bold text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

