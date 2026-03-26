import { OnboardingGate } from '@/widgets/onboarding-carousel'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <OnboardingGate>{children}</OnboardingGate>
}
