import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { classroomApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Loader2,
  UserPlus,
  QrCode,
  Check,
  X,
  PlusCircle,
  School,
  BookOpen,
  Users,
  ChevronRight,
  MoreVertical,
  Edit3,
  Trash2,
  Upload,
} from 'lucide-react';
import { InviteModal } from '../../components/common/InviteModal';
import { CreateClassModal } from '../../components/common/CreateClassModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { useToast } from '../../context/ToastContext';

export function Classrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showStudentsId, setShowStudentsId] = useState(null);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const response = await classroomApi.getAll({
        teacherId: user?._id || user?.id,
      });
      setClassrooms(response.data || []);
    } catch (err) {
      console.error('Lỗi tải lớp học:', err);
      // Only show error if it's a real error, not just empty data
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleApprove = async (classroomId, studentId, action) => {
    try {
      await classroomApi.approve(classroomId, studentId, action);
      showToast({
        type: 'success',
        title: 'Thành công',
        message: `Đã ${action === 'approve' ? 'duyệt' : 'từ chối'} học sinh.`,
      });
      fetchClassrooms(); // Refresh list
    } catch (_err) {
      showToast({ type: 'error', title: 'Lỗi', message: 'Thao tác thất bại.' });
    }
  };

  const handleRemoveStudent = async (classroomId, studentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa học sinh này khỏi lớp?')) return;
    try {
      await classroomApi.removeStudent(classroomId, studentId);
      showToast({ type: 'success', title: 'Thành công', message: 'Đã xóa học sinh khỏi lớp.' });
      fetchClassrooms();
    } catch (_err) {
      showToast({ type: 'error', title: 'Lỗi', message: 'Thao tác thất bại.' });
    }
  };

  const handleImportStudents = async (classroomId, file) => {
    if (!file) return;
    try {
      setLoading(true);
      const res = await classroomApi.importStudents(classroomId, file);
      showToast({
        type: 'success',
        title: 'Thành công',
        message: res.data.message || 'Đã nhập danh sách học sinh thành công.',
      });
      fetchClassrooms();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Lỗi',
        message: err.response?.data?.message || 'Không thể nhập danh sách học sinh.',
      });
    } finally {
      setLoading(false);
    }
  };

  const openInviteModal = (classroom) => {
    setSelectedClassroom(classroom);
    setIsInviteModalOpen(true);
  };

  const openEditModal = (classroom) => {
    setSelectedClassroom(classroom);
    setIsEditing(true);
    setIsCreateModalOpen(true);
  };

  const openDeleteModal = (classroom) => {
    setSelectedClassroom(classroom);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteClass = async () => {
    if (!selectedClassroom) return;
    try {
      await classroomApi.delete(selectedClassroom._id);
      showToast({ type: 'success', title: 'Thành công', message: 'Đã xóa lớp học thành công.' });
      fetchClassrooms();
    } catch (_err) {
      showToast({ type: 'error', title: 'Lỗi', message: 'Không thể xóa lớp học.' });
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedClassroom(null);
    }
  };

  if (loading && classrooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse uppercase tracking-widest text-xs">
          Đang tải danh sách lớp học...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        classroom={selectedClassroom}
      />
      <CreateClassModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditing(false);
          setSelectedClassroom(null);
        }}
        classroom={isEditing ? selectedClassroom : null}
        onClassCreated={() => {
          fetchClassrooms();
        }}
      />
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteClass}
        title="Xác nhận xóa lớp học"
        message={`Bạn có chắc chắn muốn xóa lớp học "${selectedClassroom?.name}"? Hành động này không thể hoàn tác.`}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">
            Quản lý Lớp học
          </h1>
          <p className="text-gray-500 mt-1 font-medium italic">
            Tổ chức lớp học, mời học sinh và quản lý yêu cầu tham gia.
          </p>
        </div>
        <button
          onClick={() => {
            setIsEditing(false);
            setSelectedClassroom(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white text-xs font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95 uppercase tracking-widest"
        >
          <PlusCircle className="w-5 h-5" />
          Tạo lớp mới
        </button>
      </div>

      {classrooms.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[40px] border-2 border-dashed border-gray-200 shadow-sm">
          <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <School className="w-12 h-12" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Chưa có lớp học nào</h3>
          <p className="text-gray-500 mt-2 font-medium max-w-sm mx-auto">
            Bắt đầu hành trình giảng dạy bằng cách tạo lớp học đầu tiên của bạn.
          </p>
          <button
            onClick={() => {
              setIsEditing(false);
              setSelectedClassroom(null);
              setIsCreateModalOpen(true);
            }}
            className="mt-10 inline-flex items-center gap-3 px-10 py-5 bg-gray-900 text-white font-black rounded-3xl hover:bg-blue-600 transition-all shadow-2xl active:scale-95 uppercase tracking-widest text-xs"
          >
            <PlusCircle className="w-5 h-5" />
            Tạo lớp học ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {classrooms.map((cls) => (
            <div
              key={cls._id}
              className="group bg-white rounded-[40px] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col relative"
            >
              <div className="absolute top-0 right-0 p-8 flex gap-2">
                <div className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-blue-100">
                  {cls.code}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(cls)}
                    className="p-1.5 bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(cls)}
                    className="p-1.5 bg-gray-100 text-gray-500 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-10 flex-1">
                <div className="w-20 h-20 bg-gray-50 rounded-[28px] flex items-center justify-center text-gray-400 mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                  <School className="w-10 h-10" />
                </div>
                <h3 className="font-black text-3xl text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-3 tracking-tight">
                  {cls.name}
                </h3>
                <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
                  <span className="bg-gray-100 px-3 py-1 rounded-lg">{cls.grade}</span>
                  <div className="w-1 h-1 bg-gray-300 rounded-full" />
                  <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg">
                    {cls.subject}
                  </span>
                </div>

                <div className="mt-12 flex items-center gap-10">
                  <button
                    onClick={() => setShowStudentsId(showStudentsId === cls._id ? null : cls._id)}
                    className="flex flex-col text-left hover:scale-105 transition-transform"
                  >
                    <span className="text-3xl font-black text-gray-900 dark:text-white">
                      {cls.students?.length || 0}
                    </span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                      Học sinh{' '}
                      {showStudentsId === cls._id ? (
                        <X className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </span>
                  </button>
                  <div className="w-px h-12 bg-gray-100 dark:bg-slate-800" />
                  <div className="flex flex-col">
                    <span className="text-3xl font-black text-amber-500">
                      {cls.pendingStudents?.length || 0}
                    </span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                      Chờ duyệt
                    </span>
                  </div>
                </div>
              </div>

              {showStudentsId === cls._id && (
                <div className="px-8 pb-6 animate-in slide-in-from-top-4 duration-300">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Danh sách học sinh
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400">
                        {cls.students?.length || 0} thành viên
                      </span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {cls.students && cls.students.length > 0 ? (
                        cls.students.map((student) => (
                          <div
                            key={student._id}
                            className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-50 dark:border-slate-700 shadow-sm group"
                          >
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                              {student.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                {student.name}
                              </p>
                              <p className="text-[9px] text-slate-400 truncate tracking-tight">
                                {student.email}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveStudent(cls._id, student._id)}
                              className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title="Xóa khỏi lớp"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-4 text-xs text-slate-400 italic">
                          Lớp chưa có học sinh
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {cls.pendingStudents && cls.pendingStudents.length > 0 && (
                <div className="px-8 pb-6">
                  <div className="bg-amber-50 rounded-[32px] p-8 border border-amber-100 shadow-inner">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="font-black text-[10px] text-amber-800 uppercase tracking-[0.2em] flex items-center gap-3">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                        Yêu cầu mới
                      </h4>
                      <span className="bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full">
                        {cls.pendingStudents.length}
                      </span>
                    </div>
                    <div className="space-y-4 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                      {cls.pendingStudents.map((student) => (
                        <div
                          key={student._id}
                          className="flex items-center justify-between bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all group/req"
                        >
                          <div className="min-w-0">
                            <p className="font-black text-sm text-gray-800 truncate tracking-tight">
                              {student.name}
                            </p>
                            <p className="text-[9px] text-gray-400 font-bold truncate uppercase tracking-widest mt-0.5">
                              {student.email}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleApprove(cls._id, student._id, 'reject')}
                              className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                              title="Từ chối"
                            >
                              <X className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleApprove(cls._id, student._id, 'approve')}
                              className="p-2.5 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all active:scale-90"
                              title="Chấp nhận"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="p-8 pt-0 mt-auto flex gap-3">
                <button
                  onClick={() => navigate(`/teacher/classrooms/${cls._id}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-4 text-[10px] font-black uppercase tracking-widest text-white bg-brand rounded-2xl hover:bg-blue-700 transition-all duration-300 group/btn shadow-sm"
                >
                  <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  Xem chi tiết
                </button>
                <button
                  onClick={() => openInviteModal(cls)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-4 text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 rounded-2xl hover:bg-blue-600 hover:text-white transition-all duration-300 group/btn shadow-sm"
                >
                  <QrCode className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                  Mời
                </button>
                <div className="relative flex-1">
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    id={`import-students-${cls._id}`}
                    onChange={(e) => handleImportStudents(cls._id, e.target.files[0])}
                  />
                  <label
                    htmlFor={`import-students-${cls._id}`}
                    className="flex items-center justify-center gap-2 px-4 py-4 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all duration-300 group/btn shadow-sm cursor-pointer"
                  >
                    <Upload className="w-4 h-4 group-hover/btn:-translate-y-1 transition-transform" />
                    Nhập CSV
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
