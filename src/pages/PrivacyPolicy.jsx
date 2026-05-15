import React from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto py-12"
    >
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-3xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-black mb-8 neon-text tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">
            Privacy Policy
          </h1>
          
          <div className="space-y-8 text-slate-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
              <p className="mb-4">
                At Nexus Gaming, we prioritize your privacy. We collect information that you provide directly to us, such as when you create an account, make a purchase, or contact our support team.
              </p>
              <p>
                This may include your name, email address, payment information, and any other details you choose to provide while interacting with our platform.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">
                We use the information we collect to deliver, maintain, and improve our services. This includes processing transactions, sending you technical notices, and providing customer support.
              </p>
              <p>
                We may also use your information to communicate with you about products, services, offers, and events provided by Nexus Gaming and others.
              </p>
            </section>
            
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Data Security</h2>
              <p>
                We implement robust security measures designed to protect your personal information from unauthorized access, alteration, disclosure, or destruction. We utilize industry-standard encryption protocols and regularly monitor our systems for potential vulnerabilities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Your Rights</h2>
              <p>
                You have the right to access, update, or delete your personal information at any time. If you wish to exercise any of these rights, please contact our support team, and we will assist you promptly.
              </p>
            </section>
            
            <div className="pt-8 border-t border-white/10 mt-12 text-sm text-slate-500">
              Last updated: May 2026
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PrivacyPolicy;
