# Drissman — React Native (Expo)

Migration complète depuis Next.js vers React Native avec Expo.

## 🚀 Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer en mode développement
npx expo start

# 3. Scanner le QR code avec l'app Expo Go (Android/iOS)
# OU lancer sur émulateur :
npx expo start --android
npx expo start --ios
```

## 📁 Structure du projet

```
drissman/
├── App.js                         # Point d'entrée
├── app.json                       # Config Expo
├── .env                           # Variables d'environnement
├── src/
│   ├── context/
│   │   └── AuthContext.js         # Auth (JWT via SecureStore)
│   ├── navigation/
│   │   └── index.js               # Navigation par rôle (Stack + BottomTabs)
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.js
│   │   │   └── RegisterScreen.js
│   │   ├── student/
│   │   │   ├── HomeScreen.js      # Liste auto-écoles + recherche
│   │   │   └── screens.js         # Planning, Bookings, Progress, Profile
│   │   ├── instructor/
│   │   │   └── ScheduleScreen.js  # Planning moniteur + validation présence
│   │   ├── admin/
│   │   │   └── screens.js         # Dashboard + stubs Offres/Moniteurs/Planning
│   │   └── schools/
│   │       └── (dans screens.js)  # Liste + Détail école
│   ├── components/
│   │   ├── ui/
│   │   │   └── index.js           # Button, Badge, EmptyState, Modal
│   │   └── schools/
│   │       └── SchoolCard.js
│   ├── services/
│   │   ├── api.js                 # Client Axios + intercepteurs JWT
│   │   ├── auth.service.js        # Login, Register, Profile
│   │   └── services.js            # Schools, Sessions, Enrollments, Instructors
│   ├── mocks/
│   │   └── data.mock.js           # Données de test (écoles, sessions, etc.)
│   └── utils/
│       ├── theme.js               # Colors, Typography, Spacing, Radius, Shadows
│       └── formatters.js          # formatPrice (FCFA), formatDate, formatTime
```

## 🔄 Ce qui a changé (vs Next.js)

| Next.js | React Native |
|---|---|
| `next/router` | `@react-navigation/native` |
| `localStorage` | `expo-secure-store` |
| `className` Tailwind | `StyleSheet.create()` |
| `fetch` maison | `axios` + intercepteurs |
| `<div>`, `<p>`, etc. | `View`, `Text`, `FlatList`, etc. |
| `process.env.NEXT_PUBLIC_*` | `process.env.EXPO_PUBLIC_*` |
| Pages Router (`/pages/`) | Navigation Stack + BottomTabs |

## 🔐 Variables d'environnement

```env
EXPO_PUBLIC_API_URL=http://localhost:8080   # URL de l'API Spring Boot
EXPO_PUBLIC_USE_MOCK=true                   # true = données mockées, false = vraie API
```

## 👥 Navigation par rôle

| Rôle | Onglets disponibles |
|---|---|
| `STUDENT` | Accueil · Auto-écoles · Planning · Progression · Profil |
| `SCHOOL_ADMIN` | Dashboard · Offres · Moniteurs · Planning · Profil |
| `MONITOR` | Planning · Profil |

## 🛠️ Prochaines étapes

1. **Implémenter les screens Admin** (Offres, Moniteurs, Planning) en remplaçant les stubs
2. **Intégrer les paiements** MTN Mobile Money / Orange Money
3. **Ajouter les cartes GPS** avec `react-native-maps`
4. **Notifications push** avec `expo-notifications`
5. **Connecter l'API Spring Boot** en passant `EXPO_PUBLIC_USE_MOCK=false`
