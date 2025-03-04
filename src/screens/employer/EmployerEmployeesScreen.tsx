"use client"

import { useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from "react-native"
import { Search, Filter, ChevronRight, User } from "react-native-feather"

// Mock data for demonstration
const generateMockEmployees = () => {
  return [
    { id: "1", name: "Juan Pérez", position: "Desarrollador", status: "present", department: "Tecnología" },
    { id: "2", name: "María González", position: "Diseñadora", status: "present", department: "Diseño" },
    { id: "3", name: "Carlos Rodríguez", position: "Gerente", status: "absent", department: "Administración" },
    { id: "4", name: "Ana Martínez", position: "Marketing", status: "present", department: "Marketing" },
    { id: "5", name: "Luis Sánchez", position: "Soporte", status: "lunch", department: "Tecnología" },
    { id: "6", name: "Laura Torres", position: "Recursos Humanos", status: "present", department: "RRHH" },
    { id: "7", name: "Pedro Díaz", position: "Contador", status: "absent", department: "Finanzas" },
    { id: "8", name: "Sofía Vargas", position: "Asistente", status: "present", department: "Administración" },
  ]
}

const EmployerEmployeesScreen = () => {
  const [employees] = useState(generateMockEmployees())
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredEmployees, setFilteredEmployees] = useState(employees)

  const handleSearch = (text: string) => {
    setSearchQuery(text)
    if (text.trim() === "") {
      setFilteredEmployees(employees)
    } else {
      const filtered = employees.filter(
        (employee) =>
          employee.name.toLowerCase().includes(text.toLowerCase()) ||
          employee.position.toLowerCase().includes(text.toLowerCase()) ||
          employee.department.toLowerCase().includes(text.toLowerCase()),
      )
      setFilteredEmployees(filtered)
    }
  }

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Empleados</Text>

        <View style={styles.searchContainer}>
          <Search stroke="#718096" width={20} height={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar empleado..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          <TouchableOpacity style={styles.filterButton}>
            <Filter stroke="#4C51BF" width={20} height={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{employees.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{employees.filter((e) => e.status === "present").length}</Text>
            <Text style={styles.statLabel}>Presentes</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{employees.filter((e) => e.status === "absent").length}</Text>
            <Text style={styles.statLabel}>Ausentes</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{employees.filter((e) => e.status === "lunch").length}</Text>
            <Text style={styles.statLabel}>Almorzando</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={filteredEmployees}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.employeeCard}>
            <View style={styles.employeeAvatarContainer}>
              <User stroke="#4C51BF" width={24} height={24} />
            </View>

            <View style={styles.employeeInfo}>
              <Text style={styles.employeeName}>{item.name}</Text>
              <Text style={styles.employeeDetails}>
                {item.position} • {item.department}
              </Text>
            </View>

            <View style={styles.employeeActions}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {getStatusText(item.status)}
                </Text>
              </View>
              <ChevronRight stroke="#A0AEC0" width={20} height={20} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No se encontraron empleados</Text>
          </View>
        }
      />
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#2D3748",
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDF2F7",
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#4A5568",
  },
  filterButton: {
    padding: 5,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D3748",
  },
  statLabel: {
    fontSize: 12,
    color: "#718096",
  },
  employeeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  employeeAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3748",
  },
  employeeDetails: {
    fontSize: 14,
    color: "#718096",
  },
  employeeActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 10,
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
  emptyContainer: {
    padding: 30,
    alignItems: "center",
  },
  emptyText: {
    color: "#718096",
    fontSize: 16,
  },
})

export default EmployerEmployeesScreen

