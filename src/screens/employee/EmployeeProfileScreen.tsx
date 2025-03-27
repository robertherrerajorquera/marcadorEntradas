"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native"
import { User, Mail, Phone, Briefcase, MapPin, Edit, LogOut, Calendar } from "react-native-feather"
import { useAuth } from "../../contexts/AuthContext"
import { useSimpleToast } from "../../contexts/SimpleToastContext"
import { useNavigation } from "@react-navigation/native"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Tipo para los datos del perfil
interface PerfilData {
  id: string
  nombre: string
  email: string
  role: string
  position?: string
  department?: string
  rut?: string
  phone?: string
  empresa: {
    id: string
    nombre: string
    direccion?: string
    telefono?: string
    email?: string
  }
}

// Tipo para las estadísticas de asistencia
interface EstadisticasAsistencia {
  dias_trabajados: number
  horas_totales: number
  puntualidad: number
  dias_mes: number
  mes: string
  anio: string
}

const EmployeeProfileScreen = () => {
  const { user, logout, API_URL } = useAuth()
  const { showToast } = useSimpleToast()
  const navigation = useNavigation()
  const [isLoading, setIsLoading] = useState(true)
  const [perfilData, setPerfilData] = useState<PerfilData | null>(null)
  const [estadisticas, setEstadisticas] = useState<EstadisticasAsistencia | null>(null)
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(true)

  // Cargar datos del perfil
  useEffect(() => {
    const cargarPerfil = async () => {
      if (!user?.id) return

      setIsLoading(true)
      try {
        console.log("Cargando perfil del empleado ID:", user.id)

        const response = await fetch(`${API_URL}/usuarios/perfil.php?id=${user.id}`)
        const data = await response.json()

        console.log("Respuesta de perfil:", data)

        if (response.ok) {
          setPerfilData(data)
        } else {
          console.error("Error al cargar perfil:", data.error)
          showToast("No se pudo cargar la información del perfil", "error")
        }
      } catch (error) {
        console.error("Error al cargar perfil:", error)
        showToast("Error al cargar datos del perfil", "error")
      } finally {
        setIsLoading(false)
      }
    }

    cargarPerfil()
  }, [user?.id, API_URL, showToast])

  // Cargar estadísticas de asistencia
  useEffect(() => {
    const cargarEstadisticas = async () => {
      if (!user?.id) return

      setLoadingEstadisticas(true)
      try {
        const mesActual = new Date().getMonth() + 1 // getMonth() devuelve 0-11
        const anioActual = new Date().getFullYear()

        console.log(`Cargando estadísticas para usuario ${user.id}, mes ${mesActual}, año ${anioActual}`)

        const response = await fetch(
          `${API_URL}/marcajes/estadisticas.php?usuario_id=${user.id}&mes=${mesActual}&anio=${anioActual}`,
        )

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`)
        }

        const data = await response.json()
        console.log("Respuesta de estadísticas:", data)

        setEstadisticas(data)
      } catch (error) {
        console.error("Error al cargar estadísticas:", error)
        // No mostramos toast para no sobrecargar al usuario con mensajes
      } finally {
        setLoadingEstadisticas(false)
      }
    }

    cargarEstadisticas()
  }, [user?.id, API_URL])

  // Manejar cierre de sesión
  const handleLogout = async () => {
    try {
      await logout()
      // La navegación se maneja en el contexto de autenticación
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      showToast("Error al cerrar sesión", "error")
    }
  }

  // Manejar edición de perfil
  const handleEditProfile = () => {
    // @ts-ignore - Ignorando verificación de tipos para navegación
    navigation.navigate("EditProfile")
  }

  // Obtener texto de estado
  const getStatusText = (status: string): string => {
    switch (status) {
      case "present":
        return "Presente"
      case "absent":
        return "Ausente"
      case "lunch":
        return "En colación"
      default:
        return status || "Desconocido"
    }
  }

  // Obtener color de estado
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "present":
        return "#48BB78" // verde
      case "absent":
        return "#F56565" // rojo
      case "lunch":
        return "#ED8936" // naranja
      default:
        return "#A0AEC0" // gris
    }
  }

  // Datos a mostrar (de la API o como fallback del contexto)
  const displayData = perfilData || {
    id: user?.id || "",
    nombre: user?.nombre || "",
    email: user?.email || "",
    role: user?.role || "",
    position:  "",
    department:  "",
    rut: user?.rut || "",
    phone: user?.phone || "",
    empresa: {
      id: user?.empresaId || "",
      nombre: user?.nombre || "",
      direccion: "",
      telefono: "",
      email: "",
    },
  }

  // Estado actual del empleado
  const currentStatus = user?.status_employee || "absent"
  const statusText = getStatusText(currentStatus)
  const statusColor = getStatusColor(currentStatus)

  // Formatear nombre del mes actual
  const nombreMesActual = format(new Date(), "MMMM", { locale: es })

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4C51BF" />
            <Text style={styles.loadingText}>Cargando perfil...</Text>
          </View>
        ) : (
          <>
            {/* Tarjeta de perfil personal */}
            <View style={styles.profileCard}>
              <View style={styles.avatarContainer}>
                <User stroke="#FFFFFF" width={40} height={40} />
              </View>

              <Text style={styles.userName}>{displayData.nombre}</Text>
              <Text style={styles.userRole}>{displayData.position || "Empleado"}</Text>

              {/* Estado actual */}
              <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>Estado actual: {statusText}</Text>
              </View>

              <View style={styles.infoSection}>
                <View style={styles.infoItem}>
                  <Mail stroke="#4C51BF" width={20} height={20} />
                  <Text style={styles.infoText}>{displayData.email}</Text>
                </View>

                {displayData.phone && (
                  <View style={styles.infoItem}>
                    <Phone stroke="#4C51BF" width={20} height={20} />
                    <Text style={styles.infoText}>{displayData.phone}</Text>
                  </View>
                )}

                {displayData.department && (
                  <View style={styles.infoItem}>
                    <Briefcase stroke="#4C51BF" width={20} height={20} />
                    <Text style={styles.infoText}>Departamento: {displayData.department}</Text>
                  </View>
                )}

                {displayData.rut && (
                  <View style={styles.infoItem}>
                    <User stroke="#4C51BF" width={20} height={20} />
                    <Text style={styles.infoText}>RUT: {displayData.rut}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Tarjeta de información de la empresa */}
            <View style={styles.companyCard}>
              <Text style={styles.sectionTitle}>Mi Empresa</Text>

              <View style={styles.infoItem}>
                <Briefcase stroke="#4C51BF" width={20} height={20} />
                <Text style={styles.infoText}>{displayData.empresa.nombre}</Text>
              </View>

              {displayData.empresa.direccion && (
                <View style={styles.infoItem}>
                  <MapPin stroke="#4C51BF" width={20} height={20} />
                  <Text style={styles.infoText}>{displayData.empresa.direccion}</Text>
                </View>
              )}

              {displayData.empresa.telefono && (
                <View style={styles.infoItem}>
                  <Phone stroke="#4C51BF" width={20} height={20} />
                  <Text style={styles.infoText}>{displayData.empresa.telefono}</Text>
                </View>
              )}

              {displayData.empresa.email && (
                <View style={styles.infoItem}>
                  <Mail stroke="#4C51BF" width={20} height={20} />
                  <Text style={styles.infoText}>{displayData.empresa.email}</Text>
                </View>
              )}
            </View>

            {/* Resumen de asistencia */}
            <View style={styles.attendanceCard}>
              <View style={styles.attendanceHeader}>
                <Text style={styles.sectionTitle}>Resumen de Asistencia</Text>
                <View style={styles.monthBadge}>
                  <Calendar stroke="#4C51BF" width={14} height={14} />
                  <Text style={styles.monthText}>{nombreMesActual}</Text>
                </View>
              </View>

              {loadingEstadisticas ? (
                <View style={styles.statsLoading}>
                  <ActivityIndicator size="small" color="#4C51BF" />
                  <Text style={styles.statsLoadingText}>Cargando estadísticas...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{estadisticas?.dias_trabajados || 0}</Text>
                      <Text style={styles.statLabel}>Días trabajados</Text>
                      {estadisticas && <Text style={styles.statSubLabel}>de {estadisticas.dias_mes}</Text>}
                    </View>

                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{estadisticas?.horas_totales || 0}</Text>
                      <Text style={styles.statLabel}>Horas totales</Text>
                    </View>

                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{estadisticas?.puntualidad || 0}%</Text>
                      <Text style={styles.statLabel}>Puntualidad</Text>
                    </View>
                  </View>

                  {estadisticas && estadisticas.dias_trabajados === 0 && (
                    <Text style={styles.noDataText}>No hay registros de asistencia para este mes</Text>
                  )}
                </>
              )}

            </View>

            {/* Botones de acción */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#4C51BF" }]}
                onPress={handleEditProfile}
              >
                <Edit stroke="#FFFFFF" width={20} height={20} />
                <Text style={styles.actionButtonText}>Editar Perfil</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#F56565" }]} onPress={handleLogout}>
                <LogOut stroke="#FFFFFF" width={20} height={20} />
                <Text style={styles.actionButtonText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
  },
  loadingText: {
    marginTop: 10,
    color: "#4A5568",
    fontSize: 16,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4C51BF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2D3748",
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: "#718096",
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
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
    width: "100%",
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
  companyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
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
    marginBottom: 16,
  },
  attendanceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  attendanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF4FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  monthText: {
    fontSize: 12,
    color: "#4C51BF",
    marginLeft: 5,
    textTransform: "capitalize",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4C51BF",
  },
  statLabel: {
    fontSize: 12,
    color: "#718096",
  },
  statSubLabel: {
    fontSize: 10,
    color: "#A0AEC0",
    marginTop: 2,
  },
  statsLoading: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  statsLoadingText: {
    fontSize: 14,
    color: "#718096",
    marginTop: 8,
  },
  noDataText: {
    textAlign: "center",
    fontSize: 14,
    color: "#718096",
    marginBottom: 16,
    fontStyle: "italic",
  },
  viewHistoryButton: {
    backgroundColor: "#EBF4FF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  viewHistoryButtonText: {
    color: "#4C51BF",
    fontWeight: "bold",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 8,
  },
})

export default EmployeeProfileScreen

