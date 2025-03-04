import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Home, Clock, User } from "react-native-feather"
import EmployeeHomeScreen from "../screens/employee/EmployeeHomeScreen"
import EmployeeHistoryScreen from "../screens/employee/EmployeeHistoryScreen"
import EmployeeProfileScreen from "../screens/employee/EmployeeProfileScreen"

const Tab = createBottomTabNavigator()

const EmployeeTabs = () => {
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
        component={EmployeeHomeScreen}
        options={{
          title: "Marcar",
          tabBarIcon: ({ color, size }) => <Clock stroke={color} width={size} height={size} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={EmployeeHistoryScreen}
        options={{
          title: "Historial",
          tabBarIcon: ({ color, size }) => <Home stroke={color} width={size} height={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={EmployeeProfileScreen}
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <User stroke={color} width={size} height={size} />,
        }}
      />
    </Tab.Navigator>
  )
}

export default EmployeeTabs

