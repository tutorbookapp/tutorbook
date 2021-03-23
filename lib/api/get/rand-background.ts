// TODO: Perhaps use the Unsplash API instead if we find a custom collection of
// interesting photos. Or, even better, use my own photography.
export default async function getRandBackground(): Promise<string> {
  const backgrounds = [
    'beach.jpg',
    'beach-overlook.jpg',
    'forest.jpg',
    'galaxy.jpg',
    'hills.jpg',
    'rocky-beach.jpg',
  ];
  const idx = Math.floor(Math.random() * backgrounds.length);
  return `https://assets.tutorbook.org/jpgs/${backgrounds[idx]}`;
}
