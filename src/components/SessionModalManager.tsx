"use client"

import type React from "react"
import { useSession } from "../contexts/SessionContext"
import ConfirmationModal from "./ConfirmationModal"
import { useAuth } from "../contexts/AuthContext"

const SessionModalManager: React.FC = () => {
  const { showSessionModal, sessionModalType, handleSessionContinue, handleSessionEnd, handleAfterActionResponse } =
    useSession()
  const { user } = useAuth()

  // Configurar el contenido del modal según el tipo
  let title = ""
  let message = ""
  let timeoutSeconds = 3
  const confirmText = "Sí"
  const cancelText = "No"
  let onConfirm = handleSessionContinue
  let onCancel = handleSessionEnd
  let onTimeout = handleSessionEnd

  if (sessionModalType === "inactivity") {
    if (user?.role === "employee") {
      title = "¿Sigues ahí?"
      message = "Tu sesión está a punto de expirar por inactividad. ¿Deseas continuar?"
      timeoutSeconds = 3
    } else if (user?.role === "employer") {
      title = "¿Sigues ahí?"
      message = "Tu sesión está a punto de expirar por inactividad. ¿Necesitas más tiempo?"
      timeoutSeconds = 3
    }
  } else if (sessionModalType === "after-action") {
    title = "Acción completada"
    message = "¿Deseas realizar alguna otra acción?"
    timeoutSeconds = 3
    onConfirm = () => handleAfterActionResponse(true)
    onCancel = () => handleAfterActionResponse(false)
    onTimeout = () => handleAfterActionResponse(false)
  }

  return (
    <ConfirmationModal
      visible={showSessionModal}
      title={title}
      message={message}
      confirmText={confirmText}
      cancelText={cancelText}
      timeoutSeconds={timeoutSeconds}
      onConfirm={onConfirm}
      onCancel={onCancel}
      onTimeout={onTimeout}
    />
  )
}

export default SessionModalManager

