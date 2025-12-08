import { SafeAreaView, ScrollView, TouchableOpacity, View, FlatList } from 'react-native';
import React, { useState } from 'react';
import { defaultStyles, selectProductsStyles as styles } from '@/styles';
import { Text, Button, Icon, Appbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants';

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  quantity: number;
};

const availableProducts: Product[] = [
  { id: '1', name: 'Sweet Potatoes', category: 'Tubers', price: 2000, unit: 'kg Bag', quantity: 0 },
  { id: '2', name: 'Cabbage', category: 'Vegetables', price: 1500, unit: 'kg Bag', quantity: 0 },
];

export default function SelectProducts() {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([
    { id: '0', name: 'Irish Potatoes', category: 'Tubers', price: 2500, unit: 'kg Bag', quantity: 14 },
  ]);
  const [products, setProducts] = useState(availableProducts);
  const [activeDelivery, setActiveDelivery] = useState(1);
  const router = useRouter();

  const budgetUsed = selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const totalBudget = 37500;
  const remaining = totalBudget - budgetUsed;

  const addProduct = (product: Product) => {
    setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    setProducts(products.filter(p => p.id !== product.id));
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
          <TouchableOpacity
            style={[styles.deliveryTab, activeDelivery === 1 && styles.deliveryTabActive]}
            onPress={() => setActiveDelivery(1)}>
            <Text style={[styles.deliveryTabText, activeDelivery === 1 && styles.deliveryTabTextActive]}>
              Delivery 1
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deliveryTab, activeDelivery === 2 && styles.deliveryTabActive]}
            onPress={() => setActiveDelivery(2)}>
            <Text style={[styles.deliveryTabText, activeDelivery === 2 && styles.deliveryTabTextActive]}>
              Delivery 2
            </Text>
          </TouchableOpacity>
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
        {products.map(product => (
          <View key={product.id} style={styles.availableProductCard}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
            <View style={styles.productRow}>
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
          onPress={() => router.push('/(payment)/summary')}>
          <Text variant="titleMedium" style={defaultStyles?.buttonText}>
                      View Summary
                    </Text>
        </Button>
      </SafeAreaView>
    </View>
  );
}
