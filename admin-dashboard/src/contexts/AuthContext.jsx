import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Mock user data – replace with real authentication later
const mockUsers = {
  admin: { id: 1, name: 'Admin User', email: 'admin@musichive.com', role: 'admin' },
  manager: { id: 2, name: 'Manager User', email: 'manager@musichive.com', role: 'manager' },
  accountant: { id: 3, name: 'Accountant User', email: 'accountant@musichive.com', role: 'accountant' },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(mockUsers.accountant); // Change to mockUsers.accountant to test

  const login = (email, password) => {
    // Mock login logic
    if (email === 'admin@musichive.com') setUser(mockUsers.admin);
    else if (email === 'manager@musichive.com') setUser(mockUsers.manager);
    else if (email === 'accountant@musichive.com') setUser(mockUsers.accountant);
    else setUser(null);
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};