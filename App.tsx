import { NavigationContainer } from "@react-navigation/native"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { AuthProvider } from "./src/contexts/AuthContext"
import { SimpleToastProvider } from "./src/contexts/SimpleToastContext"
import RootNavigator from "./src/navigation/RootNavigator"
import { StatusBar } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SessionProvider } from "./src/contexts/SessionContext"
import SessionModalManager from "./src/components/SessionModalManager"

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <AuthProvider>
          <SimpleToastProvider>
          <SessionProvider>
            <NavigationContainer>
              <RootNavigator />
              <SessionModalManager />
            </NavigationContainer>
            </SessionProvider>
          </SimpleToastProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default App

