import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-primary hover:text-primary/80 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              1. Acceptance of Terms
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                By accessing and using this website, you accept and agree to be bound
                by the terms and provision of this agreement. If you do not agree to
                abide by the above, please do not use this service.
              </p>
              <p>
                These Terms of Service ("Terms") govern your use of our website and
                services. By using our services, you agree to these Terms in full.
                If you disagree with any part of these Terms, you may not access our
                services.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              2. Use License
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Permission is granted to temporarily download one copy of the
                materials (information or software) on our website for personal,
                non-commercial transitory viewing only. This is the grant of a
                license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose</li>
                <li>Attempt to reverse engineer any software on our website</li>
                <li>Remove any copyright or other proprietary notations</li>
                <li>Transfer the materials to another person</li>
              </ul>
              <p className="mt-4">
                This license shall automatically terminate if you violate any of these
                restrictions and may be terminated by us at any time.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              3. User Accounts
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                When you create an account with us, you must provide information that
                is accurate, complete, and current at all times. You are responsible
                for safeguarding the password and for all activities that occur under
                your account.
              </p>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use another person's account without permission</li>
                <li>Create multiple accounts for fraudulent purposes</li>
                <li>Share your account credentials with others</li>
                <li>Use your account for any illegal activities</li>
                <li>Attempt to gain unauthorized access to our systems</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              4. Intellectual Property Rights
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                The Service and its original content, features, and functionality are
                and will remain the exclusive property of our company and its
                licensors. The Service is protected by copyright, trademark, and
                other laws.
              </p>
              <p>
                Our trademarks and trade dress may not be used in connection with any
                product or service without our prior written consent.
              </p>
              <p>
                You retain ownership of any content you submit, post, or display on
                or through our Service. By submitting content, you grant us a
                worldwide, non-exclusive, royalty-free license to use, reproduce,
                modify, and distribute your content.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              5. Prohibited Uses
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                You may use our Service only for lawful purposes and in accordance
                with these Terms. You agree not to use the Service:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>In any way that violates any applicable law or regulation</li>
                <li>To transmit, or procure the sending of, any advertising material</li>
                <li>To impersonate or attempt to impersonate our company</li>
                <li>To engage in any other conduct that restricts or inhibits use</li>
                <li>To introduce viruses, trojans, worms, or other malicious code</li>
                <li>To attempt to gain unauthorized access to our systems</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              6. Privacy Policy
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Your privacy is important to us. Please review our Privacy Policy,
                which also governs your use of the Service, to understand our
                practices.
              </p>
              <p>
                By using our Service, you consent to the collection and use of
                information in accordance with our Privacy Policy.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              7. Payment Terms
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                All purchases are subject to our payment terms:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Prices are subject to change without notice</li>
                <li>Payment is due at the time of purchase</li>
                <li>We accept major credit cards and other payment methods</li>
                <li>All transactions are processed securely</li>
                <li>Refunds are subject to our Return & Refund Policy</li>
              </ul>
              <p className="mt-4">
                You agree to provide current, complete, and accurate purchase and
                account information for all purchases made on our website.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              8. Limitation of Liability
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                In no event shall our company, nor its directors, employees,
                partners, agents, suppliers, or affiliates, be liable for any
                indirect, incidental, special, consequential, or punitive damages,
                including without limitation, loss of profits, data, use, goodwill,
                or other intangible losses, resulting from:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your use or inability to use the Service</li>
                <li>Any unauthorized access to or use of our servers</li>
                <li>Any interruption or cessation of transmission to or from the Service</li>
                <li>Any bugs, viruses, or other harmful code</li>
                <li>Any errors or omissions in any content</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              9. Disclaimer of Warranties
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                The information on this website is provided on an "as is" basis. To
                the fullest extent permitted by law, our company:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Excludes all representations and warranties</li>
                <li>Makes no warranties about the accuracy of information</li>
                <li>Does not guarantee uninterrupted access to the Service</li>
                <li>Does not warrant that the Service will be error-free</li>
                <li>Does not guarantee that defects will be corrected</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              10. Indemnification
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                You agree to defend, indemnify, and hold harmless our company and
                its affiliates from and against any claims, damages, obligations,
                losses, liabilities, costs, or debt arising from:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Any content you submit to the Service</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              11. Termination
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We may terminate or suspend your account and bar access to the
                Service immediately, without prior notice or liability, under our
                sole discretion, for any reason whatsoever and without limitation,
                including but not limited to a breach of the Terms.
              </p>
              <p>
                If you wish to terminate your account, you may simply discontinue
                using the Service. All provisions of the Terms which by their nature
                should survive termination shall survive termination.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              12. Governing Law
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                These Terms shall be interpreted and governed by the laws of the
                United States, without regard to its conflict of law provisions.
                Our failure to enforce any right or provision of these Terms will
                not be considered a waiver of those rights.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              13. Changes to Terms
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We reserve the right, at our sole discretion, to modify or replace
                these Terms at any time. If a revision is material, we will try to
                provide at least 30 days notice prior to any new terms taking
                effect.
              </p>
              <p>
                By continuing to access or use our Service after those revisions
                become effective, you agree to be bound by the revised terms.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              14. Contact Information
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                If you have any questions about these Terms of Service, please
                contact us:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">Email: legal@productconcierge.com</p>
                <p className="font-medium">Phone: +1 (555) 123-4567</p>
                <p className="font-medium">Address: Legal Department, 123 Legal Street, Law City, LC 12345</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService; 