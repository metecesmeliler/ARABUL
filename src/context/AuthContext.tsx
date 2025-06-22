import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth Context Types
interface User {
  id: number;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const checkAuthStatus = async () => {
    try {
      console.log('🔍 [AUTH] Checking authentication status...');
      
      // Get stored user data
      const storedUserId = await AsyncStorage.getItem('user_id');
      const storedUserEmail = await AsyncStorage.getItem('user_email');
      
      console.log('🔍 [AUTH] Stored user_id:', storedUserId);
      console.log('🔍 [AUTH] Stored user_email:', storedUserEmail);
      
      if (storedUserId && storedUserEmail) {
        const userData: User = {
          id: parseInt(storedUserId),
          email: storedUserEmail
        };
        
        setUser(userData);
        console.log('✅ [AUTH] User authenticated from storage:', userData);
      } else {
        console.log('❌ [AUTH] No stored authentication found');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ [AUTH] Error checking auth status:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (userData: User) => {
    try {
      console.log('🔐 [AUTH] Logging in user:', userData);
      
      // Store user data in AsyncStorage
      await AsyncStorage.setItem('user_id', userData.id.toString());
      await AsyncStorage.setItem('user_email', userData.email);
      
      // Update state
      setUser(userData);
      
      console.log('✅ [AUTH] User logged in and stored successfully');
    } catch (error) {
      console.error('❌ [AUTH] Error during login:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('🚪 [AUTH] Logging out user...');
      
      // Remove user data from AsyncStorage
      await AsyncStorage.removeItem('user_id');
      await AsyncStorage.removeItem('user_email');
      
      // Clear state
      setUser(null);
      
      console.log('✅ [AUTH] User logged out successfully');
    } catch (error) {
      console.error('❌ [AUTH] Error during logout:', error);
    }
  };

  // Check auth status on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 