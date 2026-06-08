import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { classroomApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export function JoinClass() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const code = searchParams.get('code');

  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!code) {
      setError('Không tìm thấy mã lớp học trong đường dẫn.');
      setLoading(false);
      return;
    }

    const fetchClassroomByCode = async () => {
      try {
        const response = await classroomApi.getByCode(code);
        setClassroom(response.data);
      } catch {
        setError('Mã lớp học không hợp lệ hoặc không tồn tại.');
      } finally {
        setLoading(false);
      }
    };

    fetchClassroomByCode();
  }, [code]);

  const handleJoin = async () => {
    setIsSubmitting(true);
    try {
      await classroomApi.join(code);
      showToast({ type: 'success', message: 'Yêu cầu tham gia đã được gửi thành công!' });
      navigate('/student/exams'); // Redirect to a relevant page
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Gửi yêu cầu thất bại.';
      showToast({ type: 'error', message: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return <Loader2 className="w-12 h-12 animate-spin text-blue-600" />;
    }

    if (error) {
      return (
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Yêu cầu thất bại</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Trở về trang chủ
          </button>
        </div>
      );
    }

    if (classroom) {
      return (
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Xác nhận tham gia lớp học</h2>
          <p className="text-gray-600 mt-4">Bạn sắp gửi yêu cầu tham gia vào lớp:</p>
          <div className="my-6 p-6 bg-gray-50 rounded-lg border">
            <p className="text-2xl font-bold text-blue-700">{classroom.name}</p>
            <p className="text-gray-500 mt-1">
              {classroom.grade} • {classroom.subject}
            </p>
            <p className="text-gray-500 mt-1">Giáo viên: {classroom.homeroomTeacher?.name}</p>
          </div>
          <button
            onClick={handleJoin}
            disabled={isSubmitting}
            className="w-full max-w-xs mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              'Gửi yêu cầu tham gia'
            )}
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8">{renderContent()}</div>
    </div>
  );
}
