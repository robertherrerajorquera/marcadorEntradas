"use client"

import { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import { TextInput } from "react-native-gesture-handler"
import { useAuth } from "../../contexts/AuthContext"
import { useNavigation } from "@react-navigation/native"
import { RadioButton } from "react-native-paper"
import type { UserRole } from "../../types"
import { authService } from "../../services/api"
import { useSimpleToast } from "../../contexts/SimpleToastContext"

const RegisterScreen = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status_employee, setstatus_employee] = useState("");
  // const [empresa, setEmpresa] = useState("");
  const [empresaId, setEmpresaId] = useState(1);
  const [posicion, setPosicion] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("employer") // Por defecto, empleado (1)
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()
  const navigation = useNavigation()
  const { showToast } = useSimpleToast()

  const handleRegister = async () => {
    // Validación de campos
    if (!name || !email || !password || !confirmPassword) {
      showToast("Por favor completa todos los campos", "danger")
      return
    }

    if (password !== confirmPassword) {
      showToast("Las contraseñas no coinciden", "danger")
      return
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      showToast("Por favor ingresa un email válido", "danger")
      return
    }

    setIsLoading(true)
    try {
      console.log("Iniciando registro de usuario:", { name, email, role })
      showToast("Procesando registro...", "info")

      // Primero intentamos registrar en la API PHP
      const response = await authService.register(
        name, // nombre
        email, // email
        password, // password
        role, // role (0=empleador, 1=empleado)
        empresaId, // empresa_id (solo para empleados)
        posicion, // position
        "Sin asignar", // department,
        status_employee
      )

      if (response.error) {
        console.error("Error en el registro (API):", response.error)
        showToast(response.message || "Error en el registro", "danger")
        return
      }

      console.log("Registro exitoso en la API, actualizando estado local")

      // Si el registro en la API fue exitoso, actualizamos el estado local
      await register(name, email, password, role, empresaId, status_employee)
      showToast("Registro exitoso. ¡Bienvenido!", "success")
    } catch (error) {
      console.error("Error en el registro:", error)
      showToast("No se pudo completar el registro. Intenta nuevamente.", "danger")
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    console.log("data del rol cambio, ahora es", role)
  }, [role])
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image source={{ uri: "https://via.placeholder.com/150" }} style={styles.logo} />
          <Text style={styles.title}>Crear Cuenta</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Nombre Completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa tu nombre"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa tu email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* <Text style={styles.label}>Empresa</Text>
          <TextInput
            style={styles.input}
            placeholder="Empresa"
            value={empresa}
            onChangeText={setEmpresa}
            autoCapitalize="words"
          /> */}

          
          <Text style={styles.label}>Posicion</Text>
          <TextInput
            style={styles.input}
            placeholder="Posicion"
            value={posicion}
            onChangeText={setPosicion}
            autoCapitalize="words"
          />


          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa tu contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Confirmar Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirma tu contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Tipo de Usuario</Text>
          <View style={styles.radioContainer}>
            <View style={styles.radioOption}>
              <RadioButton
                value="1"
                status={role === "employer" ? "checked" : "unchecked"}
                onPress={() => setRole("employer")}
                color="#4C51BF"
              />
              <Text style={styles.radioLabel}>Empleador</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton
                value="0"
                status={role === "employee" ? "checked" : "unchecked"}
                onPress={() => setRole("employee")}
                color="#4C51BF"
              />
              <Text style={styles.radioLabel}>Empleado</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? "Registrando..." : "Registrarse"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Login" as never)} style={styles.loginLink}>
            <Text style={styles.loginText}>¿Ya tienes una cuenta? Inicia Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    color: "#4C51BF",
  },
  formContainer: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: "#4A5568",
  },
  input: {
    backgroundColor: "#EDF2F7",
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  radioContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  radioLabel: {
    fontSize: 16,
    color: "#4A5568",
  },
  button: {
    backgroundColor: "#4C51BF",
    borderRadius: 5,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#A0AEC0",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  loginLink: {
    marginTop: 20,
    alignItems: "center",
  },
  loginText: {
    color: "#4C51BF",
    fontSize: 16,
  },
})

export default RegisterScreen

