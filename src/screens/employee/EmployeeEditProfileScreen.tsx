"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from "react-native"
import { Feather } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext"
import { useSimpleToast } from "../../contexts/SimpleToastContext"
import { useNavigation } from "@react-navigation/native"

const EmployeeEditProfileScreen = () => {
  const { user, API_URL } = useAuth()
  const { showToast } = useSimpleToast()
  const navigation = useNavigation()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [phone, setPhone] = useState(user?.phone || "")

  // Manejar guardado de perfil
  const handleSaveProfile = async () => {
    if (!user?.id) {
      showToast("Error: Usuario no identificado", "error")
      return
    }

    // Validación básica
    if (!phone.trim()) {
      showToast("Por favor ingresa un número de teléfono", "error")
      return
    }

    setIsSaving(true)
    try {
      console.log("Actualizando teléfono para el usuario ID:", user.id)

      const response = await fetch(`${API_URL}/usuarios/actualizar_telefono.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.id,
          phone: phone.trim(),
        }),
      })

      const data = await response.json()
      console.log("Respuesta de actualización:", data)

      if (response.ok && data.success) {
        // Actualizar el usuario en el contexto si es necesario
        if (user) {
          user.phone = phone.trim()
        }

        showToast("Teléfono actualizado correctamente", "success")

        // Regresar a la pantalla anterior
        setTimeout(() => {
          navigation.goBack()
        }, 1000)
      } else {
        console.error("Error al actualizar perfil:", data.error)
        showToast(data.message || "No se pudo actualizar el teléfono", "error")
      }
    } catch (error) {
      console.error("Error al guardar perfil:", error)
      showToast("Error al actualizar el teléfono", "error")
    } finally {
      setIsSaving(false)
    }
  }

  // Confirmación antes de salir si hay cambios
  const handleGoBack = () => {
    if (phone !== user?.phone) {
      if (Platform.OS === "web") {
        if (window.confirm("¿Salir sin guardar los cambios?")) {
          navigation.goBack()
        }
      } else {
        Alert.alert("Cambios sin guardar", "¿Estás seguro de que quieres salir sin guardar los cambios?", [
          { text: "Cancelar", style: "cancel" },
          { text: "Salir", onPress: () => navigation.goBack() },
        ])
      }
    } else {
      navigation.goBack()
    }
  }

  return (
    <View style={styles.container}>
      {/* Header con botón de regresar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <Feather name="arrow-left" size={24} color="#4C51BF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSaveProfile}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
             <Feather name="save" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Guardar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Información de Contacto</Text>
          <Text style={styles.infoText}>Como empleado, solo puedes modificar tu número de teléfono.</Text>

          {/* Número de teléfono */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Número de teléfono</Text>
            <View style={styles.inputWithIcon}>
            <Feather name="phone" size={20} color="#4C51BF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Ingresa tu número de teléfono"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Campos de solo lectura */}
          <Text style={styles.readOnlyTitle}>Información (Solo lectura)</Text>

          <View style={styles.readOnlyGroup}>
            <Text style={styles.readOnlyLabel}>Nombre</Text>
            <Text style={styles.readOnlyValue}>{user?.nombre || ""}</Text>
          </View>

          <View style={styles.readOnlyGroup}>
            <Text style={styles.readOnlyLabel}>Email</Text>
            <Text style={styles.readOnlyValue}>{user?.email || ""}</Text>
          </View>

          <View style={styles.readOnlyGroup}>
            <Text style={styles.readOnlyLabel}>Cargo</Text>
            <Text style={styles.readOnlyValue}>{ "No especificado"}</Text>
          </View>

          <View style={styles.readOnlyGroup}>
            <Text style={styles.readOnlyLabel}>Departamento</Text>
            <Text style={styles.readOnlyValue}>{ "No especificado"}</Text>
          </View>

          <Text style={styles.noteText}>Para modificar otros campos, contacta a tu empleador o administrador.</Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D3748",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4C51BF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveButtonDisabled: {
    backgroundColor: "#A0AEC0",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
    marginLeft: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D3748",
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: "#4A5568",
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: "#2D3748",
  },
  readOnlyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D3748",
    marginTop: 24,
    marginBottom: 16,
  },
  readOnlyGroup: {
    marginBottom: 16,
    backgroundColor: "#EDF2F7",
    padding: 14,
    borderRadius: 8,
  },
  readOnlyLabel: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 4,
  },
  readOnlyValue: {
    fontSize: 16,
    color: "#4A5568",
  },
  noteText: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#718096",
    marginTop: 20,
  },
})

export default EmployeeEditProfileScreen

