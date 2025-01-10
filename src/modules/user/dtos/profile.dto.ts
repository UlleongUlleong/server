export class ProfileDto {
  readonly userId: number;
  readonly email: string;
}

export class ResponseProfileDto {
  readonly moodCategory?: object;
  readonly alcoholCategory?: object;
}

export class categoryDto {
  readonly alcoholCategory?: number[];
  readonly moodCategory?: number[];
}
