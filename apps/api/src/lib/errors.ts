export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors?: Record<string, string[] | undefined>;

  constructor(
    status: number,
    code: string,
    message: string,
    fieldErrors?: Record<string, string[] | undefined>,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  static badRequest(message: string, fieldErrors?: Record<string, string[] | undefined>) {
    return new ApiError(400, 'bad_request', message, fieldErrors);
  }
  static unauthorized(message = 'يجب تسجيل الدخول أولاً') {
    return new ApiError(401, 'unauthorized', message);
  }
  static forbidden(message = 'لا تملك صلاحية القيام بذلك') {
    return new ApiError(403, 'forbidden', message);
  }
  static notFound(message = 'العنصر المطلوب غير موجود') {
    return new ApiError(404, 'not_found', message);
  }
  static conflict(message: string) {
    return new ApiError(409, 'conflict', message);
  }
  static tooMany(message = 'محاولات كثيرة جداً، حاول مرة أخرى بعد قليل') {
    return new ApiError(429, 'rate_limited', message);
  }
  static internal(message = 'حدث خطأ غير متوقع، حاول لاحقاً') {
    return new ApiError(500, 'internal_error', message);
  }
}
