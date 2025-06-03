import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { createContext, useState } from "react";
import "react-native-reanimated";

import { usersgrpcUser, usersgrpcUserType } from "@/client/users.swagger";
import { useReactQueryDevTools } from "@dev-plugins/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  configureFonts,
  DefaultTheme,
  MD3LightTheme,
  PaperProvider,
} from "react-native-paper";
import { MD3Type } from "react-native-paper/lib/typescript/types";
import { Colors } from "@/constants";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { defaultStyles } from "@/styles";
import { Region } from "react-native-maps";
import { ordersgrpcPaymentEntity } from "@/client/orders.swagger";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "signup",
};

// Hide the splash screen automatically
SplashScreen.hide();

export default function RootLayout() {
  return (
    <>
      <RootLayoutNav />
      <StatusBar style="light" />
    </>
  );
}

const client = new QueryClient();

interface ContextInfo {
  user: usersgrpcUser | undefined;
  role: usersgrpcUserType | undefined;
  productId: string | undefined;
  deliveryLocation:
    | {
        description: string;
        address: string;
        region: Region;
      }
    | undefined;
  paymentData:
    | {
        entity: ordersgrpcPaymentEntity;
        entityId: string;
        nextScreen: string;
      }
    | undefined;
}

interface ContextSetters {
  // eslint-disable-next-line no-unused-vars
  setUser: (user: usersgrpcUser | undefined) => void;
  setUserRole: (role: usersgrpcUserType | undefined) => void;
  setProductId: (id: string | undefined) => void;
  setDeliveryLocation: (
    location:
      | {
          description: string;
          address: string;
          region: Region;
        }
      | undefined
  ) => void;
  setPaymentData: (
    data:
      | {
          entity: ordersgrpcPaymentEntity;
          entityId: string;
          nextScreen: string;
        }
      | undefined
  ) => void;
}

export interface ContextType extends ContextInfo, ContextSetters {}

export const Context = createContext<ContextType | undefined>(undefined);

function RootLayoutNav() {
  useReactQueryDevTools(client);

  const fontConfig: Record<string, MD3Type> = {
    default: {
      fontFamily: "urbanist-medium",
      fontWeight: "400",
      letterSpacing: 0.5,
      lineHeight: 20,
      fontSize: 16,
    },
    bodyLarge: {
      fontFamily: "urbanist-semibold",
      fontWeight: "500",
      letterSpacing: 0.75,
      lineHeight: 22,
      fontSize: 18,
    },
    titleMedium: {
      fontFamily: "urbanist-bold",
      fontWeight: "600",
      letterSpacing: 1,
      lineHeight: 24,
      fontSize: 20,
    },
    titleLarge: {
      fontFamily: "urbanist-extrabold",
      fontWeight: "700",
      letterSpacing: 1,
      lineHeight: 28,
      fontSize: 24,
    },
    // You can define additional font styles here if needed
  };

  const theme = {
    ...MD3LightTheme,
    dark: false,
    colors: {
      ...DefaultTheme.colors,
      text: Colors.dark["0"], // Override text color globally
    },
    fonts: configureFonts({ config: fontConfig }),
  };

  const initialState: ContextInfo = {
    user: undefined,
    role: undefined,
    productId: undefined,
    deliveryLocation: undefined,
    paymentData: undefined,
  };

  const [contextInfo, setContextInfo] = useState(initialState);

  function setUser(user: usersgrpcUser | undefined) {
    setContextInfo((prevState) => ({ ...prevState, user }));
  }

  function setUserRole(role: usersgrpcUserType | undefined) {
    setContextInfo((prevState) => ({ ...prevState, role }));
  }

  function setProductId(id: string | undefined) {
    setContextInfo((prevState) => ({ ...prevState, productId: id }));
  }

  function setDeliveryLocation(
    location:
      | {
          description: string;
          address: string;
          region: Region;
        }
      | undefined
  ) {
    setContextInfo((prevState) => ({
      ...prevState,
      deliveryLocation: location,
    }));
  }

  function setPaymentData(
    data:
      | {
          entity: ordersgrpcPaymentEntity;
          entityId: string;
          nextScreen: string;
        }
      | undefined
  ) {
    setContextInfo((prevState) => ({
      ...prevState,
      paymentData: data,
    }));
  }

  const contextSetters: ContextSetters = {
    setUser,
    setUserRole,
    setDeliveryLocation,
    setProductId,
    setPaymentData,
  };

  return (
    <QueryClientProvider client={client}>
      <Context.Provider value={{ ...contextInfo, ...contextSetters }}>
        <PaperProvider theme={theme}>
          <GestureHandlerRootView style={defaultStyles.flex}>
            <Stack initialRouteName="index">
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(farmer)" options={{ headerShown: false }} />
              <Stack.Screen name="(buyer)" options={{ headerShown: false }} />
              <Stack.Screen name="(payment)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: "modal" }} />
            </Stack>
          </GestureHandlerRootView>
        </PaperProvider>
      </Context.Provider>
    </QueryClientProvider>
  );
}
