"use client"

import { useState, useEffect } from "react"
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
import { RadioButton } from "react-native-paper"
import { Picker } from "@react-native-picker/picker"
import type { UserRole } from "../../types"
import { authService, empresasService } from "../../services/api"
import { useSimpleToast } from "../../contexts/SimpleToastContext"

// Interface for company data
interface Company {
  id: number
  nombre: string
}

const RegisterScreen = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [rut, setRut] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<UserRole>("employee") // Por defecto, empleado
  const [isLoading, setIsLoading] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null)
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const { register } = useAuth()
  const navigation = useNavigation()
  const { showToast } = useSimpleToast()
  const { API_URL } = useAuth()

  // Fetch companies from the database when the component mounts
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoadingCompanies(true)
      try {
        console.log("Obteniendo lista de empresas desde la API")
        const response:any = await empresasService.obtenerEmpresas()

        if (response.records && Array.isArray(response.records)) {
          console.log("Empresas obtenidas:", response.records)
          setCompanies(response.records)
          // Set the first company as default if available
          if (response.records.length > 0) {
            setSelectedCompany(response.records[0].id)
          }
        } else {
          console.warn("No se encontraron empresas en la base de datos o formato incorrecto:", response)
          showToast("No se encontraron empresas registradas", "error")

          // Use mock data only as fallback
          const mockCompanies = [
            { id: 1, nombre: "Empresa Demo 1" },
            { id: 2, nombre: "Empresa Demo 2" },
            { id: 3, nombre: "Empresa Demo 3" },
          ]
          setCompanies(mockCompanies)
          setSelectedCompany(mockCompanies[0].id)
        }
      } catch (error) {
        console.error("Error al obtener empresas:", error)
        showToast("No se pudieron cargar las empresas", "error")

        // Use mock data on error
        const mockCompanies = [
          { id: 1, nombre: "Empresa Demo 1" },
          { id: 2, nombre: "Empresa Demo 2" },
          { id: 3, nombre: "Empresa Demo 3" },
        ]
        setCompanies(mockCompanies)
        setSelectedCompany(mockCompanies[0].id)
      } finally {
        setLoadingCompanies(false)
      }
    }

    fetchCompanies()
  }, [API_URL, showToast])

  // Format RUT as user types (XX.XXX.XXX-X)
  const handleRutChange = (text: string) => {
    // Remove all non-numeric characters and the verification digit
    let digits = text.replace(/\D/g, "")

    // Keep only up to 9 digits (8 digits + verification digit)
    if (digits.length > 9) {
      digits = digits.substring(0, 9)
    }

    // Format the RUT
    if (digits.length > 0) {
      let formattedRut = ""

      // Add the verification digit (last digit)
      const verificationDigit = digits.charAt(digits.length - 1)
      const mainDigits = digits.substring(0, digits.length - 1)

      // Format the main digits with dots
      let i = mainDigits.length
      while (i > 0) {
        const start = Math.max(0, i - 3)
        formattedRut = (i > 3 ? "." : "") + mainDigits.substring(start, i) + formattedRut
        i = start
      }

      // Add the verification digit with a hyphen
      if (mainDigits.length > 0) {
        formattedRut = formattedRut + "-" + verificationDigit
      } else {
        formattedRut = verificationDigit
      }

      setRut(formattedRut)
    } else {
      setRut("")
    }
  }

  // Validate Chilean RUT
  const validateRut = (rutValue: string): boolean => {
    if (!rutValue) return false

    // Remove dots and hyphens
    const cleanRut = rutValue.replace(/[.-]/g, "")

    // Check if it has at least 2 characters (1 digit + verification digit)
    if (cleanRut.length < 2) return false

    // Extract the main digits and verification digit
    const verificationDigit = cleanRut.charAt(cleanRut.length - 1).toUpperCase()
    const mainDigits = cleanRut.substring(0, cleanRut.length - 1)

    // Check if the main part contains only digits
    if (!/^\d+$/.test(mainDigits)) return false

    // Calculate the verification digit
    let sum = 0
    let multiplier = 2

    // Iterate from right to left
    for (let i = mainDigits.length - 1; i >= 0; i--) {
      sum += Number.parseInt(mainDigits.charAt(i)) * multiplier
      multiplier = multiplier === 7 ? 2 : multiplier + 1
    }

    const expectedVerificationDigit = 11 - (sum % 11)
    let calculatedVerificationDigit

    if (expectedVerificationDigit === 11) {
      calculatedVerificationDigit = "0"
    } else if (expectedVerificationDigit === 10) {
      calculatedVerificationDigit = "K"
    } else {
      calculatedVerificationDigit = expectedVerificationDigit.toString()
    }

    return calculatedVerificationDigit === verificationDigit
  }

  const handleRegister = async () => {
    // Validación de campos
    if (!name || !email || !password || !confirmPassword || !rut) {
      showToast("Por favor completa todos los campos", "error")
      return
    }

    if (password !== confirmPassword) {
      showToast("Las contraseñas no coinciden", "error")
      return
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      showToast("Por favor ingresa un email válido", "error")
      return
    }

    // Validación de RUT chileno
    if (!validateRut(rut)) {
      showToast("El RUT ingresado no es válido", "error")
      return
    }

    // Validar que se haya seleccionado una empresa si el rol es empleado
    if (role === "employee" && !selectedCompany) {
      showToast("Por favor selecciona una empresa", "error")
      return
    }

    setIsLoading(true)
    try {
      console.log("Iniciando registro de usuario:", {
        name,
        email,
        role,
        rut,
        empresa_id: role === "employee" ? selectedCompany : undefined,
      })
      showToast("Procesando registro...", "info")

      // Primero intentamos registrar en la API PHP
      const response = await authService.register(
        name, // nombre
        email, // email
        password, // password
        role, // role (ahora es "employer" o "employee")
        role === "employee" ? selectedCompany?.toString() : undefined, // empresa_id (solo para empleados)
        "Sin asignar", // position
        "Sin asignar", // department
        rut, // rut (nuevo campo)
      )

      if (response.error) {
        console.error("Error en el registro (API):", response.error)
        showToast(response.message || "Error en el registro", "error")
        return
      }

      console.log("Registro exitoso en la API, actualizando estado local")

      // Si el registro en la API fue exitoso, actualizamos el estado local
      await register(name, email, password, role)
      showToast("Registro exitoso. ¡Bienvenido!", "success")
    } catch (error) {
      console.error("Error en el registro:", error)
      showToast("No se pudo completar el registro. Intenta nuevamente.", "error")
    } finally {
      setIsLoading(false)
    }
  }

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

          <Text style={styles.label}>RUT</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 12.345.678-9"
            value={rut}
            onChangeText={handleRutChange}
            keyboardType="numeric"
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
                value="employee"
                status={role === "employee" ? "checked" : "unchecked"}
                onPress={() => setRole("employee")}
                color="#4C51BF"
              />
              <Text style={styles.radioLabel}>Empleado</Text>
            </View>
            <View style={styles.radioOption}>
              <RadioButton
                value="employer"
                status={role === "employer" ? "checked" : "unchecked"}
                onPress={() => setRole("employer")}
                color="#4C51BF"
              />
              <Text style={styles.radioLabel}>Empleador</Text>
            </View>
          </View>

          {/* Company selector - only show for employees */}
          {role === "employee" && (
            <>
              <Text style={styles.label}>Empresa</Text>
              {loadingCompanies ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#4C51BF" />
                  <Text style={styles.loadingText}>Cargando empresas...</Text>
                </View>
              ) : (
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedCompany}
                    onValueChange={(itemValue) => setSelectedCompany(itemValue)}
                    style={styles.picker}
                  >
                    {companies.map((company) => (
                      <Picker.Item key={company.id} label={company.nombre} value={company.id} />
                    ))}
                  </Picker>
                </View>
              )}
            </>
          )}

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
  pickerContainer: {
    backgroundColor: "#EDF2F7",
    borderRadius: 5,
    marginBottom: 15,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
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
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDF2F7",
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
  },
  loadingText: {
    marginLeft: 10,
    color: "#4A5568",
    fontSize: 16,
  },
})

export default RegisterScreen

