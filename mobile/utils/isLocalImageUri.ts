export const isLocalImageUri = (uri: string) =>
  uri.startsWith('file://') ||
  uri.startsWith('content://') ||
  uri.startsWith('ph://') ||
  uri.startsWith('assets-library://');
