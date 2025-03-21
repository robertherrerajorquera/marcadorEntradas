// Servicio centralizado para llamadas a la API PHP
// Cambia esta URL para que apunte a tu servidor local
const API_URL = "http://localhost/backendMarcadorEntradas/api"
//localhost
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
    role: string // Cambiado a string
    empresa_id?: string
    position?: string
    department?: string
    status_employee: string
  }
  token?: string
}

interface MarcajesResponse extends ApiResponse {
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
    role: string, // Cambiado a string
    empresa_id?: number,
    position?: string,
    department?: string,
    status_employee?:string,
  ): Promise<ApiResponse> {
    try {
      console.log("Enviando solicitud de registro a la API:", {
        nombre,
        email,
        role, // Ahora enviamos "employer" o "employee"
        empresa_id,
        position,
        department,
        status_employee
      })

      // Verificar que la URL sea correcta
      const url = `${API_URL}/usuarios/create.php`
      console.log("URL de registro:", url)

      const requestBody = {
        nombre,
        email,
        password,
        role, // Ahora enviamos "employer" o "employee"
        empresa_id,
        position,
        department,
        status_employee
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

  // Login de usuario
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      console.log("Enviando solicitud de login a la API:", { email })

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
      return data
    } catch (error) {
      return handleFetchError(error)
    }
  },
}

// Servicio de marcajes
export const marcajesService = {
  // Crear una nueva marcación
  async crearMarcaje(
    usuario_id: string,
    tipo: string, // "in", "out", "lunch-out", "lunch-in"
    latitud?: number,
    longitud?: number,
    photo_url?: string,
  ): Promise<MarcajesResponse> {
    try {
      console.log("Enviando solicitud de marcaje a la API:", {
        usuario_id,
        tipo,
        latitud,
        longitud,
      })

      const url = `${API_URL}/marcajes/create.php`
      console.log("URL de marcajes:", url)

      // Crear el cuerpo de la solicitud
      const requestBody = {
        usuario_id,
        tipo,
        latitud,
        longitud,
        photo_url,
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
}

