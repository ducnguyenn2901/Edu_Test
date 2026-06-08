import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, MessageCircle, TrendingUp, Users } from 'lucide-react';
import { chatApi } from '../../services/api';

export function ClassroomStats({ classroom, communityMessagesCount }) {
  const [stats, setStats] = useState({
    totalMessages: 0,
    teacherStudentMessages: 0,
    activeUsers: 0,
    engagementRate: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!classroom?._id) return;
    try {
      setLoading(true);
      const response = await chatApi.getStats(classroom._id);
      setStats({
        totalMessages: response.data.totalMessages || 0,
        teacherStudentMessages: response.data.teacherStudentMessages || 0,
        activeUsers: response.data.activeUsers || 0,
        engagementRate: response.data.engagementRate || 0,
      });
    } catch (_err) {
      console.error('Lỗi tải thống kê:', _err);
      setStats({
        totalMessages: communityMessagesCount || 0,
        teacherStudentMessages: 0,
        activeUsers: classroom.students?.length || 0,
        engagementRate: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [classroom?._id, communityMessagesCount, classroom.students?.length]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-4 md:p-6 border border-gray-100 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const statItems = [
    {
      icon: MessageSquare,
      label: 'Tổng tin nhắn',
      value: stats.totalMessages,
      color: 'blue',
    },
    {
      icon: MessageCircle,
      label: 'Chat giáo viên-học sinh',
      value: stats.teacherStudentMessages,
      color: 'emerald',
    },
    {
      icon: Users,
      label: 'Người dùng tích cực',
      value: stats.activeUsers,
      color: 'purple',
    },
    {
      icon: TrendingUp,
      label: 'Tỷ lệ tham gia',
      value: `${stats.engagementRate}%`,
      color: 'amber',
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-4 md:p-6 border border-gray-100 shadow-sm">
      <h3 className="font-black text-sm text-gray-900 uppercase tracking-widest mb-6">
        Thống kê chi tiết
      </h3>
      <div className="space-y-4">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          const colorClasses = {
            blue: 'bg-blue-50 text-blue-600 border-blue-200',
            emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
            purple: 'bg-purple-50 text-purple-600 border-purple-200',
            amber: 'bg-amber-50 text-amber-600 border-amber-200',
          };

          return (
            <div
              key={index}
              className={`p-4 rounded-2xl border flex items-center gap-4 ${colorClasses[item.color]}`}
            >
              <Icon className="w-6 h-6 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest opacity-70">
                  {item.label}
                </p>
                <p className="text-2xl font-black mt-1">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
