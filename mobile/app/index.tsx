import 'react-native-get-random-values';

import { FontAwesome } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Context, ContextType } from './_layout';
import { readData, updateAuthHeader } from '@/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  usersGetUserByIdOptions,
  usersRefreshAccessTokenMutation,
} from '@/client/users.swagger/@tanstack/react-query.gen';
import { indexStyles as styles } from '@/styles';
import { Text } from 'react-native-paper';
import { Chase } from 'react-native-animated-spinkit';
import { Colors } from '@/constants';

export default function Index() {
  const router = useRouter();

  const { setUser, user } = useContext(Context) as ContextType;
  const [appIsReady, setAppIsReady] = useState(false);
  const [delay, setDelay] = useState(5000);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [userId, setUserId] = useState<string>();

  const [loaded, error] = useFonts({
    'urbanist-black': require('../assets/fonts/Urbanist-Black.ttf'),
    'urbanist-bold': require('../assets/fonts/Urbanist-Bold.ttf'),
    'urbanist-extraBold': require('../assets/fonts/Urbanist-ExtraBold.ttf'),
    'urbanist-semiBold': require('../assets/fonts/Urbanist-SemiBold.ttf'),
    'urbanist-medium': require('../assets/fonts/Urbanist-Medium.ttf'),
    'urbanist-regular': require('../assets/fonts/Urbanist-Regular.ttf'),
    'urbanist-thin': require('../assets/fonts/Urbanist-Thin.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Countdown effect: We need the splash screen to atleast display for 3 seconds so as to load the animation
  useEffect(() => {
    if (delay > 0) {
      const interval = setInterval(() => {
        setDelay(prev => Math.max(prev - 1000, 0));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [delay]);

  // Navigation effect
  useEffect(() => {
    if (!(loaded && appIsReady)) return;
    const timeLeft = Math.max(delay, 0);
    const timeout = setTimeout(() => {
      if (user) {
        let isProfileComplete = false;
        switch (user.role) {
          case 'USER_ROLE_BUYER': {
            isProfileComplete = !!user?.firstName;
            break;
          }
          default: {
            isProfileComplete =
              !!user?.firstName &&
              !!user.profileImage &&
              !!user.locationCoordinates &&
              !!user.locationCoordinates.lat &&
              !!user.locationCoordinates.lon &&
              !!user.locationCoordinates.address;
          }
        }

        if (!isProfileComplete) {
          return router.push('/(auth)/profile-page');
        }
        if (user?.role === 'USER_ROLE_FARMER')
          return router.replace('/(farmer)/(index)');
        if (user?.role === 'USER_ROLE_AGENT')
          return router.replace('/(agent)/(index)');
        return router.replace('/(buyer)/(index)');
      }
      if (hasOnboarded) {
        return router.replace('/(auth)/login');
      }
      return router.replace('/(auth)');
    }, timeLeft);

    return () => clearTimeout(timeout);
  }, [delay, loaded, appIsReady]);

  /**   This useEffect checks if the userId and the refreshToken exist in the storage
        If the userId and the refreshToken exits, use the refreshToken to get a new accessToken
        Use the accessToken and the userId to get the userData and redirect the user to the homescreen 
  */
  useEffect(() => {
    const getUserIdAndRefreshTokenFromStorage = async () => {
      const refreshTokenFromStorage = await readData('@refreshToken');
      const userIdFromStorage = await readData('@userId');
      const hasOnboardedFromStorage = await readData('@hasOnboarded');
      setHasOnboarded(!!hasOnboardedFromStorage);

      // Only attempt to refresh the token if both the refreshToken and userId are found in the storage
      if (refreshTokenFromStorage && userIdFromStorage) {
        // use the refreshToken to get the accessToken
        await refreshAccessToken({
          body: {
            refreshToken: refreshTokenFromStorage,
          },
        });
      } else {
        setAppIsReady(true);
      }
    };

    getUserIdAndRefreshTokenFromStorage();
  }, []);

  // Fetch the userData only when the userid exsits
  const { data: userData, isError } = useQuery({
    ...usersGetUserByIdOptions({
      path: {
        userId: userId ?? '',
      },
    }),
    enabled: !!userId,
  });

  const { mutateAsync: refreshAccessToken } = useMutation({
    ...usersRefreshAccessTokenMutation(),
    onSuccess: async data => {
      // After getting the accessToken,
      // 1. Update the auth header
      updateAuthHeader(data?.accessToken ?? '');

      // 2. Read the userId from the storage again
      const userIdFromStorage = await readData('@userId');

      // 3. set the userId in the state
      // (This will avoid you trying to fetch the user by the userId when the access token is not yet available)
      if (userIdFromStorage) {
        setUserId(userIdFromStorage);
      }
    },
    onError: () => {
      setAppIsReady(true);
    },
  });

  useEffect(() => {
    if (userData?.user) {
      setUser(userData?.user);
      setAppIsReady(true);
    }
  }, [userData]);

  useEffect(() => {
    if (isError) {
      setAppIsReady(true);
    }
  }, [isError]);

  return (
    <View style={styles.splash}>
      <View style={styles.textWrapper}>
        <Text style={styles.text} variant="titleLarge">
          FoodHouse
        </Text>
      </View>

      <View style={styles.spinnerContainer}>
        <Chase size={56} color={Colors.light[10]} />
      </View>
    </View>
  );
}
