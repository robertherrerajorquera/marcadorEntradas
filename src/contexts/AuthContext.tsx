"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

type UserRole = "employee" | "employer"

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  employerId?: string // For employees, reference to their employer
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const loadUser = async () => {
      try {
        const userString = await AsyncStorage.getItem("user")
        if (userString) {
          setUser(JSON.parse(userString))
        }
      } catch (error) {
        console.error("Failed to load user from storage", error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      // In a real app, you would make an API call here
      // This is just a mock implementation
      const mockUser: User = {
        id: "1",
        name: "Test User",
        email,
        role: email.includes("employer") ? "employer" : "employee",
        ...(email.includes("employee") && { employerId: "2" }),
      }

      await AsyncStorage.setItem("user", JSON.stringify(mockUser))
      setUser(mockUser)
    } catch (error) {
      console.error("Login failed", error)
      throw new Error("Login failed")
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("user")
      setUser(null)
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    setLoading(true)
    try {
      // In a real app, you would make an API call here
      // This is just a mock implementation
      const mockUser: User = {
        id: Date.now().toString(),
        name,
        email,
        role,
        ...(role === "employee" && { employerId: "2" }),
      }

      await AsyncStorage.setItem("user", JSON.stringify(mockUser))
      setUser(mockUser)
    } catch (error) {
      console.error("Registration failed", error)
      throw new Error("Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return <AuthContext.Provider value={{ user, loading, login, logout, register }}>{children}</AuthContext.Provider>
}

