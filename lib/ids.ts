import { customAlphabet } from "nanoid";

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export const createId = customAlphabet(alphabet, 21);
export const createShareHash = customAlphabet(alphabet, 16);
