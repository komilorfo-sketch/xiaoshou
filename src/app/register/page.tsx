"use client";

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Target, UserPlus, Mail, Lock, User as UserIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const employeeId = formData.get("employeeId") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, employeeId, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "注册失败")
      }

      toast.success("权限申请已提交", {
        description: "账号已在战术中枢注册成功，即将为您跳转至登录页。",
      })

      setTimeout(() => {
        router.push("/login")
      }, 1500)
    } catch (error: any) {
      toast.error("操作失败", {
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 font-sans antialiased text-slate-900 border-t-4 border-blue-600">
      <div className="w-full max-w-[450px] px-4">
        {/* Logo / Title Area */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl mb-4 group hover:scale-105 transition-transform duration-300">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
            权限申请中心
          </h1>
          <p className="text-slate-900 text-sm font-bold tracking-widest mt-1 uppercase">
            加入售前专家中枢 · 开启战术推演
          </p>
        </div>

        {/* Register Card */}
        <Card className="border-slate-200 shadow-2xl shadow-slate-200/50 bg-white overflow-hidden rounded-2xl">
          <CardHeader className="space-y-1 pb-6 pt-8 text-center md:text-left">
            <CardTitle className="text-xl font-bold flex items-center justify-center md:justify-start gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              注册备战账户
            </CardTitle>
            <CardDescription className="text-slate-900 font-medium text-xs">
              填入真实员工信息，审核通过后即可获得备战权限
            </CardDescription>
          </CardHeader>
          <form onSubmit={onSubmit}>
            <CardContent className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3.5 h-4 w-4 text-slate-900" />
                    <Input
                      name="name"
                      placeholder="姓名"
                      className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transiton-colors"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Input
                    name="employeeId"
                    placeholder="用户名"
                    className="h-11 bg-slate-50 border-slate-200 focus:bg-white transiton-colors"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-900" />
                  <Input
                    name="email"
                    placeholder="邮箱"
                    type="email"
                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transiton-colors"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-900" />
                  <Input
                    name="password"
                    placeholder="设置访问密码"
                    type="password"
                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transiton-colors"
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pb-8 pt-6">
              <Button 
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    正在提交审核申请...
                  </>
                ) : "提交注册并申请权限"}
              </Button>
              <div className="text-center">
                <Link
                  href="/login"
                  className="text-xs text-slate-900 font-bold hover:text-slate-900 transition-colors uppercase tracking-wider underline underline-offset-4"
                >
                  已有权限？前往登录接入
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

      </div>
    </div>
  )
}
