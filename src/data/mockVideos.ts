import { VideoItem } from '../types';

export const mockVideos: VideoItem[] = [
  {
    id: '4f97088a-c783-4941-8f26-4493f1da77ef',
    title: 'AP Planning for Next Year: How AP Can Support Your Teen\'s Path',
    description:
      'Parents get practical guidance on building an intentional AP path that balances challenge and fit.',
    duration: '56:07',
    audience: 'Parent',
    category: 'AP',
  },
  {
    id: 'ee07d043-050e-477a-a228-91a81df04421',
    title: 'Winning SAT Advice from Student Tutors',
    description:
      'Peer tutors share their best strategies for test prep, practice tests, and digital SAT tools.',
    duration: '2:43',
    audience: 'Student',
    category: 'SAT',
    requiresLogin: true,
  },
  {
    id: '2d185072-c722-401d-98f4-f233b6a4a272',
    title: 'Understanding PSATs - For Parents',
    description:
      'A clear walk-through of PSAT 8/9, PSAT 10, and PSAT/NMSQT format and score ranges.',
    duration: '3:26',
    audience: 'Parent',
    category: 'SAT',
  },
  {
    id: '5f233f43-2c81-4d82-b584-6faa785c4bf8',
    title: 'BigFuture te ayuda a planear tu futuro',
    description:
      'A quick Spanish overview of planning for college, paying for college, and exploring careers.',
    duration: '1:31',
    audience: 'Student',
    category: 'College Planning',
    language: 'Spanish',
  },
  {
    id: '57961b41-014c-4b2a-af61-201b8b090ae2',
    title: 'BigFuture Live: Demystifying the Cost of College',
    description:
      'A parent-friendly guide to understanding college costs and payment options.',
    duration: '1:00',
    audience: 'Parent',
    category: 'Financial Aid',
  },
  {
    id: '43ccb890-09c3-4ea9-aef9-2851b7f455a3',
    title: 'Understanding Financial Aid Award Packages',
    description:
      'Learn how to read aid letters, compare offers, and understand grants, work-study, and loans.',
    duration: '3:01',
    audience: 'Parent',
    category: 'Financial Aid',
  },
];
