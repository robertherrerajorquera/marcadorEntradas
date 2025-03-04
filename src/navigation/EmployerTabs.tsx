import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Users, Clock, User } from "react-native-feather"
import EmployerHomeScreen from "../screens/employer/EmployerHomeScreen"
import EmployerEmployeesScreen from "../screens/employer/EmployerEmployeesScreen"
import EmployerProfileScreen from "../screens/employer/EmployerProfileScreen"

const Tab = createBottomTabNavigator()

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
        component={EmployerEmployeesScreen}
        options={{
          title: "Empleados",
          tabBarIcon: ({ color, size }) => <Users stroke={color} width={size} height={size} />,
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

