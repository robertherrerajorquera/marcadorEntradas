"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform } from "react-native"
import { Calendar, Clock, MapPin, ChevronDown, ChevronUp, Download, AlertTriangle } from "react-native-feather"
import { useAuth } from "../../contexts/AuthContext"
import { useSimpleToast } from "../../contexts/SimpleToastContext"
import { format, parseISO, isToday, isYesterday, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"

// Tipo para los registros de marcaje
interface Marcaje {
  id: string
  usuario_id: string
  tipo: string
  timestamp: string
  fecha: string
  hora: string
  latitud: number
  longitud: number
  photo_url: string | null
  modified: number
  modified_by: string | null
  modified_by_name: string | null
  modified_at: string | null
  created_at: string
}

// Tipo para los datos agrupados por fecha
interface MarcajesPorFecha {
  fecha: string
  data: Marcaje[]
}

const EmployeeHistoryScreen = () => {
  const { user, API_URL } = useAuth()
  const { showToast } = useSimpleToast()
  const [isLoading, setIsLoading] = useState(true)
  const [marcajes, setMarcajes] = useState<Marcaje[]>([])
  const [marcajesPorFecha, setMarcajesPorFecha] = useState<MarcajesPorFecha[]>([])
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({})
  const [filtroMes, setFiltroMes] = useState<Date>(new Date())

  // Cargar historial de marcajes
  useEffect(() => {
    const cargarHistorial = async () => {
      if (!user?.id) return

      setIsLoading(true)
      try {
        // Calcular fechas del mes seleccionado
        const inicio = format(startOfMonth(filtroMes), "yyyy-MM-dd")
        const fin = format(endOfMonth(filtroMes), "yyyy-MM-dd")

        console.log(`Cargando historial para usuario ${user.id} desde ${inicio} hasta ${fin}`)

        const url = `${API_URL}/marcajes/historial.php?usuario_id=${user.id}&fecha_inicio=${inicio}&fecha_fin=${fin}`
        console.log("URL de solicitud:", url)

        const response = await fetch(url)

        // Verificar si la respuesta es JSON válido
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text()
          console.error("Respuesta no es JSON:", text)
          showToast("Error en la respuesta del servidor", "error")
          setIsLoading(false)
          return
        }

        const data = await response.json()

        console.log(`Respuesta de historial: ${data.records?.length || 0} registros`)

        if (response.ok && data.records) {
          setMarcajes(data.records)

          // Agrupar marcajes por fecha
          const marcajesAgrupados = agruparPorFecha(data.records)
          setMarcajesPorFecha(marcajesAgrupados)

          // Expandir automáticamente el día actual y ayer
          const fechasExpandidas: Record<string, boolean> = {}
          marcajesAgrupados.forEach((grupo) => {
            const fecha = parseISO(grupo.fecha)
            if (isToday(fecha) || isYesterday(fecha)) {
              fechasExpandidas[grupo.fecha] = true
            }
          })
          setExpandedDates(fechasExpandidas)

          if (data.records.length === 0) {
            showToast("No se encontraron registros para el período seleccionado", "info")
          }
        } else {
          console.error("Error al cargar historial:", data.error)
          showToast("No se pudo cargar el historial de marcajes", "error")
          setMarcajes([])
          setMarcajesPorFecha([])
        }
      } catch (error) {
        console.error("Error al cargar historial:", error)
        showToast("Error al cargar el historial", "error")
        setMarcajes([])
        setMarcajesPorFecha([])
      } finally {
        setIsLoading(false)
      }
    }

    cargarHistorial()
  }, [user?.id, API_URL, showToast, filtroMes])

  // Agrupar marcajes por fecha
  const agruparPorFecha = (marcajes: Marcaje[]): MarcajesPorFecha[] => {
    const grupos: Record<string, Marcaje[]> = {}

    marcajes.forEach((marcaje) => {
      const fecha = marcaje.fecha
      if (!grupos[fecha]) {
        grupos[fecha] = []
      }
      grupos[fecha].push(marcaje)
    })

    // Convertir a array y ordenar por fecha (más reciente primero)
    return Object.keys(grupos)
      .map((fecha) => ({ fecha, data: grupos[fecha] }))
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }

  // Formatear tipo de marcación
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

  // Formatear fecha para mostrar
  const formatearFecha = (fechaStr: string): string => {
    const fecha = parseISO(fechaStr)

    if (isToday(fecha)) {
      return "Hoy"
    } else if (isYesterday(fecha)) {
      return "Ayer"
    } else {
      return format(fecha, "EEEE d 'de' MMMM", { locale: es })
    }
  }

  // Alternar expansión de una fecha
  const toggleExpanded = (fecha: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [fecha]: !prev[fecha],
    }))
  }

  // Cambiar al mes anterior
  const mesAnterior = () => {
    setFiltroMes((prev) => {
      const nuevaFecha = new Date(prev)
      nuevaFecha.setMonth(prev.getMonth() - 1)
      return nuevaFecha
    })
  }

  // Cambiar al mes siguiente
  const mesSiguiente = () => {
    const hoy = new Date()
    setFiltroMes((prev) => {
      const nuevaFecha = new Date(prev)
      nuevaFecha.setMonth(prev.getMonth() + 1)

      // No permitir seleccionar meses futuros
      if (nuevaFecha > hoy) {
        return prev
      }
      return nuevaFecha
    })
  }



  // Renderizar encabezado de grupo (fecha)
  const renderHeader = ({ fecha }: { fecha: string }) => {
    const isExpanded = expandedDates[fecha] || false

    return (
      <TouchableOpacity style={styles.dateHeader} onPress={() => toggleExpanded(fecha)}>
        <View style={styles.dateHeaderLeft}>
          <Calendar stroke="#4C51BF" width={20} height={20} />
          <Text style={styles.dateHeaderText}>{formatearFecha(fecha)}</Text>
        </View>

        {isExpanded ? (
          <ChevronUp stroke="#718096" width={20} height={20} />
        ) : (
          <ChevronDown stroke="#718096" width={20} height={20} />
        )}
      </TouchableOpacity>
    )
  }

  // Renderizar item de marcaje
  const renderMarcaje = (marcaje: Marcaje) => {
    return (
      <View style={styles.marcajeItem}>
        <View style={styles.marcajeHeader}>
          <View style={styles.marcajeTypeContainer}>
            <Clock stroke="#4C51BF" width={16} height={16} />
            <Text style={styles.marcajeType}>{formatTipoMarcacion(marcaje.tipo)}</Text>
          </View>
          <Text style={styles.marcajeTime}>{marcaje.hora.substring(0, 5)}</Text>
        </View>

        {marcaje.latitud && marcaje.longitud && (
          <TouchableOpacity
            style={styles.locationContainer}
            onPress={() => {
              const url = `https://www.google.com/maps?q=${marcaje.latitud},${marcaje.longitud}`
              if (Platform.OS === "web") {
                window.open(url, "_blank")
              } else {
                const Linking = require("react-native").Linking
                Linking.openURL(url)
              }
            }}
          >
            <MapPin stroke="#718096" width={14} height={14} />
            <Text style={styles.locationText}>Ver ubicación</Text>
          </TouchableOpacity>
        )}

        {/* Mostrar información de modificación si el marcaje fue modificado */}
        {marcaje.modified === 1 && (
          <View style={styles.modifiedContainer}>
            <AlertTriangle stroke="#ED8936" width={14} height={14} />
            <Text style={styles.modifiedText}>
              Modificado por {marcaje.modified_by_name || "Administrador"}
              {marcaje.modified_at && ` el ${format(new Date(marcaje.modified_at), "dd/MM/yyyy HH:mm")}`}
            </Text>
          </View>
        )}
      </View>
    )
  }

  // Renderizar grupo de marcajes por fecha
  const renderGroup = ({ item }: { item: MarcajesPorFecha }) => {
    const isExpanded = expandedDates[item.fecha] || false

    return (
      <View style={styles.dateGroup}>
        {renderHeader({ fecha: item.fecha })}

        {isExpanded && (
          <View style={styles.marcajesContainer}>
            {item.data.map((marcaje) => (
              <View key={marcaje.id}>{renderMarcaje(marcaje)}</View>
            ))}
          </View>
        )}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Encabezado con filtro de mes */}
      <View style={styles.header}>
        <Text style={styles.title}>Historial de Marcajes</Text>

        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={mesAnterior} style={styles.monthButton}>
            <ChevronDown stroke="#4C51BF" width={24} height={24} style={{ transform: [{ rotate: "90deg" }] }} />
          </TouchableOpacity>

          <Text style={styles.monthText}>{format(filtroMes, "MMMM yyyy", { locale: es })}</Text>

          <TouchableOpacity
            onPress={mesSiguiente}
            style={styles.monthButton}
            disabled={
              filtroMes.getMonth() === new Date().getMonth() && filtroMes.getFullYear() === new Date().getFullYear()
            }
          >
            <ChevronDown
              stroke={
                filtroMes.getMonth() === new Date().getMonth() && filtroMes.getFullYear() === new Date().getFullYear()
                  ? "#A0AEC0"
                  : "#4C51BF"
              }
              width={24}
              height={24}
              style={{ transform: [{ rotate: "-90deg" }] }}
            />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4C51BF" />
          <Text style={styles.loadingText}>Cargando historial...</Text>
        </View>
      ) : (
        <>
          {marcajesPorFecha.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Calendar stroke="#A0AEC0" width={48} height={48} />
              <Text style={styles.emptyText}>No hay registros para este período</Text>
              <Text style={styles.emptySubtext}>Prueba seleccionando otro mes</Text>
            </View>
          ) : (
            <FlatList
              data={marcajesPorFecha}
              renderItem={renderGroup}
              keyExtractor={(item) => item.fecha}
              contentContainerStyle={styles.listContainer}
            />
          )}


        </>
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
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D3748",
    marginBottom: 12,
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4A5568",
    marginHorizontal: 12,
    textTransform: "capitalize",
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
  listContainer: {
    padding: 16,
  },
  dateGroup: {
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  dateHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateHeaderText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3748",
    marginLeft: 12,
    textTransform: "capitalize",
  },
  marcajesContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  marcajeItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  marcajeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  marcajeTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  marcajeType: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
    color: "#2D3748",
  },
  marcajeTime: {
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
    color: "#4C51BF",
    textDecorationLine: "underline",
  },
  modifiedContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#FFFBEB",
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  modifiedText: {
    fontSize: 12,
    color: "#C05621",
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#4A5568",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#718096",
    marginTop: 8,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4C51BF",
    padding: 16,
    borderRadius: 8,
    margin: 16,
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
})

export default EmployeeHistoryScreen

 