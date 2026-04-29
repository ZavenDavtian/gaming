import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin, FiTwitter, FiGithub, FiYoutube, FiMessageSquare, FiSend } from 'react-icons/fi';

const contactInfo = [
  { icon: <FiMail />, label: 'Email', value: 'support@nexusgaming.io' },
  { icon: <FiPhone />, label: 'Phone', value: '+1 (555) 012-3456' },
  { icon: <FiMapPin />, label: 'Headquarters', value: 'Neon Sector 7, Cyber City' },
];

const socialLinks = [
  { icon: <FiTwitter />, link: '#' },
  { icon: <FiGithub />, link: '#' },
  { icon: <FiYoutube />, link: '#' },
  { icon: <FiMessageSquare />, link: '#' },
];

const Contact = () => {
  return (
    <div className="pb-20 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-black mb-4 neon-text"
        >
          Get In Touch
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 max-w-xl mx-auto"
        >
          Facing a technical glitch? Or just want to say hi? Our support team is available 24/7 across all dimensions.
        </motion.p>
      </div>

      <div className="grid md:grid-cols-5 gap-12 bg-slate-900/30 rounded-3xl border border-white/5 overflow-hidden p-4 md:p-8 glass-panel">
        {/* Contact Info Sidebar */}
        <div className="md:col-span-2 space-y-12 p-8 bg-indigo-600/10 rounded-2xl border border-indigo-500/20">
          <div>
            <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
            <p className="text-slate-400 mb-8">Fill up the form and our team will get back to you within 24 hours.</p>
          </div>

          <div className="space-y-6">
            {contactInfo.map((info, idx) => (
              <div key={idx} className="flex items-center gap-6 group">
                <div className="text-2xl text-indigo-400 p-3 bg-indigo-500/10 rounded-xl group-hover:scale-110 transition-transform">
                  {info.icon}
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-black tracking-widest">{info.label}</div>
                  <div className="text-slate-200 font-medium">{info.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-12">
            <div className="text-xs text-slate-500 uppercase font-black tracking-widest mb-4">Follow Us</div>
            <div className="flex gap-4">
              {socialLinks.map((social, idx) => (
                <a 
                  key={idx} 
                  href={social.link} 
                  className="p-3 bg-white/5 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-xl transition-all duration-300"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-3 p-4 md:p-8">
          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                <input 
                  type="text" 
                  placeholder="John Doe"
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-indigo-500/50 focus:bg-slate-950 transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                <input 
                  type="email" 
                  placeholder="john@example.com"
                  className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-indigo-500/50 focus:bg-slate-950 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Subject</label>
              <select className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-indigo-500/50 focus:bg-slate-950 transition-all appearance-none cursor-pointer font-medium">
                <option className="bg-slate-900">Technical Support</option>
                <option className="bg-slate-900">Billing Inquiry</option>
                <option className="bg-slate-900">Partnership</option>
                <option className="bg-slate-900">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Your Message</label>
              <textarea 
                rows="5"
                placeholder="Write your message here..."
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-indigo-500/50 focus:bg-slate-950 transition-all resize-none font-medium"
              ></textarea>
            </div>

            <button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center justify-center gap-3">
              <span>Send Transmission</span>
              <FiSend />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
