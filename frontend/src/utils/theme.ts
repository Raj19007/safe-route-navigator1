export interface RiskThemeConfig {
  min: number;
  max: number;
  color: string;
  bgColor: string;
  borderColor: string;
  badgeClass: string;
  label: string;
}

export const RISK_COLOR_THEME: RiskThemeConfig[] = [
  {
    min: 0,
    max: 20,
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    label: 'Very Safe'
  },
  {
    min: 21,
    max: 40,
    color: '#84CC16',
    bgColor: 'rgba(132, 204, 22, 0.15)',
    borderColor: '#84CC16',
    badgeClass: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
    label: 'Low Risk'
  },
  {
    min: 41,
    max: 60,
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    label: 'Moderate Risk'
  },
  {
    min: 61,
    max: 80,
    color: '#F97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
    borderColor: '#F97316',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    label: 'Elevated Risk'
  },
  {
    min: 81,
    max: 100,
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.20)',
    borderColor: '#EF4444',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    label: 'High Risk'
  }
];

export const UNKNOWN_RISK_THEME: RiskThemeConfig = {
  min: 0,
  max: 0,
  color: '#6B7280',
  bgColor: 'rgba(107, 114, 128, 0.15)',
  borderColor: '#6B7280',
  badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  label: 'Unknown / Limited Data'
};

export function getRiskTheme(riskScore: number, isLimitedData: boolean = false): RiskThemeConfig {
  if (isLimitedData && (riskScore === undefined || riskScore === null)) {
    return UNKNOWN_RISK_THEME;
  }
  for (const theme of RISK_COLOR_THEME) {
    if (riskScore <= theme.max) {
      return theme;
    }
  }
  return RISK_COLOR_THEME[RISK_COLOR_THEME.length - 1];
}

export function getConfidenceBadge(confidence: number) {
  if (confidence >= 80) {
    return {
      label: 'High Confidence',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      description: 'Extensive multi-source verification'
    };
  }
  if (confidence >= 50) {
    return {
      label: 'Moderate',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      description: 'Adequate municipal baseline'
    };
  }
  return {
    label: 'Limited Data',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    description: 'Sparse observations - caution advised'
  };
}
