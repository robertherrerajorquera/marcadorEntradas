"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect, type ReactNode } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useSimpleToast } from "./SimpleToastContext"
import { Platform } from "react-native"

// Definir el tipo para el usuario
interface User {
  id: string
  nombre: string
  email: string
  role: string
  empresaId: string
  empresaNombre?: string
  position?: string
  department?: string
  status_employee?: string
  rut?: string
  phone?: string
}

// Definir el tipo para el contexto
interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: (email: string, password: string, isQrLogin?: boolean, userData?: any) => Promise<boolean>
  loginWithRut: (rut: string) => Promise<boolean>
  logout: () => Promise<void>
  loading: boolean
  API_URL: string
}

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Proveedor del contexto
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { showToast } = useSimpleToast()
  const getApiUrl = () => {
    if (Platform.OS === "android") {
      return "http://192.168.189.21/backendMarcadorEntradas/api"
    } else if (Platform.OS === "ios") {
      return "http://192.168.189.21/backendMarcadorEntradas/api"
    } else {
      // Para web, usar una URL relativa o absoluta según la configuración del servidor
      //const baseUrl = window.location.origin
      const baseUrl ="http://192.168.189.21"
      return `${baseUrl}/backendMarcadorEntradas/api`
    }
  }
  
  const API_URL = getApiUrl()


  // Cargar el estado de autenticación al iniciar
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const userJson = await AsyncStorage.getItem("user")
        if (userJson) {
          const userData = JSON.parse(userJson)
          setUser(userData)
          setIsAuthenticated(true)
          console.log("Usuario cargado desde AsyncStorage:", userData)
        }
      } catch (error) {
        console.error("Error al cargar el estado de autenticación:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAuthState()
  }, [])

  // Update the login method to properly handle QR login
  const login = async (email: string, password: string, isQrLogin = false, userData: any = null): Promise<boolean> => {
    setLoading(true)
    try {
      console.log("Iniciando login con:", { email, isQrLogin })

      if (isQrLogin && userData) {
        // If we already have user data from QR login, just use it directly
        const qrUserData: User = {
          id: userData.id,
          nombre: userData.nombre,
          email: userData.email,
          role: userData.role,
          empresaId: userData.empresaId,
          empresaNombre: userData.empresaNombre,
          position: userData.position,
          department: userData.department,
          status_employee: userData.status_employee,
          rut: userData.rut,
          phone: userData.phone,
        }

        setUser(qrUserData)
        setIsAuthenticated(true)
        await AsyncStorage.setItem("user", JSON.stringify(qrUserData))

        console.log("Login con QR exitoso, usuario guardado:", qrUserData)
        return true
      }

      // Regular email/password login
      console.log("Enviando solicitud de login con email a la API:", { email })
      console.log("URL de login:", `${API_URL}/usuarios/login.php`)

      const response = await fetch(`${API_URL}/usuarios/login.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      console.log("Código de estado HTTP:", response.status)

      // Verificar si la respuesta es JSON válido
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.log("Respuesta en texto plano:", text)
        throw new Error("INVALID_JSON_RESPONSE")
      }

      const data = await response.json()
      console.log("Respuesta de la API (login):", data)

      if (response.ok && data.user) {
        // Guardar el usuario en el estado y AsyncStorage
        const userData: User = {
          id: data.user.id,
          nombre: data.user.nombre,
          email: data.user.email,
          role: data.user.role,
          empresaId: data.user.empresaId,
          empresaNombre: data.user.empresaNombre,
          position: data.user.position,
          department: data.user.department,
          status_employee: data.user.status_employee,
          rut: data.user.rut,
          phone: data.user.phone,
        }

        setUser(userData)
        setIsAuthenticated(true)
        await AsyncStorage.setItem("user", JSON.stringify(userData))

        console.log("Login exitoso, usuario guardado:", userData)
        return true
      } else {
        console.error("Error en el login (API):", data.error)
        showToast(data.message || "Credenciales incorrectas", "error")
        return false
      }
    } catch (error) {
      console.error("Error en el login:", error)

      if (error instanceof Error) {
        if (error.message === "INVALID_JSON_RESPONSE") {
          showToast("Error en la respuesta del servidor. No es un JSON válido.", "error")
        } else {
          showToast("Error al iniciar sesión. Intente nuevamente.", "error")
        }
      } else {
        showToast("Error desconocido al iniciar sesión", "error")
      }

      return false
    } finally {
      setLoading(false)
    }
  }

  // Add the loginWithRut method to the AuthContext
  const loginWithRut = async (rut: string): Promise<boolean> => {
    setLoading(true)
    try {
      console.log("Enviando solicitud de login con RUT a la API:", { rut })
      console.log("URL de login con RUT:", `${API_URL}/usuarios/login_rut_qr.php`)

      const response = await fetch(`${API_URL}/usuarios/login_rut_qr.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rut }),
      })

      console.log("Código de estado HTTP:", response.status)

      // Verificar si la respuesta es JSON válido
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.log("Respuesta en texto plano:", text)
        throw new Error("INVALID_JSON_RESPONSE")
      }

      const data = await response.json()
      console.log("Respuesta de la API (login con RUT):", data)

      if (response.ok && data.user) {
        // Guardar el usuario en el estado y AsyncStorage
        const userData: User = {
          id: data.user.id,
          nombre: data.user.nombre,
          email: data.user.email,
          role: data.user.role,
          empresaId: data.user.empresaId,
          empresaNombre: data.user.empresaNombre,
          position: data.user.position,
          department: data.user.department,
          status_employee: data.user.status_employee,
          rut: data.user.rut,
          phone: data.user.phone,
        }

        setUser(userData)
        setIsAuthenticated(true)
        await AsyncStorage.setItem("user", JSON.stringify(userData))

        console.log("Login con RUT exitoso, usuario guardado:", userData)
        return true
      } else {
        console.error("Error en el login con RUN:", data.error)
        showToast("Usuario no encontrado con el RUN escaneado", "error")
        return false
      }
    } catch (error) {
      console.error("Error en el login con RUT:", error)

      if (error instanceof Error) {
        if (error.message === "INVALID_JSON_RESPONSE") {
          showToast("Error en la respuesta del servidor. No es un JSON válido.", "error")
        } else {
          showToast("Error al iniciar sesión con RUT. Intente nuevamente.", "error")
        }
      } else {
        showToast("Error desconocido al iniciar sesión con RUT", "error")
      }

      return false
    } finally {
      setLoading(false)
    }
  }

  // Función para cerrar sesión
  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem("user")
      setUser(null)
      setIsAuthenticated(false)
      console.log("Sesión cerrada correctamente")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      throw error
    }
  }

  // Update the value object to include the loginWithRut method
  const value = {
    isAuthenticated,
    user,
    login,
    loginWithRut,
    logout,
    loading,
    API_URL,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook personalizado para usar el contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}

