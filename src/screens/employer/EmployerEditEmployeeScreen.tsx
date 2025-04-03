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
import { Feather } from "@expo/vector-icons"
import { useAuth } from "../../contexts/AuthContext"
import { useSimpleToast } from "../../contexts/SimpleToastContext"
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import type { EmployeeStackParamList } from "../../navigation/EmployerTabs"

// Define the route prop type
type EmployerEditEmployeeScreenRouteProp = RouteProp<EmployeeStackParamList, "EditEmployee">

const EmployerEditEmployeeScreen = () => {
  const { API_URL } = useAuth()
  const { showToast } = useSimpleToast()
  const navigation = useNavigation()
  const route = useRoute<EmployerEditEmployeeScreenRouteProp>()
  const { employee } = route.params

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Campos editables
  const [email, setEmail] = useState(employee.email || "")
  const [phone, setPhone] = useState(employee.phone || "")
  const [position, setPosition] = useState(employee.position || "")
  const [department, setDepartment] = useState(employee.department || "")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswordFields, setShowPasswordFields] = useState(false)

  // Manejar guardado de perfil
  const handleSaveProfile = async () => {
    // Validación básica
    if (!email.trim()) {
      showToast("Por favor ingresa un email", "error")
      return
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      showToast("Por favor ingresa un email válido", "error")
      return
    }

    // Validar coincidencia de contraseñas si se está intentando cambiar
    if (showPasswordFields) {
      if (newPassword !== confirmPassword) {
        showToast("Las contraseñas no coinciden", "error")
        return
      }

      if (newPassword.length < 6) {
        showToast("La contraseña debe tener al menos 6 caracteres", "error")
        return
      }
    }

    setIsSaving(true)
    try {
      console.log("Actualizando perfil para el empleado ID:", employee.id)

      // Preparar datos a enviar
      const datosActualizacion = {
        id: employee.id,
        email: email.trim(),
        phone: phone.trim(),
        position: position.trim(),
        department: department.trim(),
        nuevo_password: showPasswordFields && newPassword ? newPassword : null,
      }

      console.log("Datos a enviar:", datosActualizacion)

      const response = await fetch(`${API_URL}/usuarios/actualizar_perfil.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosActualizacion),
      })

      const data = await response.json()
      console.log("Respuesta de actualización:", data)

      if (response.ok && data.success) {
        showToast("Perfil actualizado correctamente", "success")

        // Regresar a la pantalla anterior con los datos actualizados
        setTimeout(() => {
          // Actualizar el objeto de empleado con los nuevos valores
          const updatedEmployee = {
            ...employee,
            email,
            phone,
            position,
            department,
          }

          // @ts-ignore - Ignorando verificación de tipos para navegación
          navigation.navigate("EmployeeDetail", { employee: updatedEmployee })
        }, 1000)
      } else {
        console.error("Error al actualizar perfil:", data.error)
        showToast(data.message || "No se pudo actualizar el perfil", "error")
      }
    } catch (error) {
      console.error("Error al guardar perfil:", error)
      showToast("Error al actualizar el perfil", "error")
    } finally {
      setIsSaving(false)
    }
  }

  // Confirmación antes de salir si hay cambios
  const handleGoBack = () => {
    const hasChanges =
      email !== employee.email ||
      phone !== employee.phone ||
      position !== employee.position ||
      department !== employee.department ||
      newPassword !== "" ||
      confirmPassword !== ""

    if (hasChanges) {
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
        <Feather name="arrow-left" size={18}  color="#4C51BF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Empleado</Text>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSaveProfile}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather name="save" size={18}  color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Guardar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.employeeName}>{employee.nombre}</Text>
          <Text style={styles.infoText}>Estás editando la información de este empleado.</Text>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWithIcon}>
              <Feather name="mail" size={18}  color="#4C51BF"  style={styles.inputIcon}/>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Ingresa el email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Número de teléfono */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Número de teléfono</Text>
            <View style={styles.inputWithIcon}>
              <Feather name="phone" size={18}  color="#4C51BF"  style={styles.inputIcon}/>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Ingresa el número de teléfono"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Posición/Cargo */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cargo</Text>
            <View style={styles.inputWithIcon}>
              <Feather name="briefcase" size={18}  color="#4C51BF"  style={styles.inputIcon}/>
              <TextInput
                style={styles.input}
                value={position}
                onChangeText={setPosition}
                placeholder="Ingresa el cargo"
              />
            </View>
          </View>

          {/* Departamento */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Departamento</Text>
            <View style={styles.inputWithIcon}>
              <Feather name="briefcase" size={18}  color="#4C51BF"  style={styles.inputIcon}/>
              <TextInput
                style={styles.input}
                value={department}
                onChangeText={setDepartment}
                placeholder="Ingresa el departamento"
              />
            </View>
          </View>

          {/* Toggle para mostrar/ocultar campos de contraseña */}
          <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPasswordFields(!showPasswordFields)}>
            <Text style={styles.passwordToggleText}>
              {showPasswordFields ? "Cancelar cambio de contraseña" : "Cambiar contraseña"}
            </Text>
          </TouchableOpacity>

          {/* Campos de contraseña (condicionales) */}
          {showPasswordFields && (
            <>
              {/* Nueva contraseña */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nueva contraseña</Text>
                <View style={styles.inputWithIcon}>
                  <Feather name="lock" size={18}  color="#4C51BF"  style={styles.inputIcon}/>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Ingresa la nueva contraseña"
                    secureTextEntry
                  />
                </View>
              </View>

              {/* Confirmar contraseña */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirmar contraseña</Text>
                <View style={styles.inputWithIcon}>
                  <Feather name="lock" size={18}  color="#4C51BF"  style={styles.inputIcon}/>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirma la contraseña"
                    secureTextEntry
                  />
                </View>
              </View>
            </>
          )}

          <Text style={styles.noteText}>Todos los cambios serán notificados al empleado.</Text>
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
  employeeName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D3748",
    marginBottom: 4,
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
  passwordToggle: {
    marginBottom: 20,
    paddingVertical: 8,
  },
  passwordToggleText: {
    color: "#4C51BF",
    fontSize: 16,
    fontWeight: "500",
  },
  noteText: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#718096",
    marginTop: 20,
    marginBottom: 40,
  },
})

export default EmployerEditEmployeeScreen

