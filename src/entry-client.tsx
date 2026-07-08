import {StrictMode} from 'react';
import {hydrateRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {HelmetProvider} from 'react-helmet-async';
import App from './App.tsx';
import './index.css';

hydrateRoot(
  document.getElementById('root')!,
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App initialData={window.__INITIAL_DATA__} />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
