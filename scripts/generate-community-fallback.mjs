#!/usr/bin/env node

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const JSONAPI_BASE = 'https://bigfuture.collegeboard.org/jsonapi/';
const LIMITED_PREVIEW_ACCESS_LEVEL = '546c2dcd-379c-4cb6-8259-8b640b5f3fe0';
const PAGE_SIZE = 50;

function normalizeAudience(value = '') {
  const normalized = value.toLowerCase();

  if (normalized.includes('parent')) {
    return 'Parent';
  }

  if (normalized.includes('student')) {
    return 'Student';
  }

  return 'Educator';
}

function inferCategoryFromTopic(topicName, title) {
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

function normalizeLanguage(langCode) {
  return langCode?.toLowerCase().startsWith('es') ? 'Spanish' : 'English';
}

function stripHtml(raw) {
  if (!raw) {
    return '';
  }

  return raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .trim();
}

function shorten(text, max = 220) {
  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, max - 1).trim()}...`;
}

function toAbsoluteMediaUrl(pathValue) {
  if (!pathValue) {
    return undefined;
  }

  if (pathValue.startsWith('http://') || pathValue.startsWith('https://')) {
    return pathValue;
  }

  if (pathValue.startsWith('/')) {
    return `https://bigfuture.collegeboard.org${pathValue}`;
  }

  return undefined;
}

function getYoutubeThumbnail(videoLink) {
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

function getYoutubeThumbnailFallback(videoLink) {
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

function getVideoThumbnailUrl(item) {
  const mediaImageUrl = toAbsoluteMediaUrl(item.field_thumbnail_media?.field_media_image?.uri?.url);

  if (mediaImageUrl) {
    return mediaImageUrl;
  }

  return getYoutubeThumbnail(item.field_video_link);
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}: ${url}`);
  }

  return response.json();
}

function getPagedEndpoint(endpoint, offset, limit) {
  const separator = endpoint.includes('?') ? '&' : '?';
  return `${JSONAPI_BASE}${endpoint}${separator}page[limit]=${limit}&page[offset]=${offset}`;
}

async function fetchAllPages(endpoint, pageSize = PAGE_SIZE) {
  const allItems = [];
  let offset = 0;

  while (true) {
    const payload = await fetchJson(getPagedEndpoint(endpoint, offset, pageSize));
    const pageItems = Array.isArray(payload.data) ? payload.data : [];

    if (pageItems.length === 0) {
      break;
    }

    allItems.push(...pageItems);

    if (pageItems.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return allItems;
}

async function generateFallbackData() {
  const [audienceItems, topicItems, videoItems, articleItems] = await Promise.all([
    fetchAllPages('taxonomy_term/audience?fields[taxonomy_term--audience]=name&jsonapi_include=1'),
    fetchAllPages('taxonomy_term/bigfuture_community_topics?fields[taxonomy_term--bigfuture_community_topics]=name,parent&jsonapi_include=1'),
    fetchAllPages('resource/video?jsonapi_include=1&filter[status]=1&sort=-created'),
    fetchAllPages('node/info_article?jsonapi_include=1&filter[status]=1&sort=-created'),
  ]);

  const audienceLookup = new Map((audienceItems ?? []).map((item) => [item.id, item.name ?? '']));
  const topicLookup = new Map((topicItems ?? []).map((item) => [item.id, item.name ?? '']));

  const videos = (videoItems ?? []).map((item) => {
    const audienceName = audienceLookup.get(item.field_audience?.[0]?.id ?? '') ?? 'Educators';
    const topicName = topicLookup.get(item.field_community_topics?.[0]?.id ?? '') ?? '';

    return {
      id: item.id,
      title: item.title,
      description: item.field_external_description ?? '',
      duration: item.field_video_duration?.trim() || '0:00',
      thumbnailUrl: getVideoThumbnailUrl(item),
      thumbnailFallbackUrl: getYoutubeThumbnailFallback(item.field_video_link),
      audience: normalizeAudience(audienceName),
      category: inferCategoryFromTopic(topicName, item.title),
      requiresLogin: item.field_access_level?.id === LIMITED_PREVIEW_ACCESS_LEVEL,
      language: normalizeLanguage(item.langcode),
    };
  });

  const articles = (articleItems ?? []).map((item) => {
    const audienceName = audienceLookup.get(item.field_audience?.[0]?.id ?? '') ?? 'Educators';
    const topicName = topicLookup.get(item.field_community_topics?.[0]?.id ?? '') ?? '';

    return {
      id: item.id,
      title: item.title,
      description: item.field_external_description || item.field_preview_summary || item.body?.summary || item.body?.value || '',
      readTime: '5 min read',
      audience: normalizeAudience(audienceName),
      category: inferCategoryFromTopic(topicName, item.title),
      requiresLogin: item.field_access_level?.id === LIMITED_PREVIEW_ACCESS_LEVEL,
      language: normalizeLanguage(item.langcode),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    source: JSONAPI_BASE,
    videos,
    articles,
  };
}

async function main() {
  const snapshot = await generateFallbackData();
  const videosFileContent = `import { VideoItem } from '../types';\n\nexport const FALLBACK_VIDEOS: VideoItem[] = ${JSON.stringify(snapshot.videos, null, 2)};\n`;
  const articlesFileContent = `import { ArticleItem } from '../types';\n\nexport const FALLBACK_ARTICLES: ArticleItem[] = ${JSON.stringify(snapshot.articles, null, 2)};\n`;
  const indexFileContent = `export const COMMUNITY_FALLBACK_GENERATED_AT = ${JSON.stringify(snapshot.generatedAt)};\nexport const COMMUNITY_FALLBACK_SOURCE = ${JSON.stringify(snapshot.source)};\n\nexport { FALLBACK_VIDEOS } from './communityFallbackVideos';\nexport { FALLBACK_ARTICLES } from './communityFallbackArticles';\n`;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const outputVideosPath = path.resolve(__dirname, '../src/services/communityFallbackVideos.ts');
  const outputArticlesPath = path.resolve(__dirname, '../src/services/communityFallbackArticles.ts');
  const outputIndexPath = path.resolve(__dirname, '../src/services/communityFallbackData.ts');

  await Promise.all([
    writeFile(outputVideosPath, videosFileContent, 'utf8'),
    writeFile(outputArticlesPath, articlesFileContent, 'utf8'),
    writeFile(outputIndexPath, indexFileContent, 'utf8'),
  ]);
  console.log(`Wrote fallback snapshot to ${outputVideosPath}, ${outputArticlesPath}, and ${outputIndexPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
