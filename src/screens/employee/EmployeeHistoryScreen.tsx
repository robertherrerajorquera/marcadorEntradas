"use client"

import { useEffect, useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native"
import { format, subDays, startOfWeek, endOfWeek } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, ChevronLeft, ChevronRight } from "react-native-feather"
import { marcajesService } from "../../services/api"
import { useAuth } from "../../contexts/AuthContext"
import { useSimpleToast } from "@/contexts/SimpleToastContext"

interface MarcajeRecord {
  id: string
  type: string
  timestamp: Date
  location?: {
    latitude: number
    longitude: number
  }
}



// Mock data for demonstration
const generateMockData = (startDate: Date) => {
  const [isLoading, setIsLoading] = useState(false)
  const records:any = []

  const types = ["in", "lunch-out", "lunch-in", "out"]

  for (let i = 0; i < 14; i++) {
    const day = subDays(startDate, i)

    // Skip weekends
    if (day.getDay() === 0 || day.getDay() === 6) continue

    // Create entry for each day
    types.forEach((type, index) => {
      // Base times for each check type
      let hour = 8;// base en vez de 0
      switch (type) {
        case "in":
          hour = 8
          break
        case "lunch-out":
          hour = 13
          break
        case "lunch-in":
          hour = 14
          break
        case "out":
          hour = 18
          break
      }

      // Add some randomness to minutes
      const minutes = Math.floor(Math.random() * 15)

      records.push({
        id: `${day.toISOString()}-${type}`,
        type,
        timestamp: new Date(day.setHours(hour, minutes)),
        location: {
          latitude: -33.4489 + Math.random() * 0.01,
          longitude: -70.6693 + Math.random() * 0.01,
        },
      })
    })
  }

  return records.sort((a:any, b:any) => b.timestamp.getTime() - a.timestamp.getTime())
}

const EmployeeHistoryScreen = () => {
  const { user } = useAuth()
  const { showToast } = useSimpleToast()
  const [currentDate, setCurrentDate] = useState(new Date())
 // const [records, setRecords] = useState(generateMockData(new Date()))
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week")
  
  const [records, setRecords] = useState<MarcajeRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)

  
