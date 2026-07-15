import React from 'react';
import { X, Shield, Lock, Eye, FileText } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-2xl max-h-[80vh] flex flex-col rounded-xl overflow-hidden shadow-2xl text-left">
        
        {/* Header */}
        <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="text-emerald-500" size={20} />
            <h2 className="text-lg font-bold text-neutral-100">Privacy Policy (गोपनीयता नीति)</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-neutral-300 text-sm leading-relaxed">
          
          <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800">
            <p className="text-xs text-neutral-400 font-mono">
              Last Updated: July 2026<br />
              Application ID: <span className="text-yellow-500">ca-app-pub-7854239726416448~8263728274</span>
            </p>
          </div>

          <section className="space-y-2">
            <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-1.5">
              <Eye size={16} className="text-cyan-400" /> 1. Introduction (परिचय)
            </h3>
            <p>
              Welcome to <strong>Snake.io Multiplayer</strong>. We respect your privacy and are committed to protecting any data we process. This Privacy Policy details how our app gathers, uses, and safeguards information.
            </p>
            <p className="text-neutral-400 italic text-xs">
              इस गेम में आपकी गोपनीयता का पूरा ध्यान रखा जाता है। यह नीति स्पष्ट करती है कि हम विज्ञापन और गेमप्ले अनुभव के लिए किस प्रकार की जानकारी का उपयोग करते हैं।
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-1.5">
              <FileText size={16} className="text-cyan-400" /> 2. Data Collection & Usage (डेटा संग्रह)
            </h3>
            <p className="font-semibold text-neutral-200 text-xs">A. Local Storage (स्थानीय संग्रहण)</p>
            <p>
              Our application stores your settings, custom game statistics (high scores, match counts, and coins), and unlocked skins locally on your device via <code>localStorage</code>. This data never leaves your device unless syncing with cloud-multiplayer rooms.
            </p>
            
            <p className="font-semibold text-neutral-200 text-xs mt-2">B. Google AdMob Ads Integration (विज्ञापन नीति)</p>
            <p>
              Our application is integrated with Google AdMob under Google Services. We serve advertisements using the official AdMob publisher account. AdMob may collect and process device identifiers, cookies, or location data to deliver relevant advertisements.
            </p>
            <div className="bg-neutral-950 p-3 rounded border border-neutral-800 space-y-1 text-xs text-neutral-400 font-mono">
              <div>• Developer App ID: ca-app-pub-7854239726416448~8263728274</div>
              <div>• Banner Unit ID: ca-app-pub-7854239726416448/1478828075</div>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-1.5">
              <Lock size={16} className="text-cyan-400" /> 3. Consent, GDPR, & CCPA (सहमति और सुरक्षा)
            </h3>
            <p>
              By playing this game, you consent to the processing of data by Google AdMob as set out in Google’s Privacy & Terms. Users in the European Economic Area (EEA) and California (CCPA) retain options to limit targeted tracking directly within Ad Settings or their system device permissions.
            </p>
            <p className="text-neutral-400 text-xs">
              यदि आप इस गेम को खेलते हैं, तो आप Google AdMob विज्ञापन नीतियों से सहमत होते हैं। आप अपने डिवाइस सेटिंग्स से लक्षित विज्ञापनों को नियंत्रित कर सकते हैं।
            </p>
          </section>

          <section className="space-y-2 text-xs text-neutral-500 border-t border-neutral-800 pt-3">
            <p>
              For any privacy inquiries regarding Snake.io Multiplayer, please contact our support desk or update your local browser sandbox settings to clear cached items.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg text-xs font-semibold transition-colors"
          >
            I Understand (ठीक है)
          </button>
        </div>

      </div>
    </div>
  );
}
