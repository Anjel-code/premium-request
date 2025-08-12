import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ReturnRefundPolicy = () => {
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
            Return & Refund Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              1. Return Policy Overview
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We want you to be completely satisfied with your purchase. If you're
                not happy with your order, we offer a 30-day return window for most
                products. Please read this policy carefully to understand your rights
                and our procedures.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              2. Return Eligibility
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>To be eligible for a return, your item must be:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Within 30 days of the original purchase date</li>
                <li>In its original condition and packaging</li>
                <li>Unused and undamaged</li>
                <li>Not a custom or personalized item</li>
                <li>Not a digital product or software</li>
              </ul>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-yellow-800 font-medium">
                  Note: Some items may have different return policies. Please check
                  the product page for specific return information.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              3. Non-Returnable Items
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>The following items are not eligible for returns:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Custom or personalized products</li>
                <li>Digital downloads and software</li>
                <li>Gift cards and vouchers</li>
                <li>Items marked as "Final Sale"</li>
                <li>Used or damaged items</li>
                <li>Items missing original packaging</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              4. How to Initiate a Return
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>To start a return, please follow these steps:</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  <strong>Contact Customer Support:</strong> Email us at
                  support@quibble.online
                </li>
                <li>
                  <strong>Provide Order Details:</strong> Include your order number,
                  item details, and reason for return
                </li>
                <li>
                  <strong>Receive Return Authorization:</strong> We'll provide you
                  with a return authorization number and shipping instructions
                </li>
                <li>
                  <strong>Package and Ship:</strong> Securely package the item and
                  ship it to our returns address
                </li>
                <li>
                  <strong>Track Your Return:</strong> Use the provided tracking
                  number to monitor your return
                </li>
              </ol>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              5. Return Shipping
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Return shipping costs depend on the reason for return:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Defective Items:</strong> We cover return shipping costs
                </li>
                <li>
                  <strong>Wrong Item Shipped:</strong> We cover return shipping costs
                </li>
                <li>
                  <strong>Customer Preference:</strong> Customer pays return shipping
                </li>
                <li>
                  <strong>Size/Color Changes:</strong> Customer pays return shipping
                </li>
              </ul>
              <p className="mt-4">
                We recommend using a trackable shipping method to ensure your return
                reaches us safely.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              6. Refund Process
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>Once we receive your return:</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  <strong>Inspection:</strong> We inspect the returned item within
                  3-5 business days
                </li>
                <li>
                  <strong>Approval:</strong> If the item meets our return criteria,
                  we approve the refund
                </li>
                <li>
                  <strong>Processing:</strong> Refunds are processed within 5-10
                  business days
                </li>
                <li>
                  <strong>Notification:</strong> You'll receive an email confirmation
                  when the refund is processed
                </li>
              </ol>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-blue-800">
                  <strong>Refund Timeline:</strong> Refunds typically appear in your
                  account within 3-5 business days after processing, depending on your
                  payment method and financial institution.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              7. Refund Methods
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>Refunds will be issued to the original payment method:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Credit/Debit Cards: Refunded to the original card</li>
                <li>PayPal: Refunded to your PayPal account</li>
                <li>Bank Transfers: Refunded to the original account</li>
                <li>Store Credit: Issued as account credit for future purchases</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              8. Exchanges
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We offer exchanges for items in different sizes, colors, or
                variations. To request an exchange:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Contact our customer support team</li>
                <li>Specify the desired replacement item</li>
                <li>Follow the same return process</li>
                <li>We'll ship the replacement once we receive your return</li>
              </ul>
              <p className="mt-4">
                Exchanges are subject to availability. If the desired item is out of
                stock, we'll offer a refund instead.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              9. Damaged or Defective Items
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                If you receive a damaged or defective item, please:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Contact us within 48 hours of delivery</li>
                <li>Provide photos of the damage or defect</li>
                <li>Keep all original packaging</li>
                <li>We'll provide a prepaid return label</li>
                <li>We'll ship a replacement or issue a full refund</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              10. Contact Information
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                For questions about returns and refunds, please contact us:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">Email: support@quibble.online</p>
                {/* <p className="font-medium">Phone: +1 (555) 123-4567</p> */}
                <p className="font-medium">Hours: Monday-Friday, 9 AM - 6 PM EST</p>
                {/* <p className="font-medium">Address: Returns Department, 123 Return Street, Refund City, RC 12345</p> */}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ReturnRefundPolicy; 