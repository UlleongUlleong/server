type Label = {
  id: number;
  name: string;
};

export interface ProfileDetail {
  nickname: string;
  alcoholCategory: Label[];
  moodCategory: Label[];
}
