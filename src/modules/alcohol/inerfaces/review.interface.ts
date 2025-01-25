export interface Review {
  id: number;
  score: number;
  comment: string;
  user?: {
    imageUrl: string;
    nickname: string;
  };
}