useEffect(() => {
  if (!user?.id) return

  const loadMarcaje = async () => {
    setIsLoading(true)
    try {
      console.log("Cargando historial de marcajes para el usuario:", user.id)
      showToast("Cargando historial...", "info")

      // Calcular fechas para la consulta
      const today = new Date()
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

      const formattedStartDate = format(oneMonthAgo, "yyyy-MM-dd")
      const formattedEndDate = format(today, "yyyy-MM-dd")

      // Llamar a la API PHP
      const response = await marcajesService.obtenerHistorial(user.id, formattedStartDate, formattedEndDate)

      if (response.error) {
        console.error("Error al cargar historial (API):", response.error)
        showToast(response.message || "Error al cargar historial", "error")
        return
      }

      console.log("Historial cargado exitosamente de la API")

      // En una app real, procesarías los datos de la API
      // Por ahora, usamos datos mock
      setRecords(generateMockData(new Date()))
      showToast("Historial cargado correctamente", "success")
    } catch (error) {
      console.error("Error al cargar historial:", error)
      showToast("No se pudo cargar el historial de marcajes", "error")
    } finally {
      setIsLoading(false)
    }
  }

  loadMarcaje()
}, [user, showToast])

  const getCheckTypeText = (type: string): string => {
    switch (type) {
      case "in":
        return "Entrada"
      case "out":
        return "Salida"
      case "lunch-out":
        return "Salida a almorzar"
      case "lunch-in":
        return "Regreso de almuerzo"
      default:
        return type
    }
  }

  const navigatePrevious = () => {
    switch (viewMode) {
      case "day":
        setCurrentDate(subDays(currentDate, 1))
        break
      case "week":
        setCurrentDate(subDays(currentDate, 7))
        break
      case "month":
        const prevMonth = new Date(currentDate)
        prevMonth.setMonth(prevMonth.getMonth() - 1)
        setCurrentDate(prevMonth)
        break
    }
  }

  const navigateNext = () => {
    switch (viewMode) {
      case "day":
        setCurrentDate(subDays(currentDate, -1))
        break
      case "week":
        setCurrentDate(subDays(currentDate, -7))
        break
      case "month":
        const nextMonth = new Date(currentDate)
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        setCurrentDate(nextMonth)
        break
    }
  }

  const filteredRecords = () => {
    switch (viewMode) {
      case "day":
        return records.filter(
          (record) =>
            record.timestamp.getDate() === currentDate.getDate() &&
            record.timestamp.getMonth() === currentDate.getMonth() &&
            record.timestamp.getFullYear() === currentDate.getFullYear(),
        )
      case "week":
        const start = startOfWeek(currentDate, { weekStartsOn: 1 })
        const end = endOfWeek(currentDate, { weekStartsOn: 1 })
        return records.filter((record) => record.timestamp >= start && record.timestamp <= end)
      case "month":
        return records.filter(
          (record) =>
            record.timestamp.getMonth() === currentDate.getMonth() &&
            record.timestamp.getFullYear() === currentDate.getFullYear(),
        )
      default:
        return records
    }
  }

  const renderDateHeader = () => {
    switch (viewMode) {
      case "day":
        return format(currentDate, "EEEE, d 'de' MMMM", { locale: es })
      case "week":
        const start = startOfWeek(currentDate, { weekStartsOn: 1 })
        const end = endOfWeek(currentDate, { weekStartsOn: 1 })
        return `${format(start, "d", { locale: es })} - ${format(end, "d 'de' MMMM", { locale: es })}`
      case "month":
        return format(currentDate, "MMMM yyyy", { locale: es })
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial de Marca</Text>

        <View style={styles.viewModeContainer}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === "day" && styles.activeViewMode]}
            onPress={() => setViewMode("day")}
          >
            <Text style={[styles.viewModeText, viewMode === "day" && styles.activeViewModeText]}>Día</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === "week" && styles.activeViewMode]}
            onPress={() => setViewMode("week")}
          >
            <Text style={[styles.viewModeText, viewMode === "week" && styles.activeViewModeText]}>Semana</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === "month" && styles.activeViewMode]}
            onPress={() => setViewMode("month")}
          >
            <Text style={[styles.viewModeText, viewMode === "month" && styles.activeViewModeText]}>Mes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateNavigator}>
          <TouchableOpacity onPress={navigatePrevious}>
            <ChevronLeft stroke="#4C51BF" width={24} height={24} />
          </TouchableOpacity>

          <View style={styles.dateContainer}>
            <Calendar stroke="#4C51BF" width={16} height={16} />
            <Text style={styles.dateText}>{renderDateHeader()}</Text>
          </View>

          <TouchableOpacity onPress={navigateNext}>
            <ChevronRight stroke="#4C51BF" width={24} height={24} />
          </TouchableOpacity>
        </View>
      </View>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4C51BF" />
          <Text style={styles.loadingText}>Cargando registros...</Text>
        </View>
      ) : (
      <FlatList
        data={filteredRecords()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.recordItem}>
            <View style={styles.recordHeader}>
              <Text style={styles.recordType}>{getCheckTypeText(item.type)}</Text>
              <Text style={styles.recordDate}>{format(item.timestamp, "EEEE, d 'de' MMMM", { locale: es })}</Text>
            </View>

            <View style={styles.recordDetails}>
              <Text style={styles.recordTime}>{format(item.timestamp, "HH:mm")}</Text>
              <Text style={styles.recordLocation}>
                Lat: {item.location?.latitude.toFixed(4) || "N/A"}, Lon:{" "}
                {item.location?.longitude.toFixed(4) || "N/A"}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay registros para este período</Text>
          </View>
        }
      />
       )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  header: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D3748",
    marginBottom: 15,
  },
  viewModeContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  viewModeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
  },
  activeViewMode: {
    backgroundColor: "#EBF4FF",
  },
  viewModeText: {
    color: "#4A5568",
    fontWeight: "500",
  },
  activeViewModeText: {
    color: "#4C51BF",
    fontWeight: "bold",
  },
  dateNavigator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#4A5568",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#4A5568",
    fontSize: 16,
  },
  recordItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 20,
    marginTop: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  recordType: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4C51BF",
  },
  recordDate: {
    fontSize: 14,
    color: "#718096",
  },
  recordDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recordTime: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D3748",
  },
  recordLocation: {
    fontSize: 12,
    color: "#718096",
  },
  emptyContainer: {
    padding: 30,
    alignItems: "center",
  },
  emptyText: {
    color: "#718096",
    fontSize: 16,
  },
})

export default EmployeeHistoryScreen

