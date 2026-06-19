import type { Metadata } from 'next'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import configPromise from '@payload-config'
import { importMap } from '../../importMap'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generatePageMetadata({ config: configPromise, params, searchParams, importMap } as any)

const Page = ({ params, searchParams }: Args) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  RootPage({ config: configPromise, params, searchParams, importMap } as any)

export default Page
