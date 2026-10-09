export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-extrabold text-rose-500 mb-8">Privacy Policy</h1>
      <div className="prose prose-rose max-w-none text-zinc-600">
        <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        <h2 className="text-xl font-bold text-zinc-800 mt-8 mb-4">1. Information We Collect</h2>
        <p className="mb-4">We collect information you provide directly to us, such as when you create or modify your account, use our services, or communicate with us. This may include your name, email address, password, health goals, and any other information you choose to provide.</p>
        <h2 className="text-xl font-bold text-zinc-800 mt-8 mb-4">2. How We Use Your Information</h2>
        <p className="mb-4">We use the information we collect to provide, maintain, and improve our services, to personalize your experience, and to communicate with you about products, services, offers, and promotions.</p>
        <h2 className="text-xl font-bold text-zinc-800 mt-8 mb-4">3. Data Security</h2>
        <p className="mb-4">We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
        <p className="mt-8 text-sm italic">Note: HerCare is a demo application. Please do not submit real sensitive medical information.</p>
      </div>
    </div>
  );
}
