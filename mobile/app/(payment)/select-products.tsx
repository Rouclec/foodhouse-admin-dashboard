import { SafeAreaView, ScrollView, TouchableOpacity, View, FlatList, Image } from 'react-native';
import React, { useState, useContext } from 'react';
import { defaultStyles, selectProductsStyles as styles } from '@/styles';
import { Text, Button, Icon, Appbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { productsListProductsOptions } from '@/client/products.swagger/@tanstack/react-query.gen';
import { Context, ContextType } from '@/app/_layout';
import { Colors } from '@/constants';
import { Chase } from 'react-native-animated-spinkit';

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
  
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [activeDelivery, setActiveDelivery] = useState(1);
  
  const totalBudget = parseInt(budget || '75000');
  const numDeliveries = parseInt(deliveries || '2');
  const budgetPerDelivery = totalBudget / numDeliveries;
  
  const { data: productsData, isLoading } = useQuery({
    ...productsListProductsOptions({
      query: { isApproved: true, count: 50 },
    }),
  });
  
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
  const remaining = totalBudget - budgetUsed;
  
  if (isLoading) {
    return (
      <View style={[defaultStyles.flex, defaultStyles.center]}>
        <Chase size={32} color={Colors.primary[500]} />
      </View>
    );
  }

  const addProduct = (product: Product) => {
    setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
  };

  const updateQuantity = (id: string, delta: number) => {
    setSelectedProducts(
      selectedProducts.map(p =>
        p.id === id ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p
      ).filter(p => p.quantity > 0)
    );
  };

  return (
    <View style={defaultStyles.flex}>
      <Appbar.Header style={styles.appHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={defaultStyles.backButtonContainer}>
          <Icon source={'arrow-left'} size={24} color={Colors.dark[0]} />
        </TouchableOpacity>
        <Text variant="titleMedium" style={styles.headerTitle}>
          Select Products
        </Text>
        <View style={{ width: 64 }} />
      </Appbar.Header>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.budgetCard}>
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetLabel}>Budget Used</Text>
            <Text style={styles.budgetAmount}>
              {budgetUsed.toLocaleString()} / {totalBudget.toLocaleString()} XAF
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(budgetUsed / totalBudget) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.remainingText}>
            Remaining: {remaining.toLocaleString()} XAF
          </Text>
        </View>

        <View style={styles.deliveryTabs}>
          {Array.from({ length: numDeliveries }, (_, i) => i + 1).map(deliveryNum => (
            <TouchableOpacity
              key={deliveryNum}
              style={[styles.deliveryTab, activeDelivery === deliveryNum && styles.deliveryTabActive]}
              onPress={() => setActiveDelivery(deliveryNum)}>
              <Text style={[styles.deliveryTabText, activeDelivery === deliveryNum && styles.deliveryTabTextActive]}>
                Delivery {deliveryNum}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Selected Items</Text>
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
              <TouchableOpacity
                style={styles.quantityButtonGreen}
                onPress={() => updateQuantity(product.id, 1)}>
                <Icon source="plus" size={16} color={Colors.light[10]} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Available Products</Text>
        {availableProducts.map(product => (
          <View key={product.id} style={styles.availableProductCard}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
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
                <Text style={styles.productUnit}>{product.unit}</Text>
                <Text style={styles.productPriceGreen}>
                  {product.price.toLocaleString()} XAF
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addProduct(product)}>
                <Icon source="plus" size={24} color={Colors.light[10]} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <SafeAreaView style={styles.footer}>
        <Button
          mode="contained"
          style={[defaultStyles.button, defaultStyles.primaryButton]}
                    contentStyle={[defaultStyles.center]}
          onPress={() => {
            const subscriptionItems = selectedProducts.map(product => ({
              productId: product.id,
              quantity: product.quantity.toString(),
              productName: product.name,
              productUnitPrice: { value: product.price, currencyIsoCode: 'XAF' },
              unitType: product.unit,
              orderIndex: 0,
            }));
            
            router.push({
              pathname: '/(payment)/summary',
              params: {
                budget,
                deliveries,
                selectedProducts: JSON.stringify(selectedProducts),
                subscriptionItems: JSON.stringify(subscriptionItems),
              },
            });
          }}>
          <Text variant="titleMedium" style={defaultStyles?.buttonText}>
                      View Summary
                    </Text>
        </Button>
      </SafeAreaView>
    </View>
  );
}
