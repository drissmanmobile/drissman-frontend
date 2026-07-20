import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

export const GOOGLE_CLIENT_IDS = {
  webClientId: '756146333424-03t1jigdf930gksi3jcojpgn2u5cg64s.apps.googleusercontent.com',
  iosClientId: 'VOTRE_IOS_CLIENT_ID',
};

// Initialisation de Google Sign-in
GoogleSignin.configure({
  webClientId: GOOGLE_CLIENT_IDS.webClientId,
  // iosClientId n'est pas utilisé directement dans configure(), il est configuré via GoogleService-Info.plist ou app.json
  offlineAccess: true, // Requis si vous avez besoin d'un refreshToken pour votre backend
});

/**
 * Lance le flux de connexion natif Google
 * @returns {Promise<string>} Le token d'identification (idToken)
 */
export async function signInWithGoogle(): Promise<string> {
  try {
    // Vérifie que les services Google Play sont disponibles
    await GoogleSignin.hasPlayServices();
    
    // Lance la popup de connexion
    const userInfo = await GoogleSignin.signIn();
    
    // @react-native-google-signin/google-signin v11+ retourne l'idToken dans userInfo.data.idToken
    // Les versions précédentes utilisaient userInfo.idToken. On vérifie les deux par précaution.
    const idToken = userInfo?.data?.idToken || (userInfo as any)?.idToken;
    
    if (!idToken) {
      throw new Error("Aucun jeton d'identification (idToken) retourné par Google");
    }
    
    return idToken;
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error("Connexion Google annulée");
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error("Connexion Google déjà en cours...");
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error("Services Google Play non disponibles ou non à jour sur cet appareil");
    } else {
      throw new Error(error.message || "Erreur inconnue lors de la connexion Google");
    }
  }
}
