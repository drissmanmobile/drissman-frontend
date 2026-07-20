// src/context/SideMenuContext.js
import React, { createContext, useContext, useState } from 'react';

const SideMenuContext = createContext({
  isMenuOpen: false,
  openMenu: () => {},
  closeMenu: () => {},
});

export function SideMenuProvider({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openMenu = () => setIsMenuOpen(true);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <SideMenuContext.Provider value={{ isMenuOpen, openMenu, closeMenu }}>
      {children}
    </SideMenuContext.Provider>
  );
}

export function useSideMenu() {
  return useContext(SideMenuContext);
}
