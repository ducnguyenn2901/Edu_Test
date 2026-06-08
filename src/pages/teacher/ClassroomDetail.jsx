import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Send,
  Smile,
  MessageSquare,
  Users,
  BookOpen,
  Clock,
  MessageCircle,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle,
  Calendar,
  Edit3,
  Trash2,
} from 'lucide-react';
import { classroomApi, chatApi } from '../../services/api';
import { socketService } from '../../services/socketService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CreateClassModal } from '../../components/common/CreateClassModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { ClassroomStats } from './ClassroomStats';
import { cn } from '../../lib/utils';

export function ClassroomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('community'); // 'community' or 'private'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [communityMessagesCount, setCommunityMessagesCount] = useState(0);

  // Community chat state
  const [communityMessages, setCommunityMessages] = useState([]);
  const [communityInput, setCommunityInput] = useState('');
  const [loadingCommunity, setLoadingCommunity] = useState(false);

  // Private chat state
  const [privateMessages, setPrivateMessages] = useState([]);
  const [privateInput, setPrivateInput] = useState('');
  const [loadingPrivate, setLoadingPrivate] = useState(false);

  const communityEndRef = useRef(null);
  const privateEndRef = useRef(null);

  const handleNewMessage = useCallback((message) => {
    if (message.classroom === id) {
      if (message.type === 'community' && tab === 'community') {
        setCommunityMessages((prev) => {
          if (prev.find((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
      } else if (message.type === 'teacher-student' && tab === 'private' && selectedStudent) {
        const isRelevant =
          (message.sender._id === selectedStudent._id || message.recipient._id === selectedStudent._id);
        if (isRelevant) {
          setPrivateMessages((prev) => {
            if (prev.find((m) => m._id === message._id)) return prev;
            return [...prev, message];
          });
        }
      }
    }
  }, [id, tab, selectedStudent]);

  const fetchClassroom = useCallback(async () => {
    try {
      setLoading(true);
      const response = await classroomApi.getById(id);
      setClassroom(response.data);
    } catch (_err) {
      showToast({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể tải thông tin lớp học.',
      });
      navigate('/teacher/classrooms');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    fetchClassroom();
    socketService.connect();

    return () => {
      socketService.offNewMessage(handleNewMessage);
    };
  }, [fetchClassroom, handleNewMessage]);

  const fetchCommunityMessages = useCallback(async () => {
    if (!id) return;
    try {
      setLoadingCommunity(true);
      const response = await chatApi.getCommunityMessages(id);
      setCommunityMessages(response.data || []);
      setCommunityMessagesCount((response.data || []).length);
    } catch (_err) {
      console.error('Lỗi tải tin nhắn công khai:', _err);
    } finally {
      setLoadingCommunity(false);
    }
  }, [id]);

  const fetchPrivateMessages = useCallback(async () => {
    if (!id || !selectedStudent) return;
    try {
      setLoadingPrivate(true);
      const response = await chatApi.getTeacherStudentMessages(id, selectedStudent._id);
      setPrivateMessages(response.data || []);
    } catch (_err) {
      console.error('Lỗi tải tin nhắn riêng:', _err);
    } finally {
      setLoadingPrivate(false);
    }
  }, [id, selectedStudent]);

  useEffect(() => {
    if (tab === 'community') {
      fetchCommunityMessages();
      socketService.joinClass(id);
      socketService.onNewMessage(handleNewMessage);
    }
  }, [tab, id, fetchCommunityMessages, handleNewMessage]);

  useEffect(() => {
    if (tab === 'private' && selectedStudent) {
      fetchPrivateMessages();
      socketService.onNewMessage(handleNewMessage);
    }
  }, [tab, selectedStudent, id, fetchPrivateMessages, handleNewMessage]);

  useEffect(() => {
    if (tab === 'community') {
      communityEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [communityMessages, tab]);

  useEffect(() => {
    if (tab === 'private') {
      privateEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [privateMessages, tab]);

  const handleSendCommunityMessage = async (e) => {
    e.preventDefault();
    if (!communityInput.trim()) return;

    try {
      const response = await chatApi.sendMessage({
        classroomId: id,
        content: communityInput,
        type: 'community',
      });
      socketService.sendMessage(response.data);
      setCommunityInput('');
    } catch (_err) {
      showToast({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể gửi tin nhắn.',
      });
    }
  };

  const handleSendPrivateMessage = async (e) => {
    e.preventDefault();
    if (!privateInput.trim() || !selectedStudent) return;

    try {
      const response = await chatApi.sendMessage({
        classroomId: id,
        content: privateInput,
        type: 'teacher-student',
        recipient: selectedStudent._id,
      });
      socketService.sendMessage(response.data);
      setPrivateInput('');
    } catch (_err) {
      showToast({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể gửi tin nhắn.',
      });
    }
  };

  const handleDeleteClass = async () => {
    try {
      await classroomApi.delete(id);
      showToast({
        type: 'success',
        title: 'Thành công',
        message: 'Đã xóa lớp học thành công.',
      });
      navigate('/teacher/classrooms');
    } catch (_err) {
      showToast({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể xóa lớp học.',
      });
    } finally {
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] space-y-4">
        <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">Đang tải...</p>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Lớp học không tồn tại.</p>
        <button
          onClick={() => navigate('/teacher/classrooms')}
          className="mt-4 px-6 py-2 bg-brand text-white rounded-2xl font-bold"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      {/* Modals */}
      <CreateClassModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        classroom={classroom}
        onClassCreated={() => {
          fetchClassroom();
          setIsEditModalOpen(false);
        }}
      />
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteClass}
        title="Xác nhận xóa lớp học"
        message={`Bạn có chắc chắn muốn xóa lớp học "${classroom?.name}"? Hành động này không thể hoàn tác.`}
      />

      {/* Header */}
      <div className="mb-6 md:mb-8 flex items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-2 md:gap-4 flex-1">
          <button
            onClick={() => navigate('/teacher/classrooms')}
            className="p-2 md:p-3 hover:bg-gray-100 rounded-2xl transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-5 md:w-6 h-5 md:h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight mb-1 md:mb-2 truncate">
              {classroom.name}
            </h1>
            <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-500 flex-wrap">
              <span className="px-2 md:px-3 py-0.5 md:py-1 bg-blue-50 text-blue-600 rounded-full font-bold">
                {classroom.code}
              </span>
              <span className="flex items-center gap-1 hidden sm:flex">
                <BookOpen className="w-3 md:w-4 h-3 md:h-4" />
                {classroom.subject}
              </span>
              <span className="flex items-center gap-1 hidden md:flex">
                <Users className="w-3 md:w-4 h-3 md:h-4" />
                {classroom.students?.length || 0} HS
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1 md:gap-2 flex-shrink-0">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-2 md:p-3 hover:bg-blue-50 text-blue-600 rounded-2xl transition-colors"
            title="Chỉnh sửa"
          >
            <Edit3 className="w-4 md:w-5 h-4 md:h-5" />
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 md:p-3 hover:bg-rose-50 text-rose-600 rounded-2xl transition-colors"
            title="Xóa lớp"
          >
            <Trash2 className="w-4 md:w-5 h-4 md:h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
        {/* Sidebar - Class Info & Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200">
              <p className="text-2xl font-black text-blue-600">
                {(classroom.students?.length || 0) + (classroom.pendingStudents?.length || 0)}
              </p>
              <p className="text-xs text-blue-700 font-bold uppercase tracking-widest mt-2">
                Tổng học sinh
              </p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-5 border border-emerald-200">
              <p className="text-2xl font-black text-emerald-600">
                {classroom.students?.length || 0}
              </p>
              <p className="text-xs text-emerald-700 font-bold uppercase tracking-widest mt-2">
                Đã duyệt
              </p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-5 border border-amber-200">
              <p className="text-2xl font-black text-amber-600">
                {classroom.pendingStudents?.length || 0}
              </p>
              <p className="text-xs text-amber-700 font-bold uppercase tracking-widest mt-2">
                Chờ duyệt
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 border border-purple-200">
              <p className="text-2xl font-black text-purple-600">
                {(classroom.teachers?.length || 0) + (classroom.homeroomTeacher ? 1 : 0)}
              </p>
              <p className="text-xs text-purple-700 font-bold uppercase tracking-widest mt-2">
                Giáo viên
              </p>
            </div>
          </div>

          {/* Class Info Card */}
          <div className="bg-white rounded-3xl p-4 md:p-6 border border-gray-100 shadow-sm md:sticky md:top-6">
            <h3 className="font-black text-sm text-gray-900 uppercase tracking-widest mb-6">
              Thông tin lớp
            </h3>

            <div className="space-y-6">
              {/* Grade & Subject */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">
                  Khối
                </p>
                <p className="text-sm font-bold text-gray-900">{classroom.grade || 'N/A'}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">
                  Môn học
                </p>
                <p className="text-sm font-bold text-gray-900">{classroom.subject}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">
                  Trường
                </p>
                <p className="text-sm font-bold text-gray-900">{classroom.school || 'N/A'}</p>
              </div>

              {/* Teachers */}
              {(classroom.homeroomTeacher || classroom.teachers?.length > 0) && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-3">
                    Giáo viên
                  </p>
                  <div className="space-y-2">
                    {classroom.homeroomTeacher && (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-600 font-bold text-xs">
                          {classroom.homeroomTeacher.name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {classroom.homeroomTeacher.name}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">Chủ nhiệm</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-2xl text-center">
                    <p className="text-2xl font-black text-gray-900">
                      {classroom.students?.length || 0}
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                      Học sinh
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl text-center">
                    <p className="text-2xl font-black text-amber-500">
                      {classroom.pendingStudents?.length || 0}
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                      Chờ duyệt
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Card */}
          <ClassroomStats classroom={classroom} communityMessagesCount={communityMessagesCount} />
        </div>

        {/* Main Content - Chat */}
        <div className="md:col-span-3 lg:col-span-3">
          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8 border-b border-gray-200">
            <button
              onClick={() => setTab('community')}
              className={cn(
                'pb-4 px-4 font-black text-sm uppercase tracking-widest transition-colors relative',
                tab === 'community'
                  ? 'text-brand'
                  : 'text-gray-500 hover:text-gray-900'
              )}
            >
              <MessageSquare className="w-4 h-4 inline-block mr-2" />
              Chat công khai
              {tab === 'community' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand"></div>
              )}
            </button>
            <button
              onClick={() => setTab('private')}
              className={cn(
                'pb-4 px-4 font-black text-sm uppercase tracking-widest transition-colors relative',
                tab === 'private'
                  ? 'text-brand'
                  : 'text-gray-500 hover:text-gray-900'
              )}
            >
              <MessageCircle className="w-4 h-4 inline-block mr-2" />
              Chat riêng
              {tab === 'private' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand"></div>
              )}
            </button>
          </div>

          {tab === 'community' ? (
            <CommunityChat
              communityMessages={communityMessages}
              communityInput={communityInput}
              setCommunityInput={setCommunityInput}
              handleSendCommunityMessage={handleSendCommunityMessage}
              loadingCommunity={loadingCommunity}
              communityEndRef={communityEndRef}
              user={user}
            />
          ) : (
            <PrivateChat
              classroom={classroom}
              selectedStudent={selectedStudent}
              setSelectedStudent={setSelectedStudent}
              privateMessages={privateMessages}
              privateInput={privateInput}
              setPrivateInput={setPrivateInput}
              handleSendPrivateMessage={handleSendPrivateMessage}
              loadingPrivate={loadingPrivate}
              privateEndRef={privateEndRef}
              user={user}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CommunityChat({
  communityMessages,
  communityInput,
  setCommunityInput,
  handleSendCommunityMessage,
  loadingCommunity,
  communityEndRef,
  user,
}) {
  return (
    <div className="flex flex-col h-[400px] md:h-[600px] bg-white rounded-3xl border border-gray-100 shadow-sm">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {loadingCommunity ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Đang tải tin nhắn...</p>
          </div>
        ) : communityMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Chưa có tin nhắn nào</p>
              <p className="text-xs text-gray-400 mt-2">Hãy là người đầu tiên gửi tin nhắn</p>
            </div>
          </div>
        ) : (
          communityMessages.map((msg) => (
            <div
              key={msg._id}
              className={cn(
                'flex gap-3 animate-in fade-in-50 duration-300',
                msg.sender._id === user._id ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.sender._id !== user._id && (
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                  {msg.sender.name?.charAt(0)}
                </div>
              )}
              <div
                className={cn(
                  'max-w-xs px-4 py-3 rounded-2xl',
                  msg.sender._id === user._id
                    ? 'bg-brand text-white'
                    : 'bg-gray-100 text-gray-900'
                )}
              >
                {msg.sender._id !== user._id && (
                  <p className="text-xs font-bold opacity-70 mb-1">{msg.sender.name}</p>
                )}
                <p className="text-sm font-medium break-words">{msg.content}</p>
                <p
                  className={cn(
                    'text-xs mt-1',
                    msg.sender._id === user._id ? 'text-blue-100' : 'text-gray-500'
                  )}
                >
                  {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={communityEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-3 md:p-4">
        <form onSubmit={handleSendCommunityMessage} className="flex gap-2 md:gap-3">
          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            value={communityInput}
            onChange={(e) => setCommunityInput(e.target.value)}
            className="flex-1 px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base bg-gray-50 border border-gray-200 rounded-2xl font-medium focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="button"
            className="p-2.5 md:p-3 text-gray-400 hover:text-brand hover:bg-gray-50 rounded-2xl transition-colors flex-shrink-0"
          >
            <Smile className="w-4 md:w-5 h-4 md:h-5" />
          </button>
          <button
            type="submit"
            disabled={!communityInput.trim()}
            className="p-2.5 md:p-3 text-white bg-brand hover:bg-blue-700 disabled:bg-gray-300 rounded-2xl transition-colors flex-shrink-0"
          >
            <Send className="w-4 md:w-5 h-4 md:h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

function PrivateChat({
  classroom,
  selectedStudent,
  setSelectedStudent,
  privateMessages,
  privateInput,
  setPrivateInput,
  handleSendPrivateMessage,
  loadingPrivate,
  privateEndRef,
  user,
}) {
  const students = classroom?.students || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
      {/* Student List - Responsive */}
      <div className="md:col-span-1">
        <div className="bg-white rounded-3xl p-4 md:p-6 border border-gray-100 shadow-sm max-h-[400px] md:max-h-[600px] overflow-y-auto">
          <h3 className="font-black text-sm text-gray-900 uppercase tracking-widest mb-4">
            Danh sách học sinh
          </h3>
          <div className="space-y-2">
            {students.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Chưa có học sinh</p>
            ) : (
              students.map((student) => (
                <button
                  key={student._id}
                  onClick={() => setSelectedStudent(student)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left',
                    selectedStudent?._id === student._id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50'
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs flex-shrink-0">
                    {student.name?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate">{student.name}</p>
                    <p className="text-xs text-gray-400 truncate">{student.email}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <div className="md:col-span-3">
        {selectedStudent ? (
          <div className="flex flex-col h-[400px] md:h-[600px] bg-white rounded-3xl border border-gray-100 shadow-sm">
            {/* Chat Header */}
            <div className="p-3 md:p-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {selectedStudent.name?.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{selectedStudent.name}</p>
                <p className="text-xs text-gray-500">{selectedStudent.email}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingPrivate ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Đang tải...</p>
                </div>
              ) : privateMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Chưa có cuộc hội thoại</p>
                  </div>
                </div>
              ) : (
                privateMessages.map((msg) => (
                  <div
                    key={msg._id}
                    className={cn(
                      'flex gap-3',
                      msg.sender._id === user._id ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-xs px-4 py-3 rounded-2xl',
                        msg.sender._id === user._id
                          ? 'bg-brand text-white'
                          : 'bg-gray-100 text-gray-900'
                      )}
                    >
                      <p className="text-sm font-medium break-words">{msg.content}</p>
                      <p
                        className={cn(
                          'text-xs mt-1',
                          msg.sender._id === user._id ? 'text-blue-100' : 'text-gray-500'
                        )}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={privateEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-100 p-3 md:p-4">
              <form onSubmit={handleSendPrivateMessage} className="flex gap-2 md:gap-3">
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={privateInput}
                  onChange={(e) => setPrivateInput(e.target.value)}
                  className="flex-1 px-3 md:px-4 py-2.5 md:py-3 text-sm md:text-base bg-gray-50 border border-gray-200 rounded-2xl font-medium focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
                <button
                  type="submit"
                  disabled={!privateInput.trim()}
                  className="p-2.5 md:p-3 text-white bg-brand hover:bg-blue-700 disabled:bg-gray-300 rounded-2xl transition-colors flex-shrink-0"
                >
                  <Send className="w-4 md:w-5 h-4 md:h-5" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[600px] bg-white rounded-3xl border border-gray-100 text-gray-500">
            <p>Chọn học sinh để bắt đầu chat</p>
          </div>
        )}
      </div>
    </div>
  );
}
