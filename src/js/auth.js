
/**
 * Mock Authentication System using LocalStorage
 * NOT SECURE - For Demonstration Purposes Only
 */

const USERS_KEY = 'jurosim_users';
const SESSION_KEY = 'jurosim_session';

// --- UTILS ---
function getUsers() {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// --- API ---

export function register(name, email, password) {
  const users = getUsers();

  if (users.find(u => u.email === email)) {
    throw new Error('Email já cadastrado.');
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password // Storing plain text password! DO NOT DO THIS IN PRODUCTION
  };

  users.push(newUser);
  saveUsers(users);

  // Auto login after register
  login(email, password);
  return newUser;
}

export function login(email, password) {
  const users = getUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    throw new Error('Email ou senha inválidos.');
  }

  const session = {
    userId: user.id,
    name: user.name,
    email: user.email,
    token: 'mock-token-' + Date.now()
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = 'login.html';
}

export function getSession() {
  const session = localStorage.getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
}

export function requireAuth() {
  const session = getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

export function requireGuest() {
  const session = getSession();
  if (session) {
    window.location.href = 'index.html';
  }
}
