"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from "react-native"
import { Clock, MapPin, Camera } from "react-native-feather"
import * as Location from "expo-location"
import { useAuth } from "../../contexts/AuthContext"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { marcajesService } from "../../services/api"
import { useSimpleToast } from "../../contexts/SimpleToastContext"
import { useSession } from "../../contexts/SessionContext"
import AsyncStorage from "@react-native-async-storage/async-storage"

type CheckType = "in" | "out" | "lunch-out" | "lunch-in"

interface CheckRecord {
  id: string
  type: CheckType
  timestamp: Date
  location?: {
    latitude: number
    longitude: number
  }
  photoTaken: boolean
}

const EmployeeHomeScreen = () => {
  const { user } = useAuth()
  const { showToast } = useSimpleToast()
  const { resetInactivityTimer, showAfterActionModal } = useSession()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [lastCheck, setLastCheck] = useState<CheckRecord | null>(null)
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [processingCheckType, setProcessingCheckType] = useState<CheckType | null>(null)

  // Modificar el useEffect para cargar el último registro al iniciar
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Request location permissions
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      setLocationPermission(status === "granted")

      if (status !== "granted") {
        showToast("Se requiere permiso de ubicación para registrar asistencia", "error")
      }

      // Cargar el último registro guardado
      try {
        const savedCheck = await AsyncStorage.getItem("lastCheck")
        if (savedCheck) {
          const parsedCheck = JSON.parse(savedCheck)
          // Convertir la cadena de timestamp a objeto Date
          parsedCheck.timestamp = new Date(parsedCheck.timestamp)
          setLastCheck(parsedCheck)
          console.log("Último registro cargado:", parsedCheck)
        }
      } catch (error) {
        console.error("Error al cargar el último registro:", error)
      }
    })()

    // Reiniciar el temporizador de inactividad cuando se monta el componente
    resetInactivityTimer()

    return () => clearInterval(timer)
  }, [showToast, resetInactivityTimer])

  // Modificar la función handleCheck para mejorar el manejo de errores y la retroalimentación al usuario
  const handleCheck = async (type: CheckType) => {
    // Reiniciar el temporizador de inactividad al realizar una acción
    resetInactivityTimer()

    if (!user?.id) {
      showToast("Debes iniciar sesión para registrar asistencia", "error")
      return
    }

    if (!locationPermission) {
      showToast("Permiso de ubicación requerido para registrar asistencia", "error")

      // Intentar solicitar permisos nuevamente
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== "granted") {
          return
        }
        setLocationPermission(true)
      } catch (error) {
        console.error("Error al solicitar permisos de ubicación:", error)
        return
      }
    }

    setIsLoading(true)
    setProcessingCheckType(type)

    try {
      console.log(`Iniciando marcación de ${getCheckTypeText(type)} para usuario ID: ${user.id}`)
      showToast(`Registrando ${getCheckTypeText(type)}...`, "info")

      // Get current location
      let location
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        })
        console.log("Ubicación obtenida:", location.coords)
      } catch (locError) {
        console.error("Error al obtener ubicación:", locError)
        showToast("No se pudo obtener tu ubicación. Verifica los permisos.", "error")
        setIsLoading(false)
        setProcessingCheckType(null)
        return
      }

      // Mostrar alerta con los datos que se van a enviar (solo para depuración)
      if (Platform.OS === "web") {
        console.log("Datos a enviar:", {
          usuario_id: user.id,
          tipo: type,
          latitud: location.coords.latitude,
          longitud: location.coords.longitude,
        })
      } else {
        Alert.alert(
          "Datos a enviar",
          `usuario_id: ${user.id}
tipo: ${type}
latitud: ${location.coords.latitude}
longitud: ${location.coords.longitude}`,
        )
      }

      // Enviar marcación a la API PHP
      console.log("Enviando datos a la API:", {
        usuario_id: user.id,
        tipo: type,
        latitud: location.coords.latitude,
        longitud: location.coords.longitude,
      })

      const response = await marcajesService.crearMarcaje(
        user.id,
        type,
        location.coords.latitude,
        location.coords.longitude,
      )

      console.log("Respuesta completa de la API:", response)

      if (response.error) {
        console.error("Error al registrar asistencia (API):", response.error)
        showToast(response.message || "Error al registrar asistencia", "error")
        return
      }

      console.log("Marcación registrada exitosamente en la API")

      // Crear registro local con el ID devuelto por la API (o generar uno si no hay)
      const newCheck: CheckRecord = {
        id: response.id || Date.now().toString(),
        type,
        timestamp: new Date(),
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        photoTaken: false, // En una app real, implementarías la captura de fotos
      }

      setLastCheck(newCheck)
      showToast(`Has registrado tu ${getCheckTypeText(type)} correctamente`, "success")

      // Guardar el último registro en AsyncStorage para persistencia
      try {
        await AsyncStorage.setItem("lastCheck", JSON.stringify(newCheck))
        console.log("Último registro guardado en AsyncStorage")
      } catch (storageError) {
        console.error("Error al guardar en AsyncStorage:", storageError)
      }

      // Mostrar el modal después de la acción
      showAfterActionModal()
    } catch (error) {
      console.error("Error al registrar asistencia:", error)
      showToast("No se pudo registrar tu entrada/salida. Intenta nuevamente.", "error")
    } finally {
      setIsLoading(false)
      setProcessingCheckType(null)
    }
  }

  const getCheckTypeText = (type: CheckType): string => {
    switch (type) {
      case "in":
        return "entrada"
      case "out":
        return "salida"
      case "lunch-out":
        return "salida a almorzar"
      case "lunch-in":
        return "regreso de almuerzo"
    }
  }

  // Función para verificar si un botón está en proceso
  const isProcessing = (type: CheckType): boolean => {
    return isLoading && processingCheckType === type
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola, {user?.nombre}</Text>
        <Text style={styles.date}>{format(currentTime, "EEEE, d 'de' MMMM", { locale: es })}</Text>
        <Text style={styles.time}>{format(currentTime, "HH:mm:ss")}</Text>
      </View>

      <View style={styles.checkButtonsContainer}>
        <Text style={styles.sectionTitle}>Registrar:</Text>

        <TouchableOpacity
          style={[styles.checkButton, isProcessing("in") && styles.processingButton]}
          onPress={() => handleCheck("in")}
          disabled={isLoading}
        >
          <Clock stroke="#FFFFFF" width={24} height={24} />
          <Text style={styles.checkButtonText}>{isProcessing("in") ? "Procesando..." : "Entrada"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.checkButton, isProcessing("lunch-out") && styles.processingButton]}
          onPress={() => handleCheck("lunch-out")}
          disabled={isLoading}
        >
          <Clock stroke="#FFFFFF" width={24} height={24} />
          <Text style={styles.checkButtonText}>
            {isProcessing("lunch-out") ? "Procesando..." : "Salida a Almorzar"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.checkButton, isProcessing("lunch-in") && styles.processingButton]}
          onPress={() => handleCheck("lunch-in")}
          disabled={isLoading}
        >
          <Clock stroke="#FFFFFF" width={24} height={24} />
          <Text style={styles.checkButtonText}>
            {isProcessing("lunch-in") ? "Procesando..." : "Regreso de Almuerzo"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.checkButton, isProcessing("out") && styles.processingButton]}
          onPress={() => handleCheck("out")}
          disabled={isLoading}
        >
          <Clock stroke="#FFFFFF" width={24} height={24} />
          <Text style={styles.checkButtonText}>{isProcessing("out") ? "Procesando..." : "Salida"}</Text>
        </TouchableOpacity>
      </View>

      {lastCheck && (
        <View style={styles.lastCheckContainer}>
          <Text style={styles.lastCheckTitle}>Último registro:</Text>
          <Text style={styles.lastCheckInfo}>
            {getCheckTypeText(lastCheck.type)} - {format(lastCheck.timestamp, "HH:mm:ss")}
          </Text>

          <View style={styles.lastCheckDetails}>
            <View style={styles.detailItem}>
              <MapPin stroke="#4C51BF" width={16} height={16} />
              <Text style={styles.detailText}>
                Ubicación registrada: Lat {lastCheck.location?.latitude.toFixed(4)}, Lon{" "}
                {lastCheck.location?.longitude.toFixed(4)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Camera stroke="#4C51BF" width={16} height={16} />
              <Text style={styles.detailText}>{lastCheck.photoTaken ? "Foto tomada" : "Sin foto"}</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2D3748",
  },
  date: {
    fontSize: 16,
    color: "#4A5568",
    marginTop: 5,
  },
  time: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#4C51BF",
    marginTop: 10,
  },
  checkButtonsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D3748",
    marginBottom: 15,
  },
  checkButton: {
    backgroundColor: "#4C51BF",
    borderRadius: 10,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  processingButton: {
    backgroundColor: "#6B7280",
  },
  checkButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  lastCheckContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  lastCheckTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2D3748",
    marginBottom: 5,
  },
  lastCheckInfo: {
    fontSize: 18,
    color: "#4C51BF",
    marginBottom: 10,
  },
  lastCheckDetails: {
    marginTop: 10,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  detailText: {
    marginLeft: 10,
    color: "#4A5568",
  },
})

export default EmployeeHomeScreen

