// Servicio centralizado para llamadas a la API PHP
// Cambia esta URL para que apunte a tu servidor local
import { Platform } from "react-native"

// Get the appropriate API URL based on platform
const getApiUrl = () => {
  if (Platform.OS === "android") {
    return "http://192.168.4.21/backendMarcadorEntradas/api"
  } else if (Platform.OS === "ios") {
    return "http://192.168.4.21/backendMarcadorEntradas/api"
  } else {
    // Para web, usar una URL relativa o absoluta según la configuración del servidor
   // const baseUrl = window.location.origin
    const baseUrl ="http://192.168.4.21";
    return `${baseUrl}/backendMarcadorEntradas/api`;
  }
}

const API_URL = getApiUrl()
console.log(`Using API URL for ${Platform.OS}:`, API_URL)

// Interfaces para las respuestas de la API
interface ApiResponse {
  message: string
  error?: string
}

interface LoginResponse extends ApiResponse {
  user?: {
    id: string
    nombre: string
    email: string
    role: string
    empresa_id?: string
    position?: string
    department?: string
    rut?: string
    phone?: string
  }
  token?: string
}

interface MarcacionResponse extends ApiResponse {
  id?: string
  timestamp?: string
}

// Función para manejar errores de fetch
const handleFetchError = (error: any): ApiResponse => {
  console.error("Error en la llamada a la API:", error)
  return {
    message: "Error de conexión. Por favor, intenta nuevamente.",
    error: error.message,
  }
}

// Función para procesar respuestas de la API de manera segura
const safelyParseResponse = async (response: Response): Promise<any> => {
  try {
    const text = await response.text()
    console.log("Respuesta en texto plano:", text.substring(0, 200) + (text.length > 200 ? "..." : ""))

    try {
      return JSON.parse(text)
    } catch (e) {
      console.error("Error al parsear JSON:", e)
      console.error("Contenido de la respuesta:", text)
      return {
        message: "Error en la respuesta del servidor. No es un JSON válido.",
        error: "INVALID_JSON_RESPONSE",
        rawResponse: text,
      }
    }
  } catch (e) {
    console.error("Error al leer la respuesta:", e)
    return {
      message: "Error al leer la respuesta del servidor.",
      error: "RESPONSE_READ_ERROR",
    }
  }
}

// Servicio de autenticación
export const authService = {
  // Registro de usuario
  async register(
    nombre: string,
    email: string,
    password: string,
    role: string,
    empresa_id?: string,
    position?: string,
    department?: string,
    rut?: string,
    phone?: string,
  ): Promise<ApiResponse> {
    try {
      console.log("Enviando solicitud de registro a la API:", {
        nombre,
        email,
        role,
        empresa_id,
        position,
        department,
        rut,
        phone,
      })

      // Verificar que la URL sea correcta
      const url = `${API_URL}/usuarios/create.php`
      console.log("URL de registro:", url)

      const requestBody = {
        nombre,
        email,
        password,
        role,
        empresa_id,
        position,
        department,
        rut,
        phone,
      }

      console.log("Cuerpo de la solicitud:", JSON.stringify(requestBody))

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("Código de estado HTTP:", response.status)
      console.log("Headers de respuesta:", Object.fromEntries(response.headers.entries()))

      const data = await safelyParseResponse(response)
      console.log("Respuesta procesada:", data)

      return data
    } catch (error) {
      return handleFetchError(error)
    }
  },

  // Login de usuario con email
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      console.log("Enviando solicitud de login con email a la API:", { email })

      const url = `${API_URL}/usuarios/login.php`
      console.log("URL de login:", url)

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      console.log("Código de estado HTTP:", response.status)
      const data = await safelyParseResponse(response)
      console.log("Respuesta de la API (login):", data)

      // Asegurarse de que el rol sea un string
      if (data.user && data.user.role !== undefined) {
        data.user.role = String(data.user.role).trim()
        console.log("Rol del usuario (normalizado):", data.user.role)
      }

      return data
    } catch (error) {
      return handleFetchError(error)
    }
  },

  // Login de usuario con RUT
  async loginWithRut(rut: string, password: string, isQrLogin = false): Promise<LoginResponse> {
    try {
      console.log("Enviando solicitud de login con RUT a la API:", { rut, isQrLogin })

      // Si es login por QR, usamos un endpoint diferente que no requiere contraseña
      const endpoint = isQrLogin ? "login_rut_qr.php" : "login_rut.php"
      const url = `${API_URL}/usuarios/${endpoint}`
      console.log("URL de login con RUT:", url)

      const requestBody = isQrLogin
        ? { rut } // Solo enviamos el RUT para login por QR
        : { rut, password } // Enviamos RUT y contraseña para login normal

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("Código de estado HTTP:", response.status)
      const data = await safelyParseResponse(response)
      console.log("Respuesta de la API (login con RUT):", data)

      // Asegurarse de que el rol sea un string
      if (data.user && data.user.role !== undefined) {
        data.user.role = String(data.user.role).trim()
        console.log("Rol del usuario (normalizado):", data.user.role)
      }

      return data
    } catch (error) {
      return handleFetchError(error)
    }
  },

  // Login with QR code
  async loginWithQr(email: string, token: string): Promise<LoginResponse> {
    try {
      console.log("Sending QR login request to API:", { email, token })

      const url = `${API_URL}/usuarios/login_qr.php`
      console.log("QR login URL:", url)

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          token,
        }),
      })

      console.log("HTTP status code:", response.status)
      const data = await safelyParseResponse(response)
      console.log("API response (QR login):", data)

      // Asegurarse de que el rol sea un string
      if (data.user && data.user.role !== undefined) {
        data.user.role = String(data.user.role).trim()
        console.log("Rol del usuario (normalizado):", data.user.role)
      }

      return data
    } catch (error) {
      return handleFetchError(error)
    }
  },
}

