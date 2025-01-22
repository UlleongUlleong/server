export class AlcoholDto {
  id: number;
  name: string;
  alcoholCategory: {
    id: number;
    name: string;
  };
  scoreAverage: number;
  reviewCount: number;
  imageUrl: string;
  price?: number;
  origin?: string;
  interestCount?: number;
  abv?: number;
  volume?: number;
  description?: string;
}
