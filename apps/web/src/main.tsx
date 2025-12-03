import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';

import 'leaflet/dist/leaflet.css';
import App from './App';
import './style.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('app')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
);
