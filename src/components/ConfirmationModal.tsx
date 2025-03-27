

import type React from "react"
import { useEffect, useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native"
import { AlertCircle, Clock } from "react-native-feather"

interface ConfirmationModalProps {
  visible: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  timeoutSeconds: number
  onConfirm: () => void
  onCancel: () => void
  onTimeout: () => void
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText = "Sí",
  cancelText = "No",
  timeoutSeconds,
  onConfirm,
  onCancel,
  onTimeout,
}) => {
  const [progress, setProgress] = useState(100)
  const [timeLeft, setTimeLeft] = useState(timeoutSeconds)

  useEffect(() => {
    if (!visible) {
      setProgress(100)
      setTimeLeft(timeoutSeconds)
      return
    }

    // Iniciar el temporizador cuando el modal es visible
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          onTimeout()
          return 0
        }
        return prev - 1
      })

      setProgress((prev) => {
        const newProgress = ((timeLeft - 1) / timeoutSeconds) * 100
        return newProgress < 0 ? 0 : newProgress
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [visible, timeLeft, timeoutSeconds, onTimeout])

  if (!visible) return null

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <AlertCircle stroke="#4C51BF" width={24} height={24} />
            <Text style={styles.modalTitle}>{title}</Text>
          </View>

          <Text style={styles.modalMessage}>{message}</Text>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
            <View style={styles.timeContainer}>
              <Clock stroke="#718096" width={16} height={16} />
              <Text style={styles.timeText}>{timeLeft} segundos</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    width: "85%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D3748",
    marginLeft: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: "#4A5568",
    marginBottom: 20,
  },
  progressContainer: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    marginBottom: 5,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4C51BF",
    borderRadius: 4,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 20,
  },
  timeText: {
    fontSize: 14,
    color: "#718096",
    marginLeft: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#EDF2F7",
  },
  cancelButtonText: {
    color: "#4A5568",
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#4C51BF",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
})

export default ConfirmationModal

