
interface User {
  phone: string;
  password?: string; // For account login
}

const DB_KEY = 'edge_note_users';
const SESSION_KEY = 'edge_note_session';

export const authService = {
  // Simulate Database Registration
  register: (phone: string, password?: string): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const usersStr = localStorage.getItem(DB_KEY);
        const users: User[] = usersStr ? JSON.parse(usersStr) : [];

        if (users.find(u => u.phone === phone)) {
          resolve({ success: false, message: '该手机号已注册' });
          return;
        }

        const newUser = { phone, password };
        users.push(newUser);
        localStorage.setItem(DB_KEY, JSON.stringify(users));
        resolve({ success: true, message: '注册成功' });
      }, 500); // Simulate network delay
    });
  },

  // Simulate Database Login (Password)
  loginByPassword: (phone: string, password: string): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const usersStr = localStorage.getItem(DB_KEY);
        const users: User[] = usersStr ? JSON.parse(usersStr) : [];
        const user = users.find(u => u.phone === phone && u.password === password);

        if (user) {
          localStorage.setItem(SESSION_KEY, JSON.stringify(user));
          resolve({ success: true, message: '登录成功' });
        } else {
          resolve({ success: false, message: '账号或密码错误' });
        }
      }, 500);
    });
  },

  // Simulate SMS Login (Mock Code: 123456)
  loginBySMS: (phone: string, code: string): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (code === '123456') {
          // Auto-register if not exists for SMS login, typical for this flow
          const usersStr = localStorage.getItem(DB_KEY);
          let users: User[] = usersStr ? JSON.parse(usersStr) : [];
          if (!users.find(u => u.phone === phone)) {
             users.push({ phone });
             localStorage.setItem(DB_KEY, JSON.stringify(users));
          }
          
          localStorage.setItem(SESSION_KEY, JSON.stringify({ phone }));
          resolve({ success: true, message: '登录成功' });
        } else {
          resolve({ success: false, message: '验证码错误 (测试码: 123456)' });
        }
      }, 500);
    });
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser: (): User | null => {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    return sessionStr ? JSON.parse(sessionStr) : null;
  }
};
