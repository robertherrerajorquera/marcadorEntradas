"use client"

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Home, Clock, User } from "react-native-feather"
import EmployeeHomeScreen from "../screens/employee/EmployeeHomeScreen"
import EmployeeProfileScreen from "../screens/employee/EmployeeProfileScreen"
import EmployeeHistoryScreen from "../screens/employee/EmployeeHistoryScreen"
import EmployeeEditProfileScreen from "../screens/employee/EmployeeEditProfileScreen"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

const Tab = createBottomTabNavigator()
const ProfileStack = createNativeStackNavigator()
const HistoryStack = createNativeStackNavigator()

// Nested stack para la sección de Perfil
const ProfileStackScreen = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={EmployeeProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EmployeeEditProfileScreen} />
    </ProfileStack.Navigator>
  )
}

// Nested stack para la sección de Historial
const HistoryStackScreen = () => {
  return (
    <HistoryStack.Navigator screenOptions={{ headerShown: false }}>
      <HistoryStack.Screen name="AttendanceHistory" component={EmployeeHistoryScreen} />
    </HistoryStack.Navigator>
  )
}

const EmployeeTabs = () => {
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
        component={EmployeeHomeScreen}
        options={{
          tabBarLabel: "Inicio",
          tabBarIcon: ({ color, size }) => <Home stroke={color} width={size} height={size} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryStackScreen}
        options={{
          tabBarLabel: "Historial",
          tabBarIcon: ({ color, size }) => <Clock stroke={color} width={size} height={size} />,
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

export default EmployeeTabs

