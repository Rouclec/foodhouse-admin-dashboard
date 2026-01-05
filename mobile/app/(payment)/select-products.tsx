import { SafeAreaView, ScrollView, TouchableOpacity, View, FlatList, Image } from 'react-native';
import React, { useEffect, useState, useContext } from 'react';
import { defaultStyles, selectProductsStyles as styles } from '@/styles';
import { Text, Button, Icon, Appbar, Snackbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { productsListProductsOptions } from '@/client/products.swagger/@tanstack/react-query.gen';
import { Context, ContextType } from '@/app/_layout';
import { Colors } from '@/constants';
import { Chase } from 'react-native-animated-spinkit';
import i18n from '@/i18n';

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  quantity: number;
  image?: string;
};

export default function SelectProducts() {
  const { budget, deliveries } = useLocalSearchParams<{ budget: string; deliveries: string }>();
  const { user } = useContext(Context) as ContextType;
  const router = useRouter();

  const [selectedProductsByDelivery, setSelectedProductsByDelivery] = useState<Record<number, Product[]>>({});
  const [activeDelivery, setActiveDelivery] = useState(1);
  const [snack, setSnack] = useState<string | null>(null);

  const totalBudget = parseInt(budget || '75000');
  const numDeliveries = parseInt(deliveries || '2');
  const budgetPerDelivery = Math.floor(totalBudget / numDeliveries);

  useEffect(() => {
    // Ensure each delivery has a list initialized (without forcing re-renders when unchanged).
    setSelectedProductsByDelivery(prev => {
      let changed = false;
      const next: Record<number, Product[]> = { ...prev };
      for (let d = 1; d <= numDeliveries; d++) {
        if (!next[d]) {
          next[d] = [];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setActiveDelivery(cur => (cur > numDeliveries ? 1 : cur));
  }, [numDeliveries]);

  const { data: productsData, isLoading } = useQuery({
    ...productsListProductsOptions({
      query: { isApproved: true, count: 50 },
    }),
  });

  const selectedProducts = selectedProductsByDelivery[activeDelivery] ?? [];

  const availableProducts = productsData?.products?.filter(
    product => !selectedProducts.find(sp => sp.id === product.id)
  ).map(product => ({
    id: product.id || '',
    name: product.name || '',
    category: product.category?.name || '',
    price: product.amount?.value || 0,
    unit: product.unitType || '',
    quantity: 0,
    image: product.image || '',
  })) || [];

  const budgetUsed = selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const remaining = budgetPerDelivery - budgetUsed;

  if (isLoading) {
    return (
      <View style={[defaultStyles.flex, defaultStyles.center]}>
        <Chase size={32} color={Colors.primary[500]} />
      </View>
    );
  }

  const addProduct = (product: Product) => {
    setSelectedProductsByDelivery(prev => {
      const current = prev[activeDelivery] ?? [];
      const currentTotal = current.reduce((sum, p) => sum + p.price * p.quantity, 0);
      const nextTotal = currentTotal + product.price;
      if (nextTotal > budgetPerDelivery) {
        setSnack(i18n.t('(subscription).(selectProducts).budgetExceeded'));
        return prev;
      }
      return { ...prev, [activeDelivery]: [...current, { ...product, quantity: 1 }] };
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setSelectedProductsByDelivery(prev => {
      const current = prev[activeDelivery] ?? [];
      if (delta > 0) {
        const currentTotal = current.reduce((sum, p) => sum + p.price * p.quantity, 0);
        const target = current.find(p => p.id === id);
        if (!target) return prev;
        const nextTotal = currentTotal + target.price;
        if (nextTotal > budgetPerDelivery) {
          setSnack(i18n.t('(subscription).(selectProducts).budgetExceeded'));
          return prev;
        }
      }
      const next = current
        .map(p => (p.id === id ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p))
        .filter(p => p.quantity > 0);
      return { ...prev, [activeDelivery]: next };
    });
  };

  return (
    <View style={defaultStyles.flex}>
      <Appbar.Header style={[styles.appHeader, { paddingHorizontal: 24, }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={defaultStyles.backButtonContainer}>
          <Icon source={'arrow-left'} size={24} color={Colors.dark[0]} />
        </TouchableOpacity>
        <Text variant="titleMedium" style={styles.headerTitle}>
          {i18n.t('(subscription).(selectProducts).header')}
        </Text>
        <View style={{ width: 64 }} />
      </Appbar.Header>

      <ScrollView
        style={[styles.scrollView, { paddingHorizontal: 8 }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetLabel}>{i18n.t('(subscription).(selectProducts).budgetUsed')}</Text>
            <Text style={styles.budgetAmount}>
              {budgetUsed.toLocaleString()} / {budgetPerDelivery.toLocaleString()} XAF
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, (budgetUsed / budgetPerDelivery) * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.remainingText}>
            {i18n.t('(subscription).(selectProducts).remaining')}: {remaining.toLocaleString()} XAF
          </Text>
          <Text style={[styles.productPrice, { marginTop: 6 }]}>
            {i18n.t('(subscription).(selectProducts).leftoverOk')}
          </Text>
        </View>

        <View style={styles.deliveryTabs}>
          {Array.from({ length: numDeliveries }, (_, i) => i + 1).map(deliveryNum => (
            <TouchableOpacity
              key={deliveryNum}
              style={[styles.deliveryTab, activeDelivery === deliveryNum && styles.deliveryTabActive]}
              onPress={() => setActiveDelivery(deliveryNum)}>
              <Text style={[styles.deliveryTabText, activeDelivery === deliveryNum && styles.deliveryTabTextActive]}>
                {i18n.t('(subscription).(selectProducts).delivery')} {deliveryNum}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{i18n.t('(subscription).(selectProducts).selectedItems')}</Text>
        {selectedProducts.map(product => (
          <View key={product.id} style={styles.productCard}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>
                {product.price.toLocaleString()} XAF / {product.unit}
              </Text>
            </View>
            <View style={styles.quantityControl}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => updateQuantity(product.id, -1)}>
                <Icon source="minus" size={16} color={Colors.grey[61]} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{product.quantity}</Text>
              {(() => {
                const canIncrement = budgetUsed + product.price <= budgetPerDelivery;
                return (
                  <TouchableOpacity
                    disabled={!canIncrement}
                    style={[styles.quantityButtonGreen, !canIncrement && { opacity: 0.4 }]}
                    onPress={() => updateQuantity(product.id, 1)}>
                    <Icon source="plus" size={16} color={Colors.light[10]} />
                  </TouchableOpacity>
                );
              })()}
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>{i18n.t('(subscription).(selectProducts).availableProducts')}</Text>
        {availableProducts.map(product => (
          <View key={product.id} style={styles.availableProductCard}>
            {/* <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View> */}
            <View style={styles.productRow}>
              {product.image ? (
                <Image
                  source={{ uri: product.image }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.productImagePlaceholder}>
                  <Icon source="image" size={24} color={Colors.grey[61]} />
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPriceGreen}>
                  {product.price.toLocaleString()} XAF / <Text style={styles.productUnit}>{product.unit.replace("per_", "")}</Text>
                </Text>
              </View>
              {(() => {
                const canAdd = remaining >= product.price;
                return (
                  <TouchableOpacity
                    disabled={!canAdd}
                    style={[styles.addButton, !canAdd && { opacity: 0.4 }]}
                    onPress={() => addProduct(product)}>
                    <Icon source="plus" size={24} color={Colors.light[10]} />
                  </TouchableOpacity>
                );
              })()}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          mode="contained"
          style={[defaultStyles.button, defaultStyles.primaryButton]}
          contentStyle={[defaultStyles.center]}
          onPress={() => {
            const productsByDelivery: Record<number, Product[]> = {};
            for (let d = 1; d <= numDeliveries; d++) {
              productsByDelivery[d] = selectedProductsByDelivery[d] ?? [];
            }
            const flattenedProducts = Object.values(productsByDelivery).flat();

            const subscriptionItems = Object.entries(productsByDelivery).flatMap(
              ([deliveryNum, products]) => {
                const orderIndex = Math.max(0, Number(deliveryNum) - 1);
                return (products ?? []).map(product => ({
                  productId: product.id,
                  quantity: product.quantity.toString(),
                  productName: product.name,
                  productUnitPrice: { value: product.price, currencyIsoCode: 'XAF' },
                  unitType: product.unit,
                  orderIndex,
                }));
              },
            );

            router.push({
              pathname: '/(payment)/summary',
              params: {
                budget,
                deliveries,
                // Backward compatible param (flattened). Prefer selectedProductsByDelivery downstream.
                selectedProducts: JSON.stringify(flattenedProducts),
                selectedProductsByDelivery: JSON.stringify(productsByDelivery),
                subscriptionItems: JSON.stringify(subscriptionItems),
              },
            });
          }}>
          <Text variant="titleMedium" style={defaultStyles?.buttonText}>
            {i18n.t('(subscription).(selectProducts).viewSummary')}
          </Text>
        </Button>
      </View>

      <Snackbar
        visible={!!snack}
        onDismiss={() => setSnack(null)}
        duration={2500}>
        {snack}
      </Snackbar>
    </View>
  );
}
