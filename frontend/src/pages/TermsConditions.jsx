export default function TermsConditions() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-extrabold text-rose-500 mb-8">Terms and Conditions</h1>
      <div className="prose prose-rose max-w-none text-zinc-600">
        <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
        <h2 className="text-xl font-bold text-zinc-800 mt-8 mb-4">1. Acceptance of Terms</h2>
        <p className="mb-4">By accessing and using HerCare, you accept and agree to be bound by the terms and provision of this agreement.</p>
        <h2 className="text-xl font-bold text-zinc-800 mt-8 mb-4">2. Medical Disclaimer</h2>
        <p className="mb-4">HerCare provides wellness information and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.</p>
        <h2 className="text-xl font-bold text-zinc-800 mt-8 mb-4">3. User Responsibilities</h2>
        <p className="mb-4">You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer or device.</p>
      </div>
    </div>
  );
}
