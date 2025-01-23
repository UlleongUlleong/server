export class AlcoholsDto {
  id: number;
  name: string;
  alcoholCategory: {
    id: number;
    name: string;
  };
  scoreAverage: number;
  reviewCount: number;
  imageUrl: string | null;
}
