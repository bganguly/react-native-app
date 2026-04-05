import { ArticleItem, Audience, ContentCategory, ContentItem, ContentType, VideoItem } from '../types';
import { FALLBACK_ARTICLES, FALLBACK_VIDEOS } from './communityFallbackData';

export type VideoQuery = {
  contentType: ContentType;
  search?: string;
  audience?: 'All' | 'Student' | 'Parent' | 'Educator';
};

export type ContentResponse = {
  total: number;
  items: ContentItem[];
};

export type PaginatedContentQuery = VideoQuery & {
  offset: number;
  limit: number;
};

const JSONAPI_BASE = 'https://bigfuture.collegeboard.org/jsonapi/';
const LIMITED_PREVIEW_ACCESS_LEVEL = '546c2dcd-379c-4cb6-8259-8b640b5f3fe0';

type JsonApiRef = {
  id: string;
  type: string;
};

type JsonApiCollection<T> = {
  data: T[];
  meta?: {
    count?: number;
  };
};

type JsonApiVideo = {
  id: string;
  title: string;
  langcode?: string;
  field_external_description?: string | null;
  field_video_duration?: string | null;
  field_video_link?: string | null;
  field_audience?: JsonApiRef[] | null;
  field_community_topics?: JsonApiRef[] | null;
  field_access_level?: JsonApiRef | null;
  field_thumbnail_media?: {
    data?: JsonApiRef | null;
    field_media_image?: {
      data?: JsonApiRef | null;
      uri?: {
        url?: string | null;
      } | null;
    } | null;
  } | null;
};

type JsonApiArticle = {
  id: string;
  title: string;
  langcode?: string;
  field_external_description?: string | null;
  field_preview_summary?: string | null;
  body?: { value?: string | null; summary?: string | null } | null;
  field_audience?: JsonApiRef[] | null;
  field_community_topics?: JsonApiRef[] | null;
  field_access_level?: JsonApiRef | null;
};

type JsonApiTaxonomyItem = {
  id: string;
  name?: string;
};

let audienceLookupPromise: Promise<Map<string, string>> | null = null;
let topicLookupPromise: Promise<Map<string, string>> | null = null;

function normalizeAudience(value?: string): Audience {
  const normalized = (value ?? '').toLowerCase();

  if (normalized.includes('parent')) {
    return 'Parent';
  }

  if (normalized.includes('student')) {
    return 'Student';
  }

  return 'Educator';
}

function inferCategoryFromTopic(topicName: string, title: string): ContentCategory {
  const source = `${topicName} ${title}`.toLowerCase();

  if (source.includes('sat') || source.includes('psat')) {
    return 'SAT';
  }

  if (source.includes('ap ') || source.includes('advanced placement')) {
    return 'AP';
  }

  if (source.includes('aid') || source.includes('scholarship') || source.includes('cost')) {
    return 'Financial Aid';
  }

  return 'College Planning';
}

function normalizeLanguage(langCode?: string): 'English' | 'Spanish' {
  return langCode?.toLowerCase().startsWith('es') ? 'Spanish' : 'English';
}

function stripHtml(raw?: string | null): string {
  if (!raw) {
    return '';
  }

  return raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .trim();
}

function shorten(text: string, max = 220): string {
  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, max - 1).trim()}...`;
}

function formatDescriptionForDisplay(raw?: string | null): string {
  return shorten(stripHtml(raw));
}

function toAbsoluteMediaUrl(path?: string | null): string | undefined {
  if (!path) {
    return undefined;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  if (path.startsWith('/')) {
    return `https://bigfuture.collegeboard.org${path}`;
  }

  return undefined;
}

function getYoutubeThumbnail(videoLink?: string | null): string | undefined {
  if (!videoLink) {
    return undefined;
  }

  const normalizedLink = videoLink.trim();
  const youtubeMatch = normalizedLink.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/
  );

  if (!youtubeMatch?.[1]) {
    return undefined;
  }

  return `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`;
}

function getYoutubeThumbnailFallback(videoLink?: string | null): string | undefined {
  if (!videoLink) {
    return undefined;
  }

  const normalizedLink = videoLink.trim();
  const youtubeMatch = normalizedLink.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/
  );

  if (!youtubeMatch?.[1]) {
    return undefined;
  }

  return `https://i.ytimg.com/vi/${youtubeMatch[1]}/hqdefault.jpg`;
}

function getVideoThumbnailUrl(item: JsonApiVideo): string | undefined {
  const mediaImageUrl = toAbsoluteMediaUrl(item.field_thumbnail_media?.field_media_image?.uri?.url);

  if (mediaImageUrl) {
    return mediaImageUrl;
  }

  return getYoutubeThumbnail(item.field_video_link);
}

