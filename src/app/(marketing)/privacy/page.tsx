export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <h1 className="text-4xl font-display text-white mb-8">Privacy Policy</h1>
        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-muted-foreground">
          <p>Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>

          <h2 className="text-xl font-semibold text-white">1. Information We Collect</h2>
          <p>
            We collect information you provide when creating an account (email, username, password hash)
            and data you generate through using the platform (collections, decks, listings, follows).
          </p>

          <h2 className="text-xl font-semibold text-white">2. How We Use Your Data</h2>
          <p>
            Your data powers your collection management, portfolio valuation, and social features.
            We do not sell your personal information to third parties.
          </p>

          <h2 className="text-xl font-semibold text-white">3. Third-Party Services</h2>
          <p>
            We use external APIs (Pokemon TCG, Scryfall, YGOProDeck, OPTCG) for card data and pricing.
            Authentication may use Google or Discord OAuth. Payments are processed by Stripe.
          </p>

          <h2 className="text-xl font-semibold text-white">4. Data Security</h2>
          <p>
            Passwords are hashed with bcrypt. Sessions use encrypted JWTs. All connections use HTTPS.
          </p>

          <h2 className="text-xl font-semibold text-white">5. Contact</h2>
          <p>
            For questions about this policy, reach out via the platform or through our social channels.
          </p>
        </div>
      </div>
    </div>
  );
}
