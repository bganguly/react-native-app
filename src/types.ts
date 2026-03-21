export type ContentType = 'Video' | 'Article';

export type Audience = 'Student' | 'Parent' | 'Educator';

export type ContentCategory = 'SAT' | 'AP' | 'College Planning' | 'Financial Aid';

type BaseContentItem = {
  id: string;
  title: string;
  description: string;
  audience: Audience;
  category: ContentCategory;
  requiresLogin?: boolean;
  language?: 'English' | 'Spanish';
};

export type VideoItem = BaseContentItem & {
  duration: string;
};

export type ArticleItem = BaseContentItem & {
  readTime: string;
};

export type ContentItem = VideoItem | ArticleItem;
