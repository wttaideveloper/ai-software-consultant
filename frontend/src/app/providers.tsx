import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { SessionBootstrap } from "@/app/session-bootstrap";
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
      {/*
        Framer Motion writes inline transforms, so the prefers-reduced-motion
        rule in globals.css cannot reach it. reducedMotion="user" makes every
        motion component honour the OS setting at the source.
      */}
      <MotionConfig reducedMotion="user">
        <SessionBootstrap>{children}</SessionBootstrap>
        <Toaster
          theme={theme}
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast:
                "border border-border bg-surface text-foreground shadow-lg rounded-xl",
            },
          }}
        />
      </MotionConfig>
    </QueryClientProvider>
  );
}
