import { UUID } from "crypto";

export type user_type = {
  user_id: UUID;
  name: string;
  email: string;
  push_token: string | null;
  preferences: UserPreference;
  password: string;
};

export type UserPreference = {
  email: boolean;
  push: boolean;
};
