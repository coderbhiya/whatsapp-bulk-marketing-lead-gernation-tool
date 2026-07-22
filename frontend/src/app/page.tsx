import Link from 'next/link';
import Image from 'next/image';
import { Shield, Zap, Globe, CheckCircle2, TrendingUp, Users, ArrowRight, MessageCircle, Send, PhoneCall } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BulkPing | The Ultimate WhatsApp CRM & Group Extractor',
  description: 'Automate your WhatsApp marketing, extract group contacts, and manage your CRM effortlessly with BulkPing. Built for 2026 growth trends.',
  keywords: 'WhatsApp CRM, WhatsApp Group Extractor, Bulk Messaging, WhatsApp Marketing, CRM 2026, BulkPing',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FCF5EB] flex flex-col items-center font-sans overflow-x-hidden relative">
      {/* Animated Background Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <MessageCircle className="absolute top-[15%] left-[5%] text-[#25D366]/20 w-16 h-16 animate-float" style={{ animationDuration: '7s' }} />
        <Send className="absolute top-[25%] right-[8%] text-[#128C7E]/20 w-12 h-12 animate-float" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <Users className="absolute top-[60%] left-[10%] text-[#25D366]/20 w-20 h-20 animate-float" style={{ animationDuration: '8s', animationDelay: '2s' }} />
        <PhoneCall className="absolute top-[50%] right-[15%] text-[#128C7E]/20 w-14 h-14 animate-float" style={{ animationDuration: '6s', animationDelay: '1.5s' }} />
        <Zap className="absolute top-[35%] left-[40%] text-[#25D366]/10 w-24 h-24 animate-float" style={{ animationDuration: '9s', animationDelay: '0.5s' }} />
        <Globe className="absolute top-[20%] right-[30%] text-[#111B21]/5 w-32 h-32 animate-float" style={{ animationDuration: '10s' }} />
      </div>

      {/* Header */}
      <header className="w-full bg-[#111B21] px-6 flex justify-between items-center shadow-md sticky top-0 z-50 h-16">
        <div className="flex items-center gap-2 max-w-6xl mx-auto w-full justify-between">
          <div className="flex items-center">
            <Image src="/logodb_nobg.png" alt="BulkPing" width={160} height={46} className="h-10 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex gap-6 text-sm text-gray-300 font-medium">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            </nav>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                Log in
              </Link>
              <Link href="/register" className="btn-primary rounded-full px-6 py-2 text-sm relative z-10">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="w-full max-w-6xl px-6 flex flex-col lg:flex-row items-center justify-between py-20 md:py-28 gap-12 relative z-10">
        <div className="flex-1 text-left max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7FFDB] text-[#128C7E] text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
            #1 WhatsApp CRM Tool of 2026
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-[#111B21] mb-6 leading-[1.1] tracking-tight">
            Turn WhatsApp into a <span className="text-[#25D366]">growth engine.</span>
          </h1>
          <p className="text-xl text-[#667781] mb-10 max-w-lg leading-relaxed font-light">
            Extract contacts from groups, organize leads, and run high-converting bulk campaigns seamlessly. Designed for modern businesses.
          </p>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <Link href="/register" className="btn-primary px-8 py-4 text-lg h-auto rounded-full font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all flex items-center gap-2">
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-[#667781] sm:mt-4">No credit card required. Cancel anytime.</p>
          </div>
        </div>

        {/* Mockup visual placeholder */}
        <div className="flex-1 w-full flex justify-center relative items-center">
          <div className="absolute inset-0 bg-[#25D366]/20 blur-3xl rounded-full scale-75 transform -translate-y-10 animate-pulse"></div>
          <div className="w-full max-w-[320px] aspect-[9/16] bg-white rounded-[2.5rem] shadow-2xl border-[8px] border-[#111B21] overflow-hidden relative z-10 animate-float">
            <div className="absolute top-0 w-full h-16 bg-[#111B21] flex items-center justify-center z-20">
              <div className="w-32 h-6 bg-black rounded-full mb-2"></div>
            </div>
            <div className="pt-20 px-4 h-full bg-[#EFEAE2] flex flex-col gap-4">
              <div className="w-3/4 bg-white p-4 rounded-tr-xl rounded-b-xl shadow-sm text-sm text-[#111B21] border border-gray-100 animate-slide-up-1">
                <p className="font-semibold mb-1">Marketing Campaign 🚀</p>
                Hello! We are offering a 50% discount this week. Are you interested?
              </div>
              <div className="w-3/4 bg-[#E7FFDB] p-4 rounded-tl-xl rounded-b-xl shadow-sm self-end text-sm text-[#111B21] animate-slide-up-2">
                Yes, please send me the details!
              </div>
              <div className="mt-auto mb-6 bg-white p-3 rounded-full flex items-center gap-3 text-gray-400 text-sm shadow-sm animate-slide-up-3">
                <div className="flex-1">Type a message...</div>
                <div className="w-8 h-8 bg-[#25D366] rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Social Proof Section */}
      <section className="w-full bg-[#111B21] py-12 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-gray-400 font-medium tracking-widest uppercase mb-8">Trusted by 10,000+ growing businesses worldwide</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale contrast-200">
            {/* Logos placeholders */}
            <div className="text-2xl font-bold text-white">Acme Corp</div>
            <div className="text-2xl font-bold text-white">GlobalTech</div>
            <div className="text-2xl font-bold text-white">Nexus Agency</div>
            <div className="text-2xl font-bold text-white">Stark Ind.</div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="w-full bg-white py-24 px-6 flex flex-col items-center">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-[#111B21] mb-4">Everything you need to scale</h2>
            <p className="text-[#667781] text-lg max-w-2xl mx-auto">Powerful features built natively for WhatsApp Web to supercharge your sales and support pipelines.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center group">
              <div className="w-20 h-20 rounded-2xl bg-[#E7FFDB] flex items-center justify-center text-[#128C7E] mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-[#111B21] mb-3">Group Extractor</h3>
              <p className="text-[#667781] text-base leading-relaxed">Instantly extract phone numbers from any WhatsApp group you belong to. Build your prospect list in seconds.</p>
            </div>
            <div className="flex flex-col items-center group">
              <div className="w-20 h-20 rounded-2xl bg-[#E7FFDB] flex items-center justify-center text-[#128C7E] mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-[#111B21] mb-3">Bulk Campaigns</h3>
              <p className="text-[#667781] text-base leading-relaxed">Send personalized bulk messages to targeted groups without getting blocked. Safely automated with human-like delays.</p>
            </div>
            <div className="flex flex-col items-center group">
              <div className="w-20 h-20 rounded-2xl bg-[#E7FFDB] flex items-center justify-center text-[#128C7E] mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-[#111B21] mb-3">Smart CRM</h3>
              <p className="text-[#667781] text-base leading-relaxed">Manage contacts, assign tags, and filter audiences. A fully-fledged CRM built specifically for WhatsApp.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="w-full bg-[#FCF5EB] py-24 px-6 flex flex-col items-center border-t border-gray-200">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-[#111B21] mb-4">How it works</h2>
            <p className="text-[#667781] text-lg max-w-2xl mx-auto">Get started in less than 2 minutes. No coding required.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gray-200 z-0"></div>
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-24 h-24 rounded-full bg-white border-4 border-[#25D366] flex items-center justify-center text-2xl font-bold text-[#111B21] mb-6 shadow-lg">1</div>
              <h3 className="text-xl font-bold text-[#111B21] mb-2">Scan QR Code</h3>
              <p className="text-[#667781]">Link your WhatsApp account securely just like WhatsApp Web.</p>
            </div>
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-24 h-24 rounded-full bg-white border-4 border-[#25D366] flex items-center justify-center text-2xl font-bold text-[#111B21] mb-6 shadow-lg">2</div>
              <h3 className="text-xl font-bold text-[#111B21] mb-2">Extract & Organize</h3>
              <p className="text-[#667781]">Pull contacts from your groups or upload your own CSV list.</p>
            </div>
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-24 h-24 rounded-full bg-white border-4 border-[#25D366] flex items-center justify-center text-2xl font-bold text-[#111B21] mb-6 shadow-lg">3</div>
              <h3 className="text-xl font-bold text-[#111B21] mb-2">Launch Campaigns</h3>
              <p className="text-[#667781]">Write your message and hit send to reach thousands instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-[#111B21] py-24 px-6 flex flex-col items-center text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to skyrocket your sales?</h2>
          <p className="text-xl text-gray-400 mb-10">Join thousands of businesses already using BulkPing to automate their WhatsApp marketing.</p>
          <Link href="/register" className="btn-primary px-10 py-4 text-lg rounded-full font-bold shadow-xl hover:shadow-2xl inline-flex items-center gap-2">
            Create your free account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-white py-12 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <Image src="/logos_cropped.png" alt="BulkPing" width={140} height={40} className="h-9 w-auto object-contain" />
          </div>
          <p className="text-[#667781] text-sm">© {new Date().getFullYear()} BulkPing. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-[#667781]">
            <Link href="#" className="hover:text-[#111B21]">Privacy</Link>
            <Link href="#" className="hover:text-[#111B21]">Terms</Link>
            <Link href="#" className="hover:text-[#111B21]">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
