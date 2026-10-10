export const initialData = {
  canteens: [
    {
      id: "canteen-1",
      name: "Canteen 1 (Main Food Court)",
      code: "C1",
      location: "Ground Floor, Student Amenities Complex",
      timings: "07:30 AM - 09:30 PM",
      status: "open",
      crowdLevel: "Moderate", // "Low", "Moderate", "Busy", "Rush Hour"
      avgWaitTimeMinutes: 10,
      activeOrdersCount: 5,
      counterSpeed: "Normal"
    },
    {
      id: "canteen-2",
      name: "Canteen 2 (North Campus Quick Bites)",
      code: "C2",
      location: "North Campus, Near Indoor Sports Complex",
      timings: "09:00 AM - 10:30 PM",
      status: "open",
      crowdLevel: "Low",
      avgWaitTimeMinutes: 5,
      activeOrdersCount: 2,
      counterSpeed: "Fast"
    }
  ],
  menuItems: [
    // Canteen 1 Items
    {
      id: "m1",
      canteenId: "canteen-1",
      name: "Chicken Biryani",
      description: "Fragrant basmati rice cooked with tender spiced chicken, served with raita and salan.",
      category: "Meals",
      price: 130,
      prepTimeMinutes: 4,
      stock: 14,
      isVeg: false,
      popular: true,
      imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "m2",
      canteenId: "canteen-1",
      name: "Paneer Butter Masala + 2 Parottas",
      description: "Rich creamy tomato gravy with soft cottage cheese cubes & 2 flaky Kerala parottas.",
      category: "Meals",
      price: 110,
      prepTimeMinutes: 6,
      stock: 8,
      isVeg: true,
      popular: true,
      imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "m3",
      canteenId: "canteen-1",
      name: "Crispy Masala Dosa",
      description: "Golden crispy crepe stuffed with tempered potato mash, served with coconut chutney and sambar.",
      category: "Breakfast",
      price: 50,
      prepTimeMinutes: 5,
      stock: 12,
      isVeg: true,
      popular: true,
      imageUrl: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "m4",
      canteenId: "canteen-1",
      name: "Crispy Samosa (2 pcs)",
      description: "Flaky pastry stuffed with spiced potatoes, green peas and whole coriander, with mint chutney.",
      category: "Snacks",
      price: 30,
      prepTimeMinutes: 1,
      stock: 20,
      isVeg: true,
      popular: false,
      imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "m5",
      canteenId: "canteen-1",
      name: "Gobi Manchurian Dry",
      description: "Crispy fried cauliflower florets tossed in zesty Indo-Chinese spicy soy garlic sauce.",
      category: "Snacks",
      price: 70,
      prepTimeMinutes: 7,
      stock: 0, // Out of stock to test "Notify Me" feature from Slide 4!
      isVeg: true,
      popular: true,
      imageUrl: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "m6",
      canteenId: "canteen-1",
      name: "Cold Coffee Shake",
      description: "Rich chilled espresso blended with vanilla cream and chocolate drizzle.",
      category: "Beverages",
      price: 45,
      prepTimeMinutes: 2,
      stock: 25,
      isVeg: true,
      popular: true,
      imageUrl: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "m7",
      canteenId: "canteen-1",
      name: "Hot Ginger Masala Chai",
      description: "Freshly brewed full-cream milk tea infused with crushed ginger and aromatic cardamom.",
      category: "Beverages",
      price: 15,
      prepTimeMinutes: 2,
      stock: 35,
      isVeg: true,
      popular: false,
      imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "m8",
      canteenId: "canteen-1",
      name: "Veg Schezwan Fried Rice",
      description: "Wok-tossed rice with crunchy vegetables and fiery house-made schezwan sauce.",
      category: "Meals",
      price: 85,
      prepTimeMinutes: 6,
      stock: 11,
      isVeg: true,
      popular: false,
      imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&auto=format&fit=crop&q=80"
    },

    // Canteen 2 Items
    {
      id: "m9",
      canteenId: "canteen-2",
      name: "Grilled Three-Cheese Sandwich",
      description: "Toasted sourdough loaded with melted cheddar, mozzarella, and herb butter.",
      category: "Snacks",
      price: 65,
      prepTimeMinutes: 4,
      stock: 15,
      isVeg: true,
      popular: true,
      imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "m10",
      canteenId: "canteen-2",
      name: "Peri Peri Crispy Fries",
      description: "Golden crinkle-cut potato fries dusted with tangy African bird's eye chili seasoning.",
      category: "Snacks",
      price: 55,
      prepTimeMinutes: 4,
      stock: 18,
      isVeg: true,
      popular: true,
      imageUrl: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "m11",
      canteenId: "canteen-2",
      name: "Crispy Chicken Zinger Roll",
      description: "Juicy fried chicken tender wrapped in warm tortilla with jalapeno mayo and lettuce.",
      category: "Snacks",
      price: 95,
      prepTimeMinutes: 5,
      stock: 9,
      isVeg: false,
      popular: true,
      imageUrl: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "m12",
      canteenId: "canteen-2",
      name: "Cheese & Veggie Maggi",
      description: "Double 2-minute noodles cooked with sweet corn, capsicum, spices and melted cheese slice.",
      category: "Snacks",
      price: 50,
      prepTimeMinutes: 4,
      stock: 22,
      isVeg: true,
      popular: true,
      imageUrl: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "m13",
      canteenId: "canteen-2",
      name: "Rich Belgian Chocolate Milkshake",
      description: "Decadent dark chocolate ganache whipped with fresh milk and cocoa shavings.",
      category: "Beverages",
      price: 65,
      prepTimeMinutes: 3,
      stock: 0, // Out of stock for testing Notify Me in Canteen 2!
      isVeg: true,
      popular: true,
      imageUrl: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "m14",
      canteenId: "canteen-2",
      name: "Fresh Mint Lime Soda",
      description: "Sparkling soda with freshly pressed lime, bruised mint leaves, and rock salt.",
      category: "Beverages",
      price: 30,
      prepTimeMinutes: 2,
      stock: 30,
      isVeg: true,
      popular: false,
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80"
    }
  ],
  orders: [
    // Pre-seeded live queue matching Slide 8 exactly!
    {
      id: "ord-101",
      token: "C1-043",
      canteenId: "canteen-1",
      canteenName: "Canteen 1",
      studentName: "Rahul Sharma",
      studentRoll: "CS23B104",
      items: [
        { id: "m1", name: "Chicken Biryani", quantity: 1, price: 130, prepTimeMinutes: 4 },
        { id: "m7", name: "Hot Ginger Masala Chai", quantity: 1, price: 15, prepTimeMinutes: 2 }
      ],
      totalAmount: 145,
      paymentMethod: "Wallet",
      paymentStatus: "paid",
      status: "serving", // "received", "cooking", "ready", "serving", "collected", "cancelled"
      estimatedWaitMinutes: 0,
      createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      qrCodeData: "CAMPUS_HUB_C1_043_SECRET"
    },
    {
      id: "ord-102",
      token: "C1-044",
      canteenId: "canteen-1",
      canteenName: "Canteen 1",
      studentName: "Ananya Menon",
      studentRoll: "EC23B045",
      items: [
        { id: "m3", name: "Crispy Masala Dosa", quantity: 2, price: 50, prepTimeMinutes: 5 }
      ],
      totalAmount: 100,
      paymentMethod: "UPI",
      paymentStatus: "paid",
      status: "ready",
      estimatedWaitMinutes: 1,
      createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
      qrCodeData: "CAMPUS_HUB_C1_044_SECRET"
    },
    {
      id: "ord-103",
      token: "C1-045",
      canteenId: "canteen-1",
      canteenName: "Canteen 1",
      studentName: "Vikram Kumar",
      studentRoll: "ME22B088",
      items: [
        { id: "m8", name: "Veg Schezwan Fried Rice", quantity: 1, price: 85, prepTimeMinutes: 6 },
        { id: "m6", name: "Cold Coffee Shake", quantity: 1, price: 45, prepTimeMinutes: 2 }
      ],
      totalAmount: 130,
      paymentMethod: "UPI",
      paymentStatus: "paid",
      status: "cooking",
      estimatedWaitMinutes: 4,
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      qrCodeData: "CAMPUS_HUB_C1_045_SECRET"
    },
    {
      id: "ord-104",
      token: "C1-046",
      canteenId: "canteen-1",
      canteenName: "Canteen 1",
      studentName: "Pooja Reddy",
      studentRoll: "BT24B012",
      items: [
        { id: "m2", name: "Paneer Butter Masala + 2 Parottas", quantity: 1, price: 110, prepTimeMinutes: 6 }
      ],
      totalAmount: 110,
      paymentMethod: "Wallet",
      paymentStatus: "paid",
      status: "cooking",
      estimatedWaitMinutes: 6,
      createdAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
      qrCodeData: "CAMPUS_HUB_C1_046_SECRET"
    },
    {
      id: "ord-105",
      token: "C1-047",
      canteenId: "canteen-1",
      canteenName: "Canteen 1",
      studentName: "You (Karthik)",
      studentRoll: "CS24B001",
      isCurrentUser: true,
      items: [
        { id: "m4", name: "Crispy Samosa (2 pcs)", quantity: 1, price: 30, prepTimeMinutes: 1 },
        { id: "m6", name: "Cold Coffee Shake", quantity: 1, price: 45, prepTimeMinutes: 2 }
      ],
      totalAmount: 75,
      paymentMethod: "Wallet",
      paymentStatus: "paid",
      status: "cooking",
      estimatedWaitMinutes: 8, // "~8 min, 4 orders ahead" matching Slide 8!
      createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      qrCodeData: "CAMPUS_HUB_C1_047_TOKEN"
    }
  ],
  wallet: {
    studentId: "student-current",
    studentName: "Karthik (Student)",
    balance: 425,
    transactions: [
      { id: "tx-1", type: "credit", amount: 500, description: "Wallet Top-up via UPI", timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString() },
      { id: "tx-2", type: "debit", amount: 75, description: "Prepaid Food Order #C1-047", timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString() }
    ]
  },
  campusLocations: [
    {
      id: "loc-1",
      name: "Canteen 1 (Main Food Court)",
      category: "Food & Dining",
      zone: "Central Zone",
      building: "Student Amenities Complex",
      floor: "Ground Floor",
      timings: "07:30 AM - 09:30 PM",
      description: "Main campus dining facility with 200+ seating capacity, South Indian meals, Biryani, Dosa counters and hot beverages.",
      lat: 13.0105,
      lng: 80.2348,
      address: "Ground Floor, Student Amenities Complex, Central Campus",
      coordinates: { x: 42, y: 55, lat: 13.0105, lng: 80.2348 },
      popularTimes: "Rush during 12:30 PM - 02:00 PM and 05:00 PM - 06:30 PM",
      contact: "Extension 2401",
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "loc-2",
      name: "Canteen 2 (North Quick Bites)",
      category: "Food & Dining",
      zone: "North Zone",
      building: "Recreation Hub Block C",
      floor: "Ground Floor",
      timings: "09:00 AM - 10:30 PM",
      description: "Quick snacks, burgers, grilled sandwiches, shakes, and Maggi counter adjacent to the sports ground.",
      lat: 13.0138,
      lng: 80.2355,
      address: "Recreation Hub Block C, North Campus Sports Complex",
      coordinates: { x: 70, y: 22, lat: 13.0138, lng: 80.2355 },
      popularTimes: "Peak crowd post 5:00 PM sports sessions and late evening study breaks",
      contact: "Extension 2402",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "loc-3",
      name: "Campus Print, Xerox & Stationery Hub",
      category: "Academic Store",
      zone: "Central Zone",
      building: "Academic Block A",
      floor: "Ground Floor, Room 102",
      timings: "08:30 AM - 07:00 PM",
      description: "High-speed document printing, thesis binding, engineering drawing sheets, project stationeries, and lamination.",
      lat: 13.0095,
      lng: 80.2338,
      address: "Academic Block A, Ground Floor, Room 102",
      coordinates: { x: 35, y: 40, lat: 13.0095, lng: 80.2338 },
      popularTimes: "Busiest between 08:30 AM - 09:30 AM (before morning assignment submissions)",
      contact: "xerox@campus.edu",
      image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "loc-4",
      name: "University Bookstore & Merch Corner",
      category: "Retail Store",
      zone: "Central Zone",
      building: "Student Center",
      floor: "1st Floor",
      timings: "09:00 AM - 06:00 PM",
      description: "Prescribed engineering & sciences textbooks, lab record notebooks, university hoodies, badges, and tech accessories.",
      lat: 13.0112,
      lng: 80.2331,
      address: "Student Center, 1st Floor, Campus Arcade",
      coordinates: { x: 48, y: 58, lat: 13.0112, lng: 80.2331 },
      popularTimes: "Beginning of semester book distributions",
      contact: "bookstore@campus.edu",
      image: "https://images.unsplash.com/photo-1507842229456-7f985a1ef4c2?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "loc-5",
      name: "Central Library & Digital Knowledge Hub",
      category: "Facilities",
      zone: "West Zone",
      building: "Knowledge Tower",
      floor: "Floors 1 to 4",
      timings: "08:00 AM - 11:00 PM",
      description: "Air-conditioned quiet study zones, 50,000+ reference volumes, IEEE digital access lab, and group discussion rooms.",
      lat: 13.0099,
      lng: 80.2319,
      address: "Knowledge Tower, West Campus Boulevard",
      coordinates: { x: 20, y: 50, lat: 13.0099, lng: 80.2319 },
      popularTimes: "Active all day, high occupancy during examination periods",
      contact: "library@campus.edu",
      image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "loc-6",
      name: "Student Health Center & Infirmary",
      category: "Medical & Health",
      zone: "East Zone",
      building: "Medical Care Wing Block D",
      floor: "Ground Floor",
      timings: "24 Hours / 7 Days",
      description: "Full-time resident medical officer, emergency first aid, ambulance on standby, and essential medications dispensing.",
      lat: 13.0086,
      lng: 80.2356,
      address: "Medical Care Wing Block D, East Campus Road",
      coordinates: { x: 80, y: 65, lat: 13.0086, lng: 80.2356 },
      popularTimes: "Doctor consulting hours: 10:00 AM - 1:00 PM & 4:30 PM - 7:30 PM",
      contact: "Emergency: 108 / Ext 1111",
      image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "loc-7",
      name: "Indoor Sports Arena & Gymnasium",
      category: "Sports & Recreation",
      zone: "North Zone",
      building: "Athletic Pavilion",
      floor: "Ground Floor",
      timings: "06:00 AM - 09:30 AM & 04:30 PM - 09:00 PM",
      description: "Badminton courts, table tennis hall, cardio & weight training facility, squash court, and locker rooms.",
      lat: 13.0146,
      lng: 80.2369,
      address: "Athletic Pavilion, North Campus Grounds",
      coordinates: { x: 75, y: 15, lat: 13.0146, lng: 80.2369 },
      popularTimes: "Evening sessions 05:00 PM - 08:00 PM",
      contact: "sports@campus.edu",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "loc-8",
      name: "Administrative Block & Dean's Office",
      category: "Administration",
      zone: "South Zone",
      building: "Senate House",
      floor: "Floors 1 & 2",
      timings: "09:00 AM - 05:00 PM (Mon-Fri)",
      description: "Student admissions, fee counters, registrar office, scholarship desk, and academic certificates collection.",
      lat: 13.0076,
      lng: 80.2328,
      address: "Senate House, South Campus Administrative Plaza",
      coordinates: { x: 50, y: 85, lat: 13.0076, lng: 80.2328 },
      popularTimes: "Fee payment deadlines & semester registration days",
      contact: "admin@campus.edu",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "loc-9",
      name: "Tech Cafe & Innovation Hub",
      category: "Food & Dining",
      zone: "Central Zone",
      building: "Computer Science Block B",
      floor: "Ground Floor",
      timings: "08:00 AM - 08:00 PM",
      description: "Specialty brew coffee, quick grab-and-go rolls, laptop workstations with high-speed charging outlets.",
      lat: 13.0122,
      lng: 80.2342,
      address: "Computer Science Block B, Tech Quad",
      coordinates: { x: 58, y: 35, lat: 13.0122, lng: 80.2342 },
      popularTimes: "Afternoon coding lab hours",
      contact: "techcafe@campus.edu",
      image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "loc-10",
      name: "Main Campus Gate & Visitor Plaza",
      category: "Facilities",
      zone: "South Zone",
      building: "Campus Entrance Arch",
      floor: "Ground",
      timings: "24 Hours / 7 Days",
      description: "Main campus entrance checkpoint, visitor registration pass office, and shuttle bus boarding stop.",
      lat: 13.0068,
      lng: 80.2315,
      address: "Campus Main Gate Highway Entrance",
      coordinates: { x: 30, y: 92, lat: 13.0068, lng: 80.2315 },
      popularTimes: "Morning 08:00 AM arrival & Evening 05:30 PM dispersal",
      contact: "Security: 100 / Ext 1000",
      image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=500&auto=format&fit=crop&q=80"
    }
  ],
  lostAndFound: [
    {
      id: "lf-1",
      title: "Titan Neo Blue Dial Quartz Watch",
      type: "found", // "lost" or "found"
      category: "Accessories",
      location: "Central Library, 2nd Floor Study Cubicle 14",
      date: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      description: "Silver stainless steel strap with metallic blue dial. In pristine working condition. Handed over to library security desk.",
      reportedBy: "Sanjay M. (Library Staff)",
      contactInfo: "library-lostfound@campus.edu",
      status: "open", // "open", "claimed", "verified_returned"
      imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500&auto=format&fit=crop&q=80",
      claims: [
        {
          id: "claim-101",
          claimantName: "Arjun Verma",
          claimantRoll: "EE23B019",
          claimantPhone: "9876543210",
          proofDetails: "Has a tiny scratch near the 4 o'clock marker; I have the purchase warranty card on my phone.",
          date: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
          status: "pending" // "pending", "approved", "rejected"
        }
      ]
    },
    {
      id: "lf-2",
      title: "Casio FX-991EX ClassWiz Scientific Calculator",
      type: "found",
      category: "Electronics",
      location: "Academic Block A, Lecture Hall 204",
      date: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      description: "Black casing with sliding cover. Small silver sticker with initials 'K.V.' on the backside.",
      reportedBy: "Prof. Narayanan",
      contactInfo: "narayanan@campus.edu",
      status: "open",
      imageUrl: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=500&auto=format&fit=crop&q=80",
      claims: []
    },
    {
      id: "lf-3",
      title: "Official Campus ID Card & Lanyard",
      type: "found",
      category: "Documents",
      location: "Canteen 1, Table #12 near Juice Counter",
      date: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      description: "Blue RFID student smart card issued to Department of Mechanical Engineering (Batch 2024-2028).",
      reportedBy: "Canteen 1 Counter Staff",
      contactInfo: "canteen1@campus.edu",
      status: "open",
      imageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80",
      claims: []
    },
    {
      id: "lf-4",
      title: "Lenovo 65W USB-C Laptop Fast Charger",
      type: "lost",
      category: "Electronics",
      location: "Tech Cafe / Innovation Lab Charging Bench",
      date: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      description: "Black brick charger with yellow accent near the USB-C plug. Left on the charging bench during lunch hour.",
      reportedBy: "Sneha Patil (CS23B082)",
      contactInfo: "sneha.p@campus.edu / 9845123456",
      status: "open",
      imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&auto=format&fit=crop&q=80",
      claims: []
    },
    {
      id: "lf-5",
      title: "Decathlon Windproof Navy Blue Umbrella",
      type: "found",
      category: "Personal Belongings",
      location: "Auditorium Main Porch",
      date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      description: "Compact foldable navy umbrella with wrist strap. Left after rain during college orientation.",
      reportedBy: "Campus Security Post 2",
      contactInfo: "security@campus.edu",
      status: "verified_returned", // Successfully resolved
      imageUrl: "https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?w=500&auto=format&fit=crop&q=80",
      claims: [
        {
          id: "claim-098",
          claimantName: "Deepak Nair",
          claimantRoll: "ME23B044",
          claimantPhone: "9123456789",
          proofDetails: "Has Decathlon brand tag and broken tip button.",
          date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
          status: "approved"
        }
      ]
    }
  ],
  campusIssues: [
    // 5-Stage Life Cycle from Slide 5: Report -> Route -> Act -> Notify -> Resolve
    {
      id: "iss-1",
      ticketNumber: "ISS-2026-042",
      title: "Water Cooler Leaking and Not Chilling",
      category: "Water Cooler & Plumbing",
      location: "Academic Block B - 3rd Floor East Wing Corridor",
      description: "The drinking water cooler is continually overflowing onto the floor creating slip hazard, and the water is coming at ambient tap temperature.",
      priority: "Medium", // "Low", "Medium", "High", "Critical"
      status: "in_progress", // "reported", "routed", "in_progress", "resolved", "closed"
      currentStageIndex: 3, // 1: Report, 2: Route, 3: Act, 4: Notify, 5: Resolve
      reportedBy: "Karthik (CS24B001)",
      department: "Estate & Plumbing Facilities",
      assignedStaff: "Ramesh Kumar (Senior Plumber)",
      createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      timeline: [
        { stage: "Report", status: "reported", message: "Issue submitted by student with location marker and photo.", timestamp: new Date(Date.now() - 20 * 3600 * 1000).toISOString(), actor: "Karthik" },
        { stage: "Route", status: "routed", message: "Ticket routed automatically to Estate & Plumbing Maintenance team.", timestamp: new Date(Date.now() - 15 * 3600 * 1000).toISOString(), actor: "System Dispatcher" },
        { stage: "Act", status: "in_progress", message: "Staff assigned: Ramesh Kumar. Drainage blockage cleared; compressor refrigerant refill scheduled for 3 PM.", timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), actor: "Ramesh Kumar" }
      ],
      photoUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "iss-2",
      ticketNumber: "ISS-2026-043",
      title: "Wi-Fi Access Point Dropping Packets in Library Quiet Wing",
      category: "WiFi & IT Infrastructure",
      location: "Central Library - 2nd Floor Quiet Study Zone",
      description: "Signal is strong (AP-LIB-2F-03) but IP lease fails and DNS lookup times out intermittently for more than 40 students.",
      priority: "High",
      status: "routed",
      currentStageIndex: 2,
      reportedBy: "Priyanka S. (EC23B090)",
      department: "Campus IT Network Services",
      assignedStaff: "Campus IT Operations",
      createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      timeline: [
        { stage: "Report", status: "reported", message: "Issue submitted via Smart Campus Hub app.", timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString(), actor: "Priyanka S." },
        { stage: "Route", status: "routed", message: "Ticket acknowledged and assigned to Network Engineers queue.", timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(), actor: "IT Helpdesk" }
      ],
      photoUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "iss-3",
      ticketNumber: "ISS-2026-039",
      title: "Classroom 302 Ceiling Projector HDMI Distorted",
      category: "Classroom AV & Electronics",
      location: "Academic Block A - Room 302",
      description: "HDMI port on the lectern has a loose connection resulting in severe red tint and flickering during lectures.",
      priority: "High",
      status: "resolved",
      currentStageIndex: 5,
      reportedBy: "Dr. K. Swaminathan (Faculty)",
      department: "Audio-Visual Technical Team",
      assignedStaff: "Manoj V.",
      createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      timeline: [
        { stage: "Report", status: "reported", message: "Issue logged by Faculty.", timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString(), actor: "Dr. K. Swaminathan" },
        { stage: "Route", status: "routed", message: "Assigned to AV technician Manoj V.", timestamp: new Date(Date.now() - 60 * 3600 * 1000).toISOString(), actor: "Admin" },
        { stage: "Act", status: "in_progress", message: "Replaced faulty 10m high-speed HDMI wall trunking cable and verified projector 1080p sync.", timestamp: new Date(Date.now() - 30 * 3600 * 1000).toISOString(), actor: "Manoj V." },
        { stage: "Notify", status: "in_progress", message: "Student and staff notified of test completion.", timestamp: new Date(Date.now() - 26 * 3600 * 1000).toISOString(), actor: "System" },
        { stage: "Resolve", status: "resolved", message: "Hardware verified working by lecturer. Ticket closed.", timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), actor: "Admin" }
      ],
      photoUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&auto=format&fit=crop&q=80"
    },
    {
      id: "iss-4",
      ticketNumber: "ISS-2026-044",
      title: "Hand Sanitizer & Soap Dispenser Empty",
      category: "Sanitation & Hygiene",
      location: "Canteen 1 Washroom Area",
      description: "Soap dispensers next to washbasins are depleted during lunch peak hours.",
      priority: "Low",
      status: "reported",
      currentStageIndex: 1,
      reportedBy: "Anil T. (CS24B055)",
      department: "Housekeeping & Facility Care",
      assignedStaff: "Pending Assignment",
      createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      timeline: [
        { stage: "Report", status: "reported", message: "Issue submitted by student.", timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), actor: "Anil T." }
      ],
      photoUrl: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=500&auto=format&fit=crop&q=80"
    }
  ],
  stockNotifications: [
    {
      id: "sn-1",
      itemId: "m5",
      itemName: "Gobi Manchurian Dry",
      studentId: "student-current",
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      notified: false
    }
  ],
  notifications: [
    {
      id: "nt-1",
      title: "Order Live Status Update",
      message: "Order #C1-047 is cooking! Estimated wait ~8 min (4 orders ahead).",
      type: "order",
      timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      read: false
    },
    {
      id: "nt-2",
      title: "Campus Issue Routed",
      message: "Your reported water cooler issue (ISS-2026-042) was assigned to Ramesh Kumar.",
      type: "issue",
      timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      read: false
    }
  ]
};
