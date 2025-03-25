"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import type { User, UserRole } from "../types"
import { authService } from "../services/api"
import { useSimpleToast } from "./SimpleToastContext"
import { Platform } from "react-native"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string, isQrLogin?: boolean, qrUserData?: any) => Promise<boolean>
  logout: () => Promise<void>
  register: (name: string, email: string, password: string, role: UserRole, rut?: string) => Promise<boolean>
  API_URL: string
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  logout: async () => {},
  register: async () => false,
  API_URL: "",
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { showToast } = useSimpleToast()

  // API URL for backend calls - Use appropriate URL based on platform
  const API_URL =
    Platform.OS === "android"
      ? "http://192.168.163.21/backendMarcadorEntradas/api"
      : Platform.OS === "ios"
        ? "http://192.168.163.21/backendMarcadorEntradas/api"
        : "/backendMarcadorEntradas/api"

  console.log(`Auth context using API URL for ${Platform.OS}:`, API_URL)

  // Load user from storage on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log("Checking for saved user in AsyncStorage")
        const userString = await AsyncStorage.getItem("user")

        if (userString) {
          const userData = JSON.parse(userString)
          console.log("User found in AsyncStorage:", userData.email)
          setUser(userData)
        } else {
          console.log("No user found in AsyncStorage")
        }
      } catch (error) {
        console.error("Failed to load user from storage", error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  // Login function
  const login = async (
    emailOrRut: string,
    password: string,
    isQrLogin = false,
    qrUserData: any = null,
  ): Promise<boolean> => {
    try {
      setLoading(true)
      console.log(`Starting ${isQrLogin ? "QR" : "standard"} login process for:`, emailOrRut)

      // If it's a QR login and we have user data, skip the API call
      let apiUser
      if (isQrLogin && qrUserData) {
        apiUser = qrUserData
        console.log("Using QR provided user data:", apiUser)
      } else {
        // Determine if input is email or RUT based on format
        const isEmail = emailOrRut.includes("@")
        let response

        if (isEmail) {
          // Call API to authenticate with email
          response = await authService.login(emailOrRut, password)
        } else {
          // Call API to authenticate with RUT
          response = await authService.loginWithRut(emailOrRut, password)
        }

        if (response.error || !response.user) {
          console.error("API response error:", response.error || "User not found")
          showToast(response.message || "Invalid credentials", "error")
          return false
        }

        apiUser = response.user
        console.log("Login successful in API, processing user data")
      }

      // Make sure the role is exactly "employer" or "employee"
      let userRole: UserRole = "employee" // Default value

      if (apiUser.role === "employer") {
        userRole = "employer"
      } else if (apiUser.role === "employee") {
        userRole = "employee"
      } else {
        console.warn(`Unknown role: ${apiUser.role}, using "employee" as default`)
      }

      console.log("User role:", userRole)

      const mockUser: User = {
        id: apiUser.id || "1",
        name: apiUser.nombre || "Test User",
        email: apiUser.email || "",
        role: userRole,
        empresaId: Number(apiUser.empresa_id || "1"),
        status_employee: apiUser.status_employee || "present",
        rut: apiUser.rut || "",
        ...(userRole === "employee" && { employerId: apiUser.empresa_id || "2" }),
      }

      console.log("Saving user to AsyncStorage:", mockUser)
      await AsyncStorage.setItem("user", JSON.stringify(mockUser))
      setUser(mockUser)
      showToast("Login successful", "success")
      return true
    } catch (error) {
      console.error("Login failed", error)
      showToast("Login error. Please try again.", "error")
      return false
    } finally {
      setLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    try {
      console.log("Logging out")
      setLoading(true)

      // First set user to null to prevent any navigation issues
      setUser(null)

      // Then remove from storage
      await AsyncStorage.removeItem("user")

      showToast("Logged out successfully", "info")
    } catch (error) {
      console.error("Logout failed", error)
      showToast("Error logging out", "error")
    } finally {
      setLoading(false)
    }
  }

  // Register function
  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole,
    rut?: string,
  ): Promise<boolean> => {
    try {
      setLoading(true)
      console.log("Starting registration process for:", email)

      // Call API to register
      const response = await authService.register(
        name,
        email,
        password,
        role,
        undefined,
        "Sin asignar",
        "Sin asignar",
        rut,
      )

      if (response.error) {
        console.error("API response error:", response.error)
        showToast(response.message || "Registration error", "error")
        return false
      }

      console.log("Registration successful in API, creating local user")

      const mockUser: User = {
        id: Date.now().toString(),
        name,
        email,
        role,
        empresaId: role === "employer" ? Number(Date.now().toString()) : 1,
        status_employee: "present",
        rut: rut || "",
        ...(role === "employee" && { employerId: "2" }),
      }

      console.log("Saving user to AsyncStorage")
      await AsyncStorage.setItem("user", JSON.stringify(mockUser))
      setUser(mockUser)
      showToast("Registration successful", "success")
      return true
    } catch (error) {
      console.error("Registration failed", error)
      showToast("Registration error", "error")
      return false
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, API_URL }}>{children}</AuthContext.Provider>
  )
}

