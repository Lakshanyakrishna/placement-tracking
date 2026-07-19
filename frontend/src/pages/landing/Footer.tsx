import { Mail } from 'lucide-react'
import { FacebookIcon, InstagramIcon, YoutubeIcon } from './SocialIcons'
import crestLight from '@/assets/stmarys-crest-light.webp'

const SOCIAL_LINKS = [
  { icon: FacebookIcon, label: 'Facebook', href: 'https://www.facebook.com/smgoi.in' },
  { icon: InstagramIcon, label: 'Instagram', href: 'https://www.instagram.com/smgoi.in/' },
  { icon: YoutubeIcon, label: 'YouTube', href: 'https://www.youtube.com/channel/UCLhIaMRjLXZMGWZ9JqKuTSQ' },
]

export function Footer() {
  return (
    <footer className="bg-gray-900 py-12 text-gray-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <img src={crestLight} alt="St. Mary's Group of Institutions" className="h-10 w-10 rounded-full" />
            <div className="text-center sm:text-left">
              <p className="font-stmary text-sm font-semibold text-white">
                St. Mary&apos;s Group of Institutions
              </p>
              <p className="text-xs text-gray-500">Hyderabad</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 sm:items-end">
            <a
              href="mailto:enquiry@stmarysgroup.com"
              className="flex items-center gap-1.5 text-xs text-gray-400 transition-colors hover:text-white"
            >
              <Mail className="h-3.5 w-3.5" />
              enquiry@stmarysgroup.com
            </a>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-gray-300 transition-colors hover:bg-stmary-primary hover:text-white"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-gray-500">
          <p>Built by the Placement Cell</p>
          <p className="mt-1">&copy; {new Date().getFullYear()} St. Mary&apos;s Group of Institutions</p>
        </div>
      </div>
    </footer>
  )
}
