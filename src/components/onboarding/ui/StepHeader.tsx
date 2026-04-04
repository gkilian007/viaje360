interface StepHeaderProps {
  title: string
  subtitle?: string
  emoji?: string
}

export function StepHeader({ title, subtitle, emoji }: StepHeaderProps) {
  return (
    <div className="mb-6">
      {emoji && (
        <div className="text-4xl mb-3">{emoji}</div>
      )}
      <h1 className="text-3xl font-bold text-[#e4e2e4] leading-tight">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-sm text-[#c0c6d6] leading-relaxed">{subtitle}</p>
      )}
    </div>
  )
}
