// export class AlcoholDto {
//   total?: object;
//   soju?: object;
//   beer?: object;
//   whiskey?: object;
//   wine?: object;
//   makgeolli?: object;
// }

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
}
