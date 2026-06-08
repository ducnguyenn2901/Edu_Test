const Setting = require('../models/Setting');

const defaultSettings = [
  {
    key: 'defaultExamDuration',
    value: 45,
    description: 'Thời lượng mặc định của một bài thi (phút)',
    editableBy: ['admin'],
  },
  {
    key: 'defaultPassingScore',
    value: 5,
    description: 'Điểm đạt mặc định trên thang 10',
    editableBy: ['admin'],
  },
  {
    key: 'studentSelfRegistrationEnabled',
    value: true,
    description: 'Cho phép học sinh tự đăng ký tài khoản',
    editableBy: ['admin'],
  },
];

const ensureDefaults = async () => {
  for (const setting of defaultSettings) {
    await Setting.updateOne({ key: setting.key }, { $setOnInsert: setting }, { upsert: true });
  }
};

const getSettings = async (req, res) => {
  try {
    await ensureDefaults();
    const settings = await Setting.find().sort({ key: 1 });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const updates = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
    }

    const settings = await Setting.find().sort({ key: 1 });

    const editableKeys = settings
      .filter((s) => Array.isArray(s.editableBy) && s.editableBy.includes(req.user.role))
      .map((s) => s.key);

    for (const update of updates) {
      if (!update.key || !editableKeys.includes(update.key)) {
        continue;
      }

      await Setting.updateOne(
        { key: update.key },
        {
          value: update.value,
          description: update.description,
        },
        { upsert: true },
      );
    }

    const updatedSettings = await Setting.find().sort({ key: 1 });
    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSettings, updateSettings };
