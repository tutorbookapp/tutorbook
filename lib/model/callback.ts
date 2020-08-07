export type TCallback<T> = (param: T) => void;
export type FCallback<T> = (param: (prev: T) => T) => void;
export type Callback<T> = TCallback<T> | FCallback<T>;
