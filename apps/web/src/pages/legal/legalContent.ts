/**
 * Privacy policy and terms, written to match what the platform actually does
 * (see apps/api/src/db/schema for what's stored). Keep this in sync when data
 * handling changes — e.g. adding an analytics vendor or online card payments.
 * Bump LEGAL_LAST_UPDATED whenever the text changes.
 */
export const LEGAL_LAST_UPDATED = '2026-11-21';

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

type Lang = 'ar' | 'en';

export const PRIVACY: Record<Lang, LegalSection[]> = {
  ar: [
    {
      heading: 'من نحن',
      paragraphs: [
        '«دفتر» منصة رقمية لإنشاء دفاتر تخرج تفاعلية يكتب فيها الأصدقاء والعائلة رسائلهم للخريج. توضح هذه السياسة ما نجمعه من بيانات، ولماذا، وكيف نحميها.',
      ],
    },
    {
      heading: 'البيانات التي نجمعها',
      paragraphs: [
        'بيانات الحساب: الاسم والبريد الإلكتروني وكلمة المرور (نحفظها مشفّرة ولا يمكننا قراءتها).',
        'محتوى الدفتر: اسم الخريج والجامعة أو المدرسة والتخصص وسنة التخرج، وصور الغلاف والصور الشخصية وصور الذكريات التي ترفعها.',
        'رسائل الزوار: اسم كاتب الرسالة وصلته بالخريج ونص الرسالة وصورة اختيارية. لمنع الإساءة والرسائل المكررة نحفظ بصمة مشفّرة (hash) لعنوان IP وليس العنوان نفسه.',
        'إحصائيات الاستخدام: عدد زيارات الدفتر ومسح رمز QR ومرات المشاركة، مرتبطة بالدفتر وبمعرّف زائر مشفّر، لعرضها لصاحب الدفتر.',
        'بيانات الطلبات: الباقة والمبلغ ورقم الطلب وحالته. الدفع يتم بالتحويل (CliQ أو تحويل بنكي) خارج المنصة، ولا نجمع أو نحفظ أي بيانات بطاقات بنكية.',
      ],
    },
    {
      heading: 'كيف نستخدم البيانات',
      paragraphs: [
        'لتشغيل الخدمة: إنشاء دفترك وعرضه للزوار وتمكينك من إدارة الرسائل.',
        'لتأكيد الطلبات وتفعيل الدفاتر والتواصل معك بخصوص حسابك أو طلبك.',
        'لحماية المنصة من الإساءة والرسائل المزعجة.',
        'لا نبيع بياناتك ولا نستخدمها للإعلانات.',
      ],
    },
    {
      heading: 'من يمكنه رؤية المحتوى',
      paragraphs: [
        'الدفتر العام يمكن لأي شخص لديه الرابط مشاهدته. الدفتر الخاص يتطلب رمز دخول تحدده أنت. الرسائل لا تظهر للزوار إلا بعد موافقتك عليها (أو مباشرة إذا اخترت النشر التلقائي).',
        'لكاتب الرسالة أن يعلم أن رسالته ستظهر في دفتر الخريج لمن يملك الرابط، وأن لصاحب الدفتر إخفاءها أو حذفها.',
      ],
    },
    {
      heading: 'الخدمات التي نعتمد عليها',
      paragraphs: [
        'نستضيف الموقع والخادم وقاعدة البيانات والملفات لدى مزودي استضافة سحابية (Vercel وRender وSupabase)، ونحمّل الخطوط من Google Fonts. هذه الجهات تعالج البيانات لتقديم خدماتها فقط.',
      ],
    },
    {
      heading: 'ملفات تعريف الارتباط (Cookies)',
      paragraphs: [
        'نستخدم ملفات تعريف ارتباط ضرورية فقط: لتسجيل الدخول والحماية من الطلبات المزوّرة (CSRF). ونحفظ لغة الواجهة في متصفحك. لا نستخدم ملفات تتبع إعلانية.',
      ],
    },
    {
      heading: 'مدة الاحتفاظ والحذف',
      paragraphs: [
        'نحتفظ بمحتوى دفترك طالما حسابك قائم. عند انتهاء الباقة يُخفى الدفتر عن الزوار ويبقى محفوظاً ليعود عند التجديد.',
        'يمكنك حذف أي رسالة من لوحة التحكم، وطلب حذف حسابك ودفترك بالكامل بالتواصل معنا، وسنحذفه خلال 30 يوماً.',
      ],
    },
    {
      heading: 'حقوقك',
      paragraphs: [
        'يحق لك طلب نسخة من بياناتك أو تصحيحها أو حذفها في أي وقت عبر وسائل التواصل أدناه.',
        'إذا كان عمرك أقل من 18 عاماً، فاستخدم المنصة بموافقة وليّ أمرك.',
      ],
    },
    {
      heading: 'التغييرات على هذه السياسة',
      paragraphs: ['قد نحدّث هذه السياسة، وسنعدّل تاريخ «آخر تحديث» أعلاه. التغييرات الجوهرية سنبلغ بها أصحاب الحسابات.'],
    },
  ],
  en: [
    {
      heading: 'Who we are',
      paragraphs: [
        'Daftar is an online platform for interactive graduation guestbooks, where friends and family write messages to a graduate. This policy explains what data we collect, why, and how we protect it.',
      ],
    },
    {
      heading: 'What we collect',
      paragraphs: [
        'Account data: your name, email address and password (stored only as a one-way hash we cannot read).',
        "Notebook content: the graduate's name, institution, major and graduation year, and the cover, profile and memory photos you upload.",
        'Visitor messages: the writer\'s name, their relationship to the graduate, the message and an optional photo. To prevent abuse and duplicate posts we keep a hash of the IP address, not the address itself.',
        'Usage statistics: notebook views, QR scans and shares, linked to the notebook and a hashed visitor identifier, shown to the notebook owner.',
        'Order data: package, amount, order reference and status. Payment happens by transfer (CliQ or bank transfer) outside the platform; we never collect or store card details.',
      ],
    },
    {
      heading: 'How we use it',
      paragraphs: [
        'To run the service: building your notebook, showing it to visitors and letting you manage messages.',
        'To confirm orders, activate notebooks and contact you about your account or order.',
        'To protect the platform from abuse and spam.',
        "We don't sell your data or use it for advertising.",
      ],
    },
    {
      heading: 'Who can see content',
      paragraphs: [
        'A public notebook can be viewed by anyone with its link; a private one requires an access code you choose. Messages only appear to visitors after you approve them (or immediately, if you turn on auto-publish).',
        "Message writers should know their message appears in the graduate's notebook to anyone with the link, and that the owner can hide or delete it.",
      ],
    },
    {
      heading: 'Services we rely on',
      paragraphs: [
        'The website, server, database and files are hosted with cloud providers (Vercel, Render and Supabase), and fonts load from Google Fonts. These providers process data only to deliver their services.',
      ],
    },
    {
      heading: 'Cookies',
      paragraphs: [
        'We only use essential cookies: for sign-in and for protection against forged requests (CSRF). Your interface language is saved in your browser. We use no advertising trackers.',
      ],
    },
    {
      heading: 'Retention and deletion',
      paragraphs: [
        "We keep your notebook's content for as long as your account exists. When a package expires the notebook is hidden from visitors but kept, and comes back when renewed.",
        'You can delete any message from your dashboard, and ask us to delete your account and notebook entirely by contacting us; we do so within 30 days.',
      ],
    },
    {
      heading: 'Your rights',
      paragraphs: [
        'You can ask for a copy of your data, or to correct or delete it, at any time using the contact details below.',
        "If you're under 18, use the platform with a parent's or guardian's consent.",
      ],
    },
    {
      heading: 'Changes to this policy',
      paragraphs: [
        'We may update this policy and will change the "last updated" date above. We will notify account holders of material changes.',
      ],
    },
  ],
};

