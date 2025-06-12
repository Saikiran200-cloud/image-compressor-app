import React from 'react'; // Added explicit import for React
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; // This imports the CSS file, which should be empty
import App from './App.jsx'; // This imports your App component

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);