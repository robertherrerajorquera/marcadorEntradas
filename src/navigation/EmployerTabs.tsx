import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { Users, Clock, User } from "react-native-feather"
import EmployerHomeScreen from "../screens/employer/EmployerHomeScreen"
import EmployerEmployeesScreen from "../screens/employer/EmployerEmployeesScreen"
import EmployerProfileScreen from "../screens/employer/EmployerProfileScreen"
import EmployeeDetailScreen from "../screens/employer/EmployeeDetailScreen"

// Define the types for the employee stack navigator
export type EmployeeStackParamList = {
  EmployeesList: undefined
  EmployeeDetail: {
    employee: {
      id: string
      name: string
      email: string
      position: string
      department: string
      status_employee: string
      phone?: string
    }
  }
}

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator<EmployeeStackParamList>()

// Componente para la pestaña de Empleados con navegación anidada
const EmployeesStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EmployeesList" component={EmployerEmployeesScreen} />
      <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />
    </Stack.Navigator>
  )
}

const EmployerTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#4C51BF",
        tabBarInactiveTintColor: "#A0AEC0",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#E2E8F0",
          paddingTop: 5,
          paddingBottom: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: "#4C51BF",
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={EmployerHomeScreen}
        options={{
          title: "Resumen",
          tabBarIcon: ({ color, size }) => <Clock stroke={color} width={size} height={size} />,
        }}
      />
      <Tab.Screen
        name="Employees"
        component={EmployeesStack}
        options={{
          title: "Empleados",
          tabBarIcon: ({ color, size }) => <Users stroke={color} width={size} height={size} />,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={EmployerProfileScreen}
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <User stroke={color} width={size} height={size} />,
        }}
      />
    </Tab.Navigator>
  )
}

export default EmployerTabs

