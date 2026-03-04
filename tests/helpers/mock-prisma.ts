import { vi } from "vitest";

// Deep mock of PrismaClient — each model returns chainable methods
function createModelMock() {
  return {
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: "mock-id" }),
    update: vi.fn().mockResolvedValue({ id: "mock-id" }),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    upsert: vi.fn().mockResolvedValue({ id: "mock-id" }),
    delete: vi.fn().mockResolvedValue({ id: "mock-id" }),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    count: vi.fn().mockResolvedValue(0),
    groupBy: vi.fn().mockResolvedValue([]),
    aggregate: vi.fn().mockResolvedValue({}),
  };
}

export const mockPrisma = {
  user: createModelMock(),
  card: createModelMock(),
  collection: createModelMock(),
  collectionCard: createModelMock(),
  wishlistCard: createModelMock(),
  deck: createModelMock(),
  deckCard: createModelMock(),
  listing: createModelMock(),
  offer: createModelMock(),
  transaction: createModelMock(),
  follow: createModelMock(),
  achievement: createModelMock(),
  userAchievement: createModelMock(),
  portfolioSnapshot: createModelMock(),
  userRating: createModelMock(),
  notification: createModelMock(),
  $transaction: vi.fn(),
  $queryRawUnsafe: vi.fn().mockResolvedValue([]),
};

// This mocks the prisma import for all service files
vi.mock("@/shared/lib/prisma", () => ({
  prisma: mockPrisma,
}));
