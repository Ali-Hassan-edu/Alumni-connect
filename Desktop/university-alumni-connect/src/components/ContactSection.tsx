import { MapPin, Mail, Phone, Globe, Instagram, Facebook } from 'lucide-react'

export default function ContactSection() {
  return (
    <section id="contact" className="py-20 px-4 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Get In Touch
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Have questions? Reach out to the Department of Computer Science at COMSATS University Vehari
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Contact Information</h3>

            {/* Address */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Location</h4>
                <p className="text-gray-600 dark:text-gray-400">CUI Vehari, Punjab, Pakistan</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Email</h4>
                <a href="mailto:hodcs@cuivehari.edu.pk" className="text-blue-600 dark:text-blue-400 hover:underline">
                  hodcs@cuivehari.edu.pk
                </a>
              </div>
            </div>

            {/* Phone */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Phone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Phone</h4>
                <a href="tel:+923673602803" className="text-blue-600 dark:text-blue-400 hover:underline">
                  +92 (067) 3602803
                </a>
              </div>
            </div>

            {/* Website */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Globe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Website</h4>
                <a href="https://ww2.comsats.edu.pk/cs_vhr" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                  ww2.comsats.edu.pk/cs_vhr
                </a>
              </div>
            </div>
          </div>

          {/* Social Media & Map */}
          <div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-8 border border-blue-100 dark:border-blue-800">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Follow Us</h3>

              <div className="space-y-4">
                {/* Instagram */}
                <a
                  href="https://www.instagram.com/comsats_vehari_official/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-pink-400 dark:hover:border-pink-600 hover:shadow-lg transition-all group"
                >
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 group-hover:scale-110 transition-transform">
                      <Instagram className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Instagram</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">@comsats_vehari_official</p>
                  </div>
                </a>

                {/* Facebook */}
                <a
                  href="https://web.facebook.com/people/Department-of-Computer-Science-CUI-Vehari/61582504795576/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg transition-all group"
                >
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 transition-transform">
                      <Facebook className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Facebook</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Department of Computer Science</p>
                  </div>
                </a>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                Stay updated with the latest news, events, and announcements from the Department of Computer Science.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
