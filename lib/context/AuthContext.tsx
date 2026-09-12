'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { OfficerProfile } from '../types';

interface PoliceSessionResponse {
  success: boolean;
  authenticated: boolean;
  officer?: OfficerProfile;
  session?: {
    police_id: string;
    service_number?: string;
    name?: string;
    rank?: string;
    station?: string;
    department?: string;
    role?: string;
    authenticated_at?: string;
    expires_at?: string;
  };
  error?: string;
}

interface AuthContextType {
  user: null;
  idToken: null;

  isAuthenticated: boolean;
  isAuthLoading: boolean;

  officer: OfficerProfile | null;

  loginWithBiometrics: (
    pin: string,
    policeId?: string
  ) => Promise<boolean>;

  authenticatePoliceOfficer: (
    policeId: string,
    pin: string,
    livenessAuthorizationId: string
  ) => Promise<boolean>;

  logout: () => Promise<void>;

  authError: string | null;
  isAuthenticating: boolean;
}

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [officer, setOfficer] =
    useState<OfficerProfile | null>(null);

  const [isAuthenticated, setIsAuthenticated] =
    useState(false);

  const [isAuthLoading, setIsAuthLoading] =
    useState(true);

  const [isAuthenticating, setIsAuthenticating] =
    useState(false);

  const [authError, setAuthError] =
    useState<string | null>(null);

  // ------------------------------------------------------------
  // Restore existing server-side police session
  // ------------------------------------------------------------

  const restoreSession = async () => {
    try {
      setIsAuthLoading(true);

      const response = await fetch(
        '/api/auth/session',
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        }
      );

      const data: PoliceSessionResponse =
        await response.json().catch(() => ({
          success: false,
          authenticated: false,
        }));

      if (
        response.ok &&
        data.success &&
        data.authenticated &&
        data.officer
      ) {
        setOfficer(data.officer);
        setIsAuthenticated(true);
        setAuthError(null);
      } else {
        setOfficer(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error(
        'Unable to restore police duty session:',
        error
      );

      setOfficer(null);
      setIsAuthenticated(false);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // ------------------------------------------------------------
  // Restore session when application starts
  // ------------------------------------------------------------

  useEffect(() => {
    restoreSession();
  }, []);

  // ------------------------------------------------------------
  // Real police authentication
  // ------------------------------------------------------------

  const authenticatePoliceOfficer = async (
    policeId: string,
    pin: string,
    livenessAuthorizationId: string
  ): Promise<boolean> => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      if (!policeId.trim()) {
        throw new Error(
          'Police ID is required.'
        );
      }

      if (!pin || pin.length !== 6) {
        throw new Error(
          'A valid 6-digit Officer Security PIN is required.'
        );
      }

      if (!livenessAuthorizationId) {
        throw new Error(
          'Facial liveness authorization is required.'
        );
      }

      const response = await fetch(
        '/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          cache: 'no-store',
          body: JSON.stringify({
            police_id: policeId.trim(),
            pin,
            liveness_authorization_id:
              livenessAuthorizationId,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (
        !response.ok ||
        !data?.success ||
        !data?.officer
      ) {
        throw new Error(
          data?.error ||
          'Police duty authentication failed.'
        );
      }

      /*
       * The server has now:
       *
       * 1. Verified the officer.
       * 2. Verified liveness authorization.
       * 3. Verified the live face.
       * 4. Verified the Argon2id PIN.
       * 5. Consumed the liveness authorization.
       * 6. Created the HTTP-only police duty session.
       *
       * The browser only receives the officer profile.
       */

      setOfficer(data.officer);
      setIsAuthenticated(true);
      setAuthError(null);

      return true;
    } catch (error: any) {
      console.error(
        'Police duty authentication failed:',
        error
      );

      setOfficer(null);
      setIsAuthenticated(false);

      const message =
        error?.message ||
        'Police duty authentication failed.';

      setAuthError(message);

      return false;
    } finally {
      setIsAuthenticating(false);
    }
  };

  // ------------------------------------------------------------
  // Re-authentication / biometric modal
  // ------------------------------------------------------------

  /*
   * This function is intentionally NOT allowed to bypass
   * the real authentication flow.
   *
   * The biometric modal will need to be updated to perform
   * the same challenge -> liveness -> login process.
   *
   * Until then, this function refuses the old shortcut.
   */
  const loginWithBiometrics = async (
    _pin: string,
    _policeId?: string
  ): Promise<boolean> => {
    setAuthError(
      'Biometric re-authentication must complete a live facial liveness check before authentication.'
    );

    return false;
  };

  // ------------------------------------------------------------
  // Logout
  // ------------------------------------------------------------

  const logout = async (): Promise<void> => {
    setAuthError(null);

    try {
      await fetch(
        '/api/auth/logout',
        {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
        }
      );
    } catch (error) {
      console.error(
        'Police duty session logout request failed:',
        error
      );
    } finally {
      setOfficer(null);
      setIsAuthenticated(false);
    }
  };

  const value: AuthContextType = {
    /*
     * These are intentionally null.
     *
     * Police authentication is no longer represented by
     * anonymous Firebase authentication.
     */
    user: null,
    idToken: null,

    isAuthenticated,
    isAuthLoading,

    officer,

    loginWithBiometrics,

    authenticatePoliceOfficer,

    logout,

    authError,
    isAuthenticating,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
};