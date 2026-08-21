import { Link } from "react-router-dom";
import { Dumbbell, MapPin, Phone, Mail } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-card">
    <div className="container mx-auto px-4 py-16 md:px-6">
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">OptizGYM</span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Empowering individuals to reach their peak potential through expert guidance and premium facilities.
          </p>
        </div>

        {/* Company */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Company</h4>
          <nav aria-label="Company links" className="flex flex-col gap-2.5">
            {[
              ["About Us", "/about"],
              ["Careers", "/careers"],
              ["Press", "/press"],
              ["Blog", "/blog"],
            ].map(([label, to]) => (
              <Link key={to} to={to} className="text-sm text-muted-foreground transition-colors hover:text-primary">{label}</Link>
            ))}
          </nav>
        </div>

        {/* Support */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Support</h4>
          <nav aria-label="Support links" className="flex flex-col gap-2.5">
            {[
              ["Contact Center", "/contact"],
              ["Terms of Service", "/terms"],
              ["Privacy Policy", "/privacy"],
              ["FAQs", "/faqs"],
            ].map(([label, to]) => (
              <Link key={to} to={to} className="text-sm text-muted-foreground transition-colors hover:text-primary">{label}</Link>
            ))}
          </nav>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Contact Us</h4>
          <div className="flex flex-col gap-3">
            <a className="flex items-start gap-2 text-sm text-muted-foreground transition-colors hover:text-primary" href="https://www.google.com/maps/search/?api=1&query=123+Fitness+Blvd+Muscle+City+CA+90210" target="_blank" rel="noreferrer">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>123 Fitness Blvd, Muscle City, CA 90210</span>
            </a>
            <a className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary" href="tel:+15551234567">
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              <span>+1 (555) 123-4567</span>
            </a>
            <a className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary" href="mailto:hello@optizgym.com">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <span>hello@optizgym.com</span>
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
        <p className="text-xs text-muted-foreground">© 2026 OptizGYM. All rights reserved.</p>
        <nav aria-label="Legal links" className="flex gap-6">
          {[
            ["Privacy", "/privacy"],
            ["Terms", "/terms"],
            ["Cookies", "/cookies"],
          ].map(([label, to]) => (
            <Link key={to} to={to} className="text-xs text-muted-foreground transition-colors hover:text-primary">{label}</Link>
          ))}
        </nav>
      </div>
    </div>
  </footer>
);

export default Footer;
