"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from "react-native"
import { ArrowLeft, MapPin, Clock, User, Phone, Mail, Briefcase, Download } from "react-native-feather"
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import { format } from "date-fns"
import { marcajesService } from "../../services/api"
import { useSimpleToast } from "../../contexts/SimpleToastContext"
import { useAuth } from "../../contexts/AuthContext"
import type { EmployeeStackParamList } from "../../navigation/EmployerTabs"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

// Define the navigation prop type
type EmployeeDetailScreenNavigationProp = NativeStackNavigationProp<EmployeeStackParamList, "EmployeeDetail">

// Define the route prop type
type EmployeeDetailScreenRouteProp = RouteProp<EmployeeStackParamList, "EmployeeDetail">

// Type for attendance records
interface Marcacion {
  id: string
  tipo: string
  timestamp: string
  latitud: number
  longitud: number
  foto_url?: string
}

const EmployeeDetailScreen = () => {
  const navigation = useNavigation<EmployeeDetailScreenNavigationProp>()
  const route = useRoute<EmployeeDetailScreenRouteProp>()
  const { employee } = route.params
  const { showToast } = useSimpleToast()
  const { API_URL } = useAuth()

  const [isLoading, setIsLoading] = useState(true)
  const [marcaciones, setMarcaciones] = useState<Marcacion[]>([])
  const [lastLocation, setLastLocation] = useState<{ latitud: number; longitud: number } | null>(null)

  // Load employee attendance records
  useEffect(() => {
    const loadMarcaciones = async () => {
      setIsLoading(true)
      try {
        // Get current date in YYYY-MM-DD format
        const today = new Date()
        const formattedDate = format(today, "yyyy-MM-dd")

        // Call API to get today's attendance records
        const response:any = await marcajesService.obtenerHistorial(employee.id, formattedDate, formattedDate)

        if (response.error) {
          console.error("Error loading attendance records:", response.error)
          showToast("No se pudieron cargar las marcaciones", "error")

          // Use mock data on error
          const mockMarcaciones = generateMockMarcaciones(employee.id)
          setMarcaciones(mockMarcaciones)

          if (mockMarcaciones.length > 0) {
            setLastLocation({
              latitud: mockMarcaciones[0].latitud,
              longitud: mockMarcaciones[0].longitud,
            })
          }
          return
        }

        // Process records if available
        if (response.records && Array.isArray(response.records)) {
          // Sort by timestamp (most recent first)
          const sortedMarcaciones = response.records.sort(
            (a:any, b:any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )

          setMarcaciones(sortedMarcaciones)

          // Set last location if available
          if (sortedMarcaciones.length > 0 && sortedMarcaciones[0].latitud && sortedMarcaciones[0].longitud) {
            setLastLocation({
              latitud: Number.parseFloat(sortedMarcaciones[0].latitud),
              longitud: Number.parseFloat(sortedMarcaciones[0].longitud),
            })
          }
        } else {
          // Use mock data if no records
          const mockMarcaciones = generateMockMarcaciones(employee.id)
          setMarcaciones(mockMarcaciones)

          if (mockMarcaciones.length > 0) {
            setLastLocation({
              latitud: mockMarcaciones[0].latitud,
              longitud: mockMarcaciones[0].longitud,
            })
          }
        }
      } catch (error) {
        console.error("Error loading attendance records:", error)
        showToast("Error al cargar datos del empleado", "error")

        // Use mock data on error
        const mockMarcaciones = generateMockMarcaciones(employee.id)
        setMarcaciones(mockMarcaciones)

        if (mockMarcaciones.length > 0) {
          setLastLocation({
            latitud: mockMarcaciones[0].latitud,
            longitud: mockMarcaciones[0].longitud,
          })
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadMarcaciones()
  }, [employee.id, showToast])

  // Generate mock data for demonstration
  const generateMockMarcaciones = (employeeId: string): Marcacion[] => {
    const today = new Date()

    // Coordinates for Santiago, Chile (as example)
    const baseLatitud = -33.4489
    const baseLongitud = -70.6693

    return [
      {
        id: "1",
        tipo: "in",
        timestamp: format(new Date(today.setHours(8, 5)), "yyyy-MM-dd'T'HH:mm:ss"),
        latitud: baseLatitud + Math.random() * 0.01,
        longitud: baseLongitud + Math.random() * 0.01,
      },
      {
        id: "2",
        tipo: "lunch-out",
        timestamp: format(new Date(today.setHours(13, 2)), "yyyy-MM-dd'T'HH:mm:ss"),
        latitud: baseLatitud + Math.random() * 0.01,
        longitud: baseLongitud + Math.random() * 0.01,
      },
      {
        id: "3",
        tipo: "lunch-in",
        timestamp: format(new Date(today.setHours(14, 10)), "yyyy-MM-dd'T'HH:mm:ss"),
        latitud: baseLatitud + Math.random() * 0.01,
        longitud: baseLongitud + Math.random() * 0.01,
      },
      {
        id: "4",
        tipo: "out",
        timestamp: format(new Date(today.setHours(18, 3)), "yyyy-MM-dd'T'HH:mm:ss"),
        latitud: baseLatitud + Math.random() * 0.01,
        longitud: baseLongitud + Math.random() * 0.01,
      },
    ]
  }

  // Get current employee status based on attendance records
  const getCurrentStatus = (): string => {
    if (marcaciones.length === 0) return "Sin registros hoy"

    // Sort records by timestamp (most recent first)
    const sortedMarcaciones = [...marcaciones].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )

    // Last record determines current status
    const lastMarcacion = sortedMarcaciones[0]

    switch (lastMarcacion.tipo) {
      case "in":
        return "Presente (ingresó)"
      case "out":
        return "Ausente (terminó su jornada)"
      case "lunch-out":
        return "En colación"
      case "lunch-in":
        return "Presente (regresó de colación)"
      default:
        return "Estado desconocido"
    }
  }

  // Get color based on status
  const getStatusColor = (status: string): string => {
    if (status.includes("Presente")) return "#48BB78"
    if (status.includes("Ausente")) return "#F56565"
    if (status.includes("colación")) return "#ED8936"
    return "#A0AEC0"
  }

  // Format attendance record type
  const formatTipoMarcacion = (tipo: string): string => {
    switch (tipo) {
      case "in":
        return "Entrada"
      case "out":
        return "Salida"
      case "lunch-out":
        return "Salida a colación"
      case "lunch-in":
        return "Regreso de colación"
      default:
        return tipo
    }
  }

  // Open location in map
  const openLocationInMap = (latitud: number, longitud: number) => {
    if (Platform.OS === "web") {
      window.open(`https://www.google.com/maps?q=${latitud},${longitud}`, "_blank")
      showToast("Abriendo ubicación en Google Maps", "info")
    } else {
      const Linking = require("react-native").Linking
      const scheme = Platform.OS === "ios" ? "maps:" : "geo:"
      const url = Platform.OS === "ios" ? `${scheme}?ll=${latitud},${longitud}` : `${scheme}${latitud},${longitud}`

      Linking.openURL(url).catch((err: any) => {
        console.error("Error opening map:", err)
        showToast("No se pudo abrir el mapa", "error")
      })
    }
  }

  // Export employee history
  const exportEmployeeHistory = async () => {
    try {
      showToast("Preparando exportación...", "info")

      // Get date range for export (last month)
      const today = new Date()
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

      const formattedStartDate = format(oneMonthAgo, "yyyy-MM-dd")
      const formattedEndDate = format(today, "yyyy-MM-dd")

      // Build URL for Excel export
      const excelUrl = `${API_URL}/export/excel.php?usuario_id=${employee.id}&fecha_inicio=${formattedStartDate}&fecha_fin=${formattedEndDate}`

      if (Platform.OS === "web") {
        try {
          const response = await fetch(excelUrl)

          if (!response.ok) {
            const errorText = await response.text()
            showToast(`Error: ${errorText || "No se pudo descargar el archivo"}`, "error")
            return
          }

          const blob = await response.blob()
          const downloadUrl = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = downloadUrl
          a.download = `historial_${employee.name}.xlsx`
          document.body.appendChild(a)
          a.click()
          a.remove()
          window.URL.revokeObjectURL(downloadUrl)

          showToast("Archivo descargado correctamente", "success")
        } catch (error) {
          console.error("Error downloading file:", error)
          showToast("Error al descargar el archivo", "error")
        }
      } else {
        // Native implementation using Linking
        const Linking = require("react-native").Linking
        const canOpen = await Linking.canOpenURL(excelUrl)

        if (canOpen) {
          await Linking.openURL(excelUrl)
          showToast("Archivo abierto correctamente", "success")
        } else {
          showToast("No se puede abrir el enlace para descargar el archivo", "error")
        }
      }
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      showToast("No se pudo generar el archivo Excel", "error")
    }
  }

  // Current employee status
  const currentStatus = getCurrentStatus()
  const statusColor = getStatusColor(currentStatus)

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft stroke="#4C51BF" width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles del Empleado</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4C51BF" />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer}>
          {/* Basic employee information */}
          <View style={styles.employeeInfoCard}>
            <View style={styles.employeeHeader}>
              <View style={styles.avatarContainer}>
                <User stroke="#FFFFFF" width={40} height={40} />
              </View>
              <View style={styles.employeeNameContainer}>
                <Text style={styles.employeeName}>{employee.name}</Text>
                <Text style={styles.employeePosition}>{employee.position}</Text>
              </View>
            </View>

            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>{currentStatus}</Text>
              </View>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Mail stroke="#4C51BF" width={16} height={16} />
                <Text style={styles.infoText}>{employee.email}</Text>
              </View>

              <View style={styles.infoItem}>
                <Briefcase stroke="#4C51BF" width={16} height={16} />
                <Text style={styles.infoText}>{employee.department}</Text>
              </View>

              {employee.phone && (
                <View style={styles.infoItem}>
                  <Phone stroke="#4C51BF" width={16} height={16} />
                  <Text style={styles.infoText}>{employee.phone}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Map with last location */}
          {lastLocation && (
            <View style={styles.mapCard}>
              <Text style={styles.sectionTitle}>Última Ubicación</Text>
              <View style={styles.mapContainer}>
                <View style={styles.webMapPlaceholder}>
                  <MapPin stroke="#4C51BF" width={24} height={24} />
                  <Text style={styles.webMapText}>
                    Lat: {lastLocation.latitud.toFixed(6)}, Lon: {lastLocation.longitud.toFixed(6)}
                  </Text>
                  <TouchableOpacity
                    style={styles.openMapButton}
                    onPress={() => openLocationInMap(lastLocation.latitud, lastLocation.longitud)}
                  >
                    <Text style={styles.openMapButtonText}>Ver en Google Maps</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Today's attendance history */}
          <View style={styles.historyCard}>
            <Text style={styles.sectionTitle}>Marcaciones de Hoy</Text>

            {marcaciones.length === 0 ? (
              <Text style={styles.noRecordsText}>No hay registros para hoy</Text>
            ) : (
              marcaciones.map((marcacion) => (
                <View key={marcacion.id} style={styles.marcacionItem}>
                  <View style={styles.marcacionHeader}>
                    <View style={styles.marcacionTypeContainer}>
                      <Clock stroke="#4C51BF" width={16} height={16} />
                      <Text style={styles.marcacionType}>{formatTipoMarcacion(marcacion.tipo)}</Text>
                    </View>
                    <Text style={styles.marcacionTime}>{format(new Date(marcacion.timestamp), "HH:mm")}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.locationContainer}
                    onPress={() => openLocationInMap(marcacion.latitud, marcacion.longitud)}
                  >
                    <MapPin stroke="#718096" width={14} height={14} />
                    <Text style={styles.locationText}>
                      Lat: {marcacion.latitud.toFixed(6)}, Lon: {marcacion.longitud.toFixed(6)}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if (employee.phone) {
                  if (Platform.OS === "web") {
                    window.location.href = `tel:${employee.phone.replace(/\s+/g, "")}`
                  } else {
                    const Linking = require("react-native").Linking
                    Linking.openURL(`tel:${employee.phone.replace(/\s+/g, "")}`)
                  }
                } else {
                  showToast("No hay número de teléfono disponible", "info")
                }
              }}
            >
              <Phone stroke="#FFFFFF" width={20} height={20} />
              <Text style={styles.actionButtonText}>Llamar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#48BB78" }]}
              onPress={() => {
                if (Platform.OS === "web") {
                  window.location.href = `mailto:${employee.email}`
                } else {
                  const Linking = require("react-native").Linking
                  Linking.openURL(`mailto:${employee.email}`)
                }
              }}
            >
              <Mail stroke="#FFFFFF" width={20} height={20} />
              <Text style={styles.actionButtonText}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#ED8936" }]}
              onPress={exportEmployeeHistory}
            >
              <Download stroke="#FFFFFF" width={20} height={20} />
              <Text style={styles.actionButtonText}>Exportar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    flexDirection: "row",
    alignItems: "center",
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
    marginLeft: 8,
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
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  employeeInfoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  employeeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4C51BF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  employeeNameContainer: {
    flex: 1,
  },
  employeeName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D3748",
  },
  employeePosition: {
    fontSize: 16,
    color: "#718096",
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  infoSection: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#4A5568",
  },
  mapCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D3748",
    marginBottom: 12,
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
  },
  webMapPlaceholder: {
    height: 200,
    backgroundColor: "#EDF2F7",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  webMapText: {
    marginTop: 8,
    fontSize: 14,
    color: "#4A5568",
  },
  openMapButton: {
    marginTop: 12,
    backgroundColor: "#4C51BF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  openMapButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noRecordsText: {
    textAlign: "center",
    color: "#718096",
    fontSize: 16,
    marginVertical: 20,
  },
  marcacionItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 12,
  },
  marcacionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  marcacionTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  marcacionType: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3748",
  },
  marcacionTime: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4C51BF",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#718096",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#4C51BF",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 8,
  },
})

export default EmployeeDetailScreen

