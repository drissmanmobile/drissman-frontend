import * as Location from 'expo-location'
import api from './api'

export const recordSessionLocation = async (sessionId, locationData) => {
  return api.post(`/api/sessions/${sessionId}/locations`, locationData)
}

export const fetchLiveSessionLocation = async (sessionId) => {
  return api.get(`/api/sessions/${sessionId}/locations/latest`)
}

export const fetchSessionTrail = async (sessionId) => {
  return api.get(`/api/sessions/${sessionId}/locations/trail`)
}

let activeWatcher = null

export const startInstructorSessionTracking = async (sessionId, onError) => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      if (onError) onError('Permission géolocalisation refusée')
      return null
    }

    if (activeWatcher) {
      activeWatcher.remove()
      activeWatcher = null
    }

    activeWatcher = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000, // Toutes les 10 secondes
        distanceInterval: 5,   // Ou tous les 5 mètres
      },
      async (loc) => {
        try {
          const payload = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            speed: loc.coords.speed != null && loc.coords.speed >= 0 ? loc.coords.speed * 3.6 : 0, // convert m/s to km/h
            heading: loc.coords.heading != null ? loc.coords.heading : 0,
          }
          await recordSessionLocation(sessionId, payload)
        } catch (err) {
          console.log('Erreur envoi position GPS séance:', err)
        }
      }
    )

    return activeWatcher
  } catch (err) {
    console.log('Erreur initialisation suivi GPS:', err)
    if (onError) onError(err.message)
    return null
  }
}

export const stopInstructorSessionTracking = () => {
  if (activeWatcher) {
    activeWatcher.remove()
    activeWatcher = null
  }
}
