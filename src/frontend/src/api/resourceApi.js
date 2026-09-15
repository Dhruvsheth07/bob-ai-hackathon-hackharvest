import { berthMock, craneMock } from '../mocks/resourceMock';

export const resourceApi = {
  getBerths: async () => {
    return new Promise((resolve) => setTimeout(() => resolve([...berthMock]), 500));
  },
  getCranes: async () => {
    return new Promise((resolve) => setTimeout(() => resolve([...craneMock]), 500));
  }
};
