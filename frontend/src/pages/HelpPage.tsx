import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ChevronDown, HelpCircle, Mail } from 'lucide-react'
import crest from '@/assets/stmarys-crest.webp'

interface Faq {
  question: string
  answer: string
}

const FAQS: Faq[] = [
  {
    question: "I'm a student — what's my login email and password?",
    answer:
      "Your login email is the one your Placement Cell submitted for you when your class was added to the system. Your first password is a shared starting password set by your Placement Cell — it isn't emailed to you automatically, so check with your Placement Cell or class mentor if you don't already have it. The system will ask you to set your own new password the first time you log in.",
  },
  {
    question: "I'm a Team Leader — do I get a separate login?",
    answer:
      'No separate account is created for Team Leaders. Team Lead access is switched on for your existing student login by your Placement Cell, so you sign in with the same email and password you already use as a student — you\'ll just see the Team Leader dashboard as well.',
  },
  {
    question: "I'm a Mentor — how do I get access?",
    answer:
      'Your Placement Cell adds your email directly as a Mentor. As with students, your first password is a shared starting password set by your Placement Cell rather than emailed to you — ask your Placement Cell for it if you weren\'t told it directly.',
  },
  {
    question: 'I forgot my password — what do I do?',
    answer:
      'Use "Forgot Password?" on the sign-in form to request a reset link by email. If you don\'t receive it after a few minutes, email delivery may not be configured yet for your institution — contact your Placement Cell directly and ask them to help you sign in and set a new password.',
  },
  {
    question: "My email isn't recognized when I try to log in",
    answer:
      'This usually means your Placement Cell hasn\'t added your email to the system yet, or added a different email than the one you\'re trying. Contact your Placement Cell to confirm the exact email on file for your account.',
  },
]

function FaqItem({ faq }: { faq: Faq }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-gray-900 sm:text-base">{faq.question}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 shrink-0 text-stmary-primary" />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden"
      >
        <p className="border-t border-gray-100 px-5 py-4 text-sm leading-relaxed text-gray-600">{faq.answer}</p>
      </motion.div>
    </div>
  )
}

export default function HelpPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#FAFAFA] px-4 py-10 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => navigate('/login')}
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </button>

        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex items-center justify-center gap-2.5">
            <img src={crest} alt="St. Mary's Group of Institutions" className="h-10 w-10 rounded-full" />
          </div>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-stmary-primary/10">
            <HelpCircle className="h-6 w-6 text-stmary-primary" />
          </div>
          <h1 className="font-stmary text-2xl font-bold text-gray-900 sm:text-3xl">Login &amp; Access Help</h1>
          <p className="mt-2 text-sm text-gray-500 sm:text-base">
            Common questions about signing in as a student, Team Leader, or Mentor.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq) => (
            <FaqItem key={faq.question} faq={faq} />
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-gray-600">Still stuck? Reach your Placement Cell directly.</p>
          <a
            href="mailto:enquiry@stmarysgroup.com"
            className="mt-2 inline-flex items-center gap-1.5 font-medium text-stmary-primary hover:text-stmary-primary-dark"
          >
            <Mail className="h-4 w-4" />
            enquiry@stmarysgroup.com
          </a>
        </div>
      </div>
    </div>
  )
}
