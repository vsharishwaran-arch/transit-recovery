import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Spinner from '../components/Common/Spinner';

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  loadingText: string;
  setLoadingText: (text: string) => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  setLoading: () => {},
  loadingText: '',
  setLoadingText: () => {},
});

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState<string>('Processing network request...');
  const reqCountRef = useRef<number>(0);

  useEffect(() => {
    // Intercept outgoing HTTP requests to show centered loader on network delay
    const reqInterceptor = api.interceptors.request.use(
      (config) => {
        reqCountRef.current += 1;
        if (reqCountRef.current === 1) {
          setIsLoading(true);
        }
        return config;
      },
      (error) => {
        reqCountRef.current = 0;
        setIsLoading(false);
        return Promise.reject(error);
      }
    );

    const resInterceptor = api.interceptors.response.use(
      (response) => {
        reqCountRef.current = Math.max(0, reqCountRef.current - 1);
        if (reqCountRef.current === 0) {
          setIsLoading(false);
        }
        return response;
      },
      (error) => {
        reqCountRef.current = Math.max(0, reqCountRef.current - 1);
        if (reqCountRef.current === 0) {
          setIsLoading(false);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(reqInterceptor);
      api.interceptors.response.eject(resInterceptor);
    };
  }, []);

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        setLoading: setIsLoading,
        loadingText,
        setLoadingText,
      }}
    >
      {children}

      {/* Centered 12 Blade Spinner Alone */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <Spinner size={36} color="#3B82F6" />
        </div>
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}
