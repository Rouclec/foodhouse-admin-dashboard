import { useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const RATING_PROMPTED_KEY = '@hasPromptedForRating';

export const useAppRating = () => {
  const hasPromptedForRating = useCallback(async (): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(RATING_PROMPTED_KEY);
      return value === 'true';
    } catch {
      return false;
    }
  }, []);

  const setHasPromptedForRating = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.setItem(RATING_PROMPTED_KEY, 'true');
    } catch {
      // Silently fail
    }
  }, []);

  const requestReview = useCallback(async (): Promise<boolean> => {
    try {
      const alreadyPrompted = await hasPromptedForRating();
      if (alreadyPrompted) {
        return false;
      }

      const isAvailable = await StoreReview.isAvailableAsync();
      if (!isAvailable) {
        return false;
      }

      await StoreReview.requestReview();
      await setHasPromptedForRating();
      return true;
    } catch {
      return false;
    }
  }, [hasPromptedForRating, setHasPromptedForRating]);

  return {
    requestReview,
    hasPromptedForRating,
  };
};

export const useAutoPromptRating = (
  triggerCondition: boolean,
  onComplete?: () => void,
) => {
  const { requestReview, hasPromptedForRating } = useAppRating();

  useEffect(() => {
    if (!triggerCondition) return;

    const checkAndPrompt = async () => {
      const alreadyPrompted = await hasPromptedForRating();
      if (alreadyPrompted) {
        onComplete?.();
        return;
      }

      const shown = await requestReview();
      onComplete?.();
    };

    checkAndPrompt();
  }, [triggerCondition, requestReview, hasPromptedForRating, onComplete]);
};
