// src/components/ContactSection.tsx
import { MapPin, Mail, Phone, Globe, Instagram, Facebook, MessageCircle } from 'lucide-react'

export default function ContactSection() {
  return (
    <section id="contact" className="py-16 sm:py-20 px-4 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Get In Touch
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Have questions? Reach out to the Department of Computer Science at COMSATS University Vehari
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
          {/* Contact Info */}
          <div className="space-y-5">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
              Contact Information
            </h3>

            {/* Address */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">Location</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">CUI Vehari, Punjab, Pakistan</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">Email</h4>
                <a
                  href="mailto:abdullahwale@gmail.com"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  abdullahwale@gmail.com
                </a>
              </div>
            </div>

            {/* Phone / WhatsApp */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">Phone / WhatsApp</h4>
                <a
                  href="tel:+923046983794"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  0304-6983794
                </a>
                <a
                  href="https://wa.me/923046983794"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-3 inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:underline font-medium"
                >
                  <MessageCircle className="w-3 h-3" /> WhatsApp
                </a>
              </div>
            </div>

            {/* Website */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">Website</h4>
                <a
                  href="https://ww2.comsats.edu.pk/cs_vhr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  ww2.comsats.edu.pk/cs_vhr
                </a>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 sm:p-8 border border-blue-100 dark:border-blue-800">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">
                Follow Us
              </h3>

              <div className="space-y-4">
                {/* WhatsApp */}
                <a
                  href="https://wa.me/923046983794"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600 hover:shadow-lg transition-all group"
                >
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 group-hover:scale-110 transition-transform">
                      <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">WhatsApp</h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">0304-6983794</p>
                  </div>
                </a>

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/comsats_vehari_official/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-pink-400 dark:hover:border-pink-600 hover:shadow-lg transition-all group"
                >
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 group-hover:scale-110 transition-transform">
                      <Instagram className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Instagram</h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">@comsats_vehari_official</p>
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
                    <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 group-hover:scale-110 transition-transform">
                      <Facebook className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Facebook</h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Department of Computer Science</p>
                  </div>
                </a>
              </div>

              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700 leading-relaxed">
                Stay updated with the latest news, events, and announcements from the Department of Computer Science.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
