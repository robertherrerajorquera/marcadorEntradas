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
  Modal,
} from "react-native"
import { TextInput } from "react-native-gesture-handler"
import { useAuth } from "../../contexts/AuthContext"
import { useNavigation } from "@react-navigation/native"
import { useSimpleToast } from "../../contexts/SimpleToastContext"
import { Feather } from "@expo/vector-icons"
import { CameraView, Camera } from "expo-camera"

const LoginScreen = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [scanned, setScanned] = useState(false)
  const { login, loginWithRut } = useAuth()
  const navigation = useNavigation()
  const { showToast } = useSimpleToast()

  // Request camera permissions for QR scanning
  useEffect(() => {
    if (Platform.OS !== "web" && showQrScanner) {
      ;(async () => {
        const { status } = await Camera.requestCameraPermissionsAsync()
        setHasPermission(status === "granted")

        if (status !== "granted") {
          showToast("Se necesita permiso para acceder a la cámara", "error")
        }
      })()
    }
  }, [showQrScanner, showToast])

  const handleLogin = async () => {
    // Field validation
    if (!email || !password) {
      showToast("Por favor ingresa tu email y contraseña", "error")
      return
    }

    setIsLoading(true)
    try {
      console.log("Iniciando login con:", { email })

      // Use the login function from AuthContext
      const success = await login(email, password)

      if (!success) {
        showToast("Error al iniciar sesión. Verifica tus credenciales.", "error")
      }
    } catch (error) {
      console.error("Error en el login:", error)
      showToast("Error al iniciar sesión. Verifica tus credenciales.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle QR code scanning
  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return

    setScanned(true)
    setShowQrScanner(false)

    try {
      // Log the raw QR data
      console.log("QR Code scanned:", data)

      // Extract RUT/RUN from QR code
      let rut = null

      // Check if the data is a URL containing RUN parameter
      if (data.includes("RUN=")) {
        try {
          // Create a URL object to parse the query parameters
          const urlParams = new URLSearchParams(data.split("?")[1])

          // Get the RUN parameter
          rut = urlParams.get("RUN")
        } catch (e) {
          console.error("Error al procesar la URL del QR:", e)
        }
      } else {
        // Try to parse as JSON as fallback
        try {
          const qrObject = JSON.parse(data)
          console.log("QR parsed as JSON:", qrObject)

          // Check if it has the expected format with a data URL
          if (qrObject.data && qrObject.data.includes("RUN=")) {
            // Extract the URL from the data field
            const url = qrObject.data
            console.log("URL from QR:", url)

            // Create a URL object to parse the query parameters
            const urlParams = new URLSearchParams(url.split("?")[1])

            // Get the RUN parameter
            rut = urlParams.get("RUN")
          }
        } catch (e) {
          console.error("Error al parsear el QR como JSON:", e)
        }
      }

      if (rut) {
        showToast(`Iniciando sesión con QR`, "info")
        setIsLoading(true)

        // Call the loginWithRut function from AuthContext
        loginWithRut(rut)
          .then((success:any) => {
            if (!success) {
              showToast("Usuario no encontrado con el RUT escaneado", "error")
            } else {
              showToast(`Inicio de sesión exitoso con RUT: ${rut}`, "success")
            }
          })
          .catch((error:any) => {
            console.error("Error al procesar el RUT:", error)
            showToast("Error al procesar el RUT", "error")
          })
          .finally(() => {
            setIsLoading(false)
          })
      } else {
        showToast("No se pudo extraer el RUT del código QR", "error")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error al procesar el código QR:", error)
      showToast("Error al procesar el código QR", "error")
      setIsLoading(false)
    }
  }

  // Render QR scanner modal
  const renderQrScanner = () => {
    if (Platform.OS === "web") {
      return (
        <Modal
          visible={showQrScanner}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowQrScanner(false)}
        >
          <View style={styles.qrModalContainer}>
            <View style={styles.qrModalContent}>
              <Text style={styles.qrModalTitle}>Escanear Código QR</Text>
              <Text style={styles.qrModalText}>
                La funcionalidad de escaneo de QR no está disponible en la web. Por favor, utiliza la aplicación móvil
                para escanear códigos QR.
              </Text>
              <TouchableOpacity style={styles.qrModalButton} onPress={() => setShowQrScanner(false)}>
                <Text style={styles.qrModalButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )
    }

    return (
      <Modal
        visible={showQrScanner}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowQrScanner(false)
          setScanned(false)
        }}
      >
        <View style={styles.qrModalContainer}>
          <View style={styles.qrScannerContainer}>
            {hasPermission === null ? (
              <Text style={styles.qrText}>Solicitando permiso de cámara...</Text>
            ) : hasPermission === false ? (
              <Text style={styles.qrText}>No hay acceso a la cámara</Text>
            ) : (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr"],
                }}
              />
            )}
            <View style={styles.qrOverlay}>
              <View style={styles.qrFrame} />
            </View>
            <TouchableOpacity
              style={styles.qrCloseButton}
              onPress={() => {
                setShowQrScanner(false)
                setScanned(false)
              }}
            >
              <Text style={styles.qrCloseButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )
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
            style={[styles.qrButton, isLoading && styles.buttonDisabled]}
            onPress={() => {
              setShowQrScanner(true)
              setScanned(false)
            }}
            disabled={isLoading}
          >
             <Feather name="mail" size={20} color="#ffffff" style={styles.inputIcon} />
            <Text style={styles.buttonText}>Iniciar Sesión con QR</Text>
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

      {/* QR Scanner Modal */}
      {renderQrScanner()}
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
  qrButton: {
    backgroundColor: "#805AD5",
    borderRadius: 5,
    padding: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },
  inputIcon: {
    marginRight: 10,
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
    gap: 10,
  },
  registerLink: {
    marginTop: 20,
    alignItems: "center",
  },
  registerText: {
    color: "#4C51BF",
    fontSize: 16,
  },
  // QR Scanner Modal Styles
  qrModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  qrModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#2D3748",
  },
  qrModalText: {
    fontSize: 16,
    color: "#4A5568",
    textAlign: "center",
    marginBottom: 20,
  },
  qrModalButton: {
    backgroundColor: "#4C51BF",
    borderRadius: 5,
    padding: 10,
    width: "100%",
    alignItems: "center",
  },
  qrModalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  qrScannerContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "relative",
  },
  qrText: {
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 20,
  },
  qrOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  qrFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "transparent",
  },
  qrCloseButton: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    backgroundColor: "#E53E3E",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 5,
  },
  qrCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default LoginScreen

