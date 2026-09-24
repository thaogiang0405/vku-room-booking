import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { auth } from '../config/firebase';

const mapFirebaseError = (error: any): string => {
  const code = error?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Email này đã được sử dụng.';
    case 'auth/invalid-email':
      return 'Email không hợp lệ.';
    case 'auth/weak-password':
      return 'Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn (ít nhất 6 ký tự).';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email hoặc mật khẩu không chính xác.';
    case 'auth/too-many-requests':
      return 'Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.';
    default:
      return 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại.';
  }
};

export const signUp = async (email: string, password: string): Promise<void> => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw new Error(mapFirebaseError(error));
  }
};

export const signIn = async (email: string, password: string): Promise<void> => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw new Error(mapFirebaseError(error));
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error('Không thể đăng xuất.');
  }
};

export const subscribeToAuthState = (callback: (user: User | null) => void) => {
  const unsubscribe = onAuthStateChanged(auth, callback);
  return unsubscribe;
};
