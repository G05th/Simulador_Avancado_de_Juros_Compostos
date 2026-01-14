
// Mock LocalStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

global.localStorage = localStorageMock;
global.window = { location: { href: '' } };

import { getSession, login, logout, register } from './auth.js';

console.log('--- AUTH VERIFICATION START ---');

try {
    // 1. Register
    console.log('1. Registering User...');
    const user = register('Test User', 'test@example.com', 'password123');
    console.log('   Registered:', user.name);

    // 2. Check Session (Auto-login)
    console.log('2. Checking Session...');
    let session = getSession();
    if (session && session.email === 'test@example.com') {
        console.log('   Session Active:', session.email);
    } else {
        console.error('   Session Failed!');
    }

    // 3. Logout
    console.log('3. Logging Out...');
    logout();
    session = getSession();
    if (!session) {
        console.log('   Logout Successful');
    } else {
        console.error('   Logout Failed!');
    }

    // 4. Login
    console.log('4. Logging In...');
    login('test@example.com', 'password123');
    session = getSession();
    if (session) {
        console.log('   Login Successful:', session.name);
    } else {
        console.error('   Login Failed!');
    }

    // 5. Invalid Login
    console.log('5. Testing Invalid Login...');
    try {
        login('test@example.com', 'wrongpass');
        console.error('   Failed: Allowed invalid password');
    } catch (e) {
        console.log('   Success: Blocked invalid password (' + e.message + ')');
    }

} catch (e) {
    console.error('ERROR:', e);
}

console.log('--- AUTH VERIFICATION END ---');
