declare module 'react-native-webview' {
  import * as React from 'react';
  import { ViewProps } from 'react-native';

  export type WebViewProps = ViewProps & {
    source?: { uri?: string } | { html?: string };
    startInLoadingState?: boolean;
    onNavigationStateChange?: (navState: any) => void;
  };

  export class WebView extends React.Component<WebViewProps> {}
}

