import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { classroomApi, chatApi, notificationApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { socketService } from '../../services/socketService';
import {
  ChevronLeft,
  MessageSquare,
  MessageCircle,
  Loader2,
  Send,
  BookOpen,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function StudentClassroomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('community');

  // Community Chat
  const [communityMessages, setCommunityMessages] = useState([]);
  const [communityInput, setCommunityInput] = useState('');
  const [loadingCommunity, setLoadingCommunity] = useState(false);
  const communityEndRef = useRef(null);

  // Private Chat
  const [privateMessages, setPrivateMessages] = useState([]);
  const [privateInput, setPrivateInput] = useState('');
  const [loadingPrivate, setLoadingPrivate] = useState(false);
  const privateEndRef = useRef(null);

  const handleNewMessage = useCallback((message) => {
    console.log('[handleNewMessage] Received message:', {
      type: message.type,
      classroom: message.classroom,
      sender: message.sender?.name,
      content: (message.content || message.text)?.substring(0, 50),
      id,
      tab,
    });
    
    if (message.classroom === id) {
      if (message.type === 'community' && tab === 'community') {
        console.log('[handleNewMessage] Adding to community messages');
        setCommunityMessages((prev) => {
          if (prev.find((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        // Show notification for community chat
        if (message.sender._id !== user._id) {
          showToast({
            type: 'info',
            title: 'Tin nhắn mới',
            message: `${message.sender.name}: ${(message.content || message.text).substring(0, 50)}...`,
          });
          // Create notification in notification bar
          notificationApi.getAll().catch(() => {}); // Trigger refresh
        }
      } else if (message.type === 'teacher-student' && tab === 'private') {
        console.log('[handleNewMessage] Checking if private message is relevant');
        const isRelevant =
          message.sender._id === user._id || message.recipient._id === user._id;
        console.log('[handleNewMessage] Private message relevant:', isRelevant);
        if (isRelevant) {
          console.log('[handleNewMessage] Adding to private messages');
          setPrivateMessages((prev) => {
            if (prev.find((m) => m._id === message._id)) return prev;
            return [...prev, message];
          });
          // Show notification for private chat
          if (message.sender._id !== user._id) {
            showToast({
              type: 'info',
              title: 'Tin nhắn từ giáo viên',
              message: `${message.sender.name}: ${(message.content || message.text).substring(0, 50)}...`,
            });
            // Create notification in notification bar
            notificationApi.getAll().catch(() => {}); // Trigger refresh
          }
        }
      }
    } else {
      console.log('[handleNewMessage] Message classroom does not match current classroom');
    }
  }, [id, tab, user._id, showToast]);

  const fetchClassroom = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[fetchClassroom] Fetching classroom with id:', id);
      const response = await classroomApi.getById(id);
      console.log('[fetchClassroom] Response:', response.data);
      console.log('[fetchClassroom] homeroomTeacher:', response.data?.homeroomTeacher);
      setClassroom(response.data);
    } catch (_err) {
      console.error('[fetchClassroom] Error:', _err);
      showToast({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể tải thông tin lớp học.',
      });
      navigate('/student/classrooms');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    fetchClassroom();
    socketService.connect();
    socketService.onNewMessage(handleNewMessage);

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
    } catch (_err) {
      console.error('Lỗi tải tin nhắn công khai:', _err);
    } finally {
      setLoadingCommunity(false);
    }
  }, [id]);

  const fetchPrivateMessages = useCallback(async () => {
    if (!id || !user._id || !classroom?.homeroomTeacher?._id) {
      console.log('[fetchPrivateMessages] Missing data:', {
        id,
        userId: user._id,
        teacherId: classroom?.homeroomTeacher?._id,
      });
      return;
    }
    try {
      setLoadingPrivate(true);
      console.log('[fetchPrivateMessages] Fetching messages for:', {
        classroomId: id,
        teacherId: classroom.homeroomTeacher._id,
      });
      const response = await chatApi.getTeacherStudentMessages(id, classroom.homeroomTeacher._id);
      console.log('[fetchPrivateMessages] Received messages:', response.data);
      setPrivateMessages(response.data || []);
    } catch (_err) {
      console.error('Lỗi tải tin nhắn riêng:', _err);
    } finally {
      setLoadingPrivate(false);
    }
  }, [id, user._id, classroom?.homeroomTeacher?._id]);

  useEffect(() => {
    if (tab === 'community') {
      fetchCommunityMessages();
      socketService.joinClass(id, 'community');
    }
  }, [tab, id, fetchCommunityMessages]);

  useEffect(() => {
    if (tab === 'private') {
      fetchPrivateMessages();
      socketService.joinClass(id, 'teacher-student');
      
      // Periodically refresh private messages to stay in sync
      const interval = setInterval(fetchPrivateMessages, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [tab, id, fetchPrivateMessages, classroom]);

  useEffect(() => {
    communityEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [communityMessages]);

  useEffect(() => {
    privateEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [privateMessages]);

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
    if (!privateInput.trim()) return;
    
    console.log('[PrivateChat] Attempting to send message:', {
      classroom: classroom?._id,
      teacher: classroom?.homeroomTeacher?._id,
      content: privateInput,
    });
    
    if (!classroom?.homeroomTeacher) {
      console.error('[PrivateChat] Teacher not found in classroom');
      showToast({
        type: 'error',
        title: 'Lỗi',
        message: 'Lớp học không có giáo viên chủ nhiệm.',
      });
      return;
    }

    try {
      const payload = {
        classroomId: id,
        content: privateInput,
        type: 'teacher-student',
        recipientId: classroom.homeroomTeacher._id,
      };
      console.log('[PrivateChat] Sending message with payload:', payload);
      
      const response = await chatApi.sendMessage(payload);
      console.log('[PrivateChat] API Response:', {
        status: response.status,
        data: response.data,
      });
      
      if (!response.data) {
        throw new Error('No data in API response');
      }
      
      // Ensure message has required fields for socket transmission
      const messageToSend = {
        ...response.data,
        classroom: id,  // Ensure classroom ID is set
      };
      
      console.log('[PrivateChat] Message to send via socket:', messageToSend);
      
      // Immediately update local state with the new message
      setPrivateMessages((prev) => [...prev, messageToSend]);
      
      // Emit to socket for real-time sync with other clients
      socketService.sendMessage(messageToSend);
      
      setPrivateInput('');
      
      showToast({
        type: 'success',
        title: 'Thành công',
        message: 'Tin nhắn đã được gửi',
      });
    } catch (_err) {
      console.error('Error sending private message:', _err);
      console.error('Error details:', {
        message: _err.message,
        response: _err.response?.data,
        status: _err.response?.status,
      });
      showToast({
        type: 'error',
        title: 'Lỗi',
        message: `Không thể gửi tin nhắn: ${_err.response?.data?.message || _err.message || 'Lỗi không xác định'}`,
      });
    }
  };

  const handleRecallMessage = async (messageId, isPrivate = false) => {
    try {
      const response = await chatApi.recallMessage(messageId);
      if (isPrivate) {
        setPrivateMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId
              ? { ...msg, isRecalled: true, content: '... đã thu hồi tin nhắn' }
              : msg
          )
        );
      } else {
        setCommunityMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId
              ? { ...msg, isRecalled: true, content: '... đã thu hồi tin nhắn' }
              : msg
          )
        );
      }
      socketService.sendMessage(response.data);
      showToast({
        type: 'success',
        title: 'Thành công',
        message: 'Tin nhắn đã được thu hồi.',
      });
    } catch (_err) {
      showToast({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể thu hồi tin nhắn.',
      });
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
          onClick={() => navigate('/student/classrooms')}
          className="mt-4 px-6 py-2 bg-brand text-white rounded-2xl font-bold"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-2 md:gap-4 flex-1">
          <button
            onClick={() => navigate('/student/classrooms')}
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
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sticky top-6 space-y-6">
            {/* Class Info */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-3">
                Thông tin lớp
              </p>
              <div className="space-y-3">
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-black text-gray-900">
                    {classroom.students?.length || 0}
                  </p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                    Học sinh
                  </p>
                </div>
              </div>
            </div>

            {/* Teacher Info */}
            {classroom.homeroomTeacher && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-3">
                  Giáo viên
                </p>
                <div className="space-y-2">
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
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Chat */}
        <div className="md:col-span-3">
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
              Chat với giáo viên
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
              classroom={classroom}
              onRecallMessage={(messageId) => handleRecallMessage(messageId, false)}
            />
          ) : (
            <PrivateChat
              privateMessages={privateMessages}
              privateInput={privateInput}
              setPrivateInput={setPrivateInput}
              handleSendPrivateMessage={handleSendPrivateMessage}
              loadingPrivate={loadingPrivate}
              privateEndRef={privateEndRef}
              user={user}
              teacher={classroom?.homeroomTeacher}
              onRecallMessage={(messageId) => handleRecallMessage(messageId, true)}
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
  classroom,
  onRecallMessage,
}) {
  const formatTime = (date) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const getSenderIcon = (sender) => {
    if (classroom?.homeroomTeacher?._id === sender._id) {
      return '👨‍🏫';
    }
    return '👨‍🎓';
  };

  return (
    <div className="flex flex-col h-[400px] md:h-[600px] bg-white rounded-3xl border border-gray-100 shadow-sm">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {loadingCommunity ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          </div>
        ) : communityMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Chưa có tin nhắn nào</p>
          </div>
        ) : (
          communityMessages.map((msg) => (
            <div
              key={msg._id}
              className={cn(
                'flex gap-3 group',
                msg.sender._id === user._id ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.sender._id !== user._id && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  {msg.sender.name?.charAt(0)}
                </div>
              )}
              <div className="relative">
                <div
                  className={cn(
                    'max-w-xs px-4 py-3 rounded-2xl',
                    msg.sender._id === user._id
                      ? 'bg-brand text-white'
                      : classroom?.homeroomTeacher?._id === msg.sender._id
                      ? 'bg-amber-50 text-amber-900'
                      : 'bg-gray-100 text-gray-900'
                  )}
                >
                  {msg.sender._id !== user._id && (
                    <p className="text-xs font-black mb-1 uppercase tracking-widest">
                      {getSenderIcon(msg.sender)} {msg.sender.name}
                    </p>
                  )}
                  <p className={cn('text-sm font-medium break-words', msg.isRecalled && 'italic opacity-50')}>
                    {msg.content || msg.text}
                  </p>
                  {msg.createdAt && (
                    <p
                      className={cn(
                        'text-xs mt-1',
                        msg.sender._id === user._id
                          ? 'text-blue-100'
                          : classroom?.homeroomTeacher?._id === msg.sender._id
                          ? 'text-amber-700'
                          : 'text-gray-500'
                      )}
                    >
                      {formatTime(msg.createdAt)}
                    </p>
                  )}
                </div>
                {msg.sender._id === user._id && !msg.isRecalled && (
                  <button
                    onClick={() => onRecallMessage(msg._id)}
                    className="absolute -right-10 top-0 p-2 text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    title="Thu hồi tin nhắn"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={communityEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-4 md:p-6">
        <form onSubmit={handleSendCommunityMessage} className="flex gap-3">
          <input
            type="text"
            value={communityInput}
            onChange={(e) => setCommunityInput(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={!communityInput.trim()}
            className="p-3 bg-brand text-white rounded-full hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

function PrivateChat({
  privateMessages,
  privateInput,
  setPrivateInput,
  handleSendPrivateMessage,
  loadingPrivate,
  privateEndRef,
  user,
  teacher,
  onRecallMessage,
}) {
  const formatTime = (date) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-[400px] md:h-[600px] bg-white rounded-3xl border border-gray-100 shadow-sm">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {loadingPrivate ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          </div>
        ) : privateMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p className="mb-2">Chưa có tin nhắn nào</p>
            {teacher && <p className="text-xs">Chat với {teacher.name}</p>}
          </div>
        ) : (
          privateMessages.map((msg) => (
            <div
              key={msg._id}
              className={cn(
                'flex gap-3 group',
                msg.sender._id === user._id ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.sender._id !== user._id && (
                <div className="w-8 h-8 rounded-full bg-emerald-200 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                  {msg.sender.name?.charAt(0)}
                </div>
              )}
              <div className="relative">
                <div
                  className={cn(
                    'max-w-xs px-4 py-3 rounded-2xl transition-all',
                    msg.sender._id === user._id
                      ? 'bg-brand text-white'
                      : 'bg-emerald-100 text-emerald-900 border-2 border-emerald-300 shadow-md'
                  )}
                >
                  {msg.sender._id !== user._id && (
                    <p className="text-xs font-black text-emerald-700 mb-1 uppercase tracking-widest">
                      👨‍🏫 {msg.sender.name}
                    </p>
                  )}
                  <p className={cn('text-sm font-medium break-words', msg.isRecalled && 'italic opacity-50')}>
                    {msg.content || msg.text}
                  </p>
                  {msg.createdAt && (
                    <p
                      className={cn(
                        'text-xs mt-1',
                        msg.sender._id === user._id ? 'text-blue-100' : 'text-emerald-700'
                      )}
                    >
                      {formatTime(msg.createdAt)}
                    </p>
                  )}
                </div>
                {msg.sender._id === user._id && !msg.isRecalled && (
                  <button
                    onClick={() => onRecallMessage(msg._id)}
                    className="absolute -right-10 top-0 p-2 text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    title="Thu hồi tin nhắn"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={privateEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-4 md:p-6">
        {teacher ? (
          <form onSubmit={handleSendPrivateMessage} className="flex gap-3">
            <input
              type="text"
              value={privateInput}
              onChange={(e) => setPrivateInput(e.target.value)}
              placeholder="Nhập tin nhắn cho giáo viên..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={!privateInput.trim()}
              className="p-3 bg-brand text-white rounded-full hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        ) : (
          <p className="text-sm text-gray-500 text-center">Lớp học không có giáo viên chủ nhiệm</p>
        )}
      </div>
    </div>
  );
}
