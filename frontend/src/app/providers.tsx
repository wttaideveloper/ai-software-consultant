import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { useThemeStore } from "@/store/theme-store";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      }),
  );

  const theme = useThemeStore((state) => state.theme);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        theme={theme}
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast:
              "border border-border bg-surface-elevated text-foreground shadow-lift",
          },
        }}
      />
    </QueryClientProvider>
  );
}
