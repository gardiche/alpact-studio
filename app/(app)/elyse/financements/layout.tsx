import { FinancementsProvider } from './context';

export default function FinancementsLayout({ children }: { children: React.ReactNode }) {
  return <FinancementsProvider>{children}</FinancementsProvider>;
}
