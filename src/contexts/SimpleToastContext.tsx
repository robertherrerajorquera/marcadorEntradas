

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import { Platform, View, StyleSheet } from "react-native"
import { SimpleToast, showWebToast } from "../components/ToastProvider"

type ToastType = "success" | "error" | "info"

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const SimpleToastContext = createContext<ToastContextType>({
  showToast: () => {},
})

export const useSimpleToast = () => useContext(SimpleToastContext)

// Proveedor que maneja la lógica de toasts para ambas plataformas (web y nativo)
export const SimpleToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Este estado solo se usa para la versión nativa (Android/iOS)
  const [toasts, setToasts] = useState<Toast[]>([])

  // Función para eliminar un toast (solo para nativo)
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  // Función unificada para mostrar toasts en ambas plataformas
  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now().toString()
    console.log(`Mostrando toast en ${Platform.OS}:`, message, type)

    if (Platform.OS === "web") {
      // En web, usamos la función directa que manipula el DOM
      showWebToast(message, type)
      console.log("Toast web mostrado:", id)
    } else {
      // En nativo (Android/iOS), añadimos el toast al estado para renderizarlo
      try {
        setToasts((prev) => [...prev, { id, message, type }])
        console.log("Toast nativo añadido:", id)
      } catch (error) {
        console.error("Error al mostrar toast nativo:", error)
        // Fallback simple para asegurar que el usuario vea el mensaje
        alert(`${type.toUpperCase()}: ${message}`)
      }
    }
  }, [])

  return (
    <SimpleToastContext.Provider value={{ showToast }}>
      {children}

      {/* Solo renderizamos los componentes de toast para nativo (Android/iOS) */}
      {Platform.OS !== "web" && (
        <View style={styles.toastContainer}>
          {toasts.map((toast) => (
            <SimpleToast key={toast.id} id={toast.id} message={toast.message} type={toast.type} onClose={removeToast} />
          ))}
        </View>
      )}
    </SimpleToastContext.Provider>
  )
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    zIndex: 9999,
  },
})

