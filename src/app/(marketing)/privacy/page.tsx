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
            We also collect minimal technical data (IP address, user agent) via server logs to prevent
            abuse and debug issues.
          </p>

          <h2 className="text-xl font-semibold text-white">2. How We Use Your Data</h2>
          <p>
            Your data powers your collection management, portfolio valuation, and social features.
            We do not sell your personal information to third parties. We use it to operate, maintain,
            and improve the service — nothing else.
          </p>

          <h2 className="text-xl font-semibold text-white">3. Cookies and Tracking</h2>
          <p>
            We use essential cookies for authentication (NextAuth session tokens) and functional
            preferences (theme). We use Sentry to collect anonymized error reports so we can fix
            bugs. We do not use advertising or third-party analytics cookies.
          </p>

          <h2 className="text-xl font-semibold text-white">4. Third-Party Services</h2>
          <p>
            We use external APIs (Pokemon TCG, Scryfall, YGOProDeck, OPTCG) for card data and pricing.
            Authentication may use Google or Discord OAuth (their privacy policies apply when you
            choose to sign in with them). Payments are processed by Stripe (we never see or store
            your card details). Infrastructure is hosted on Vercel and Supabase (EU region).
          </p>

          <h2 className="text-xl font-semibold text-white">5. Data Retention</h2>
          <p>
            Account data is retained as long as your account is active. If you delete your account,
            personal data is deleted within 30 days. Anonymized transaction records may be retained
            for tax and accounting purposes as required by law (typically 7 years in the EU).
          </p>

          <h2 className="text-xl font-semibold text-white">6. Your Rights (GDPR / UK GDPR)</h2>
          <p>
            If you are in the EU, UK, or other jurisdictions with similar laws, you have the right to:
            access your data, correct inaccuracies, request deletion, export your data in a portable
            format, object to certain processing, and lodge a complaint with your local data protection
            authority. To exercise any of these rights, contact us at the address below.
          </p>

          <h2 className="text-xl font-semibold text-white">7. Data Security</h2>
          <p>
            Passwords are hashed with bcrypt (cost factor 12). Sessions use encrypted JWTs. All
            connections use HTTPS / TLS 1.2+. Database access is restricted to the application
            service account.
          </p>

          <h2 className="text-xl font-semibold text-white">8. Children</h2>
          <p>
            The service is not intended for users under 16. We do not knowingly collect data from
            children. If you believe a child has created an account, contact us to have it removed.
          </p>

          <h2 className="text-xl font-semibold text-white">9. Changes to This Policy</h2>
          <p>
            We may update this policy. Material changes will be announced on the site and, for
            registered users, by email. Continued use after an update constitutes acceptance of the
            revised policy.
          </p>

          <h2 className="text-xl font-semibold text-white">10. Contact</h2>
          <p>
            For privacy questions or to exercise your rights, contact{" "}
            <a href="mailto:privacy@tcg-all-in-one.app" className="text-primary hover:underline">
              privacy@tcg-all-in-one.app
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
