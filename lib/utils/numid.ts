import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('1234567890', 21);

export default function numid(): number {
  return Number(nanoid());
}
