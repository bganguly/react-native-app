import { mockArticles } from '../data/mockArticles';
import { mockVideos } from '../data/mockVideos';
import { ContentItem, ContentType } from '../types';

export type VideoQuery = {
  contentType: ContentType;
  search?: string;
  audience?: 'All' | 'Student' | 'Parent' | 'Educator';
};

export type ContentResponse = {
  total: number;
  items: ContentItem[];
};

const SIMULATED_LATENCY_MS = 500;

export async function fetchCommunityContent(query: VideoQuery): Promise<ContentResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const source = query.contentType === 'Video' ? mockVideos : mockArticles;

      const normalizedSearch = query.search?.trim().toLowerCase() ?? '';

      const filtered = source.filter((item) => {
        const matchesSearch =
          !normalizedSearch ||
          item.title.toLowerCase().includes(normalizedSearch) ||
          item.description.toLowerCase().includes(normalizedSearch);

        const matchesAudience =
          !query.audience || query.audience === 'All' || item.audience === query.audience;

        return matchesSearch && matchesAudience;
      });

      resolve({
        total: filtered.length,
        items: filtered,
      });
    }, SIMULATED_LATENCY_MS);
  });
}
