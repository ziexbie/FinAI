import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata = {
  title: "FinAI",
  description: "AI-powered financial intelligence for risk analysis, planning, and smarter money decisions.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased" data-theme="dark">
      <body className="min-h-full">
        <ThemeProvider>
          <CurrencyProvider>
            <AuthProvider>{children}</AuthProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
