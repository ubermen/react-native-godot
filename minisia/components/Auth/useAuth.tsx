import {useEffect, useState} from 'react';
import auth, {
  FirebaseAuthTypes,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  GoogleAuthProvider,
  AppleAuthProvider,
} from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import googleServices from '../../android/app/google-services.json';
import {Platform, Alert} from 'react-native';
import appleAuth, {
  AppleRequestOperation,
  AppleRequestScope,
} from '@invertase/react-native-apple-authentication';

/* ---------------------------
 * ANDROID: webClientId 찾기
 * --------------------------- */
const findAndroidWebClientId = () => {
  for (const client of googleServices.client) {
    if (!client.oauth_client) continue;

    for (const oauth of client.oauth_client) {
      if (oauth.client_type === 3) return oauth.client_id;
    }
  }
  return undefined;
};

/* ---------------------------
 * IOS: iosClientId 직접 지정
 * --------------------------- */
const IOS_CLIENT_ID =
  '425154015855-0anb5qfaet5abg15kegio6mficodbjr8.apps.googleusercontent.com';

export const useAuth = () => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  /* -----------------------------------
   * GOOGLE SIGN-IN CONFIGURE
   * ----------------------------------- */
  useEffect(() => {
    const webClientId = findAndroidWebClientId();

    GoogleSignin.configure({
      webClientId, // android
      iosClientId: IOS_CLIENT_ID, // ios
      offlineAccess: true,
    });

    const unsub = auth().onAuthStateChanged(async u => {
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }

      await u.reload();

      if (!u.emailVerified && !u.isAnonymous) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(u);
      setLoading(false);
    });

    return unsub;
  }, []);

  /* -----------------------------------
   * 회원가입
   * ----------------------------------- */
  const registerWithEmail = async (email: string, pw: string) => {
    try {
      const res = await createUserWithEmailAndPassword(
        auth(),
        email.trim(),
        pw.trim(),
      );

      await res.user.sendEmailVerification();

      Alert.alert(
        'Verification Required',
        'A verification email has been sent. Please check your inbox.',
      );

      return res;
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        Alert.alert('Email Exists', 'This email is already registered.');
      } else if (e.code === 'auth/invalid-email') {
        Alert.alert('Invalid Email', 'Invalid email format.');
      } else if (e.code === 'auth/weak-password') {
        Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      } else {
        Alert.alert('Error', 'Registration failed.');
      }

      return null;
    }
  };

  /* -----------------------------------
   * 이메일 로그인
   * ----------------------------------- */
  const loginWithEmail = async (email: string, pw: string) => {
    try {
      const res = await signInWithEmailAndPassword(
        auth(),
        email.trim(),
        pw.trim(),
      );

      if (!res.user.emailVerified) {
        await signOut(auth());
        Alert.alert(
          'Email Not Verified',
          'Please verify your email before logging in.',
        );
        return null;
      }

      return res;
    } catch (e: any) {
      if (e.code === 'auth/invalid-credential') {
        Alert.alert('Login Failed', 'Invalid email or password.');
      } else if (e.code === 'auth/invalid-email') {
        Alert.alert('Login Failed', 'Invalid email format.');
      } else {
        Alert.alert('Login Failed', 'Could not sign in.');
      }
      return null;
    }
  };

  /* -----------------------------------
   * 구글 로그인
   * ----------------------------------- */
  const loginWithGoogle = async () => {
    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
    }

    const result = await GoogleSignin.signIn();
    const {idToken} = result.data ?? {};

    if (!idToken) return null;

    const credential = GoogleAuthProvider.credential(idToken);
    return auth().signInWithCredential(credential);
  };

  /* -----------------------------------
   * 🍎 애플 로그인
   * ----------------------------------- */
  const loginWithApple = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Apple Login', 'Available only on iOS.');
      return null;
    }

    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      // identityToken 없으면 실패
      if (!appleAuthRequestResponse.identityToken) {
        Alert.alert('Apple Sign-In failed - no identity token returned');
        return null;
      }

      const {identityToken, nonce} = appleAuthRequestResponse;

      // Firebase credential 만들기
      const appleCredential = auth.AppleAuthProvider.credential(
        identityToken,
        nonce,
      );

      // Firebase 로그인
      return auth().signInWithCredential(appleCredential);
    } catch (e) {
      console.log('Apple login error:', e);
      Alert.alert('Login Failed', 'Could not sign in with Apple.');
      return null;
    }
  };

  /* -----------------------------------
   * Guest login
   * ----------------------------------- */
  const loginAsGuest = () => {
    return signInAnonymously(auth());
  };

  const logout = async () => {
    await signOut(auth());
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
    } catch {}
  };

  return {
    user,
    loading,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    loginWithApple, // ⭐ 추가됨
    loginAsGuest,
    logout,
  };
};
