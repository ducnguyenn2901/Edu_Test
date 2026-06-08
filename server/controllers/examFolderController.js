const ExamFolder = require('../models/ExamFolder');
const Exam = require('../models/Exam');

exports.getMyExamFolders = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được người dùng' });
    }

    const folders = await ExamFolder.find({ createdBy: userId }).sort({
      createdAt: -1,
    });

    res.json(folders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createExamFolder = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) {
      return res.status(401).json({ message: 'Không xác định được người dùng' });
    }

    const name = String(req.body?.name || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'Vui lòng nhập tên thư mục' });
    }

    const folder = await ExamFolder.create({ name, createdBy: userId });
    res.status(201).json(folder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateExamFolder = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    const role = req.user?.role;

    const folder = await ExamFolder.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: 'Không tìm thấy thư mục' });
    }

    if (role !== 'admin' && folder.createdBy !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền sửa thư mục này' });
    }

    const name = String(req.body?.name || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'Vui lòng nhập tên thư mục' });
    }

    folder.name = name;
    await folder.save();
    res.json(folder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteExamFolder = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    const role = req.user?.role;

    const folder = await ExamFolder.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: 'Không tìm thấy thư mục' });
    }

    if (role !== 'admin' && folder.createdBy !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa thư mục này' });
    }

    await Exam.updateMany({ folder: folder._id }, { $set: { folder: null } });
    await folder.deleteOne();

    res.json({ message: 'Đã xóa thư mục' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
