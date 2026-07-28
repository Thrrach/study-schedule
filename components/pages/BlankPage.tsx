import type { ReactNode } from "react";

type BlankPageProps = Readonly<{
  className?: string;
  children?: ReactNode;
}>;

/** โครงหน้าเปล่าสำหรับนำไป reuse ในหน้าอื่น */
export function BlankPage({ className, children }: BlankPageProps) {
  return <main className={className}>{children}</main>;
}