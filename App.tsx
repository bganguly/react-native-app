import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { fetchCommunityContent } from './src/services/communityApi';
import { ContentItem, ContentType } from './src/types';

type AudienceFilter = 'All' | 'Student' | 'Parent' | 'Educator';

const audienceOptions: AudienceFilter[] = ['All', 'Student', 'Parent', 'Educator'];

export default function App() {
  const [contentType, setContentType] = useState<ContentType>('Video');
  const [audience, setAudience] = useState<AudienceFilter>('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<ContentItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      const response = await fetchCommunityContent({ contentType, audience, search });
      if (isMounted) {
        setResults(response.items);
        setLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [contentType, audience, search]);

  const renderItem: ListRenderItem<ContentItem> = ({ item }) => {
    const metric = 'duration' in item ? item.duration : item.readTime;

    return (
      <View style={styles.card}>
        <View style={styles.cardMetaRow}>
          <Text style={styles.typeLabel}>{contentType.toUpperCase()}</Text>
          <Text style={styles.duration}>{metric}</Text>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardBody}>{item.description}</Text>

        <View style={styles.tagRow}>
          <Text style={styles.tag}>{item.audience}</Text>
          <Text style={styles.tag}>{item.category}</Text>
          {item.language ? <Text style={styles.tag}>{item.language}</Text> : null}
          {item.requiresLogin ? <Text style={styles.lockTag}>LOG IN TO VIEW</Text> : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <FlatList
          contentContainerStyle={styles.contentContainer}
          data={results}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View>
              <Text style={styles.brand}>BigFuture Community Library</Text>
              <Text style={styles.heading}>{contentType}s</Text>
              <Text style={styles.subheading}>
                Starter mobile experience with local mocked API data.
              </Text>

              <View style={styles.switchRow}>
                {(['Video', 'Article'] as ContentType[]).map((option) => {
                  const selected = option === contentType;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setContentType(option)}
                      style={[styles.toggle, selected && styles.toggleSelected]}
                    >
                      <Text style={[styles.toggleText, selected && styles.toggleTextSelected]}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TextInput
                onChangeText={setSearch}
                placeholder={`Search ${contentType.toLowerCase()}s`}
                placeholderTextColor="#64748b"
                style={styles.searchInput}
                value={search}
              />

              <View style={styles.audienceRow}>
                {audienceOptions.map((option) => {
                  const selected = audience === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setAudience(option)}
                      style={[styles.filterPill, selected && styles.filterPillSelected]}
                    >
                      <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.resultCount}>{results.length} Results</Text>
            </View>
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.centerState}>
                <ActivityIndicator color="#1d4ed8" size="large" />
                <Text style={styles.stateText}>Loading content...</Text>
              </View>
            ) : (
              <View style={styles.centerState}>
                <Text style={styles.stateText}>No results for your current filters.</Text>
              </View>
            )
          }
          renderItem={renderItem}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  brand: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  heading: {
    color: '#0f172a',
    fontSize: 30,
    fontWeight: '800',
  },
  subheading: {
    color: '#475569',
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
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  toggleSelected: {
    backgroundColor: '#1d4ed8',
  },
  toggleText: {
    color: '#1e293b',
    fontWeight: '700',
  },
  toggleTextSelected: {
    color: '#f8fafc',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
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
    backgroundColor: '#dbeafe',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterPillSelected: {
    backgroundColor: '#1e3a8a',
  },
  filterText: {
    color: '#1e3a8a',
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextSelected: {
    color: '#eff6ff',
  },
  resultCount: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    padding: 14,
  },
  cardMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeLabel: {
    color: '#2563eb',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  duration: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  cardBody: {
    color: '#334155',
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
    backgroundColor: '#f1f5f9',
    borderRadius: 999,
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  lockTag: {
    backgroundColor: '#0f172a',
    borderRadius: 999,
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  centerState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  stateText: {
    color: '#475569',
    marginTop: 8,
  },
});
