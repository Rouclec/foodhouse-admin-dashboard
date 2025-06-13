"use client";

// importing the interceptor in the query client so that all other pages have access to the interceptor
// this is because the query client is a client component, and it wraps the rest of the app as seen in the layout.tsx file
import "@/utils";

import React, { createContext, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { usersgrpcUser } from "@/client/users.swagger";

interface ContextInfo {
  user: usersgrpcUser | undefined;
}

interface ContextSetters {
  setUser: (user: usersgrpcUser | undefined) => void;
}

export interface ContextType extends ContextInfo, ContextSetters {}

export const Context = createContext<ContextType | undefined>(undefined);

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Data remains fresh for 1 minute
          },
        },
      })
  );

  const initialState: ContextInfo = {
    user: undefined,
  };

  const [contextInfo, setContextInfo] = useState(initialState);

  function setUser(user: usersgrpcUser | undefined) {
    setContextInfo((prevState) => ({ ...prevState, user }));
  }

  const contextSetters: ContextSetters = {
    setUser,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Context.Provider value={{ ...contextInfo, ...contextSetters }}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </Context.Provider>
    </QueryClientProvider>
  );
}
