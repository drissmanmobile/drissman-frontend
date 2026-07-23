// src/navigation/index.js
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import SideMenu from '../components/ui/SideMenu'

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen'
import RegisterScreen from '../screens/auth/RegisterScreen'
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen'

// Settings removed - managed via modal

// Student screens
import StudentHomeScreen from '../screens/student/HomeScreen'
import StudentDashboardScreen from '../screens/student/StudentDashboardScreen'
import StudentPlanningScreen from '../screens/student/PlanningScreen'
import StudentBookingsScreen from '../screens/student/BookingsScreen'
import StudentProgressScreen from '../screens/student/ProgressScreen'
import StudentProfileScreen from '../screens/student/ProfileScreen'
import StudentQuizScreen from '../screens/student/StudentQuizScreen'
import StudentNotificationsScreen from '../screens/student/StudentNotificationsScreen'
import StudentPaymentsScreen from '../screens/student/StudentPaymentsScreen'
import StudentDocumentsScreen from '../screens/student/StudentDocumentsScreen'
import StudentMessagesScreen from '../screens/student/StudentMessagesScreen'
// Admin screens
import AdminDashboardScreen from '../screens/admin/DashboardScreen'
import AdminOffersScreen from '../screens/admin/OffersScreen'
import AdminInstructorsScreen from '../screens/admin/InstructorsScreen'
import AdminPlanningScreen from '../screens/admin/PlanningScreen'
import AdminProfileScreen from '../screens/admin/ProfileScreen'
import AdminModulesScreen from '../screens/admin/ModulesScreen'

// Instructor screens
import InstructorDashboardScreen from '../screens/instructor/InstructorDashboardScreen'
import InstructorScheduleScreen from '../screens/instructor/ScheduleScreen'
import InstructorStudentsScreen from '../screens/instructor/StudentsScreen'
import InstructorStudentDetailScreen from '../screens/instructor/StudentDetailScreen'
import InstructorStatsScreen from '../screens/instructor/InstructorStatsScreen'
import InstructorMessagesScreen from '../screens/instructor/MessagesScreen'
import InstructorProfileScreen from '../screens/instructor/ProfileScreen'
import InstructorDocumentsScreen from '../screens/instructor/InstructorDocumentsScreen'

// Schools screens
import SchoolsListScreen from '../screens/schools/SchoolsListScreen'
import SchoolDetailScreen from '../screens/schools/SchoolDetailScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function TabIcon({ name, focused, colors }) {
  return <Ionicons name={name} size={22} color={focused ? colors.primary : colors.textMuted} />
}

// Navigation pour VISITOR
function VisitorTabs({ colors }) {
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { ...styles.tabBar, backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="VisitorHome"
        component={StudentHomeScreen}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} colors={colors} />,
        }}
      />
      <Tab.Screen
        name="VisitorProfile"
        component={StudentProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} colors={colors} />,
        }}
      />
    </Tab.Navigator>
  )
}

// Navigation pour STUDENT
function StudentTabs({ colors }) {
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { ...styles.tabBar, backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="StudentHome"
        component={StudentDashboardScreen}
        options={{
          tabBarLabel: 'Tableau de bord',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} colors={colors} />,
        }}
      />
      <Tab.Screen
        name="StudentExplore"
        component={StudentHomeScreen}
        options={{
          tabBarLabel: 'Explorer',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'search' : 'search-outline'} focused={focused} colors={colors} />,
        }}
      />
      <Tab.Screen
        name="StudentPlanning"
        component={StudentPlanningScreen}
        options={{
          tabBarLabel: 'Planning',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} colors={colors} />,
        }}
      />
      <Tab.Screen
        name="StudentProgress"
        component={StudentProgressScreen}
        options={{
          tabBarLabel: 'Progression',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'trending-up' : 'trending-up-outline'} focused={focused} colors={colors} />,
        }}
      />
      <Tab.Screen
        name="StudentProfile"
        component={StudentProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} colors={colors} />,
        }}
      />
    </Tab.Navigator>
  )
}

