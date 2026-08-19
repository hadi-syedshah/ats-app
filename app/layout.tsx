import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Verity ATS",
  description: "A focused, secure applicant tracking workspace."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