export const TERMS: Record<Lang, LegalSection[]> = {
  ar: [
    {
      heading: 'الخدمة',
      paragraphs: [
        '«دفتر» يتيح لك إنشاء دفتر تخرج رقمي ومشاركته برابط ورمز QR ليكتب فيه الآخرون رسائلهم. باستخدامك المنصة فإنك توافق على هذه الشروط.',
      ],
    },
    {
      heading: 'حسابك',
      paragraphs: [
        'أنت مسؤول عن صحة بياناتك وعن الحفاظ على سرية كلمة المرور وعن كل ما يتم من خلال حسابك.',
      ],
    },
    {
      heading: 'المحتوى',
      paragraphs: [
        'تبقى ملكية الصور والنصوص لأصحابها. بنشرك محتوى على المنصة تمنحنا الإذن بتخزينه وعرضه ضمن دفترك فقط بهدف تقديم الخدمة.',
        'يُمنع نشر محتوى مسيء أو مهين أو مخالف للقانون أو ينتهك خصوصية الآخرين أو حقوقهم. صاحب الدفتر مسؤول عن مراجعة الرسائل في دفتره، ويحق لنا إخفاء أو حذف أي محتوى مخالف أو مُبلّغ عنه، وإيقاف الحسابات المخالفة.',
      ],
    },
    {
      heading: 'الأسعار والدفع',
      paragraphs: [
        'الأسعار معروضة بالدينار الأردني. يتم الدفع بالتحويل عبر CliQ أو التحويل البنكي، ويُفعَّل الدفتر بعد تأكيدنا لاستلام المبلغ.',
        'مدة كل باقة موضحة عند الشراء. عند انتهائها يُخفى الدفتر عن الزوار ويمكنك تجديده في أي وقت.',
      ],
    },
    {
      heading: 'الاسترداد',
      paragraphs: [
        'إذا لم نتمكن من تفعيل دفترك بعد استلام المبلغ، نعيد لك المبلغ كاملاً. طلبات الاسترداد بعد التفعيل تُدرس كل حالة على حدة؛ تواصل معنا.',
      ],
    },
    {
      heading: 'توفر الخدمة',
      paragraphs: [
        'نعمل على أن تكون الخدمة متاحة دائماً، لكننا لا نضمن خلوها من الانقطاع أو الأخطاء. ننصحك بالاحتفاظ بنسخ من الصور المهمة لديك.',
      ],
    },
    {
      heading: 'حدود المسؤولية',
      paragraphs: [
        'نقدّم الخدمة «كما هي». في حدود ما يسمح به القانون، لا تتجاوز مسؤوليتنا تجاهك المبلغ الذي دفعته مقابل الباقة المعنية.',
      ],
    },
    {
      heading: 'التعديلات والقانون المطبّق',
      paragraphs: [
        'قد نعدّل هذه الشروط ونحدّث تاريخها أعلاه. تخضع هذه الشروط لقوانين المملكة الأردنية الهاشمية.',
      ],
    },
  ],
  en: [
    {
      heading: 'The service',
      paragraphs: [
        'Daftar lets you create a digital graduation notebook and share it by link and QR code so others can write you messages. By using the platform you agree to these terms.',
      ],
    },
    {
      heading: 'Your account',
      paragraphs: [
        'You are responsible for the accuracy of your details, for keeping your password secret, and for everything done through your account.',
      ],
    },
    {
      heading: 'Content',
      paragraphs: [
        'Photos and text remain the property of their owners. By posting content you allow us to store and display it in your notebook, solely to provide the service.',
        "Abusive, offensive or unlawful content, or content that violates others' privacy or rights, is not allowed. Notebook owners are responsible for reviewing messages in their notebook; we may hide or remove content that breaks these rules or is reported, and suspend accounts that do.",
      ],
    },
    {
      heading: 'Prices and payment',
      paragraphs: [
        'Prices are shown in Jordanian dinars. Payment is by CliQ or bank transfer, and your notebook is activated once we confirm we received it.',
        'Each package states its duration at purchase. When it ends, the notebook is hidden from visitors and you can renew it at any time.',
      ],
    },
    {
      heading: 'Refunds',
      paragraphs: [
        "If we can't activate your notebook after receiving your payment, we refund it in full. Refund requests after activation are reviewed case by case — contact us.",
      ],
    },
    {
      heading: 'Availability',
      paragraphs: [
        "We work to keep the service available, but can't guarantee it will be uninterrupted or error-free. Keep your own copies of photos that matter to you.",
      ],
    },
    {
      heading: 'Liability',
      paragraphs: [
        'The service is provided "as is". To the extent the law allows, our liability to you is limited to the amount you paid for the package concerned.',
      ],
    },
    {
      heading: 'Changes and governing law',
      paragraphs: [
        'We may change these terms and will update the date above. These terms are governed by the laws of the Hashemite Kingdom of Jordan.',
      ],
    },
  ],
};
