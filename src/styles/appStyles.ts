import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.slate50,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  brand: {
    color: colors.slate950,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  heading: {
    color: colors.slate950,
    fontSize: 30,
    fontWeight: '800',
  },
  subheading: {
    color: colors.slate600,
    fontSize: 14,
    marginBottom: 14,
    marginTop: 4,
  },
  switchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  toggle: {
    backgroundColor: colors.slate200,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  toggleSelected: {
    backgroundColor: colors.blue700,
  },
  toggleText: {
    color: colors.slate800,
    fontWeight: '700',
  },
  toggleTextSelected: {
    color: colors.slate50,
  },
  searchInput: {
    backgroundColor: colors.white,
    borderColor: colors.slate300,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 15,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  audienceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    backgroundColor: colors.blue100,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterPillSelected: {
    backgroundColor: colors.blue900,
  },
  filterText: {
    color: colors.blue900,
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextSelected: {
    color: colors.blue50,
  },
  resultCount: {
    color: colors.slate700,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.slate200,
    marginBottom: 12,
    padding: 14,
  },
  thumbnail: {
    borderRadius: 10,
    height: 180,
    marginBottom: 10,
    width: '100%',
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.slate100,
    borderColor: colors.slate200,
    borderRadius: 10,
    borderWidth: 1,
    height: 180,
    justifyContent: 'center',
    marginBottom: 10,
    width: '100%',
  },
  thumbnailPlaceholderText: {
    color: colors.slate600,
    fontSize: 13,
    fontWeight: '700',
  },
  cardMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeLabel: {
    color: colors.blue600,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  duration: {
    color: colors.slate600,
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    color: colors.slate950,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardBody: {
    color: colors.slate700,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.slate100,
    borderRadius: 999,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    color: colors.slate700,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },
  lockTag: {
    backgroundColor: colors.slate950,
    borderRadius: 999,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  lockTagText: {
    color: colors.slate50,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  centerState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  stateText: {
    color: colors.slate600,
    marginTop: 8,
  },
});
