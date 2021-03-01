declare module 'await-to-js' {
  export default function to<T, U = Error>(
    promise: Readonly<Promise<T>>,
    errorExt?: object
  ): Promise<[U | null, T | undefined]>;
}
