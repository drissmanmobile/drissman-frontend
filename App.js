// App.js
import 'react-native-url-polyfill/auto'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from './src/context/AuthContext'
import { ThemeProvider } from './src/context/ThemeContext'
import { SideMenuProvider } from './src/context/SideMenuContext'
import AppNavigator from './src/navigation/index'
import OfflineBanner from './src/components/ui/OfflineBanner'
import './src/i18n/index' // Import i18n configuration

import { LogBox } from 'react-native'

LogBox.ignoreLogs([
  "Passing an object as the argument to 'navigate' is deprecated",
])

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <SideMenuProvider>
            <AppNavigator />
            <OfflineBanner />
            <StatusBar style="auto" />
          </SideMenuProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

