import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-12 px-6 bg-primary text-primary-foreground">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Premium Audio</h3>
            <p className="text-primary-foreground/80">
              Premium wireless headphones for the ultimate listening
              experience.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Features</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li>Active Noise Cancellation</li>
              <li>30-Hour Battery Life</li>
              <li>Premium Comfort</li>
              <li>Bluetooth 5.0</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li>
                <Link
                  to="/store"
                  className="hover:text-white transition-colors"
                >
                  Store
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="hover:text-white transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="hover:text-white transition-colors"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard"
                  className="hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-primary-foreground/80">
              <li>support@productconcierge.com</li>
              <li>+1 (555) 123-4567</li>
              <li>Available 24/7</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-primary-foreground/80">
            <p>&copy; 2025 Quibble. All rights reserved.</p>
            <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
              <Link
                to="/privacy-policy"
                className="hover:text-white transition-colors text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                to="/return-refund-policy"
                className="hover:text-white transition-colors text-sm"
              >
                Return & Refund Policy
              </Link>
              <Link
                to="/shipping-policy"
                className="hover:text-white transition-colors text-sm"
              >
                Shipping Policy
              </Link>
              <Link
                to="/terms-of-service"
                className="hover:text-white transition-colors text-sm"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 