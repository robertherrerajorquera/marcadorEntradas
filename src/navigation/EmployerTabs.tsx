"use client"

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Home, Users, User } from "react-native-feather"
import EmployerHomeScreen from "../screens/employer/EmployerHomeScreen"
import EmployerEmployeesScreen from "../screens/employer/EmployerEmployeesScreen"
import EmployeeDetailScreen from "../screens/employer/EmployeeDetailScreen"
import EmployerProfileScreen from "../screens/employer/EmployerProfileScreen"
import EmployerEditEmployeeScreen from "../screens/employer/EmployerEditEmployeeScreen"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

const Tab = createBottomTabNavigator()
const EmployeeStack = createNativeStackNavigator()
const ProfileStack = createNativeStackNavigator()

// Tipos para los parámetros de navegación
export type EmployeeStackParamList = {
  EmployeesList: undefined
  EmployeeDetail: { employee: any }
  EditEmployee: { employee: any }
}

// Nested stack para la sección de Empleados
const EmployeeStackScreen = () => {
  return (
    <EmployeeStack.Navigator screenOptions={{ headerShown: false }}>
      <EmployeeStack.Screen name="EmployeesList" component={EmployerEmployeesScreen} />
      <EmployeeStack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} />
      <EmployeeStack.Screen name="EditEmployee" component={EmployerEditEmployeeScreen} />
    </EmployeeStack.Navigator>
  )
}

// Nested stack para la sección de Perfil
const ProfileStackScreen = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={EmployerProfileScreen} />
    </ProfileStack.Navigator>
  )
}

const EmployerTabs = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: "#4C51BF",
        tabBarInactiveTintColor: "#A0AEC0",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E2E8F0",
          paddingTop: 5,
          paddingBottom: 5,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={EmployerHomeScreen}
        options={{
          tabBarLabel: "Inicio",
          tabBarIcon: ({ color, size }) => <Home stroke={color} width={size} height={size} />,
        }}
      />
      <Tab.Screen
        name="Employees"
        component={EmployeeStackScreen}
        options={{
          tabBarLabel: "Empleados",
          tabBarIcon: ({ color, size }) => <Users stroke={color} width={size} height={size} />,
        }}
      />
      <Tab.Screen
        name="UserProfile"
        component={ProfileStackScreen}
        options={{
          tabBarLabel: "Perfil",
          tabBarIcon: ({ color, size }) => <User stroke={color} width={size} height={size} />,
        }}
      />
    </Tab.Navigator>
  )
}

export default EmployerTabs

