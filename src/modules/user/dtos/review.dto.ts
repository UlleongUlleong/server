export class UserReviewDto {
  id: number;
  score: number;
  comment: string;
  alcoholId: number;
  alcohol: {
    imageUrl: string;
    name: string;
  };
}
