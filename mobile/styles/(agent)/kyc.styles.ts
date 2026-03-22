import { StyleSheet } from 'react-native';
import { Colors } from '@/constants';

export const kycStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light[10],
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: Colors.light['bg'],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    textAlign: 'center',
    width: '100%',
    color: Colors.grey['79'],
    fontSize: 16,
    lineHeight: 28,
    marginBottom: 10,
  },
  scrollContent: {
    // paddingHorizontal: 16,
    paddingBottom: 100,
  },
  documentCard: {
    backgroundColor: Colors.light['bg'],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.grey['border'],
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: 14,
    color: Colors.grey['79'],
    marginBottom: 16,
  },
  imageContainer: {
    height: 180,
    borderRadius: 12,
    backgroundColor: Colors.grey['fa'],
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  placeholderIcon: {
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: Colors.grey['61'],
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: Colors.light['bg'],
    borderTopWidth: 1,
    borderTopColor: Colors.grey['border'],
  },
  button: {
    backgroundColor: Colors.primary['500'],
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.light['10'],
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    color: Colors.grey['61'],
    textAlign: 'center',
    lineHeight: 20,
  },
  idContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  idHalf: {
    flex: 1,
  },
  idLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: Colors.grey['79'],
  },
  pdfPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
