"use client"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useAuth } from "../../contexts/AuthContext"
import { useSimpleToast } from "../../contexts/SimpleToastContext"
import type { EmployeeStackParamList } from "../../navigation/EmployerTabs"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

// Define the navigation prop type
type EmployeeDetailScreenNavigationProp = NativeStackNavigationProp<EmployeeStackParamList, "EmployeeDetail">

// Define the route prop type
type EmployeeDetailScreenRouteProp = RouteProp<EmployeeStackParamList, "EmployeeDetail">

// Type for attendance records
interface Marcacion {
  id: string
  usuario_id: string
  tipo: string
  timestamp: string
  latitud: number
  longitud: number
  foto_url?: string
}

// Type for employee details
interface EmployeeDetails {
  id: string
  nombre: string
  email: string
  position: string
  department: string
  status_employee: string
  phone?: string
  rut?: string
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
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetails | null>(null)
  const [loadingMarcajes, setLoadingMarcajes] = useState(true)

  // Load employee details and attendance records
  useEffect(() => {
    const loadEmployeeData = async () => {
      setIsLoading(true)
      try {
        console.log("Cargando datos del empleado ID:", employee.id)

        // Fetch employee details
        const detalleResponse = await fetch(`${API_URL}/usuarios/detalle.php?id=${employee.id}`)
        const detalleData = await detalleResponse.json()
        console.log("Respuesta de detalles:", detalleData)

        if (detalleResponse.ok) {
          setEmployeeDetails(detalleData)
        } else {
          console.error("Error loading employee details:", detalleData.error)
          showToast("No se pudieron cargar los detalles del empleado", "error")
        }
      } catch (error) {
        console.error("Error loading employee data:", error)
        showToast("Error al cargar datos del empleado", "error")
      } finally {
        setIsLoading(false)
      }
    }

    loadEmployeeData()
  }, [employee.id, API_URL, showToast])

