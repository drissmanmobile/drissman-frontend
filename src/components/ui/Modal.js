import { useTheme } from '../../context/ThemeContext'
import RNModal from 'react-native-modal'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors, Typography, Spacing, Shadows } from '../../utils/theme'

export function Modal({ isVisible, onClose, title, children }) {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  return (
    <RNModal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>x</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.body}>{children}</View>
      </View>
    </RNModal>
  )
}

export default Modal

const getStyles = (themeColors) => StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  title: {
    ...Typography.h4,
    color: themeColors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: themeColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 14,
    color: themeColors.textSecondary,
    fontWeight: '600',
  },
  body: {
    padding: Spacing.md,
  },
})
