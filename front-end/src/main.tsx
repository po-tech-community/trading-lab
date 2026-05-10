import { QueryProvider } from '@/providers/QueryProvider';
import { ChatProvider } from '@/providers/ChatProvider';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './App.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <ChatProvider>
        <App />

      </ChatProvider>
      
    </QueryProvider>
  </StrictMode>
);
