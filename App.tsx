import React from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/contexts/AuthContext";
import { SimpleToastProvider } from "./src/contexts/SimpleToastContext";
import RootNavigator from "./src/navigation/RootNavigator";
import { StatusBar, Platform } from "react-native";

// Componente Toast nativo (solo se carga en nativo)


const App = () => {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AuthProvider>
        <SimpleToastProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
        </SimpleToastProvider>
      </AuthProvider>
      {/* Renderizar el componente Toast nativo al final de la app */}
     
    </SafeAreaProvider>
  );
}

export default App;