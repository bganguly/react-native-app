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

function errorResponse(status: number): Response {
  return {
    ok: false,
    status,
    json: async () => ({}),
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

  it('maps live article payload across category/language/description branches', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('node/info_article')) {
        return Promise.resolve(
          jsonResponse({
            data: [
              {
                id: 'article-1',
                title: 'Scholarships and Aid Basics',
                langcode: 'es-mx',
                field_external_description: null,
                field_preview_summary: '<p>Preview summary</p>',
                body: { summary: null, value: '<p>Body fallback</p>' },
                field_audience: [{ id: 'audience-parent', type: 'taxonomy_term--audience' }],
                field_community_topics: [{ id: 'topic-fin-aid', type: 'taxonomy_term--bigfuture_community_topics' }],
                field_access_level: { id: '546c2dcd-379c-4cb6-8259-8b640b5f3fe0', type: 'taxonomy_term--access_level' },
              },
              {
                id: 'article-2',
                title: 'Advanced Placement Explained',
                langcode: 'en',
                field_external_description: '<p>AP external</p>',
                field_preview_summary: null,
                body: null,
                field_audience: [{ id: 'audience-unknown', type: 'taxonomy_term--audience' }],
                field_community_topics: [{ id: 'topic-ap', type: 'taxonomy_term--bigfuture_community_topics' }],
                field_access_level: null,
              },
              {
                id: 'article-3',
                title: 'Campus Visit Checklist',
                langcode: 'en',
                field_external_description: null,
                field_preview_summary: null,
                body: { summary: null, value: null },
                field_audience: [{ id: 'audience-student', type: 'taxonomy_term--audience' }],
                field_community_topics: [{ id: 'topic-college', type: 'taxonomy_term--bigfuture_community_topics' }],
                field_access_level: null,
              },
            ],
            meta: { count: 3 },
          })
        );
      }

      if (url.includes('taxonomy_term/audience')) {
        return Promise.resolve(
          jsonResponse({
            data: [
              { id: 'audience-parent', name: 'Parents' },
              { id: 'audience-student', name: 'Students' },
            ],
          })
        );
      }

      if (url.includes('taxonomy_term/bigfuture_community_topics')) {
        return Promise.resolve(
          jsonResponse({
            data: [
              { id: 'topic-fin-aid', name: 'Financial Aid' },
              { id: 'topic-ap', name: 'Advanced Placement' },
              { id: 'topic-college', name: 'Admissions' },
            ],
          })
        );
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const { fetchCommunityContentPage } = await import('../communityApi');

    const result = await fetchCommunityContentPage({
      contentType: 'Article',
      offset: 0,
      limit: 10,
      audience: 'All',
    });

    expect(result.total).toBe(3);
    expect(result.items).toHaveLength(3);
    expect(result.items[0].category).toBe('Financial Aid');
    expect(result.items[0].language).toBe('Spanish');
    expect(result.items[0].audience).toBe('Parent');
    expect(result.items[0].requiresLogin).toBe(true);
    expect(result.items[1].category).toBe('AP');
    expect(result.items[1].audience).toBe('Educator');
    expect(result.items[2].category).toBe('College Planning');
    expect(result.items[2].description).toBe('');
  });

  it('uses fallback article snapshot when live article page is empty', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('node/info_article')) {
        return Promise.resolve(
          jsonResponse({
            data: [],
            meta: { count: 0 },
          })
        );
      }

      if (url.includes('taxonomy_term/audience') || url.includes('taxonomy_term/bigfuture_community_topics')) {
        return Promise.resolve(jsonResponse({ data: [] }));
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const { fetchCommunityContentPage } = await import('../communityApi');

    const result = await fetchCommunityContentPage({
      contentType: 'Article',
      offset: 0,
      limit: 10,
      audience: 'All',
    });

    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].description).not.toContain('<');
    expect(result.items[0].description.endsWith('...')).toBe(true);
  });

  it('maps video thumbnail/url and metadata branches for media/youtube/invalid links', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('resource/video')) {
        return Promise.resolve(
          jsonResponse({
            data: [
              {
                id: 'video-1',
                title: 'Video with Relative Media',
                langcode: 'en',
                field_external_description: '<p>desc</p>',
                field_video_duration: null,
                field_video_link: null,
                field_audience: [{ id: 'aud-1', type: 'taxonomy_term--audience' }],
                field_community_topics: [{ id: 'topic-1', type: 'taxonomy_term--bigfuture_community_topics' }],
                field_access_level: null,
                field_thumbnail_media: {
                  field_media_image: {
                    uri: { url: '/sites/default/files/thumb.jpg' },
                  },
                },
              },
              {
                id: 'video-2',
                title: 'Video with Absolute Media',
                langcode: 'en',
                field_external_description: '<p>desc</p>',
                field_video_duration: '1:11',
                field_video_link: null,
                field_audience: [{ id: 'aud-1', type: 'taxonomy_term--audience' }],
                field_community_topics: [{ id: 'topic-1', type: 'taxonomy_term--bigfuture_community_topics' }],
                field_access_level: null,
                field_thumbnail_media: {
                  field_media_image: {
                    uri: { url: 'https://cdn.example.com/thumb.jpg' },
                  },
                },
              },
              {
                id: 'video-3',
                title: 'Video with YouTube Fallback',
                langcode: 'en',
                field_external_description: '<p>desc</p>',
                field_video_duration: '2:22',
                field_video_link: 'https://www.youtube.com/watch?v=abcdef12345',
                field_audience: [{ id: 'aud-1', type: 'taxonomy_term--audience' }],
                field_community_topics: [{ id: 'topic-1', type: 'taxonomy_term--bigfuture_community_topics' }],
                field_access_level: null,
                field_thumbnail_media: {
                  field_media_image: {
                    uri: { url: 'not-a-valid-url' },
                  },
                },
              },
            ],
            meta: { count: 3 },
          })
        );
      }

      if (url.includes('taxonomy_term/audience')) {
        return Promise.resolve(jsonResponse({ data: [{ id: 'aud-1', name: 'Students' }] }));
      }

      if (url.includes('taxonomy_term/bigfuture_community_topics')) {
        return Promise.resolve(jsonResponse({ data: [{ id: 'topic-1', name: 'SAT Prep' }] }));
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

    const videoItems = result.items as Array<{
      duration: string;
      thumbnailUrl?: string;
      thumbnailFallbackUrl?: string;
    }>;

    expect(result.total).toBe(3);
    expect(videoItems).toHaveLength(3);
    expect(videoItems[0].duration).toBe('0:00');
    expect(videoItems[0].thumbnailUrl).toBe('https://bigfuture.collegeboard.org/sites/default/files/thumb.jpg');
    expect(videoItems[1].thumbnailUrl).toBe('https://cdn.example.com/thumb.jpg');
    expect(videoItems[2].thumbnailUrl).toBe('https://img.youtube.com/vi/abcdef12345/hqdefault.jpg');
    expect(videoItems[2].thumbnailFallbackUrl).toBe('https://i.ytimg.com/vi/abcdef12345/hqdefault.jpg');
  });

  it('retries taxonomy lookup after an initial failed audience request', async () => {
    let audienceRequests = 0;

    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('resource/video')) {
        return Promise.resolve(
          jsonResponse({
            data: [
              {
                id: 'retry-video',
                title: 'Retry Video',
                langcode: 'en',
                field_external_description: '<p>desc</p>',
                field_video_duration: '3:00',
                field_video_link: 'https://youtu.be/AbCdEf12',
                field_audience: [{ id: 'aud-1', type: 'taxonomy_term--audience' }],
                field_community_topics: [{ id: 'topic-1', type: 'taxonomy_term--bigfuture_community_topics' }],
                field_access_level: null,
              },
            ],
            meta: { count: 1 },
          })
        );
      }

      if (url.includes('taxonomy_term/audience')) {
        audienceRequests += 1;

        if (audienceRequests === 1) {
          return Promise.resolve(errorResponse(500));
        }

        return Promise.resolve(jsonResponse({ data: [{ id: 'aud-1', name: 'Students' }] }));
      }

      if (url.includes('taxonomy_term/bigfuture_community_topics')) {
        return Promise.resolve(jsonResponse({ data: [{ id: 'topic-1', name: 'SAT Prep' }] }));
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const { fetchCommunityContentPage } = await import('../communityApi');

    const first = await fetchCommunityContentPage({
      contentType: 'Video',
      offset: 0,
      limit: 10,
      audience: 'All',
    });

    const second = await fetchCommunityContentPage({
      contentType: 'Video',
      offset: 0,
      limit: 10,
      audience: 'All',
    });

    expect(first.total).toBe(2);
    expect(second.total).toBe(1);
    expect(second.items[0].audience).toBe('Student');
    expect(audienceRequests).toBeGreaterThanOrEqual(2);
  });
});
