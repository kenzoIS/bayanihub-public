import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

export interface AdminProfile {
  auth_user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  role: string;
  profile_photo_key?: string;
}

interface AuthContextValue {
  profile: AdminProfile | null;
  token: string | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  profile: null,
  token: null,
  isLoading: true,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('admin-token')
        : null;

    if (!stored) {
      setIsLoading(false);
      return;
    }

    setToken(stored);

    // Fetch the logged-in admin profile from the backend
    const API_BASE =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004/api/v1';

    fetch(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${stored}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Not authorised');
        return res.json();
      })
      .then((data: AdminProfile) => {
        setProfile(data);
      })
      .catch(() => {
        // Token invalid — clear it out
        sessionStorage.removeItem('admin-token');
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const logout = () => {
    sessionStorage.removeItem('admin-token');
    setProfile(null);
    setToken(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ profile, token, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
