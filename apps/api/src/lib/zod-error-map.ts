import { z, ZodIssueCode, type ZodErrorMap } from 'zod';

/**
 * Arabic default messages for request validation. Field errors are returned
 * to the client (and now shown next to the field name), and zod's built-in
 * messages are English-only ("String must contain at least 1 character(s)").
 * A message written explicitly in a schema always wins over this map.
 */
const arabicErrorMap: ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === 'undefined' || issue.received === 'null') return { message: 'مطلوب' };
      if (issue.expected === 'number') return { message: 'يجب أن يكون رقماً' };
      return { message: 'قيمة غير صالحة' };
    case ZodIssueCode.too_small:
      if (issue.type === 'string') {
        return { message: Number(issue.minimum) <= 1 ? 'مطلوب' : `يجب أن يكون ${issue.minimum} أحرف على الأقل` };
      }
      if (issue.type === 'number') return { message: `يجب أن يكون ${issue.minimum} أو أكثر` };
      return { message: 'قيمة صغيرة جداً' };
    case ZodIssueCode.too_big:
      if (issue.type === 'string') return { message: `يجب ألا يتجاوز ${issue.maximum} حرفاً` };
      if (issue.type === 'number') return { message: `يجب أن يكون ${issue.maximum} أو أقل` };
      return { message: 'قيمة كبيرة جداً' };
    case ZodIssueCode.invalid_string:
      if (issue.validation === 'email') return { message: 'البريد الإلكتروني غير صحيح' };
      if (issue.validation === 'url') return { message: 'الرابط غير صحيح' };
      if (issue.validation === 'date' || issue.validation === 'datetime') return { message: 'التاريخ غير صحيح' };
      return { message: 'الصيغة غير صحيحة' };
    case ZodIssueCode.invalid_enum_value:
      return { message: 'اختر قيمة صحيحة' };
    default:
      return { message: ctx.defaultError };
  }
};

z.setErrorMap(arabicErrorMap);
