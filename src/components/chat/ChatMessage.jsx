import React, { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { User, MoreVertical, Check, CheckCheck, Pin } from 'lucide-react';

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export const ChatMessage = ({ message, currentUserId, onPin, onReact, onMarkSeen }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const isOwnMessage = message.sender._id === currentUserId;
  const isTeacher = message.sender.role === 'teacher';
  const messageTime = format(new Date(message.createdAt), 'HH:mm, dd/MM/yyyy', { locale: vi });

  const groupedReactions = message.reactions?.reduce((acc, reaction) => {
    acc[reaction.emoji] = acc[reaction.emoji] || [];
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {});

  const handleReact = (emoji) => {
    onReact?.(message._id, emoji);
    setShowEmojiPicker(false);
    setShowMenu(false);
  };

  let messageClasses = 'relative px-4 py-2 rounded-lg shadow-sm ';
  if (message.pinned) {
    messageClasses += 'bg-yellow-50 border-2 border-yellow-300';
  } else if (isOwnMessage) {
    messageClasses += 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-sm';
  } else if (isTeacher) {
    messageClasses += 'bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-bl-sm';
  } else {
    messageClasses += 'bg-gray-100 text-gray-800 rounded-bl-sm';
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 relative group`}>
      <div className={`flex items-end gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
            isTeacher 
              ? 'bg-gradient-to-br from-purple-600 to-pink-600 ring-2 ring-purple-300'
              : 'bg-gradient-to-br from-blue-500 to-purple-600'
          }`}>
            {message.sender.name?.charAt(0).toUpperCase() || <User size={16} />}
          </div>
        </div>
        
        <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
          {!isOwnMessage && (
            <div className="flex items-center gap-2 mb-1 ml-1">
              <span className={`text-xs font-bold ${isTeacher ? 'text-purple-600' : 'text-gray-500'}`}>
                {message.sender.name}
              </span>
              {isTeacher && (
                <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold">
                  Giáo viên
                </span>
              )}
            </div>
          )}
          
          <div className={messageClasses}>
            {message.pinned && (
              <div className="flex items-center gap-1 mb-1">
                <Pin size={12} className={isOwnMessage || isTeacher ? 'text-yellow-200' : 'text-yellow-600'} />
                <span className={`text-[10px] font-bold ${isOwnMessage || isTeacher ? 'text-yellow-200' : 'text-yellow-600'}`}>
                  Đã ghim
                </span>
              </div>
            )}
            <p className="text-sm">{message.content}</p>
          </div>
          
          {groupedReactions && Object.keys(groupedReactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(groupedReactions).map(([emoji, reactions]) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                    reactions.some(r => r.user._id === currentUserId)
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="font-bold">{reactions.length}</span>
                </button>
              ))}
            </div>
          )}
          
          <div className={`flex items-center gap-1 mt-1`}>
            <span className={`text-xs text-gray-400 ${isOwnMessage ? 'mr-1' : 'ml-1'}`}>
              {messageTime}
            </span>
            {isOwnMessage && (
              <div className="flex items-center">
                {message.status === 'seen' ? (
                  <CheckCheck size={14} className="text-blue-500" />
                ) : (
                  <Check size={14} className="text-gray-400" />
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical size={16} />
          </button>
          
          {showMenu && (
            <div className={`absolute z-50 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-[150px] ${
              isOwnMessage ? 'right-0' : 'left-0'
            }`}>
              <button
                onClick={() => {
                  onPin?.(message._id);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <Pin size={16} />
                {message.pinned ? 'Bỏ ghim' : 'Ghim tin nhắn'}
              </button>
              <button
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                <ThumbsUp size={16} />
                Thả cảm xúc
              </button>
              {!isOwnMessage && (
                <button
                  onClick={() => {
                    onMarkSeen?.(message._id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <CheckCheck size={16} />
                  Đánh dấu đã xem
                </button>
              )}
            </div>
          )}
          
          {showEmojiPicker && (
            <div className="absolute z-50 bg-white rounded-xl shadow-lg border border-gray-200 p-2 flex gap-1 mt-2">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-xl hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