// Navigation pour SCHOOL_ADMIN
function AdminTabs({ colors }) {
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { ...styles.tabBar, backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          tabBarLabel: 'Tableau de bord',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} colors={colors} />,
        }}
      />
      <Tab.Screen
        name="AdminOffers"
        component={AdminOffersScreen}
        options={{
          tabBarLabel: 'Offres',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'pricetag' : 'pricetag-outline'} focused={focused} colors={colors} />,
        }}
      />
      <Tab.Screen
        name="AdminInstructors"
        component={AdminInstructorsScreen}
        options={{
          tabBarLabel: 'Moniteurs',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'people' : 'people-outline'} focused={focused} colors={colors} />,
        }}
      />
      <Tab.Screen
        name="AdminPlanning"
        component={AdminPlanningScreen}
        options={{
          tabBarLabel: 'Planning',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} colors={colors} />,
        }}
      />
      <Tab.Screen
        name="AdminProfile"
        component={AdminProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} colors={colors} />,
        }}
      />
    </Tab.Navigator>
  )
}

// Navigation pour MONITOR / INSTRUCTOR
function InstructorTabs({ colors }) {
  const insets = useSafeAreaInsets();
  const styles = getStyles(colors, insets);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { ...styles.tabBar, backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="InstructorDashboard"
        component={InstructorDashboardScreen}
        options={{
          tabBarLabel: 'Accueil',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} colors={colors} />,
        }}
      />
      <Tab.Screen
        name="InstructorStudents"
        component={InstructorStudentsScreen}
        options={{
          tabBarLabel: 'Élèves',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'people' : 'people-outline'} focused={focused} colors={colors} />,
        }}
      />
      <Tab.Screen
        name="InstructorSchedule"
        component={InstructorScheduleScreen}
        options={{
          tabBarLabel: 'Planning',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} colors={colors} />,
        }}
      />
      <Tab.Screen
        name="InstructorMessages"
        component={InstructorMessagesScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'chatbubbles' : 'chatbubbles-outline'} focused={focused} colors={colors} />,
        }}
      />
      <Tab.Screen
        name="InstructorProfile"
        component={InstructorProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} colors={colors} />,
        }}
      />
    </Tab.Navigator>
  )
}

// Sélecteur de navigation selon rôle
function AppTabs({ role, colors }) {
  if (role === 'SCHOOL_ADMIN' || role === 'SUPER_ADMIN') return <AdminTabs colors={colors} />
  if (role === 'MONITOR') return <InstructorTabs colors={colors} />
  if (role === 'STUDENT') return <StudentTabs colors={colors} />
  return <VisitorTabs colors={colors} /> // VISITOR par défaut
}

// Root Navigator
export default function AppNavigator() {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors, { bottom: 0 }); // Fallback for loading state where insets might not matter
  const { isAuthenticated, user, loading } = useAuth()
  usePushNotifications(isAuthenticated)

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <SideMenu />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen 
              name="GuestSchoolsList" 
              component={SchoolsListScreen} 
              options={{ headerShown: true, title: 'Rechercher une auto-école', headerBackTitle: 'Retour' }} 
            />
            <Stack.Screen 
              name="GuestSchoolDetail" 
              component={SchoolDetailScreen} 
              options={{ headerShown: true, title: 'Détail école', headerBackTitle: 'Retour' }} 
            />
          </>
        ) : (
          // App Stack
          <>
            <Stack.Screen name="Main">
              {() => <AppTabs role={user?.role} colors={themeColors} />}
            </Stack.Screen>
            <Stack.Screen
              name="SchoolDetail"
              component={SchoolDetailScreen}
              options={{ headerShown: true, title: 'Détail école', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="AdminModules"
              component={AdminModulesScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="AdminVehicles"
              component={require('../screens/admin/VehiclesScreen').default}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="StudentBookings"
              component={StudentBookingsScreen}
              options={{ headerShown: true, title: 'Mes cours', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="StudentQuiz"
              component={StudentQuizScreen}
              options={{ headerShown: true, title: 'Quiz IA', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="StudentDocuments"
              component={StudentDocumentsScreen}
              options={{ headerShown: true, title: 'Mes Documents', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="StudentNotifications"
              component={StudentNotificationsScreen}
              options={{ headerShown: true, title: 'Notifications', headerBackTitle: '' }}
            />
            <Stack.Screen
              name="StudentPayments"
              component={StudentPaymentsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="StudentMessages"
              component={StudentMessagesScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InstructorStudentDetail"
              component={InstructorStudentDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InstructorStats"
              component={InstructorStatsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InstructorMessages"
              component={InstructorMessagesScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InstructorDocuments"
              component={InstructorDocumentsScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const getStyles = (themeColors, insets = { bottom: 0 }) => StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabBar: {
    borderTopWidth: 1,
    height: 60 + insets.bottom,
    paddingBottom: 8 + insets.bottom,
    paddingTop: 6,
  },
  tabLabel: { fontSize: 10, fontWeight: '600' },
})
