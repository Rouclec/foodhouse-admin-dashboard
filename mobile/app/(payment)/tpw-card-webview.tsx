import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Appbar, Dialog, Icon, Portal, Text } from 'react-native-paper';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { useQuery } from '@tanstack/react-query';
import { Chase } from 'react-native-animated-spinkit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants';
import { defaultStyles } from '@/styles';
import { ordersCheckPaymentStatusOptions } from '@/client/orders.swagger/@tanstack/react-query.gen';
import { Context, ContextType } from '../_layout';
import { useAppRating } from '@/hooks/useAppRating';
import i18n from '@/i18n';

const logTpw = (...args: unknown[]) => {
  if (__DEV__) {
    console.log('[TPW WebView]', ...args);
  }
};

// 1. Get frontend URL from environment (fallback to empty string if undefined)
// Make sure this is defined in your .env, e.g., EXPO_PUBLIC_FRONTEND_URL=https://myapp.com
const FRONTEND_URL = process.env.EXPO_PUBLIC_FRONTEND_URL?.replace(/\/$/, '') ?? '';

type Params = {
  checkoutUrl?: string;
  paymentId?: string;
};

/** Extra scroll room inside TPW pages when card / keyboard overlays cover the bottom. */
const TPW_SCROLL_ASSIST_STYLE_ID = '__fh_tpw_scroll_assist';

const buildScrollAssistScript = (bottomInsetPx: number) => `
(function() {
  var id = ${JSON.stringify(TPW_SCROLL_ASSIST_STYLE_ID)};
  var existing = document.getElementById(id);
  if (existing) existing.remove();
  var s = document.createElement('style');
  s.id = id;
  s.textContent =
    'body { padding-bottom: calc(max(45vh, 340px) + ${bottomInsetPx}px) !important; box-sizing: border-box !important; }';
  (document.head || document.documentElement).appendChild(s);
  true;
})();
`;

// 2. Inject JS to continually poll for URL changes
// This completely bypasses the Android redirect limitation
const INJECTED_JS = `
  (function() {
    var lastUrl = window.location.href;
    
    function notifyUrlChange(url) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'URL_CHANGE', url: url }));
      }
    }
    
    // Check every 300ms if the URL changed (handles server-side redirects on Android)
    setInterval(function() {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        notifyUrlChange(lastUrl);
      }
    }, 300);

    // Also notify immediately on initial load
    notifyUrlChange(window.location.href);
  })();
  true;
`;

