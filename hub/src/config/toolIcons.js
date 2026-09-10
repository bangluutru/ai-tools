import React from 'react';
import {
  Image,
  Scissors,
  Combine,
  Minimize2,
  Camera,
  QrCode,
  Barcode,
  Printer,
  Scale,
  Globe,
  Award,
  FileSpreadsheet,
  LayoutTemplate,
  Receipt,
  BarChart3,
  HelpCircle,
  Calculator,
  UserCheck,
  Contact,
  IdCard,
  FileText,
  Files,
  RefreshCw,
  ArrowLeftRight,
  Stamp,
  FileDown,
  Sparkles,
  Video,
  Gamepad2,
  Swords,
  Coins,
  ShieldCheck,
  PiggyBank,
  HeartHandshake,
  Clock,
  CalendarCheck,
  FileSearch,
  Compass,
  Baby,
  Users,
  Heart,
  Truck,
  Home,
  ClipboardCheck,
  Boxes,
  Building2,
  Briefcase,
  PlaneTakeoff,
  PlaneLanding,
  FileCheck,
  Calendar
} from 'lucide-react';



export const iconMap = {
  Image,
  Scissors,
  Combine,
  Minimize2,
  Camera,
  QrCode,
  Barcode,
  Printer,
  Scale,
  Globe,
  Award,
  FileSpreadsheet,
  LayoutTemplate,
  Receipt,
  FileDown,
  BarChart3,
  HelpCircle,
  Calculator,
  UserCheck,
  Contact,
  IdCard,
  FileText,
  Files,
  RefreshCw,
  ArrowLeftRight,
  Stamp,
  Sparkles,
  Video,
  Gamepad2,
  Swords,
  Coins,
  ShieldCheck,
  PiggyBank,
  HeartHandshake,
  Clock,
  CalendarCheck,
  FileSearch,
  Compass,
  Baby,
  Users,
  Heart,
  Truck,
  Home,
  ClipboardCheck,
  Boxes,
  Building2,
  Briefcase,
  PlaneTakeoff,
  PlaneLanding,
  FileCheck,
  Calendar
};


/**
 * Resolves a Lucide icon component by name with a graceful fallback.
 * @param {string} iconName
 * @returns {React.ComponentType}
 */
export function getToolIcon(iconName) {
  return iconMap[iconName] || Sparkles;
}

/**
 * Directly renders the tool icon element to satisfy ESLint static component rules.
 * @param {string} iconName
 * @param {object} props
 * @returns {React.ReactElement}
 */
export function renderToolIcon(iconName, props = {}) {
  const Icon = iconMap[iconName] || Sparkles;
  return React.createElement(Icon, props);
}

export default iconMap;
