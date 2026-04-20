import { productsgrpcCategory } from '@/client/products.swagger';
import React, { FC } from 'react';
import { Dimensions, Image, TouchableOpacity, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { Colors } from '@/constants';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 32 - 12) / 2;

interface CategoryCardProps {
  category: productsgrpcCategory;
  isSelected: boolean;
  onPress: () => void;
  productCount?: number;
}

export const CategoryCard: FC<CategoryCardProps> = ({
  category,
  isSelected,
  onPress,
  productCount,
}) => {
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
      <View
        style={[
          styles.mediaContainer,
          { backgroundColor: isSelected ? Colors.primary[500] : Colors.grey['fa'] },
        ]}>
        {category.image ? (
          <Image
            source={{ uri: category.image }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.mediaPlaceholder}>
            <Icon
              source="cart-outline"
              size={44}
              color={isSelected ? Colors.light[10] : Colors.primary[500]}
            />
          </View>
        )}
      </View>
      <View style={styles.textContainer}>
        <Text
          variant="titleMedium"
          style={[
            styles.categoryName,
            { color: isSelected ? Colors.light[10] : Colors.dark[0] },
          ]}
          numberOfLines={2}>
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
      </View>
    </TouchableOpacity>
  );
};

const styles = {
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'stretch' as const,
    marginBottom: 12,
    overflow: 'hidden' as const,
  },
  mediaContainer: {
    width: '100%' as const,
    height: 116,
    overflow: 'hidden' as const,
  },
  mediaImage: {
    width: '100%' as const,
    height: '100%' as const,
  },
  mediaPlaceholder: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: Colors.grey['fa'],
  },
  textContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'left' as const,
    minHeight: 34,
  },
  productCount: {
    fontSize: 12,
  },
};
