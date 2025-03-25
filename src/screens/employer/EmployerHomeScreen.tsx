"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Users, Clock, ChevronRight } from "react-native-feather"
import { useNavigation } from "@react-navigation/native"
import { useSession } from "../../contexts/SessionContext"

// Mock data for demonstration
const generateMockEmployees = () => {
  return [
    { id: "1", name: "Juan Pérez", position: "Desarrollador", status: "present" },
    { id: "2", name: "María González", position: "Diseñadora", status: "present" },
    { id: "3", name: "Carlos Rodríguez", position: "Gerente", status: "absent" },
    { id: "4", name: "Ana Martínez", position: "Marketing", status: "present" },
    { id: "5", name: "Luis Sánchez", position: "Soporte", status: "lunch" },
  ]
}

const generateMockStats = () => {
  return {
    totalEmployees: 5,
    presentToday: 3,
    absentToday: 1,
    onLunch: 1,
    lateToday: 0,
    averageWorkHours: 8.2,
  }
}

const EmployerHomeScreen = () => {
  const [employees] = useState(generateMockEmployees())
  const [stats] = useState(generateMockStats())
  const navigation = useNavigation()
  const { resetInactivityTimer } = useSession()

  // Reiniciar el temporizador de inactividad cuando se monta el componente
  useEffect(() => {
    resetInactivityTimer()
  }, [resetInactivityTimer])

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
            <Users stroke="#4C51BF" width={24} height={24} />
          </View>
          <Text style={styles.statValue}>{stats.totalEmployees}</Text>
          <Text style={styles.statLabel}>Empleados</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: "#EBF8FF" }]}>
            <Clock stroke="#3182CE" width={24} height={24} />
          </View>
          <Text style={styles.statValue}>{stats.presentToday}</Text>
          <Text style={styles.statLabel}>Presentes</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: "#FFF5F5" }]}>
            <Clock stroke="#E53E3E" width={24} height={24} />
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
            <ChevronRight stroke="#4C51BF" width={16} height={16} />
          </TouchableOpacity>
        </View>

        {employees.slice(0, 3).map((employee) => (
          <View key={employee.id} style={styles.employeeCard}>
            <View style={styles.employeeInfo}>
              <Text style={styles.employeeName}>{employee.name}</Text>
              <Text style={styles.employeePosition}>{employee.position}</Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(employee.status) + "20" }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(employee.status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(employee.status) }]}>
                {getStatusText(employee.status)}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Resumen Semanal</Text>
          <TouchableOpacity style={styles.seeAllButton} onPress={() => resetInactivityTimer()}>
            <Text style={styles.seeAllText}>Ver detalles</Text>
            <ChevronRight stroke="#4C51BF" width={16} height={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekSummary}>
          <View style={styles.weekDay}>
            <Text style={styles.weekDayLabel}>Lun</Text>
            <View style={[styles.weekDayBar, { height: 80 }]} />
            <Text style={styles.weekDayValue}>5</Text>
          </View>

          <View style={styles.weekDay}>
            <Text style={styles.weekDayLabel}>Mar</Text>
            <View style={[styles.weekDayBar, { height: 100 }]} />
            <Text style={styles.weekDayValue}>5</Text>
          </View>

          <View style={styles.weekDay}>
            <Text style={styles.weekDayLabel}>Mié</Text>
            <View style={[styles.weekDayBar, { height: 90 }]} />
            <Text style={styles.weekDayValue}>5</Text>
          </View>

          <View style={styles.weekDay}>
            <Text style={styles.weekDayLabel}>Jue</Text>
            <View style={[styles.weekDayBar, { height: 95 }]} />
            <Text style={styles.weekDayValue}>5</Text>
          </View>

          <View style={styles.weekDay}>
            <Text style={styles.weekDayLabel}>Vie</Text>
            <View style={[styles.weekDayBar, { height: 70, backgroundColor: "#E2E8F0" }]} />
            <Text style={styles.weekDayValue}>-</Text>
          </View>
        </View>

        <View style={styles.weekStats}>
          <View style={styles.weekStatItem}>
            <Text style={styles.weekStatLabel}>Promedio de horas:</Text>
            <Text style={styles.weekStatValue}>{stats.averageWorkHours} hrs</Text>
          </View>

          <View style={styles.weekStatItem}>
            <Text style={styles.weekStatLabel}>Asistencia:</Text>
            <Text style={styles.weekStatValue}>92%</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
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

