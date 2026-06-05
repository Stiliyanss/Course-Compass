import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import router from './routes/AppRouter';
import AiChat from './components/AiChat';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

// Only render the AI chat button for logged-in users
function AuthenticatedChat() {
  const { user } = useAuth();
  if (!user) return null;
  return <AiChat />;
}

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
      <AuthenticatedChat />
    </AuthProvider>
  </QueryClientProvider>
);
