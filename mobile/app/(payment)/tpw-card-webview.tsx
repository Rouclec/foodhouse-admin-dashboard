import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Appbar, Dialog, Icon, Portal, Text } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import { useQuery } from '@tanstack/react-query';
import { Chase } from 'react-native-animated-spinkit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants';
import { defaultStyles } from '@/styles';
import { ordersCheckPaymentStatusOptions } from '@/client/orders.swagger/@tanstack/react-query.gen';
import { Context, ContextType } from '../_layout';
import { useAppRating } from '@/hooks/useAppRating';
import i18n from '@/i18n';

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

const TPWCardWebViewPage = () => {
  const router = useRouter();
  const params = useLocalSearchParams<Params>();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
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

  const terminalPath = useMemo(() => {
    // These are the frontend endpoints we configured TPW to redirect to.
    // We match by path instead of exact domain to keep it environment-agnostic.
    return {
      returnPath: '/payments/tpw/return',
      cancelPath: '/payments/tpw/cancel',
    };
  }, []);

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
    if (paymentStatus?.status === 'PaymentStatus_INITIATED') return;

    if (paymentStatus?.status === 'PaymentStatus_COMPLETED') {
      setLoadingModalVisible(false);
      setSuccessModalVisible(true);
      setPaymentData(undefined);
      clearCart();
      void requestReview();
    }

    if (paymentStatus?.status === 'PaymentStatus_FAILED') {
      setLoadingModalVisible(false);
      setFailureModalVisible(true);
    }
  }, [paymentStatus]);

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

        <WebView
          ref={webViewRef}
          style={styles.webview}
          source={{ uri: checkoutUrl }}
          startInLoadingState={true}
          injectedJavaScriptBeforeContentLoaded={scrollAssistBeforeLoad}
          onLoadEnd={reinjectScrollAssist}
          onNavigationStateChange={(navState: any) => {
            const url = navState.url ?? '';
            if (!url) return;

            // When TPW redirects to our frontend, react immediately.
            if (url.includes(terminalPath.cancelPath)) {
              setCancelModalVisible(true);
            }

            if (url.includes(terminalPath.returnPath)) {
              // Payment finished on provider side; now confirm backend status.
              setLoadingModalVisible(true);
            }
          }}
        />
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
            router.push(
              (paymentData?.nextScreen ??
                '/(buyer)/(index)') as '/(buyer)/(index)',
            );
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
  errorBody: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
});
