"use client"

import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform } from "react-native"
import { User, LogOut, Settings, Bell, Shield, Users, Briefcase } from "react-native-feather"
import { useAuth } from "../../contexts/AuthContext"
import { useSimpleToast } from "../../contexts/SimpleToastContext"

const EmployerProfileScreen = () => {
  const { user, logout } = useAuth()
  const { showToast } = useSimpleToast()

  const handleLogout = async () => {
    try {
      // Show confirmation dialog on web
      if (Platform.OS === "web") {
        if (!window.confirm("¿Estás seguro que deseas cerrar sesión?")) {
          return
        }
      }

      showToast("Cerrando sesión...", "info")
      await logout()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      showToast("Error al cerrar sesión", "danger")
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Image source={{ uri: "https://via.placeholder.com/150" }} style={styles.profileImage} />
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>Empleador</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de la Empresa</Text>

        <View style={styles.infoItem}>
          <Briefcase stroke="#4C51BF" width={20} height={20} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Nombre de la Empresa</Text>
            <Text style={styles.infoValue}>Empresa Demo S.A.</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Users stroke="#4C51BF" width={20} height={20} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Empleados</Text>
            <Text style={styles.infoValue}>8 empleados</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <User stroke="#4C51BF" width={20} height={20} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>ID de Empleador</Text>
            <Text style={styles.infoValue}>{user?.id}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuración</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Bell stroke="#4A5568" width={20} height={20} />
          <Text style={styles.menuItemText}>Notificaciones</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Shield stroke="#4A5568" width={20} height={20} />
          <Text style={styles.menuItemText}>Seguridad y Acceso</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Settings stroke="#4A5568" width={20} height={20} />
          <Text style={styles.menuItemText}>Configuración de la Empresa</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut stroke="#FFFFFF" width={20} height={20} />
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    overflow: "hidden",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2D3748",
  },
  email: {
    fontSize: 16,
    color: "#4A5568",
    marginTop: 5,
  },
  role: {
    fontSize: 14,
    color: "#FFFFFF",
    backgroundColor: "#4C51BF",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 15,
    marginTop: 10,
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    marginTop: 20,
    borderRadius: 10,
    marginHorizontal: 15,
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
    marginBottom: 15,
  },
  infoItem: {
    flexDirection: "row",
    marginBottom: 15,
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#718096",
  },
  infoValue: {
    fontSize: 16,
    color: "#2D3748",
    fontWeight: "500",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: "#4A5568",
  },
  logoutButton: {
    backgroundColor: "#E53E3E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 15,
    marginVertical: 30,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
})

export default EmployerProfileScreen

