import { createRoot } from 'react-dom/client';
import type { ComponentType } from 'react';
import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/inter/wght-italic.css';
import '@fontsource-variable/inter-tight/wght.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import './index.css';
import { ThemeProvider } from './theme/ThemeProvider';
import { chooseView, settleAfterSwitch, wantsPreview } from './phone/mode';

// The desktop page and the phone layout are separate chunks: each device downloads only its own. A computer that
// chose the phone layout gets it in a phone-sized frame.
const view = chooseView();
settleAfterSwitch();
const preview = wantsPreview(view);
document.documentElement.dataset.view = preview ? 'preview' : view;
const root = createRoot(document.getElementById('root')!);
const page: Promise<{ default: ComponentType }> = preview ? import('./phone/PhonePreview') : view === 'phone' ? import('./phone/PhoneApp') : import('./App');
page.then(({ default: Page }) =>
  root.render(
    <ThemeProvider>
      <Page />
    </ThemeProvider>
  )
);
