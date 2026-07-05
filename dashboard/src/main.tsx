import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { colors } from '@ahla/shared';
import App from './App';
import './theme.css';

// Inject the shared design tokens as CSS custom properties so the stylesheet
// and the app stay in lockstep with the mobile app's palette.
const root = document.documentElement;
Object.entries(colors).forEach(([key, value]) => {
  root.style.setProperty(`--${key}`, value as string);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
