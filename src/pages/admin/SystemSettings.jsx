import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { adminApi } from '../../services/api';

export function SystemSettings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSettings();
      setSettings(res.data || []);
    } catch {
      setError('Không thể tải cấu hình hệ thống. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, value } : s)),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await adminApi.updateSettings(
        settings.map((s) => ({
          key: s.key,
          value: s.value,
          description: s.description,
        })),
      );
      setSuccess('Đã lưu cấu hình hệ thống.');
    } catch (err) {
      const message =
        err?.response?.data?.message || 'Không thể lưu cấu hình. Vui lòng thử lại.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-gray-500">
        Đang tải cấu hình hệ thống...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <span>Admin</span>
            <span>/</span>
            <span>Settings</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Cấu hình hệ thống</h1>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6"
      >
        <div className="flex items-center gap-2 mb-2">
          <SettingsIcon className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-semibold text-gray-900">
            Thiết lập chung
          </h2>
        </div>

        {settings.map((setting) => (
          <div key={setting.key} className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              {setting.key === 'defaultExamDuration'
                ? 'Thời lượng mặc định của bài thi (phút)'
                : setting.key === 'defaultPassingScore'
                ? 'Điểm đạt mặc định (trên thang 10)'
                : setting.key === 'studentSelfRegistrationEnabled'
                ? 'Cho phép học sinh tự đăng ký'
                : setting.key}
            </label>
            {setting.key === 'studentSelfRegistrationEnabled' ? (
              <select
                value={String(setting.value)}
                onChange={(e) =>
                  handleChange(setting.key, e.target.value === 'true')
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white max-w-xs"
              >
                <option value="true">Bật</option>
                <option value="false">Tắt</option>
              </select>
            ) : (
              <input
                type="number"
                value={setting.value}
                onChange={(e) =>
                  handleChange(setting.key, Number(e.target.value) || 0)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none max-w-xs"
              />
            )}
            {setting.description && (
              <p className="text-xs text-gray-500">{setting.description}</p>
            )}
          </div>
        ))}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-70"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}
