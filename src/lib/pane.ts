import { createContext, useContext } from 'react';

/**
 * False inside a tab pane that is not showing. Panes stay mounted (so a tabbed block keeps the height
 * of its tallest pane and nothing jumps), and figures read this to pause their clocks and hold their
 * entrance until the pane is shown.
 */
export const PaneActive = createContext(true);
export const usePaneActive = () => useContext(PaneActive);
