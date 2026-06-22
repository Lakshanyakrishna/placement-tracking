import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Award, Sparkles, Star, Compass, BookOpen, Code,
  ShieldCheck, TrendingUp, UserPlus, Upload,
  ChevronDown, Clock
} from 'lucide-react'

/* ─── Data ────────────────────────────────── */

const journeyNodes = [
  { id: 'discover', icon: Compass, title: 'Discover', subtitle: 'Find your opportunity', description: 'Find available certification opportunities that match your interests and academic goals.',
    color: 'text-[#B91C1C]', borderColor: 'border-[#B91C1C]', bgColor: 'bg-[#B91C1C]' },
  { id: 'learn', icon: BookOpen, title: 'Learn', subtitle: 'Study and prepare', description: 'Study and complete learning requirements using curated materials and practice resources.',
    color: 'text-[#1e3a5f]', borderColor: 'border-[#1e3a5f]', bgColor: 'bg-[#1e3a5f]' },
  { id: 'complete', icon: Award, title: 'Complete', subtitle: 'Earn your certification', description: 'Complete your certification exam and earn industry-recognized credentials.',
    color: 'text-[#2d6a4f]', borderColor: 'border-[#2d6a4f]', bgColor: 'bg-[#2d6a4f]' },
  { id: 'upload', icon: Upload, title: 'Upload', subtitle: 'Submit proof of completion', description: 'Submit proof of completion by uploading your certificate and score card for verification.',
    color: 'text-[#5c3d2e]', borderColor: 'border-[#5c3d2e]', bgColor: 'bg-[#5c3d2e]' },
  { id: 'verify', icon: ShieldCheck, title: 'Verify', subtitle: 'Team leader reviews', description: 'Team leader reviews and validates your submission to ensure authenticity and accuracy.',
    color: 'text-[#B91C1C]', borderColor: 'border-[#B91C1C]', bgColor: 'bg-[#B91C1C]' },
  { id: 'progress', icon: TrendingUp, title: 'Progress', subtitle: 'Achievement recorded', description: 'Your verified achievement appears in tracking dashboards for recognition and future opportunities.',
    color: 'text-[#1e3a5f]', borderColor: 'border-[#1e3a5f]', bgColor: 'bg-[#1e3a5f]' },
]

const pathwayCards = [
  {
    id: 'aws', title: 'AWS Cloud Practitioner', provider: 'Amazon Web Services',
    overview: 'Build a foundational understanding of AWS cloud services, security, architecture best practices, and pricing. This certification validates cloud fluency and technical readiness.',
    duration: '3 months', difficulty: 'Beginner',
    skills: ['Cloud Fundamentals', 'IAM', 'EC2', 'Networking', 'Security', 'Pricing', 'Storage'],
    projects: ['Cloud Portfolio Site', 'Static Website Hosting', 'Serverless Note API'],
    certificationValue: 'Globally recognized cloud credential. Validates foundational knowledge of AWS services, security, and architecture.',
  },
  {
    id: 'oracle', title: 'Oracle Foundations', provider: 'Oracle University',
    overview: 'Learn database fundamentals, SQL, and cloud infrastructure concepts. This certification establishes core data management skills valued across every industry.',
    duration: '2 months', difficulty: 'Beginner',
    skills: ['Database Design', 'SQL', 'Cloud Infrastructure', 'Java Basics', 'Data Modeling'],
    projects: ['Database Schema Design', 'SQL Query Portfolio', 'Data Migration Script'],
    certificationValue: 'Industry-standard database certification. Validates SQL proficiency and foundational data management skills.',
  },
  {
    id: 'salesforce', title: 'Salesforce Associate', provider: 'Salesforce',
    overview: 'Master CRM fundamentals, Sales Cloud, and Service Cloud administration. This certification validates core CRM knowledge and platform proficiency.',
    duration: '2 months', difficulty: 'Beginner',
    skills: ['CRM Concepts', 'Sales Cloud', 'Service Cloud', 'Admin Basics', 'Reports & Dashboards'],
    projects: ['Sales Dashboard Build', 'Service Console Setup', 'Lead Management Flow'],
    certificationValue: 'Recognized CRM credential. Demonstrates proficiency in the worlds leading customer relationship platform.',
  },
  {
    id: 'google', title: 'Google Data Analytics', provider: 'Google',
    overview: 'Develop practical data analysis skills using spreadsheets, SQL, R, and Tableau. This certification validates data-driven decision-making abilities.',
    duration: '6 months', difficulty: 'Intermediate',
    skills: ['Data Analysis', 'SQL', 'R Programming', 'Tableau', 'Spreadsheets', 'Data Cleaning'],
    projects: ['Cyclistic Bike Share Analysis', 'Google Play Store Trends', 'Sales Performance Dashboard'],
    certificationValue: 'High-demand analytics certification. Validates proficiency in data analysis, visualization, and insight generation.',
  },
  {
    id: 'microsoft', title: 'Azure Fundamentals', provider: 'Microsoft',
    overview: 'Gain foundational knowledge of cloud services and how those services are delivered with Microsoft Azure. This certification covers cloud concepts, Azure services, security, and pricing.',
    duration: '2 months', difficulty: 'Beginner',
    skills: ['Cloud Concepts', 'Azure Services', 'Security & Compliance', 'Pricing & Support', 'Identity Management'],
    projects: ['Azure VM Deployment', 'Static Site on Azure Storage', 'Serverless Function App'],
    certificationValue: 'Microsoft-backed cloud certification. Validates understanding of cloud concepts, Azure services, and security fundamentals.',
  },
]

