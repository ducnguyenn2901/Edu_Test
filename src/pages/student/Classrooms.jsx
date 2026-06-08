import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { classroomApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Loader2,
  BookOpen,
  Users,
  ChevronRight,
  School,
  Plus,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/utils';

export function StudentClassrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const response = await classroomApi.getAll({
        studentId: user?._id || user?.id,
      });
      setClassrooms(response.data || []);
    } catch (err) {
      console.error('Lỗi tải lớp học:', err);
      if (err.response?.status && err.response.status !== 404) {
        showToast({
          type: 'error',
          title: 'Lỗi kết nối',
          message: 'Không thể tải danh sách lớp học. Vui lòng kiểm tra kết nối backend.',
        });
      }
      setClassrooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id || user?.id) {
      fetchClassrooms();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">Đang tải lớp học...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2">
          Lớp học của tôi
        </h1>
        <p className="text-gray-500 font-medium">
          Quản lý và truy cập các lớp học của bạn
        </p>
      </div>

      {classrooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
            <School className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Bạn chưa tham gia lớp học nào</h3>
          <p className="text-gray-500 text-center max-w-sm mb-6">
            Bạn có thể tham gia lớp học bằng cách sử dụng mã lớp hoặc được giáo viên mời vào.
          </p>
          <button
            onClick={() => navigate('/join-class')}
            className="px-6 py-3 bg-brand text-white rounded-2xl font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-brand/30 transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            Tham gia lớp học
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((classroom) => (
            <div
              key={classroom._id}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
              onClick={() => navigate(`/student/classrooms/${classroom._id}`)}
            >
              {/* Header */}
              <div className="h-24 bg-gradient-brand relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <BookOpen className="w-16 h-16 text-white absolute -top-2 -right-2 rotate-12" />
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-black text-gray-900 mb-1 line-clamp-2">
                    {classroom.name}
                  </h3>
                  <p className="text-sm font-bold text-brand uppercase tracking-wider">
                    {classroom.code}
                  </p>
                </div>

                {/* Info */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Học sinh</p>
                      <p className="text-lg font-black text-gray-900">
                        {classroom.students?.length || 0}
                      </p>
                    </div>
                  </div>

                  {classroom.homeroomTeacher && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <div className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs">
                          {classroom.homeroomTeacher.name?.charAt(0)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-bold uppercase">Giáo viên chủ nhiệm</p>
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {classroom.homeroomTeacher.name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <button className="w-full py-3 px-4 bg-gradient-brand text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand/30 transition-all duration-300">
                  Xem chi tiết
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
