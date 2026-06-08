/* eslint-disable no-unused-vars */
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
  Upload,
  FileJson,
  Layout,
  ScanFace,
  FileImage,
  FileSpreadsheet,
  Hand,
  Type,
  ChevronDown,
  ChevronUp,
  FileType,
  Plus,
  FolderPlus,
  Table,
  List,
  XCircle,
  File,
  FileText,
  ArrowLeft,
  Save,
  Info,
  Loader2,
  Calculator,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  examApi,
  examFolderApi,
  questionApi,
  categoryApi,
  teacherApi,
  classroomApi,
} from '../../services/api';
import { cn } from '../../lib/utils';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { MathEditor } from '../../components/common/MathEditor';
import { LatexContentEditor } from '../../components/common/LatexContentEditor';

export function Exams() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Common state
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'create' | 'quick-create'

  // List view state
  const [myExams, setMyExams] = useState([]);
  const [selectedExams, setSelectedExams] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [examFolders, setExamFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState('all');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderNameInput, setFolderNameInput] = useState('');

  // Quick create view state
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [targetClassIds, setTargetClassIds] = useState([]);
  const [targetStudentIds, setTargetStudentIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [scoringEnabled, setScoringEnabled] = useState(false);
  const [negativeMarkRatio, setNegativeMarkRatio] = useState(0);
  const [passScore, setPassScore] = useState(5);
  const [randomEnabled, setRandomEnabled] = useState(false);
  const [randomCount, setRandomCount] = useState('');
  const [randomDifficultyFilter, setRandomDifficultyFilter] = useState('all');

  const [form, setForm] = useState({
    title: '',
    subject: 'Toán học',
    grade: 'Khối 12',
    duration: 45,
    price: 0,
    folder: null,
    description: '',
    startAt: '',
    endAt: '',
    maxAttempts: '',
    tags: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  // File upload state
  const [showOnlineOptions, setShowOnlineOptions] = useState(true);
  const [showOfflineOptions, setShowOfflineOptions] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // Competency assessment state
  const [competencyConfig, setCompetencyConfig] = useState({
    title: '',
    subject: 'Toán học',
    grade: 'Khối 12',
    duration: 60,
    description: '',
    status: 'Published',
    startAt: '',
    endAt: '',
    maxAttempts: '',
    tags: '',
    totalQuestions: 20,
    difficultyDistribution: {
      easy: 30, // percentage
      medium: 50,
      hard: 20,
    },
    categoryDistribution: [],
    targetClasses: [],
    targetStudents: [],
  });

  const [competencyStructure, setCompetencyStructure] = useState([
    {
      id: 'c1',
      title: 'Toán học và xử lý số liệu',
      expanded: true,
      topics: [],
      exams: [],
    },
    {
      id: 'c2',
      title: 'Ngôn ngữ và văn học',
      expanded: true,
      topics: [],
      exams: [],
    },
    {
      id: 'c3',
      title: 'Khoa học và tiếng anh',
      expanded: true,
      topics: [
        {
          id: 'c3-1',
          title: 'Khoa học',
          expanded: true,
          topics: [
            { id: 'c3-1-1', title: 'Vật lý', expanded: true, topics: [], exams: [] },
            { id: 'c3-1-2', title: 'Hóa học', expanded: true, topics: [], exams: [] },
            { id: 'c3-1-3', title: 'Sinh học', expanded: true, topics: [], exams: [] },
          ],
          exams: [],
        },
      ],
      exams: [],
    },
  ]);
  const [editingCompetencyNodeId, setEditingCompetencyNodeId] = useState(null);
  const [editingCompetencyExamId, setEditingCompetencyExamId] = useState(null);

  // Common bank state
  const [commonQuestions, setCommonQuestions] = useState([]);
  const [commonBankConfig, setCommonBankConfig] = useState({
    title: '',
    subject: 'Toán học',
    grade: 'Khối 12',
    duration: 60,
    description: '',
    status: 'Published',
    startAt: '',
    endAt: '',
    maxAttempts: '',
    tags: '',
    search: '',
    difficulty: '',
    type: '',
    targetClasses: [],
    targetStudents: [],
  });
  const [selectedCommonQuestions, setSelectedCommonQuestions] = useState([]);

  // Import exam state
  const [importConfig, setImportConfig] = useState({
    subject: 'Toán học',
    grade: 'Khối 12',
  });
  const [importFile, setImportFile] = useState(null);
  const [importFilePreviewUrl, setImportFilePreviewUrl] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [parsedExamInfo, setParsedExamInfo] = useState(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [useImageMode, setUseImageMode] = useState(true);
  const [pdfCanvas, setPdfCanvas] = useState(null);
  const [pdfCanvasRef, setPdfCanvasRef] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [drawEnd, setDrawEnd] = useState({ x: 0, y: 0 });
  const [currentSelectionType, setCurrentSelectionType] = useState('question');
  const [pageScale, setPageScale] = useState(1);
  // Manual question creation
  const [manualQuestions, setManualQuestions] = useState([
    {
      id: 1,
      content: '',
      contentImage: null,
      type: 'Trắc nghiệm',
      difficulty: 'Trung bình',
      answers: [
        { id: 'A', content: '', contentImage: null, isCorrect: false },
        { id: 'B', content: '', contentImage: null, isCorrect: false },
        { id: 'C', content: '', contentImage: null, isCorrect: false },
        { id: 'D', content: '', contentImage: null, isCorrect: false },
      ],
    },
  ]);
  const [activeManualTab, setActiveManualTab] = useState('config');
  const [showQuestionBankModal, setShowQuestionBankModal] = useState(false);
  const [selectedFileForUpload, setSelectedFileForUpload] = useState(null);
  const [showMathEditor, setShowMathEditor] = useState(false);
  const [mathEditorQuestionIndex, setMathEditorQuestionIndex] = useState(0);
  const [latexEditorState, setLatexEditorState] = useState({ open: false, qIndex: 0 });

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [qRes, cRes, eRes, commonQRes, folderRes] = await Promise.all([
          questionApi.getAll({ source: 'all' }),
          categoryApi.getAll().catch(() => ({ data: [] })),
          examApi.getMine().catch(() => ({ data: [] })),
          questionApi.getAll({ source: 'common' }).catch(() => ({ data: [] })),
          examFolderApi.getMine().catch(() => ({ data: [] })),
        ]);
        setQuestions(qRes.data || []);
        setCategories(cRes.data || []);
        setMyExams(eRes.data || []);
        setCommonQuestions(commonQRes.data || []);
        setExamFolders(folderRes.data || []);
      } catch {
        showToast({ message: 'Không thể tải dữ liệu.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [showToast]);

  // Load filtered common questions when config changes
  useEffect(() => {
    const loadFilteredCommon = async () => {
      try {
        const params = {
          source: 'common',
          subject: commonBankConfig.subject,
          grade: commonBankConfig.grade,
          search: commonBankConfig.search,
          difficulty: commonBankConfig.difficulty,
          type: commonBankConfig.type,
        };
        const res = await questionApi.getAll(params);
        setCommonQuestions(res.data || []);
      } catch {
        // ignore
      }
    };
    if (viewMode === 'common-bank') {
      loadFilteredCommon();
    }
  }, [
    commonBankConfig.subject,
    commonBankConfig.grade,
    commonBankConfig.search,
    commonBankConfig.difficulty,
    commonBankConfig.type,
    viewMode,
  ]);

  useEffect(() => {
    const loadTargets = async () => {
      if (!user || !user._id) return;

      const [classRes, studentRes] = await Promise.all([
        classroomApi.getAll().catch(() => ({ data: [] })),
        teacherApi.getStudentsByTeacher(user._id).catch(() => ({ data: [] })),
      ]);

      setAvailableClasses(classRes.data || []);
      setAvailableStudents(studentRes.data || []);
    };
    loadTargets();
  }, [user]);

  // Derived state
  const filteredQuestions = questions.filter((q) => {
    const normalizeGrade = (g) => g?.toString().replace('Lớp', 'Khối').trim().toLowerCase();
    const normalizeSubject = (s) => s?.toString().trim().toLowerCase();

    if (form.subject && normalizeSubject(q.subject) !== normalizeSubject(form.subject)) {
      return false;
    }
    if (form.grade && normalizeGrade(q.grade) !== normalizeGrade(form.grade)) {
      return false;
    }
    if (selectedCategoryId && q.category !== selectedCategoryId) {
      return false;
    }
    return true;
  });

  const availableStudentsToSelect = availableStudents.filter((s) => {
    const isSelected = targetStudentIds.includes(s._id);
    if (isSelected) return false;
    if (!studentSearch) return true;
    const search = studentSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(search) || (s.email && s.email.toLowerCase().includes(search))
    );
  });

  const selectedStudents = availableStudents.filter((s) => targetStudentIds.includes(s._id));

  const filteredExams = myExams.filter((exam) => {
    const titleMatch = exam.title.toLowerCase().includes(searchTerm.toLowerCase());
    const folderMatch =
      selectedFolderId === 'all'
        ? true
        : (exam.folder?._id || exam.folder)?.toString() === selectedFolderId;
    return titleMatch && folderMatch;
  });

  // Handlers
  const toggleQuestion = (id) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      title: '',
      subject: 'Toán học',
      grade: 'Khối 12',
      duration: 45,
      price: 0,
      folder: null,
      description: '',
      startAt: '',
      endAt: '',
      maxAttempts: '',
      tags: '',
    });
    setSelectedQuestionIds([]);
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
      showToast({ title: 'Lỗi', message: 'Vui lòng nhập tiêu đề kỳ thi', type: 'error' });
      return;
    }
    if (!form.duration || Number(form.duration) <= 0) {
      showToast({ title: 'Lỗi', message: 'Vui lòng nhập thời lượng hợp lệ', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const selectedQuestions = questions.filter((q) => selectedQuestionIds.includes(q._id));
      const examCategories = Array.from(
        new Set(selectedQuestions.map((q) => q.category).filter(Boolean)),
      );

      const payload = {
        title: form.title,
        subject: form.subject,
        grade: form.grade,
        duration: Number(form.duration),
        price: Number(form.price) || 0,
        folder: form.folder || null,
        examType: 'Standard',
        description: form.description,
        status: 'Published',
        questions: randomEnabled ? [] : selectedQuestionIds,
        categories: examCategories,
        tags: Array.isArray(form.tags)
          ? form.tags
          : String(form.tags || '')
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean),
        targetClasses: targetClassIds,
        targetStudents: targetStudentIds,
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
        payload.randomConfig = {
          enabled: true,
          subject: form.subject,
          grade: form.grade,
          difficulties:
            randomDifficultyFilter === 'all' ? [] : difficultiesMap[randomDifficultyFilter],
          tagFilters: [],
          category: selectedCategoryId || null,
          questionCount: randomCount !== '' ? Number(randomCount) || null : null,
        };
      }

      if (form.startAt) payload.startAt = new Date(form.startAt);
      if (form.endAt) payload.endAt = new Date(form.endAt);
      if (form.maxAttempts !== '') payload.maxAttempts = Number(form.maxAttempts);

      await examApi.create(payload);
      showToast({ message: 'Đã tạo kỳ thi thành công!', type: 'success' });

      // Refresh exams list
      const refreshed = await examApi.getMine().catch(() => ({ data: [] }));
      setMyExams(refreshed.data || []);

      resetForm();
      setViewMode('list');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể tạo kỳ thi. Vui lòng thử lại.';
      showToast({ message: errorMsg, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExam = async (exam) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa kỳ thi này?')) return;

    try {
      await examApi.delete(exam._id);
      showToast({ message: 'Đã xóa kỳ thi thành công', type: 'success' });

      // Refresh list
      const refreshed = await examApi.getMine().catch(() => ({ data: [] }));
      setMyExams(refreshed.data || []);
    } catch {
      showToast({ message: 'Không thể xóa kỳ thi.', type: 'error' });
    }
  };

  // File upload handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (files) => {
    const newFiles = files.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const replaceFiles = (files) => {
    const newFiles = files.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));
    setSelectedFiles(newFiles);
  };

  const removeFile = (fileId) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleOptionClick = (optionName) => {
    if (optionName === 'Tự soạn Đề thi / Bài tập') {
      setViewMode('quick-create');
    } else if (optionName === 'Tạo đề thi đánh giá năng lực') {
      setViewMode('competency-assessment');
    } else if (optionName === 'Tạo đề từ ngân hàng chung') {
      setViewMode('common-bank');
    } else if (
      optionName === 'Tạo đề thi từ file Excel' ||
      optionName === 'Nhập đề thi từ file PDF/Word'
    ) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept =
        optionName === 'Tạo đề thi từ file Excel' ? '.xlsx,.xls' : '.pdf,.docx,.xlsx,.xls';
      input.onchange = (e) => {
        if (e.target.files?.[0]) {
          startImportFromFile(e.target.files[0]);
        }
      };
      input.click();
    } else {
      showToast({
        type: 'info',
        title: 'Tính năng sắp có',
        message: `Tính năng "${optionName}" đang được phát triển.`,
      });
    }
  };

  async function startImportFromFile(file) {
    setViewMode('import');
    setImportFile(file);
    setImportFilePreviewUrl(URL.createObjectURL(file));
    setIsParsing(true);

    try {
      const result = await examApi.parse(file, importConfig);
      setParsedExamInfo(result.data.examInfo);
      if (result.data.questions && result.data.questions.length > 0) {
        setParsedQuestions(result.data.questions);
        setSelectedQuestionIndex(0);
      } else {
        setParsedQuestions([
          {
            id: 'q1',
            content: '',
            contentImage: null,
            type: 'Trắc nghiệm',
            difficulty: 'Trung bình',
            subject: importConfig.subject,
            grade: importConfig.grade,
            answers: [
              { id: 'A', content: '', contentImage: null, isCorrect: false },
              { id: 'B', content: '', contentImage: null, isCorrect: false },
              { id: 'C', content: '', contentImage: null, isCorrect: false },
              { id: 'D', content: '', contentImage: null, isCorrect: false },
            ],
          },
        ]);
      }
      showToast({ type: 'success', message: 'Đã phân tích file thành công!' });
    } catch (err) {
      console.error('Error parsing file:', err);
      showToast({
        type: 'error',
        message: err.response?.data?.message || 'Không thể phân tích file!',
      });
      setParsedQuestions([
        {
          id: 'q1',
          content: '',
          contentImage: null,
          type: 'Trắc nghiệm',
          difficulty: 'Trung bình',
          subject: importConfig.subject,
          grade: importConfig.grade,
          answers: [
            { id: 'A', content: '', contentImage: null, isCorrect: false },
            { id: 'B', content: '', contentImage: null, isCorrect: false },
            { id: 'C', content: '', contentImage: null, isCorrect: false },
            { id: 'D', content: '', contentImage: null, isCorrect: false },
          ],
        },
      ]);
    } finally {
      setIsParsing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-500">
        Đang tải dữ liệu...
      </div>
    );
  }

  // Quick create view
  if (viewMode === 'quick-create') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b bg-white shadow-sm">
          <button
            onClick={() => setViewMode('list')}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Nhập thủ công đề thi, bài tập</h1>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-2 bg-white border-b">
          {/* Upload Button */}
          <input
            type="file"
            id="manual-upload-file"
            className="hidden"
            accept="image/*,.pdf"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setSelectedFileForUpload(e.target.files[0]);
                const url = URL.createObjectURL(e.target.files[0]);
                // Add image to current question
                const lastIdx = manualQuestions.length - 1;
                const newQuestions = [...manualQuestions];
                newQuestions[lastIdx].contentImage = url;
                setManualQuestions(newQuestions);
              }
            }}
          />
          <button
            onClick={() => document.getElementById('manual-upload-file')?.click()}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>

          {/* Select from Question Bank */}
          <button
            onClick={() => setShowQuestionBankModal(true)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Chọn từ ngân hàng cá nhân
          </button>

          {/* MathEditor Component */}
          <MathEditor
            isOpen={showMathEditor}
            onClose={() => setShowMathEditor(false)}
            value=""
            onChange={(latex) => {
              if (latex) {
                const newQuestions = [...manualQuestions];
                newQuestions[mathEditorQuestionIndex].content += ` $$${latex}$$ `;
                setManualQuestions(newQuestions);
              }
            }}
            placeholder="Nhập công thức LaTeX..."
          />

          {/* Insert Interactive Content */}
          <button
            onClick={() => {
              const lastIdx = Math.max(0, manualQuestions.length - 1);
              setLatexEditorState({ open: true, qIndex: lastIdx });
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 3v18" />
            </svg>
            Chèn nội dung tương tác
          </button>

          <div className="flex-1" />

          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        </div>

        {/* Question Bank Modal */}
        {showQuestionBankModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Ngân hàng câu hỏi cá nhân</h3>
                <button
                  onClick={() => setShowQuestionBankModal(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                {filteredQuestions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Filter className="w-8 h-8 text-gray-400" />
                    </div>
                    <p>Không có câu hỏi nào</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredQuestions.map((q) => (
                      <button
                        key={q._id}
                        onClick={() => {
                          setManualQuestions([
                            ...manualQuestions,
                            {
                              id: manualQuestions.length + 1,
                              content: q.content,
                              contentImage: q.contentImage,
                              type: q.type,
                              difficulty: q.difficulty,
                              answers:
                                q.answers?.map((a, idx) => ({
                                  ...a,
                                  id: ['A', 'B', 'C', 'D'][idx] || String(idx + 1),
                                })) || [],
                            },
                          ]);
                          setShowQuestionBankModal(false);
                        }}
                        className="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all"
                      >
                        <p className="text-sm font-medium text-gray-800 mb-2 line-clamp-2">
                          {q.content}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="px-2 py-0.5 bg-gray-100 rounded">{q.type}</span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded">{q.difficulty}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-4 border-t flex justify-end">
                <button
                  onClick={() => setShowQuestionBankModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Side: Exam Configuration */}
          <div className="w-1/2 bg-slate-50 border-r overflow-auto p-6">
            <div className="max-w-md mx-auto space-y-6">
              <h2 className="text-lg font-bold text-gray-800">Thông tin đề thi</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tiêu đề đề thi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Nhập tiêu đề..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Môn học
                    </label>
                    <select
                      value={form.subject}
                      onChange={(e) => handleFormChange('subject', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Khối lớp
                    </label>
                    <select
                      value={form.grade}
                      onChange={(e) => handleFormChange('grade', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Thời lượng (phút)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.duration}
                      onChange={(e) => handleFormChange('duration', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Số lần làm tối đa
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.maxAttempts}
                      onChange={(e) => handleFormChange('maxAttempts', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Không giới hạn"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Hướng dẫn hoặc lưu ý cho thí sinh..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Trạng thái đề thi
                    </label>
                    <select
                      value="Published"
                      disabled
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Published">Công khai</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Thời gian bắt đầu
                    </label>
                    <input
                      type="datetime-local"
                      value={form.startAt}
                      onChange={(e) => handleFormChange('startAt', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Thời gian kết thúc
                    </label>
                    <input
                      type="datetime-local"
                      value={form.endAt}
                      onChange={(e) => handleFormChange('endAt', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Đối tượng tham gia</h3>

                  {/* Classes Selection */}
                  <div className="space-y-2 mb-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Theo lớp học
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableClasses.map((cls) => {
                        const isSelected = targetClassIds.includes(cls._id);
                        return (
                          <button
                            key={cls._id}
                            type="button"
                            onClick={() =>
                              setTargetClassIds((prev) =>
                                prev.includes(cls._id)
                                  ? prev.filter((x) => x !== cls._id)
                                  : [...prev, cls._id],
                              )
                            }
                            className={cn(
                              'px-3 py-1.5 rounded-xl border text-xs font-medium transition-all',
                              isSelected
                                ? 'border-blue-500 bg-blue-500 text-white'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300',
                            )}
                          >
                            {cls.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-6">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSaving(true);
                      try {
                        const savedQuestionIds = [];
                        for (const q of manualQuestions) {
                          if (q.content.trim() || q.contentImage) {
                            const result = await questionApi.create({
                              content: q.content,
                              contentImage: q.contentImage,
                              subject: form.subject,
                              grade: form.grade,
                              type: q.type,
                              difficulty: q.difficulty,
                              answers: q.answers,
                            });
                            savedQuestionIds.push(result.data._id);
                          }
                        }

                        const examData = {
                          title: form.title,
                          subject: form.subject,
                          grade: form.grade,
                          duration: Number(form.duration),
                          description: form.description,
                          status: 'Published',
                          startAt: form.startAt ? new Date(form.startAt) : undefined,
                          endAt: form.endAt ? new Date(form.endAt) : undefined,
                          questions: savedQuestionIds,
                          targetClasses: targetClassIds,
                          targetStudents: targetStudentIds,
                        };

                        await examApi.create(examData);
                        showToast({ message: 'Tạo đề thi thành công!', type: 'success' });
                        const refreshed = await examApi.getMine().catch(() => ({ data: [] }));
                        setMyExams(refreshed.data || []);
                        setViewMode('list');
                      } catch (err) {
                        const errorMsg = err.response?.data?.message || 'Không thể tạo đề thi';
                        showToast({ message: errorMsg, type: 'error' });
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-70"
                  >
                    {isSaving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    {isSaving ? 'Đang lưu...' : 'Tạo đề thi'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Editor */}
          <div className="w-1/2 bg-white flex flex-col">
            <div className="flex-1 overflow-auto p-4">
              {manualQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="flex gap-3 mb-6 p-4 border border-gray-200 rounded-xl bg-white shadow-sm"
                >
                  <div className="flex flex-col items-center pt-1 gap-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-base font-bold">
                      {idx + 1}
                    </div>
                    <button
                      onClick={() => {
                        const newQuestions = manualQuestions.filter((_, i) => i !== idx);
                        setManualQuestions(newQuestions);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      title="Xóa câu hỏi"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex-1 space-y-4">
                    {/* Question Image Preview */}
                    {q.contentImage && (
                      <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <img src={q.contentImage} alt="Question" className="max-h-40 rounded" />
                        <button
                          onClick={() => {
                            const newQuestions = [...manualQuestions];
                            newQuestions[idx].contentImage = null;
                            setManualQuestions(newQuestions);
                          }}
                          className="mt-2 text-xs text-red-500 hover:text-red-700"
                        >
                          Xóa hình ảnh
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <textarea
                        ref={(el) => {
                          if (el && !window.manualQuestionRefs) {
                            window.manualQuestionRefs = {};
                          }
                          if (el) window.manualQuestionRefs[`q-${idx}`] = el;
                        }}
                        value={q.content}
                        onChange={(e) => {
                          const newQuestions = [...manualQuestions];
                          newQuestions[idx].content = e.target.value;
                          setManualQuestions(newQuestions);
                        }}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-base resize-none min-h-[120px] focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Nhập nội dung câu hỏi... (dùng $$ để chèn công thức)"
                      />
                      <div className="flex flex-col gap-2">

                        <button
                          onClick={() => {
                            setMathEditorQuestionIndex(idx);
                            setShowMathEditor(true);
                          }}
                          className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-1"
                          title="Chèn công thức"
                        >
                          <Calculator className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question Type Selector */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-gray-700">Loại câu hỏi:</label>
                        <select
                          value={q.type}
                          onChange={(e) => {
                            const newQuestions = [...manualQuestions];
                            newQuestions[idx].type = e.target.value;
                            if (e.target.value === 'Đúng/Sai') {
                              newQuestions[idx].answers = [
                                { id: 'Đúng', content: 'Đúng', isCorrect: false },
                                { id: 'Sai', content: 'Sai', isCorrect: false },
                              ];
                            } else if (e.target.value === 'Trắc nghiệm') {
                              newQuestions[idx].answers = [
                                { id: 'A', content: '', contentImage: null, isCorrect: false },
                                { id: 'B', content: '', contentImage: null, isCorrect: false },
                                { id: 'C', content: '', contentImage: null, isCorrect: false },
                                { id: 'D', content: '', contentImage: null, isCorrect: false },
                              ];
                            }
                            setManualQuestions(newQuestions);
                          }}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="Trắc nghiệm">Trắc nghiệm</option>
                          <option value="Đúng/Sai">Đúng/Sai</option>
                          <option value="Điền từ">Điền từ</option>
                          <option value="Tự luận">Tự luận</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-semibold text-gray-700">Độ khó:</label>
                        <select
                          value={q.difficulty}
                          onChange={(e) => {
                            const newQuestions = [...manualQuestions];
                            newQuestions[idx].difficulty = e.target.value;
                            setManualQuestions(newQuestions);
                          }}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="Dễ">Dễ</option>
                          <option value="Trung bình">Trung bình</option>
                          <option value="Khó">Khó</option>
                        </select>
                      </div>
                    </div>

                    {/* Answer Choices */}
                    {q.type !== 'Tự luận' && q.answers && (
                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700">
                          {q.type === 'Trắc nghiệm' ? 'Các lựa chọn:' : 'Lựa chọn:'}
                        </label>
                        {q.answers.map((a, ansIdx) => (
                          <div
                            key={a.id || ansIdx}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                          >
                            <div className="pt-1">
                              <input
                                type="radio"
                                name={`correct-${idx}`}
                                checked={a.isCorrect}
                                onChange={() => {
                                  const newQuestions = [...manualQuestions];
                                  newQuestions[idx].answers.forEach(
                                    (ans, i) => (ans.isCorrect = i === ansIdx),
                                  );
                                  setManualQuestions(newQuestions);
                                }}
                                className="w-4 h-4 text-blue-600"
                              />
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-700">
                                  {a.id}
                                </span>
                                <textarea
                                  value={a.content}
                                  onChange={(e) => {
                                    const newQuestions = [...manualQuestions];
                                    newQuestions[idx].answers[ansIdx].content = e.target.value;
                                    setManualQuestions(newQuestions);
                                  }}
                                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white resize-none min-h-[40px]"
                                  placeholder="Nội dung lựa chọn"
                                />
                              </div>
                              <div className="flex gap-2">

                              </div>

                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {/* Add Question Button */}
              <button
                onClick={() => {
                  setManualQuestions([
                    ...manualQuestions,
                    {
                      id: manualQuestions.length + 1,
                      content: '',
                      contentImage: null,
                      type: 'Trắc nghiệm',
                      difficulty: 'Trung bình',
                      answers: [
                        { id: 'A', content: '', contentImage: null, isCorrect: false },
                        { id: 'B', content: '', contentImage: null, isCorrect: false },
                        { id: 'C', content: '', contentImage: null, isCorrect: false },
                        { id: 'D', content: '', contentImage: null, isCorrect: false },
                      ],
                    },
                  ]);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-semibold"
              >
                <Plus className="w-4 h-4" />
                Thêm câu hỏi
              </button>
            </div>

            {/* Bottom Bar: Templates */}
            <div className="border-t p-3 bg-white">
              <div className="text-sm text-gray-700">
                Nội dung mẫu:{' '}
                <a href="#" className="text-blue-600 hover:underline mx-1">
                  Mẫu 1
                </a>
                <span className="text-gray-400">|</span>
                <a href="#" className="text-blue-600 hover:underline mx-1">
                  Mẫu 2
                </a>
                <span className="text-gray-400">|</span>
                <a href="#" className="text-blue-600 hover:underline mx-1">
                  Mẫu 3 (Có điền từ)
                </a>
                <span className="text-gray-400">|</span>
                <a href="#" className="text-blue-600 hover:underline mx-1">
                  Mẫu 4
                </a>
                <span className="text-gray-400">|</span>
                <a href="#" className="text-blue-600 hover:underline mx-1">
                  Mẫu 5 (Có câu Đúng/Sai)
                </a>
              </div>
            </div>

            <LatexContentEditor
              isOpen={latexEditorState.open}
              title="Soạn nội dung (LaTeX)"
              initialValue={manualQuestions[latexEditorState.qIndex]?.content || ''}
              onClose={() => setLatexEditorState((s) => ({ ...s, open: false }))}
              onSave={(next) => {
                const qIndex = latexEditorState.qIndex;
                const newQuestions = [...manualQuestions];
                if (newQuestions[qIndex]) {
                  newQuestions[qIndex].content = next;
                  setManualQuestions(newQuestions);
                }
                setLatexEditorState((s) => ({ ...s, open: false }));
              }}
              getPreviewQuestion={(draft) => {
                const q = manualQuestions[latexEditorState.qIndex] || {};
                return { ...q, content: draft };
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'competency-assessment') {
    const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const updateTopicById = (topics, id, updater) => {
      return topics.map((t) => {
        if (t.id === id) return updater(t);
        if (Array.isArray(t.topics) && t.topics.length > 0) {
          return { ...t, topics: updateTopicById(t.topics, id, updater) };
        }
        return t;
      });
    };

    const removeTopicById = (topics, id) => {
      return topics
        .filter((t) => t.id !== id)
        .map((t) => ({
          ...t,
          topics: Array.isArray(t.topics) ? removeTopicById(t.topics, id) : [],
        }));
    };

    const updateExamInTopic = (topics, topicId, examId, updates) => {
      return topics.map((t) => {
        if (t.id === topicId) {
          return {
            ...t,
            exams: (t.exams || []).map((ex) => (ex.id === examId ? { ...ex, ...updates } : ex)),
          };
        }
        if (Array.isArray(t.topics) && t.topics.length > 0) {
          return { ...t, topics: updateExamInTopic(t.topics, topicId, examId, updates) };
        }
        return t;
      });
    };

    const removeExamInTopic = (topics, topicId, examId) => {
      return topics.map((t) => {
        if (t.id === topicId) {
          return { ...t, exams: (t.exams || []).filter((ex) => ex.id !== examId) };
        }
        if (Array.isArray(t.topics) && t.topics.length > 0) {
          return { ...t, topics: removeExamInTopic(t.topics, topicId, examId) };
        }
        return t;
      });
    };

    const hasContent = (node) => (node.topics?.length || 0) > 0 || (node.exams?.length || 0) > 0;

    const validateTopics = (topics) => {
      for (const t of topics) {
        if (!t.title || !t.title.trim()) return false;
        if (!hasContent(t)) return false;
        if ((t.exams || []).some((ex) => !ex.examId)) return false;
        if (Array.isArray(t.topics) && t.topics.length > 0) {
          if (!validateTopics(t.topics)) return false;
        }
      }
      return true;
    };

    const handleSaveCompetencyExam = async () => {
      if (!competencyConfig.title.trim()) {
        showToast({ type: 'error', title: 'Lỗi', message: 'Vui lòng nhập tên đề thi!' });
        return;
      }

      if (!validateTopics(competencyStructure)) {
        showToast({
          type: 'error',
          title: 'Lỗi',
          message:
            'Vui lòng hoàn thiện cấu trúc đề thi (mỗi chủ đề cần có đề thi hoặc chủ đề con; đề thi phải chọn từ danh sách).',
        });
        return;
      }

      setIsSaving(true);
      try {
        const payload = {
          title: competencyConfig.title,
          subject: competencyConfig.subject,
          grade: competencyConfig.grade,
          duration: Number(competencyConfig.duration) || 60,
          description: competencyConfig.description,
          status: 'Published',
          examType: 'Competency',
          competencyStructure,
          questions: [],
          categories: [],
          tags: [],
        };

        if (competencyConfig.startAt) payload.startAt = new Date(competencyConfig.startAt);
        if (competencyConfig.endAt) payload.endAt = new Date(competencyConfig.endAt);

        await examApi.create(payload);
        showToast({ message: 'Đã lưu đề thi đánh giá năng lực!', type: 'success' });

        const refreshed = await examApi.getMine().catch(() => ({ data: [] }));
        setMyExams(refreshed.data || []);
        setViewMode('list');
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Không thể lưu đề thi. Vui lòng thử lại.';
        showToast({ message: errorMsg, type: 'error' });
      } finally {
        setIsSaving(false);
      }
    };

    const renderTopic = (topic, level) => {
      const paddingLeft = 18 + level * 22;
      const isExpanded = !!topic.expanded;
      const contentOk = hasContent(topic);

      return (
        <div key={topic.id}>
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-2 min-w-0" style={{ paddingLeft }}>
              <button
                type="button"
                onClick={() => {
                  setCompetencyStructure((prev) =>
                    updateTopicById(prev, topic.id, (t) => ({ ...t, expanded: !t.expanded })),
                  );
                }}
                className={cn(
                  'w-6 h-6 rounded flex items-center justify-center hover:bg-gray-100 transition-colors',
                  (topic.topics?.length || 0) > 0 || (topic.exams?.length || 0) > 0
                    ? ''
                    : 'opacity-0 pointer-events-none',
                )}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-gray-600 rotate-180" />
                )}
              </button>
              <FolderPlus className="w-5 h-5 text-gray-500 flex-shrink-0" />

              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  {editingCompetencyNodeId === topic.id ? (
                    <input
                      autoFocus
                      value={topic.title}
                      onChange={(e) => {
                        const next = e.target.value;
                        setCompetencyStructure((prev) =>
                          updateTopicById(prev, topic.id, (t) => ({ ...t, title: next })),
                        );
                      }}
                      onBlur={() => setEditingCompetencyNodeId(null)}
                      className="px-2 py-1 border border-gray-200 rounded-lg text-sm w-[280px] max-w-full"
                    />
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-gray-900 truncate">
                        {topic.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingCompetencyNodeId(topic.id)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-500"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
                {!contentOk && (
                  <div className="text-xs text-red-500 mt-0.5">
                    Vui lòng thêm đề thi hoặc chủ đề
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 pr-4 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  const newExam = { id: createId(), examId: '' };
                  setCompetencyStructure((prev) =>
                    updateTopicById(prev, topic.id, (t) => ({
                      ...t,
                      expanded: true,
                      exams: [...(t.exams || []), newExam],
                    })),
                  );
                  setEditingCompetencyExamId(newExam.id);
                }}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                <FileText className="w-4 h-4" />
                Thêm đề thi
              </button>

              <button
                type="button"
                onClick={() => {
                  const newTopic = {
                    id: createId(),
                    title: 'Chủ đề mới',
                    expanded: true,
                    topics: [],
                    exams: [],
                  };
                  setCompetencyStructure((prev) =>
                    updateTopicById(prev, topic.id, (t) => ({
                      ...t,
                      expanded: true,
                      topics: [...(t.topics || []), newTopic],
                    })),
                  );
                  setEditingCompetencyNodeId(newTopic.id);
                }}
                className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
              >
                <Plus className="w-4 h-4" />
                Thêm chủ đề
              </button>

              <button
                type="button"
                onClick={() => setCompetencyStructure((prev) => removeTopicById(prev, topic.id))}
                className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
              >
                <XCircle className="w-4 h-4" />
                Xóa
              </button>
            </div>
          </div>

          {isExpanded && (
            <div>
              {(topic.exams || []).map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50"
                >
                  <div
                    className="flex items-center gap-2 min-w-0"
                    style={{ paddingLeft: paddingLeft + 28 }}
                  >
                    <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <select
                      value={ex.examId}
                      onChange={(e) => {
                        const next = e.target.value;
                        setCompetencyStructure((prev) =>
                          updateExamInTopic(prev, topic.id, ex.id, { examId: next }),
                        );
                      }}
                      onBlur={() => setEditingCompetencyExamId(null)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm border w-[360px] max-w-full',
                        ex.examId ? 'bg-white border-gray-200' : 'bg-red-50 border-red-200',
                      )}
                      autoFocus={editingCompetencyExamId === ex.id}
                    >
                      <option value="">Chọn đề thi...</option>
                      {myExams.map((e) => (
                        <option key={e._id} value={e._id}>
                          {e.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pr-4">
                    <button
                      type="button"
                      onClick={() =>
                        setCompetencyStructure((prev) => removeExamInTopic(prev, topic.id, ex.id))
                      }
                      className="text-sm font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      Xóa
                    </button>
                  </div>
                </div>
              ))}

              {(topic.topics || []).map((child) => renderTopic(child, level + 1))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="min-h-screen bg-slate-100">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode('list')}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="text-xl font-bold text-gray-900">Đề thi đánh giá năng lực</div>
          </div>
          <button
            type="button"
            onClick={handleSaveCompetencyExam}
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-700 text-white font-bold rounded-lg shadow hover:bg-blue-800 transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Lưu
          </button>
        </div>

        <div className="p-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tên đề thi</label>
                <input
                  value={competencyConfig.title}
                  onChange={(e) =>
                    setCompetencyConfig({ ...competencyConfig, title: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nhập tên đề ..."
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-gray-700">Thời gian giao đề</span>
                  <Info className="w-4 h-4 text-gray-400" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-5">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="datetime-local"
                        value={competencyConfig.startAt}
                        onChange={(e) =>
                          setCompetencyConfig({ ...competencyConfig, startAt: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Từ"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-5">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="datetime-local"
                        value={competencyConfig.endAt}
                        onChange={(e) =>
                          setCompetencyConfig({ ...competencyConfig, endAt: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Đến"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setCompetencyConfig({ ...competencyConfig, startAt: '', endAt: '' })
                      }
                      className="w-full md:w-auto px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <Clock className="w-4 h-4 text-gray-500" />
                      Đặt lại
                    </button>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mt-2">
                  Chỉ được phép gia hạn thêm “Thời gian giao đề” hoặc “Thời gian làm bài”. Bỏ trống
                  nếu không muốn giới hạn thời gian.
                </div>
              </div>

              <div>
                <div className="text-lg font-bold text-gray-900 mb-3">
                  Cấu trúc đề thi Đánh giá năng lực
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                  {competencyStructure.map((topic) => renderTopic(topic, 0))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Common bank view
  if (viewMode === 'common-bank') {
    const handleCommonBankSubmit = async (e) => {
      e.preventDefault();
      setIsSaving(true);

      try {
        const payload = {
          title: commonBankConfig.title,
          subject: commonBankConfig.subject,
          grade: commonBankConfig.grade,
          duration: Number(commonBankConfig.duration),
          description: commonBankConfig.description,
          status: 'Published',
          questions: selectedCommonQuestions,
          categories: [],
          tags: Array.isArray(commonBankConfig.tags)
            ? commonBankConfig.tags
            : String(commonBankConfig.tags || '')
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
          targetClasses: commonBankConfig.targetClasses,
          targetStudents: commonBankConfig.targetStudents,
        };

        if (commonBankConfig.startAt) payload.startAt = new Date(commonBankConfig.startAt);
        if (commonBankConfig.endAt) payload.endAt = new Date(commonBankConfig.endAt);
        if (commonBankConfig.maxAttempts !== '')
          payload.maxAttempts = Number(commonBankConfig.maxAttempts);

        await examApi.create(payload);
        showToast({ message: 'Đã tạo đề thi từ ngân hàng chung thành công!', type: 'success' });

        const refreshed = await examApi.getMine().catch(() => ({ data: [] }));
        setMyExams(refreshed.data || []);
        setViewMode('list');
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Không thể tạo đề thi. Vui lòng thử lại.';
        showToast({ message: errorMsg, type: 'error' });
      } finally {
        setIsSaving(false);
      }
    };

    const toggleSelectQuestion = (id) => {
      if (selectedCommonQuestions.includes(id)) {
        setSelectedCommonQuestions((prev) => prev.filter((qid) => qid !== id));
      } else {
        setSelectedCommonQuestions((prev) => [...prev, id]);
      }
    };

    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setViewMode('list')}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Tạo đề thi từ ngân hàng chung</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Config */}
          <div className="lg:col-span-5 space-y-6">
            <form
              onSubmit={handleCommonBankSubmit}
              className="bg-white rounded-3xl border border-gray-200 shadow-lg p-8 space-y-6 sticky top-6"
            >
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Thông tin đề thi</h2>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Tiêu đề đề thi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={commonBankConfig.title}
                    onChange={(e) =>
                      setCommonBankConfig({ ...commonBankConfig, title: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    placeholder="VD: Đề kiểm tra Toán 12"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Môn học</label>
                    <select
                      value={commonBankConfig.subject}
                      onChange={(e) =>
                        setCommonBankConfig({ ...commonBankConfig, subject: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
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
                    <label className="text-sm font-semibold text-gray-700">Khối lớp</label>
                    <select
                      value={commonBankConfig.grade}
                      onChange={(e) =>
                        setCommonBankConfig({ ...commonBankConfig, grade: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
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

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    Thời gian làm bài (phút)
                  </label>
                  <input
                    type="number"
                    value={commonBankConfig.duration}
                    onChange={(e) =>
                      setCommonBankConfig({ ...commonBankConfig, duration: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    min="1"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Mô tả</label>
                  <textarea
                    value={commonBankConfig.description}
                    onChange={(e) =>
                      setCommonBankConfig({ ...commonBankConfig, description: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none"
                    rows={3}
                    placeholder="Mô tả về đề thi..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Trạng thái đề thi</label>
                    <select
                      value="Published"
                      disabled
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      <option value="Published">Công khai</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Thời gian bắt đầu</label>
                    <input
                      type="datetime-local"
                      value={commonBankConfig.startAt}
                      onChange={(e) =>
                        setCommonBankConfig({ ...commonBankConfig, startAt: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      Thời gian kết thúc
                    </label>
                    <input
                      type="datetime-local"
                      value={commonBankConfig.endAt}
                      onChange={(e) =>
                        setCommonBankConfig({ ...commonBankConfig, endAt: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Lọc câu hỏi</h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500">Tìm kiếm</label>
                      <input
                        type="text"
                        value={commonBankConfig.search}
                        onChange={(e) =>
                          setCommonBankConfig({ ...commonBankConfig, search: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="Từ khóa..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500">Loại câu hỏi</label>
                        <select
                          value={commonBankConfig.type}
                          onChange={(e) =>
                            setCommonBankConfig({ ...commonBankConfig, type: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-green-500 outline-none"
                        >
                          <option value="">Tất cả</option>
                          <option value="Trắc nghiệm">Trắc nghiệm</option>
                          <option value="Tự luận">Tự luận</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500">Độ khó</label>
                        <select
                          value={commonBankConfig.difficulty}
                          onChange={(e) =>
                            setCommonBankConfig({ ...commonBankConfig, difficulty: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-green-500 outline-none"
                        >
                          <option value="">Tất cả</option>
                          <option value="Dễ">Dễ</option>
                          <option value="Nhận biết">Nhận biết</option>
                          <option value="Trung bình">Trung bình</option>
                          <option value="Thông hiểu">Thông hiểu</option>
                          <option value="Khó">Khó</option>
                          <option value="Vận dụng">Vận dụng</option>
                          <option value="Vận dụng cao">Vận dụng cao</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Đối tượng tham gia</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Lớp học
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {availableClasses.map((cls) => {
                          const isSelected = commonBankConfig.targetClasses.includes(cls._id);
                          return (
                            <button
                              key={cls._id}
                              type="button"
                              onClick={() => {
                                const newTarget = isSelected
                                  ? commonBankConfig.targetClasses.filter((id) => id !== cls._id)
                                  : [...commonBankConfig.targetClasses, cls._id];
                                setCommonBankConfig({
                                  ...commonBankConfig,
                                  targetClasses: newTarget,
                                });
                              }}
                              className={cn(
                                'px-3 py-1.5 rounded-xl border text-xs font-medium transition-all',
                                isSelected
                                  ? 'border-green-500 bg-green-500 text-white'
                                  : 'border-gray-200 bg-white text-gray-600 hover:border-green-300',
                              )}
                            >
                              {cls.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={
                    isSaving ||
                    !commonBankConfig.title.trim() ||
                    selectedCommonQuestions.length === 0
                  }
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {isSaving
                    ? 'Đang tạo đề thi...'
                    : `Tạo đề thi (${selectedCommonQuestions.length} câu)`}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="w-full mt-3 py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Question selection */}
          <div className="lg:col-span-7 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 text-center">
                <div className="text-3xl font-bold text-gray-900">{commonQuestions.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                  Câu hỏi trong ngân hàng
                </div>
              </div>
              <div className="bg-green-50 rounded-2xl border border-green-200 shadow-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-700">
                  {selectedCommonQuestions.length}
                </div>
                <div className="text-xs text-green-600 uppercase tracking-wider font-semibold">
                  Đã chọn
                </div>
              </div>
              <div className="bg-blue-50 rounded-2xl border border-blue-200 shadow-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-700">
                  {commonQuestions.reduce((sum, q) => {
                    if (selectedCommonQuestions.includes(q._id)) {
                      return sum + (q.weight || 1);
                    }
                    return sum;
                  }, 0)}
                </div>
                <div className="text-xs text-blue-600 uppercase tracking-wider font-semibold">
                  Tổng điểm
                </div>
              </div>
            </div>

            {/* Question list */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                    <List className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">Danh sách câu hỏi</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCommonQuestions(commonQuestions.map((q) => q._id));
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    Chọn tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCommonQuestions([])}
                    className="px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-200">
                {commonQuestions.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FolderPlus className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="font-medium mb-2">Chưa có câu hỏi trong ngân hàng chung</p>
                    <p className="text-xs text-gray-400">Vui lòng thay đổi bộ lọc</p>
                  </div>
                ) : (
                  commonQuestions.map((q) => {
                    const isSelected = selectedCommonQuestions.includes(q._id);
                    return (
                      <div
                        key={q._id}
                        onClick={() => toggleSelectQuestion(q._id)}
                        className={cn(
                          'p-6 cursor-pointer transition-all',
                          isSelected
                            ? 'bg-green-50 hover:bg-green-100'
                            : 'bg-white hover:bg-gray-50',
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              'flex-shrink-0 w-6 h-6 rounded border flex items-center justify-center transition-all mt-0.5',
                              isSelected
                                ? 'border-green-500 bg-green-500'
                                : 'border-gray-300 bg-white hover:border-green-400',
                            )}
                          >
                            {isSelected && <CheckSquare className="w-4 h-4 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 mb-2">{q.content}</p>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                                {q.type}
                              </span>
                              <span
                                className={cn(
                                  'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md',
                                  q.difficulty === 'Dễ' || q.difficulty === 'Nhận biết'
                                    ? 'bg-green-100 text-green-700'
                                    : q.difficulty === 'Trung bình' || q.difficulty === 'Thông hiểu'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-red-100 text-red-700',
                                )}
                              >
                                {q.difficulty}
                              </span>
                              {q.author && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {q.author}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Import exam view
  if (viewMode === 'import') {
    // Update a question
    const handleUpdateQuestion = (index, updates) => {
      const newQuestions = [...parsedQuestions];
      newQuestions[index] = { ...newQuestions[index], ...updates };
      setParsedQuestions(newQuestions);
    };

    // Add new question
    const addNewQuestion = () => {
      const newId = `q${parsedQuestions.length + 1}`;
      setParsedQuestions([
        ...parsedQuestions,
        {
          id: newId,
          content: '',
          contentImage: null,
          type: 'Trắc nghiệm',
          difficulty: 'Trung bình',
          subject: importConfig.subject,
          grade: importConfig.grade,
          answers: [
            { id: 'A', content: '', contentImage: null, isCorrect: false },
            { id: 'B', content: '', contentImage: null, isCorrect: false },
            { id: 'C', content: '', contentImage: null, isCorrect: false },
            { id: 'D', content: '', contentImage: null, isCorrect: false },
          ],
        },
      ]);
      setSelectedQuestionIndex(parsedQuestions.length);
    };

    // Save exam
    const handleSaveExam = async () => {
      if (!parsedQuestions.length) {
        showToast({ message: 'Không có câu hỏi nào để lưu', type: 'error' });
        return;
      }

      setIsSaving(true);
      try {
        const payload = {
          examInfo: {
            title: parsedExamInfo?.title || 'Đề thi từ file',
            subject: importConfig.subject,
            grade: importConfig.grade,
            duration: parsedExamInfo?.duration || 45,
          },
          questions: parsedQuestions,
        };

        const result = await examApi.importParsed(payload);
        showToast({ message: result?.data?.message || 'Nhập đề thi thành công!', type: 'success' });

        const refreshed = await examApi.getMine().catch(() => ({ data: [] }));
        setMyExams(refreshed.data || []);

        setImportFile(null);
        setImportFilePreviewUrl(null);
        setParsedQuestions([]);
        setParsedExamInfo(null);
        setViewMode('list');
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Không thể tạo đề thi';
        showToast({ message: errorMsg, type: 'error' });
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode('list')}
              className="text-gray-600 hover:text-gray-800 transition-colors p-1 rounded hover:bg-gray-100"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Nhập đề thi từ file</h1>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={importConfig.subject}
              onChange={(e) => setImportConfig({ ...importConfig, subject: e.target.value })}
              className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm"
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
            <select
              value={importConfig.grade}
              onChange={(e) => setImportConfig({ ...importConfig, grade: e.target.value })}
              className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm"
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
            {parsedQuestions.length > 0 && (
              <button
                onClick={handleSaveExam}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? 'Đang lưu...' : 'Lưu đề thi'}
              </button>
            )}
          </div>
        </div>

        {/* Main content - split view */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left panel: Question editor */}
          <div className="w-1/2 border-r overflow-auto bg-white">
            {!importFile ? (
              <div className="flex flex-col items-center justify-center h-full p-12">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  <Upload className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Chọn file để bắt đầu</h3>
                <p className="text-gray-500 text-center mb-6 max-w-md">
                  Tải lên file PDF hoặc Word (.docx) để tạo đề thi.
                </p>
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.pdf,.docx,.xlsx,.xls';
                    input.onchange = (e) => {
                      if (e.target.files?.[0]) {
                        startImportFromFile(e.target.files[0]);
                      }
                    };
                    input.click();
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
                >
                  Chọn file
                </button>
              </div>
            ) : isParsing ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-lg font-semibold text-gray-700">Đang phân tích file...</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Question list */}
                <div className="border-b border-gray-200 p-3 flex items-center gap-2 overflow-x-auto bg-gray-50">
                  {parsedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedQuestionIndex(idx)}
                      className={cn(
                        'flex-shrink-0 px-3 py-1.5 rounded-md text-sm font-semibold transition-all border',
                        selectedQuestionIndex === idx
                          ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100',
                      )}
                    >
                      Câu {idx + 1}
                    </button>
                  ))}
                  <button
                    onClick={addNewQuestion}
                    className="flex-shrink-0 px-3 py-1.5 bg-green-500 text-white rounded-md text-sm font-semibold hover:bg-green-600 transition-all flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Thêm câu
                  </button>
                </div>

                {/* Question editor */}
                {parsedQuestions.length > 0 && (
                  <div className="flex-1 overflow-auto p-6">
                    <div className="mb-5">
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Nội dung câu hỏi
                      </label>
                      {parsedQuestions[selectedQuestionIndex].contentImage ? (
                        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                          <img
                            src={parsedQuestions[selectedQuestionIndex].contentImage}
                            alt="Question"
                            className="max-w-full rounded"
                          />
                          <button
                            onClick={() =>
                              handleUpdateQuestion(selectedQuestionIndex, { contentImage: null })
                            }
                            className="mt-2 text-xs text-red-500 hover:text-red-700"
                          >
                            Xóa hình ảnh
                          </button>
                        </div>
                      ) : (
                        <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                          <div className="text-4xl mb-2">📷</div>
                          <p>Chưa có hình ảnh câu hỏi</p>
                          <p className="text-xs mt-1">
                            Bạn có thể dán ảnh hoặc nhập nội dung văn bản bên dưới
                          </p>
                        </div>
                      )}
                      <textarea
                        value={parsedQuestions[selectedQuestionIndex].content}
                        onChange={(e) =>
                          handleUpdateQuestion(selectedQuestionIndex, { content: e.target.value })
                        }
                        className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-xl text-sm resize-vertical min-h-[100px] font-serif"
                        placeholder="Hoặc nhập nội dung câu hỏi..."
                      />
                    </div>

                    <div className="mb-5 grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Loại câu hỏi
                        </label>
                        <select
                          value={parsedQuestions[selectedQuestionIndex].type}
                          onChange={(e) =>
                            handleUpdateQuestion(selectedQuestionIndex, { type: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="Trắc nghiệm">Trắc nghiệm</option>
                          <option value="Tự luận">Tự luận</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Độ khó
                        </label>
                        <select
                          value={parsedQuestions[selectedQuestionIndex].difficulty}
                          onChange={(e) =>
                            handleUpdateQuestion(selectedQuestionIndex, {
                              difficulty: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="Dễ">Dễ</option>
                          <option value="Trung bình">Trung bình</option>
                          <option value="Khó">Khó</option>
                        </select>
                      </div>
                    </div>

                    {/* Answers */}
                    {parsedQuestions[selectedQuestionIndex].type === 'Trắc nghiệm' && (
                      <div className="space-y-4">
                        <label className="text-sm font-semibold text-gray-700 block">
                          Các lựa chọn
                        </label>
                        {parsedQuestions[selectedQuestionIndex].answers.map((ans, ansIdx) => (
                          <div
                            key={ansIdx}
                            className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <input
                              type="radio"
                              name={`correct-${selectedQuestionIndex}`}
                              checked={ans.isCorrect}
                              onChange={() => {
                                const newAnswers = [
                                  ...parsedQuestions[selectedQuestionIndex].answers,
                                ];
                                newAnswers.forEach((a, i) => (a.isCorrect = i === ansIdx));
                                handleUpdateQuestion(selectedQuestionIndex, {
                                  answers: newAnswers,
                                });
                              }}
                              className="mt-1.5 w-4 h-4 text-blue-600"
                            />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-800 mb-1">{ans.id}.</div>
                              {ans.contentImage ? (
                                <div>
                                  <img
                                    src={ans.contentImage}
                                    alt={`Option ${ans.id}`}
                                    className="max-w-full rounded border mb-1"
                                  />
                                  <button
                                    onClick={() => {
                                      const newAnswers = [
                                        ...parsedQuestions[selectedQuestionIndex].answers,
                                      ];
                                      newAnswers[ansIdx].contentImage = null;
                                      handleUpdateQuestion(selectedQuestionIndex, {
                                        answers: newAnswers,
                                      });
                                    }}
                                    className="text-xs text-red-500"
                                  >
                                    Xóa
                                  </button>
                                </div>
                              ) : null}
                              <textarea
                                value={ans.content}
                                onChange={(e) => {
                                  const newAnswers = [
                                    ...parsedQuestions[selectedQuestionIndex].answers,
                                  ];
                                  newAnswers[ansIdx].content = e.target.value;
                                  handleUpdateQuestion(selectedQuestionIndex, {
                                    answers: newAnswers,
                                  });
                                }}
                                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded text-sm resize-vertical font-serif"
                                rows={2}
                                placeholder="Nhập nội dung lựa chọn..."
                              />
                            </div>
                            {ans.isCorrect && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                Đáp án đúng
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right panel: File preview */}
          <div className="w-1/2 bg-slate-200 overflow-auto flex flex-col">
            {!importFilePreviewUrl ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Chọn file để xem trước</p>
              </div>
            ) : (
              <div className="flex-1 overflow-auto flex flex-col items-center p-4">
                {/* Zoom controls */}
                <div className="mb-4 flex items-center gap-3 bg-white rounded-lg px-4 py-2 shadow-sm">
                  <span className="text-sm text-gray-600">Tỷ lệ:</span>
                  <button
                    onClick={() => setPageScale((p) => Math.max(0.5, p - 0.25))}
                    className="px-3 py-1 hover:bg-gray-100 rounded border border-gray-300"
                  >
                    -
                  </button>
                  <span className="text-sm text-gray-700 w-16 text-center">
                    {Math.round(pageScale * 100)}%
                  </span>
                  <button
                    onClick={() => setPageScale((p) => Math.min(2, p + 0.25))}
                    className="px-3 py-1 hover:bg-gray-100 rounded border border-gray-300"
                  >
                    +
                  </button>
                </div>

                {/* Preview */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  {importFile.name.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={`${importFilePreviewUrl}#toolbar=0`}
                      className="w-[800px] h-[1000px]"
                      style={{ transform: `scale(${pageScale})`, transformOrigin: 'top left' }}
                      title="PDF preview"
                    />
                  ) : (
                    <img
                      src={importFilePreviewUrl}
                      alt="File preview"
                      style={{ transform: `scale(${pageScale})`, transformOrigin: 'top left' }}
                      className="block"
                    />
                  )}
                </div>

                {/* Instructions */}
                <div className="mt-4 text-sm text-gray-600 max-w-md text-center">
                  💡 Mẹo: Thay vì tự động phân tích, hãy xem file ở khung bên phải và chụp ảnh các
                  phần câu hỏi/đáp án (hoặc nhập nội dung thủ công) để đảm bảo tính chính xác, đặc
                  biệt với các công thức toán học!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Create view
  if (viewMode === 'create') {
    const supportedExtensions = '.pdf, .docx';

    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setViewMode('list')}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Tạo đề mới</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div
              className={cn(
                'bg-white rounded-2xl shadow-lg border-2 border-dashed transition-all p-12 text-center',
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300',
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  replaceFiles(Array.from(e.dataTransfer.files));
                  setViewMode('create-upload');
                }
              }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = '.pdf,.docx';
                input.onchange = (e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    replaceFiles(Array.from(e.target.files));
                    setViewMode('create-upload');
                  }
                };
                input.click();
              }}
            >
              <div className="w-16 h-16 mx-auto mb-6 bg-blue-50 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                Chọn File hoặc kéo thả File vào đây
              </h3>
              <p className="text-gray-500 text-sm mb-2">
                Hỗ trợ các định dạng {supportedExtensions}
              </p>
              <p className="text-gray-500 text-sm">
                Có thể tải lên file Bài tập, Đề thi hoặc Bảng đáp án để chấm offline.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowOnlineOptions((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="text-base font-bold text-gray-900">Online</div>
                {showOnlineOptions ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {showOnlineOptions && (
                <div className="border-t border-gray-200 divide-y divide-gray-200">
                  <button
                    type="button"
                    onClick={() => handleOptionClick('Tự soạn Đề thi / Bài tập')}
                    className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0">
                        <Edit3 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900">Tự soạn Đề thi / Bài tập</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Soạn đề trực tiếp, thêm câu hỏi từ mẫu hoặc copy & paste.
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOptionClick('Tạo đề thi tương tác')}
                    className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 flex-shrink-0">
                        <ScanFace className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                          Tạo đề thi tương tác
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                            Mới
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          Tạo đề thi, trò chơi học tập cho học sinh làm trực tiếp trên màn hình.
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOptionClick('Tạo đề thi đánh giá năng lực')}
                    className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                        <Layout className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900">Tạo đề thi đánh giá năng lực</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Tạo đề theo cấu trúc chủ đề, gắn các đề thi thành phần theo từng chủ đề.
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOptionClick('Tạo đề từ Ma trận đề')}
                    className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-lime-50 flex items-center justify-center text-lime-600 flex-shrink-0">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900">Tạo đề từ Ma trận đề</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Sinh đề theo tỉ lệ chủ đề và mức độ khó bạn lựa chọn.
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOptionClick('Tạo đề thi từ file Excel')}
                    className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900">Tạo đề thi từ file Excel</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Import câu hỏi từ file Excel để tạo đề nhanh chóng và thuận tiện.
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowOfflineOptions((v) => !v)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="text-base font-bold text-gray-900">Offline</div>
                {showOfflineOptions ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {showOfflineOptions && (
                <div className="border-t border-gray-200 divide-y divide-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = '.pdf,.docx';
                      input.onchange = (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          replaceFiles(Array.from(e.target.files));
                          setViewMode('create-upload');
                        }
                      };
                      input.click();
                    }}
                    className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900">Tải lên đề (offline)</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Tải lên đề thi/bài tập/bảng đáp án để chấm offline.
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'create-upload') {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setViewMode('create')}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Tạo đề mới</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div
              className={cn(
                'bg-white rounded-2xl shadow-lg border-2 border-dashed transition-all p-12 text-center',
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300',
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = '.pdf,.docx';
                input.onchange = (e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFiles(Array.from(e.target.files));
                  }
                };
                input.click();
              }}
            >
              {selectedFiles.length === 0 ? (
                <>
                  <div className="w-16 h-16 mx-auto mb-6 bg-blue-50 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-4">
                    Chọn File hoặc kéo thả File vào đây
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Hỗ trợ các định dạng .pdf, .docx, .xlsx, .azt, .tex, .zip, Ảnh
                  </p>
                </>
              ) : (
                <div className="text-left">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">
                    File đã chọn ({selectedFiles.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          {file.preview ? (
                            <img
                              src={file.preview}
                              alt={file.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <File className="w-6 h-6 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-800 truncate max-w-xs">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <XCircle className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = '.pdf,.docx';
                      input.onchange = (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFiles(Array.from(e.target.files));
                        }
                      };
                      input.click();
                    }}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm file khác
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Thông tin đề thi</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tiêu đề đề thi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Nhập tiêu đề..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Môn học
                    </label>
                    <select
                      value={form.subject}
                      onChange={(e) => handleFormChange('subject', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Khối lớp
                    </label>
                    <select
                      value={form.grade}
                      onChange={(e) => handleFormChange('grade', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Thời lượng (phút)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.duration}
                      onChange={(e) => handleFormChange('duration', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Số lần làm tối đa
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={form.maxAttempts}
                      onChange={(e) => handleFormChange('maxAttempts', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Không giới hạn"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mô tả chi tiết
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    placeholder="Hướng dẫn hoặc lưu ý cho thí sinh..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Trạng thái đề thi
                    </label>
                    <select
                      value="Published"
                      disabled
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Published">Công khai</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Thời gian bắt đầu
                    </label>
                    <input
                      type="datetime-local"
                      value={form.startAt}
                      onChange={(e) => handleFormChange('startAt', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Thời gian kết thúc
                    </label>
                    <input
                      type="datetime-local"
                      value={form.endAt}
                      onChange={(e) => handleFormChange('endAt', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (!form.title.trim()) {
                      showToast({
                        type: 'error',
                        title: 'Lỗi',
                        message: 'Vui lòng nhập tiêu đề đề thi!',
                      });
                      return;
                    }

                    setIsSaving(true);
                    try {
                      const formData = new FormData();

                      const examData = {
                        title: form.title,
                        subject: form.subject,
                        grade: form.grade,
                        duration: Number(form.duration),
                        description: form.description,
                        status: 'Published',
                        startAt: form.startAt ? new Date(form.startAt) : undefined,
                        endAt: form.endAt ? new Date(form.endAt) : undefined,
                        maxAttempts: form.maxAttempts ? Number(form.maxAttempts) : undefined,
                      };

                      formData.append('examData', JSON.stringify(examData));

                      if (selectedFiles.length > 0) {
                        selectedFiles.forEach((fileWrapper) => {
                          formData.append('files', fileWrapper.file);
                        });
                      }

                      await examApi.createWithFiles(formData);
                      showToast({
                        type: 'success',
                        title: 'Thành công',
                        message: 'Đề thi đã được tạo thành công!',
                      });

                      const refreshed = await examApi.getMine().catch(() => ({ data: [] }));
                      setMyExams(refreshed.data || []);

                      resetForm();
                      setSelectedFiles([]);
                      setViewMode('list');
                    } catch (err) {
                      showToast({
                        type: 'error',
                        title: 'Lỗi',
                        message: err.response?.data?.message || 'Không thể tạo đề thi!',
                      });
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-70"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {isSaving ? 'Đang lưu...' : 'Tạo đề thi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      {/* Header with Actions */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode('common-bank')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <Table className="w-5 h-5" />
            Tạo đề từ ngân hàng chung
          </button>

          <button
            onClick={() =>
              showToast({
                type: 'info',
                title: 'Tính năng sắp có',
                message: 'Tính năng tạo nhanh thư mục đang được phát triển.',
              })
            }
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-700 to-blue-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <List className="w-5 h-5" />
            Tạo nhanh thư mục
          </button>

          <button
            onClick={() => setViewMode('create')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-lime-500 to-lime-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-5 h-5" />
            Tạo đề thi
          </button>

          <button
            onClick={() =>
              showToast({
                type: 'info',
                title: 'Tính năng sắp có',
                message: 'Tính năng tạo thư mục đang được phát triển.',
              })
            }
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-800 to-blue-900 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <FolderPlus className="w-5 h-5" />
            Tạo thư mục
          </button>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Tất cả</h2>

      {/* Exams Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="p-6 text-left">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={
                      selectedExams.length === filteredExams.length && filteredExams.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedExams(filteredExams.map((e) => e._id));
                      } else {
                        setSelectedExams([]);
                      }
                    }}
                  />
                </th>
                <th className="p-6 text-left text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  <div className="flex items-center gap-2">Tên đề thi</div>
                </th>
                <th className="p-6 text-left text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Môn học
                </th>
                <th className="p-6 text-left text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Số câu hỏi
                </th>
                <th className="p-6 text-left text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Thời gian
                </th>
                <th className="p-6 text-left text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Trạng thái
                </th>
                <th className="p-6 text-left text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Ngày tạo
                </th>
                <th className="p-6 text-left text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-500">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="font-medium mb-2">Chưa có đề thi nào</p>
                    <button
                      type="button"
                      onClick={() => setViewMode('quick-create')}
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                      Tạo đề thi đầu tiên
                    </button>
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam) => (
                  <tr key={exam._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-6">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedExams.includes(exam._id)}
                        onChange={() => {
                          setSelectedExams((prev) =>
                            prev.includes(exam._id)
                              ? prev.filter((id) => id !== exam._id)
                              : [...prev, exam._id],
                          );
                        }}
                      />
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="font-bold text-gray-900">{exam.title}</span>
                      </div>
                    </td>
                    <td className="p-6 text-gray-600">{exam.subject}</td>
                    <td className="p-6 text-gray-600">{exam.questions?.length || 0}</td>
                    <td className="p-6 text-gray-600">{exam.duration} phút</td>
                    <td className="p-6">
                      <span
                        className={cn(
                          'px-3 py-1 text-xs font-bold rounded-full',
                          exam.status === 'Published'
                            ? 'bg-green-100 text-green-700'
                            : exam.status === 'Archived'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-amber-100 text-amber-700',
                        )}
                      >
                        {exam.status || 'Draft'}
                      </span>
                    </td>
                    <td className="p-6 text-gray-600">
                      {exam.createdAt ? new Date(exam.createdAt).toLocaleDateString('vi-VN') : '-'}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewMode('quick-create')}
                          className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
