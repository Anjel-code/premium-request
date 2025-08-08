import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ShippingPolicy = () => {
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
            Shipping Policy
          </h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              1. Shipping Overview
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We strive to provide fast, reliable shipping to all our customers.
                All orders are processed and shipped from our warehouse within 1-2
                business days. Delivery times vary based on your location and the
                shipping method you choose.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              2. Shipping Methods & Delivery Times
            </h2>
            <div className="space-y-6 text-muted-foreground">
              <div className="bg-muted p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Standard Shipping
                </h3>
                <ul className="space-y-2">
                  <li>• Delivery Time: 5-7 business days</li>
                  <li>• Cost: $5.99 for orders under $50</li>
                  <li>• Free shipping on orders $50 and above</li>
                  <li>• Tracking included</li>
                </ul>
              </div>

              <div className="bg-muted p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Express Shipping
                </h3>
                <ul className="space-y-2">
                  <li>• Delivery Time: 2-3 business days</li>
                  <li>• Cost: $12.99</li>
                  <li>• Priority handling</li>
                  <li>• Tracking and signature confirmation</li>
                </ul>
              </div>

              <div className="bg-muted p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Overnight Shipping
                </h3>
                <ul className="space-y-2">
                  <li>• Delivery Time: 1 business day</li>
                  <li>• Cost: $24.99</li>
                  <li>• Available for orders placed before 2 PM EST</li>
                  <li>• Premium tracking and signature confirmation</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              3. Order Processing
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>Here's what happens after you place your order:</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  <strong>Order Confirmation:</strong> You'll receive an email
                  confirmation with your order details
                </li>
                <li>
                  <strong>Processing:</strong> We process your order within 1-2
                  business days
                </li>
                <li>
                  <strong>Shipping Notification:</strong> You'll receive a shipping
                  confirmation with tracking information
                </li>
                <li>
                  <strong>Delivery:</strong> Your package will be delivered to your
                  specified address
                </li>
              </ol>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-blue-800">
                  <strong>Processing Time:</strong> Orders placed after 2 PM EST
                  will be processed the next business day. Orders placed on weekends
                  or holidays will be processed the next business day.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              4. Shipping Costs
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        Order Value
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        Standard Shipping
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        Express Shipping
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        Overnight Shipping
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">
                        Under $25
                      </td>
                      <td className="border border-gray-300 px-4 py-2">$7.99</td>
                      <td className="border border-gray-300 px-4 py-2">$14.99</td>
                      <td className="border border-gray-300 px-4 py-2">$26.99</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">
                        $25 - $49.99
                      </td>
                      <td className="border border-gray-300 px-4 py-2">$5.99</td>
                      <td className="border border-gray-300 px-4 py-2">$12.99</td>
                      <td className="border border-gray-300 px-4 py-2">$24.99</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">
                        $50 and above
                      </td>
                      <td className="border border-gray-300 px-4 py-2">FREE</td>
                      <td className="border border-gray-300 px-4 py-2">$12.99</td>
                      <td className="border border-gray-300 px-4 py-2">$24.99</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              5. International Shipping
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                We currently ship to the following countries:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>United States (including Alaska and Hawaii)</li>
                <li>Canada</li>
                <li>United Kingdom</li>
                <li>European Union countries</li>
                <li>Australia</li>
                <li>Japan</li>
              </ul>
              <p className="mt-4">
                International shipping costs and delivery times vary by country.
                Please contact us for specific rates and delivery estimates.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-yellow-800">
                  <strong>Note:</strong> International orders may be subject to
                  customs duties and taxes, which are the responsibility of the
                  recipient.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              6. Tracking Your Order
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Once your order ships, you'll receive a tracking number via email.
                You can track your package through:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Our website's order tracking page</li>
                <li>The carrier's website using your tracking number</li>
                <li>Our customer service team</li>
              </ul>
              <p className="mt-4">
                Tracking information is typically available within 24 hours of
                shipment.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              7. Delivery Issues
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                If you experience any delivery issues, please contact us immediately:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Package Not Received:</strong> Contact us if your package
                  hasn't arrived within the expected delivery window
                </li>
                <li>
                  <strong>Damaged Package:</strong> Take photos and contact us
                  within 48 hours of delivery
                </li>
                <li>
                  <strong>Wrong Address:</strong> Contact us immediately if you
                  provided an incorrect shipping address
                </li>
                <li>
                  <strong>Delivery Attempts:</strong> If delivery fails after
                  multiple attempts, the package will be returned to us
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              8. Shipping Restrictions
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Some items may have shipping restrictions:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Hazardous materials cannot be shipped</li>
                <li>Some items may require special handling</li>
                <li>Oversized items may have additional shipping costs</li>
                <li>Some locations may have delivery restrictions</li>
              </ul>
              <p className="mt-4">
                If your order contains restricted items, we'll contact you to
                discuss alternative shipping options.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              9. Contact Information
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                For questions about shipping, please contact us:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">Email: shipping@productconcierge.com</p>
                <p className="font-medium">Phone: +1 (555) 123-4567</p>
                <p className="font-medium">Hours: Monday-Friday, 9 AM - 6 PM EST</p>
                <p className="font-medium">Address: Shipping Department, 123 Shipping Street, Delivery City, DC 12345</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy; 