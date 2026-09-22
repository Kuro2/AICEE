const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  avatar: { type: String, default: null },
  lastLogin: { type: Date, default: null }
}, {
  timestamps: true
});

const UserModel = mongoose.models.User || mongoose.model('User', userSchema);

// Đảm bảo tương thích ngược với API hiện tại (trả về id thay vì _id)
function formatUser(userDoc) {
  if (!userDoc) return null;
  const obj = userDoc.toObject ? userDoc.toObject() : userDoc;
  obj.id = obj._id.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
}

// Chuyển logic service cũ vào đây để không phải sửa route
async function findUserByEmail(email) {
  const user = await UserModel.findOne({ email: email.toLowerCase() });
  return formatUser(user);
}

async function findUserById(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const user = await UserModel.findById(id);
  return formatUser(user);
}

async function createUser(email, password, name = '') {
  try {
    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
      return { success: false, error: 'Email đã được sử dụng' };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await UserModel.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name || email.split('@')[0],
      role: 'user'
    });

    const userObj = formatUser(newUser);
    delete userObj.password;
    return { success: true, user: userObj };
  } catch (error) {
    console.error('createUser error:', error);
    return { success: false, error: 'Lỗi khi tạo tài khoản' };
  }
}

async function verifyLogin(email, password) {
  try {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      return { success: false, error: 'Email không tồn tại' };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { success: false, error: 'Mật khẩu không đúng' };
    }

    user.lastLogin = new Date();
    await user.save();

    const userObj = formatUser(user);
    delete userObj.password;
    return { success: true, user: userObj };
  } catch (error) {
    console.error('verifyLogin error:', error);
    return { success: false, error: 'Lỗi khi đăng nhập' };
  }
}

async function updateUser(id, updates) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  const { id: _id, email, password, ...safeUpdates } = updates;
  
  const user = await UserModel.findByIdAndUpdate(id, safeUpdates, { new: true });
  const userObj = formatUser(user);
  if (userObj) delete userObj.password;
  return userObj;
}

module.exports = { 
  UserModel, 
  findUserByEmail, 
  findUserById, 
  createUser, 
  verifyLogin, 
  updateUser 
};
