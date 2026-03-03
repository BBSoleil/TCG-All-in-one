export interface PublicProfile {
  id: string;
  name: string;
  image: string | null;
  collectionCount: number;
  joinedAt: Date;
}

export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: Date;
}
