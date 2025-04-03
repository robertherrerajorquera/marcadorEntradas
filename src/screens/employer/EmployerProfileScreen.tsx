"use client"

import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native"
import { Feather } from "@expo/vector-icons"
import { useAuth } from "../../contexts/AuthContext"
import { useSimpleToast } from "../../contexts/SimpleToastContext"
import { useNavigation } from "@react-navigation/native"
import {Employee as usuario} from "../../types/index"

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

const EmployerProfileScreen = () => {
  const { logout, API_URL, user } = useAuth() 

  const { showToast } = useSimpleToast()
  const navigation = useNavigation()
  const [isLoading, setIsLoading] = useState(true)
  const [perfilData, setPerfilData] = useState<PerfilData | null>(null)

  // Cargar datos del perfil
  useEffect(() => {
    const cargarPerfil = async () => {
      if (!user?.id) return

      setIsLoading(true)
      try {
        console.log("Cargando perfil del empleador ID:", user.id)

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
      nombre:  "",
      direccion: "",
      telefono: "",
      email: ""
    },
  }

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
                <Feather name="user" size={40}  color="#FFFFFF" />
              </View>

              <Text style={styles.userName}>{displayData.nombre}</Text>
              <Text style={styles.userRole}>{displayData.role === "employer" ? "Empleador" : "Administrador"}</Text>

              <View style={styles.infoSection}>
                <View style={styles.infoItem}>
                  <Feather name="mail" size={18}  color="#4C51BF" />
                  <Text style={styles.infoText}>{displayData.email}</Text>
                </View>

                {displayData.phone && (
                  <View style={styles.infoItem}>
                    <Feather name="phone" size={18}  color="#4C51BF" />
                    <Text style={styles.infoText}>{displayData.phone}</Text>
                  </View>
                )}

                {displayData.position && (
                  <View style={styles.infoItem}>
                     <Feather name="briefcase" size={18}  color="#4C51BF" />
                    <Text style={styles.infoText}>{displayData.position}</Text>
                  </View>
                )}

                {displayData.rut && (
                  <View style={styles.infoItem}>
                     <Feather name="user" size={18}  color="#4C51BF" />
                    <Text style={styles.infoText}>RUT: {displayData.rut}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Tarjeta de información de la empresa */}
            <View style={styles.companyCard}>
              <Text style={styles.sectionTitle}>Información de la Empresa</Text>

              <View style={styles.infoItem}>
              <Feather name="briefcase" size={18}  color="#4C51BF" />
                <Text style={styles.infoText}>{displayData.empresa.nombre}</Text>
              </View>

              {displayData.empresa.direccion && (
                <View style={styles.infoItem}>
                    <Feather name="map-pin" size={18}  color="#4C51BF" />
                  <Text style={styles.infoText}>{displayData.empresa.direccion}</Text>
                </View>
              )}

              {displayData.empresa.telefono && (
                <View style={styles.infoItem}>
                   <Feather name="phone" size={18}  color="#4C51BF" />
                  <Text style={styles.infoText}>{displayData.empresa.telefono}</Text>
                </View>
              )}

              {displayData.empresa.email && (
                <View style={styles.infoItem}>
                    <Feather name="mail" size={18}  color="#4C51BF" />
                  <Text style={styles.infoText}>{displayData.empresa.email}</Text>
                </View>
              )}
            </View>

            {/* Botones de acción */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#4C51BF" }]}
                onPress={handleEditProfile}
              >
                  <Feather name="edit" size={18}  color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Editar Perfil</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#F56565" }]} onPress={handleLogout}>
              <Feather name="log-out" size={18}  color="#ffffff" />
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

export default EmployerProfileScreen

