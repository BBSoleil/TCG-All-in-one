export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <h1 className="text-4xl font-display text-white mb-8">Terms of Service</h1>
        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-muted-foreground">
          <p>Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>

          <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
          <p>
            By using TCG All-in-One, you agree to these terms. If you do not agree, please do not use the platform.
          </p>

          <h2 className="text-xl font-semibold text-white">2. User Accounts</h2>
          <p>
            You are responsible for maintaining the security of your account. One account per person.
            We reserve the right to suspend accounts that violate these terms.
          </p>

          <h2 className="text-xl font-semibold text-white">3. Marketplace</h2>
          <p>
            TCG All-in-One facilitates connections between buyers and sellers. We are not a party to transactions.
            Users are responsible for fulfilling their listings and offers honestly.
          </p>

          <h2 className="text-xl font-semibold text-white">4. Intellectual Property</h2>
          <p>
            Card images and game data belong to their respective rights holders (The Pokemon Company,
            Konami, Wizards of the Coast, Bandai). We display them under fair use for collection tracking purposes.
          </p>

          <h2 className="text-xl font-semibold text-white">5. Limitation of Liability</h2>
          <p>
            Price data is provided for informational purposes only and should not be considered financial advice.
            We are not liable for losses from marketplace transactions.
          </p>
        </div>
      </div>
    </div>
  );
}
