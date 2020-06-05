export class ApiCallError extends Error {
  public name = 'ApiCallError';
  constructor(message: string, public statusCode: number | null) {
    super(message);
  }
}
