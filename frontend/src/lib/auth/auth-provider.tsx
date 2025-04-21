"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Define User type
type User = {
  id: string;
  name: string;
  email: string;
};

// Define Auth context type
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
};

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  forgotPassword: async () => {},
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Check if the user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      // In a real app, you would check if there's a valid token in localStorage
      // and fetch the user data from the backend
      const token = localStorage.getItem("auth_token");
      
      if (token) {
        try {
          // Mock user data for now
          // In a real app, you would validate the token with the backend
          // const response = await fetch('/api/auth/me', {
          //   headers: { Authorization: `Bearer ${token}` }
          // });
          // const userData = await response.json();
          
          // Mock user data
          const userData = {
            id: "1",
            name: "Demo User",
            email: "user@example.com",
          };
          
          setUser(userData);
        } catch (error) {
          // If token is invalid, clear it
          localStorage.removeItem("auth_token");
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // In a real app, you would make an API call to your backend
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password }),
      // });
      
      // if (!response.ok) throw new Error('Login failed');
      // const data = await response.json();
      
      // Mock successful login
      const mockToken = "mock_jwt_token";
      const mockUser = {
        id: "1",
        name: "Demo User",
        email,
      };
      
      // Store the token
      localStorage.setItem("auth_token", mockToken);
      
      // Update state
      setUser(mockUser);
      toast.success("Logged in successfully");
      
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // In a real app, you would make an API call to your backend
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name, email, password }),
      // });
      
      // if (!response.ok) throw new Error('Registration failed');
      
      // Mock successful registration
      toast.success("Account created successfully");
      
      // Redirect to login
      router.push("/auth/login");
    } catch (error) {
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    
    try {
      // In a real app, you might want to invalidate the token on the server
      // await fetch('/api/auth/logout', {
      //   method: 'POST',
      //   headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      // });
      
      // Clear local storage
      localStorage.removeItem("auth_token");
      
      // Update state
      setUser(null);
      toast.success("Logged out successfully");
      
      // Redirect to login
      router.push("/auth/login");
    } catch (error) {
      toast.error("Logout failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    
    try {
      // In a real app, you would make an API call to your backend
      // const response = await fetch('/api/auth/forgot-password', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email }),
      // });
      
      // if (!response.ok) throw new Error('Failed to send password reset email');
      
      // Mock successful password reset request
      toast.success("Password reset instructions sent to your email");
    } catch (error) {
      toast.error("Failed to send password reset email");
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    forgotPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 