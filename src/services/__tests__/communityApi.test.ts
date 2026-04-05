jest.mock('../communityFallbackData', () => ({
  COMMUNITY_FALLBACK_GENERATED_AT: '2026-04-05T00:00:00.000Z',
  COMMUNITY_FALLBACK_SOURCE: 'https://bigfuture.collegeboard.org/jsonapi/',
  FALLBACK_VIDEOS: [
    {
      id: 'fallback-video-1',
      title: 'Fallback Parent Planning',
      description: `<p>${'parent planning '.repeat(30)}</p>`,
      duration: '1:00',
      audience: 'Parent',
      category: 'College Planning',
      language: 'English',
    },
    {
      id: 'fallback-video-2',
      title: 'Fallback Student SAT',
      description: '<p>short student text</p>',
      duration: '2:00',
      audience: 'Student',
      category: 'SAT',
      language: 'English',
    },
  ],
  FALLBACK_ARTICLES: [
    {
      id: 'fallback-article-1',
      title: 'Fallback Article',
      description: `<div>${'article body '.repeat(40)}</div>`,
      readTime: '5 min read',
      audience: 'Educator',
      category: 'AP',
      language: 'English',
    },
  ],
}));

function jsonResponse(payload: unknown): Response {
  return {
    ok: true,
    json: async () => payload,
  } as Response;
}

describe('communityApi', () => {
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    global.fetch = jest.fn() as jest.Mock;
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('maps live video payload and applies display shortening', async () => {
    const longHtmlDescription = `<p>${'A'.repeat(260)}</p>`;

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('resource/video')) {
        return Promise.resolve(
          jsonResponse({
            data: [
              {
                id: 'live-video-1',
                title: 'Live SAT Prep',
                langcode: 'en',
                field_external_description: longHtmlDescription,
                field_video_duration: '3:30',
                field_video_link: 'https://youtu.be/AbCdEf12',
                field_audience: [{ id: 'audience-1', type: 'taxonomy_term--audience' }],
                field_community_topics: [{ id: 'topic-1', type: 'taxonomy_term--bigfuture_community_topics' }],
                field_access_level: null,
              },
            ],
            meta: { count: 1 },
          })
        );
      }

      if (url.includes('taxonomy_term/audience')) {
        return Promise.resolve(
          jsonResponse({
            data: [{ id: 'audience-1', name: 'Students' }],
          })
        );
      }

      if (url.includes('taxonomy_term/bigfuture_community_topics')) {
        return Promise.resolve(
          jsonResponse({
            data: [{ id: 'topic-1', name: 'SAT Prep' }],
          })
        );
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const { fetchCommunityContentPage } = await import('../communityApi');

    const result = await fetchCommunityContentPage({
      contentType: 'Video',
      offset: 0,
      limit: 10,
      audience: 'All',
    });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].description).not.toContain('<');
    expect(result.items[0].description.endsWith('...')).toBe(true);
    expect(result.items[0].audience).toBe('Student');
    expect(result.items[0].category).toBe('SAT');
  });

  it('falls back to local video snapshot and formats description when live request fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

    const { fetchCommunityContentPage } = await import('../communityApi');

    const result = await fetchCommunityContentPage({
      contentType: 'Video',
      offset: 0,
      limit: 10,
      audience: 'All',
    });

    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].description).not.toContain('<');
    expect(result.items[0].description.endsWith('...')).toBe(true);
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('filters fallback content by search text and audience', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network down'));

    const { fetchCommunityContent } = await import('../communityApi');

    const result = await fetchCommunityContent({
      contentType: 'Video',
      search: 'planning',
      audience: 'Parent',
    });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toContain('Fallback Parent Planning');
    expect(result.items[0].audience).toBe('Parent');
  });
});
