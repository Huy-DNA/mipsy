export interface Position {
  offset: number;
  line: number;
}

export interface Result<T, E> {
  result: T,
  errors: E,
}

export interface Error {
  start: Position;
  end: Position;
  message: string;
}
