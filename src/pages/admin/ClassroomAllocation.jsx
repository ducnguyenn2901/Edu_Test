import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Users,
  GraduationCap,
  School,
  ChevronRight,
  UploadCloud,
  Loader2,
  Check,
} from 'lucide-react';
import { adminApi, teacherApi, classroomApi } from '../../services/api';
import { cn } from '../../lib/utils';
import { useToast } from '../../context/ToastContext.jsx';

export function ClassroomAllocation() {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [filters, setFilters] = useState({
    teacherSearch: '',
    studentSearch: '',
    grade: '',
    className: '',
    school: '',
  });
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoadingTeachers(true);
        const response = await adminApi.getUsers();
        const onlyTeachers = (response.data || []).filter(
          (u) => u.role?.toLowerCase() === 'teacher',
        );
        setTeachers(onlyTeachers);
      } catch {
        setError('Không thể tải danh sách giáo viên.');
      } finally {
        setLoadingTeachers(false);
      }
    };

    fetchTeachers();
  }, []);

  useEffect(() => {
    const fetchAllStudents = async () => {
      if (!selectedTeacher) {
        setStudents([]);
        setSelectedStudentIds(new Set());
        return;
      }

      try {
        setLoadingStudents(true);
        setError('');
        // Fetch ALL students for allocation
        const res = await teacherApi.getStudents({
          grade: filters.grade || undefined,
          className: filters.className || undefined,
          school: filters.school || undefined,
        });
        const studentList = res.data || [];
        setStudents(studentList);

        // Initialize selectedStudentIds from teacher's students array
        const teacherAssignedIds = new Set(
          (selectedTeacher.students || []).map((id) => id.toString() || id),
        );
        setSelectedStudentIds(teacherAssignedIds);
      } catch {
        setError('Không thể tải danh sách học sinh.');
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchAllStudents();
  }, [selectedTeacher, filters.grade, filters.className, filters.school]);

  const handleSaveAllocation = async () => {
    if (!selectedTeacher) return;
    setIsSaving(true);
    const newStudentIds = Array.from(selectedStudentIds);
    try {
      await teacherApi.updateStudents(selectedTeacher.id, newStudentIds);

      // Update local teachers list with new allocation
      setTeachers((prev) =>
        prev.map((t) => (t.id === selectedTeacher.id ? { ...t, students: newStudentIds } : t)),
      );

      // Update selectedTeacher with new allocation
      setSelectedTeacher((prev) => ({ ...prev, students: newStudentIds }));

      showToast({
        type: 'success',
        title: 'Thành công',
        message: 'Đã cập nhật phân bổ học sinh thành công!',
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Lỗi',
        message: err?.response?.data?.message || 'Lỗi khi cập nhật phân bổ',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStudentSelection = (id) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredTeachers = teachers.filter((t) => {
    const term = filters.teacherSearch.trim().toLowerCase();
    if (!term) return true;
    return t.name.toLowerCase().includes(term) || t.email.toLowerCase().includes(term);
  });

  const filteredStudents = students.filter((s) => {
    const term = filters.studentSearch.trim().toLowerCase();
    if (!term) return true;
    return s.name.toLowerCase().includes(term) || s.email.toLowerCase().includes(term);
  });

  const grades = Array.from(new Set(students.map((s) => s.grade).filter(Boolean)));
  const classes = Array.from(new Set(students.map((s) => s.className).filter(Boolean)));
  const schools = Array.from(new Set(students.map((s) => s.school).filter(Boolean)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <span>Admin</span>
            <span>/</span>
            <span>Classroom / Student Allocation</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Phân bổ học sinh cho giáo viên</h1>
          <p className="text-sm text-gray-500 mt-1">
            Chọn giáo viên ở cột trái, xem và lọc danh sách học sinh ở cột phải.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-blue-300 bg-blue-50/40 text-xs font-medium text-blue-700 cursor-pointer hover:bg-blue-50">
            <UploadCloud className="w-4 h-4" />
            <span>Import lớp & học sinh (CSV)</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImporting(true);
                setError('');
                setImportResult(null);
                try {
                  const res = await classroomApi.importFromFile(file);
                  const data = res.data || null;
                  setImportResult(data);
                  const count = data?.classrooms?.length || 0;
                  showToast({
                    type: 'success',
                    title: 'Import thành công',
                    message: `Đã xử lý ${count} lớp từ file CSV.`,
                  });
                } catch (err) {
                  const message =
                    err?.response?.data?.message ||
                    'Không thể import file. Vui lòng kiểm tra định dạng CSV.';
                  setError(message);
                  showToast({
                    type: 'error',
                    title: 'Import thất bại',
                    message,
                  });
                } finally {
                  setImporting(false);
                  e.target.value = '';
                }
              }}
            />
          </label>
          {importing && <span className="text-xs text-gray-500">Đang xử lý file import...</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm lg:col-span-1 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-900">Danh sách giáo viên</h2>
            </div>
          </div>
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm giáo viên theo tên hoặc email..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.teacherSearch}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    teacherSearch: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingTeachers ? (
              <div className="p-4 text-sm text-gray-500">Đang tải danh sách giáo viên...</div>
            ) : filteredTeachers.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Không tìm thấy giáo viên phù hợp.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filteredTeachers.map((teacher) => (
                  <li key={teacher.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedTeacher(teacher)}
                      className={cn(
                        'w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-gray-50 transition',
                        selectedTeacher?.id === teacher.id &&
                          'bg-blue-50/70 border-l-2 border-blue-500',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-semibold">
                          {teacher.name?.[0]?.toUpperCase() || 'T'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {teacher.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{teacher.email}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm lg:col-span-2 flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <div className="flex items-center gap-4 flex-1">
                <div className="flex flex-col">
                  <h2 className="text-sm font-semibold text-gray-900">Học sinh theo giáo viên</h2>
                  <p className="text-xs text-gray-500">
                    {selectedTeacher
                      ? `Giáo viên: ${selectedTeacher.name} (${selectedTeacher.email})`
                      : 'Chọn một giáo viên ở cột bên trái để xem danh sách học sinh.'}
                  </p>
                </div>
                <div className="flex-1" />
                {selectedTeacher && (
                  <button
                    onClick={handleSaveAllocation}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Lưu phân bổ
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>
                  Tổng: <span className="font-semibold text-gray-900">{students.length}</span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <School className="w-3 h-3" />
                <span>
                  Đã chọn:{' '}
                  <span className="font-semibold text-gray-900">{selectedStudentIds.size}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.studentSearch}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      studentSearch: e.target.value,
                    }))
                  }
                  placeholder="Tìm học sinh theo tên hoặc email..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Filter className="w-4 h-4" />
                <span>Bộ lọc</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={filters.grade}
                onChange={(e) => setFilters((prev) => ({ ...prev, grade: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả khối</option>
                {grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <select
                value={filters.className}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    className: e.target.value,
                  }))
                }
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả lớp</option>
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={filters.school}
                onChange={(e) => setFilters((prev) => ({ ...prev, school: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả trường</option>
                {schools.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {error && (
              <div className="px-6 py-3 text-sm text-red-500 border-b border-red-100 bg-red-50/60">
                {error}
              </div>
            )}
            {importResult && (
              <div className="px-6 py-3 text-xs text-emerald-700 border-b border-emerald-100 bg-emerald-50/70">
                <p className="font-medium">
                  {importResult.message || 'Import lớp học và học sinh thành công.'}
                </p>
                <p className="mt-1">
                  Đã xử lý{' '}
                  <span className="font-semibold">{importResult.classrooms?.length || 0}</span> lớp.
                </p>
              </div>
            )}
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                  <th className="px-6 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={
                        filteredStudents.length > 0 &&
                        filteredStudents.every((s) => selectedStudentIds.has(s.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudentIds(new Set(filteredStudents.map((s) => s.id)));
                        } else {
                          setSelectedStudentIds(new Set());
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-3">Học sinh</th>
                  <th className="px-6 py-3">Khối</th>
                  <th className="px-6 py-3">Lớp</th>
                  <th className="px-6 py-3">Trường</th>
                  <th className="px-6 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!selectedTeacher && (
                  <tr>
                    <td colSpan={6} className="px-6 py-6 text-center text-sm text-gray-500">
                      Vui lòng chọn một giáo viên để xem danh sách học sinh.
                    </td>
                  </tr>
                )}
                {selectedTeacher && !loadingStudents && filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-6 text-center text-sm text-gray-500">
                      Không có học sinh nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                )}
                {selectedTeacher &&
                  !loadingStudents &&
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50/80">
                      <td className="px-6 py-3">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.has(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                        />
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-9 h-9 rounded-full bg-gray-100"
                          />
                          <div>
                            <p className="font-medium text-sm text-gray-900">{student.name}</p>
                            <p className="text-xs text-gray-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">{student.grade || '-'}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {student.className || '-'}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">{student.school || '-'}</td>
                      <td className="px-6 py-3 text-sm">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium border',
                            student.status === 'Locked'
                              ? 'bg-gray-100 text-gray-600 border-gray-200'
                              : 'bg-green-50 text-green-700 border-green-200',
                          )}
                        >
                          {student.status === 'Locked' ? 'Đã khóa' : 'Đang hoạt động'}
                        </span>
                      </td>
                    </tr>
                  ))}
                {selectedTeacher && loadingStudents && (
                  <tr>
                    <td colSpan={6} className="px-6 py-6 text-center text-sm text-gray-500">
                      Đang tải danh sách học sinh...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
