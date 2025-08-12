import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
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
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              1. Information We Collect
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We collect information you provide directly to us, such as when you
                create an account, make a purchase, or contact our support team.
                This may include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Name, email address, and contact information</li>
                <li>Payment and billing information</li>
                <li>Order history and preferences</li>
                <li>Communications with our support team</li>
                <li>Device information and usage data</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              2. How We Use Your Information
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Process and fulfill your orders</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Send order confirmations and updates</li>
                <li>Improve our products and services</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              3. Information Sharing
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We do not sell, trade, or otherwise transfer your personal
                information to third parties except in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  With your explicit consent for specific purposes
                </li>
                <li>
                  To trusted third-party service providers who assist us in
                  operating our website and serving you
                </li>
                <li>
                  To comply with legal requirements or protect our rights
                </li>
                <li>
                  In connection with a business transfer or merger
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              4. Data Security
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We implement appropriate security measures to protect your personal
                information against unauthorized access, alteration, disclosure, or
                destruction. These measures include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encryption of sensitive data</li>
                <li>Regular security assessments</li>
                <li>Access controls and authentication</li>
                <li>Secure data transmission protocols</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              5. Your Rights
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate or incomplete data</li>
                <li>Request deletion of your personal information</li>
                <li>Object to processing of your data</li>
                <li>Withdraw consent for marketing communications</li>
                <li>Request data portability</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              6. Cookies and Tracking
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We use cookies and similar tracking technologies to enhance your
                browsing experience and analyze website usage. You can control
                cookie settings through your browser preferences.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              7. Children's Privacy
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Our services are not intended for children under 13 years of age.
                We do not knowingly collect personal information from children
                under 13. If you believe we have collected such information,
                please contact us immediately.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              8. Changes to This Policy
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of any material changes by posting the new policy on
                this page and updating the "Last updated" date.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              9. Contact Us
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                If you have any questions about this Privacy Policy or our data
                practices, please contact us at:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">Email: support@quibble.online</p>
                {/* <p className="font-medium">Phone: +1 (555) 123-4567</p> */}
                {/* <p className="font-medium">Address: 123 Privacy Street, Data City, DC 12345</p> */}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 