'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

type ThemeProviderWithChildren = ThemeProviderProps & {
  children: React.ReactNode
}

export function ThemeProvider({ children, ...props }: ThemeProviderWithChildren) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
