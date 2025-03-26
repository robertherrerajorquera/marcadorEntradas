export type UserRole = "employee" | "employer";



export interface User {
  id: string
  nombre: string
  email: string
  role: UserRole
  employerId?: string // For employees, reference to their employer
  empresaId:number;
  status_employee?:string;
  rut:string;
  phone:string;
}

export type CheckType = "in" | "out" | "lunch-out" | "lunch-in"

export interface CheckRecord {
  id: string
  userId: string
  type: CheckType
  timestamp: Date
  location?: {
    latitude: number
    longitude: number
  }
  photoUrl?: string
  modified?: boolean
  modifiedBy?: string
  modifiedAt?: Date
}

export interface Employee {
  id: string
  nombre: string
  email: string
  position: string
  department: string
  status_employee: "present" | "absent" | "lunch" | "late"
  phone?: number;
}

