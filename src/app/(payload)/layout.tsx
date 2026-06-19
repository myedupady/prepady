import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import configPromise from '@payload-config'
import React from 'react'

import '@payloadcms/ui/styles.css'
import '@payloadcms/next/css'
import { importMap } from './importMap.js'

type Args = {
  children: React.ReactNode
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serverFunction = async (args: any) => {
  'use server'
  return handleServerFunctions({ ...args, config: configPromise, importMap })
}

const Layout = ({ children }: Args) =>
  RootLayout({ config: configPromise, importMap, serverFunction, children })

export default Layout
