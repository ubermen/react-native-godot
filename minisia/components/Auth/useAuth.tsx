import {useEffect, useState} from 'react';
import auth, {
  FirebaseAuthTypes,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  GoogleAuthProvider,
} from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import googleServices from '../../android/app/google-services.json';
import {Alert} from 'react-native';

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

    const unsub = auth().onAuthStateChanged(async u => {
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }

      // ⭐ 이메일 계정인데 인증 안 되었으면 로그인 상태로 취급하지 않음
      await u.reload(); // 최신 emailVerified 값 보장

      if (!u.emailVerified && !u.isAnonymous) {
        // 인증 필요
        setUser(null);
        setLoading(false);
        return;
      }

      // ⭐ 정상 로그인 (인증 완료 or 구글 or 게스트)
      setUser(u);
      setLoading(false);
    });

    return unsub;
  }, []);

  /** 회원가입 + 이메일 인증 */
  const registerWithEmail = async (email: string, pw: string) => {
    try {
      const res = await createUserWithEmailAndPassword(
        auth(),
        email.trim(),
        pw.trim(),
      );

      // 이메일 인증 메일 발송
      await res.user.sendEmailVerification();

      Alert.alert(
        'Verification Required',
        'A verification email has been sent. Please check your inbox and verify your email before logging in.',
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
        Alert.alert('Error', 'Registration failed. Please try again.');
      }

      return null;
    }
  };

  /** 이메일 로그인 + 이메일 인증 여부 체크 */
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
        Alert.alert('Login Failed', 'Could not sign in. Please try again.');
      }

      return null;
    }
  };

  /** 구글 로그인 */
  const loginWithGoogle = async () => {
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    const {data} = await GoogleSignin.signIn();
    if (!data) return null;

    const credential = GoogleAuthProvider.credential(data.idToken);
    return auth().signInWithCredential(credential);
  };

  /** 게스트 로그인 */
  const loginAsGuest = () => {
    return signInAnonymously(auth());
  };

  /** 로그아웃 */
  const logout = async () => {
    await signOut(auth());

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
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    loginAsGuest,
    logout,
  };
};
