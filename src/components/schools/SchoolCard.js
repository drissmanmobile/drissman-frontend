// src/components/schools/SchoolCard.js
import { useTheme } from '../../context/ThemeContext'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { Colors, Typography, Spacing, Radius, Shadows } from '../../utils/theme'
import { formatPrice } from '../../utils/formatters'
import { Ionicons } from '@expo/vector-icons'

export default function SchoolCard({ school, onPress }) {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const lowestPrice = school.offers?.length
    ? Math.min(...school.offers.map((o) => o.price))
    : null

  return (
    <TouchableOpacity
      onPress={() => onPress?.(school)}
      activeOpacity={0.85}
      style={styles.card}
    >
      {/* Image placeholder */}
      <View style={styles.imagePlaceholder}>
        {school.imageUrl ? (
          <Image source={{ uri: school.imageUrl }} style={styles.image} />
        ) : (
          <Ionicons name="business-outline" size={36} color={themeColors.textSecondary} />
        )}
      </View>

      <View style={styles.body}>
        {/* Nom */}
        <Text style={styles.name} numberOfLines={1}>{school.name}</Text>

        {/* Ville & Distance */}
        <Text style={styles.city}>
          <Ionicons name="location-outline" size={12} color={themeColors.textSecondary} /> {school.city}
          {school.calculatedDistance != null && ` • ${school.calculatedDistance.toFixed(1)} km`}
        </Text>

        {/* Note */}
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color={themeColors.primary} />
          <Text style={styles.ratingValue}>{school.rating}</Text>
          <Text style={styles.ratingCount}>({school.reviewCount} avis)</Text>
        </View>

        {/* Services */}
        <View style={styles.tagsRow}>
          {school.services?.slice(0, 2).map((s) => (
            <View key={s} style={styles.tag}>
              <Text style={styles.tagText}>{s}</Text>
            </View>
          ))}
          {school.services?.length > 2 && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>+{school.services.length - 2}</Text>
            </View>
          )}
        </View>

        {/* Prix + CTA */}
        <View style={styles.footer}>
          {lowestPrice !== null && (
            <View>
              <Text style={styles.priceLabel}>À partir de</Text>
              <Text style={styles.price}>{formatPrice(lowestPrice)}</Text>
            </View>
          )}
          <View style={styles.cta}>
            <Text style={styles.ctaText}>Voir →</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const getStyles = (themeColors) => StyleSheet.create({
  card: {
    backgroundColor: themeColors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.md,
  },
  imagePlaceholder: {
    width: '100%',
    height: 130,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholderText: { fontSize: 36 },
  body: { padding: Spacing.md },
  name: { ...Typography.h4, color: themeColors.textPrimary, marginBottom: 4 },
  city: { ...Typography.small, color: themeColors.textSecondary, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4 },
  star: { color: themeColors.primary, fontSize: 14 },
  ratingValue: { ...Typography.bodyMedium, color: themeColors.textPrimary },
  ratingCount: { ...Typography.small, color: themeColors.textMuted },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: { backgroundColor: themeColors.borderLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  tagText: { ...Typography.caption, color: themeColors.textSecondary },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  priceLabel: { ...Typography.caption, color: themeColors.textMuted },
  price: { ...Typography.bodyMedium, color: themeColors.textPrimary, fontWeight: '700' },
  cta: { backgroundColor: themeColors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.md },
  ctaText: { fontSize: 13, fontWeight: '700', color: themeColors.textOnPrimary },
})
