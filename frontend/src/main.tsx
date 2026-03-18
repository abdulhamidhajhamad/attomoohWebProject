import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './app/App';
import { BranchSelectorProvider } from './shared/ui/BranchSelector';
import './shared/i18n';
import './shared/styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <BranchSelectorProvider>
        <App />
      </BranchSelectorProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