  // Cargar marcajes del empleado
  useEffect(() => {
    const loadMarcajes = async () => {
      if (!employee?.id) return

      setLoadingMarcajes(true)
      try {
        // Obtener marcajes del día actual
        console.log("Solicitando marcajes para usuario ID:", employee.id)

        const marcajesResponse = await fetch(`${API_URL}/marcajes/hoy.php?usuario_id=${employee.id}`)

        if (!marcajesResponse.ok) {
          throw new Error(`Error HTTP: ${marcajesResponse.status}`)
        }

        const marcajesData = await marcajesResponse.json()
        console.log("Respuesta de marcajes:", marcajesData)

        if (marcajesData.records && Array.isArray(marcajesData.records)) {
          console.log("Número de marcajes encontrados:", marcajesData.records.length)

          // Sort by timestamp (most recent first)
          const sortedMarcaciones = [...marcajesData.records].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )

          setMarcaciones(sortedMarcaciones)

          // Set last location if available
          if (sortedMarcaciones.length > 0 && sortedMarcaciones[0].latitud && sortedMarcaciones[0].longitud) {
            setLastLocation({
              latitud: Number.parseFloat(sortedMarcaciones[0].latitud.toString()),
              longitud: Number.parseFloat(sortedMarcaciones[0].longitud.toString()),
            })
          }
        } else {
          // No records found or error
          console.log("No se encontraron marcajes o hubo un error:", marcajesData)
          setMarcaciones([])
        }
      } catch (error) {
        console.error("Error loading marcajes:", error)
        showToast("Error al cargar marcajes del empleado", "error")
      } finally {
        setLoadingMarcajes(false)
      }
    }

    loadMarcajes()
  }, [employee.id, API_URL, showToast])

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

  // Manejar edición de perfil del empleado
  const handleEditEmployee = () => {
    // @ts-ignore - Ignorando verificación de tipos para navegación
    navigation.navigate("EditEmployee", { employee: employeeDetails || employee })
  }

  // Get current employee status based on attendance records
  const getCurrentStatus = (): string => {
    // If we have employee details, use the status from there
    if (employeeDetails?.status_employee) {
      switch (employeeDetails.status_employee) {
        case "present":
          return "Presente"
        case "absent":
          return "Ausente"
        case "lunch":
          return "En colación"
        case "late":
          return "Tarde"
        default:
          return employeeDetails.status_employee
      }
    }

    // Fallback to calculating from marcaciones
    if (marcaciones.length === 0) return "Sin registros hoy"

    // Last record determines current status
    const lastMarcacion = marcaciones[0]

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
    if (status.includes("Tarde")) return "#ECC94B"
    return "#A0AEC0"
  }

  // Current employee status
  const currentStatus = getCurrentStatus()
  const statusColor = getStatusColor(currentStatus)

  // Use employee details from API if available, otherwise use route params
  const displayEmployee = employeeDetails || employee

  // Formatear fecha para mostrar
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return format(date, "dd 'de' MMMM, yyyy", { locale: es })
  }

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
           <Feather name="arrow-left" size={18}  color="#4C51BF" />
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
                <Feather name="user" size={35}  color="#FFFFFF" />
              </View>
              <View style={styles.employeeNameContainer}>
                <Text style={styles.employeeName}>{displayEmployee.nombre || displayEmployee.name || ""}</Text>
                <Text style={styles.employeePosition}>{displayEmployee.position || "Sin posición"}</Text>
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
                <Feather name="mail" size={18}  color="#4C51BF" />
                <Text style={styles.infoText}>{displayEmployee.email || "Sin email"}</Text>
              </View>

              <View style={styles.infoItem}>
                <Feather name="briefcase" size={18}  color="#4C51BF" />
                <Text style={styles.infoText}>{displayEmployee.department || "Sin departamento"}</Text>
              </View>

              {displayEmployee.phone && (
                <View style={styles.infoItem}>
                  <Feather name="phone" size={18}  color="#4C51BF" />
                  <Text style={styles.infoText}>{displayEmployee.phone}</Text>
                </View>
              )}

              {displayEmployee.rut && (
                <View style={styles.infoItem}>
                  <Feather name="user" size={18}  color="#4C51BF" />
                  <Text style={styles.infoText}>RUT: {displayEmployee.rut}</Text>
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
                  <Feather name="map-pin" size={18}  color="#4C51BF" />
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

          {/* Marcajes section */}
          <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.sectionTitle}>Marcajes</Text>
              <View style={styles.dateContainer}>
                <Feather name="calendar"  size={18}  color="#718096" />
                <Text style={styles.dateText}>{format(new Date(), "dd 'de' MMMM", { locale: es })}</Text>
              </View>
            </View>

            {loadingMarcajes ? (
              <View style={styles.marcajesLoadingContainer}>
                <ActivityIndicator size="small" color="#4C51BF" />
                <Text style={styles.marcajesLoadingText}>Cargando marcajes...</Text>
              </View>
            ) : marcaciones.length === 0 ? (
              <Text style={styles.noRecordsText}>No hay registros para hoy</Text>
            ) : (
              marcaciones.map((marcacion) => (
                <View key={marcacion.id} style={styles.marcacionItem}>
                  <View style={styles.marcacionHeader}>
                    <View style={styles.marcacionTypeContainer}>
                      <Feather name="clock" size={18}  color="#4C51BF" />
                      <Text style={styles.marcacionType}>{formatTipoMarcacion(marcacion.tipo)}</Text>
                    </View>
                    <Text style={styles.marcacionTime}>{format(new Date(marcacion.timestamp), "HH:mm")}</Text>
                  </View>

                  {marcacion.latitud && marcacion.longitud && (
                    <TouchableOpacity
                      style={styles.locationContainer}
                      onPress={() => openLocationInMap(marcacion.latitud, marcacion.longitud)}
                    >
                      <Feather name="map-pin"  color="#718096" />
                      <Text style={styles.locationText}>
                        Lat: {Number(marcacion.latitud).toFixed(6)}, Lon: {Number(marcacion.longitud).toFixed(6)}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if (displayEmployee.phone) {
                  if (Platform.OS === "web") {
                    window.location.href = `tel:${displayEmployee.phone.replace(/\s+/g, "")}`
                  } else {
                    const Linking = require("react-native").Linking
                    Linking.openURL(`tel:${displayEmployee.phone.replace(/\s+/g, "")}`)
                  }
                } else {
                  showToast("No hay número de teléfono disponible", "info")
                }
              }}
            >
              <Feather name="phone" size={18}  color="#ffffff" />
              <Text style={styles.actionButtonText}>Llamar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#48BB78" }]}
              onPress={() => {
                if (Platform.OS === "web") {
                  window.location.href = `mailto:${displayEmployee.email}`
                } else {
                  const Linking = require("react-native").Linking
                  Linking.openURL(`mailto:${displayEmployee.email}`)
                }
              }}
            >
              <Feather name="mail" size={18}  color="#ffffff" />
              <Text style={styles.actionButtonText}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#4C51BF" }]}
              onPress={handleEditEmployee}
            >
              <Feather name="edit" size={18}  color="#ffffff" />
              <Text style={styles.actionButtonText}>Editar</Text>
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
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDF2F7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  dateText: {
    fontSize: 12,
    color: "#718096",
    marginLeft: 5,
  },
  marcajesLoadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  marcajesLoadingText: {
    marginTop: 8,
    color: "#718096",
    fontSize: 14,
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

