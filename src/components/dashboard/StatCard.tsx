import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  accent?: boolean;
  index?: number;
}

const StatCard = ({ title, value, subtitle, icon: Icon, trend, accent, index = 0 }: StatCardProps) => (
  <motion.div
    data-testid="stat-card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.07, duration: 0.4 }}
    className={cn(
      "rounded-xl border p-5 transition-all duration-300 hover:shadow-lg",
      accent
        ? "border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-primary/10"
        : "border-border bg-card hover:border-border/80 hover:shadow-black/20"
    )}
  >
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl",
        accent ? "bg-primary/20" : "bg-accent"
      )}>
        <Icon className={cn("h-5 w-5", accent ? "text-primary" : "text-muted-foreground")} />
      </div>
    </div>
    {trend && (
      <div className="mt-3 flex items-center gap-1">
        <span className={cn("text-xs font-medium", trend.value >= 0 ? "text-emerald-400" : "text-red-400")}>
          {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
        </span>
        <span className="text-xs text-muted-foreground">{trend.label}</span>
      </div>
    )}
  </motion.div>
);

export default StatCard;
