(function() {
  const names = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Christopher", "Karen", "Charles", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley", "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle", "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa", "Edward", "Deborah"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"];
  const cities = ["Los Angeles, CA", "Houston, TX", "Chicago, IL", "Toronto, ON", "New York, NY", "Vancouver, BC", "Miami, FL", "Phoenix, AZ", "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA", "Austin, TX", "Jacksonville, FL", "Fort Worth, TX", "Columbus, OH", "Charlotte, NC", "San Francisco, CA", "Indianapolis, IN", "Seattle, WA", "Denver, CO", "Washington, DC", "Boston, MA", "El Paso, TX", "Nashville, TN", "Detroit, MI", "Oklahoma City, OK", "Portland, OR", "Las Vegas, NV", "Memphis, TN", "Louisville, KY", "Baltimore, MD", "Milwaukee, WI", "Albuquerque, NM", "Tucson, AZ", "Fresno, CA", "Sacramento, CA", "Mesa, AZ", "Kansas City, MO", "Atlanta, GA", "Long Beach, CA", "Colorado Springs, CO", "Raleigh, NC", "Virginia Beach, VA", "Omaha, NE", "Miami, FL", "Oakland, CA", "Minneapolis, MN", "Tulsa, OK"];
  const products = ["Pappy Van Winkle 20 Year", "Hibiki 35 Year", "Macallan 18 Year", "Yamazaki 25 Year", "Blanton's Original", "Hennessy XO", "Louis XIII", "Eagle Rare 10 Year", "Buffalo Trace", "Hibiki Harmony", "Macallan 12 Year", "Yamazaki 18 Year", "Redbreast 12 Year", "Knob Creek 9 Year", "Bulleit Bourbon", "Jack Daniel's Single Barrel", "Glenfiddich 18 Year", "Lagavulin 16 Year", "The Balvenie 21 Year", "Ardbeg 25 Year", "Suntory Toki", "Michter's 20 Year", "Old Rip Van Winkle", "George T. Stagg", "William Larue Weller"];
  const templates = [
    "Caskworth is the only place I trust for my collection. The {product} arrived perfectly authenticated.",
    "Fast delivery and great selection. I was looking for {product} everywhere and finally found it at Caskworth.",
    "Caskworth is a game changer. Same-day delivery to {city} for bottles like {product} is unmatched.",
    "Professional, knowledgeable, and reliable. The {product} is a masterpiece. Thank you!",
    "Best online spirits retailer. The packaging for the {product} was bulletproof and discreet.",
    "Superb communication from the team. They confirmed my order for {product} within minutes.",
    "A bit of a wait on the tracking but the delivery was actually faster than promised! {product} is perfect.",
    "Great price for {product}. The delivery to {city} was smooth and professional.",
    "Luxury service for luxury whisky. I've ordered {product} multiple times and Caskworth always delivers.",
    "Excellent selection of allocated bottles. Finding {product} in stock was a pleasant surprise.",
    "The expertise of the staff is evident. They helped me choose {product} for a gift and it was perfect.",
    "Highly efficient and trustworthy. Same-day delivery in {city} makes all the difference for events.",
    "Authenticity is everything and Caskworth provides the peace of mind I need when buying {product}.",
    "From order to glass in less than 4 hours. Caskworth is the gold standard for premium delivery.",
    "Fantastic experience. The {product} is a great addition to my home bar. Fast shipping to {city}.",
    "Top-tier service. The {product} was packed with extreme care. Highly recommended.",
    "Caskworth always has the rare stuff. Picked up {product} and the experience was flawless.",
    "I was skeptical about same-day delivery but they actually did it. {product} arrived right on time.",
    "Great customer support. They answered all my questions about {product} before I purchased.",
    "Solid selection and competitive pricing for {product}. The delivery was painless.",
    "Impressive logistics. The {product} arrived in {city} faster than I expected. Great quality.",
    "If you want rare bottles like {product}, Caskworth is the destination. No questions asked.",
    "Perfect gift for my husband. He loved the {product} and the presentation was top-notch.",
    "Reliable and fast. Found {product} at a reasonable price and it was at my door in {city} quickly.",
    "Outstanding curation. The {product} is exactly as described. Caskworth never misses.",
    "Five stars for the {product} and the service. Caskworth is my new go-to for spirits."
  ];

  function generateDate() {
    const start = new Date(2023, 0, 1); // Start of 2023
    const end = new Date(); // Today
    const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return d.toISOString().split('T')[0];
  }

  function generateRating() {
    // Rating from 4.2 to 4.9
    return (4.2 + Math.random() * 0.7).toFixed(1);
  }

  function generateReview(i) {
    const name = names[Math.floor(Math.random() * names.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const text = template.replace('{product}', product).replace('{city}', city);
    const initials = (name[0] + lastName[0]).toUpperCase();
    const isCA = city.includes(', ON') || city.includes(', BC') || city.includes(', QC') || city.includes(', AB') || city.includes(', MB') || city.includes(', SK') || city.includes(', NS');
    
    return {
      id: i,
      name: name + ' ' + lastName,
      initials: initials,
      location: city,
      product: product,
      text: '"' + text + '"',
      rating: generateRating(),
      date: generateDate(),
      country: isCA ? 'CA' : 'US'
    };
  }

  const allReviews = [];
  for (let i = 0; i < 4713; i++) {
    allReviews.push(generateReview(i));
  }

  window.CASKWORTH_REVIEWS = allReviews;
})();
