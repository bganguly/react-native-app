import { ArticleItem } from '../types';

export const mockArticles: ArticleItem[] = [
  {
    id: 'article-1',
    title: 'How to Build a Balanced AP Course Plan',
    description:
      'A practical framework for selecting AP classes that align with student interests and workload.',
    readTime: '5 min read',
    audience: 'Parent',
    category: 'AP',
  },
  {
    id: 'article-2',
    title: 'Digital SAT Prep Timeline for Busy Students',
    description:
      'A week-by-week plan with milestones for practice tests, review loops, and final prep.',
    readTime: '4 min read',
    audience: 'Student',
    category: 'SAT',
    requiresLogin: true,
  },
  {
    id: 'article-3',
    title: 'College Visits: Questions That Reveal Fit',
    description:
      'Questions families can ask on campus tours to evaluate academics, support, and student life.',
    readTime: '6 min read',
    audience: 'Parent',
    category: 'College Planning',
  },
  {
    id: 'article-4',
    title: 'Understanding Financial Aid Letters',
    description:
      'Decode grants, work-study, and loan offers so you can compare aid packages with confidence.',
    readTime: '7 min read',
    audience: 'Parent',
    category: 'Financial Aid',
  },
  {
    id: 'article-5',
    title: 'Recursos para planear la universidad en familia',
    description:
      'Guia breve en espanol con pasos para explorar carreras, universidades y apoyo economico.',
    readTime: '3 min read',
    audience: 'Student',
    category: 'College Planning',
    language: 'Spanish',
  },
];
