

import type React from "react"
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "./AuthContext"
import { useSimpleToast } from "./SimpleToastContext"
import type { UserRole } from "../types"
// Añadir la importación de Platform
import { Platform } from "react-native"

interface SessionContextType {
  showSessionModal: boolean
  sessionModalType: "continue" | "after-action" | "inactivity"
  resetInactivityTimer: () => void
  handleSessionContinue: () => void
  handleSessionEnd: () => void
  handleAfterActionResponse: (shouldContinue: boolean) => void
  showAfterActionModal: () => void
}

const SessionContext = createContext<SessionContextType>({
  showSessionModal: false,
  sessionModalType: "inactivity",
  resetInactivityTimer: () => {},
  handleSessionContinue: () => {},
  handleSessionEnd: () => {},
  handleAfterActionResponse: () => {},
  showAfterActionModal: () => {},
})

export const useSession = () => useContext(SessionContext)

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth()
  const { showToast } = useSimpleToast()
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [sessionModalType, setSessionModalType] = useState<"continue" | "after-action" | "inactivity">("inactivity")
  const [extensionCount, setExtensionCount] = useState(0)
  const [unlimitedSession, setUnlimitedSession] = useState(false)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  // Configuración de tiempos según el tipo de usuario
  const getInactivityTimeout = useCallback(() => {
    if (unlimitedSession) return null

    const role = user?.role as UserRole
    if (role === "employee") {
      return 35 * 1000 // 35 segundos para empleados
    } else if (role === "employer") {
      return 180 * 1000 // 180 segundos para empleadores
    }
    return 60 * 1000 // Valor por defecto
  }, [user?.role, unlimitedSession])

  // Reiniciar el temporizador de inactividad
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = null
    }

    lastActivityRef.current = Date.now()

    const timeout = getInactivityTimeout()
    if (!timeout) return // No configurar temporizador si la sesión es ilimitada

    inactivityTimerRef.current = setTimeout(() => {
      // Solo mostrar el modal si el usuario está autenticado
      if (user) {
        setSessionModalType("inactivity")
        setShowSessionModal(true)
      }
    }, timeout)
  }, [getInactivityTimeout, user])

  // Cerrar sesión
  const handleSessionEnd = useCallback(() => {
    setShowSessionModal(false)
    showToast("Cerrando sesión por inactividad", "info")

    // Pequeño retraso para que el usuario vea el toast antes de cerrar sesión
    setTimeout(() => {
      logout()
    }, 1000)
  }, [logout, showToast])

  // Manejar la respuesta del usuario al modal de inactividad
  const handleSessionContinue = useCallback(() => {
    setShowSessionModal(false)

    const role = user?.role as UserRole

    if (role === "employee") {
      // Para empleados, verificar el límite de extensiones
      if (extensionCount >= 2) {
        showToast("Has alcanzado el límite de extensiones de sesión", "info")
        handleSessionEnd()
        return
      }

      setExtensionCount((prev) => prev + 1)
      showToast(`Sesión extendida (${extensionCount + 1}/3)`, "info")
      resetInactivityTimer()
    } else if (role === "employer") {
      // Para empleadores, quitar el límite de tiempo
      setUnlimitedSession(true)
      showToast("Sesión extendida indefinidamente", "success")
    }
  }, [extensionCount, resetInactivityTimer, showToast, user?.role, handleSessionEnd])

  // Reemplazar el useEffect que configura los event listeners con esta versión compatible con ambas plataformas
  // Iniciar el seguimiento de actividad cuando el usuario inicia sesión
  useEffect(() => {
    if (user) {
      resetInactivityTimer()

      // Reiniciar contadores cuando cambia el usuario
      setExtensionCount(0)
      setUnlimitedSession(false)

      // Solo configurar event listeners en la web
      if (Platform.OS === "web") {
        // Configurar listeners para detectar actividad del usuario
        const activityEvents = ["mousedown", "mousemove", "keydown", "touchstart", "scroll", "click"]

        const handleUserActivity = () => {
          lastActivityRef.current = Date.now()
          resetInactivityTimer()
        }

        activityEvents.forEach((event) => {
          window.addEventListener(event, handleUserActivity)
        })

        return () => {
          if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current)
          }

          activityEvents.forEach((event) => {
            window.removeEventListener(event, handleUserActivity)
          })
        }
      } else {
        // En React Native, simplemente configuramos el temporizador
        // La actividad se detectará cuando el usuario interactúe con componentes específicos
        // que llamen a resetInactivityTimer()
        return () => {
          if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current)
          }
        }
      }
    }
  }, [user, resetInactivityTimer])

  // Mostrar modal después de una acción (entrada/salida)
  const showAfterActionModal = useCallback(() => {
    setTimeout(() => {
      if (user?.role === "employee") {
        setSessionModalType("after-action")
        setShowSessionModal(true)
      }
    }, 1500) // 1.5 segundos después de la acción
  }, [user?.role, setSessionModalType, setShowSessionModal])

  // Manejar respuesta después de una acción
  const handleAfterActionResponse = useCallback(
    (shouldContinue: boolean) => {
      setShowSessionModal(false)

      if (!shouldContinue) {
        showToast("Cerrando sesión", "info")
        setTimeout(() => {
          logout()
        }, 1000)
      } else {
        resetInactivityTimer()
      }
    },
    [logout, resetInactivityTimer, showToast],
  )

  const value = {
    showSessionModal,
    sessionModalType,
    resetInactivityTimer,
    handleSessionContinue,
    handleSessionEnd,
    handleAfterActionResponse,
    showAfterActionModal,
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

