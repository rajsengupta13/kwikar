/* ═══════════════════════════════════════════════
   Kwikar — Comprehensive i18n (lang.js)
   Text-node walker — replaces ALL Hinglish
═══════════════════════════════════════════════ */

const LANGS = [
  { code:'hi', label:'हिन्दी',   sub:'Hindi'     },
  { code:'en', label:'English',  sub:'English'   },
  { code:'bn', label:'বাংলা',    sub:'Bengali'   },
  { code:'te', label:'తెలుగు',   sub:'Telugu'    },
  { code:'mr', label:'मराठी',    sub:'Marathi'   },
  { code:'ta', label:'தமிழ்',    sub:'Tamil'     },
  { code:'kn', label:'ಕನ್ನಡ',    sub:'Kannada'   },
  { code:'ml', label:'മലയാളം',   sub:'Malayalam' },
  { code:'or', label:'ଓଡ଼ିଆ',    sub:'Odia'      },
  { code:'gu', label:'ગુજરાતી',  sub:'Gujarati'  },
];

/* ─────────────────────────────────────────────
   PHRASE DICTIONARY
   key = exact Hinglish phrase
   value = translations per language code
───────────────────────────────────────────── */
const PH = {
  // NAV
  'Launch Kab Hai':      {en:'Launch Date',    bn:'লঞ্চ তারিখ',   te:'లాంచ్ తేదీ',   mr:'लॉन्च तारीख', ta:'தொடக்க தேதி',    kn:'ಉಡಾವಣೆ',       ml:'ലോഞ്ച്',       or:'ଲଞ୍ଚ ତାରିଖ',   gu:'લૉન્ચ'},
  'Tech Bano':           {en:'Join as Tech',   bn:'টেক হন',        te:'టెక్ అవ్వండి', mr:'टेक बना',       ta:'டெக் ஆகுங்கள்', kn:'ಟೆಕ್ ಆಗಿ',      ml:'ടെക്കാകൂ',    or:'ଟେକ ହୁଅନ୍ତୁ', gu:'ટેક બનો'},
  'Technician Bano':     {en:'Join as Technician', bn:'টেকনিশিয়ান হন', te:'టెక్నీషియన్ అవ్వండి', mr:'तंत्रज्ञ व्हा', ta:'தொழில்நுட்பவாளர் ஆகுங்கள்', kn:'ತಂತ್ರಜ್ಞರಾಗಿ', ml:'ടെക്നീഷ്യൻ ആകൂ', or:'ଟେକ୍ନିସିଆନ ହୁଅନ୍ତୁ', gu:'ટેકનિশિયન બનો'},
  'Login':               {en:'Login',          bn:'লগইন',          te:'లాగిన్',        mr:'लॉगिन',         ta:'உள்நுழைவு',      kn:'ಲಾಗಿನ್',        ml:'ലോഗിൻ',        or:'ଲଗ ଇନ',         gu:'લૉગિન'},
  'Join Now':            {en:'Join Now',       bn:'এখনই যোগ দিন', te:'ఇప్పుడే చేరండి',mr:'आत्ता सामील व्हा',ta:'இப்போது சேருங்கள்',kn:'ಈಗಲೇ ಸೇರಿ',   ml:'ഇപ്പോൾ ചേരൂ',  or:'ଏବେ ଯୋଗ ଦିଅ', gu:'હમણાં જોડાઓ'},
  'Abhi Join Karo':      {en:'Join Now',       bn:'এখনই যোগ দিন', te:'ఇప్పుడే చేరండి',mr:'आत्ता सामील व्हा',ta:'இப்போது சேருங்கள்',kn:'ಈಗಲೇ ಸೇರಿ',   ml:'ഇപ്പോൾ ചേരൂ',  or:'ଏବେ ଯୋଗ ଦିଅ', gu:'હમણાં જોડાઓ'},

  // SERVICES
  'Kya Chahiye Aapko?':  {en:'What are you looking for?', bn:'আপনি কী খুঁজছেন?', te:'మీకు ఏమి కావాలి?', mr:'तुम्हाला काय हवे?', ta:'உங்களுக்கு என்ன வேண்டும்?', kn:'ನಿಮಗೆ ಏನು ಬೇಕು?', ml:'നിങ്ങൾക്ക് എന്ത് വേണം?', or:'ଆପଣଙ୍କୁ କଣ ଦରକାର?', gu:'તમને શું જોઈએ?'},
  'Apna appliance select karo aur turant service book karo.': {en:'Select an appliance and book service instantly.', bn:'একটি যন্ত্র বেছে নিন এবং তাৎক্ষণিক সেবা বুক করুন।', te:'ఒక పరికరాన్ని ఎంచుకుని సేవ బుక్ చేయండి.', mr:'उपकरण निवडा आणि सेवा बुक करा.', ta:'ஒரு கருவியை தேர்ந்தெடுத்து சேவை பதிவு செய்யுங்கள்.', kn:'ಉಪಕರಣ ಆಯ್ಕೆ ಮಾಡಿ ಮತ್ತು ಸೇವೆ ಬುಕ್ ಮಾಡಿ.', ml:'ഉപകരണം തിരഞ്ഞെടുത്ത് സേവനം ബുക്ക് ചെയ്യൂ.', or:'ଉପକରଣ ବାଛି ସେବା ବୁକ କରନ୍ତୁ।', gu:'ઉપકરણ પસંદ કરો અને સેવા બૂક કરો.'},

  // STATS
  'Khush Customers':     {en:'Happy Customers', bn:'খুশি গ্রাহক', te:'సంతోషిత కస్టమర్లు', mr:'आनंदी ग्राहक', ta:'மகிழ்ச்சியான வாடிக்கையாளர்கள்', kn:'ಸಂತೋಷಿ ಗ್ರಾಹಕರು', ml:'സന്തുഷ്ടരായ ഉപഭോക്താക്കൾ', or:'ଖୁସ ଗ୍ରାହକ', gu:'ખુશ ગ્રાહકો'},
  'Verified Technicians':{en:'Verified Technicians', bn:'যাচাইকৃত টেকনিশিয়ান', te:'ధృవీకరించిన టెక్నీషియన్లు', mr:'सत्यापित तंत्रज्ञ', ta:'சரிபார்க்கப்பட்ட தொழில்நுட்பவாளர்கள்', kn:'ಪರಿಶೀಲಿತ ತಂತ್ರಜ್ಞರು', ml:'സ്ഥിരീകരിച്ച ടെക്നീഷ്യൻമാർ', or:'ଯାଞ୍ଚ ଟେକ୍ନିସିଆନ', gu:'ચકાસાયેલ ટેકનિशियन'},
  'Repair Warranty':     {en:'Repair Warranty', bn:'মেরামত ওয়ারেন্টি', te:'మరమ్మతు వారంటీ', mr:'दुरुस्ती वॉरंटी', ta:'பழுதுபார்ப்பு உத்தரவாதம்', kn:'ರಿಪೇರಿ ವಾರಂಟಿ', ml:'റിപ്പയർ വാറന്റി', or:'ମରାମତି ୱାରଣ୍ଟି', gu:'રિપેર વોરંટી'},

  // JOIN TECH
  'Kwikar Ke Saath Kaam Karo': {en:'Work with Kwikar', bn:'Kwikar-এর সাথে কাজ করুন', te:'Kwikar తో పని చేయండి', mr:'Kwikar सोबत काम करा', ta:'Kwikar உடன் பணிபுரியுங்கள்', kn:'Kwikar ಜೊತೆ ಕೆಲಸ ಮಾಡಿ', ml:'Kwikar-നൊപ്പം ജോലി ചെയ്യൂ', or:'Kwikar ସହ କାର୍ଯ୍ୟ କରନ୍ତୁ', gu:'Kwikar સાથે કામ કરો'},
  'Technician Bano,':    {en:'Become a Technician,', bn:'টেকনিশিয়ান হন,', te:'టెక్నీషియన్ అవ్వండి,', mr:'तंत्रज्ञ व्हा,', ta:'தொழில்நுட்பவாளர் ஆகுங்கள்,', kn:'ತಂತ್ರಜ್ಞರಾಗಿ,', ml:'ടെക്നീഷ്യൻ ആകൂ,', or:'ଟେକ୍ନିସିଆନ ହୁଅନ୍ତୁ,', gu:'ટેકનિशियन બનો,'},
  'Kamaao Zyada!':       {en:'Earn More!', bn:'আরও আয় করুন!', te:'ఎక్కువ సంపాదించండి!', mr:'जास्त कमवा!', ta:'அதிகம் சம்பாதியுங்கள்!', kn:'ಹೆಚ್ಚು ಗಳಿಸಿ!', ml:'കൂടുതൽ സമ്പാദിക്കൂ!', or:'ଅଧିକ ରୋଜଗାର କରନ୍ତୁ!', gu:'વધુ કમાઓ!'},
  'Technician Bano →':   {en:'Join as Technician →', bn:'টেকনিশিয়ান হিসেবে যোগ দিন →', te:'టెక్నీషియన్‌గా చేరండి →', mr:'तंत्रज्ञ म्हणून सामील व्हा →', ta:'தொழில்நுட்பவாளராக சேருங்கள் →', kn:'ತಂತ್ರಜ್ಞರಾಗಿ ಸೇರಿ →', ml:'ടെക്നീഷ്യനായി ചേരൂ →', or:'ଟେକ୍ନିସିଆନ ଭାବେ ଯୋଗ ଦିଅନ୍ତୁ →', gu:'ટેકनिशियन તરીકે જોડાઓ →'},

  // BOOKING PAGE
  'Kya problem hai?':    {en:"What's the problem?", bn:'সমস্যা কী?', te:'సమస్య ఏమిటి?', mr:'समस्या काय आहे?', ta:'என்ன பிரச்சனை?', kn:'ಸಮಸ್ಯೆ ಏನು?', ml:'പ്രശ്നം എന്താണ്?', or:'ସମସ୍ୟା କଣ?', gu:'સમસ્યા શું છે?'},
  'Jo problem aa rahi hai wo select karo': {en:'Select the issue you are facing', bn:'আপনার সমস্যা বেছে নিন', te:'మీ సమస్యను ఎంచుకోండి', mr:'तुमची समस्या निवडा', ta:'உங்கள் பிரச்சனையை தேர்ந்தெடுங்கள்', kn:'ನಿಮ್ಮ ಸಮಸ್ಯೆ ಆಯ್ಕೆ ಮಾಡಿ', ml:'നിങ്ങളുടെ പ്രശ്നം തിരഞ്ഞെടുക്കൂ', or:'ଆପଣଙ୍କ ସମସ୍ୟା ବାଛନ୍ତୁ', gu:'તમારી સમસ્યા પસંદ કરો'},
  'Time Slot Select karo': {en:'Select a Time Slot', bn:'সময় স্লট বেছে নিন', te:'సమయ స్లాట్ ఎంచుకోండి', mr:'वेळ स्लॉट निवडा', ta:'நேர இடம் தேர்ந்தெடுங்கள்', kn:'ಸಮಯ ಸ್ಲಾಟ್ ಆಯ್ಕೆ ಮಾಡಿ', ml:'സമയ സ്ലോട്ട് തിരഞ്ഞെടുക്കൂ', or:'ସମୟ ସ୍ଲଟ ବାଛନ୍ତୁ', gu:'સમય સ્લૉટ પસંદ કરો'},
  'Apni suvidha ke anusaar time aur din select karo': {en:'Choose a convenient time and day', bn:'সুবিধামতো সময় ও দিন বেছে নিন', te:'సౌకర్యమైన సమయం మరియు రోజు ఎంచుకోండి', mr:'सोयीस्कर वेळ आणि दिवस निवडा', ta:'வசதியான நேரம் மற்றும் நாள் தேர்ந்தெடுங்கள்', kn:'ಅನುಕೂಲಕರ ಸಮಯ ಮತ್ತು ದಿನ ಆಯ್ಕೆ ಮಾಡಿ', ml:'സൗകര്യമുള്ള സമയം തിരഞ്ഞെടുക്കൂ', or:'ସୁବିଧାଜନକ ସମୟ ଏବଂ ଦିନ ବାଛନ୍ତୁ', gu:'સગવડભর્યો સમય અને દિવસ પસંદ કરો'},
  'Aapka Address':       {en:'Your Address', bn:'আপনার ঠিকানা', te:'మీ చిరునామా', mr:'तुमचा पत्ता', ta:'உங்கள் முகவரி', kn:'ನಿಮ್ಮ ವಿಳಾಸ', ml:'നിങ്ങളുടെ മേൽവിലാസം', or:'ଆପଣଙ୍କ ଠିକଣା', gu:'તમારું સરનામું'},
  'Technician ko kahaan aana hai?': {en:'Where should the technician come?', bn:'টেকনিশিয়ান কোথায় আসবেন?', te:'టెక్నీషియన్ ఎక్కడికి రావాలి?', mr:'तंत्रज्ञ कुठे यायचे?', ta:'தொழில்நுட்பவாளர் எங்கு வர வேண்டும்?', kn:'ತಂತ್ರಜ್ಞರು ಎಲ್ಲಿ ಬರಬೇಕು?', ml:'ടെക്നീഷ്യൻ എവിടെ വരണം?', or:'ଟେକ୍ନିସିଆନ କୁଆଡ଼େ ଆସିବ?', gu:'ટેકनिशियन ક્યાં આવવો?'},
  'Book Karo':           {en:'Book Now', bn:'এখনই বুক করুন', te:'ఇప్పుడే బుక్ చేయండి', mr:'आत्ता बुक करा', ta:'இப்போது பதிவு செய்யுங்கள்', kn:'ಈಗಲೇ ಬುಕ್ ಮಾಡಿ', ml:'ഇപ്പോൾ ബുക്ക് ചെയ്യൂ', or:'ଏବେ ବୁକ କରନ୍ତୁ', gu:'હમણાં બૂક કરો'},
  'Booking Ho Gayi!':    {en:'Booking Confirmed!', bn:'বুকিং সম্পন্ন হয়েছে!', te:'బుకింగ్ అయింది!', mr:'बुकिंग झाली!', ta:'முன்பதிவு செய்யப்பட்டது!', kn:'ಬುಕಿಂಗ್ ಆಯಿತು!', ml:'ബുക്കിങ് ആയി!', or:'ବୁକିଂ ହୋଇଗଲା!', gu:'બૂકિંગ થઈ ગઈ!'},
  'Booking Confirmed!':  {en:'Booking Confirmed!', bn:'বুকিং নিশ্চিত হয়েছে!', te:'బుకింగ్ నిర్ధారించబడింది!', mr:'बुकिंग निश्चित झाली!', ta:'முன்பதிவு உறுதி செய்யப்பட்டது!', kn:'ಬುಕಿಂಗ್ ದೃಢಪಡಿಸಲಾಗಿದೆ!', ml:'ബുക്കിങ് സ്ഥിരീകരിച്ചു!', or:'ବୁକିଂ ନିଶ୍ଚିତ ହୋଇଗଲା!', gu:'બૂકિંગ કન્ફર્મ!'},
  'Aapka Parichay':      {en:'Your Introduction', bn:'আপনার পরিচয়', te:'మీ పరిచయం', mr:'तुमची ओळख', ta:'உங்கள் அறிமுகம்', kn:'ನಿಮ್ಮ ಪರಿಚಯ', ml:'നിങ്ങളുടെ പരിചയം', or:'ଆପଣଙ୍କ ପରିଚୟ', gu:'તમારો પરિચય'},
  'Aapka Profession':    {en:'Your Profession', bn:'আপনার পেশা', te:'మీ వృత్తి', mr:'तुमचा व्यवसाय', ta:'உங்கள் தொழில்', kn:'ನಿಮ್ಮ ವೃತ್ತಿ', ml:'നിങ്ങളുടെ തൊഴിൽ', or:'ଆପଣଙ୍କ ଧନ୍ଦା', gu:'તમારો વ્યવસાય'},

  // PROFILE GREETINGS
  'Kaise Ho':            {en:'How are you', bn:'আপনি কেমন আছেন', te:'మీరు ఎలా ఉన్నారు', mr:'तुम्ही कसे आहात', ta:'நீங்கள் எப்படி இருக்கிறீர்கள்', kn:'ನೀವು ಹೇಗಿದ್ದೀರಿ', ml:'നിങ്ങൾ എങ്ങനെ ഉണ്ട്', or:'ଆପଣ କେମିତି ଅଛନ୍ତି', gu:'તમે કેમ છો'},
  'AC Kharab Hai? Kwikar Karlo!': {en:'AC Not Working? Call Kwikar!', bn:'AC নষ্ট? Kwikar কে ডাকুন!', te:'AC పని చేయడంలేదా? Kwikar కి కాల్ చేయండి!', mr:'AC खराब? Kwikar ला कॉल करा!', ta:'AC கேடாகிவிட்டதா? Kwikar ஐ அழையுங்கள்!', kn:'AC ಕೆಟ್ಟಿತೆ? Kwikar ಗೆ ಕರೆ ಮಾಡಿ!', ml:'AC കേടായോ? Kwikar ഇൽ വിളിക്കൂ!', or:'AC ଖରାପ? Kwikar କୁ କୁ ଫୋନ କରନ୍ତୁ!', gu:'AC ખરાબ? Kwikar ને કૉલ કરો!'},
  'Ghar Ka Kaam, Hum Karenge!': {en:'Home Repairs, We Handle!', bn:'ঘরের কাজ, আমরা করব!', te:'ఇంటి పని, మేము చేస్తాము!', mr:'घरकाम, आम्ही करतो!', ta:'வீட்டு வேலை, நாங்கள் செய்கிறோம்!', kn:'ಮನೆ ಕೆಲಸ, ನಾವು ಮಾಡುತ್ತೇವೆ!', ml:'വീട്ടു ജോലി, ഞങ്ങൾ ചെയ്യാം!', or:'ଘର କାମ, ଆମେ କରିବୁ!', gu:'ઘર કામ, અમે કરીએ!'},
  'Fridge Thanda Nahi Kar Raha?': {en:'Fridge Not Cooling?', bn:'ফ্রিজ ঠান্ডা করছে না?', te:'ఫ్రిడ్జ్ చల్లగా చేయడం లేదా?', mr:'फ्रिज थंड करत नाही?', ta:'ஃப்ரிட்ஜ் குளிர்விக்கவில்லையா?', kn:'ಫ್ರಿಡ್ಜ್ ತಣ್ಣಗಾಗುತ್ತಿಲ್ಲವೇ?', ml:'ഫ്രിഡ്ജ് തണുക്കുന്നില്ലേ?', or:'ଫ୍ରିଜ ଥଣ୍ଡା ହେଉ ନାହିଁ?', gu:'ફ્રિઝ ઠંડું નથી?'},
  'TV Repair? 60 Min Mein!': {en:'TV Repair? In 60 Mins!', bn:'টিভি মেরামত? ৬০ মিনিটে!', te:'TV మరమ్మతు? 60 నిమిషాలలో!', mr:'TV दुरुस्ती? 60 मिनिटांत!', ta:'TV பழுதுபார்ப்பு? 60 நிமிடத்தில்!', kn:'TV ರಿಪೇರಿ? 60 ನಿಮಿಷಗಳಲ್ಲಿ!', ml:'TV റിപ്പയർ? 60 മിനിറ്റിൽ!', or:'TV ମରାମତି? 60 ମିନଟ ଭିତରେ!', gu:'TV રિપેર? 60 મિનિટમાં!'},
  'Aaj Kaunsi Service Chahiye?': {en:'Which Service Today?', bn:'আজ কোন সেবা চাই?', te:'ఈరోజు ఏ సేవ కావాలి?', mr:'आज कोणती सेवा हवी?', ta:'இன்று என்ன சேவை வேண்டும்?', kn:'ಇಂದು ಯಾವ ಸೇವೆ ಬೇಕು?', ml:'ഇന്ന് ഏത് സേവനം?', or:'ଆଜି କେଉଁ ସେବା ଦରକାର?', gu:'આજ કઈ સેવા જોઈએ?'},
  'Washing Machine Issue? Call Karo!': {en:'Washing Machine Issue? Call Us!', bn:'ওয়াশিং মেশিন সমস্যা? ফোন করুন!', te:'వాషింగ్ మెషీన్ సమస్య? ఫోన్ చేయండి!', mr:'वॉशिंग मशीन समस्या? फोन करा!', ta:'வாஷிங் மெஷின் பிரச்சனையா? அழையுங்கள்!', kn:'ವಾಷಿಂಗ್ ಮಶೀನ್ ಸಮಸ್ಯೆ? ಕರೆ ಮಾಡಿ!', ml:'വാഷിംഗ് മെഷീൻ പ്രശ്നമോ? ഫോൺ ചെയ്യൂ!', or:'ୱାଶିଂ ମଶିନ ସମସ୍ୟା? ଫୋନ କରନ୍ତୁ!', gu:'વૉશિંગ મશિન ઇશ્યૂ? ફોન કરો!'},

  // TECHNICIAN FORM
  'Technicians Ke Liye': {en:'For Technicians', bn:'টেকনিশিয়ানদের জন্য', te:'టెక్నీషియన్లకు', mr:'तंत्रज्ञांसाठी', ta:'தொழில்நுட்பவாளர்களுக்கு', kn:'ತಂತ್ರಜ್ಞರಿಗಾಗಿ', ml:'ടെക്നീഷ്യൻമാർക്ക്', or:'ଟେକ୍ନିସିଆନଙ୍କ ପାଇଁ', gu:'ટેકनिशियनો માટે'},
  'Application Submit Karo': {en:'Submit Application', bn:'আবেদন জমা দিন', te:'దరఖాస్తు సమర్పించండి', mr:'अर्ज सादर करा', ta:'விண்ணப்பம் சமர்ப்பிக்கவும்', kn:'ಅರ್ಜಿ ಸಲ್ಲಿಸಿ', ml:'അപേക്ഷ സമർപ്പിക്കൂ', or:'ଆବେଦନ ଦାଖଲ କରନ୍ତୁ', gu:'અરજી સબમિટ કરો'},
  'Application Submit Ho Gayi!': {en:'Application Submitted!', bn:'আবেদন জমা হয়েছে!', te:'దరఖాస్తు సమర్పించబడింది!', mr:'अर्ज सादर झाला!', ta:'விண்ணப்பம் சமர்ப்பிக்கப்பட்டது!', kn:'ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!', ml:'അപേക്ഷ സമർപ്പിച്ചു!', or:'ଆବେଦନ ଦାଖଲ ହୋଇଗଲା!', gu:'અરજી સબમિટ!'},

  // COMMON BUTTONS
  'Aage Bado': {en:'Continue', bn:'এগিয়ে যান', te:'కొనసాగించండి', mr:'पुढे जा', ta:'தொடர்க', kn:'ಮುಂದೆ', ml:'തുടരൂ', or:'ଆଗକୁ ଯାଆ', gu:'આગળ ચાલો'},
  'Continue': {en:'Continue', bn:'চালিয়ে যান', te:'కొనసాగించండి', mr:'सुरू ठेवा', ta:'தொடர்', kn:'ಮುಂದುವರಿ', ml:'തുടരൂ', or:'ଜାରି ରଖନ୍ତୁ', gu:'ચાલુ રાખો'},
  'Logout': {en:'Logout', bn:'লগআউট', te:'లాగ్ అవుట్', mr:'लॉगआउट', ta:'வெளியேறு', kn:'ಲಾಗ್ ಔಟ್', ml:'ലോഗ്ഔട്ട്', or:'ଲଗ ଆଉଟ', gu:'લૉગ આઉટ'},
  'Meri Bookings': {en:'My Bookings', bn:'আমার বুকিং', te:'నా బుకింగ్‌లు', mr:'माझ्या बुकिंग', ta:'என் முன்பதிவுகள்', kn:'ನನ್ನ ಬುಕಿಂಗ್‌ಗಳು', ml:'എന്റെ ബുക്കിങ്ങുകൾ', or:'ମୋ ବୁକିଂ', gu:'મારી બૂકિંગ'},
  'Abhi tak koi booking nahi': {en:'No bookings yet', bn:'এখনও কোনো বুকিং নেই', te:'ఇంకా బుకింగ్ లేదు', mr:'अजून कोणतीही बुकिंग नाही', ta:'இன்னும் முன்பதிவு இல்லை', kn:'ಇನ್ನೂ ಬುಕಿಂಗ್ ಇಲ್ಲ', ml:'ഇനിയും ബുക്കിങ്ങ് ഇല്ല', or:'ଏ ପର୍ଯ୍ୟନ୍ତ କୌଣସି ବୁକିଂ ନାହିଁ', gu:'હજી કોઈ બૂकिंग નથી'},

  // SEARCH
  'Kya dhundh rahe ho?': {en:'What are you looking for?', bn:'কী খুঁজছেন?', te:'ఏమి వెతుకుతున్నారు?', mr:'काय शोधत आहात?', ta:'என்ன தேடுகிறீர்கள்?', kn:'ಏನು ಹುಡುಕುತ್ತಿದ್ದೀರಿ?', ml:'എന്ത് തിരയുന്നു?', or:'ଆପଣ କଣ ଖୋଜୁଛନ୍ତି?', gu:'શું શોધી રહ્યા છો?'},

  // COUNTDOWN
  'Din':    {en:'Days',    bn:'দিন',  te:'రోజులు',  mr:'दिवस', ta:'நாட்கள்',  kn:'ದಿನಗಳು', ml:'ദിവസങ്ങൾ', or:'ଦିନ',    gu:'દિવસ'},
  'Ghante': {en:'Hours',   bn:'ঘণ্টা', te:'గంటలు',   mr:'तास',   ta:'மணிகள்',  kn:'ಗಂಟೆಗಳು',ml:'മണിക്കൂർ', or:'ଘଣ୍ଟା', gu:'કલાક'},
  'Minute': {en:'Minutes', bn:'মিনিট',te:'నిమిషాలు',mr:'मिनिटे',ta:'நிமிடங்கள்',kn:'ನಿಮಿಷಗಳು',ml:'മിനിറ്റ്',or:'ମିନଟ',   gu:'મિનિટ'},
  'Second': {en:'Seconds', bn:'সেকেন্ড',te:'సెకండ్లు',mr:'सेकंद', ta:'வினாடிகள்',kn:'ಸೆಕೆಂಡ್',ml:'സെക്കൻഡ്',or:'ସେକେଣ୍ଡ',gu:'સેકન્ડ'},

  // MISC
  'Real reviews dekhein': {en:'Real Customer Reviews', bn:'বাস্তব পর্যালোচনা', te:'నిజమైన సమీక్షలు', mr:'खरे अभिप्राय', ta:'உண்மையான விமர்சனங்கள்', kn:'ನಿಜವಾದ ವಿಮರ್ಶೆಗಳು', ml:'യഥാർഥ അഭിപ്രായങ്ങൾ', or:'ବାସ୍ତବ ସମୀକ୍ଷା', gu:'વાસ્તવ સમીક્ષાઓ'},
  'Jin logon ne humpar bhrosa kiya': {en:'Those who trusted us', bn:'যারা আমাদের বিশ্বাস করেছেন', te:'మాపై నమ్మకం ఉంచినవారు', mr:'ज्यांनी आमच्यावर विश्वास ठेवला', ta:'எங்களை நம்பியவர்கள்', kn:'ನಮ್ಮನ್ನು ನಂಬಿದವರು', ml:'ഞങ്ങളെ വിശ്വസിച്ചവർ', or:'ଆମ ଉପରେ ଭରୋସା ରଖିଥିଲେ', gu:'જેઓ અમારા પર ભરોસો રાખ્યો'},
  'Hamare happy customers': {en:'Our Happy Customers', bn:'আমাদের সুখী গ্রাহকরা', te:'మా సంతోషిత కస్టమర్లు', mr:'आमचे आनंदी ग्राहक', ta:'எங்கள் மகிழ்ச்சியான வாடிக்கையாளர்கள்', kn:'ನಮ್ಮ ಸಂತೋಷಿ ಗ್ರಾಹಕರು', ml:'ഞങ്ങളുടെ സന്തുഷ്ടരായ ഉപഭോക്താക്കൾ', or:'ଆମ ଖୁସ ଗ୍ରାହକ', gu:'અમારા ખુશ ગ્રાહકો'},
  'Hamari story Instagram par': {en:'Our Story on Instagram', bn:'ইনস্টাগ্রামে আমাদের গল্প', te:'ఇన్‌స్టాగ్రామ్‌లో మా కథ', mr:'इंस्टाग्रामवर आमची कथा', ta:'இன்ஸ்டாகிராமில் எங்கள் கதை', kn:'ಇನ್‌ಸ್ಟಾಗ್ರಾಂನಲ್ಲಿ ನಮ್ಮ ಕಥೆ', ml:'ഇൻസ്റ്റാഗ്രാമിൽ ഞങ്ങളുടെ കഥ', or:'ଇନ୍‌ଷ୍ଟାଗ୍ରାମରେ ଆମ କଥା', gu:'Instagram પર અમારી વાર્તા'},
  'Available': {en:'Available', bn:'উপলব্ধ', te:'అందుబాటులో', mr:'उपलब्ध', ta:'கிடைக்கிறது', kn:'ಲಭ್ಯ', ml:'ലഭ്യം', or:'ଉପଲବ୍ଧ', gu:'ઉપલબ્ધ'},
  'Pending': {en:'Pending', bn:'বিচারাধীন', te:'పెండింగ్', mr:'प्रलंबित', ta:'நிலுவையில்', kn:'ಬಾಕಿ', ml:'തീർപ്പുകൽപ്പിക്കാത്ത', or:'ବିଚାରାଧୀନ', gu:'પ્રલંબિત'},
  'Loading...': {en:'Loading...', bn:'লোড হচ্ছে...', te:'లోడ్ అవుతోంది...', mr:'लोड होत आहे...', ta:'ஏற்றுகிறது...', kn:'ಲೋಡ್ ಆಗುತ್ತಿದೆ...', ml:'ലോഡ് ചെയ്യുന്നു...', or:'ଲୋଡ ହେଉଛି...', gu:'લોડ થઈ રહ્યું છે...'},
};

