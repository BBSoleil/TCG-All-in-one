export interface Listing {
  id: string;
  cardId: string;
  sellerId: string;
  price: number;
  condition: string;
  description: string | null;
  status: "active" | "sold" | "cancelled";
  createdAt: Date;
}
