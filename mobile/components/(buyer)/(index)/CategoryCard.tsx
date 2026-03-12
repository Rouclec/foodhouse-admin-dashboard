import { productsgrpcCategory } from '@/client/products.swagger';
import React, { FC } from 'react';
import { Dimensions, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '@/constants';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 32 - 12) / 2;

interface CategoryCardProps {
  category: productsgrpcCategory;
  isSelected: boolean;
  onPress: () => void;
  productCount?: number;
}

const categoryIcons: Record<string, string> = {
  vegetables: '🥬',
  fruits: '🍎',
  grains: '🌾',
  legumes: '🫘',
  tubers: '🥔',
  default: '🛒',
};

function getCategoryIcon(name: string = ''): string {
  const lowerName = name.toLowerCase();
  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (lowerName.includes(key)) {
      return icon;
    }
  }
  return categoryIcons.default;
}

export const CategoryCard: FC<CategoryCardProps> = ({
  category,
  isSelected,
  onPress,
  productCount,
}) => {
  const icon = getCategoryIcon(category.name);

  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor: isSelected ? Colors.primary[500] : Colors.light[10],
          borderColor: isSelected ? Colors.primary[500] : Colors.grey['border'],
        },
        styles.card,
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text
        variant="titleMedium"
        style={[
          styles.categoryName,
          { color: isSelected ? Colors.light[10] : Colors.dark[0] },
        ]}
        numberOfLines={1}>
        {category.name}
      </Text>
      {productCount !== undefined && (
        <Text
          style={[
            styles.productCount,
            { color: isSelected ? Colors.light[10] : Colors.grey['61'] },
          ]}>
          {productCount} {productCount === 1 ? 'item' : 'items'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = {
  card: {
    width: CARD_WIDTH,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.grey['fa'],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  productCount: {
    fontSize: 12,
    marginTop: 4,
  },
};
