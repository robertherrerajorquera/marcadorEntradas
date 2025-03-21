"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native"
import { TextInput } from "react-native-gesture-handler"
import { useAuth } from "../../contexts/AuthContext"
import { useNavigation } from "@react-navigation/native"
import { authService } from "../../services/api"
import { useSimpleToast } from "../../contexts/SimpleToastContext"

const LoginScreen = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigation = useNavigation()
  const { showToast } = useSimpleToast()

  const handleLogin = async () => {
    // Field validation
    if (!email || !password) {
      showToast("Por favor ingresa tu email y contraseña", "danger")
      return
    }

    setIsLoading(true)
    try {
      console.log("Iniciando login con:", { email })

      // First try to login with the PHP API
      const response = await authService.login(email, password)

      if (response.error || !response.user) {
        console.error("Error en el login (API):", response.error || "Usuario no encontrado")
        showToast(response.message || "Credenciales inválidas", "danger")
        setIsLoading(false)
        return
      }

      console.log("Login exitoso en la API, actualizando estado local")

      // If API login was successful, update local state
      // The navigation will be handled automatically by RootNavigator
      // when the auth state changes
      const success = await login(email, password)

      if (!success) {
        showToast("Error al iniciar sesión", "danger")
      }
    } catch (error) {
      console.error("Error en el login:", error)
      showToast("Error al iniciar sesión. Verifica tus credenciales.", "danger")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image source={{ uri: "https://via.placeholder.com/150" }} style={styles.logo} />
          <Text style={styles.title}>Marcador de Entradas</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa tu email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa tu contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.buttonText}>Iniciando sesión...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Register" as never)}
            style={styles.registerLink}
            disabled={isLoading}
          >
            <Text style={styles.registerText}>¿No tienes una cuenta? Regístrate</Text>
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
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  registerLink: {
    marginTop: 20,
    alignItems: "center",
  },
  registerText: {
    color: "#4C51BF",
    fontSize: 16,
  },
})

export default LoginScreen