// Cambiar el nombre del servicio de marcacionesService a markajesService
export const marcajesService = {
  // Crear una nueva marcación
  async crearMarcaje(
    usuario_id: string,
    tipo: string, // "in", "out", "lunch-out", "lunch-in"
    latitud?: number,
    longitud?: number,
    foto_url?: string,
    timestamp?: string, // Añadir parámetro timestamp
  ): Promise<MarcacionResponse> {
    try {
      console.log("Enviando solicitud de marcaje a la API:", {
        usuario_id,
        tipo,
        latitud,
        longitud,
      })

      const url = `${API_URL}/marcajes/create.php`
      console.log("URL de marcaje:", url)

      // Crear el cuerpo de la solicitud con los nombres de parámetros correctos
      const requestBody = {
        usuario_id,
        tipo,
        latitud,
        longitud,
        foto_url,
        timestamp, // Incluir timestamp en la solicitud
      }

      console.log("Cuerpo de la solicitud:", JSON.stringify(requestBody))

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("Código de estado HTTP:", response.status)
      console.log("Headers de respuesta:", Object.fromEntries(response.headers.entries()))

      const data = await safelyParseResponse(response)
      console.log("Respuesta de la API (marcaje):", data)

      // Si no hay un error explícito pero tampoco hay confirmación, considerarlo un error
      if (!data.id && !data.message && !data.error) {
        console.error("Respuesta de API incompleta:", data)
        return {
          message: "La respuesta del servidor no contiene la información esperada",
          error: "INCOMPLETE_RESPONSE",
        }
      }

      return data
    } catch (error) {
      return handleFetchError(error)
    }
  },

  // Obtener historial de marcajes
  async obtenerHistorial(usuario_id: string, fecha_inicio: string, fecha_fin: string): Promise<ApiResponse> {
    try {
      console.log("Solicitando historial de marcajes:", {
        usuario_id,
        fecha_inicio,
        fecha_fin,
      })

      const url = `${API_URL}/marcajes/read.php?usuario_id=${usuario_id}&fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`
      console.log("URL de historial:", url)

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      })

      const data = await safelyParseResponse(response)
      console.log("Respuesta de la API (historial):", data)
      return data
    } catch (error) {
      return handleFetchError(error)
    }
  },
}

// Servicio de empleados
export const empleadosService = {
  // Obtener empleados por empresa
  async obtenerEmpleadosPorEmpresa(empresa_id: string): Promise<ApiResponse> {
    try {
      console.log("Solicitando empleados de la empresa:", empresa_id)

      const url = `${API_URL}/usuarios/read_by_empresa.php?empresa_id=${empresa_id}`
      console.log("URL de empleados:", url)

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      })

      const data = await safelyParseResponse(response)
      console.log("Respuesta de la API (empleados):", data)
      return data
    } catch (error) {
      return handleFetchError(error)
    }
  },

  // Actualizar el estado de un empleado
  async actualizarEstadoEmpleado(id: string, status: string): Promise<ApiResponse> {
    try {
      console.log("Actualizando estado del empleado:", { id, status })

      const url = `${API_URL}/usuarios/update_status.php`
      console.log("URL de actualización de estado:", url)

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          id,
          status_employee: status,
        }),
      })

      const data = await safelyParseResponse(response)
      console.log("Respuesta de la API (actualización de estado):", data)
      return data
    } catch (error) {
      return handleFetchError(error)
    }
  },
}

// Asegurarse de que el servicio de empresas esté correctamente implementado
// Servicio de empresas
export const empresasService = {
  // Obtener todas las empresas
  async obtenerEmpresas(): Promise<ApiResponse> {
    try {
      console.log("Solicitando lista de empresas")

      const url = `${API_URL}/empresas/read.php`
      console.log("URL de empresas:", url)

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      })

      const data = await safelyParseResponse(response)
      console.log("Respuesta de la API (empresas):", data)
      return data
    } catch (error) {
      return handleFetchError(error)
    }
  },
}

