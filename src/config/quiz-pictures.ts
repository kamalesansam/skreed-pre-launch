// Section 3's answer pictures (Sam, 2026-10-20: "for any question that is visual, open envato and pick pictures relating
// to that specific option ... that image should appear only when u hover over that option"). One stock photograph per
// answer of the five visual questions, licensed from Envato Elements to Sam's account on 2026-10-20 (lifetime commercial
// licence, licensed at download). The files are not in this repository: the licence allows them in the built site, not
// shared as files, and the repository is public. They live in src/assets/quiz/pics/<key>.jpg on the build machine (git
// ignores that folder); Quiz.astro renders the picture where the file exists and words only where it does not.
// key: q<question index>-<personality>, as QUIZ_QUESTIONS and the personality ids in config/quiz.ts.

export interface QuizPicture { key: string; title: string; author: string; envatoId: string }

export const QUIZ_PICTURES: readonly QuizPicture[] = [
  { key: "q0-curator", title: "Woman Listens to Music at Rainy Window", author: "coolhand1180", envatoId: "1be37d95-1668-4e45-a7c9-bd8231fcb610" },
  { key: "q0-dreamer", title: "Man Reading Book in Cozy Bookstore", author: "morrowlight", envatoId: "dc856b89-736c-4696-9a46-9072dfe17c7c" },
  { key: "q0-main", title: "Live concert in Milan - crowd", author: "Laboostock", envatoId: "9675df12-eafb-4d26-b319-131435e4bb4f" },
  { key: "q0-optimist", title: "Friends Gathered Around Beach Bonfire at Night", author: "dotshock", envatoId: "9ef828e0-a0d7-44fe-be33-5cd9c9465fc1" },
  { key: "q0-rebel", title: "Woman Enjoys Road Trip Leaning out Car Window", author: "gstockstudio", envatoId: "4d0963f1-7b9e-45d4-9448-0c0a2c51820a" },
  { key: "q0-spark", title: "Young Adults Toasting with Drinks on a Rooftop", author: "Impactphotography", envatoId: "eff84b85-50a6-4581-ab43-cbdbfcb88c8c" },
  { key: "q0-strategist", title: "Morning Coffee and Journal on Wooden Table", author: "Wavebreakmedia", envatoId: "8c62edf6-6f17-4de8-b6f6-c64f9e3e7624" },
  { key: "q2-curator", title: "Vineyard with Rolling Green Hills in Countryside (tags: Chianti, Toscana, Tuscany)", author: "Jasmina_K", envatoId: "c0500b2b-e09f-4658-9209-d903ed9257b8" },
  { key: "q2-dreamer", title: "Sunset with white churches an blue domes by the ocean of Oia Santorini Greece", author: "fokkebok", envatoId: "6ebdfac4-cab7-4039-bd08-e7f583b57f93" },
  { key: "q2-main", title: "The Vegas Strip", author: "Image-Source", envatoId: "e8d273ed-248d-48d7-99f5-b76851e43397" },
  { key: "q2-optimist", title: "Woman Relaxing in Hammock, Tropical Getaway (tags: Bali)", author: "larraend", envatoId: "29a074ef-9dd1-4e92-9d55-3f70a85865cd" },
  { key: "q2-rebel", title: "couple men an woman honeymoon Paris Eiffel tower, couple men and woman city trip in Paris", author: "fokkebok", envatoId: "c9012719-f6bd-4800-b0ee-0d19200dd71d" },
  { key: "q2-spark", title: "Spectators cheering up at the Rio de Janeiro Carnaval at the Sambodrome", author: "vinnikava", envatoId: "4aa43adb-4579-4118-a70c-a49c8c532be4" },
  { key: "q2-strategist", title: "Tranquil Lake Reflecting Swiss Chateau at Sunrise", author: "ADDICTIVE_STOCK", envatoId: "e505f0d4-1653-4a9c-8975-6331f43785bd" },
  { key: "q4-curator", title: "Blank Notepad on Wooden Desk with Plant", author: "filiaolga", envatoId: "cd96c98a-475d-452a-a795-2740e28843db" },
  { key: "q4-dreamer", title: "Creative woman painting at wooden desk indoors", author: "PaulSchlemmer", envatoId: "833368ce-73f7-468c-a83a-2498d8ab38ff" },
  { key: "q4-main", title: "Graphic Design Workspace with Color Swatches and Lamp", author: "denis257", envatoId: "bd43542e-31fb-46e0-993f-aaee51f4e601" },
  { key: "q4-optimist", title: "Photo Album on a White Desk Surface", author: "Angelov1", envatoId: "c3c7ef7c-09f8-4ab3-95ad-eae32d92764c" },
  { key: "q4-rebel", title: "Desk with Keyboard, Mouse, Plant, Notebooks in Pink", author: "LightFieldStudios", envatoId: "a35b1209-8a7b-45df-9adf-7e5e0f6eaf07" },
  { key: "q4-spark", title: "Desk with Laptop and School Supplies in Bedroom", author: "seventyfourimages", envatoId: "f35e1cc6-2de7-4715-96b5-10d63e2bb1f6" },
  { key: "q4-strategist", title: "Office Supplies on White Wood Table", author: "karandaev", envatoId: "923a6079-dcb4-41ec-8421-5172b2299a71" },
  { key: "q7-curator", title: "Cozy Bedroom Interior with Springtime Floral Arrangement", author: "LeylaCamomile", envatoId: "35b2f133-69fa-44aa-beb8-908e32d42258" },
  { key: "q7-dreamer", title: "Cozy Bedroom Interior with Neutral Tones", author: "seventyfourimages", envatoId: "89d46583-8034-4a3f-9154-917796988005" },
  { key: "q7-main", title: "Comfortable Bedroom with Four Poster Bed and Seating", author: "Mint_Images", envatoId: "15a9485b-acb7-4941-95c1-9d27cb3cada8" },
  { key: "q7-optimist", title: "Elegant Bedroom with White Walls and Terracotta Floors", author: "wirestock", envatoId: "698cdb83-82bd-4bb1-93f8-31ad1223e8bf" },
  { key: "q7-rebel", title: "Elegant Pink Envelope and Roses on White Fabric", author: "aksenovko", envatoId: "1933e51e-3ee2-49d4-97fe-144f2127e635" },
  { key: "q7-spark", title: "Vintage Record Player With Records and Decorative Plants", author: "africaimages", envatoId: "2d961bb9-d3a8-4448-b6c0-6adfb39a6d0c" },
  { key: "q7-strategist", title: "Breakfast Tray with Coffee and Seashells on Bed", author: "nikki_meel", envatoId: "a7579e63-88b0-48fd-bd19-02822d175ca7" },
  { key: "q8-curator", title: "Professional Young Woman in Beige Suit Posing Against White Wall", author: "africaimages", envatoId: "cd606dfc-5281-4458-8023-a22887b154c7" },
  { key: "q8-dreamer", title: "Elegant Woman Leaning Against Old-Fashioned Train Car", author: "svetlaya_83", envatoId: "c914a512-a840-4c44-a2e2-b1aeaee441ca" },
  { key: "q8-main", title: "Stylish Woman Poses with Drink in Red Dress", author: "look_studio", envatoId: "6dc9b901-e411-4ba9-8eee-51379eaf7328" },
  { key: "q8-optimist", title: "Woman Holding Woven Bag Wearing a Light Blue Dress", author: "Haritanita", envatoId: "ed818bfa-0842-4558-9db0-01d24e162cc6" },
  { key: "q8-rebel", title: "Young Woman Strikes Pose with Gift Shopping Bag", author: "LightFieldStudios", envatoId: "46c7db06-7f3b-420e-86c0-c483c17d2b50" },
  { key: "q8-spark", title: "Stylish Woman Posing on Pink Roller Skates Outdoors", author: "africaimages", envatoId: "5de49293-018e-46cd-b957-68794dcd3b21" },
  { key: "q8-strategist", title: "Stylish Man Posing in White Shirt and Sunglasses", author: "halayalex", envatoId: "14a43548-1a67-44b6-88e3-3b09670fa49c" },
];