/* ─────────────────────────────────────────────
   APPLY TRANSLATIONS via text-node walker
───────────────────────────────────────────── */
const _origMap = new Map(); // node → original text

function walkText(root, cb) {
  const skip = new Set(['SCRIPT','STYLE','NOSCRIPT','IFRAME','TEXTAREA']);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: n => {
      const p = n.parentElement;
      if (!p || skip.has(p.tagName)) return NodeFilter.FILTER_REJECT;
      // Don't translate language dropdown itself
      if (p.closest('.lang-dropdown, .lang-btn')) return NodeFilter.FILTER_REJECT;
      return n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(cb);
}

function applyLang(code) {
  if (code === 'hi') {
    // Restore all originals
    _origMap.forEach((orig, node) => { node.textContent = orig; });
    _origMap.clear();
    return;
  }

  walkText(document.body, node => {
    const orig = _origMap.get(node) || node.textContent;
    let text = orig;
    let changed = false;

    Object.entries(PH).forEach(([hi, trans]) => {
      if (text.includes(hi) && trans[code]) {
        text = text.replace(new RegExp(hi.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'g'), trans[code]);
        changed = true;
      }
    });

    if (changed) {
      _origMap.set(node, orig);
      node.textContent = text;
    }
  });
}

let currentLang = localStorage.getItem('kwikar_lang') || 'hi';

/* ── CSS ── */
const style = document.createElement('style');
style.textContent = `
.lang-btn{display:flex;align-items:center;gap:5px;background:#fff;border:1.5px solid rgba(13,27,62,.15);border-radius:20px;padding:4px 10px;cursor:pointer;font-family:inherit;font-size:.72rem;font-weight:700;color:#0d1b3e;transition:all .2s;flex-shrink:0}
.lang-btn:hover{border-color:#1d4ed8;color:#1d4ed8}
.lang-btn svg{width:14px;height:14px;flex-shrink:0}
.lang-code{font-size:.65rem;font-weight:800;text-transform:uppercase}
.lang-dropdown{position:absolute;top:calc(100% + 8px);right:0;z-index:9999;background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(13,27,62,.2);border:1px solid #e2e8f0;min-width:180px;overflow:hidden;display:none;animation:langFade .2s ease;max-height:60vh;overflow-y:auto}
.lang-dropdown.show{display:block}
@keyframes langFade{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.lang-option{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;transition:background .15s}
.lang-option:hover{background:#f4f6fb}
.lang-option.active{background:#dce8ff}
.lang-opt-label{font-size:.85rem;font-weight:700;color:#0d1b3e}
.lang-opt-sub{font-size:.65rem;color:#64748b}
.lang-wrap{position:relative;display:inline-flex}
`;
document.head.appendChild(style);

/* ── Build switcher ── */
function buildSwitcher(sfx) {
  const cur = LANGS.find(l => l.code === currentLang) || LANGS[0];
  const w = document.createElement('div');
  w.className = 'lang-wrap';
  w.innerHTML = `
    <button class="lang-btn" onclick="toggleLD('${sfx}',event)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
      <span class="lang-code" id="lc${sfx}">${cur.code.toUpperCase()}</span>
    </button>
    <div class="lang-dropdown" id="ld${sfx}">
      ${LANGS.map(l=>`
        <div class="lang-option${l.code===currentLang?' active':''}" onclick="selectLang('${l.code}')">
          <div class="lang-opt-label">${l.label}</div>
          <div class="lang-opt-sub">${l.sub}</div>
        </div>`).join('')}
    </div>`;
  return w;
}

window.toggleLD = function(sfx, e) {
  e.stopPropagation();
  document.querySelectorAll('.lang-dropdown').forEach(d => {
    if (d.id !== 'ld'+sfx) d.classList.remove('show');
  });
  document.getElementById('ld'+sfx).classList.toggle('show');
};
document.addEventListener('click', () => {
  document.querySelectorAll('.lang-dropdown').forEach(d => d.classList.remove('show'));
});

window.selectLang = function(code) {
  currentLang = code;
  localStorage.setItem('kwikar_lang', code);
  document.querySelectorAll('[id^="lc"]').forEach(el => el.textContent = code.toUpperCase());
  document.querySelectorAll('.lang-option').forEach((el, i) => {
    el.classList.toggle('active', LANGS[i % LANGS.length].code === code);
  });
  document.querySelectorAll('.lang-dropdown').forEach(d => d.classList.remove('show'));
  applyLang(code);
  // Re-apply after 500ms for dynamically rendered text
  setTimeout(() => applyLang(code), 500);
};

/* ── Mount ── */
let _mounted = false;
function mount() {
  if (_mounted) return;
  const navRight = document.querySelector('.nav-right');
  const mtb = document.querySelector('.mtb-actions');
  if (!navRight && !mtb) return;
  _mounted = true;
  if (navRight && !navRight.querySelector('.lang-wrap')) navRight.appendChild(buildSwitcher('D'));
  if (mtb && !mtb.querySelector('.lang-wrap')) mtb.appendChild(buildSwitcher('M'));
  if (currentLang !== 'hi') applyLang(currentLang);
}

mount();
setTimeout(mount, 600);
if (currentLang !== 'hi') setTimeout(() => applyLang(currentLang), 1000);

// Auto-translate dynamic text (profile greeting, etc.)
if (currentLang !== 'hi') {
  setTimeout(() => applyLang(currentLang), 800);
  setTimeout(() => applyLang(currentLang), 2000);
  new MutationObserver(() => {
    if (currentLang !== 'hi') applyLang(currentLang);
  }).observe(document.body, { childList:true, subtree:true, characterData:true });
}
