const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Đảm bảo file users.json tồn tại
function ensureUsersFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
  }
}

// Lấy tất cả users
function getUsers() {
  ensureUsersFile();
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

// Lưu users
function saveUsers(users) {
  ensureUsersFile();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Tìm user theo email
function findUserByEmail(email) {
  const users = getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

// Tìm user theo ID
function findUserById(id) {
  const users = getUsers();
  return users.find(u => u.id === id) || null;
}

// Tạo user mới
async function createUser(email, password, name = '') {
  const users = getUsers();

  // Kiểm tra email đã tồn tại
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, error: 'Email đã được sử dụng' };
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = {
    id: uuidv4(),
    email: email.toLowerCase(),
    password: hashedPassword,
    name: name || email.split('@')[0],
    role: 'user',
    createdAt: new Date().toISOString(),
    lastLogin: null,
    avatar: null
  };

  users.push(newUser);
  saveUsers(users);

  // Trả về user không có password
  const { password: _, ...userWithoutPassword } = newUser;
  return { success: true, user: userWithoutPassword };
}

// Xác thực đăng nhập
async function verifyLogin(email, password) {
  const user = findUserByEmail(email);
  if (!user) {
    return { success: false, error: 'Email không tồn tại' };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return { success: false, error: 'Mật khẩu không đúng' };
  }

  // Cập nhật lastLogin
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === user.id);
  users[userIndex].lastLogin = new Date().toISOString();
  saveUsers(users);

  const { password: _, ...userWithoutPassword } = users[userIndex];
  return { success: true, user: userWithoutPassword };
}

// Cập nhật thông tin user
function updateUser(id, updates) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;

  // Không cho phép cập nhật id, email, password qua function này
  const { id: _id, email: _email, password: _password, ...safeUpdates } = updates;
  users[index] = { ...users[index], ...safeUpdates, updatedAt: new Date().toISOString() };
  saveUsers(users);

  const { password: _, ...userWithoutPassword } = users[index];
  return userWithoutPassword;
}

module.exports = { findUserByEmail, findUserById, createUser, verifyLogin, updateUser };
