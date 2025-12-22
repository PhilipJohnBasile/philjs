/**
 * Mock Data Decorator
 *
 * Wrap stories with mock API data using MSW
 */

import { createContext, useContext } from 'philjs-core/context';
import type { StoryContext } from '../renderer.js';

export interface MockDataContext {
  data: Record<string, any>;
  setData: (key: string, value: any) => void;
  clearData: () => void;
}

const MockDataContextInstance = createContext<MockDataContext>({
  data: {},
  setData: () => {},
  clearData: () => {},
});

/**
 * Mock Data decorator
 */
export function withMockData(
  story: () => any,
  context: StoryContext
): any {
  const initialData = context.parameters?.mockData || {};
  const data = { ...initialData };

  const mockDataContext: MockDataContext = {
    data,
    setData: (key: string, value: any) => {
      data[key] = value;
    },
    clearData: () => {
      Object.keys(data).forEach((key) => delete data[key]);
    },
  };

  return (
    <MockDataContextInstance.Provider value={mockDataContext}>
      {story()}
    </MockDataContextInstance.Provider>
  );
}

/**
 * Hook to access mock data in stories
 */
export function useMockData(): MockDataContext {
  return useContext(MockDataContextInstance);
}
