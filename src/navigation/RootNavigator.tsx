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

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        user.role === "employee" ? (
          <Stack.Screen name="EmployeeTabs" component={EmployeeTabs} />
        ) : (
          <Stack.Screen name="EmployerTabs" component={EmployerTabs} />
        )
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  )
}

export default RootNavigator

