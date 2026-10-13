import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { AppProvider } from './app/state';
import './styles.css';

// This learning site intentionally stays light, even for an older saved dark preference.
document.documentElement.dataset.theme = 'light';

createRoot(document.getElementById('root')!).render(
  <StrictMode><AppProvider><App /></AppProvider></StrictMode>,
);
