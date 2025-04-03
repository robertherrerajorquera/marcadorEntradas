"use client"

// Un componente de toast mejorado para web y nativo (Android/iOS)
import type React from "react"
import { useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native"
// Reemplazamos react-native-feather con @expo/vector-icons
import { Feather } from "@expo/vector-icons"

interface ToastProps {
  id: string
  message: string
  type: "success" | "error" | "info"
  onClose: (id: string) => void
}

// Componente para renderizar un toast tanto en web como en nativo (Android/iOS)
export const SimpleToast: React.FC<ToastProps> = ({ id, message, type = "info", onClose }) => {
  useEffect(() => {
    // Auto-cerrar después de 30 segundos
    const timer = setTimeout(
      () => {
        onClose(id)
      },
      type === "info" ? 3000 : 30000,
    )

    return () => clearTimeout(timer)
  }, [id, onClose, type])

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "#48BB78"
      case "error":
        return "#F56565"
      case "info":
      default:
        return "#4299E1"
    }
  }

  // Versión para web
  if (Platform.OS === "web") {
    return (
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          backgroundColor: getBackgroundColor(),
          color: "white",
          padding: "12px 16px",
          paddingRight: "36px", // Espacio para el botón de cerrar
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          zIndex: 9999,
          minWidth: "250px",
          maxWidth: "350px",
          marginBottom: "10px",
          animation: "slideIn 0.3s ease-out forwards",
        }}
      >
        {message}
        <div
          onClick={() => onClose(id)}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
      </div>
    )
  }

  // Versión para nativo (Android/iOS)
  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity style={styles.closeButton} onPress={() => onClose(id)}>
        {/* Reemplazamos el componente X de react-native-feather con Feather de @expo/vector-icons */}
        <Feather name="x" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  )
}

// Función auxiliar para mostrar un toast directamente en web
// (Para Android/iOS, se usa el componente SimpleToast a través del contexto)
export const showWebToast = (message: string, type: "success" | "error" | "info" = "info") => {
  if (typeof document === "undefined") return

  // Asegurarse de que el contenedor exista
  let container = document.getElementById("toast-container")
  if (!container) {
    container = document.createElement("div")
    container.id = "toast-container"
    Object.assign(container.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: "9999",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      gap: "10px",
    })
    document.body.appendChild(container)

    // Añadir estilos de animación
    const style = document.createElement("style")
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `
    document.head.appendChild(style)
  }

  // Crear el toast
  const toast = document.createElement("div")
  const toastId = `toast-${Date.now()}`
  toast.id = toastId

  // Aplicar estilos
  const backgroundColor = (() => {
    switch (type) {
      case "success":
        return "#48BB78"
      case "error":
        return "#F56565"
      case "info":
      default:
        return "#4299E1"
    }
  })()

  Object.assign(toast.style, {
    backgroundColor,
    color: "white",
    padding: "12px 16px",
    paddingRight: "36px",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
    minWidth: "250px",
    maxWidth: "350px",
    marginBottom: "10px",
    position: "relative",
    animation: "slideIn 0.3s ease-out forwards",
  })

  // Añadir mensaje
  toast.textContent = message

  // Añadir botón de cerrar
  const closeButton = document.createElement("div")
  Object.assign(closeButton.style, {
    position: "absolute",
    top: "8px",
    right: "8px",
    cursor: "pointer",
    padding: "4px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  })

  closeButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `

  closeButton.addEventListener("click", () => {
    container?.removeChild(toast)

    // Limpiar el contenedor si está vacío
    if (container && container.childNodes.length === 0) {
      document.body.removeChild(container)
    }
  })

  toast.appendChild(closeButton)
  container.appendChild(toast)

  // Auto-cerrar después de 30 segundos
  setTimeout(
    () => {
      if (container && container.contains(toast)) {
        container.removeChild(toast)

        // Limpiar el contenedor si está vacío
        if (container.childNodes.length === 0) {
          document.body.removeChild(container)
        }
      }
    },
    type === "info" ? 3000 : 30000,
  )
}

const styles = StyleSheet.create({
  container: {
    margin: 10,
    padding: 15,
    paddingRight: 40, // Espacio para el botón de cerrar
    borderRadius: 8,
    minWidth: 250,
    maxWidth: 350,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  message: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 5,
  },
})

