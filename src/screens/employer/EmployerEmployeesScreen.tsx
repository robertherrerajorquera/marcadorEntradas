"use client"

import { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform } from "react-native"
import { Search, Filter, ChevronRight, User, Download } from "react-native-feather"
import { format } from "date-fns"
import { useAuth } from "../../contexts/AuthContext"
import { useSimpleToast } from "../../contexts/SimpleToastContext"
import { useNavigation } from "@react-navigation/native"

// Mock data for demonstration (in a real app, this would come from the API)
const generateMockEmployees = () => {
  return [
    {
      id: "1",
      nombre: "Juan Pérez",
      position: "Desarrollador",
      status_employee: "present",
      department: "Tecnología",
      email: "juan@example.com",
      phone: "+56 9 1234 5678",
    },
    {
      id: "2",
      nombre: "María González",
      position: "Diseñadora",
      status_employee: "present",
      department: "Diseño",
      email: "maria@example.com",
      phone: "+56 9 8765 4321",
    },
    {
      id: "3",
      nombre: "Carlos Rodríguez",
      position: "Gerente",
      status_employee: "absent",
      department: "Administración",
      email: "carlos@example.com",
      phone: "+56 9 2345 6789",
    },
    {
      id: "4",
      nombre: "Ana Martínez",
      position: "Marketing",
      status_employee: "present",
      department: "Marketing",
      email: "ana@example.com",
      phone: "+56 9 3456 7890",
    },
    {
      id: "5",
      nombre: "Luis Sánchez",
      position: "Soporte",
      status_employee: "lunch",
      department: "Tecnología",
      email: "luis@example.com",
      phone: "+56 9 4567 8901",
    },
    {
      id: "6",
      nombre: "Laura Torres",
      position: "Recursos Humanos",
      status_employee: "present",
      department: "RRHH",
      email: "laura@example.com",
      phone: "+56 9 5678 9012",
    },
    {
      id: "7",
      nombre: "Pedro Díaz",
      position: "Contador",
      status_employee: "absent",
      department: "Finanzas",
      email: "pedro@example.com",
      phone: "+56 9 6789 0123",
    },
    {
      id: "8",
      nombre: "Sofía Vargas",
      position: "Asistente",
      status_employee: "present",
      department: "Administración",
      email: "sofia@example.com",
      phone: "+56 9 7890 1234",
    },
  ]
}

