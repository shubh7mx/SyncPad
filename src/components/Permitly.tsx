"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';

// 1. Create the Context
const PermitlyContext = createContext({ isAllowed: false, isLoading: true });

// 2. Create the Provider Component
export function PermitlyProvider({ project, api = "https://permitly.io", children }: { project: string, api?: string, children: React.ReactNode }) {
    const [isAllowed, setAllowed] = useState(false);
    
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        // Expose config for the loader
        (window as any).PERMITLY_CONFIG = { project, api };
        
        // Check if script is already there
        if (!document.getElementById('permitly-loader')) {
            const script = document.createElement('script');
            script.id = 'permitly-loader';
            script.src = `${api}/loader.js`;
            script.async = true;
            script.onload = () => setAllowed(true); // Optimistic: assume allowed unless loader says otherwise
            document.body.appendChild(script);
        } else {
            setAllowed(true);
        }
    }, [project, api]);

    return (
        <PermitlyContext.Provider value={{ isAllowed, isLoading: false }}>
            {children}
        </PermitlyContext.Provider>
    );
}

// 3. Create the Hook
export const usePermitly = () => useContext(PermitlyContext);
