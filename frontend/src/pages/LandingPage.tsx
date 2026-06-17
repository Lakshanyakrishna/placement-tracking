import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Award, BarChart3, Users, Layers, Target, Shield, ChevronDown, GraduationCap, BookOpen, Briefcase, Zap } from 'lucide-react'

const features = [
  { icon: Award, title: 'Certifications', description: 'Track and verify certification completion.' },
  { icon: Briefcase, title: 'Placement Drives', description: 'Manage placement opportunities.' },
  { icon: BookOpen, title: 'Internships', description: 'Monitor internship participation.' },
  { icon: Zap, title: 'Hackathons & Contests', description: 'Track student engagement.' },
  { icon: BarChart3, title: 'Analytics', description: 'Monitor completion and participation.' },
]

const steps = [
  { num: '01', title: 'Admin Posts Opportunity', description: 'Placement officer creates certification or opportunity targets.' },
  { num: '02', title: 'Student Participates', description: 'Students start working on assigned certifications.' },
  { num: '03', title: 'Student Uploads Proof', description: 'Completed certificates are uploaded for verification.' },
  { num: '04', title: 'Team Leader Verifies', description: 'Team leader reviews and verifies the submission.' },
  { num: '05', title: 'Admin Monitors Progress', description: 'Real-time dashboard tracks completion across all groups.' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Top Navigation ── */}
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-stmarys text-[10px] font-bold text-white">
              SM
            </div>
            <span className="text-sm font-semibold">St. Mary's Career Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              Student Login
            </Button>
            <Button size="sm" onClick={() => navigate('/login')}>
              Admin Login
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero Section ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-stmarys to-stmarys-dark py-20 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="mx-auto max-w-7xl px-4 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              St. Mary's Career Hub
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
              A centralized platform for certifications, internships, placement opportunities,
              hackathons, and career readiness tracking.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button size="lg" className="bg-white text-stmarys hover:bg-white/90" onClick={() => navigate('/login')}>
                Student Login
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={() => navigate('/login')}>
                Admin Login
              </Button>
            </div>
          </div>
          <div className="mt-12 flex justify-center">
            <ChevronDown className="h-6 w-6 animate-bounce text-white/60" />
          </div>
        </section>

        {/* ── Platform Features ── */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-center text-2xl font-bold">Platform Features</h2>
            <p className="mt-2 text-center text-muted-foreground">
              Everything you need to manage career development.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {features.map((f) => (
                <Card key={f.title} className="border-0 bg-muted/50 shadow-sm">
                  <CardContent className="flex flex-col items-center p-5 text-center">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-stmarys-light">
                      <f.icon className="h-5 w-5 text-stmarys" />
                    </div>
                    <h3 className="text-sm font-semibold">{f.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{f.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── Process Flow ── */}
        <section className="bg-muted/30 py-16">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-center text-2xl font-bold">How It Works</h2>
            <p className="mt-2 text-center text-muted-foreground">
              From posting opportunities to tracking completion.
            </p>
            <div className="mt-10 space-y-0">
              {steps.map((step, i) => (
                <div key={step.num} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stmarys text-sm font-bold text-white">
                      {step.num}
                    </div>
                    {i < steps.length - 1 && <div className="mt-1 h-8 w-px bg-border" />}
                  </div>
                  <div className="pb-6 pt-1">
                    <h3 className="text-sm font-semibold">{step.title}</h3>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Statistics Section ── */}
        <section className="bg-stmarys py-14 text-white">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="text-center text-2xl font-bold">Platform Overview</h2>
            <p className="mt-2 text-center text-white/70">Real-time statistics from the platform.</p>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { icon: Users, label: 'Students Managed', value: '92' },
                { icon: Layers, label: 'Sections', value: '1' },
                { icon: Target, label: 'Groups', value: '4' },
                { icon: Award, label: 'Opportunities', value: '6' },
                { icon: Shield, label: 'Completed Certs', value: '0' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-white/10 p-4 text-center backdrop-blur">
                  <s.icon className="mx-auto h-6 w-6 text-white/80" />
                  <p className="mt-2 text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-white/70">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t bg-white py-10">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-8 sm:grid-cols-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-stmarys text-[10px] font-bold text-white">
                    SM
                  </div>
                  <span className="text-sm font-semibold">St. Mary's Career Hub</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  A centralized career readiness platform for students and administrators.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold">Quick Links</h4>
                <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <li><button onClick={() => navigate('/login')} className="hover:text-stmarys">Student Login</button></li>
                  <li><button onClick={() => navigate('/login')} className="hover:text-stmarys">Admin Login</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold">Contact</h4>
                <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <li>St. Mary's Group of Institutions</li>
                  <li>Hyderabad, Telangana</li>
                  <li>career@stmarys.edu</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} St. Mary's Group of Institutions. All rights reserved.
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
