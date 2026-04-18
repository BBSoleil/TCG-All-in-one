export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-24">
        <h1 className="text-4xl font-display text-white mb-8">Terms of Service</h1>
        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-muted-foreground">
          <p>Last updated: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>

          <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
          <p>
            By creating an account or using TCG All-in-One (the &ldquo;Service&rdquo;), you agree to
            these Terms. If you do not agree, do not use the Service.
          </p>

          <h2 className="text-xl font-semibold text-white">2. Eligibility</h2>
          <p>
            You must be at least 16 years old to use the Service. By creating an account you confirm
            that you meet this age requirement and have legal capacity to enter into these Terms.
          </p>

          <h2 className="text-xl font-semibold text-white">3. User Accounts</h2>
          <p>
            You are responsible for maintaining the security of your account and for all activity
            that occurs under it. One account per person. We reserve the right to suspend or
            terminate accounts that violate these Terms, engage in fraud, or abuse other users.
          </p>

          <h2 className="text-xl font-semibold text-white">4. Subscription and Billing</h2>
          <p>
            The Master plan is a monthly auto-renewing subscription billed through Stripe. You can
            cancel at any time via the billing portal; cancellation takes effect at the end of the
            current billing period. Refunds are not provided for partial months, but EU consumers
            may exercise their 14-day right of withdrawal for subscriptions that have not been fully
            consumed.
          </p>

          <h2 className="text-xl font-semibold text-white">5. Marketplace</h2>
          <p>
            The Service facilitates connections between buyers and sellers of physical trading
            cards. We are not a party to transactions, do not hold inventory, and do not process
            payments directly for peer-to-peer trades. Users are responsible for accurately
            representing their listings, fulfilling orders in good faith, and complying with
            applicable consumer protection laws in their jurisdiction.
          </p>

          <h2 className="text-xl font-semibold text-white">6. Acceptable Use</h2>
          <p>
            You may not: post illegal content, harass other users, scrape or mass-download card
            data, abuse the freemium limit through multiple accounts, attempt to compromise the
            platform&apos;s security, or use the Service in any way that violates applicable law.
          </p>

          <h2 className="text-xl font-semibold text-white">7. Intellectual Property</h2>
          <p>
            Card images and game data belong to their respective rights holders (The Pokemon
            Company, Konami, Wizards of the Coast, Bandai). We display them for the purpose of
            collection tracking and portfolio management. Your collection data, decks, and listings
            remain your property; by posting them you grant us a license to display and process
            them in order to operate the Service.
          </p>

          <h2 className="text-xl font-semibold text-white">8. Limitation of Liability</h2>
          <p>
            Price data is provided for informational purposes only and is not financial advice.
            We are not liable for losses resulting from marketplace transactions, price
            fluctuations, or decisions made based on portfolio valuations. To the extent permitted
            by law, our aggregate liability is limited to the amount you paid us in the 12 months
            preceding the claim.
          </p>

          <h2 className="text-xl font-semibold text-white">9. Termination</h2>
          <p>
            You may delete your account at any time from the profile settings. We may suspend or
            terminate your access for breach of these Terms or for any reason with reasonable
            notice. On termination, the license granted above ends and your personal data is
            handled according to the Privacy Policy.
          </p>

          <h2 className="text-xl font-semibold text-white">10. Changes to the Terms</h2>
          <p>
            We may update these Terms. Material changes will be announced on the site and by email.
            Continued use after an update constitutes acceptance.
          </p>

          <h2 className="text-xl font-semibold text-white">11. Governing Law</h2>
          <p>
            These Terms are governed by the laws of France. Disputes are subject to the exclusive
            jurisdiction of the courts of Paris, France, unless mandatory consumer protection laws
            of your country of residence apply.
          </p>

          <h2 className="text-xl font-semibold text-white">12. Contact</h2>
          <p>
            Questions about these Terms:{" "}
            <a href="mailto:legal@tcg-all-in-one.app" className="text-primary hover:underline">
              legal@tcg-all-in-one.app
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
