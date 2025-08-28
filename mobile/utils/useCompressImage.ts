import { useImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { useState, useCallback } from 'react';

const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export function useCompressImage(uri: string) {
  const context = useImageManipulator(uri); // Returns the ImageManipulatorContext
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const compressImage = useCallback(async (): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists || !info.size) {
        throw new Error('File does not exist or is invalid');
      }

      // eslint-disable-next-line no-console
      console.log('original file size: ', info.size);

      if (info.size <= MAX_SIZE_BYTES) {
        return uri;
      }

      // Chain transformations directly on context
      const rendered = await context.renderAsync();
      const result = await rendered.saveAsync({
        compress: 0.5,
        format: SaveFormat.JPEG,
      });

      const newInfo = await FileSystem.getInfoAsync(result.uri);
      if (!newInfo.exists || !newInfo.size) {
        throw new Error('Compressed file is invalid');
      }

      // eslint-disable-next-line no-console
      console.log('final file size: ', newInfo.size);

      if (newInfo.size > MAX_SIZE_BYTES) {
        throw new Error('File is still too large after compression');
      }

      return result.uri;
    } catch (err) {
      setError(err as Error);
      return '';
    } finally {
      setLoading(false);
    }
  }, [uri, context]);

  return { compressImage, loading, error };
}
