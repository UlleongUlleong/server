type Label = {
  id: number;
  name: string;
};

export interface ProfileDetail {
  nickname: string;
  imageUrl: string;
  alcoholCategory: Label[];
  moodCategory: Label[];
}
