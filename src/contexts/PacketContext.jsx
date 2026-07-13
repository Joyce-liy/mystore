import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'ms-current-packet';

const PacketContext = createContext(null);

export const PacketProvider = ({ children }) => {
  const [currentPacket, setCurrentPacket] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (currentPacket) localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPacket));
    else localStorage.removeItem(STORAGE_KEY);
  }, [currentPacket]);

  const selectPacket = (packet) => {
    setCurrentPacket(packet ? { id: packet.id, nom: packet.nom } : null);
  };

  const clearPacket = () => setCurrentPacket(null);

  return (
    <PacketContext.Provider value={{ currentPacket, selectPacket, clearPacket }}>
      {children}
    </PacketContext.Provider>
  );
};

export const usePacket = () => {
  const ctx = useContext(PacketContext);
  if (!ctx) throw new Error('usePacket doit être utilisé à l\'intérieur d\'un PacketProvider');
  return ctx;
};