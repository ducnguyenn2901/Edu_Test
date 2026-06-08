import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Info, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { questionApi, categoryApi } from '../../services/api';
import { useToast } from '../../context/ToastContext.jsx';
import { MathEditor } from '../../components/common/MathEditor.jsx';
import { LatexContentEditor } from '../../components/common/LatexContentEditor.jsx';

// This is the same QuestionCard from CreateQuestion. We can extract it to a shared component later.
function QuestionCard({ question, updateQuestion }) {
  const contentTextareaRef = useRef(null);
  const answerTextareaRefs = useRef({});
  const [latexEditorState, setLatexEditorState] = useState({
    open: false,
    target: 'question',
    answerId: null,
  });

  const handleInputChange = (field, value) => {
    updateQuestion(field, value);
  };

  const handleAnswerChange = (answerId, field, value) => {
    const newAnswers = question.answers.map((a) => {
      if (a.id === answerId) {
        return { ...a, [field]: value };
      }
      if ((question.type === 'Trắc nghiệm' || question.type === 'Đúng/Sai') && field === 'isCorrect' && value === true) {
        return { ...a, isCorrect: false };
      }
      return a;
    });
    updateQuestion('answers', newAnswers);
  };

  const addAnswer = () => {
    const lastId =
      question.answers.length > 0 ? question.answers[question.answers.length - 1].id : '@';
    const nextId = String.fromCharCode(lastId.charCodeAt(0) + 1);
    const newAnswers = [...question.answers, { id: nextId, content: '', isCorrect: false }];
    updateQuestion('answers', newAnswers);
  };

  const removeAnswer = (answerId) => {
    if (question.answers.length <= 2) {
      alert('Một câu hỏi phải có ít nhất 2 phương án.');
      return;
    }
    const newAnswers = question.answers.filter((a) => a.id !== answerId);
    updateQuestion('answers', newAnswers);
  };

  if (!question) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group transition-all">
      <div className="p-6 space-y-6">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Nội dung câu hỏi <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <textarea
                ref={contentTextareaRef}
                value={question.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                className="flex-1 min-h-[120px] p-4 border border-gray-200 rounded-xl text-gray-800 text-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50 placeholder-gray-300 leading-relaxed"
                placeholder="Nhập nội dung câu hỏi tại đây..."
              ></textarea>
            </div>
            <div className="flex gap-2 flex-wrap">
              <MathEditor
                value={question.formula || ''}
                onChange={(latex) => handleInputChange('formula', latex)}
              />
              {question.formula && (
                <div className="px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                  <div
                    dangerouslySetInnerHTML={{
                      __html:
                        window.katex?.renderToString(question.formula, {
                          throwOnError: false,
                          displayMode: false,
                        }) || '',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Độ khó
            </label>
            <div className="flex gap-2">
              {['Dễ', 'Trung bình', 'Khó'].map((level) => (
                <button
                  key={level}
                  onClick={() => handleInputChange('difficulty', level)}
                  className={cn(
                    'px-4 py-1.5 rounded-lg border text-sm font-medium transition-colors',
                    question.difficulty === level
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white hover:bg-gray-100 border-gray-300',
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Loại câu hỏi
            </label>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
              {['Trắc nghiệm', 'Đúng/Sai', 'Tự luận'].map((qType) => (
                <button
                  key={qType}
                  onClick={() => handleInputChange('type', qType)}
                  className={cn(
                    'flex-1 py-1 rounded-md text-sm font-medium transition-colors',
                    question.type === qType
                      ? 'bg-white text-blue-600 shadow'
                      : 'text-gray-500 hover:bg-white/50',
                  )}
                >
                  {qType}
                </button>
              ))}
            </div>
          </div>
        </div>

        {question.type === 'Trắc nghiệm' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Phương án
              </h3>
              <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-medium">
                Chọn vòng tròn xanh cho đáp án đúng
              </span>
            </div>
            <div className="space-y-3">
              {question.answers.map((ans) => (
                <div
                  key={ans.id}
                  className="bg-white p-4 rounded-xl border border-gray-200 group/answer space-y-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
                      <input
                        type="radio"
                        name={`correct-answer-${question._id}`}
                        checked={ans.isCorrect}
                        className="peer appearance-none w-6 h-6 border-2 border-gray-300 rounded-full checked:border-blue-600 checked:bg-blue-600 transition-all cursor-pointer hover:border-blue-400"
                        onChange={() => handleAnswerChange(ans.id, 'isCorrect', true)}
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100 text-white transition-opacity">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="w-8 h-8 flex items-center justify-center font-bold rounded-lg text-sm bg-gray-100 text-gray-500 mr-3">
                        {ans.id}
                      </span>
                      <textarea
                        ref={(el) => (answerTextareaRefs.current[ans.id] = el)}
                        value={ans.content}
                        onChange={(e) => handleAnswerChange(ans.id, 'content', e.target.value)}
                        className="w-full bg-transparent border-b-2 border-transparent focus:border-blue-500 focus:outline-none py-1 text-gray-900 font-medium placeholder-gray-400 resize-none min-h-[40px]"
                        placeholder={`Nội dung phương án ${ans.id}...`}
                      />
                    </div>
                    <button
                      onClick={() => removeAnswer(ans.id)}
                      className="opacity-0 group-hover/answer:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <MathEditor
                      value={ans.formula || ''}
                      onChange={(latex) => handleAnswerChange(ans.id, 'formula', latex)}
                    />
                    {ans.formula && (
                      <div className="px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                        <div
                          dangerouslySetInnerHTML={{
                            __html:
                              window.katex?.renderToString(ans.formula, {
                                throwOnError: false,
                                displayMode: false,
                              }) || '',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addAnswer}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Thêm phương án
            </button>
          </div>
        )}

        {question.type === 'Đúng/Sai' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Chọn đáp án đúng
              </h3>
              <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-medium">
                Chọn vòng tròn xanh cho đáp án đúng
              </span>
            </div>
            <div className="space-y-3">
              {question.answers.map((ans) => (
                <div
                  key={ans.id}
                  className="bg-white p-4 rounded-xl border border-gray-200 group/answer space-y-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
                      <input
                        type="radio"
                        name={`correct-answer-${question._id}`}
                        checked={ans.isCorrect}
                        className="peer appearance-none w-6 h-6 border-2 border-gray-300 rounded-full checked:border-blue-600 checked:bg-blue-600 transition-all cursor-pointer hover:border-blue-400"
                        onChange={() => handleAnswerChange(ans.id, 'isCorrect', true)}
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 peer-checked:opacity-100 text-white transition-opacity">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-sm text-gray-900">
                        {ans.id === 'A' ? 'Đúng' : 'Sai'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Lời giải chi tiết
          </label>
          <textarea
            value={question.explanation}
            onChange={(e) => handleInputChange('explanation', e.target.value)}
            className="w-full min-h-[80px] p-3 text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nhập các bước giải để học sinh đối chiếu..."
          ></textarea>
        </div>
      </div>

      <LatexContentEditor
        isOpen={latexEditorState.open}
        title="Soạn nội dung (LaTeX)"
        initialValue={
          latexEditorState.target === 'answer'
            ? question.answers?.find((a) => a.id === latexEditorState.answerId)?.content || ''
            : question.content || ''
        }
        onClose={() => setLatexEditorState((s) => ({ ...s, open: false }))}
        onSave={(next) => {
          if (latexEditorState.target === 'answer') {
            handleAnswerChange(latexEditorState.answerId, 'content', next);
          } else {
            handleInputChange('content', next);
          }
          setLatexEditorState((s) => ({ ...s, open: false }));
        }}
        getPreviewQuestion={(draft) => {
          if (latexEditorState.target === 'answer') {
            const answers = (question.answers || []).map((a) =>
              a.id === latexEditorState.answerId ? { ...a, content: draft } : a,
            );
            return { ...question, answers };
          }
          return { ...question, content: draft };
        }}
      />
    </div>
  );
}

export function EditQuestion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [question, setQuestion] = useState(null);

  useEffect(() => {
    const fetchQuestionData = async () => {
      try {
        setIsLoading(true);
        const [qResponse, catResponse] = await Promise.all([
          questionApi.getById(id),
          categoryApi.getAll(),
        ]);
        setQuestion(qResponse.data);
        setCategories(catResponse.data || []);
      } catch (_error) {
        showToast({ message: 'Không thể tải dữ liệu câu hỏi.', type: 'error' });
        navigate('/teacher/questions');
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestionData();
  }, [id, navigate, showToast]);

  const updateQuestionField = (field, value) => {
    setQuestion((prev) => {
      if (!prev) return null;
      
      if (field === 'type' && value === 'Đúng/Sai') {
        // When changing to True/False, ensure exactly 2 answers
        const currentAnswers = prev.answers || [];
        let newAnswers = currentAnswers;
        
        if (currentAnswers.length !== 2 || currentAnswers[0]?.id !== 'A' || currentAnswers[1]?.id !== 'B') {
          newAnswers = [
            { id: 'A', content: '', isCorrect: currentAnswers.some(a => a.isCorrect && a.id === 'A') || (!currentAnswers.some(a => a.isCorrect) && true) },
            { id: 'B', content: '', isCorrect: currentAnswers.some(a => a.isCorrect && a.id === 'B') || false },
          ];
        }
        
        return { ...prev, [field]: value, answers: newAnswers };
      }
      
      return { ...prev, [field]: value };
    });
  };

  const handleSave = async () => {
    if (!question) return;

    if (!question.content.trim()) {
      showToast({ message: 'Vui lòng nhập nội dung câu hỏi.', type: 'error' });
      return;
    }
    if ((question.type === 'Trắc nghiệm' || question.type === 'Đúng/Sai') && !question.answers.some((a) => a.isCorrect)) {
      showToast({ message: 'Vui lòng chọn ít nhất một đáp án đúng.', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const payload = { ...question };
      if (!payload.category) {
        delete payload.category;
      }
      await questionApi.update(id, payload);
      showToast({ message: 'Đã cập nhật câu hỏi thành công!', type: 'success' });
      navigate('/teacher/questions');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.';
      showToast({ message: errorMsg, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between sticky top-0 bg-gray-50 py-4 z-10 backdrop-blur-sm bg-opacity-90">
        <div className="flex items-center gap-4">
          <Link
            to="/teacher/questions"
            className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-gray-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa câu hỏi</h1>
            <p className="text-sm text-gray-500">ID: {id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/teacher/questions')}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium text-sm shadow-sm disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold border-b border-gray-100 pb-3">
              <Info className="w-5 h-5 text-blue-600" />
              <h3>Thông tin chung</h3>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Môn học</label>
                <select
                  value={question?.subject || ''}
                  onChange={(e) => updateQuestionField('subject', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none"
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Khối lớp</label>
                <select
                  value={question?.grade || ''}
                  onChange={(e) => updateQuestionField('grade', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none"
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Danh mục</label>
                <select
                  value={question?.category || ''}
                  onChange={(e) => updateQuestionField('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none"
                >
                  <option value="">Không chọn</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={question?.isPublic || false}
                  onChange={(e) => updateQuestionField('isPublic', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  Đưa vào ngân hàng chung (cho giáo viên khác sử dụng)
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-9 space-y-4">
          <QuestionCard question={question} updateQuestion={updateQuestionField} />
        </div>
      </div>
    </div>
  );
}
