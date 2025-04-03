"use client"

import { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform, Alert, Linking } from "react-native"
import { Feather } from "@expo/vector-icons"
import { format } from "date-fns"
import { useAuth } from "../../contexts/AuthContext"
import { useSimpleToast } from "../../contexts/SimpleToastContext"
import { useNavigation } from "@react-navigation/native"
import type { Employee as Usuario } from "../../types/index"
// These imports will be used dynamically to avoid issues with web platform
// import * as FileSystem from "expo-file-system"
// import * as Sharing from "expo-sharing"

const EmployerEmployeesScreen = () => {
  const { API_URL, user } = useAuth()
  const { showToast } = useSimpleToast()
  const navigation = useNavigation()
  const [employees, setEmployees] = useState([])
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
        }
      } catch (error) {
        console.error("Error al cargar empleados:", error)
        showToast("No se pudieron cargar los empleados", "error")
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
        (employee: Usuario) =>
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

  // Update the downloadCSV function to improve error handling with toast notifications
  const downloadCSV = async (url: string, fileName = "export.csv") => {
    try {
      showToast("Preparando exportación...", "info")

      if (Platform.OS === "web") {
        // Web implementation - no changes needed
        try {
          const response = await fetch(url)

          if (!response.ok) {
            const errorText = await response.text()
            showToast(`Error al generar el archivo CSV: ${errorText || "No se pudo descargar el archivo"}`, "error")
            return false
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

          showToast("Archivo CSV descargado correctamente", "success")
          return true
        } catch (error) {
          console.error("Error downloading file:", error)
          showToast(
            `Error al descargar el archivo: ${error instanceof Error ? error.message : "Error desconocido"}`,
            "error",
          )
          return false
        }
      } else {
        // Mobile implementation using React Native's Linking API
        try {
          // Check if the URL can be opened - using the imported Linking
          const canOpen = await Linking.canOpenURL(url)

          if (canOpen) {
            // Open the URL directly in the browser or appropriate app
            await Linking.openURL(url)
            showToast("Archivo CSV generado. Abriéndolo...", "success")
            return true
          } else {
            showToast("No se puede abrir la URL para descargar el archivo", "error")
            return false
          }
        } catch (error) {
          console.error("Error al abrir URL:", error)
          showToast(
            `Error al abrir el archivo CSV: ${error instanceof Error ? error.message : "Error desconocido"}`,
            "error",
          )
          return false
        }
      }
    } catch (error) {
      console.error("Error al exportar:", error)
      showToast(
        `No se pudo generar el archivo CSV: ${error instanceof Error ? error.message : "Error desconocido"}`,
        "error",
      )
      return false
    }
  }

  // Update the exportEmployeeHistory function to handle errors better
  const exportEmployeeHistory = useCallback(
    async (employee: Usuario) => {
      try {
        showToast(`Exportando historial de ${employee.nombre}...`, "info")

        // Get date range for the export (last month)
        const today = new Date()
        const oneMonthAgo = new Date()
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

        const formattedStartDate = format(oneMonthAgo, "yyyy-MM-dd")
        const formattedEndDate = format(today, "yyyy-MM-dd")

        // Build URL for CSV export
        const csvUrl = `${API_URL}/export/excel.php?usuario_id=${employee.id}&fecha_inicio=${formattedStartDate}&fecha_fin=${formattedEndDate}`

        // Download the file
        const success = await downloadCSV(csvUrl, `historial_${employee.nombre}.csv`)

        if (!success) {
          showToast(`No se pudo exportar el historial de ${employee.nombre}`, "error")
        }
      } catch (error) {
        console.error("Error al exportar a CSV:", error)
        showToast(
          `Error al exportar historial: ${error instanceof Error ? error.message : "Error desconocido"}`,
          "error",
        )
      }
    },
    [API_URL, showToast],
  )

  // Handle employee selection - navigate to detail screen or show options
  const handleEmployeePress = useCallback(
    (employee: Usuario) => {
      // Format the employee data for the detail screen
      const employeeForDetail = {
        id: employee.id,
        nombre: employee.nombre,
        email: employee.email || `${employee.nombre.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        position: employee.position,
        department: employee.department,
        status_employee: employee.status_employee,
        phone: employee.phone || "+56 9 1234 5678",
      }

      // Use type-safe navigation
      // @ts-ignore - Ignoring type checking for navigation to avoid complex type setup
      navigation.navigate("EmployeeDetail", { employee: employeeForDetail })
    },
    [navigation],
  )

  // Update the handleExportAll function to handle errors better
  const handleExportAll = useCallback(async () => {
    // Show confirmation dialog based on platform
    if (Platform.OS === "web") {
      const confirmExport = window.confirm("¿Deseas exportar el historial de todos los empleados?")
      if (!confirmExport) return

      // Web export code
      try {
        showToast("Preparando exportación de todos los registros...", "info")

        // Get date range for the export (last month)
        const today = new Date()
        const oneMonthAgo = new Date()
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

        const formattedStartDate = format(oneMonthAgo, "yyyy-MM-dd")
        const formattedEndDate = format(today, "yyyy-MM-dd")

        // Build URL for CSV export (all employees)
        const csvUrl = `${API_URL}/export/excel.php?empresa_id=${user?.empresaId || user?.id}&fecha_inicio=${formattedStartDate}&fecha_fin=${formattedEndDate}`

        // Download the file
        const success = await downloadCSV(csvUrl, "historial_todos_empleados.csv")

        if (!success) {
          showToast("No se pudo completar la exportación de todos los registros", "error")
        }
      } catch (error) {
        console.error("Error al exportar a CSV:", error)
        showToast(
          `Error al exportar todos los registros: ${error instanceof Error ? error.message : "Error desconocido"}`,
          "error",
        )
      }
    } else {
      // For mobile, show a native alert
      Alert.alert("Exportar registros", "¿Deseas exportar el historial de todos los empleados?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Exportar",
          onPress: async () => {
            try {
              showToast("Preparando exportación de todos los registros...", "info")

              // Get date range for the export (last month)
              const today = new Date()
              const oneMonthAgo = new Date()
              oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

              const formattedStartDate = format(oneMonthAgo, "yyyy-MM-dd")
              const formattedEndDate = format(today, "yyyy-MM-dd")

              // Build URL for CSV export (all employees)
              const csvUrl = `${API_URL}/export/excel.php?empresa_id=${user?.empresaId || user?.id}&fecha_inicio=${formattedStartDate}&fecha_fin=${formattedEndDate}`

              // Download the file
              const success = await downloadCSV(csvUrl, "historial_todos_empleados.csv")

              if (!success) {
                showToast("No se pudo completar la exportación de todos los registros", "error")
              }
            } catch (error) {
              console.error("Error al exportar a CSV:", error)
              showToast(
                `Error al exportar todos los registros: ${error instanceof Error ? error.message : "Error desconocido"}`,
                "error",
              )
            }
          },
        },
      ])
    }
  }, [user, API_URL, showToast])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Empleados</Text>

        <View style={styles.searchContainer}>
             <Feather name="search" size={18}  color="#718096" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar empleado..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          <TouchableOpacity style={styles.filterButton} onPress={() => showToast("Filtros no disponibles aún", "info")}>
            <Feather name="filter" size={18}  color="#4C51BF" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{employees.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {employees.filter((e: Usuario) => e.status_employee === "present").length}
            </Text>
            <Text style={styles.statLabel}>Presentes</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {employees.filter((e: Usuario) => e.status_employee === "absent").length}
            </Text>
            <Text style={styles.statLabel}>Ausentes</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {employees.filter((e: Usuario) => e.status_employee === "lunch").length}
            </Text>
            <Text style={styles.statLabel}>Almorzando</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={filteredEmployees}
        keyExtractor={(item: Usuario) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.employeeCard} onPress={() => handleEmployeePress(item)}>
            <View style={styles.employeeAvatarContainer}>
              <Feather name="user" size={18}  color="#4C51BF" />
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
              <Feather name="chevron-right" size={18}  color="#A0AEC0" />
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
        <Feather name="download" size={18}  color="#FFFFFF" />
        <Text style={styles.exportAllButtonText}>Exportar todos los registros (CSV)</Text>
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

