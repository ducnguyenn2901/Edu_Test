import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { ChatInput } from '../../components/chat/ChatInput';
import { chatApi, classroomApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Loader2, Users, MessageSquare, ArrowLeft, User, Pin } from 'lucide-react';

export function ClassroomChat() {
  const { id: classroomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [activeChatType, setActiveChatType] = useState('community');
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePinMessage = async (messageId) => {
    try {
      const response = await chatApi.pinMessage(messageId);
      setMessages(prev => prev.map(m => 
        m._id === messageId ? response.data : m
      ));
      if (response.data.pinned) {
        setPinnedMessages(prev => [...prev, response.data]);
      } else {
        setPinnedMessages(prev => prev.filter(m => m._id !== messageId));
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Lỗi', message: 'Không thể ghim tin nhắn.' });
    }
  };

  const handleReact = async (messageId, emoji) => {
    try {
      const response = await chatApi.toggleReaction(messageId, emoji);
      setMessages(prev => prev.map(m => 
        m._id === messageId ? response.data : m
      ));
    } catch (error) {
      showToast({ type: 'error', title: 'Lỗi', message: 'Không thể thả cảm xúc.' });
    }
  };

  const handleMarkSeen = async (messageId) => {
    try {
      const response = await chatApi.markAsSeen(messageId);
      setMessages(prev => prev.map(m => 
        m._id === messageId ? response.data : m
      ));
    } catch (error) {
      console.error('Error marking as seen:', error);
    }
  };

  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        const response = await classroomApi.getById(classroomId);
        setClassroom(response.data);
      } catch (error) {
        showToast({ type: 'error', title: 'Lỗi', message: 'Không thể tải thông tin lớp học.' });
      }
    };

    const fetchParticipants = async () => {
      try {
        const response = await chatApi.getParticipants(classroomId);
        setParticipants(response.data || []);
      } catch (error) {
        console.error('Error fetching participants:', error);
      }
    };

    const fetchPinnedMessages = async () => {
      try {
        const response = await chatApi.getPinnedMessages(classroomId);
        setPinnedMessages(response.data || []);
      } catch (error) {
        console.error('Error fetching pinned messages:', error);
      }
    };

    fetchClassroom();
    fetchParticipants();
    fetchPinnedMessages();
  }, [classroomId, showToast]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        let response;
        
        if (activeChatType === 'community') {
          response = await chatApi.getCommunityMessages(classroomId);
        } else if (activeChatType === 'teacher-student' && selectedParticipant) {
          response = await chatApi.getTeacherStudentMessages(classroomId, selectedParticipant._id);
        } else if (activeChatType === 'student-student' && selectedParticipant) {
          response = await chatApi.getStudentStudentMessages(classroomId, selectedParticipant._id);
        }
        
        setMessages(response?.data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
        showToast({ type: 'error', title: 'Lỗi', message: 'Không thể tải tin nhắn.' });
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [classroomId, activeChatType, selectedParticipant, showToast]);

  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    
    socketRef.current.on('connect', () => {
      setIsConnected(true);
      socketRef.current.emit('join-class', { userId: user?._id, classroomId });
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('new-message', (message) => {
      const isRelevant = 
        message.classroom === classroomId &&
        (
          (activeChatType === 'community' && message.type === 'community') ||
          (activeChatType === 'teacher-student' && 
           message.type === 'teacher-student' &&
           ((message.sender._id === selectedParticipant?._id && message.recipient?._id === user?._id) ||
            (message.sender._id === user?._id && message.recipient?._id === selectedParticipant?._id))) ||
          (activeChatType === 'student-student' && 
           message.type === 'student-student' &&
           ((message.sender._id === selectedParticipant?._id && message.recipient?._id === user?._id) ||
            (message.sender._id === user?._id && message.recipient?._id === selectedParticipant?._id)))
        );

      if (isRelevant) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [classroomId, activeChatType, selectedParticipant, user]);

  const handleSendMessage = async (content) => {
    try {
      const messageData = {
        classroomId,
        content,
        type: activeChatType,
      };

      if (selectedParticipant) {
        messageData.recipient = selectedParticipant._id;
      }

      const response = await chatApi.sendMessage(messageData);
      socketRef.current.emit('send-message', response.data);
    } catch (error) {
      showToast({ type: 'error', title: 'Lỗi', message: 'Không thể gửi tin nhắn.' });
    }
  };

  const getChatTitle = () => {
    if (activeChatType === 'community') {
      return 'Chat cộng đồng';
    }
    return selectedParticipant?.name || 'Chat riêng';
  };

  const isTeacher = user?.role === 'teacher';

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50">
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => navigate(isTeacher ? '/teacher/classrooms' : '/student')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Quay lại</span>
          </button>
          <h2 className="text-xl font-bold text-gray-900">{classroom?.name}</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-3">
            <button
              onClick={() => {
                setActiveChatType('community');
                setSelectedParticipant(null);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                activeChatType === 'community' && !selectedParticipant
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users size={20} />
              <div className="text-left">
                <p className="font-medium">Chat cộng đồng</p>
                <p className="text-xs text-gray-500">Tất cả thành viên lớp</p>
              </div>
            </button>
          </div>

          <div className="px-3 py-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
              {isTeacher ? 'Học sinh' : 'Thành viên'}
            </h3>
            {participants.map((participant) => {
              if (participant._id === user?._id) return null;
              const isSelected = selectedParticipant?._id === participant._id;
              const chatType = isTeacher ? 'teacher-student' : 'student-student';
              
              return (
                <button
                  key={participant._id}
                  onClick={() => {
                    setSelectedParticipant(participant);
                    setActiveChatType(chatType);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isSelected ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    participant.role === 'teacher' 
                      ? 'bg-gradient-to-br from-purple-600 to-pink-600' 
                      : 'bg-gradient-to-br from-blue-500 to-purple-600'
                  }`}>
                    {participant.name?.charAt(0).toUpperCase() || <User size={16} />}
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium truncate">{participant.name}</p>
                    <p className="text-xs text-gray-500 truncate">{participant.email}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
              {activeChatType === 'community' ? <Users size={20} /> : <MessageSquare size={20} />}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{getChatTitle()}</h3>
              <p className="text-xs text-gray-500">
                {isConnected ? 'Đang trực tuyến' : 'Đang kết nối...'}
              </p>
            </div>
          </div>
        </div>

        {activeChatType === 'community' && pinnedMessages.length > 0 && (
          <div className="bg-yellow-50 border-b border-yellow-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Pin size={16} className="text-yellow-600" />
              <span className="text-xs font-bold text-yellow-700 uppercase">Tin nhắn đã ghim</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {pinnedMessages.map((msg) => (
                <div 
                  key={msg._id} 
                  className="bg-white px-3 py-2 rounded-lg border border-yellow-200 text-sm max-w-[200px] truncate cursor-pointer hover:bg-yellow-50"
                >
                  <span className="text-xs font-medium text-yellow-700">{msg.sender?.name}: </span>
                  <span className="text-gray-700">{msg.content}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageSquare size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">Chưa có tin nhắn nào</p>
              <p className="text-sm">Hãy bắt đầu cuộc trò chuyện!</p>
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage
                key={message._id}
                message={message}
                currentUserId={user?._id}
                onPin={handlePinMessage}
                onReact={handleReact}
                onMarkSeen={handleMarkSeen}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <ChatInput onSend={handleSendMessage} disabled={!isConnected} />
      </div>
    </div>
  );
}
