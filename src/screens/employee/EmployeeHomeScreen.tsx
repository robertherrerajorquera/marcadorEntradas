"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native"
import { Clock, MapPin, Camera } from "react-native-feather"
import * as Location from "expo-location"
import { useAuth } from "../../contexts/AuthContext"
import { format } from "date-fns"
import { es } from "date-fns/locale"

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
  const [currentTime, setCurrentTime] = useState(new Date())
  const [lastCheck, setLastCheck] = useState<CheckRecord | null>(null)
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // Request location permissions
    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      setLocationPermission(status === "granted")
    })()

    return () => clearInterval(timer)
  }, [])

  const handleCheck = async (type: CheckType) => {
    if (!locationPermission) {
      Alert.alert(
        "Permiso de ubicación requerido",
        "Necesitamos acceder a tu ubicación para registrar tu entrada/salida",
      )
      return
    }

    try {
      // Get current location
      const location = await Location.getCurrentPositionAsync({})

      // In a real app, you would send this data to your backend
      const newCheck: CheckRecord = {
        id: Date.now().toString(),
        type,
        timestamp: new Date(),
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        photoTaken: false, // In a real app, you would implement photo capture
      }

      setLastCheck(newCheck)

      Alert.alert("Registro exitoso", `Has registrado tu ${getCheckTypeText(type)} correctamente.`)
    } catch (error) {
      Alert.alert("Error", "No se pudo registrar tu entrada/salida")
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola, {user?.name}</Text>
        <Text style={styles.date}>{format(currentTime, "EEEE, d 'de' MMMM", { locale: es })}</Text>
        <Text style={styles.time}>{format(currentTime, "HH:mm:ss")}</Text>
      </View>

      <View style={styles.checkButtonsContainer}>
        <Text style={styles.sectionTitle}>Registrar:</Text>

        <TouchableOpacity style={styles.checkButton} onPress={() => handleCheck("in")}>
          <Clock stroke="#FFFFFF" width={24} height={24} />
          <Text style={styles.checkButtonText}>Entrada</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.checkButton} onPress={() => handleCheck("lunch-out")}>
          <Clock stroke="#FFFFFF" width={24} height={24} />
          <Text style={styles.checkButtonText}>Salida a Almorzar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.checkButton} onPress={() => handleCheck("lunch-in")}>
          <Clock stroke="#FFFFFF" width={24} height={24} />
          <Text style={styles.checkButtonText}>Regreso de Almuerzo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.checkButton} onPress={() => handleCheck("out")}>
          <Clock stroke="#FFFFFF" width={24} height={24} />
          <Text style={styles.checkButtonText}>Salida</Text>
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
              <Text style={styles.detailText}>Ubicación registrada</Text>
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

