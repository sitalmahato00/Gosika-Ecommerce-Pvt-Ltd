// Raw Nepal local-level data - all 753 entries parsed into structured form
// Source: resources/js/location.js (Government of Nepal official data)

const RAW_LOCAL_LEVEL = [
  {p:"1",d:"TAPLEJUNG",n:"Sidingba Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"TAPLEJUNG",n:"Meringden Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"TAPLEJUNG",n:"Maiwakhola Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"TAPLEJUNG",n:"Phaktanglung Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"TAPLEJUNG",n:"Sirijangha Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"TAPLEJUNG",n:"Mikwakhola Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"TAPLEJUNG",n:"Aathrai Tribeni Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"TAPLEJUNG",n:"Pathivara Yangwarak Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"TAPLEJUNG",n:"Phungling Municipality",t:"Municipality"},
  {p:"1",d:"SANKHUWASABHA",n:"Makalu Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"SANKHUWASABHA",n:"Chichila Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"SANKHUWASABHA",n:"Silichong Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"SANKHUWASABHA",n:"Bhotkhola Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"SANKHUWASABHA",n:"Sabhapokhari Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"SANKHUWASABHA",n:"Dharmadevi Municipality",t:"Municipality"},
  {p:"1",d:"SANKHUWASABHA",n:"Madi Municipality",t:"Municipality"},
  {p:"1",d:"SANKHUWASABHA",n:"Panchakhapan Municipality",t:"Municipality"},
  {p:"1",d:"SANKHUWASABHA",n:"Chainpur Municipality",t:"Municipality"},
  {p:"1",d:"SANKHUWASABHA",n:"Khandbari Municipality",t:"Municipality"},
  {p:"1",d:"SOLUKHUMBU",n:"Sotang Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"SOLUKHUMBU",n:"Mahakulung Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"SOLUKHUMBU",n:"Likhupike Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"SOLUKHUMBU",n:"Nechasalyan Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"SOLUKHUMBU",n:"Thulung Dudhkoshi Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"SOLUKHUMBU",n:"Maapya Dudhkoshi Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"SOLUKHUMBU",n:"Khumbupasanglahmu Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"SOLUKHUMBU",n:"Solududhakunda Municipality",t:"Municipality"},
  {p:"1",d:"OKHALDHUNGA",n:"Likhu Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"OKHALDHUNGA",n:"Molung Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"OKHALDHUNGA",n:"Sunkoshi Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"OKHALDHUNGA",n:"Champadevi Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"OKHALDHUNGA",n:"Chisankhugadhi Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"OKHALDHUNGA",n:"Khijidemba Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"OKHALDHUNGA",n:"Manebhanjyang Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"OKHALDHUNGA",n:"Siddhicharan Municipality",t:"Municipality"},
  {p:"1",d:"KHOTANG",n:"Sakela Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"KHOTANG",n:"Khotehang Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"KHOTANG",n:"Barahapokhari Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"KHOTANG",n:"Ainselukhark Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"KHOTANG",n:"Rawa Besi Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"KHOTANG",n:"Kepilasagadhi Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"KHOTANG",n:"Jantedhunga Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"KHOTANG",n:"Diprung Chuichumma Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"KHOTANG",n:"Halesi Tuwachung Municipality",t:"Municipality"},
  {p:"1",d:"KHOTANG",n:"Diktel Rupakot Majhuwagadhi Municipality",t:"Municipality"},
  {p:"1",d:"BHOJPUR",n:"Arun Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"BHOJPUR",n:"Aamchowk Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"BHOJPUR",n:"Hatuwagadhi Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"BHOJPUR",n:"Pauwadungma Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"BHOJPUR",n:"Temkemaiyung Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"BHOJPUR",n:"Salpasilichho Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"BHOJPUR",n:"Ramprasad Rai Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"BHOJPUR",n:"Shadananda Municipality",t:"Municipality"},
  {p:"1",d:"BHOJPUR",n:"Bhojpur Municipality",t:"Municipality"},
  {p:"1",d:"DHANKUTA",n:"Chaubise Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"DHANKUTA",n:"Shahidbhumi Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"DHANKUTA",n:"Sangurigadhi Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"DHANKUTA",n:"Chhathar Jorpati Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"DHANKUTA",n:"Pakhribas Municipality",t:"Municipality"},
  {p:"1",d:"DHANKUTA",n:"Mahalaxmi Municipality",t:"Municipality"},
  {p:"1",d:"DHANKUTA",n:"Dhankuta Municipality",t:"Municipality"},
  {p:"1",d:"TERHATHUM",n:"Chhathar Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"TERHATHUM",n:"Phedap Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"TERHATHUM",n:"Aathrai Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"TERHATHUM",n:"Menchayam Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"TERHATHUM",n:"Laligurans Municipality",t:"Municipality"},
  {p:"1",d:"TERHATHUM",n:"Myanglung Municipality",t:"Municipality"},
  {p:"1",d:"PANCHTHAR",n:"Yangwarak Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"PANCHTHAR",n:"Hilihang Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"PANCHTHAR",n:"Falelung Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"PANCHTHAR",n:"Tumbewa Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"PANCHTHAR",n:"Kummayak Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"PANCHTHAR",n:"Miklajung Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"PANCHTHAR",n:"Falgunanda Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"PANCHTHAR",n:"Phidim Municipality",t:"Municipality"},
  {p:"1",d:"ILAM",n:"Rong Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"ILAM",n:"Mangsebung Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"ILAM",n:"Chulachuli Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"ILAM",n:"Sandakpur Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"ILAM",n:"Fakphokthum Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"ILAM",n:"Maijogmai Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"ILAM",n:"Illam Municipality",t:"Municipality"},
  {p:"1",d:"ILAM",n:"Mai Municipality",t:"Municipality"},
  {p:"1",d:"ILAM",n:"Deumai Municipality",t:"Municipality"},
  {p:"1",d:"ILAM",n:"Suryodaya Municipality",t:"Municipality"},
  {p:"1",d:"JHAPA",n:"Kamal Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"JHAPA",n:"Jhapa Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"JHAPA",n:"Kachankawal Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"JHAPA",n:"Gauriganj Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"JHAPA",n:"Barhadashi Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"JHAPA",n:"Haldibari Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"JHAPA",n:"Buddhashanti Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"JHAPA",n:"Shivasataxi Municipality",t:"Municipality"},
  {p:"1",d:"JHAPA",n:"Bhadrapur Municipality",t:"Municipality"},
  {p:"1",d:"JHAPA",n:"Kankai Municipality",t:"Municipality"},
  {p:"1",d:"JHAPA",n:"Birtamod Municipality",t:"Municipality"},
  {p:"1",d:"JHAPA",n:"Mechinagar Municipality",t:"Municipality"},
  {p:"1",d:"JHAPA",n:"Damak Municipality",t:"Municipality"},
  {p:"1",d:"JHAPA",n:"Arjundhara Municipality",t:"Municipality"},
  {p:"1",d:"JHAPA",n:"Gauradhaha Municipality",t:"Municipality"},
  {p:"1",d:"MORANG",n:"Jahada Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"MORANG",n:"Katahari Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"MORANG",n:"Gramthan Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"MORANG",n:"Dhanpalthan Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"MORANG",n:"Kerabari Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"MORANG",n:"Budhiganga Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"MORANG",n:"Kanepokhari Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"MORANG",n:"Miklajung Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"MORANG",n:"Letang Municipality",t:"Municipality"},
  {p:"1",d:"MORANG",n:"Sunwarshi Municipality",t:"Municipality"},
  {p:"1",d:"MORANG",n:"Rangeli Municipality",t:"Municipality"},
  {p:"1",d:"MORANG",n:"Patahrishanishchare Municipality",t:"Municipality"},
  {p:"1",d:"MORANG",n:"Biratnagar Metropolitan City",t:"Metropolitan City"},
  {p:"1",d:"MORANG",n:"Uralabari Municipality",t:"Municipality"},
  {p:"1",d:"MORANG",n:"Belbari Municipality",t:"Municipality"},
  {p:"1",d:"MORANG",n:"Sundarharaicha Municipality",t:"Municipality"},
  {p:"1",d:"MORANG",n:"Ratuwamai Municipality",t:"Municipality"},
  {p:"1",d:"SUNSARI",n:"Gadhi Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"SUNSARI",n:"Koshi Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"SUNSARI",n:"Barju Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"SUNSARI",n:"Harinagar Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"SUNSARI",n:"Dewanganj Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"SUNSARI",n:"Bhokraha Narsing Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"SUNSARI",n:"Ramdhuni Municipality",t:"Municipality"},
  {p:"1",d:"SUNSARI",n:"Barahchhetra Municipality",t:"Municipality"},
  {p:"1",d:"SUNSARI",n:"Duhabi Municipality",t:"Municipality"},
  {p:"1",d:"SUNSARI",n:"Inaruwa Municipality",t:"Municipality"},
  {p:"1",d:"SUNSARI",n:"Dharan Sub-Metropolitan City",t:"Sub-Metropolitan City"},
  {p:"1",d:"SUNSARI",n:"Itahari Sub-Metropolitan City",t:"Sub-Metropolitan City"},
  {p:"1",d:"UDAYAPUR",n:"Tapli Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"UDAYAPUR",n:"Rautamai Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"UDAYAPUR",n:"Udayapurgadhi Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"UDAYAPUR",n:"Limchungbung Rural Municipality",t:"Rural Municipality"},
  {p:"1",d:"UDAYAPUR",n:"Chaudandigadhi Municipality",t:"Municipality"},
  {p:"1",d:"UDAYAPUR",n:"Triyuga Municipality",t:"Municipality"},
  {p:"1",d:"UDAYAPUR",n:"Katari Municipality",t:"Municipality"},
  {p:"1",d:"UDAYAPUR",n:"Belaka Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SAPTARI",n:"Rajgadh Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SAPTARI",n:"Rupani Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SAPTARI",n:"Tirahut Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SAPTARI",n:"Mahadeva Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SAPTARI",n:"Bishnupur Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SAPTARI",n:"Chhinnamasta Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SAPTARI",n:"Balan Bihul Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SAPTARI",n:"Tilathi Koiladi Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SAPTARI",n:"Agnisair Krishna Savaran Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SAPTARI",n:"Hanumannagar Kankalini Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SAPTARI",n:"Kanchanrup Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SAPTARI",n:"Rajbiraj Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SAPTARI",n:"Khadak Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SAPTARI",n:"Dakneshwori Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SAPTARI",n:"Saptakoshi Rural Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SAPTARI",n:"Surunga Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SAPTARI",n:"Shambhunath Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SAPTARI",n:"Bode Barsain Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SIRAHA",n:"Aurahi Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SIRAHA",n:"Naraha Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SIRAHA",n:"Arnama Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SIRAHA",n:"Bhagawanpur Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SIRAHA",n:"Nawarajpur Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SIRAHA",n:"Bishnupur Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SIRAHA",n:"Bariyarpatti Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SIRAHA",n:"Laxmipur Patari Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SIRAHA",n:"Sakhuwanankarkatti Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SIRAHA",n:"Mirchaiya Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SIRAHA",n:"Lahan Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SIRAHA",n:"Siraha Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SIRAHA",n:"Dhangadhimai Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SIRAHA",n:"Kalyanpur Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SIRAHA",n:"Karjanha Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SIRAHA",n:"Golbazar Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SIRAHA",n:"Sukhipur Municipality",t:"Municipality"},
  {p:"Madhesh",d:"DHANUSA",n:"Aaurahi Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"DHANUSA",n:"Dhanauji Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"DHANUSA",n:"Bateshwor Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"DHANUSA",n:"Janaknandani Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"DHANUSA",n:"Lakshminiya Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"DHANUSA",n:"Mukhiyapatti Musarmiya Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"DHANUSA",n:"Mithila Bihari Municipality",t:"Municipality"},
  {p:"Madhesh",d:"DHANUSA",n:"Kamala Municipality",t:"Municipality"},
  {p:"Madhesh",d:"DHANUSA",n:"Nagarain Municipality",t:"Municipality"},
  {p:"Madhesh",d:"DHANUSA",n:"Ganeshman Charnath Municipality",t:"Municipality"},
  {p:"Madhesh",d:"DHANUSA",n:"Mithila Municipality",t:"Municipality"},
  {p:"Madhesh",d:"DHANUSA",n:"Dhanusadham Municipality",t:"Municipality"},
  {p:"Madhesh",d:"DHANUSA",n:"Bideha Municipality",t:"Municipality"},
  {p:"Madhesh",d:"DHANUSA",n:"Sabaila Municipality",t:"Municipality"},
  {p:"Madhesh",d:"DHANUSA",n:"Hansapur Municipality",t:"Municipality"},
  {p:"Madhesh",d:"DHANUSA",n:"Janakpurdham Sub-Metropolitan City",t:"Sub-Metropolitan City"},
  {p:"Madhesh",d:"DHANUSA",n:"Sahidnagar Municipality",t:"Municipality"},
  {p:"Madhesh",d:"DHANUSA",n:"Chhireshwornath Municipality",t:"Municipality"},
  {p:"Madhesh",d:"MAHOTTARI",n:"Pipra Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"MAHOTTARI",n:"Sonama Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"MAHOTTARI",n:"Samsi Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"MAHOTTARI",n:"Ekdanra Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"MAHOTTARI",n:"Mahottari Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"MAHOTTARI",n:"Gaushala Municipality",t:"Municipality"},
  {p:"Madhesh",d:"MAHOTTARI",n:"Ramgopalpur Municipality",t:"Municipality"},
  {p:"Madhesh",d:"MAHOTTARI",n:"Aurahi Municipality",t:"Municipality"},
  {p:"Madhesh",d:"MAHOTTARI",n:"Bardibas Municipality",t:"Municipality"},
  {p:"Madhesh",d:"MAHOTTARI",n:"Bhangaha Municipality",t:"Municipality"},
  {p:"Madhesh",d:"MAHOTTARI",n:"Jaleswor Municipality",t:"Municipality"},
  {p:"Madhesh",d:"MAHOTTARI",n:"Balwa Municipality",t:"Municipality"},
  {p:"Madhesh",d:"MAHOTTARI",n:"Manra Siswa Municipality",t:"Municipality"},
  {p:"Madhesh",d:"MAHOTTARI",n:"Matihani Municipality",t:"Municipality"},
  {p:"Madhesh",d:"MAHOTTARI",n:"Loharpatti Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SARLAHI",n:"Dhankaul Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SARLAHI",n:"Parsa Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SARLAHI",n:"Bishnu Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SARLAHI",n:"Ramnagar Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SARLAHI",n:"Kaudena Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SARLAHI",n:"Basbariya Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SARLAHI",n:"Chandranagar Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SARLAHI",n:"Chakraghatta Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SARLAHI",n:"Bramhapuri Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"SARLAHI",n:"Barahathawa Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SARLAHI",n:"Haripur Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SARLAHI",n:"Ishworpur Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SARLAHI",n:"Lalbandi Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SARLAHI",n:"Malangawa Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SARLAHI",n:"Kabilasi Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SARLAHI",n:"Bagmati Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SARLAHI",n:"Hariwan Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SARLAHI",n:"Balara Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SARLAHI",n:"Haripurwa Municipality",t:"Municipality"},
  {p:"Madhesh",d:"SARLAHI",n:"Godaita Municipality",t:"Municipality"},
  {p:"Madhesh",d:"RAUTAHAT",n:"Yemunamai Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"RAUTAHAT",n:"Durga Bhagwati Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"RAUTAHAT",n:"Katahariya Municipality",t:"Municipality"},
  {p:"Madhesh",d:"RAUTAHAT",n:"Maulapur Municipality",t:"Municipality"},
  {p:"Madhesh",d:"RAUTAHAT",n:"Madhav Narayan Municipality",t:"Municipality"},
  {p:"Madhesh",d:"RAUTAHAT",n:"Gaur Municipality",t:"Municipality"},
  {p:"Madhesh",d:"RAUTAHAT",n:"Gujara Municipality",t:"Municipality"},
  {p:"Madhesh",d:"RAUTAHAT",n:"Garuda Municipality",t:"Municipality"},
  {p:"Madhesh",d:"RAUTAHAT",n:"Ishanath Municipality",t:"Municipality"},
  {p:"Madhesh",d:"RAUTAHAT",n:"Chandrapur Municipality",t:"Municipality"},
  {p:"Madhesh",d:"RAUTAHAT",n:"Dewahhi Gonahi Municipality",t:"Municipality"},
  {p:"Madhesh",d:"RAUTAHAT",n:"Brindaban Municipality",t:"Municipality"},
  {p:"Madhesh",d:"RAUTAHAT",n:"Rajpur Municipality",t:"Municipality"},
  {p:"Madhesh",d:"RAUTAHAT",n:"Rajdevi Municipality",t:"Municipality"},
  {p:"Madhesh",d:"RAUTAHAT",n:"Gadhimai Municipality",t:"Municipality"},
  {p:"Madhesh",d:"RAUTAHAT",n:"Phatuwa Bijayapur Municipality",t:"Municipality"},
  {p:"Madhesh",d:"RAUTAHAT",n:"Baudhimai Municipality",t:"Municipality"},
  {p:"Madhesh",d:"RAUTAHAT",n:"Paroha Municipality",t:"Municipality"},
  {p:"Madhesh",d:"BARA",n:"Pheta Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"BARA",n:"Devtal Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"BARA",n:"Prasauni Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"BARA",n:"Suwarna Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"BARA",n:"Baragadhi Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"BARA",n:"Karaiyamai Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"BARA",n:"Parwanipur Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"BARA",n:"Bishrampur Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"BARA",n:"Adarshkotwal Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"BARA",n:"Jitpur Simara Sub-Metropolitan City",t:"Sub-Metropolitan City"},
  {p:"Madhesh",d:"BARA",n:"Kalaiya Sub-Metropolitan City",t:"Sub-Metropolitan City"},
  {p:"Madhesh",d:"BARA",n:"Pacharauta Municipality",t:"Municipality"},
  {p:"Madhesh",d:"BARA",n:"Nijgadh Municipality",t:"Municipality"},
  {p:"Madhesh",d:"BARA",n:"Simraungadh Municipality",t:"Municipality"},
  {p:"Madhesh",d:"BARA",n:"Mahagadhimai Municipality",t:"Municipality"},
  {p:"Madhesh",d:"BARA",n:"Kolhabi Municipality",t:"Municipality"},
  {p:"Madhesh",d:"PARSA",n:"Thori Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"PARSA",n:"Dhobini Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"PARSA",n:"Chhipaharmai Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"PARSA",n:"Jirabhawani Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"PARSA",n:"Jagarnathpur Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"PARSA",n:"Kalikamai Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"PARSA",n:"Bindabasini Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"PARSA",n:"Pakahamainpur Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"PARSA",n:"SakhuwaPrasauni Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"PARSA",n:"Paterwasugauli Rural Municipality",t:"Rural Municipality"},
  {p:"Madhesh",d:"PARSA",n:"Birgunj Metropolitan City",t:"Metropolitan City"},
  {p:"Madhesh",d:"PARSA",n:"Bahudaramai Municipality",t:"Municipality"},
  {p:"Madhesh",d:"PARSA",n:"Pokhariya Municipality",t:"Municipality"},
  {p:"Madhesh",d:"PARSA",n:"Parsagadhi Municipality",t:"Municipality"},
  {p:"Bagmati",d:"DOLAKHA",n:"Bigu Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"DOLAKHA",n:"Sailung Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"DOLAKHA",n:"Melung Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"DOLAKHA",n:"Baiteshwor Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"DOLAKHA",n:"Tamakoshi Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"DOLAKHA",n:"Gaurishankar Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"DOLAKHA",n:"Kalinchok Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"DOLAKHA",n:"Jiri Municipality",t:"Municipality"},
  {p:"Bagmati",d:"DOLAKHA",n:"Bhimeshwor Municipality",t:"Municipality"},
  {p:"Bagmati",d:"SINDHUPALCHOK",n:"Jugal Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"SINDHUPALCHOK",n:"Balefi Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"SINDHUPALCHOK",n:"Sunkoshi Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"SINDHUPALCHOK",n:"Helambu Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"SINDHUPALCHOK",n:"Bhotekoshi Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"SINDHUPALCHOK",n:"Lisangkhu Pakhar Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"SINDHUPALCHOK",n:"Indrawati Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"SINDHUPALCHOK",n:"Tripurasundari Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"SINDHUPALCHOK",n:"Panchpokhari Thangpal Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"SINDHUPALCHOK",n:"Chautara SangachokGadhi Municipality",t:"Municipality"},
  {p:"Bagmati",d:"SINDHUPALCHOK",n:"Barhabise Municipality",t:"Municipality"},
  {p:"Bagmati",d:"SINDHUPALCHOK",n:"Melamchi Municipality",t:"Municipality"},
  {p:"Bagmati",d:"RASUWA",n:"Kalika Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"RASUWA",n:"Naukunda Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"RASUWA",n:"Uttargaya Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"RASUWA",n:"Gosaikunda Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"RASUWA",n:"Amachodingmo Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"DHADING",n:"Gajuri Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"DHADING",n:"Galchi Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"DHADING",n:"Thakre Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"DHADING",n:"Siddhalek Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"DHADING",n:"Khaniyabash Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"DHADING",n:"Jwalamukhi Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"DHADING",n:"Gangajamuna Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"DHADING",n:"Rubi Valley Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"DHADING",n:"Tripura Sundari Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"DHADING",n:"Netrawati Dabjong Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"DHADING",n:"Benighat Rorang Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"DHADING",n:"Nilakantha Municipality",t:"Municipality"},
  {p:"Bagmati",d:"DHADING",n:"Dhunibesi Municipality",t:"Municipality"},
  {p:"Bagmati",d:"NUWAKOT",n:"Kakani Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"NUWAKOT",n:"Tadi Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"NUWAKOT",n:"Likhu Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"NUWAKOT",n:"Myagang Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"NUWAKOT",n:"Shivapuri Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"NUWAKOT",n:"Kispang Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"NUWAKOT",n:"Suryagadhi Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"NUWAKOT",n:"Tarkeshwar Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"NUWAKOT",n:"Panchakanya Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"NUWAKOT",n:"Dupcheshwar Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"NUWAKOT",n:"Belkotgadhi Municipality",t:"Municipality"},
  {p:"Bagmati",d:"NUWAKOT",n:"Bidur Municipality",t:"Municipality"},
  {p:"Bagmati",d:"KATHMANDU",n:"Kirtipur Municipality",t:"Municipality"},
  {p:"Bagmati",d:"KATHMANDU",n:"Shankharapur Municipality",t:"Municipality"},
  {p:"Bagmati",d:"KATHMANDU",n:"Nagarjun Municipality",t:"Municipality"},
  {p:"Bagmati",d:"KATHMANDU",n:"Kageshwori Manahora Municipality",t:"Municipality"},
  {p:"Bagmati",d:"KATHMANDU",n:"Dakshinkali Municipality",t:"Municipality"},
  {p:"Bagmati",d:"KATHMANDU",n:"Budhanilakantha Municipality",t:"Municipality"},
  {p:"Bagmati",d:"KATHMANDU",n:"Tarakeshwor Municipality",t:"Municipality"},
  {p:"Bagmati",d:"KATHMANDU",n:"Kathmandu Metropolitan City",t:"Metropolitan City"},
  {p:"Bagmati",d:"KATHMANDU",n:"Tokha Municipality",t:"Municipality"},
  {p:"Bagmati",d:"KATHMANDU",n:"Chandragiri Municipality",t:"Municipality"},
  {p:"Bagmati",d:"KATHMANDU",n:"Gokarneshwor Municipality",t:"Municipality"},
  {p:"Bagmati",d:"BHAKTAPUR",n:"Changunarayan Municipality",t:"Municipality"},
  {p:"Bagmati",d:"BHAKTAPUR",n:"Suryabinayak Municipality",t:"Municipality"},
  {p:"Bagmati",d:"BHAKTAPUR",n:"Bhaktapur Municipality",t:"Municipality"},
  {p:"Bagmati",d:"BHAKTAPUR",n:"Madhyapur Thimi Municipality",t:"Municipality"},
  {p:"Bagmati",d:"LALITPUR",n:"Bagmati Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"LALITPUR",n:"Mahankal Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"LALITPUR",n:"Konjyosom Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"LALITPUR",n:"Lalitpur Metropolitan City",t:"Metropolitan City"},
  {p:"Bagmati",d:"LALITPUR",n:"Mahalaxmi Municipality",t:"Municipality"},
  {p:"Bagmati",d:"LALITPUR",n:"Godawari Municipality",t:"Municipality"},
  {p:"Bagmati",d:"KAVREPALANCHOK",n:"Roshi Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"KAVREPALANCHOK",n:"Temal Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"KAVREPALANCHOK",n:"Bhumlu Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"KAVREPALANCHOK",n:"Mahabharat Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"KAVREPALANCHOK",n:"Bethanchowk Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"KAVREPALANCHOK",n:"Khanikhola Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"KAVREPALANCHOK",n:"Chaurideurali Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"KAVREPALANCHOK",n:"Banepa Municipality",t:"Municipality"},
  {p:"Bagmati",d:"KAVREPALANCHOK",n:"Mandandeupur Municipality",t:"Municipality"},
  {p:"Bagmati",d:"KAVREPALANCHOK",n:"Dhulikhel Municipality",t:"Municipality"},
  {p:"Bagmati",d:"KAVREPALANCHOK",n:"Panauti Municipality",t:"Municipality"},
  {p:"Bagmati",d:"KAVREPALANCHOK",n:"Namobuddha Municipality",t:"Municipality"},
  {p:"Bagmati",d:"KAVREPALANCHOK",n:"Panchkhal Municipality",t:"Municipality"},
  {p:"Bagmati",d:"RAMECHHAP",n:"Sunapati Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"RAMECHHAP",n:"Doramba Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"RAMECHHAP",n:"Umakunda Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"RAMECHHAP",n:"Khadadevi Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"RAMECHHAP",n:"Gokulganga Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"RAMECHHAP",n:"Likhu Tamakoshi Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"RAMECHHAP",n:"Manthali Municipality",t:"Municipality"},
  {p:"Bagmati",d:"RAMECHHAP",n:"Ramechhap Municipality",t:"Municipality"},
  {p:"Bagmati",d:"SINDHULI",n:"Marin Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"SINDHULI",n:"Phikkal Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"SINDHULI",n:"Tinpatan Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"SINDHULI",n:"Sunkoshi Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"SINDHULI",n:"Golanjor Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"SINDHULI",n:"Ghanglekh Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"SINDHULI",n:"Hariharpurgadhi Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"SINDHULI",n:"Dudhouli Municipality",t:"Municipality"},
  {p:"Bagmati",d:"SINDHULI",n:"Kamalamai Municipality",t:"Municipality"},
  {p:"Bagmati",d:"MAKWANPUR",n:"Bakaiya Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"MAKWANPUR",n:"Kailash Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"MAKWANPUR",n:"Manahari Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"MAKWANPUR",n:"Bhimphedi Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"MAKWANPUR",n:"Bagmati Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"MAKWANPUR",n:"Raksirang Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"MAKWANPUR",n:"Makawanpurgadhi Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"MAKWANPUR",n:"Indrasarowar Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"MAKWANPUR",n:"Hetauda Sub-Metropolitan City",t:"Sub-Metropolitan City"},
  {p:"Bagmati",d:"MAKWANPUR",n:"Thaha Municipality",t:"Municipality"},
  {p:"Bagmati",d:"CHITWAN",n:"Ichchhyakamana Rural Municipality",t:"Rural Municipality"},
  {p:"Bagmati",d:"CHITWAN",n:"Bharatpur Metropolitan City",t:"Metropolitan City"},
  {p:"Bagmati",d:"CHITWAN",n:"Kalika Municipality",t:"Municipality"},
  {p:"Bagmati",d:"CHITWAN",n:"Khairahani Municipality",t:"Municipality"},
  {p:"Bagmati",d:"CHITWAN",n:"Madi Municipality",t:"Municipality"},
  {p:"Bagmati",d:"CHITWAN",n:"Rapti Municipality",t:"Municipality"},
  {p:"Bagmati",d:"CHITWAN",n:"Ratnanagar Municipality",t:"Municipality"},
  {p:"Gandaki",d:"GORKHA",n:"Gandaki Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"GORKHA",n:"Dharche Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"GORKHA",n:"Aarughat Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"GORKHA",n:"Ajirkot Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"GORKHA",n:"Sahid Lakhan Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"GORKHA",n:"Siranchok Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"GORKHA",n:"Bhimsenthapa Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"GORKHA",n:"Chum Nubri Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"GORKHA",n:"Barpak Sulikot Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"GORKHA",n:"Palungtar Municipality",t:"Municipality"},
  {p:"Gandaki",d:"GORKHA",n:"Gorkha Municipality",t:"Municipality"},
  {p:"Gandaki",d:"MANANG",n:"Chame Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"MANANG",n:"Narshon Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"MANANG",n:"Narpa Bhumi Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"MANANG",n:"Manang Ingshyang Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"MUSTANG",n:"Thasang Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"MUSTANG",n:"Gharapjhong Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"MUSTANG",n:"Lomanthang Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"MUSTANG",n:"Lo-Ghekar Damodarkunda Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"MUSTANG",n:"Waragung Muktikhsetra Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"MYAGDI",n:"Mangala Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"MYAGDI",n:"Malika Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"MYAGDI",n:"Raghuganga Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"MYAGDI",n:"Dhaulagiri Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"MYAGDI",n:"Annapurna Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"MYAGDI",n:"Beni Municipality",t:"Municipality"},
  {p:"Gandaki",d:"KASKI",n:"Rupa Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"KASKI",n:"Madi Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"KASKI",n:"Annapurna Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"KASKI",n:"Machhapuchchhre Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"KASKI",n:"Pokhara Metropolitan City",t:"Metropolitan City"},
  {p:"Gandaki",d:"LAMJUNG",n:"Dordi Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"LAMJUNG",n:"Dudhpokhari Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"LAMJUNG",n:"Marsyangdi Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"LAMJUNG",n:"Kwholasothar Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"LAMJUNG",n:"Sundarbazar Municipality",t:"Municipality"},
  {p:"Gandaki",d:"LAMJUNG",n:"Besishahar Municipality",t:"Municipality"},
  {p:"Gandaki",d:"LAMJUNG",n:"Rainas Municipality",t:"Municipality"},
  {p:"Gandaki",d:"LAMJUNG",n:"MadhyaNepal Municipality",t:"Municipality"},
  {p:"Gandaki",d:"TANAHU",n:"Ghiring Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"TANAHU",n:"Devghat Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"TANAHU",n:"Rhishing Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"TANAHU",n:"Myagde Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"TANAHU",n:"Bandipur Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"TANAHU",n:"Anbukhaireni Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"TANAHU",n:"Byas Municipality",t:"Municipality"},
  {p:"Gandaki",d:"TANAHU",n:"Shuklagandaki Municipality",t:"Municipality"},
  {p:"Gandaki",d:"TANAHU",n:"Bhimad Municipality",t:"Municipality"},
  {p:"Gandaki",d:"TANAHU",n:"Bhanu Municipality",t:"Municipality"},
  {p:"Gandaki",d:"NAWALPARASI EAST",n:"Baudeekali Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"NAWALPARASI EAST",n:"Bulingtar Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"NAWALPARASI EAST",n:"Hupsekot Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"NAWALPARASI EAST",n:"Binayee Tribeni Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"NAWALPARASI EAST",n:"Madhyabindu Municipality",t:"Municipality"},
  {p:"Gandaki",d:"NAWALPARASI EAST",n:"Devchuli Municipality",t:"Municipality"},
  {p:"Gandaki",d:"NAWALPARASI EAST",n:"Gaidakot Municipality",t:"Municipality"},
  {p:"Gandaki",d:"NAWALPARASI EAST",n:"Kawasoti Municipality",t:"Municipality"},
  {p:"Gandaki",d:"SYANGJA",n:"Harinas Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"SYANGJA",n:"Biruwa Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"SYANGJA",n:"Aandhikhola Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"SYANGJA",n:"Phedikhola Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"SYANGJA",n:"Kaligandagi Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"SYANGJA",n:"Arjunchaupari Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"SYANGJA",n:"Putalibazar Municipality",t:"Municipality"},
  {p:"Gandaki",d:"SYANGJA",n:"Bhirkot Municipality",t:"Municipality"},
  {p:"Gandaki",d:"SYANGJA",n:"Galyang Municipality",t:"Municipality"},
  {p:"Gandaki",d:"SYANGJA",n:"Chapakot Municipality",t:"Municipality"},
  {p:"Gandaki",d:"SYANGJA",n:"Waling Municipality",t:"Municipality"},
  {p:"Gandaki",d:"PARBAT",n:"Modi Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"PARBAT",n:"Painyu Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"PARBAT",n:"Jaljala Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"PARBAT",n:"Bihadi Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"PARBAT",n:"Mahashila Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"PARBAT",n:"Kushma Municipality",t:"Municipality"},
  {p:"Gandaki",d:"PARBAT",n:"Phalebas Municipality",t:"Municipality"},
  {p:"Gandaki",d:"BAGLUNG",n:"Bareng Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"BAGLUNG",n:"Badigad Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"BAGLUNG",n:"Nisikhola Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"BAGLUNG",n:"Kanthekhola Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"BAGLUNG",n:"Tara Khola Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"BAGLUNG",n:"Taman Khola Rural Municipality",t:"Rural Municipality"},
  {p:"Gandaki",d:"BAGLUNG",n:"Jaimuni Municipality",t:"Municipality"},
  {p:"Gandaki",d:"BAGLUNG",n:"Baglung Municipality",t:"Municipality"},
  {p:"Gandaki",d:"BAGLUNG",n:"Galkot Municipality",t:"Municipality"},
  {p:"Gandaki",d:"BAGLUNG",n:"Dhorpatan Municipality",t:"Municipality"},
  {p:"Lumbini",d:"RUKUM EAST",n:"Bhume Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"RUKUM EAST",n:"Sisne Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"RUKUM EAST",n:"Putha Uttarganga Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"ROLPA",n:"Madi Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"ROLPA",n:"Thawang Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"ROLPA",n:"Sunchhahari Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"ROLPA",n:"Lungri Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"ROLPA",n:"Gangadev Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"ROLPA",n:"Tribeni Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"ROLPA",n:"Pariwartan Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"ROLPA",n:"Runtigadi Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"ROLPA",n:"Sunil Smriti Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"ROLPA",n:"Rolpa Municipality",t:"Municipality"},
  {p:"Lumbini",d:"PYUTHAN",n:"Ayirabati Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"PYUTHAN",n:"Gaumukhi Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"PYUTHAN",n:"Jhimruk Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"PYUTHAN",n:"Naubahini Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"PYUTHAN",n:"Mandavi Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"PYUTHAN",n:"Mallarani Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"PYUTHAN",n:"Sarumarani Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"PYUTHAN",n:"Pyuthan Municipality",t:"Municipality"},
  {p:"Lumbini",d:"PYUTHAN",n:"Sworgadwary Municipality",t:"Municipality"},
  {p:"Lumbini",d:"GULMI",n:"Ruru Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"GULMI",n:"Isma Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"GULMI",n:"Madane Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"GULMI",n:"Malika Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"GULMI",n:"Chatrakot Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"GULMI",n:"Dhurkot Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"GULMI",n:"Satyawati Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"GULMI",n:"Chandrakot Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"GULMI",n:"Kaligandaki Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"GULMI",n:"Gulmidarbar Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"GULMI",n:"Resunga Municipality",t:"Municipality"},
  {p:"Lumbini",d:"GULMI",n:"Musikot Municipality",t:"Municipality"},
  {p:"Lumbini",d:"ARGHAKHANCHI",n:"Panini Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"ARGHAKHANCHI",n:"Chhatradev Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"ARGHAKHANCHI",n:"Malarani Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"ARGHAKHANCHI",n:"Bhumekasthan Municipality",t:"Municipality"},
  {p:"Lumbini",d:"ARGHAKHANCHI",n:"Sitganga Municipality",t:"Municipality"},
  {p:"Lumbini",d:"ARGHAKHANCHI",n:"Sandhikharka Municipality",t:"Municipality"},
  {p:"Lumbini",d:"PALPA",n:"Rambha Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"PALPA",n:"Tinau Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"PALPA",n:"Nisdi Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"PALPA",n:"Mathagadhi Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"PALPA",n:"Ribdikot Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"PALPA",n:"Purbakhola Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"PALPA",n:"Bagnaskali Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"PALPA",n:"Rainadevi Chhahara Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"PALPA",n:"Tansen Municipality",t:"Municipality"},
  {p:"Lumbini",d:"PALPA",n:"Rampur Municipality",t:"Municipality"},
  {p:"Lumbini",d:"NAWALPARASI WEST",n:"Sarawal Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"NAWALPARASI WEST",n:"Susta Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"NAWALPARASI WEST",n:"Pratappur Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"NAWALPARASI WEST",n:"Palhi Nandan Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"NAWALPARASI WEST",n:"Bardaghat Municipality",t:"Municipality"},
  {p:"Lumbini",d:"NAWALPARASI WEST",n:"Sunwal Municipality",t:"Municipality"},
  {p:"Lumbini",d:"NAWALPARASI WEST",n:"Ramgram Municipality",t:"Municipality"},
  {p:"Lumbini",d:"RUPANDEHI",n:"Kanchan Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"RUPANDEHI",n:"Siyari Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"RUPANDEHI",n:"Rohini Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"RUPANDEHI",n:"Gaidahawa Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"RUPANDEHI",n:"Omsatiya Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"RUPANDEHI",n:"Sudhdhodhan Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"RUPANDEHI",n:"Mayadevi Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"RUPANDEHI",n:"Marchawari Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"RUPANDEHI",n:"Kotahimai Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"RUPANDEHI",n:"Sammarimai Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"RUPANDEHI",n:"Butwal Sub-Metropolitan City",t:"Sub-Metropolitan City"},
  {p:"Lumbini",d:"RUPANDEHI",n:"Lumbini Sanskritik Municipality",t:"Municipality"},
  {p:"Lumbini",d:"RUPANDEHI",n:"Devdaha Municipality",t:"Municipality"},
  {p:"Lumbini",d:"RUPANDEHI",n:"Sainamaina Municipality",t:"Municipality"},
  {p:"Lumbini",d:"RUPANDEHI",n:"Siddharthanagar Municipality",t:"Municipality"},
  {p:"Lumbini",d:"RUPANDEHI",n:"Tillotama Municipality",t:"Municipality"},
  {p:"Lumbini",d:"KAPILBASTU",n:"Yashodhara Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"KAPILBASTU",n:"Bijayanagar Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"KAPILBASTU",n:"Mayadevi Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"KAPILBASTU",n:"Suddhodhan Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"KAPILBASTU",n:"Shivaraj Municipality",t:"Municipality"},
  {p:"Lumbini",d:"KAPILBASTU",n:"Kapilbastu Municipality",t:"Municipality"},
  {p:"Lumbini",d:"KAPILBASTU",n:"Buddhabhumi Municipality",t:"Municipality"},
  {p:"Lumbini",d:"KAPILBASTU",n:"Maharajgunj Municipality",t:"Municipality"},
  {p:"Lumbini",d:"KAPILBASTU",n:"Banganga Municipality",t:"Municipality"},
  {p:"Lumbini",d:"KAPILBASTU",n:"Krishnanagar Municipality",t:"Municipality"},
  {p:"Lumbini",d:"DANG",n:"Babai Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"DANG",n:"Gadhawa Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"DANG",n:"Rapti Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"DANG",n:"Rajpur Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"DANG",n:"Dangisharan Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"DANG",n:"Shantinagar Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"DANG",n:"Banglachuli Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"DANG",n:"Tulsipur Sub-Metropolitan City",t:"Sub-Metropolitan City"},
  {p:"Lumbini",d:"DANG",n:"Ghorahi Sub-Metropolitan City",t:"Sub-Metropolitan City"},
  {p:"Lumbini",d:"DANG",n:"Lamahi Municipality",t:"Municipality"},
  {p:"Lumbini",d:"BANKE",n:"Khajura Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"BANKE",n:"Janki Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"BANKE",n:"Baijanath Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"BANKE",n:"Duduwa Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"BANKE",n:"Narainapur Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"BANKE",n:"Rapti Sonari Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"BANKE",n:"Kohalpur Municipality",t:"Municipality"},
  {p:"Lumbini",d:"BANKE",n:"Nepalgunj Sub-Metropolitan City",t:"Sub-Metropolitan City"},
  {p:"Lumbini",d:"BARDIYA",n:"Geruwa Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"BARDIYA",n:"Badhaiyatal Rural Municipality",t:"Rural Municipality"},
  {p:"Lumbini",d:"BARDIYA",n:"Thakurbaba Municipality",t:"Municipality"},
  {p:"Lumbini",d:"BARDIYA",n:"Bansagadhi Municipality",t:"Municipality"},
  {p:"Lumbini",d:"BARDIYA",n:"Barbardiya Municipality",t:"Municipality"},
  {p:"Lumbini",d:"BARDIYA",n:"Rajapur Municipality",t:"Municipality"},
  {p:"Lumbini",d:"BARDIYA",n:"Madhuwan Municipality",t:"Municipality"},
  {p:"Lumbini",d:"BARDIYA",n:"Gulariya Municipality",t:"Municipality"},
  {p:"Karnali",d:"DOLPA",n:"Kaike Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"DOLPA",n:"Jagadulla Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"DOLPA",n:"Mudkechula Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"DOLPA",n:"Dolpo Buddha Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"DOLPA",n:"Shey Phoksundo Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"DOLPA",n:"Chharka Tangsong Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"DOLPA",n:"Tripurasundari Municipality",t:"Municipality"},
  {p:"Karnali",d:"DOLPA",n:"Thuli Bheri Municipality",t:"Municipality"},
  {p:"Karnali",d:"MUGU",n:"Soru Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"MUGU",n:"Khatyad Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"MUGU",n:"Mugum Karmarong Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"MUGU",n:"Chhayanath Rara Municipality",t:"Municipality"},
  {p:"Karnali",d:"HUMLA",n:"Simkot Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"HUMLA",n:"Namkha Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"HUMLA",n:"Chankheli Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"HUMLA",n:"Tanjakot Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"HUMLA",n:"Sarkegad Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"HUMLA",n:"Adanchuli Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"HUMLA",n:"Kharpunath Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"JUMLA",n:"Hima Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"JUMLA",n:"Tila Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"JUMLA",n:"Sinja Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"JUMLA",n:"Guthichaur Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"JUMLA",n:"Tatopani Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"JUMLA",n:"Patrasi Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"JUMLA",n:"Kanakasundari Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"JUMLA",n:"Chandannath Municipality",t:"Municipality"},
  {p:"Karnali",d:"KALIKOT",n:"Mahawai Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"KALIKOT",n:"Palata Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"KALIKOT",n:"Naraharinath Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"KALIKOT",n:"Pachaljharana Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"KALIKOT",n:"Subha Kalika Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"KALIKOT",n:"Sanni Tribeni Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"KALIKOT",n:"Khandachakra Municipality",t:"Municipality"},
  {p:"Karnali",d:"KALIKOT",n:"Raskot Municipality",t:"Municipality"},
  {p:"Karnali",d:"KALIKOT",n:"Tilagufa Municipality",t:"Municipality"},
  {p:"Karnali",d:"DAILEKH",n:"Bhairabi Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"DAILEKH",n:"Mahabu Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"DAILEKH",n:"Gurans Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"DAILEKH",n:"Naumule Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"DAILEKH",n:"Bhagawatimai Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"DAILEKH",n:"Thantikandh Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"DAILEKH",n:"Dungeshwor Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"DAILEKH",n:"Aathabis Municipality",t:"Municipality"},
  {p:"Karnali",d:"DAILEKH",n:"Dullu Municipality",t:"Municipality"},
  {p:"Karnali",d:"DAILEKH",n:"Chamunda Bindrasaini Municipality",t:"Municipality"},
  {p:"Karnali",d:"DAILEKH",n:"Narayan Municipality",t:"Municipality"},
  {p:"Karnali",d:"JAJARKOT",n:"Kuse Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"JAJARKOT",n:"Shiwalaya Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"JAJARKOT",n:"Barekot Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"JAJARKOT",n:"Junichande Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"JAJARKOT",n:"Nalagad Municipality",t:"Municipality"},
  {p:"Karnali",d:"JAJARKOT",n:"Bheri Municipality",t:"Municipality"},
  {p:"Karnali",d:"JAJARKOT",n:"Chhedagad Municipality",t:"Municipality"},
  {p:"Karnali",d:"RUKUM WEST",n:"Tribeni Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"RUKUM WEST",n:"Sani Bheri Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"RUKUM WEST",n:"Banfikot Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"RUKUM WEST",n:"Aathbiskot Municipality",t:"Municipality"},
  {p:"Karnali",d:"RUKUM WEST",n:"Chaurjahari Municipality",t:"Municipality"},
  {p:"Karnali",d:"RUKUM WEST",n:"Musikot Municipality",t:"Municipality"},
  {p:"Karnali",d:"SALYAN",n:"Kumakh Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"SALYAN",n:"Darma Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"SALYAN",n:"Kapurkot Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"SALYAN",n:"Kalimati Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"SALYAN",n:"Tribeni Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"SALYAN",n:"Chhatreshwori Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"SALYAN",n:"Siddha Kumakh Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"SALYAN",n:"Sharada Municipality",t:"Municipality"},
  {p:"Karnali",d:"SALYAN",n:"Bangad Kupinde Municipality",t:"Municipality"},
  {p:"Karnali",d:"SALYAN",n:"Bagchaur Municipality",t:"Municipality"},
  {p:"Karnali",d:"SURKHET",n:"Chaukune Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"SURKHET",n:"Simta Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"SURKHET",n:"Chingad Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"SURKHET",n:"Barahtal Rural Municipality",t:"Rural Municipality"},
  {p:"Karnali",d:"SURKHET",n:"Gurbhakot Municipality",t:"Municipality"},
  {p:"Karnali",d:"SURKHET",n:"Panchpuri Municipality",t:"Municipality"},
  {p:"Karnali",d:"SURKHET",n:"Bheriganga Municipality",t:"Municipality"},
  {p:"Karnali",d:"SURKHET",n:"Lekbeshi Municipality",t:"Municipality"},
  {p:"Karnali",d:"SURKHET",n:"Birendranagar Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"BAJURA",n:"Gaumul Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"BAJURA",n:"Himali Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"BAJURA",n:"Jagannath Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"BAJURA",n:"Khaptad Chhededaha Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"BAJURA",n:"Swami Kartik Khaapar Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"BAJURA",n:"Badimalika Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"BAJURA",n:"Tribeni Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"BAJURA",n:"Budhiganga Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"BAJURA",n:"Budhinanda Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"BAJHANG",n:"Masta Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"BAJHANG",n:"Thalara Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"BAJHANG",n:"Talkot Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"BAJHANG",n:"Surma Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"BAJHANG",n:"SaiPaal Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"BAJHANG",n:"Durgathali Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"BAJHANG",n:"Bithadchir Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"BAJHANG",n:"Kedarseu Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"BAJHANG",n:"Khaptadchhanna Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"BAJHANG",n:"Chabispathivera Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"BAJHANG",n:"JayaPrithivi Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"BAJHANG",n:"Bungal Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"DARCHULA",n:"Lekam Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"DARCHULA",n:"Naugad Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"DARCHULA",n:"Byas Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"DARCHULA",n:"Dunhu Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"DARCHULA",n:"Marma Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"DARCHULA",n:"Apihimal Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"DARCHULA",n:"Malikaarjun Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"DARCHULA",n:"Mahakali Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"DARCHULA",n:"Shailyashikhar Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"BAITADI",n:"Sigas Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"BAITADI",n:"Shivanath Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"BAITADI",n:"Surnaya Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"BAITADI",n:"Dilasaini Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"BAITADI",n:"Pancheshwar Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"BAITADI",n:"Dogadakedar Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"BAITADI",n:"Melauli Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"BAITADI",n:"Dasharathchanda Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"BAITADI",n:"Purchaudi Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"BAITADI",n:"Patan Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"DADELDHURA",n:"Alital Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"DADELDHURA",n:"Ajaymeru Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"DADELDHURA",n:"Bhageshwar Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"DADELDHURA",n:"Nawadurga Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"DADELDHURA",n:"Ganayapdhura Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"DADELDHURA",n:"Amargadhi Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"DADELDHURA",n:"Parashuram Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"DOTI",n:"Sayal Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"DOTI",n:"Adharsha Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"DOTI",n:"Jorayal Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"DOTI",n:"Badikedar Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"DOTI",n:"Purbichauki Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"DOTI",n:"K I Singh Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"DOTI",n:"Bogtan Foodsil Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"DOTI",n:"Dipayal Silgadi Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"DOTI",n:"Shikhar Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"ACHHAM",n:"Dhakari Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"ACHHAM",n:"Mellekh Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"ACHHAM",n:"Chaurpati Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"ACHHAM",n:"Ramaroshan Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"ACHHAM",n:"Turmakhad Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"ACHHAM",n:"Bannigadhi Jayagadh Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"ACHHAM",n:"Sanphebagar Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"ACHHAM",n:"Mangalsen Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"ACHHAM",n:"Kamalbazar Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"ACHHAM",n:"Panchadewal Binayak Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"KAILALI",n:"Chure Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"KAILALI",n:"Janaki Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"KAILALI",n:"Kailari Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"KAILALI",n:"Joshipur Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"KAILALI",n:"Mohanyal Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"KAILALI",n:"Bardagoriya Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"KAILALI",n:"Tikapur Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"KAILALI",n:"Ghodaghodi Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"KAILALI",n:"Bhajani Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"KAILALI",n:"Dhangadhi Sub-Metropolitan City",t:"Sub-Metropolitan City"},
  {p:"Sudurpaschim",d:"KAILALI",n:"Gauriganga Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"KAILALI",n:"Godawari Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"KAILALI",n:"Lamkichuha Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"KANCHANPUR",n:"Beldandi Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"KANCHANPUR",n:"Laljhadi Rural Municipality",t:"Rural Municipality"},
  {p:"Sudurpaschim",d:"KANCHANPUR",n:"Punarbas Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"KANCHANPUR",n:"Krishnapur Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"KANCHANPUR",n:"Mahakali Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"KANCHANPUR",n:"Bedkot Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"KANCHANPUR",n:"Belauri Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"KANCHANPUR",n:"Bhimdatta Municipality",t:"Municipality"},
  {p:"Sudurpaschim",d:"KANCHANPUR",n:"Shuklaphanta Municipality",t:"Municipality"}

]

const PROVINCE_MAP = {
  '1': 'Koshi Province',
  'Madhesh': 'Madhesh Province',
  'Bagmati': 'Bagmati Province',
  'Gandaki': 'Gandaki Province',
  'Lumbini': 'Lumbini Province',
  'Karnali': 'Karnali Province',
  'Sudurpaschim': 'Sudurpashchim Province',
}

function titleCase(s) {
  return s.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')
}

const _districtSet = new Map()
const _municipalityMap = new Map()

for (const entry of RAW_LOCAL_LEVEL) {
  const prov = PROVINCE_MAP[entry.p] || entry.p
  const dist = titleCase(entry.d)
  const key = `${prov}|${dist}`

  if (!_districtSet.has(prov)) _districtSet.set(prov, new Set())
  _districtSet.get(prov).add(dist)

  if (!_municipalityMap.has(key)) _municipalityMap.set(key, [])
  _municipalityMap.get(key).push({ name: entry.n, type: entry.t })
}

export const NEPAL_PROVINCES = Object.values(PROVINCE_MAP).sort()

export const NEPAL_DISTRICTS = {}
for (const [prov, distSet] of _districtSet) {
  NEPAL_DISTRICTS[prov] = [...distSet].sort()
}

export const NEPAL_MUNICIPALITIES = {}
for (const [key, munis] of _municipalityMap) {
  const [, dist] = key.split('|')
  NEPAL_MUNICIPALITIES[dist] = munis.sort((a, b) => a.name.localeCompare(b.name))
}

export function getDistrictsForProvince(province) {
  if (!province) return []
  const norm = province.endsWith(' Province') ? province : NEPAL_PROVINCES.find(p => p.toLowerCase().startsWith(province.toLowerCase())) || `${province} Province`
  return NEPAL_DISTRICTS[norm] || []
}

export function getMunicipalitiesForDistrict(district, province) {
  if (!district) return []
  if (province) {
    return NEPAL_MUNICIPALITIES[district] || []
  }
  for (const dist of Object.keys(NEPAL_MUNICIPALITIES)) {
    if (dist.toLowerCase() === district.toLowerCase()) {
      return NEPAL_MUNICIPALITIES[dist]
    }
  }
  return []
}

const CITY_COORDS = {
  'Kathmandu': { lat: 27.7172, lng: 85.3240, district: 'Kathmandu', province: 'Bagmati Province' },
  'Lalitpur': { lat: 27.6588, lng: 85.3247, district: 'Lalitpur', province: 'Bagmati Province' },
  'Bhaktapur': { lat: 27.6710, lng: 85.4298, district: 'Bhaktapur', province: 'Bagmati Province' },
  'Pokhara': { lat: 28.2096, lng: 83.9856, district: 'Kaski', province: 'Gandaki Province' },
  'Biratnagar': { lat: 26.4525, lng: 87.2718, district: 'Morang', province: 'Koshi Province' },
  'Dharan': { lat: 26.8124, lng: 87.2834, district: 'Sunsari', province: 'Koshi Province' },
  'Bharatpur': { lat: 27.6833, lng: 84.4333, district: 'Chitwan', province: 'Bagmati Province' },
  'Butwal': { lat: 27.7006, lng: 83.4484, district: 'Rupandehi', province: 'Lumbini Province' },
  'Nepalgunj': { lat: 28.0500, lng: 81.6167, district: 'Banke', province: 'Lumbini Province' },
  'Dhangadhi': { lat: 28.6833, lng: 80.6000, district: 'Kailali', province: 'Sudurpashchim Province' },
  'Birgunj': { lat: 27.0133, lng: 84.8778, district: 'Parsa', province: 'Madhesh Province' },
  'Hetauda': { lat: 27.4286, lng: 85.0322, district: 'Makwanpur', province: 'Bagmati Province' },
  'Janakpur': { lat: 26.7288, lng: 85.9244, district: 'Dhanusa', province: 'Madhesh Province' },
  'Itahari': { lat: 26.6626, lng: 87.2820, district: 'Sunsari', province: 'Koshi Province' },
  'Birtamod': { lat: 26.6333, lng: 88.2667, district: 'Jhapa', province: 'Koshi Province' },
  'Damak': { lat: 26.6117, lng: 87.9397, district: 'Jhapa', province: 'Koshi Province' },
  'Gaur': { lat: 26.7644, lng: 85.2817, district: 'Rautahat', province: 'Madhesh Province' },
  'Kalaiya': { lat: 27.0333, lng: 85.0000, district: 'Bara', province: 'Madhesh Province' },
  'Jitpur': { lat: 27.0300, lng: 84.9700, district: 'Bara', province: 'Madhesh Province' },
  'Surkhet': { lat: 28.5167, lng: 81.6000, district: 'Surkhet', province: 'Karnali Province' },
  'Dadeldhura': { lat: 29.3000, lng: 80.5833, district: 'Dadeldhura', province: 'Sudurpashchim Province' },
  'Mahendranagar': { lat: 28.9667, lng: 80.1833, district: 'Kanchanpur', province: 'Sudurpashchim Province' },
}

const DISTRICT_ALIAS_MAP = {
  'tanahu': 'Tanahun',
  'nawalparasi east': 'Nawalparasi East',
  'nawalpur': 'Nawalparasi East',
  'nawalparasi west': 'Nawalparasi West',
  'parasi': 'Nawalparasi West',
  'rukum east': 'Rukum East',
  'eastern rukum': 'Rukum East',
  'rukum west': 'Rukum West',
  'western rukum': 'Rukum West',
  'kapilvastu': 'Kapilbastu',
  'kapilbastu': 'Kapilbastu',
  'dhanusha': 'Dhanusa',
  'dhanusa': 'Dhanusa',
  'makawanpur': 'Makwanpur',
  'sindhupalchowk': 'Sindhupalchok',
  'kavre': 'Kavrepalanchok',
  'kabhrepalanchok': 'Kavrepalanchok',
}

export function matchNepalLocation(addr = {}) {
  if (!addr) return null

  // 1. Resolve Province
  const provCandidates = [
    addr.state,
    addr.province,
    addr.region,
    addr['ISO3166-2-lvl4'],
  ].filter(Boolean)

  let matchedProvince = ''
  for (const raw of provCandidates) {
    const s = String(raw).trim().toLowerCase()
    if (s.includes('np-p1') || s.includes('koshi') || s === '1' || s.includes('province 1')) {
      matchedProvince = 'Koshi Province'
      break
    } else if (s.includes('np-p2') || s.includes('madhesh') || s === '2' || s.includes('province 2')) {
      matchedProvince = 'Madhesh Province'
      break
    } else if (s.includes('np-p3') || s.includes('bagmati') || s === '3' || s.includes('province 3')) {
      matchedProvince = 'Bagmati Province'
      break
    } else if (s.includes('np-p4') || s.includes('gandaki') || s === '4' || s.includes('province 4')) {
      matchedProvince = 'Gandaki Province'
      break
    } else if (s.includes('np-p5') || s.includes('lumbini') || s === '5' || s.includes('province 5')) {
      matchedProvince = 'Lumbini Province'
      break
    } else if (s.includes('np-p6') || s.includes('karnali') || s === '6' || s.includes('province 6')) {
      matchedProvince = 'Karnali Province'
      break
    } else if (s.includes('np-p7') || s.includes('sudurpashchim') || s.includes('sudurpaschim') || s === '7' || s.includes('province 7')) {
      matchedProvince = 'Sudurpashchim Province'
      break
    }
  }

  // 2. Resolve District
  const distCandidates = [
    addr.county,
    addr.district,
    addr.state_district,
    addr.subregion,
  ].filter(Boolean)

  let matchedDistrict = ''
  const allDistricts = Object.keys(NEPAL_MUNICIPALITIES)

  for (const raw of distCandidates) {
    const clean = String(raw).trim().toLowerCase().replace(/ district$/i, '')
    const alias = DISTRICT_ALIAS_MAP[clean] || clean
    const found = allDistricts.find(d => d.toLowerCase() === alias.toLowerCase() || d.toLowerCase() === clean)
    if (found) {
      matchedDistrict = found
      break
    }
  }

  if (!matchedDistrict) {
    for (const raw of distCandidates) {
      const clean = String(raw).trim().toLowerCase()
      const found = allDistricts.find(d => clean.includes(d.toLowerCase()) || d.toLowerCase().includes(clean))
      if (found) {
        matchedDistrict = found
        break
      }
    }
  }

  // If district found, check province
  if (matchedDistrict && !matchedProvince) {
    for (const [prov, dists] of Object.entries(NEPAL_DISTRICTS)) {
      if (dists.some(d => d.toLowerCase() === matchedDistrict.toLowerCase())) {
        matchedProvince = prov
        break
      }
    }
  }

  if (!matchedProvince) {
    matchedProvince = 'Bagmati Province'
  }

  const validDistricts = getDistrictsForProvince(matchedProvince)
  if (matchedDistrict && !validDistricts.includes(matchedDistrict)) {
    const inProv = validDistricts.find(d => d.toLowerCase() === matchedDistrict.toLowerCase())
    matchedDistrict = inProv || validDistricts[0] || ''
  } else if (!matchedDistrict) {
    matchedDistrict = validDistricts[0] || ''
  }

  // 3. Resolve Municipality
  const muniCandidates = [
    addr.municipality,
    addr.city,
    addr.town,
    addr.village,
    addr.suburb,
    addr.hamlet,
    addr.city_district,
  ].filter(Boolean)

  const availableMunis = getMunicipalitiesForDistrict(matchedDistrict, matchedProvince)
  let matchedMuni = ''

  for (const raw of muniCandidates) {
    const clean = String(raw).trim().toLowerCase()
      .replace(/[-\s]*\d+$/, '')
      .replace(/\s+(rural municipality|municipality|metropolitan city|sub-metropolitan city|gaunpalika|nagarpalika)$/i, '')
      .trim()

    // Exact name match
    const exact = availableMunis.find(m => m.name.toLowerCase() === clean || m.name.toLowerCase().replace(/\s+(rural municipality|municipality|metropolitan city|sub-metropolitan city)$/i, '') === clean)
    if (exact) {
      matchedMuni = exact.name
      break
    }

    // Includes match
    const incl = availableMunis.find(m => m.name.toLowerCase().includes(clean) || clean.includes(m.name.toLowerCase()))
    if (incl) {
      matchedMuni = incl.name
      break
    }
  }

  if (!matchedMuni && availableMunis.length > 0) {
    matchedMuni = availableMunis[0].name
  }

  // 4. Street / Ward Address
  const streetParts = [
    addr.city_district,
    addr.road,
    addr.neighbourhood,
    addr.suburb,
    addr.hamlet,
    addr.village,
  ].filter(Boolean).map(s => String(s).trim())

  const uniqueParts = [...new Set(streetParts)].filter(Boolean)
  const streetAddress = uniqueParts.join(', ')

  return {
    province: matchedProvince,
    district: matchedDistrict,
    municipality: matchedMuni,
    street: streetAddress,
  }
}

export function reverseGeocodeLocal(lat, lng) {
  if (!lat || !lng) return null
  const latN = Number(lat)
  const lngN = Number(lng)
  if (isNaN(latN) || isNaN(lngN)) return null

  let best = null
  let bestDist = Infinity
  for (const [name, coords] of Object.entries(CITY_COORDS)) {
    const dist = Math.sqrt(Math.pow(latN - coords.lat, 2) + Math.pow(lngN - coords.lng, 2))
    if (dist < bestDist) {
      bestDist = dist
      best = { city: name, ...coords }
    }
  }
  if (!best) return null
  return {
    province: best.province,
    district: best.district,
    municipality: best.city,
    street: best.city,
  }
}