const EmployerEmployeesScreen = () => {
  const { API_URL, user } = useAuth()
  const { showToast } = useSimpleToast()
  const navigation = useNavigation()
  const [employees, setEmployees] = useState(generateMockEmployees())
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredEmployees, setFilteredEmployees] = useState(employees)
  const [isLoading, setIsLoading] = useState(false)

  // Load employees from the API
  useEffect(() => {
    const loadEmployees = async () => {
      if (!user?.id) return

      setIsLoading(true)
      try {
        showToast("Cargando empleados...", "info")

        // In a real app, this would be an API call
        const response = await fetch(`${API_URL}/usuarios/read_by_empresa.php?empresa_id=${user.empresaId}`)
        const data = await response.json()

        if (data.records) {
          setEmployees(data.records)
          setFilteredEmployees(data.records)
          showToast(`${data.records.length} empleados cargados`, "success")
        } else {
          // Fallback to mock data if no records
          const mockData = generateMockEmployees()
          setEmployees(mockData)
          setFilteredEmployees(mockData)
          showToast("Usando datos de demostración", "info")
        }
      } catch (error) {
        console.error("Error al cargar empleados:", error)
        showToast("No se pudieron cargar los empleados", "error")

        // Fallback to mock data on error
        const mockData = generateMockEmployees()
        setEmployees(mockData)
        setFilteredEmployees(mockData)
      } finally {
        setIsLoading(false)
      }
    }

    loadEmployees()
  }, [user, API_URL, showToast])

  const handleSearch = (text: string) => {
    setSearchQuery(text)
    if (text.trim() === "") {
      setFilteredEmployees(employees)
    } else {
      const filtered = employees.filter(
        (employee) =>
          employee.nombre.toLowerCase().includes(text.toLowerCase()) ||
          employee.position.toLowerCase().includes(text.toLowerCase()) ||
          employee.department.toLowerCase().includes(text.toLowerCase()),
      )
      setFilteredEmployees(filtered)

      // Show search results feedback
      if (filtered.length === 0) {
        showToast("No se encontraron empleados con ese criterio", "info")
      } else if (filtered.length < employees.length) {
        showToast(`Se encontraron ${filtered.length} empleados`, "info")
      }
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

  // Function to download Excel file (works on both web and native)
  const downloadExcel = async (url: string, fileName = "export.xlsx") => {
    try {
      showToast("Preparando exportación...", "info")

      if (Platform.OS === "web") {
        // Web implementation
        try {
          const response = await fetch(url)

          if (!response.ok) {
            const errorText = await response.text()
            showToast(`Error: ${errorText || "No se pudo descargar el archivo"}`, "error")
            return
          }

          const blob = await response.blob()
          const downloadUrl = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = downloadUrl
          a.download = fileName
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
        const canOpen = await Linking.canOpenURL(url)

        if (canOpen) {
          await Linking.openURL(url)
          showToast("Archivo abierto correctamente", "success")
        } else {
          showToast("No se puede abrir el enlace para descargar el archivo", "error")
        }
      }
    } catch (error) {
      console.error("Error al exportar:", error)
      showToast("No se pudo generar el archivo Excel", "error")
    }
  }

  const exportEmployeeHistory = async (employee: any) => {
    try {
      // Get date range for the export (last month)
      const today = new Date()
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

      const formattedStartDate = format(oneMonthAgo, "yyyy-MM-dd")
      const formattedEndDate = format(today, "yyyy-MM-dd")

      // Build URL for Excel export
      const excelUrl = `${API_URL}/export/excel.php?usuario_id=${employee.id}&fecha_inicio=${formattedStartDate}&fecha_fin=${formattedEndDate}`

      // Download the file
      await downloadExcel(excelUrl, `historial_${employee.nombre}.xlsx`)
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      showToast("No se pudo generar el archivo Excel", "error")
    }
  }

  // Handle employee selection - navigate to detail screen or show options
  const handleEmployeePress = (employee: any) => {
    // Format the employee data for the detail screen
    const employeeForDetail = {
      id: employee.id,
      name: employee.nombre,
      email: employee.email || `${employee.nombre.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      position: employee.position,
      department: employee.department,
      status: employee.status_employee,
      phone: employee.phone || "+56 9 1234 5678",
    }

    // Use type-safe navigation
    // @ts-ignore - Ignoring type checking for navigation to avoid complex type setup
    navigation.navigate("EmployeeDetail", { employee: employeeForDetail })
  }

  // Function to export all records
  const handleExportAll = useCallback(async () => {
    // Show confirmation dialog based on platform
    const confirmExport =
      Platform.OS === "web" ? window.confirm("¿Deseas exportar el historial de todos los empleados?") : true // For native, we'll handle confirmation in the else block below

    if (confirmExport) {
      try {
        showToast("Preparando exportación de todos los registros...", "info")

        // Get date range for the export (last month)
        const today = new Date()
        const oneMonthAgo = new Date()
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

        const formattedStartDate = format(oneMonthAgo, "yyyy-MM-dd")
        const formattedEndDate = format(today, "yyyy-MM-dd")

        // Build URL for Excel export (all employees)
        const excelUrl = `${API_URL}/export/excel.php?empresa_id=${user?.empresaId || user?.id}&fecha_inicio=${formattedStartDate}&fecha_fin=${formattedEndDate}`

        // Download the file
        await downloadExcel(excelUrl, "historial_todos_empleados.xlsx")
      } catch (error) {
        console.error("Error al exportar a Excel:", error)
        showToast("No se pudo generar el archivo Excel", "error")
      }
    }
  }, [user, API_URL, showToast])

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
          <TouchableOpacity style={styles.filterButton} onPress={() => showToast("Filtros no disponibles aún", "info")}>
            <Filter stroke="#4C51BF" width={20} height={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{employees.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{employees.filter((e) => e.status_employee === "present").length}</Text>
            <Text style={styles.statLabel}>Presentes</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{employees.filter((e) => e.status_employee === "absent").length}</Text>
            <Text style={styles.statLabel}>Ausentes</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{employees.filter((e) => e.status_employee === "lunch").length}</Text>
            <Text style={styles.statLabel}>Almorzando</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={filteredEmployees}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.employeeCard} onPress={() => handleEmployeePress(item)}>
            <View style={styles.employeeAvatarContainer}>
              <User stroke="#4C51BF" width={24} height={24} />
            </View>
            <View style={styles.employeeInfo}>
              <Text style={styles.employeeName}>{item.nombre}</Text>
              <Text style={styles.employeeDetails}>
                {item.position} • {item.department}
              </Text>
            </View>

            <View style={styles.employeeActions}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status_employee) + "20" }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status_employee) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(item.status_employee) }]}>
                  {getStatusText(item.status_employee)}
                </Text>
              </View>
              <ChevronRight stroke="#A0AEC0" width={20} height={20} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Cargando empleados...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No se encontraron empleados</Text>
            </View>
          )
        }
      />

      {/* Export all records button */}
      <TouchableOpacity style={styles.exportAllButton} activeOpacity={0.7} onPress={handleExportAll}>
        <Download stroke="#FFFFFF" width={20} height={20} />
        <Text style={styles.exportAllButtonText}>Exportar todos los registros</Text>
      </TouchableOpacity>
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
  exportAllButton: {
    backgroundColor: "#4C51BF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 10,
    margin: 15,
  },
  exportAllButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
})

export default EmployerEmployeesScreen

