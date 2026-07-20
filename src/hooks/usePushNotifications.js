import { useState, useEffect, useRef } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from '../services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function usePushNotifications(isAuthenticated) {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [devicePushToken, setDevicePushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then(async (tokenData) => {
      if (tokenData) {
        setDevicePushToken(tokenData.deviceToken);
        if (tokenData.deviceToken && isAuthenticated) {
          try {
             await api.post('/notifications/register-token', {
                 token: tokenData.deviceToken,
                 platform: Platform.OS,
             });
             console.log("Token successfully registered on backend.");
          } catch (error) {
             console.error("Failed to register push token on backend:", error);
          }
        }
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
      // Gérer la redirection ici (ex: vers la page de l'offre)
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [isAuthenticated]);

  return { devicePushToken, notification };
}

async function registerForPushNotificationsAsync() {
  let deviceToken = '';
  
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    try {
        // Pour Firebase Cloud Messaging en direct (FCM), on utilise le device push token
        const token = (await Notifications.getDevicePushTokenAsync()).data;
        deviceToken = token;
        console.log("Device Push Token:", deviceToken);
    } catch (e) {
        // Ignorer l'erreur d'initialisation de Firebase pour le moment
        // console.log("Erreur lors de la récupération du Device Push Token:", e);
    }
    
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return { deviceToken };
}
