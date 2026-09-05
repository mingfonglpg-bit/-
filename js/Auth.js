import { CryptoUtil } from './CryptoUtil.js';

export class Auth {
  constructor(storageKeys) {
    this.KEYS = storageKeys;
    this.session = JSON.parse(localStorage.getItem(this.KEYS.session)) || null;
    this.users = JSON.parse(localStorage.getItem(this.KEYS.users)) || [];
  }

  getCurrentUser() {
    return this.session;
  }

  role() {
    return this.session?.role || 'guest';
  }

  isAdmin() { return this.role() === 'admin'; }
  isOperator() { return this.role() === 'operator'; }
  isGuest() { return this.role() === 'guest'; }
  canWrite() { return this.isAdmin() || this.isOperator(); }

  async login(username, password) {
    const user = this.users.find(u => u.username === username);
    if (!user) throw new Error('帳號或密碼錯誤');

    const isValid = await CryptoUtil.verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) throw new Error('帳號或密碼錯誤');

    if (user.mustChangePassword) {
      return { requireForceChange: true, user };
    }

    this.session = { username: user.username, role: user.role, name: user.name || user.username };
    localStorage.setItem(this.KEYS.session, JSON.stringify(this.session));
    return { requireForceChange: false, user: this.session };
  }

  async forceChangePassword(username, newPassword) {
    const userIdx = this.users.findIndex(u => u.username === username);
    if (userIdx === -1) throw new Error('使用者不存在');

    const { hash, salt } = await CryptoUtil.hashPassword(newPassword);
    this.users[userIdx].passwordHash = hash;
    this.users[userIdx].salt = salt;
    this.users[userIdx].mustChangePassword = false;

    localStorage.setItem(this.KEYS.users, JSON.stringify(this.users));
    return this.login(username, newPassword);
  }

  logout() {
    this.session = null;
    localStorage.removeItem(this.KEYS.session);
  }
}
