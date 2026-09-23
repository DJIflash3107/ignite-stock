import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCurrentUser } from '@/redux/thunks/authThunks';
import { logout } from '@/redux/slices/authSlice';
import { TOKEN_STORAGE_KEY } from '@/lib/api-client';

export function useAuthInit() {
  const dispatch = useAppDispatch();
  const { isInitialized, isAuthenticated, user, token, isLoading } = useAppSelector(
    (state) => state.auth
  );
  const initializedRef = useRef(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      dispatch(logout());
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    if (!initializedRef.current) {
      initializedRef.current = true;
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
      if (storedToken || token) {
        dispatch(fetchCurrentUser());
      }
    }

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [dispatch, token]);

  return { isInitialized, isAuthenticated, user, token, isLoading };
}

export default useAuthInit;
