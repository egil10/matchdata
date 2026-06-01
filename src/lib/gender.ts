import { cookies } from "next/headers";
import type { Gender } from "./types";

export const GENDER_COOKIE = "kd-gender";

// Server-side read of the persisted Herrer/Kvinner choice (defaults to men).
export function getGender(): Gender {
  const v = cookies().get(GENDER_COOKIE)?.value;
  return v === "women" ? "women" : "men";
}
