import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '魔方小课堂 - 层先法教学 | LayerCube',
  description:
    '在线3D魔方模拟器，使用层先法（七步法）一步步教你还原魔方。支持拖拽操作、动画演示、手机触摸。',
  keywords: '魔方, 层先法, 教程, 3D, 在线, Rubik, cube, tutorial',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased overflow-hidden">
        {children}
      </body>
    </html>
  )
}
