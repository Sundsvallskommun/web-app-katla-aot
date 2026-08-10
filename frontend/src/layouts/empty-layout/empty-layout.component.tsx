interface EmptyLayoutProps {
  children: React.ReactNode;
}

export default function EmptyLayout({ children }: EmptyLayoutProps) {
  return <div className="bg-background-content min-h-screen">{children}</div>;
}
