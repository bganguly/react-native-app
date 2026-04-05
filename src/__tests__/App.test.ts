import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('react-native-safe-area-context', () => {
  const ReactLib = require('react');

  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      ReactLib.createElement('SafeAreaProvider', null, children),
    SafeAreaView: ({ children }: { children: React.ReactNode }) =>
      ReactLib.createElement('SafeAreaView', null, children),
  };
});

jest.mock('react-native', () => {
  const ReactLib = require('react');

  const createPrimitive = (name: string) =>
    ({ children, ...props }: { children?: React.ReactNode }) =>
      ReactLib.createElement(name, props, children);

  const FlatList = ({
    data,
    renderItem,
    ListHeaderComponent,
    ListEmptyComponent,
    ListFooterComponent,
  }: {
    data?: unknown[];
    renderItem?: ({ item, index }: { item: unknown; index: number }) => React.ReactNode;
    ListHeaderComponent?: React.ReactNode;
    ListEmptyComponent?: React.ReactNode;
    ListFooterComponent?: React.ReactNode | (() => React.ReactNode);
  }) => {
    const hasItems = (data?.length ?? 0) > 0;
    const renderedItems =
      data?.map((item, index) => (renderItem ? renderItem({ item, index }) : null)) ?? [];
    const resolvedFooter =
      typeof ListFooterComponent === 'function' ? ListFooterComponent() : ListFooterComponent;

    return ReactLib.createElement(
      'FlatList',
      null,
      ListHeaderComponent,
      hasItems ? null : ListEmptyComponent,
      ...renderedItems,
      resolvedFooter
    );
  };

  return {
    ActivityIndicator: createPrimitive('ActivityIndicator'),
    FlatList,
    Image: createPrimitive('Image'),
    Pressable: createPrimitive('Pressable'),
    StyleSheet: {
      create: <T extends object>(value: T) => value,
      flatten: (value: unknown) => value,
    },
    Text: createPrimitive('Text'),
    TextInput: createPrimitive('TextInput'),
    View: createPrimitive('View'),
  };
});

jest.mock('../../src/services/communityApi', () => ({
  fetchCommunityContentPage: jest.fn(),
}));

describe('App', () => {
  it('loads initial content and renders result count', async () => {
    const { fetchCommunityContentPage } = await import('../../src/services/communityApi');
    const fetchMock = fetchCommunityContentPage as jest.Mock;

    fetchMock.mockResolvedValue({
      total: 1,
      items: [
        {
          id: 'video-1',
          title: 'SAT Basics',
          description: 'Start here',
          duration: '1:00',
          audience: 'Student',
          category: 'SAT',
          language: 'English',
        },
      ],
    });

    const { default: App } = await import('../../App');
    const { getByText, queryByText } = render(React.createElement(App));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'Video',
          audience: 'All',
          search: '',
          offset: 0,
          limit: 9,
        })
      );
    });

    expect(getByText('BigFuture Community Library')).toBeTruthy();
    expect(getByText('SAT Basics')).toBeTruthy();
    expect(getByText(/Results/)).toBeTruthy();
    expect(queryByText('No results for your current filters.')).toBeNull();
  });
});
