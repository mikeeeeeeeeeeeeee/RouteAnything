import { createRoot } from 'react-dom/client';
import '@fontsource-variable/cormorant-garamond/wght.css';
import '@fontsource-variable/cormorant-garamond/wght-italic.css';
import '@fontsource-variable/literata/opsz.css';
import '@fontsource-variable/literata/opsz-italic.css';
import '@fontsource-variable/geist/wght.css';
import '@fontsource-variable/geist-mono/wght.css';
import 'katex/dist/katex.min.css';
import './index.css';
import { ThemeProvider } from './theme/ThemeProvider';
import App from './App';

createRoot(document.getElementById('root')!).render(
  // no StrictMode: WebGL effects release their context on unmount, and the dev-only
  // double mount would hand them a lost context
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