function getFallbackPage(items: ContentItem[], offset: number, limit: number): ContentResponse {
  const pagedItems = items.slice(offset, offset + limit).map((item) => ({
    ...item,
    description: formatDescriptionForDisplay(item.description),
  }));

  return {
    total: items.length,
    items: pagedItems,
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}: ${url}`);
  }

  return (await response.json()) as T;
}

async function getAudienceLookup(): Promise<Map<string, string>> {
  if (!audienceLookupPromise) {
    audienceLookupPromise = fetchJson<{ data: JsonApiTaxonomyItem[] }>(
      `${JSONAPI_BASE}taxonomy_term/audience?fields[taxonomy_term--audience]=name&jsonapi_include=1`
    )
      .then((payload) => new Map(payload.data.map((item) => [item.id, item.name ?? ''])))
      .catch((error) => {
        audienceLookupPromise = null;
        throw error;
      });
  }

  return audienceLookupPromise;
}

async function getTopicLookup(): Promise<Map<string, string>> {
  if (!topicLookupPromise) {
    topicLookupPromise = fetchJson<{ data: JsonApiTaxonomyItem[] }>(
      `${JSONAPI_BASE}taxonomy_term/bigfuture_community_topics?fields[taxonomy_term--bigfuture_community_topics]=name,parent&jsonapi_include=1&page[limit]=200`
    )
      .then((payload) => new Map(payload.data.map((item) => [item.id, item.name ?? ''])))
      .catch((error) => {
        topicLookupPromise = null;
        throw error;
      });
  }

  return topicLookupPromise;
}

async function fetchVideos(): Promise<VideoItem[]> {
  const page = await fetchVideosPage(0, 60);

  return page.items as VideoItem[];
}

async function fetchVideosPage(offset: number, limit: number): Promise<ContentResponse> {
  try {
    const [videoPayload, audienceLookup, topicLookup] = await Promise.all([
      fetchJson<JsonApiCollection<JsonApiVideo>>(
        `${JSONAPI_BASE}resource/video?page[limit]=${limit}&page[offset]=${offset}&jsonapi_include=1&filter[status]=1&sort=-created`
      ),
      getAudienceLookup(),
      getTopicLookup(),
    ]);

    const items = videoPayload.data.map((item) => {
      const audienceName = audienceLookup.get(item.field_audience?.[0]?.id ?? '') ?? 'Educators';
      const topicName = topicLookup.get(item.field_community_topics?.[0]?.id ?? '') ?? '';
      const description = formatDescriptionForDisplay(item.field_external_description);

      return {
        id: item.id,
        title: item.title,
        description,
        duration: item.field_video_duration?.trim() || '0:00',
        thumbnailUrl: getVideoThumbnailUrl(item),
        thumbnailFallbackUrl: getYoutubeThumbnailFallback(item.field_video_link),
        audience: normalizeAudience(audienceName),
        category: inferCategoryFromTopic(topicName, item.title),
        requiresLogin: item.field_access_level?.id === LIMITED_PREVIEW_ACCESS_LEVEL,
        language: normalizeLanguage(item.langcode),
      } as VideoItem;
    });

    if (items.length === 0) {
      return getFallbackPage(FALLBACK_VIDEOS, offset, limit);
    }

    return {
      total: videoPayload.meta?.count ?? items.length,
      items,
    };
  } catch (error) {
    console.warn('Failed to fetch live videos. Falling back to local snapshot.', error);
    return getFallbackPage(FALLBACK_VIDEOS, offset, limit);
  }
}

async function fetchArticles(): Promise<ArticleItem[]> {
  const page = await fetchArticlesPage(0, 60);

  return page.items as ArticleItem[];
}

async function fetchArticlesPage(offset: number, limit: number): Promise<ContentResponse> {
  try {
    const [articlePayload, audienceLookup, topicLookup] = await Promise.all([
      fetchJson<JsonApiCollection<JsonApiArticle>>(
        `${JSONAPI_BASE}node/info_article?page[limit]=${limit}&page[offset]=${offset}&jsonapi_include=1&filter[status]=1&sort=-created`
      ),
      getAudienceLookup(),
      getTopicLookup(),
    ]);

    const items = articlePayload.data.map((item) => {
      const audienceName = audienceLookup.get(item.field_audience?.[0]?.id ?? '') ?? 'Educators';
      const topicName = topicLookup.get(item.field_community_topics?.[0]?.id ?? '') ?? '';
      const description = formatDescriptionForDisplay(
        item.field_external_description || item.field_preview_summary || item.body?.summary || item.body?.value
      );

      return {
        id: item.id,
        title: item.title,
        description,
        readTime: '5 min read',
        audience: normalizeAudience(audienceName),
        category: inferCategoryFromTopic(topicName, item.title),
        requiresLogin: item.field_access_level?.id === LIMITED_PREVIEW_ACCESS_LEVEL,
        language: normalizeLanguage(item.langcode),
      } as ArticleItem;
    });

    if (items.length === 0) {
      return getFallbackPage(FALLBACK_ARTICLES, offset, limit);
    }

    return {
      total: articlePayload.meta?.count ?? items.length,
      items,
    };
  } catch (error) {
    console.warn('Failed to fetch live articles. Falling back to local snapshot.', error);
    return getFallbackPage(FALLBACK_ARTICLES, offset, limit);
  }
}

function filterByQuery(items: ContentItem[], query: VideoQuery): ContentItem[] {
  const normalizedSearch = query.search?.trim().toLowerCase() ?? '';

  return items.filter((item) => {
    const matchesSearch =
      !normalizedSearch ||
      item.title.toLowerCase().includes(normalizedSearch) ||
      item.description.toLowerCase().includes(normalizedSearch);

    const matchesAudience =
      !query.audience || query.audience === 'All' || item.audience === query.audience;

    return matchesSearch && matchesAudience;
  });
}

export async function fetchCommunityContent(query: VideoQuery): Promise<ContentResponse> {
  const liveItems = query.contentType === 'Video' ? await fetchVideos() : await fetchArticles();
  const filtered = filterByQuery(liveItems, query);

  return {
    total: filtered.length,
    items: filtered,
  };
}

export async function fetchCommunityContentPage(
  query: PaginatedContentQuery
): Promise<ContentResponse> {
  const livePage =
    query.contentType === 'Video'
      ? await fetchVideosPage(query.offset, query.limit)
      : await fetchArticlesPage(query.offset, query.limit);

  const filtered = filterByQuery(livePage.items, query);

  return {
    total: livePage.total,
    items: filtered,
  };
}
