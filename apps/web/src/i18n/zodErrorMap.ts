import { z, ZodIssueCode, type ZodErrorMap } from 'zod';
import i18n from 'i18next';

/**
 * zod's built-in messages are English-only ("Invalid date", "String must
 * contain at least 2 character(s)"), which leaked into the Arabic UI on every
 * form whose shared schema doesn't spell out its own message. This maps the
 * issues our forms can actually produce to the current UI language. A message
 * written explicitly in a schema always wins over this map.
 */
const messages = {
  ar: {
    required: 'هذا الحقل مطلوب',
    minChars: (n: number) => `يجب أن يكون ${n} أحرف على الأقل`,
    maxChars: (n: number) => `يجب ألا يتجاوز ${n} حرفاً`,
    minNumber: (n: number) => `يجب أن تكون القيمة ${n} أو أكثر`,
    maxNumber: (n: number) => `يجب أن تكون القيمة ${n} أو أقل`,
    number: 'يجب إدخال رقم',
    email: 'البريد الإلكتروني غير صحيح',
    url: 'الرابط غير صحيح',
    date: 'التاريخ غير صحيح',
    format: 'الصيغة غير صحيحة',
    choice: 'اختر قيمة صحيحة',
  },
  en: {
    required: 'This field is required',
    minChars: (n: number) => `Must be at least ${n} characters`,
    maxChars: (n: number) => `Must be at most ${n} characters`,
    minNumber: (n: number) => `Must be ${n} or more`,
    maxNumber: (n: number) => `Must be ${n} or less`,
    number: 'Please enter a number',
    email: 'Invalid email address',
    url: 'Invalid link',
    date: 'Invalid date',
    format: 'Invalid format',
    choice: 'Please choose a valid option',
  },
};

const errorMap: ZodErrorMap = (issue, ctx) => {
  const m = i18n.language?.startsWith('en') ? messages.en : messages.ar;

  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === 'undefined' || issue.received === 'null') return { message: m.required };
      if (issue.expected === 'number') return { message: m.number };
      break;
    case ZodIssueCode.too_small:
      if (issue.type === 'string') {
        return { message: Number(issue.minimum) <= 1 ? m.required : m.minChars(Number(issue.minimum)) };
      }
      if (issue.type === 'number') return { message: m.minNumber(Number(issue.minimum)) };
      break;
    case ZodIssueCode.too_big:
      if (issue.type === 'string') return { message: m.maxChars(Number(issue.maximum)) };
      if (issue.type === 'number') return { message: m.maxNumber(Number(issue.maximum)) };
      break;
    case ZodIssueCode.invalid_string:
      if (issue.validation === 'email') return { message: m.email };
      if (issue.validation === 'url') return { message: m.url };
      if (issue.validation === 'date' || issue.validation === 'datetime') return { message: m.date };
      return { message: m.format };
    case ZodIssueCode.invalid_date:
      return { message: m.date };
    case ZodIssueCode.invalid_enum_value:
      return { message: m.choice };
    default:
      break;
  }
  return { message: ctx.defaultError };
};

z.setErrorMap(errorMap);
