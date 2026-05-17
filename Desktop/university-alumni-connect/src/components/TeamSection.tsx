import { Linkedin, Globe } from 'lucide-react'

interface TeamMember {
  name: string
  role: string
  image: string
  linkedin?: string
  portfolio?: string
  isLead?: boolean
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Ali Hassan',
    role: 'DEVELOPER',
    image: '/ali.jpeg',
    linkedin: 'https://www.linkedin.com/in/ali-hassan-45b9b53b0/',
    portfolio: 'https://www.aliofficial.me/',
  },
  {
    name: 'Muhammad Abdullah',
    role: 'LEAD DEVELOPER',
    image: '/abdullah.jpeg',
    linkedin: 'https://www.linkedin.com/in/abdullahwale/',
    portfolio: 'https://muhammadabdullahwali.vercel.app/',
    isLead: true,
  },
  {
    name: 'Gulfam Ali',
    role: 'DEVELOPER',
    image: '/gulfam.jpeg',
    linkedin: 'https://www.linkedin.com/in/gulfam-a1i/',
    portfolio: 'https://www.gulfamali.me/',
  },
]

export default function TeamSection() {
  const leadMember = TEAM_MEMBERS.find(m => m.isLead)
  const otherMembers = TEAM_MEMBERS.filter(m => !m.isLead)

  return (
    <section id="team" className="py-20 px-4 bg-gradient-to-b from-white via-blue-50 to-white dark:from-gray-900 dark:via-blue-950/30 dark:to-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-semibold mb-6">
            💙 BUILT WITH HEART
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Development Team
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            The talented minds behind University Alumni Connect — building the platform that powers meaningful connections at COMSATS University Vehari
          </p>
        </div>

        {/* Team Grid - Lead in Center */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto items-center">
          {/* Left - Ali Hassan */}
          {otherMembers[0] && (
            <div key={otherMembers[0].name} className="flex flex-col items-center">
              <div className="relative mb-6 w-full max-w-xs">
                <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 hover:shadow-lg transition-all">
                  <img 
                    src={otherMembers[0].image} 
                    alt={otherMembers[0].name}
                    className="w-28 h-28 rounded-full object-cover mb-4 shadow-lg border-4 border-gray-200 dark:border-gray-700"
                    loading="lazy"
                  />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-1">
                    {otherMembers[0].name}
                  </h3>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-4">
                    {otherMembers[0].role}
                  </p>
                  <div className="flex gap-3">
                    {otherMembers[0].linkedin && (
                      <a
                        href={otherMembers[0].linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all"
                        title="LinkedIn"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {otherMembers[0].portfolio && (
                      <a
                        href={otherMembers[0].portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-600 hover:text-white dark:hover:bg-gray-600 transition-all"
                        title="Portfolio"
                      >
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Center - Team Lead */}
          {leadMember && (
            <div key={leadMember.name} className="flex flex-col items-center">
              <div className="relative mb-6 w-full max-w-xs">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-40" />
                <div className="relative p-8 bg-white dark:bg-gray-800 rounded-3xl border-2 border-blue-200 dark:border-blue-700 shadow-2xl">
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-full">
                    TEAM LEAD
                  </div>
                  <div className="mt-4 flex flex-col items-center">
                    <img 
                      src={leadMember.image} 
                      alt={leadMember.name}
                      className="w-36 h-36 rounded-full object-cover object-center mb-4 shadow-lg border-4 border-blue-100 dark:border-blue-900"
                      loading="lazy"
                    />
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-1">
                      {leadMember.name}
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-4">
                      {leadMember.role}
                    </p>
                    <div className="flex gap-3">
                      {leadMember.linkedin && (
                        <a
                          href={leadMember.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all"
                          title="LinkedIn"
                        >
                          <Linkedin className="w-6 h-6" />
                        </a>
                      )}
                      {leadMember.portfolio && (
                        <a
                          href={leadMember.portfolio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-600 hover:text-white dark:hover:bg-gray-600 transition-all"
                          title="Portfolio"
                        >
                          <Globe className="w-6 h-6" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Right - Gulfam Ali */}
          {otherMembers[1] && (
            <div key={otherMembers[1].name} className="flex flex-col items-center">
              <div className="relative mb-6 w-full max-w-xs">
                <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 hover:shadow-lg transition-all">
                  <img 
                    src={otherMembers[1].image} 
                    alt={otherMembers[1].name}
                    className="w-28 h-28 rounded-full object-cover object-center mb-4 shadow-lg border-4 border-gray-200 dark:border-gray-700"
                    loading="lazy"
                  />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-1">
                    {otherMembers[1].name}
                  </h3>
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-4">
                    {otherMembers[1].role}
                  </p>
                  <div className="flex gap-3">
                    {otherMembers[1].linkedin && (
                      <a
                        href={otherMembers[1].linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all"
                        title="LinkedIn"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {otherMembers[1].portfolio && (
                      <a
                        href={otherMembers[1].portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-600 hover:text-white dark:hover:bg-gray-600 transition-all"
                        title="Portfolio"
                      >
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Built with passion for COMSATS University Vehari community. If you're interested in contributing, reach out to us!
          </p>
        </div>
      </div>
    </section>
  )
}