const insights = [
  {
    icon: Award, title: 'Certifications in Motion',
    description: 'Students across campus are pursuing industry certifications in cloud computing, data analytics, and software development — building verified skills and credentials.',
  },
  {
    icon: Sparkles, title: 'A Culture of Achievement',
    description: 'More students complete and upload certifications each semester, creating a growing culture of verified achievement across every department.',
  },
  {
    icon: Star, title: 'Skills That Last',
    description: 'From cloud architecture to data analysis to CRM administration, students are developing the exact skills that industry certifications validate.',
  },
]

/* ─── Components ─────────────────────────── */

function Nav() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? 'bg-[#FAF8F5]/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
    }`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#B91C1C] text-[10px] font-bold text-white">
            SM
          </div>
          <span className="text-xs font-medium tracking-wide text-[#6B7280] hidden sm:block">
            ST. MARY&apos;S
          </span>
        </button>

        <div className="hidden md:flex items-center gap-8">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-xs font-medium tracking-wide text-[#6B7280] hover:text-[#111827] transition-colors">
            Home
          </button>
          <button onClick={() => scrollTo('journey')} className="text-xs font-medium tracking-wide text-[#6B7280] hover:text-[#111827] transition-colors">
            Certification Journey
          </button>
          <button onClick={() => scrollTo('pathways')} className="text-xs font-medium tracking-wide text-[#6B7280] hover:text-[#111827] transition-colors">
            Pathways
          </button>
          <button onClick={() => scrollTo('inside')} className="text-xs font-medium tracking-wide text-[#6B7280] hover:text-[#111827] transition-colors">
            Inside Hub
          </button>
          <button onClick={() => scrollTo('insights')} className="text-xs font-medium tracking-wide text-[#6B7280] hover:text-[#111827] transition-colors">
            Insights
          </button>
          <button
            onClick={() => navigate('/login')}
            className="text-xs font-medium tracking-wide bg-[#B91C1C] text-white hover:bg-[#991515] rounded-full px-5 h-8 transition-colors flex items-center gap-1.5"
          >
            Login <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <button onClick={() => navigate('/login')} className="md:hidden text-xs font-medium tracking-wide text-[#6B7280]">
          Login
        </button>
      </div>
    </nav>
  )
}

const journeyDetails: Record<string, { label: string; items: string[] }> = {
  discover: { label: 'Discover', items: ['Certification Programs', 'Skill Assessments', 'Learning Roadmaps'] },
  learn: { label: 'Study', items: ['Course Materials', 'Practice Tests', 'Study Resources'] },
  complete: { label: 'Complete', items: ['AWS', 'Oracle', 'Google', 'Salesforce', 'NPTEL'] },
  upload: { label: 'Upload', items: ['Certificate File', 'Score Card', 'Digital Badge'] },
  verify: { label: 'Verify', items: ['Team Leader Review', 'Admin Approval', 'Verification Status'] },
  progress: { label: 'Progress', items: ['Achievement Dashboard', 'Progress Tracking', 'Verified Badges'] },
}

function Hero() {
  const navigate = useNavigate()
  const [activeIdx, setActiveIdx] = useState(0)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % journeyNodes.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [])

  const displayIdx = hoveredIdx !== null ? hoveredIdx : activeIdx

  return (
    <section id="journey" className="relative min-h-screen flex items-center bg-gradient-to-b from-[#FAF8F5] to-white overflow-hidden">
      {/* Background journey map */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg className="w-full h-full opacity-[0.04]" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          <path d="M 100 800 Q 300 200, 500 500 T 900 300 T 1300 600" fill="none" stroke="#B91C1C" strokeWidth="1" />
          <path d="M 200 850 Q 400 300, 600 550 T 1000 200 T 1400 500" fill="none" stroke="#111827" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Opportunity ecosystem network */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
        <svg className="w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid meet">
          <motion.path
            d="M 200 750 L 450 750 L 700 750 L 950 750 L 1200 750"
            fill="none" stroke="#B91C1C" strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
          />
          <circle cx="200" cy="750" r="4" fill="#B91C1C" opacity="0.4" />
          <circle cx="450" cy="750" r="4" fill="#B91C1C" opacity="0.4" />
          <circle cx="700" cy="750" r="4" fill="#B91C1C" opacity="0.4" />
          <circle cx="950" cy="750" r="4" fill="#B91C1C" opacity="0.4" />
          <circle cx="1200" cy="750" r="4" fill="#B91C1C" opacity="0.4" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 sm:py-28 lg:py-32 w-full">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#B91C1C]/10 bg-[#FEF2F2] px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B91C1C]" />
            <span className="text-xs font-medium tracking-wider text-[#B91C1C] uppercase">
              St. Mary&apos;s Certification Initiative
            </span>
          </div>

          <h1 className="max-w-4xl text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-[#111827] leading-[1.05]">
            Every Certification
            <br />
            <span className="text-[#B91C1C]">Matters.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg sm:text-xl text-[#6B7280] leading-relaxed">
            Students complete certifications. Team leaders verify achievements.
            Admin tracks progress. Every step is recorded, reviewed, and celebrated.
          </p>
        </motion.div>

        {/* Interactive Journey */}
        <div className="relative mt-16 lg:mt-20 max-w-5xl">
          <div className="hidden sm:block absolute top-6 left-[5%] right-[5%] h-px bg-[#E5E7EB]" />
          <motion.div
            className="hidden sm:block absolute top-6 left-[5%] h-px bg-[#B91C1C]"
            animate={{ width: `${((displayIdx + 1) / journeyNodes.length) * 90 + 5}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />

          <div className="flex flex-col sm:flex-row gap-6 sm:gap-4 justify-center">
            {journeyNodes.map((node, i) => {
              const isActive = displayIdx === i
              const isDimmed = displayIdx !== null && !isActive

              return (
                <motion.div
                  key={node.id}
                  onHoverStart={() => setHoveredIdx(i)}
                  onHoverEnd={() => setHoveredIdx(null)}
                  animate={{
                    flex: isActive ? 1.8 : isDimmed ? 0.5 : 1,
                    opacity: isDimmed ? 0.3 : 1,
                  }}
                  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                  className="relative cursor-pointer min-w-0"
                >
                  <div className={`relative z-10 flex items-center justify-center w-12 h-12 mx-auto rounded-full border-2 transition-all duration-500 ${
                    isActive
                      ? `${node.borderColor} ${node.bgColor} text-white shadow-lg`
                      : 'border-[#E5E7EB] bg-white text-[#6B7280]'
                  }`}>
                    <node.icon className="w-5 h-5" />
                  </div>

                  <div className="mt-4 text-center">
                    <h3 className={`text-sm font-bold transition-colors duration-500 ${
                      isActive ? node.color : 'text-[#111827]'
                    }`}>
                      {node.title}
                    </h3>

                    <AnimatePresence mode="wait">
                      {isActive && (
                        <motion.div
                          key={node.id + '-desc'}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <p className="mt-1 text-xs font-medium text-[#6B7280]">{node.subtitle}</p>
                          <p className="mt-2 text-xs text-[#9CA3AF] leading-relaxed">{node.description}</p>
                          {journeyDetails[node.id] && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.15, duration: 0.3 }}
                              className="mt-3 flex flex-wrap gap-1.5 justify-center"
                            >
                              {journeyDetails[node.id].items.map(item => (
                                <span key={item} className="px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[10px] font-medium text-[#B91C1C]">
                                  {item}
                                </span>
                              ))}
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Login actions */}
        <div className="mt-10 lg:mt-12 flex flex-wrap items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 bg-[#B91C1C] text-white hover:bg-[#991515] rounded-full px-8 h-12 text-sm font-semibold transition-all shadow-lg shadow-[#B91C1C]/20"
          >
            Student Login <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 border border-[#E5E7EB] text-[#111827] hover:bg-white rounded-full px-8 h-12 text-sm font-semibold transition-all"
          >
            Admin Login <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

function TrustedPartners() {
  return (
    <section className="py-14 bg-white border-y border-[#E5E7EB]">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-xs font-semibold tracking-widest text-[#9CA3AF] uppercase text-center mb-8">
          Trusted Learning Partners
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-6">
          {['AWS', 'Google', 'Oracle', 'Microsoft', 'Salesforce', 'NPTEL'].map(partner => (
            <span key={partner} className="text-lg font-bold text-[#111827]/25 hover:text-[#111827]/50 transition-colors duration-300">
              {partner}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    { icon: UserPlus, title: 'Admin Posts', subtitle: 'Certification made available' },
    { icon: Award, title: 'Student Completes', subtitle: 'Certification exam passed' },
    { icon: Upload, title: 'Certificate Uploaded', subtitle: 'Proof submitted for review' },
    { icon: ShieldCheck, title: 'Verification', subtitle: 'Team leader validates' },
    { icon: TrendingUp, title: 'Progress Recorded', subtitle: 'Achievement tracked' },
  ]

  return (
    <section className="py-24 sm:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-16">
          <p className="text-xs font-semibold tracking-widest text-[#B91C1C] uppercase mb-3">How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#111827]">
            Certification Tracking in <span className="text-[#B91C1C]">Five Steps</span>
          </h2>
          <p className="mt-4 text-sm text-[#6B7280] max-w-xl mx-auto leading-relaxed">
            From posting to verification — every certification follows a clear, auditable path.
          </p>
        </motion.div>

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-0">
          {/* Connecting line */}
          <div className="hidden lg:block absolute left-[8%] right-[8%] top-7 h-px bg-[#E5E7EB]" />

          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.12 }}
              className="relative flex-1 flex flex-col items-center text-center lg:px-3"
            >
              <div className="relative z-10 flex items-center justify-center w-14 h-14 rounded-full bg-[#FEF2F2] border-2 border-[#B91C1C]/10 text-[#B91C1C] mb-4">
                <step.icon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-[#111827]">{step.title}</h3>
              <p className="mt-1 text-xs text-[#6B7280]">{step.subtitle}</p>

              {i < steps.length - 1 && (
                <div className="lg:hidden mt-4 w-px h-6 bg-[#E5E7EB]" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PathwaysSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  return (
    <section id="pathways" ref={sectionRef} className="py-24 sm:py-32 bg-[#FAF8F5] overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-16"
        >
          <span className="text-xs font-semibold tracking-widest text-[#B91C1C] uppercase">
            Explore Certification Opportunities
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[#111827] leading-tight">
            From certification to opportunity.
          </h2>
          <p className="mt-4 text-base text-[#6B7280] leading-relaxed max-w-lg">
            Discover certifications that build practical skills and verified achievements.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pathwayCards.map((card, i) => {
            const isExpanded = expandedId === card.id
            return (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <div
                  className={`rounded-2xl border transition-all duration-500 cursor-pointer ${
                    isExpanded
                      ? 'border-[#B91C1C]/20 bg-white shadow-lg shadow-[#B91C1C]/5'
                      : 'border-[#E5E7EB] bg-white hover:shadow-sm hover:-translate-y-0.5'
                  }`}
                  onClick={() => setExpandedId(isExpanded ? null : card.id)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="inline-flex items-center rounded-full bg-[#FEF2F2] px-3 py-1 text-[10px] font-semibold text-[#B91C1C] uppercase tracking-wider">
                          {card.provider}
                        </span>
                        <h3 className="mt-3 text-lg font-semibold text-[#111827]">{card.title}</h3>
                        <div className="mt-2 flex items-center gap-3 text-xs text-[#6B7280]">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{card.duration}</span>
                          <span className="flex items-center gap-1">{card.difficulty}</span>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FEF2F2] flex-shrink-0"
                      >
                        <ChevronDown className="h-4 w-4 text-[#B91C1C]" />
                      </motion.div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="mt-6 pt-6 border-t border-[#E5E7EB] space-y-5">
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.3 }}>
                              <p className="text-sm text-[#6B7280] leading-relaxed">{card.overview}</p>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }}>
                              <p className="text-xs font-semibold text-[#111827] uppercase tracking-wider mb-2">Skills Gained</p>
                              <div className="flex flex-wrap gap-1.5">
                                {card.skills.map(skill => (
                                  <span key={skill} className="px-2.5 py-1 rounded-full bg-[#FEF2F2] text-[11px] font-medium text-[#B91C1C]">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.3 }}>
                              <p className="text-xs font-semibold text-[#111827] uppercase tracking-wider mb-2">Recommended Projects</p>
                              <div className="space-y-1.5">
                                {card.projects.map(project => (
                                  <div key={project} className="flex items-center gap-2 text-sm text-[#6B7280]">
                                    <Code className="h-3 w-3 text-[#B91C1C]" />
                                    <span>{project}</span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.3 }}>
                              <div className="bg-[#FEF2F2] rounded-xl p-4">
                                <p className="text-xs font-semibold text-[#B91C1C] uppercase tracking-wider mb-1">Certification Value</p>
                                <p className="text-sm text-[#6B7280] leading-relaxed">{card.certificationValue}</p>
                              </div>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function InsideHubSection() {
  const mockups = [
    { title: 'Student Dashboard', desc: 'Track certifications, achievements, and progress at a glance.',
      color: 'from-[#B91C1C] to-[#991515]', content: 'bg-white/10' },
    { title: 'Certificate Upload', desc: 'Upload and verify industry credentials with instant validation.',
      color: 'from-[#1e3a5f] to-[#152d4a]', content: 'bg-white/10' },
    { title: 'Submission Verification', desc: 'Review submission status and verification history in real time.',
      color: 'from-[#2d6a4f] to-[#1f4d37]', content: 'bg-white/10' },
    { title: 'Admin Progress Tracking', desc: 'Monitor student progress across certifications and verification stages.',
      color: 'from-[#5c3d2e] to-[#402a1f]', content: 'bg-white/10' },
  ]

  return (
    <section id="inside" className="py-24 sm:py-32 bg-[#FAF8F5]">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-16">
          <p className="text-xs font-semibold tracking-widest text-[#B91C1C] uppercase mb-3">Platform Preview</p>
          <h2 className="text-3xl sm:text-4xl font-light text-[#111827]">
            Inside <span className="font-semibold">Career Hub</span>
          </h2>
          <p className="mt-4 text-sm text-[#6B7280] max-w-xl mx-auto leading-relaxed">
            A firsthand look at the tools and dashboards that power certification tracking.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          {mockups.map((mockup, i) => (
            <motion.div
              key={mockup.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-500 bg-white"
            >
              <div className="bg-[#F3F4F6] px-4 py-2.5 flex items-center gap-2 border-b border-[#E5E7EB]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]" />
                </div>
                <div className="flex-1 mx-2 h-5 rounded-md bg-white border border-[#E5E7EB] flex items-center px-2.5">
                  <span className="text-[10px] text-[#9CA3AF]">app.careerhub.edu/{mockup.title.toLowerCase().replace(/\s+/g, '-')}</span>
                </div>
              </div>
              <div className={`bg-gradient-to-br ${mockup.color} p-6 sm:p-8 min-h-[220px] flex flex-col justify-end`}>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {[1, 2, 3].map(bar => (
                      <div key={bar} className={`h-1.5 rounded-full ${mockup.content}`} style={{ width: `${30 + bar * 15}%` }} />
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <div className={`w-12 h-12 rounded-xl ${mockup.content} opacity-60`} />
                    <div className="flex-1 space-y-1.5">
                      <div className={`h-2.5 rounded-full ${mockup.content} opacity-40 w-3/4`} />
                      <div className={`h-2 rounded-full ${mockup.content} opacity-30 w-1/2`} />
                    </div>
                  </div>
                  <div className={`h-16 rounded-xl ${mockup.content} opacity-20 mt-2`} />
                </div>
              </div>
              <div className="p-5 bg-white">
                <h3 className="text-sm font-semibold text-[#111827]">{mockup.title}</h3>
                <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">{mockup.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function InsightsSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  return (
    <section id="insights" ref={sectionRef} className="py-24 sm:py-32 bg-white overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-16"
        >
          <span className="text-xs font-semibold tracking-widest text-[#B91C1C] uppercase">
            Insights
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[#111827] leading-tight">
            A community of growth.
          </h2>
          <p className="mt-4 text-base text-[#6B7280] leading-relaxed max-w-lg">
            Across departments and disciplines, students are earning certifications and building verified achievements.
          </p>
        </motion.div>

        <div className="grid gap-8 sm:grid-cols-3">
          {insights.map((insight, i) => (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="group"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#FEF2F2] text-[#B91C1C] mb-5 group-hover:bg-[#B91C1C] group-hover:text-white transition-all duration-500">
                <insight.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#111827]">{insight.title}</h3>
              <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">{insight.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function VisionSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  return (
    <section ref={sectionRef} className="py-24 sm:py-32 bg-[#111827] text-white">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4A574]" />
            <span className="text-xs font-medium tracking-wider text-white/50 uppercase">
              Our Vision
            </span>
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white">
            &ldquo;Certification is not just a document.
            <br />
            <span className="text-[#D4A574]">It is evidence of growth.</span>&rdquo;
          </h2>
          <p className="mt-6 text-white/40 max-w-lg mx-auto text-base leading-relaxed">
            Career Hub helps institutions track, verify, and celebrate those achievements.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Landing Page ───────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#111827] overflow-x-hidden">
      <Nav />

      <Hero />

      <TrustedPartners />

      <HowItWorksSection />

      <PathwaysSection />

      <InsideHubSection />

      <InsightsSection />

      <VisionSection />

      <footer className="border-t border-[#E5E7EB] bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#B91C1C] text-[8px] font-bold text-white">
              SM
            </div>
            <span className="text-xs text-[#6B7280]">St. Mary&apos;s Career Hub</span>
          </div>
          <p className="text-xs text-[#9CA3AF]">
            &copy; {new Date().getFullYear()} St. Mary&apos;s Group of Institutions
          </p>
        </div>
      </footer>
    </div>
  )
}
