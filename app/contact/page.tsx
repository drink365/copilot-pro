export default function Contact() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-4">聯絡我們</h1>
      <div className="space-y-2 text-sm text-gray-700">
        <p>若您對家族傳承、稅務規劃或預約諮詢有任何問題，歡迎與我們聯繫：</p>
        <ul className="list-disc pl-5">
          <li>Email：<a className="underline" href="mailto:info@yourdomain.com">info@yourdomain.com</a></li>
          <li>預約表單：<a className="underline" href="/book">/book</a></li>
        </ul>
      </div>
      <p className="text-xs text-gray-500 mt-6">我們將於工作日儘速回覆您。</p>
    </main>
  );
}
