

import { useEffect } from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useAuth } from "../contexts/AuthContext"
import LoginScreen from "../screens/auth/LoginScreen"
import RegisterScreen from "../screens/auth/RegisterScreen"
import EmployeeTabs from "./EmployeeTabs"
import EmployerTabs from "./EmployerTabs"
import LoadingScreen from "../screens/LoadingScreen"

const Stack = createNativeStackNavigator()

const RootNavigator = () => {
  const { user, loading } = useAuth()

  // Log navigation state for debugging
  useEffect(() => {
    console.log("RootNavigator - Auth state:", {
      isAuthenticated: !!user,
      userName: user?.nombre,
      role: user?.role,
      loading,
    })
  }, [user, loading])

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // User is authenticated
        user.role === "employee" ? (
          // Employee role
          <Stack.Screen name="EmployeeTabs" component={EmployeeTabs} />
        ) : (
          // Employer role
          <Stack.Screen name="EmployerTabs" component={EmployerTabs} />
        )
      ) : (
        // User is not authenticated
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  )
}

export default RootNavigator

