import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const LanguageContext = createContext(null);

export const translations = {
  en: {},
  hi: {
    // Layout & General
    "HOME": "मुख्य पृष्ठ",
    "DONATE FOOD": "भोजन दान करें",
    "FIND FOOD": "भोजन खोजें",
    "BECOME VOLUNTEER": "स्वयंसेवक बनें",
    "NGOS": "एनजीओ",
    "RESOURCES": "संसाधन",
    "ABOUT": "हमारे बारे में",
    "CONTACT": "संपर्क करें",
    "DASHBOARD": "डैशबोर्ड",
    "LOGOUT": "लॉगआउट",
    "LOGIN": "लॉगिन",
    "SIGN UP": "साइन अप",
    "PROFILE": "प्रोफ़ाइल",
    "SETTINGS": "सेटिंग्स",
    "NOTIFICATIONS": "सूचनाएं",
    "PUBLIC SITE": "सार्वजनिक साइट",
    "SEARCH...": "खोजें...",
    "TRIPLE YOUR GIFT FOR LOCAL FAMILIES!": "स्थानीय परिवारों के लिए अपने उपहार को तीन गुना करें!",
    "STAY UP TO DATE": "अप-टू-डेट रहें",
    "FIRST NAME": "पहला नाम",
    "LAST NAME": "अंतिम नाम",
    "PHONE NUMBER": "फ़ोन नंबर",
    "EMAIL": "ईमेल",
    "SUBSCRIBE": "सदस्यता लें",
    "CALL US": "हमें कॉल करें",
    "EMAIL US": "हमें ईमेल करें",
    "CONTACT US": "हमसे संपर्क करें",
    "MY DASHBOARD": "मेरा डैशबोर्ड",
    "PROFILE SETTINGS": "प्रोफ़ाइल सेटिंग्स",

    // Home Page
    "Fighting Food Waste Every Day": "हर दिन भोजन की बर्बादी से लड़ना",
    "FoodBridge Network connects surplus meals, verified volunteers, trusted NGOs, and families who need timely support. We create simple pathways to move food from donors to people with dignity, speed, and care.": "फ़ूडब्रिज नेटवर्क अधिशेष भोजन, सत्यापित स्वयंसेवकों, विश्वसनीय गैर सरकारी संगठनों और उन परिवारों को जोड़ता है जिन्हें समय पर सहायता की आवश्यकता है। हम दाताओं से लोगों तक गरिमा, गति और देखभाल के साथ भोजन पहुंचाने के सरल मार्ग बनाते हैं।",
    "Show up for your city!": "अपने शहर के लिए आगे आएं!",
    "Treat your community and help us rescue more food. Every action moves meals back to local tables.": "अपने समुदाय की सेवा करें और अधिक भोजन बचाने में हमारी सहायता करें। आपका प्रत्येक कदम भोजन को स्थानीय परिवारों की थाली तक पहुंचाता है।",
    "Donate Now": "अभी दान करें",
    "Welcome to FoodBridge Partner Hub": "फ़ूडब्रिज पार्टनर हब में आपका स्वागत है",
    "Donation drives, pickup teams, verified NGOs, and citywide service programs.": "दान अभियान, पिकअप टीमें, सत्यापित गैर सरकारी संगठन और शहरव्यापी सेवा कार्यक्रम।",
    "Start Now": "अभी शुरू करें",
    "Give directly to families": "सीधे परिवारों को दें",
    "Volunteer route kits": "स्वयंसेवक मार्ग किट",
    "Volunteer Opportunities": "स्वयंसेवक के अवसर",
    "Help collect, sort, and deliver food to nearby communities.": "आस-पास के समुदायों को भोजन एकत्र करने, छांटने और वितरित करने में सहायता करें।",
    "Programs": "कार्यक्रम",
    "Coordinate recurring donation programs with NGOs, hostels, events, and restaurants.": "गैर सरकारी संगठनों, हॉस्टलों, कार्यक्रमों और रेस्तरां के साथ आवर्ती दान कार्यक्रमों का समन्वय करें।",
    "Learn More": "अधिक जानें",
    "For every surplus donation posted early, more meals can be delivered safely.": "जल्दी पोस्ट किए गए प्रत्येक अधिशेष दान के लिए, अधिक भोजन सुरक्षित रूप से वितरित किया जा सकता है।",
    "FOOD RESCUE FACT #26": "भोजन बचाव तथ्य #26",
    "1 in 4 urban families may need short-term meal support during a difficult month.": "4 में से 1 शहरी परिवार को कठिन महीने के दौरान अल्पकालिक भोजन सहायता की आवश्यकता हो सकती है।",
    "COMMUNITY FACT #102": "सामुदायिक तथ्य #102",
    "Verified partners make distribution faster, safer, and more accountable.": "सत्यापित भागीदार वितरण को तेज़, सुरक्षित और अधिक जवाबदेह बनाते हैं।",
    "NETWORK FACT #78": "नेटवर्क तथ्य #78",
    "Latest News": "नवीनतम समाचार",
    "Serving Hope: Summer 2026": "उम्मीद की सेवा: ग्रीष्मकालीन 2026",
    "Read More": "और पढ़ें",
    "From Surplus Shelves to Neighbors' Tables": "अधिशेष अलमारियों से पड़ोसियों की मेज तक",
    "Local partners are opening reliable food rescue windows across the city...": "स्थानीय भागीदार पूरे शहर में विश्वसनीय भोजन बचाव खिड़कियां खोल रहे हैं...",
    "Check Out Our Blog": "हमारा ब्लॉग देखें",

    // Dashboard Navigation & Sidebar
    "Dashboard": "डैशबोर्ड",
    "Donate Food": "भोजन दान करें",
    "My Active Donations": "मेरे सक्रिय दान",
    "Donation History": "दान का इतिहास",
    "Track Donations": "दान ट्रैक करें",
    "Notifications": "सूचनाएं",
    "Profile": "प्रोफ़ाइल",
    "Settings": "सेटिंग्स",
    "Available Donations": "उपलब्ध दान",
    "Claimed Donations": "दावा किए गए दान",
    "Food Requests": "भोजन अनुरोध",
    "Beneficiaries": "लाभार्थी",
    "Volunteers": "स्वयंसेवक",
    "Reports": "रिपोर्ट",
    "Available Pickups": "उपलब्ध पिकअप",
    "Assigned Deliveries": "सौंपी गई डिलीवरी",
    "Delivery History": "डिलीवरी का इतिहास",
    "Navigation": "नेविगेशन",
    "Users": "उपयोगकर्ता",
    "Donors": "दाता",
    "NGOs": "गैर सरकारी संगठन (NGO)",
    "Verification": "सत्यापन",
    "Analytics": "विश्लेषण",
    "Logout": "लॉगआउट",
    "Public Site": "सार्वजनिक साइट",
    "Live Update": "लाइव अपडेट",
    "Primary operating metric": "प्राथमिक संचालन मीट्रिक",
    "Updated from live platform data": "लाइव प्लेटफॉर्म डेटा से अपडेट किया गया",

    // Donor Dashboard
    "Donor Dashboard": "दाता डैशबोर्ड",
    "Food donation workspace": "भोजन दान कार्यक्षेत्र",
    "Hello, Donor": "नमस्ते, दाता",
    "Ready to help someone today?": "क्या आप आज किसी की मदद के लिए तैयार हैं?",
    "Recent Donations": "हालिया दान",
    "Track Donation": "दान ट्रैक करें",
    "No donation selected": "कोई दान चयनित नहीं है",
    "Create a pickup-ready donation": "पिकअप के लिए तैयार दान बनाएं",
    "Food Name": "भोजन का नाम",
    "Quantity": "मात्रा",
    "Veg / Non Veg": "शाकाहारी / मांसाहारी",
    "Food Type": "भोजन का प्रकार",
    "Estimated Meals": "अनुमानित भोजन",
    "Expiry / Safe Before": "सुरक्षित उपयोग अवधि",
    "Pickup Address": "पिकअप का पता",
    "City": "शहर",
    "Contact Number": "संपर्क नंबर",
    "Storage Instructions": "भंडारण निर्देश",
    "Allergen Notes": "एलर्जी नोट्स",
    "Image Upload": "छवि अपलोड",
    "Google Map": "गूगल मैप",
    "Pickup location preview appears here": "पिकअप स्थान पूर्वावलोकन यहाँ दिखाई देगा",
    "Submit Donation": "दान सबमिट करें",
    "Quick Statistics": "त्वरित आँकड़े",
    "Donation Analytics": "दान विश्लेषण",
    "Completed and closed donations": "पूर्ण और बंद दान",
    "View Details": "विवरण देखें",
    "Recent Activity": "हालिया गतिविधि",
    "Timeline": "समयरेखा",
    "Create a donation to see activity.": "गतिविधि देखने के लिए दान करें।",
    "No donation available for tracking.": "ट्रैकिंग के लिए कोई दान उपलब्ध नहीं है।",
    "Total Donations": "कुल दान",
    "Food Saved (kg)": "बचाया गया भोजन (किग्रा)",
    "Meals Provided": "प्रदान किया गया भोजन",
    "NGOs Helped": "मदद प्राप्त एनजीओ",
    "Volunteers Assigned": "आवंटित स्वयंसेवक",
    "Average Pickup Time": "औसत पिकअप समय",

    // NGO Dashboard
    "NGO Dashboard": "एनजीओ डैशबोर्ड",
    "Food receiving and distribution center": "भोजन प्राप्ति और वितरण केंद्र",
    "Hello NGO 👋": "नमस्ते एनजीओ 👋",
    "Nearby donations available": "आस-पास उपलब्ध दान",
    "Claim Now": "अभी दावा करें",
    "Nearby Donations Available": "आस-पास उपलब्ध दान",
    "Active donations": "सक्रिय दान",
    "Food Requests Pending": "भोजन अनुरोध लंबित",
    "Requests from recipients": "प्राप्तकर्ताओं से अनुरोध",
    "Today's Distribution": "आज का वितरण",
    "Claim nearby food donations": "आस-पास के भोजन दान का दावा करें",
    "No available donations right now.": "अभी कोई उपलब्ध दान नहीं है।",
    "Claim Donation": "दान का दावा करें",
    "Select a donation": "एक दान चुनें",
    "Track Volunteer": "स्वयंसेवक ट्रैक करें",
    "Mark Delivered": "वितरित चिह्नित करें",
    "Accepted and in-progress donations": "स्वीकृत और प्रगति पर दान",
    "No claimed donations yet. Accept one from Available Donations.": "अभी तक कोई दावा नहीं किया गया है। उपलब्ध दान में से एक स्वीकार करें।",
    "Pickup coordination": "पिकअप समन्वय",
    "Volunteer assignment pending": "स्वयंसेवक आवंटन लंबित",
    "Track where food went": "ट्रैक करें कि भोजन कहाँ गया",
    "Beneficiaries served": "सेवा प्राप्त लाभार्थी",
    "Pending needs": "लंबित आवश्यकताएं",
    "No pending food requests.": "कोई लंबित भोजन अनुरोध नहीं है।",
    "Google Maps Integration": "गूगल मैप्स एकीकरण",
    "Pickup location map": "पिकअप स्थान का नक्शा",
    "Select a donation to preview pickup location.": "पिकअप स्थान का पूर्वावलोकन करने के लिए दान चुनें।",
    "No notifications yet.": "अभी कोई सूचना नहीं है।",
    "Service area not set": "सेवा क्षेत्र निर्धारित नहीं है",
    "Meals Distributed": "वितरित भोजन",
    "Food Received": "प्राप्त भोजन",
    "Average Delivery Time": "औसत वितरण समय",
    "Monthly Analytics": "मासिक विश्लेषण",
    "Distribution analytics": "वितरण विश्लेषण",

    // Auth Modal / Signup
    "Join the food rescue network": "भोजन बचाव नेटवर्क में शामिल हों",
    "One account connects donors, NGOs, volunteers, recipients, and admins through a dedicated dashboard for donation posting, pickup scheduling, tracking, and notifications.": "एक खाता दाताओं, एनजीओ, स्वयंसेवकों, प्राप्तकर्ताओं और एडमिन को दान पोस्ट करने, पिकअप शेड्यूलिंग, ट्रैकिंग और सूचनाओं के लिए एक समर्पित डैशबोर्ड के माध्यम से जोड़ता है।",
    "Post surplus food": "अधिशेष भोजन पोस्ट करें",
    "Coordinate pickups": "पिकअप का समन्वय करें",
    "Track distribution": "वितरण ट्रैक करें",
    "Login securely": "सुरक्षित लॉगिन करें",
    "Create account": "खाता बनाएं",
    "Login to dashboard": "डैशबोर्ड पर लॉगिन करें",
    "After login, your separate dashboard page opens automatically.": "लॉगिन के बाद, आपका अलग डैशबोर्ड पेज स्वचालित रूप से खुल जाता है।",

    // Search Suggestions and Redirection Targets
    "Our Story Section": "हमारी कहानी अनुभाग",
    "Impact Facts Section": "प्रभाव तथ्य अनुभाग",
    "Latest News Section": "नवीनतम समाचार अनुभाग",
    "Donate Funds Section": "धन दान अनुभाग",
    "Food Safety Section": "खाद्य सुरक्षा अनुभाग",
    "Pickup Prep Section": "पिकअप तैयारी अनुभाग",
    "Available Food Section": "उपलब्ध भोजन अनुभाग",
    "Request Food Section": "भोजन अनुरोध अनुभाग",
    "Distribution Points Section": "वितरण बिंदु अनुभाग",
    "Emergency Support Section": "आपातकालीन सहायता अनुभाग",
    "Volunteer Signup Section": "स्वयंसेवक पंजीकरण अनुभाग",
    "NGO Registration Section": "एनजीओ पंजीकरण अनुभाग",
    "Donor Handbook Section": "दाता मार्गदर्शिका अनुभाग",
    "Volunteer Guide Section": "स्वयंसेवक मार्गदर्शिका अनुभाग",
    "Reports Section": "रिपोर्ट अनुभाग",
    "Project Objectives": "परियोजना के उद्देश्य",
    "How It Works Section": "यह कैसे काम करता है अनुभाग",
    "Our Mission Section": "हमारा मिशन अनुभाग",
    "Support Email Details": "समर्थन ईमेल विवरण",
    "Partner Support Details": "भागीदार समर्थन विवरण",
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('foodbridge_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('foodbridge_lang', language);
  }, [language]);

  const t = (key) => {
    if (!key) return '';
    const cleanKey = String(key).trim();
    if (language === 'hi' && translations.hi[cleanKey]) {
      return translations.hi[cleanKey];
    }
    // Also try case-insensitive lookup
    if (language === 'hi') {
      const hiKeys = Object.keys(translations.hi);
      const matchedKey = hiKeys.find(k => k.toLowerCase() === cleanKey.toLowerCase());
      if (matchedKey) return translations.hi[matchedKey];
    }
    return key;
  };

  const value = useMemo(() => ({ language, setLanguage, t }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
