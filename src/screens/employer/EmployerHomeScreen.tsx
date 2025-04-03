"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native"
import { format, startOfWeek, addDays } from "date-fns"
import { es } from "date-fns/locale"
import { Feather } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useSession } from "../../contexts/SessionContext"
import { useAuth } from "../../contexts/AuthContext"
import { useSimpleToast } from "../../contexts/SimpleToastContext"
import { empleadosService, marcajesService } from "../../services/api"

// Interfaces para los datos
interface Employee {
  id: string
  nombre: string
  position: string
  department: string
  status_employee: string
}

interface Stats {
  totalEmployees: number
  presentToday: number
  absentToday: number
  onLunch: number
  lateToday: number
  averageWorkHours: number
}

interface WeeklyData {
  day: string
  count: number
  date: Date
}

const EmployerHomeScreen = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [stats, setStats] = useState<Stats>({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    onLunch: 0,
    lateToday: 0,
    averageWorkHours: 0,
  })
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(true)
  const [isLoadingAvgHours, setIsLoadingAvgHours] = useState(true)
  const navigation = useNavigation()
  const { resetInactivityTimer } = useSession()
  const { user, API_URL } = useAuth()
  const { showToast } = useSimpleToast()

  // Añadir un nuevo estado para las horas promedio
  const [averageWorkHours, setAverageWorkHours] = useState(0)

  // Reiniciar el temporizador de inactividad cuando se monta el componente
  useEffect(() => {
    console.log("EmployerHomeScreen mounted")
    resetInactivityTimer()
  }, [resetInactivityTimer])

  // Cargar datos de empleados y estadísticas
  useEffect(() => {
    const loadEmployeeData = async () => {
      if (!user?.id) return

      setIsLoading(true)
      try {
        console.log("Cargando datos de empleados para empresa ID:", user.empresaId)

        // Obtener lista de empleados
        const response: any = await empleadosService.obtenerEmpleadosPorEmpresa(user.empresaId.toString())

        if (response.error) {
          console.error("Error al cargar empleados:", response.error)
          showToast("No se pudieron cargar los datos de empleados", "error")
          return
        }

        if (response.records && Array.isArray(response.records)) {
          console.log(`Se encontraron ${response.records.length} empleados`)

          // Procesar empleados y calcular estadísticas
          const employeeList = response.records.map((emp: any) => ({
            id: emp.id,
            nombre: emp.nombre,
            position: emp.position || "Sin asignar",
            department: emp.department || "Sin asignar",
            status_employee: emp.status_employee || "absent",
          }))

          setEmployees(employeeList)

          // Calcular estadísticas
          const presentCount = employeeList.filter((e: any) => e.status_employee === "present").length
          const absentCount = employeeList.filter((e: any) => e.status_employee === "absent").length
          const lunchCount = employeeList.filter((e: any) => e.status_employee === "lunch").length
          const lateCount = employeeList.filter((e: any) => e.status_employee === "late").length

          setStats({
            totalEmployees: employeeList.length,
            presentToday: presentCount,
            absentToday: absentCount,
            onLunch: lunchCount,
            lateToday: lateCount,
            averageWorkHours: 8.2, // Este valor podría calcularse con datos reales
          })

          showToast("Datos cargados correctamente", "success")
        } else {
          console.warn("No se encontraron empleados o formato incorrecto:", response)
          showToast("No se encontraron empleados", "info")
        }
      } catch (error) {
        console.error("Error al cargar datos de empleados:", error)
        showToast("Error al cargar datos", "error")
      } finally {
        setIsLoading(false)
      }
    }

    loadEmployeeData()
  }, [user, showToast])

  // Cargar datos semanales
  useEffect(() => {
    const loadWeeklyData = async () => {
      if (!user?.id) return

      setIsLoadingWeekly(true)
      try {
        // Calcular fechas para la semana actual
        const today = new Date()
        const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }) // Lunes

        // Crear array para los días de la semana
        const weekDays = []
        for (let i = 0; i < 5; i++) {
          // Solo días laborables (Lun-Vie)
          const day = addDays(startOfCurrentWeek, i)
          weekDays.push({
            day: format(day, "EEE", { locale: es }).substring(0, 3),
            date: day,
            count: 0,
          })
        }

        // Para cada día, obtener conteo de marcajes
        let totalWorkHours = 0
        let totalWorkDays = 0

        for (let i = 0; i < weekDays.length; i++) {
          const currentDay = weekDays[i]
          const formattedDate = format(currentDay.date, "yyyy-MM-dd")

          try {
            // Obtener marcajes para este día
            const response: any = await marcajesService.obtenerHistorial(
              user.empresaId.toString(),
              formattedDate,
              formattedDate,
            )

            if (response.records && Array.isArray(response.records)) {
              // Contar marcajes de entrada únicos por usuario
              const uniqueUserIds = new Set()
              response.records.forEach((record: any) => {
                if (record.tipo === "in") {
                  uniqueUserIds.add(record.usuario_id)
                }
              })

              weekDays[i].count = uniqueUserIds.size

              // Calcular horas trabajadas para este día
              const userWorkHours = new Map()

              // Agrupar marcajes por usuario
              response.records.forEach((record: any) => {
                const userId = record.usuario_id
                if (!userWorkHours.has(userId)) {
                  userWorkHours.set(userId, { inTime: null, outTime: null })
                }

                const userRecord = userWorkHours.get(userId)

                // Registrar hora de entrada
                if (
                  record.tipo === "in" &&
                  (!userRecord.inTime || new Date(record.timestamp) < new Date(userRecord.inTime))
                ) {
                  userRecord.inTime = record.timestamp
                }

                // Registrar hora de salida
                if (
                  record.tipo === "out" &&
                  (!userRecord.outTime || new Date(record.timestamp) > new Date(userRecord.outTime))
                ) {
                  userRecord.outTime = record.timestamp
                }
              })

              // Calcular horas trabajadas por cada usuario
              let dayTotalHours = 0
              let dayUserCount = 0

              userWorkHours.forEach((record, userId) => {
                if (record.inTime && record.outTime) {
                  const inTime = new Date(record.inTime)
                  const outTime = new Date(record.outTime)

                  // Calcular diferencia en horas
                  const diffMs = outTime.getTime() - inTime.getTime()
                  const diffHours = diffMs / (1000 * 60 * 60)

                  // Solo contar si es un valor razonable (entre 1 y 14 horas)
                  if (diffHours >= 1 && diffHours <= 14) {
                    dayTotalHours += diffHours
                    dayUserCount++
                  }
                }
              })

              // Añadir al total si hay datos válidos
              if (dayUserCount > 0) {
                totalWorkHours += dayTotalHours
                totalWorkDays += dayUserCount
              }
            }
          } catch (dayError) {
            console.error(`Error al cargar datos para ${formattedDate}:`, dayError)
          }
        }

        setWeeklyData(weekDays)
      } catch (error) {
        console.error("Error al cargar datos semanales:", error)
      } finally {
        setIsLoadingWeekly(false)
      }
    }

    loadWeeklyData()
  }, [user, showToast])

  // Cargar promedio de horas trabajadas desde el nuevo endpoint
  useEffect(() => {
    const loadAverageHours = async () => {
      if (!user?.empresaId) return

      setIsLoadingAvgHours(true)
      try {
        console.log("Cargando promedio de horas para empresa ID:", user.empresaId)

        const response = await fetch(`${API_URL}/marcajes/promedio_horas.php?empresa_id=${user.empresaId}`)

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`)
        }

        const data = await response.json()
        console.log("Respuesta de promedio de horas:", data)

        if (data && data.promedio_horas !== undefined) {
          setAverageWorkHours(data.promedio_horas)
        } else {
          console.warn("No se pudo obtener el promedio de horas trabajadas")
          setAverageWorkHours(0)
        }
      } catch (error) {
        console.error("Error al cargar promedio de horas:", error)
        // Mantener el cálculo anterior como respaldo
        const totalWorkHours = weeklyData.reduce((total, day) => total + day.count, 0)
        const totalDays = weeklyData.filter((day) => day.count > 0).length
        if (totalDays > 0) {
          setAverageWorkHours(Number.parseFloat((totalWorkHours / totalDays).toFixed(1)))
        } else {
          setAverageWorkHours(0)
        }
      } finally {
        setIsLoadingAvgHours(false)
      }
    }

    loadAverageHours()
  }, [user?.empresaId, API_URL, weeklyData])

  const getStatusText = (status: string) => {
    switch (status) {
      case "present":
        return "Presente"
      case "absent":
        return "Ausente"
      case "lunch":
        return "Almorzando"
      case "late":
        return "Tarde"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "#48BB78"
      case "absent":
        return "#F56565"
      case "lunch":
        return "#ED8936"
      case "late":
        return "#ECC94B"
      default:
        return "#A0AEC0"
    }
  }

  // Calcular altura máxima para las barras del gráfico
  const getMaxBarHeight = () => {
    const maxCount = Math.max(...weeklyData.map((day) => day.count), 1)
    return maxCount
  }

  // Calcular altura relativa para cada barra
  const getBarHeight = (count: number) => {
    const maxCount = getMaxBarHeight()
    // Altura máxima de 100px, mínima de 10px
    return count > 0 ? Math.max(10, (count / maxCount) * 100) : 10
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4C51BF" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      onScroll={() => resetInactivityTimer()} // Reiniciar temporizador al hacer scroll
    >
      <View style={styles.header}>
        <Text style={styles.title}>Panel de Control</Text>
        <Text style={styles.date}>{format(new Date(), "EEEE, d 'de' MMMM", { locale: es })}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
              <Feather name="users" size={18}  color="#4C51BF" />
          </View>
          <Text style={styles.statValue}>{stats.totalEmployees}</Text>
          <Text style={styles.statLabel}>Empleados</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: "#EBF8FF" }]}>
          <Feather name="clock" size={18}  color="#4C51BF" />
          </View>
          <Text style={styles.statValue}>{stats.presentToday}</Text>
          <Text style={styles.statLabel}>Presentes</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: "#FFF5F5" }]}>
          <Feather name="clock" size={18}  color="#4C51BF" />
          </View>
          <Text style={styles.statValue}>{stats.absentToday}</Text>
          <Text style={styles.statLabel}>Ausentes</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Empleados Hoy</Text>
          <TouchableOpacity
            style={styles.seeAllButton}
            onPress={() => {
              resetInactivityTimer()
              navigation.navigate("Employees" as never)
            }}
          >
            <Text style={styles.seeAllText}>Ver todos</Text>
            <Feather name="chevron-right" size={18}  color="#4C51BF" />
          </TouchableOpacity>
        </View>

        {employees.length === 0 ? (
          <Text style={styles.emptyText}>No hay empleados registrados</Text>
        ) : (
          employees.slice(0, 3).map((employee) => (
            <View key={employee.id} style={styles.employeeCard}>
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeName}>{employee.nombre}</Text>
                <Text style={styles.employeePosition}>
                  {employee.position} • {employee.department}
                </Text>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(employee.status_employee) + "20" }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(employee.status_employee) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(employee.status_employee) }]}>
                  {getStatusText(employee.status_employee)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Resumen Semanal</Text>
          <TouchableOpacity disabled style={styles.seeAllButton} onPress={() => resetInactivityTimer()}>
            <Text style={styles.seeAllText}>Ver detalles</Text>
            <Feather name="chevron-right" size={18}  color="#4C51BF" />
          </TouchableOpacity>
        </View>

        {isLoadingWeekly ? (
          <View style={styles.weeklyLoadingContainer}>
            <ActivityIndicator size="small" color="#4C51BF" />
            <Text style={styles.weeklyLoadingText}>Cargando datos semanales...</Text>
          </View>
        ) : (
          <>
            <View style={styles.weekSummary}>
              {weeklyData.map((day, index) => (
                <View key={index} style={styles.weekDay}>
                  <Text style={styles.weekDayLabel}>{day.day}</Text>
                  <View
                    style={[
                      styles.weekDayBar,
                      {
                        height: getBarHeight(day.count),
                        backgroundColor:
                          format(day.date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                            ? "#4C51BF"
                            : day.date > new Date()
                              ? "#E2E8F0"
                              : "#4C51BF",
                      },
                    ]}
                  />
                  <Text style={styles.weekDayValue}>{day.date > new Date() ? "-" : day.count}</Text>
                </View>
              ))}
            </View>

            <View style={styles.weekStats}>
              <View style={styles.weekStatItem}>
                <Text style={styles.weekStatLabel}>Promedio de horas:</Text>
                {isLoadingAvgHours ? (
                  <ActivityIndicator size="small" color="#4C51BF" />
                ) : (
                  <Text style={styles.weekStatValue}>{averageWorkHours > 0 ? `${averageWorkHours} hrs` : "N/A"}</Text>
                )}
              </View>

              <View style={styles.weekStatItem}>
                <Text style={styles.weekStatLabel}>Asistencia:</Text>
                <Text style={styles.weekStatValue}>
                  {stats.totalEmployees > 0 ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0}%
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7FAFC",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#4A5568",
  },
  weeklyLoadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  weeklyLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#718096",
  },
  emptyText: {
    textAlign: "center",
    padding: 20,
    color: "#718096",
    fontSize: 16,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2D3748",
  },
  date: {
    fontSize: 16,
    color: "#4A5568",
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    width: "30%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D3748",
  },
  statLabel: {
    fontSize: 12,
    color: "#718096",
    marginTop: 5,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D3748",
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeAllText: {
    fontSize: 14,
    color: "#4C51BF",
    marginRight: 5,
  },
  employeeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3748",
  },
  employeePosition: {
    fontSize: 14,
    color: "#718096",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  weekSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
    marginBottom: 20,
  },
  weekDay: {
    alignItems: "center",
    width: "18%",
  },
  weekDayLabel: {
    fontSize: 12,
    color: "#718096",
    marginBottom: 5,
  },
  weekDayBar: {
    width: 20,
    backgroundColor: "#4C51BF",
    borderRadius: 10,
    marginBottom: 5,
  },
  weekDayValue: {
    fontSize: 12,
    color: "#2D3748",
  },
  weekStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 15,
  },
  weekStatItem: {
    alignItems: "center",
  },
  weekStatLabel: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 5,
  },
  weekStatValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2D3748",
  },
})

export default EmployerHomeScreen

