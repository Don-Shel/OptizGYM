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
          <div className="flex flex-col gap-2.5">
            {["About Us", "Careers", "Press", "Blog"].map((item) => (
              <span key={item} className="text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors">{item}</span>
            ))}
          </div>
        </div>

        {/* Support */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Support</h4>
          <div className="flex flex-col gap-2.5">
            {["Contact Center", "Terms of Service", "Privacy Policy", "FAQs"].map((item) => (
              <span key={item} className="text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors">{item}</span>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground">Contact Us</h4>
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-primary" />
              <span className="text-sm text-muted-foreground">123 Fitness Blvd, Muscle City, CA 90210</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">hello@optizgym.com</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
        <p className="text-xs text-muted-foreground">© 2026 OptizGYM. All rights reserved.</p>
        <div className="flex gap-6">
          {["Privacy", "Terms", "Cookies"].map((item) => (
            <span key={item} className="text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors">{item}</span>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
