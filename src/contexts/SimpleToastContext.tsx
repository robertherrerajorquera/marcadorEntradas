"use client"

import React, { createContext, useContext, useRef, useState, useEffect } from "react"
import { Platform } from "react-native"

// Tipos para nuestro sistema de toast
type ToastType = "success" | "danger" | "info" | "warning" | "secondary" | "contrast" 
type ToastPosition = "top-right" | "top-center" | "top-left" | "bottom-right" | "bottom-center" | "bottom-left"

interface ToastOptions {
  sticky?: boolean,
  position?: ToastPosition
  autoClose?: number
  closeButton?: boolean
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, options?: ToastOptions) => void
}

// Contexto por defecto
const SimpleToastContext = createContext<ToastContextType>({
  showToast: () => {},
})

export const useSimpleToast = () => useContext(SimpleToastContext)

// Proveedor de toast que usa PrimeReact para web y react-native-toast-message para nativo
export const SimpleToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Referencias para los servicios de toast
  const toastRef = useRef<any>(null)
  const [ToastComponent, setToastComponent] = useState<any>(null)

  // Efecto para cargar PrimeReact en web
  useEffect(() => {
    if (Platform.OS === "web") {
      try {
        // Cargar estilos de PrimeReact
        const linkPrimereact = document.createElement('link');
        linkPrimereact.rel = 'stylesheet';
        linkPrimereact.href = 'https://unpkg.com/primereact/resources/primereact.min.css';
        document.head.appendChild(linkPrimereact);
        
        const linkTheme = document.createElement('link');
        linkTheme.rel = 'stylesheet';
        linkTheme.href = 'https://unpkg.com/primereact/resources/themes/lara-light-indigo/theme.css';
        document.head.appendChild(linkTheme);
        
        const linkIcons = document.createElement('link');
        linkIcons.rel = 'stylesheet';
        linkIcons.href = 'https://unpkg.com/primeicons/primeicons.css';
        document.head.appendChild(linkIcons);
        
        // Importar el componente Toast usando require
        const PrimeToast = require('primereact/toast').Toast;
        setToastComponent(() => PrimeToast);
      } catch (error) {
        console.error("Error al cargar PrimeReact:", error);
      }
    }
    
    return () => {
      // Limpiar al desmontar
      if (Platform.OS === "web") {
        const links = document.querySelectorAll('link[href*="primereact"], link[href*="primeicons"]');
        links.forEach(link => link.remove());
      }
    };
  }, [])

  // Función unificada para mostrar toasts
  const showToast = (message: string, type: ToastType = "info", options: ToastOptions = {}) => {
    const defaultOptions = {
      position: "top-right" as ToastPosition,
      autoClose: 30000, // 30 segundos
      closeButton: true,
    }

    const mergedOptions = { ...defaultOptions, ...options }
    console.log(`Mostrando toast (${type}):`, message)

    if (Platform.OS === "web") {
      // En web, usamos PrimeReact Toast
      if (toastRef.current) {
        toastRef.current.show({
          severity: type,
          summary: type.charAt(0).toUpperCase() + type.slice(1),
          detail: message,
          life: mergedOptions.autoClose,
          closable: mergedOptions.closeButton,
          position: mergedOptions.position.replace("-", ""),
        })
      } else {
        // Fallback si PrimeReact no está disponible
        alert(`${type.toUpperCase()}: ${message}`);
      }
    } else {
      // En nativo, usamos react-native-toast-message
      try {
        // Importación condicional en tiempo de compilación
        const Toast = require('react-native-toast-message').default;
        Toast.show({
          type: type,
          text1: message,
          position: mergedOptions.position.includes("top") ? "top" : "bottom",
          autoHide: true,
          visibilityTime: mergedOptions.autoClose,
        });
      } catch (error) {
        console.error("Error al mostrar toast nativo:", error);
      }
    }
  }

  return (
    <SimpleToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Renderizar el componente Toast de PrimeReact solo en web */}
      {Platform.OS === "web" && ToastComponent && (
        <ToastComponent ref={toastRef} />
      )}
    </SimpleToastContext.Provider>
  )
}