const TPWCardWebViewPage = () => {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const terminalNavigationHandledRef = useRef(false);
  const { requestReview } = useAppRating();

  const { user, paymentData, setPaymentData, clearCart } = useContext(
    Context,
  ) as ContextType;

  const checkoutUrl = useMemo(() => {
    const raw = params.checkoutUrl;
    return typeof raw === 'string' ? raw : '';
  }, [params.checkoutUrl]);

  const paymentId = useMemo(() => {
    const raw = params.paymentId;
    return typeof raw === 'string' ? raw : '';
  }, [params.paymentId]);

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [loadingModalVisible, setLoadingModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [failureModalVisible, setFailureModalVisible] = useState(false);
  /** Unmount WebView once checkout reaches a terminal URL so modals are not over the provider page. */
  const [checkoutWebViewVisible, setCheckoutWebViewVisible] = useState(true);
  /** Same pattern as payment-account: capture before setPaymentData(undefined). */
  const [successNextPath, setSuccessNextPath] = useState<string>(
    '/(buyer)/(index)',
  );

  // 3. Construct the exact full URL paths
  const { fullReturnUrl, fullCancelUrl } = useMemo(() => {
    return {
      fullReturnUrl: `${FRONTEND_URL}/payments/tpw/return`,
      fullCancelUrl: `${FRONTEND_URL}/payments/tpw/cancel`,
    };
  }, []);

  useEffect(() => {
    logTpw('screen mount / terminal config', {
      FRONTEND_URL: FRONTEND_URL || '(empty — terminal URL matching will fail)',
      fullReturnUrl,
      fullCancelUrl,
    });
  }, [fullReturnUrl, fullCancelUrl]);

  useEffect(() => {
    terminalNavigationHandledRef.current = false;
    setCheckoutWebViewVisible(true);
  }, [checkoutUrl]);

  useEffect(() => {
    logTpw('checkout session params', {
      checkoutUrl: checkoutUrl
        ? `${checkoutUrl.slice(0, 80)}${checkoutUrl.length > 80 ? '…' : ''}`
        : '(empty)',
      paymentId: paymentId || '(empty)',
    });
  }, [checkoutUrl, paymentId]);

  // 4. Update matching to use exact full URL matching
  const handleTerminalUrl = useCallback(
    (url: string, source: string): boolean => {
      if (!url) return false;

      try {
        // Strip query params and hash from the incoming URL to match exact base endpoint
        const cleanUrl = url.split('?')[0].split('#')[0].replace(/\/$/, '');

        const matchesCancel = cleanUrl === fullCancelUrl;
        const matchesReturn = cleanUrl === fullReturnUrl;

        if (matchesCancel || matchesReturn) {
          logTpw('terminal URL matched', {
            source,
            raw: url,
            cleanUrl,
            kind: matchesCancel ? 'cancel' : 'return',
            alreadyHandled: terminalNavigationHandledRef.current,
          });
        } else if (
          url.includes('/payments/tpw/return') ||
          url.includes('/payments/tpw/cancel')
        ) {
          logTpw('TPW path in URL but no exact config match', {
            source,
            raw: url,
            cleanUrl,
            expectedReturn: fullReturnUrl,
            expectedCancel: fullCancelUrl,
          });
        }

        if (cleanUrl === fullCancelUrl) {
          if (!terminalNavigationHandledRef.current) {
            terminalNavigationHandledRef.current = true;
            setCheckoutWebViewVisible(false);
            setCancelModalVisible(true);
          }
          return true;
        }

        if (cleanUrl === fullReturnUrl) {
          if (!terminalNavigationHandledRef.current) {
            terminalNavigationHandledRef.current = true;
            setCheckoutWebViewVisible(false);
            setLoadingModalVisible(true);
          }
          return true;
        }
      } catch (e) {
        console.warn('Failed to parse WebView URL:', e);
      }
      return false;
    },
    [fullCancelUrl, fullReturnUrl],
  );

  // 5. Handle messages from the injected JS
  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const raw = event.nativeEvent.data;
      try {
        const data = JSON.parse(raw);
        if (data.type === 'URL_CHANGE') {
          logTpw('postMessage URL_CHANGE', { url: data.url });
          const isTerminal = handleTerminalUrl(data.url, 'injectedJs');
          if (isTerminal) {
            webViewRef.current?.stopLoading();
          }
        } else {
          logTpw('postMessage (other type)', { type: data.type, data });
        }
      } catch (e) {
        logTpw('postMessage parse error', { raw: raw?.slice?.(0, 200), e });
      }
    },
    [handleTerminalUrl],
  );

  const onShouldStartLoadWithRequest = useCallback(
    (request: ShouldStartLoadRequest) => {
      const url = request.url ?? '';
      if (request.isTopFrame === false) {
        logTpw('shouldStartLoad: allow (subframe)', {
          url: url.slice(0, 120),
          navigationType: request.navigationType,
        });
        return true;
      }
      const isTerminal = handleTerminalUrl(url, 'shouldStartLoad');
      if (isTerminal) {
        logTpw('shouldStartLoad: BLOCK (terminal)', { url });
        return false;
      }
      logTpw('shouldStartLoad: allow', {
        url: url.slice(0, 120),
        navigationType: request.navigationType,
      });
      return true;
    },
    [handleTerminalUrl],
  );

  const { data: paymentStatus } = useQuery({
    ...ordersCheckPaymentStatusOptions({
      path: {
        userId: user?.userId ?? '',
        paymentId,
      },
    }),
    enabled: !!paymentId && loadingModalVisible,
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (!paymentStatus?.status) return;
    logTpw('paymentStatus poll', { status: paymentStatus.status, paymentId });
    if (paymentStatus?.status === 'PaymentStatus_INITIATED') return;

    if (paymentStatus?.status === 'PaymentStatus_COMPLETED') {
      logTpw('paymentStatus → success modal');
      setSuccessNextPath(paymentData?.nextScreen ?? '/(buyer)/(index)');
      setLoadingModalVisible(false);
      setSuccessModalVisible(true);
      setPaymentData(undefined);
      clearCart();
      void requestReview();
    }

    if (paymentStatus?.status === 'PaymentStatus_FAILED') {
      logTpw('paymentStatus → failure modal');
      setLoadingModalVisible(false);
      setFailureModalVisible(true);
    }
  }, [paymentStatus, paymentId]);

  const scrollAssistBeforeLoad = useMemo(
    () => buildScrollAssistScript(insets.bottom),
    [insets.bottom],
  );

  const reinjectScrollAssist = useCallback(() => {
    webViewRef.current?.injectJavaScript(buildScrollAssistScript(insets.bottom));
  }, [insets.bottom]);

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <Appbar.Header dark={false} style={defaultStyles.appHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={defaultStyles.backButtonContainer}>
          <Icon source={'arrow-left'} size={24} />
        </TouchableOpacity>
        <Text variant="titleMedium" style={defaultStyles.heading}>
          {i18n.t('(subscription).(payment).cardPaymentTitle')}
        </Text>
        <View />
      </Appbar.Header>
    </View>
  );

  if (!checkoutUrl) {
    return (
      <View style={styles.screenRoot}>
        {renderHeader()}
        <View style={styles.errorBody}>
          <Text style={defaultStyles.errorText}>
            {i18n.t('(subscription).(payment).missingCheckoutUrl')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.screenRoot}>
        {renderHeader()}

        {checkoutWebViewVisible ? (
          <WebView
            ref={webViewRef}
            style={styles.webview}
            source={{ uri: checkoutUrl }}
            startInLoadingState={true}
            // 6. CRITICAL: Handle all schemes to prevent opening system browser
            originWhitelist={['*']}
            // 7. Inject JS to track URLs robustly
            injectedJavaScript={INJECTED_JS}
            onMessage={onMessage}
            injectedJavaScriptBeforeContentLoaded={scrollAssistBeforeLoad}
            onLoadEnd={(e) => {
              logTpw('onLoadEnd', {
                url: e.nativeEvent.url,
                title: e.nativeEvent.title,
              });
              reinjectScrollAssist();
            }}
            onLoadStart={(e) => {
              logTpw('onLoadStart', { url: e.nativeEvent.url });
            }}
            onError={(e) => {
              logTpw('onError', {
                url: e.nativeEvent.url,
                code: e.nativeEvent.code,
                description: e.nativeEvent.description,
              });
            }}
            onHttpError={(e) => {
              logTpw('onHttpError', {
                url: e.nativeEvent.url,
                statusCode: e.nativeEvent.statusCode,
              });
            }}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            onNavigationStateChange={(navState) => {
              const url = navState.url ?? '';
              logTpw('onNavigationStateChange', {
                url: url.slice(0, 160),
                loading: navState.loading,
                canGoBack: navState.canGoBack,
              });
              if (handleTerminalUrl(url, 'navigationState')) {
                webViewRef.current?.stopLoading();
              }
            }}
          />
        ) : (
          <View style={styles.webviewPlaceholder} />
        )}
      </View>

      {/* Loading Portal */}
      <Portal>
        <Dialog
          visible={loadingModalVisible}
          onDismiss={() => setLoadingModalVisible(false)}
          style={defaultStyles.dialogSuccessContainer}>
          <Dialog.Content>
            <Chase size={56} color={Colors.primary[500]} />
          </Dialog.Content>
          <Dialog.Content>
            <Text style={defaultStyles.bodyText}>
              {i18n.t('(subscription).(payment).confirmingCardPayment')}
            </Text>
          </Dialog.Content>
        </Dialog>
      </Portal>

      {/* Canceled Portal */}
      <Portal>
        <Dialog
          visible={cancelModalVisible}
          onDismiss={() => {
            setCancelModalVisible(false);
            router.back();
          }}
          style={defaultStyles.dialogSuccessContainer}>
          <Dialog.Content>
            <Image
              source={require('@/assets/images/error.png')}
              style={defaultStyles.successImage}
            />
          </Dialog.Content>
          <Dialog.Content>
            <Text variant="titleLarge" style={defaultStyles.errorText}>
              {i18n.t('(subscription).(payment).paymentCanceledTitle')}
            </Text>
          </Dialog.Content>
          <Dialog.Content>
            <Text style={defaultStyles.bodyText}>
              {i18n.t('(subscription).(payment).paymentCanceledMessage')}
            </Text>
          </Dialog.Content>
        </Dialog>
      </Portal>

      {/* Success Portal */}
      <Portal>
        <Dialog
          visible={successModalVisible}
          onDismiss={() => {
            setSuccessModalVisible(false);
            router.push(successNextPath as '/(buyer)/(index)');
          }}
          style={defaultStyles.dialogSuccessContainer}>
          <Dialog.Content>
            <Image
              source={require('@/assets/images/success.png')}
              style={defaultStyles.successImage}
            />
          </Dialog.Content>
          <Dialog.Content>
            <Text variant="titleLarge" style={defaultStyles.primaryText}>
              {i18n.t('(subscription).(payment).paymentSuccessful')}
            </Text>
          </Dialog.Content>
        </Dialog>
      </Portal>

      {/* Failure Portal */}
      <Portal>
        <Dialog
          visible={failureModalVisible}
          onDismiss={() => {
            setFailureModalVisible(false);
            router.back();
          }}
          style={defaultStyles.dialogSuccessContainer}>
          <Dialog.Content>
            <Image
              source={require('@/assets/images/error.png')}
              style={defaultStyles.successImage}
            />
          </Dialog.Content>
          <Dialog.Content>
            <Text variant="titleLarge" style={defaultStyles.errorText}>
              {i18n.t('(subscription).(payment).paymentFailed')}
            </Text>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </>
  );
};

export default TPWCardWebViewPage;

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: Colors.light['bg'],
    paddingTop: 16,
  },
  headerSection: {
    paddingHorizontal: 24,
  },
  webview: {
    flex: 1,
    margin: 0,
    backgroundColor: Colors.light['bg'],
  },
  webviewPlaceholder: {
    flex: 1,
    backgroundColor: Colors.light['bg'],
  },
  errorBody: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
});
