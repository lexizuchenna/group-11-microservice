import { UUID } from "crypto";

export type User = {
  user_id: string;
  name: string;
  push_token: string | null;
  preferences: UserPreference;
  password: str;
};

export type UserPreference = {
  email: boolean;
  push: boolean;
};
