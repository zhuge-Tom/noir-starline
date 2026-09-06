import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'NOIR · 星海列车',description:'在星空与水面之间，走近夜行列车。可自由探索的实时 3D 场景。'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="zh-CN" className="dark"><body>{children}</body></html>}
