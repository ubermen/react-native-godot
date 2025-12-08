import {useEffect, useState} from 'react';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import googleServices from '../../android/app/google-services.json';

const findWebClientId = () => {
  for (const client of googleServices.client) {
    if (!client.oauth_client) continue;

    for (const oauth of client.oauth_client) {
      if (oauth.client_type === 3) return oauth.client_id;
    }
  }
  return null;
};

export const useAuth = () => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const webClientId = findWebClientId();
    if (webClientId) GoogleSignin.configure({webClientId});

    const unsub = auth().onAuthStateChanged(u => {
      setUser(u);
      setLoading(false);
    });

    return unsub;
  }, []);

  const loginWithEmail = async (email: string, pw: string) => {
    return auth().signInWithEmailAndPassword(email.trim(), pw.trim());
  };

  const loginWithGoogle = async () => {
    await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});

    const {data} = await GoogleSignin.signIn();
    if (!data) return null;

    const credential = auth.GoogleAuthProvider.credential(data.idToken);
    return auth().signInWithCredential(credential);
  };

  const loginAsGuest = async () => {
    return auth().signInAnonymously();
  };

  const logout = async () => {
    await auth().signOut();

    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
    } catch (e) {
      // ignore
    }
  };

  return {
    user,
    loading,
    loginWithEmail,
    loginAsGuest,
    loginWithGoogle,
    logout,
  };
};
