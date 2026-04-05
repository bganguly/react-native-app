import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ListRenderItem,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { fetchCommunityContentPage } from './src/services/communityApi';
import { styles } from './src/styles/appStyles';
import { colors } from './src/styles/colors';
import { ContentItem, ContentType } from './src/types';

type AudienceFilter = 'All' | 'Student' | 'Parent' | 'Educator';

const audienceOptions: AudienceFilter[] = ['All', 'Student', 'Parent', 'Educator'];
const PAGE_SIZE = 9;

export default function App() {
  const [contentType, setContentType] = useState<ContentType>('Video');
  const [audience, setAudience] = useState<AudienceFilter>('All');
  const [search, setSearch] = useState('');
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [results, setResults] = useState<ContentItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [thumbnailRetry, setThumbnailRetry] = useState<Record<string, boolean>>({});
  const [thumbnailFailed, setThumbnailFailed] = useState<Record<string, boolean>>({});
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let requestId = 0;

    const loadPage = async (nextOffset: number, append: boolean) => {
      if (!isMounted) {
        return;
      }

      requestId += 1;
      const activeRequest = requestId;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoadingInitial(true);
        setLoadError(null);
      }

      try {
        const response = await fetchCommunityContentPage({
          contentType,
          audience,
          search,
          offset: nextOffset,
          limit: PAGE_SIZE,
        });

        if (!isMounted || activeRequest !== requestId) {
          return;
        }

        setTotalCount(response.total);
        setOffset(nextOffset + PAGE_SIZE);
        if (!append) {
          setThumbnailRetry({});
          setThumbnailFailed({});
        }

        setResults((previous) => {
          if (!append) {
            return response.items;
          }

          return [...previous, ...response.items];
        });
      } catch (error) {
        if (!isMounted || activeRequest !== requestId) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Failed to load content.';
        setLoadError(message);
      }

      setLoadingInitial(false);
      setLoadingMore(false);
    };

    void loadPage(0, false);

    return () => {
      isMounted = false;
    };
  }, [contentType, audience, search]);

  const hasMore = offset < totalCount;

  const loadMore = async () => {
    if (loadingInitial || loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);
    setLoadError(null);

    try {
      const response = await fetchCommunityContentPage({
        contentType,
        audience,
        search,
        offset,
        limit: PAGE_SIZE,
      });

      setResults((previous) => [...previous, ...response.items]);
      setTotalCount(response.total);
      setOffset((previous) => previous + PAGE_SIZE);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load more content.';
      setLoadError(message);
    }

    setLoadingMore(false);
  };

  const renderItem: ListRenderItem<ContentItem> = ({ item }) => {
    const metric = 'duration' in item ? item.duration : item.readTime;
    const useFallback = thumbnailRetry[item.id] ?? false;
    const hasFailedThumbnail = thumbnailFailed[item.id] ?? false;
    const thumbnailUrl =
      'duration' in item
        ? useFallback
          ? item.thumbnailFallbackUrl ?? item.thumbnailUrl
          : item.thumbnailUrl
        : undefined;
    const showThumbnail = Boolean(thumbnailUrl) && !hasFailedThumbnail;
    const showThumbnailPlaceholder = 'duration' in item && !showThumbnail;

    return (
      <View style={styles.card}>
        {showThumbnail ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
            onError={() => {
              if (!('duration' in item)) {
                return;
              }

              if (item.thumbnailFallbackUrl && !thumbnailRetry[item.id]) {
                setThumbnailRetry((previous) => ({ ...previous, [item.id]: true }));
                return;
              }

              setThumbnailFailed((previous) => ({ ...previous, [item.id]: true }));
            }}
          />
        ) : null}
        {showThumbnailPlaceholder ? (
          <View style={styles.thumbnailPlaceholder}>
            <Text style={styles.thumbnailPlaceholderText}>Thumbnail unavailable</Text>
          </View>
        ) : null}

        <View style={styles.cardMetaRow}>
          <Text style={styles.typeLabel}>{contentType.toUpperCase()}</Text>
          <Text style={styles.duration}>{metric}</Text>
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardBody}>{item.description}</Text>

        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.audience}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.category}</Text>
          </View>
          {item.language ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.language}</Text>
            </View>
          ) : null}
          {item.requiresLogin ? (
            <View style={styles.lockTag}>
              <Text style={styles.lockTagText}>LOG IN TO VIEW</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.blue700} size="small" />
          <Text style={styles.stateText}>Loading more...</Text>
        </View>
      );
    }

    if (results.length > 0 && !hasMore) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>No more results.</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        <FlatList
          contentContainerStyle={styles.contentContainer}
          data={results}
          keyExtractor={(item) => item.id}
          onEndReached={loadMore}
          onEndReachedThreshold={0.25}
          ListHeaderComponent={
            <View>
              <Text style={styles.brand}>BigFuture Community Library</Text>
              <Text style={styles.heading}>{contentType}s</Text>
              <Text style={styles.subheading}>
                Starter mobile experience with live Community Hub API data.
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
                placeholderTextColor={colors.slate600}
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
            loadingInitial ? (
              <View style={styles.centerState}>
                <ActivityIndicator color={colors.blue700} size="large" />
                <Text style={styles.stateText}>Loading content...</Text>
              </View>
            ) : loadError ? (
              <View style={styles.centerState}>
                <Text style={styles.stateText}>Unable to load content.</Text>
                <Text style={styles.stateText}>{loadError}</Text>
              </View>
            ) : (
              <View style={styles.centerState}>
                <Text style={styles.stateText}>No results for your current filters.</Text>
              </View>
            )
          }
          ListFooterComponent={renderFooter}
          renderItem={renderItem}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
